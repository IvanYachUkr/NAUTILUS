r"""Local Chipoint v2 street-view batch evaluation.

This implements the public Chipoint v2 street-view fused-retrieval path locally,
adapted for an 8 GB GTX 1070:

1. Encode every benchmark image with one tower at a time:
   - SigLIP2 SO400M
   - GOPT
   - DINOv3 ViT-L
2. Unload each encoder after its query embeddings are produced.
3. Scan the official precomputed 4.89M-row gallery for each tower in GPU chunks.
4. Keep the top-200 retrievals per tower.
5. Z-score and fuse the tower retrievals, keeping the best 64 candidates.
6. Predict with the same cluster-consensus fallback used by the public Space.

The unpublished 23-feature reranker is NOT used.

The first run downloads only the street-view assets needed from:
    chiikabu-labs/chipoint-2

Run:
    python chipointv2_local_batch_eval.py
    python chipointv2_local_batch_eval.py --dataset europe-medium
    python chipointv2_local_batch_eval.py --dataset europe-hard

Measure true per-image inference runtimes (slower; scans each gallery once per image):
    python chipointv2_local_batch_eval.py --measure-per-image-runtime
    python chipointv2_local_batch_eval.py --dataset europe-medium --measure-per-image-runtime

Per-image inference excludes model/download initialization and image disk decoding. It includes:
    - three tower forward passes (including preprocessing + host-to-GPU transfer),
    - three complete gallery scans for that query,
    - fusion + cluster-consensus coordinate prediction.
"""

from __future__ import annotations

import argparse
import csv
import gc
import json
import math
import os
import re
import statistics
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent

# Keep project/model caches inside chipointv2 by default.
os.environ.setdefault("HF_HOME", str(SCRIPT_DIR / ".cache" / "huggingface"))
os.environ.setdefault("TORCH_HOME", str(SCRIPT_DIR / ".cache" / "torch"))
os.environ.setdefault("MODELSCOPE_CACHE", str(SCRIPT_DIR / ".cache" / "modelscope"))
os.environ.setdefault("PYTORCH_CUDA_ALLOC_CONF", "expandable_segments:True")

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from geopy.distance import geodesic
from huggingface_hub import hf_hub_download
from PIL import Image
from tqdm import tqdm


# ---------------------------------------------------------------------------
# Fixed benchmark configuration
# ---------------------------------------------------------------------------

MODEL_REPO = "chiikabu-labs/chipoint-2"

TOP_K = 10
POOL_M = 200
FUSE_K = 64

# GTX 1070: galleries are stored fp16 on disk, but Pascal consumer GPUs are
# better suited to FP32 compute. 500k x 512 float32 is ~1.0 GB on the GPU.
CHUNK_ROWS = 500_000
RETRIEVAL_DTYPE = torch.float32

ENCODER_BATCH_SIZE = 1

DISTANCE_THRESHOLDS_KM = (1, 25, 200, 750, 2500)
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}

ASSET_DIR = SCRIPT_DIR / ".cache" / "chipoint2_model"
QUERY_CACHE_DIR = SCRIPT_DIR / ".cache" / "query_embeddings"

STREET_COORDS_FILE = "street_gallery/gallery_all_C_so400m256.npy"

TOWER_REGISTRY = {
    "so400m256": {
        "kind": "open_clip",
        "open_clip_name": "ViT-SO400M-16-SigLIP2-256",
        "pretrained": "webli",
        "input_dim": 1152,
        "gallery": "street_gallery/proj_head_gallery_512_so400m256.npy",
    },
    "gopt": {
        "kind": "open_clip",
        "open_clip_name": "ViT-gopt-16-SigLIP2-256",
        "pretrained": "webli",
        "input_dim": 1536,
        "gallery": "street_gallery/proj_head_gallery_512_gopt.npy",
    },
    "dinov3": {
        "kind": "dinov3",
        "modelscope_id": "facebook/dinov3-vitl16-pretrain-lvd1689m",
        "input_dim": 1024,
        "gallery": "street_gallery/proj_head_gallery_512_dinov3.npy",
    },
}

GOOGLE_MAPS_COORD_RE = re.compile(
    r"/maps/@(?P<lat>[+-]?(?:\d+(?:\.\d*)?|\.\d+)),"
    r"(?P<lon>[+-]?(?:\d+(?:\.\d*)?|\.\d+))"
)


# ---------------------------------------------------------------------------
# Small network used by the official projection-head checkpoints
# ---------------------------------------------------------------------------

class ProjHead(nn.Module):
    def __init__(self, input_dim: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 1024),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(1024, 512),
        )

    def forward(self, x):
        return self.net(x)


# ---------------------------------------------------------------------------
# CLI / benchmark data
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Local Chipoint v2 street-view batch evaluation."
    )
    parser.add_argument(
        "--dataset",
        default="europe-easy",
        help="Dataset id. Default: europe-easy",
    )
    parser.add_argument(
        "--demo-root",
        type=Path,
        default=SCRIPT_DIR.parents[1] / "demo_and_extension",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=SCRIPT_DIR / "results",
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
    parser.add_argument(
        "--measure-per-image-runtime",
        action="store_true",
        help=(
            "Measure inference latency separately for every image. "
            "This bypasses cached query embeddings and scans each 4.89M-row "
            "gallery independently for every query, so it is much slower than "
            "the normal batched evaluation. Model/download initialization and "
            "image disk decoding are excluded from inference_seconds."
        ),
    )
    return parser.parse_args()


def extract_coordinates(link: str) -> tuple[float, float]:
    match = GOOGLE_MAPS_COORD_RE.search(link)
    if not match:
        raise ValueError(f"Could not extract coordinates from: {link}")
    return float(match.group("lat")), float(match.group("lon"))


def load_ground_truth(path: Path) -> dict[str, dict[str, Any]]:
    competition = json.loads(path.read_text(encoding="utf-8"))
    truth: dict[str, dict[str, Any]] = {}

    for location in competition.get("locations", []):
        lat, lon = extract_coordinates(location["google_maps_link"])
        truth[location["id"]] = {
            "lat": lat,
            "lon": lon,
            "country": location.get("country"),
            "city_or_region": location.get("city_or_region"),
            "difficulty": location.get("difficulty"),
            "primary_clue_type": location.get("primary_clue_type"),
        }

    if not truth:
        raise ValueError(f"No locations found in {path}")

    return truth


def find_images(image_dir: Path) -> list[Path]:
    return sorted(
        path
        for path in image_dir.iterdir()
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    )


def repo_relative_path(path: Path) -> str:
    repo_root = SCRIPT_DIR.parents[1]
    absolute = path.resolve()
    try:
        return absolute.relative_to(repo_root).as_posix()
    except ValueError:
        return Path(os.path.relpath(absolute, repo_root)).as_posix()


# ---------------------------------------------------------------------------
# Downloads
# ---------------------------------------------------------------------------

def download_model_file(filename: str) -> Path:
    """Download a required Chipoint file directly into the project cache."""
    return Path(
        hf_hub_download(
            repo_id=MODEL_REPO,
            filename=filename,
            repo_type="model",
            local_dir=ASSET_DIR,
        )
    )


def ensure_street_assets() -> tuple[Path, dict[str, Path], dict[str, Path]]:
    print("\nChecking/downloading Chipoint v2 street assets...")
    print("The three gallery files are about 5 GB each and download only once.")

    coords_path = download_model_file(STREET_COORDS_FILE)

    gallery_paths: dict[str, Path] = {}
    head_paths: dict[str, Path] = {}

    for tag, spec in TOWER_REGISTRY.items():
        print(f"\n[{tag}] projection head")
        head_paths[tag] = download_model_file(f"weights/proj_head_{tag}.pt")

        print(f"[{tag}] street gallery")
        gallery_paths[tag] = download_model_file(spec["gallery"])

    return coords_path, gallery_paths, head_paths


# ---------------------------------------------------------------------------
# CUDA / memory
# ---------------------------------------------------------------------------

def require_cuda() -> torch.device:
    if not torch.cuda.is_available():
        raise RuntimeError(
            "CUDA is not available. This local Chipoint script requires the GTX 1070."
        )

    device = torch.device("cuda")
    props = torch.cuda.get_device_properties(device)

    print(f"PyTorch:    {torch.__version__}")
    print(f"CUDA:       {torch.version.cuda}")
    print(f"GPU:        {props.name}")
    print(f"VRAM:       {props.total_memory / 1024**3:.1f} GB")

    return device


def clear_gpu() -> None:
    gc.collect()
    torch.cuda.empty_cache()
    try:
        torch.cuda.ipc_collect()
    except Exception:
        pass


def load_projection_head(
    tag: str,
    input_dim: int,
    head_path: Path,
    device: torch.device,
) -> ProjHead:
    ckpt = torch.load(
        head_path,
        map_location="cpu",
        weights_only=False,
    )

    head = ProjHead(input_dim)
    state = {
        key: value
        for key, value in ckpt.items()
        if key.startswith("net.")
    }
    head.load_state_dict(state)

    # Keep the official public Space behavior for the projection head.
    return head.to(device).half().eval()


# ---------------------------------------------------------------------------
# Tower encoding
# ---------------------------------------------------------------------------

def make_dinov3_preprocess(processor):
    import torchvision.transforms as T

    transform = T.Compose(
        [
            T.Resize(256),
            T.CenterCrop(224),
            T.ToTensor(),
        ]
    )

    mean = torch.tensor(processor.image_mean).view(3, 1, 1)
    std = torch.tensor(processor.image_std).view(3, 1, 1)

    def preprocess(image: Image.Image) -> torch.Tensor:
        return (transform(image.convert("RGB")) - mean) / std

    return preprocess


_SAFETENSORS_PREAD_PATCHED = False


def use_windows_safetensors_pread() -> None:
    """Avoid Windows access violations when loading large safetensors files."""
    global _SAFETENSORS_PREAD_PATCHED

    if os.name != "nt" or _SAFETENSORS_PREAD_PATCHED:
        return

    import safetensors.torch as safetensors_torch

    original_load_file = safetensors_torch.load_file

    def load_file_pread(filename, device="cpu", **kwargs):
        kwargs["backend"] = "pread"
        return original_load_file(
            filename,
            device=device,
            **kwargs,
        )

    safetensors_torch.load_file = load_file_pread
    _SAFETENSORS_PREAD_PATCHED = True

    print("Windows safetensors workaround enabled: backend=pread")


def load_openclip_tower(
    tag: str,
    spec: dict[str, Any],
    head_path: Path,
    device: torch.device,
):
    use_windows_safetensors_pread()

    import open_clip

    print(f"\nLoading {tag}: {spec['open_clip_name']} / {spec['pretrained']}")

    started = time.perf_counter()

    model, _, preprocess = open_clip.create_model_and_transforms(
        spec["open_clip_name"],
        pretrained=spec["pretrained"],
    )

    # Half precision is needed to comfortably fit the larger towers in 8 GB.
    model = model.to(device).half().eval()
    head = load_projection_head(
        tag,
        spec["input_dim"],
        head_path,
        device,
    )

    print(f"Loaded {tag} in {time.perf_counter() - started:.2f} s.")

    @torch.inference_mode()
    def encode_batch(images: list[Image.Image]) -> torch.Tensor:
        pixels = torch.stack(
            [preprocess(image.convert("RGB")) for image in images]
        ).to(device)

        emb = model.encode_image(pixels.half())
        emb = F.normalize(emb.float(), dim=-1)

        projected = head(emb.half()).float()
        return F.normalize(projected, dim=-1)

    return model, head, encode_batch


def load_dinov3_tower(
    tag: str,
    spec: dict[str, Any],
    head_path: Path,
    device: torch.device,
):
    from modelscope import snapshot_download
    from transformers import AutoImageProcessor, AutoModel

    print(f"\nLoading {tag}: {spec['modelscope_id']}")

    started = time.perf_counter()

    source = os.environ.get("DINOV3_PATH")
    if not source:
        source = snapshot_download(
            spec["modelscope_id"],
            cache_dir=os.environ["MODELSCOPE_CACHE"],
        )

    # The official Space uses bf16 on A10G. GTX 1070/Pascal does not support
    # bf16 compute, so use fp32 locally.
    try:
        model = AutoModel.from_pretrained(
            source,
            dtype=torch.float32,
        )
    except TypeError:
        model = AutoModel.from_pretrained(
            source,
            torch_dtype=torch.float32,
        )

    model = model.to(device).eval()
    processor = AutoImageProcessor.from_pretrained(source)
    preprocess = make_dinov3_preprocess(processor)

    head = load_projection_head(
        tag,
        spec["input_dim"],
        head_path,
        device,
    )

    print(f"Loaded {tag} in {time.perf_counter() - started:.2f} s.")

    @torch.inference_mode()
    def encode_batch(images: list[Image.Image]) -> torch.Tensor:
        pixels = torch.stack(
            [preprocess(image) for image in images]
        ).to(device, dtype=torch.float32)

        output = model(pixel_values=pixels)

        if getattr(output, "pooler_output", None) is not None:
            emb = output.pooler_output
        else:
            emb = output.last_hidden_state[:, 0]

        emb = F.normalize(emb.float(), dim=-1)

        projected = head(emb.half()).float()
        return F.normalize(projected, dim=-1)

    return model, head, encode_batch


def query_cache_path(
    dataset: str,
    tag: str,
    cache_namespace: str | None = None,
) -> Path:
    if cache_namespace is None:
        return QUERY_CACHE_DIR / f"{dataset}_{tag}_queries.npy"

    return QUERY_CACHE_DIR / (
        f"{dataset}_{cache_namespace}_{tag}_queries.npy"
    )


def encode_dataset_for_tower(
    tag: str,
    spec: dict[str, Any],
    head_path: Path,
    image_paths: list[Path],
    dataset: str,
    device: torch.device,
    cache_namespace: str | None = None,
    measure_per_image_runtime: bool = False,
) -> tuple[np.ndarray, float, list[float] | None]:
    cache_path = query_cache_path(
        dataset,
        tag,
        cache_namespace,
    )

    if cache_path.exists() and not measure_per_image_runtime:
        cached = np.load(cache_path)

        if cached.shape == (len(image_paths), 512):
            print(f"\n[{tag}] using cached query embeddings: {cache_path}")
            return cached.astype(np.float32, copy=False), 0.0, None

        print(f"[{tag}] ignoring incompatible query cache: {cache_path}")
    elif cache_path.exists() and measure_per_image_runtime:
        print(
            f"\n[{tag}] runtime mode: bypassing cached query embeddings "
            f"so encoding time is measured."
        )

    if measure_per_image_runtime and ENCODER_BATCH_SIZE != 1:
        raise RuntimeError(
            "Per-image inference measurement requires ENCODER_BATCH_SIZE = 1."
        )

    if spec["kind"] == "open_clip":
        model, head, encode_batch = load_openclip_tower(
            tag,
            spec,
            head_path,
            device,
        )
    else:
        model, head, encode_batch = load_dinov3_tower(
            tag,
            spec,
            head_path,
            device,
        )

    # Warm up the loaded tower once before measuring per-image latency.
    # This avoids charging CUDA/kernel first-use overhead to loc_001 while
    # keeping model loading and image disk decoding outside inference_seconds.
    if measure_per_image_runtime:
        with Image.open(image_paths[0]) as warmup_opened:
            warmup_image = warmup_opened.convert("RGB").copy()
        torch.cuda.synchronize(device)
        warmup_query = encode_batch([warmup_image])
        torch.cuda.synchronize(device)
        del warmup_query, warmup_image
        print(f"[{tag}] completed one unmeasured encoder warm-up pass.")

    wall_started = time.perf_counter()
    vectors: list[np.ndarray] = []
    per_image_seconds: list[float] | None = (
        [] if measure_per_image_runtime else None
    )

    try:
        progress = tqdm(
            total=len(image_paths),
            desc=f"Encode {tag}",
            unit="img",
            dynamic_ncols=True,
        )

        try:
            for start in range(0, len(image_paths), ENCODER_BATCH_SIZE):
                batch_paths = image_paths[start : start + ENCODER_BATCH_SIZE]

                # Intentionally load/decode the image before starting the timer.
                # inference_seconds is inference latency, not filesystem latency.
                images = []
                for path in batch_paths:
                    with Image.open(path) as image:
                        images.append(image.convert("RGB").copy())

                if measure_per_image_runtime:
                    torch.cuda.synchronize(device)
                    sample_started = time.perf_counter()

                query = encode_batch(images)
                query_np = query.cpu().numpy().astype(np.float32, copy=False)

                if measure_per_image_runtime:
                    torch.cuda.synchronize(device)
                    assert per_image_seconds is not None
                    per_image_seconds.append(
                        time.perf_counter() - sample_started
                    )

                vectors.append(query_np)
                progress.update(len(batch_paths))
        finally:
            progress.close()

    finally:
        # Critical for an 8 GB card: completely unload this encoder before
        # loading the next one. Model loading/unloading is intentionally not
        # included in per-image runtime.
        del encode_batch
        del head
        del model
        clear_gpu()

    wall_elapsed = time.perf_counter() - wall_started

    queries = np.concatenate(vectors, axis=0)

    QUERY_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    np.save(cache_path, queries, allow_pickle=False)

    if per_image_seconds is not None:
        measured_elapsed = sum(per_image_seconds)
        print(
            f"[{tag}] encoded {len(image_paths)} images; "
            f"measured inference total={measured_elapsed:.2f} s, "
            f"wall={wall_elapsed:.2f} s; cached {cache_path}"
        )
    else:
        measured_elapsed = wall_elapsed
        print(
            f"[{tag}] encoded {len(image_paths)} images in "
            f"{wall_elapsed:.2f} s and cached {cache_path}"
        )

    return queries, measured_elapsed, per_image_seconds


# ---------------------------------------------------------------------------
# Batched full-gallery retrieval
# ---------------------------------------------------------------------------

@torch.inference_mode()
def scan_gallery_for_queries(
    gallery: np.memmap,
    queries_np: np.ndarray,
    device: torch.device,
    tag: str,
) -> tuple[np.ndarray, np.ndarray, float]:
    """Scan one complete 4.89M-row tower gallery against all dataset queries.

    Returns:
        indices: (Nq, POOL_M)
        scores:  (Nq, POOL_M)
    """
    n_queries = queries_np.shape[0]
    n_rows = gallery.shape[0]

    queries = torch.from_numpy(
        np.ascontiguousarray(queries_np)
    ).to(
        device=device,
        dtype=RETRIEVAL_DTYPE,
    )

    # Shape (M, Nq), so each column is one query's running top-M.
    best_sims = torch.full(
        (POOL_M, n_queries),
        -1e9,
        device=device,
        dtype=torch.float32,
    )
    best_idx = torch.zeros(
        (POOL_M, n_queries),
        device=device,
        dtype=torch.long,
    )

    started = time.perf_counter()

    progress = tqdm(
        total=n_rows,
        desc=f"Retrieve {tag}",
        unit="row",
        unit_scale=True,
        dynamic_ncols=True,
    )

    try:
        for start in range(0, n_rows, CHUNK_ROWS):
            end = min(n_rows, start + CHUNK_ROWS)

            # Gallery file stays fp16 on disk; materialize only this chunk.
            block_np = gallery[start:end]
            if not block_np.flags["C_CONTIGUOUS"]:
                block_np = np.ascontiguousarray(block_np)

            block = torch.from_numpy(block_np).to(
                device=device,
                dtype=RETRIEVAL_DTYPE,
                non_blocking=True,
            )

            # (chunk, 512) @ (512, Nq) -> (chunk, Nq)
            sims = block @ queries.T

            k = min(POOL_M, sims.shape[0])
            chunk_sims, chunk_local_idx = torch.topk(
                sims,
                k=k,
                dim=0,
            )

            chunk_global_idx = chunk_local_idx + start

            candidate_sims = torch.cat(
                [best_sims, chunk_sims.float()],
                dim=0,
            )
            candidate_idx = torch.cat(
                [best_idx, chunk_global_idx],
                dim=0,
            )

            merged_sims, order = torch.topk(
                candidate_sims,
                k=POOL_M,
                dim=0,
            )
            merged_idx = torch.gather(
                candidate_idx,
                dim=0,
                index=order,
            )

            best_sims = merged_sims
            best_idx = merged_idx

            del block, sims, chunk_sims, chunk_local_idx
            del chunk_global_idx, candidate_sims, candidate_idx, order

            progress.update(end - start)

    finally:
        progress.close()

    torch.cuda.synchronize(device)
    elapsed = time.perf_counter() - started

    # Return query-major arrays: (Nq, M)
    indices = best_idx.T.cpu().numpy()
    scores = best_sims.T.cpu().numpy()

    del queries, best_sims, best_idx
    clear_gpu()

    print(
        f"[{tag}] full {n_rows:,}-row gallery scanned for "
        f"{n_queries} queries in {elapsed:.2f} s."
    )

    return indices, scores, elapsed


@torch.inference_mode()
def scan_gallery_for_queries_individually(
    gallery: np.memmap,
    queries_np: np.ndarray,
    device: torch.device,
    tag: str,
) -> tuple[np.ndarray, np.ndarray, float, list[float]]:
    """Measure standalone retrieval latency for every query.

    Unlike scan_gallery_for_queries(), this deliberately performs one complete
    4.89M-row gallery scan per image. That avoids amortizing the gallery scan
    across the dataset and yields a defensible per-image latency.

    The returned retrieval candidates can be used by the normal fusion code.
    """
    n_queries = queries_np.shape[0]
    n_rows = gallery.shape[0]

    all_indices = np.empty((n_queries, POOL_M), dtype=np.int64)
    all_scores = np.empty((n_queries, POOL_M), dtype=np.float32)
    per_query_seconds: list[float] = []

    progress = tqdm(
        total=n_queries,
        desc=f"Retrieve {tag} per image",
        unit="img",
        dynamic_ncols=True,
    )

    try:
        for query_index in range(n_queries):
            # Synchronize before the clock starts so pending GPU work from a
            # previous query is never charged to the next image.
            torch.cuda.synchronize(device)
            started = time.perf_counter()

            query = torch.from_numpy(
                np.ascontiguousarray(queries_np[query_index])
            ).to(
                device=device,
                dtype=RETRIEVAL_DTYPE,
            )

            best_sims = torch.full(
                (POOL_M,),
                -1e9,
                device=device,
                dtype=torch.float32,
            )
            best_idx = torch.zeros(
                (POOL_M,),
                device=device,
                dtype=torch.long,
            )

            for start in range(0, n_rows, CHUNK_ROWS):
                end = min(n_rows, start + CHUNK_ROWS)

                block_np = gallery[start:end]
                if not block_np.flags["C_CONTIGUOUS"]:
                    block_np = np.ascontiguousarray(block_np)

                block = torch.from_numpy(block_np).to(
                    device=device,
                    dtype=RETRIEVAL_DTYPE,
                    non_blocking=True,
                )

                # (chunk, 512) @ (512,) -> (chunk,)
                sims = block @ query

                k = min(POOL_M, sims.shape[0])
                chunk_sims, chunk_local_idx = torch.topk(
                    sims,
                    k=k,
                    dim=0,
                )
                chunk_global_idx = chunk_local_idx + start

                candidate_sims = torch.cat(
                    [best_sims, chunk_sims.float()],
                    dim=0,
                )
                candidate_idx = torch.cat(
                    [best_idx, chunk_global_idx],
                    dim=0,
                )

                merged_sims, order = torch.topk(
                    candidate_sims,
                    k=POOL_M,
                    dim=0,
                )
                merged_idx = torch.gather(
                    candidate_idx,
                    dim=0,
                    index=order,
                )

                best_sims = merged_sims
                best_idx = merged_idx

                del block, sims, chunk_sims, chunk_local_idx
                del chunk_global_idx, candidate_sims, candidate_idx, order

            # The top retrieval results must reach CPU for the fusion stage, so
            # include those required device-to-host copies in inference timing.
            all_indices[query_index] = best_idx.cpu().numpy()
            all_scores[query_index] = best_sims.cpu().numpy()
            torch.cuda.synchronize(device)
            elapsed = time.perf_counter() - started
            per_query_seconds.append(elapsed)

            del query, best_sims, best_idx

            progress.set_postfix_str(f"last={elapsed:.2f}s")
            progress.update(1)
    finally:
        progress.close()

    clear_gpu()

    total = sum(per_query_seconds)
    print(
        f"[{tag}] {n_queries} independent full-gallery scans completed in "
        f"{total:.2f} s measured inference time."
    )

    return all_indices, all_scores, total, per_query_seconds


# ---------------------------------------------------------------------------
# Official public fusion + cluster-consensus fallback
# ---------------------------------------------------------------------------

def zscore(values: np.ndarray) -> np.ndarray:
    array = np.asarray(values, dtype=np.float64)
    return (array - array.mean()) / (array.std() + 1e-9)


def fuse_one_query(
    per_tower: dict[str, tuple[np.ndarray, np.ndarray]],
    query_index: int,
) -> tuple[np.ndarray, np.ndarray]:
    fused_scores: dict[int, float] = {}

    for tag, (indices, scores) in per_tower.items():
        idx = indices[query_index]
        sim = scores[query_index]

        for gallery_index, standardized_score in zip(idx, zscore(sim)):
            key = int(gallery_index)
            fused_scores[key] = (
                fused_scores.get(key, 0.0)
                + float(standardized_score)
            )

    fused_idx = np.array(
        sorted(
            fused_scores,
            key=lambda key: -fused_scores[key],
        )[:FUSE_K],
        dtype=np.int64,
    )

    fused_score = np.array(
        [fused_scores[int(index)] for index in fused_idx],
        dtype=np.float32,
    )

    return fused_idx, fused_score


def haversine_km(
    lat1: float,
    lon1: float,
    lat2: np.ndarray,
    lon2: np.ndarray,
) -> np.ndarray:
    radius = 6371.0

    la1 = np.radians(lat1)
    la2 = np.radians(lat2)

    dlat = np.radians(
        np.asarray(lat2, dtype=np.float64)
        - np.asarray(lat1, dtype=np.float64)
    )
    dlon = np.radians(
        np.asarray(lon2, dtype=np.float64)
        - np.asarray(lon1, dtype=np.float64)
    )

    a = (
        np.sin(dlat / 2) ** 2
        + np.cos(la1)
        * np.cos(la2)
        * np.sin(dlon / 2) ** 2
    )

    return radius * 2 * np.arcsin(
        np.sqrt(np.clip(a, 0.0, 1.0))
    )


def spherical_weighted_mean(
    lats: np.ndarray,
    lons: np.ndarray,
    scores: np.ndarray,
) -> tuple[float, float]:
    lat_radians = np.radians(np.asarray(lats, dtype=np.float64))
    lon_radians = np.radians(np.asarray(lons, dtype=np.float64))

    weights = (
        np.clip(
            np.asarray(scores, dtype=np.float64),
            0.0,
            None,
        )
        ** 4
    )

    if weights.sum() <= 0:
        weights = np.ones_like(weights)

    weights /= weights.sum()

    x = np.sum(weights * np.cos(lat_radians) * np.cos(lon_radians))
    y = np.sum(weights * np.cos(lat_radians) * np.sin(lon_radians))
    z = np.sum(weights * np.sin(lat_radians))

    latitude = np.degrees(
        np.arctan2(z, np.hypot(x, y))
    )
    longitude = np.degrees(
        np.arctan2(y, x)
    )

    return float(latitude), float(longitude)


def cluster_consensus(
    coords: np.ndarray,
    scores: np.ndarray,
) -> tuple[float, float, np.ndarray]:
    members = np.array([0])

    for radius_km in (250.0, 500.0, 1000.0):
        distances = haversine_km(
            float(coords[0, 0]),
            float(coords[0, 1]),
            coords[:, 0],
            coords[:, 1],
        )

        members = np.where(
            distances <= radius_km
        )[0]

        if members.size >= 3:
            break

    latitude, longitude = spherical_weighted_mean(
        coords[members, 0],
        coords[members, 1],
        scores[members],
    )

    return latitude, longitude, members


# ---------------------------------------------------------------------------
# Evaluation metrics
# ---------------------------------------------------------------------------

def distance_km(
    gt_lat: float,
    gt_lon: float,
    pred_lat: float,
    pred_lon: float,
) -> float:
    return float(
        geodesic(
            (gt_lat, gt_lon),
            (pred_lat, pred_lon),
        ).km
    )


def population_std(values: list[float]) -> float:
    return statistics.pstdev(values) if len(values) > 1 else 0.0


def rmse(values: list[float]) -> float:
    return math.sqrt(
        sum(value * value for value in values)
        / len(values)
    )


def percent_within(values: list[float], threshold: float) -> float:
    return (
        100.0
        * sum(value <= threshold for value in values)
        / len(values)
    )


def round_float(value: float, digits: int = 6) -> float:
    return round(float(value), digits)


def build_summary(
    results: list[dict[str, Any]],
    dataset: str,
    query_encoding_seconds: dict[str, float],
    retrieval_seconds: dict[str, float],
    measure_per_image_runtime: bool,
) -> dict[str, Any]:
    errors = [
        float(result["prediction"]["error_km"])
        for result in results
    ]

    best = min(
        results,
        key=lambda result: result["prediction"]["error_km"],
    )
    worst = max(
        results,
        key=lambda result: result["prediction"]["error_km"],
    )

    timing: dict[str, Any] = {
        "mode": (
            "per-image-independent"
            if measure_per_image_runtime
            else "batched"
        ),
        "query_encoding_seconds_by_tower": {
            key: round_float(value, 3)
            for key, value in query_encoding_seconds.items()
        },
        "retrieval_seconds_by_tower": {
            key: round_float(value, 3)
            for key, value in retrieval_seconds.items()
        },
        "total_query_encoding_seconds": round_float(
            sum(query_encoding_seconds.values()),
            3,
        ),
        "total_gallery_retrieval_seconds": round_float(
            sum(retrieval_seconds.values()),
            3,
        ),
    }

    if measure_per_image_runtime:
        runtimes = [
            float(result["inference_seconds"])
            for result in results
        ]
        timing["inference_definition"] = (
            "Per-image inference latency: three tower encodes + three "
            "independent full-gallery scans + fusion/cluster consensus. "
            "Predictions still use the original batched retrieval path; the "
            "independent scans are a separate warmed timing pass. Excludes "
            "model/download initialization and image disk decoding."
        )
        timing["per_image_inference_seconds"] = {
            result["location_id"]: round_float(
                result["inference_seconds"],
                3,
            )
            for result in results
        }
        timing["inference_seconds_summary"] = {
            "mean": round_float(statistics.mean(runtimes), 3),
            "median": round_float(statistics.median(runtimes), 3),
            "std_population": round_float(population_std(runtimes), 3),
            "min": round_float(min(runtimes), 3),
            "max": round_float(max(runtimes), 3),
        }

    return {
        "dataset": dataset,
        "model": "Chipoint v2 local public street-view fused retrieval",
        "model_repo": MODEL_REPO,
        "pipeline": (
            "3-tower street retrieval; top-200/tower; z-score fusion; "
            "top-64 pool; cluster-consensus prediction"
        ),
        "reranker": "not used",
        "device": torch.cuda.get_device_name(0),
        "retrieval_dtype": str(RETRIEVAL_DTYPE),
        "gallery_chunk_rows": CHUNK_ROWS,
        "top_k_prediction": TOP_K,
        "n_images": len(results),
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "distance_unit": "km",
        "prediction_error": {
            "mean_km": round_float(statistics.mean(errors), 3),
            "median_km": round_float(statistics.median(errors), 3),
            "std_km": round_float(population_std(errors), 3),
            "rmse_km": round_float(rmse(errors), 3),
            "min_km": round_float(min(errors), 3),
            "max_km": round_float(max(errors), 3),
        },
        "prediction_threshold_accuracy": {
            f"within_{threshold}_km_percent": round_float(
                percent_within(errors, threshold),
                3,
            )
            for threshold in DISTANCE_THRESHOLDS_KM
        },
        "best_prediction_case": {
            "location_id": best["location_id"],
            "city_or_region": best["ground_truth"].get("city_or_region"),
            "error_km": round_float(
                best["prediction"]["error_km"],
                3,
            ),
        },
        "worst_prediction_case": {
            "location_id": worst["location_id"],
            "city_or_region": worst["ground_truth"].get("city_or_region"),
            "error_km": round_float(
                worst["prediction"]["error_km"],
                3,
            ),
        },
        "timing": timing,
    }


def write_csv(
    path: Path,
    results: list[dict[str, Any]],
) -> None:
    fields = [
        "location_id",
        "country",
        "city_or_region",
        "difficulty",
        "primary_clue_type",
        "gt_lat",
        "gt_lon",
        "pred_lat",
        "pred_lon",
        "raw_fused_top1_lat",
        "raw_fused_top1_lon",
        "raw_fused_top1_score",
        "cluster_size",
        "prediction_error_km",
        "inference_seconds",
        "image",
    ]

    with path.open(
        "w",
        newline="",
        encoding="utf-8-sig",
    ) as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=fields,
        )
        writer.writeheader()

        for result in results:
            truth = result["ground_truth"]
            pred = result["prediction"]

            writer.writerow(
                {
                    "location_id": result["location_id"],
                    "country": truth.get("country"),
                    "city_or_region": truth.get("city_or_region"),
                    "difficulty": truth.get("difficulty"),
                    "primary_clue_type": truth.get("primary_clue_type"),
                    "gt_lat": f'{truth["lat"]:.7f}',
                    "gt_lon": f'{truth["lon"]:.7f}',
                    "pred_lat": f'{pred["lat"]:.7f}',
                    "pred_lon": f'{pred["lon"]:.7f}',
                    "raw_fused_top1_lat": f'{pred["raw_fused_top1_lat"]:.7f}',
                    "raw_fused_top1_lon": f'{pred["raw_fused_top1_lon"]:.7f}',
                    "raw_fused_top1_score": f'{pred["raw_fused_top1_score"]:.8f}',
                    "cluster_size": pred["cluster_size"],
                    "prediction_error_km": f'{pred["error_km"]:.3f}',
                    "inference_seconds": (
                        f'{result["inference_seconds"]:.3f}'
                        if result.get("inference_seconds") is not None
                        else ""
                    ),
                    "image": result["image"],
                }
            )


def print_summary(summary: dict[str, Any]) -> None:
    error = summary["prediction_error"]
    timing = summary["timing"]

    print("\n" + "=" * 72)
    print("CHIPOINT V2 LOCAL STATIC EVALUATION SUMMARY")
    print("=" * 72)
    print(f'Dataset:                 {summary["dataset"]}')
    print(f'Images evaluated:        {summary["n_images"]}')
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
    print("Timing:")
    print(
        f'  Query encoding total:    '
        f'{timing["total_query_encoding_seconds"]:.2f} s'
    )
    print(
        f'  Gallery retrieval total: '
        f'{timing["total_gallery_retrieval_seconds"]:.2f} s'
    )
    if "inference_seconds_summary" in timing:
        runtime = timing["inference_seconds_summary"]
        print(
            f'  Per-image inference mean:   '
            f'{runtime["mean"]:.3f} s'
        )
        print(
            f'  Per-image inference median: '
            f'{runtime["median"]:.3f} s'
        )
        print(
            f'  Per-image inference range:  '
            f'{runtime["min"]:.3f} - {runtime["max"]:.3f} s'
        )
    print("=" * 72)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

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
        cache_namespace = None
    else:
        images_root = args.images_root.expanduser().resolve()
        cache_namespace = re.sub(
            r"[^A-Za-z0-9._-]+",
            "-",
            images_root.name,
        )

    image_dir = images_root / args.dataset

    if not competition_path.exists():
        raise FileNotFoundError(competition_path)
    if not image_dir.exists():
        raise FileNotFoundError(image_dir)

    truth = load_ground_truth(competition_path)
    image_paths = find_images(image_dir)

    if not image_paths:
        raise RuntimeError(f"No images found in {image_dir}")

    missing = [
        path.stem
        for path in image_paths
        if path.stem not in truth
    ]
    if missing:
        raise RuntimeError(f"Missing ground truth for: {missing}")

    print("=" * 72)
    print("Chipoint v2 local street-view batch evaluation")
    print("=" * 72)
    print(f"Dataset:     {args.dataset}")
    print(f"Images:      {len(image_paths)}")
    print(f"Top-K:       {TOP_K}")
    print(f"Pool/tower:  {POOL_M}")
    print(f"Fused pool:  {FUSE_K}")
    print(f"Chunk rows:  {CHUNK_ROWS:,}")
    print("Reranker:    OFF (public fused-retrieval path)")
    print(
        "Timing mode: "
        + (
            "PER-IMAGE independent latency"
            if args.measure_per_image_runtime
            else "batched throughput"
        )
    )

    device = require_cuda()

    # Download/check the ~15.1 GB street gallery plus heads/coordinates.
    coords_path, gallery_paths, head_paths = ensure_street_assets()

    # ------------------------------------------------------------------
    # Phase 1: produce all query vectors, one encoder at a time.
    # ------------------------------------------------------------------

    print("\n" + "=" * 72)
    print("PHASE 1: QUERY ENCODING")
    print("=" * 72)

    queries_by_tower: dict[str, np.ndarray] = {}
    query_encoding_seconds: dict[str, float] = {}
    query_encoding_seconds_per_image: dict[str, list[float]] = {}

    for tag, spec in TOWER_REGISTRY.items():
        queries, elapsed, per_image_elapsed = encode_dataset_for_tower(
            tag=tag,
            spec=spec,
            head_path=head_paths[tag],
            image_paths=image_paths,
            dataset=args.dataset,
            device=device,
            cache_namespace=cache_namespace,
            measure_per_image_runtime=args.measure_per_image_runtime,
        )

        queries_by_tower[tag] = queries
        query_encoding_seconds[tag] = elapsed
        if per_image_elapsed is not None:
            query_encoding_seconds_per_image[tag] = per_image_elapsed

    clear_gpu()

    # ------------------------------------------------------------------
    # Phase 2: gallery retrieval. Normal mode scans once for all queries;
    # runtime mode deliberately scans once per image to measure standalone latency.
    # ------------------------------------------------------------------

    print("\n" + "=" * 72)
    print("PHASE 2: FULL STREET GALLERY RETRIEVAL")
    print("=" * 72)

    per_tower: dict[str, tuple[np.ndarray, np.ndarray]] = {}
    retrieval_seconds: dict[str, float] = {}
    retrieval_seconds_per_image: dict[str, list[float]] = {}

    for tag, spec in TOWER_REGISTRY.items():
        gallery = np.load(
            gallery_paths[tag],
            mmap_mode="r",
        )

        print(
            f"\n[{tag}] gallery shape={gallery.shape}, "
            f"dtype={gallery.dtype}"
        )

        if args.measure_per_image_runtime:
            # Keep the original batched retrieval path for the actual
            # predictions. This also warms the gallery/CUDA path before the
            # standalone timing pass, so loc_001 is not charged one-time
            # initialization overhead. The batched pass is NOT counted in
            # inference_seconds.
            indices, scores, _ = scan_gallery_for_queries(
                gallery=gallery,
                queries_np=queries_by_tower[tag],
                device=device,
                tag=tag,
            )

            (
                _timing_indices,
                _timing_scores,
                elapsed,
                per_image_elapsed,
            ) = scan_gallery_for_queries_individually(
                gallery=gallery,
                queries_np=queries_by_tower[tag],
                device=device,
                tag=tag,
            )
            del _timing_indices, _timing_scores
            retrieval_seconds_per_image[tag] = per_image_elapsed
        else:
            indices, scores, elapsed = scan_gallery_for_queries(
                gallery=gallery,
                queries_np=queries_by_tower[tag],
                device=device,
                tag=tag,
            )

        per_tower[tag] = (indices, scores)
        retrieval_seconds[tag] = elapsed

        del gallery

    # ------------------------------------------------------------------
    # Phase 3: fuse candidates + final coordinate.
    # ------------------------------------------------------------------

    print("\n" + "=" * 72)
    print("PHASE 3: FUSION + EVALUATION")
    print("=" * 72)

    street_coords = np.load(
        coords_path,
        mmap_mode="r",
    )

    results: list[dict[str, Any]] = []

    for query_index, image_path in enumerate(image_paths):
        location_truth = truth[image_path.stem]

        postprocess_started = time.perf_counter()

        fused_idx, fused_score = fuse_one_query(
            per_tower=per_tower,
            query_index=query_index,
        )

        top_coords_all = np.asarray(
            street_coords[fused_idx]
        )

        k_disp = min(
            TOP_K,
            len(fused_idx),
        )

        pred_lat, pred_lon, members = cluster_consensus(
            top_coords_all[:k_disp],
            fused_score[:k_disp],
        )

        postprocess_seconds = time.perf_counter() - postprocess_started

        error = distance_km(
            location_truth["lat"],
            location_truth["lon"],
            pred_lat,
            pred_lon,
        )

        prediction = {
            "lat": pred_lat,
            "lon": pred_lon,
            "raw_fused_top1_lat": float(top_coords_all[0, 0]),
            "raw_fused_top1_lon": float(top_coords_all[0, 1]),
            "raw_fused_top1_score": float(fused_score[0]),
            "cluster_size": int(len(members)),
            "error_km": error,
        }

        if args.measure_per_image_runtime:
            encoding_by_tower = {
                tag: query_encoding_seconds_per_image[tag][query_index]
                for tag in TOWER_REGISTRY
            }
            retrieval_by_tower = {
                tag: retrieval_seconds_per_image[tag][query_index]
                for tag in TOWER_REGISTRY
            }
            encoding_total = sum(encoding_by_tower.values())
            retrieval_total = sum(retrieval_by_tower.values())
            inference_seconds = (
                encoding_total
                + retrieval_total
                + postprocess_seconds
            )
            timing_details: dict[str, Any] | None = {
                "query_encoding_seconds_by_tower": {
                    tag: round_float(value, 6)
                    for tag, value in encoding_by_tower.items()
                },
                "retrieval_seconds_by_tower": {
                    tag: round_float(value, 6)
                    for tag, value in retrieval_by_tower.items()
                },
                "total_query_encoding_seconds": round_float(
                    encoding_total,
                    6,
                ),
                "total_gallery_retrieval_seconds": round_float(
                    retrieval_total,
                    6,
                ),
                "fusion_and_consensus_seconds": round_float(
                    postprocess_seconds,
                    6,
                ),
                "inference_seconds": round_float(
                    inference_seconds,
                    6,
                ),
            }
        else:
            inference_seconds = None
            timing_details = None

        result = {
            "location_id": image_path.stem,
            "image": repo_relative_path(image_path),
            "ground_truth": location_truth,
            "prediction": prediction,
            "inference_seconds": inference_seconds,
        }
        if timing_details is not None:
            result["timing"] = timing_details

        results.append(result)

        label = (
            location_truth.get("city_or_region")
            or image_path.stem
        )

        print(
            f"[{query_index + 1}/{len(image_paths)}] "
            f"{image_path.name} | {label}"
        )
        print(
            f"  Prediction: lat={pred_lat:.6f}, "
            f"lon={pred_lon:.6f}, error={error:.2f} km"
        )
        print(
            f"  Fused top-1: "
            f"{top_coords_all[0, 0]:.6f}, "
            f"{top_coords_all[0, 1]:.6f}"
        )
        if inference_seconds is not None:
            print(f"  Inference:  {inference_seconds:.3f} s")

    summary = build_summary(
        results=results,
        dataset=args.dataset,
        query_encoding_seconds=query_encoding_seconds,
        retrieval_seconds=retrieval_seconds,
        measure_per_image_runtime=args.measure_per_image_runtime,
    )

    print_summary(summary)

    # ------------------------------------------------------------------
    # Output
    # ------------------------------------------------------------------

    output_dir = args.output_dir.resolve()
    output_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    base = f"chipointv2_local_static_{args.dataset}"

    csv_path = output_dir / f"{base}.csv"
    details_path = output_dir / f"{base}_details.json"
    summary_path = output_dir / f"{base}_summary.json"

    write_csv(
        csv_path,
        results,
    )

    details_path.write_text(
        json.dumps(
            results,
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    summary_path.write_text(
        json.dumps(
            summary,
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print("\nSaved results:")
    print(f"  CSV:     {csv_path}")
    print(f"  Details: {details_path}")
    print(f"  Summary: {summary_path}")


if __name__ == "__main__":
    main()
