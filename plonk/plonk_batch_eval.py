r"""Batch evaluation for PLONK OSV-5M on the project's static starting images.

Expected repository layout:

repo/
├─ plonk/
│  ├─ .venv/
│  └─ plonk_batch_eval.py   <- put this file here
└─ demo_and_extension/
   └─ data/
      ├─ competitions/europe-easy.json
      └─ starting-images/europe-easy/loc_001.png ...

Run from repo\plonk with a Python 3.10 virtual environment:

    .\.venv\Scripts\python.exe plonk_batch_eval.py

Optional examples:

    .\.venv\Scripts\python.exe plonk_batch_eval.py --dataset europe-medium

The script deliberately derives ground-truth latitude/longitude from each
location's google_maps_link, exactly like the GeoCLIP evaluator.

Benchmark settings are fixed for reproducibility:
- checkpoint: nicolas-dufour/PLONK_OSV_5M
- device: CPU
- one generated coordinate per image
- base random seed: 42
- all other PLONK sampling settings use the pipeline defaults
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import os
import random
import re
import statistics
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import torch
from geopy.distance import geodesic
from PIL import Image
from plonk import PlonkPipeline


# Same distance thresholds used by the GeoCLIP evaluator.
DISTANCE_THRESHOLDS_KM = (1, 25, 200, 750, 2500)
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}

# Fixed benchmark configuration.
MODEL_NAME = "nicolas-dufour/PLONK_OSV_5M"
BASE_SEED = 42
SAMPLES_PER_IMAGE = 1

# Example: https://www.google.com/maps/@48.8521298,2.3696389,3a,...
GOOGLE_MAPS_COORD_RE = re.compile(
    r"/maps/@(?P<lat>[+-]?(?:\d+(?:\.\d*)?|\.\d+)),"
    r"(?P<lon>[+-]?(?:\d+(?:\.\d*)?|\.\d+))"
)


def parse_args() -> argparse.Namespace:
    script_dir = Path(__file__).resolve().parent
    default_demo_root = script_dir.parent / "demo_and_extension"

    parser = argparse.ArgumentParser(
        description="Run PLONK OSV-5M on static starting images and calculate geolocation metrics."
    )
    parser.add_argument(
        "--dataset",
        default="europe-easy",
        help="Dataset/competition id. Default: europe-easy",
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
        help="Directory for CSV/JSON outputs. Default: plonk/results",
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


def set_global_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed % (2**32))
    torch.manual_seed(seed)


def stable_sample_seed(base_seed: int, location_id: str) -> int:
    """Return a deterministic, order-independent seed for one location."""
    digest = hashlib.sha256(f"{base_seed}:{location_id}".encode("utf-8")).digest()
    derived = int.from_bytes(digest[:8], byteorder="little", signed=False)
    return derived & ((1 << 63) - 1)


def extract_coordinates(google_maps_link: str) -> tuple[float, float]:
    match = GOOGLE_MAPS_COORD_RE.search(google_maps_link)
    if not match:
        raise ValueError(
            f"Could not extract coordinates from Google Maps link: {google_maps_link}"
        )
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


def find_images(image_dir: Path) -> list[Path]:
    return sorted(
        path
        for path in image_dir.iterdir()
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    )


def repo_relative_path(path: Path) -> str:
    """Return a portable path relative to the repository root."""
    repo_root = Path(__file__).resolve().parent.parent
    absolute_path = path.resolve()

    try:
        relative_path = absolute_path.relative_to(repo_root)
    except ValueError:
        relative_path = Path(os.path.relpath(absolute_path, repo_root))

    return relative_path.as_posix()


def distance_km(
    a_lat: float,
    a_lon: float,
    b_lat: float,
    b_lon: float,
) -> float:
    return float(geodesic((a_lat, a_lon), (b_lat, b_lon)).km)


def population_std(values: list[float]) -> float:
    return statistics.pstdev(values) if len(values) > 1 else 0.0


def rmse(values: list[float]) -> float:
    return math.sqrt(sum(v * v for v in values) / len(values))


def percent_within(values: list[float], threshold_km: float) -> float:
    return 100.0 * sum(v <= threshold_km for v in values) / len(values)


def round_float(value: float, digits: int = 6) -> float:
    return round(float(value), digits)


def evaluate_one_image(
    pipeline: PlonkPipeline,
    image_path: Path,
    truth: dict[str, Any],
) -> dict[str, Any]:
    location_id = image_path.stem
    sample_seed = stable_sample_seed(BASE_SEED, location_id)

    # PLONK is generative. A location-specific generator makes the single
    # benchmark prediction reproducible and independent of evaluation order.
    generator = torch.Generator(device="cpu")
    generator.manual_seed(sample_seed)

    with Image.open(image_path) as opened:
        image = opened.convert("RGB")

    start = time.perf_counter()

    with torch.inference_mode():
        gps_coords = pipeline(
            image,
            batch_size=SAMPLES_PER_IMAGE,
            generator=generator,
        )

    inference_seconds = time.perf_counter() - start

    coords = np.asarray(gps_coords, dtype=np.float64)

    if coords.ndim == 1:
        coords = coords.reshape(1, -1)

    if coords.shape != (SAMPLES_PER_IMAGE, 2):
        raise ValueError(
            f"Unexpected PLONK output shape for {image_path.name}: {coords.shape}"
        )

    pred_lat = float(coords[0, 0])
    pred_lon = float(coords[0, 1])

    error = distance_km(
        truth["lat"],
        truth["lon"],
        pred_lat,
        pred_lon,
    )

    return {
        "location_id": location_id,
        "image": repo_relative_path(image_path),
        "ground_truth": truth,
        "prediction": {
            "lat": pred_lat,
            "lon": pred_lon,
            "error_km": error,
        },
        "sample_seed": sample_seed,
        "inference_seconds": inference_seconds,
    }


def build_summary(
    results: list[dict[str, Any]],
    dataset: str,
    model_load_seconds: float,
) -> dict[str, Any]:
    errors = [
        float(result["prediction"]["error_km"])
        for result in results
    ]
    inference_times = [
        float(result["inference_seconds"])
        for result in results
    ]

    best = min(results, key=lambda r: r["prediction"]["error_km"])
    worst = max(results, key=lambda r: r["prediction"]["error_km"])

    threshold_accuracy = {
        f"within_{threshold}_km_percent": round_float(
            percent_within(errors, threshold),
            3,
        )
        for threshold in DISTANCE_THRESHOLDS_KM
    }

    return {
        "dataset": dataset,
        "model": "PLONK OSV-5M",
        "checkpoint": MODEL_NAME,
        "device": "cpu",
        "n_images": len(results),
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "distance_unit": "km",
        "reproducibility": {
            "base_seed": BASE_SEED,
            "samples_per_image": SAMPLES_PER_IMAGE,
        },
        "prediction_error": {
            "mean_km": round_float(statistics.mean(errors), 3),
            "median_km": round_float(statistics.median(errors), 3),
            "std_km": round_float(population_std(errors), 3),
            "rmse_km": round_float(rmse(errors), 3),
            "min_km": round_float(min(errors), 3),
            "max_km": round_float(max(errors), 3),
        },
        "prediction_threshold_accuracy": threshold_accuracy,
        "best_prediction_case": {
            "location_id": best["location_id"],
            "city_or_region": best["ground_truth"].get("city_or_region"),
            "error_km": round_float(best["prediction"]["error_km"], 3),
        },
        "worst_prediction_case": {
            "location_id": worst["location_id"],
            "city_or_region": worst["ground_truth"].get("city_or_region"),
            "error_km": round_float(worst["prediction"]["error_km"], 3),
        },
        "timing": {
            "definition": (
                "Warm per-image inference after one-time model loading; includes "
                "pipeline preprocessing, generation and coordinate output; excludes "
                "image disk decoding and evaluation metrics."
            ),
            "model_load_seconds": round_float(model_load_seconds, 3),
            "mean_inference_seconds": round_float(
                statistics.mean(inference_times),
                3,
            ),
            "median_inference_seconds": round_float(
                statistics.median(inference_times),
                3,
            ),
            "std_inference_seconds": round_float(
                population_std(inference_times),
                3,
            ),
            "total_inference_seconds": round_float(
                sum(inference_times),
                3,
            ),
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
        "prediction_error_km",
        "sample_seed",
        "inference_seconds",
        "image",
    ]

    with path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for result in results:
            truth = result["ground_truth"]
            prediction = result["prediction"]

            writer.writerow(
                {
                    "location_id": result["location_id"],
                    "country": truth.get("country"),
                    "city_or_region": truth.get("city_or_region"),
                    "difficulty": truth.get("difficulty"),
                    "primary_clue_type": truth.get("primary_clue_type"),
                    "gt_lat": f'{truth["lat"]:.7f}',
                    "gt_lon": f'{truth["lon"]:.7f}',
                    "pred_lat": f'{prediction["lat"]:.7f}',
                    "pred_lon": f'{prediction["lon"]:.7f}',
                    "prediction_error_km": f'{prediction["error_km"]:.3f}',
                    "sample_seed": result["sample_seed"],
                    "inference_seconds": f'{result["inference_seconds"]:.3f}',
                    "image": result["image"],
                }
            )


def json_ready_results(
    results: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    cleaned: list[dict[str, Any]] = []

    for result in results:
        cleaned.append(
            {
                **result,
                "inference_seconds": round_float(
                    result["inference_seconds"],
                    6,
                ),
                "prediction": {
                    **result["prediction"],
                    "lat": round_float(result["prediction"]["lat"], 7),
                    "lon": round_float(result["prediction"]["lon"], 7),
                    "error_km": round_float(
                        result["prediction"]["error_km"],
                        6,
                    ),
                },
            }
        )

    return cleaned


def print_summary(summary: dict[str, Any]) -> None:
    error = summary["prediction_error"]
    timing = summary["timing"]

    print("\n" + "=" * 72)
    print("PLONK OSV-5M STATIC EVALUATION SUMMARY")
    print("=" * 72)
    print(f'Dataset:                 {summary["dataset"]}')
    print(f'Checkpoint:              {summary["checkpoint"]}')
    print(f'Device:                  {summary["device"]}')
    print(f'Images evaluated:        {summary["n_images"]}')
    print(f'Base seed:               {summary["reproducibility"]["base_seed"]}')
    print()
    print("Geodesic error:")
    print(f'  Mean:                   {error["mean_km"]:.3f} km')
    print(f'  Median:                 {error["median_km"]:.3f} km')
    print(f'  Std (population):       {error["std_km"]:.3f} km')
    print(f'  RMSE:                   {error["rmse_km"]:.3f} km')
    print(f'  Best / minimum:         {error["min_km"]:.3f} km')
    print(f'  Worst / maximum:        {error["max_km"]:.3f} km')
    print()
    print("Distance-threshold accuracy:")
    for threshold in DISTANCE_THRESHOLDS_KM:
        value = summary["prediction_threshold_accuracy"][
            f"within_{threshold}_km_percent"
        ]
        print(f"  <= {threshold:4d} km:             {value:7.2f}%")

    print()
    print("Best prediction case:")
    best = summary["best_prediction_case"]
    print(
        f'  {best["location_id"]} | {best["city_or_region"]} | '
        f'{best["error_km"]:.3f} km'
    )

    print("Worst prediction case:")
    worst = summary["worst_prediction_case"]
    print(
        f'  {worst["location_id"]} | {worst["city_or_region"]} | '
        f'{worst["error_km"]:.3f} km'
    )

    print()
    print("Timing:")
    print(f'  Model load:             {timing["model_load_seconds"]:.3f} s')
    print(
        f'  Mean inference/image:   '
        f'{timing["mean_inference_seconds"]:.3f} s'
    )
    print(
        f'  Total inference:        '
        f'{timing["total_inference_seconds"]:.3f} s'
    )
    print("=" * 72)


def main() -> None:
    args = parse_args()

    demo_root = args.demo_root.resolve()
    competition_path = (
        demo_root
        / "data"
        / "competitions"
        / f"{args.dataset}.json"
    )
    if args.images_root is None:
        images_root = demo_root / "data" / "starting-images"
    else:
        images_root = args.images_root.expanduser().resolve()

    image_dir = images_root / args.dataset
    output_dir = args.output_dir.resolve()

    device = torch.device("cpu")
    set_global_seed(BASE_SEED)

    print(f"Using device: {device}")
    print(f"PyTorch version: {torch.__version__}")
    print(f"Checkpoint:  {MODEL_NAME}")
    print(f"Competition: {competition_path}")
    print(f"Images:      {image_dir}")

    if not competition_path.exists():
        print(
            f"\nERROR: Competition file not found:\n"
            f"{competition_path}"
        )
        sys.exit(1)

    if not image_dir.exists():
        print(
            f"\nERROR: Starting-image directory not found:\n"
            f"{image_dir}"
        )
        sys.exit(1)

    ground_truth = load_ground_truth(competition_path)
    images = find_images(image_dir)

    if not images:
        print(
            f"\nERROR: No starting images found in:\n"
            f"{image_dir}"
        )
        sys.exit(1)

    missing_ground_truth = [
        image.stem
        for image in images
        if image.stem not in ground_truth
    ]

    if missing_ground_truth:
        print(
            "\nERROR: These images have no matching location id "
            "in the competition JSON:"
        )
        for location_id in missing_ground_truth:
            print(f"  - {location_id}")
        sys.exit(1)

    print(f"\nFound {len(images)} image(s) to evaluate.")

    try:
        print("\nLoading PLONK OSV-5M pipeline...")
        model_load_start = time.perf_counter()

        pipeline = PlonkPipeline(
            MODEL_NAME,
            device=device,
        )

        model_load_seconds = time.perf_counter() - model_load_start

        print(
            f"PLONK loaded successfully in "
            f"{model_load_seconds:.2f} s."
        )

        # One unmeasured warm-up avoids charging first-use framework/model
        # overhead to the first benchmark location. Use a fresh deterministic
        # generator so the measured prediction remains unchanged.
        warmup_seed = stable_sample_seed(BASE_SEED, images[0].stem)
        warmup_generator = torch.Generator(device="cpu")
        warmup_generator.manual_seed(warmup_seed)
        with Image.open(images[0]) as opened:
            warmup_image = opened.convert("RGB")
        with torch.inference_mode():
            _warmup_coords = pipeline(
                warmup_image,
                batch_size=SAMPLES_PER_IMAGE,
                generator=warmup_generator,
            )
        del _warmup_coords, warmup_image, warmup_generator
        print("PLONK warm-up complete (not included in inference_seconds).")

        results: list[dict[str, Any]] = []

        for index, image_path in enumerate(images, start=1):
            truth = ground_truth[image_path.stem]
            label = truth.get("city_or_region") or image_path.stem

            print(
                f"\n[{index}/{len(images)}] "
                f"{image_path.name} | {label}"
            )

            result = evaluate_one_image(
                pipeline=pipeline,
                image_path=image_path,
                truth=truth,
            )
            results.append(result)

            prediction = result["prediction"]

            print(
                f'  Prediction: lat={prediction["lat"]:.6f}, '
                f'lon={prediction["lon"]:.6f}, '
                f'error={prediction["error_km"]:.2f} km'
            )
            print(
                f'  Inference time: '
                f'{result["inference_seconds"]:.2f} s'
            )

        summary = build_summary(
            results=results,
            dataset=args.dataset,
            model_load_seconds=model_load_seconds,
        )

        print_summary(summary)

        output_dir.mkdir(parents=True, exist_ok=True)

        base_name = f"plonk_osv5m_static_{args.dataset}"
        csv_path = output_dir / f"{base_name}.csv"
        details_path = output_dir / f"{base_name}_details.json"
        summary_path = output_dir / f"{base_name}_summary.json"

        write_csv(csv_path, results)

        with details_path.open("w", encoding="utf-8") as f:
            json.dump(
                json_ready_results(results),
                f,
                ensure_ascii=False,
                indent=2,
            )

        with summary_path.open("w", encoding="utf-8") as f:
            json.dump(
                summary,
                f,
                ensure_ascii=False,
                indent=2,
            )

        print("\nSaved results:")
        print(f"  CSV:     {csv_path}")
        print(f"  Details: {details_path}")
        print(f"  Summary: {summary_path}")

    except KeyboardInterrupt:
        print("\nStopped by user.")
        sys.exit(130)

    except MemoryError:
        print("\nERROR: The process ran out of system RAM.")
        print("Close other applications and try again.")
        sys.exit(1)

    except Exception as exc:
        print("\nPLONK batch evaluation failed.")
        print(f"Error type: {type(exc).__name__}")
        print(f"Error message: {exc}")
        raise


if __name__ == "__main__":
    main()
