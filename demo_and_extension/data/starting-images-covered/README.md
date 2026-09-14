# Static Images Covered

This folder contains modified versions of the benchmark starting images for controlled static-image experiments.

## Structure

```text
static-images-covered/
├── README.md
├── images-covered.xcf
├── google_road_marking_cover/
│   ├── europe-easy/
│   ├── europe-medium/
│   └── europe-hard/
└── map_metadata_cover/
    ├── europe-easy/
    ├── europe-medium/
    └── europe-hard/
```

- `images-covered.xcf` is the local GIMP working file used to create and edit the covered-image variants. It is not tracked in Git because of its file size.
- `google_road_marking_cover/` contains starting images in which visible Google Maps street-name or road-number overlays have been covered.
- `map_metadata_cover/` contains starting images in which map or imagery metadata shown by the interface has been covered, such as provider attribution like `© Autori`.
- The `europe-easy`, `europe-medium`, and `europe-hard` subfolders contain only the locations for which the corresponding type of artificial cue was present and needed to be covered.

The purpose of these variants is to test how model predictions and reasoning change when selected artificial map/interface cues are unavailable and the model must rely more strongly on the remaining visual scene information.

Additional intervention types can be added later as parallel folders, for example to cover other selected visual clues.

## Import and review

From `demo_and_extension/`, normalize the covered-run predictions and reported clues with:

```text
npm run clues:import-covered
```

Generate Florence draft boxes for every covered clue set with:

```text
npm run clues:annotate-covered
```

The imported clue sets use `publicationStatus: "review-only"`. They are available in the local reviewer at `/tools/clue-review/?condition=static-image-covered` but are intentionally omitted from the main website until annotation review and interpretability ratings are complete.
