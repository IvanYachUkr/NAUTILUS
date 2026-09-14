#!/usr/bin/env python3
"""
Embed the OpenGuessr static query images with the same SALAD model/preprocessing.

Default project layout:
repo/
├─ salad/
│  ├─ embed_openguessr_queries.py
│  └─ ...
└─ demo_and_extension/
   └─ data/
      ├─ competitions/europe-easy.json
      └─ starting-images/europe-easy/loc_XXX.png

The script derives ground-truth latitude/longitude from Google Maps URLs when
coordinates are embedded in the URL, matching the existing project convention.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from PIL import Image
from torchvision import transforms
from tqdm import tqdm

DESCRIPTOR_DIM = 8448
IMAGE_SIZE = (322, 322)

COORD_PATTERNS = [
    re.compile(r"@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)"),
    re.compile(r"!3d(-?\d+(?:\.\d+)?).*?!4d(-?\d+(?:\.\d+)?)"),
]


def parse_args() -> argparse.Namespace:
    here = Path(__file__).resolve().parent
    demo = here.parents[1] / "demo_and_extension"
    p = argparse.ArgumentParser()
    p.add_argument(
        "--competition-json",
        type=Path,
        default=demo / "data" / "competitions" / "europe-easy.json",
    )
    p.add_argument(
        "--images-dir",
        type=Path,
        default=demo / "data" / "starting-images" / "europe-easy",
    )
    p.add_argument(
        "--output",
        type=Path,
        default=here / "query_embeddings" / "europe-easy",
    )
    p.add_argument("--batch-size", type=int, default=8)
    p.add_argument(
        "--device",
        default="cuda" if torch.cuda.is_available() else "cpu",
        choices=["cuda", "cpu"],
    )
    p.add_argument(
        "--max-queries",
        type=int,
        default=None,
        help="Embed at most N queries. Useful for smoke tests.",
    )
    return p.parse_args()


def extract_lat_lon(link: str) -> tuple[float, float]:
    for pattern in COORD_PATTERNS:
        m = pattern.search(link)
        if m:
            return float(m.group(1)), float(m.group(2))
    raise ValueError(f"Could not derive coordinates from Google Maps link: {link}")


def load_locations(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return data
    for key in ("locations", "items", "entries"):
        if isinstance(data.get(key), list):
            return data[key]
    raise RuntimeError("Could not find a location list in competition JSON.")


def choose_image(images_dir: Path, item: dict, index: int) -> Path:
    # Prefer an explicit image field if the dataset has one.
    for key in ("image", "image_path", "starting_image", "filename"):
        value = item.get(key)
        if value:
            p = Path(value)
            if not p.is_absolute():
                p = images_dir / p.name
            if p.exists():
                return p

    # Existing project convention: loc_001.png, loc_002.png, ...
    candidates = []
    raw_id = item.get("id")
    if raw_id is not None:
        s = str(raw_id)
        candidates.extend([
            images_dir / f"{s}.png",
            images_dir / f"{s}.jpg",
            images_dir / f"loc_{s}.png",
            images_dir / f"loc_{s}.jpg",
        ])
        try:
            numeric = int(s)
            candidates.extend([
                images_dir / f"loc_{numeric:03d}.png",
                images_dir / f"loc_{numeric:03d}.jpg",
            ])
        except ValueError:
            pass

    candidates.extend([
        images_dir / f"loc_{index + 1:03d}.png",
        images_dir / f"loc_{index + 1:03d}.jpg",
    ])

    for p in candidates:
        if p.exists():
            return p

    raise FileNotFoundError(
        f"No static image found for item #{index + 1}. Tried: "
        + ", ".join(str(x) for x in candidates)
    )


def main() -> None:
    args = parse_args()
    args.output.mkdir(parents=True, exist_ok=True)

    locations = load_locations(args.competition_json)
    if args.max_queries is not None:
        if args.max_queries <= 0:
            raise ValueError("--max-queries must be > 0")
        locations = locations[:args.max_queries]
        print(f"[test limit] Restricted query embedding to {len(locations)} query image(s).")

    transform = transforms.Compose(
        [
            transforms.Resize(IMAGE_SIZE, interpolation=transforms.InterpolationMode.BILINEAR),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ]
    )

    model = torch.hub.load("serizba/salad", "dinov2_salad", trust_repo=True)
    model = model.eval().to(args.device)

    records = []
    tensors = []
    for i, item in enumerate(locations):
        image_path = choose_image(args.images_dir, item, i)
        link = (
            item.get("google_maps_link")
            or item.get("googleMapsLink")
            or item.get("maps_link")
            or item.get("url")
        )
        if not link:
            raise RuntimeError(f"Location #{i + 1} has no Google Maps link.")
        lat, lon = extract_lat_lon(str(link))

        with Image.open(image_path) as im:
            tensors.append(transform(im.convert("RGB")))

        records.append(
            {
                "query_id": str(item.get("id", f"loc_{i + 1:03d}")),
                "image_path": str(image_path.resolve()),
                "gt_latitude": lat,
                "gt_longitude": lon,
                "country": item.get("country", ""),
                "city_or_region": item.get("city_or_region", ""),
            }
        )

    all_desc = []
    with torch.inference_mode():
        for start in tqdm(range(0, len(tensors), args.batch_size), desc="SALAD queries"):
            batch = torch.stack(tensors[start:start + args.batch_size]).to(args.device)
            desc = model(batch)
            if isinstance(desc, (tuple, list)):
                desc = desc[0]
            if desc.ndim != 2 or desc.shape[1] != DESCRIPTOR_DIM:
                raise RuntimeError(f"Unexpected SALAD output shape: {tuple(desc.shape)}")
            all_desc.append(desc.detach().float().cpu().numpy())

    embeddings = np.concatenate(all_desc, axis=0).astype(np.float32, copy=False)
    np.save(args.output / "queries.npy", embeddings, allow_pickle=False)
    pd.DataFrame(records).to_csv(args.output / "queries.csv", index=False)

    print(f"Saved {len(records)} query descriptors to {args.output}")
    print(f"Shape: {embeddings.shape}, dtype={embeddings.dtype}")


if __name__ == "__main__":
    main()
