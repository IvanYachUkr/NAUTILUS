# NAUTILUS Recorded GPT-5.6-sol xhigh Run

## Run identity and outcome

- Player: **Ivan Yachnik** (Player B, existing authenticated Edge session)
- Recorder model label: `gpt-5.6-sol-xhigh-recorded`
- Recorder version/workflow: v0.7.21, **Interactive panorama**, automatic visible-tab video fallback
- Competition order: Easy (`europe-easy`, ID 24300) -> Medium (`europe-medium`, ID 24301) -> Hard (`europe-hard`, ID 24302)
- Completed rounds: **25/25** (8 Easy, 9 Medium, 8 Hard), with no timeout, retry, replay, or default submission
- Official leaderboard totals:
  - Easy: **39,745 Pts**
  - Medium: **40,155 Pts**
  - Hard: **30,373 Pts**
  - **Combined official score: 110,273 Pts**

The numeric `+XP` values animated on round result panels were account experience only. They were not treated as competition points. The only scores reported above are the official totals visibly shown on the three committed leaderboards.

## Blind-play and controller gate audit

The run used ordinary visible pixels and normal Street View/map controls only. No page DOM, accessibility tree, network data, panorama identifiers, coordinates, hidden metadata, prior benchmark results, location manifests, geographic result files, or location web searches were used.

Before entering a scored link, an unscored disposable World round was used with the recorder unarmed. A provisional marker was placed; the map was expanded and zoomed from world to city; the marker was moved to visibly named **Pekanbaru** and verified; the map was collapsed with Guess active; one normal Street View step was taken; the map was reopened and the marker was visibly confirmed to persist. The round was then abandoned without submission. This passed the required controller regression gate.

## Easy — `europe-easy` — official total 39,745

1. **Paris, Place de la Bastille.** Initial evidence: dense Parisian boulevard/plaza context and recognizable Bastille urban geometry. Final belief was Place de la Bastille, Paris, at high confidence. A meaningful marker was visibly verified near the western 11th/Coulee verte side. Result: **330 m**; actual was Place de la Bastille. Semantic identification was exact; the controller and pin were consistent with the belief.
2. **Berlin, Alexanderplatz.** Initial evidence: unmistakable Alexanderplatz metropolitan streetscape. Final belief was Alexanderplatz, Berlin, at very high confidence. Marker visibly verified on the named plaza. Result: **213 m**; actual was a nearby Alexanderplatz street. Semantic and pin audits passed.
3. **Salzburg, Kapuzinerberg.** Initial evidence: elevated historic Salzburg viewpoint/footpath setting. Final belief was Basteiweg/Kapuzinerberg, Salzburg. Marker visibly verified on the named Salzburg/Kapuzinerberg area. Result: **25 m**; semantic and controller audits were exact.
4. **Cesky Krumlov, Cloak Bridge.** Initial evidence: distinctive multi-level historic bridge/castle fabric. Final belief was the Cloak Bridge in Cesky Krumlov. Pin visibly verified at the landmark. Result: **17 m**; semantic, pin, and controller audits were exact.
5. **Pula Arena.** Initial evidence: monumental Roman amphitheatre masonry and surrounding Pula context. Final belief was Pula Arena, Croatia. Pin visibly verified inside the named arena. Result: **155 m**; actual was the adjacent park road. Landmark/country identification and controller audit passed.
6. **German/Polish border road.** Initial evidence: visible B178/Zittau-Bogatynia border-road cues. Final belief was the Zittau-Bogatynia border area, with a pin visibly verified near Jelenia Gora. Result: **51.1 km**; country-region read was broadly correct, but the pin was too far east. This was the sole severe timing incident: map interaction latency reduced the timer to about 1:04, and the verified marker was submitted immediately rather than risking timeout.
7. **Visnja Gora, Slovenia.** Initial evidence: Slovenian rail/station settlement cues. Final belief was Visnja Gora station. Pin visibly verified on the A2 east of the station. Result: **237 m**; semantic identification and controller audit passed.
8. **Flam, Norway.** Initial evidence: narrow fjord, railway/port and steep-wall settlement cues. Final belief was Flam railway/port. Pin visibly verified by the named station. Result: **250 m**; actual was the restaurant/port area. Semantic and controller audits passed.

Recorder/commit audit: recorder was visibly armed for `europe-easy` with the exact model label before confirmation, recorded all **8/8** rounds, and was allowed to reach the completed state before final Continue. The leaderboard visibly showed **Ivan Yachnik #1 — 39,745 Pts**. It remained stable for at least two recorder heartbeats with no phantom ninth round, then Done & disarm removed the HUD before Medium was opened.

## Medium — `europe-medium` — official total 40,155

1. **Valencia, Spain.** Initial evidence: visible street name `Carrer de Ciril Amoros` and characteristic Valencia blockscape. Final belief was central Valencia (97% confidence); marker visibly verified in the named city. Result: **749 m**; actual was Gran Via/Carrer Ciscar and the pin was near Porta de la Mar. City/country and controller audits passed.
2. **Bologna, Italy.** Initial evidence: visible `Via Francesco...` and Bologna architectural/streetscape cues. Final belief was Bologna (83%); marker visibly verified in the named city. Result: **1.431 km**; actual was Via Francesco Roncati near Giardino Vittorio Melloni, while the pin was Piazza Maggiore. Semantic city/country and controller audits passed.
3. **Utrecht, Netherlands.** Initial evidence: visible `Amsterdamsestraatweg`, Dutch cycling/urban form. Final belief was Utrecht (99%); named-city pin visibly verified. Result: **10.1 km**; actual was Zuilen, Utrecht, while the coarse pin fell east near De Bilt. City/country read was exact; pin locality was coarse.
4. **Ghent-area Belgium.** Initial evidence: N44-style corridor, Flemish brick buildings, and separated cycle infrastructure. Final belief was Belgium on the Aalter/Maldegem-Ghent corridor (97% country, 72% locality); pin was visibly verified on land in the Bruges-Ghent/Lievegem area. Result: **19.5 km**; actual was Melle southeast of Ghent. Country and metropolitan region were right; the specific corridor/locality was wrong.
5. **Coimbra, Portugal.** Initial evidence: visible `Rua Figueira da Foz`, Portuguese urban form and terrain. Final belief was Coimbra (94%); marker visibly verified on named Coimbra land. Result: **13.6 km**; actual was central-west Coimbra, but the submitted pin had drifted east toward Vila Nova de Poiares. Semantic city/country passed; pin precision was poor.
6. **Sweden.** Initial evidence: visible `Bergagatan`, Swedish detached homes and streetscape. Final belief was Gothenburg (68%); a west-Sweden land pin was visibly verified north of Gothenburg/Uddevalla. Result: **365.1 km**; actual was Uppsala. Country was correct; city and pin locality were wrong.
7. **Estonia.** Initial evidence: visible `Sepa...`, Baltic residential environment. Final belief was Tallinn, Estonia (77%). Result: **288.1 km**; actual was Tartu. Country was correct, city was wrong. Post-result audit exposed that the regional marker landed offshore west of Estonia/Latvia despite the pre-submit screenshot belief. This was the main pin-control failure. From the next round onward, every marker was corrected and zoomed until its tip was unmistakably on a visibly named city/land outline before submission.
8. **Slovakia misread as Slovenia.** Initial evidence: visible `Jeles...` and an alpine/Balkan suburban setting. Final belief was Ljubljana, Slovenia (74%). After controlled correction, the marker tip was visibly verified on named Ljubljana land. Result: **444.8 km**; actual was the central/northern Slovak Low Tatras. Semantic country/city were wrong; belief-to-pin fidelity and controller audit passed.
9. **Galway, Ireland.** Initial evidence: Irish yellow shoulder line, white dashed center, grey limestone walls, detached bungalows and Atlantic weather. Final belief was Galway outskirts, Ireland (82%). After controlled correction, the marker tip was visibly verified exactly on named Galway land at 3:21 remaining. Result: **8.5 km**; actual was Boleybeg East west/northwest of Galway, and the pin remained in Galway around Ballybrit Business Park. Country/city, pin, and controller audits passed.

Recorder/commit audit: recorder was visibly armed for `europe-medium` with the exact label and dataset before confirmation. On several results it briefly displayed the prior SAVED count while the current round was still being persisted; Continue was withheld each time until the HUD visibly advanced. It reached **Competition recorded — 9/9 rounds saved** on the exact final result before Continue. The committed leaderboard visibly showed **Ivan Yachnik #1 — 40,155 Pts**. It remained stable for at least two heartbeats with no phantom tenth round, then Done & disarm removed the HUD before Hard was opened.

## Hard — `europe-hard` — official total 30,373

1. **Greece, Peloponnese.** Initial evidence: explicit Greek road-script overlay (`Epar.Od...`), dry rocky local road, juniper/maquis and a coach under strong sun. Initial/final belief was rural Crete near Heraklion (99% country, 48% island). An initial offshore regional click was corrected; the marker tip was visibly verified on named Heraklion land at 4:20. Result: **349 km**; actual was central Peloponnese near Tripoli. Country was correct, island/locality wrong; pin/controller audit passed after correction.
2. **Romania, Sibiu region.** Initial evidence: narrow pale road through rolling farms/orchards, sandy shoulders, utility poles, farm shed and low-resolution coverage. Final belief was Serbia, using named Belgrade as a robust country-level pin (52% Serbia; Romania remained an alternative). Marker tip was visibly verified on Belgrade land at 4:12. Result: **305 km**; actual was near Sibiu, Romania. Country was wrong; Balkan/farm-region read was broad, and pin/controller fidelity passed.
3. **Southern Bulgaria.** Initial evidence: steep wooded Balkan valley village, white plaster homes with broad roofs, narrow unmarked road, simple bridge rail, overhead cabling and blue roadside fixture. Final belief was Central Bosnia/Sarajevo hinterland (61% country). Marker tip visibly verified on named Sarajevo land at 4:22. Result: **593.3 km**; actual was southern Bulgaria near Kardzhali/Haskovo. Mountainous Balkan setting was right, country/locality wrong; pin/controller audit passed.
4. **Hungary, Csongrad.** Initial evidence: extremely flat Pannonian fields of sunflowers, wheat and maize, sparse concrete poles, treeless horizon and unmarked asphalt edge. Final belief was southern Hungarian plain near Szeged (46% Hungary). Marker tip visibly verified on named Szeged at 4:20. Result: **51.9 km**; actual was near Csongrad. Country and subregion were correct; pin/controller audit passed.
5. **Latvia, Jaunpiebalga.** Initial evidence: flat grassy double-track through dense deciduous scrub/orchard, wet-looking verges, straight horizon and isolated poplars. Final belief was rural central Latvia near Riga/Jelgava (40% Latvia). After recovering from map drift, marker tip visibly verified on named Riga land at 3:24. Result: **123.6 km**; actual was near Jaunpiebalga in east-central Latvia. Country and broad central-region read were correct; locality coarse; controller audit passed after recovery.
6. **Lithuania, Panevezys region.** Initial evidence: flat northern farm plain on pale gravel route visibly numbered `3426`, drainage ditches, sparse low farm buildings and mixed forest. Final belief was south-central Estonia near Tartu (52% Estonia; Lithuania was an alternative). Marker tip visibly verified on named Tartu land at 4:01. Result: **365.1 km**; actual was north-central Lithuania near Panevezys. Baltic region was correct but country wrong; pin/controller audit passed.
7. **Denmark, Harboore/Thyboron.** Initial evidence: explicit road overlay `Skalve`, extremely flat maritime fields, narrow unmarked asphalt, wind turbine and cool coastal clouds. Final belief was western Jutland near Esbjerg/Skallingen (86% Denmark). Marker tip visibly verified on named Esbjerg land at 4:11. Result: **128.5 km**; actual was Harboore/Thyboron on the northwest Jutland coast. Country and west-coast region were correct; locality was too far south; pin/controller audit passed.
8. **Finland, Oulu region.** Initial evidence: high-quality Nordic boreal road, double solid white center, white edge lines, gentle birch/pine terrain and visible blue/black car hood. Final belief was the south-central Finnish lake district near Tampere/Jyvaskyla (76% Finland). Marker tip visibly verified on named Tampere land at 3:50. Result: **395 km**; actual was east of Oulu in north-central Finland. Country and boreal/lake read were correct but latitude was too far south; pin/controller audit passed.

Recorder/commit audit: recorder was configured on the private Hard entry before confirmation and visibly showed **ARMED**, `europe-hard`, exact model label, interactive condition, automatic visible-tab capture, 0 saved rounds, and no active coordinator. Initial frames that still showed ARMED were advanced by no more than one ordinary Street View step, after which REC appeared. Every result was held until its current SAVED count appeared. The exact final result was held until **Competition recorded — 8/8 rounds saved**, then Continue committed the leaderboard. The leaderboard visibly showed **Ivan Yachnik #1 — 30,373 Pts**. It remained stable for at least two recorder heartbeats with no phantom ninth round, and Done & disarm visibly removed the HUD.

## Incidents and integrity conclusion

- Normal recorder-arm clicks were swallowed during Hard setup; the identical action was promptly retried without changing configuration, after which the authorization/fallback flow succeeded.
- Easy round 6 suffered unusually high map-control latency and was submitted with about 1:04 remaining using the already verified marker; there was no timeout or default.
- Medium round 7 was the sole confirmed offshore-pin failure. It was reported rather than hidden. All subsequent rounds used an additional controlled zoom/correction and explicit named-land verification.
- Some round-result HUDs briefly lagged at REC/SAVING or the previous SAVED count. No result was continued until the current round's save progression was visibly confirmed.
- Every competition was entered exactly once through its supplied private link, completed sequentially, committed exactly once on its final result, held for at least two final recorder heartbeats, and disarmed before the next competition.
- No competition was reloaded while active, and no Grok competition was opened.

The scored benchmark completed cleanly with **25 recorded rounds**, three committed official totals, and a combined official score of **110,273 Pts**.

## Post-run filesystem artifact audit

An independent read-only audit after browser release found exactly 25 round JSON records for model label `gpt-5.6-sol-xhigh-recorded`: 8 Easy, 9 Medium, and 8 Hard, with complete ordered round sequences. They reference exactly three completed recorder sessions:

- Easy: `session-2026-08-13T04-21-38-807Z-b3bea864-cd57-435c-ba9a-e5addfbe4436` — 8/8 complete.
- Medium: `session-2026-08-13T04-51-56-941Z-46241e3f-db20-4f83-b41f-bda36acd1b70` — 9/9 complete.
- Hard: `session-2026-08-13T05-18-17-166Z-f16129bf-8fcc-4c97-8e52-40e11e222563` — 8/8 complete.

All 25 round records report recorder version `0.7.21`, capture method `visible-tab-frame-stream`, source sampling at 2 fps, and output at 15 fps. Every referenced WebM and video-metadata JSON exists. The videos total 524,853,112 bytes (500.54 MiB), and no partial video file remains.
