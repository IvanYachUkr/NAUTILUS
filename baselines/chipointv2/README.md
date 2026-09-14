# Chipoint v2 baseline

Local evaluation of the public Chipoint v2 street-view pipeline. It encodes each query with SigLIP2 SO400M, GOPT, and DINOv3 ViT-L; retrieves against the official precomputed galleries; then applies fused ranking and cluster-consensus prediction.

The unpublished 23-feature reranker is not used.

## Setup

Create a CUDA-capable environment and install:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

The first run downloads the required public assets from `chiikabu-labs/chipoint-2` into the ignored `.cache/` directory.

## Evaluate

```powershell
.\.venv\Scripts\python.exe .\chipointv2_local_batch_eval.py --dataset europe-easy
.\.venv\Scripts\python.exe .\chipointv2_local_batch_eval.py --dataset europe-medium
.\.venv\Scripts\python.exe .\chipointv2_local_batch_eval.py --dataset europe-hard
```

Add `--measure-per-image-runtime` when reporting true per-image timings. It is slower because each gallery is scanned independently for every image.

For the GUI-reduced ablation, use:

```text
--images-root ../../demo_and_extension/data/starting-images-no-gui-crop/no-location-gui
--output-dir results-no-location-gui
```

Run with `--help` for cache, device, chunking, and output options.

## Fixed retrieval configuration

- top-k output: 10
- per-tower retrieval pool: 200
- fused candidate pool: 64
- default gallery chunk: 500,000 rows

## Outputs

- `results/` — canonical-image CSVs, details, and summaries.
- `results-no-location-gui/` — paired GUI-reduced results.

The website importer uses `prediction_error_km`, `pred_lat`, `pred_lon`, and recorded `inference_seconds` from the source CSVs.
