# Starting Images No-GUI Crop

This folder contains Google Maps-based variants of the benchmark starting images for controlled static-image experiments with reduced or removed interface elements.

## Structure

```text
starting-images-no-gui-crop/
├── README.md
├── source-google-maps/
│   ├── europe-easy/
│   ├── europe-medium/
│   └── europe-hard/
├── google-maps-viewport/
│   ├── europe-easy/
│   ├── europe-medium/
│   └── europe-hard/
└── no-location-gui/
    ├── europe-easy/
    ├── europe-medium/
    └── europe-hard/
```

- `source-google-maps/` contains the original screenshots collected manually from the corresponding Google Maps links. The browser interface was minimized during capture, but the screenshots are otherwise kept unchanged as source material.

- `google-maps-viewport/` contains derived versions in which the browser chrome above the Google Maps viewport has been removed. Small Google Maps interface elements may still remain.

- `no-location-gui/` contains a stricter cropped version intended for evaluation. The crop removes interface areas that may expose explicit location information while preserving the full horizontal field of view as much as possible.

- The `europe-easy`, `europe-medium`, and `europe-hard` subfolders correspond directly to the benchmark difficulty splits and use the same location filenames as the other starting-image datasets.

## Generation

The derived variants are generated from `source-google-maps/` using `scripts/crop_starting_images.py`.

The Google Maps viewport images are created by removing the browser interface from the top of the source screenshots:

```powershell
python .\scripts\crop_starting_images.py `
    --input .\data\starting-images-no-gui-crop\source-google-maps `
    --output .\data\starting-images-no-gui-crop\google-maps-viewport `
    --top 87 `
    --overwrite
```

The stricter no-location-GUI images are generated directly from the original source screenshots:

```powershell
python .\scripts\crop_starting_images.py `
    --input .\data\starting-images-no-gui-crop\source-google-maps `
    --output .\data\starting-images-no-gui-crop\no-location-gui `
    --top 142 `
    --bottom 92 `
    --overwrite
```

Both derived datasets are generated directly from `source-google-maps/` rather than from one another.

## Purpose

The purpose of these variants is to investigate whether interface elements in the original OpenGuessr starting images affect the performance of static geo-localization baselines.

The Google Maps screenshots provide a cleaner visual input while retaining substantially more of the original scene than a large centered crop would.

The two derived conditions serve different purposes:

- `google-maps-viewport/` preserves nearly the complete Google Maps panorama viewport and is useful for testing static baselines under substantially reduced interface clutter.
- `no-location-gui/` additionally removes areas that could reveal explicit location information through Google Maps interface text, making it more suitable for leakage-free comparisons and agent evaluation.

The raw `source-google-maps/` screenshots are retained so that alternative cropping strategies can be generated reproducibly without reopening and recapturing the benchmark locations.
