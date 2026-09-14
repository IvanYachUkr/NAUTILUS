#!/usr/bin/env python3
"""
Prepare a Europe-only OSV-5M reference dataset.

What this script does
---------------------
1. Downloads OSV-5M metadata (train.csv / test.csv) from Hugging Face.
2. Filters metadata to European countries.
3. Supports three modes: pipeline, download-only, and extract-only.
4. Extracts only images whose IDs occur in the Europe metadata.
5. Deletes each ZIP after successful extraction, so disk use is reclaimed.
6. Produces a compact metadata CSV suitable for later SALAD + FAISS indexing.

Important
---------
The official OSV-5M repository stores images in global ZIP shards rather than
country-specific archives. Therefore, obtaining every European image still
requires downloading the relevant global shards. The script avoids retaining
non-European images and avoids keeping all ZIPs on disk simultaneously.

Install:
    python -m pip install -U huggingface_hub pandas tqdm

Example:
    python prepare_osv5m_europe.py --root /path/to/SECOND_STORAGE/osv5m_europe

Metadata-only dry preparation:
    python prepare_osv5m_europe.py --root /path/to/SECOND_STORAGE/osv5m_europe --metadata-only

Resume:
    Just run the same command again. Completed shards are recorded and skipped.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import shutil
import sys
import zipfile
from concurrent.futures import Future, ThreadPoolExecutor
from pathlib import Path
from typing import Iterable

import pandas as pd
from huggingface_hub import hf_hub_download
from tqdm import tqdm


REPO_ID = "osv5m/osv5m"
REPO_TYPE = "dataset"

# Broad Europe definition for geolocation work.
# Edit this set if your thesis uses a narrower geographic definition.
EUROPE_ISO2 = {
    "AL", "AD", "AM", "AT", "AZ", "BY", "BE", "BA", "BG", "HR",
    "CY", "CZ", "DK", "EE", "FI", "FR", "GE", "DE", "GR", "HU",
    "IS", "IE", "IT", "KZ", "XK", "LV", "LI", "LT", "LU", "MT",
    "MD", "MC", "ME", "NL", "MK", "NO", "PL", "PT", "RO", "RU",
    "SM", "RS", "SK", "SI", "ES", "SE", "CH", "TR", "UA", "GB",
    "VA",
}

SHARD_COUNTS = {
    "train": 98,  # 00.zip ... 97.zip
    "test": 5,    # 00.zip ... 04.zip
}


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parent / "osv-5m_europe",
        help="Destination directory. Default: osv-5m_europe next to this script.",
    )
    p.add_argument(
        "--splits",
        nargs="+",
        choices=["train", "test"],
        default=["train", "test"],
        help="Dataset splits to prepare. Default: train test",
    )
    p.add_argument(
        "--metadata-only",
        action="store_true",
        help="Only download/filter metadata; do not download image ZIPs.",
    )
    p.add_argument(
        "--keep-zips",
        action="store_true",
        help="Deprecated compatibility flag. ZIPs are deleted after successful extraction.",
    )
    p.add_argument(
        "--chunk-size",
        type=int,
        default=250_000,
        help="CSV rows processed per chunk.",
    )
    p.add_argument(
        "--limit-shards",
        type=int,
        default=None,
        help="For testing only: process at most N shards per split.",
    )
    p.add_argument(
        "--prefetch",
        type=int,
        default=1,
        choices=[0, 1],
        help=(
            "Download the next ZIP while extracting the current ZIP. "
            "1 = enabled (default), 0 = sequential behavior."
        ),
    )
    p.add_argument(
        "--mode",
        choices=["pipeline", "download", "extract"],
        default="pipeline",
        help=(
            "pipeline: download next shard while extracting current shard; "
            "download: only download all missing ZIPs; "
            "extract: only extract local ZIPs and delete each after success."
        ),
    )
    p.add_argument(
        "--zip-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "osv-5m_zips",
        help="Persistent ZIP staging directory. Default: osv-5m_zips next to this script.",
    )
    return p.parse_args()


def ensure_dirs(root: Path) -> dict[str, Path]:
    root = root.expanduser().resolve()
    paths = {
        "root": root,
        "raw_metadata": root / "raw_metadata",
        "metadata": root / "metadata",
        "downloads": root / "_downloads",
        "images": root / "images",
        "state": root / "state",
    }
    for path in paths.values():
        path.mkdir(parents=True, exist_ok=True)
    return paths


def download_metadata(split: str, raw_metadata_dir: Path) -> Path:
    filename = f"{split}.csv"
    print(f"\n[metadata] Downloading/checking {filename} ...")
    path = hf_hub_download(
        repo_id=REPO_ID,
        repo_type=REPO_TYPE,
        filename=filename,
        local_dir=str(raw_metadata_dir),
    )
    return Path(path)


def normalize_country(series: pd.Series) -> pd.Series:
    return (
        series.astype("string")
        .str.strip()
        .str.upper()
        .replace({"UK": "GB"})
    )


def filter_metadata(
    split: str,
    source_csv: Path,
    out_csv: Path,
    chunk_size: int,
) -> tuple[int, set[str]]:
    """
    Filter metadata in chunks and return (number_of_rows, image_id_set).
    Uses unique_country when available; falls back to country.
    """
    print(f"[metadata] Inspecting columns in {source_csv.name} ...")
    header = pd.read_csv(source_csv, nrows=0)
    cols = set(header.columns)

    id_col = "id"
    if id_col not in cols:
        raise RuntimeError(f"'id' column not found. Columns: {sorted(cols)}")

    country_col = "unique_country" if "unique_country" in cols else "country"
    if country_col not in cols:
        raise RuntimeError(
            "No usable country column found. "
            f"Expected 'unique_country' or 'country'. Columns: {sorted(cols)}"
        )

    wanted = [
        c for c in [
            "id", "latitude", "longitude", country_col,
            "country", "region", "sub-region", "city",
            "captured_at", "sequence"
        ]
        if c in cols
    ]
    # Remove duplicates while preserving order.
    wanted = list(dict.fromkeys(wanted))

    tmp = out_csv.with_suffix(".tmp.csv")
    if tmp.exists():
        tmp.unlink()

    total_kept = 0
    ids: set[str] = set()
    wrote_header = False

    print(f"[metadata] Filtering {split} to Europe using column '{country_col}' ...")

    reader = pd.read_csv(
        source_csv,
        usecols=wanted,
        dtype={"id": "string", country_col: "string"},
        chunksize=chunk_size,
        low_memory=False,
    )

    for chunk in tqdm(reader, desc=f"Filter {split}", unit="chunk"):
        cc = normalize_country(chunk[country_col])
        eu = chunk.loc[cc.isin(EUROPE_ISO2)].copy()

        if eu.empty:
            continue

        eu["id"] = eu["id"].astype("string")
        eu["split"] = split

        # Standardize the country-code field for downstream use.
        eu["country_code"] = normalize_country(eu[country_col])

        # Keep a compact, predictable column order.
        final_cols = [
            c for c in [
                "id", "split", "latitude", "longitude", "country_code",
                "country", "region", "sub-region", "city",
                "captured_at", "sequence"
            ]
            if c in eu.columns
        ]
        eu = eu[final_cols]

        eu.to_csv(
            tmp,
            mode="a",
            header=not wrote_header,
            index=False,
            quoting=csv.QUOTE_MINIMAL,
        )
        wrote_header = True
        total_kept += len(eu)
        ids.update(eu["id"].dropna().astype(str).tolist())

    if not wrote_header:
        raise RuntimeError(
            f"No European rows found in {split}. "
            "Check the country-code field before continuing."
        )

    tmp.replace(out_csv)
    print(f"[metadata] {split}: kept {total_kept:,} European images.")
    return total_kept, ids


def load_ids(metadata_csv: Path) -> set[str]:
    ids: set[str] = set()
    for chunk in pd.read_csv(
        metadata_csv,
        usecols=["id"],
        dtype={"id": "string"},
        chunksize=500_000,
    ):
        ids.update(chunk["id"].dropna().astype(str).tolist())
    return ids


def completed_shards(state_file: Path) -> set[str]:
    if not state_file.exists():
        return set()
    try:
        data = json.loads(state_file.read_text(encoding="utf-8"))
        return set(data.get("completed", []))
    except Exception:
        return set()


def save_completed(state_file: Path, completed: set[str]) -> None:
    tmp = state_file.with_suffix(".tmp")
    tmp.write_text(
        json.dumps({"completed": sorted(completed)}, indent=2),
        encoding="utf-8",
    )
    tmp.replace(state_file)


def extract_selected(
    zip_path: Path,
    wanted_ids: set[str],
    output_dir: Path,
) -> tuple[int, int]:
    """
    Extract only members whose filename stem is a wanted OSV image ID.
    Returns (members_seen, images_extracted).
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    seen = 0
    extracted = 0

    with zipfile.ZipFile(zip_path, "r") as zf:
        members = [m for m in zf.infolist() if not m.is_dir()]

        for member in tqdm(
            members,
            desc=f"Scan {zip_path.name}",
            unit="img",
            leave=False,
        ):
            seen += 1
            member_name = Path(member.filename)
            image_id = member_name.stem

            if image_id not in wanted_ids:
                continue

            suffix = member_name.suffix.lower() or ".jpg"
            destination = output_dir / f"{image_id}{suffix}"

            if destination.exists() and destination.stat().st_size > 0:
                continue

            tmp = destination.with_suffix(destination.suffix + ".part")
            with zf.open(member, "r") as src, tmp.open("wb") as dst:
                shutil.copyfileobj(src, dst, length=1024 * 1024)
            tmp.replace(destination)
            extracted += 1

    return seen, extracted


def local_zip_path(zip_root: Path, split: str, shard: str) -> Path:
    return zip_root / split / shard


def _download_shard(
    split: str,
    shard: str,
    zip_root: Path,
) -> Path:
    """
    Ensure one OSV-5M shard exists in the persistent local ZIP staging folder.

    Existing local ZIPs are always preferred. Hugging Face is contacted only
    when the staged ZIP is missing.
    """
    destination = local_zip_path(zip_root, split, shard)
    destination.parent.mkdir(parents=True, exist_ok=True)

    if destination.exists() and destination.stat().st_size > 0:
        print(f"[download] Reusing local ZIP: {destination}")
        return destination

    repo_filename = f"images/{split}/{shard}"
    print(f"\n[download] Starting {repo_filename} ...")

    # Download into the staging root using the repo's subdirectory layout.
    downloaded = Path(
        hf_hub_download(
            repo_id=REPO_ID,
            repo_type=REPO_TYPE,
            filename=repo_filename,
            local_dir=str(zip_root),
        )
    )

    if downloaded.resolve() != destination.resolve():
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(downloaded), str(destination))

    print(f"[download] Ready: {destination}")
    return destination

def _process_downloaded_shard(
    split: str,
    shard: str,
    zip_path: Path,
    wanted_ids: set[str],
    split_image_dir: Path,
    state_file: Path,
    completed: set[str],
) -> None:
    """Extract Europe-only images, record completion, then delete ZIP."""
    key = f"{split}/{shard}"

    print(f"\n[extract] Extracting Europe-only members from {shard} ...")
    seen, extracted = extract_selected(
        zip_path=zip_path,
        wanted_ids=wanted_ids,
        output_dir=split_image_dir,
    )
    print(
        f"[extract] {key}: inspected {seen:,} files, "
        f"new European files extracted: {extracted:,}"
    )

    completed.add(key)
    save_completed(state_file, completed)

    try:
        zip_path.unlink()
        print(f"[cleanup] Deleted ZIP after successful extraction: {zip_path.name}")
    except FileNotFoundError:
        pass


def download_and_extract_split(
    split: str,
    wanted_ids: set[str],
    paths: dict[str, Path],
    zip_root: Path,
    limit_shards: int | None,
    prefetch: int,
    mode: str,
) -> None:
    """
    Process one split in one of three modes.

    pipeline:
        Current behavior. Download the next ZIP while extracting the current
        ZIP, then delete each ZIP after successful extraction.

    download:
        Download only shards that are not already marked completed/extracted.
        Existing local ZIPs are reused. Completed shards whose ZIPs were
        previously deleted are NOT downloaded again.

    extract:
        Use only ZIPs already present in zip_root. Extract Europe-only images,
        mark the shard complete, then delete the ZIP after successful extraction.
        No network downloads are attempted.
    """
    n_shards = SHARD_COUNTS[split]
    if limit_shards is not None:
        n_shards = min(n_shards, limit_shards)

    split_image_dir = paths["images"] / split
    split_image_dir.mkdir(parents=True, exist_ok=True)

    split_zip_dir = zip_root / split
    split_zip_dir.mkdir(parents=True, exist_ok=True)

    state_file = paths["state"] / f"{split}_completed_shards.json"
    completed = completed_shards(state_file)

    all_shards = [f"{i:02d}.zip" for i in range(n_shards)]

    pending_shards = [
        shard
        for shard in all_shards
        if f"{split}/{shard}" not in completed
    ]

    if mode == "download":
        print(
            f"\n[download-only] {split}: {len(completed)} shard(s) already "
            f"completed/extracted and will be skipped."
        )
        print(
            f"[download-only] {len(pending_shards)} unfinished shard(s) remain. "
            f"Only these will be downloaded if their local ZIP is missing."
        )

        if not pending_shards:
            print(f"[download-only] {split}: nothing left to download.")
            return

        for shard in pending_shards:
            _download_shard(
                split=split,
                shard=shard,
                zip_root=zip_root,
            )

        print(
            f"[download-only] {split}: all unfinished shards are now available locally."
        )
        return

    print(
        f"\n[images] {split}: {len(wanted_ids):,} European IDs, "
        f"{n_shards} shard(s) in range, "
        f"{len(pending_shards)} remaining, mode={mode}."
    )

    if not pending_shards:
        print(f"[images] {split}: nothing left to extract.")
        return

    if mode == "extract":
        missing = [
            shard
            for shard in pending_shards
            if not (
                local_zip_path(zip_root, split, shard).exists()
                and local_zip_path(zip_root, split, shard).stat().st_size > 0
            )
        ]
        if missing:
            preview = ", ".join(missing[:10])
            more = "" if len(missing) <= 10 else f" ... (+{len(missing) - 10} more)"
            raise RuntimeError(
                f"Extract-only mode requires all remaining ZIPs locally. "
                f"Missing {len(missing)} shard(s) for {split}: {preview}{more}"
            )

        print(
            f"[extract-only] Using local ZIPs from {split_zip_dir}. "
            "No network downloads will be made."
        )
        for shard in pending_shards:
            zip_path = local_zip_path(zip_root, split, shard)
            print(f"[extract-only] Using {zip_path}")
            _process_downloaded_shard(
                split=split,
                shard=shard,
                zip_path=zip_path,
                wanted_ids=wanted_ids,
                split_image_dir=split_image_dir,
                state_file=state_file,
                completed=completed,
            )
        return

    # pipeline mode
    if prefetch == 0:
        print("[pipeline] Prefetch disabled: sequential download -> extract.")
        for shard in pending_shards:
            zip_path = _download_shard(
                split=split,
                shard=shard,
                zip_root=zip_root,
            )
            _process_downloaded_shard(
                split=split,
                shard=shard,
                zip_path=zip_path,
                wanted_ids=wanted_ids,
                split_image_dir=split_image_dir,
                state_file=state_file,
                completed=completed,
            )
        return

    print(
        "[pipeline] Downloading the next ZIP while extracting the current ZIP. "
        "Each ZIP is deleted after successful extraction."
    )

    with ThreadPoolExecutor(max_workers=1, thread_name_prefix="osv-download") as executor:
        first_shard = pending_shards[0]
        current_future: Future[Path] = executor.submit(
            _download_shard,
            split,
            first_shard,
            zip_root,
        )

        for position, shard in enumerate(pending_shards):
            zip_path = current_future.result()

            next_future: Future[Path] | None = None
            if position + 1 < len(pending_shards):
                next_shard = pending_shards[position + 1]
                next_future = executor.submit(
                    _download_shard,
                    split,
                    next_shard,
                    zip_root,
                )

            _process_downloaded_shard(
                split=split,
                shard=shard,
                zip_path=zip_path,
                wanted_ids=wanted_ids,
                split_image_dir=split_image_dir,
                state_file=state_file,
                completed=completed,
            )

            if next_future is not None:
                current_future = next_future

def make_combined_metadata(paths: dict[str, Path], splits: Iterable[str]) -> Path:
    files = [
        paths["metadata"] / f"{split}_europe.csv"
        for split in splits
        if (paths["metadata"] / f"{split}_europe.csv").exists()
    ]
    out = paths["metadata"] / "europe.csv"

    if not files:
        return out

    first = True
    tmp = out.with_suffix(".tmp.csv")
    if tmp.exists():
        tmp.unlink()

    for file in files:
        for chunk in pd.read_csv(file, chunksize=250_000, low_memory=False):
            chunk.to_csv(tmp, mode="a", header=first, index=False)
            first = False

    tmp.replace(out)
    return out


def write_readme(paths: dict[str, Path], splits: list[str]) -> None:
    readme = paths["root"] / "README_PREPARED.txt"
    text = f"""OSV-5M Europe subset
====================

Repository:
  {REPO_ID}

Prepared splits:
  {", ".join(splits)}

Important folders:
  metadata/europe.csv
      Combined European metadata.

  metadata/train_europe.csv
  metadata/test_europe.csv
      Per-split metadata.

  images/train/
  images/test/
      Europe-only extracted images.

  raw_metadata/
      Original OSV-5M CSV metadata downloaded from Hugging Face.

  ZIP staging directory:
      By default this is ../osv-5m_zips next to the preparation script.
      In --mode download ZIPs are retained there.
      In --mode extract or pipeline each ZIP is deleted after successful extraction.

  state/
      Resume information. Re-run the same command after interruption.

Suggested next step:
  Compute one SALAD descriptor per image and build a FAISS index. Keep the
  descriptor row order linked to metadata/europe.csv by OSV image ID.
"""
    readme.write_text(text, encoding="utf-8")


def main() -> None:
    args = parse_args()
    paths = ensure_dirs(args.root)

    print("=" * 72)
    print("OSV-5M Europe preparation")
    print(f"Destination: {paths['root']}")
    print(f"Splits:      {', '.join(args.splits)}")
    print(f"Mode:        {args.mode}")
    print(f"ZIP staging: {args.zip_dir.expanduser().resolve()}")
    print("=" * 72)

    ids_by_split: dict[str, set[str]] = {}

    for split in args.splits:
        raw_csv = download_metadata(split, paths["raw_metadata"])
        eu_csv = paths["metadata"] / f"{split}_europe.csv"

        # Reuse an already-created filtered file to make resume fast.
        if eu_csv.exists() and eu_csv.stat().st_size > 0:
            print(f"[metadata] Reusing existing {eu_csv}")
            ids = load_ids(eu_csv)
            print(f"[metadata] {split}: loaded {len(ids):,} European IDs.")
        else:
            _, ids = filter_metadata(
                split=split,
                source_csv=raw_csv,
                out_csv=eu_csv,
                chunk_size=args.chunk_size,
            )

        ids_by_split[split] = ids

    combined = make_combined_metadata(paths, args.splits)
    print(f"\n[metadata] Combined metadata: {combined}")

    write_readme(paths, args.splits)

    if args.metadata_only:
        print("\nDone: metadata-only mode.")
        print("Inspect metadata/europe.csv before starting the large image download.")
        return

    for split in args.splits:
        download_and_extract_split(
            split=split,
            wanted_ids=ids_by_split[split],
            paths=paths,
            zip_root=args.zip_dir.expanduser().resolve(),
            limit_shards=args.limit_shards,
            prefetch=args.prefetch,
            mode=args.mode,
        )

    print("\n" + "=" * 72)
    print("DONE")
    print(f"Europe metadata: {paths['metadata'] / 'europe.csv'}")
    if args.mode == "download":
        print(f"ZIPs:            {args.zip_dir.expanduser().resolve()}")
        print("Next step: run again with --mode extract.")
    else:
        print(f"Images:          {paths['images']}")
        print("Next step: compute SALAD descriptors and build a FAISS index.")
    print("=" * 72)


if __name__ == "__main__":
    main()
