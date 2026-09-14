# GPT-6 Astra Low — agentic browser coordinates and cues

This is the **interactive browser / panorama** experiment from September 6–7, 2026, not the static masked-image experiment.

**Updated: coordinates for all 75 scored rounds are now available — 11 original recorded pairs and 64 reconstructed submitted pins.** Start with the [complete coordinate CSV](reconstruction/all_75_predictions.csv), [JSON with cues and provenance](reconstruction/all_75_predictions.json), or [readable table](reconstruction/predictions.md). The reconstructions use saved final-pin maps, linked browser-call sequences, and explicit per-round uncertainty. [Method, verification, and limits](reconstruction/README.md).

The 11 original pairs reproduce the recorded result distances to displayed rounding. The other 64 **exact original numeric values** remain unavailable; their new coordinate estimates are clearly labeled as reconstructions. Ten unobscured original pairs were used for leave-one-out verification, and all ten reconstructed positions were within one map pixel of the originals. Coarse maps have greater uncertainty, up to approximately 5.3 km.

The files immediately below preserve the initial **recorder-only** export, whose missing coordinates remain blank. Use `reconstruction/all_75_predictions.csv` or `.json` for the complete coordinate set.

- `recovered_coordinates.csv` / `.json`: the 11 validated original submitted pins, linked to the round notes and recorder evidence.
- `all_75_rounds.csv` / `rounds.json`: all three 25-round runs, with explicit coordinate availability and original cue/decision notes.
- `rounds_with_cues.md`: readable round-by-round coordinates and notes.
- `coordinate_evidence.json`: narrowly selected original recorder prediction fields, timestamps, source hashes, and distance cross-checks.
- `reports/` and `score_summary.json`: original published run reports, continuation notes, exclusions, and score provenance.
- `recorder_audit.json`, `manifest.json`, and `SHA256SUMS`: provenance and integrity checks.

## Why the numeric guesses were missing

The old recorder accepted unrelated `ib.adnxs.com` advertising requests as coordinate predictions (for example, numbers inside an advertising-consent field). This could overwrite a genuine map-click capture. The earlier publication correctly withheld those unvalidated numeric fields. In the inspected local records, 11 canonical predictions still retain the `leaflet-map-click` source. These are now exported and cross-checked against recorded result distances. The other canonical records contain either invalid ad-request data (59) or no recoverable numeric prediction (5).

Ground-truth/spawn/camera positions are **not predictions** and have not been substituted for missing guesses. The reconstruction uses the revealed-location flag as a map reference and transforms the submitted red pin's pixel displacement from it. Place descriptions have not been retroactively geocoded into fabricated original coordinates. Reported cues and hypotheses are preserved as the agent wrote them; the reports distinguish initial beliefs, final pins, and truth revealed after submission.

The archive preserves the documented valid-run selection: Run 1 Hard combines its first six completed rounds with the final-two continuation; Run 3 uses only clean Medium results plus the final-three continuation. Excluded contaminated or unfinished attempts remain excluded. The reconstruction includes two previously unpublished original result screenshots recovered from chat; the other 73 remain in the benchmark evidence folder. Videos are not duplicated.
