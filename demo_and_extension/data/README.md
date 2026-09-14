# NAUTILUS data

All benchmark data and evidence lives under this directory. The website consumes normalized records generated from these sources.

## Canonical inputs

| Path | Contents |
| --- | --- |
| `competitions/` | Ordered Easy, Medium, and Hard location definitions; primary source of truth |
| `recorded-agent-benchmark/` | Curated agent runs, reports, prompts, scores, timing, and audit evidence |
| `recordings/` | Recorder round JSON, session manifests, and recovery checkpoints |
| `starting-images/` | Canonical static / NMPZ images |
| `starting-images-covered/` | Selected covered-image variants |
| `starting-images-no-gui-crop/` | GUI-reduced images used in the baseline ablation |
| `exploration-videos/` | Final interactive WebM recordings and capture metadata |
| `clues/` | Reviewed visual and non-spatial cue annotations |
| `results/` | Normalized model annotations and imported static-baseline results |
| `covered-static-benchmark/` | Controlled covered-image benchmark records |
| `archive/` | Preserved legacy source notes that are not build inputs |

`templates/` contains reusable data-entry templates rather than observations.

## Location definitions

Edit only:

```text
competitions/europe-easy.json
competitions/europe-medium.json
competitions/europe-hard.json
```

The current benchmark has 25 locations. Coordinates, panorama identifiers, heading, pitch, and field of view are derived from each full Street View URL during the build. Do not maintain a second root-level location catalog.

## Generated output

`generated/` is rebuilt from the repository sources:

```powershell
cd demo_and_extension
npm run data:build
```

Important outputs include:

```text
generated/atlas-cases.json
generated/recordings.index.json
generated/build-report.json
```

Never hand-edit generated JSON. If verification rewrites generated files without an intentional source change, investigate or restore the generated drift rather than committing timestamps alone.

## Provenance rules

- Keep raw recorder JSON and curated publication copies distinct; their roles differ even when they describe the same run.
- Store one authoritative copy of each imported source artifact whenever possible.
- Preserve reports, manifests, prompts, hashes, exclusions, and recovery notes needed to audit a score.
- Keep machine-local caches, temporary screenshots, incomplete downloads, and collector scratch logs out of Git.
- Baseline CSVs remain under [`../../baselines/`](../../baselines/); `results/static-baselines/` contains their normalized website representation.

`recordings/index.jsonl` is a local append-only collector log. It is ignored by Git and is not benchmark source data.

## Archive

`archive/decision-notes-20260908/` preserves a historical export of model decision notes and local text transcripts. It is retained for provenance only and is not read by the website or benchmark build. Canonical published runs belong in `recorded-agent-benchmark/`.
