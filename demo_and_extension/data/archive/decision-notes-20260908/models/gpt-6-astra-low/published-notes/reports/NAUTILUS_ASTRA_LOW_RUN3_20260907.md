# Astra low run 3 — 2026-09-07
Blind screenshot-only play; interactive panorama; 300 seconds per round.

## Easy
### Round 1
Initial cues: green monumental column with golden figure; Bastille bus-stop label; curved modern opera facade; Parisian street lamps; French road marking Place de la Bastille. Initial belief: Paris Bastille, 99%.
Final belief: south-east approach to Bastille column beside Opera, 99%. Pin visually verified on Place de la Bastille south-east road; no contradictory cues. Map animations required settled screenshots; initial coarse pin was south of Paris and corrected.
Result: 78 m, 5000 XP. HUD SAVED 1/8.

### Round 2
Initial cues: Berlin television tower; Alexanderplatz U sign; German logistics truck; Galeria department store; broad plaza and bicycle racks. Initial belief: Berlin Alexanderplatz, 99%.
Final belief: southeast side of Alexanderplatz near Alexanderstrasse/Otto-Braun-Strasse, 95%. Tower, Galeria, rail line and Alexanderhaus geometry agree. Final marker verified on southeast sidewalk of junction; no contradiction.
Result: 4 m, 5000 XP. HUD SAVED 2/8.

### Round 3
Initial cues: Hohensalzburg-style hill fortress; Alpine mountain backdrop; river below; baroque church domes and old town; stone defensive wall viewpoint with shingled turret. Initial belief: Salzburg from Kapuzinerberg, 98%.
Final belief: Basteiweg/Aussichtsplatz Klostermauer on Kapuzinerberg, 95%. River and fortress align; pin verified on named viewpoint above Steingasse. Contradiction check: viewpoint elevation and defensive wall fit. Map drag overshoot corrected before submission.
Result: 314 m, 4998 XP. SAVE ERROR Round 3: prediction JSON saved, round video failed; HUD 2/8 saved.

### Round 4
Initial cues: dense red-roof medieval town; river meander with weir; stone saint statue; castle terrace above river; narrow Gothic church spire among wooded hills. Initial belief: Cesky Krumlov castle bridge, 98%.
Final belief: Plastovy most castle bridge, 98%. Named historic bridge with castle/city views matches statue and building; pin visually verified at bridge. No contradictory cues.
Result: 16 m, 5000 XP. SAVE ERROR Round 4: JSON saved, video failed; HUD 2/8.

### Round 5
Initial cues: Roman amphitheatre with pale arched outer wall; manicured Mediterranean park; cypress trees; yellow directional road sign; compact European roundabout with tour bus. Initial belief: Pula Arena Croatia, 95%.
Final belief: north-west Arena roundabout beside Valerijin park, 80% exact approach, 99% city. Provisional marker retained and visually verified north-west of Arena. Compared southern junction but geometry less convincing; remaining orientation uncertainty.
Result: 95 m, 5000 XP. HUD SAVED 3/8; recording recovered this round.

### Round 6
Initial cues: Zittau destination sign; route 178/B178; PL and D country ovals; Polish Granica Panstwa border warning; bridge beside roundabout and yellow railings. Initial belief: Polish-German crossing east of Zittau on B178, 98%.
Final belief: Polish side of B178 bridge at Sieniawka, west arm of roundabout, 97%. Visible Granica Panstwa sign faces bridge; map B178 river crossing and roundabout fit. Rejected Czech-side alternative after route geometry. Pin visually verified at western exit.
Result: 26 m, 5000 XP. HUD SAVED 4/8.

### Round 7
Initial cues: Ljubljana yellow directional sign; Novo mesto sign; station building label IVANCNA GORICA; red tile roof; wooded hills with small railway station and crossing. Initial belief: Ivancna Gorica Slovenia railway station, 99%.
Decisive correction before submission: rereading the visible station label gives VISNJA GORA, not Ivancna Gorica. Ivancna map layout contradicted hillside narrow road, prompting correction.
Final belief: Visnja Gora station entrance at Ulica Antona Tomsica/Ciglerjeva, 99%. Corrected pin verified south of station at access road, matching visible Ulica Antona road text and station ahead. Initial town identification corrected.
Result: 13 m, 5000 XP. HUD SAVED 5/8.

### Round 8
Initial cues: FLAM gates; steep fjord walls; Norwegian flag; waterside tourist picnic area; timber shelter and barrel barriers. Initial belief: Flam Norway harbor, 99%.
Final belief: Flam port near Viking Handcraft and Flamsbrygga, 96%. Shelter and tourist gate agree with mapped waterfront facilities. Pin verified on A-Feltvegen east of Viking Handcraft; no contradictory cues.
Result: 60 m, 5000 XP. SAVE ERROR Round 8: JSON saved, video failed; HUD 5/8.

Easy official leaderboard: Ivan Iachnyk 39,998 points, rank 1. Reconciles 7 x 5000 + 4998. Recorded videos HUD 5/8; failures R3, R4, R8 with JSON saved.

## Medium
Recorder armed with correct Medium label and run identifier; automatic video fallback.

### Round 1
Initial cues: Catalan/Valencian Carrer road label; tall cream balcony apartments; green glass recycling dome; ornate paired street lamps; broad leafy grid street with Generali storefronts. Initial belief: Valencia Spain, 75%, Barcelona alternative.
New cue: road label reads Carrer de Ciscar, supporting Valencia Gran Via district. Final belief: Ciscar at Comte dAltea, 90% street, 65% intersection. Marker visually verified at that junction; Barcelona rejected by matching street grid and architecture.
Result: 2 m, 5000 XP. HUD SAVED 1/9.

### Round 2
Initial cues: Italian Via Francesco road label; orange-red brick villas; green shutters; large roadside segregated waste bins; leafy flat residential street and white plates. Initial belief: Bologna Italy, 60%, other northern Italian cities possible.
New cue: panorama label appears Via Francesco Orioli. Final belief: Bologna Saragozza residential district, 75% city, 35% exact street. Could not locate Orioli within time; marker verified on Via Francesco Roncati near Alessandro Guidotti, a nearby district hedge. Contradiction: exact street name not matched, retained uncertainty.
Result: 12 m, 5000 XP. HUD SAVED 2/9. Result establishes actual road Roncati; pre-result Orioli reading was mistaken.

### Round 3
Initial cues: Amsterdamsestraatweg road label; Dutch red cycle lanes; yellow traffic bollards; dense parked bicycles; low brick commercial/residential blocks. Initial belief: Utrecht Amsterdamsestraatweg, 90%.


## Protocol incident — Medium R3
After context recovery, two coordinate action calls failed because their argument shape was incorrect. A getTab call to restore controls unexpectedly emitted accessibility content with hidden street-view location coordinates. This violates the screenshot-only blind protocol. Medium R3 and later scored work are stopped; parent notified. Prior completed Easy total 39,998 and Medium R1–R2 total 10,000 preceded this exposure. This run must not be treated as an uncontaminated complete 25-round result.

## Recovery decision: clean replacement for Medium and Hard
The complete Easy challenge remains eligible: official 39,998 points. The entire original Medium attempt (competition 24717, including its first two clean rounds) is excluded from the final aggregate because the player's browser-binding recovery exposed hidden metadata during Medium R3. Its files are retained as incident evidence, and will not be counted as additional evaluated rounds. Original Hard competition 24718 was never played.

Created new full Medium (24720, nine original locations) and Hard (24721, eight original locations) challenges with unchanged 300-second limit, restriction None, and original order. A new GPT-6 Astra low subagent received no inherited conversation, previous guesses, source URLs, or exposed metadata. It will play these two full challenges with recorder label gpt-6-astra-low-r3-clean-20260907. Its report and screenshots use the separate NAUTILUS_ASTRA_LOW_RUN3_CLEAN prefix. Final run 3 will combine the original clean Easy leaderboard with these clean replacement challenge results.

The player received an explicit coordinate-control API reference to retain across context transitions, including the instruction to preserve its browser binding and never reacquire a tab during a scored round (tab acquisition automatically emits accessibility metadata).

## Recovery after laptop crash and Chrome reload

Chrome reload lost the clean Medium competition state and OpenGuessr refused immediate resumption. Preserve the six completed, screenshot-verified rounds from competition 24720; exclude the seventh partial crash record without a verified score. The remaining original Medium rounds 7–9 are continued in private competition 24723 (300 seconds, restriction None, original order). Hard uses untouched competition 24718. The same clean player continues with recorder label gpt-6-astra-low-r3-finish-20260907. Final Medium will therefore be a composite of six completed results plus the official three-round continuation total. Original contaminated Medium attempt remains excluded.

## Final coordinator verification and three-run comparison

Run 3 is complete across all 25 original locations. Easy official leaderboard: 39,998/40,000. Medium composite: 28,668 from the six clean completed pre-crash rounds (3,692 + 5,000 + 4,998 + 4,990 + 5,000 + 4,988), plus the independently inspected final-three official leaderboard of 14,814, yielding 43,482/45,000. Hard official leaderboard independently inspected: 35,279/40,000. Run 3 total: 118,759/125,000 (95.0072%).

| Tier | Run 1 | Run 2 | Run 3 |
| --- | ---: | ---: | ---: |
| Easy / 40,000 | 39,997 | 39,998 | 39,998 |
| Medium / 45,000 | 44,189 | 44,686 | 43,482 |
| Hard / 40,000 | 34,974 | 35,134 | 35,279 |
| Total / 125,000 | 119,160 | 119,818 | 118,759 |
| Percentage | 95.3280% | 95.8544% | 95.0072% |

Three-run mean: 119,245.67/125,000 (95.3965%). Run 2 has the highest total. Run 3 is 1,059 points below Run 2, with a 145-point improvement on Hard and a 1,204-point decrease on Medium. These are descriptive repeats on the same fixed 25 locations, not independent samples of geography.

Evidence audit: 25 valid result screenshots (8 original Easy plus 9 clean Medium plus 8 clean Hard), three leaderboard screenshots (Easy, final-three Medium, Hard), 22 matched valid-round recorder JSON files, and 19 existing videos. Videos are absent for Easy R3/R4/R8 and the three Medium continuation rounds. The latter have result and leaderboard screenshots but no recorder JSON. All eight Hard rounds have recordings and videos. Raw collector prediction coordinates were not independently validated; score totals use visible results and official leaderboards.

The original contaminated Medium attempt and the unverified partial crash round are excluded. Run 1 Hard and Run 3 Medium are composites across interrupted sessions and continuations. Detailed clean Medium/Hard observations and recovery incidents are in NAUTILUS_ASTRA_LOW_RUN3_CLEAN_20260907.md. No further run was started.
