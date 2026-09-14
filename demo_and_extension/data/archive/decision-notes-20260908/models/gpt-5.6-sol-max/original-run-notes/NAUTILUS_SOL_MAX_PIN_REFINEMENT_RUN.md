# NAUTILUS SOL Max Pin-Refinement Blind Run

Player: Ivan Yachnik (eligible Account B)  
Model: `gpt-5.6-sol`  
Reasoning effort: `max`  
Spawn context: `fork_turns: none` (fresh isolated player with no parent conversation history)  
Independent fast/service-tier selector: unavailable; no separate fast mode is claimed  
Controller: rendered Chrome coordinate CUA only during live rounds  
Protocol: `NAUTILUS_BLIND_PLAY_PROTOCOL_V3_PIN_REFINEMENT.md`  
Scoring note: `+#### XP` fields below are preserved as visible XP animations only. The official competition points are taken only from the rendered leaderboard.

Competitions:

- Easy: entry `https://openguessr.com/competitions?enter=24278`; leaderboard `https://openguessr.com/competitions?leaderboard=24278`
- Medium: entry `https://openguessr.com/competitions?enter=24279`; leaderboard `https://openguessr.com/competitions?leaderboard=24279`
- Hard: entry `https://openguessr.com/competitions?enter=24280`; leaderboard `https://openguessr.com/competitions?leaderboard=24280`
- Settings for all three: private, restriction `None`, 300 seconds per round; 8/9/8 fixed-order locations.

## Controller regression gate

Passed before any scored competition. In a disposable unscored World round I placed a valid marker, zoomed world-to-city, moved the marker from Normandy to Paris, collapsed the map, took an ordinary Street View step, reopened the map and visibly confirmed the Paris marker persisted. I then abandoned through Menu without submitting. Repeated controller behavior during scored play: the first placement at a newly rendered map state was frequently swallowed or caused the map to shift; every placement therefore required a screenshot and, when necessary, a retry at the **current** rendered target.

## Easy — Round 1/8 — Paris, Place de la Bastille

- Initial frame/cues: July Column/Place de la Bastille geometry, Parisian boulevard fabric, explicit landmark context, dense central-city road furniture.
- Initial belief: Place de la Bastille, Paris; alternatives were nearby central Paris squares. High confidence at city/landmark scale.
- Provisional pin: visibly placed on central Paris, then refined onto Place de la Bastille.
- Exploration/refinement: compared column, opera-side road layout and the rendered landmark geometry.
- Final belief/pin verification: southeast/east carriageway beside the Opéra Bastille; rendered pin remained mostly on the central landmark rather than the exact carriageway.
- Result: **134 m**; visible **+4999 XP**. Reveal was the south/southeast roadway beside the opera.
- Audit: semantic identification correct; belief-to-pin transfer partial at exact-side scale.

## Easy — Round 2/8 — Berlin, Alexanderplatz

- Initial frame/cues: Fernsehturm, explicit U Alexanderplatz signage, plaza/rail fabric, central Berlin streetscape.
- Initial belief: Alexanderplatz station cluster, Berlin; alternatives were adjacent sides of Alexanderplatz. Very high city/landmark confidence.
- Provisional pin: visibly placed in Berlin and refined to the U/S-Bahn station/plaza cluster.
- Exploration/refinement: checked tower bearing, transit entrances and plaza-side roads.
- Final belief/pin verification: Alexanderplatz station cluster; marker was verified there but not on the correct eastern edge.
- Result: **283 m**; visible XP field observed at **+4429 XP** during the animation. Reveal was the east side near Otto-Braun-/Alexanderstraße and bcc.
- Audit: semantic identification correct; street-side transfer partial.

## Easy — Round 3/8 — Salzburg, Hohensalzburg viewpoint

- Initial frame/cues: Hohensalzburg fortress, Salzach/old-town terrain, walled hillside viewpoint and Salzburg urban morphology.
- Initial belief: Hohensalzburg/Stadtmauer viewpoint, Salzburg; low-probability alternatives were other Austrian fortress viewpoints.
- Provisional pin: a zoom audit exposed that the first regional marker had landed near Traunstein; it was immediately corrected into Salzburg.
- Exploration/refinement: used successive rendered zoom levels and the Basteiweg/Stadtmauer map feature.
- Final belief/pin verification: exact Basteiweg/Stadtmauer viewpoint; marker visibly aligned to that feature.
- Result: **21 m**; visible **+5000 XP**.
- Audit: semantic identification and belief-to-pin transfer both exact.

## Easy — Round 4/8 — Český Krumlov, Cloak Bridge

- Initial frame/cues: Český Krumlov castle massing, river-bend old town, elevated overlook and Cloak Bridge geometry.
- Initial belief: Plášťový most/Cloak Bridge, Český Krumlov; alternatives were nearby castle overlooks.
- Provisional pin: visibly placed in Český Krumlov. Progressive zoom caught both a wrong north-city pin and then a north-park pin; each was corrected.
- Exploration/refinement: used the rendered `Plášťový most` landmark and castle approach geometry.
- Final belief/pin verification: exact Cloak Bridge feature, verified at landmark scale at 00:37.
- Submission/controller note: tool latency left 00:14; the first Guess click was swallowed and the immediate retry succeeded at roughly 00:05.
- Result: **21 m**; visible **+5000 XP**.
- Audit: semantic identification and belief-to-pin transfer both exact.

## Easy — Round 5/8 — Pula Arena lookalike failure

- Initial frame/cues: exposed Roman amphitheatre wall/arches, broad roadside setting, Mediterranean vegetation, low surrounding density and monument-scale masonry.
- Initial belief: Colosseum, Rome. Alternatives explicitly tested during the contradiction audit: Pula Arena, Verona Arena and El Jem. Confidence was incorrectly over-weighted by visual resemblance.
- Provisional pin: visibly placed at the Roman Colosseum and refined to its south/southeast roadway.
- Exploration/refinement: inspected frame edges, arch/wall preservation, exposed-versus-embedded geometry, road furniture, vegetation and urban density, but incorrectly rejected the Pula contradictions.
- Final belief/pin verification: Rome Colosseum south/southeast road; marker visibly matched that written belief.
- Result: **349.5 km**; visible **+3524 XP**. Reveal was **Pula Arena, Croatia**.
- Audit: semantic failure; belief-to-pin transfer passed. Calibration adopted: resemblance alone cannot justify 99%/“unmistakable” without a uniquely diagnostic feature or readable place text.

## Easy — Round 6/8 — Zittau/Sieniawka frontier

- Initial frame/cues: green sign naming `Zittau` with PL/D indicators; B178 road overlay; orange Polish `Granica Państwa`; blue pedestrian crossing/yellow refuge bollard; rural bridge junction.
- Initial belief: Polish side of the Zittau B178 frontier, likely Porajów/Sieniawka; alternatives were the German side or nearby Czech tri-border road. Confidence 84% corridor, 45% exact junction.
- Provisional pin: visible marker first landed too far south (near Passau after zoom exposed the mismatch), then was corrected to the Zittau/Poland border corridor.
- Exploration/refinement: successive zoom/pan exposed Zittau, Sieniawka, Porajów and route shields 332/352/354; junction morphology supported the Sieniawka frontier roundabout.
- Final belief/pin verification: B178/354/332 junction approached from Porajów; red marker visibly placed just south of the rendered junction at street scale, 00:43.
- Result: **280 m**; visible **+4999 XP**. Reveal was the B178/354/332 roundabout by Zittauer Neiße-Brücke; pin was one short segment south on route 354.
- Audit: semantic corridor/junction identification correct; belief-to-pin transfer partial at street scale.

## Easy — Round 7/8 — Višnja Gora text-reading failure

- Initial frame/cues: Slovenian yellow signs explicitly `Ljubljana` and `Novo mesto`; a rail/station-like beige building with a blurred nameboard; Slovenian crossing/road furniture; red-tile village and wooded hills.
- Initial belief: the blurred board was read as `VELIKA LOKA`, suggesting Velika Loka near Trebnje. Alternative was a nearby Ljubljana–Novo mesto corridor station. Confidence 91% settlement, 65% junction — materially overconfident for the legibility.
- Provisional pin: visible marker was corrected from an accidental Croatia placement to Slovenia and then to rendered `Velika Loka`.
- Exploration/refinement: zoomed to Trebnje/Velika Loka, its rail icon, route 652, fire station, café and station frontage; the map strongly corroborated the mistaken text read but did not independently validate the source board.
- Final belief/pin verification: route 652 beside the Velika Loka rail stop; marker visibly aligned with the rail icon at street scale, 00:51.
- Result: **17.8 km**; visible **+4912 XP**. Reveal was **Višnja Gora**, west of Velika Loka.
- Audit: settlement-level semantic failure caused by blurred-text misread; belief-to-pin transfer passed exactly. Calibration adopted: low-resolution text must be independently corroborated before selecting among same-corridor stations.

## Easy — Round 8/8 — Flåm

- Initial frame/cues: `FLÅM` repeated on black canopies; Norwegian flags; extreme glacial valley walls; tourist picnic/barrel venue; sparse fjord-village/transport density.
- Initial belief: Flåm tourist/transport complex near the fjord/rail terminus. Alternatives: an up-valley Flåm-branded venue or Gudvangen lookalike. Confidence 96% town, 72% venue.
- Provisional pin: visible marker was placed in western Norway, then repeated zoom audits exposed sea/mountain misplacements and moved it onto rendered Flåm.
- Exploration/refinement: compared Nærøyfjord morphology, Flåm/Myrdal relation, inner-fjord road layout and the rendered Flåmsbana rail icon. Platform-like canopies led to the rail-complex interpretation.
- Final belief/pin verification: Flåmsbana/Flåm Railway station-tourist complex; marker visibly anchored directly on the purple railway icon at landmark scale, 00:57; submitted at 00:38.
- Result: **184 m**; visible **+4999 XP**. Reveal was A-Feltvegen in the Flåm port/restaurant complex, roughly 184 m east.
- Audit: semantic town/complex identification correct; belief-to-pin transfer passed for the written railway belief, but exact-venue inference was one adjacent complex too far west.

## Easy competition reconciliation

- Official rendered leaderboard: **Ivan Yachnik — 38,432 Pts.**, rank #1 (only entrant).
- Distances in round order: **134 m; 283 m; 21 m; 21 m; 349.5 km; 280 m; 17.8 km; 184 m**.
- The leaderboard exposed only the aggregate official points, not per-round point allocations. Visible XP animations are therefore retained above but are not treated as or summed into official points.
- Easy record count audit: **8/8 complete**.

## Medium — Round 1/9 — Valencia street-name overread

- Initial frame/cues: a blurred ground overlay read as `Carrer de Cirilo Amorós`; Valencian `Carrer`; ornate white balcony blocks; Spanish no-entry/containers; dense leafy Mediterranean grid.
- Initial belief: Valencia, on Carrer de Cirilo Amorós in Pla del Remei/Eixample. Alternatives were Barcelona/Castelló if the street read was wrong. Confidence 97% city, 72% block.
- Provisional pin: the visible world marker landed east of intended Valencia; successive zooms exposed placements near Barcelona, offshore and Torrent before correction to Valencia.
- Exploration/refinement: located central Valencia, Ruzafa/Pla del Remei and rendered Cirilo Amorós; compared its crossings and chose Hernán Cortés.
- Final belief/pin verification: Cirilo Amorós × Hernán Cortés; red marker visibly anchored on that rendered intersection at street scale, 00:54.
- Result: **430 m**; visible **+4998 XP**. Reveal was on/near **Carrer de Císcar** by Gran Via/Marquès del Túria; the ground overlay was evidently `Carrer de Císcar`, not `Cirilo Amorós`.
- Audit: city semantic correct, street semantic failure from blurred-text overread; belief-to-pin transfer passed for the written intersection.

## Medium — Round 2/9 — Bologna/Reggio Emilia text overfit

- Initial frame/cues: blurred ground overlay interpreted as `Via Paradisi`; Italian blue parking sign/plates; redbrick shuttered villas; municipal recycling bins; flat lush northern-Italian avenue.
- Initial belief: Reggio Emilia, Via Paradisi. Alternatives were Modena, Parma or Bologna if the street read was wrong. Confidence 96% Italy, 62% Reggio Emilia, 55% exact text.
- Provisional pin: visible marker placed in northern Italy; zoom audits exposed a Milan/Modena/Carpi-area drift before correction onto Reggio Emilia.
- Exploration/refinement: inspected Reggio center and station quarter, Via Turri and adjacent streets; no rendered `Via Paradisi` label appeared, but memory of a Reggio street was incorrectly allowed to dominate.
- Final belief/pin verification: a small rendered street in the Reggio station quarter south of Via Giuseppe Turri, 00:45; block confidence explicitly moderate.
- Result: **58.5 km**; visible **+4716 XP**. Reveal was **Bologna, Via Francesco Roncati**, Saragozza quarter.
- Audit: city/street semantic failure from blurred-text overfit; belief-to-pin transfer passed for the written Reggio belief.

## Medium — Round 3/9 — Utrecht / Amsterdamsestraatweg

- **Untouched cues (up to five):** ground overlay clearly `Amsterdamsestraatweg`; separated Dutch cycleway and bollards; yellow-brick Dutch rowhouses; broad urban arterial; flat dense streetscape.
- **Initial belief:** Utrecht, Netherlands, on Amsterdamsestraatweg in the northwest Zuilen corridor. Alternatives were only another municipality if the overlay were truncated. Confidence: 98% country, 94% city/street, 45% segment.
- **Provisional pin:** the first world-scale click was swallowed, and its retry later audited as an erroneous Eifel placement. I corrected visibly to a central-Netherlands marker at 01:13, but subsequent zoom proved it was actually near Dinxperlo rather than Utrecht.
- **Refinement:** panned west through Arnhem to Utrecht and exposed the city labels. Recovery from the large placement mismatch consumed the usable refinement window.
- **Final belief / pin verification:** Utrecht, Amsterdamsestraatweg, Zuilen. At 00:07 the map unexpectedly changed scale after final clicks; no final marker was visibly rendered before the forced Guess submission. Exact pin verification therefore failed and is recorded honestly.
- **Result:** 10.7 km; visible result animation `+4947 XP` (not official competition points). Reveal placed the actual at Zuilen/Utrecht on the Amsterdamsestraatweg corridor and the rendered guess near Kockengen, about 10.7 km northwest.
- **Audit:** semantic country/city/street belief correct; belief-to-pin transfer materially failed. Controller issues: swallowed first click, highly misleading coarse-scale position, and final scale shift/marker non-render inside the emergency window.

## Medium — Round 4/9 — N44/N444 glyph trap, Flanders

- **Untouched cues (up to five):** short ground route overlay initially read as `N44`; Flemish brick houses and red-paved side paths; Belgian white plates; storefront `FOTO AKTIEF`; flat ribbon-development town.
- **Initial belief:** Belgium, Flanders, on the N44 Aalter–Maldegem corridor, likely Maldegem/Knesselare. Alternatives: an N444 corridor town or the Aalter-side settlement. Confidence: 99% country, 82% putative N44 corridor, 45% municipality/segment.
- **Provisional pin:** used hover-only expansion and successive screenshot-verified zoom/pan until western Flanders and the in-game N44 label were visible. First click was swallowed; retry visibly placed the marker tip on the N44 mid-corridor near Knesselare at 02:40.
- **Refinement:** counted the source overlay left-to-right and right-to-left as N plus two visible 4s, while explicitly retaining N444 as an unresolved alternative. The in-game map independently displayed N44 on the Aalter–Maldegem corridor, but that was only a map existence match, not independent source-text corroboration. Keyboard Street View exploration covered roughly five steps each direction but produced no additional readable place text.
- **Final belief / pin verification:** Maldegem, on the N44 southern approach just south of the N9 junction. Rendered marker tip visibly matched country, city and road immediately beside Oude Maldegemweg at 00:34. N444 remained the main alternative. First Guess click was swallowed; retry succeeded at about 00:18.
- **Result:** 31 km; visible result animation `+4847 XP` (not official competition points). Reveal audit identified the actual in Merelbeke-Melle on/near the N444 urban corridor; the guess was Maldegem N44.
- **Audit:** semantic route/city belief failed by truncating the decisive short code; belief-to-pin transfer passed exactly for the written but wrong Maldegem/N44 belief. Controller placement was stable after hover-only pre-zoom; submission required one retry.

## Medium — Round 5/9 — Rua Figueira da Foz, Coimbra

- **Untouched cues (up to five):** ground overlay initially compressed as `R. Figueiroa`; northern/central Portuguese granite-trimmed façades; EU/Portuguese white plates; blue parking sign; dense small-city street.
- **Initial belief:** northern Portugal, likely Braga or Guimarães, with Porto and Viseu alternatives. Confidence: 99% country, 55% northern region, 30% city, 90% partial street text.
- **Provisional pin:** hover-only expansion, a label-verified recovery from an accidental desert-centered zoom, then placement on the visible Braga label at 03:24. The marker looked Braga-scale at that view, though later zoom audited it as Cabeceiras de Basto.
- **Refinement:** completed approximately five Street View steps in each direction before map work. Saw a generic clinical-laboratory sign and, after rotating/approaching, expanded the road text to `...gueira da Foz`, i.e. Rua Figueira da Foz. No independent city text was found. Map recovery panned from Cabeceiras through Fafe to Guimarães.
- **Final belief / pin verification:** shifted to Guimarães, putative Rua Figueira da Foz, with Braga still alternative. At 00:10 the only rendered marker appeared west/southwest of the Guimarães label near the N206/Castelo de Guimarães area; this was visibly a city-outskirts rather than street-exact placement, and it was submitted immediately.
- **Result:** 137.1 km; visible result animation `+4359 XP` (not official competition points). Reveal flag was Coimbra; the source street was Rua Figueira da Foz in Coimbra.
- **Audit:** country and street-text family were correct, but city semantics failed; belief-to-pin transfer was only partial because the marker was west of the written city center. Controller coarse-scale drift and recovery consumed the safety window.

## Medium — Round 6/9 — Bergsgatan, Uppsala

- **Untouched cues (up to five):** ground overlay `Bergsgatan`; Swedish `-gatan` naming; green timber houses with red tile roofs; curb-free quiet residential lane; lush overcast Nordic setting with solar streetlamp.
- **Initial belief:** Sweden, probably a southern/south-central small town, with Kalmar/Karlskrona/Jönköping and western/Stockholm-satellite alternatives. Confidence: 98% country, 50% broad south, 15% city, 95% street name.
- **Provisional pin:** hover-only expansion and label-verified zoom to southern Sweden, then placement on visible Växjö. First click swallowed; retry showed a marker apparently on Växjö at 03:41. Later zoom audited that coarse marker as rural Attsjö east of the city.
- **Refinement:** completed at least five residential Street View steps each direction and continued farther toward an intersection, but found no independent place text. Map recovery panned west from Attsjö to Växjö and inspected detailed Väster/south-central streets; no Bergsgatan label was found.
- **Final belief / pin verification:** Växjö, Bergsgatan, with only about 25% city confidence and Jönköping/Kalmar/Karlskrona/smaller-town alternatives. Rendered marker tip was visibly in south-central Växjö by Smålands Museum at 00:18—not street-exact—and was submitted immediately.
- **Result:** 368.9 km; final visible result animation `+3457 XP` (an earlier `+1769` was mid-animation, not the final display). Reveal actual was Uppsala on Bergsgatan.
- **Audit:** country and street semantics correct; city semantics failed. Belief-to-pin transfer passed at city level but was not street-exact. The broad-south architectural prior was badly calibrated, and coarse marker drift again required recovery.

## Medium — Round 7/9 — Sepapaja, Tartu

- **Untouched cues (up to five):** ground overlay `Sepapaja`; Estonian `sepa-/paja` morphology; detached plaster/timber houses with steep Baltic roofs; curved Soviet-era lamp and patched asphalt; flat manicured residential setting.
- **Initial belief:** Estonia, probably Pärnu or another small western/coastal city; Kuressaare, Tartu and Tallinn outskirts alternatives. Confidence: 98% country, 45% west/coastal, 30% Pärnu, 85% street reading.
- **Provisional pin:** after label-verified Estonia/Tallinn map recovery, first click swallowed and retry visibly placed a marker apparently on Tallinn at 02:23. Tallinn was raised to about 55% because Sepapaja was a remembered Tallinn street name, although its office-district context contradicted the residential frame.
- **Refinement:** completed roughly five Street View steps in each direction; found only more detached homes and no independent place text. Zoom audited the coarse marker as Maardu rather than Tallinn, so it was corrected toward the city.
- **Final belief / pin verification:** Tallinn metro, Sepapaja/Ülemiste, with Pärnu and Kuressaare still live. Rendered marker tip was visibly in Peetri just south of Tallinn at 00:41—metro-scale, not street-exact—and was submitted immediately.
- **Result:** 161.4 km; final visible result animation `+4254 XP` (an earlier `+3548` was mid-animation). Reveal actual was Tartu, Sepapaja street.
- **Audit:** country/street semantics correct, city semantics failed. Belief-to-pin transfer matched Tallinn metro coarsely but not the named street. The remembered-name prior incorrectly outweighed the residential contradiction.

## Medium — Round 8/9 — Slovak street lookalike, Banská Bystrica

- **Untouched cues (up to five):** ground overlay appeared `Jelovška`; Alpine plaster houses and balconies; steep forested ridge; central-European utilities/fences; sunny compact valley settlement.
- **Initial belief:** Bled, Slovenia, on Jelovška cesta, with another Slovenian Alpine town or Slovak `Jeleňova/Jelšová` lookalike alternative. Confidence: 88% Slovenia, 78% Bled/street, 45% segment.
- **Provisional pin:** hover-only expansion and successive label-verified zoom/pan reached Bled before placement. First click swallowed; retry rendered a marker apparently just south of Bled at 02:17. Later zoom audited that marker as Ribno, south of the city.
- **Refinement:** zoomed into Bled and visually inspected local street labels: Rečiška, Seliška, Ljubljanska, Koritenska, Ribenska and Mlinska cesta. Jelovška was not rendered, but the south-town residential grid remained the working hypothesis.
- **Final belief / pin verification:** Bled, Slovenia, Jelovška cesta, residential grid south of the center below Rikli Balance Hotel/near Straža. Rendered marker tip visibly matched that south-Bled grid at 00:23. First Guess click swallowed; retry succeeded near 00:11.
- **Result:** 461.6 km; visible result animation `+3151 XP` (not official competition points). Reveal actual was Banská Bystrica, Slovakia; the source text was a Slovak lookalike rather than Slovenian Jelovška.
- **Audit:** semantic country/city/street failed; belief-to-pin transfer passed strongly for the written Bled belief. The remembered Bled street prior overrode the explicit Slovak lookalike alternative.

## Medium — Round 9/9 — County Galway roadside

- **Untouched-frame cues (max five):** Republic of Ireland yellow hard-shoulder lines; broad improved two-lane road; white rendered houses; pale limestone field walls; flat/windy Atlantic vegetation.
- **Initial belief:** County Galway, likely a Galway satellite such as Claregalway or Oranmore. Alternatives: Clare/Burren edge or Mayo. Confidence: Ireland 99%; Galway/Clare limestone belt 72%; municipality/road 25%.
- **Provisional pin:** Galway region, placed and visibly checked at 03:06 after the first click was swallowed. Later map audit showed that provisional to be wrongly in Connemara/Clifden.
- **Exploration/refinement:** Collapsed the map and moved several steps in both directions. A wall-mounted sign remained unreadable. With no decisive place text, weighted the wide-road geometry and limestone landscape toward the N83/N84 approaches north/east of Galway.
- **Final belief:** Claregalway, County Galway, on an N83/N84-type improved road; Oranmore and the Clare/Burren edge remained alternatives.
- **Final visible pin verification:** At 00:16 the marker tip appeared immediately northeast of the rendered Galway label on the apparent Galway–Tuam corridor. Guess was clicked immediately. The result exposed a severe transfer mismatch: the red guessed marker resolved at Tysaxon east of Athenry, about 30 km east of the apparent pre-submit position.
- **Result:** 29.6 km; final visible **+4854 XP** (XP only, not official competition points). Actual black flag: Bushypark/Newcastle on Galway's west edge. Irish/County Galway regional inference was correct, but the selected suburb/road was wrong; belief-to-pin transfer failed.

## Medium competition reconciliation

- **Official leaderboard:** Ivan Yachnik, #1, **39,583 Pts.**
- **Round-value reconciliation:** 4,998 + 4,716 + 4,947 + 4,847 + 4,359 + 3,457 + 4,254 + 3,151 + 4,854 = **39,583**, exactly matching the official total.
- **Distances:** 430 m; 58.5 km; 10.7 km; 31 km; 137.1 km; 368.9 km; 161.4 km; 461.6 km; 29.6 km.

## Hard — Round 1/8 — Greek karst road

- **Untouched-frame cues (max five):** Greek `Επαρ.Οδ.` provincial-road overlay; narrow unmarked pavement; dense juniper/conifer scrub; pale rocky shoulders; dry rolling plateau without buildings or utilities.
- **Initial belief:** Greece, likely a Cretan upland provincial road. Alternatives: Arcadian Peloponnese or Kefalonia. Confidence: Greece 99%; island/upland 45%; Crete 35%.
- **Provisional pin:** Central Crete at the rendered `Kriti` label between Chania and Heraklion, visibly verified at 03:50 after one swallowed click.
- **Exploration/refinement:** Moved repeatedly along the road. A passing coach exposed more of the rendered Greek road overlay. I misread the right-hand place string as likely `Παραμυθιάς` and shifted the hypothesis to Epirus. The map remained expanded after the provisional until I found that clicking its non-geographic title bar collapses it; zoom/placement latency then consumed the intended safety margin.
- **Final belief:** Paramythia/Arta–Thesprotia area; Arcadian Peloponnese retained as the main alternative.
- **Final visible pin verification:** At 00:07 the marker tip was visibly southwest of Ioannina near Arta/Paramythia; Guess was clicked immediately. The final marker matched the written belief.
- **Result:** 253 km; final visible **+3882 XP** (animation initially showed +3866). Actual black flag: just south of Tripoli in Arcadia. Greece was correct, but the road-text reading/region was wrong; the retained Arcadian alternative was actual.

## Hard — Round 2/8 — Transylvanian village road

- **Untouched-frame cues (max five):** narrow rural road with one dashed centerline and no edge lines; weathered timber barn with reddish tile roof; rolling pasture dotted with shrubs; orchard/deciduous verge; sparse utility poles plus isolated curved streetlights.
- **Initial belief:** western Balkans, likely Serbia or Bosnia in the Zlatibor/Šumadija–northeast Bosnia belt. Alternatives: Romania/Transylvania or inland Croatia. Confidence: ex-Yugoslavia 65%; Serbia 30%; Bosnia 25%.
- **Provisional pin:** West-central Serbia between Sarajevo and Niš, visibly verified at 03:43 after one swallowed placement click.
- **Exploration/refinement:** Collapsed the map and explored five-plus steps in both directions, then followed the road into the village. Low red-tile houses, white-painted orchard trunks, and concrete/lattice utility poles strengthened Romania. The decisive rendered overlay appeared to read `DJ106G`, a Romanian county-road format, rejecting the initial Serbia/Bosnia hypothesis.
- **Final belief:** Sibiu County, Transylvania, likely east or northeast of Sibiu on the DJ106-family road network.
- **Final visible pin verification:** At 00:13 the marker tip appeared in south-central Transylvania on the Sibiu belt. The first Guess click near 00:05 was swallowed; an immediate retry submitted. Result revealed the marker south of Boița, on the wrong side of Sibiu.
- **Result:** 34.9 km; final visible **+4828 XP**. Actual black flag: Vurpăr northeast of Sibiu. Country and metro/county-region inference were correct, but the pin was south rather than northeast of Sibiu; transfer was regional, not road-scale exact.

## Hard — Round 3/8 — Rhodope mountain village

- **Untouched-frame cues (max five):** narrow unmarked village road with formal curb; grey metal bridge railing; short blue/white roadside post; white rendered hipped-roof houses with red tiles; lush rounded deciduous mountains under bundled overhead cables.
- **Initial belief:** Balkan mountain village, most likely Bulgaria's Rhodopes. Alternatives: North Macedonia, Kosovo/Bosnia, or inland Montenegro. Confidence: Balkans 70%; Bulgaria 35%; North Macedonia 25%.
- **Provisional pin:** South-central Bulgaria/Rhodopes, visibly verified at 03:38 after one swallowed placement click.
- **Exploration/refinement:** Explored well beyond five steps in one direction, deliberately turned around, and covered the opposite side. Saw a yellow-diamond priority-road sign, 30 km/h sign, blue/white posts, large clustered white homes with stone bases, and steep densely green slopes. These jointly strengthened a Bulgarian Pomak-village interpretation; no readable place name appeared.
- **Final belief:** Western Rhodopes, favoring the Satovcha/Ribnovo/Garmen belt; Smolyan/eastern Rhodopes remained the main regional alternative.
- **Final visible pin verification:** At 00:22 the marker tip appeared in the western Rhodope belt just north of the Greek border. First Guess click was swallowed at 00:12; retry submitted. Result showed the red guess across the border near Elatia/Skaloti, exposing a border-level transfer failure.
- **Result:** 63.3 km; final visible **+4693 XP**. Actual black flag: Vărbina/Върбина east of Smolyan. Bulgaria/Rhodopes was semantically right but the west/east subregion was wrong; rendered pin resolved in Greece.

## Hard — Round 4/8 — Hungarian route 451

- **Untouched-frame cues (max five):** perfectly flat horizon; adjacent sunflower, wheat, and maize fields; narrow unmarked side view of pavement; sparse thin utility poles; hot/dry midsummer vegetation without buildings.
- **Initial belief:** Pannonian Plain, favoring Vojvodina Serbia. Alternatives: eastern/southern Hungary, western Romania, or Slavonia. Confidence: Pannonian basin 75%; Serbia 30%; Hungary 25%; Romania 20%.
- **Provisional pin:** Southern Vojvodina just north of Belgrade, visibly verified at 03:34 after one swallowed click.
- **Exploration/refinement:** Turned to face the road and discovered the rendered route overlay. Two independent views both showed exactly three glyphs: left-to-right `4-5-1`, right-to-left `1-5-4`; excluded 45, 4511, and other codes. This identified Hungary's route 451 and the Kiskunfélegyháza–Csongrád–Szentes corridor. Explored at least five steps each way.
- **Final belief:** Route 451, favoring the Csongrád/Szentes stretch.
- **Final visible pin verification:** At 00:25 the marker tip appeared in southern/eastern Hungary between Budapest and Serbia and was intended for the 451 corridor. First Guess at 00:14 was swallowed; retry submitted. Result revealed the red marker near Mezőkovácsháza/Battonya, far southeast of the intended road.
- **Result:** 87.6 km; final visible **+4580 XP**. Actual black flag: route 451 at Csongrád. Semantic solution was essentially exact to country/route/corridor; belief-to-pin transfer failed severely.

## Hard — Round 5/8 — Baltic wetland track

- **Untouched-frame cues (max five):** single-vehicle gravel double-track with grassy center; tall poplar/birch plus willow/alder-like scrub; flat lowland; lush damp verges; no fences, utilities, signs, or buildings.
- **Initial belief:** Central/eastern European floodplain, favoring Hungary's Tisza/Danube lowlands or northern Serbia. Alternatives: eastern Poland/Slovakia or Baltic wetland. Confidence: central/eastern Europe 65%; Hungary 30%; Serbia 15%; Poland/Slovakia 15%.
- **Provisional pin:** Central/eastern Hungary around the middle Tisza/Szolnok lowland, visibly verified at 02:48 after one swallowed click.
- **Exploration/refinement:** Covered ten-plus forward steps and the required opposite-direction steps. The same gravel track and continuous scrub persisted without text or infrastructure. Briefly considered managed orchard rows, but later views showed natural wet scrub. I overweighted the Pannonian floodplain prior and underweighted the birch/Baltic vegetation.
- **Final belief:** Middle-Tisza floodplain, favoring the Tisza-tó/Szolnok wetland belt; Latvia/Baltic lowland remained a weaker alternative.
- **Final visible pin verification:** At 00:38 the marker tip was visibly east of Budapest, west of Debrecen, and north of Szeged. First Guess was swallowed at 00:25; retry submitted. Pin matched the written (wrong) belief.
- **Result:** 1,191.2 km; final visible **+1518 XP**. Actual black flag: central Latvia east/southeast of Riga. Semantic inference failed; the flat wet track and birch/willow scrub were Baltic.

## Hard — Round 6/8 — Lithuania route 3436

- **Untouched cues (max five):** rendered four-glyph route `3436`; broad pale gravel road; flat cool-climate cropland; sparse/partly derelict white farm complex with a low detached house; mixed deciduous and spruce shelterbelts under humid layered cloud.
- **Initial belief:** Baltic, favoring Lithuania. Alternatives Estonia or an unpaved Hungarian four-digit connector. Confidence 70% Baltic/northeast Europe; Lithuania 40%, Estonia 25%, Hungary 20%. The route was independently counted left-to-right as 3-4-3-6 and right-to-left as 6-3-4-3.
- **Provisional pin:** central Lithuania north of Kaunas in the Kaunas–Šiauliai belt, rendered and visibly verified at 03:11.
- **Exploration/refinement:** collapsed the map and traversed forward to a rendered village sign that appeared to read `GAIŽIŪNAI`, strengthening Lithuania but suggesting the wrong Jonava-area placement; continued multiple steps and then reversed four steps for an independent view. Kept the Panevėžys/Kėdainiai corridor live as an alternative.
- **Final belief and pin audit:** Lithuania, route 3436, tentatively Jonava district northeast of Kaunas. At 00:09 the rendered marker tip was visibly northeast of Kaunas and west/northwest of Vilnius, matching the written belief at country/region and city scales. Submitted immediately. The first refinement click around 00:25 was swallowed and required a retry.
- **Result:** 82.5 km; final visible `+4604 XP`. Actual black flag southwest of Panevėžys between Baisogala and Krekenava; red guess far southeast near the E272/A2 area between Ukmergė and Širvintos, east of Jonava.
- **Audit:** country semantics correct, route/settlement interpretation wrong. Belief-to-pin transfer passed at the intended Jonava-region scale; geographic refinement remained materially too coarse/wrong.

## Hard — Round 7/8 — Denmark, Skallevej

- **Untouched cues (max five):** rendered road overlay `Skallevej`; narrow unmarked asphalt with light gravel shoulders; immense flat open cropland; a wind turbine and sparse distant utility/farm structures; low dark tree line/ridge beneath cool maritime broken cloud.
- **Initial belief:** Denmark, favoring west/southwest Jutland. Alternatives Lolland/Falster or another flat Danish island. Confidence 97% Denmark, 45% west/southwest Jutland.
- **Provisional pin:** Esbjerg / southwest Jutland, screenshot-verified at 03:20 with the rendered marker tip on the Esbjerg label. The first click was swallowed; the retry placed it.
- **Exploration/refinement:** collapsed the map and traversed at least five rendered Street View steps in one direction, returned to the origin, and continued at least five steps beyond it in the opposite direction. Both views remained open fields with no independent business, intersection, or transit text. Used ordinary in-game map labels to compare the Esbjerg–Varde–Ribe coastal plain, then corrected an E20/Bramming displacement.
- **Final belief and pin audit:** Denmark, west/southwest Jutland, favoring rural west/northwest Esbjerg near Sjellborg/Hjerting. At 00:49 the visible marker was at the map's top edge with its tip apparently on/just east of Sjellborg, northwest of Esbjerg; submitted immediately after the checkpoint.
- **Result:** 118.1 km; stable final visible `+4443 XP` (initial animation briefly showed `+3715 XP`). Actual black flag at Harboøre on the west coast between Thyborøn and Lemvig. Result red marker appeared near Blåvand/Oksbøl.
- **Audit:** Denmark and west-Jutland semantics correct, but wrong southwest sector versus actual northwest-central coast. Belief-to-pin transfer passed only at country/region scale. It failed at city/local scale because the pre-submit rendered tip appeared near Sjellborg/Hjerting while the result marker resolved materially farther west at Blåvand/Oksbøl; this is preserved as a controller/map-transfer discrepancy.

## Hard — Round 8/8 — Finland boreal road

- **Untouched cues (max five):** narrow high-quality boreal asphalt; white edge lines; paired white center lines that appeared solid/near-solid through the bend; dense mixed pine/spruce/birch forest with a recently cleared verge; broad dark survey-car hood visible under bright clear sky.
- **Initial belief:** Finland, favoring the south-central/lake-district interior. Alternatives Sweden or Estonia. Confidence 55% Finland, 25% Sweden, 15% Estonia; low city confidence.
- **Provisional pin:** south-central Finland lake district between Tampere and Jyväskylä, visibly verified at 03:45 with the marker tip northeast of Tampere amid the lake belt.
- **Exploration/refinement:** collapsed the map; traversed at least five points in the initial direction, returned past the origin, and continued more than thirty points in the opposite direction while actively seeking signs, junctions, buildings, or route text. The road alternated paired solid/dashed white center treatments through mixed forest and a hay field; no readable place/route text appeared. Visible `© Autori` attribution and the distinctive survey-car view raised Finland confidence to 98%. The flatter Oulu–Kajaani corridor remained the principal regional alternative.
- **Final belief and pin audit:** Finland, Jyväskylä / south-central lake district. At 00:46 the rendered marker tip was visibly just north of the `Jyväskylä` label, matching written belief at country, region, and city scales. Submitted immediately.
- **Result:** 285.7 km; stable final visible `+3757 XP` (initial animation briefly showed `+3120 XP`). Actual black flag inland east/southeast of Oulu, north of Kajaani and west of Suomussalmi in the Oulu–Kainuu corridor; red guess exactly at Jyväskylä.
- **Audit:** Finland semantics correct, but regional selection was too far south; the retained Oulu–Kajaani alternative was closer. Belief-to-pin transfer passed cleanly at country, region, and city scales.

## Hard competition reconciliation

- **Distances in round order:** 253 km; 34.9 km; 63.3 km; 87.6 km; 1,191.2 km; 82.5 km; 118.1 km; 285.7 km.
- **Final visible XP fields in round order:** 3,882; 4,828; 4,693; 4,580; 1,518; 4,604; 4,443; 3,757. Their arithmetic sum is **32,305 XP**, preserved only as a diagnostic animation-field sum, not official points.
- **Official leaderboard outcome:** the rendered Hard leaderboard repeatedly showed **No entries yet**. No official Hard points total exists for this run.
- **Finalization failure:** after R8 submission I navigated directly from its result screen to the leaderboard without clicking the last `Continue`. A later rendered guard stated: `You have already seen this competition, but did not finish it. Please wait at least one hour before re-playing.` No replay was attempted.
- **Non-replay recovery audit:** visible browser Back/Alt-Left returned only to the generic Daily Competition page, not the R8 result; the claimed Chrome-tab list contained exactly one tab titled `Competitions`, with no result/completion tab; delayed leaderboard-only refresh still showed `No entries yet`.
- **Hard record count audit:** **8/8 round records complete**, but competition-finalization/official scoring is incomplete.

## Full-run semantic-versus-transfer audit

Definitions used below: **correct/near** means the chosen named city, landmark, road, or corridor matched the reveal at the justified target scale; **partial** means only country/broad region or another non-target component matched; **wrong** means the chosen target failed. **Strong transfer** means the result marker matched the written final belief at its intended scale; **partial transfer** means it matched only at a broader scale or an adjacent side/feature; **fail** means a material belief-to-pin mismatch.

| Record | Semantic outcome | Belief-to-pin transfer | Concise audit |
|---|---|---|---|
| Easy R1 | Correct/near | Partial | Bastille correct; exact carriageway side missed. |
| Easy R2 | Correct/near | Partial | Alexanderplatz correct; eastern plaza edge missed. |
| Easy R3 | Correct/near | Strong | Salzburg Basteiweg/Stadtmauer exact. |
| Easy R4 | Correct/near | Strong | Cesky Krumlov Cloak Bridge exact. |
| Easy R5 | Wrong | Strong | Rome belief transferred faithfully; reveal was Pula. |
| Easy R6 | Correct/near | Partial | Frontier junction correct; one road segment south. |
| Easy R7 | Wrong | Strong | Velika Loka belief transferred exactly; reveal was Visnja Gora. |
| Easy R8 | Correct/near | Strong | Flam correct; written rail-complex target transferred, reveal was adjacent port complex. |
| Medium R1 | Partial | Strong | Valencia correct, street overread; written intersection transferred. |
| Medium R2 | Wrong | Strong | Reggio belief transferred; reveal was Bologna. |
| Medium R3 | Correct/near | Fail | Utrecht/Amsterdamsestraatweg semantics correct; result pin resolved at Kockengen. |
| Medium R4 | Wrong | Strong | N44/Maldegem belief transferred; actual was N444/Merelbeke-Melle. |
| Medium R5 | Partial | Partial | Portugal/street family correct, city wrong; marker west of written Guimaraes center. |
| Medium R6 | Partial | Partial | Sweden/Bergsgatan correct, city wrong; pin matched Vaxjo only at city scale. |
| Medium R7 | Partial | Partial | Estonia/Sepapaja correct, city wrong; pin matched Tallinn metro, not the named street. |
| Medium R8 | Wrong | Strong | Bled belief transferred strongly; reveal was Banska Bystrica. |
| Medium R9 | Partial | Fail | County Galway region correct, locality wrong; rendered result pin jumped east of Athenry. |
| Hard R1 | Partial | Strong | Greece correct, region wrong; Arta/Thesprotia pin matched belief. |
| Hard R2 | Correct/near | Partial | Sibiu county/east-northeast corridor correct; pin landed south of Sibiu. |
| Hard R3 | Partial | Fail | Bulgaria/Rhodopes correct broadly; result pin crossed into Greece. |
| Hard R4 | Correct/near | Fail | Route 451/Csongrad semantics exact; result pin landed far southeast. |
| Hard R5 | Wrong | Strong | Hungary belief transferred; reveal was central Latvia. |
| Hard R6 | Partial | Strong | Lithuania correct, road/settlement wrong; Jonava-region belief transferred. |
| Hard R7 | Partial | Partial | Denmark/west Jutland correct, wrong sector; result pin shifted from apparent Sjellborg to Blavand/Oksbol. |
| Hard R8 | Partial | Strong | Finland correct, region too far south; Jyvaskyla belief transferred exactly. |

### Count reconciliation

| Competition | Semantic correct/near | Semantic partial | Semantic wrong | Transfer strong | Transfer partial | Transfer fail | Records |
|---|---:|---:|---:|---:|---:|---:|---:|
| Easy | 6 | 0 | 2 | 5 | 3 | 0 | **8** |
| Medium | 1 | 5 | 3 | 4 | 3 | 2 | **9** |
| Hard | 2 | 5 | 1 | 4 | 2 | 2 | **8** |
| **All** | **9** | **10** | **6** | **13** | **8** | **4** | **25** |

The marker matched the written final belief at least regionally in **21/25** rounds (13 strong + 8 partial), while semantic targeting was correct/near in **9/25**. On this rubric, inference/interpretation was the larger accuracy bottleneck; controller transfer still caused four material failures and several partial local-scale misses.

## Final scoring totals

- **Easy official:** 38,432 Pts.
- **Medium official:** 39,583 Pts.
- **Confirmed official subtotal (Easy + Medium): 78,015 Pts.**
- **Hard official:** unavailable because the run was left unfinalized before the last `Continue`; leaderboard rendered no entry.
- **Overall official 25-round total:** unavailable; it would be misleading to substitute XP for the missing Hard points.
- **Visible XP diagnostic only:** Easy 37,862 + Medium 39,583 + Hard 32,305 = **109,750 XP**. The Easy XP sum differs from its official leaderboard total, directly demonstrating why this is not an official score.

## Final protocol audit

- Durable round headings counted exactly **8 Easy + 9 Medium + 8 Hard = 25**.
- Every round has an untouched-cue record, initial belief/alternatives/confidence, provisional placement, exploration/refinement account, final belief/pin audit, and result.
- All live interaction used rendered coordinate CUA and ordinary in-game labels; no web search, DOM/source inspection, metadata, API geolocation, or prior-run location material was used.
- The controller regression gate passed before scored play. Recurrent swallowed clicks and coarse-to-fine marker drift were screenshot-audited. The decisive terminal controller/process failure was leaving Hard R8 before the final `Continue`, which prevented official Hard scoring and is not concealed.

## Independent regression comparison with the preceding explicit Sol/max run

### Score comparison

| Set | Preceding Sol/max | Pin-refinement rerun | Change |
|---|---:|---:|---:|
| Easy official | 36,340 | 38,432 | **+2,092** |
| Medium official | 40,211 | 39,583 | **−628** |
| Hard | 28,375 official composite | official unavailable; 32,305 settled-XP diagnostic | not directly comparable |
| Overall | 104,926 official/composite | official unavailable | not directly comparable |

If the eight settled Hard XP fields are used only as a diagnostic distance-score reconstruction, the resulting non-official 25-round figure would be **110,320** (38,432 + 39,583 + 32,305), or 5,394 above the preceding 104,926. It must not be presented as a rendered leaderboard total.

### Distance comparison

Distance remains fully auditable even where the Hard leaderboard is missing:

| Set | Preceding aggregate error | Rerun aggregate error | Change |
|---|---:|---:|---:|
| Easy | 787.500 km | 368.223 km | **−419.277 km (−53.2%)** |
| Medium | 1,159.366 km | 1,259.230 km | **+99.864 km (+8.6%)** |
| Hard | 3,244.700 km | 2,116.300 km | **−1,128.400 km (−34.8%)** |
| **All 25** | **5,191.566 km** | **3,743.753 km** | **−1,447.813 km (−27.9%)** |

### Protocol regression gates

- **PASS — Easy score/distance improvement:** Easy gained 2,092 official points and cut aggregate error by 53.2%, materially validating the extra-time and landmark/street-scale refinement policy for Easy.
- **PASS — valid markers:** all 25 rounds submitted valid non-default markers.
- **PARTIAL — exact-belief refinement:** several exact Easy beliefs reached feature scale (21 m in Salzburg and Český Krumlov), but Medium R3 and Hard R4 still submitted materially displaced markers despite correct named-road/corridor beliefs.
- **FAIL — no correct-country belief transferred across a border:** Hard R3's written Bulgaria/Rhodopes belief resolved to a marker in Greece.
- **FAIL — complete official scoring:** leaving Hard R8 before its final `Continue` prevented leaderboard commitment.

The rerun therefore demonstrates a real Easy and aggregate-distance improvement, not a complete controller fix. Semantic interpretation became the largest error source on Medium, while four material belief-to-pin failures and the terminal Hard-finalization mistake show that controller-state verification still needs another redesign rather than additional timing reminders alone.

## Post-run fresh Hard replacement and final official composite

At the project owner's request, the unfinalized Hard component above was replaced for final scoring by a **new blind Hard run**:

- Fresh isolated player: `gpt-5.6-sol`, reasoning `max`, `fork_turns: none`.
- Fresh competition: entry `https://openguessr.com/competitions?enter=24281`; leaderboard `https://openguessr.com/competitions?leaderboard=24281`.
- Same eight Hard source locations and order, 300 seconds per round, private, restriction `None`.
- The new player received the protocol and fresh entry link only; it did not read this report, prior Hard answers, results, or source data.
- Final Round 8 result remained open until the visible `Continue` was clicked. Its first click was swallowed, the permitted inspected retry succeeded, and the completed leaderboard visibly rendered `Ivan Yachnik — 32,591 Pts.` in both leaderboard sections.
- Durable replacement report: `NAUTILUS_SOL_MAX_HARD_FINAL_RUN.md`.

### Fresh Hard official reconciliation

| Round | Official points | Distance |
|---:|---:|---:|
| 1 | 4,128 | 191.6 km |
| 2 | 3,213 | 442.0 km |
| 3 | 4,928 | 14.5 km |
| 4 | 4,206 | 172.9 km |
| 5 | 4,377 | 133.1 km |
| 6 | 4,080 | 203.2 km |
| 7 | 3,751 | 287.3 km |
| 8 | 3,908 | 246.2 km |
| **Total** | **32,591** | **1,690.8 km** |

- Official Hard percentage: **32,591 / 40,000 = 81.5%**.
- Submission audit: **8/8 valid non-default markers**, **0 defaults**.
- Belief-to-pin audit: **7/8** markers accurately represented the written final belief; Round 4 was the sole material transfer failure.
- Completion audit: terminal state `LEADERBOARD_COMMITTED` passed with a numeric player row and total.

### Final official composite result

| Set | Official points | Maximum | Percentage |
|---|---:|---:|---:|
| Easy | 38,432 | 40,000 | 96.1% |
| Medium | 39,583 | 45,000 | 88.0% |
| Fresh Hard replacement | 32,591 | 40,000 | 81.5% |
| **Final composite** | **110,606** | **125,000** | **88.5%** |

This final composite is transparent rather than a claim that one uninterrupted browser process produced all 25 scores: Easy/Medium came from the original pin-refinement player, and the official Hard component came from the requested fresh isolated replacement player with the same explicit model/reasoning configuration.

Compared with the preceding explicit Sol/max composite (**104,926**), the final official result is **+5,680 points**. Aggregate distance is **3,318.253 km** (368.223 Easy + 1,259.230 Medium + 1,690.800 Hard), improving by **1,873.313 km / 36.1%** from the preceding 5,191.566 km.
