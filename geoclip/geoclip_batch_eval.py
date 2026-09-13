r"""Batch evaluation for GeoCLIP on the project's static starting images.

Expected repository layout:

repo/
├─ geoclip/
│  ├─ .venv/
│  └─ geoclip_batch_eval.py   <- put this file here
└─ demo_and_extension/
   └─ data/
      ├─ competitions/europe-easy.json
      └─ starting-images/europe-easy/loc_001.png ...

Run from repo\geoclip with the existing virtual environment:

    .\.venv\Scripts\python.exe geoclip_batch_eval.py

Optional examples:

    .\.venv\Scripts\python.exe geoclip_batch_eval.py --limit 10
    .\.venv\Scripts\python.exe geoclip_batch_eval.py --dataset europe-medium
    .\.venv\Scripts\python.exe geoclip_batch_eval.py --top-k 5

The script deliberately derives ground-truth latitude/longitude from each
location's google_maps_link. No duplicate lat/lon fields need to be maintained.
"""

from __future__ import annotations

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

# Hugging Face uses its normal cache location by default.
# If desired, set HF_HOME in the shell before running this script.

import torch
from geoclip import GeoCLIP
from geopy.distance import geodesic
from PIL import Image


# GeoCLIP's standard geolocation evaluation thresholds, in kilometers.
DISTANCE_THRESHOLDS_KM = (1, 25, 200, 750, 2500)
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}

# Example: https://www.google.com/maps/@48.8521298,2.3696389,3a,...
GOOGLE_MAPS_COORD_RE = re.compile(
    r"/maps/@(?P<lat>[+-]?(?:\d+(?:\.\d*)?|\.\d+)),"
    r"(?P<lon>[+-]?(?:\d+(?:\.\d*)?|\.\d+))"
)


def parse_args() -> argparse.Namespace:
    script_dir = Path(__file__).resolve().parent
    default_demo_root = script_dir.parent / "demo_and_extension"

    parser = argparse.ArgumentParser(
        description="Run GeoCLIP on static starting images and calculate geolocation metrics."
    )
    parser.add_argument(
        "--dataset",
        default="europe-easy",
        help="Dataset/competition id. Default: europe-easy",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=5,
        help="Number of GeoCLIP candidate coordinates to keep per image. Default: 5",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Optional maximum number of images to evaluate. Default: all found images",
    )
    parser.add_argument(
        "--demo-root",
        type=Path,
        default=default_demo_root,
        help=f"Path to demo_and_extension. Default: {default_demo_root}",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=script_dir / "results",
        help="Directory for CSV/JSON outputs. Default: geoclip/results",
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
        raise ValueError(f"Could not extract coordinates from Google Maps link: {google_maps_link}")
    return float(match.group("lat")), float(match.group("lon"))


def load_ground_truth(competition_path: Path) -> dict[str, dict[str, Any]]:
    with competition_path.open("r", encoding="utf-8") as f:
        competition = json.load(f)

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
        path
        for path in image_dir.iterdir()
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    )
    if limit is not None:
        images = images[:limit]
    return images

def repo_relative_path(path: Path) -> str:
    """Return a portable path relative to the repository root."""
    repo_root = Path(__file__).resolve().parent.parent
    absolute_path = path.resolve()

    try:
        relative_path = absolute_path.relative_to(repo_root)
    except ValueError:
        relative_path = Path(os.path.relpath(absolute_path, repo_root))

    return relative_path.as_posix()

def distance_km(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    # geopy.geodesic matches the distance style used by GeoCLIP's evaluation code.
    return float(geodesic((a_lat, a_lon), (b_lat, b_lon)).km)


def population_std(values: list[float]) -> float:
    return statistics.pstdev(values) if len(values) > 1 else 0.0


def rmse(values: list[float]) -> float:
    return math.sqrt(sum(v * v for v in values) / len(values))


def percent_within(values: list[float], threshold_km: float) -> float:
    return 100.0 * sum(v <= threshold_km for v in values) / len(values)


def round_float(value: float, digits: int = 6) -> float:
    return round(float(value), digits)


@torch.inference_mode()
def predict_preloaded_image(
    model: GeoCLIP,
    image: Image.Image,
    top_k: int,
):
    """Match GeoCLIP.predict while keeping image disk I/O outside timing."""
    image_tensor = model.image_encoder.preprocess_image(image)
    image_tensor = image_tensor.to(model.device)
    gps_gallery = model.gps_gallery.to(model.device)

    logits_per_image = model.forward(image_tensor, gps_gallery)
    probs_per_image = logits_per_image.softmax(dim=-1).cpu()
    top_pred = torch.topk(probs_per_image, top_k, dim=1)

    top_pred_gps = model.gps_gallery[top_pred.indices[0]]
    top_pred_prob = top_pred.values[0]
    return top_pred_gps, top_pred_prob


def evaluate_one_image(
    model: GeoCLIP,
    image_path: Path,
    truth: dict[str, Any],
    top_k: int,
) -> dict[str, Any]:
    # Disk decoding is deliberately outside inference_seconds so the timing
    # matches PLONK, SALAD, and ChipointV2. Preprocessing remains timed.
    with Image.open(image_path) as opened:
        image = opened.convert("RGB").copy()

    start = time.perf_counter()
    top_gps, top_probs = predict_preloaded_image(model, image, top_k)
    inference_seconds = time.perf_counter() - start

    top_gps = top_gps.detach().cpu()
    top_probs = top_probs.detach().cpu()

    candidates: list[dict[str, Any]] = []
    for rank, (gps, prob) in enumerate(zip(top_gps, top_probs), start=1):
        pred_lat, pred_lon = (float(x) for x in gps.tolist())
        score = float(prob.item())
        error = distance_km(
            truth["lat"],
            truth["lon"],
            pred_lat,
            pred_lon,
        )
        candidates.append(
            {
                "rank": rank,
                "lat": pred_lat,
                "lon": pred_lon,
                "score": score,
                "error_km": error,
            }
        )

    top1 = candidates[0]
    best_candidate = min(candidates, key=lambda item: item["error_km"])

    return {
        "location_id": image_path.stem,
        "image": repo_relative_path(image_path),
        "ground_truth": truth,
        "top1": top1,
        "topk_best": best_candidate,
        "inference_seconds": inference_seconds,
        "candidates": candidates,
    }

def build_summary(results: list[dict[str, Any]], dataset: str, model_load_seconds: float) -> dict[str, Any]:
    top1_errors = [float(r["top1"]["error_km"]) for r in results]
    topk_errors = [float(r["topk_best"]["error_km"]) for r in results]
    inference_times = [float(r["inference_seconds"]) for r in results]

    best = min(results, key=lambda r: r["top1"]["error_km"])
    worst = max(results, key=lambda r: r["top1"]["error_km"])

    threshold_accuracy = {
        f"within_{threshold}_km_percent": round_float(percent_within(top1_errors, threshold), 3)
        for threshold in DISTANCE_THRESHOLDS_KM
    }
    topk_threshold_accuracy = {
        f"within_{threshold}_km_percent": round_float(percent_within(topk_errors, threshold), 3)
        for threshold in DISTANCE_THRESHOLDS_KM
    }

    return {
        "dataset": dataset,
        "model": "GeoCLIP",
        "device": "cpu",
        "n_images": len(results),
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "distance_unit": "km",
        "top1_error": {
            "mean_km": round_float(statistics.mean(top1_errors), 3),
            "median_km": round_float(statistics.median(top1_errors), 3),
            "std_km": round_float(population_std(top1_errors), 3),
            "rmse_km": round_float(rmse(top1_errors), 3),
            "min_km": round_float(min(top1_errors), 3),
            "max_km": round_float(max(top1_errors), 3),
        },
        "top1_threshold_accuracy": threshold_accuracy,
        # This is an oracle diagnostic: it asks whether ANY of the retained top-k
        # candidates is close to ground truth. Do not compare it directly with
        # standard top-1 GeoCLIP benchmark accuracy.
        "topk_oracle": {
            "mean_best_candidate_error_km": round_float(statistics.mean(topk_errors), 3),
            "median_best_candidate_error_km": round_float(statistics.median(topk_errors), 3),
            "threshold_accuracy": topk_threshold_accuracy,
        },
        "best_top1_case": {
            "location_id": best["location_id"],
            "city_or_region": best["ground_truth"].get("city_or_region"),
            "error_km": round_float(best["top1"]["error_km"], 3),
        },
        "worst_top1_case": {
            "location_id": worst["location_id"],
            "city_or_region": worst["ground_truth"].get("city_or_region"),
            "error_km": round_float(worst["top1"]["error_km"], 3),
        },
        "timing": {
            "definition": (
                "Warm per-image inference after one-time model loading; includes "
                "preprocessing, model forward pass, gallery scoring and top-k "
                "prediction; excludes image disk decoding and evaluation metrics."
            ),
            "model_load_seconds": round_float(model_load_seconds, 3),
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
        "top1_score",
        "top1_error_km",
        "topk_best_rank",
        "topk_best_error_km",
        "inference_seconds",
        "image",
    ]

    with path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for result in results:
            truth = result["ground_truth"]
            top1 = result["top1"]
            best = result["topk_best"]
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
                    "top1_score": f'{top1["score"]:.10f}',
                    "top1_error_km": f'{top1["error_km"]:.3f}',
                    "topk_best_rank": best["rank"],
                    "topk_best_error_km": f'{best["error_km"]:.3f}',
                    "inference_seconds": f'{result["inference_seconds"]:.3f}',
                    "image": result["image"],
                }
            )


def json_ready_results(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cleaned: list[dict[str, Any]] = []
    for result in results:
        cleaned.append(
            {
                **result,
                "inference_seconds": round_float(result["inference_seconds"], 6),
                "top1": {
                    **result["top1"],
                    "lat": round_float(result["top1"]["lat"], 7),
                    "lon": round_float(result["top1"]["lon"], 7),
                    "score": round_float(result["top1"]["score"], 10),
                    "error_km": round_float(result["top1"]["error_km"], 6),
                },
                "topk_best": {
                    **result["topk_best"],
                    "lat": round_float(result["topk_best"]["lat"], 7),
                    "lon": round_float(result["topk_best"]["lon"], 7),
                    "score": round_float(result["topk_best"]["score"], 10),
                    "error_km": round_float(result["topk_best"]["error_km"], 6),
                },
                "candidates": [
                    {
                        **candidate,
                        "lat": round_float(candidate["lat"], 7),
                        "lon": round_float(candidate["lon"], 7),
                        "score": round_float(candidate["score"], 10),
                        "error_km": round_float(candidate["error_km"], 6),
                    }
                    for candidate in result["candidates"]
                ],
            }
        )
    return cleaned


def print_summary(summary: dict[str, Any]) -> None:
    error = summary["top1_error"]
    timing = summary["timing"]

    print("\n" + "=" * 72)
    print("GeoCLIP STATIC EVALUATION SUMMARY")
    print("=" * 72)
    print(f'Dataset:                 {summary["dataset"]}')
    print(f'Images evaluated:        {summary["n_images"]}')
    print()
    print("Top-1 geodesic error:")
    print(f'  Mean:                   {error["mean_km"]:.3f} km')
    print(f'  Median:                 {error["median_km"]:.3f} km')
    print(f'  Std (population):       {error["std_km"]:.3f} km')
    print(f'  RMSE:                   {error["rmse_km"]:.3f} km')
    print(f'  Best / minimum:         {error["min_km"]:.3f} km')
    print(f'  Worst / maximum:        {error["max_km"]:.3f} km')
    print()
    print("Standard GeoCLIP distance-threshold accuracy:")
    for threshold in DISTANCE_THRESHOLDS_KM:
        value = summary["top1_threshold_accuracy"][f"within_{threshold}_km_percent"]
        print(f"  <= {threshold:4d} km:             {value:7.2f}%")
    print()
    print("Best top-1 case:")
    best = summary["best_top1_case"]
    print(f'  {best["location_id"]} | {best["city_or_region"]} | {best["error_km"]:.3f} km')
    print("Worst top-1 case:")
    worst = summary["worst_top1_case"]
    print(f'  {worst["location_id"]} | {worst["city_or_region"]} | {worst["error_km"]:.3f} km')
    print()
    print("Timing:")
    print(f'  Model load:             {timing["model_load_seconds"]:.3f} s')
    print(f'  Mean inference/image:   {timing["mean_inference_seconds"]:.3f} s')
    print(f'  Total inference:        {timing["total_inference_seconds"]:.3f} s')
    print("=" * 72)


def main() -> None:
    args = parse_args()

    if args.top_k < 1:
        raise ValueError("--top-k must be at least 1")
    if args.limit is not None and args.limit < 1:
        raise ValueError("--limit must be at least 1")

    demo_root = args.demo_root.resolve()
    competition_path = demo_root / "data" / "competitions" / f"{args.dataset}.json"
    if args.images_root is None:
        images_root = demo_root / "data" / "starting-images"
    else:
        images_root = args.images_root.resolve()

    image_dir = images_root / args.dataset
    output_dir = args.output_dir.resolve()

    print(f"Using device: cpu")
    print(f"PyTorch version: {torch.__version__}")
    print(f"HF_HOME: {os.environ.get('HF_HOME')}")
    print(f"Competition: {competition_path}")
    print(f"Images:      {image_dir}")

    if not competition_path.exists():
        print(f"\nERROR: Competition file not found:\n{competition_path}")
        sys.exit(1)
    if not image_dir.exists():
        print(f"\nERROR: Starting-image directory not found:\n{image_dir}")
        sys.exit(1)

    ground_truth = load_ground_truth(competition_path)
    images = find_images(image_dir, args.limit)

    if not images:
        print(f"\nERROR: No starting images found in:\n{image_dir}")
        sys.exit(1)

    missing_ground_truth = [image.stem for image in images if image.stem not in ground_truth]
    if missing_ground_truth:
        print("\nERROR: These images have no matching location id in the competition JSON:")
        for location_id in missing_ground_truth:
            print(f"  - {location_id}")
        sys.exit(1)

    print(f"\nFound {len(images)} image(s) to evaluate.")
    if args.limit is None:
        print("No limit specified: evaluating all available images.")
    else:
        print(f"Limit: {args.limit}")

    device = torch.device("cpu")

    try:
        print("\nLoading GeoCLIP model...")
        model_load_start = time.perf_counter()
        model = GeoCLIP()
        model = model.to(device)
        model.eval()
        model_load_seconds = time.perf_counter() - model_load_start
        print(f"GeoCLIP loaded successfully in {model_load_seconds:.2f} s.")

        # One unmeasured warm-up avoids charging first-use framework/kernel
        # initialization to the first benchmark location.
        with Image.open(images[0]) as opened:
            warmup_image = opened.convert("RGB").copy()
        _warmup_gps, _warmup_probs = predict_preloaded_image(
            model,
            warmup_image,
            args.top_k,
        )
        del _warmup_gps, _warmup_probs, warmup_image
        print("GeoCLIP warm-up complete (not included in inference_seconds).")

        results: list[dict[str, Any]] = []

        for index, image_path in enumerate(images, start=1):
            truth = ground_truth[image_path.stem]
            label = truth.get("city_or_region") or image_path.stem
            print(f"\n[{index}/{len(images)}] {image_path.name} | {label}")

            result = evaluate_one_image(
                model=model,
                image_path=image_path,
                truth=truth,
                top_k=args.top_k,
            )
            results.append(result)

            top1 = result["top1"]
            best = result["topk_best"]
            print(
                f'  Top-1: lat={top1["lat"]:.6f}, lon={top1["lon"]:.6f}, '
                f'error={top1["error_km"]:.2f} km, score={top1["score"]:.8f}'
            )
            if args.top_k > 1:
                print(
                    f'  Best of top-{args.top_k}: rank={best["rank"]}, '
                    f'error={best["error_km"]:.2f} km'
                )
            print(f'  Inference time: {result["inference_seconds"]:.2f} s')

        summary = build_summary(results, args.dataset, model_load_seconds)
        print_summary(summary)

        output_dir.mkdir(parents=True, exist_ok=True)
        base_name = f"geoclip_static_{args.dataset}"
        csv_path = output_dir / f"{base_name}.csv"
        details_path = output_dir / f"{base_name}_details.json"
        summary_path = output_dir / f"{base_name}_summary.json"

        write_csv(csv_path, results)
        with details_path.open("w", encoding="utf-8") as f:
            json.dump(json_ready_results(results), f, ensure_ascii=False, indent=2)
        with summary_path.open("w", encoding="utf-8") as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)

        print("\nSaved results:")
        print(f"  CSV:     {csv_path}")
        print(f"  Details: {details_path}")
        print(f"  Summary: {summary_path}")

    except KeyboardInterrupt:
        print("\nStopped by user.")
        sys.exit(130)
    except MemoryError:
        print("\nERROR: The process ran out of system RAM.")
        print("GeoCLIP can be memory-intensive even when running on CPU.")
        sys.exit(1)
    except Exception as exc:
        print("\nGeoCLIP batch evaluation failed.")
        print(f"Error type: {type(exc).__name__}")
        print(f"Error message: {exc}")
        raise


if __name__ == "__main__":
    main()
