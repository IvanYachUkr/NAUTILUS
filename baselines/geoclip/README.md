# GeoCLIP baseline

Direct image-to-coordinate evaluation with [`geoclip`](https://github.com/VicenteVivan/geo-clip). Ground truth is parsed from the canonical competition definitions.

## Setup

From this folder:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

The published environment is pinned in `requirements.txt`. Model weights are downloaded through the upstream package and remain untracked.

## Evaluate

```powershell
.\.venv\Scripts\python.exe .\geoclip_batch_eval.py --dataset europe-easy
.\.venv\Scripts\python.exe .\geoclip_batch_eval.py --dataset europe-medium
.\.venv\Scripts\python.exe .\geoclip_batch_eval.py --dataset europe-hard
```

Use `--top-k`, `--limit`, `--images-root`, `--output-dir`, or `--demo-root` when needed; run with `--help` for the complete interface.

For the GUI-reduced ablation, point `--images-root` at:

```text
../../demo_and_extension/data/starting-images-no-gui-crop/no-location-gui
```

and write to `results-no-location-gui/`.

## Outputs

- `results/` — source CSVs, per-location details, and summaries for canonical images.
- `results-no-location-gui/` — matched GUI-reduced reruns.

The CSV field `top1_error_km` is used by the website importer. Per-image inference time excludes model initialization and image loading.
