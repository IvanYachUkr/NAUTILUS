# NAUTILUS website and experiment pipeline

This folder contains the published atlas, benchmark data build, OpenGuessr recorder, and coordinate-actuation MCP used by NAUTILUS.

- Live site: [nautilus-geolocation.ivanukr.chatgpt.site](https://nautilus-geolocation.ivanukr.chatgpt.site/)
- Repository overview: [`../README.md`](../README.md)
- Data guide: [`data/README.md`](data/README.md)

## Setup

Requirements: Node.js 20+, npm, and Chrome when using the recorder.

```powershell
npm ci
npm ci --prefix openguessr-mcp
npm run verify
npm start
```

The local site is served at `http://127.0.0.1:4173`. Use `npm start -- 4174` to choose another port. On Windows, `npm.cmd` can be used when PowerShell blocks npm scripts.

## Folder map

```text
data/                         canonical inputs, evidence, and generated records
src/                          website source
scripts/                      build, import, inspection, and collector tools
tests/                        Node test suite
extension/
  openguessr-research-recorder/ Chrome recorder extension
  pin-placer-helper/            local coordinate helper
openguessr-mcp/               benchmark-safe Playwright MCP proxy
```

The website and data pipeline intentionally remain together because the interface is a direct view over the benchmark's normalized records.

## Source of truth

The 25 location definitions are embedded in:

```text
data/competitions/europe-easy.json
data/competitions/europe-medium.json
data/competitions/europe-hard.json
```

Each record keeps its full Google Street View URL. Coordinates and camera parameters are derived during the build; do not create a second location catalog. If a URL changes, normalize the starting pitch with `npm run locations:zero-pitch`.

The supported conditions are:

- `static-image` — canonical NMPZ starting image.
- `interactive-panorama` — recorded exploration with camera/event telemetry.
- `static-image-covered` — controlled post-hoc covered-image condition.

## Common commands

| Command | Purpose |
| --- | --- |
| `npm start` | Build data, prepare globe assets, and serve the local app |
| `npm run verify` | Build data and run all project, extension, and MCP checks |
| `npm run build:site` | Write the deployable static site to `dist/` |
| `npm run data:build` | Rebuild normalized website data |
| `npm run data:check` | Validate generated data without accepting drift |
| `npm run data:baselines` | Import source CSVs from `../baselines/` |
| `npm run competition:export` | Generate OpenGuessr location lists |
| `npm run recordings:inspect` | Audit recorder output |
| `npm run clues:extract` | Extract clue candidates from reports |
| `npm run clues:import-covered` | Import the covered-image condition |

`data/generated/` and `dist/` are build outputs. Do not hand-edit them.

## Recording workflow

The recorder is run once for each `model × difficulty × condition` combination. Use `manual` as the model label for reference recordings.

1. Load [`extension/openguessr-research-recorder/`](extension/openguessr-research-recorder/) as an unpacked Chrome extension.
2. Keep `npm start` running so the collector can receive artifacts.
3. Arm the correct competition and condition before opening a round.
4. After each guess, verify a fresh `SAVED · Round N` state before continuing.
5. Finish and disarm only after all expected rounds are recorded.

Detailed recorder controls and failure recovery are in the [extension README](extension/openguessr-research-recorder/README.md).

## Agent coordinate actuation

[`openguessr-mcp/`](openguessr-mcp/) exposes only benchmark-safe actions for screenshot-based agents. It can place and verify a model-selected coordinate without revealing the target location or hidden page state.

Install and test it independently with:

```powershell
npm ci --prefix openguessr-mcp
npm test --prefix openguessr-mcp
```

Prompts, safety constraints, launch instructions, and actuator audits are documented in [`openguessr-mcp/README.md`](openguessr-mcp/README.md).

## Building data

`npm run data:build` validates the editable inputs and produces normalized records under `data/generated/`, including:

```text
data/generated/atlas-cases.json
data/generated/recordings.index.json
data/generated/build-report.json
```

The static-baseline importer reads source CSVs from `../baselines/<model>/results*/` and writes normalized per-location records under `data/results/static-baselines/`.

## Publishing

`npm run build:site` creates a self-contained static bundle in `dist/`. Pushing Git changes and publishing the GPT Site are separate operations; always verify the bundle before either one.
