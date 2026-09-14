#!/usr/bin/env python3
"""Calculate kilometer-distance statistics for published interactive model runs.

Distance provenance
-------------------
1. Normal recorder runs:
   The final prediction coordinate is read from the published round JSON and
   WGS84 geodesic error is recomputed against canonical competition ground
   truth.

       distance_source = recomputed_geodesic

2. GLM-5.3-Flash Max:
   Exact final prediction coordinates are read from the compact audit-evidence
   CSV in ``analysis/evidence/glm_final_predictions.csv``. The CSV is extracted
   from verified MCP ``place_guess`` / ``submit_guess`` tool outputs in the
   published GLM chat archive. WGS84 geodesic error is then recomputed against
   canonical competition ground truth.

       distance_source = recomputed_geodesic_from_verified_mcp_pin

3. GPT-6 Astra low:
   The publication treats verified OpenGuessr result-screen distances as the
   authoritative evidence, so those displayed distances are read from the
   published Markdown reports.

       distance_source = published_displayed_distance

The script never derives kilometers from OpenGuessr points.

Install:
    python -m pip install geopy

Run from the repository root:
    python analysis/calculate_agent_distance_stats.py

Outputs:
    analysis/agent_distances/agent_distance_rounds.csv
    analysis/agent_distances/agent_distance_stats_by_dataset.csv
    analysis/agent_distances/agent_distance_stats_overall.csv
    analysis/agent_distances/agent_distance_stats_by_condition.csv
    analysis/agent_distances/agent_distance_issues.csv
    analysis/agent_distances/agent_distance_summary.json
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import re
import statistics
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any


try:
    from geopy.distance import geodesic
except ImportError as exc:
    raise SystemExit(
        "Missing dependency 'geopy'. Install it with:\n"
        "    python -m pip install geopy"
    ) from exc


DATASETS = ("europe-easy", "europe-medium", "europe-hard")
DIFFICULTY_TO_DATASET = {
    "easy": "europe-easy",
    "medium": "europe-medium",
    "hard": "europe-hard",
}
EXPECTED_COUNTS = {
    "europe-easy": 8,
    "europe-medium": 9,
    "europe-hard": 8,
}
THRESHOLDS_KM = (1, 25, 200, 750, 2500)

EXTERNALLY_SOURCED_FAMILIES = {
    "gpt-6-astra-low",
    "glm-5.3-flash-max",
}

GOOGLE_MAPS_COORD_RE = re.compile(
    r"/maps/@(?P<lat>[+-]?(?:\d+(?:\.\d*)?|\.\d+)),"
    r"(?P<lon>[+-]?(?:\d+(?:\.\d*)?|\.\d+))"
)
LOCATION_ID_RE = re.compile(r"loc[-_]?0*(\d+)", re.IGNORECASE)

ASTRA_DATASET_HEADING_RE = re.compile(
    r"^#{2,3}\s+(Easy|Medium|Hard)\s*$",
    re.IGNORECASE,
)
ASTRA_EXPLICIT_ROUND_HEADING_RE = re.compile(
    r"^(?:#{2,3}\s*)?(Easy|Medium|Hard)\b"
    r"[^:\n|]{0,50}?\bR(?:ound\s*)?(\d+)\b",
    re.IGNORECASE,
)
ASTRA_GENERIC_ROUND_HEADING_RE = re.compile(
    r"^#{2,3}\s+Round\s+(\d+)\b",
    re.IGNORECASE,
)
ASTRA_CONTINUATION_RE = re.compile(
    r"Original\s+Hard\s+R(\d+)\b",
    re.IGNORECASE,
)

# Ordered from strongest/most explicit wording to weaker fallbacks.
ASTRA_DISTANCE_PATTERNS = (
    re.compile(
        r"\bofficial\s+distance\s*:?\s*([\d,.]+)\s*(km|m)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bsettled\s+result\s*:?\s*([\d,.]+)\s*(km|m)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bresult\s*:?\s*([\d,.]+)\s*(km|m)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bactual\b[^.;\n]{0,140}?([\d,.]+)\s*(km|m)\s+away\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bactual\b[^.;\n]{0,140}?,\s*([\d,.]+)\s*(km|m)\s*,\s*\+?\d",
        re.IGNORECASE,
    ),
    re.compile(
        r"([\d,.]+)\s*(km|m)\s+error\b",
        re.IGNORECASE,
    ),
)

GLM_RUN_HEADING_RE = re.compile(
    r"^##\s+Run\s+(\d+)\s+individual\s+scores\s*$",
    re.IGNORECASE,
)
GLM_TABLE_ROW_RE = re.compile(
    r"^\|\s*(easy|medium|hard)\s*\|\s*(\d+)\s*\|"
    r"\s*([\d,.]+)\s*(m|km)\s*\|\s*([\d,]+)\s*\|",
    re.IGNORECASE,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=None,
        help="Repository root. Normally auto-detected.",
    )
    parser.add_argument(
        "--benchmark-root",
        type=Path,
        default=None,
        help=(
            "Default: <repo>/demo_and_extension/data/"
            "recorded-agent-benchmark"
        ),
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help="Default: <repo>/analysis/agent_distances",
    )
    parser.add_argument(
        "--glm-evidence",
        type=Path,
        default=None,
        help=(
            "Default: <repo>/analysis/evidence/"
            "glm_final_predictions.csv"
        ),
    )
    parser.add_argument(
        "--include-partial",
        action="store_true",
        help="Include recorder JSONs marked partial=true.",
    )
    parser.add_argument(
        "--duplicate-policy",
        choices=("latest", "first", "all", "error"),
        default="latest",
        help="Duplicate coordinate-record policy. Default: latest.",
    )
    return parser.parse_args()


def find_repo_root(start: Path) -> Path:
    start = start.resolve()
    for candidate in (start, *start.parents):
        if candidate.joinpath(
            "demo_and_extension",
            "data",
            "competitions",
            "europe-easy.json",
        ).exists():
            return candidate
    raise FileNotFoundError(
        "Could not find repository root containing "
        "demo_and_extension/data/competitions/europe-easy.json"
    )


def parse_google_maps_coordinates(link: str) -> tuple[float, float]:
    match = GOOGLE_MAPS_COORD_RE.search(link)
    if not match:
        raise ValueError(f"Could not parse coordinates from: {link}")
    return float(match.group("lat")), float(match.group("lon"))


def load_competitions(
    repo_root: Path,
) -> tuple[dict[tuple[str, str], dict[str, Any]], dict[str, list[str]]]:
    base = repo_root / "demo_and_extension" / "data" / "competitions"
    ground_truth: dict[tuple[str, str], dict[str, Any]] = {}
    order: dict[str, list[str]] = {}

    for dataset in DATASETS:
        data = json.loads(
            (base / f"{dataset}.json").read_text(encoding="utf-8")
        )
        order[dataset] = []

        for location in data["locations"]:
            location_id = location["id"]
            lat, lon = parse_google_maps_coordinates(location["google_maps_link"])
            order[dataset].append(location_id)
            ground_truth[(dataset, location_id)] = {
                "lat": lat,
                "lon": lon,
                "country": location.get("country"),
                "city_or_region": location.get("city_or_region"),
                "difficulty": location.get("difficulty"),
                "primary_clue_type": location.get("primary_clue_type"),
            }

    return ground_truth, order


def normalize_location_id(value: Any) -> str | None:
    if value is None:
        return None

    text = str(value)
    exact = re.fullmatch(r"loc_(\d+)", text, re.IGNORECASE)
    if exact:
        return f"loc_{int(exact.group(1)):03d}"

    matches = LOCATION_ID_RE.findall(text)
    if matches:
        return f"loc_{int(matches[-1]):03d}"

    return None


def infer_dataset(data: dict[str, Any], relative_path: Path) -> str | None:
    for key in ("competitionId", "competitionPartId"):
        value = data.get(key)
        if value in DATASETS:
            return str(value)

    for part in relative_path.parts:
        if part in DATASETS:
            return part

    return None


def infer_location_id(
    data: dict[str, Any],
    dataset: str,
    competition_order: dict[str, list[str]],
) -> str | None:
    for key in ("locationId", "atlasLocationId"):
        location_id = normalize_location_id(data.get(key))
        if location_id:
            return location_id

    round_obj = data.get("round")
    round_value = (
        round_obj.get("competitionRound")
        if isinstance(round_obj, dict)
        else None
    )

    for value in (
        data.get("competitionRound"),
        data.get("competitionOverallIndex"),
        round_value,
    ):
        if value is None:
            continue
        try:
            index = int(value) - 1
        except (TypeError, ValueError):
            continue

        locations = competition_order.get(dataset, [])
        if 0 <= index < len(locations):
            return locations[index]

    return None


def extract_prediction(data: dict[str, Any]) -> tuple[float, float] | None:
    prediction = data.get("prediction")
    if not isinstance(prediction, dict):
        return None

    lat = prediction.get("lat")
    lon = prediction.get("lng", prediction.get("lon"))
    if lat is None or lon is None:
        return None

    return float(lat), float(lon)


def extract_spawn(data: dict[str, Any]) -> tuple[float, float] | None:
    candidates: list[dict[str, Any]] = []

    round_obj = data.get("round")
    if isinstance(round_obj, dict):
        spawn = round_obj.get("spawnRequested")
        if isinstance(spawn, dict):
            candidates.append(spawn)

    rounds = data.get("rounds")
    if isinstance(rounds, list) and rounds and isinstance(rounds[0], dict):
        spawn = rounds[0].get("spawnRequested")
        if isinstance(spawn, dict):
            candidates.append(spawn)

    for spawn in candidates:
        lat = spawn.get("lat")
        lon = spawn.get("lng", spawn.get("lon"))
        if lat is not None and lon is not None:
            return float(lat), float(lon)

    return None


def series_from_path(relative_path: Path, dataset: str) -> tuple[str, str]:
    parts = list(relative_path.parts)
    try:
        dataset_index = parts.index(dataset)
        prefix = parts[:dataset_index]
    except ValueError:
        prefix = parts[:-2]

    if not prefix:
        prefix = ["unknown"]

    # Canonical storage nests evaluations as <model>/runs/run-N. Keep the
    # public series identifier compact and independent of that storage detail.
    if len(prefix) >= 3 and prefix[1] == "runs":
        prefix = [prefix[0], prefix[2]]

    return prefix[0], "/".join(prefix)


def parse_iso_sort_key(value: Any) -> tuple[int, str]:
    if not value:
        return 0, ""

    text = str(value)
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
        return 1, parsed.isoformat()
    except ValueError:
        return 1, text


def parse_number(value: str) -> float:
    return float(value.replace(",", ""))


def distance_to_km(value: str, unit: str) -> float:
    number = parse_number(value)
    return number / 1000.0 if unit.lower() == "m" else number


def round_to_location_id(
    dataset: str,
    round_number: int,
    competition_order: dict[str, list[str]],
) -> str:
    index = round_number - 1
    locations = competition_order[dataset]

    if not 0 <= index < len(locations):
        raise ValueError(
            f"Invalid round {round_number} for {dataset}; "
            f"expected 1..{len(locations)}"
        )

    return locations[index]


def published_distance_row(
    *,
    model_family: str,
    series_id: str,
    dataset: str,
    round_number: int,
    error_km: float,
    source_file: Path,
    benchmark_root: Path,
    ground_truth: dict[tuple[str, str], dict[str, Any]],
    competition_order: dict[str, list[str]],
    published_points: int | None = None,
) -> dict[str, Any]:
    location_id = round_to_location_id(
        dataset,
        round_number,
        competition_order,
    )
    canonical = ground_truth[(dataset, location_id)]

    return {
        "model_family": model_family,
        "series_id": series_id,
        "dataset": dataset,
        "location_id": location_id,
        "country": canonical.get("country"),
        "city_or_region": canonical.get("city_or_region"),
        "difficulty": canonical.get("difficulty"),
        "primary_clue_type": canonical.get("primary_clue_type"),
        "gt_lat": canonical["lat"],
        "gt_lon": canonical["lon"],
        "pred_lat": None,
        "pred_lon": None,
        "error_km": error_km,
        "distance_source": "published_displayed_distance",
        "published_points": published_points,
        "spawn_delta_km": None,
        "partial": False,
        "stopped_at": "",
        "recording_id": "",
        "model_field": model_family,
        "source_file": source_file.relative_to(benchmark_root).as_posix(),
    }


def extract_astra_distance_km(line: str) -> float | None:
    for pattern in ASTRA_DISTANCE_PATTERNS:
        match = pattern.search(line)
        if match:
            return distance_to_km(match.group(1), match.group(2))
    return None


def parse_astra_report(
    path: Path,
    *,
    series_id: str,
    benchmark_root: Path,
    ground_truth: dict[tuple[str, str], dict[str, Any]],
    competition_order: dict[str, list[str]],
    allowed_datasets: set[str],
) -> list[dict[str, Any]]:
    """Parse one Astra Markdown report.

    The report prose is stateful: headings identify the current difficulty
    and round, then a later sentence gives the displayed result distance.
    """

    current_dataset: str | None = None
    current_round: int | None = None
    rows: dict[tuple[str, int], dict[str, Any]] = {}

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line:
            continue

        dataset_heading = ASTRA_DATASET_HEADING_RE.match(line)
        if dataset_heading:
            current_dataset = DIFFICULTY_TO_DATASET[
                dataset_heading.group(1).lower()
            ]
            current_round = None

        explicit_heading = ASTRA_EXPLICIT_ROUND_HEADING_RE.match(line)
        if explicit_heading:
            current_dataset = DIFFICULTY_TO_DATASET[
                explicit_heading.group(1).lower()
            ]
            current_round = int(explicit_heading.group(2))

        generic_heading = ASTRA_GENERIC_ROUND_HEADING_RE.match(line)
        if generic_heading and current_dataset:
            current_round = int(generic_heading.group(1))

        # Run 1 finishes Hard R7/R8 in a two-round continuation and names the
        # original hard-round numbers explicitly in reconciliation bullets.
        continuation_match = ASTRA_CONTINUATION_RE.search(line)
        if continuation_match:
            continuation_round = int(continuation_match.group(1))
            distance_km = extract_astra_distance_km(line)
            if distance_km is not None:
                key = ("europe-hard", continuation_round)
                rows[key] = published_distance_row(
                    model_family="gpt-6-astra-low",
                    series_id=series_id,
                    dataset="europe-hard",
                    round_number=continuation_round,
                    error_km=distance_km,
                    source_file=path,
                    benchmark_root=benchmark_root,
                    ground_truth=ground_truth,
                    competition_order=competition_order,
                )
            continue

        if current_dataset not in allowed_datasets or current_round is None:
            continue

        distance_km = extract_astra_distance_km(line)
        if distance_km is None:
            continue

        key = (current_dataset, current_round)
        new_row = published_distance_row(
            model_family="gpt-6-astra-low",
            series_id=series_id,
            dataset=current_dataset,
            round_number=current_round,
            error_km=distance_km,
            source_file=path,
            benchmark_root=benchmark_root,
            ground_truth=ground_truth,
            competition_order=competition_order,
        )

        if key in rows:
            previous = float(rows[key]["error_km"])
            if not math.isclose(previous, distance_km, abs_tol=0.001):
                raise ValueError(
                    f"Conflicting Astra distance for {series_id} "
                    f"{current_dataset} round {current_round}: "
                    f"{previous} vs {distance_km} km in {path.name}"
                )
        else:
            rows[key] = new_row

    return list(rows.values())


def load_astra_rows(
    benchmark_root: Path,
    ground_truth: dict[tuple[str, str], dict[str, Any]],
    competition_order: dict[str, list[str]],
    issues: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    model_root = benchmark_root / "gpt-6-astra-low"

    specs = (
        (
            "gpt-6-astra-low/run-1",
            model_root / "runs" / "run-1" / "report.md",
            set(DATASETS),
        ),
        (
            "gpt-6-astra-low/run-2",
            model_root / "runs" / "run-2" / "report.md",
            set(DATASETS),
        ),
        # Only Easy from the original Run 3 report is valid. Its original
        # Medium attempt was explicitly excluded after protocol contamination.
        (
            "gpt-6-astra-low/run-3",
            model_root / "runs" / "run-3" / "original-report.md",
            {"europe-easy"},
        ),
        (
            "gpt-6-astra-low/run-3",
            model_root / "runs" / "run-3" / "report.md",
            {"europe-medium", "europe-hard"},
        ),
    )

    rows: list[dict[str, Any]] = []

    for series_id, path, allowed_datasets in specs:
        if not path.exists():
            issues.append(
                {
                    "issue": "published_report_missing",
                    "series_id": series_id,
                    "dataset": "",
                    "location_id": "",
                    "file": path.relative_to(benchmark_root).as_posix(),
                    "details": "",
                }
            )
            continue

        rows.extend(
            parse_astra_report(
                path,
                series_id=series_id,
                benchmark_root=benchmark_root,
                ground_truth=ground_truth,
                competition_order=competition_order,
                allowed_datasets=allowed_datasets,
            )
        )

    by_series: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        by_series[row["series_id"]].append(row)

    for series_id in (
        "gpt-6-astra-low/run-1",
        "gpt-6-astra-low/run-2",
        "gpt-6-astra-low/run-3",
    ):
        group = by_series.get(series_id, [])
        unique = {
            (row["dataset"], row["location_id"])
            for row in group
        }
        if len(group) != 25 or len(unique) != 25:
            issues.append(
                {
                    "issue": "published_round_count_mismatch",
                    "series_id": series_id,
                    "dataset": "",
                    "location_id": "",
                    "file": "gpt-6-astra-low/runs/",
                    "details": (
                        f"parsed {len(group)} rows / {len(unique)} unique; "
                        "expected 25"
                    ),
                }
            )

    return rows


def load_glm_rows(
    evidence_path: Path,
    repo_root: Path,
    ground_truth: dict[tuple[str, str], dict[str, Any]],
    competition_order: dict[str, list[str]],
    issues: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Load exact GLM final pins extracted from the published MCP chat archive."""

    if not evidence_path.exists():
        issues.append(
            {
                "issue": "glm_evidence_missing",
                "series_id": "glm-5.3-flash-max",
                "dataset": "",
                "location_id": "",
                "file": evidence_path.as_posix(),
                "details": (
                    "Generate it with analysis/extract_glm_final_predictions.py"
                ),
            }
        )
        return []

    try:
        evidence_label = evidence_path.relative_to(repo_root).as_posix()
    except ValueError:
        evidence_label = str(evidence_path)

    rows: list[dict[str, Any]] = []
    logical_keys: set[tuple[str, str, int]] = set()

    with evidence_path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        required = {
            "series_id",
            "dataset",
            "round",
            "pred_lat",
            "pred_lon",
            "evidence_type",
        }
        missing_columns = required - set(reader.fieldnames or [])
        if missing_columns:
            raise ValueError(
                f"{evidence_label} is missing columns: "
                f"{sorted(missing_columns)}"
            )

        for csv_row in reader:
            series_id = str(csv_row["series_id"]).strip()
            dataset = str(csv_row["dataset"]).strip()
            if dataset not in DATASETS:
                raise ValueError(
                    f"{evidence_label}: invalid dataset {dataset!r}."
                )

            try:
                round_number = int(csv_row["round"])
                pred_lat = float(csv_row["pred_lat"])
                pred_lon = float(csv_row["pred_lon"])
            except (TypeError, ValueError) as exc:
                raise ValueError(
                    f"{evidence_label}: invalid numeric GLM evidence row "
                    f"{csv_row!r}"
                ) from exc

            expected_series = {
                "glm-5.3-flash-max/run-1",
                "glm-5.3-flash-max/run-2",
                "glm-5.3-flash-max/run-3",
            }
            if series_id not in expected_series:
                raise ValueError(
                    f"{evidence_label}: unexpected series {series_id!r}."
                )

            key = (series_id, dataset, round_number)
            if key in logical_keys:
                raise ValueError(
                    f"{evidence_label}: duplicate GLM evidence row {key}."
                )
            logical_keys.add(key)

            location_id = round_to_location_id(
                dataset,
                round_number,
                competition_order,
            )
            canonical = ground_truth[(dataset, location_id)]
            error_km = geodesic(
                (canonical["lat"], canonical["lon"]),
                (pred_lat, pred_lon),
            ).km

            evidence_type = str(csv_row["evidence_type"]).strip()
            allowed_evidence = {
                "submitted_pin",
                "verified_pin_preserved_after_submit_failure",
            }
            if evidence_type not in allowed_evidence:
                raise ValueError(
                    f"{evidence_label}: unsupported evidence_type "
                    f"{evidence_type!r}."
                )

            rows.append(
                {
                    "model_family": "glm-5.3-flash-max",
                    "series_id": series_id,
                    "dataset": dataset,
                    "location_id": location_id,
                    "country": canonical.get("country"),
                    "city_or_region": canonical.get("city_or_region"),
                    "difficulty": canonical.get("difficulty"),
                    "primary_clue_type": canonical.get("primary_clue_type"),
                    "gt_lat": canonical["lat"],
                    "gt_lon": canonical["lon"],
                    "pred_lat": pred_lat,
                    "pred_lon": pred_lon,
                    "error_km": error_km,
                    "distance_source": (
                        "recomputed_geodesic_from_verified_mcp_pin"
                    ),
                    "published_points": None,
                    "spawn_delta_km": None,
                    "partial": False,
                    "stopped_at": "",
                    "recording_id": str(
                        csv_row.get("successful_submit_call_id")
                        or csv_row.get("verified_place_call_id")
                        or ""
                    ),
                    "model_field": "glm-5.3-flash-max",
                    "source_file": evidence_label,
                }
            )

    if len(rows) != 75:
        issues.append(
            {
                "issue": "glm_evidence_round_count_mismatch",
                "series_id": "glm-5.3-flash-max",
                "dataset": "",
                "location_id": "",
                "file": evidence_label,
                "details": f"loaded {len(rows)} rows; expected 75",
            }
        )

    by_series: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        by_series[row["series_id"]].append(row)

    for run in (1, 2, 3):
        series_id = f"glm-5.3-flash-max/run-{run}"
        group = by_series.get(series_id, [])
        unique = {
            (row["dataset"], row["location_id"])
            for row in group
        }
        if len(group) != 25 or len(unique) != 25:
            issues.append(
                {
                    "issue": "glm_evidence_run_count_mismatch",
                    "series_id": series_id,
                    "dataset": "",
                    "location_id": "",
                    "file": evidence_label,
                    "details": (
                        f"loaded {len(group)} rows / {len(unique)} unique; "
                        "expected 25"
                    ),
                }
            )

    return rows

def scan_coordinate_rows(
    benchmark_root: Path,
    ground_truth: dict[tuple[str, str], dict[str, Any]],
    competition_order: dict[str, list[str]],
    issues: list[dict[str, Any]],
    *,
    include_partial: bool,
    duplicate_policy: str,
) -> tuple[list[dict[str, Any]], int]:
    json_files = sorted(benchmark_root.rglob("*.json"))
    candidates: list[dict[str, Any]] = []

    for path in json_files:
        relative = path.relative_to(benchmark_root)

        # These two families use explicit published displayed-distance evidence.
        if (
            relative.parts
            and relative.parts[0] in EXTERNALLY_SOURCED_FAMILIES
        ):
            continue

        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            issues.append(
                {
                    "issue": "json_read_error",
                    "series_id": "",
                    "dataset": "",
                    "location_id": "",
                    "file": relative.as_posix(),
                    "details": str(exc),
                }
            )
            continue

        # Important: the benchmark also contains JSON arrays and summaries.
        if not isinstance(data, dict):
            continue

        is_round_record = data.get("recordingType") == "openguessr-round"
        looks_like_legacy_round = (
            isinstance(data.get("prediction"), dict)
            and (
                data.get("competitionId") in DATASETS
                or data.get("competitionPartId") in DATASETS
            )
        )

        if not (is_round_record or looks_like_legacy_round):
            continue

        if data.get("partial") and not include_partial:
            issues.append(
                {
                    "issue": "partial_skipped",
                    "series_id": "",
                    "dataset": str(data.get("competitionId") or ""),
                    "location_id": str(data.get("locationId") or ""),
                    "file": relative.as_posix(),
                    "details": "partial=true",
                }
            )
            continue

        dataset = infer_dataset(data, relative)
        if dataset not in DATASETS:
            issues.append(
                {
                    "issue": "dataset_unresolved",
                    "series_id": "",
                    "dataset": "",
                    "location_id": "",
                    "file": relative.as_posix(),
                    "details": "",
                }
            )
            continue

        location_id = infer_location_id(
            data,
            dataset,
            competition_order,
        )
        if not location_id:
            issues.append(
                {
                    "issue": "location_unresolved",
                    "series_id": "",
                    "dataset": dataset,
                    "location_id": "",
                    "file": relative.as_posix(),
                    "details": "",
                }
            )
            continue

        canonical = ground_truth.get((dataset, location_id))
        if not canonical:
            issues.append(
                {
                    "issue": "ground_truth_missing",
                    "series_id": "",
                    "dataset": dataset,
                    "location_id": location_id,
                    "file": relative.as_posix(),
                    "details": "",
                }
            )
            continue

        prediction = extract_prediction(data)
        if not prediction:
            issues.append(
                {
                    "issue": "prediction_missing",
                    "series_id": "",
                    "dataset": dataset,
                    "location_id": location_id,
                    "file": relative.as_posix(),
                    "details": "",
                }
            )
            continue

        model_family, series_id = series_from_path(relative, dataset)
        pred_lat, pred_lon = prediction
        error_km = geodesic(
            (canonical["lat"], canonical["lon"]),
            (pred_lat, pred_lon),
        ).km

        spawn = extract_spawn(data)
        spawn_delta_km = (
            geodesic(
                (canonical["lat"], canonical["lon"]),
                spawn,
            ).km
            if spawn
            else None
        )

        candidates.append(
            {
                "model_family": model_family,
                "series_id": series_id,
                "dataset": dataset,
                "location_id": location_id,
                "country": canonical.get("country"),
                "city_or_region": canonical.get("city_or_region"),
                "difficulty": canonical.get("difficulty"),
                "primary_clue_type": canonical.get("primary_clue_type"),
                "gt_lat": canonical["lat"],
                "gt_lon": canonical["lon"],
                "pred_lat": pred_lat,
                "pred_lon": pred_lon,
                "error_km": error_km,
                "distance_source": "recomputed_geodesic",
                "published_points": None,
                "spawn_delta_km": spawn_delta_km,
                "partial": bool(data.get("partial")),
                "stopped_at": data.get("stoppedAt") or "",
                "recording_id": data.get("id") or "",
                "model_field": data.get("model") or "",
                "source_file": relative.as_posix(),
            }
        )

    grouped: dict[
        tuple[str, str, str],
        list[dict[str, Any]],
    ] = defaultdict(list)

    for row in candidates:
        grouped[
            (row["series_id"], row["dataset"], row["location_id"])
        ].append(row)

    selected: list[dict[str, Any]] = []

    for key, group in grouped.items():
        if len(group) == 1:
            selected.extend(group)
            continue

        series_id, dataset, location_id = key
        issues.append(
            {
                "issue": "duplicate_round",
                "series_id": series_id,
                "dataset": dataset,
                "location_id": location_id,
                "file": " | ".join(
                    row["source_file"]
                    for row in group
                ),
                "details": f"{len(group)} coordinate candidates",
            }
        )

        if duplicate_policy == "error":
            raise RuntimeError(
                f"Duplicate logical round: "
                f"{series_id} / {dataset} / {location_id}"
            )
        if duplicate_policy == "all":
            selected.extend(group)
        elif duplicate_policy == "first":
            selected.append(
                sorted(
                    group,
                    key=lambda row: parse_iso_sort_key(row["stopped_at"]),
                )[0]
            )
        else:
            selected.append(
                sorted(
                    group,
                    key=lambda row: parse_iso_sort_key(row["stopped_at"]),
                )[-1]
            )

    return selected, len(json_files)


def compute_stats(values: list[float]) -> dict[str, float | int]:
    if not values:
        raise ValueError("Cannot calculate statistics for an empty list.")

    return {
        "n": len(values),
        "mean_km": statistics.mean(values),
        "median_km": statistics.median(values),
        "std_population_km": (
            statistics.pstdev(values)
            if len(values) > 1
            else 0.0
        ),
        "rmse_km": math.sqrt(
            sum(value * value for value in values) / len(values)
        ),
        "min_km": min(values),
        "max_km": max(values),
        **{
            f"within_{threshold}_km_percent": (
                100.0
                * sum(value <= threshold for value in values)
                / len(values)
            )
            for threshold in THRESHOLDS_KM
        },
    }


def rounded_stats(values: list[float]) -> dict[str, float | int]:
    return {
        key: round(value, 6) if isinstance(value, float) else value
        for key, value in compute_stats(values).items()
    }


def build_stats(
    rows: list[dict[str, Any]],
) -> tuple[
    list[dict[str, Any]],
    list[dict[str, Any]],
    list[dict[str, Any]],
]:
    by_dataset: dict[
        tuple[str, str],
        list[dict[str, Any]],
    ] = defaultdict(list)
    by_series: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for row in rows:
        by_dataset[(row["series_id"], row["dataset"])].append(row)
        by_series[row["series_id"]].append(row)

    dataset_stats: list[dict[str, Any]] = []
    series_stats: list[dict[str, Any]] = []

    for (series_id, dataset), group in sorted(by_dataset.items()):
        errors = [float(row["error_km"]) for row in group]
        stats = rounded_stats(errors)
        stats.pop("n", None)

        dataset_stats.append(
            {
                "model_family": group[0]["model_family"],
                "series_id": series_id,
                "dataset": dataset,
                "n": len(group),
                "expected_n": EXPECTED_COUNTS[dataset],
                "complete_dataset": (
                    len(group) == EXPECTED_COUNTS[dataset]
                ),
                "distance_sources": ",".join(
                    sorted(
                        {
                            row["distance_source"]
                            for row in group
                        }
                    )
                ),
                **stats,
            }
        )

    for series_id, group in sorted(by_series.items()):
        errors = [float(row["error_km"]) for row in group]
        stats = rounded_stats(errors)
        stats.pop("n", None)

        datasets_present = sorted(
            {row["dataset"] for row in group},
            key=DATASETS.index,
        )
        expected = sum(
            EXPECTED_COUNTS[dataset]
            for dataset in datasets_present
        )

        series_stats.append(
            {
                "model_family": group[0]["model_family"],
                "series_id": series_id,
                "datasets_present": ",".join(datasets_present),
                "n": len(group),
                "expected_n_for_present_datasets": expected,
                "complete_present_datasets": len(group) == expected,
                "complete_25": (
                    len(group) == 25
                    and set(datasets_present) == set(DATASETS)
                ),
                "distance_sources": ",".join(
                    sorted(
                        {
                            row["distance_source"]
                            for row in group
                        }
                    )
                ),
                **stats,
            }
        )

    complete_series = {
        row["series_id"]
        for row in series_stats
        if row["complete_25"]
    }

    by_condition: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        if row["series_id"] in complete_series:
            by_condition[row["model_family"]].append(row)

    condition_stats: list[dict[str, Any]] = []

    for model_family, group in sorted(by_condition.items()):
        errors = [float(row["error_km"]) for row in group]
        stats = rounded_stats(errors)
        stats.pop("n", None)

        series_ids = sorted(
            {row["series_id"] for row in group}
        )

        condition_stats.append(
            {
                "model_family": model_family,
                "complete_runs": len(series_ids),
                "n": len(group),
                "series_ids": ",".join(series_ids),
                "distance_sources": ",".join(
                    sorted(
                        {
                            row["distance_source"]
                            for row in group
                        }
                    )
                ),
                **stats,
            }
        )

    return dataset_stats, series_stats, condition_stats


def write_csv(
    path: Path,
    rows: list[dict[str, Any]],
    fieldnames: list[str],
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open(
        "w",
        newline="",
        encoding="utf-8-sig",
    ) as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=fieldnames,
            lineterminator="\n",
        )
        writer.writeheader()
        writer.writerows(rows)


def serialise_rounds(
    rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []

    for row in rows:
        copy = dict(row)

        for key in ("gt_lat", "gt_lon", "pred_lat", "pred_lon"):
            value = copy.get(key)
            copy[key] = (
                ""
                if value is None
                else f"{float(value):.7f}"
            )

        copy["error_km"] = f'{float(copy["error_km"]):.6f}'

        spawn_delta = copy.get("spawn_delta_km")
        copy["spawn_delta_km"] = (
            ""
            if spawn_delta is None
            else f"{float(spawn_delta):.6f}"
        )

        if copy.get("published_points") is None:
            copy["published_points"] = ""

        output.append(copy)

    return output


def main() -> None:
    args = parse_args()

    repo_root = (
        args.repo_root.resolve()
        if args.repo_root
        else find_repo_root(Path(__file__).resolve().parent)
    )

    benchmark_root = (
        args.benchmark_root.resolve()
        if args.benchmark_root
        else repo_root
        / "demo_and_extension"
        / "data"
        / "recorded-agent-benchmark"
    )

    output_dir = (
        args.output_dir.resolve()
        if args.output_dir
        else repo_root / "analysis" / "agent_distances"
    )

    glm_evidence = (
        args.glm_evidence.resolve()
        if args.glm_evidence
        else repo_root / "analysis" / "evidence" / "glm_final_predictions.csv"
    )

    ground_truth, competition_order = load_competitions(repo_root)
    issues: list[dict[str, Any]] = []

    coordinate_rows, json_files_seen = scan_coordinate_rows(
        benchmark_root,
        ground_truth,
        competition_order,
        issues,
        include_partial=args.include_partial,
        duplicate_policy=args.duplicate_policy,
    )

    astra_rows = load_astra_rows(
        benchmark_root,
        ground_truth,
        competition_order,
        issues,
    )

    glm_rows = load_glm_rows(
        glm_evidence,
        repo_root,
        ground_truth,
        competition_order,
        issues,
    )

    rows = coordinate_rows + astra_rows + glm_rows

    # Never allow one logical scored round to be counted twice.
    logical_groups: dict[
        tuple[str, str, str],
        list[dict[str, Any]],
    ] = defaultdict(list)

    for row in rows:
        logical_groups[
            (row["series_id"], row["dataset"], row["location_id"])
        ].append(row)

    duplicates = {
        key: group
        for key, group in logical_groups.items()
        if len(group) > 1
    }

    if duplicates:
        details = "\n".join(
            f"{key}: {[row['source_file'] for row in group]}"
            for key, group in duplicates.items()
        )
        raise RuntimeError(
            "Cross-source duplicate scored rounds detected:\n"
            + details
        )

    rows.sort(
        key=lambda row: (
            row["series_id"],
            DATASETS.index(row["dataset"]),
            row["location_id"],
        )
    )

    dataset_stats, series_stats, condition_stats = build_stats(rows)

    common_stats_fields = [
        "mean_km",
        "median_km",
        "std_population_km",
        "rmse_km",
        "min_km",
        "max_km",
        *[
            f"within_{threshold}_km_percent"
            for threshold in THRESHOLDS_KM
        ],
    ]

    round_fields = [
        "model_family",
        "series_id",
        "dataset",
        "location_id",
        "country",
        "city_or_region",
        "difficulty",
        "primary_clue_type",
        "gt_lat",
        "gt_lon",
        "pred_lat",
        "pred_lon",
        "error_km",
        "distance_source",
        "published_points",
        "spawn_delta_km",
        "partial",
        "stopped_at",
        "recording_id",
        "model_field",
        "source_file",
    ]

    dataset_fields = [
        "model_family",
        "series_id",
        "dataset",
        "n",
        "expected_n",
        "complete_dataset",
        "distance_sources",
        *common_stats_fields,
    ]

    series_fields = [
        "model_family",
        "series_id",
        "datasets_present",
        "n",
        "expected_n_for_present_datasets",
        "complete_present_datasets",
        "complete_25",
        "distance_sources",
        *common_stats_fields,
    ]

    condition_fields = [
        "model_family",
        "complete_runs",
        "n",
        "series_ids",
        "distance_sources",
        *common_stats_fields,
    ]

    issue_fields = [
        "issue",
        "series_id",
        "dataset",
        "location_id",
        "file",
        "details",
    ]

    write_csv(
        output_dir / "agent_distance_rounds.csv",
        serialise_rounds(rows),
        round_fields,
    )
    write_csv(
        output_dir / "agent_distance_stats_by_dataset.csv",
        dataset_stats,
        dataset_fields,
    )
    write_csv(
        output_dir / "agent_distance_stats_overall.csv",
        series_stats,
        series_fields,
    )
    write_csv(
        output_dir / "agent_distance_stats_by_condition.csv",
        condition_stats,
        condition_fields,
    )
    write_csv(
        output_dir / "agent_distance_issues.csv",
        issues,
        issue_fields,
    )

    source_counts: dict[str, int] = defaultdict(int)
    for row in rows:
        source_counts[row["distance_source"]] += 1

    complete_25_series = sum(
        bool(row["complete_25"])
        for row in series_stats
    )

    try:
        benchmark_root_label = benchmark_root.relative_to(repo_root).as_posix()
    except ValueError:
        benchmark_root_label = str(benchmark_root)

    summary = {
        "benchmark_root": benchmark_root_label,
        "json_files_seen": json_files_seen,
        "selected_scored_rounds": len(rows),
        "run_series": len(series_stats),
        "complete_25_series": complete_25_series,
        "distance_source_counts": dict(source_counts),
        "issues": len(issues),
        "thresholds_km": list(THRESHOLDS_KM),
        "series": series_stats,
        "conditions": condition_stats,
    }

    output_dir.mkdir(parents=True, exist_ok=True)
    (
        output_dir / "agent_distance_summary.json"
    ).write_text(
        json.dumps(
            summary,
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print("=" * 112)
    print("RECORDED AGENT DISTANCE STATISTICS")
    print("=" * 112)
    print(f"Benchmark root:               {benchmark_root}")
    print(f"JSON files scanned:           {json_files_seen}")
    print(f"Coordinate-recomputed rounds: {len(coordinate_rows)}")
    print(f"Astra published distances:    {len(astra_rows)}")
    print(f"GLM verified coordinates:     {len(glm_rows)}")
    print(f"Selected scored rounds:       {len(rows)}")
    print(f"Run series:                   {len(series_stats)}")
    print(f"Complete 25-round series:     {complete_25_series}")
    print(f"Issues/warnings:              {len(issues)}")
    print()

    print(
        f'{"Series":<58} {"n":>4} {"Mean":>9} {"Median":>9} '
        f'{"Min":>9} {"Max":>10} {"<=200":>7} {"Source":>10}'
    )
    print("-" * 122)

    for row in series_stats:
        sources = str(row["distance_sources"]).split(",")
        source = (
            "coords"
            if all(item.startswith("recomputed_geodesic") for item in sources)
            else "displayed"
        )
        print(
            f'{row["series_id"][:58]:<58} '
            f'{row["n"]:>4} '
            f'{row["mean_km"]:>9.1f} '
            f'{row["median_km"]:>9.1f} '
            f'{row["min_km"]:>9.1f} '
            f'{row["max_km"]:>10.1f} '
            f'{row["within_200_km_percent"]:>6.1f}% '
            f'{source:>10}'
        )

    print()
    material_issues = [
        issue
        for issue in issues
        if issue["issue"] != "partial_skipped"
    ]
    print(f"Published scored rounds found:   {len(rows)}")
    print(f"Complete 25-round series found: {complete_25_series}")

    if material_issues:
        print(
            "COVERAGE CHECK: REVIEW - inspect "
            "agent_distance_issues.csv"
        )
    else:
        print("COVERAGE CHECK: PASS")

    print()
    print(
        f"Per-round CSV:       "
        f"{output_dir / 'agent_distance_rounds.csv'}"
    )
    print(
        f"Per-dataset stats:   "
        f"{output_dir / 'agent_distance_stats_by_dataset.csv'}"
    )
    print(
        f"Per-series stats:    "
        f"{output_dir / 'agent_distance_stats_overall.csv'}"
    )
    print(
        f"Condition stats:     "
        f"{output_dir / 'agent_distance_stats_by_condition.csv'}"
    )
    print(
        f"Issues:              "
        f"{output_dir / 'agent_distance_issues.csv'}"
    )
    print(
        f"JSON summary:        "
        f"{output_dir / 'agent_distance_summary.json'}"
    )


if __name__ == "__main__":
    main()
