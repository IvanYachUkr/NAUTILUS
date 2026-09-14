# NAUTILUS GPT-5.6 Sol XHIGH Recorded R2 Run

Run date: 2026-08-31  
Player: Ivan Yachnik  
Recorder label: `gpt-5-6-sol-xhigh-recorded-r2`  
Condition: `interactive-panorama` (Interactive panorama)  
Recorder: OpenGuessr Research Round Recorder `0.7.26`  
Protocol: `NAUTILUS_BLIND_PLAY_PROTOCOL_V3_PIN_REFINEMENT.md` plus `NAUTILUS_RECORDED_SOL_ADDENDUM.md`

## Run validity and official result

The run contains exactly **25 authoritative, prediction-submitted records** in the required order: Easy 8/8, Medium 9/9, Hard 8/8. Every scored round began only after the clean competition session showed blue `ARMED`, `interactive`, and zero saved rounds with no `VIDEO ERROR`; for recorder 0.7.26 this was the visible VID-ready equivalent. Every active round showed `REC · Round N`. After each Guess, a five-second wait and fresh visual check showed `SAVED · Round N` and an advanced counter. Each final result was continued normally to a committed leaderboard row for Ivan Yachnik before `Done & disarm`; all three session manifests are `complete`, with their video streams `stopped`.

| Level | Entry | Dataset | Saved progression | Official score | Maximum | Percent | Displayed-distance sum |
|---|---|---|---|---:|---:|---:|---:|
| Easy | https://openguessr.com/competitions?enter=24574 | `europe-easy` | 0/8 → 1/8 → 2/8 → 3/8 → 4/8 → 5/8 → 6/8 → 7/8 → 8/8 | 39,820 | 40,000 | 99.55% | 36.549 km |
| Medium | https://openguessr.com/competitions?enter=24575 | `europe-medium` | 0/9 → 1/9 → 2/9 → 3/9 → 4/9 → 5/9 → 6/9 → 7/9 → 8/9 → 9/9 | 41,265 | 45,000 | 91.70% | 877.119 km |
| Hard | https://openguessr.com/competitions?enter=24576 | `europe-hard` | 0/8 → 1/8 → 2/8 → 3/8 → 4/8 → 5/8 → 6/8 → 7/8 → 8/8 | 26,351 | 40,000 | 65.88% | 4,288.600 km |
| **Overall** | — | — | **25/25** | **107,436** | **125,000** | **85.95%** | **5,202.268 km** |

The distances below are the values rendered by OpenGuessr. Aggregate distance statistics therefore inherit the UI's displayed precision. Submission-time values are approximate seconds remaining, reconciled against each current-run recording's duration from the 300-second round clock.

## Authoritative round records

### 01 — Easy R1 (`loc_001`)

- **Untouched cues:** Dense Parisian boulevard fabric; the Bastille column/monument geometry; broad traffic circle; French street environment; central-city scale.
- **Initial belief:** Paris, Place de la Bastille; high confidence. **Provisional pin:** central Paris at Bastille rather than a country-level France pin.
- **Exploration:** Bounded visual reinspection checked the monument, boulevard convergence, and absence of a conflicting Paris landmark.
- **Final belief:** Place de la Bastille, Paris, France; high confidence. **Final pin verification:** marker at `48.854176, 2.368849`, checked against the Bastille/central-city street geometry and nearby Seine-side Paris context.
- **Submission:** approximately 153 s remained. **Result:** 235 m, 4,999 points; revealed Place de la Bastille, Paris.
- **Semantic correctness:** Full — country, city, and named target correct. **Pin transfer:** PASS — submitted marker matched the stated Bastille belief; residual error was map precision only.

### 02 — Easy R2 (`loc_002`)

- **Untouched cues:** Berlin television tower skyline; open Alexanderplatz urban square; German streetscape; tram/large-plaza context.
- **Initial belief:** Alexanderplatz, Berlin; high confidence. **Provisional pin:** Alexanderplatz in central Berlin.
- **Exploration:** Rechecked tower orientation, square scale, and surrounding urban geometry; no credible alternative remained.
- **Final belief:** Alexanderplatz, Berlin, Germany; high confidence. **Final pin verification:** marker at `52.522761, 13.413373`, aligned with the Alexanderplatz/Mitte labels and central Berlin road pattern.
- **Submission:** approximately 171 s remained after landmark-scale verification and no useful remaining refinement. **Result:** 268 m, 4,999 points; revealed Alexanderplatz, Berlin.
- **Semantic correctness:** Full. **Pin transfer:** PASS; residual error was local map precision.

### 03 — Easy R3 (`loc_003`)

- **Untouched cues:** Dominant hilltop fortress; baroque Alpine city; steep wooded relief; Austrian architectural character.
- **Initial belief:** Hohensalzburg Fortress, Salzburg; high confidence. **Provisional pin:** Salzburg fortress/old-town area.
- **Exploration:** Compared fortress silhouette, city basin, and Alpine setting; these corroborated Salzburg over other Austrian towns.
- **Final belief:** Hohensalzburg Fortress, Salzburg, Austria; high confidence. **Final pin verification:** marker at `47.802674, 13.057437`, checked against Salzburg, the Salzach corridor, and fortress/old-town geometry.
- **Submission:** approximately 181 s remained after named-landmark placement. **Result:** 409 m, 4,998 points; revealed Hohensalzburg/Salzburg.
- **Semantic correctness:** Full. **Pin transfer:** PASS; only landmark-scale placement error remained.

### 04 — Easy R4 (`loc_004`)

- **Untouched cues:** Large historic castle complex; dense red-roof medieval town; tight river-valley form; Central European/Czech visual character.
- **Initial belief:** Český Krumlov Castle, Czechia; high confidence. **Provisional pin:** Český Krumlov rather than a broad Czech pin.
- **Exploration:** Rechecked castle massing, old-town roofscape, and the Vltava-bend settlement form.
- **Final belief:** Český Krumlov Castle, Czechia; high confidence. **Final pin verification:** marker at `48.811835, 14.304563`, aligned with the Český Krumlov label and Vltava loop/castle-side geometry.
- **Submission:** approximately 146 s remained after city/landmark verification. **Result:** 622 m, 4,997 points; revealed Český Krumlov Castle.
- **Semantic correctness:** Full. **Pin transfer:** PASS; residual error was castle-area precision.

### 05 — Easy R5 (`loc_005`)

- **Untouched cues:** Very large Roman amphitheatre; Adriatic/Mediterranean light and stone; Croatian urban context; unmistakable arena form.
- **Initial belief:** Pula Arena, Pula, Croatia; high confidence. **Provisional pin:** central Pula at the arena.
- **Exploration:** Checked amphitheatre geometry and surrounding city context; no competing Roman-arena city fit as well.
- **Final belief:** Pula Arena, Pula, Croatia; high confidence. **Final pin verification:** marker at `44.871038, 13.844579`, checked against the Pula label, Adriatic coast, and arena-side city grid.
- **Submission:** approximately 175 s remained after named-landmark placement. **Result:** 553 m, 4,997 points; revealed Pula Arena.
- **Semantic correctness:** Full. **Pin transfer:** PASS; residual error was map precision.

### 06 — Easy R6 (`loc_006`)

- **Untouched cues:** Small Central European borderland settlement; temperate low hills; red-roof village fabric; signage/road form compatible with the Czech–Polish–German corner but not decisive.
- **Initial belief:** Hrádek nad Nisou area, Czechia; medium confidence, with nearby Poland as the main alternative. **Provisional pin:** Hrádek/Czech border area.
- **Exploration:** Reinspected settlement form and border-region geography; no readable cue resolved the national side of the border.
- **Final belief:** Hrádek nad Nisou, Czechia; medium confidence. **Final pin verification:** marker at `50.859008, 14.820727`, checked against Hrádek nad Nisou, Liberec-region labels, and the Czech–Polish–German border geometry.
- **Submission:** approximately 86 s remained. **Result:** 4.970 km, 4,975 points; revealed Sieniawka, Poland.
- **Semantic correctness:** No — wrong country and locality, though the border region was close. **Pin transfer:** PASS — the pin accurately represented the stated Hrádek belief; error was semantic, not controller execution.

### 07 — Easy R7 (`loc_007`)

- **Untouched cues:** Slovenian-looking hill settlement; red roofs and church-centered village; lush rolling terrain; compact Central European road fabric.
- **Initial belief:** Southern/central Slovenia, likely Mokronog; medium confidence. **Provisional pin:** Mokronog area in Slovenia.
- **Exploration:** Compared hill profile, settlement scale, and regional alternatives; country confidence stayed higher than locality confidence.
- **Final belief:** Mokronog, Slovenia; medium confidence. **Final pin verification:** marker at `45.958077, 15.121489`, checked against the Mokronog/Trebnje-area labels and Slovenian regional road geometry.
- **Submission:** approximately 100 s remained. **Result:** 29.3 km, 4,856 points; revealed Višnja Gora, Slovenia.
- **Semantic correctness:** Partial — country correct, locality wrong. **Pin transfer:** PASS; the marker matched the final Mokronog belief.

### 08 — Easy R8 (`loc_008`)

- **Untouched cues:** `Flåm` railway/visitor context; steep fjord walls; rail and port infrastructure; Norwegian fjord village scale.
- **Initial belief:** Flåm, Norway; high confidence. **Provisional pin:** Flåm station/port area.
- **Exploration:** Rechecked fjord orientation, rail corridor, and settlement geometry; all corroborated Flåm.
- **Final belief:** Flåm railway/port, Norway; high confidence. **Final pin verification:** marker at `60.863630, 7.114433`, aligned with Flåm, Aurlandsfjord, and the rail/harbour corridor.
- **Submission:** approximately 156 s remained after feature-scale verification. **Result:** 192 m, 4,999 points; revealed Flåm.
- **Semantic correctness:** Full. **Pin transfer:** PASS; residual error was feature-scale precision.

### 09 — Medium R1 (`loc_009`)

- **Untouched cues:** Readable `Carrer de Ciscar` street name; Valencian/Catalan `Carrer`; dense Spanish apartment blocks; Mediterranean streetscape.
- **Initial belief:** Carrer de Ciscar, Valencia, Spain; high confidence. **Provisional pin:** Valencia Eixample/Ciscar area.
- **Exploration:** Rechecked the street plaque, surrounding block orientation, and Valencia urban form.
- **Final belief:** Carrer de Ciscar, Valencia; high confidence. **Final pin verification:** marker at `39.467679, -0.366711`, checked against Carrer de Ciscar and the Eixample/Russafa street grid.
- **Submission:** approximately 110 s remained. **Result:** 110 m, 4,999 points; revealed Carrer de Ciscar, Valencia.
- **Semantic correctness:** Full. **Pin transfer:** PASS; residual error was street-segment precision.

### 10 — Medium R2 (`loc_010`)

- **Untouched cues:** Readable `Via Francesco Roncati`; Italian street naming; Bologna masonry/portico context; compact historic-city grid.
- **Initial belief:** Via Francesco Roncati, Bologna, Italy; high confidence. **Provisional pin:** Bologna at the named street.
- **Exploration:** Confirmed the plaque transcription and Bologna street context; no contradictory city cue appeared.
- **Final belief:** Via Francesco Roncati, Bologna; high confidence. **Final pin verification:** marker at `44.493113, 11.325197`, aligned with the named street and Bologna's inner-city/ring-road geometry.
- **Submission:** approximately 158 s remained after street-scale placement. **Result:** 15 m, 5,000 points; revealed Via Francesco Roncati, Bologna.
- **Semantic correctness:** Full. **Pin transfer:** PASS; essentially exact.

### 11 — Medium R3 (`loc_011`)

- **Untouched cues:** Dutch brick urbanism; canals/bicycles and flat terrain; dense Netherlands city center; no decisive city name.
- **Initial belief:** Amsterdam, Netherlands, with Utrecht as an alternative; medium confidence. **Provisional pin:** central Amsterdam.
- **Exploration:** Rechecked canal/brick-city scale and searched for a city-specific discriminator; none became decisive.
- **Final belief:** Amsterdam, Netherlands; medium confidence. **Final pin verification:** marker at `52.352338, 4.852713`, checked against Amsterdam labels and the central road/canal pattern.
- **Submission:** approximately 171 s remained after city placement and exhausted visible discriminators. **Result:** 30.8 km, 4,848 points; revealed Utrecht, Netherlands.
- **Semantic correctness:** Partial — country correct, city wrong. **Pin transfer:** PASS; semantic city selection caused the error.

### 12 — Medium R4 (`loc_012`)

- **Untouched cues:** Flemish/Belgian road environment; route-number signage; flat roadside development; Belgian lane and sign styling.
- **Initial belief:** N44/Knesselare corridor, Belgium; medium confidence. **Provisional pin:** western Belgium between Ghent and Bruges.
- **Exploration:** Re-read the short route number and compared nearby mapped road corridors; ambiguity between N44 and N444 remained.
- **Final belief:** N44 near Knesselare/Aalter, Belgium; medium confidence. **Final pin verification:** marker at `51.139972, 3.424496`, checked against Knesselare/Aalter and the Ghent–Bruges regional road geometry.
- **Submission:** approximately 80 s remained. **Result:** 28.2 km, 4,861 points; revealed N444 near Melle, Belgium.
- **Semantic correctness:** Partial — country correct, road/locality wrong. **Pin transfer:** PASS; the pin matched the stated N44/Knesselare belief.

### 13 — Medium R5 (`loc_013`)

- **Untouched cues:** Portuguese road signs and language; hilly inland terrain; tiled/light-rendered buildings; central-northern Portugal road character.
- **Initial belief:** Viseu area, Portugal, with Coimbra as an alternative; medium confidence. **Provisional pin:** Viseu.
- **Exploration:** Compared terrain and road network with the visible map; no decisive city text resolved Viseu versus Coimbra.
- **Final belief:** Viseu, Portugal; medium confidence. **Final pin verification:** marker at `40.656732, -7.913542`, checked against Viseu and the A25/IP3 regional geometry.
- **Submission:** approximately 145 s remained. **Result:** 65.9 km, 4,681 points; revealed the Coimbra area, Portugal.
- **Semantic correctness:** Partial — country correct, city/region wrong. **Pin transfer:** PASS.

### 14 — Medium R6 (`loc_014`)

- **Untouched cues:** Swedish streetscape and road furniture; clean low-rise northern-European city; flat-to-gently rolling terrain; no decisive city name.
- **Initial belief:** Jönköping, Sweden, with Uppsala as an alternative; medium confidence. **Provisional pin:** Jönköping.
- **Exploration:** Rechecked urban scale, vegetation, and regional fit; the scene supported Sweden but not a unique city.
- **Final belief:** Jönköping, Sweden; medium confidence. **Final pin verification:** marker at `57.765658, 14.614190`, checked against Jönköping, Lake Vättern, and the surrounding road geometry.
- **Submission:** approximately 131 s remained. **Result:** 288.8 km, 3,745 points; revealed Uppsala, Sweden.
- **Semantic correctness:** Partial — country correct, city wrong. **Pin transfer:** PASS.

### 15 — Medium R7 (`loc_015`)

- **Untouched cues:** Readable `Sepa` street context; Estonian language/orthography; low-rise industrial district; Baltic streetscape.
- **Initial belief:** Sepa tänav, Tartu, Estonia; high confidence. **Provisional pin:** Tartu industrial/rail-side district.
- **Exploration:** Used bounded visual checks to corroborate the street name and industrial layout, then refined on the in-game map.
- **Final belief:** Sepa tänav, Tartu; high confidence. **Final pin verification:** marker at `58.350749, 26.721290`, checked against Tartu, Sepa-area labels, and rail/industrial road geometry.
- **Submission:** approximately 45 s remained. **Result:** 333 m, 4,998 points; revealed Sepa tänav, Tartu.
- **Semantic correctness:** Full. **Pin transfer:** PASS; residual error was street-segment precision.

### 16 — Medium R8 (`loc_016`)

- **Untouched cues:** Forested Alpine/Carpathian road; Central European village character; steep green relief; no decisive language cue.
- **Initial belief:** Bled/northwestern Slovenia, with Slovakia as an alternative; low-to-medium confidence. **Provisional pin:** Bled area.
- **Exploration:** Reinspected terrain, road furniture, and settlement form; weak scenic resemblance outweighed the unresolved Slovak alternative.
- **Final belief:** Bled, Slovenia; low-to-medium confidence. **Final pin verification:** marker at `46.366806, 14.114538`, checked against Bled/Lake Bled and northwestern Slovenian mountain geometry.
- **Submission:** approximately 105 s remained. **Result:** 461.3 km, 3,151 points; revealed northern Slovakia.
- **Semantic correctness:** No — country and region wrong. **Pin transfer:** PASS; the submitted marker represented the final Bled belief.

### 17 — Medium R9 (`loc_017`)

- **Untouched cues:** Irish road form and left-driving context; stone walls/hedges; Atlantic western-Ireland landscape; Galway-area settlement cues.
- **Initial belief:** Galway outskirts, Ireland; medium-high confidence. **Provisional pin:** west/northwest Galway.
- **Exploration:** Rechecked road geometry and local map labels to refine from Galway city to the Bushypark/Barnacranny side.
- **Final belief:** Barnacranny/Bushypark, Galway, Ireland; medium-high confidence. **Final pin verification:** marker at `53.293090, -9.086454`, checked against Galway, the bay/city geometry, and west-side local roads.
- **Submission:** approximately 108 s remained. **Result:** 3.661 km, 4,982 points; revealed Boleybeg East, Galway, Ireland.
- **Semantic correctness:** Full at country/city scale; local road/subarea imprecise. **Pin transfer:** PASS.

### 18 — Hard R1 (`loc_018`)

- **Untouched cues:** Dry mountainous Greek landscape; Mediterranean scrub; Greek-style road/guardrail cues; inland-island ambiguity and no readable place text.
- **Initial belief:** Western Greece, likely Kefalonia/Ionian side, with the Peloponnese as an alternative; low-to-medium confidence. **Provisional pin:** Kefalonia.
- **Exploration:** Rechecked geology, vegetation, and road character; country confidence held, but mainland/island discrimination remained weak.
- **Final belief:** Kefalonia, Greece; medium country confidence, low regional confidence. **Final pin verification:** marker at `38.131362, 20.702407`, checked against Kefalonia and the Ionian coastline.
- **Submission:** approximately 122 s remained. **Result:** 187.7 km, 4,144 points; revealed central Peloponnese near Tripoli, Greece.
- **Semantic correctness:** Partial — country correct, region wrong. **Pin transfer:** PASS.

### 19 — Hard R2 (`loc_019`)

- **Untouched cues:** Forested Balkan/interior road; Eastern European road markings and barriers; folded mountain terrain; no language or settlement discriminator.
- **Initial belief:** Serbia–Bosnia border mountains, with Romania as an alternative; low confidence. **Provisional pin:** Serbia/Bosnia border area.
- **Exploration:** Compared road edge treatment and terrain; evidence remained generic and did not justify a narrower Romanian hypothesis.
- **Final belief:** Serbia–Bosnia border region; low confidence. **Final pin verification:** marker at `43.931547, 19.865769`, checked against the international boundary and nearby mountain-road geometry.
- **Submission:** approximately 209 s remained after safe regional placement; this was earlier than the protocol's normal refinement target and is retained honestly. **Result:** 414 km, 3,304 points; revealed Romania near the Sibiu/Alba Iulia region.
- **Semantic correctness:** No — country and region wrong. **Pin transfer:** PASS; error was semantic rather than controller-related.

### 20 — Hard R3 (`loc_020`)

- **Untouched cues:** Rhodope-like forested mountains; Bulgarian road infrastructure; Balkan village/road character; limited readable text.
- **Initial belief:** Southern Bulgaria, Peshtera/Fotinovo/Rhodope area; medium confidence. **Provisional pin:** Rhodopes in Bulgaria.
- **Exploration:** Rechecked road furniture, relief, and the mapped Peshtera/Fotinovo corridor; retained regional rather than town-level confidence.
- **Final belief:** Fotinovo/Peshtera area, Bulgaria; medium confidence. **Final pin verification:** marker at `41.890972, 24.369068`, checked against Fotinovo, Peshtera, and Rhodope road geometry.
- **Submission:** approximately 189 s remained after regional verification and no stronger visible cue. **Result:** 61.7 km, 4,701 points; revealed Vurbina/Smolyan Rhodopes, Bulgaria.
- **Semantic correctness:** Partial — country and broad mountain region correct, locality wrong. **Pin transfer:** PASS.

### 21 — Hard R4 (`loc_021`)

- **Untouched cues:** Very flat agricultural plain; Hungarian-style delineators/road edges; continental farm landscape; no decisive town text.
- **Initial belief:** Kecskemét/Városföld corridor, Hungary; medium confidence. **Provisional pin:** south of Kecskemét.
- **Exploration:** Compared flatland road pattern and nearby settlements; country and broad Great Plain region remained strongest.
- **Final belief:** Kiskunfélegyháza/Városföld corridor, Hungary; medium confidence. **Final pin verification:** marker at `46.818083, 19.775916`, checked against Kecskemét/Kiskunfélegyháza and the Great Plain road network.
- **Submission:** approximately 192 s remained after regional placement. **Result:** 24.3 km, 4,880 points; revealed near Csongrád, Hungary.
- **Semantic correctness:** Partial — country and broad region correct, locality wrong. **Pin transfer:** PASS.

### 22 — Hard R5 (`loc_022`)

- **Untouched cues:** Flat northern-European rural road; forest and open fields; restrained road furniture; Baltic versus north-German/Denmark ambiguity.
- **Initial belief:** Denmark or northern Germany, with Latvia as a weaker alternative; low confidence. **Provisional pin:** northern Germany near Lübeck.
- **Exploration:** Rechecked lane edges, vegetation, and terrain; no readable language cue resolved the Baltic alternative.
- **Final belief:** Lübeck/northern Germany; low confidence. **Final pin verification:** marker at `53.869892, 10.659197`, checked against Lübeck and the western Baltic/coastal geometry.
- **Submission:** approximately 148 s remained after safe regional placement. **Result:** 1,039.5 km, 1,767 points; revealed Latvia.
- **Semantic correctness:** No — country and region wrong. **Pin transfer:** PASS.

### 23 — Hard R6 (`loc_023`)

- **Untouched cues:** Boreal/Baltic rural road; flat forested terrain; Baltic road furniture; no readable town or country text.
- **Initial belief:** Central Estonia, with Lithuania/Latvia as alternatives; low confidence. **Provisional pin:** central Estonia.
- **Exploration:** Compared delineators, road width, and vegetation; the visual differences were insufficient to resolve the Baltic country.
- **Final belief:** Central Estonia; low confidence. **Final pin verification:** marker at `58.689512, 25.758917`, checked against central-Estonia labels and the north–south road pattern.
- **Submission:** approximately 182 s remained after regional placement. **Result:** 363 km, 3,477 points; revealed Lithuania near Šiauliai.
- **Semantic correctness:** No — country and region wrong. **Pin transfer:** PASS.

### 24 — Hard R7 (`loc_024`)

- **Untouched cues:** Sparse northern landscape; open agricultural/coastal-looking terrain; limited road furniture; no decisive language or route text.
- **Initial belief:** Icelandic south coast, with Denmark as an alternative; low confidence. **Provisional pin:** southern Iceland.
- **Exploration:** Rechecked terrain texture, road form, and horizon; the absence of decisive infrastructure left the initial scenic interpretation dominant.
- **Final belief:** Southern Iceland; low confidence. **Final pin verification:** marker at `63.903157, -20.504595`, checked against the south-coast corridor and nearby Iceland settlement labels.
- **Submission:** approximately 128 s remained after regional placement. **Result:** 1,757.2 km, 862 points; revealed Denmark.
- **Semantic correctness:** No — country and region wrong. **Pin transfer:** PASS.

### 25 — Hard R8 (`loc_025`)

- **Untouched cues:** Boreal forest road; Finnish/Nordic delineator and surface cues; flat-to-gently rolling terrain; no readable place text.
- **Initial belief:** Finland, probably southeast/central near Kouvola, with the Oulu region as an alternative; medium country confidence, low regional confidence. **Provisional pin:** Kouvola area.
- **Exploration:** Rechecked road furniture, forest type, and mapped Finnish corridors; country belief held but north–south placement remained unresolved.
- **Final belief:** Kouvola/southeastern Finland; medium country confidence. **Final pin verification:** marker at `60.978044, 26.637511`, checked against Kouvola and the southeast-Finland highway/river geometry.
- **Submission:** approximately 145 s remained after safe regional placement. **Result:** 441.2 km, 3,216 points; revealed near Oulu, Finland.
- **Semantic correctness:** Partial — country correct, region wrong. **Pin transfer:** PASS.

## Reconciled statistics

- **Official score:** 107,436/125,000 (85.95%); mean 4,297.44 points per round.
- **Displayed-distance total / mean / median:** 5,202.268 km / 208.091 km / 28.2 km across 25 rounds.
- **Easy distance total / mean / median:** 36.549 km / 4.569 km / 0.481 km.
- **Medium distance total / mean / median:** 877.119 km / 97.458 km / 28.2 km.
- **Hard distance total / mean / median:** 4,288.600 km / 536.075 km / 388.5 km.
- **Country reasoning:** 19/25 correct (76%); 6 wrong-country rounds.
- **City/locality/named-target reasoning:** 10/25 full target-level matches (40%). A further 9/25 were partial country or broad-region matches; 6/25 were wrong-country outcomes.
- **Belief-to-pin transfer:** 25/25 PASS (100%). Every submitted coordinate was a valid, non-default marker consistent with the final textual belief, including semantically wrong beliefs.
- **Default/time-out guesses:** 0/25. **Controller failures:** 0. **Recorder failures:** 0. **Unexpected active-tab/ad interruptions during scored intervals:** 0.

## Recorder and artifact audit

Current-run session manifests:

- Easy: `demo_and_extension/data/recordings/sessions/europe-easy/session-2026-08-31t01-29-15-636z-217be36a-21e8-488a-98e4-bf5ec37fc174.json`
- Medium: `demo_and_extension/data/recordings/sessions/europe-medium/session-2026-08-31t01-54-46-559z-a96468a4-5a35-4440-b2ec-ff2c92baeb37.json`
- Hard: `demo_and_extension/data/recordings/sessions/europe-hard/session-2026-08-31t02-26-40-431z-cacedf7d-e336-4641-b8d9-de919753f9ac.json`

Validation against only these current-run manifests/artifacts found:

- 25 unique authoritative JSON recording IDs and exactly 25 `prediction_submitted` stop reasons.
- 25 non-null coordinate predictions; zero partial records; exact model label, `interactive-panorama` condition, and recorder version 0.7.26 in every recording.
- 25 existing WebM files and 25 existing JSON video sidecars; every video status is `stopped`; all `videoSaveSuccess` values are true; zero `videoError` values.
- Session completion is exactly 8/8, 9/9, and 8/8. Each session status is `complete`, each stream is `stopped`, and each session contains only its expected authoritative prediction-submitted rounds.
- No `new_streetview_frame` diagnostic or extra no-prediction recovery segment appears in the current-run artifacts. **Excluded recovery segments: 0.**
- Hard R1 is the one persistence-path exception: its session round says `saveMethod: download-fallback` and leaves the session-level `path` null. The current-run inbox nonetheless contains the JSON with the exact same recording ID, and its WebM and sidecar both exist. It is authoritative, saved, and not a missing artifact.

Before this clean run, a stale extension/tab binding was abandoned at pre-start with zero scored scenes exposed. The extension was reloaded and a fresh tab was armed; that pre-start reset produced no authoritative record and is outside the 25-round corpus.

## Pin-refinement regression decision

**PASS.** No correct high-confidence final country belief was submitted in another country because of a stale or world-scale marker; no exact-city or named-landmark belief was knowingly left at country scale; all 25 rounds used valid non-default markers; and Easy materially improved over the protocol baseline. Easy score rose from 36,340 to 39,820 (**+3,480 points**), while aggregate Easy error fell from 787.5 km to 36.549 km (**−750.951 km, 95.36% lower**). This pass is specifically a belief-to-pin result; semantic geolocation errors, particularly on Hard, remain fully represented above.
