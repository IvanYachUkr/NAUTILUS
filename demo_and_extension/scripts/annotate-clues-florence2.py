#!/usr/bin/env python3
"""Ground canonical NAUTILUS clue phrases on starting images with Florence-2.

Florence phrase grounding does not expose a calibrated confidence score. Every
generated region is therefore saved as ``needs-review`` and must be accepted,
adjusted, or marked text-only in the local clue review tool.
"""

from __future__ import annotations

import argparse
from collections import defaultdict
from difflib import SequenceMatcher
import json
import os
from pathlib import Path
import re
from tempfile import NamedTemporaryFile

import torch
from PIL import Image
from transformers import AutoModelForCausalLM, AutoProcessor


PROJECT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_CLUES_DIR = PROJECT_DIR / "data" / "clues"
DEFAULT_IMAGES_DIR = PROJECT_DIR / "data" / "starting-images"
TASK = "<CAPTION_TO_PHRASE_GROUNDING>"
DEFAULT_MODEL_REVISION = "21a599d414c4d928c9032694c424fb94458e3594"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--clues", type=Path, default=DEFAULT_CLUES_DIR)
    parser.add_argument("--images", type=Path, default=DEFAULT_IMAGES_DIR)
    parser.add_argument("--model", default="microsoft/Florence-2-large")
    parser.add_argument("--device", choices=["auto", "cpu", "cuda"], default="auto")
    parser.add_argument("--clue-set", action="append", dest="clue_sets", default=[])
    parser.add_argument("--clue-set-suffix", default=None, help="Annotate every clue set whose ID ends with this value.")
    parser.add_argument("--max-items", type=int, default=None)
    parser.add_argument("--force", action="store_true", help="Replace existing Florence draft regions.")
    parser.add_argument(
        "--model-revision",
        default=DEFAULT_MODEL_REVISION,
        help="Immutable Hugging Face model revision (pinned to the reviewed Microsoft checkpoint by default).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    device = resolve_device(args.device)
    dtype = torch.float16 if device == "cuda" else torch.float32
    load_kwargs = {"torch_dtype": dtype}
    if args.model_revision:
        load_kwargs["revision"] = args.model_revision

    print(f"Loading {args.model} on {device} ({dtype})…", flush=True)
    processor = AutoProcessor.from_pretrained(
        args.model,
        trust_remote_code=True,
        **({"revision": args.model_revision} if args.model_revision else {}),
    )
    model = AutoModelForCausalLM.from_pretrained(
        args.model,
        trust_remote_code=True,
        **load_kwargs,
    ).to(device)
    model.eval()

    processed = 0
    grounded = 0
    files = sorted(args.clues.glob("*.json"))
    for clue_path in files:
        document = json.loads(clue_path.read_text(encoding="utf-8"))
        requested_sets = set(args.clue_sets or ([] if args.clue_set_suffix else ["gemini-3.7-flash-high-aided"]))
        clue_sets = [
            item for item in document.get("clueSets", [])
            if item.get("id") in requested_sets
            or (args.clue_set_suffix and str(item.get("id", "")).endswith(args.clue_set_suffix))
        ]
        if not clue_sets:
            continue
        changed = False
        image_cache = {}
        for clue_set in clue_sets:
            candidates = [
                clue for clue in clue_set.get("cues", [])
                if clue.get("annotationStatus") not in {"text-only", "excluded"}
                and (args.force or clue.get("annotationStatus") == "pending-grounding")
            ]
            if args.max_items is not None:
                candidates = candidates[:max(0, args.max_items - processed)]

            if candidates:
                image_path = image_path_for_clue_set(args.images, document["locationId"], clue_set)
                if image_path not in image_cache:
                    image_cache[image_path] = Image.open(image_path).convert("RGB")
                image = image_cache[image_path]
                phrases = [clue.get("groundingPhrase") or clue.get("label") or clue["text"] for clue in candidates]
                proposals = ground_phrases(model, processor, image, phrases, device)
                changed = True

                for index, (clue, phrase) in enumerate(zip(candidates, phrases, strict=True)):
                    matches = proposals.get(index, [])
                    processed += 1
                    if not matches:
                        clue["region"] = None
                        clue["regionSource"] = args.model
                        clue["annotationStatus"] = "not-grounded"
                        clue.pop("groundingLabel", None)
                        print(f"[{processed}] no box  {document['locationId']} · {clue['label']}", flush=True)
                        continue

                    boxes = [match[0] for match in matches]
                    box = union_boxes(boxes)
                    grounding_labels = list(dict.fromkeys(match[1] for match in matches if match[1]))
                    clue["region"] = normalize_box(box, image.width, image.height)
                    clue["regionSource"] = args.model
                    clue["annotationStatus"] = "needs-review"
                    clue["groundingLabel"] = "; ".join(grounding_labels) or phrase
                    grounded += 1
                    print(f"[{processed}] grounded {document['locationId']} · {clue['label']}", flush=True)

            if args.max_items is not None and processed >= args.max_items:
                break

        if changed:
            write_json_atomic(clue_path, document)
        if args.max_items is not None and processed >= args.max_items:
            break

    print(f"Florence annotation complete: {grounded}/{processed} phrases received draft regions.")


@torch.inference_mode()
def ground_phrases(model, processor, image: Image.Image, phrases: list[str], device: str):
    """Ground all clues for one scene in one native Florence caption task."""
    caption = ". ".join(phrase.rstrip(". ") for phrase in phrases) + "."
    prompt = f"{TASK}{caption}"
    inputs = processor(text=prompt, images=image, return_tensors="pt")
    inputs = {key: value.to(device) if hasattr(value, "to") else value for key, value in inputs.items()}
    generated_ids = model.generate(
        input_ids=inputs["input_ids"],
        pixel_values=inputs["pixel_values"],
        max_new_tokens=1024,
        num_beams=3,
        do_sample=False,
    )
    generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
    parsed = processor.post_process_generation(generated_text, task=TASK, image_size=(image.width, image.height))
    result = parsed.get(TASK, parsed)
    boxes = result.get("bboxes") or []
    labels = [str(label).strip() for label in (result.get("labels") or [])]
    assignments = defaultdict(list)
    for output_index, box in enumerate(boxes):
        label = labels[output_index] if output_index < len(labels) else ""
        target = best_phrase_index(label, phrases)
        if target is None and len(boxes) == len(phrases):
            target = output_index
        if target is not None:
            assignments[target].append((box, label))
    return assignments


def best_phrase_index(label: str, phrases: list[str]) -> int | None:
    if not label:
        return None
    scores = [phrase_similarity(label, phrase) for phrase in phrases]
    best = max(range(len(scores)), key=scores.__getitem__)
    return best if scores[best] >= 0.2 else None


def phrase_similarity(left: str, right: str) -> float:
    left_norm = normalize_phrase(left)
    right_norm = normalize_phrase(right)
    left_tokens = set(left_norm.split())
    right_tokens = set(right_norm.split())
    overlap = len(left_tokens & right_tokens) / max(1, len(left_tokens | right_tokens))
    return max(overlap, SequenceMatcher(None, left_norm, right_norm).ratio())


def normalize_phrase(value: str) -> str:
    return " ".join(re.findall(r"[a-z0-9]+", value.casefold()))


def union_boxes(boxes) -> list[float]:
    # Multiple instances of one phrase stay visible as one conservative draft
    # region until the reviewer narrows or splits the evidence manually.
    return [
        min(float(box[0]) for box in boxes),
        min(float(box[1]) for box in boxes),
        max(float(box[2]) for box in boxes),
        max(float(box[3]) for box in boxes),
    ]


def normalize_box(box, width: int, height: int) -> dict[str, float]:
    x1, y1, x2, y2 = box
    x1 = max(0.0, min(float(width), x1))
    y1 = max(0.0, min(float(height), y1))
    x2 = max(x1, min(float(width), x2))
    y2 = max(y1, min(float(height), y2))
    return {
        "x": round(x1 / width, 6),
        "y": round(y1 / height, 6),
        "w": round((x2 - x1) / width, 6),
        "h": round((y2 - y1) / height, 6),
    }


def image_path_for_clue_set(images_dir: Path, location_id: str, clue_set: dict) -> Path:
    configured = clue_set.get("imagePath")
    if configured:
        path = PROJECT_DIR / configured
        if not path.is_file():
            raise FileNotFoundError(f"No clue-set image for {location_id}: {path}")
        return path
    competition, local_id = location_id.split("--", 1)
    path = images_dir / competition / f"{local_id.replace('-', '_')}.png"
    if not path.is_file():
        raise FileNotFoundError(f"No starting image for {location_id}: {path}")
    return path


def resolve_device(requested: str) -> str:
    if requested == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("CUDA was requested but torch cannot access a CUDA device.")
    if requested == "auto":
        return "cuda" if torch.cuda.is_available() else "cpu"
    return requested


def write_json_atomic(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        json.dump(value, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
        temporary = Path(handle.name)
    os.replace(temporary, path)


if __name__ == "__main__":
    main()
