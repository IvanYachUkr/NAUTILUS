# All 75 Astra Low browser predictions

**11 original recorded coordinate pairs + 64 reconstructed coordinate pairs.** Start with [all_75_predictions.csv](all_75_predictions.csv), [JSON with cues and provenance](all_75_predictions.json), or the [readable coordinate table](predictions.md).

The 64 reconstructions are estimates of the pins the agent actually submitted. They are not new guesses, geocoded place descriptions, or exact numeric values recovered from chat text. Keep `coordinate_status` and `estimated_coordinate_uncertainty_m` when using them. A value of zero uncertainty for an original record means its numeric value was preserved; it does not mean its geolocation prediction was correct.

## How recovery works

The five active player sessions contain the click, pan, zoom, and submission history. A sixth attempted replacement session had no gameplay. [call_sequences.json](call_sequences.json) groups 1,917 browser-call records into the 75 valid scored rounds, preserving call IDs, original session line numbers, timestamps, titles, and browser operations. Each window starts after the preceding submission and can include reading that preceding result before continuing. Three rounds ended by timer; one timeout timestamp is estimated from the recorded start plus the five-minute limit. Excluded attempts remain excluded.

Each final result screenshot provides an absolute map reference after all earlier moves: the red submitted pin and the black revealed-location flag. We detected both marker interiors, visually checked all 75 result views, and transformed their pixel displacement into latitude/longitude using the north-up Web Mercator map. The revealed location is used only as the map reference; the displacement of the submitted red pin determines the prediction.

For normalized world coordinates, `x=(longitude+180)/360`, `y=(1-asinh(tan(latitude))/pi)/2`. At map zoom `z`, one world spans `256*2**z` screenshot pixels. We choose the integer zoom whose pin-to-flag separation best matches the recorded result distance. We do not continuously fit the distance. The JSON records the pixel observations, marker-anchor correction, selected zoom, revealed-location reference, reconstructed coordinate, and remaining distance residual. This use of the result distance is part of reconstruction, so agreement with that distance alone is not independent validation.

The call histories identify the final submitted or timed-out result. The numerical georeferencing uses the final result map; it does not assume a drag's requested pixel movement exactly equals the map movement after browser animation.

## Verification and uncertainty

Ten of the eleven original coordinate pairs have unobscured reference flags. In leave-one-out verification, each known pair was withheld from its own marker-anchor calibration. All ten reconstructions were within **one map pixel** of their original coordinates: eight within 3 metres, two zoomed-out regional maps at approximately 122 and 196 metres. The eleventh flag is partly hidden by the recorder overlay; its original coordinate is retained without screenshot reconstruction.

For each missing pair, the export gives a conservative **four-map-pixel estimated uncertainty**, with a one-metre minimum. This is an engineering estimate, not a statistical confidence interval or a guarantee. Of the 64 reconstructed entries, 36 have estimates at or below 10 metres, 11 more at or below 100 metres, and 17 are coarser; the maximum is 5,297 metres. Zoomed-out maps cannot support the same precision as street-level maps.

Run `python verify_reconstruction.py` to independently recompute all 64 transforms, verify that the 11 original numeric pairs are unchanged, reproduce the ten held-out checks, and check all 75 call sequences. Add `--repo-root PATH_TO_NAUTILUS` to verify all source screenshot hashes as well. The script uses only the Python standard library.

## Evidence

- [validation.json](validation.json): individual held-out results and calibration.
- [source_sessions.json](source_sessions.json): source chat file hashes and record counts; encrypted messages and hidden reasoning are not exported.
- [evidence/](evidence/): original screenshot bytes recovered from chat for Run 1 Easy rounds 1 and 2, previously absent from the published screenshot folder.
- The other 73 result screenshots remain in `demo_and_extension/data/recorded-agent-benchmark/gpt-6-astra-low/evidence/`; each coordinate row identifies its source and SHA-256 hash.
- Original cue reports, the initial recorder-only export, and original coordinate evidence remain in the parent directory. The original globe prediction layer has not been changed.
