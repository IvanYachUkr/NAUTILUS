# Static baseline image-variant comparison

Controlled re-evaluation of all four static geolocation baselines on two image variants from the same Static / NMPZ condition:

1. Canonical OpenGuessr starting images.
2. GUI-reduced images with explicit location-revealing interface elements removed.

Both variants use the same 25 locations, evaluator implementation, model configuration, and prediction metric. Only the image root, output directory, and image-specific query cache differ.

## Inputs

```text
demo_and_extension/data/starting-images/
demo_and_extension/data/starting-images-no-gui-crop/no-location-gui/

baselines/<model>/results/
baselines/<model>/results-no-location-gui/
```

The benchmark has 8 Easy, 9 Medium, and 8 Hard locations. See each [baseline README](../../baselines/README.md) for its exact evaluation command and fixed configuration.

Published settings that materially affect reproduction:

| Model | Fixed configuration |
| --- | --- |
| GeoCLIP | Direct top-1 prediction |
| SALAD | IVF-Flat, `nprobe=64`, `top-k=5` |
| PLONK | `nicolas-dufour/PLONK_OSV_5M`, CPU, seed 42, one sample |
| Chipoint v2 | top-k 10, tower pool 200, fused pool 64, reranker off |

## Rebuild the comparison

After producing both result sets for all baselines, run from the repository root:

```powershell
python .\demo_and_extension\scripts\compare_static_baseline_conditions.py
```

The script pairs rows by model, configuration, split, and `location_id`. It writes:

```text
comparison_report.md
overall_comparison.csv
comparison_by_split.csv
paired_location_differences.csv
```

When Matplotlib is installed it also writes `mean_error_comparison.png` and `paired_error_deltas.png`.

## Convention and statistics

```text
delta_km = no_location_gui_error_km - original_error_km
```

- Negative delta: GUI-reduced image performed better.
- Positive delta: canonical OpenGuessr image performed better.
- Zero: no change.

The report includes mean and median geodesic error, paired changes, win/loss counts, a bootstrap 95% confidence interval for the mean change, a two-sided paired sign-flip test, Holm-adjusted p-values, and threshold accuracy. With only 25 fixed locations, these statistics describe the observed benchmark effect; they do not establish population-wide significance.
