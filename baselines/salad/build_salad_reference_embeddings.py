#!/usr/bin/env python3
"""
Build the lossless float32 SALAD reference embedding master, resumably.

Expected default layout:
repo/
├─ salad/
│  ├─ build_salad_reference_embeddings.py
│  └─ osv-5m_europe/
│     ├─ metadata/europe.csv
│     ├─ images/train/
│     └─ images/test/
└─ demo_and_extension/

The output is sharded so the 8448-D float32 master never has to fit in RAM.
Each shard is written atomically and can be resumed safely.

Official SALAD default descriptor size: 8192 + 256 = 8448.
Official evaluation image size: 322 x 322.
"""

from __future__ import annotations

from pathlib import Path
import os
SCRIPT_DIR = Path(__file__).resolve().parent
os.environ.setdefault(
    "TORCH_HOME",
    str(SCRIPT_DIR / ".torch_cache"),
)

import argparse
import csv
import json
import math
import os
import time

import numpy as np
import pandas as pd
import torch
from PIL import Image, ImageFile
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms
from tqdm import tqdm

ImageFile.LOAD_TRUNCATED_IMAGES = True

DESCRIPTOR_DIM = 8448
IMAGE_SIZE = (322, 322)
IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")


def parse_args() -> argparse.Namespace:
    here = Path(__file__).resolve().parent
    p = argparse.ArgumentParser()
    p.add_argument(
        "--dataset-root",
        type=Path,
        default=here / "osv-5m_europe",
        help="Prepared OSV-5M Europe root.",
    )
    p.add_argument(
        "--output",
        type=Path,
        default=here / "osv-5m_europe" / "salad_embeddings_fp32",
        help="Output directory for float32 master shards.",
    )
    p.add_argument("--batch-size", type=int, default=64)
    p.add_argument("--workers", type=int, default=2)
    p.add_argument("--shard-size", type=int, default=25_000)
    p.add_argument(
        "--device",
        default="cuda" if torch.cuda.is_available() else "cpu",
        choices=["cuda", "cpu"],
    )
    p.add_argument(
        "--allow-missing",
        action="store_true",
        help="Skip missing/corrupt images instead of failing. Not recommended for the master.",
    )
    p.add_argument(
        "--force",
        action="store_true",
        help="Recompute shards even if valid completed shard files already exist.",
    )
    p.add_argument(
        "--max-images",
        type=int,
        default=None,
        help="Process at most N metadata rows. Useful for smoke tests.",
    )
    return p.parse_args()


def atomic_json(path: Path, data: dict) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, indent=2), encoding="utf-8")
    tmp.replace(path)


def save_npy_atomic(path: Path, array: np.ndarray) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("wb") as f:
        np.save(f, array, allow_pickle=False)
    tmp.replace(path)


def find_image(dataset_root: Path, split: str, image_id: str) -> Path:
    base = dataset_root / "images" / split
    for ext in IMAGE_EXTENSIONS:
        p = base / f"{image_id}{ext}"
        if p.exists() and p.stat().st_size > 0:
            return p
    raise FileNotFoundError(f"Image not found for split={split}, id={image_id}")


class OSVSlice(Dataset):
    def __init__(
        self,
        rows: pd.DataFrame,
        dataset_root: Path,
        transform,
        allow_missing: bool,
    ) -> None:
        self.rows = rows.reset_index(drop=True)
        self.dataset_root = dataset_root
        self.transform = transform
        self.allow_missing = allow_missing

    def __len__(self) -> int:
        return len(self.rows)

    def __getitem__(self, idx: int):
        row = self.rows.iloc[idx]
        image_id = str(row["id"])
        split = str(row["split"])
        global_row = int(row["row_id"])
        try:
            path = find_image(self.dataset_root, split, image_id)
            with Image.open(path) as im:
                image = self.transform(im.convert("RGB"))
            return image, global_row, image_id, split, ""
        except Exception as exc:
            if not self.allow_missing:
                raise
            # Keep DataLoader batching simple: return a marker and filter it in collate.
            return torch.empty(0), global_row, image_id, split, repr(exc)


def collate_keep_valid(batch):
    valid = [x for x in batch if x[0].numel() > 0]
    errors = [x for x in batch if x[0].numel() == 0]
    if not valid:
        return None, [], [], [], errors
    images = torch.stack([x[0] for x in valid], dim=0)
    rows = [x[1] for x in valid]
    ids = [x[2] for x in valid]
    splits = [x[3] for x in valid]
    return images, rows, ids, splits, errors


def shard_paths(output: Path, shard_idx: int) -> tuple[Path, Path]:
    stem = f"embeddings_{shard_idx:05d}"
    return output / f"{stem}.npy", output / f"{stem}.json"


def valid_completed_shard(npy_path: Path, meta_path: Path, expected_rows: int) -> bool:
    if not npy_path.exists() or not meta_path.exists():
        return False
    try:
        info = json.loads(meta_path.read_text(encoding="utf-8"))
        if info.get("complete") is not True:
            return False
        if int(info["rows"]) != expected_rows:
            return False
        arr = np.load(npy_path, mmap_mode="r")
        return arr.shape == (expected_rows, DESCRIPTOR_DIM) and arr.dtype == np.float32
    except Exception:
        return False


def main() -> None:
    args = parse_args()
    dataset_root = args.dataset_root.expanduser().resolve()
    output = args.output.expanduser().resolve()
    output.mkdir(parents=True, exist_ok=True)

    metadata_csv = dataset_root / "metadata" / "europe.csv"
    if not metadata_csv.exists():
        raise FileNotFoundError(metadata_csv)

    if args.device == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("CUDA requested, but torch.cuda.is_available() is False.")

    print("=" * 78)
    print("SALAD float32 reference embedding builder")
    print(f"Metadata:   {metadata_csv}")
    print(f"Images:     {dataset_root / 'images'}")
    print(f"Output:     {output}")
    print(f"Device:     {args.device}")
    print(f"Batch size: {args.batch_size}")
    print(f"Shard size: {args.shard_size:,}")
    print("=" * 78)

    meta = pd.read_csv(
        metadata_csv,
        dtype={"id": "string", "split": "string"},
        low_memory=False,
    )
    required = {"id", "split", "latitude", "longitude"}
    missing = required - set(meta.columns)
    if missing:
        raise RuntimeError(f"Missing metadata columns: {sorted(missing)}")

    meta = meta.reset_index(drop=True)
    if args.max_images is not None:
        if args.max_images <= 0:
            raise ValueError("--max-images must be > 0")
        meta = meta.iloc[:args.max_images].copy().reset_index(drop=True)
        print(f"[test limit] Restricted reference build to {len(meta):,} image(s).")
    meta.insert(0, "row_id", np.arange(len(meta), dtype=np.int64))

    reference_csv = output / "reference.csv"
    if not reference_csv.exists() or args.force:
        tmp = reference_csv.with_suffix(".tmp.csv")
        meta.to_csv(tmp, index=False, quoting=csv.QUOTE_MINIMAL)
        tmp.replace(reference_csv)

    transform = transforms.Compose(
        [
            transforms.Resize(IMAGE_SIZE, interpolation=transforms.InterpolationMode.BILINEAR),
            transforms.ToTensor(),
            transforms.Normalize( # expected by DINOv2
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ]
    )

    print("\nLoading official SALAD model with Torch Hub ...")
    model = torch.hub.load(
        "serizba/salad",
        "dinov2_salad",
        trust_repo=True,
    )
    model = model.eval().to(args.device)

    # IMPORTANT: no autocast here. The master is intentionally computed in float32.
    if args.device == "cuda":
        torch.backends.cudnn.benchmark = True

    n = len(meta)
    n_shards = math.ceil(n / args.shard_size)
    missing_log = output / "missing_or_failed.csv"
    if args.force and missing_log.exists():
        missing_log.unlink()

    run_info = {
        "descriptor_dim": DESCRIPTOR_DIM,
        "dtype": "float32",
        "image_size": list(IMAGE_SIZE),
        "total_rows": n,
        "shard_size": args.shard_size,
        "num_shards": n_shards,
        "device": args.device,
        "batch_size": args.batch_size,
        "autocast": False,
    }
    atomic_json(output / "master_info.json", run_info)

    total_done = 0
    started = time.perf_counter()

    for shard_idx in range(n_shards):
        start = shard_idx * args.shard_size
        end = min(n, start + args.shard_size)
        rows = meta.iloc[start:end].copy()
        expected = len(rows)

        npy_path, info_path = shard_paths(output, shard_idx)
        if not args.force and valid_completed_shard(npy_path, info_path, expected):
            print(f"[skip] shard {shard_idx:05d}: {expected:,} embeddings already complete")
            total_done += expected
            continue

        print(
            f"\n[build] shard {shard_idx + 1}/{n_shards}: "
            f"rows {start:,}..{end - 1:,} ({expected:,})"
        )

        ds = OSVSlice(rows, dataset_root, transform, args.allow_missing)
        loader = DataLoader(
            ds,
            batch_size=args.batch_size,
            shuffle=False,
            num_workers=args.workers,
            pin_memory=(args.device == "cuda"),
            persistent_workers=(args.workers > 0),
            collate_fn=collate_keep_valid,
        )

        embeddings = np.full((expected, DESCRIPTOR_DIM), np.nan, dtype=np.float32)
        shard_failures = []

        with torch.inference_mode():
            for images, row_ids, ids, splits, errors in tqdm(
                loader,
                desc=f"SALAD {shard_idx:05d}",
                unit="batch",
            ):
                for _, global_row, image_id, split, error in errors:
                    shard_failures.append((global_row, image_id, split, error))

                if images is None:
                    continue

                images = images.to(args.device, non_blocking=True)
                desc = model(images)

                if isinstance(desc, (tuple, list)):
                    desc = desc[0]
                if desc.ndim != 2 or desc.shape[1] != DESCRIPTOR_DIM:
                    raise RuntimeError(
                        f"Unexpected SALAD output shape {tuple(desc.shape)}; "
                        f"expected [B, {DESCRIPTOR_DIM}]"
                    )

                desc_np = desc.detach().float().cpu().numpy()
                local_rows = np.asarray(row_ids, dtype=np.int64) - start
                embeddings[local_rows] = desc_np

        if shard_failures and not args.allow_missing:
            raise RuntimeError("Unexpected missing images while allow_missing=False")

        if np.isnan(embeddings).any() and not args.allow_missing:
            raise RuntimeError(
                f"Shard {shard_idx:05d} contains NaNs/unfilled rows. "
                "Master shard not written."
            )

        save_npy_atomic(npy_path, embeddings)

        info = {
            "complete": True,
            "shard_index": shard_idx,
            "row_start": start,
            "row_end_exclusive": end,
            "rows": expected,
            "descriptor_dim": DESCRIPTOR_DIM,
            "dtype": "float32",
            "failed_rows": len(shard_failures),
            "file": npy_path.name,
        }
        atomic_json(info_path, info)

        if shard_failures:
            write_header = not missing_log.exists()
            with missing_log.open("a", newline="", encoding="utf-8") as f:
                w = csv.writer(f)
                if write_header:
                    w.writerow(["row_id", "id", "split", "error"])
                w.writerows(shard_failures)

        total_done += expected
        elapsed = time.perf_counter() - started
        print(
            f"[saved] {npy_path.name} | "
            f"overall {total_done:,}/{n:,} metadata rows | "
            f"elapsed {elapsed/60:.1f} min"
        )

    print("\nDONE")
    print(f"Master embeddings: {output}")
    print(f"Reference mapping: {reference_csv}")
    print("These float32 shards are the permanent baseline for all compression tests.")


if __name__ == "__main__":
    main()
