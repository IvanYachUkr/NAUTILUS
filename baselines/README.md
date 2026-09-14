# Static-image baselines

Four reproducible computer-vision baselines evaluated on the same 25 canonical NAUTILUS starting images.

| Folder | Model | Prediction path |
| --- | --- | --- |
| [`geoclip/`](geoclip/) | GeoCLIP | Direct image-to-coordinate |
| [`plonk/`](plonk/) | PLONK OSV-5M (Europe) | Pretrained coordinate generation |
| [`salad/`](salad/) | SALAD + OSV-5M (Europe) | Europe-only image retrieval |
| [`chipointv2/`](chipointv2/) | Chipoint v2 | Three-tower fused retrieval |

Each model folder contains its evaluator, environment notes, source result CSVs, and per-location details. Large checkpoints, galleries, indexes, caches, and virtual environments are intentionally untracked.

## Shared layout

```text
<model>/
├── README.md
├── <evaluator>.py
├── results/                  canonical starting-image results
└── results-no-location-gui/  GUI-reduced image ablation
```

The evaluators default to:

```text
demo_and_extension/data/competitions/<dataset>.json
demo_and_extension/data/starting-images/<dataset>/
```

Ground truth is derived from the competition Street View URL. Do not duplicate coordinates in a baseline-specific location file.

## Import into the website

The CSVs under `results*/` are the static-baseline source of truth. Normalize them for the atlas with:

```powershell
cd demo_and_extension
npm run data:baselines
npm run data:build
```

The importer writes per-location records to `demo_and_extension/data/results/static-baselines/`. Those JSON files should not replace the source CSVs.

## Compare image conditions

```powershell
python .\demo_and_extension\scripts\compare_static_baseline_conditions.py
```

The comparison pairs each model and location across the canonical and GUI-reduced image sets and writes its report under `analysis/static-baseline-no-gui-comparison/`.
