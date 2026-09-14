# NAUTILUS Sol/Max Hard Final Blind Run

- Date: 2026-08-12
- Player: Ivan Yachnik (Account B)
- Configuration: `gpt-5.6-sol`, reasoning `max`, isolated `fork_turns: none`
- Competition: Hard, private, 8 rounds, 300 seconds, movement restriction None
- Entry: https://openguessr.com/competitions?enter=24281
- Leaderboard: https://openguessr.com/competitions?leaderboard=24281

## Controller regression gate

Status: **PASS** in a disposable unscored World single-player round.

1. Placed and visibly verified a valid provisional marker in Canada; Guess became active.
2. Expanded the map and zoomed from world scale through Europe to city-label detail around France.
3. Moved the marker to visibly named Paris; marker tip visibly aligned with the Paris label.
4. Collapsed the map through its neutral footer while preserving an active Guess.
5. Moved one Street View step; nearby buildings and lane geometry visibly changed.
6. Reopened the map; the marker remained visibly at Paris.
7. Abandoned through the visible Maps menu without submitting; `/maps` rendered.

Controller note: map expansion is hover-driven and may need a deliberate pointer move plus a rendered-state check; the first provisional click was swallowed and succeeded on one inspected retry.

## Round records

### Round 1

- **INITIAL — 04:53.** Untouched cues: (1) Greek road overlay beginning `Επαρ.Οδ.`; (2) dry, narrow, unmarked paved road; (3) limestone/gravel shoulders; (4) dense Mediterranean juniper/scrub; (5) right-driving vehicle ahead. Initial belief: Greece, tentatively Kefalonia/Ionian-island interior. Alternatives: Crete or Peloponnese. Confidence: country 99%, region about 25%.
- **PROVISIONAL PIN — 03:16.** Marker tip visibly placed on Kefalonia, the island west of labeled Patras and north of labeled Zakynthos; Guess active. The first click was swallowed; one inspected retry succeeded.
- **EXPLORATION.** Three verified forward steps preserved the same dry limestone/juniper environment and exposed the road overlay more clearly. Two visual zooms supported the transcription `Επαρ.Οδ. Αργοστολίου - Πόρου` (Argostoli–Poros provincial road); no contradictory cue appeared.
- **FINAL BELIEF / PIN — 00:28.** Greece, Kefalonia, Argostoli–Poros provincial-road corridor on the north/east flank of Ainos Oros. Confidence: country 99%, island 90%, road segment about 55%. At coarse-to-regional refinement the provisional was discovered to be east of the island and was corrected. Final marker tip was visibly on eastern-central Kefalonia between labeled Argostoli (west) and Poros (east), just north of labeled Ainos Oros; island coastline and labels agreed.
- **RESULT.** 191.6 km; `+4,128 XP` displayed (**XP, not official round points**). Revealed flag: Peloponnese near Astros, Greece. Country semantics correct; island/road interpretation wrong. Pin transfer accurate to the final textual Kefalonia belief. First Guess click was swallowed; the inspected retry at about eight seconds produced the result. Reconciled official points: **4,128**.

### Round 2

- **INITIAL — 04:50.** Untouched cues: (1) lush rolling pasture and low karst-like hills; (2) weathered timber barn with clay-tile roof; (3) narrow worn right-driving road with sparse dashed white center and no edge lines; (4) simple rural streetlights and utility wires; (5) Balkan-style fencing/posts. Initial belief: Serbia, Sandžak/Pešter plateau near Sjenica. Alternatives: Bosnia, North Macedonia, Montenegro. Confidence: country about 45%, region about 25%.
- **PROVISIONAL PIN — 02:44.** Marker tip visibly in southwest Serbia west/northwest of labeled Novi Pazar and north of Montenegro, matching the Sjenica/Pešter hypothesis; Guess active. First click swallowed; one inspected retry succeeded.
- **EXPLORATION.** Three verified forward steps passed farm workers, fields, repeated simple streetlights and low karst pasture; one panorama rotation exposed more timber and tile-roof farm structures. These supported the rural Balkan plateau hypothesis but yielded no decisive text; no incompatible cue appeared.
- **FINAL BELIEF / PIN — 00:31.** Serbia, Sjenica/Pešter plateau, rural settlement road on Sjenica outskirts. Confidence: country about 50%, area about 40%; northern Montenegro and Bosnia retained as alternatives. Final marker tip visibly aligned with labeled Sjenica, west of Novi Pazar and north of the Montenegro boundary; labels and map position agreed. One inspected retry was needed to move the final marker.
- **RESULT.** 442 km; `+3,213 XP` displayed (**XP, not official round points**). Revealed flag: central Romania near Sibiu/Alba Iulia. Final country/area semantics wrong; submitted pin matched the Sjenica belief. First Guess click was swallowed; the inspected retry at about ten seconds produced the result. Reconciled official points: **3,213**.

### Round 3

- **INITIAL — 04:51.** Untouched cues: (1) steep lush rounded/forested mountains; (2) narrow unmarked paved village road crossing a metal-railed bridge; (3) blue-and-white painted roadside/bridge post; (4) white stucco homes with shallow red-tile roofs; (5) simple overhead wires and right-driving traffic. Initial belief: Bulgaria, Rhodope Mountains near Devin/Smolyan. Alternatives: North Macedonia and Serbia/Bosnia. Confidence: country about 55%, region about 35%.
- **PROVISIONAL PIN — 02:28.** Marker tip visibly in Bulgaria's central Rhodopes just south of labeled Pamporovo, west of Rudozem, and north of the Greek border, matching the Smolyan-area hypothesis; Guess active. First click swallowed; one inspected retry succeeded.
- **EXPLORATION.** Three useful forward Street View advances passed a blue hydrant/post, a resident, greenhouse, repeated white stucco/red-tile houses, AC units, guardrail and mountain-village streets. The built environment and deeply forested relief corroborated Bulgaria's Rhodopes; no decisive text and no incompatible cue appeared.
- **FINAL BELIEF / PIN — 00:34.** Bulgaria, Smolyan in the central Rhodopes, likely a village/residential road on the city outskirts. Confidence: country about 70%, city area about 60%. Final marker tip visibly on labeled Smolyan, with Pamporovo north, Devin northwest, Rudozem east, and the Greek border south; written belief and rendered map agreed.
- **RESULT.** 14.5 km; `+4,928 XP` displayed (**XP, not official round points**). Revealed flag: near Varbina east of Smolyan, Bulgaria. Country and Smolyan-region semantics correct; remaining error was village/road precision. Submitted pin matched the final belief. First Guess click was swallowed at about four seconds; the immediate retry produced the result. Reconciled official points: **4,928**.

### Round 4

- **INITIAL — 04:52.** Untouched cues: (1) vast flat open agricultural plain; (2) adjacent sunflower, ripe wheat, and corn fields; (3) very narrow unmarked asphalt road; (4) sparse thin pale utility poles; (5) dry-summer but productive black-soil landscape. Initial belief: northern Bulgaria/Dobruja, broadly the Dobrich–Danube plain. Alternatives: southern Romania, Serbian Vojvodina, Moldova/Ukraine. Confidence: country about 35%, regional type about 45%.
- **PROVISIONAL PIN — 02:38.** Marker tip visibly on labeled Dobrich in northeastern Bulgaria, north of Varna and south of the Romania border, matching the Dobruja-plain hypothesis; Guess active. First click swallowed; one inspected retry succeeded.
- **EXPLORATION.** Two short movements and two deliberate rotations finally exposed the road direction, white edge/center markings, traffic, and a decisive rendered road overlay `451`. This overturned the weak Bulgaria hypothesis in favor of Hungary, specifically Route 451 across the Great Hungarian Plain near Csongrád–Szentes/Kiskunfélegyháza.
- **FINAL BELIEF / PIN — emergency at 00:04.** Final textual belief: Hungary, Route 451 in the Csongrád–Szentes/Kiskunfélegyháza corridor; confidence country/route about 90%, segment about 65%. **Final pin verification failed:** the old Dobrich marker was still visibly rendered at 00:04. An emergency correction click was made after panning to Hungary but could not be rendered and checked before submission. The result map showed the submitted pin near Székesfehérvár, inconsistent with the written Route-451 belief. Marker was valid/non-default, but belief-to-pin transfer failed.
- **RESULT.** 172.9 km; `+4,206 XP` displayed (**XP, not official round points**). Revealed black flag: Route 451 in the Csongrád/Szentes corridor, Hungary. Final semantic country/route belief correct; pin-transfer/controller execution failed. Reconciled official points: **4,206**.

### Round 5

- **INITIAL — 04:45.** Untouched cues: (1) single-lane twin-track gravel lane with grass center; (2) dense young deciduous/willow-like hedges; (3) very flat moist temperate terrain; (4) tall poplar/birch-type trees; (5) no road furniture, buildings, markings, or mountains. Initial belief: Latvia, lowland near Jelgava/Daugava basin. Alternatives: Lithuania, Poland, Hungary/Romania. Confidence: country about 25%, broad Baltic/central-eastern lowland about 45%.
- **PROVISIONAL PIN — 02:51.** Marker tip visibly in Latvia on the Gulf-of-Riga coast just north of labeled Riga, west of the Estonia border and north of Lithuania; valid active Guess. First click swallowed; one inspected retry succeeded.
- **EXPLORATION.** Four verified forward advances showed a long straight farm lane bordered by repeated low deciduous rows, consistent with a managed orchard/willow plantation on a wet lowland. This modestly supported the Baltic hypothesis but produced no text, road furniture, buildings, relief, or decisive national cue; Lithuania, Poland and Hungary remained live alternatives.
- **FINAL BELIEF / PIN — 00:14.** Latvia, Jelgava/Riga lowland, farm/orchard lane. Confidence: country about 30%, area about 25%; Lithuania/Poland/Hungary retained. Final marker tip visibly aligned with labeled Jelgava, south of Riga and north of Lithuania; written belief and rendered map agreed.
- **RESULT.** 133.1 km. The first result frame showed `+3,840 XP` while the animation was still counting; after the result settled it displayed `+4,377 XP` (**XP, not official round points**). Revealed flag: near Lācītes/Lizums in northeast Latvia. Country reasoning correct; regional precision wrong. Submitted pin matched the final Jelgava belief; Guess succeeded on the first click. Reconciled official points: **4,377**.

### Round 6

- **INITIAL — 04:28.** Untouched cues: (1) large rendered road number `346`; (2) broad straight unpaved/gravel road; (3) flat cool-temperate cropland; (4) sparse low masonry/farm buildings; (5) simple thin poles and mixed deciduous/conifer tree line. Initial belief: Latvia, a local `V346`-type road in the central/eastern lowlands. Alternatives: Estonia/Finland and Romania. Confidence: country about 55%, road system about 45%.
- **PROVISIONAL PIN — 02:05.** After visibly catching and correcting an accidental Estonia placement, marker tip was visibly inside Latvia, east of Riga, south of Estonia and north of Lithuania; Guess active. Controller required the usual inspected retry plus one country-boundary correction.
- **EXPLORATION.** Several short verified forward advances continued along the ruler-straight gravel farm road toward a sparse farmstead. The flat cultivated Baltic landscape persisted, but no additional national text, signs, bollards, or route shield appeared; Lithuania remained the principal alternative.
- **FINAL BELIEF / PIN — 00:05.** Latvia, broad central/eastern lowlands on local road 346. Confidence: country about 60%, area about 25%. Compact rendered map visibly showed the marker inside eastern/northeastern Latvia, east of Riga and north of Lithuania; written belief and rendered country placement agreed. The extremely late checkpoint left no additional refinement margin.
- **RESULT.** 203.2 km; `+4,080 XP` displayed (**XP, not official round points**). Revealed black flag: near Baisogala/Radviliškis in north-central Lithuania. Submitted marker: near Varakļāni in east-central Latvia. Country wrong, but the pin was valid/non-default and matched the final Latvia belief. Guess succeeded on the first click at the deadline. Reconciled official points: **4,080**.

### Round 7

- **INITIAL — 04:54.** Untouched cues: (1) rendered Danish road name `Skalivej`/a visually similar `-vej` name; (2) extremely flat intensive cereal fields; (3) wind turbines; (4) narrow unmarked paved lane with tidy verges; (5) low gently rolling wooded horizon. Initial belief: Denmark, tentatively Lolland/Falster or southern Jutland agricultural lowland. Alternatives: Zealand and Funen. Confidence: country 97%, region about 35%.
- **PROVISIONAL PIN — 03:08.** Marker visibly placed in southern Denmark on the Lolland/Falster–south-Zealand island cluster, southwest of Copenhagen and north of Germany; Guess active. The placement required inspected retries, and later zoom revealed it was initially on southern Zealand rather than Lolland.
- **EXPLORATION.** Four useful forward advances followed the same narrow lane through uninterrupted grain fields, turbines, white-flowering verges and the repeated rendered `-vej` road name. Country confidence increased, but no town or route number appeared. Regional inference remained based on the very flat intensive agricultural landscape.
- **FINAL BELIEF / PIN — 00:53.** Denmark, central Lolland rural fields west of Maribo, between Nørreballe/Hillested and east of Søllested. Confidence: country 98%, island 55%, local segment about 25%. Multi-scale rendered-map verification showed the marker on Lolland’s road network at town scale, with Nakskov west and Falster east; final marker tip visibly sat on a rural road west of Maribo. Written belief and rendered pin agreed.
- **RESULT.** 287.3 km; `+3,751 XP` displayed (**XP, not official round points**). Revealed black flag: western/north-central Jutland near Skive/Thisted. Country/text interpretation correct; subregion wrong. Submitted pin was valid/non-default and exactly matched the final visible Lolland belief. First Guess click was swallowed; one inspected retry produced the result. Reconciled official points: **3,751**.

### Round 8

- **INITIAL — 04:53.** Untouched cues: (1) dense birch/pine/spruce boreal forest; (2) gently rolling terrain; (3) high-quality right-driving highway; (4) double solid white center lines with solid white edges; (5) visible dark Street View car roof. Initial belief: Finland, central/southern lake-and-forest belt, tentatively the Jyväskylä–Kuopio region. Alternatives: central Sweden and Estonia. Confidence: country about 55%, broad region about 30%.
- **PROVISIONAL PIN — 03:32.** Marker visibly inside Finland in the central inland lake-and-forest belt, east of Sweden and north of the Baltic, matching the Jyväskylä–Kuopio broad hypothesis; Guess active. First click was swallowed; the inspected retry succeeded.
- **EXPLORATION.** Approximately eight verified advances were split between both road directions after a deliberate 180-degree panorama rotation. Every view preserved the smooth two-lane road, double solid white center line, thin white edges, dense mixed boreal forest, rolling cuts and visible dark car roof. No sign, bollard, settlement, route number, or contrary cue appeared; Finland remained the strongest but not decisive country inference.
- **FINAL BELIEF / PIN — 00:57.** Finland, central lake-and-forest belt on a regional highway near Saarijärvi, north of Jyväskylä/Äänekoski and south of Viitasaari. Confidence: country about 65%, central belt about 40%, local segment about 20%. Rendered map visibly showed the marker tip on the road/lake network just northeast of labeled Saarijärvi, with Viitasaari north, Jyväskylä south, Kuopio east and Tampere farther south; written belief and pin agreed.
- **RESULT.** 246.2 km; `+3,908 XP` displayed (**XP, not official round points**). Revealed black flag: east of Oulu around the Pudasjärvi/Utajärvi–Puolanka area, Finland. Country semantics correct; regional placement was too far south. Submitted pin was valid/non-default and matched the final Saarijärvi belief. First Guess click was swallowed; one inspected retry produced the result. Reconciled official points: **3,908**.

## Final commitment and official-score reconciliation

- From the exact Round 8 result screen, the `FINAL ROUND RESULT` checkpoint was sent before any navigation.
- The visible final **Continue** click was swallowed; the permitted single inspected retry succeeded.
- The completed results modal visibly rendered `Ivan Yachnik` with numeric total **32,591 Pts.** in both **You & friends** and **All**. `FINAL CONTINUE CLICKED` and `LEADERBOARD COMMITTED` were sent only after that rendered verification.
- The official total reconciles exactly to the eight settled in-round numeric displays: `4,128 + 3,213 + 4,928 + 4,206 + 4,377 + 4,080 + 3,751 + 3,908 = 32,591`. Those in-round values were labeled XP; their numerical equality to the official leaderboard points is confirmed arithmetically, while the report preserves the XP-versus-official-points distinction.

| Round | Settled in-round XP display | Reconciled official points | Distance | Marker status | Semantic outcome | Belief-to-pin transfer |
|---:|---:|---:|---:|---|---|---|
| 1 | 4,128 XP | 4,128 | 191.6 km | Valid, non-default | Greece correct; Kefalonia/road wrong | Accurate |
| 2 | 3,213 XP | 3,213 | 442 km | Valid, non-default | Country and region wrong | Accurate |
| 3 | 4,928 XP | 4,928 | 14.5 km | Valid, non-default | Bulgaria/Rhodopes correct; village imprecise | Accurate |
| 4 | 4,206 XP | 4,206 | 172.9 km | Valid, non-default | Final Hungary/Route 451 semantics correct | **Failed**: submitted near Székesfehérvár, not the written corridor |
| 5 | 4,377 XP | 4,377 | 133.1 km | Valid, non-default | Latvia correct; subregion wrong | Accurate |
| 6 | 4,080 XP | 4,080 | 203.2 km | Valid, non-default | Latvia wrong; actual Lithuania | Accurate |
| 7 | 3,751 XP | 3,751 | 287.3 km | Valid, non-default | Denmark correct; island/region wrong | Accurate |
| 8 | 3,908 XP | 3,908 | 246.2 km | Valid, non-default | Finland correct; regional placement too far south | Accurate |
| **Total** | **32,591 XP numerically** | **32,591 official points** | — | **8/8 valid; 0 default** | — | **7/8 accurate** |

## Protocol audit

- Record count: exactly **8 INITIAL**, **8 PROVISIONAL PIN**, **8 FINAL BELIEF / PIN**, and **8 RESULT** records.
- Validity/default audit: **8/8 submissions valid and non-default; 0 default pins**.
- Semantic audit: country correct in Rounds 1, 3, 4 (final belief), 5, 7 and 8; country wrong in Rounds 2 and 6. Region/feature was strongest in Round 3 and the late Route-451 semantic correction in Round 4.
- Pin-transfer audit: **7/8 accurate** to the written final belief. Round 4 is the sole failure: the semantic Hungary/Route-451 correction was right, but the unverified emergency map transfer landed near Székesfehérvár.
- Controller audit: the gate passed. Map-marker, Guess and Continue actions were frequently swallowed on their first click but generally recovered with one rendered-state retry. Round 6 also required an inspected correction from accidental Estonia to Latvia. Round 4 was the only material controller/timing failure. The final Continue was swallowed once, retried once as authorized, and the numeric leaderboard commitment was visibly verified.
