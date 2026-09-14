# NAUTILUS Sol/xhigh Benchmark Addendum

Created: 2026-08-12

## Purpose

Run the same fixed-order NAUTILUS Easy, Medium, and Hard OpenGuessr evaluation under the already-approved `NAUTILUS_BLIND_PLAY_PROTOCOL_V3_PIN_REFINEMENT.md`, changing only the player's reasoning effort from `max` to `xhigh` (extra high). This makes the result directly comparable with the completed Sol/max benchmark.

## Configuration override

- Model: `gpt-5.6-sol`
- Reasoning effort: `xhigh`
- Spawn context: `fork_turns: none`
- Round duration: 300 seconds
- Movement restriction: None
- Order: Easy 8, Medium 9, Hard 8, using the exact existing source order
- Player account: eligible non-creator account
- Gameplay report: `NAUTILUS_SOL_XHIGH_RUN.md`

All other requirements, states, timing rules, blind-play restrictions, controller checks, result fields, and completion gates come from Protocol v3 without modification.

## Isolation contract

The gameplay agent may read only:

1. the Chrome-control skill;
2. `NAUTILUS_BLIND_PLAY_PROTOCOL_V3_PIN_REFINEMENT.md`;
3. this addendum; and
4. the three fresh entry URLs supplied after setup.

It must not read prior run reports, setup/source files, source URLs, coordinates, recordings, repository data, the parent conversation, previous guesses, revealed locations, or max-run results. It must not search the web, inspect the DOM/network/storage, or use map search/geocoding.

## Per-round emphasis

- Inspect the complete untouched image, including edges and small signs, before any scene action.
- Record the five strongest visible cues, initial belief, alternatives, and calibrated confidence.
- Place and visually verify a meaningful provisional pin as soon as the initial belief exists.
- Use the available time actively. Explore for independent corroboration or contradiction, then refine country to region to city to street/feature whenever justified.
- Do not protect a coarse provisional merely because it is valid. The final rendered marker must agree with the final written belief.
- Aim to finish final pin verification with about 55–60 seconds remaining and submit immediately, preserving time for one screenshot-checked retry if the click is swallowed.
- Distinguish result-screen XP animation from official competition points.

## Competition completion gate

For the last round of Easy, Medium, and Hard:

1. record `FINAL ROUND RESULT` while remaining on the exact result screen;
2. click the visible final `Continue` control;
3. retry the same control once only if inspection proves the click was swallowed; and
4. record `LEADERBOARD COMMITTED` only after a rendered row shows the current player and a numeric total.

The agent must not navigate directly to a leaderboard URL before this gate succeeds.

## Required output

The report must contain exactly 8 Easy, 9 Medium, and 8 Hard round records. Each record must include INITIAL, PROVISIONAL PIN, FINAL BELIEF + PIN, RESULT, displayed distance, official reconciled points, semantic assessment, belief-to-pin assessment, and controller/timing notes. It must end with committed official totals for all three levels and a 25-round audit.

