# NAUTILUS Blind-Play Protocol v3 — Time Use and Pin Refinement

Created: 2026-08-11

## Objective

Evaluate an isolated vision-capable Codex agent on the fixed-order NAUTILUS Easy, Medium, and Hard OpenGuessr sets while preserving blind play, recording the complete reasoning trace, and converting the final geographic belief into the most precise manual pin achievable with the available round time.

The primary regression addressed by this version is **belief-to-pin transfer**. In the preceding run, several scenes were identified correctly but retained country-level or wrong-country markers because coarse pins were protected too early, map state was misread, or submission occurred before the available refinement time was used.

## Inputs

- Three private fixed-order OpenGuessr competition entry links.
- Eight Easy, nine Medium, and eight Hard locations, all configured with **300 seconds per round** and movement restriction `None` unless the visible game states otherwise.
- An authenticated eligible player account that did not create the competitions.
- This protocol only. The blind player receives no prior reports, source URLs, source coordinates, answers, repository context, or parent conversation history.

## Outputs

- One complete run report with exactly 25 round records.
- Every round record contains: untouched cues, initial belief, provisional pin, exploration, final belief, final pin verification, submission time remaining, distance, score, revealed location, semantic-correctness assessment, and pin-transfer assessment.
- Easy, Medium, Hard, and overall reconciled totals.
- Separate counts for country/city reasoning accuracy, belief-to-pin transfer accuracy, default/time-out guesses, and controller failures.

## Blind-play constraints

- Use only rendered pixels and ordinary labels visibly presented by OpenGuessr.
- Never use web/image search, map search, automatic geocoding, reverse-image search, source/DOM inspection, browser storage, network inspection, metadata, repository data, source coordinates, prior reports, or geolocation APIs.
- The ordinary in-game guess map may be manually opened, panned, and zoomed. Naturally rendered map labels may be read.
- Follow the visible movement restriction. With movement allowed, panorama movement, rotation, and visual zoom are permitted only after the untouched record.
- The player must not create or edit competitions. An invalid, expired, owned, or already-entered link is a pre-game blocker to return to the coordinator without exposing a round.

## Pre-game controller regression gate

Before entering the first scored competition, use a disposable unscored OpenGuessr single-player round to prove the following through rendered screenshots and coordinate-based browser control:

1. Place and visually verify a valid provisional marker.
2. Expand the guess map and zoom from world scale to a clearly rendered city scale.
3. Move the marker to a second visibly named city or district and verify the marker tip moved with it.
4. Collapse the map while preserving the marker and active Guess button.
5. Move one Street View step and verify that panorama geometry changed.
6. Reopen the map and verify the marker is still at the second location.
7. Abandon the unscored round without submitting it.

The scored run may start only if this complete regression gate passes. If it fails, repair or re-establish the controller in the unscored tab; do not learn a scored scene while debugging.

## Round state machine and expected intermediate states

Each round must progress through these visually verified states in order:

1. `SCENE_READY`: panorama fully rendered; no deliberate scene or map action taken.
2. `INITIAL_RECORDED`: whole-frame cues and initial hypothesis saved.
3. `PROVISIONAL_VERIFIED`: valid non-default marker visible in the intended area and Guess active.
4. `MAP_COLLAPSED`: compact map restored; the provisional marker/active Guess survives.
5. `EXPLORATION_COMPLETE`: required scene checks finished or explicitly exhausted.
6. `REFINEMENT_ACTIVE`: map open and remaining time being used to improve the marker.
7. `FINAL_PIN_VERIFIED`: marker tip visibly agrees with the stated final belief at the finest useful map scale.
8. `SUBMITTED`: result screen visibly rendered.

Do not infer a state transition from a click alone. A rendered screenshot must show the expected state. If an action is swallowed, retry only after checking the current state.

## Per-round algorithm

### 1. Untouched whole-frame analysis

- Before moving, rotating, zooming, or opening the map, inspect the entire rendered frame: center, edges, foreground, background, text, road markings, vehicles, architecture, vegetation, terrain, shadows, camera/car artifacts, and contradictions to any obvious landmark.
- Record up to five strongest directly visible cues.
- Record initial country, region/city, approximate coordinates or map area, alternatives, and calibrated confidence.
- Complete this promptly, normally within the first 20–30 seconds, without sacrificing the whole-frame check.

### 2. Immediate but meaningful provisional pin

- Open the map immediately after the initial record and place a valid provisional marker, normally by 45–60 seconds elapsed.
- The provisional must match the **finest location already justified**. If the frame names Paris, Berlin, Flåm, a street, or a landmark, pin that city/landmark area—not merely France, Germany, Norway, or Europe.
- Verify the marker against at least two rendered labels, boundaries, coastlines, or road/river features. Record what the verification actually proves.
- If the pin is accidentally offshore, in a default region, or inconsistent with the stated belief, correct it before exploration.
- Preserve a valid marker throughout the round, but do not treat it as final merely because it is safe.

### 3. Controlled scene exploration

- Collapse the expanded map through the verified neutral-footer action and confirm the compact map plus active Guess remain.
- Reinspect the whole scene and seek at least one independent corroborating cue and one possible contradiction.
- If movement is allowed and city/location is uncertain, take 3–5 verified Street View steps toward a likely diagnostic target; if necessary, inspect 3–5 steps in the opposite direction.
- Prioritize readable text, route/station codes, road signs, flags, plates, transit, businesses, road rules, landmark geometry, and nationally distinctive infrastructure.
- For ambiguous decisive text, obtain two independent rendered views/crops, transcribe character-by-character, count short codes in both directions, and retain alternatives until resolved.
- Generic appearance may adjust confidence but cannot overturn decisive text without a genuinely incompatible cue.
- When the exact landmark or city is already secure, keep exploration bounded and allocate the remaining time to exact map placement.

### 4. Mandatory time use and active pin refinement

- All scored rounds provide 300 seconds. Do not follow the former 140-second submission target.
- Unless the final marker is already verified at street/landmark scale and no useful scene or map refinement remains, continue active work through at least **240 seconds elapsed** (about 60 seconds remaining).
- The normal refinement window is approximately 150–260 seconds elapsed. Reopen the map and progressively zoom/pan from country → region → city → district → street/landmark.
- Never stop at country or regional scale when the stated belief names a city, street, junction, station, monument, harbor, border crossing, or viewpoint.
- At every scale, visually verify that rendered labels and geometry move as expected. Use short actions and a screenshot after each; never chain blind pan/zoom gestures.
- Keep the pointer inside the expanded map for map operations. If the panorama moves instead, map focus was lost: re-establish the expanded map before continuing.
- If one zoom/control method fails, try another already-visible in-map control or deliberate short drag after inspecting state. Do not abandon refinement after one failure while more than 60 seconds remain.
- Do not sacrifice a correct high-confidence textual belief to a weak map guess. The final marker must be moved to the final belief region before submission whenever the UI remains usable.

### 5. Final belief-to-pin verification

Before submission, record the final belief and perform this checklist:

1. State the intended country, city/region, named feature or road, approximate coordinates/map area, and confidence.
2. Verify the marker at country/region scale against at least two rendered labels or boundaries.
3. Zoom further and verify the intended city/district label or unmistakable coastline/river/road geometry.
4. When the scene identifies a named feature, place the marker tip on the corresponding visible landmark, road segment, junction, station, harbor, bridge, border, or viewpoint—not merely within the city.
5. Take a final screenshot and explicitly compare the visible marker position with the written final belief. If they disagree, correct the marker and repeat the check.
6. Record the visible time remaining at final verification.

A pin is `FINAL_PIN_VERIFIED` only if its rendered position is consistent with the written final belief. “Valid marker exists” is insufficient.

### 6. Submission timing and recovery

- Target manual submission with **25–45 seconds remaining**, after using the available time for refinement.
- If the final pin is exact and fully verified early, continue a brief contradiction/geometry audit; submission with more than 90 seconds remaining requires an explicit statement that street/landmark-scale placement is verified and no further useful refinement exists.
- At 45 seconds remaining, stop optional exploration and ensure the map is in a submit-ready state.
- Click Guess once and inspect the rendered state. If it is swallowed and the result screen does not appear, retry immediately.
- Never allow the timer to expire intentionally. The valid provisional is only an emergency fallback inside the final 45 seconds, not a reason to stop refinement earlier.

### 7. Result record

- Record displayed distance, round points, revealed location, and any official leaderboard reconciliation.
- Assess separately:
  - Was the final textual country/city/location belief correct?
  - Was the submitted marker consistent with that belief?
  - Was the remaining error semantic, map precision, controller execution, or verification?
- Record swallowed clicks, accidental actions, timer events, and unverified placement honestly.

### 8. Competition finalization gate

- A submitted final round is **not** a completed competition. After recording the final round's result, remain on that exact result screen and click its visible `Continue` control.
- Do not navigate directly to a leaderboard URL, home page, competition page, or another tab from the final result screen.
- After the final `Continue`, visually verify that OpenGuessr renders the completed competition/leaderboard state containing the player name and total score. If the click is swallowed, inspect the rendered state and retry the same `Continue` once.
- The terminal state is `LEADERBOARD_COMMITTED`, defined as a rendered leaderboard row for the current player with a numeric total. `No entries yet`, a generic competition page, or an unfinalized-result guard does not satisfy completion.
- Only after `LEADERBOARD_COMMITTED` may the player open/copy the leaderboard URL, reconcile scores, or leave the competition tab.
- For a Hard-only replacement run, the player must send a `FINAL ROUND RESULT` checkpoint, then a separate `FINAL CONTINUE CLICKED` checkpoint, and finally a `LEADERBOARD COMMITTED` checkpoint. The run is not complete without all three.

## Assumptions and edge cases

- **Exact landmark but generic map labels:** use visible road, river, coastline, rail, plaza, or building geometry; continue refinement until the finest useful scale.
- **No diagnostic scene cue:** retain calibrated alternatives, but still refine the pin to the center of the highest-probability area rather than a broad country click.
- **Map will not expand/collapse:** inspect current rendered state, retry the verified hover/footer sequence with viewport-scaled coordinates, and continue recovery while more than 60 seconds remain.
- **Marker appears clipped near the map edge:** pan until the marker and at least two reference labels are fully visible; a clipped marker cannot pass final verification.
- **First click is swallowed:** screenshot first, then make one deliberate retry; do not assume success.
- **Viewport changes:** scale coordinates to the visible map/footer bounds and verify the resulting rendered state.
- **Authentication or competition ownership error:** stop before the round and return control; never work around it by viewing source data.

## Completion and verification contract

After each competition:

- Reconcile every round value to the rendered leaderboard total.
- Audit the expected count of initial, provisional, exploration, final-pin, and result records.
- Report how many submitted pins visibly matched the final textual belief.
- Verify the terminal state `LEADERBOARD_COMMITTED`; do not infer completion merely because the final result screen appeared.

After all three competitions:

- Verify exactly 8 Easy + 9 Medium + 8 Hard records.
- Compute official totals and percentages of the respective maxima.
- Compare semantic accuracy, pin-transfer accuracy, controller failures, and official score with the preceding run.
- Do not claim the regression is fixed merely because all markers were valid; success requires materially improved belief-to-pin consistency and Easy pin precision.

Regression baselines from the immediately preceding explicit Sol/max run are **36,340 Easy points** and **787.5 km aggregate Easy error**. The rerun passes the pin-refinement regression only if:

- a correct high-confidence final country belief is never submitted in a different country because of an unverified world-scale marker;
- an exact-city or named-landmark belief is not knowingly left at country scale while usable refinement time remains;
- all 25 rounds retain valid non-default markers; and
- Easy score or aggregate Easy distance improves over the baseline. Report partial improvement honestly if only some gates pass.

## Run configuration

- Player model: `gpt-5.6-sol`
- Reasoning effort: `max`
- Player spawn context: `fork_turns: none`
- Independent fast-mode/service-tier selector: unavailable; no separate fast mode may be claimed.
- Fresh competition links are supplied separately by the setup coordinator and must be copied into the run report without reading their source data.
