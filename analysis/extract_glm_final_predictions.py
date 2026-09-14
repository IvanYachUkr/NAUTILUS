#!/usr/bin/env python3
"""Extract final GLM-5.3-Flash Max OpenGuessr prediction pins from chat evidence.

The source archive contains exported conversation JSON for the three scored GLM
runs.  A normal scored round is anchored by its RESULT screenshot and the last
successful ``openguessr_submit_guess`` immediately preceding that result.

Two Run-3 rounds (Easy R7 and Medium R9) have verified pins but the submit call
fails/times out.  Their ``*_SUBMITCHECK.jpeg`` screenshot anchors the round and
the last successful verified ``openguessr_place_guess`` is preserved as the
final prediction evidence.

The output CSV is intentionally small and auditable; the main distance-analysis
script reads it and recomputes WGS84 geodesic error against canonical benchmark
ground truth.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import zipfile
from pathlib import Path
from typing import Any


DATASET_FROM_DIFFICULTY = {
    "easy": "europe-easy",
    "medium": "europe-medium",
    "hard": "europe-hard",
}
EXPECTED_ROUNDS = {
    "europe-easy": 8,
    "europe-medium": 9,
    "europe-hard": 8,
}
RESULT_SCREEN_RE = re.compile(
    r"GLM_FLASH_MAX_R(?P<run>\d+)_(?P<difficulty>EASY|MEDIUM|HARD)_"
    r"R(?P<round>\d+)_RESULT\.jpeg$",
    re.IGNORECASE,
)
SUBMITCHECK_SCREEN_RE = re.compile(
    r"GLM_FLASH_MAX_R(?P<run>\d+)_(?P<difficulty>EASY|MEDIUM|HARD)_"
    r"R(?P<round>\d+)_SUBMITCHECK\.jpeg$",
    re.IGNORECASE,
)
RUN_DIR_RE = re.compile(
    r"(?:^|/)(?:\d+-scored-run-(?P<legacy_run>\d+)-|runs/run-(?P<run>\d+)(?:/|$))"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "archive",
        type=Path,
        help="GLM exported-chat ZIP archive or canonical model directory.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help=(
            "Output CSV. Default: <repo>/analysis/evidence/"
            "glm_final_predictions.csv when a repository can be found, "
            "otherwise ./glm_final_predictions.csv"
        ),
    )
    return parser.parse_args()


def find_repo_root(start: Path) -> Path | None:
    start = start.resolve()
    for candidate in (start, *start.parents):
        if candidate.joinpath(
            "demo_and_extension",
            "data",
            "competitions",
            "europe-easy.json",
        ).exists():
            return candidate
    return None


def parse_json_output(value: Any) -> dict[str, Any] | None:
    if not isinstance(value, str):
        return None
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None


def iter_tool_parts(conversation: dict[str, Any]):
    for message in conversation.get("messages", []):
        if not isinstance(message, dict):
            continue
        for part in message.get("parts", []):
            if not isinstance(part, dict):
                continue
            data = part.get("data")
            if isinstance(data, dict) and data.get("type") == "tool":
                yield data


def pin_from_output(
    output: dict[str, Any] | None,
    *,
    require_verified: bool = False,
    require_submitted: bool = False,
) -> tuple[float, float] | None:
    if not output or output.get("ok") is not True:
        return None
    if require_verified and output.get("verified") is not True:
        return None
    if require_submitted and output.get("submitted") is not True:
        return None
    pin = output.get("pin")
    if not isinstance(pin, dict):
        return None
    try:
        return float(pin["latitude"]), float(pin["longitude"])
    except (KeyError, TypeError, ValueError):
        return None


def round_key_from_filename(
    filename: str,
    pattern: re.Pattern[str],
) -> tuple[int, str, int] | None:
    match = pattern.search(filename)
    if not match:
        return None
    return (
        int(match.group("run")),
        DATASET_FROM_DIFFICULTY[match.group("difficulty").lower()],
        int(match.group("round")),
    )


def load_conversations(source: Path) -> tuple[list[tuple[str, bytes]], str, str]:
    """Load the three conversations from either the legacy ZIP or run folders."""
    source = source.resolve()
    if source.is_dir():
        paths = sorted(source.glob("runs/run-*/conversation.json"))
        conversations = [
            (path.relative_to(source).as_posix(), path.read_bytes()) for path in paths
        ]
        return conversations, source.name, ""

    source_sha256 = hashlib.sha256(source.read_bytes()).hexdigest()
    with zipfile.ZipFile(source) as handle:
        names = sorted(
            name
            for name in handle.namelist()
            if name.endswith("/conversation.json") and "scored-run-" in name
        )
        conversations = [(name, handle.read(name)) for name in names]
    return conversations, source.name, source_sha256


def extract_source(source: Path) -> list[dict[str, Any]]:
    conversations, source_label, source_sha256 = load_conversations(source)
    rows: list[dict[str, Any]] = []

    if len(conversations) != 3:
        raise RuntimeError(
            f"Expected 3 scored conversation.json files, found {len(conversations)}."
        )

    for conversation_name, conversation_bytes in conversations:
            run_match = RUN_DIR_RE.search(conversation_name)
            if not run_match:
                raise RuntimeError(
                    f"Could not determine run number from {conversation_name}."
                )
            run = int(run_match.group("run") or run_match.group("legacy_run"))
            conversation = json.loads(conversation_bytes)

            latest_verified_place: dict[str, Any] | None = None
            successful_submits_since_anchor: list[dict[str, Any]] = []
            assigned: dict[tuple[str, int], dict[str, Any]] = {}

            for tool in iter_tool_parts(conversation):
                tool_name = str(tool.get("tool") or "")
                state = tool.get("state")
                state = state if isinstance(state, dict) else {}
                call_id = str(tool.get("callID") or "")
                output = parse_json_output(state.get("output"))

                if tool_name == "mcp__nautilus__openguessr_place_guess":
                    pin = pin_from_output(output, require_verified=True)
                    if pin is not None:
                        latest_verified_place = {
                            "lat": pin[0],
                            "lon": pin[1],
                            "call_id": call_id,
                        }
                    continue

                if tool_name == "mcp__nautilus__openguessr_submit_guess":
                    pin = pin_from_output(output, require_submitted=True)
                    if pin is not None:
                        successful_submits_since_anchor.append(
                            {
                                "lat": pin[0],
                                "lon": pin[1],
                                "call_id": call_id,
                            }
                        )
                    continue

                if tool_name != "mcp__nautilus__browser_take_screenshot":
                    continue

                tool_input = state.get("input")
                tool_input = tool_input if isinstance(tool_input, dict) else {}
                filename = str(tool_input.get("filename") or "")

                result_key = round_key_from_filename(filename, RESULT_SCREEN_RE)
                submitcheck_key = round_key_from_filename(
                    filename,
                    SUBMITCHECK_SCREEN_RE,
                )

                if result_key is not None:
                    file_run, dataset, round_number = result_key
                    if file_run != run:
                        raise RuntimeError(
                            f"Run mismatch in screenshot {filename}."
                        )
                    if not successful_submits_since_anchor:
                        raise RuntimeError(
                            f"{filename}: no successful submit found since "
                            "the previous scored-round anchor."
                        )
                    final_submit = successful_submits_since_anchor[-1]
                    assigned[(dataset, round_number)] = {
                        "pred_lat": final_submit["lat"],
                        "pred_lon": final_submit["lon"],
                        "evidence_type": "submitted_pin",
                        "verified_place_call_id": (
                            latest_verified_place["call_id"]
                            if latest_verified_place
                            else ""
                        ),
                        "successful_submit_call_id": final_submit["call_id"],
                        "successful_submit_count_since_previous_anchor": len(
                            successful_submits_since_anchor
                        ),
                        "anchor_screenshot": filename,
                    }
                    successful_submits_since_anchor = []
                    latest_verified_place = None
                    continue

                if submitcheck_key is not None:
                    file_run, dataset, round_number = submitcheck_key
                    if file_run != run:
                        raise RuntimeError(
                            f"Run mismatch in screenshot {filename}."
                        )
                    if successful_submits_since_anchor:
                        # A successful submit followed by SUBMITCHECK is not one
                        # of the preserved-pin exception cases; RESULT will be
                        # the authoritative anchor.
                        continue
                    if latest_verified_place is None:
                        raise RuntimeError(
                            f"{filename}: no verified place_guess pin available."
                        )
                    assigned[(dataset, round_number)] = {
                        "pred_lat": latest_verified_place["lat"],
                        "pred_lon": latest_verified_place["lon"],
                        "evidence_type": (
                            "verified_pin_preserved_after_submit_failure"
                        ),
                        "verified_place_call_id": latest_verified_place["call_id"],
                        "successful_submit_call_id": "",
                        "successful_submit_count_since_previous_anchor": 0,
                        "anchor_screenshot": filename,
                    }
                    latest_verified_place = None

            expected = [
                (dataset, round_number)
                for dataset in ("europe-easy", "europe-medium", "europe-hard")
                for round_number in range(1, EXPECTED_ROUNDS[dataset] + 1)
            ]
            missing = [key for key in expected if key not in assigned]
            extras = [key for key in assigned if key not in expected]
            if missing or extras:
                raise RuntimeError(
                    f"Run {run}: missing={missing}, extras={extras}."
                )

            for dataset, round_number in expected:
                evidence = assigned[(dataset, round_number)]
                rows.append(
                    {
                        "series_id": f"glm-5.3-flash-max/run-{run}",
                        "run": run,
                        "dataset": dataset,
                        "round": round_number,
                        "pred_lat": f'{evidence["pred_lat"]:.10g}',
                        "pred_lon": f'{evidence["pred_lon"]:.10g}',
                        "evidence_type": evidence["evidence_type"],
                        "verified_place_call_id": evidence[
                            "verified_place_call_id"
                        ],
                        "successful_submit_call_id": evidence[
                            "successful_submit_call_id"
                        ],
                        "successful_submit_count_since_previous_anchor": (
                            evidence[
                                "successful_submit_count_since_previous_anchor"
                            ]
                        ),
                        "anchor_screenshot": evidence["anchor_screenshot"],
                        "source_conversation": conversation_name,
                        "source_archive": source_label,
                        "source_archive_sha256": source_sha256,
                    }
                )

    if len(rows) != 75:
        raise RuntimeError(f"Expected 75 final predictions, extracted {len(rows)}.")

    preserved = [
        row
        for row in rows
        if row["evidence_type"]
        == "verified_pin_preserved_after_submit_failure"
    ]
    expected_preserved = {
        (3, "europe-easy", 7, 45.932, 14.806),
        (3, "europe-medium", 9, 53.4, -9.25),
    }
    actual_preserved = {
        (
            int(row["run"]),
            str(row["dataset"]),
            int(row["round"]),
            float(row["pred_lat"]),
            float(row["pred_lon"]),
        )
        for row in preserved
    }
    if actual_preserved != expected_preserved:
        raise RuntimeError(
            "Unexpected preserved-pin exception set: "
            f"{sorted(actual_preserved)}"
        )

    return rows


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    args = parse_args()
    source = args.archive.resolve()
    repo_root = find_repo_root(Path(__file__).resolve().parent)
    output = args.output
    if output is None:
        output = (
            repo_root / "analysis" / "evidence" / "glm_final_predictions.csv"
            if repo_root
            else Path.cwd() / "glm_final_predictions.csv"
        )
    output = output.resolve()

    rows = extract_source(source)
    write_csv(output, rows)

    preserved = sum(
        row["evidence_type"]
        == "verified_pin_preserved_after_submit_failure"
        for row in rows
    )
    print(f"Extracted {len(rows)} GLM final prediction coordinates.")
    print(f"- submitted pins: {len(rows) - preserved}")
    print(f"- verified pins preserved after submit failure: {preserved}")
    print(f"Wrote: {output}")


if __name__ == "__main__":
    main()
