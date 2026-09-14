# GLM-5.3-Flash — Max reasoning

Requested: three 25-round runs, each begun in a fresh ZCode chat. Completed: **3**. Verified scored rounds across completed and partial attempts: **75**. The initial 03:00 Berlin cutoff on September 8, 2026 interrupted Run 2. Cancellation was confirmed at 03:00:32, 32 seconds late; no scored submission occurred after the cutoff in that overnight session. At that point one full run and nine Run 2 rounds were complete, and Run 3 was unstarted. The user authorized completing Run 2 and Run 3 after 17:00 on September 8. Run 2 resumed in its existing chat and finished at approximately 20:31. The valid Run 3 began in a fresh chat at 20:51:38; Easy completed through a disclosed one-round continuation.

| Run | Status | Scored rounds | Easy / 40,000 | Medium / 45,000 | Hard / 40,000 | Full total / 125,000 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | complete | 25/25 | 39,773 | 41,229 | 30,159 | **111,161** |
| 2 | complete | 25/25 | 39,900 | 41,142 | 32,488 | **113,530** |
| 3 | complete | 25/25 | 39,954 (resumed) | 38,026 | 30,269 | **108,249** |

Mean of the 3 completed full run(s): **110,980 / 125,000 (88.7840%)**. Partial subtotals are not extrapolated or included in this mean. Repeated runs reuse the same fixed locations, so this measures run/controller variability, not new-location generalization.

Machine-readable scores: [summary.json](summary.json). Local image SHA-256 inventory: [evidence-manifest.json](evidence-manifest.json). No videos, images, raw telemetry or chats are included in this score-only publication, and no files were uploaded to Google Drive.

## Method and limitations

- GLM-5.3-Flash and Max reasoning were visibly selected in ZCode. Each run began in a fresh chat. The player used the published ten-tool NAUTILUS MCP, selected its own coordinates, and received no geographic assistance from the supervisor. Files, shell, search, network inspection, DOM, accessibility and hidden target data were prohibited for the player. The supervisor handled entry routing and recorder setup.
- Fixed Easy/Medium/Hard sets contain 8/9/8 rounds, with 300 seconds each and no game movement restriction. Model-chosen pins were verified by MCP; normal submissions used its actuator, with timer settlements after transport failures disclosed below. Run 1 generally used visible Continue clicks; Run 2 used the dedicated continuation tool.
- Run 2 was interrupted by the overnight cutoff and resumed in the same chat the following evening. Re-entering Medium restarted the game at round 1. A routing-only replay used the model's own original pin and reproduced 739 m / 4,996 points; it is excluded from the 25 scored rounds. The original Medium round-1 screenshot and score are retained, followed by the eight newly completed rounds. The restarted game's official total can therefore reconcile numerically, but Run 2 is explicitly an interrupted-and-resumed run.
- ZCode limits inline MCP images to 200 KiB of base64. Oversized screenshots were compressed to WebP below 195 KiB while preserving dimensions; original requested JPEGs were retained locally. The page adapter was initialized using the unchanged published script. Separate setup tests and three failed starts are excluded.
- Five concise visual cues and an initial model-chosen pin were requested before extended exploration, with submission while at least 60 seconds remained. From Run 1 Medium onward, a small panorama interaction was requested at each round start to trigger recording. Result readouts were shortened for Run 1 Hard and subsequent play. Panorama drags frequently produced no visible change; unrestricted movement availability does not establish successful exploration.
- Run 3 Easy was interrupted when the round-7 submission timed out and the MCP connection reset. The supervisor captured its settled result before the original live tab was lost during recovery. The first seven results remain authoritative; only the unseen eighth location was played in a one-round continuation, in the same chat. Its Easy score is the verified eight-result sum, with no claimed single official eight-round leaderboard.
- Run 3 Medium lost its MCP session after the final model pin was verified. The timer settled that existing pin at 4,925 points / 15.1 km. The supervisor saved the original result and clicked Continue to capture the 38,026-point official leaderboard; no round was replayed and no pin was changed. The recorder reported a video error and eight of nine rounds saved. Hard began after reconnecting MCP in the same chat.
- Other completed tier totals were checked against original official leaderboard images. Individual result-screen XP values are transcribed as round points. Distances are rounded as displayed. Partial attempts contain only verified submitted results, and have no claimed official tier or full-run total.
- Run 1 has 20 existing local video files for 25 scored rounds: Easy 1/6/7, all nine Medium, and all eight Hard. Easy rounds 2–5 and 8 lack videos; Easy round 6 recording starts about 109 seconds late. Hard has an extra raw round-4 JSON, which adds no scored round. Raw telemetry can contain unrelated advertising requests, so its coordinates are not used as score authority or globe predictions. Existing video files do not imply continuous coverage.
- Local video inventory: Run 1: 20; Run 2: 25; Run 3: 23; **68 existing files for 75 scored rounds**. Run 3 Hard reported video-save errors on rounds 3 and 6 despite nonempty files existing; these files are not certified as complete recordings. Run 3 Medium round 9 lacks a saved round video. Scores remain grounded in original result images.
- Competition 24724 failed image delivery without a verified geographic score. Competition 24727 failed adapter placement; its manual fallback reported 3,924 points at 242.3 km and is excluded. The first valid Easy competition is 24730, whose displayed title contains “R3” although it is used as valid Run 1. Run 2 uses Easy copy 24734. The initial Run 3 entry 24735 suffered screenshot capture failures after Confirm, before GLM saw the panorama or placed a guess; its timer expired without a model guess. Run 3 restarted in another fresh chat using Easy copy 24743.

## Run 1 individual scores

| Difficulty | Round | Displayed distance | Points |
| --- | ---: | --- | ---: |
| easy | 1 | 122 m | 4,999 |
| easy | 2 | 254 m | 4,999 |
| easy | 3 | 360 m | 4,998 |
| easy | 4 | 36.6 km | 4,820 |
| easy | 5 | 587 m | 4,997 |
| easy | 6 | 4,906 m | 4,976 |
| easy | 7 | 3,025 m | 4,985 |
| easy | 8 | 269 m | 4,999 |
| medium | 1 | 718 m | 4,996 |
| medium | 2 | 198.1 km | 4,101 |
| medium | 3 | 21.5 km | 4,893 |
| medium | 4 | 136.3 km | 4,363 |
| medium | 5 | 1,113 m | 4,994 |
| medium | 6 | 303.7 km | 3,690 |
| medium | 7 | 164.1 km | 4,243 |
| medium | 8 | 2,513 m | 4,987 |
| medium | 9 | 7.5 km | 4,962 |
| hard | 1 | 299.8 km | 3,704 |
| hard | 2 | 43.9 km | 4,785 |
| hard | 3 | 610 km | 2,716 |
| hard | 4 | 22.5 km | 4,889 |
| hard | 5 | 513.8 km | 2,990 |
| hard | 6 | 578.7 km | 2,802 |
| hard | 7 | 72.4 km | 4,651 |
| hard | 8 | 322.2 km | 3,622 |

[easy official leaderboard](https://openguessr.com/competitions?leaderboard=24730): 39,773 points. [medium official leaderboard](https://openguessr.com/competitions?leaderboard=24725): 41,229 points. [hard official leaderboard](https://openguessr.com/competitions?leaderboard=24726): 30,159 points.

## Run 2 individual scores

| Difficulty | Round | Displayed distance | Points |
| --- | ---: | --- | ---: |
| easy | 1 | 119 m | 4,999 |
| easy | 2 | 118 m | 4,999 |
| easy | 3 | 187 m | 4,999 |
| easy | 4 | 269 m | 4,999 |
| easy | 5 | 191 m | 4,999 |
| easy | 6 | 2,612 m | 4,987 |
| easy | 7 | 16.3 km | 4,919 |
| easy | 8 | 265 m | 4,999 |
| medium | 1 | 739 m | 4,996 |
| medium | 2 | 2,232 m | 4,989 |
| medium | 3 | 2,393 m | 4,988 |
| medium | 4 | 18.2 km | 4,910 |
| medium | 5 | 1,027 m | 4,995 |
| medium | 6 | 303.6 km | 3,690 |
| medium | 7 | 128.9 km | 4,395 |
| medium | 8 | 404.1 km | 3,337 |
| medium | 9 | 32 km | 4,842 |
| hard | 1 | 115.3 km | 4,455 |
| hard | 2 | 57.8 km | 4,719 |
| hard | 3 | 61.2 km | 4,703 |
| hard | 4 | 130 km | 4,390 |
| hard | 5 | 910.1 km | 2,012 |
| hard | 6 | 145.4 km | 4,323 |
| hard | 7 | 148.5 km | 4,310 |
| hard | 8 | 335.1 km | 3,576 |

[easy official leaderboard](https://openguessr.com/competitions?leaderboard=24734): 39,900 points. [medium official leaderboard](https://openguessr.com/competitions?leaderboard=24728): 41,142 points. [hard official leaderboard](https://openguessr.com/competitions?leaderboard=24729): 32,488 points.

## Run 3 individual scores

| Difficulty | Round | Displayed distance | Points |
| --- | ---: | --- | ---: |
| easy | 1 | 167 m | 4,999 |
| easy | 2 | 177 m | 4,999 |
| easy | 3 | 501 m | 4,997 |
| easy | 4 | 313 m | 4,998 |
| easy | 5 | 115 m | 4,999 |
| easy | 6 | 1,711 m | 4,991 |
| easy | 7 | 5.7 km | 4,972 |
| easy | 8 | 242 m | 4,999 |
| medium | 1 | 300.3 km | 3,702 |
| medium | 2 | 199.5 km | 4,095 |
| medium | 3 | 15.2 km | 4,925 |
| medium | 4 | 139.4 km | 4,349 |
| medium | 5 | 969 m | 4,995 |
| medium | 6 | 368.1 km | 3,460 |
| medium | 7 | 165.2 km | 4,238 |
| medium | 8 | 404.3 km | 3,337 |
| medium | 9 | 15.1 km | 4,925 |
| hard | 1 | 660.2 km | 2,583 |
| hard | 2 | 4,681 m | 4,977 |
| hard | 3 | 36.6 km | 4,820 |
| hard | 4 | 598.1 km | 2,749 |
| hard | 5 | 763.7 km | 2,329 |
| hard | 6 | 34 km | 4,833 |
| hard | 7 | 142.8 km | 4,334 |
| hard | 8 | 316.2 km | 3,644 |

Easy verified eight-result sum: 39,954 points; [final-location official leaderboard](https://openguessr.com/competitions?leaderboard=24744): 4,999 points. [medium official leaderboard](https://openguessr.com/competitions?leaderboard=24731): 38,026 points. [hard official leaderboard](https://openguessr.com/competitions?leaderboard=24732): 30,269 points.
