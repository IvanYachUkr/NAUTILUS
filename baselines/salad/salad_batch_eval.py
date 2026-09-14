#!/usr/bin/env python3
r"""
Batch evaluation for SALAD + OSV-5M retrieval.

Maintained search modes:
- fp32: exact exhaustive search over every FP32 reference shard.
- ivfflat: persistent FAISS IndexIVFFlat over the same raw FP32 vectors.

IVF-Flat does not compress the SALAD descriptors. It accelerates retrieval by
probing only a configurable number of coarse inverted lists.

Predictions keep the original batched-search path. For comparable runtime
measurement, the script also performs one warmed independent search per query
and writes descriptor + independent-search latency as inference_seconds.
One-time model/index loading and image disk decoding are excluded.

Examples:
    .\.venv\Scripts\python.exe salad_batch_eval.py --dataset europe-easy --index ivfflat --nprobe 32 --top-k 5
    .\.venv\Scripts\python.exe salad_batch_eval.py --dataset europe-easy --index fp32 --top-k 5
"""

from __future__ import annotations

from pathlib import Path
import os

SCRIPT_DIR = Path(__file__).resolve().parent
os.environ.setdefault("TORCH_HOME", str(SCRIPT_DIR / ".torch_cache"))

import argparse
import csv
import json
import math
import os
import re
import statistics
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import torch
from geopy.distance import geodesic
from PIL import Image
from torchvision import transforms

try:
    import faiss
except ImportError as exc:
    raise SystemExit(
        "FAISS is required. Activate baselines/salad/.venv and install faiss-cpu."
    ) from exc


DISTANCE_THRESHOLDS_KM = (1, 25, 200, 750, 2500)
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
DESCRIPTOR_DIM = 8448
IMAGE_SIZE = (322, 322)

INDEX_CHOICES = ("fp32", "ivfflat")

GOOGLE_MAPS_COORD_RE = re.compile(
    r"/maps/@(?P<lat>[+-]?(?:\d+(?:\.\d*)?|\.\d+)),"
    r"(?P<lon>[+-]?(?:\d+(?:\.\d*)?|\.\d+))"
)


def parse_args() -> argparse.Namespace:
    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parents[1]
    default_demo_root = repo_root / "demo_and_extension"

    parser = argparse.ArgumentParser(
        description="Run SALAD + OSV-5M retrieval and calculate geolocation metrics."
    )
    parser.add_argument(
        "--dataset",
        default="europe-easy",
        help="Dataset/competition id. Default: europe-easy",
    )
    parser.add_argument(
        "--index",
        choices=INDEX_CHOICES,
        default="fp32",
        help="Reference representation/index. Default: fp32",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=5,
        help="Number of nearest OSV-5M references to retain. Default: 5",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Optional maximum number of images to evaluate.",
    )
    parser.add_argument(
        "--device",
        default="cuda" if torch.cuda.is_available() else "cpu",
        choices=["cuda", "cpu"],
        help="Device used to compute SALAD query descriptors.",
    )
    parser.add_argument(
        "--demo-root",
        type=Path,
        default=default_demo_root,
        help=f"Path to demo_and_extension. Default: {default_demo_root}",
    )
    parser.add_argument(
        "--master-dir",
        type=Path,
        default=script_dir / "osv-5m_europe" / "salad_embeddings_fp32",
        help="Float32 master embedding directory.",
    )
    parser.add_argument(
        "--ivf-dir",
        type=Path,
        default=script_dir / "osv-5m_europe" / "salad_ivfflat",
        help="Directory containing the Windows-safe IVF files.",
    )
    parser.add_argument(
        "--nprobe",
        type=int,
        default=64,
        help=(
            "Number of IVF coarse lists to search. Higher is slower and "
            "closer to exact FP32 retrieval. Default: 64."
        ),
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=script_dir / "results",
        help="Output directory. Default: baselines/salad/results",
    )
    parser.add_argument(
        "--images-root",
        type=Path,
        default=None,
        help=(
            "Root directory containing the dataset image folders "
            "(e.g. europe-easy). "
            "Default: <demo-root>/data/starting-images"
        ),
    )
    return parser.parse_args()


def extract_coordinates(google_maps_link: str) -> tuple[float, float]:
    match = GOOGLE_MAPS_COORD_RE.search(google_maps_link)
    if not match:
        raise ValueError(
            f"Could not extract coordinates from Google Maps link: {google_maps_link}"
        )
    return float(match.group("lat")), float(match.group("lon"))


def load_ground_truth(competition_path: Path) -> dict[str, dict[str, Any]]:
    competition = json.loads(competition_path.read_text(encoding="utf-8"))

    ground_truth: dict[str, dict[str, Any]] = {}
    for location in competition.get("locations", []):
        location_id = location["id"]
        lat, lon = extract_coordinates(location["google_maps_link"])
        ground_truth[location_id] = {
            "lat": lat,
            "lon": lon,
            "country": location.get("country"),
            "city_or_region": location.get("city_or_region"),
            "difficulty": location.get("difficulty"),
            "primary_clue_type": location.get("primary_clue_type"),
        }

    if not ground_truth:
        raise ValueError(f"No locations found in {competition_path}")

    return ground_truth


def find_images(image_dir: Path, limit: int | None) -> list[Path]:
    images = sorted(
        p for p in image_dir.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    )
    if limit is not None:
        images = images[:limit]
    return images


def repo_relative_path(path: Path) -> str:
    repo_root = Path(__file__).resolve().parents[2]
    absolute_path = path.resolve()
    try:
        relative_path = absolute_path.relative_to(repo_root)
    except ValueError:
        relative_path = Path(os.path.relpath(absolute_path, repo_root))
    return relative_path.as_posix()


def distance_km(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    return float(geodesic((a_lat, a_lon), (b_lat, b_lon)).km)


def population_std(values: list[float]) -> float:
    return statistics.pstdev(values) if len(values) > 1 else 0.0


def rmse(values: list[float]) -> float:
    return math.sqrt(sum(v * v for v in values) / len(values))


def percent_within(values: list[float], threshold_km: float) -> float:
    return 100.0 * sum(v <= threshold_km for v in values) / len(values)


def round_float(value: float, digits: int = 6) -> float:
    return round(float(value), digits)


def make_transform():
    return transforms.Compose(
        [
            transforms.Resize(
                IMAGE_SIZE,
                interpolation=transforms.InterpolationMode.BILINEAR,
            ),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ]
    )


def load_salad(device: str):
    model = torch.hub.load(
        "serizba/salad",
        "dinov2_salad",
        trust_repo=True,
    )
    return model.eval().to(device)


def synchronize_device(device: str) -> None:
    if device == "cuda" and torch.cuda.is_available():
        torch.cuda.synchronize()


def embed_preloaded_image(
    model,
    transform,
    image: Image.Image,
    device: str,
) -> np.ndarray:
    # Image disk decoding is intentionally outside inference timing.
    tensor = transform(image).unsqueeze(0).to(device)

    with torch.inference_mode():
        descriptor = model(tensor)

    if isinstance(descriptor, (tuple, list)):
        descriptor = descriptor[0]

    if descriptor.ndim != 2 or descriptor.shape != (1, DESCRIPTOR_DIM):
        raise RuntimeError(
            f"Unexpected SALAD output shape {tuple(descriptor.shape)}; "
            f"expected (1, {DESCRIPTOR_DIM})"
        )

    return descriptor.detach().float().cpu().numpy().astype(np.float32, copy=False)


def embed_images(model, transform, image_paths: list[Path], device: str):
    descriptors = []
    descriptor_seconds = []
    measured_total = 0.0

    for idx, image_path in enumerate(image_paths, start=1):
        # Keep filesystem/image decoding out of inference_seconds.
        with Image.open(image_path) as opened:
            image = opened.convert("RGB").copy()

        synchronize_device(device)
        start = time.perf_counter()
        descriptor = embed_preloaded_image(model, transform, image, device)
        synchronize_device(device)
        elapsed = time.perf_counter() - start

        descriptors.append(descriptor[0])
        descriptor_seconds.append(elapsed)
        measured_total += elapsed
        print(f"[embed {idx}/{len(image_paths)}] {image_path.name} ({elapsed:.2f} s)")

    queries = np.stack(descriptors, axis=0).astype(np.float32, copy=False)
    return queries, descriptor_seconds, measured_total

def embedding_shards(master_dir: Path) -> list[Path]:
    shards = sorted(master_dir.glob("embeddings_*.npy"))
    if not shards:
        raise FileNotFoundError(f"No embeddings_*.npy found in {master_dir}")
    return shards


def shard_row_start(shard: Path) -> int:
    info_path = shard.with_suffix(".json")
    if not info_path.exists():
        raise FileNotFoundError(info_path)
    info = json.loads(info_path.read_text(encoding="utf-8"))
    return int(info["row_start"])


def merge_topk(
    best_distances: np.ndarray,
    best_indices: np.ndarray,
    new_distances: np.ndarray,
    new_indices: np.ndarray,
    k: int,
) -> tuple[np.ndarray, np.ndarray]:
    distances = np.concatenate([best_distances, new_distances], axis=1)
    indices = np.concatenate([best_indices, new_indices], axis=1)

    selected = np.argpartition(distances, kth=k - 1, axis=1)[:, :k]
    rows = np.arange(distances.shape[0])[:, None]

    distances = distances[rows, selected]
    indices = indices[rows, selected]

    ordering = np.argsort(distances, axis=1)
    return distances[rows, ordering], indices[rows, ordering]


class FP32ShardedSearcher:
    def __init__(self, master_dir: Path):
        self.shards = embedding_shards(master_dir)

    def search(
        self,
        query: np.ndarray,
        k: int,
        verbose: bool = True,
    ) -> tuple[np.ndarray, np.ndarray]:
        best_distances = np.full((len(query), k), np.inf, dtype=np.float32)
        best_indices = np.full((len(query), k), -1, dtype=np.int64)

        for shard_no, shard in enumerate(self.shards, start=1):
            if verbose:
                print(
                    f"[search fp32] shard {shard_no}/{len(self.shards)} "
                    f"for {len(query)} queries"
                )
            reference = np.load(shard, mmap_mode="r")
            if reference.shape[1] != DESCRIPTOR_DIM:
                raise RuntimeError(
                    f"Unexpected descriptor dimension in {shard}: {reference.shape}"
                )

            index = faiss.IndexFlatL2(DESCRIPTOR_DIM)
            index.add(np.asarray(reference, dtype=np.float32))
            distances, indices = index.search(query, k)

            indices = indices.astype(np.int64) + shard_row_start(shard)
            best_distances, best_indices = merge_topk(
                best_distances,
                best_indices,
                distances,
                indices,
                k,
            )

            del index, reference

        return best_distances, best_indices



class IVFFlatSearcher:
    """Windows-safe disk-backed IVF-Flat search over raw FP32 vectors."""

    def __init__(self, ivf_dir: Path, nprobe: int):
        info_path = ivf_dir / "index_info.json"
        if not info_path.exists():
            raise FileNotFoundError(
                f"IVF metadata not found: {info_path}\n"
                "Build it first with build_salad_ivfflat_index.py."
            )

        self.info = json.loads(info_path.read_text(encoding="utf-8"))
        if self.info.get("format") != "windows_safe_ivfflat_v1":
            raise RuntimeError(
                "Unsupported IVF format. Expected windows_safe_ivfflat_v1."
            )

        self.nlist = int(self.info["nlist"])
        self.ntotal = int(self.info["ntotal"])
        self.dimension = int(self.info["dimension"])
        if self.dimension != DESCRIPTOR_DIM:
            raise RuntimeError(
                f"IVF descriptor dimension mismatch: {self.dimension}"
            )
        if not (1 <= nprobe <= self.nlist):
            raise ValueError(
                f"--nprobe must be in [1, {self.nlist}], got {nprobe}"
            )
        self.nprobe = int(nprobe)

        self.centroids = np.load(ivf_dir / "centroids.npy")
        self.offsets = np.load(ivf_dir / "offsets.npy")
        if self.centroids.shape != (self.nlist, DESCRIPTOR_DIM):
            raise RuntimeError(
                f"Unexpected centroids shape: {self.centroids.shape}"
            )
        if self.offsets.shape != (self.nlist + 1,):
            raise RuntimeError(
                f"Unexpected offsets shape: {self.offsets.shape}"
            )

        self.ids = np.memmap(
            ivf_dir / "ids.dat",
            mode="r",
            dtype=np.int64,
            shape=(self.ntotal,),
        )
        self.vectors = np.memmap(
            ivf_dir / "vectors.dat",
            mode="r",
            dtype=np.float32,
            shape=(self.ntotal, DESCRIPTOR_DIM),
        )

        self.coarse = faiss.IndexFlatL2(DESCRIPTOR_DIM)
        self.coarse.add(np.asarray(self.centroids, dtype=np.float32))

    def search(
        self,
        query: np.ndarray,
        k: int,
        verbose: bool = True,
    ):
        nquery = len(query)
        best_d = np.full((nquery, k), np.inf, dtype=np.float32)
        best_i = np.full((nquery, k), -1, dtype=np.int64)

        _, probed = self.coarse.search(query, self.nprobe)

        list_to_queries: dict[int, list[int]] = {}
        for qi in range(nquery):
            for list_no in probed[qi]:
                list_to_queries.setdefault(int(list_no), []).append(qi)

        selected_lists = sorted(list_to_queries)
        total_rows = sum(
            int(self.offsets[l + 1] - self.offsets[l])
            for l in selected_lists
        )
        if verbose:
            print(
                f"[search ivfflat] {nquery} queries, nprobe={self.nprobe}, "
                f"{len(selected_lists)} unique lists, {total_rows:,} rows "
                f"across selected lists"
            )

        for pos, list_no in enumerate(selected_lists, start=1):
            start = int(self.offsets[list_no])
            end = int(self.offsets[list_no + 1])
            if end <= start:
                continue

            q_ids = np.asarray(list_to_queries[list_no], dtype=np.int64)
            refs = np.asarray(self.vectors[start:end], dtype=np.float32)
            global_ids = np.asarray(self.ids[start:end], dtype=np.int64)

            local = faiss.IndexFlatL2(DESCRIPTOR_DIM)
            local.add(refs)
            local_k = min(k, len(refs))
            d, local_i = local.search(query[q_ids], local_k)

            if local_k < k:
                pad = k - local_k
                d = np.pad(d, ((0, 0), (0, pad)), constant_values=np.inf)
                local_i = np.pad(
                    local_i,
                    ((0, 0), (0, pad)),
                    constant_values=-1,
                )

            mapped = np.full(local_i.shape, -1, dtype=np.int64)
            valid = local_i >= 0
            mapped[valid] = global_ids[local_i[valid]]

            new_d, new_i = merge_topk(
                best_d[q_ids],
                best_i[q_ids],
                d[:, :k],
                mapped[:, :k],
                k,
            )
            best_d[q_ids] = new_d
            best_i[q_ids] = new_i

            if verbose and (
                pos == 1 or pos % 25 == 0 or pos == len(selected_lists)
            ):
                print(
                    f"  [ivf list {pos}/{len(selected_lists)}] "
                    f"list={list_no}, rows={end-start:,}"
                )

            del local, refs, global_ids

        return best_d, best_i


def load_searcher(
    index_name: str,
    master_dir: Path,
    ivf_dir: Path,
    nprobe: int,
):
    if index_name == "fp32":
        return FP32ShardedSearcher(master_dir)
    if index_name == "ivfflat":
        return IVFFlatSearcher(ivf_dir, nprobe)
    raise ValueError(index_name)



def weighted_coordinate(candidates: list[dict[str, Any]]) -> tuple[float, float]:
    weights = np.asarray(
        [1.0 / (float(c["distance"]) + 1e-12) for c in candidates],
        dtype=np.float64,
    )
    weights /= weights.sum()

    lat = float(
        np.sum(weights * np.asarray([c["lat"] for c in candidates], dtype=np.float64))
    )
    lon = float(
        np.sum(weights * np.asarray([c["lon"] for c in candidates], dtype=np.float64))
    )
    return lat, lon


def build_result_from_retrieval(
    reference: pd.DataFrame,
    image_path: Path,
    truth: dict[str, Any],
    distances_row: np.ndarray,
    indices_row: np.ndarray,
    descriptor_seconds: float,
    search_seconds: float,
) -> dict[str, Any]:
    candidates: list[dict[str, Any]] = []
    for rank, (retrieval_distance, row_id) in enumerate(zip(distances_row, indices_row), start=1):
        if int(row_id) < 0:
            continue
        ref = reference.iloc[int(row_id)]
        pred_lat = float(ref["latitude"])
        pred_lon = float(ref["longitude"])
        error = distance_km(truth["lat"], truth["lon"], pred_lat, pred_lon)
        candidates.append({
            "rank": rank,
            "reference_row_id": int(row_id),
            "reference_id": str(ref["id"]),
            "reference_split": str(ref["split"]),
            "lat": pred_lat,
            "lon": pred_lon,
            "distance": float(retrieval_distance),
            "error_km": error,
        })
    if not candidates:
        raise RuntimeError("No retrieval candidates returned.")
    top1 = candidates[0]
    oracle = min(candidates, key=lambda c: c["error_km"])
    mean_lat = float(np.mean([c["lat"] for c in candidates]))
    mean_lon = float(np.mean([c["lon"] for c in candidates]))
    mean_error = distance_km(truth["lat"], truth["lon"], mean_lat, mean_lon)
    weighted_lat, weighted_lon = weighted_coordinate(candidates)
    weighted_error = distance_km(truth["lat"], truth["lon"], weighted_lat, weighted_lon)
    return {
        "location_id": image_path.stem,
        "image": repo_relative_path(image_path),
        "ground_truth": truth,
        "top1": top1,
        "topk_mean": {"lat": mean_lat, "lon": mean_lon, "error_km": mean_error},
        "topk_weighted": {"lat": weighted_lat, "lon": weighted_lon, "error_km": weighted_error},
        "topk_oracle": oracle,
        "descriptor_seconds": descriptor_seconds,
        "search_seconds": search_seconds,
        "inference_seconds": descriptor_seconds + search_seconds,
        "candidates": candidates,
    }

def error_summary(values: list[float]) -> dict[str, Any]:
    return {
        "mean_km": round_float(statistics.mean(values), 3),
        "median_km": round_float(statistics.median(values), 3),
        "std_km": round_float(population_std(values), 3),
        "rmse_km": round_float(rmse(values), 3),
        "min_km": round_float(min(values), 3),
        "max_km": round_float(max(values), 3),
        "threshold_accuracy": {
            f"within_{threshold}_km_percent": round_float(
                percent_within(values, threshold), 3
            )
            for threshold in DISTANCE_THRESHOLDS_KM
        },
    }


def build_summary(
    results: list[dict[str, Any]],
    dataset: str,
    index_name: str,
    device: str,
    model_load_seconds: float,
    index_load_seconds: float,
    batched_prediction_search_seconds: float,
) -> dict[str, Any]:
    top1_errors = [float(r["top1"]["error_km"]) for r in results]
    mean_errors = [float(r["topk_mean"]["error_km"]) for r in results]
    weighted_errors = [float(r["topk_weighted"]["error_km"]) for r in results]
    oracle_errors = [float(r["topk_oracle"]["error_km"]) for r in results]

    descriptor_times = [float(r["descriptor_seconds"]) for r in results]
    search_times = [float(r["search_seconds"]) for r in results]
    inference_times = [float(r["inference_seconds"]) for r in results]

    return {
        "dataset": dataset,
        "model": "SALAD + OSV-5M",
        "index": index_name,
        "device": device,
        "n_images": len(results),
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "distance_unit": "km",
        "top1_error": error_summary(top1_errors),
        "topk_mean_error": error_summary(mean_errors),
        "topk_weighted_error": error_summary(weighted_errors),
        "topk_oracle_error": error_summary(oracle_errors),
        "timing": {
            "definition": (
                "Warm per-image inference after one-time model/index loading; "
                "includes descriptor preprocessing/forward pass and an independent "
                "retrieval search for that query; excludes image disk decoding, "
                "the separate batched prediction search, and evaluation metrics."
            ),
            "model_load_seconds": round_float(model_load_seconds, 3),
            "index_load_seconds": round_float(index_load_seconds, 3),
            "batched_prediction_search_seconds": round_float(
                batched_prediction_search_seconds, 3
            ),
            "mean_descriptor_seconds": round_float(statistics.mean(descriptor_times), 3),
            "median_descriptor_seconds": round_float(statistics.median(descriptor_times), 3),
            "mean_search_seconds": round_float(statistics.mean(search_times), 3),
            "median_search_seconds": round_float(statistics.median(search_times), 3),
            "mean_inference_seconds": round_float(statistics.mean(inference_times), 3),
            "median_inference_seconds": round_float(statistics.median(inference_times), 3),
            "std_inference_seconds": round_float(population_std(inference_times), 3),
            "total_inference_seconds": round_float(sum(inference_times), 3),
        },
    }

def write_csv(path: Path, results: list[dict[str, Any]]) -> None:
    fieldnames = [
        "location_id",
        "country",
        "city_or_region",
        "difficulty",
        "primary_clue_type",
        "gt_lat",
        "gt_lon",
        "pred_lat",
        "pred_lon",
        "reference_id",
        "reference_split",
        "retrieval_distance",
        "top1_error_km",
        "topk_mean_error_km",
        "topk_weighted_error_km",
        "topk_oracle_rank",
        "topk_oracle_error_km",
        "descriptor_seconds",
        "search_seconds",
        "inference_seconds",
        "image",
    ]

    with path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for result in results:
            truth = result["ground_truth"]
            top1 = result["top1"]
            oracle = result["topk_oracle"]

            writer.writerow(
                {
                    "location_id": result["location_id"],
                    "country": truth.get("country"),
                    "city_or_region": truth.get("city_or_region"),
                    "difficulty": truth.get("difficulty"),
                    "primary_clue_type": truth.get("primary_clue_type"),
                    "gt_lat": f'{truth["lat"]:.7f}',
                    "gt_lon": f'{truth["lon"]:.7f}',
                    "pred_lat": f'{top1["lat"]:.7f}',
                    "pred_lon": f'{top1["lon"]:.7f}',
                    "reference_id": top1["reference_id"],
                    "reference_split": top1["reference_split"],
                    "retrieval_distance": f'{top1["distance"]:.8f}',
                    "top1_error_km": f'{top1["error_km"]:.3f}',
                    "topk_mean_error_km": f'{result["topk_mean"]["error_km"]:.3f}',
                    "topk_weighted_error_km": f'{result["topk_weighted"]["error_km"]:.3f}',
                    "topk_oracle_rank": oracle["rank"],
                    "topk_oracle_error_km": f'{oracle["error_km"]:.3f}',
                    "descriptor_seconds": f'{result["descriptor_seconds"]:.3f}',
                    "search_seconds": f'{result["search_seconds"]:.3f}',
                    "inference_seconds": f'{result["inference_seconds"]:.3f}',
                    "image": result["image"],
                }
            )


def print_error_block(label: str, block: dict[str, Any]) -> None:
    print(label)
    print(f'  Mean:                   {block["mean_km"]:.3f} km')
    print(f'  Median:                 {block["median_km"]:.3f} km')
    print(f'  Std (population):       {block["std_km"]:.3f} km')
    print(f'  RMSE:                   {block["rmse_km"]:.3f} km')

    for threshold in DISTANCE_THRESHOLDS_KM:
        value = block["threshold_accuracy"][f"within_{threshold}_km_percent"]
        print(f"  <= {threshold:4d} km:             {value:7.2f}%")


def print_summary(summary: dict[str, Any]) -> None:
    timing = summary["timing"]

    print("\n" + "=" * 72)
    print("SALAD + OSV-5M STATIC EVALUATION SUMMARY")
    print("=" * 72)
    print(f'Dataset:                 {summary["dataset"]}')
    print(f'Index:                   {summary["index"]}')
    print(f'Images evaluated:        {summary["n_images"]}')
    print()

    print_error_block("Top-1 geodesic error:", summary["top1_error"])
    print()
    print_error_block("Top-K mean coordinate:", summary["topk_mean_error"])
    print()
    print_error_block("Top-K inverse-L2 weighted coordinate:", summary["topk_weighted_error"])
    print()
    print_error_block("Top-K oracle diagnostic:", summary["topk_oracle_error"])

    print()
    print("Timing:")
    print(f'  Model load:             {timing["model_load_seconds"]:.3f} s')
    print(f'  Index load:             {timing["index_load_seconds"]:.3f} s')
    print(f'  Mean descriptor/image:  {timing["mean_descriptor_seconds"]:.3f} s')
    print(f'  Mean search/image:      {timing["mean_search_seconds"]:.3f} s')
    print(f'  Mean inference/image:   {timing["mean_inference_seconds"]:.3f} s')
    print(f'  Median inference/image: {timing["median_inference_seconds"]:.3f} s')
    print(f'  Total inference:        {timing["total_inference_seconds"]:.3f} s')
    print("=" * 72)


def main() -> None:
    args = parse_args()

    if args.top_k < 1:
        raise ValueError("--top-k must be at least 1")
    if args.limit is not None and args.limit < 1:
        raise ValueError("--limit must be at least 1")
    if args.nprobe < 1:
        raise ValueError("--nprobe must be at least 1")
    if args.device == "cuda" and not torch.cuda.is_available():
        raise RuntimeError(
            "CUDA requested, but torch.cuda.is_available() is False."
        )

    demo_root = args.demo_root.expanduser().resolve()
    competition_path = (
        demo_root / "data" / "competitions" / f"{args.dataset}.json"
    )
    if args.images_root is None:
        images_root = demo_root / "data" / "starting-images"
    else:
        images_root = args.images_root.expanduser().resolve()

    image_dir = images_root / args.dataset

    master_dir = args.master_dir.expanduser().resolve()
    ivf_dir = args.ivf_dir.expanduser().resolve()
    reference_csv = master_dir / "reference.csv"
    output_dir = args.output_dir.expanduser().resolve()

    print(f"Using device: {args.device}")
    print(f"PyTorch version: {torch.__version__}")
    print(f"Dataset:     {args.dataset}")
    print(f"Index:       {args.index}")
    print(f"Competition: {competition_path}")
    print(f"Images:      {image_dir}")
    print(f"Reference:   {reference_csv}")
    if args.index == "ivfflat":
        print(f"IVF dir:     {ivf_dir}")
        print(f"nprobe:      {args.nprobe}")

    if not competition_path.exists():
        raise FileNotFoundError(competition_path)
    if not image_dir.exists():
        raise FileNotFoundError(image_dir)
    if not reference_csv.exists():
        raise FileNotFoundError(reference_csv)

    ground_truth = load_ground_truth(competition_path)
    images = find_images(image_dir, args.limit)

    if not images:
        raise RuntimeError(f"No starting images found in {image_dir}")

    missing_ground_truth = [
        image.stem for image in images
        if image.stem not in ground_truth
    ]
    if missing_ground_truth:
        raise RuntimeError(
            "Images without matching ground truth: "
            + ", ".join(missing_ground_truth)
        )

    reference = pd.read_csv(reference_csv, low_memory=False)
    if "row_id" not in reference.columns:
        raise RuntimeError("reference.csv has no row_id column.")

    reference = reference.sort_values("row_id").reset_index(drop=True)

    print(f"\nReference images: {len(reference):,}")
    print(f"Images to evaluate: {len(images):,}")

    print("\nLoading SALAD model...")
    start = time.perf_counter()
    model = load_salad(args.device)
    transform = make_transform()
    model_load_seconds = time.perf_counter() - start
    print(f"SALAD loaded successfully in {model_load_seconds:.2f} s.")

    print(f"\nLoading search backend '{args.index}'...")
    start = time.perf_counter()
    searcher = load_searcher(
        index_name=args.index,
        master_dir=master_dir,
        ivf_dir=ivf_dir,
        nprobe=args.nprobe,
    )
    index_load_seconds = time.perf_counter() - start
    print(f"Search backend ready in {index_load_seconds:.2f} s.")
    if args.index == "ivfflat":
        if searcher.ntotal != len(reference):
            raise RuntimeError(
                f"IVF index has {searcher.ntotal:,} vectors but "
                f"reference.csv has {len(reference):,} rows."
            )
        print(
            f"IVF configuration: nlist={searcher.nlist:,}, "
            f"nprobe={searcher.nprobe:,}, ntotal={searcher.ntotal:,}"
        )

    # Warm the descriptor model once. The image is decoded before the warm-up,
    # matching the inference timing boundary used for all four static baselines.
    with Image.open(images[0]) as opened:
        warmup_image = opened.convert("RGB").copy()
    synchronize_device(args.device)
    _warmup_descriptor = embed_preloaded_image(
        model,
        transform,
        warmup_image,
        args.device,
    )
    synchronize_device(args.device)
    del _warmup_descriptor, warmup_image
    print("SALAD encoder warm-up complete (not included in inference_seconds).")

    results: list[dict[str, Any]] = []

    try:
        print("\nEmbedding all evaluation images...")
        queries, descriptor_times, descriptor_total_seconds = embed_images(
            model=model,
            transform=transform,
            image_paths=images,
            device=args.device,
        )
        print(f"Embedded {len(images)} image(s) in {descriptor_total_seconds:.2f} s.")

        print(f"\nSearching all {len(images)} queries together against '{args.index}' for predictions...")
        search_start = time.perf_counter()
        all_distances, all_indices = searcher.search(queries, args.top_k)
        batched_prediction_search_seconds = time.perf_counter() - search_start
        print(
            f"Batched prediction search finished in "
            f"{batched_prediction_search_seconds:.2f} s."
        )

        # Warm the search path once before per-image timing. The actual
        # predictions above remain the original batched-search predictions.
        _warmup_distances, _warmup_indices = searcher.search(
            queries[:1],
            args.top_k,
            verbose=False,
        )
        del _warmup_distances, _warmup_indices
        print("SALAD search warm-up complete (not included in inference_seconds).")

        individual_search_times: list[float] = []
        print("\nMeasuring independent per-image retrieval latency...")
        for query_index in range(len(images)):
            search_start = time.perf_counter()
            _timing_distances, _timing_indices = searcher.search(
                queries[query_index : query_index + 1],
                args.top_k,
                verbose=False,
            )
            search_elapsed = time.perf_counter() - search_start
            individual_search_times.append(search_elapsed)
            del _timing_distances, _timing_indices
            print(
                f"[search {query_index + 1}/{len(images)}] "
                f"{images[query_index].name} ({search_elapsed:.2f} s)"
            )

        for index, image_path in enumerate(images, start=1):
            truth = ground_truth[image_path.stem]
            label = truth.get("city_or_region") or image_path.stem
            result = build_result_from_retrieval(
                reference=reference,
                image_path=image_path,
                truth=truth,
                distances_row=all_distances[index - 1],
                indices_row=all_indices[index - 1],
                descriptor_seconds=descriptor_times[index - 1],
                search_seconds=individual_search_times[index - 1],
            )
            results.append(result)
            top1 = result["top1"]
            weighted = result["topk_weighted"]
            oracle = result["topk_oracle"]
            print(f"\n[{index}/{len(images)}] {image_path.name} | {label}")
            print(
                f'  Top-1: ref={top1["reference_id"]}, '
                f'lat={top1["lat"]:.6f}, lon={top1["lon"]:.6f}, '
                f'error={top1["error_km"]:.2f} km, '
                f'L2={top1["distance"]:.6f}'
            )
            if args.top_k > 1:
                print(f'  Weighted top-{args.top_k}: error={weighted["error_km"]:.2f} km')
                print(f'  Oracle top-{args.top_k}: rank={oracle["rank"]}, error={oracle["error_km"]:.2f} km')
            print(
                f'  Descriptor: {result["descriptor_seconds"]:.2f} s | '
                f'Search: {result["search_seconds"]:.2f} s | '
                f'Inference: {result["inference_seconds"]:.2f} s'
            )

    except KeyboardInterrupt:
        print("\nStopped by user.")
        sys.exit(130)

    summary = build_summary(
        results=results,
        dataset=args.dataset,
        index_name=args.index,
        device=args.device,
        model_load_seconds=model_load_seconds,
        index_load_seconds=index_load_seconds,
        batched_prediction_search_seconds=batched_prediction_search_seconds,
    )
    print_summary(summary)

    output_dir.mkdir(parents=True, exist_ok=True)

    if args.index == "ivfflat":
        base_name = f"salad_ivfflat_nprobe{args.nprobe}_{args.dataset}"
    else:
        base_name = f"salad_fp32_{args.dataset}"
    csv_path = output_dir / f"{base_name}.csv"
    details_path = output_dir / f"{base_name}_details.json"
    summary_path = output_dir / f"{base_name}_summary.json"

    write_csv(csv_path, results)

    details_path.write_text(
        json.dumps(results, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    summary_path.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print("\nSaved results:")
    print(f"  CSV:     {csv_path}")
    print(f"  Details: {details_path}")
    print(f"  Summary: {summary_path}")


if __name__ == "__main__":
    main()
