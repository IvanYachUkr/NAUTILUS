# Static Baseline Comparison: Original vs No-Location-GUI

This report compares each model on the same benchmark locations using the original OpenGuessr starting images and the no-location-GUI image condition.

`mean_delta_km = no_location_gui_error - original_error`; therefore **negative values indicate improvement with the no-location-GUI images**.

## Overall paired comparison

| Model | Config | N | Original mean km | No-GUI mean km | Mean Δ km | 95% CI Δ km | Improved | Holm p | Significant? |
|---|---|---:|---:|---:|---:|---:|---:|---:|:---:|
| Chipoint v2 | `chipointv2_local_static` | 25 | 536.23 | 874.50 | 338.26 | [-60.24, 982.02] | 12/25 | 0.7691 | no |
| GeoCLIP | `geoclip_static` | 25 | 1183.34 | 437.03 | -746.31 | [-1890.04, 56.75] | 11/25 | 0.7338 | no |
| PLONK | `plonk_osv5m_static` | 25 | 501.80 | 363.79 | -138.01 | [-565.77, 137.39] | 7/25 | 0.9400 | no |
| SALAD | `salad_ivfflat_nprobe64` | 25 | 1308.49 | 1184.89 | -123.60 | [-443.96, 194.01] | 11/25 | 0.9400 | no |

## By difficulty split

| Model | Split | N | Original mean km | No-GUI mean km | Mean Δ km | Median Δ km | Improved |
|---|---|---:|---:|---:|---:|---:|---:|
| Chipoint v2 | europe-easy | 8 | 431.64 | 1254.23 | 822.60 | 1.25 | 4/8 |
| Chipoint v2 | europe-hard | 8 | 957.44 | 1139.10 | 181.66 | 226.82 | 3/8 |
| Chipoint v2 | europe-medium | 9 | 254.80 | 301.76 | 46.95 | -7.27 | 5/9 |
| GeoCLIP | europe-easy | 8 | 1141.91 | 108.73 | -1033.18 | 0.00 | 2/8 |
| GeoCLIP | europe-hard | 8 | 2317.02 | 1012.60 | -1304.42 | -51.79 | 4/8 |
| GeoCLIP | europe-medium | 9 | 212.46 | 217.25 | 4.78 | -17.40 | 5/9 |
| PLONK | europe-easy | 8 | 864.46 | 352.95 | -511.51 | 8.75 | 3/8 |
| PLONK | europe-hard | 8 | 481.21 | 487.57 | 6.36 | 51.15 | 3/8 |
| PLONK | europe-medium | 9 | 197.74 | 263.40 | 65.66 | 25.18 | 1/9 |
| SALAD | europe-easy | 8 | 1215.55 | 1086.71 | -128.84 | -163.08 | 4/8 |
| SALAD | europe-hard | 8 | 2275.23 | 1880.64 | -394.59 | -35.11 | 4/8 |
| SALAD | europe-medium | 9 | 531.79 | 653.73 | 121.94 | 0.00 | 3/9 |

## Statistical interpretation

- The primary significance test is a **paired, two-sided sign-flip permutation test** on per-location geodesic-error differences.
- Overall p-values are corrected across model/configuration comparisons using **Holm's method**. `significant = yes` means adjusted p < 0.05.
- The 95% interval is a nonparametric bootstrap confidence interval for the mean paired error change.
- Because this benchmark contains a fixed set of 25 locations, these statistics describe the stability of the observed effect on this benchmark; they should not be interpreted as proof of population-wide geolocation performance.

For location-level inspection, see `paired_location_differences.csv`. Negative `delta_km` values mean the no-location-GUI image reduced the geodesic error.
