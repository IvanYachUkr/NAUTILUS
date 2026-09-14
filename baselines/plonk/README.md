# PLONK OSV-5M baseline

Static-image evaluation using the pretrained `nicolas-dufour/PLONK_OSV_5M` pipeline. The published configuration uses CPU inference, one coordinate sample per image, and base seed 42.

## Setup

Python 3.10 is recommended.

```powershell
py -3.10 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## Evaluate

```powershell
.\.venv\Scripts\python.exe .\plonk_batch_eval.py --dataset europe-easy
.\.venv\Scripts\python.exe .\plonk_batch_eval.py --dataset europe-medium
.\.venv\Scripts\python.exe .\plonk_batch_eval.py --dataset europe-hard
```

Use `--images-root`, `--output-dir`, or `--demo-root` for another compatible image tree; run with `--help` for all options.

For the GUI-reduced ablation, use:

```text
--images-root ../../demo_and_extension/data/starting-images-no-gui-crop/no-location-gui
--output-dir results-no-location-gui
```

## Outputs

- `results/` — canonical-image CSVs, details, and summaries.
- `results-no-location-gui/` — paired GUI-reduced results.

The website importer reads `prediction_error_km` and the final `pred_lat` / `pred_lon` values from the CSVs. Generated coordinates are deterministic for the documented seed and package versions.
