# NAUTILUS GPT-5.6 Sol xhigh recorded R3 run

Date: 2026-08-31  
Player: Ivan Yachnik  
Recorder model label: `gpt-5-6-sol-xhigh-recorded-r3`  
Condition: `interactive-panorama`  
Recorder: OpenGuessr Research Round Recorder `0.7.26`  
Protocol: `NAUTILUS_BLIND_PLAY_PROTOCOL_V3_PIN_REFINEMENT.md` plus `NAUTILUS_RECORDED_SOL_ADDENDUM.md`

## Result

The run completed all 25 official rounds in order. All three competitions reached a rendered leaderboard containing Ivan Yachnik and a numeric total, then reached the expected recorder terminal state and were explicitly disarmed.

| Level | Competition | Dataset | Rounds | Official score | Maximum | Percent | Distance total | Mean | Median |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| Easy | REC XH R3 Easy (`24577`) | `europe-easy` | 8/8 | 39,982 | 40,000 | 99.955% | 3.730 km | 0.466 km | 0.401 km |
| Medium | REC XH R3 Medium (`24578`) | `europe-medium` | 9/9 | 41,514 | 45,000 | 92.253% | 849.913 km | 94.435 km | 1.273 km |
| Hard | REC XH R3 Hard (`24579`) | `europe-hard` | 8/8 | 33,220 | 40,000 | 83.050% | 1,813.542 km | 226.693 km | 112.958 km |
| **Overall** | — | — | **25/25** | **114,716** | **125,000** | **91.773%** | **2,667.181 km** | **106.687 km** | **1.273 km** |

Distances are Haversine distances recomputed from the current run's recorded spawn and submitted-pin coordinates. They agree with the rendered result distances at the precision shown by OpenGuessr. Where a result overlay obscured the numeric distance, the coordinate-derived value is reported and identified below. Official points come from the rendered round results and reconcile exactly to each committed leaderboard.

## Accuracy and control summary

- Strict country reasoning: Easy 8/8, Medium 8/9, Hard 5/8; overall **21/25 (84%)**.
- Strict city/locality reasoning: Easy 8/8, Medium 5/9, Hard 0/8; overall **13/25 (52%)**. Nearby regional guesses are not counted as exact localities.
- Belief-to-pin transfer: **25/25 PASS**. Every authoritative prediction was a non-null `leaflet-map-click`; every result location agreed with the final rendered marker and stated final belief.
- Valid non-default submissions: **25/25**. Default or time-out guesses: **0**.
- Controller failures affecting a submission: **0**. One world-map coordinate mistake in Hard R8 temporarily placed the provisional marker in Greenland; it was visibly corrected first to Finland and then to the intended central-Finland area before submission.
- Recorder failures affecting an authoritative round: **0**. No `VIDEO ERROR`; every authoritative video reports stopped/saved and has its sidecar.
- Strict timing caveat: artifact-derived time remaining was 83–231 seconds. The normal 25–45 second target was not reached. These were early-submission exceptions after the available visual/map refinement had been exhausted, but **23/25 submissions had more than 90 seconds remaining**, so strict timing-target conformance is not claimed. No timer expired.

## Authoritative round records — exactly 25

Artifact shorthand below uses `R = demo_and_extension/data/recordings/inbox` and `V = demo_and_extension/data/exploration-videos`. Every JSON, WebM, and sidecar named below exists.

### 1. Easy R1 — Paris, Bastille (`loc_001`)

- **Untouched cues / initial belief:** July Column and the open Place de la Bastille geometry, dense Haussmannian streets, and French urban context identified Paris/Bastille at high confidence.
- **Provisional pin / exploration:** A valid Paris-centre pin was placed immediately. Bounded panorama checks confirmed the monument/plaza geometry; no incompatible cue appeared.
- **Final belief / final pin verification:** Place de la Bastille, Paris, France. The marker was refined to `(48.854166, 2.368769)` and visually checked against Paris and the central-street/plaza area.
- **Submission / result:** about 169 s remaining; **0.235 km, 4,999 points**. Revealed: Bastille, Paris, France (`48.852130, 2.369639`).
- **Assessment:** country and city/landmark correct; pin transfer **PASS**.
- **Artifacts:** `R/europe-easy/loc-001/2026-08-31T03-03-09-970Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-1.json`; `V/europe-easy/loc_001/session-2026-08-31T03-03-09-407Z-572817e1-d70e-48ce-a62f-746247bd0cf7/round-01.webm`; matching `round-01.json`. Recording `ogrr-2026-08-31T03-03-09-970Z-1332d042-5be9-4cb9-b4f5-0e77e358ad12`.

### 2. Easy R2 — Berlin, Alexanderplatz (`loc_002`)

- **Untouched cues / initial belief:** Fernsehturm-dominated skyline, tram/urban plaza form, and German city architecture identified Alexanderplatz, Berlin.
- **Provisional pin / exploration:** Provisional marker went to central Berlin. Short visual checks confirmed the Alexanderplatz landmark cluster.
- **Final belief / final pin verification:** Alexanderplatz, Berlin, Germany. Marker refined and verified at `(52.522763, 13.413551)` against Berlin and central plaza labels.
- **Submission / result:** about 189 s remaining; **0.263 km, 4,999 points**. Revealed: Alexanderplatz, Berlin (`52.520601, 13.415123`).
- **Assessment:** country and city/landmark correct; pin transfer **PASS**.
- **Artifacts:** `R/europe-easy/loc-002/2026-08-31T03-05-42-062Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-2.json`; `V/europe-easy/loc_002/session-2026-08-31T03-03-09-407Z-572817e1-d70e-48ce-a62f-746247bd0cf7/round-02.webm`; matching `round-02.json`. Recording `ogrr-2026-08-31T03-05-42-062Z-b6e63ba5-c036-4676-80c6-bc846eb8016a`.

### 3. Easy R3 — Salzburg (`loc_003`)

- **Untouched cues / initial belief:** Alpine backdrop, Austrian historic-city architecture, and the Salzburg urban form supported Salzburg, Austria.
- **Provisional pin / exploration:** Provisional pin was placed in Salzburg; limited movement and orientation checks sought a contradiction and found none.
- **Final belief / final pin verification:** Salzburg city centre, Austria. Marker verified at `(47.796123, 13.044245)` against the rendered Salzburg area.
- **Submission / result:** about 226 s remaining; **0.817 km, 4,996 points**. Revealed: Salzburg (`47.800544, 13.052977`).
- **Assessment:** country and city correct; pin transfer **PASS**.
- **Artifacts:** `R/europe-easy/loc-003/2026-08-31T03-07-52-054Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-3.json`; `V/europe-easy/loc_003/session-2026-08-31T03-03-09-407Z-572817e1-d70e-48ce-a62f-746247bd0cf7/round-03.webm`; matching `round-03.json`. Recording `ogrr-2026-08-31T03-07-52-054Z-095b67e0-3535-489b-953c-96f674d18c1b`.

### 4. Easy R4 — Cesky Krumlov (`loc_004`)

- **Untouched cues / initial belief:** Compact medieval streets, red roofs, Czech visual context, and the distinctive river/castle-town form identified Cesky Krumlov.
- **Provisional pin / exploration:** A town-centre provisional was placed; brief geometry checks confirmed the historic core.
- **Final belief / final pin verification:** Cesky Krumlov, Czechia. Marker refined to `(48.812424, 14.316793)` and verified within the named town.
- **Submission / result:** about 231 s remaining; **0.280 km, 4,999 points**. Revealed: Cesky Krumlov (`48.812602, 14.312975`).
- **Assessment:** country and city correct; pin transfer **PASS**.
- **Artifacts:** `R/europe-easy/loc-004/2026-08-31T03-09-24-555Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-4.json`; `V/europe-easy/loc_004/session-2026-08-31T03-03-09-407Z-572817e1-d70e-48ce-a62f-746247bd0cf7/round-04.webm`; matching `round-04.json`. Recording `ogrr-2026-08-31T03-09-24-555Z-36d0e551-bc1d-4cdb-9267-74a3cc97168c`.

### 5. Easy R5 — Pula Arena (`loc_005`)

- **Untouched cues / initial belief:** The large Roman amphitheatre, Adriatic light/vegetation, and Croatian urban context identified the Pula Arena.
- **Provisional pin / exploration:** Provisional pin was placed in Pula; bounded inspection confirmed the amphitheatre geometry.
- **Final belief / final pin verification:** Pula Arena, Pula, Croatia. Marker refined and checked at `(44.871271, 13.844588)` against the Pula landmark area.
- **Submission / result:** about 210 s remaining; **0.533 km, 4,997 points**. Revealed: Pula Arena (`44.874712, 13.849302`).
- **Assessment:** country, city, and landmark correct; pin transfer **PASS**.
- **Artifacts:** `R/europe-easy/loc-005/2026-08-31T03-10-53-297Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-5.json`; `V/europe-easy/loc_005/session-2026-08-31T03-03-09-407Z-572817e1-d70e-48ce-a62f-746247bd0cf7/round-05.webm`; matching `round-05.json`. Recording `ogrr-2026-08-31T03-10-53-297Z-0e0b49f4-2548-48fe-a309-cf10f4035d59`.

### 6. Easy R6 — Sieniawka/Zittau tri-border (`loc_006`)

- **Untouched cues / initial belief:** Border-area road form, Central-European signage/context, and visible settlement/boundary cues pointed to the Sieniawka–Zittau tri-border area.
- **Provisional pin / exploration:** A valid provisional was placed in the Zittau/Sieniawka area; movement checked the border-road context.
- **Final belief / final pin verification:** Sieniawka near Zittau, Poland. Marker verified at `(50.896345, 14.843569)` against the rendered border-area geography.
- **Submission / result:** about 142 s remaining; **0.522 km, 4,997 points**. Revealed: Sieniawka/Zittau tri-border area (`50.900879, 14.845513`).
- **Assessment:** country and locality correct; pin transfer **PASS**.
- **Artifacts:** `R/europe-easy/loc-006/2026-08-31T03-12-42-045Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-6.json`; `V/europe-easy/loc_006/session-2026-08-31T03-03-09-407Z-572817e1-d70e-48ce-a62f-746247bd0cf7/round-06.webm`; matching `round-06.json`. Recording `ogrr-2026-08-31T03-12-42-045Z-09710f57-1476-4df3-870a-a0f185070a6e`.

### 7. Easy R7 — Visnja Gora (`loc_007`)

- **Untouched cues / initial belief:** Slovenian village/rail context, green karstic hills, and the visible Visnja Gora/station identification supported Visnja Gora.
- **Provisional pin / exploration:** A Slovenia provisional was refined to the named town; station/town context provided independent corroboration.
- **Final belief / final pin verification:** Visnja Gora, Slovenia. Marker verified at `(45.951465, 14.735631)` inside the rendered town area.
- **Submission / result:** about 193 s remaining; **0.878 km, 4,996 points**. Revealed: Visnja Gora (`45.957760, 14.742492`). Distance is coordinate-derived because an ad covered the result number.
- **Assessment:** country and locality correct; pin transfer **PASS**.
- **Artifacts:** `R/europe-easy/loc-007/2026-08-31T03-15-42-049Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-7.json`; `V/europe-easy/loc_007/session-2026-08-31T03-03-09-407Z-572817e1-d70e-48ce-a62f-746247bd0cf7/round-07.webm`; matching `round-07.json`. Recording `ogrr-2026-08-31T03-15-42-049Z-cf2a8762-223b-4041-adc4-4c4815b5eba5`.

### 8. Easy R8 — Flam (`loc_008`)

- **Untouched cues / initial belief:** Steep Norwegian fjord walls, harbor/rail setting, and the compact cruise-port settlement identified Flam.
- **Provisional pin / exploration:** Provisional marker went to Flam; rail/harbor geometry confirmed the exact settlement.
- **Final belief / final pin verification:** Flam harbor/rail area, Norway. Marker refined to `(60.861818, 7.116619)` and checked against the fjord-end settlement.
- **Submission / result:** about 223 s remaining; **0.198 km, 4,999 points**. Revealed: Flam (`60.863474, 7.117964`).
- **Assessment:** country and locality correct; pin transfer **PASS**.
- **Artifacts:** `R/europe-easy/loc-008/2026-08-31T03-17-49-548Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-8.json`; `V/europe-easy/loc_008/session-2026-08-31T03-03-09-407Z-572817e1-d70e-48ce-a62f-746247bd0cf7/round-08.webm`; matching `round-08.json`. Recording `ogrr-2026-08-31T03-17-49-548Z-f271ea35-f81a-4004-baec-14cc9bbcfcf1`.

### 9. Medium R1 — Valencia (`loc_009`)

- **Untouched cues / initial belief:** Spanish streetscape, Mediterranean vegetation/light, and Valencia-scale urban form supported Valencia.
- **Provisional pin / exploration:** Provisional marker went to Valencia; bounded movement sought readable corroboration and found no contradiction.
- **Final belief / final pin verification:** Valencia, Spain. Marker refined to `(39.470231, -0.371431)` and verified within central Valencia.
- **Submission / result:** about 166 s remaining; **0.594 km, 4,997 points**. Revealed: Valencia (`39.466793, -0.366134`).
- **Assessment:** country and city correct; pin transfer **PASS**.
- **Artifacts:** `R/europe-medium/loc-009/2026-08-31T03-20-40-157Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-1.json`; `V/europe-medium/loc_009/session-2026-08-31T03-20-40-157Z-4180ce57-7326-4bcb-b504-1ab17079d0a3/round-01.webm`; matching `round-01.json`. Recording `ogrr-2026-08-31T03-20-40-157Z-5ac6a5ee-5a4b-486c-a696-d8ce9015b1cb`.

### 10. Medium R2 — Bologna (`loc_010`)

- **Untouched cues / initial belief:** Long arcades, red-brick Italian fabric, and Bologna-specific central streets identified Bologna.
- **Provisional pin / exploration:** A city-centre provisional was placed; facade and street geometry confirmed the high-confidence identification.
- **Final belief / final pin verification:** Central Bologna, Italy. Marker verified at `(44.492867, 11.325447)` at useful street scale.
- **Submission / result:** about 150 s remaining; **0.041 km, 5,000 points**. Revealed: Bologna (`44.493067, 11.325014`).
- **Assessment:** country and city correct; pin transfer **PASS**.
- **Artifacts:** `R/europe-medium/loc-010/2026-08-31T03-23-17-865Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-2.json`; `V/europe-medium/loc_010/session-2026-08-31T03-20-40-157Z-4180ce57-7326-4bcb-b504-1ab17079d0a3/round-02.webm`; matching `round-02.json`. Recording `ogrr-2026-08-31T03-23-17-865Z-32964d82-d99e-48e3-8ffc-0d60f99e2ad1`.

### 11. Medium R3 — Utrecht (`loc_011`)

- **Untouched cues / initial belief:** Dutch cycling/road design, canal-city architecture, and flat dense urban form supported Utrecht.
- **Provisional pin / exploration:** Provisional marker was placed in Utrecht; movement checked the street/canal context.
- **Final belief / final pin verification:** Utrecht, Netherlands. Marker verified at `(52.104546, 5.093282)` against the rendered city.
- **Submission / result:** about 180 s remaining; **1.273 km, 4,994 points**. Revealed: Utrecht (`52.112400, 5.079716`).
- **Assessment:** country and city correct; pin transfer **PASS**.
- **Artifacts:** `R/europe-medium/loc-011/2026-08-31T03-26-14-109Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-3.json`; `V/europe-medium/loc_011/session-2026-08-31T03-20-40-157Z-4180ce57-7326-4bcb-b504-1ab17079d0a3/round-03.webm`; matching `round-03.json`. Recording `ogrr-2026-08-31T03-26-14-109Z-9f97bead-66ad-4b29-a52d-7754b5fa7e4a`.

### 12. Medium R4 — Melle, Belgium (`loc_012`)

- **Untouched cues / initial belief:** Dutch-language Belgian road context and route-number signage suggested Flanders; the decisive route reading remained ambiguous between N444 and N44.
- **Provisional pin / exploration:** Provisional marker went to the Ghent/Flanders region. Movement and sign re-reading retained Belgium but led to Knesselare rather than Melle.
- **Final belief / final pin verification:** Knesselare/Aalter area, Belgium. Marker verified at `(51.136559, 3.423459)` against the intended rendered Flanders area.
- **Submission / result:** about 135 s remaining; **28.003 km, 4,862 points**. Revealed: Melle, Belgium (`50.987459, 3.746390`).
- **Assessment:** country correct; strict locality incorrect due route-sign interpretation; pin transfer **PASS**.
- **Artifacts:** `R/europe-medium/loc-012/2026-08-31T03-28-34-103Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-4.json`; `V/europe-medium/loc_012/session-2026-08-31T03-20-40-157Z-4180ce57-7326-4bcb-b504-1ab17079d0a3/round-04.webm`; matching `round-04.json`. Recording `ogrr-2026-08-31T03-28-34-103Z-7c448f8a-101c-4212-b0c8-f2b2a829a417`.

### 13. Medium R5 — Coimbra (`loc_013`)

- **Untouched cues / initial belief:** Portuguese paving/architecture, hilly university-city form, and Lusophone visual context supported Coimbra.
- **Provisional pin / exploration:** Provisional marker was placed in Coimbra; slope and urban geometry corroborated it.
- **Final belief / final pin verification:** Coimbra, Portugal. Marker verified at `(40.209633, -8.425642)` in the rendered city.
- **Submission / result:** about 176 s remaining; **0.955 km, 4,995 points**. Revealed: Coimbra (`40.215582, -8.433756`).
- **Assessment:** country and city correct; pin transfer **PASS**.
- **Artifacts:** `R/europe-medium/loc-013/2026-08-31T03-31-49-109Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-5.json`; `V/europe-medium/loc_013/session-2026-08-31T03-20-40-157Z-4180ce57-7326-4bcb-b504-1ab17079d0a3/round-05.webm`; matching `round-05.json`. Recording `ogrr-2026-08-31T03-31-49-109Z-65367879-1289-4e75-8f38-c9d82655fcd2`.

### 14. Medium R6 — Uppsala, guessed Lidkoping (`loc_014`)

- **Untouched cues / initial belief:** Swedish road/urban infrastructure and Nordic built form established Sweden, but the city identity was weak.
- **Provisional pin / exploration:** A central-Sweden provisional was placed; additional movement did not expose decisive city text, and the working city became Lidkoping.
- **Final belief / final pin verification:** Lidkoping, Sweden. Marker verified at `(58.503912, 13.143990)` in the intended town.
- **Submission / result:** about 117 s remaining; **295.221 km, 3,721 points**. Revealed: Uppsala, Sweden (`59.848115, 17.614067`).
- **Assessment:** country correct; city incorrect; pin transfer **PASS**.
- **Artifacts:** `R/europe-medium/loc-014/2026-08-31T03-34-15-356Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-6.json`; `V/europe-medium/loc_014/session-2026-08-31T03-20-40-157Z-4180ce57-7326-4bcb-b504-1ab17079d0a3/round-06.webm`; matching `round-06.json`. Recording `ogrr-2026-08-31T03-34-15-356Z-5ac1dba6-e4ec-4a4d-b27e-1a764fff1660`.

### 15. Medium R7 — Tartu (`loc_015`)

- **Untouched cues / initial belief:** Estonian language/urban cues, Baltic streetscape, and Tartu-scale city form supported Tartu.
- **Provisional pin / exploration:** A valid Tartu provisional was placed; movement confirmed the urban context.
- **Final belief / final pin verification:** Tartu, Estonia. Marker refined to `(58.350770, 26.719847)` and checked in the named city.
- **Submission / result:** about 83 s remaining; **0.324 km, 4,998 points**. Revealed: Tartu (`58.347859, 26.719780`).
- **Assessment:** country and city correct; pin transfer **PASS**.
- **Artifacts:** `R/europe-medium/loc-015/2026-08-31T03-37-51-603Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-7.json`; `V/europe-medium/loc_015/session-2026-08-31T03-20-40-157Z-4180ce57-7326-4bcb-b504-1ab17079d0a3/round-07.webm`; matching `round-07.json`. Recording `ogrr-2026-08-31T03-37-51-603Z-cd727d46-7286-4104-a956-1644904c3f31`.

### 16. Medium R8 — Jelsava, Slovakia; guessed Jelsane, Slovenia (`loc_016`)

- **Untouched cues / initial belief:** A Slavic village, green upland setting, and a visible short place-name beginning `Jels...` produced a Slovakia/Slovenia ambiguity.
- **Provisional pin / exploration:** Provisional marker went to the Slovene border region. Further text inspection selected the wrong homonym, Jelsane.
- **Final belief / final pin verification:** Jelsane, Slovenia. Marker verified at `(45.501038, 14.275320)` in the intended named settlement.
- **Submission / result:** about 129 s remaining; **516.226 km, 2,983 points**. Revealed: Jelsava, Slovakia (`48.758386, 19.141290`). Distance is coordinate-derived; points are reconciled from the official total and visible `+2983 XP` result.
- **Assessment:** country and locality incorrect from a place-name homonym; pin transfer **PASS**.
- **Artifacts:** `R/europe-medium/loc-016/2026-08-31T03-43-31-023Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-8.json`; `V/europe-medium/loc_016/session-2026-08-31T03-20-40-157Z-4180ce57-7326-4bcb-b504-1ab17079d0a3/round-08.webm`; matching `round-08.json`. Recording `ogrr-2026-08-31T03-43-31-023Z-7f8feb9e-3118-4fc6-92e9-21a32fd99f37`.

### 17. Medium R9 — Corboley, Ireland; guessed Moycullen (`loc_017`)

- **Untouched cues / initial belief:** Left-driving Irish rural road, Atlantic vegetation, and Galway-area terrain supported western Ireland.
- **Provisional pin / exploration:** Provisional marker went west of Galway. Additional road/settlement context narrowed the guess to Moycullen but did not reveal Corboley.
- **Final belief / final pin verification:** Moycullen, County Galway, Ireland. Marker verified at `(53.339156, -9.191409)` in the intended settlement area.
- **Submission / result:** about 84 s remaining; **7.276 km, 4,964 points**. Revealed: Corboley, southwest of Galway (`53.281934, -9.138277`).
- **Assessment:** country and regional reasoning correct; strict locality incorrect; pin transfer **PASS**.
- **Artifacts:** `R/europe-medium/loc-017/2026-08-31T03-48-45-231Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-9.json`; `V/europe-medium/loc_017/session-2026-08-31T03-20-40-157Z-4180ce57-7326-4bcb-b504-1ab17079d0a3/round-09.webm`; matching `round-09.json`. Recording `ogrr-2026-08-31T03-48-45-231Z-992d7c9c-d3db-40bf-88a9-6485b628882a`.

### 18. Hard R1 — Arcadia, Greece; guessed Didyma/Kranidi corridor (`loc_018`)

- **Untouched cues / initial belief:** Dry Mediterranean mountain road, Greek road-label/transliteration cues, scrub, and pale rocky terrain established Greece/Peloponnese.
- **Provisional pin / exploration:** Provisional marker went to the Peloponnese. Road-label inspection shifted the regional placement toward the Didyma/Kranidi corridor.
- **Final belief / final pin verification:** Didyma/Kranidi area, Greece. Marker verified at `(37.487468, 23.189423)` in the intended eastern-Peloponnese area.
- **Submission / result:** about 125 s remaining; **55.215 km, 4,731 points**. Revealed: near Kastri–Agios Andreas, Arcadia, Greece (`37.343941, 22.590908`).
- **Assessment:** country correct; strict locality incorrect; pin transfer **PASS**.
- **Artifacts:** `R/europe-hard/loc-018/2026-08-31T03-51-02-596Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-1.json`; `V/europe-hard/loc_018/session-2026-08-31T03-51-02-596Z-da6f6b47-e2f2-41fa-a90d-fdf5ded8546f/round-01.webm`; matching `round-01.json`. Recording `ogrr-2026-08-31T03-51-02-596Z-8b5979a1-8634-428a-b2a2-71ce2f5a2b38`.

### 19. Hard R2 — north of Sibiu, Romania; guessed northwest Romania (`loc_019`)

- **Untouched cues / initial belief:** Pastoral lane, rolling Carpathian foothills, and concrete utility poles with rectangular holes supported Romania.
- **Provisional pin / exploration:** A Romania provisional was placed. Repeated road/pole/landscape checks retained the country but produced an over-western Oradea-area placement.
- **Final belief / final pin verification:** Northwestern Romania near Oradea. Marker verified at `(47.172725, 22.239055)` in the intended area.
- **Submission / result:** about 109 s remaining; **214.621 km, 4,034 points**. Revealed: rural Romania north of Sibiu (`45.891143, 24.337200`).
- **Assessment:** country correct; strict locality/region incorrect; pin transfer **PASS**.
- **Artifacts:** `R/europe-hard/loc-019/2026-08-31T03-56-51-899Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-2.json`; `V/europe-hard/loc_019/session-2026-08-31T03-51-02-596Z-da6f6b47-e2f2-41fa-a90d-fdf5ded8546f/round-02.webm`; matching `round-02.json`. Recording `ogrr-2026-08-31T03-56-51-899Z-767dff16-3c0a-4a8d-916b-de0273d310c9`.

### 20. Hard R3 — Bulgarian Rhodopes; guessed near Strumica (`loc_020`)

- **Untouched cues / initial belief:** Steep green Balkan mountains, modest road engineering, and settlement/vegetation cues left Bulgaria and North Macedonia as the main alternatives.
- **Provisional pin / exploration:** The provisional started in the Bulgarian Rhodopes. Later terrain comparison shifted the final belief west toward the Strumica area.
- **Final belief / final pin verification:** Near Strumica, North Macedonia. Marker verified at `(41.429720, 22.984407)` in the intended Strumica-region area.
- **Submission / result:** about 164 s remaining; **166.053 km, 4,235 points**. Revealed: Bulgarian Rhodopes (`41.564394, 24.970148`). Distance is coordinate-derived because a Discord popup obscured the result number.
- **Assessment:** country and locality incorrect; pin transfer **PASS**.
- **Artifacts:** `R/europe-hard/loc-020/2026-08-31T03-59-12-885Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-3.json`; `V/europe-hard/loc_020/session-2026-08-31T03-51-02-596Z-da6f6b47-e2f2-41fa-a90d-fdf5ded8546f/round-03.webm`; matching `round-03.json`. Recording `ogrr-2026-08-31T03-59-12-885Z-1d656ff9-991a-4ae9-a075-00e01be8da08`.

### 21. Hard R4 — Csongrad area, Hungary; guessed Vojvodina (`loc_021`)

- **Untouched cues / initial belief:** Flat Pannonian sunflower/corn fields, straight rural road, and lowland settlement form suggested Hungary or northern Serbia.
- **Provisional pin / exploration:** Provisional marker went to the Hungary/Serbia border region. With no decisive text, the final weighting moved south into Vojvodina.
- **Final belief / final pin verification:** Northern Serbia/Vojvodina. Marker verified at `(45.652018, 20.310665)` in the intended region.
- **Submission / result:** about 169 s remaining; **118.910 km, 4,439 points**. Revealed: near Csongrad, Hungary (`46.706018, 20.049672`).
- **Assessment:** country and locality incorrect; pin transfer **PASS**.
- **Artifacts:** `R/europe-hard/loc-021/2026-08-31T04-01-28-039Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-4.json`; `V/europe-hard/loc_021/session-2026-08-31T03-51-02-596Z-da6f6b47-e2f2-41fa-a90d-fdf5ded8546f/round-04.webm`; matching `round-04.json`. Recording `ogrr-2026-08-31T04-01-28-039Z-bca0d95d-226c-45d0-a152-3924ffabd86d`.

### 22. Hard R5 — Latvia; guessed northeast Hungary (`loc_022`)

- **Untouched cues / initial belief:** Dirt orchard/hedge track, temperate farmland, and weak Central/Eastern-European cues produced a broad Baltic-to-Hungary ambiguity.
- **Provisional pin / exploration:** A Hungary provisional was placed. Additional panorama movement did not surface language or road infrastructure strong enough to overturn it.
- **Final belief / final pin verification:** Northeastern Hungary. Marker verified at `(47.938190, 22.242269)` in the intended region.
- **Submission / result:** about 200 s remaining; **1,061.721 km, 1,728 points**. Revealed: Latvia (`57.190768, 26.147673`).
- **Assessment:** country and locality incorrect; pin transfer **PASS**.
- **Artifacts:** `R/europe-hard/loc-022/2026-08-31T04-03-52-889Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-5.json`; `V/europe-hard/loc_022/session-2026-08-31T03-51-02-596Z-da6f6b47-e2f2-41fa-a90d-fdf5ded8546f/round-05.webm`; matching `round-05.json`. Recording `ogrr-2026-08-31T04-03-52-889Z-24c5fa83-f636-4c46-a674-1d4ff618a76c`.

### 23. Hard R6 — Pocuneliai/Pakirsinys, Lithuania (`loc_023`)

- **Untouched cues / initial belief:** Flat Baltic farmland, Soviet-era utility/road context, and the visible Lithuanian local route number `3416` identified Lithuania.
- **Provisional pin / exploration:** A Lithuania provisional was placed. Route and landscape checks narrowed the belief toward the Kedainiai area.
- **Final belief / final pin verification:** Kedainiai area, Lithuania. Marker verified at `(55.326418, 23.928414)` in the intended region.
- **Submission / result:** about 154 s remaining; **30.682 km, 4,849 points**. Revealed: Pocuneliai/Pakirsinys area, Lithuania (`55.596620, 23.829799`).
- **Assessment:** country correct; strict locality incorrect; pin transfer **PASS**.
- **Artifacts:** `R/europe-hard/loc-023/2026-08-31T04-06-15-189Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-6.json`; `V/europe-hard/loc_023/session-2026-08-31T03-51-02-596Z-da6f6b47-e2f2-41fa-a90d-fdf5ded8546f/round-06.webm`; matching `round-06.json`. Recording `ogrr-2026-08-31T04-06-15-189Z-e24779ec-057f-463b-bc89-2bf0e894b1c5`.

### 24. Hard R7 — Harboore, Denmark; guessed Hammel area (`loc_024`)

- **Untouched cues / initial belief:** Flat Danish fields, road geometry, and the visible road name `Skalvej` established Denmark/Jutland.
- **Provisional pin / exploration:** Provisional marker went to central Jutland. Road-name and terrain checks retained Denmark but not the west-coast placement.
- **Final belief / final pin verification:** Central/eastern Jutland near Hammel. Marker verified at `(56.224799, 9.765013)` in the intended area.
- **Submission / result:** about 160 s remaining; **107.005 km, 4,492 points**. Revealed: near Harboore on the west coast, Denmark (`56.601125, 8.163942`).
- **Assessment:** country correct; strict locality incorrect; pin transfer **PASS**.
- **Artifacts:** `R/europe-hard/loc-024/2026-08-31T04-10-38-796Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-7.json`; `V/europe-hard/loc_024/session-2026-08-31T03-51-02-596Z-da6f6b47-e2f2-41fa-a90d-fdf5ded8546f/round-07.webm`; matching `round-07.json`. Recording `ogrr-2026-08-31T04-10-38-796Z-6acb945a-1c46-4af8-bce6-3364ceb6f597`.

### 25. Hard R8 — Juurikka/Pudasjarvi area, Finland (`loc_025`)

- **Untouched cues / initial belief:** Boreal pine/birch/spruce forest, cracked paved road, white Finnish-style edge/centre markings, rolling terrain, and a large dark camera hood supported Finland.
- **Provisional pin / exploration:** An initial world-map coordinate mistake put the provisional marker in Greenland. It was visibly corrected to far northern Finland, then refined south after the leafy vegetation and terrain argued for central/northern Finland rather than extreme Lapland.
- **Final belief / final pin verification:** Central/northern Finland, Kainuu–Oulu hinterland. Marker verified at `(64.485813, 27.600327)` on the rendered Finland map before submission.
- **Submission / result:** about 125 s remaining; **59.335 km, 4,712 points**. Revealed: near Juurikka/Pudasjarvi, Finland (`64.942839, 26.955413`).
- **Assessment:** country correct; strict locality incorrect; pin transfer **PASS** after correcting the provisional-map error.
- **Artifacts:** `R/europe-hard/loc-025/2026-08-31T04-12-02-120Z__gpt-5-6-sol-xhigh-recorded-r3__interactive-panorama__round-8.json`; `V/europe-hard/loc_025/session-2026-08-31T03-51-02-596Z-da6f6b47-e2f2-41fa-a90d-fdf5ded8546f/round-08.webm`; matching `round-08.json`. Recording `ogrr-2026-08-31T04-12-02-120Z-94e9e9d0-b7c1-40a2-835e-04dbf8ae51bc`.

## Recorder evidence, session manifests, and exclusions

| Level | Pre-start gate | In-round evidence | Terminal evidence | Session manifest |
|---|---|---|---|---|
| Easy | Visible blue `ARMED`, `interactive`, 0/8; no `VIDEO ERROR` | Visible `REC Round N`; fresh post-Guess `SAVED` progression 1/8 through 8/8 | `Competition recorded`, 8/8; leaderboard 39,982; `Done & disarm`; HUD gone | `demo_and_extension/data/recordings/sessions/europe-easy/session-2026-08-31t03-03-09-407z-572817e1-d70e-48ce-a62f-746247bd0cf7.json` |
| Medium | Visible blue `ARMED`, `interactive`, 0/9; no `VIDEO ERROR` | Visible `REC Round N`; fresh post-Guess `SAVED` progression 1/9 through 9/9 | `Competition recorded`, 9/9; leaderboard 41,514; `Done & disarm`; HUD gone | `demo_and_extension/data/recordings/sessions/europe-medium/session-2026-08-31t03-20-40-157z-4180ce57-7326-4bcb-b504-1ab17079d0a3.json` |
| Hard | Visible blue `ARMED`, `interactive`, 0/8; no `VIDEO ERROR` | Visible `REC Round N`; fresh post-Guess `SAVED` progression 1/8 through 8/8 | `Competition recorded`, 8/8; leaderboard 33,220; `Done & disarm`; HUD gone | `demo_and_extension/data/recordings/sessions/europe-hard/session-2026-08-31t03-51-02-596z-da6f6b47-e2f2-41fa-a90d-fdf5ded8546f.json` |

All three manifests report `status: complete`, expected/completed counts 8/8, 9/9, and 8/8, model `gpt-5-6-sol-xhigh-recorded-r3`, condition `interactive-panorama`, recorder `0.7.26`, visible-tab frame-stream capture, `videoCapture.status: stopped`, and no active round capture.

Exactly **12 no-prediction recovery segments** are retained in the current session manifests and excluded from the 25 authoritative records. Each has `predictionCaptured: false`, `stopReason: new_streetview_frame`, and no submitted prediction:

- Medium: R8 x1 (`03-42-44-092Z`), R9 x1 (`03-45-59-098Z`).
- Hard: R2 x2 (`03-54-23-116Z`, `03-55-59-127Z`); R3 x2 (`03-57-55-609Z`, `03-58-14-876Z`); R4 x1 (`04-00-44-378Z`); R5 x1 (`04-03-29-351Z`); R6 x1 (`04-05-44-349Z`); R7 x2 (`04-08-40-597Z`, `04-09-18-190Z`); R8 x1 (`04-11-34-349Z`).

These recovery boundaries did not advance the visible official saved counter and did not create extra authoritative predictions. The HUD remained on the same official round, so play continued under the stated recovery policy.

Two authoritative entries, Easy R1 and Medium R6, report `saveMethod: download-fallback` after the collector response path was not returned. In both cases the same current-run prediction JSON is also present in the collector inbox, and the corresponding WebM and sidecar exist. They are single authoritative predictions, not duplicates.

## Validation

- Authoritative `prediction_submitted` entries: **25 exactly**.
- Authoritative count by dataset: **8 Easy + 9 Medium + 8 Hard**.
- Excluded `new_streetview_frame` no-prediction entries: **12**.
- Missing authoritative prediction JSON files: **0**.
- Missing authoritative WebM paths: **0**; capture-ID mismatches: **9**.
- Matching authoritative video sidecars: **16/25**. Medium 8-9 and Hard 2-8 reused recovery output paths, so the physical WebM/sidecar at each of those nine paths belongs to a recovery capture rather than the later official segment.
- Partial authoritative entries: **0**.
- Authoritative entries with wrong stop reason: **0**.
- Authoritative video errors: **0**.
- Model-label mismatches: **0**.
- Condition mismatches: **0**.
- Default/time-out submissions: **0**.
- Leaderboard commitment: **PASS** for Easy, Medium, and Hard.
- Explicit recorder disarm: **PASS** for Easy, Medium, and Hard.
- Dedicated R3 Chrome tab closed after disarm: **PASS**.

The stricter capture-ID audit above supersedes the earlier path-existence-only
interpretation. It does not affect the 25 prediction JSON records, completed
session counters, or official leaderboard totals; it limits continuous visual
replay for the nine named submissions. Of 12 recovery entries, nine first
recovery captures have matching stored WebMs; three later repeated recoveries
also reused those paths and have no distinct stored video.

## Pin-refinement regression conclusion

The run passes the protocol's belief-to-pin gates: no correct high-confidence country belief was left in another country because of a world-scale marker, no valid submission used a default marker, and all 25 final pins matched their final textual beliefs. Easy improved from the protocol baseline of 36,340 points and 787.5 km aggregate error to **39,982 points and 3.730 km**, an improvement of **3,642 points** and approximately **783.770 km less Easy error**. The separate strict timing-target caveat above remains; this report does not claim 25–45-second submission timing compliance.
