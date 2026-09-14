# Recordings workspace

`inbox/` contains one JSON per completed OpenGuessr round:

```text
inbox/
└── europe-easy/
    └── loc_001/
        └── 2026-...__model__interactive-panorama__round-1.json
```

`sessions/` contains one manifest per full competition run. The extension updates
it after every saved round so an interrupted test can be audited.

`checkpoints/` contains manually requested live-state snapshots. A checkpoint
does not finalize the round and is never loaded as an evaluation result. It is
intended for recovery and debugging.

`npm start` accepts extension output at:

```text
POST /api/recordings
POST /api/sessions
POST /api/checkpoints
```

Interactive rounds are matched from their starting coordinate. NMPZ/static
rounds can fall back to selected competition + round order when the page does not
expose a coordinate. After matching, the build can recover the fixed camera from
the competition definition for visualization.

Raw recordings contain telemetry and the submitted prediction. Model
explanations and human cue ratings belong in `data/results/`.
