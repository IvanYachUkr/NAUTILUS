# GPT-6 Astra — low reasoning

Three completed 25-location evaluations using fresh GPT-6 Astra low players, Chrome screenshots and normal visible UI controls, with 300 seconds per round. Players received challenge entry links and the blind-play protocol, without dataset coordinates or previous players' guesses. Recovery replacements and exclusions are documented in the reports.

| Run | Easy / 40,000 | Medium / 45,000 | Hard / 40,000 | Total / 125,000 | Share of maximum |
| --- | ---: | ---: | ---: | ---: | ---: |
| [run-1](reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md) | 39,997 | 44,189 | 34,974 | **119,160** | 95.3280% |
| [run-2](reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md) | 39,998 | 44,686 | 35,134 | **119,818** | 95.8544% |
| [run-3](reports/NAUTILUS_ASTRA_LOW_RUN3_20260907.md) | 39,998 | 43,482 | 35,279 | **118,759** | 95.0072% |
| **Mean** | **39,997.67** | **44,119.00** | **35,129.00** | **119,245.67** | **95.3965%** |

Machine-readable totals and provenance: [summary.json](summary.json). SHA-256 evidence inventory: [evidence-manifest.json](evidence-manifest.json).

Report copies use normalized line endings and trailing whitespace. Their manifest entries retain the original local-file hash as `sourceSha256`; `sha256` and `bytes` describe the published copy. Screenshots are copied unchanged.

## Score provenance and interruptions

- Run 1 Hard: six completed settled round scores total 27,800; an official two-round continuation contributes 7,174.
- Run 2: all three totals are official competition leaderboard totals.
- Run 3 Medium: six clean completed settled round scores total 28,668; an official three-round continuation contributes 14,814. The first Medium attempt was excluded after accidental hidden-coordinate exposure during controller recovery. Its replacement used a fresh player. A later laptop crash required the remaining-three continuation; the unverified partial crash round is excluded.
- These composite tiers are not single uninterrupted official leaderboards. All other tier totals are official leaderboards.

Repeated runs reuse the same fixed locations. Percentages are shares of the maximum OpenGuessr score, not location-classification accuracy.

## Evidence and storage

The reports preserve initial cues, hypotheses, guesses, errors, and controller incidents. This folder includes 73 valid individual result screenshots, nine leaderboard screenshots, two excluded-attempt screenshots, and two recovery screenshots. Run 1 Easy R1/R2 have report entries and a tier leaderboard rather than individual screenshots. The manifest identifies each file's role and exact hash.

Run 2 has 23 locally stored videos; Run 3 has 19. Run 3 lacks video for Easy R3/R4/R8 and Medium continuation R7–R9; the latter also lack recorder JSON. The complete Hard Run 3 has all eight videos. No continuous-video completeness claim is made for Run 1.

**No Astra evidence or videos were uploaded to Google Drive.** Videos remain local; this repository contains compact score and screenshot evidence. Raw recorder coordinates are not validated and are intentionally excluded from the globe's prediction layer.
