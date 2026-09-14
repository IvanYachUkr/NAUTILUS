# NAUTILUS Blind-Agent Interactive Run

Created: 2026-08-11

## Protocol

- Evaluator: isolated Codex gameplay agent with no benchmark/repository context.
- Agent: Cicero (`blind_easy_gameplay`).
- Run configuration attribution (provided by the project owner): GPT-5.6 with `max` reasoning effort.
- Provenance note: the subagent spawn call did not explicitly override the model or reasoning effort, and resolved runtime telemetry was not exposed afterward; the configuration above is therefore recorded as owner-supplied metadata rather than independently verified telemetry.
- Condition: interactive panorama (`Restriction: None`).
- Before any panorama movement, rotation, zoom, or map use, record up to five visible cues and an initial country/region/city hypothesis.
- After the initial record, panorama movement, panning, and zooming are allowed.
- The guess map may be panned and zoomed and ordinary labels may be read.
- Map search, automatic geocoding, web search, reverse-image search, source/DOM coordinates, metadata, repository data, and dedicated geolocation APIs are forbidden.
- Final pin is placed manually through the OpenGuessr UI.
- Round budget: 180 seconds.

## Competitions

### Easy (8 rounds)

- Entry: https://openguessr.com/competitions?enter=24264
- Leaderboard: https://openguessr.com/competitions?leaderboard=24264

### Medium (9 rounds)

- Entry: https://openguessr.com/competitions?enter=24265
- Leaderboard: https://openguessr.com/competitions?leaderboard=24265

### Hard (8 rounds)

- Entry: https://openguessr.com/competitions?enter=24266
- Leaderboard: https://openguessr.com/competitions?leaderboard=24266

## Round log

Round-level initial cues, initial hypotheses, exploration updates, final guesses, and scores will be recorded below as the blind agent plays.

### Easy - Round 1

**Initial observation (recorded before any action)**

- Monumental green column in a large traffic circle.
- Dense Haussmann-style mid-rise blocks.
- Bus stop visibly labeled "Bastille."
- Road lettering appears to read "Place de la Bastille."
- Paris-style street furniture and bus lane.
- Initial hypothesis: Place de la Bastille, Paris, France.
- Confidence: very high; the monument, stop label, and road text mutually agree.

**Pre-submission**

- No panorama movement was needed.
- The visible Bastille stop/road labels and July Column confirmed the initial identification.
- Final belief: unchanged and strengthened.
- Intended pin: Place de la Bastille traffic circle in central-eastern Paris, France.

**Result**

- Official leaderboard score: 4,999 points.
- In-round time-based reward display: 4,987.
- Error: 224 m.
- Result confirmed Place de la Bastille, Paris; the submitted pin was just north of the true point.

### Easy - Round 2

**Initial observation (recorded before any action)**

- Berlin Fernsehturm dominates the skyline.
- Blue station sign visibly reads "Alexanderplatz."
- Broad pedestrian/transit plaza with dense bicycle parking.
- GDR-era slab/high-rise architecture.
- Tall Park Inn-like tower at right.
- Initial hypothesis: Alexanderplatz, Berlin, Germany.
- Confidence: very high from the landmark and station label.

**Pre-submission**

- No panorama movement was necessary.
- The Fernsehturm, Alexanderplatz sign, plaza geometry, and adjacent high-rise corroborated each other.
- Final belief: Alexanderplatz, Berlin.
- Intended pin: central Alexanderplatz station/plaza immediately southeast of the Fernsehturm.

**Result**

- Official leaderboard score: 4,999 points.
- In-round time-based reward display: 4,912.
- Error: 286 m.
- Result confirmed Alexanderplatz, Berlin. The pin was near Park Inn on the north side; the true panorama point was southeast near Otto-Braun-Strasse.

### Easy - Round 3

**Initial observation (recorded before any action)**

- Compact Baroque Alpine city beside a broad river.
- Large medieval fortress complex on a steep central hill.
- Church domes and towers among dense pale old-town blocks.
- Snow-dusted/high Alpine ridges beyond.
- Foreground stone rampart and shingled guard structure from another elevated fortification.
- Initial hypothesis: Salzburg, Austria, viewed from Kapuzinerberg toward Hohensalzburg Fortress.
- Confidence: high from the fortress-city-river-Alps configuration.

**Pre-submission**

- A zoomed view confirmed Hohensalzburg Fortress above Salzburg's old town, with the Salzach in front and the Alpine massif behind.
- The camera was inferred to be across the river on the elevated Kapuzinerberg ramparts, rather than at the fortress itself.
- Intended pin: western/southwestern edge of Kapuzinerberg above the right bank, near a viewpoint/rampart facing Hohensalzburg.

**Result**

- Official leaderboard score: 5,000 points.
- In-round time-based reward display: 4,879.
- Error: 20 m.
- Result confirmed the Basteiweg/Kapuzinerberg city-wall viewpoint in Salzburg. The submitted pin was on the same rampart path.

### Easy - Round 4

**Initial observation (recorded before any action)**

- Tightly packed red-tiled medieval town inside a river bend.
- Large castle/monastery wall immediately at left.
- Baroque stone saint statue on an elevated terrace.
- Narrow brown river with a low weir/footbridge.
- Central European wooded hills and a church spire.
- Initial hypothesis: Cesky Krumlov, Czechia, viewed from the castle complex above the Vltava.
- Confidence: high from the iconic castle-town-river composition.

**Pre-submission**

- A zoomed view showed St. Vitus Church among the old-town roofs and the Vltava bend directly below.
- This confirmed a castle-side vantage northwest of the historic core.
- Intended pin: a public castle terrace/bridge viewpoint within Cesky Krumlov Castle, overlooking the old town and river rather than the town center.

**Result**

- Official leaderboard score: 5,000 points.
- In-round time-based reward display: 4,801.
- Error: 18 m.
- Exact location: Plastovy most (Cloak Bridge) in Cesky Krumlov Castle. The pin was on the bridge viewpoint, only metres from the true point.

### Easy - Round 5

**Initial observation (recorded before any action)**

- Unmistakable exterior arches of the Colosseum at left.
- Umbrella pines and formal park landscaping.
- Right-hand traffic with an Italian coach bus.
- Cobbled traffic island and urban roundabout signage.
- Bright Mediterranean setting.
- Initial hypothesis: Rome, Italy, on the road immediately south/east of the Colosseum (Via Celio Vibenna / Piazza del Colosseo area).
- Confidence: very high from the landmark.

**Pre-submission**

- No panorama movement was needed because the landmark was exact.
- The road/park configuration placed the camera on the southern arc beside the Colosseum, approaching the landscaped split near Via Celio Vibenna.
- Intended pin: south/southeast side of the Colosseum road loop in Rome.

**Result**

- Official leaderboard score: 3,524 points.
- In-round time-based reward display: 3,454.
- Error: 349.8 km.
- The landmark identification was wrong: the true location was Pula, Croatia, beside Pula Arena, not Rome's Colosseum.
- Failure mode: a superficially similar Roman amphitheatre produced an overconfident landmark match.

### Easy - Round 6

**Initial observation (recorded before any action)**

- Route marker/road text "B178."
- Green direction sign visibly says "Zittau" with "PL" and "D" country discs.
- Yellow roadside warning appears consistent with a state-border notice.
- Blue European pedestrian-crossing signs and right-hand traffic.
- Low river/bridge landscape with a small church.
- Initial hypothesis: Germany-Poland border crossing immediately east of Zittau, likely at/near Sieniawka on the Polish side.
- Confidence: medium-high for the Zittau border area, lower for the exact side of the border.

**Pre-submission**

- Rotating right made the yellow sign clearly legible as Polish "Granica Panstwa" (state border), immediately before the bridge.
- Combined with the Zittau/PL/D sign, this placed the camera on the Polish approach to Germany at the Sieniawka-Zittau crossing over the border river.
- Belief update: from the general border area to specifically the Polish side.
- Intended pin: junction/bridge approach in Sieniawka, just east of the German border.

**Result**

- Official leaderboard score: 4,870 points.
- In-round time-based reward display: 4,646.
- Error: 26.4 km.
- The true flag was at the Sieniawka-Zittau Poland/Germany border crossing, confirming the visual diagnosis.
- Pin-placement failure: the manual pin landed southeast near the Jizera Mountains because the agent mis-positioned the highly zoomed map.

### Easy - Round 7

**Initial observation (recorded before any action)**

- Yellow Slovenian-style direction signs for "Ljubljana" and "Novo mesto."
- Small station-like building beside railway tracks.
- Its white name board appears to read "VELIKA LOKA" (not fully certain at this scale).
- Lush low wooded hills and red-tile roofs.
- Slovenian pedestrian-crossing signage.
- Initial hypothesis: Velika Loka, Slovenia, at/near Velika Loka railway station between Ljubljana and Novo Mesto.
- Confidence: medium-high; the destination names establish Slovenia and the station text likely supplies the exact village.

**Pre-submission**

- Zooming made the station name fully legible as "VISNJA GORA," correcting the initial misread of Velika Loka.
- The Ljubljana/Novo mesto signs and adjacent railway confirmed Visnja Gora, Slovenia.
- Belief update: exact village changed from Velika Loka to Visnja Gora.
- Intended pin: road junction immediately in front of Visnja Gora railway station, by Ulica Antona Tomsica.

**Result**

- Official leaderboard score: 5,000 points.
- In-round time-based reward display: 4,883.
- Error: 41 m.
- Result confirmed Visnja Gora railway station, Slovenia. The true point was the nearby Ulica Antona Tomsica/Ciglerjeva ulica junction; the submitted pin was at the station itself.

### Easy - Round 8

**Initial observation (recorded before any action)**

- Very steep green glacial valley meeting a narrow fjord.
- Entrance structure visibly labeled "FLAM."
- Waterfront promenade/fenced transport area.
- Norwegian flag and Nordic timber picnic shelter.
- Cruise-tourism landscaping and barrels.
- Initial hypothesis: Flam, Norway, at the village harbor/Flam Railway tourist area.
- Confidence: very high from the explicit place label and fjord setting.

**Pre-submission**

- No panorama movement was needed.
- The FLAM gate, Norwegian flag, fjord walls, and waterfront transport layout made the location explicit.
- Intended pin: central Flam harbor/visitor area immediately beside Flam Railway station and the fjord terminal.

**Result**

- Official leaderboard score: 4,999 points.
- In-round time-based reward display: 4,861.
- Error: 217 m.
- Result confirmed Flam, Norway. The true point was by Flam Restaurant/Aegir Gastropub at the port end of A-Feltvegen; the submitted pin was west near the station/Flam Travel area.

### Easy competition summary

- Leaderboard placement: #1 (only completed entry at verification time).
- Official total: 38,391 points.
- Correct location/city area: 7 of 8 rounds.
- Principal failure: Pula Arena was overconfidently misidentified as Rome's Colosseum.
- Other notable error: the Sieniawka-Zittau location was diagnosed correctly, but manual map placement introduced 26.4 km of error.

## Medium competition round log

### Medium - Round 1

**Initial observation (recorded before any action)**

- Road label visibly reads "Carrer de Sueca."
- "Carrer" indicates Catalan/Valencian usage.
- White ornate Mediterranean apartment blocks with iron balconies.
- Spanish-style curbside recycling containers and parking.
- Dense, flat urban neighborhood.
- Initial hypothesis: Valencia, Spain, specifically Carrer de Sueca in the Russafa/Ruzafa district.
- Confidence: high because the street name and Valencian language strongly localize it.

**Pre-submission**

- Moving one step kept the "Carrer de Sueca" label visible and showed no conflicting city cues.
- Storefronts and streetscape remained characteristic of Valencia's Russafa district.
- Final belief: unchanged.
- Intended pin: Carrer de Sueca in central Russafa, on the ornate mixed-use block with Generali/Manolo Royo storefronts.

**Result**

- Official leaderboard score: 4,994 points.
- Error: 1,219 m.
- Result map placed the true point northeast of the Russafa pin, around the Gran Via/Carrer de Ciscar side of central Valencia.
- No trustworthy place label was visible on the result card.

### Medium - Round 2

**Initial observation (recorded before any action)**

- Rendered road overlay begins "Via Fla..."
- Blue-edged curbside parking and a blue-square European parking sign.
- Large municipal recycling dumpsters with red-white hazard panels.
- Leafy, flat residential street with a zebra crossing.
- Red-brick/stucco low-rise villas with shutters, scooters, and EU plates.
- Initial hypothesis: northern Italy, likely Bologna or nearby Emilia-Romagna.
- Confidence: medium for Italy and low for the city, based on "Via," parking conventions, bins, and built form.

**Pre-submission**

- Exploration made the road/intersection labels legible as Via Alessandro Codivilla and Via Francesco Roncati.
- The leafy villa district, municipal bins, and bicycle infrastructure fit Bologna's southwest inner neighborhoods.
- Belief update: from generic northern Italy to high-confidence Bologna.
- Intended pin: intersection of Via Alessandro Codivilla and Via Francesco Roncati, southwest of central Bologna near the Saragozza/Stadio area.

**Result**

- Official leaderboard score: 4,999 points.
- In-round time-based reward display: 4,753.
- Error: 216 m.
- The true point was at Via Francesco Roncati and Via Alessandro Guidotti; the submitted pin was about two short blocks east.
- Official distance-based points are deferred to the final leaderboard reconciliation.

### Medium - Round 3

**Initial observation (recorded before any action)**

- Road overlay begins "Amstel..."
- Extensive bicycles and a red-paved cycle lane.
- Dutch yellow/white refuge bollards and precise lane markings.
- Low-rise brick row housing.
- Flat canal-country streetscape with a probable local business/school building.
- Initial hypothesis: Amstelveen/Amsterdam, Netherlands, likely an Amstel-named arterial in Amstelveen.
- Confidence: high for the Netherlands and medium-high for the Amsterdam region from the street name.

**Pre-submission**

- The full road overlay was Amsterdamsestraatweg, not an Amstelveen road.
- Exploration reached storefronts visibly labeled "Tandarts Zuilen" and "CokoZuilen," identifying Utrecht's Zuilen district.
- Belief update: changed to high-confidence Utrecht.
- Intended pin: Amsterdamsestraatweg in Zuilen, near the Tandarts Zuilen/CokoZuilen commercial frontage and a broad parking forecourt.

**Result**

- Official leaderboard score: 4,995 points.
- In-round time-based reward display: 4,791.
- Error: 1,070 m.
- The true point was farther northwest along Utrecht's Amsterdamsestraatweg, near the Demkaweg/industrial-canal end; the submitted pin was too far southeast near Julianapark/Marnixlaan.

### Medium - Round 4

**Initial observation (recorded before any action)**

- Large rendered route overlay "N444."
- Red-paved roadside cycle lane and Belgian-style narrow curbs.
- Detached brick/whitewashed village homes with steep tiled roofs.
- Flat-to-gently rolling Flemish settlement.
- Storefront visibly reads "FOTO AKTIEF."
- Initial hypothesis: Flanders, Belgium, likely an East Flanders village on the N444 near the Ghent-Oudenaarde corridor.
- Confidence: high for Belgium/Flanders from the N-road convention and streetscape; low-medium for the exact municipality.

**Pre-submission**

- Exploration stayed on the N444 through an extended Flemish village strip, passing Foto Aktief, a florist, and a Texaco.
- Manual map reading identified the N444 south of Merelbeke through Schelderode/Kwenenbos/Bottelare toward Oosterzele.
- Belief update: refined to East Flanders with high confidence.
- Intended pin: settled N444 segment around Kwenenbos-Bottelare, just south of Merelbeke.

**Result**

- Official leaderboard score: 4,987 points.
- In-round time-based reward display: 4,814.
- Error: 2,521 m.
- The true point was farther north on the N444 in southern Merelbeke-Melle near Doelstraat; the Kwenenbos-area pin was about 2.5 km too far south.

### Medium - Round 5

**Initial observation (recorded before any action)**

- Rendered street label "R. Figueiral."
- Portuguese "R." abbreviation and a parking placard that appears to say "PRIVATIVO."
- Tightly parked EU vehicles.
- Granite-trimmed cream facades with narrow wrought-iron balconies and tiled roofs.
- Compact but non-metropolitan northern-Portuguese streetscape.
- Initial hypothesis: Braga or Guimaraes, northern Portugal, with a slight lean toward Braga.
- Confidence: high for Portugal, medium for the northern region, and low-medium for the city.

**Pre-submission**

- Exploration revealed a storefront clearly reading "CASA COIMBRA," resolving the city as Coimbra.
- The road overlay appeared to be Rua Figueira da Foz, initially misread as "Figueiral."
- Old facades, calcada paving, ravine edge, and modern apartments fit inner Coimbra.
- Belief update: changed from Braga/Guimaraes to high-confidence Coimbra.
- Intended pin: Rua Figueira da Foz in central/north-central Coimbra, on the older dense block beside Casa Coimbra.

**Result**

- Official leaderboard score: 4,990 points.
- In-round time-based reward display: 4,773.
- Error: 2,026 m.
- The true point was in Coimbra's Santa Cruz/Baixa-Citadina side northwest of the university; the submitted pin landed southeast near the university/botanical-garden side.

### Medium - Round 6

**Initial observation (recorded before any action)**

- Rendered street label "Bergsgatan."
- One-story green timber house with white trim and red tile roof.
- Clipped hedges, small front gardens, and an uncurbed quiet residential lane.
- Scandinavian EU plates.
- Modern flat-head streetlight and grey maritime climate.
- Initial hypothesis: Sweden, probably a small/medium town in Vastra Gotaland or nearby southwest/central Sweden (Boras/Trollhattan-type region).
- Confidence: high for Sweden from "-gatan" and housing; low for the exact town because Bergsgatan is common.

**Pre-submission**

- Opposite-direction exploration reached a cross street whose visible overlay read "Arosgatan" (or very close), while the starting road remained Bergsgatan.
- "Aros" strongly suggested Vasteras (historic Aros), and the flat birch-lined one-story housing fit its outskirts.
- Belief update: changed from generic southwest/central Sweden to medium-high-confidence Vasteras.
- Intended pin: residential Bergsgatan near its Arosgatan junction in Vasteras.

**Result**

- Official leaderboard score: 4,671 points.
- In-round time-based reward display: 4,480.
- Error: 68.1 km.
- The true location was Uppsala; the Vasteras inference was wrong because the cross-street label was likely Arogatan rather than Arosgatan.
- Failure mode: overinterpreting a partially legible street name into a city-specific clue.

### Medium - Round 7

**Initial observation (recorded before any action)**

- Rendered street label ends in Latvian "iela" and begins roughly "Sepa..."
- Detached plaster/timber homes with steep roofs.
- Low metal/picket fences and small gardens.
- Patched unmarked residential pavement with overhead wires.
- Flat, windy-looking Baltic setting.
- Initial hypothesis: Latvia, likely Liepaja or Ventspils with a slight lean toward Liepaja; Jelgava or Riga outskirts also possible.
- Confidence: high for Latvia from "iela," low for the exact city.

**Pre-submission**

- Exploration reached clearly rendered street plates reading "Alasi" and "Sepakuru."
- A business banner showed an Estonian +372 phone number.
- Belief update: corrected the initial Latvia call to high-confidence Estonia.
- City hypothesis: Parnu, with Tartu/Tallinn outskirts as backups.
- Intended pin: Parnu residential district around the Alasi and Sepakuru junction.

**Result**

- Official leaderboard score: 5 points.
- In-round time-based reward display: 5.
- Error: 6,899.5 km.
- The round ended before a valid manual map pin registered, leaving the guess marker near the default West Africa map area.
- The true flag was in Estonia, confirming the exploration-based country correction; post-game source audit identified Tartu, not the intended Parnu.
- Protocol/tooling failure: this is recorded as an invalid/default-map miss despite the intended Parnu pin.

### Medium - Round 8

**Initial observation (recorded before any action)**

- Road overlay appears to be "Jelsova"/"Jeles..."
- Wooded low mountain ridge immediately behind the homes.
- Large stucco family houses with steep dark metal/tile roofs and balconies.
- Narrow patched lane with overhead utility wiring.
- Tidy but modest Central-European alpine-valley suburb.
- Initial hypothesis: Slovakia, likely Zilina or another northern valley city; Slovenia is the main backup.
- Confidence: medium for Slovakia and low-medium for Zilina.

**Pre-submission**

- Two quick forward moves confirmed a sharply wooded valley, steep adjacent ridges, a T-junction with a standard European yield sign, and the same "Jels..." street overlay.
- No legible place name appeared.
- Final belief: northern Slovakia around Zilina/Povazska Bystrica, with Slovenia remaining the main risk.
- Intended pin: provisional northern-Slovakia/Zilina-area pin already placed.

**Result**

- Official leaderboard score: 4,666 points.
- In-round time-based reward display: 4,446.
- Error: 69.1 km.
- Country was correct, but the true location was Banska Bystrica; the provisional pin landed near Bytca/Zilina in northern Slovakia.

### Medium - Round 9

**Initial observation (recorded before any action)**

- Irish-style yellow edge/no-parking lines.
- Left-driving road geometry.
- Extensive grey limestone boundary walls.
- Detached white suburban houses and lush wind-shaped vegetation.
- Atlantic cloudscape on a treeless/low-relief fringe.
- Initial hypothesis: Galway city outskirts, Ireland, possibly west/northwest suburban Galway.
- Confidence: high for Ireland and medium-high for Galway from the limestone-wall landscape.

**Pre-submission**

- Quick exploration made the side-road overlay clearly readable as "Cappagh Rd," confirming west Galway in the Knocknacarra/Cappagh area.
- The limestone walls and suburban fabric now supported high confidence.
- Belief update: refined from generic Galway outskirts to Cappagh Road in western Galway, near Knocknacarra/Barna Woods.
- Intended pin: west Galway along Cappagh Road; a valid Galway provisional pin was already set.

**Result**

- Official leaderboard score: 4,876 points.
- In-round time-based reward display: 4,671.
- Error: 25.2 km.
- The true point was in western Galway city near Bushypark/Newcastle/Cappagh; the provisional map click landed too far west near Costelloe despite the correct city/road identification.

### Medium competition summary

- Leaderboard placement: #1 (only completed entry at verification time).
- Official total: 39,183 points.
- Best exact-area rounds included Bologna (216 m), Valencia (1,219 m), Utrecht (1,070 m), Merelbeke-Melle (2,521 m), and Coimbra (2,026 m).
- Reasoning failures included overinterpreting a blurry Swedish street name into Vasteras instead of Uppsala.
- Execution failure: Round 7 timed out before a valid Estonia pin registered (intended Parnu; actual Tartu), producing a 6,899.5 km default-map miss and only 5 points.

## Hard competition round log

### Hard - Round 1

**Initial observation (recorded before any action)**

- Rendered Cyrillic road overlay appears to read "Etropole - Pravets."
- Narrow unmarked paved rural road.
- Orderly rows of low conifer/orchard-like plantings.
- Dry roadside soil with green Balkan foothill vegetation.
- Bright continental summer sky.
- Initial hypothesis: Bulgaria, specifically the road between Etropole and Pravets northeast of Sofia.
- Confidence: high because the visible overlay appears to name both towns.

**Pre-submission**

- The starting overlay was visually clear as the Etropole-Pravets road, and the dry juniper-covered foothill corridor remained consistent with that exact Bulgarian area.
- Map zoom stalled, so the valid provisional pin was country-level rather than street-level precise.
- Intended final area: between Etropole and Pravets, northeast of Sofia.

**Result**

- Official leaderboard score: 2,432 points.
- Error: 720.2 km.
- The road overlay was Greek "Epar. Od." (provincial road), not Bulgarian Cyrillic.
- Failure mode: script misclassification sent the valid pin to northern Bulgaria while the true point was in Greece.
- No trustworthy true-town label was visible on the result card; post-game source audit identified Arcadia Regional Unit, Peloponnese.

### Hard - Round 2

**Initial observation (recorded before any action)**

- Narrow two-lane rural road with a faded white dashed center and no edge lines.
- Simple concrete/wood utility poles.
- Long weathered farm barn with brick enclosure.
- Rolling treeless-to-scrubby green hills and dark cultivated soil.
- Visible pale/blue Google-car hood typical of some eastern-European coverage.
- Initial hypothesis: Moldova, likely central or northern countryside; eastern Romania or Serbia are backups.
- Confidence: medium-low.

**Pre-submission**

- No readable signs appeared before the cutoff.
- Strongest evidence remained the pale/blue car hood, Soviet-style utility infrastructure, rolling cultivated hills, and rough center-marked road.
- Final belief: Moldova, central/northern countryside.
- Intended pin: valid provisional Moldova pin already set.

**Result**

- Official leaderboard score: 2,519 points.
- Error: 685.3 km.
- Result map placed the true point in central Romania.
- The Moldova hypothesis was directionally close, but the coarse world-map click landed too far east in the Black Sea/Crimea vicinity.
- No explicit true-town label was visible; post-game source audit identified Vurpar, Sibiu County.

### Hard - Round 3

**Initial observation (recorded before any action)**

- Narrow unmarked paved village road crossing a small bridge with a plain gray railing.
- Steep, densely wooded rounded mountains.
- White-plastered homes with shallow red/brown tiled roofs.
- Simple overhead utility wires.
- Blue-painted roadside/bridge post and a small hillside greenhouse.
- Initial hypothesis: Bulgaria's Rhodope Mountains, likely Smolyan/Devin area; North Macedonia is the main backup.
- Confidence: medium-low, based on Balkan mountain architecture and vegetation.

**Pre-submission**

- One forward step revealed a tidy white two-story mountain home with a tiled hipped roof, exterior AC, garden greenhouse, and the same narrow village lane.
- Nothing contradicted the Rhodope/Balkan interpretation.
- Final belief: southern Bulgaria, likely Smolyan/Devin-Rhodope area, with North Macedonia secondary.
- Intended pin: valid coarse south-Bulgaria/Balkan pin already set.

**Result**

- Official leaderboard score: 4,658 points.
- Error: 70.7 km.
- The true location was in Bulgaria's Rhodopes; post-game source audit identified Varbina, Madan Municipality, Smolyan Province.
- The regional hypothesis was correct; the coarse marker landed just across the border in northeastern Greece.

### Hard - Round 4

**Initial observation (recorded before any deliberate scene/map action)**

- Extremely flat cultivated plain.
- Adjacent sunflower, wheat, and maize fields.
- Narrow unmarked paved rural road.
- Sparse simple utility poles.
- Temperate continental vegetation with a low tree line and no buildings or mountains.
- Initial hypothesis: northern Serbia's Vojvodina plain, with eastern Croatia, southern Hungary, or western Romania as backups.
- Confidence: low-medium.
- Tooling anomaly: a second Continue click during the loading transition appears to have placed an accidental Antarctica marker before the panorama rendered. It contained no scene-derived information and was corrected immediately after this initial record.

**Pre-submission**

- The sunflower/wheat/maize pattern on a completely level plain, sparse poles, and narrow paved farm road remained most consistent with the Pannonian Basin.
- No textual evidence separated the nearby border regions.
- Final belief: Vojvodina, northern Serbia, near the Novi Sad-Zrenjanin belt; southern Hungary/eastern Croatia remained close alternatives.
- Intended pin: corrected valid north-Serbia/south-Hungary provisional marker.

**Result**

- Official leaderboard score: 4,302 points.
- Error: 150.2 km.
- The true location was Csongrad District in southern Hungary; the submitted marker was near Zrenjanin, Serbia.
- Regional environment was correct, but the country/border-side decision was wrong.

### Hard - Round 5

**Initial observation (recorded before any action)**

- Long, dead-straight gravel/two-track lane with a grassy center.
- Dense low deciduous hedges or orchard rows on both sides.
- Tall narrow poplar-like trees.
- Lush, slightly damp temperate ground.
- Essentially flat terrain with no poles, signs, buildings, or visible car clue.
- Initial hypothesis: rural Hungary/Pannonian Basin, perhaps an orchard or floodplain track; eastern Croatia or northern Serbia are backups.
- Confidence: low because the scene is highly generic.

**Pre-submission**

- No readable or structural clue appeared beyond the straight hedged/orchard track, flat damp lowland, and poplar vegetation.
- Final belief: Hungary's agricultural floodplain or orchard belts, perhaps eastern/southern Hungary; Croatia/Serbia remained secondary.
- Intended pin: valid Hungary/Pannonian provisional marker already set.

**Result**

- Official leaderboard score: 1,430 points.
- Error: 1,250.9 km.
- Immediate result-screen interpretation suggested Lithuania, but post-game source audit corrected the true location to Ranka Parish, Gulbene Municipality, Latvia; the marker was in Hungary.
- Failure mode: the generic lush straight track was Baltic rather than Pannonian.

### Hard - Round 6

**Initial observation (recorded before any action)**

- Wide pale gravel road explicitly overlaid "3426."
- Extremely flat open cropland.
- Sparse single utility poles.
- Low abandoned-looking white farm structure and a few distant pitched-roof homes.
- Cool northern light, mixed deciduous/conifer tree lines, and layered clouds.
- Initial hypothesis: Lithuania, probably central/northern rural lowlands; Latvia or Estonia are backups.
- Confidence: medium-low, with the numbered unpaved route and Baltic-looking landscape carrying most weight.

**Pre-submission**

- Clearest evidence remained the visible route number "3426" on a maintained but unpaved road, broad Baltic-looking fields, sparse poles, and cool mixed woodland.
- Final belief: Lithuania, likely central or northern lowlands, with Latvia as the closest backup.
- Intended pin: valid Lithuania provisional marker already set.

**Result**

- Official leaderboard score: 4,412 points.
- Error: 125 km.
- The true location was Pasakiai, Radviliskis District Municipality, Lithuania.
- Country hypothesis was correct, but the coarse marker landed just north of the border in southern Latvia.

### Hard - Round 7

**Initial observation (recorded before any action)**

- Road overlay is visibly Swedish-looking, approximately "Skalvag/Skalvag"; the diacritic was not fully resolvable.
- Narrow, well-kept unmarked paved farm lane.
- Broad vivid-green open fields.
- Large modern wind turbine on the left horizon.
- Low, almost treeless coastal-looking terrain beneath bright maritime clouds.
- Initial hypothesis: southern Sweden, most likely Skane; Gotland is a secondary possibility.
- Confidence: medium-high for Sweden and medium-low for the subregion.

**Pre-submission**

- The apparent Swedish "-vag" road name kept Sweden as the leading country.
- Treeless green fields, a wind turbine, a narrow paved lane, and maritime sky favored far-southern agricultural Sweden.
- Final belief: Skane most likely, with Gotland still plausible.
- Intended pin: valid southern-Sweden/Skane provisional marker.

**Result**

- Official leaderboard score: 3,612 points.
- In-round time-based reward display: 3,611.
- Error: 324.9 km.
- The true location was Lemvig Municipality in western Denmark; the marker landed near Trollhattan, Sweden.
- Failure mode: Danish "Skalvej" was misread as Swedish "Skalvag" by resolving the final letters incorrectly.

### Hard - Round 8

**Initial observation (recorded before any action)**

- High-quality two-lane road with white edge lines and a double solid white center.
- Dense boreal pine/birch/spruce forest.
- Gently rolling, rocky-looking terrain.
- Bright low-northern summer light.
- Large dark Google-car hood/roof visible at the bottom.
- Initial hypothesis: central Finland, roughly Jyvaskyla-Kuopio lake-country interior; Sweden is the main backup.
- Confidence: medium for Finland from the road markings, forest mix, and terrain.

**Pre-submission**

- Boreal pine/birch forest, smooth rolling road, white double barrier line, full white edge lines, and a visible dark survey-car roof remained most consistent with Finland.
- No sign or settlement clue appeared to refine beyond central lake country.
- Final belief: roughly Jyvaskyla-Kuopio, with Sweden secondary.
- Intended pin: valid central-Finland marker already set.

**Result**

- Official leaderboard score: 4,196 points.
- Error: 175.3 km.
- Immediate result-screen interpretation suggested Puolanka/Pudasjarvi; post-game source audit identified Utajarvi Municipality, North Ostrobothnia. The marker was near Iisalmi/Lapinlahti.
- Country and broad central/northern region were correct.

### Hard competition summary

- Leaderboard placement: #1 (only completed entry at verification time).
- Official total: 27,561 points.
- Strongest country/region calls included the Bulgarian Rhodopes, Lithuania, and Finland.
- Major visual failures included Greek text read as Bulgarian Cyrillic, Moldova chosen for Romania, a generic Latvian forest track placed in Hungary, and Danish `-vej` read as Swedish `-vag`.
- Manual map placement added substantial error in several rounds even when the textual regional hypothesis was directionally correct.

## Aggregate interactive results

| Split | Official score | Mean error | Median error | Within 25 km | Within 250 km | Within 750 km |
|---|---:|---:|---:|---:|---:|---:|
| Easy (8) | 38,391 | 47.126 km | 0.220 km | 75.0% | 87.5% | 100.0% |
| Medium (9) | 39,183 | 785.439 km | 2.521 km | 55.6% | 88.9% | 88.9% |
| Hard (8) | 27,561 | 437.813 km | 250.100 km | 0.0% | 50.0% | 87.5% |
| Overall (25) | 105,135 | 437.938 km | 26.400 km | 44.0% | 76.0% | 92.0% |

The Medium mean includes the 6,899.5 km default-map timeout in Round 7. Excluding that invalid pin, Medium mean/median error are 21.181 km / 2.274 km, and the 24 valid-pin rounds have an overall mean/median of 168.707 km / 25.800 km.

Final textual country hypotheses were correct in 19 of 25 rounds (76%). This is a reasoning measure, not pin-country accuracy: the live leaderboard exposes distances but not reusable prediction coordinates, and several coarse manual clicks landed across borders.
