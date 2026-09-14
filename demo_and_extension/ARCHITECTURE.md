# Architecture

## Objective

The browser visualization is a reader, not the source of experimental truth. Competition definitions, raw recorder outputs, visual artifacts, and optional model annotations remain separate and are compiled into a browser-facing data contract.

## Source domains

### `data/competitions/`

Primary source of location definitions for the current benchmark.

The project has three files:

```text
europe-easy.json    # 8 locations
europe-medium.json  # 9 locations
europe-hard.json    # 8 locations
```

Each file embeds its ordered location metadata and full Google Street View URLs. Coordinates and camera values are deliberately derived during the build instead of being duplicated as editable fields.

### `data/recordings/inbox/`

One completed recorder JSON per OpenGuessr round. The local collector matches it to the selected competition/location and saves it in a deterministic competition/location folder.

Static and interactive runs share the same round-level prediction/metadata contract. Interactive JSON additionally contains camera/event telemetry and video references.

### `data/recordings/sessions/`

One live manifest per full competition run. It records session identity, configuration, progress, output paths, and completion state.

### `data/starting-images/`

Canonical static/NMPZ PNGs. There is normally one reusable starting PNG per competition/location.

### `data/exploration-videos/`

Interactive video artifacts. Each logical location/round gets its own finalized WebM plus capture metadata:

```text
data/exploration-videos/<competition>/<location>/<session>/round-XX.webm
```

Temporary chunk files live under `.partial/` while capture is in progress and should not be committed.

### `data/results/`

Optional model hypotheses, cues, human ratings, notes, or result annotations that are independent of recorder telemetry.

### `data/generated/`

Rebuildable browser data. Never treat these files as hand-edited source of truth.

## Build pipeline

`scripts/build-data.mjs`:

1. reads every competition JSON;
2. parses full Google Street View links;
3. derives ground truth and starting camera metadata;
4. validates IDs, difficulty values, ordering, and OpenGuessr limits;
5. exports fixed-order competition link TXT files;
6. indexes accepted per-round recordings;
7. joins recordings with visual artifacts and optional result annotations;
8. validates the final atlas contract;
9. writes `data/generated/*`.

## Runtime server and collector

`scripts/serve.mjs` is a zero-dependency HTTP server that serves the demo and accepts recorder uploads.

The collector validates incoming data, resolves the selected competition/location, writes the round/session artifacts, and rebuilds the demo data.

Run it with:

```powershell
npm start
```

The collector must be running during normal experiment recording.

## Recorder extension

The Manifest V3 extension has five relevant layers:

1. a main-world OpenGuessr hook observes game/guess/result state;
2. an isolated OpenGuessr relay renders the recorder setup/HUD and relays sanitized events;
3. a main-world Google Maps/Street View hook observes panorama position and camera state;
4. the service worker owns experiment/session/round state and collector communication;
5. an offscreen document owns the continuous Chrome tab-capture stream and per-round `MediaRecorder` lifecycle.

### Static / NMPZ

The recorder captures one stable canonical starting PNG and stores normal round/prediction metadata. No exploration playback is created.

### Interactive panorama

Interactive mode requires explicit Chrome tab-capture authorization:

```text
in-page Arm
→ badge ARM
→ click extension toolbar icon once
→ HUD ARMED + badge VID
→ OpenGuessr Start
→ badge REC while a round WebM is recording
```

The authorized tab stream persists across the competition. A separate WebM is started for each real Street View round and finalized when the prediction/result transition is detected.

Camera/event telemetry is recorded independently of video, so the demo can combine exact video time with the nearest telemetry sample for map/camera state.

Semantic `keyMoments` are not auto-generated from routine motion. They are a later human/agent annotation layer over the raw video and telemetry.

## Browser application

`src/main.js` loads `data/generated/atlas-cases.json`.

The application supports:

- all-location overview and filtering;
- truth/prediction comparison and error statistics;
- static canonical starting-image review;
- interactive route/camera playback;
- embedded per-round WebM playback;
- semantic key moments that seek the video to their exact `tMs`;
- right-side details/statistics drawers;
- public JavaScript/iframe APIs.

## Failure behavior

- Invalid source fields fail the build with file/index-specific messages.
- Invalid or short Google Maps links fail rather than silently inventing coordinates.
- Invalid recorder payloads are rejected before writing.
- Collector unavailability can trigger browser-download fallback for round JSON, but the intended workflow keeps the collector running.
- Interactive video failures are surfaced in the HUD/badge and do not silently count as healthy video captures.
- Temporary `.partial` video data can be inspected with `npm run videos:repair`.
