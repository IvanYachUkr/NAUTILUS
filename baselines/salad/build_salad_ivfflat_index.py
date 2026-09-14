#!/usr/bin/env python3
"""
Windows-safe persistent IVF-Flat builder for SALAD FP32 descriptors.

This script intentionally DOES NOT use:
    faiss.contrib.ondisk.merge_ondisk
or:
    faiss.OnDiskInvertedLists

Those paths are not reliable on Windows.

Instead, it reuses the trained FAISS IVF coarse quantizer and the existing
temporary per-shard IVF indexes, then writes a simple cluster-contiguous
disk-backed layout:

salad_ivfflat/
├─ trained_ivfflat.faiss
├─ centroids.npy
├─ offsets.npy
├─ ids.dat
├─ vectors.dat
└─ index_info.json

The raw SALAD vectors remain float32. No descriptor compression is performed.

IMPORTANT FOR AN EXISTING FAILED BUILD
--------------------------------------
If you already have:
    trained_ivfflat.faiss
    _shards/ivf_00000.faiss ... ivf_00086.faiss
    matching .json sidecars

then rerun this script WITHOUT --rebuild.
It will reuse all of that expensive work and only perform the Windows-safe
final merge.
"""

from __future__ import annotations

import argparse
import gc
import json
import shutil
import time
from pathlib import Path

import numpy as np

try:
    import faiss
except ImportError as exc:
    raise SystemExit(
        "FAISS is required. Activate baselines/salad/.venv and install faiss-cpu."
    ) from exc


DESCRIPTOR_DIM = 8448
FINAL_FORMAT = "windows_safe_ivfflat_v1"


def parse_args() -> argparse.Namespace:
    here = Path(__file__).resolve().parent
    p = argparse.ArgumentParser(
        description="Build a Windows-safe disk-backed FP32 IVF-Flat index."
    )
    p.add_argument(
        "--master-dir",
        type=Path,
        default=here / "osv-5m_europe" / "salad_embeddings_fp32",
    )
    p.add_argument(
        "--output-dir",
        type=Path,
        default=here / "osv-5m_europe" / "salad_ivfflat",
    )
    p.add_argument("--nlist", type=int, default=1024)
    p.add_argument("--train-sample", type=int, default=40_000)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument(
        "--rebuild",
        action="store_true",
        help="Discard and rebuild trained template, temporary shards, and final index.",
    )
    p.add_argument(
        "--keep-temp-shards",
        action="store_true",
        help="Keep _shards after the final merge succeeds.",
    )
    return p.parse_args()


def embedding_shards(master_dir: Path) -> list[Path]:
    shards = sorted(master_dir.glob("embeddings_*.npy"))
    if not shards:
        raise FileNotFoundError(f"No embeddings_*.npy found in {master_dir}")
    return shards


def load_shard_info(shard: Path) -> dict:
    path = shard.with_suffix(".json")
    if not path.exists():
        raise FileNotFoundError(path)
    return json.loads(path.read_text(encoding="utf-8"))


def atomic_json(path: Path, payload: dict) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    tmp.replace(path)


def sample_training_vectors(
    shards: list[Path],
    sample_size: int,
    seed: int,
) -> np.ndarray:
    counts = [int(load_shard_info(s)["rows"]) for s in shards]
    total = sum(counts)
    sample_size = min(sample_size, total)

    rng = np.random.default_rng(seed)
    pieces: list[np.ndarray] = []
    remaining = sample_size

    for pos, (shard, count) in enumerate(zip(shards, counts)):
        if remaining <= 0:
            break

        if pos == len(shards) - 1:
            take = min(remaining, count)
        else:
            take = min(
                count,
                max(0, round(sample_size * count / total)),
                remaining,
            )

        if take <= 0:
            continue

        arr = np.load(shard, mmap_mode="r")
        local_ids = rng.choice(count, size=take, replace=False)
        pieces.append(np.asarray(arr[local_ids], dtype=np.float32))
        remaining -= take

    if remaining > 0:
        raise RuntimeError(
            f"Could only sample {sample_size - remaining:,} / {sample_size:,} vectors."
        )

    sample = np.concatenate(pieces, axis=0)

    if sample.shape != (sample_size, DESCRIPTOR_DIM):
        raise RuntimeError(
            f"Unexpected sample shape {sample.shape}; "
            f"expected ({sample_size}, {DESCRIPTOR_DIM})"
        )

    if not np.isfinite(sample).all():
        raise RuntimeError("Non-finite values found in IVF training sample.")

    return sample


def build_or_load_template(
    shards: list[Path],
    output_dir: Path,
    nlist: int,
    train_sample: int,
    seed: int,
    rebuild: bool,
):
    template_path = output_dir / "trained_ivfflat.faiss"

    if template_path.exists() and not rebuild:
        index = faiss.read_index(str(template_path))
        ivf = faiss.extract_index_ivf(index)

        if (
            index.is_trained
            and int(index.ntotal) == 0
            and int(index.d) == DESCRIPTOR_DIM
            and int(ivf.nlist) == nlist
        ):
            print(f"[train] reusing {template_path.name}")
            return index

        raise RuntimeError(
            "Existing trained_ivfflat.faiss is incompatible with the requested "
            "settings. Use --rebuild only if you intentionally want to start over."
        )

    recommended_min = 39 * nlist
    if train_sample < recommended_min:
        print(
            f"[warning] train sample {train_sample:,} is below approximately "
            f"39 vectors/centroid ({recommended_min:,})."
        )

    print(f"[train] sampling {train_sample:,} FP32 descriptors ...")
    sample = sample_training_vectors(shards, train_sample, seed)
    print(f"[train] sample RAM footprint: {sample.nbytes / (1024**3):.2f} GiB")

    quantizer = faiss.IndexFlatL2(DESCRIPTOR_DIM)
    index = faiss.IndexIVFFlat(
        quantizer,
        DESCRIPTOR_DIM,
        nlist,
        faiss.METRIC_L2,
    )

    started = time.perf_counter()
    index.train(sample)
    elapsed = time.perf_counter() - started

    del sample
    gc.collect()

    if not index.is_trained:
        raise RuntimeError("IVF training failed.")

    faiss.write_index(index, str(template_path))
    print(f"[train] saved {template_path.name} ({elapsed / 60:.1f} min)")
    return index


def temp_paths(temp_dir: Path, source_shard: Path) -> tuple[Path, Path]:
    suffix = source_shard.stem.replace("embeddings_", "")
    return (
        temp_dir / f"ivf_{suffix}.faiss",
        temp_dir / f"ivf_{suffix}.json",
    )


def temp_is_complete(
    index_path: Path,
    meta_path: Path,
    rows: int,
    row_start: int,
    nlist: int,
) -> bool:
    if not index_path.exists() or not meta_path.exists():
        return False
    if index_path.stat().st_size <= 0:
        return False

    try:
        info = json.loads(meta_path.read_text(encoding="utf-8"))
        return (
            info.get("complete") is True
            and int(info["rows"]) == rows
            and int(info["row_start"]) == row_start
            and int(info["dimension"]) == DESCRIPTOR_DIM
            and int(info["nlist"]) == nlist
        )
    except Exception:
        return False


def build_temp_shards(
    shards: list[Path],
    trained_template,
    temp_dir: Path,
    nlist: int,
    rebuild: bool,
) -> list[Path]:
    temp_dir.mkdir(parents=True, exist_ok=True)
    outputs: list[Path] = []

    for pos, shard in enumerate(shards, start=1):
        info = load_shard_info(shard)
        row_start = int(info["row_start"])
        rows = int(info["rows"])
        index_path, meta_path = temp_paths(temp_dir, shard)

        if (
            not rebuild
            and temp_is_complete(
                index_path,
                meta_path,
                rows,
                row_start,
                nlist,
            )
        ):
            print(f"[shard {pos}/{len(shards)}] reuse {index_path.name}")
            outputs.append(index_path)
            continue

        print(
            f"[shard {pos}/{len(shards)}] build {index_path.name} "
            f"({rows:,} vectors)"
        )

        arr = np.load(shard, mmap_mode="r")
        if arr.shape != (rows, DESCRIPTOR_DIM):
            raise RuntimeError(f"Unexpected shape {arr.shape} in {shard}")

        index = faiss.clone_index(trained_template)
        if index.ntotal:
            index.reset()

        block = np.asarray(arr, dtype=np.float32)
        global_ids = np.arange(
            row_start,
            row_start + rows,
            dtype=np.int64,
        )

        index.add_with_ids(block, global_ids)

        if int(index.ntotal) != rows:
            raise RuntimeError(
                f"{index_path.name}: ntotal={index.ntotal}, expected={rows}"
            )

        tmp_index = index_path.with_suffix(".faiss.tmp")
        faiss.write_index(index, str(tmp_index))
        tmp_index.replace(index_path)

        atomic_json(
            meta_path,
            {
                "complete": True,
                "source_shard": shard.name,
                "row_start": row_start,
                "rows": rows,
                "dimension": DESCRIPTOR_DIM,
                "nlist": nlist,
            },
        )

        outputs.append(index_path)

        del global_ids, block, arr, index
        gc.collect()

    return outputs


def extract_centroids(trained_template, nlist: int) -> np.ndarray:
    ivf = faiss.extract_index_ivf(trained_template)
    quantizer = ivf.quantizer

    centroids = np.empty((nlist, DESCRIPTOR_DIM), dtype=np.float32)
    for i in range(nlist):
        centroids[i] = quantizer.reconstruct(i)

    return centroids


def extract_list_from_array_invlists(
    ivf,
    list_no: int,
) -> tuple[np.ndarray, np.ndarray]:
    invlists = ivf.invlists
    size = int(invlists.list_size(list_no))

    if size == 0:
        return (
            np.empty((0, DESCRIPTOR_DIM), dtype=np.float32),
            np.empty((0,), dtype=np.int64),
        )

    code_ptr = invlists.get_codes(list_no)
    id_ptr = invlists.get_ids(list_no)

    try:
        raw_codes = faiss.rev_swig_ptr(
            code_ptr,
            size * int(invlists.code_size),
        )
        vectors = (
            raw_codes
            .view(np.float32)
            .reshape(size, DESCRIPTOR_DIM)
            .copy()
        )

        ids = (
            faiss.rev_swig_ptr(id_ptr, size)
            .astype(np.int64, copy=True)
        )
    finally:
        invlists.release_codes(list_no, code_ptr)
        invlists.release_ids(list_no, id_ptr)

    return vectors, ids


def final_is_complete(
    output_dir: Path,
    expected_rows: int,
    nlist: int,
) -> bool:
    info_path = output_dir / "index_info.json"

    required = [
        output_dir / "centroids.npy",
        output_dir / "offsets.npy",
        output_dir / "ids.dat",
        output_dir / "vectors.dat",
        info_path,
    ]

    if not all(path.exists() for path in required):
        return False

    try:
        info = json.loads(info_path.read_text(encoding="utf-8"))
        return (
            info.get("complete") is True
            and info.get("format") == FINAL_FORMAT
            and int(info["ntotal"]) == expected_rows
            and int(info["nlist"]) == nlist
            and int(info["dimension"]) == DESCRIPTOR_DIM
        )
    except Exception:
        return False


def merge_temp_shards_windows_safe(
    temp_indexes: list[Path],
    trained_template,
    output_dir: Path,
    expected_rows: int,
    nlist: int,
    train_sample: int,
    seed: int,
) -> None:
    print("\n[merge 1/2] counting vectors per IVF list ...")

    counts = np.zeros(nlist, dtype=np.int64)

    for pos, path in enumerate(temp_indexes, start=1):
        print(f"[count {pos}/{len(temp_indexes)}] {path.name}")

        index = faiss.read_index(str(path))
        ivf = faiss.extract_index_ivf(index)

        if int(ivf.nlist) != nlist:
            raise RuntimeError(f"nlist mismatch in {path}")

        for list_no in range(nlist):
            counts[list_no] += int(ivf.invlists.list_size(list_no))

        del ivf, index
        gc.collect()

    counted_rows = int(counts.sum())
    if counted_rows != expected_rows:
        raise RuntimeError(
            f"Temporary IVF shards contain {counted_rows:,} vectors; "
            f"expected {expected_rows:,}"
        )

    offsets = np.empty(nlist + 1, dtype=np.int64)
    offsets[0] = 0
    np.cumsum(counts, out=offsets[1:])

    centroids = extract_centroids(trained_template, nlist)
    np.save(output_dir / "centroids.npy", centroids)
    np.save(output_dir / "offsets.npy", offsets)
    del centroids
    gc.collect()

    vectors_tmp = output_dir / "vectors.dat.tmp"
    ids_tmp = output_dir / "ids.dat.tmp"

    vectors_final = output_dir / "vectors.dat"
    ids_final = output_dir / "ids.dat"

    for path in (vectors_tmp, ids_tmp):
        if path.exists():
            path.unlink()

    print("\n[merge 2/2] writing cluster-contiguous FP32 disk index ...")
    print(
        f"[merge 2/2] vectors.dat target size: "
        f"{expected_rows * DESCRIPTOR_DIM * 4 / (1024**3):.2f} GiB"
    )

    vectors_mm = np.memmap(
        vectors_tmp,
        mode="w+",
        dtype=np.float32,
        shape=(expected_rows, DESCRIPTOR_DIM),
    )

    ids_mm = np.memmap(
        ids_tmp,
        mode="w+",
        dtype=np.int64,
        shape=(expected_rows,),
    )

    cursors = offsets[:-1].copy()

    for pos, path in enumerate(temp_indexes, start=1):
        started = time.perf_counter()
        print(f"[write {pos}/{len(temp_indexes)}] {path.name}")

        index = faiss.read_index(str(path))
        ivf = faiss.extract_index_ivf(index)

        written = 0
        nonempty = 0

        for list_no in range(nlist):
            size = int(ivf.invlists.list_size(list_no))
            if size == 0:
                continue

            nonempty += 1
            vectors, ids = extract_list_from_array_invlists(ivf, list_no)

            start = int(cursors[list_no])
            end = start + size

            vectors_mm[start:end] = vectors
            ids_mm[start:end] = ids

            cursors[list_no] = end
            written += size

            del vectors, ids

        vectors_mm.flush()
        ids_mm.flush()

        del ivf, index
        gc.collect()

        elapsed = time.perf_counter() - started
        print(
            f"  wrote {written:,} rows from {nonempty:,} non-empty lists "
            f"in {elapsed:.1f} s"
        )

    expected_cursors = offsets[1:]
    if not np.array_equal(cursors, expected_cursors):
        bad = np.flatnonzero(cursors != expected_cursors)
        raise RuntimeError(
            f"Final cursor mismatch in {len(bad)} IVF lists. "
            f"First bad list: {int(bad[0]) if len(bad) else 'unknown'}"
        )

    vectors_mm.flush()
    ids_mm.flush()

    del vectors_mm, ids_mm
    gc.collect()

    vectors_tmp.replace(vectors_final)
    ids_tmp.replace(ids_final)

    atomic_json(
        output_dir / "index_info.json",
        {
            "complete": True,
            "format": FINAL_FORMAT,
            "index_type": "disk-backed raw FP32 IVF-Flat",
            "metric": "L2",
            "descriptor_dtype": "float32",
            "dimension": DESCRIPTOR_DIM,
            "nlist": nlist,
            "training_sample": train_sample,
            "seed": seed,
            "ntotal": expected_rows,
            "centroids_file": "centroids.npy",
            "offsets_file": "offsets.npy",
            "ids_file": "ids.dat",
            "vectors_file": "vectors.dat",
            "vectors_bytes": vectors_final.stat().st_size,
            "ids_bytes": ids_final.stat().st_size,
            "note": (
                "Windows-safe custom IVF disk layout. The SALAD descriptors "
                "remain raw float32. Approximation comes only from list pruning."
            ),
        },
    )


def main() -> None:
    args = parse_args()

    if args.nlist <= 1:
        raise ValueError("--nlist must be > 1")

    if args.train_sample <= args.nlist:
        raise ValueError("--train-sample must be greater than --nlist")

    master_dir = args.master_dir.expanduser().resolve()
    output_dir = args.output_dir.expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    shards = embedding_shards(master_dir)

    expected_rows = sum(
        int(load_shard_info(shard)["rows"])
        for shard in shards
    )

    master_bytes = sum(
        int(np.load(shard, mmap_mode="r").nbytes)
        for shard in shards
    )

    temp_dir = output_dir / "_shards"

    print("=" * 78)
    print("SALAD FP32 IVF-Flat builder - WINDOWS SAFE")
    print(f"Master:          {master_dir}")
    print(f"Reference rows:  {expected_rows:,}")
    print(f"FP32 payload:    {master_bytes / (1024**3):.2f} GiB")
    print(f"Output:          {output_dir}")
    print(f"nlist:           {args.nlist:,}")
    print(f"train sample:    {args.train_sample:,}")
    print("=" * 78)

    if (
        not args.rebuild
        and final_is_complete(
            output_dir,
            expected_rows,
            args.nlist,
        )
    ):
        print("[done] compatible Windows-safe final IVF index already exists.")
        return

    if args.rebuild:
        for name in (
            "trained_ivfflat.faiss",
            "centroids.npy",
            "offsets.npy",
            "ids.dat",
            "vectors.dat",
            "ids.dat.tmp",
            "vectors.dat.tmp",
            "index_info.json",
            "index.faiss",
            "index.ivfdata",
        ):
            path = output_dir / name
            if path.exists():
                path.unlink()

        if temp_dir.exists():
            shutil.rmtree(temp_dir)

    trained_template = build_or_load_template(
        shards=shards,
        output_dir=output_dir,
        nlist=args.nlist,
        train_sample=args.train_sample,
        seed=args.seed,
        rebuild=args.rebuild,
    )

    temp_indexes = build_temp_shards(
        shards=shards,
        trained_template=trained_template,
        temp_dir=temp_dir,
        nlist=args.nlist,
        rebuild=args.rebuild,
    )

    print(
        "\n[important] Windows-safe final merge selected. "
        "No merge_ondisk / OnDiskInvertedLists is used."
    )

    merge_temp_shards_windows_safe(
        temp_indexes=temp_indexes,
        trained_template=trained_template,
        output_dir=output_dir,
        expected_rows=expected_rows,
        nlist=args.nlist,
        train_sample=args.train_sample,
        seed=args.seed,
    )

    print("\nDONE")
    print(f"Centroids: {output_dir / 'centroids.npy'}")
    print(f"Offsets:   {output_dir / 'offsets.npy'}")
    print(f"IDs:       {output_dir / 'ids.dat'}")
    print(f"Vectors:   {output_dir / 'vectors.dat'}")
    print(f"Metadata:  {output_dir / 'index_info.json'}")

    if args.keep_temp_shards:
        print(f"Temporary shard indexes kept at: {temp_dir}")
    else:
        print("[cleanup] deleting temporary IVF shard indexes ...")
        shutil.rmtree(temp_dir)
        print("[cleanup] done")

    print("\nQuery with:")
    print(
        "python .\\salad_batch_eval.py "
        "--dataset europe-easy --index ivfflat --nprobe 32 --top-k 5"
    )


if __name__ == "__main__":
    main()
