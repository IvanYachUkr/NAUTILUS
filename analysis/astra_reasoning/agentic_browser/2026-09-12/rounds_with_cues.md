# Astra Low browser runs: coordinates, cues, and decisions

75 valid scored rounds across three runs. Original submitted map-pin coordinates are recoverable for 11 rounds; missing/invalid numeric fields are left blank, not filled with ground truth or newly geocoded place names.

## Run 1 / Easy 1 / loc_001

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Round 1

Initial cues: July Column with gold figure; Place de la Bastille pavement label; Parisian blocks; broad square; curved opera facade. Initial belief Paris, Place de la Bastille, very high confidence.
Provisional: France then Paris, verified marker. Refined to northbound lane beside Opera Bastille bus stops. Final visible marker on roadway south of bus-stop icon; contradiction check consistent with opera right and column ahead.
Submitted with about 2:10 remaining, early because landmark and street alignment resolved. Official distance 7 m, displayed +4862 XP (not assumed competition points). Recorder SAVING 0/8 at first result screenshot.
Controller incidents: map-opening click relocates marker; corrected and reverified. One intended panorama drag panned map; restored. Return button and panorama drag collapsed map successfully.
R1 settled correction: reward finished at +5000 XP; recorder SAVED 1/8. XP is not yet reconciled with competition leaderboard points.

## Run 1 / Easy 2 / loc_002

Coordinate status: `recovered_original_map_click`.

**Submitted map pin:** 52.52050541728094, 13.41489108643459. Recomputed error 18.93 m; report 19.0 m.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Round 2

Initial cues: Berlin TV tower; U Alexanderplatz sign; Galeria; German logistics text; bicycles and tram corridor. Initial belief Berlin Alexanderplatz, very high confidence.
Provisional Germany then Berlin/Alexanderplatz marker verified. Rotation identified Saturn and Haus des Lehrers across junction. Satellite revealed bicycle island between Grunerstrasse carriageways, correcting initial building-side sidewalk interpretation. Final marker visibly on island near nextbike, southeast edge. Submitted ~1:05 remaining after full orientation check.
Official distance 19 m; settled +5000 XP. Result flag was northeast of guessed point. Recorder SAVE ERROR Round 2: prediction JSON saved but video failed; next round will attempt recording; HUD 1/8 saved. Coordinator notified.
Controller incident: reopening collapsed map relocates marker even at apparent layer button; corrected to island and verified immediately before submission.

## Run 1 / Easy 3 / loc_003

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Round 3

Initial cues: Hohensalzburg fortress; river/old town; Alps; stone terrace wall; shingled watchtower. Initial Salzburg Kapuzinerberg belief high city confidence, moderate viewpoint confidence.
Provisional Austria/Salzburg then Basteiweg below Kapuzinerkloster. Refined to a satellite wall bend/turret west along Basteiweg, but incorrectly matched repeated wall architecture. Final pin visibly on west Basteiweg path. Submitted ~0:55 remaining.
Official distance 393 m; settled +4998 XP. Actual flag was farther east along wall above Steingasse. Geographic error: mistaken turret/viewpoint correspondence and insufficient bridge-bearing discrimination, not a controller pin error. Recorder SAVED 2/8; first notice said saved without prediction coordinate, then location saved normally. Screenshot NAUTILUS_ASTRA_LOW_EASY_R3_RESULT_20260906.png saved.

## Run 1 / Easy 4 / loc_004

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Round 4

Initial cues: medieval red roofs; river meander/weir; Gothic spire; saint statue on castle walkway; wooded hills. Initial Cesky Krumlov castle bridge belief very high city/high landmark confidence.
Provisional Czech region then city; located Plastovy most (Cloak Bridge). Rotation confirmed covered arch walkway and south-facing river/town view. Final marker on south/eastern part of bridge, verified in satellite. Submitted ~2:10 remaining because landmark-scale alignment complete.
Official distance 11 m; settled +5000 XP. Recorder SAVED 3/8. Result screenshot NAUTILUS_ASTRA_LOW_EASY_R4_RESULT_20260906.png.

## Run 1 / Easy 5 / loc_005

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Round 5

Initial cues: Roman amphitheatre arcade; Mediterranean landscaped park; yellow roundabout sign; right-driving roadway; coach parking. Initial Pula Arena Croatia high confidence, with Rome rejected by architecture and landscaping.
Provisional Adriatic then Pula city. Matched elongated cobbled island on Starih statuta at Kolodvorska near arena. Rotation established camera looking across island toward arena; refined from southeast to northwest carriageway. Final pin visibly northwest side near midpoint. Submitted ~1:18 remaining after lane check.
Official distance 6 m; settled +5000 XP. Recorder SAVED 4/8. Screenshot NAUTILUS_ASTRA_LOW_EASY_R5_RESULT_20260906.png.

## Run 1 / Easy 6 / loc_006

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Round 6

Initial cues: 178 Zittau PL D sign; B178 pavement label; Granica Panstwa warning; border bridge; flat green surroundings. Initial Zittau/Porajow/Hradek tri-border regional belief high, exact side moderate.
Provisional central Europe then Zittau. Matched B178 Neisse bridge Polish-side Sieniawka roundabout with routes 332/352/354. Bridge northwest and church southwest resolved orientation; corrected west-arc idea to northern arc immediately before northwest exit. Final marker visibly on north arc. Submitted ~1:30 remaining after alignment check.
Official distance 4 m; settled +5000 XP. Recorder SAVED 5/8. Screenshot NAUTILUS_ASTRA_LOW_EASY_R6_RESULT_20260906.png.

## Run 1 / Easy 7 / loc_007

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Round 7

Initial cues: Ljubljana/Novo mesto direction signs; station name appearing Visnja Gora; tiled station roof; wooded hills; Ulica street label. Initial Slovenia high confidence and Visnja Gora moderate-high.
Provisional Slovenia then town. Located station north of old town; zoomed panorama confirmed VISNJA GORA and Ulica Antona Tomsica. Final pin southeast station forecourt access, visually verified. Submitted ~2:20 remaining because station/street resolved.
Official distance 13 m; settled +5000 XP. Actual flag nearer roadside southeast than chosen forecourt point. Recorder SAVE ERROR Round 7, prediction JSON saved but video failed; HUD 5/8. Screenshot NAUTILUS_ASTRA_LOW_EASY_R7_RESULT_20260906.png.

## Run 1 / Easy 8 / loc_008

Coordinate status: `recovered_original_map_click`.

**Submitted map pin:** 60.86373182701154, 7.114743731772491. Recomputed error 176.68 m; report 177.0 m.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Easy R8 — Flåm, Norway

Initial visible cues: FLÅM gate, Norwegian flag, steep fjord mountains, waterfront fencing, timber picnic shelter. Initial belief Flåm harbor, high confidence. Provisional Norway marker corrected to Flåm after map inertia/control delay. Final persisted marker parking area west of Flåm harbor; intended refinement toward harbor did not complete. Result 177 m, settled +4999 XP; recorder SAVED 6/8. Controller incident: context transition consumed remaining time and round auto-submitted with a valid marker. This was not an intentional early submission.
Screenshot: NAUTILUS_ASTRA_LOW_EASY_R8_RESULT_20260906.png.

## Run 1 / Medium 1 / loc_009

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Medium R1 — Valencia

Initial cues: pavement street label initially misread Borriana, Spanish recycling bins, ornate balconies, leafy flat street, Generali office. Initial Valencia moderate confidence. Provisional city marker verified, refined with rotated pavement labels to Carrer de Ciscar / Carrer del Comte d'Altea. Final pin just southeast of crossing; contradiction check street geometry consistent. Submitted about 1:10 remaining because exact crossing verified. Result 4 m, +5000 XP, SAVED 1/9. One CDP drag timeout recovered; map inertia required reorientation. Screenshot NAUTILUS_ASTRA_LOW_MEDIUM_R1_RESULT_20260906.png.

## Run 1 / Medium 2 / loc_010

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Medium R2 — Bologna

Initial cues: Via Francesco pavement text, Italian plates, brick villas with green shutters, lime trees, recycling bins. Italy high confidence, Bologna low-moderate. Provisional Bologna verified. Explored several blocks to main road but unreadable plaque and incomplete street label prevented exact refinement. Final southern Bologna residential pin near Via Cino da Pistoia. Result 1,129 m, +4994 XP, SAVED 2/9; true result flag Via Francesco Roncati. Submitted about 0:20 remaining. Geographic street-identification error, plus map-opening marker displacement corrected before submission. Screenshot NAUTILUS_ASTRA_LOW_MEDIUM_R2_RESULT_20260906.png.

## Run 1 / Medium 3 / loc_011

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Medium R3 — Utrecht

Initial cues: Amsterdamsestraatweg, Dutch plates, red cycleway, bicycle parking, shop initially misread as photo shop. Utrecht high-moderate confidence. Provisional city then road marker verified. Rotation/zoom revealed Fysio Holland/Medicort and numbers 642-646; refined northwest along arterial. Final pin by Huisartsenpraktijk near Dieselweg, actual 349 m farther northwest at Gezondheidscentrum de Brug. Result 349 m, +4998 XP, SAVED 3/9. Submitted ~0:15 remaining; geographic frontage mismatch. Screenshot NAUTILUS_ASTRA_LOW_MEDIUM_R3_RESULT_20260906.png.

## Run 1 / Medium 4 / loc_012

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Medium R4 — Merelbeke, Belgium

Initial cues: N444, Foto Aktief, Belgian plates, brick houses, red paths. Flanders high confidence, Ghent outskirts moderate. Provisional N444 south Ghent verified; map located corridor through Kwenenbos. Explored north past florist and Spar, scanned map northward but stopped 628 m short of Foto Aktief. Final N444 near Compudat, submitted ~0:08. Result 628 m, +4997 XP, SAVED 4/9. Geographic exact-frontage miss; no timeout. Screenshot NAUTILUS_ASTRA_LOW_MEDIUM_R4_RESULT_20260906.png.

## Run 1 / Medium 5 / loc_013

Coordinate status: `recovered_original_map_click`.

**Submitted map pin:** 40.21565485891969, -8.43404862081963. Recomputed error 26.13 m; report 26.0 m.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Medium R5 — Coimbra

Initial cues: R. Figueira da Foz, Portuguese plates and Privativo sign, granite trim, tiled facade, old urban street. Portugal high, Coimbra moderate-low initially. Street located in Santa Cruz; provisional city then street pin verified. Final marker at southern parking access, building geometry interpretation placed it 26 m west of actual. Submitted ~0:28. Result 26 m, +5000 XP, SAVED 5/9. Screenshot NAUTILUS_ASTRA_LOW_MEDIUM_R5_RESULT_20260906.png.

## Run 1 / Medium 6 / loc_014

Coordinate status: `recovered_original_map_click`.

**Submitted map pin:** 59.28654465773255, 15.227031825233727. Recomputed error 148227.46 m; report 148200.0 m.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Medium R6 — Sweden, city miss

Initial cues: Bergagatan, Swedish wood houses/red tiles, white EU plates, hedges, unmarked residential lane. Sweden high confidence, Örebro low regional hypothesis. Provisional Örebro verified, movement reached Birkagatan but no city name found. Final northern Örebro residential pin, no street-pair match. Submitted ~0:25. Result 148.2 km, +4311 XP, SAVED 6/9; actual Uppsala. Geographic city error. Screenshot NAUTILUS_ASTRA_LOW_MEDIUM_R6_RESULT_20260906.png.

## Run 1 / Medium 7 / loc_015

Coordinate status: `recovered_original_map_click`.

**Submitted map pin:** 58.35263685839751, 26.724959512922894. Recomputed error 611.16 m; report 611.0 m.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Medium R7 — Tartu

Initial cues: Sepakuru tn, gabled homes, patched road, timber poles, metal fences. Estonia high, Tartu moderate. Provisional Tartu then Ropka map refinement; failed to reach Sepakuru south of Sepa. Final Jalakakuru residential pin. Result 611 m, +4997 XP. Recorder SAVE ERROR: JSON saved, video failed, HUD 6/9. Controller incident: repeated map operations took 3-10 seconds; last screenshot 0:11 but submit click opened result rounds overlay, suggesting timer expired before click landed. Valid intended pin persisted. Geographic street miss separately. Screenshot NAUTILUS_ASTRA_LOW_MEDIUM_R7_RESULT_20260906.png.

## Run 1 / Medium 8 / loc_016

Coordinate status: `no_original_numeric_prediction_recovered`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Medium R8 — Banská Bystrica recognition, controller miss

Initial cues: Jelšová, plaster houses/steep roofs, wooded hills, patched lane, utility poles. Slovakia moderate-high, Žilina provisional. Movement reached Kostiviarska and route 59 signs Zvolen/Ružomberok at ~1:38, correctly revised belief to northern Banská Bystrica. Map correction reached Sliač region, but slow map controls and insufficient remaining margin caused timeout before final city pin. Actual persisted marker Sliač; intended northern Banská Bystrica. Result 16.8 km, +4917 XP. Controller error distinct from final geographic belief. Recorder VIDEO ERROR target tab inactive, HUD 6/9. Screenshot NAUTILUS_ASTRA_LOW_MEDIUM_R8_RESULT_20260906.png.

## Run 1 / Medium 9 / loc_017

Coordinate status: `no_original_numeric_prediction_recovered`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Medium R9

Initial cues: yellow dashed road edges, left-driving layout, stone boundary walls, white detached houses, lush Atlantic vegetation. Ireland high confidence; Galway region low-moderate. Provisional Galway pin visually verified on national map. Road exploration exposed L1322 road overlay but no decisive city clue. Submitted manually with approximately 0:40 remaining. Final geographic belief Galway outskirts; actual marker was off Salthill coast (national-scale placement limitation). Result 4,915 m, settled +4975 XP; actual Boleybeg East west of Galway. Recorder VIDEO ERROR, target tab not active, HUD 6/9 saved. Result screenshot preserved.

## Run 1 / Hard 1 / loc_018

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Hard setup and R1

Recorder visibly configured European Evaluation Hard, model gpt-6-astra-low-r1-20260906, Interactive panorama; automatic fallback ARMED0 before Confirm.
Initial cues: Greek road overlay, narrow unmarked asphalt, rocky limestone shoulders, cypress/evergreen scrub, dry Mediterranean landscape. Greece high confidence, Rhodes tentative low-confidence initial island hypothesis; provisional Rhodes marker verified. Road-name reading exposed Paraliou Astrous and revised belief to eastern Peloponnese. Final pin visually verified west of Agios Ioannis on rural approach (slightly off road at finer result scale). Submitted ~0:55 remaining. Result 2,454 m, +4988 XP; actual Tripolis-Paraliou Astrous road near Tsalianika Kalivia. Geographic refinement incomplete, no timeout/controller incident. Recorder SAVED1/8. Result PNG preserved.

## Run 1 / Hard 2 / loc_019

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Hard R2

Initial cues: narrow faded dashed-center road, timber barn/tile roof, rolling pastoral hills, overhead wires and simple lamp, sparse village. Romania/Transylvania moderate confidence; provisional central Transylvania verified. Exploration confirmed rural Romanian architecture and exposed DJ106S overlay. Final regional guess north of Fagaras near Lovnic, visually verified; actual Vurpar northeast of Sibiu. Result 53.8 km, +4738 XP. Submitted ~0:50 remaining. Geographic county-road localization failure. Controller map drag overshot dramatically during provisional placement but recovered via zoom-out/recenter, no timeout. Recorder SAVED2/8. Result PNG preserved.

## Run 1 / Hard 3 / loc_020

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Hard R3

Initial cues: steep wooded hills, unmarked narrow village asphalt, hipped roofs/plaster houses, overhead wires, metal bridge railing/blue water fixture. Balkan village, Bulgaria Rhodope moderate-low initial confidence. Provisional Smolyan/Rudozem area verified. Explored numerous houses and bends; no readable locality name. Final regional village choice Taran, visually verified, retained Bulgaria/Rhodope belief. Actual Varbina, 7.9 km away; +4961 XP. Submitted ~1:00 remaining with controller margin. No controller incident. Recorder SAVED3/8. Result PNG preserved.

## Run 1 / Hard 4 / loc_021

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Hard R4

Initial cues: flat sunflower/wheat/maize farmland, thin concrete utility poles, grassy roadside, narrow asphalt. Pannonian basin/Hungary low-moderate; central Hungary provisional verified. Rotation exposed +36 phone and road451 (initially read45), confirming Hungary. Map localized451 between Gater and Csongrad; final regional segment pin verified, slightly offroad at finer result scale. Continued road exploration found no further decisive sign. Submitted ~0:55. Result424m, +4998XP. Correct corridor and fortuitously close segment despite no street-exact identification. Recorder SAVED4/8. No timeout. Result PNG preserved.

## Run 1 / Hard 5 / loc_022

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Hard R5

Initial cues: twin-track gravel/grass-center lane, dense deciduous/birch hedge, flat terrain, no structures or signs, temperate summer vegetation. Northeast Poland/Baltic low confidence. Provisional northeastern Poland south of Augustow verified. Extended forward exploration remained featureless scrub/young forest; retained low-confidence regional pin with no invented street precision. Submitted~0:55. Actual northern Latvia southeast of Valmiera,471.5km,+3120XP. Geographic country-choice failure. Map framing consumed substantial initial time but no timeout. Recorder SAVED5/8. Result PNG preserved.

## Run 1 / Hard 6 / loc_023

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md` — Hard R6

Initial cues: wide pale gravel road, visible3426 overlay, flat arable land, ruined white farm structure, mixed forest horizon. Lithuania high-moderate from road numbering; central/northern Lithuania tentative. Map unexpectedly collapsed during initial near-edge placement and caused unintended panorama interaction before valid provisional verification; detected and corrected, central Lithuania marker verified. Scanned Radviliskis/Baisogala region, found3426 near Vakarai/Vaiciaiciai. Final marker on3426 verified. Submitted~1:00. Result905m,+4995XP, actual farther southeast on same road. Geographic segment refinement incomplete; controller collapse cost time but no timeout. Recorder SAVED6/8. Result PNG preserved.

## Run 1 / Hard 7 / loc_024

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_HARD_FINAL2_20260907.md` — Round 1 initial

Five cues: narrow unmarked asphalt road; exceptionally flat farmland; low coastal-looking horizon vegetation; distant wind turbines; rendered road label Skalvej. Initial belief: western Denmark, moderate confidence (65%).
Provisional pin visually verified on Jutland with 3:33 remaining. Map initially placed an accidental ocean pin during expansion; corrected before exploration.
Final belief: west Jutland coastal farmland, Nissum Fjord/Fjand area (country confidence 85%, local confidence 25%). Persisted red pin visually verified at Norre Fjand, north of Sonder Nissum. Map remained expanded and obstructed panorama; accidental second ocean pin corrected. Manual submission with about 1:20 remaining.
Result: 32 km; settled reward display +4842 XP (official points to verify on leaderboard). Actual flag near Harboore, north of guessed Norre Fjand. Recorder SAVED Round 1, 1/8 shown despite two-round competition.

## Run 1 / Hard 8 / loc_025

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_HARD_FINAL2_20260907.md` — Round 2 initial

Five cues: double solid white centre lines; narrow white edge lines; mixed pine/birch forest; gently rolling road; no nearby buildings or signs. Initial belief rural Sweden, 60% confidence (Finland/Baltics alternatives).
Provisional red pin verified in central Sweden with 3:46 remaining.
Final belief: Dalarna, central Sweden; country confidence 65%, local confidence 15%. Forest exploration produced no readable signs or buildings. Persisted red pin visually verified at Insjon south of Leksand. Map remained enlarged; no timeout risk, and intended final region matches pin.
Result: 762.5 km; settled reward +2332 XP. Actual flag east of Oulu, Finland. Error was country/region inference, not persisted-pin mismatch. Recorder SAVED Round 2, 2/8 HUD. Submitted manually with about 1:45 remaining.

## Run 2 / Easy 1 / loc_001

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Easy R1

Initial five cues: Bastille bus-stop text; green column with gold figure; curved modern opera facade; Parisian mansard blocks; broad right-driving urban square with bus lanes. Initial belief: Place de la Bastille, Paris, 99%.
Final: road along west side of Opera Bastille, south of column. Marker visually verified on Pl. de la Bastille near opera southwest corner; contradiction check matches column ahead and opera right. Controller: opening map initially placed Africa pin; corrected immediately; map tile/zoom lag required fresh screenshot. No panorama movement needed.
Settled result: 20 m, 5000 XP. Recorder SAVED 1/8.

## Run 2 / Easy 2 / loc_002

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Easy R2

Initial five cues: Berlin TV tower; Alexanderplatz U sign; German Spedition text; yellow transit vehicles; Galeria and tall modernist blocks. Initial belief: Alexanderplatz Berlin, 99%.
Final belief: southeast side of Alexanderhaus on Alexanderstrasse, facing northwest. Pin verified across road southeast of UNIQLO building. Tower/railway left and Park Inn right support orientation; no contradictory city clues. Controller: map opening again made temporary Africa pin; corrected to Germany then Berlin.
Settled result: 31 m, 5000 XP. SAVE ERROR: prediction JSON saved, video failed; HUD 1/8. Parent notified, continue.

## Run 2 / Easy 3 / loc_003

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Easy R3

Initial five cues: Hohensalzburg-like fortress on hill; alpine mountains behind; river through baroque city; stone lookout wall and shingle turret; dense pastel central-European roofs. Initial belief: Salzburg, Kapuzinerberg overlook, 97%.
Final: Aussichtsplatz Klostermauer on south Basteiweg, Kapuzinerberg. Verified pin on labeled overlook. River and fortress bearing agree; exact turret uncertain, confidence 85% on lookout. No panorama movement.
Settled result: 313 m, 4998 XP; actual farther east along Basteiweg. Recorder SAVED 2/8, recovered.

## Run 2 / Easy 4 / loc_004

Coordinate status: `recovered_original_map_click`.

**Submitted map pin:** 48.81265123065117, 14.312995866423003. Recomputed error 5.63 m; report 6.0 m.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Easy R4

Initial five cues: saint statue holding cross; elevated castle passage; red-roof town in river bend; weir below; pointed Gothic church and wooded hills. Initial belief: Cesky Krumlov castle Cloak Bridge, Czechia, 98%.
Final: Plastovy most (Cloak Bridge), east end beside castle. Verified marker on labeled bridge; river bend/church view agrees. Confidence 95% exact bridge.
Settled result: 6 m, 5000 XP. SAVE ERROR JSON saved/video failed, HUD 2/8; parent notified.

## Run 2 / Easy 5 / loc_005

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Easy R5

Initial five cues: intact Roman amphitheatre outer wall; landscaped Mediterranean park; yellow directional sign; right-side traffic; broad coach-access road and cypress trees. Initial belief: Pula Arena, Croatia, 97%.
Final: north approach to arena, branch between waterfront roundabout and Flavijevska/Istarska. Marker verified on road north-northwest of arena. Arena left and landscaped park right fit southerly heading; precise branch uncertain (75%).
Settled result: 29 m, 5000 XP. Recorder SAVED 3/8.

## Run 2 / Easy 6 / loc_006

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Easy R6

Initial five cues: Zittau sign with PL/D country ovals; B178 road overlay; Polish Granica Panstwa warning; bridge immediately right; low green river plain and European roundabout. Initial belief: Polish/German border east of Zittau on 178 connection, 95%.
New clue after rotation: Sieniawka sign; resolves Polish side of northern B178 bridge. Final pin verified north arc of roundabout immediately east of Neisse bridge on B178/352/354. Contradiction check: Polish warning and German route designation fit cross-border link. Controller: panorama drag crossed expanded map and panned it accidentally; recovered by zooming out, then reverified final pin.
Settled result: 5 m, 5000 XP. Recorder SAVED 4/8.

## Run 2 / Easy 7 / loc_007

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Easy R7

Initial five cues: Ljubljana and Novo mesto yellow signs; station name appears IVANCNA GORICA; railway platform; wooded low hills; Slovenian-style white village buildings/red tiles. Initial belief: Ivancna Gorica station, Slovenia, 96%.
Decisive correction: zoom/rotation clearly reads VISNJA GORA, not initial Ivancna Gorica. Ulica Antona Tomsica street sign agrees. Final verified pin at southeast station driveway on Ulica Antona Tomsica in Visnja Gora. Confidence 98%; initial town contradicted by enlarged sign, corrected before submission.
Settled result: 9 m, 5000 XP. Recorder SAVED 5/8.

## Run 2 / Easy 8 / loc_008

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Easy R8

Initial five cues: FLAM gate lettering; steep fjord walls; waterfront terminal fence; Norwegian-looking flag; timber visitor picnic shelter and barrels. Initial belief: Flam waterfront, Norway, 99%.
Final: Flam Port near northeastern visitor area, marker verified west of labeled port point. Fjord north and cliff west agree; exact terminal gate uncertain (80%).
Settled result: 80 m, 5000 XP. Recorder SAVED 6/8.

## Run 2 / Medium 1 / loc_009

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Medium R1

Initial five cues: Carrer de Ciscar road overlay; Mediterranean balconies and arched first floor; Spanish-style recycling containers; Generali storefront; broad tree-lined grid street with ornate dark lamps. Initial belief: Valencia Eixample, Spain, 85% (Catalan/Valencian street language).
Final: Carrer de Ciscar / Carrer de Borriana, Valencia. Visible Meat Market map business potentially matches M storefront; pin verified at junction. City/street confidence 98%, intersection 65%; no contradictory regional cues. Map took several zoom levels to expose road labels.
Settled result: 137 m, 4999 XP. Actual previous candidate Ciscar/Conde Altea; final refinement worsened by one block. Recorder SAVED 1.

## Run 2 / Medium 2 / loc_010

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Medium R2

Initial five cues: Via Francesco road overlay; Italian tricolor-edged plates and parking sign; red-brick villas with green shutters; large plane/linden street trees; Italian metal recycling bins. Initial belief: northern Italy, Bologna residential district, 50%.
Decisive new clue: street plaque Francesco Roncati and Rodolfo Audinot, matching southwest Bologna. Final pin verified on Via Francesco Roncati between Via Alessandro Guidotti and Via Rodolfo Audinot; initial position offset uncertain. City/street 99%, exact block 80%. Controller map overlay hampered sign reading; rotated panorama in exposed left region.
Settled result: 94 m, 5000 XP. Actual west of Guidotti. Recorder SAVED 2/9.

## Run 2 / Medium 3 / loc_011

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Medium R3

Initial five cues: Amsterdamsestraatweg overlay; yellow Dutch plates; red segregated cycle path; Fiets Holland shop; low brick Dutch urban blocks with traffic islands. Initial belief: Utrecht Amsterdamsestraatweg, Netherlands, 90%.
Final: Amsterdamsestraatweg near Oppenheimplein, Utrecht. Road and country clear; storefront not found on map, exact block low confidence 30%. Pin verified on named road; broad cycle-lane corridor agrees but no decisive address.
Settled result: 1,355 m, 4993 XP. Actual north of selected segment near F. Koolhovenstraat. Recorder SAVED 3/9.

## Run 2 / Medium 4 / loc_012

Coordinate status: `recovered_original_map_click`.

**Submitted map pin:** 50.98135894153692, 3.744757903039316. Recomputed error 687.87 m; report 688.0 m.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Medium R4

Initial five cues: N44 road overlay; FOTO AKTIEF Dutch shop sign; Belgian white plates; red-brick ribbon houses with dark tiles; narrow red cycle lanes and overhead cables. Initial belief: Belgian Flanders, N44 near Aalter/Knesselare, 85%.
New clue: rotated road overlay resolves N444 (three digits), contradicting initial N44. Shift to south Ghent/Merelbeke corridor.
Final: N444 Hundelgemsesteenweg south of Merelbeke center, near Compudat/Supermarkt Maranni. Exact shop not found; regional confidence 75%, segment 25%. Road number now agrees, ribbon housing plausible; initial Aalter hypothesis rejected. Pin verified on N444.
Settled result: 688 m, 4997 XP. Actual Foto Aktief farther north near Bergbosstraat. Recorder SAVED 4/9.

## Run 2 / Medium 5 / loc_013

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Medium R5

Initial five cues: R. Figueira da F... road overlay; Portuguese yellow-edge plates; PRIVATIVO parking sign; granite-trim plaster buildings and iron balconies; dense sloping-looking older Portuguese street. Initial belief: Coimbra, Rua da Figueira da Foz, Portugal, 65%.
Final: Rua Figueira da Foz near TiDelicia, Coimbra. Street name located directly on map; initial left storefront resembles Delicia label and parking forecourt matches broad south-side property. Pin verified east of TiDelicia. Confidence city/street 98%, exact position 70%; no contradictory regional cue.
Settled result: 68 m, 5000 XP. Actual east on same block. Recorder SAVED 5/9.

## Run 2 / Medium 6 / loc_014

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Medium R6

Initial five cues: Bergagatan road overlay; green vertical timber siding; red tile roofs; white Scandinavian plates; quiet residential lane with clipped hedges and low multi-family blocks beyond. Initial belief: Sweden, southern/central small city, 70%; tentative Linkoping area 15%.
Movement reached cross street Birkagatan. Swedish 1930s garden-suburb housing suggests Uppsala Kungsgardet as alternative; weak city evidence.
Final: west Uppsala near Kungsgardet/Ekeby, weak regional guess. Bergagatan and Birkagatan not located on map; city uncertain (20%), Sweden high confidence (95%). Marker verified in Uppsala. Movement yielded only cross street, no city sign; no false exact-location claim.
Settled result: 536 m, 4997 XP. Actual Bergagatan in same west Uppsala neighborhood; regional architectural inference correct despite low confidence. Recorder SAVED 6/9.

## Run 2 / Medium 7 / loc_015

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Medium R7

Initial five cues: Sepakuru road overlay; steep plaster/wood gabled homes; narrow patched asphalt without centerline; Estonian-looking low picket fences; northern European vegetation and white plates. Initial belief: Estonia, Tartu southern residential area, 60%; Tallinn alternative.
Final: Sepakuru tn, Tartu, north-south segment just north of eastward branch, opposite building 9a. Street found on map; east-side long modern building and west detached houses match panorama. Marker visually verified; city/street confidence 99%, exact house 75%. No panorama movement needed.
Settled result: 257 m, 4999 XP. Actual southern end of Sepakuru; wrong branch segment selected. Recorder SAVED 7/9.

## Run 2 / Medium 8 / loc_016

Coordinate status: `recovered_original_map_click`.

**Submitted map pin:** 49.20414873375578, 18.722202473531173. Recomputed error 58242.66 m; report 58200.0 m.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Medium R8

Initial five cues: Jelsova with Slovak-style diacritics road overlay; detached plaster houses with steep dark roofs; wooded Carpathian ridge; concrete utility poles; narrow patched residential road and wire/metal fences. Initial belief: Slovakia, northern valley near Zilina, 55%.
Final: Banova district, Zilina, near Jedlova. Jelsova not found; selected regional fallback from northern Slovak architecture and terrain. Country confidence 90%, city 35%, street very low. Main-road movement did not yield readable locality; marker verified in Zilina.
Settled result: 58.2 km, 4717 XP. Actual Banska Bystrica. Timer expired with verified regional marker; attempted Guess clicked result rounds button, dismissed. Recorder SAVED 8/9.

## Run 2 / Medium 9 / loc_017

Coordinate status: `recovered_original_map_click`.

**Submitted map pin:** 53.27622892354557, -9.092226893398921. Recomputed error 3126.67 m; report 3127.0 m.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Medium R9

Initial five cues: yellow dashed edge lines; left-driving road layout; stone boundary walls; white detached bungalows and damp green vegetation; Irish-style overhead utilities and broad rural/suburban curve. Initial belief: Ireland, Galway outskirts, 55%.
Decisive sign: Rahoon/Newcastle visible on roadside poster, supports Galway west/northwest.
Final: Rahoon Road immediately west of Rahoon Cemetery, Galway. Rahoon/Newcastle poster confirms district; chosen curve matches broad roadside bend but exact house unverified (50%). Pin verified on Rahoon Road; city confidence 95%.
Settled result: 3,127 m, 4984 XP. Actual Boleybeg East on same western road corridor. Recorder competition recorded 9/9.

## Run 2 / Hard 1 / loc_018

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Hard R1

Initial five cues: Greek-script Epar. Od. road overlay; dry rocky pale ground; low evergreen/juniper woodland; narrow gray rural road with white edge lines; white coach ahead and low flat horizon. Initial belief: Greece, island interior possibly Rhodes, 60%.
Final: northern Rhodes interior, road east of Butterfly Valley toward Psinthos/Maritsa. Overlay appears to include Paradisi, supporting Rhodes; full route not confidently resolved. Chosen plateau road rather than steep Butterfly Valley bends; island confidence 80%, exact road 35%. Pin verified on road.
Settled result: 501.9 km, 3026 XP. Actual central Peloponnese; partial Greek-name interpretation was wrong. Recorder SAVED 1/8.

## Run 2 / Hard 2 / loc_019

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Hard R2

Initial five cues: narrow paved road with faded dashed white center; timber barn over brick/plaster base; green rolling pasture and distant mountains; simple wire fence posts; sparse utility poles and pedestrians by rural lane. Initial belief: Romania, Transylvania foothills, 45%; Slovakia/Hungary alternatives.
Final: road 132B south of Cata near Rupea, Transylvania. New closer view of slotted concrete utility poles and village houses strengthens Romania (90%); no readable locality obtained. Regional confidence 40%, exact road low. Marker verified on rural road; creek crossing and pastoral hills broadly agree.
Settled result: 75.4 km, 4637 XP. Actual Vulpar northeast of Sibiu; correct broad Transylvania region. Recorder SAVED 2/8.

## Run 2 / Hard 3 / loc_020

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Hard R3

Initial five cues: narrow unmarked hillside road; gray metal communal bins; white plaster two/three-story homes with red roofs; wooded rounded mountains and green valley; thin utility wires and simple concrete curb/bridge railing. Initial belief: Bulgaria Rhodope mountains, 50%; Bosnia/Serbia alternatives.

Hard R3 refinement: stone retaining walls, timber/plaster vernacular and densely wooded rounded mountains support Rhodope village; no readable sign obtained. Final Shiroka Laka Bulgaria, confidence 45%. Marker verified before submission.
Hard R3 result: 35 km, 4828 XP. Actual Varbina Bulgaria. Recorder SAVED 3/8.

## Run 2 / Hard 4 / loc_021

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Hard R4 (unheaded notes)

Hard R4 initial cues: (1) very flat horizon (2) sunflower field (3) narrow cereal/maize strips (4) unmarked asphalt edge with grassy ditch (5) sparse concrete-looking utility poles and distant low settlement. Initial belief Hungary/Serbia/Romania agricultural plain; Hungary 40%.
Hard R4 update: visible panorama road label 451 and van phone +36 confirm Hungary. Searching map for route451 around Csongrad/Szentes.
Hard R4 final: route451 east of Gater near county boundary, flat fields and NE/SW road alignment; exact position unresolved. Confidence95% road,30% segment. Marker verified on451.
Hard R4 result: 2276m,4989XP. RecorderSAVED4/8.

## Run 2 / Hard 5 / loc_022

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Hard R5 (unheaded notes)

Hard R5 initial cues: (1) straight narrow gravel two-track (2) grass center (3) dense deciduous hedges and poplar/aspen (4) flat terrain (5) no buildings, signs or poles. Initial belief Baltic rural road, Lithuania/Latvia45%, Poland20%, other northernEurope35%.
Hard R5 final: numerous moves reveal only young deciduous scrub, grassy graveltrack and flat horizon. No uniquely identifying cue. Chose rural Latvia between Baldone and Vecumnieki as broad Baltic hedge, confidence25% country and verylow local. Marker verified.
Hard R5 result:118.4km,4442XP. Actual northeast Latvia near Jaunpiebalga. RecorderSAVED5/8.

## Run 2 / Hard 6 / loc_023

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Hard R6 (unheaded notes)

Hard R6 initial cues: (1) gravel broad ruralroad (2) visible road3426 (3) flat cropfields (4) abandoned white agricultural building (5) mixed deciduous/conifer windbreak and utility poles. Initial Lithuania80% due4digit ruralroad, likely northcentral area; locationuncertain.
Hard R6 update: found3426 on visible map south of Baisogala near Vakarai. Choosing straight NW/SE segment northwest of Vakarai; road95% confidence, exactpoint30%.
Hard R6 result2740m,4986XP. Actual3426 northwest of Sabiskiai. RecorderSAVED6/8.

## Run 2 / Hard 7 / loc_024

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Hard R7 (unheaded notes)

Hard R7 initial cues: (1) road label Skalvej (2) singlelane clean unmarked asphalt (3) flat broad farmland (4) windturbines distantleft (5) low grassy dunes/ridge right with coastal open sky. Initial Denmark95%, westernJutland65%, exactvillageunknown.
Hard R7 final: visible Skalvej, flat coastal fields and dunes, no readable settlement sign. Searched westernJutland map but did not match street. Chose near Husby/Vederso coast, confidence95%Denmark,40%region,lowlocal.
Hard R7 result38.8km,4809XP. ActualnearHarboore; initialregionalpinwasbetterthanfinal. RecorderSAVED7/8.

## Run 2 / Hard 8 / loc_025

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md` — Hard R8 (unheaded notes)

Hard R8 initial cues: (1) dense pine/birch forest (2) double solid white centerlines (3) solid white edgelines (4) gently rolling curve (5) black vehicle hood visible and few roadside fixtures. Initial Finland50%, Sweden30%, Poland/Baltics20%; provisional southernFinland.
Hard R8 final: repeated moves show mixed pine/birch forest, gently rolling narrow paved road, no readable signs or unique structures. Retained southernFinland nearSysma/Liikola, confidence55%country, verylowlocal. Marker verified.
Hard R8 result380.5km,3417XP. ActualeastofOulu Finland. RecorderCompetitionrecorded8/8roundssaved.

## Run 3 / Easy 1 / loc_001

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_20260907.md` — Round 1

Initial cues: green monumental column with golden figure; Bastille bus-stop label; curved modern opera facade; Parisian street lamps; French road marking Place de la Bastille. Initial belief: Paris Bastille, 99%.
Final belief: south-east approach to Bastille column beside Opera, 99%. Pin visually verified on Place de la Bastille south-east road; no contradictory cues. Map animations required settled screenshots; initial coarse pin was south of Paris and corrected.
Result: 78 m, 5000 XP. HUD SAVED 1/8.

## Run 3 / Easy 2 / loc_002

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_20260907.md` — Round 2

Initial cues: Berlin television tower; Alexanderplatz U sign; German logistics truck; Galeria department store; broad plaza and bicycle racks. Initial belief: Berlin Alexanderplatz, 99%.
Final belief: southeast side of Alexanderplatz near Alexanderstrasse/Otto-Braun-Strasse, 95%. Tower, Galeria, rail line and Alexanderhaus geometry agree. Final marker verified on southeast sidewalk of junction; no contradiction.
Result: 4 m, 5000 XP. HUD SAVED 2/8.

## Run 3 / Easy 3 / loc_003

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_20260907.md` — Round 3

Initial cues: Hohensalzburg-style hill fortress; Alpine mountain backdrop; river below; baroque church domes and old town; stone defensive wall viewpoint with shingled turret. Initial belief: Salzburg from Kapuzinerberg, 98%.
Final belief: Basteiweg/Aussichtsplatz Klostermauer on Kapuzinerberg, 95%. River and fortress align; pin verified on named viewpoint above Steingasse. Contradiction check: viewpoint elevation and defensive wall fit. Map drag overshoot corrected before submission.
Result: 314 m, 4998 XP. SAVE ERROR Round 3: prediction JSON saved, round video failed; HUD 2/8 saved.

## Run 3 / Easy 4 / loc_004

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_20260907.md` — Round 4

Initial cues: dense red-roof medieval town; river meander with weir; stone saint statue; castle terrace above river; narrow Gothic church spire among wooded hills. Initial belief: Cesky Krumlov castle bridge, 98%.
Final belief: Plastovy most castle bridge, 98%. Named historic bridge with castle/city views matches statue and building; pin visually verified at bridge. No contradictory cues.
Result: 16 m, 5000 XP. SAVE ERROR Round 4: JSON saved, video failed; HUD 2/8.

## Run 3 / Easy 5 / loc_005

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_20260907.md` — Round 5

Initial cues: Roman amphitheatre with pale arched outer wall; manicured Mediterranean park; cypress trees; yellow directional road sign; compact European roundabout with tour bus. Initial belief: Pula Arena Croatia, 95%.
Final belief: north-west Arena roundabout beside Valerijin park, 80% exact approach, 99% city. Provisional marker retained and visually verified north-west of Arena. Compared southern junction but geometry less convincing; remaining orientation uncertainty.
Result: 95 m, 5000 XP. HUD SAVED 3/8; recording recovered this round.

## Run 3 / Easy 6 / loc_006

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_20260907.md` — Round 6

Initial cues: Zittau destination sign; route 178/B178; PL and D country ovals; Polish Granica Panstwa border warning; bridge beside roundabout and yellow railings. Initial belief: Polish-German crossing east of Zittau on B178, 98%.
Final belief: Polish side of B178 bridge at Sieniawka, west arm of roundabout, 97%. Visible Granica Panstwa sign faces bridge; map B178 river crossing and roundabout fit. Rejected Czech-side alternative after route geometry. Pin visually verified at western exit.
Result: 26 m, 5000 XP. HUD SAVED 4/8.

## Run 3 / Easy 7 / loc_007

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_20260907.md` — Round 7

Initial cues: Ljubljana yellow directional sign; Novo mesto sign; station building label IVANCNA GORICA; red tile roof; wooded hills with small railway station and crossing. Initial belief: Ivancna Gorica Slovenia railway station, 99%.
Decisive correction before submission: rereading the visible station label gives VISNJA GORA, not Ivancna Gorica. Ivancna map layout contradicted hillside narrow road, prompting correction.
Final belief: Visnja Gora station entrance at Ulica Antona Tomsica/Ciglerjeva, 99%. Corrected pin verified south of station at access road, matching visible Ulica Antona road text and station ahead. Initial town identification corrected.
Result: 13 m, 5000 XP. HUD SAVED 5/8.

## Run 3 / Easy 8 / loc_008

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_20260907.md` — Round 8

Initial cues: FLAM gates; steep fjord walls; Norwegian flag; waterside tourist picnic area; timber shelter and barrel barriers. Initial belief: Flam Norway harbor, 99%.
Final belief: Flam port near Viking Handcraft and Flamsbrygga, 96%. Shelter and tourist gate agree with mapped waterfront facilities. Pin verified on A-Feltvegen east of Viking Handcraft; no contradictory cues.
Result: 60 m, 5000 XP. SAVE ERROR Round 8: JSON saved, video failed; HUD 5/8.

Easy official leaderboard: Ivan Iachnyk 39,998 points, rank 1. Reconciles 7 x 5000 + 4998. Recorded videos HUD 5/8; failures R3, R4, R8 with JSON saved.

## Run 3 / Medium 1 / loc_009

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_CLEAN_20260907.md` — Medium R1

Initial five cues: Carrer de Girona street label, dense pale apartment blocks, balconies, leafy street trees, large curbside recycling bins. Initial belief Barcelona, Spain; high confidence city, low exact street position.
New clue: clearer road overlay reads Carrer de Corsega, correcting initial Girona reading. Barcelona remains high confidence. Provisional marker visually verified on Girona near Arago before correction.
Final belief Barcelona Eixample near Corsega; high city confidence, medium street confidence. Marker visually persisted north of La Pedrera near Verdaguer, matching intended neighborhood. Contradiction check: uncertain street reading prevents exact claim; no country contradiction.
Result: 303.2 km, 3692 XP settled; truth shown Valencia. Recorder SAVED 1/9. Main error: premature Barcelona inference from Catalan street label; actual wording misread.

## Run 3 / Medium 2 / loc_010

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_CLEAN_20260907.md` — Medium R2

Initial five cues: Via Francesco road label, red brick residential buildings, green shutters, large recycling containers, leafy flat street with Italian-style parking sign. Initial belief northern Italy, Bologna plausible; medium country confidence, low city confidence.
Decisive clue: road overlay resolved as Via Francesco Roncati; matching road found on normal Bologna map. Final belief Roncati just west of Via Alessandro Guidotti; high city/street confidence, medium exact position. Provisional northern Bologna pin refined to visible street and visually verified. Contradiction check: architecture and road match; original offset from junction remains approximate.
Result: 6 m, 5000 XP settled. Recorder SAVED 2/9. No critical controller incident.

## Run 3 / Medium 3 / loc_011

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_CLEAN_20260907.md` — Medium R3

Initial five cues: Amsterdamsestraatweg road overlay, abundant bicycles, red separated cycle lane, yellow traffic-island bollards, low Dutch brick buildings. Initial belief Utrecht Netherlands from road name; high country confidence, medium city confidence.
New evidence: normal Utrecht map contains Amsterdamsestraatweg; exact frontage not identified. Final belief northwestern Utrecht on this road near Dieselweg/Marconistraat, medium confidence neighborhood. Actual pin visually on road after correcting an off-road marker. Contradiction check: road match supports Utrecht, but long road leaves substantial positional uncertainty.
Result: 357 m, 4998 XP settled. Recorder SAVED 3/9. Map overlay remained expanded during panorama work, reducing usable scene; no hidden data accessed.

## Run 3 / Medium 4 / loc_012

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_CLEAN_20260907.md` — Medium R4

Initial five cues: N44 road overlay, Foto Aktief Dutch sign, brick detached houses, red paved cycle lanes, overhead utility wires. Initial belief Flanders Belgium along N44, likely Aalter–Maldegem; high country confidence, medium route confidence.
Decisive correction: rotated panorama clearly reads N444 (three fours), not N44. Initial route hypothesis contradicted; shifting toward Ghent south corridor.
Final estimate N444 Hundelgemsesteenweg near Merelbeke/Kwenenbos. High country/route confidence, low exact settlement confidence. Visually verified final road marker near Veldstraat; intended marker persisted. Contradiction check corrected N44 error; Foto Aktief frontage and church were not matched.
Result: 1951 m, 4990 XP settled. Recorder SAVED 4/9 after brief stale Round 3 display.

## Run 3 / Medium 5 / loc_013

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_CLEAN_20260907.md` — Medium R5

Initial five cues: R. Figueira da Foz overlay, Portuguese Privativo parking sign, pale plaster and granite trim, wrought balconies, compact mixed-age parked European cars. Initial belief Portugal, Coimbra plausible from road name; high country confidence, low city confidence.
Decisive clue: matching Rua Figueira da Foz found in Coimbra, with Igreja de Santa Justa beside it. Initial panorama ornate chapel on right plausibly matches church; refined to southeast end of street. High city/street confidence, medium exact-position confidence. Actual pin visually verified by church on road, matching intended. Contradiction check: no regional contradiction; facade match remains inferred.
Result: 79 m, 5000 XP settled. Recorder SAVED 5/9.

## Run 3 / Medium 6 / loc_014

Coordinate status: `recovered_original_map_click`.

**Submitted map pin:** 59.86643441100381, 17.63401455883036. Recomputed error 2321.63 m; report 2322.0 m.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_CLEAN_20260907.md` — Medium R6

Initial five cues: Bergagatan road overlay, green vertical timber house, red tile roofs, tall hedges, narrow unmarked suburban street. Initial belief Sweden, southern/central residential town; high country confidence, low town confidence.
New clue: Birkagatan crossing Bergagatan; inferred Uppsala, unverified town before placement. Intended north Uppsala provisional marker persisted (visible on result); exact street not found. Contradiction check: Sweden solid, city hypothesis remained low confidence. Controller incident: timer reached result between screenshot observations without explicit Guess; last observed timer 1:32. Result: 2322 m, 4988 XP settled, truth Uppsala southwest. Recorder SAVED 6/9.

## Run 3 / Medium 7 / loc_015

Coordinate status: `no_original_numeric_prediction_recovered`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_CLEAN_20260907.md` — Medium R7 (continuation24723 round1)

Initial five cues: Sepa...? tn road overlay, steep pitched residential roofs, mixed timber/stucco houses, narrow patched unmarked road, overhead wires and wooden fences. Initial belief Estonia, town uncertain; medium country confidence, low city confidence. Recorder did not intercept Confirm on fresh continuation tab; parent notified, playing screenshot-only with result artifacts.
New clue: road resolved as Sepakuru tn. Matching street found in southern Tartu normal map; final marker at northern segment near Leegi, visually verified. High city/street confidence, low exact position; original frontage not matched. Contradiction check: industrial surroundings on map briefly confused search, but residential Sepakuru identified. Manual Guess with14 seconds remaining. Result172m,4999XP settled. No recorder controls visible at result boundary.

## Run 3 / Medium 8 / loc_016

Coordinate status: `no_original_numeric_prediction_recovered`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_CLEAN_20260907.md` — Medium R8 (continuation round2)

Initial five cues: Jelsova/Jelšová road overlay, hilly forest backdrop, large stucco houses with balconies, concrete/metal property fences, narrow uphill patched street with overhead utilities. Initial belief Slovakia, perhaps northern valley near Zilina; medium country confidence, low city confidence.
New evidence: Jelšová crosses a larger valley road; no readable town or route sign. Final belief northern/central Slovakia, Ružomberok south area; high country confidence, low city confidence. Marker visually verified just south of Ružomberok. Contradiction check: generic street name and rounded forest hills do not uniquely identify town; no exact claim.
Result35.7km,4825XP settled; truth north Banska Bystrica. Manual Guess25seconds remaining. Country correct, town unresolved; map/controller lag cost search time.

## Run 3 / Medium 9 / loc_017

Coordinate status: `no_original_numeric_prediction_recovered`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_CLEAN_20260907.md` — Medium R9 (continuation round3)

Initial five cues: yellow dashed road edges, white dashed centerline, stone boundary walls, white detached houses, lush low-rolling landscape with left-driving road style. Initial belief Ireland, western/central suburban town; high country confidence, low town confidence.
New clue: road overlay reads Cappagh Rd. Galway western suburb plausible; medium city confidence pending normal-map match.
Matching Cappagh Road found west Galway; final marker northern bend near Cappagh Park visually verified. High city confidence, medium road confidence, low exact frontage confidence; curve match provisional. Contradiction check: initial scene less dense than mapped suburb, so exact segment uncertain. Manual Guess15seconds remaining. Result2025m,4990XP settled; truth further northwest Boleybeg East.

Continuation official leaderboard: Ivan Iachnyk,14814points (4999+4825+4990). Original validR1-R6 total28668; combined nine unique Medium rounds43482/45000. This combined total is a sum across interrupted run and continuation, not a single official nine-round leaderboard. Continuation recorder absent; screenshots are evidence.

## Run 3 / Hard 1 / loc_018

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_CLEAN_20260907.md` — Hard R1

Initial five cues: Greek provincial-road overlay ending Paradisiou-like text, dry grassy shoulders, dense cypress/conifer scrub, narrow gray road with faint white edges, low rolling horizon. Initial belief Greece, Rhodes plausible from Paradisi reference; high country confidence, low island confidence. Recorder REC Round1 visible.
New evidence: normal Rhodes map has Kalamonas-Psinthou inland route; exact initial Greek road name not fully resolved. Final belief inland northern Rhodes, road south of Epano Kalamonas near Butterflies Valley; medium island confidence, low exact-road confidence. Marker visually verified on road. Contradiction check: Paradisi association plausible but not uniquely confirmed, map route name differs from partially read overlay.
Result499.1km,3035XP settled (initial animation3021 not final); truth central Peloponnese north of Kalamata. Recorder SAVED1/8. Error: overcommitted to Rhodes from incomplete road-name association. Manual Guess about1minute remaining.

## Run 3 / Hard 2 / loc_019

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_CLEAN_20260907.md` — Hard R2

Initial five cues: narrow road with dashed white center and gravel shoulders; timber barn with steep tiled roof; rolling green pasture; low dark fence posts; concrete/metal utility poles and pedestrians. Initial hypothesis Romania/Transylvania, medium country confidence, low locality confidence.
New visible road overlay DJ106S, Romanian hollow concrete utility poles, tiled village houses and drainage channels reinforce Sibiu county. Scanned in-game road labels but did not match suffix S or obtain a village sign. Final pin retained north of Nocrich on Sibiu/Agnita corridor; high Romania confidence, medium county confidence, low exact locality confidence.
Result: 10.3 km, 4949 XP. Truth Vurpar, west of Nocrich. Recorder SAVED 2/8.

## Run 3 / Hard 3 / loc_020

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_CLEAN_20260907.md` — Hard R3

Initial five cues: narrow unmarked paved road; metal bridge railing; forested steep rolling mountains; white rendered square houses with hipped tile roofs; overhead cables and large roadside metal refuse bin. Hypothesis Bulgaria/Rhodope or neighboring Balkan mountains, medium-low country confidence, low locality confidence.
Movement revealed more white/grey multi-storey Balkan homes, concrete poles, red tile roofs, steep wooded valleys, yellow priority diamond and 30 sign, but no readable locality text. Retained provisional Smolyan region pin. Final Bulgaria confidence medium-high, Rhodope region medium, exact town low.
Result: 23.5 km, 4884 XP. Truth Varbina east of Smolyan. Recorder SAVED 3/8.

## Run 3 / Hard 4 / loc_021

Coordinate status: `recovered_original_map_click`.

**Submitted map pin:** 46.716011920862634, 20.078026666161723. Recomputed error 2430.77 m; report 2431.0 m.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_CLEAN_20260907.md` — Hard R4

Initial five cues: perfectly flat agricultural plain; sunflower field; adjacent wheat and maize strips; slender overhead utility poles; narrow paved road with grassy shoulders. Initial hypothesis Hungary or northern Serbia, low-medium country confidence, low locality confidence.
New clues: visible road overlay 451 and van telephone +36 confirm Hungary. In-game map matched route 451 Kiskunfelegyhaza-Gater-Csongrad. After several forward moves a green kilometer marker 21 appeared; inferred distance measured from Kiskunfelegyhaza and adjusted pin farther east toward Csongrad, allowing for movement from initial point. High country/route confidence; medium corridor position, low exact point confidence.
Result: 2431 m, 4988 XP. Truth on same straight route451 southwest of final pin. Recorder SAVED 4/8.

## Run 3 / Hard 5 / loc_022

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_CLEAN_20260907.md` — Hard R5

Initial five cues: narrow gravel two-track with grassy center; flat horizon; deciduous/birch-like roadside trees; dense green hedges; no buildings, signs, road markings or utility poles visible. Initial hypothesis Baltic states or rural Poland, low country/locality confidence.
Several forward movements remained on the same gravel lane with birch/willow-like scrub, grassy verge, a slight bend, then distant utility wires. No text, buildings or unique regional identifier obtained. Retained central Lithuania provisional pin as a low-confidence landscape guess; Baltic/Poland ambiguity unresolved.
Result: 239.3 km, 3936 XP. Truth Latvia near Gulbene. Recorder SAVED 5/8.

## Run 3 / Hard 6 / loc_023

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_CLEAN_20260907.md` — Hard R6

Initial five cues: broad pale gravel road; visible road overlay 3426; flat cultivated fields; low white agricultural ruins on left; scattered utility poles and distant mixed tree line. Initial hypothesis Lithuania, probably Radviliskis district from remembered regional road numbering, medium-high country confidence, medium district confidence, low locality confidence.
In-game map confirmed road3426 between Valatkoniai and Pociuneliai in Radviliskis district. Movement past ruined farm reached paved surface and a leftward bend. No town sign obtained. Adjusted final pin toward northern approach to Sabiskiai based on road alignment and settlement proximity; exact farm match unverified. High country/route confidence, low exact point confidence.
Result: 85 m, 5000 XP. Truth on road3426 just northwest of final pin. Recorder SAVED 6/8. Precision exceeded pre-guess confidence; do not represent as a verified farm identification.

## Run 3 / Hard 7 / loc_024

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_CLEAN_20260907.md` — Hard R7

Initial five cues: road overlay Skalvej; narrow unmarked asphalt; extremely flat open fields; low dune-like ridge on right horizon; distant wind turbines and very sparse settlement. Initial hypothesis western coastal Denmark, high country confidence from vej suffix, medium west-coast region, low locality confidence.

Hard R7 result: 986 m, 4995 XP, recorder SAVED 7/8. Retained provisional rural pin south of Harboore near Vrist; visible road Skalvej was not found on the map before submission. Result showed Skalvej immediately farther south. Country/region inference correct, exact placement approximate. Submitted with more than one minute remaining.

## Run 3 / Hard 8 / loc_025

Coordinate status: `invalid_ad_request_prediction`.

Source: `reports/NAUTILUS_ASTRA_LOW_RUN3_CLEAN_20260907.md` — Hard R8 (unheaded notes)

Hard R8 initial five cues: narrow two-way paved road; double solid white centre lines; continuous thin white edge lines; dense birch and pine forest; shallow grassy drainage verges and gently rolling terrain. Initial hypothesis Sweden versus Finland/Baltics, low country confidence and no region confidence. Need visible signage.
Hard R8 decision before result: repeated movement found only forest tracks and continuous forest, no legible place or route sign. Shifted hypothesis toward Finland from solid edge lines, road marking pattern and boreal vegetation, but country remains only medium confidence and precise region low confidence. Provisional pin north of Tampere retained; no matched road claim.
Hard R8 result: 358.7 km, 3492 XP; truth east of Oulu, Finland. Guessed north of Tampere. Country inference correct but no regional clue found. Recorder shows Competition recorded, 8/8 rounds saved. Submitted with about 1:45 remaining.
