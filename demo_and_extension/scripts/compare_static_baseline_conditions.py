#!/usr/bin/env python3
"""
Compare the original static-baseline results against the no-location-GUI reruns.

Expected repository layout:

repo/
├── baselines/
│   ├── geoclip/
│   ├── salad/
│   ├── plonk/
│   └── chipointv2/
└── demo_and_extension/
    └── scripts/
        └── compare_static_baseline_conditions.py

The script:
- matches result CSVs by filename between the original and no-location-GUI folders;
- pairs predictions by location_id;
- compares top-1 / final prediction geodesic error;
- reports mean/median changes, win/loss counts, percent change, and paired effect size;
- estimates a 95% bootstrap confidence interval for the mean paired change;
- runs a two-sided paired sign-flip permutation test;
- applies Holm correction across the overall model/configuration comparisons;
- writes CSV and Markdown reports;
- optionally writes plots if matplotlib is installed.

Interpretation:
    delta_km = no_location_gui_error_km - original_error_km

Therefore:
    negative delta = no-location-GUI performed better
    positive delta = original OpenGuessr image performed better
"""

from __future__ import annotations

import argparse
import csv
import math
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np


DATASETS = ("europe-easy", "europe-medium", "europe-hard")
MODEL_DIRS = {
    "GeoCLIP": "geoclip",
    "SALAD": "salad",
    "PLONK": "plonk",
    "Chipoint v2": "chipointv2",
}
ERROR_COLUMNS = (
    "top1_error_km",
    "prediction_error_km",
    "error_km",
)
THRESHOLDS_KM = (1, 25, 200, 750, 2500)


@dataclass
class PairRecord:
    model: str
    config: str
    dataset: str
    location_id: str
    original_error_km: float
    no_gui_error_km: float

    @property
    def delta_km(self) -> float:
        return self.no_gui_error_km - self.original_error_km

    @property
    def percent_change(self) -> float:
        if self.original_error_km == 0:
            return math.nan
        return 100.0 * self.delta_km / self.original_error_km

    @property
    def improved(self) -> bool:
        return self.delta_km < 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Compare original static baseline results with no-location-GUI reruns."
        )
    )
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=None,
        help="Repository root. Default: inferred from the script location/current directory.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help=(
            "Directory for comparison outputs. Default: "
            "<repo>/analysis/static-baseline-no-gui-comparison"
        ),
    )
    parser.add_argument(
        "--permutations",
        type=int,
        default=100_000,
        help="Monte Carlo sign-flip permutations per overall comparison. Default: 100000",
    )
    parser.add_argument(
        "--bootstrap",
        type=int,
        default=50_000,
        help="Bootstrap resamples for the mean-delta 95%% CI. Default: 50000",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for bootstrap/permutation procedures. Default: 42",
    )
    return parser.parse_args()


def infer_repo_root(start: Path) -> Path:
    candidates = [start.resolve(), *start.resolve().parents]
    for candidate in candidates:
        if (
            (candidate / "demo_and_extension").is_dir()
            and (candidate / "baselines" / "geoclip").is_dir()
            and (candidate / "baselines" / "salad").is_dir()
        ):
            return candidate
    raise RuntimeError(
        "Could not infer repository root. Pass it explicitly with --repo-root."
    )


def result_files_for_dataset(directory: Path, dataset: str) -> dict[str, Path]:
    if not directory.exists():
        return {}
    return {
        path.name: path
        for path in directory.glob(f"*{dataset}*.csv")
        if path.is_file()
    }


def detect_error_column(fieldnames: Iterable[str] | None) -> str:
    fields = set(fieldnames or [])
    for name in ERROR_COLUMNS:
        if name in fields:
            return name
    raise ValueError(
        f"Could not find an error column. Expected one of {ERROR_COLUMNS}; found {sorted(fields)}"
    )


def read_errors(path: Path) -> tuple[dict[str, float], str | None]:
    rows: dict[str, float] = {}
    image_example: str | None = None

    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        error_column = detect_error_column(reader.fieldnames)

        if "location_id" not in (reader.fieldnames or []):
            raise ValueError(f"{path} has no location_id column.")

        for row in reader:
            location_id = row["location_id"].strip()
            if not location_id:
                continue
            if location_id in rows:
                raise ValueError(f"Duplicate location_id {location_id!r} in {path}")
            rows[location_id] = float(row[error_column])
            if image_example is None and row.get("image"):
                image_example = row["image"]

    return rows, image_example


def config_from_filename(filename: str, dataset: str) -> str:
    stem = Path(filename).stem
    # Remove dataset and common separator artifacts while keeping model/index info.
    config = stem.replace(dataset, "")
    config = re.sub(r"[_-]+$", "", config)
    return config or stem


def collect_pairs(repo_root: Path) -> list[PairRecord]:
    records: list[PairRecord] = []

    for model_name, folder_name in MODEL_DIRS.items():
        model_dir = repo_root / "baselines" / folder_name
        original_dir = model_dir / "results"
        no_gui_dir = model_dir / "results-no-location-gui"

        if not original_dir.exists():
            print(f"WARNING: missing original result directory: {original_dir}", file=sys.stderr)
            continue
        if not no_gui_dir.exists():
            print(f"WARNING: missing no-GUI result directory: {no_gui_dir}", file=sys.stderr)
            continue

        for dataset in DATASETS:
            original_files = result_files_for_dataset(original_dir, dataset)
            no_gui_files = result_files_for_dataset(no_gui_dir, dataset)
            common_names = sorted(set(original_files) & set(no_gui_files))

            if not common_names:
                print(
                    f"WARNING: no matching CSV filename for {model_name} / {dataset}",
                    file=sys.stderr,
                )
                continue

            for filename in common_names:
                original_path = original_files[filename]
                no_gui_path = no_gui_files[filename]

                original_errors, original_image = read_errors(original_path)
                no_gui_errors, no_gui_image = read_errors(no_gui_path)

                common_locations = sorted(set(original_errors) & set(no_gui_errors))
                missing_old = sorted(set(no_gui_errors) - set(original_errors))
                missing_new = sorted(set(original_errors) - set(no_gui_errors))

                if missing_old or missing_new:
                    print(
                        f"WARNING: location mismatch in {filename}: "
                        f"only-new={missing_old}, only-original={missing_new}",
                        file=sys.stderr,
                    )

                # Soft provenance checks to catch accidental comparisons against the wrong image condition.
                if original_image and "starting-images-no-gui-crop" in original_image.replace("\\", "/"):
                    print(
                        f"WARNING: original result appears to reference no-GUI images: "
                        f"{original_path}",
                        file=sys.stderr,
                    )
                if no_gui_image:
                    normalized = no_gui_image.replace("\\", "/")
                    if "starting-images-no-gui-crop/no-location-gui" not in normalized:
                        print(
                            f"WARNING: no-GUI result does not appear to reference "
                            f"no-location-gui images: {no_gui_path}",
                            file=sys.stderr,
                        )

                config = config_from_filename(filename, dataset)

                for location_id in common_locations:
                    records.append(
                        PairRecord(
                            model=model_name,
                            config=config,
                            dataset=dataset,
                            location_id=location_id,
                            original_error_km=original_errors[location_id],
                            no_gui_error_km=no_gui_errors[location_id],
                        )
                    )

    if not records:
        raise RuntimeError("No paired result rows were found.")

    return records


def mean_ci_bootstrap(
    differences: np.ndarray,
    rng: np.random.Generator,
    n_bootstrap: int,
) -> tuple[float, float]:
    if len(differences) == 1:
        value = float(differences[0])
        return value, value

    # Chunk to avoid allocating a huge (n_bootstrap x n_locations) matrix at once.
    means: list[np.ndarray] = []
    remaining = n_bootstrap
    chunk_size = 10_000

    while remaining > 0:
        n = min(chunk_size, remaining)
        indices = rng.integers(
            0,
            len(differences),
            size=(n, len(differences)),
        )
        means.append(differences[indices].mean(axis=1))
        remaining -= n

    bootstrap_means = np.concatenate(means)
    low, high = np.quantile(bootstrap_means, [0.025, 0.975])
    return float(low), float(high)


def paired_sign_flip_pvalue(
    differences: np.ndarray,
    rng: np.random.Generator,
    n_permutations: int,
) -> float:
    observed = abs(float(np.mean(differences)))

    if np.allclose(differences, 0):
        return 1.0

    extreme = 0
    done = 0
    chunk_size = 20_000

    while done < n_permutations:
        n = min(chunk_size, n_permutations - done)
        signs = rng.choice(
            np.array([-1.0, 1.0], dtype=np.float64),
            size=(n, len(differences)),
        )
        permuted_means = np.mean(signs * differences, axis=1)
        extreme += int(np.count_nonzero(np.abs(permuted_means) >= observed - 1e-12))
        done += n

    # Plus-one correction prevents a zero Monte Carlo p-value.
    return (extreme + 1.0) / (n_permutations + 1.0)


def holm_adjust(p_values: list[float]) -> list[float]:
    n = len(p_values)
    order = sorted(range(n), key=lambda i: p_values[i])
    adjusted = [1.0] * n
    running_max = 0.0

    for rank, index in enumerate(order):
        raw_adjusted = (n - rank) * p_values[index]
        running_max = max(running_max, raw_adjusted)
        adjusted[index] = min(1.0, running_max)

    return adjusted


def effect_dz(differences: np.ndarray) -> float:
    if len(differences) < 2:
        return math.nan
    sd = float(np.std(differences, ddof=1))
    if sd == 0:
        return 0.0
    return float(np.mean(differences) / sd)


def summarize_group(
    records: list[PairRecord],
    rng: np.random.Generator,
    n_bootstrap: int,
    n_permutations: int | None,
) -> dict[str, object]:
    old = np.array([r.original_error_km for r in records], dtype=np.float64)
    new = np.array([r.no_gui_error_km for r in records], dtype=np.float64)
    diff = new - old

    improved = int(np.count_nonzero(diff < 0))
    worsened = int(np.count_nonzero(diff > 0))
    ties = int(np.count_nonzero(np.isclose(diff, 0)))

    valid_pct = np.array(
        [r.percent_change for r in records if not math.isnan(r.percent_change)],
        dtype=np.float64,
    )

    ci_low, ci_high = mean_ci_bootstrap(diff, rng, n_bootstrap)

    result: dict[str, object] = {
        "n": len(records),
        "original_mean_km": float(np.mean(old)),
        "no_gui_mean_km": float(np.mean(new)),
        "mean_delta_km": float(np.mean(diff)),
        "mean_delta_ci95_low_km": ci_low,
        "mean_delta_ci95_high_km": ci_high,
        "original_median_km": float(np.median(old)),
        "no_gui_median_km": float(np.median(new)),
        "median_delta_km": float(np.median(diff)),
        "mean_percent_change": (
            float(np.mean(valid_pct)) if len(valid_pct) else math.nan
        ),
        "median_percent_change": (
            float(np.median(valid_pct)) if len(valid_pct) else math.nan
        ),
        "improved_locations": improved,
        "worsened_locations": worsened,
        "ties": ties,
        "improvement_rate_percent": 100.0 * improved / len(records),
        "paired_effect_dz": effect_dz(diff),
    }

    for threshold in THRESHOLDS_KM:
        result[f"original_within_{threshold}km_percent"] = (
            100.0 * float(np.mean(old <= threshold))
        )
        result[f"no_gui_within_{threshold}km_percent"] = (
            100.0 * float(np.mean(new <= threshold))
        )

    if n_permutations is not None:
        result["permutation_p_two_sided"] = paired_sign_flip_pvalue(
            diff,
            rng,
            n_permutations,
        )

    return result


def group_records(
    records: list[PairRecord],
    include_dataset: bool,
) -> dict[tuple[str, ...], list[PairRecord]]:
    groups: dict[tuple[str, ...], list[PairRecord]] = {}
    for record in records:
        if include_dataset:
            key = (record.model, record.config, record.dataset)
        else:
            key = (record.model, record.config)
        groups.setdefault(key, []).append(record)
    return groups


def write_csv_rows(path: Path, rows: list[dict[str, object]]) -> None:
    if not rows:
        return

    fieldnames: list[str] = []
    seen: set[str] = set()
    for row in rows:
        for key in row:
            if key not in seen:
                seen.add(key)
                fieldnames.append(key)

    with path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def fmt(value: object, digits: int = 2) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "yes" if value else "no"
    if isinstance(value, (int, np.integer)):
        return str(int(value))
    try:
        number = float(value)
    except (TypeError, ValueError):
        return str(value)
    if math.isnan(number):
        return "n/a"
    return f"{number:.{digits}f}"


def write_markdown_report(
    path: Path,
    overall_rows: list[dict[str, object]],
    split_rows: list[dict[str, object]],
) -> None:
    lines: list[str] = []
    lines.append("# Static Baseline Comparison: Original vs No-Location-GUI")
    lines.append("")
    lines.append(
        "This report compares each model on the same benchmark locations using "
        "the original OpenGuessr starting images and the no-location-GUI image condition."
    )
    lines.append("")
    lines.append(
        "`mean_delta_km = no_location_gui_error - original_error`; therefore "
        "**negative values indicate improvement with the no-location-GUI images**."
    )
    lines.append("")
    lines.append("## Overall paired comparison")
    lines.append("")
    lines.append(
        "| Model | Config | N | Original mean km | No-GUI mean km | Mean Δ km | "
        "95% CI Δ km | Improved | Holm p | Significant? |"
    )
    lines.append(
        "|---|---|---:|---:|---:|---:|---:|---:|---:|:---:|"
    )

    for row in overall_rows:
        ci = (
            f"[{fmt(row['mean_delta_ci95_low_km'])}, "
            f"{fmt(row['mean_delta_ci95_high_km'])}]"
        )
        lines.append(
            f"| {row['model']} | `{row['config']}` | {row['n']} | "
            f"{fmt(row['original_mean_km'])} | {fmt(row['no_gui_mean_km'])} | "
            f"{fmt(row['mean_delta_km'])} | {ci} | "
            f"{row['improved_locations']}/{row['n']} | "
            f"{fmt(row['holm_adjusted_p'], 4)} | "
            f"{'yes' if row['significant_holm_0_05'] else 'no'} |"
        )

    lines.append("")
    lines.append("## By difficulty split")
    lines.append("")
    lines.append(
        "| Model | Split | N | Original mean km | No-GUI mean km | Mean Δ km | "
        "Median Δ km | Improved |"
    )
    lines.append("|---|---|---:|---:|---:|---:|---:|---:|")

    for row in split_rows:
        lines.append(
            f"| {row['model']} | {row['dataset']} | {row['n']} | "
            f"{fmt(row['original_mean_km'])} | {fmt(row['no_gui_mean_km'])} | "
            f"{fmt(row['mean_delta_km'])} | {fmt(row['median_delta_km'])} | "
            f"{row['improved_locations']}/{row['n']} |"
        )

    lines.append("")
    lines.append("## Statistical interpretation")
    lines.append("")
    lines.append(
        "- The primary significance test is a **paired, two-sided sign-flip permutation test** "
        "on per-location geodesic-error differences."
    )
    lines.append(
        "- Overall p-values are corrected across model/configuration comparisons using "
        "**Holm's method**. `significant = yes` means adjusted p < 0.05."
    )
    lines.append(
        "- The 95% interval is a nonparametric bootstrap confidence interval for the "
        "mean paired error change."
    )
    lines.append(
        "- Because this benchmark contains a fixed set of 25 locations, these statistics "
        "describe the stability of the observed effect on this benchmark; they should not "
        "be interpreted as proof of population-wide geolocation performance."
    )
    lines.append("")
    lines.append(
        "For location-level inspection, see `paired_location_differences.csv`. "
        "Negative `delta_km` values mean the no-location-GUI image reduced the geodesic error."
    )

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def maybe_write_plots(
    output_dir: Path,
    overall_rows: list[dict[str, object]],
    records: list[PairRecord],
) -> None:
    try:
        import matplotlib.pyplot as plt
    except ImportError:
        print("matplotlib not installed; skipping PNG plots.")
        return

    labels = [str(row["model"]) for row in overall_rows]
    old_means = [float(row["original_mean_km"]) for row in overall_rows]
    new_means = [float(row["no_gui_mean_km"]) for row in overall_rows]

    x = np.arange(len(labels))
    width = 0.36

    fig, ax = plt.subplots(figsize=(10, 6))
    ax.bar(x - width / 2, old_means, width, label="Original OpenGuessr")
    ax.bar(x + width / 2, new_means, width, label="No-location-GUI")
    ax.set_ylabel("Mean geodesic error (km)")
    ax.set_title("Static baseline mean error by image condition")
    ax.set_xticks(x)
    ax.set_xticklabels(labels, rotation=20, ha="right")
    ax.legend()
    fig.tight_layout()
    fig.savefig(output_dir / "mean_error_comparison.png", dpi=180)
    plt.close(fig)

    groups = group_records(records, include_dataset=False)
    plot_labels: list[str] = []
    deltas: list[np.ndarray] = []

    for row in overall_rows:
        key = (str(row["model"]), str(row["config"]))
        group = groups[key]
        plot_labels.append(str(row["model"]))
        deltas.append(np.array([r.delta_km for r in group], dtype=np.float64))

    fig, ax = plt.subplots(figsize=(10, 6))
    ax.boxplot(deltas, labels=plot_labels, showmeans=True)
    ax.axhline(0.0, linewidth=1)
    ax.set_ylabel("Paired error change (km)\nNo-GUI - Original")
    ax.set_title("Per-location change in geodesic error")
    ax.tick_params(axis="x", rotation=20)
    fig.tight_layout()
    fig.savefig(output_dir / "paired_error_deltas.png", dpi=180)
    plt.close(fig)


def main() -> None:
    args = parse_args()

    if args.permutations < 1:
        raise ValueError("--permutations must be >= 1")
    if args.bootstrap < 1:
        raise ValueError("--bootstrap must be >= 1")

    if args.repo_root is None:
        # Try current working directory first, then the script location.
        try:
            repo_root = infer_repo_root(Path.cwd())
        except RuntimeError:
            repo_root = infer_repo_root(Path(__file__).resolve().parent)
    else:
        repo_root = args.repo_root.expanduser().resolve()

    output_dir = (
        args.output_dir.expanduser().resolve()
        if args.output_dir is not None
        else repo_root
        / "analysis"
        / "static-baseline-no-gui-comparison"
    )
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Repository: {repo_root}")
    print(f"Output:     {output_dir}")

    records = collect_pairs(repo_root)
    print(f"Paired location rows: {len(records)}")

    master_rng = np.random.default_rng(args.seed)

    # Location-level table.
    detail_rows: list[dict[str, object]] = []
    for record in sorted(
        records,
        key=lambda r: (r.model, r.config, r.dataset, r.location_id),
    ):
        detail_rows.append(
            {
                "model": record.model,
                "config": record.config,
                "dataset": record.dataset,
                "location_id": record.location_id,
                "original_error_km": round(record.original_error_km, 6),
                "no_gui_error_km": round(record.no_gui_error_km, 6),
                "delta_km": round(record.delta_km, 6),
                "percent_change": (
                    round(record.percent_change, 3)
                    if not math.isnan(record.percent_change)
                    else ""
                ),
                "winner": (
                    "no-location-gui"
                    if record.delta_km < 0
                    else "original"
                    if record.delta_km > 0
                    else "tie"
                ),
            }
        )

    write_csv_rows(
        output_dir / "paired_location_differences.csv",
        detail_rows,
    )

    # Overall model/configuration comparisons.
    overall_groups = group_records(records, include_dataset=False)
    overall_rows: list[dict[str, object]] = []

    for key in sorted(overall_groups):
        model, config = key
        group = overall_groups[key]
        # Independent deterministic substreams keep results stable if group order changes.
        sub_rng = np.random.default_rng(master_rng.integers(0, 2**63 - 1))
        stats = summarize_group(
            group,
            sub_rng,
            n_bootstrap=args.bootstrap,
            n_permutations=args.permutations,
        )
        overall_rows.append(
            {
                "model": model,
                "config": config,
                **stats,
            }
        )

    adjusted = holm_adjust(
        [float(row["permutation_p_two_sided"]) for row in overall_rows]
    )
    for row, adj_p in zip(overall_rows, adjusted):
        row["holm_adjusted_p"] = adj_p
        row["significant_holm_0_05"] = adj_p < 0.05
        delta = float(row["mean_delta_km"])
        row["direction"] = (
            "no-location-gui better"
            if delta < 0
            else "original better"
            if delta > 0
            else "no difference"
        )

    write_csv_rows(
        output_dir / "overall_comparison.csv",
        overall_rows,
    )

    # Split-level descriptive summaries. No multiplicity-heavy significance claims here.
    split_groups = group_records(records, include_dataset=True)
    split_rows: list[dict[str, object]] = []

    for key in sorted(split_groups):
        model, config, dataset = key
        group = split_groups[key]
        sub_rng = np.random.default_rng(master_rng.integers(0, 2**63 - 1))
        stats = summarize_group(
            group,
            sub_rng,
            n_bootstrap=args.bootstrap,
            n_permutations=None,
        )
        split_rows.append(
            {
                "model": model,
                "config": config,
                "dataset": dataset,
                **stats,
            }
        )

    write_csv_rows(
        output_dir / "comparison_by_split.csv",
        split_rows,
    )

    write_markdown_report(
        output_dir / "comparison_report.md",
        overall_rows,
        split_rows,
    )

    maybe_write_plots(
        output_dir,
        overall_rows,
        records,
    )

    print("\nOverall comparison:")
    print(
        f"{'Model':<14} {'N':>3} {'Original':>11} {'No-GUI':>11} "
        f"{'Delta':>11} {'Holm p':>10} {'Sig':>5}"
    )
    print("-" * 72)

    for row in overall_rows:
        print(
            f"{str(row['model']):<14} "
            f"{int(row['n']):>3} "
            f"{float(row['original_mean_km']):>11.2f} "
            f"{float(row['no_gui_mean_km']):>11.2f} "
            f"{float(row['mean_delta_km']):>11.2f} "
            f"{float(row['holm_adjusted_p']):>10.4f} "
            f"{('yes' if row['significant_holm_0_05'] else 'no'):>5}"
        )

    print("\nNegative Delta means the no-location-GUI condition performed better.")
    print(f"\nWrote comparison outputs to:\n{output_dir}")


if __name__ == "__main__":
    main()
