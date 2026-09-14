# OpenGuessr Research Round Recorder 0.7.9

Version 0.7.9 adds the narrow page adapter used by the optional NAUTILUS
OpenGuessr MCP. It can place a model-chosen coordinate, verify the resulting
Leaflet marker, submit only that verified marker, report sanitized control
state, and continue to the next round. It never returns correct-location or
network-response data, and the recorder continues to work without the MCP.

Chrome Manifest V3 extension for collecting the project experiments.

It supports:

- **Static / NMPZ** - canonical starting PNG + round/prediction metadata.
- **Interactive panorama** - one WebM per location/round + Street View camera/event telemetry + prediction metadata.

## Install / update

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select:

```text
demo_and_extension/extension/openguessr-research-recorder
```

After loading/reloading the extension, refresh or reopen the OpenGuessr tab so the newest content/page scripts are active.

Before recording, start the local collector from `demo_and_extension/`:

```powershell
npm start
```

## Static / NMPZ arming

1. Open the OpenGuessr competition with the experiment account.
2. In the in-page recorder card select the competition, model/participant label, and **Static image / NMPZ**.
3. Press **Arm / start recorder**.
4. Wait for the compact armed state.
5. Press the normal OpenGuessr **Start** button.

No toolbar authorization click is required for static capture.

## Interactive panorama arming - important

Interactive video capture has an extra Chrome authorization step. **Do not press OpenGuessr Start immediately after the first Arm action.**

### Exact sequence

1. Open the competition start screen and keep that OpenGuessr tab active.
2. In the in-page recorder card select the competition, model/participant label, and **Interactive panorama**.
3. Press **Arm / start recorder**.
4. The large setup card collapses to the compact **AUTHORIZE VIDEO** HUD.
5. The recorder extension toolbar icon shows the badge:

```text
ARM
```

6. Click the **OpenGuessr Research Round Recorder extension icon once** in the Chrome toolbar.
7. This toolbar click only authorizes Chrome tab capture. It does not open a second setup flow and you do not configure the experiment again.
8. After successful authorization, verify both:

```text
in-page HUD = ARMED
extension badge = VID
```

9. Chrome may also show its normal tab-capture/recording indicator on the OpenGuessr tab. Depending on Chrome version this can look like a blinking/animated capture indicator. Treat it as an extra confirmation; the HUD and extension badge are the primary checks.
10. **Only now** press the normal OpenGuessr **Start** button.
11. When a real round begins and its WebM is actively recording, the extension badge changes to:

```text
REC
```

The complete state sequence is:

```text
Arm / start recorder
        ↓
HUD = AUTHORIZE VIDEO
badge = ARM
        ↓
click extension toolbar icon once
        ↓
HUD = ARMED
badge = VID
        ↓
press OpenGuessr Start
        ↓
active round video capture
badge = REC
```

If the badge shows `!`, video authorization/capture encountered an error and should be checked before relying on the recording.

The toolbar authorization is required **once per competition/session**, not once per round. The same authorized tab stream is reused while the recorder automatically creates a separate WebM for each location.

## Interactive per-round capture

Normal lifecycle:

```text
real Street View round becomes playable
        ↓
start round WebM
        ↓
move / pan / tilt / zoom normally
        ↓
submit prediction
        ↓
finalize round WebM + metadata
        ↓
result / Continue
        ↓
next round starts a new WebM
```

Final videos are stored under:

```text
data/exploration-videos/<competition>/<location>/<session>/round-XX.webm
```

The round JSON records camera/event telemetry independently of video, including position, panorama ID, heading, pitch, zoom/FOV, timing, and prediction.

## Completion / abort

During a normal competition, verify the saved-round counter advances until all expected rounds are stored. At the end use **Done & disarm**.

Use **Stop recording** in the compact HUD if the experiment must be aborted early.

## Semantic key moments

Routine movement/pan/tilt/zoom events are not automatically inserted into `keyMoments`. Semantic evidence moments can be added later by a human reviewer or an agent. The detailed JSON format is documented in `demo_and_extension/README.md`.
