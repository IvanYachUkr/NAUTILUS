# NAUTILUS Sol Max Recorded Run R4

## Run configuration

- Date: 2026-08-31 (Europe/Berlin; recorder timestamps span 2026-08-30 to 2026-08-31 UTC)
- Player account: Ivan Yachnik
- Player model: GPT-5.6 Sol, reasoning effort max
- Recorder model label: `gpt-5-6-sol-max-recorded-r4`
- Recorder: OpenGuessr Research Round Recorder 0.7.26
- Condition: Interactive panorama (`interactive-panorama`)
- Authoritative competition order: Easy 24588 (8), Medium 24572 (9), Hard 24573 (8)
- Entry links: `https://openguessr.com/competitions?enter=24588`, `https://openguessr.com/competitions?enter=24572`, `https://openguessr.com/competitions?enter=24573`
- Round duration: 300 seconds
- Play protocol: `NAUTILUS_BLIND_PLAY_PROTOCOL_V3_PIN_REFINEMENT.md` plus `NAUTILUS_RECORDED_SOL_ADDENDUM.md`, with the coordinator's reliability override to stop optional interaction near 01:20 and submit safely by about 01:00 at the latest.
- Evidence status: **AUTHORITATIVE COMPLETE RUN.** Exactly 25 submitted rounds are counted below. The earlier Easy 24571 and Easy 24587 partial attempts are retained only in explicitly excluded appendices and contribute zero rounds, points, or distance.
- Submission-time notation: approximate remaining times are reconciled from recorder round-start/result timestamps; recovered split-capture rounds use the earliest segment start and authoritative submitted segment stop.

## Recorder sessions

| Level | Dataset | Entry | ARMED/VID and REC evidence | Terminal state | Manifest | Official total |
|---|---|---:|---|---|---|---:|
| Easy | `europe-easy` | 24588 | Blue `ARMED`, automatic visible-tab fallback/VID, then `REC` for rounds 1-8 | `Competition recorded`, 8/8; leaderboard committed; `Done & disarm` | `demo_and_extension/data/recordings/sessions/europe-easy/session-2026-08-30t23-09-50-289z-164541c1-9949-4026-a2f3-a04bee8a5519.json` | 38,482 |
| Medium | `europe-medium` | 24572 | Blue `ARMED`, automatic visible-tab fallback/VID, then `REC` for rounds 1-9 | `Competition recorded`, 9/9; leaderboard committed; `Done & disarm` | `demo_and_extension/data/recordings/sessions/europe-medium/session-2026-08-30t23-41-05-094z-0d28a441-5cd8-4d9e-8134-74113517d319.json` | 41,907 |
| Hard | `europe-hard` | 24573 | Blue `ARMED`, automatic visible-tab fallback/VID, then `REC` for rounds 1-8 | `Competition recorded`, 8/8; leaderboard committed; `Done & disarm` | `demo_and_extension/data/recordings/sessions/europe-hard/session-2026-08-31t00-17-48-533z-d5e743a8-c457-4879-ad5b-c9280e35a6db.json` | 30,760 |

Every authoritative manifest is `complete`, has recorder 0.7.26, the exact model/condition labels, a stopped video session, and the expected saved count. All 25 authoritative entries have `stopReason: prediction_submitted`, `predictionCaptured: true`, `saveSuccess: true`, `videoSaveSuccess: true`, no `videoError`, and an existing prediction JSON. A later capture-ID audit found the two recorder path collisions disclosed below; path existence alone had not detected them.

## Authoritative Easy - 8 rounds (entry 24588)

### Authoritative Easy 1/8 - Place de la Bastille, Paris

1. **Untouched cues:** `Place de la Bastille` road text, the July Column, Parisian boulevard geometry, Haussmann streetscape, and French transit furniture.
2. **Initial belief:** France, Paris, Place de la Bastille; very high confidence.
3. **Provisional pin:** A valid non-default Paris marker was placed early and refined from city to plaza scale.
4. **Exploration:** The named road and landmark made movement unnecessary; the remaining work was map-scale refinement.
5. **Final belief:** Place de la Bastille / July Column, central Paris.
6. **Final pin verification:** The marker was visibly aligned to the Bastille plaza rather than merely the Paris label.
7. **Submission time remaining:** Approximately 01:31.
8. **Distance:** 247 m.
9. **Score:** 4,999 points.
10. **Revealed location:** Place de la Bastille, Paris, France.
11. **Semantic correctness:** PASS - exact city and named landmark.
12. **Pin-transfer assessment:** PASS - submitted plaza marker matched the final belief.
13. **Controller/recorder/default notes:** Valid non-default submission; `SAVED` advanced to 1/8; no timeout or controller failure.

### Authoritative Easy 2/8 - Alexanderplatz, Berlin

1. **Untouched cues:** `U Alexanderplatz`, Fernsehturm, German text, dense bicycle parking, and the plaza's modernist blocks.
2. **Initial belief:** Germany, Berlin, Alexanderplatz; very high confidence.
3. **Provisional pin:** A valid Berlin marker was placed and refined to Alexanderplatz.
4. **Exploration:** Station text and skyline geometry were decisive; map labels separated the city label from the exact complex.
5. **Final belief:** Alexanderplatz station/plaza beside the Fernsehturm.
6. **Final pin verification:** The marker visibly sat on the Alexanderplatz complex.
7. **Submission time remaining:** Approximately 02:57; landmark-scale placement was already verified and no useful contradiction remained.
8. **Distance:** 279 m.
9. **Score:** 4,999 points.
10. **Revealed location:** Alexanderplatz, Berlin, Germany.
11. **Semantic correctness:** PASS - exact city and plaza.
12. **Pin-transfer assessment:** PASS - submitted marker matched the final Alexanderplatz belief.
13. **Controller/recorder/default notes:** Valid non-default submission; `SAVED` advanced to 2/8; no timeout or controller failure.

### Authoritative Easy 3/8 - Hohensalzburg area, Salzburg

1. **Untouched cues:** Hohensalzburg Fortress, Salzburg's baroque skyline, steep wooded city hills, the Salzach corridor, and Alpine backdrop.
2. **Initial belief:** Austria, Salzburg, fortress/old-town viewpoint area; high confidence.
3. **Provisional pin:** A valid Salzburg marker was placed before local refinement.
4. **Exploration:** Fortress, river, and hill geometry were compared while the map was refined within central Salzburg.
5. **Final belief:** Hohensalzburg/central Salzburg viewpoint cluster.
6. **Final pin verification:** The marker was inside the named Salzburg landmark area rather than at regional scale.
7. **Submission time remaining:** Approximately 01:50.
8. **Distance:** 417 m.
9. **Score:** 4,998 points.
10. **Revealed location:** Hohensalzburg-area panorama, Salzburg, Austria.
11. **Semantic correctness:** PASS - country, city, and landmark cluster correct.
12. **Pin-transfer assessment:** PASS - submitted marker represented the stated Salzburg landmark belief.
13. **Controller/recorder/default notes:** Valid non-default submission; `SAVED` advanced to 3/8; no timeout or controller failure.

### Authoritative Easy 4/8 - Plášťový most, Český Krumlov

1. **Untouched cues:** Tight Vltava bend, red-roofed old town, St Vitus church, castle geometry, and elevated bridge/viewpoint.
2. **Initial belief:** Czechia, Český Krumlov Castle, Plášťový most; very high confidence.
3. **Provisional pin:** A valid Český Krumlov marker was placed and zoomed into the castle complex.
4. **Exploration:** River-loop and castle geometry were sufficient; map refinement isolated the bridge.
5. **Final belief:** Plášťový most (Cloak Bridge), Český Krumlov Castle.
6. **Final pin verification:** Marker tip visibly matched the bridge footprint.
7. **Submission time remaining:** Approximately 01:26.
8. **Distance:** 17 m.
9. **Score:** 5,000 points.
10. **Revealed location:** Plášťový most, Český Krumlov, Czechia.
11. **Semantic correctness:** PASS - exact city and named bridge.
12. **Pin-transfer assessment:** PASS - exact belief and bridge-scale marker agreed.
13. **Controller/recorder/default notes:** Valid non-default submission; `SAVED` advanced to 4/8; no timeout or controller failure.

### Authoritative Easy 5/8 - Pula Arena (submitted Rome)

1. **Untouched cues:** Monumental Roman amphitheatre stonework, dense urban surroundings, Mediterranean vegetation, and traffic around the arena.
2. **Initial belief:** Italy, Rome, Colosseum area; moderate confidence, with another Roman amphitheatre as the unresolved alternative.
3. **Provisional pin:** A valid non-default Rome marker was placed.
4. **Exploration:** The arena facade and urban context were rechecked, but the Pula alternative was not selected.
5. **Final belief:** Rome, Colosseum area, Italy.
6. **Final pin verification:** The marker visibly remained in Rome and matched that final textual belief.
7. **Submission time remaining:** Approximately 02:25.
8. **Distance:** 349.6 km.
9. **Score:** 3,524 points.
10. **Revealed location:** Pula Arena, Pula, Croatia.
11. **Semantic correctness:** FAIL - wrong country and city; the Roman-amphitheatre class alone was correct.
12. **Pin-transfer assessment:** PASS - the Rome marker faithfully represented the stated Rome belief.
13. **Controller/recorder/default notes:** Valid non-default submission; a brief post-result HUD render lag corrected after the required five-second recheck to `SAVED`, 5/8. No timeout or controller failure.

### Authoritative Easy 6/8 - Sieniawka/Zittau tri-border cluster (submitted Hrádek nad Nisou)

1. **Untouched cues:** Central-European border-road geometry, nearby multilingual place-name context, rolling terrain, and the close Czech-German-Polish road network.
2. **Initial belief:** Hrádek nad Nisou / Zittau tri-border area, leaning Czechia.
3. **Provisional pin:** A valid non-default marker was placed in the Zittau-Hrádek cluster.
4. **Exploration:** Road alignment, border geometry, and rendered locality labels were compared within the immediate tri-border region.
5. **Final belief:** Hrádek nad Nisou, Czechia, immediately south of Zittau.
6. **Final pin verification:** The marker visibly matched Hrádek and the stated Czech side of the cluster.
7. **Submission time remaining:** Approximately 01:07.
8. **Distance:** 7.4 km.
9. **Score:** 4,963 points.
10. **Revealed location:** Sieniawka, Poland, near Zittau and the Czech border.
11. **Semantic correctness:** PARTIAL - the immediate tri-border cluster was correct, but the town and country side were wrong.
12. **Pin-transfer assessment:** PASS - submitted Hrádek marker matched the final Hrádek belief.
13. **Controller/recorder/default notes:** Valid non-default submission; `SAVED` advanced to 6/8; no timeout or controller failure.

### Authoritative Easy 7/8 - Višnja Gora, Slovenia

1. **Untouched cues:** Slovenian roadscape, compact hillside settlement, red-roofed buildings, Dinaric vegetation, and local town geometry.
2. **Initial belief:** Slovenia, Višnja Gora / Ljubljana-Novo mesto corridor; high confidence.
3. **Provisional pin:** A valid non-default central-Slovenia marker was placed.
4. **Exploration:** Settlement layout and rendered labels narrowed the point to Višnja Gora.
5. **Final belief:** Višnja Gora, Slovenia.
6. **Final pin verification:** The marker visibly aligned with the named town.
7. **Submission time remaining:** Approximately 01:45.
8. **Distance:** 54 m.
9. **Score:** 5,000 points.
10. **Revealed location:** Višnja Gora, Slovenia.
11. **Semantic correctness:** PASS - exact country and town.
12. **Pin-transfer assessment:** PASS - submitted town marker matched the final belief.
13. **Controller/recorder/default notes:** Valid non-default submission; `SAVED` advanced to 7/8; no timeout or controller failure.

### Authoritative Easy 8/8 - Flåm, Norway

1. **Untouched cues:** Fjord walls, Flåm harbour, railway/terminal infrastructure, Norwegian signage, and the compact tourist waterfront.
2. **Initial belief:** Norway, Flåm port and railway complex; very high confidence.
3. **Provisional pin:** A valid Flåm marker was placed and refined within the waterfront complex.
4. **Exploration:** Fjord, port, and railway geometry were checked against local map labels.
5. **Final belief:** Flåm railway/harbour complex.
6. **Final pin verification:** Marker tip visibly sat in the Flåm terminal area.
7. **Submission time remaining:** Approximately 01:34.
8. **Distance:** 296 m.
9. **Score:** 4,999 points.
10. **Revealed location:** Flåm waterfront, Norway.
11. **Semantic correctness:** PASS - exact country, town, and attraction cluster.
12. **Pin-transfer assessment:** PASS - submitted terminal marker matched the final belief.
13. **Controller/recorder/default notes:** Valid non-default submission; the terminal HUD briefly lagged, then corrected to `Competition recorded`, 8/8. Final Continue committed 38,482 and `Done & disarm` closed the session.

## Authoritative Medium - 9 rounds (entry 24572)

### Authoritative Medium 1/9 - Valencia

1. **Untouched cues:** Spanish text, Mediterranean architecture, a broad urban avenue, dense central-city blocks, and local transit/street furniture.
2. **Initial belief:** Spain, central Valencia; high confidence.
3. **Provisional pin:** A valid non-default Valencia marker was placed early.
4. **Exploration:** Street geometry and rendered city labels were used to refine within Valencia.
5. **Final belief:** Central Valencia, Spain.
6. **Final pin verification:** The marker visibly remained in the intended central-Valencia area.
7. **Submission time remaining:** Approximately 01:20.
8. **Distance:** 1.102 km.
9. **Score:** 4,994 points.
10. **Revealed location:** Valencia, Spain.
11. **Semantic correctness:** PASS - correct country and exact city.
12. **Pin-transfer assessment:** PASS - submitted Valencia marker matched the final belief.
13. **Controller/recorder/default notes:** Valid non-default submission; `SAVED` advanced to 1/9; no timeout or controller failure.

### Authoritative Medium 2/9 - Bologna

1. **Untouched cues:** Italian streetscape, brick/arcaded urban fabric, scooters, local road text, and dense Emilia-Romagna city geometry.
2. **Initial belief:** Italy, Bologna; high confidence.
3. **Provisional pin:** A valid non-default Bologna marker was placed.
4. **Exploration:** Road layout and rendered neighbourhood labels refined the city placement.
5. **Final belief:** Bologna, Italy.
6. **Final pin verification:** The marker visibly remained within the intended Bologna corridor.
7. **Submission time remaining:** Approximately 01:34.
8. **Distance:** 749 m.
9. **Score:** 4,996 points.
10. **Revealed location:** Bologna, Italy.
11. **Semantic correctness:** PASS - correct country and city.
12. **Pin-transfer assessment:** PASS - submitted marker represented the final Bologna belief.
13. **Controller/recorder/default notes:** Valid non-default submission; `SAVED` advanced to 2/9; no timeout or controller failure.

### Authoritative Medium 3/9 - Utrecht

1. **Untouched cues:** Dutch cycle infrastructure, brick housing, flat terrain, Dutch road design, and Utrecht-scale urban density.
2. **Initial belief:** Netherlands, Utrecht; high confidence.
3. **Provisional pin:** A valid non-default Utrecht marker was placed.
4. **Exploration:** Street direction and neighbourhood labels were compared within Utrecht.
5. **Final belief:** Utrecht, Netherlands.
6. **Final pin verification:** The marker visibly matched the stated Utrecht urban area.
7. **Submission time remaining:** Approximately 01:44.
8. **Distance:** 1.571 km.
9. **Score:** 4,992 points.
10. **Revealed location:** Utrecht, Netherlands.
11. **Semantic correctness:** PASS - correct country and city.
12. **Pin-transfer assessment:** PASS - submitted Utrecht marker matched the final belief.
13. **Controller/recorder/default notes:** Valid non-default submission; a short post-result HUD lag corrected after the five-second recheck to `SAVED`, 3/9. No timeout or controller failure.

### Authoritative Medium 4/9 - N444, Merelbeke-Melle, Belgium

1. **Untouched cues:** Belgian road furniture, Flemish built environment, flat green verge, route/locality context, and dense Ghent-fringe road geometry.
2. **Initial belief:** Belgium, Ghent/Merelbeke fringe, N444 corridor.
3. **Provisional pin:** A valid non-default marker was placed southeast of Ghent.
4. **Exploration:** Rendered N444 and Merelbeke-area labels were compared against the road orientation.
5. **Final belief:** N444 near Merelbeke-Melle, Belgium.
6. **Final pin verification:** The marker visibly matched the intended Ghent-southeast road corridor.
7. **Submission time remaining:** Approximately 01:33.
8. **Distance:** 2.739 km.
9. **Score:** 4,986 points.
10. **Revealed location:** N444 corridor, Merelbeke-Melle, Belgium.
11. **Semantic correctness:** PASS - country, road, and local cluster correct.
12. **Pin-transfer assessment:** PASS - submitted marker matched the final corridor belief.
13. **Controller/recorder/default notes:** Valid non-default submission; `SAVED` advanced to 4/9; no timeout or controller failure.

### Authoritative Medium 5/9 - Rua da Figueira da Foz, Coimbra

1. **Untouched cues:** Portuguese text, `Figueira da Foz` street naming, painted/tiled facades, hilly Coimbra road form, and local urban vegetation.
2. **Initial belief:** Portugal, Coimbra, Rua da Figueira da Foz; very high confidence.
3. **Provisional pin:** A valid Coimbra marker was placed and refined to street scale.
4. **Exploration:** Visible street text and map labels isolated the exact road segment.
5. **Final belief:** Rua da Figueira da Foz, Coimbra.
6. **Final pin verification:** The marker tip visibly aligned with the named street.
7. **Submission time remaining:** Approximately 02:13; street-scale placement was already verified.
8. **Distance:** 26 m.
9. **Score:** 5,000 points.
10. **Revealed location:** Rua da Figueira da Foz, Coimbra, Portugal.
11. **Semantic correctness:** PASS - exact country, city, and street.
12. **Pin-transfer assessment:** PASS - submitted street marker matched the final belief.
13. **Controller/recorder/default notes:** Valid non-default submission; `SAVED` advanced to 5/9; no timeout or controller failure.

### Authoritative Medium 6/9 - Uppsala (submitted Jönköping)

1. **Untouched cues:** Swedish residential road, visible `Bergsgatan`, Scandinavian housing, boreal vegetation, and a medium-city street grid.
2. **Initial belief:** Sweden, Jönköping; moderate confidence, with other Swedish cities unresolved.
3. **Provisional pin:** A valid non-default southern/central-Sweden marker was placed.
4. **Exploration:** `Bergsgatan` and residential morphology were checked, but Uppsala was not selected.
5. **Final belief:** Jönköping, Sweden.
6. **Final pin verification:** The submitted marker visibly represented the Jönköping belief.
7. **Submission time remaining:** Approximately 01:27 across the recovered split-capture interval.
8. **Distance:** 277.7 km.
9. **Score:** 3,787 points.
10. **Revealed location:** Bergsgatan/Eriksberg area, Uppsala, Sweden.
11. **Semantic correctness:** PARTIAL - country correct, city wrong.
12. **Pin-transfer assessment:** PASS - submitted Jönköping marker matched the final textual belief.
13. **Controller/recorder/default notes:** One excluded `new_streetview_frame` segment had no prediction; the authoritative submitted segment has all save/video flags true. HUD advanced to `SAVED`, 6/9; no timeout/default or map-transfer failure.

### Authoritative Medium 7/9 - Tartu

1. **Untouched cues:** Estonian streetscape, Sepa-area industrial/residential context, flat Baltic terrain, low-rise housing, and local street geometry.
2. **Initial belief:** Estonia, Tartu, Sepa/Ropka area; high confidence.
3. **Provisional pin:** A valid non-default Tartu marker was placed.
4. **Exploration:** Rendered street labels and industrial-residential orientation refined the point in south Tartu.
5. **Final belief:** Sepa/Ropka corridor, Tartu.
6. **Final pin verification:** The marker visibly matched the intended Tartu local cluster.
7. **Submission time remaining:** Approximately 01:40.
8. **Distance:** 849 m.
9. **Score:** 4,996 points.
10. **Revealed location:** Sepa/Ropka area, Tartu, Estonia.
11. **Semantic correctness:** PASS - correct country, city, and local corridor.
12. **Pin-transfer assessment:** PASS - submitted marker matched the final Tartu belief.
13. **Controller/recorder/default notes:** Valid non-default submission; `SAVED` advanced to 7/9; no timeout or controller failure.

### Authoritative Medium 8/9 - central Slovakia (submitted Ljubljana)

1. **Untouched cues:** Mountain-valley road, Slavic place-name text read as `Jelšové`, Central-European housing, wooded slopes, and a compact settlement.
2. **Initial belief:** Slovenia, Ljubljana-area outskirts; low-to-moderate confidence, with Slovakia insufficiently weighted.
3. **Provisional pin:** A valid non-default Ljubljana/central-Slovenia marker was placed.
4. **Exploration:** The short place name and valley morphology were rechecked, but the Slovak reading was not recovered.
5. **Final belief:** Ljubljana region, Slovenia.
6. **Final pin verification:** The marker visibly matched the final Ljubljana belief.
7. **Submission time remaining:** Approximately 01:53.
8. **Distance:** 454.8 km.
9. **Score:** 3,172 points.
10. **Revealed location:** Central Slovakia, in the Banská Bystrica/Žilina-side mountain region.
11. **Semantic correctness:** FAIL - wrong country and locality.
12. **Pin-transfer assessment:** PASS - submitted Ljubljana marker matched the stated belief.
13. **Controller/recorder/default notes:** Valid non-default submission; `SAVED` advanced to 8/9; no timeout or controller failure.

### Authoritative Medium 9/9 - west Galway, Ireland

1. **Untouched cues:** Irish road/hedgerows, Atlantic weather, sparse west-coast development, low stone walls, and Galway-side terrain.
2. **Initial belief:** Ireland, County Galway west of Galway city.
3. **Provisional pin:** A valid non-default western-Ireland marker was placed.
4. **Exploration:** Coast/inland geometry and rendered Galway-area labels refined the regional hedge.
5. **Final belief:** West-Galway/Moycullen-side corridor, Ireland.
6. **Final pin verification:** The marker visibly remained in the intended west-Galway cluster.
7. **Submission time remaining:** Approximately 02:15.
8. **Distance:** 3.258 km.
9. **Score:** 4,984 points.
10. **Revealed location:** West Galway / Moycullen-side area, Ireland.
11. **Semantic correctness:** PASS - country and local regional cluster correct.
12. **Pin-transfer assessment:** PASS - submitted west-Galway marker matched the final belief.
13. **Controller/recorder/default notes:** Valid non-default submission; terminal save reached 9/9. Final Continue committed 41,907 and `Done & disarm` closed the session.

## Authoritative Hard - 8 rounds (entry 24573)

### Authoritative Hard 1/8 - Arcadia, Peloponnese, Greece (submitted Kefalonia)

1. **Untouched cues:** Dry Greek mountain road, pale rocky soil, Mediterranean scrub, provincial road geometry, and sparse settlement context.
2. **Initial belief:** Greece, Kefalonia/Argostoli-Poros mountain corridor; moderate confidence, with mainland Greece possible.
3. **Provisional pin:** A valid non-default western-Greece/Kefalonia marker was placed.
4. **Exploration:** Road surface, terrain, and regional map geometry were checked, but the Peloponnese alternative was not selected.
5. **Final belief:** Kefalonia, Greece.
6. **Final pin verification:** The marker visibly matched the stated Kefalonia belief.
7. **Submission time remaining:** Approximately 02:22.
8. **Distance:** 194.1 km.
9. **Score:** 4,117 points.
10. **Revealed location:** Arcadia, northeast of Tripoli, Peloponnese, Greece.
11. **Semantic correctness:** PARTIAL - country correct, region/island wrong.
12. **Pin-transfer assessment:** PASS - submitted Kefalonia marker matched the final belief.
13. **Controller/recorder/default notes:** Valid non-default submission; `SAVED` advanced to 1/8; no timeout or controller failure.

### Authoritative Hard 2/8 - rural central Romania (submitted Kosovo)

1. **Untouched cues:** Narrow farm road, broad agricultural basin, distant wooded mountains, Eastern-European utility context, and sparse roadside development.
2. **Initial belief:** Central Kosovo; low-to-moderate confidence, with Romania/Balkans alternatives.
3. **Provisional pin:** A valid non-default central-Kosovo marker was placed.
4. **Exploration:** Terrain and road character were rechecked, but no decisive text emerged and Romania was not selected.
5. **Final belief:** Central Kosovo.
6. **Final pin verification:** The marker visibly matched the Kosovo belief.
7. **Submission time remaining:** Approximately 02:40.
8. **Distance:** 462.5 km.
9. **Score:** 3,148 points.
10. **Revealed location:** Central Romania, Sibiu/Alba-side rural corridor.
11. **Semantic correctness:** FAIL - wrong country and region.
12. **Pin-transfer assessment:** PASS - submitted Kosovo marker matched the final belief.
13. **Controller/recorder/default notes:** Valid non-default submission; `SAVED` advanced to 2/8; no timeout or controller failure.

### Authoritative Hard 3/8 - Rhodope Mountains, Bulgaria

1. **Untouched cues:** Steep Balkan mountain village, tiled roofs, dense wooded slopes, Bulgarian-looking road/building context, and a narrow valley.
2. **Initial belief:** Bulgaria, western/central Rhodopes, Batak-Devin side; moderate-to-high confidence.
3. **Provisional pin:** A valid non-default Rhodope marker was placed.
4. **Exploration:** Village morphology and mountain geometry were compared across the western Rhodopes.
5. **Final belief:** Bulgarian Rhodopes, west of Smolyan.
6. **Final pin verification:** The marker visibly remained in the stated Rhodope region.
7. **Submission time remaining:** Approximately 02:08.
8. **Distance:** 73.1 km.
9. **Score:** 4,647 points.
10. **Revealed location:** Varbina/Smolyan-side Rhodope Mountains, Bulgaria.
11. **Semantic correctness:** PASS - country and mountain region correct.
12. **Pin-transfer assessment:** PASS - submitted Rhodope marker matched the final belief.
13. **Controller/recorder/default notes:** Valid non-default submission; `SAVED` advanced to 3/8; no timeout or controller failure.

### Authoritative Hard 4/8 - Route 451, Csongrád area, Hungary

1. **Untouched cues:** Visible road overlay `451`, very flat Pannonian fields, Hungarian road design, drainage/field geometry, and sparse roadside development.
2. **Initial belief:** Hungary, Route 451 in the Csongrád/Szentes corridor; high confidence.
3. **Provisional pin:** A valid non-default southeast-Hungary marker was placed.
4. **Exploration:** Route number and rendered Csongrád-area labels were compared along the road.
5. **Final belief:** Route 451 west of Csongrád, near Ópusztaszer/Gátér corridor.
6. **Final pin verification:** The marker visibly sat on the intended Route 451 corridor.
7. **Submission time remaining:** Approximately 02:44; road and regional transfer were already verified.
8. **Distance:** 25.6 km.
9. **Score:** 4,874 points.
10. **Revealed location:** Route 451 west of Csongrád, Hungary.
11. **Semantic correctness:** PASS - exact country, road, and correct corridor.
12. **Pin-transfer assessment:** PASS - submitted road-corridor marker matched the final belief.
13. **Controller/recorder/default notes:** Valid non-default submission; `SAVED` advanced to 4/8; no timeout or controller failure.

### Authoritative Hard 5/8 - rural Latvia (submitted southeast Poland)

1. **Untouched cues:** Overgrown dirt track, wet lowland vegetation, flat fields/woodland edge, sparse development, and muted northern-European light.
2. **Initial belief:** Southeast Poland; low confidence, with Baltic lowlands considered but not selected.
3. **Provisional pin:** A valid non-default southeast-Poland marker was placed.
4. **Exploration:** Track, wetland vegetation, and broad regional appearance were rechecked without decisive text.
5. **Final belief:** Southeast Poland.
6. **Final pin verification:** The marker visibly matched the stated southeast-Poland belief.
7. **Submission time remaining:** Approximately 02:16 across the recovered split-capture interval.
8. **Distance:** 716.8 km.
9. **Score:** 2,441 points.
10. **Revealed location:** Rural Latvia, near the Riga-side interior.
11. **Semantic correctness:** FAIL - wrong country and region.
12. **Pin-transfer assessment:** PASS - submitted Poland marker matched the final textual belief.
13. **Controller/recorder/default notes:** One excluded `new_streetview_frame` segment had no prediction. The initial result HUD briefly showed stale `Location saved without a prediction coordinate`/4-of-8 state; after the mandated five-second recheck it corrected to normal `SAVED`, 5/8, while the authoritative submitted segment had all flags true. No timeout/default or map-transfer failure.

### Authoritative Hard 6/8 - Road 3426, Lithuania (stored pin near Klaipėda)

1. **Untouched cues:** Visible road overlay `3426`, Lithuanian gravel-road style, flat agricultural landscape, Baltic utility context, and sparse farm settlement.
2. **Initial belief:** Lithuania, central-Lithuania/Radviliškis-side road 3426; high country and road confidence.
3. **Provisional pin:** A valid non-default Lithuania marker was placed, initially on the Klaipėda side.
4. **Exploration:** Road number and central-Lithuania geography supported moving the belief toward Radviliškis/Baisogala.
5. **Final belief:** Road 3426 in central Lithuania near Radviliškis/Baisogala.
6. **Final pin verification:** FAIL - an attempted central-Lithuania click did not replace the stored Klaipėda-area coordinate; the final rendered compact-map state was misread.
7. **Submission time remaining:** Approximately 02:27.
8. **Distance:** 171.1 km.
9. **Score:** 4,213 points.
10. **Revealed location:** Road 3426 near Baisogala/Radviliškis, Lithuania.
11. **Semantic correctness:** PASS - country, road number, and central district belief correct.
12. **Pin-transfer assessment:** FAIL - the submitted Klaipėda coordinate contradicted the final central-Lithuania belief.
13. **Controller/recorder/default notes:** One controller/map-transfer failure; marker was still valid and non-default, Guess submitted normally, `SAVED` advanced to 6/8, and there was no timeout.

### Authoritative Hard 7/8 - west Jutland, Denmark (submitted eastern Sweden)

1. **Untouched cues:** Extremely flat open farmland, narrow unmarked paved road, cloudy northern light, sparse development, and a rendered road/name fragment read as Swedish-looking `Skalva`.
2. **Initial belief:** Sweden, eastern agricultural plain around Norrköping/Linköping; moderate confidence.
3. **Provisional pin:** A valid non-default Sweden marker was placed and visibly moved southwest of Stockholm.
4. **Exploration:** The road-name reading and broad agricultural morphology were checked, but Denmark was not selected.
5. **Final belief:** Eastern Sweden, Norrköping/Östergötland side.
6. **Final pin verification:** The visible marker agreed with the final eastern-Sweden belief.
7. **Submission time remaining:** Approximately 01:24.
8. **Distance:** 599.6 km.
9. **Score:** 2,744 points.
10. **Revealed location:** West/northwest Jutland coastal plain, Denmark.
11. **Semantic correctness:** FAIL - wrong country and region.
12. **Pin-transfer assessment:** PASS - submitted eastern-Sweden marker matched the stated belief.
13. **Controller/recorder/default notes:** Valid non-default submission; `SAVED` advanced to 7/8; no timeout or controller failure.

### Authoritative Hard 8/8 - Suomussalmi/Paani area, Finland

1. **Untouched cues:** Boreal pine/birch forest, Finnish-style white center/edge markings, a quiet paved highway, rolling interior terrain, and a visible black capture-car hood.
2. **Initial belief:** Finland, central/eastern interior; high country confidence.
3. **Provisional pin:** The first world-scale click landed in the Baltic states and was visibly corrected into Finland before submission.
4. **Exploration:** Repeated verified forward steps showed the same high-quality boreal highway; regional refinement shifted the pin from far-north Finland to Kainuu.
5. **Final belief:** Kainuu/east-central Finland, Kajaani-Suomussalmi side.
6. **Final pin verification:** The marker visibly sat in east-central Finland near the intended Kainuu hedge.
7. **Submission time remaining:** Approximately 02:11.
8. **Distance:** 88.5 km.
9. **Score:** 4,576 points.
10. **Revealed location:** Paani/Suomussalmi-side corridor, Finland.
11. **Semantic correctness:** PASS - country and broad Kainuu/northeast-interior region correct.
12. **Pin-transfer assessment:** PASS - submitted Kainuu marker matched the final belief.
13. **Controller/recorder/default notes:** Valid non-default submission; terminal HUD reached `Competition recorded`, 8/8. Final Continue visibly committed Ivan Yachnik's 30,760-point leaderboard row, then `Done & disarm` removed the recorder HUD.

## Final authoritative totals and audits

- Authoritative record count: exactly **25** - Easy 8 + Medium 9 + Hard 8. The invalid 24571 and 24587 attempts and the two recovered no-prediction segments contribute zero authoritative rounds, points, or distance.
- Easy: **38,482 / 40,000 (96.205%)**. Round-score sum reconciles exactly. Displayed-distance aggregate: **358.310 km total, 44.789 km mean, 0.288 km median**.
- Medium: **41,907 / 45,000 (93.1267%)**. Round-score sum reconciles exactly. Displayed-distance aggregate: **742.794 km total, 82.533 km mean, 1.571 km median**.
- Hard: **30,760 / 40,000 (76.900%)**. Round-score sum reconciles exactly. Displayed-distance aggregate: **2,331.300 km total, 291.413 km mean, 182.600 km median**.
- **Overall official total: 111,149 / 125,000 (88.9192%).** The committed leaderboard totals reconcile exactly: `38,482 + 41,907 + 30,760 = 111,149`.
- Overall displayed-distance aggregate: **3,432.404 km total, 137.296 km mean, 3.258 km median** across 25 rounds. Metre displays were converted to kilometres; already rounded kilometre displays were retained.
- Semantic assessment: **17 PASS, 3 PARTIAL, 5 FAIL**. Country belief was correct in **19/25** rounds. At the preceding report's broader country-or-correct-immediate-regional-cluster threshold, this run is **20/25**.
- Pin transfer: **24 PASS, 1 FAIL** (Hard 6). All 25 submissions used valid non-default coordinates. Default submissions: **0**. Intentional or accidental timeouts: **0**. Authoritative controller/map-transfer failures: **1** (Hard 6).
- Recorder recoveries: Medium 6 and Hard 5 each produced one `new_streetview_frame` segment with `predictionCaptured: false`; each was followed by one valid authoritative `prediction_submitted` entry with prediction/save/video success. Those two recovery segments are documented but excluded from the 25 records.
- Recorder artifact audit: authoritative manifests are `complete` with 8/8, 9/9, and 8/8 completed counts, recorder 0.7.26, stopped video sessions, and exactly 25 authoritative prediction JSON files. There are 25 unique stored WebM paths. Capture IDs match 23 official entries; Medium 6 and Hard 5 reused their recovery paths, and the stored WebM/sidecar at each path belongs to the recovery capture. Those two official submissions therefore lack matching continuous-video evidence, although their predictions, saved counters, and leaderboard scores remain intact.
- Recorder/UI caveats: brief result-HUD render lag occurred on Easy 5/Easy 8/Medium 3 and the recovered Hard 5 path; each corrected after the required five-second wait/fresh visual recheck. No scored round continued from an unresolved post-wait recorder state.
- Regression comparison: versus recorded R3, official score fell from 114,794 to 111,149 (-3,645) and displayed distance rose by 679.025 km, while pin transfer improved from 19/25 to 24/25 and controller/map-transfer failures fell from 3 to 1. Against the protocol's explicit Easy baseline (36,340 points, 787.5 km), Easy improved by 2,142 points and 429.190 km, retained non-default pins, and had 8/8 belief-to-pin consistency; therefore the stated Easy pin-refinement regression gate is **PASS**.

## Excluded invalid attempt 24571 summary

- Easy 24571 exposed five panoramas but saved only rounds 1–4. Round 5 remained untouched and was never guessed or timed out.
- Exact rendered failure: `VIDEO ERROR · Round 5/8` — `Target OpenGuessr tab is not active in its window. Telemetry continues and the next round will still attempt video recording.`
- Root cause confirmed by the coordinator: an accidental GoodShort advertisement tab became selected, so the visible-tab video stream correctly aborted.
- Recorder stop gate: visible `Stopping...`, followed by complete HUD disappearance; no leaderboard/disarm completion was claimed.
- Excluded partial values: 19,991 points over four saved rounds; 1.911 km displayed aggregate distance. These values are diagnostic only and must not be compared as an official part total.
- Recorder: OpenGuessr Research Round Recorder 0.7.26; session ID `session-2026-08-30T20-51-41-928Z-c9e07ac1-9b99-4798-aa73-6ca9695ff4ef`; stream ID `stream-2026-08-30T20-50-44-983Z-098b630e-cf2f-4316-a730-c78dfdddb897`; terminal manifest status `closed`, `completedRoundCount: 4`, `expectedRoundCount: 8`, video status `error`.
- Exact session manifest: `C:\Users\vanya\Documents\Computer_Vision_FInal_Project\demo_and_extension\data\recordings\sessions\europe-easy\session-2026-08-30t20-51-41-928z-c9e07ac1-9b99-4798-aa73-6ca9695ff4ef.json`.

## Excluded invalid 4/8 partial-session appendix — Easy (`europe-easy`)

Recorder gate: visible blue `ARMED` before Confirm; red `REC · Round 1` immediately after the panorama appeared. Recorder condition rendered as `interactive`; active-tab automatic frame stream was armed after coordinator confirmation.

The four records below are retained solely to audit why this partial session was excluded. They are not authoritative benchmark rounds.

### Easy round 1

1. **Untouched cues:** `Place de la Bastille` painted on the roadway; July Column centered ahead; Parisian boulevard/Haussmann streetscape; French road markings and transit furniture; Bastille-area urban geometry.
2. **Initial belief:** France, Paris, Place de la Bastille (about 48.853 N, 2.369 E); confidence 0.99; no serious alternative.
3. **Provisional pin:** A non-default France pin was placed at 04:11 remaining, initially near Sancerre because the world-map click was misread; it was corrected to the rendered Paris label and visibly verified against Paris/Versailles and the regional road network.
4. **Exploration:** The untouched panorama already gave decisive road text and landmark geometry. Map-only refinement progressed Channel/France -> Paris region -> city -> central streets -> Bastille.
5. **Final belief:** France, Paris 11th/4th arrondissement boundary, Place de la Bastille / July Column; confidence 0.999.
6. **Final pin verification:** At landmark scale, the marker tip was corrected onto the rendered `Place de la Bastille` icon/label and checked against `Opera Bastille`, Boulevard Richard-Lenoir, and the plaza-road geometry.
7. **Submission time remaining:** First Guess click at 00:44 was swallowed; deliberate retry submitted at about 00:38.
8. **Distance:** 155 m.
9. **Score:** 4,999 points (rendered as `+ 4999 XP`).
10. **Revealed location:** Place de la Bastille, Paris, France (result map target flag at the Bastille plaza).
11. **Semantic correctness:** Pass — exact city and named landmark correct.
12. **Pin-transfer assessment:** Pass after correction — submitted marker matched the exact final belief; the early Sancerre provisional was caught and repaired before submission.
13. **Controller/recorder/default notes:** Two swallowed actions (initial Confirm and first Guess), both verified before one retry; no timeout; valid non-default submission; green `SAVED · Round 1`, `1/8 rounds saved`.

### Easy round 2

1. **Untouched cues:** `U Alexanderplatz` station sign; Berlin Fernsehturm dominating the skyline; German text on vehicles; dense bicycle parking; recognizable Alexanderplatz modernist blocks.
2. **Initial belief:** Germany, Berlin, Alexanderplatz by the U-Bahn entrance and Fernsehturm (about 52.522 N, 13.413 E); confidence 0.995.
3. **Provisional pin:** A non-default Germany marker was placed by 04:08, but at the wrong map point near Leipzig/Czechia after a clipped world-map click; it was later moved to Berlin after the map stopped drifting and verified against Potsdam, Leipzig, Dresden, and the Berlin label.
4. **Exploration:** Decisive untouched station text and tower geometry made panorama movement unnecessary. Map refinement proceeded Germany -> Berlin region -> central Berlin -> Museum Island/inner city -> Alexanderplatz.
5. **Final belief:** Germany, Berlin, Alexanderplatz station/plaza, immediately southeast of the Fernsehturm; confidence 0.999.
6. **Final pin verification:** Marker tip was visibly aligned with the rendered purple `Alexanderplatz` icon/label, cross-checked against `Fernsehturm`, Karl-Marx-Allee, and the Spree/inner-city geometry.
7. **Submission time remaining:** First Guess click at 00:42 was swallowed; retry submitted at about 00:37.
8. **Distance:** 276 m.
9. **Score:** 4,999 points (rendered as `+ 4999 XP`).
10. **Revealed location:** Alexanderplatz / Otto-Braun-Strasse side, Berlin, Germany (result target flag east-southeast of the plaza center).
11. **Semantic correctness:** Pass — exact city and named square/station correct.
12. **Pin-transfer assessment:** Pass — submitted marker was on the stated Alexanderplatz landmark; residual error was within-plaza precision.
13. **Controller/recorder/default notes:** One swallowed Continue from round 1 and one swallowed Guess; an early drag-inertia/map-drift issue caused Copenhagen/Leipzig misplacements, all caught and corrected from fresh rendered screenshots; no timeout/default; green `SAVED · Round 2`, `2/8 rounds saved`.

### Easy round 3

1. **Untouched cues:** Salzach river below; Hohensalzburg Fortress on the opposite hill; Salzburg baroque old town and domes; Alpine backdrop; elevated stone fortification/viewpoint in the foreground.
2. **Initial belief:** Austria, Salzburg, a high old-town viewpoint on one of the central hills; alternatives were Monchsberg west of the river versus Kapuzinerberg east of it; city confidence 0.995, hill confidence 0.60.
3. **Provisional pin:** A valid non-default western-Austria pin was placed at 03:54, initially too far west near Vorarlberg; it was corrected to the rendered Salzburg label and verified against Innsbruck, Bad Reichenhall, Berchtesgaden, and the Austria/Germany border.
4. **Exploration:** No panorama movement was required for the city. Map refinement used the fortress/river geometry and inspected Salzburg old town, Haus der Natur, Schloss Mirabell, Hotel Schloss Monchstein, and Johannes Schlossl; the hill-side interpretation remained ambiguous.
5. **Final belief:** Austria, Salzburg, Monchsberg viewpoint path between Johannes Schlossl and Hotel Schloss Monchstein; confidence 0.70 for the hill, 0.995 for Salzburg.
6. **Final pin verification:** Marker tip was visibly placed on the rendered winding Monchsberg path and cross-checked against `Johannes Schlossl`, `Hotel Schloss Monchstein`, and `Haus der Natur`.
7. **Submission time remaining:** First Guess click at 00:40 was swallowed; retry submitted at about 00:32.
8. **Distance:** 1,460 m.
9. **Score:** 4,993 points (rendered as `+ 4993 XP`).
10. **Revealed location:** Kapuzinerberg east-side viewpoint by rendered `Blick zur Festung Hohensalzburg` / `Obere Stadtaussicht`, Salzburg, Austria.
11. **Semantic correctness:** Partial — country and city correct; named hill/viewpoint wrong (Monchsberg instead of Kapuzinerberg).
12. **Pin-transfer assessment:** Pass — submitted marker matched the written final Monchsberg belief; the residual error was semantic hill-side selection, not controller transfer.
13. **Controller/recorder/default notes:** One swallowed Continue and one swallowed Guess; no timeout/default; valid non-default pin; recorder briefly showed amber `SAVING · Round 3/8`, then green `SAVED · Round 3`, `3/8 rounds saved` before Continue.

### Easy round 4

1. **Untouched cues:** Cesky Krumlov's tight Vltava bend; red-roofed UNESCO old town; St Vitus church; the castle complex at the viewpoint; a saint statue on the elevated castle bridge/terrace.
2. **Initial belief:** Czechia, Cesky Krumlov, Cesky Krumlov Castle / Plastovy most (Cloak Bridge), about 48.8127 N, 14.3147 E; confidence 0.99.
3. **Provisional pin:** A valid non-default Czechia-area marker was placed at 03:59, initially in the southeast near the Czech/Slovak border; it was corrected to the rendered Cesky Krumlov label after westward panning and verified against Ceske Budejovice, Linz, and the Czech/Austrian border.
4. **Exploration:** The untouched river loop, castle, church, and old-town geometry were decisive. Map refinement progressed to Latran, the castle complex, Zamecka zahrada, and finally `Plastovy most`.
5. **Final belief:** Czechia, Cesky Krumlov, saint-statue viewpoint on Plastovy most within Cesky Krumlov Castle; confidence 0.995.
6. **Final pin verification:** Marker tip was visibly aligned with the rendered `Plastovy most` icon/label and checked against the State Castle and Chateau and Zamecke divadlo.
7. **Submission time remaining:** First Guess click at 00:42 was swallowed; retry submitted at about 00:37.
8. **Distance:** 20 m.
9. **Score:** 5,000 points (rendered as `+ 5000 XP`).
10. **Revealed location:** Plastovy most (Cloak Bridge), Cesky Krumlov Castle, Czechia.
11. **Semantic correctness:** Pass — exact city and named castle bridge/viewpoint correct.
12. **Pin-transfer assessment:** Pass — final marker matched the stated bridge belief at landmark scale; 20 m residual.
13. **Controller/recorder/default notes:** One swallowed Continue and one swallowed Guess; no timeout/default; valid non-default submission; amber `SAVING · Round 4/8` persisted for about six seconds, then green `SAVED · Round 4`, `4/8 rounds saved` before Continue.

### Invalid round 5 exposure — deliberately not a round record

- The untouched panorama appeared at 04:54 with an initial red `REC · Round 5/8` HUD.
- At 04:46, before any exploration, movement, map opening, pin placement, or Guess, the HUD changed to the exact `VIDEO ERROR` message recorded above.
- The controller froze immediately. The round was neither submitted nor intentionally timed out.
- After coordinator confirmation that mid-round video recovery was impossible, the visible `Stop recording` control was used at about 03:34. `Stopping...` rendered, then the HUD disappeared at about 03:24.
- The manifest contains five exposed round entries but only four completed/saved rounds; this fifth entry is excluded and has no score, distance, semantic assessment, or pin-transfer assessment.
- Medium 24572 and Hard 24573 were not opened.

## Excluded invalid 5/8 partial-session appendix - Easy entry 24587

- Publication status: **INVALID / EXCLUDED PARTIAL SESSION.** This replacement attempt exposed six Easy scenes, but only rounds 1-5 produced authoritative-style submitted coordinates. The entire attempt contributes zero rounds, points, and distance to the R4 totals.
- Rounds 1-5 each ended with `stopReason: prediction_submitted`, `predictionCaptured: true`, `saveSuccess: true`, and `videoSaveSuccess: true`; they are retained only as diagnostic artifacts because the competition did not finish.
- Round 6 ended with the exact manifest state `stopReason: prediction_submitted_coordinates_unresolved`, `predictionCaptured: false`, `saveSuccess: true`, and `videoSaveSuccess: true`. Because no submitted coordinate was captured, it cannot be a valid recorded benchmark round.
- Terminal manifest state: `status: closed`, `completedRoundCount: 5`, `expectedRoundCount: 8`, six recorded entries, recorder 0.7.26, stopped video stream. The attempt never reached 8/8, final Continue, a committed leaderboard total, or the expected terminal disarm gate.
- Session ID: `session-2026-08-30T21-24-40-753Z-5798afe0-953f-4397-9625-1f9eb1321387`.
- Exact manifest: `demo_and_extension/data/recordings/sessions/europe-easy/session-2026-08-30t21-24-40-753z-5798afe0-953f-4397-9625-1f9eb1321387.json`.
- The later fresh Easy 24588 session supplies all eight authoritative Easy records and the committed 38,482-point total. No 24587 score, distance, or round record is included in any authoritative calculation above.
