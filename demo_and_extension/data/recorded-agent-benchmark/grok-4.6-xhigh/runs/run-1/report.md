# NAUTILUS Recorded Grok 4.6 xhigh Run

## Run identity and outcome

- Player: **Ivan Yachnik** (Player B, authenticated Edge benchmark profile)
- Grok CLI/model: Grok CLI 1.0.3, `grok-4.6`, xhigh reasoning
- Recorder model label: `grok-4.6-xhigh-recorded`
- Recorder: v0.7.25, **Interactive panorama**, automatic visible-tab frame-stream video
- Competition order: Easy (`europe-easy`, replacement ID 24323) -> Medium (`europe-medium`, ID 24304) -> Hard (`europe-hard`, ID 24305)
- Completed and saved: **25/25 rounds** (8 Easy, 9 Medium, 8 Hard)
- Official leaderboard totals:
  - Easy: **23,729 Pts**
  - Medium: **29,986 Pts**
  - Hard: **26,366 Pts**
  - **Combined official score: 80,081 Pts**

All three rendered leaderboards showed **Ivan Yachnik #1** with the numeric totals above. Each final leaderboard was held through at least two screenshot/recorder heartbeat cycles, no phantom next round appeared, and `Done & disarm` was used before leaving the competition.

The final result is **27,757 points below GPT-5.6-sol max** (107,838, a 25.7% gap) and **30,192 below GPT-5.6-sol xhigh** (110,273, a 27.4% gap). Grok averaged **3,203.24 points per round**.

## Execution and controller integrity

Grok played from rendered screenshots and used only the six permitted physical browser tools: screenshots, mouse movement/clicks, wheel input, and keypresses. It did not use DOM/accessibility snapshots, page scripts, hidden coordinates, network data, location manifests, prior answers, or geographic web searches.

A disposable unscored controller preflight passed before scoring: Grok placed a marker, zoomed from the world to named Libreville, moved the marker, collapsed and reopened the map while preserving it, changed the Street View scene with an ordinary arrow, and abandoned without Guess. The scored runs then used the same calibrated 1527 x 780 viewport.

Grok's geographic reasoning was often much better than its pin placement. The recurring control failure was a coarse world-map click landing hundreds of kilometres south/east of the intended country, sometimes offshore, even when Grok had correctly named the city. No default/Africa starting marker or timer-zero default was submitted. One coordinator intervention occurred in Hard round 1: after Grok had chosen its final Algeria marker and continued optional map work near the timing threshold, the existing visible Guess button was clicked without changing Grok's geography or marker. All other scored geographic actions and submissions were Grok's.

## Easy - `europe-easy` - official total 23,729

1. **Paris / Place de la Bastille.** Grok read the Bastille text, July Column, street plate, and Paris architecture correctly. Its first map click landed in Spain and the correction still resolved near Valladolid. Result: **979.9 km**. Scene belief exact; belief-to-pin failed.
2. **Berlin / Alexanderplatz.** Fernsehturm, U Alexanderplatz, German text, and Galeria made the city certain. Map zooming jumped to North Africa and Central-European tiles went blank; the final pin resolved in northwest Poland. Result: **206.8 km**. Scene belief exact; neighbouring-country pin.
3. **Salzburg.** Fortress, old town, river, and Alps were correctly identified. Street View arrows were swallowed and a panorama drag was needed to trigger REC. The attempted Austria correction resolved offshore in the Adriatic. Result: **705.6 km**.
4. **Cesky Krumlov.** Grok correctly recognized the castle, Vltava bend, red roofs, and Gothic spire. The apparently Central-European world-map click resolved in Montenegro. Result: **781.8 km**.
5. **Pula Arena.** Amphitheatre and Slavic road text correctly identified Pula, Croatia. The intended Adriatic/Croatia pin landed in Tuscany. Result: **318.5 km**.
6. **Zittau Germany-Poland border.** B178, Zittau, and `Granica Panstwa` cues were read correctly. The Germany-region pin resolved near Passau. Result: **285.3 km**.
7. **Visnja Gora, Slovenia.** Ljubljana/Novo mesto signs and the station name made the belief certain. The intended Slovenia pin landed in eastern Croatia. Result: **260.7 km**.
8. **Flam, Norway.** The FLAM gate, fjord walls, water, and Nordic timber made the location certain. The apparent Scandinavia pin resolved near Berlin. Result: **1,029.5 km**.

Recorder/commit audit: the private replacement Easy link was entered once with the recorder visibly ARMED for `europe-easy`. It reached **Competition recorded - 8/8**, committed **Ivan Yachnik #1 - 23,729 Pts**, held without a phantom round 9, and disarmed cleanly.

## Medium - `europe-medium` - official total 29,986

1. **Valencia, Spain.** Grok interpreted the `Carrer de...` street and Eixample-style blocks as Barcelona. The coarse Spain pin resolved west of Iberia. Result: **895.2 km**; country correct, city and pin wrong.
2. **Bologna, Italy.** `Via Francesco...`, ochre buildings, and street furniture produced a correct Italy belief with Bologna among the alternatives. The pin resolved offshore near Algeria/Tunisia. Result: **1,152.6 km**.
3. **Utrecht, Netherlands.** `Amsterdamsestraatweg`, Dutch brick, bicycles, and bollards produced the exact city belief. The final pin resolved near Aurich/Emden in Germany. Result: **213.2 km**.
4. **Ghent/Flanders, Belgium.** N444 and Flemish shop/plant text gave the correct country and Ghent-region belief. After recovering from an initial Gulf-of-Guinea map view, Grok put a marker on Belgium. Result: **176 km**.
5. **Coimbra, Portugal.** Portuguese street text, tiles, and clinic text gave the correct country and Coimbra as an alternative, but the final belief/pin shifted toward Lisbon and resolved near Seville. Result: **405.5 km**.
6. **Uppsala, Sweden.** `Bergagatan` and wooden houses correctly identified Sweden. The intended Stockholm marker resolved in the Baltic. Result: **229 km**.
7. **Tartu, Estonia.** `Sepakula` and Baltic residential cues correctly identified Estonia; the final pin was near the eastern border. Result: **55.6 km**, Grok's best Medium round.
8. **Central Slovakia.** `Jelsova` and the mountain setting correctly identified Slovakia. The correction appeared on Slovakia but resolved near Oradea, Romania. Result: **317.3 km**.
9. **Galway, Ireland.** Yellow edge lines, stone walls, and `L1322 Bally...` correctly identified Ireland. The Ireland correction remained around southern Britain/the Channel. Result: **711.5 km**.

Recorder/commit audit: all **9/9** rounds saved in order. The result panel was held until the recorder showed the current saved count before every Continue. The final leaderboard showed **Ivan Yachnik #1 - 29,986 Pts**, remained stable with no phantom round 10, and disarmed cleanly.

## Hard - `europe-hard` - official total 26,366

1. **Greece.** Greek road text and Mediterranean vegetation produced the correct country belief, but several map clicks remained in Algeria. Result: **2,606 km**. The coordinator's sole timing-only intervention submitted Grok's unchanged final marker.
2. **Romania / Transylvania.** Carpathian farm and village cues produced a correct Romania belief and on-country marker. Result: **61.8 km**, Grok's best Hard round.
3. **Southern Bulgaria.** Grok read a wooded Balkan mountain village as Bosnia and pinned the Bosnia-Serbia area. Result: **507.1 km**; regional morphology broadly right, country wrong.
4. **Csongrad, Hungary.** Flat sunflower/wheat/maize plains produced the correct Hungary belief and pin. Result: **96.9 km**.
5. **Latvia.** A straight dirt track and Baltic scrub led Grok to Lithuania. The correction resolved near northeast Poland while the reveal was Latvia. Result: **500.7 km**.
6. **Lithuania.** Road number 3426 and Soviet-style farms led Grok to Latvia, but its correction landed in northern Lithuania, matching the revealed country. Result: **168.5 km**.
7. **Northwest Jutland, Denmark.** `Skalvej`, turbines, and flat fields produced a correct Denmark belief. The corrected marker remained in northern Germany. Result: **450.8 km**.
8. **North-central Finland.** Boreal pine/birch road cues produced a correct Finland belief and an on-Finland marker, but too far south/east. Result: **412.2 km**.

Recorder/commit audit: all **8/8** rounds saved in order. The final leaderboard visibly showed **Ivan Yachnik #1 - 26,366 Pts**. It held for two screenshot cycles with no phantom round 9. `Done & disarm` removed the recorder HUD, and Edge was returned to the ordinary authenticated OpenGuessr Maps page.

## Timing and behavior summary

- Successful recorder-session durations: Easy **21:51**, Medium **26:22**, Hard **28:53**; total active recording time **77:06**.
- Grok frequently spent 1-3 minutes trying to zoom, pan, or correct a world-map marker. ARMED-to-REC transitions commonly required one normal Street View step.
- Several Street View arrow, wheel, and map clicks were swallowed or produced a different action than Grok expected.
- Scene recognition was substantially stronger than physical map control. Medium country belief was correct in all nine rounds, while several final pins still landed offshore or in neighbouring countries.
- No scored competition was reloaded or replayed, and no timer-zero/default guess occurred.

## Canonical artifact audit

The three canonical completed sessions are:

- Easy: `session-2026-08-13T22-22-09-902Z-c171d203-7190-4820-a112-e14062f17f64` - 8/8 complete.
- Medium: `session-2026-08-13T22-50-38-266Z-4043c44b-fbec-487d-9d73-7d835e4c3111` - 9/9 complete.
- Hard: `session-2026-08-13T23-20-42-607Z-c13649de-3ea4-4d0e-b957-900db857bdbf` - 8/8 complete.

Every canonical round has a prediction coordinate, a successful round JSON save, a successful video save, and a matching video sidecar. All manifests report recorder v0.7.25, `visible-tab-frame-stream`, source sampling at 2 fps, and held-frame output at 15 fps. The 25 WebMs total **503,991,513 bytes (480.64 MiB)**.

Packet-derived video audit:

- Easy: 8 VP9 files, **14.935-14.954 fps**, about **1.182-1.328 Mbps**.
- Medium: 9 VP9 files, **14.933-14.957 fps**, about **1.166-1.491 Mbps**.
- Hard: 8 VP9 files, **14.931-14.951 fps**, about **1.249-1.421 Mbps**.

Post-run repository totals are exactly **155 round JSONs, 28 session manifests, 128 WebMs, 128 video JSON sidecars, and 0 partial files**. Relative to the pre-Grok baseline, the final run added exactly **25 rounds, 3 sessions, 25 WebMs, and 25 sidecars**. All 25 canonical file paths are unique and present.

`npm.cmd run verify` completed successfully after the run: extension validation passed and **110/110 tests** passed. Its warnings refer to preserved earlier disposable/failed Grok artifacts sharing the model label; they are not part of the three canonical sessions above. The earlier failed attempts remain preserved for audit, including the wrong Daily flow and the pre-v0.7.25 Easy partial. They are explicitly excluded from the official score and canonical 25-round dataset.

## Integrity conclusion

The requested Grok benchmark is complete: **25/25 scored rounds**, three committed leaderboards, three clean recorder sessions, and 25 independently probed video artifacts. The official combined score is **80,081 Pts**. Grok's main weakness was physical marker control rather than scene recognition; the report preserves those failures instead of silently correcting them.
