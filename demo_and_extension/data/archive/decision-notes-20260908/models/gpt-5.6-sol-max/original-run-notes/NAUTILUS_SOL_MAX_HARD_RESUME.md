# NAUTILUS Sol/Max Hard Continuation Handoff

Created: 2026-08-11

## Purpose

Resume the paused GPT-5.6 Sol / `max` evaluation without exposing the fresh player to repository locations or prior results.

## Instance boundary

- The original Sol/max player completed Easy, Medium, and original Hard Round 1.
- Work was intentionally stopped after original Hard Round 2's untouched-frame message but before any recorded provisional pin or result.
- That original subagent instance is no longer available.
- This continuation therefore uses a new isolated GPT-5.6 Sol / `max` player instance and replays original Hard Rounds 2–8 from a fresh seven-round competition.
- The instance boundary must remain explicit in the final report; do not describe the combined run as one uninterrupted agent process.

## Competition

- Entry: https://openguessr.com/competitions?enter=24277
- Leaderboard: https://openguessr.com/competitions?leaderboard=24277
- 7 rounds, 300 seconds each, Private, Restriction None.
- Continuation Round 1 corresponds to original Hard Round 2; continuation Round 7 corresponds to original Hard Round 8.

## Player constraints

- Follow `NAUTILUS_BLIND_PLAY_PROTOCOL_V2.md` exactly.
- Do not read `NAUTILUS_SOL_MAX_RUN.md`, the old pause checkpoint, competition JSON, starting images, prior reports, recordings, generated data, or GeoCLIP outputs.
- Use only visible OpenGuessr pixels and ordinary rendered in-game map labels.
- Save the continuation record only to `NAUTILUS_SOL_MAX_HARD_CONTINUATION.md`.
- Initialize that file with the explicit model (`gpt-5.6-sol`), effort (`max`), new-instance boundary, competition links/settings, and round-number mapping.

## Live-round priorities

1. Untouched whole-frame record with up to five cues, hypothesis, alternatives, and confidence.
2. Valid provisional pin immediately afterward; aim for 50 seconds and visually prove the marker plus red Guess button.
3. Collapse the expanded map via its black footer strip, visually prove the compact map returned and the marker survived, then explore the panorama.
4. Reinspect ambiguous text with independent views/crops and perform the bounded route search when no city-specific cue exists.
5. Reopen/refine the map using rendered CUA with a visual check after every action.
6. Submit manually by about 240 seconds, retaining a 60-second safety margin.
7. Record result, distance, visible XP, official score when available, revealed location, UI failures, and error analysis before continuing.

After all seven rounds, reconcile the official leaderboard total and verify the continuation file contains seven untouched records, seven provisional pins, seven final/result records, and no silent/default guesses.
