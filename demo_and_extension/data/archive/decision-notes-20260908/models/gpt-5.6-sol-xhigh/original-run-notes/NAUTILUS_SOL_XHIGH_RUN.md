# NAUTILUS Sol/xhigh Blind-Play Run

## Run configuration

- Player model: `gpt-5.6-sol`
- Reasoning effort: `xhigh` (extra high)
- Spawn context: fresh (`fork_turns: none`)
- Account: Ivan Yachnik (eligible non-creator)
- Round duration: 300 seconds
- Movement restriction: None
- Order: Easy (8), Medium (9), Hard (8)
- Blind-play protocol: v3 with Sol/xhigh addendum

## Pre-game controller regression gate

PASS. In an unscored World round, a valid provisional was visibly placed in Spain; the map expanded and zoomed from world to city scale; the marker was moved from the Ibiza area to visibly labeled Valencia; the marker tip visibly moved; the map was collapsed with the marker and active Guess preserved; one Street View step changed panorama geometry; the map was reopened with the Valencia marker retained; and the round was abandoned through the visible game menu without submission.

## Easy competition (entry 24282)

### Easy R1

- **INITIAL:** Untouched cues: `Place de la Bastille` road text; July Column/Place de la Bastille geometry; visible `Bastille` bus stop; Parisian façades; French bus and road layout. Initial belief: Place de la Bastille, Paris, France (~48.853, 2.369); alternatives negligible; confidence 99%.
- **PROVISIONAL PIN:** Paris/north-central France, visibly checked against both `Paris` and `France` at regional scale; Guess active. The compact-map opening click briefly landed in the Atlantic and was immediately corrected before exploration.
- **EXPLORATION:** Rotation exposed the Opéra Bastille façade and multiple `Bastille` bus-stop signs, independently confirming that the camera was on the Opera side of the square; the opposite view preserved the July Column and full plaza geometry. No contradictory cue.
- **FINAL BELIEF + PIN:** Place de la Bastille, Paris, France, eastern/southeastern plaza roadway immediately northwest of Opéra Bastille (~48.853, 2.370), confidence 99.5%. Marker visibly sat between the `Place de la Bastille` and `Opéra Bastille` labels and agreed with Saint-Paul, canal, and road geometry at street scale. Final verification at 0:54.
- **RESULT:** 113 m. Result animation displayed **+4,784 XP**, which is not treated as official competition points pending leaderboard reconciliation. Revealed map: Place de la Bastille/Opéra Bastille; submitted marker at the plaza while the actual flag was on the south/east roadway by the Opera. Semantic country/city/feature: correct. Belief-to-pin: consistent. Error: fine map precision (~113 m). Controller/timing: no timeout/default/controller failure; submitted with retry margin.

### Easy R2

- **INITIAL:** Untouched cues: Berlin Fernsehturm; visible blue `U Alexanderplatz` sign; German street furniture/transit; dense bicycle racks; Alexanderplatz high-rise skyline. Initial belief: Alexanderplatz, Berlin, Germany (~52.521, 13.413); alternatives negligible; confidence 99%.
- **PROVISIONAL PIN:** Initial coarse marker was intended for Berlin and appeared to overlap the `Berlin` label, with Guess active. A later regional zoom proved it was actually west of Berlin in central Germany; it was then explicitly corrected to the rendered Berlin label. The compact-map opening click had first landed in Libya before the initial correction.
- **EXPLORATION:** Rotation exposed the large red `ALEXA` shopping-centre façade on the left, Alexanderplatz bicycle/transit space on the right, and the Fernsehturm behind; these independently fixed the camera on the southeastern plaza edge. No contradictory cue.
- **FINAL BELIEF + PIN:** Alexanderplatz, Berlin, Germany, Alexanderstraße immediately north of ALEXA Berlin and southeast of the Alexanderplatz transit complex (~52.520, 13.414), confidence 99%. At street scale the marker visibly lay on Alexanderstraße between `ALEXA Berlin` and the `S U Alexanderplatz` labels, cross-checked with Karl-Marx-Allee and Galeria/Saturn. Final verification at 0:53.
- **RESULT:** 60 m. Result animation displayed **+4,706 XP**, not official points. Revealed map: Alexanderplatz/ALEXA; actual flag just north on Otto-Braun-Straße/Alexanderstraße, submitted pin on the adjacent Grunerstraße/Alexanderstraße approach. Semantic country/city/feature: correct. Belief-to-pin: consistent. Error: street-junction precision (~60 m). Controller/timing: no timeout/default/controller failure.

### Easy R3

- **INITIAL:** Untouched cues: Hohensalzburg Fortress on its hill; Salzach River through a compact baroque city; alpine backdrop; Austrian church/roof forms; elevated stone-walled overlook opposite the fortress. Initial belief: Salzburg, Austria, Kapuzinerberg-side viewpoint facing Hohensalzburg (~47.803, 13.051); alternative another Salzburg east-bank terrace; confidence 98%.
- **PROVISIONAL PIN:** Intended Salzburg pin visibly overlapped the coarse `Salzburg` label, cross-checked against Munich, Innsbruck, Vienna/Graz and the Austria/Germany boundary; Guess active. Later regional zoom proved that overlap was actually near Rosenheim, and the marker was explicitly corrected to Salzburg. Compact opening click landed in Chad and an intermediate Austria-scale pin landed near Graz.
- **EXPLORATION:** Panorama rotation isolated a small conical-roofed historic wall turret and lookout parapet, while the opposite view preserved the Salzach, Hohensalzburg Fortress, old-town churches, and Alps. This supported the Kapuzinerberg city-wall hypothesis; no contradictory cue.
- **FINAL BELIEF + PIN:** Salzburg, Austria, Kapuzinerberg south-wall lookout on `Basteiweg Stadtmauer` above Imbergstraße/Salzach, facing Festung Hohensalzburg (~47.803, 13.059), confidence 96% city / 86% exact feature. Marker tip visibly sat on the named `Basteiweg Stadtmauer` feature, cross-checked against Kapuzinerkloster, Mozart-Wohnhaus, Salzach, and the fortress. Final verification at 0:59.
- **RESULT:** 24 m. Result animation displayed **+4,674 XP**, not official points. Revealed feature: `Basteiweg Stadtmauer`; actual flag and submitted marker were on adjacent branches of the same wall path. Semantic country/city/feature: correct. Belief-to-pin: consistent and feature-scale. Error: path-branch precision (24 m). Controller/timing: no timeout/default/controller failure.

### Easy R4

- **INITIAL:** Untouched cues: tight Vltava bend around a red-roofed medieval town; Český Krumlov castle wall/terrace; baroque saint statue; St. Vitus Church spire; steep wooded valley. Initial belief: Český Krumlov, Czechia, castle/bridge terrace overlooking the old town (~48.812, 14.315); alternatives negligible; confidence 99%.
- **PROVISIONAL PIN:** Marker tip visibly on `Český Krumlov` in southern Czechia, verified against České Budějovice, Gmünd, Linz, and the Czech–Austrian border; Guess active. Opening marker errors in Algeria/eastern Czechia were corrected before exploration.
- **EXPLORATION:** The rotated view showed the paved castle terrace, crenellated/arched parapet, and St. Vitus directly across the old town, corroborating that the camera was in the elevated castle complex. No contradictory cue.
- **FINAL BELIEF + PIN:** Český Krumlov, Czechia, castle western/southwestern terrace/Cloak Bridge side of `Státní hrad a zámek Český Krumlov`, overlooking the Vltava and St. Vitus (~48.812, 14.313), confidence 99% city / 90% exact terrace. Final marker visibly lay inside the castle complex just southwest of its label, cross-checked against Zámecká zahrada, Zámecká věž, Lazebnický most, St. Vitus, and the Vltava bend. Final verification at 0:50.
- **RESULT:** 64 m. Result animation displayed **+4,842 XP**, not official points. Revealed location: `Plášťový most` (Cloak Bridge); actual flag on the bridge, submitted marker by nearby `Zámecká konírna` within the same castle complex. Semantic country/city/feature: correct. Belief-to-pin: consistent at feature-complex scale. Error: intra-castle precision (64 m). Controller/timing: no timeout/default/controller failure.

### Easy R5

- **INITIAL:** Untouched cues: intact Roman amphitheatre arches immediately left; Mediterranean cypress/stone landscaping; Croatian/Adriatic road design; right-hand traffic and regional coach; urban park/roundabout beside the monument. Initial belief: Pula Arena, Pula, Croatia, roadway on the arena’s park side (~44.873, 13.850); alternative another Adriatic Roman arena negligible; confidence 98%.
- **PROVISIONAL PIN:** Marker tip visibly on `Pula` at the southern tip of Istria, verified against Croatia, Italy, the northern Adriatic, Zadar, and San Marino; Guess active. Opening marker errors in Algeria and near Bologna/San Marino were corrected before exploration.
- **EXPLORATION:** Rotation showed the amphitheatre immediately beyond the landscaped park and roundabout, plus the adjacent hillside buildings and one-way road layout; no contradictory cue.
- **FINAL BELIEF + PIN:** Pula Arena, Pula, Croatia, park/roundabout roadway beside the arena (~44.873, 13.850), confidence 98%. Final rendered marker appeared on an `ARENA` label, cross-checked against Pula, harbor/Riva, and districts. Repeated label-centering corrections left only 0:16 at final verification.
- **RESULT:** 460 m. Result animation displayed **+4,998 XP**, not official points. Revealed map confirms Pula Arena; actual flag at the amphitheatre/Amfiteatarska–Flavijevska junction. Semantic country/city/feature: correct. Belief-to-pin: **failed at feature scale** despite the rendered `ARENA` label; submitted location resolved ~460 m away. Error: map-label interpretation/controller refinement. Timing: no timeout/default, but inadequate retry margin (0:16).

### Easy R6

- **INITIAL:** Untouched image showed road marking `B178`, a green `Zittau PL D` direction sign, a yellow Polish `Granica Państwa` border warning, a divided border-approach/bridge layout, and Central-European right-hand traffic. Belief: Polish side of the Germany–Poland crossing east of Zittau, near Sieniawka/Porajów on the B178 corridor (about 50.90, 14.84); alternative was the nearby tripoint corridor. Confidence 93% country / 80% exact crossing.
- **PROVISIONAL PIN:** The compact-map opening transiently placed an accidental marker in Algeria; this was immediately corrected through world and regional zoom to the Germany–Poland–Czech border region, then visually verified just southeast of Dresden in the Zittau area. Further feature-scale refinement remained in progress.
- **EXPLORATION:** Successive regional refinements exposed Zittau, Bogatynia, Sieniawka, Porajów, Kopaczów, Hrádek nad Nisou, route 332, and the tripoint boundary. The Polish warning and connector geometry supported the narrow border corridor but did not uniquely resolve which of its two international junctions was pictured. I incorrectly treated the warning as evidence for the southern Czech-border branch.
- **FINAL BELIEF + PIN:** Southern Polish connector roundabout at Kopaczów where route 332 meets Czech route 35, south of Sieniawka; confidence 93% country/corridor / 70% chosen junction. Final marker visibly verified on Kopaczów at 0:41, then submitted immediately. This explicitly overruled the northern B178/German-border alternative.
- **RESULT:** 3,263 m. Result animation displayed **+4,312 XP**, not official points. Actual flag was the northern Sieniawka/German-border B178 crossing; submitted marker was the southern Kopaczów/Czech-border junction. Semantic country/corridor: correct; exact crossing: wrong. Belief-to-pin: consistent with the final but incorrect junction belief. Error: interpretation/disambiguation, not controller or timeout.

### Easy R7

- **INITIAL:** Untouched whole image showed a yellow Slovenian-style direction sign explicitly naming `Ljubljana` with a route/motorway shield; a blurred Street View road label beginning `Vinica`; a red-tiled small border-village/station building; Central-European right-hand signage; and wooded low karst hills. Belief: Vinica, Slovenia, at/near the Croatia border crossing on the Kolpa/Kupa, on the road northwest toward Ljubljana (~45.46, 15.25). Alternative was another southeastern Slovenian village signed toward Ljubljana. Confidence 97% country / 82% town-crossing.
- **PROVISIONAL PIN:** World-map opening first landed in the Bulgaria/Greece area; corrected through a Europe reframe to a visibly verified marker in Slovenia at the Austria–Croatia–Italy junction region. Marker country-valid, Guess active; exact Vinica/Kolpa refinement in progress.
- **EXPLORATION:** Rotation made `Ljubljana` and `Novo mesto` fully readable and exposed the village side street/crosswalk. Map work found Vinica, routes 218/919, the Kolpa river boundary, and a three-way junction north of the border bridge whose geometry appeared to match. No controller contradiction appeared, but the central assumption—the blurred place/road text being `Vinica`—was not independently proved.
- **FINAL BELIEF + PIN:** Vinica, Slovenia, at the three-way junction immediately north of the Kolpa/Kupa border bridge (~45.462, 15.252), beside the village building and road toward Ljubljana/Novo mesto. Confidence 99% country / 96% town / 88% junction. Marker visually verified on the junction at 0:59 and submitted immediately.
- **RESULT:** 68.1 km. Result animation displayed **+4,670 XP**, not official points. Actual flag was near Ivančna Gorica/Višnja Gora in central Slovenia; submitted pin was Vinica by Croatia. Country correct; town/feature wrong. Belief-to-pin: consistent with the final belief. Error: textual misread/confirmation bias—`Ljubljana` and `Novo mesto` were compatible with Vinica but not uniquely diagnostic. No timeout/default/controller failure.

### Easy R8

- **INITIAL:** Untouched whole image showed a bus shelter fascia clearly reading `FLÅM`; a sheer Norwegian fjord valley; Norwegian flags; a waterfront road/guardrail; and a tourist picnic/camping compound with barrels and a rustic shelter. Belief: Flåm, Norway, at the visitor/camping waterfront transit area near the head of Aurlandsfjord (~60.86, 7.11). Alternatives negligible. Confidence 99% country/town / 88% waterfront feature.
- **PROVISIONAL PIN:** Map opening/panning briefly produced incorrect southern-Sweden and Netherlands placements; corrected to a visibly verified marker in western/south-central Norway, west-northwest of Oslo, consistent with Flåm’s fjord region. Guess active; town/feature refinement in progress.
- **EXPLORATION:** Regional zoom exposed Flåm, Aurlandsfjord, the railway, E16, the station, Flåm Camping, Fretheim Hotel, Fretheim Cultural Park, Ægir Gastropub, and the waterfront. Rotation showed a busy rustic pavilion complex beside a fenced green strip. I first considered the campground, then reclassified the field/pavilion adjacency as Fretheim Hotel–Cultural Park; the venue interpretation remained ambiguous.
- **FINAL BELIEF + PIN:** Flåm, Norway, on the Fretheim Hotel/outdoor dining and cultural-park grounds just south of Flåm station (~60.862, 7.116). Confidence 99% town / 83% venue. Marker visibly verified on Fretheim Hotel at 0:56 and submitted immediately.
- **RESULT:** 396 m. Result animation displayed **+4,830 XP**, not official points. Actual flag was on the Flåm waterfront/Flåm Port–restaurant strip; submitted marker was Fretheim Hotel grounds. Town correct; exact venue wrong by 396 m. Belief-to-pin: consistent. Error: intra-town venue classification; the fenced green area was interpreted as cultural park rather than rail/station-adjacent space. No timeout/default/controller failure.

### Easy commitment

- Final-round Continue produced a rendered leaderboard row for **Ivan Yachnik — 39,649 Pts.** (#1). This is the official committed Easy total.
- Easy maximum: 40,000 points; committed percentage: **99.1225%**.
- The eight visible result values were XP animations and are not treated as official per-round points.

## Medium — 9 rounds

### Medium R1

- **INITIAL:** Untouched whole image showed the Street View road label `Carrer de Cirilo Amorós`; Valencian/Catalan `Carrer`; ornate Mediterranean Eixample apartments with iron balconies; Spanish curbside recycling containers/green glass igloo; and a flat dense urban grid. Belief: central Valencia, Spain, on Carrer de Cirilo Amorós near the Colón/Mercat de Colón–Gran Via corridor (~39.47, -0.37). Barcelona was unlikely because this exact street is in Valencia. Confidence 99% city / 88% corridor.
- **PROVISIONAL PIN:** Marker visibly verified on Spain’s east coast south of Barcelona, in the Valencia region; country/city corridor valid and Guess active. Street-level refinement in progress.
- **EXPLORATION:** City zoom exposed Valencia’s old centre, Estació del Nord, Colón metro, Mercat de Colón, Gran Via, and the rendered `C/ de Ciril Amorós` label. Repeated map recentering briefly displaced the viewport toward the coast and Llíria, but the marker was recovered to Valencia and the named street. The starting image provided no legible cross street.
- **FINAL BELIEF + PIN:** Valencia, Spain, on Carrer de Ciril Amorós in the Eixample/Colón corridor, east-southeast of Colón metro toward Mercat de Colón. Exact cross street withheld as unjustified. Confidence 99% city/street / 58% block. Marker visibly verified on the street label at 0:51.
- **RESULT:** 321 m. Result animation displayed **+4,574 XP**, not official points. Actual flag was southeast near the Gran Via/Carrer del Mestre Gozalbo block; submitted marker was northwest on the labeled Ciril Amorós segment. City and named-street corridor correct; exact block wrong. Belief-to-pin: consistent. No timeout/default; controller recovery succeeded despite map recentering errors.

### Medium R2

- **INITIAL:** Untouched whole image showed a road overlay reading `Via Francesco …` (likely `Petrarca`); Italian `Via` naming; an Italian blue transit/stop sign and right-hand markings; a dense clipped-linden residential avenue; red-brick villas and multicolour curbside bins. Belief: Bologna, Italy, on Via Francesco Petrarca in the inner residential belt, likely Saragozza/Porta area (~44.49, 11.33). Alternatives: another north-Italian Via Francesco Petrarca such as Padua, Milan, or Turin. Confidence 97% country / 67% Bologna / 60% street reading.
- **PROVISIONAL PIN:** Initial Italy placement was in central Italy; corrected northward to a visibly retained marker in northern Italy/Po Valley–Alpine approach, keeping the guess country-valid while testing Bologna. Guess active.
- **EXPLORATION:** Rotation confirmed the residential avenue, bin system, and an address plaque but added no legible city name. Bologna zoom exposed Saragozza, the ring, Porta Saragozza, Via Saragozza, and `Via Frassinago`. I re-read the blurred overlay as `Via Frassinago`, overruling my initial `Via Francesco …` reading.
- **FINAL BELIEF + PIN:** Bologna, Italy, Via Frassinago in the Saragozza quarter just north of Porta Saragozza. Confidence 99% city / 68% block. Marker visibly verified mid-block on Via Frassinago at 0:54.
- **RESULT:** 570 m. Result animation displayed **+4,441 XP**, not official points. Actual flag was on `Via Francesco Roncati`, west of the Saragozza ring; submitted pin was on Via Frassinago east/inside the ring. Bologna/Saragozza correct; street wrong. Belief-to-pin: consistent with the final reinterpretation, but the reinterpretation was incorrect—the untouched `Via Francesco …` reading was closer to truth. No timeout/default/controller failure.

### Medium R3

- **INITIAL:** Untouched whole image showed a road overlay clearly reading `Amsterdamstraat`; Netherlands-standard separated cycle path and dense parked bicycles; right-hand traffic with Dutch street furniture/bollards; flat post-war mixed low-rise housing and a small apartment block; and a mature poplar-lined divided arterial. Belief: Netherlands, likely a planned Zoetermeer district on Amsterdamstraat (~52.06, 4.49). Alternatives: Enschede or Haarlem streets of the same name. Confidence 99% country/street text / 38% Zoetermeer.
- **PROVISIONAL PIN:** Marker visibly retained in the Netherlands/Low Countries, country-valid and Guess active while the candidate cities were compared.
- **EXPLORATION:** Rotation exposed 1930s shopfronts, Dutch plates, cycle markings, and building number 71. The streetscape argued against a purely post-war Zoetermeer district. Haarlem map work exposed Amsterdamse Poort, Amsterdamsevaart, Amsterdamsebuurt, and a rendered `Amsterdamstraat` whose broad corridor appeared to match, so Haarlem became the leading belief.
- **FINAL BELIEF + PIN:** Haarlem, Netherlands, on Amsterdamstraat in Amsterdamsebuurt, mid-corridor between Amsterdamse Poort/Amsterdamsevaart and Teylerstraat/Volhardingstraat. Confidence 99% country/street text / 90% Haarlem / 61% block. Marker visibly verified on Amsterdamstraat at 0:59.
- **RESULT:** 41.8 km. Result animation displayed **+4,305 XP**, not official points. Actual flag was in Utrecht; submitted pin was Haarlem. Country and Amsterdam-named arterial concept correct; city/street interpretation wrong. The untouched overlay was likely `Amsterdamsestraatweg`, not `Amsterdamstraat`; Haarlem’s rendered exact-looking label created false confirmation. Belief-to-pin: consistent. No timeout/default/controller failure.

### Medium R4

- **INITIAL:** Untouched whole image showed road overlay `N44`; Belgian/Flemish red cycle lanes; detached brick/pebbledash ribbon-development houses; Belgian overhead distribution lines and curb design; and a flat Flanders arterial. Belief: Belgium, on N44 in the Aalter–Knesselare–Maldegem corridor, likely a built-up Knesselare/Aalter-Brug stretch (~51.10, 3.45). Alternatives: Adegem/Maldegem end of the same N44. Confidence 98% country / 90% corridor / 42% settlement.
- **PROVISIONAL PIN:** First Europe click landed too far southeast; corrected to a visibly verified marker in Belgium. Country-valid and Guess active; N44 settlement refinement in progress.
- **EXPLORATION:** Regional map work exposed Bruges, Ghent, Maldegem, Aalter, Knesselare, Aalter-Brug, N44, N499, and the canal. Rotation showed a small `restore` storefront and uninterrupted red cycle lanes along a dense residential ribbon. Those features supported a Flemish N-road but did not prove N44 specifically.
- **FINAL BELIEF + PIN:** Aalter-Brug, Belgium, on the built-up N44 strip south of the canal/N499 junction. Confidence 98% corridor / 64% settlement. Marker visibly verified on N44 in Aalter-Brug at 0:50.
- **RESULT:** 25.3 km. Result animation displayed **+4,372 XP**, not official points. Actual flag was in Melle, southeast of Ghent; submitted pin was Aalter-Brug. Belgium/Flanders correct; route wrong. The pictured overlay was `N444`, not `N44`; the final digit was dropped from the blurred label. Belief-to-pin: consistent. No timeout/default/controller failure.

### Medium R5

- **INITIAL:** Untouched whole image showed road overlay `R. Figueiral`; Portuguese `Rua` abbreviation; granite/whitewashed north-Portuguese row buildings with iron balconies; a compact hilly inland-town street and Portuguese parking sign/vehicles; and a distant mid-rise block. Belief: Guimarães, Portugal, on Rua do Figueiral near the historic-centre edge (~41.44, -8.30). Alternatives: Braga, Viseu, Vila Real. Confidence 98% country / 47% Guimarães / 80% street-name read.
- **PROVISIONAL PIN:** Marker visibly verified in northern Portugal, east of the coastal Porto axis, keeping the active city candidates covered. Guess active; town refinement in progress.
- **EXPLORATION:** Rotation showed a paid-parking court, older white/granite row buildings, and a 1960s apartment slab—a clear old/new urban edge but no readable city name. Guimarães map work found the historic centre, Creixomil, Urgezes, and Penha; the exact Rua do Figueiral label did not appear, so feature-level precision was withheld.
- **FINAL BELIEF + PIN:** Guimarães, Portugal, just southwest of the historic centre in the Creixomil transition zone. Confidence 98% country / 62% city / 43% district. Marker visibly verified in southwest-central Guimarães at 0:48.
- **RESULT:** 136.8 km. Result animation displayed **+3,965 XP**, not official points. Actual flag was in Coimbra; submitted pin was Guimarães. Country and historic/university-town morphology correct; city wrong. `R. Figueiral` was not city-unique; northern granite cues were over-weighted, while Coimbra’s older street/apartment mix was also compatible. Belief-to-pin: consistent. No timeout/default/controller failure.

### Medium R6

- **INITIAL:** Untouched whole image showed road overlay `Bergsgatan`; Swedish `-gatan` naming; a Scandinavian simple pole/light; detached pastel/wood houses with red tile roofs; a hedged residential lane without curbs/markings; and mildly hilly compact-town terrain. Belief: Sweden, likely a Gothenburg-area municipality (Mölndal/Kungälv) on Bergsgatan (~57.7, 12.0). Alternatives: Örebro, Jönköping, or a smaller west-Swedish town. Confidence 98% country / 34% Gothenburg metro / 75% street-name read.
- **PROVISIONAL PIN:** After two broad-map panning mistakes temporarily displaced the map to Africa/Italy, recovered and visibly verified a marker in southwest Scandinavia near the Oslo–Gothenburg corridor. Guess active; Swedish municipality refinement in progress.
- **EXPLORATION:** Regional correction exposed Gothenburg, Mölndal, Kungälv, Borås, and Jönköping. The hedged, mildly sloped villa lane seemed more compatible with east/southeast Mölndal than central Gothenburg, but the map never surfaced Bergsgatan and no city-unique cue emerged.
- **FINAL BELIEF + PIN:** Mölndal, Sweden, in the hilly east/southeast residential area around Forsåker/Rävekärr. Confidence 98% country / 43% Mölndal / 22% district. Marker visibly verified in the residential grid at 0:55.
- **RESULT:** 404.4 km. Result animation displayed **+3,043 XP**, not official points. Actual flag was in Uppsala; submitted pin was Mölndal. Country and street-language correct; city wrong. The generic Bergsgatan plus villa morphology was not discriminative, and west-Sweden terrain inference was unjustified. Belief-to-pin: consistent. No timeout/default, but broad-map controller recovery consumed substantial time.

### Medium R7

- **INITIAL:** Untouched scene showed the rendered overlay **Sepakuru**, an Estonian *-u* street name; a post-Soviet/Baltic concrete-edged asphalt lane with open drainage and overhead wires; fenced detached homes mixing rendered Soviet-era gables and Nordic renovations; and flat, cool-climate suburban morphology. Initial belief: Tallinn, likely a southern/eastern fringe (61% city; 96% country). Alternatives: Tartu or Pärnu.
- **PROVISIONAL PIN:** Meaningful early marker was placed in Estonia, then visibly corrected from a coarse Baltic placement to Tallinn. No default marker.
- **EXPLORATION / REFINEMENT:** Rotation exposed house number 29 and a long, flat residential lane but no municipal sign. Map refinement inspected Tallinn, the airport belt, Mõigu, Rae, and Peetri. Those districts visually fit, but the evidence remained generic; the map did not reveal Sepakuru at the searched zoom.
- **FINAL BELIEF + PIN:** Tallinn-area Estonia, specifically older-villa fabric around Mõigu/Peetri (78% city-area); final pin visually verified in Peetri's northwestern residential grid near Peetri Selver at 1:00 remaining.
- **RESULT:** 160.6 km. Result animation displayed **+4,063 XP**, not official points. Actual flag was in Tartu; submitted pin was Peetri/Tallinn. Country and street-language were correct, city wrong. Morphology and the generic *-u* street name were not city-discriminative; the raised city confidence was unjustified. Belief-to-pin: consistent. No timeout/default.

### Medium R8

- **INITIAL:** Untouched scene showed rendered road overlay **Jelsova / Jelšová**; a hilly Central European residential lane; stucco homes with broad eaves, exterior balconies, and steep metal/tile roofs; concrete utility poles and Slovak/Czech-style electrical hardware; and forested low mountains immediately beyond. Initial belief: Slovakia, likely Žilina (94% country; 55% city). Alternatives: Banská Bystrica or the Czech/Slovak border hills.
- **PROVISIONAL PIN:** Meaningful intended commitment was Žilina, Slovakia. The first coordinate click visibly missed into the Indian Ocean and was immediately rejected. A recovered marker was later visibly placed in Slovakia/Poland rather than leaving the transient.
- **EXPLORATION / REFINEMENT:** The clue stack remained strongly Slovak and mountain-basin, but repeated broad-map antimeridian panning failures consumed most of the round. The controller recovered a Europe view before deadline, yet exact intended-city placement was lost.
- **FINAL BELIEF + PIN:** Belief remained Žilina/northern Slovakia (94% country; 55% city). Final marker was visibly verified at country scale in the Slovakia/Poland region with 0:38 remaining; submission was immediate for retry margin.
- **RESULT:** 134.6 km. Result animation displayed **+4,239 XP**, not official points. Actual flag was Banská Bystrica; submitted marker landed east of Košice. Country and mountain-basin semantics were correct; city/feature wrong. Belief-to-pin: **inconsistent** because controller recovery displaced the intended Žilina belief. No timeout/default; severe map-control incident.

### Medium R9

- **INITIAL:** Untouched scene showed Republic of Ireland road conventions: yellow edge/shoulder lines, white centre dashes, left traffic, dense grey limestone boundary walls, detached rendered bungalows, a windy Atlantic sky, and flat suburban/rural fringe morphology. Initial belief: Galway outskirts (99% country; 66% city). Alternatives: Clare/Limerick fringe or another west-Ireland town.
- **PROVISIONAL PIN:** A coarse Africa coordinate miss was immediately rejected. A meaningful marker was then placed at Galway and visually verified with 4:14 remaining. No default.
- **EXPLORATION / REFINEMENT:** Rotation and fixed-position imagery exposed rendered route **L-13212** and reinforced flat coastal limestone-wall ribbon development. Map refinement inspected Galway's southeast at Oranmore, Renville, Ballinduff, and the N67 corridor.
- **FINAL BELIEF + PIN:** Galway southeastern fringe, likely Renville/Oranmore near N67 (72% locality; 99% country). Stable marker was visually verified between Oranmore, Renville, Ballinduff, and N67 with 1:30 remaining and was not displaced afterward.
- **RESULT:** 15.4 km. Result animation displayed **+4,817 XP**, not official points. Actual flag was west/northwest Galway near Corboley/Barna Road; submitted pin was Renville/Oranmore southeast. Country and city correct; side of city wrong. Belief-to-pin: consistent. No timeout/default.

### Medium commitment

- On the exact R9 result screen, the required final-round result checkpoint was sent before any navigation.
- The visible **Continue** button was clicked once; no retry was required.
- The rendered leaderboard showed **Ivan Yachnik — 40,913 Pts.** at rank #1. This numeric row is the official Medium competition total.
- Medium maximum: 45,000. Official percentage: **90.9178%**.

## Hard — 8 rounds

### Hard R1

- **INITIAL:** Untouched scene showed Greek rendered overlay **Epar.Od. Papoulion / Επαρ.Οδ. Παπουλίων**; narrow unmarked rural asphalt; limestone rubble/karst; dry Mediterranean grass; dense juniper/maquis; and a flat-to-rolling plateau. Initial belief: Papoulia, Messenia, Peloponnese (99% country; 74% Messenia). Alternatives: another Papoulion-associated road on the Peloponnese or Epirus.
- **PROVISIONAL PIN:** A coarse Atlantic click miss was rejected; a meaningful belief-matching marker was then visibly verified on the southern Peloponnese near Kalamata/Messenia with 4:16 remaining. No default.
- **EXPLORATION / REFINEMENT:** Map refinement independently rendered **Papoulia** and nearby Glifada, apparently corroborating the place-name read. Vegetation and karst remained compatible, so the pin was refined directly to Papoulia.
- **FINAL BELIEF + PIN:** Papoulia, Messenia, on the local eparchial road just east/south of the village (96% named locality). Stable marker visibly verified directly at Papoulia with 1:29 remaining and not displaced.
- **RESULT:** 83.3 km. Result animation displayed **+4,600 XP**, not official points. Actual flag was near Kastri/Agios Petros in Arcadia; submitted pin was Papoulia, Messenia. Country and Peloponnese region correct; named-road interpretation wrong—the overlay described a Papoulia-associated route rather than the present locality. Belief-to-pin: consistent. No timeout/default.

### Hard R2

- **INITIAL:** Untouched scene showed a broad Balkan/Carpathian pastoral valley; narrow patched asphalt with a thin white centre line and no edge lines; simple Soviet-style utility poles/lamps; fenced vegetable plots and cattle; a large weathered hipped-roof barn; rolling green hills and distant blue ridges. Initial belief: northern Moldova (54%), with northeast Romania (24%) and Serbia/Bosnia as alternatives.
- **PROVISIONAL PIN:** A Greek-region coordinate miss was rejected. The marker was then visibly stabilized inside central/northern Moldova with 3:32 remaining. No default.
- **EXPLORATION / REFINEMENT:** Opposite-view rotation exposed a pruned orchard, loose livestock, simple lamps, rolling pasture, and worn white centre line. These supported a post-Soviet/Carpathian rural hypothesis but did not resolve Moldova versus Romania.
- **FINAL BELIEF + PIN:** Rural northern/central Moldova, roughly Orhei–Soroca belt (59% Moldova; 22% northeast Romania). Stable belief-matching marker visibly verified in Moldova with 1:26 remaining and not displaced.
- **RESULT:** 367 km. Result animation displayed **+3,364 XP**, not official points. Actual flag was near Miercurea Ciuc, central Romania; submitted pin was northern Moldova. Romania had been an explicit alternative but was underweighted; country wrong, broad Carpathian rural semantics correct. Belief-to-pin: consistent. No timeout/default.

### Hard R3

- **INITIAL:** Untouched scene showed a lush, steep Balkan mountain village; unmarked pale asphalt; simple steel bridge rail; heavy overhead cabling; white plaster houses with broad hipped roofs and rusted sheet metal; orchard/deciduous forest; and a blue-painted roadside water marker. Initial belief: western North Macedonia near the Šar/Mavrovo highlands (49%). Alternatives: southern Kosovo, Bosnia, southwest Serbia.
- **PROVISIONAL PIN:** A Greece click miss was rejected. A meaningful marker was then visibly verified in western North Macedonia north of Ohrid with 4:02 remaining. No default.
- **EXPLORATION / REFINEMENT:** Additional rotation retained the lush orchard valley, broad-hipped Balkan houses, heavy cabling, and water marker but yielded no decisive text. Map work considered the Mavrovo/Gostivar–Ohrid belt.
- **FINAL BELIEF + PIN:** Western North Macedonia, Mavrovo/Gostivar–north Ohrid belt (53%). A reopened-map accidental Greece displacement was visibly detected and corrected; stable marker verified just north of Ohrid inside North Macedonia at exactly 1:00 remaining.
- **RESULT:** 343.6 km. Result animation displayed **+3,441 XP**, not official points. Actual flag was in the Bulgarian Rhodopes near Pamporovo; submitted marker was north of Ohrid. Country wrong, broad lush Balkan mountain-village semantics correct. Bulgaria should have remained a stronger alternative. Belief-to-pin: consistent after final correction. No timeout/default.

### Hard R4

- **INITIAL:** Untouched scene showed immense flat continental cropland with sunflower, ripe grain, and maize strips; a narrow paved road; sparse simple utility poles; and hot clear summer weather. Initial belief: Vojvodina, northern Serbia (41%). Alternatives: eastern Croatia/Slavonia, northeast Bulgaria, southern Hungary, or Ukrainian steppe.
- **PROVISIONAL PIN:** A Mediterranean miss and then an over-zoomed south-Serbia excursion were rejected. The marker was eventually stabilized near the northern edge of Serbia/Belgrade-Vojvodina with 3:45 remaining. No default.
- **EXPLORATION / REFINEMENT:** Rotation revealed rendered road number **451** and a service van with likely **+36** phone prefix. This decisively overturned Serbia in favor of southern Hungary, specifically the Great Plain around Csongrád/Szentes.
- **FINAL BELIEF + PIN:** Final belief was Hungary route 451 near Csongrád/Szentes (79% country). However, the marker remained visibly near the Serbia/Romania border and was not transferred to the belief location before submission; final-pin verification therefore **failed**.
- **RESULT:** 229.5 km. Result animation displayed **+3,867 XP**, not official points. Actual flag was on route 451 near Csongrád/Szentes, exactly matching the refined belief; submitted marker landed near Vršac on the Serbia–Romania border. Belief-to-pin: **inconsistent** due severe refinement-transfer failure. No timeout/default.

### Hard R5

- **INITIAL:** Untouched scene showed a ruler-straight twin-track gravel lane; dense young birch/alder scrub and poplar windbreaks; flat cool-temperate agricultural terrain; and no signs or architecture. Initial belief: Baltic lowlands, likely Latvia (38%), with Lithuania (29%), Estonia (18%), and northeast Poland as alternatives.
- **PROVISIONAL PIN:** Several transient broad-map misses were rejected. The marker was then visibly stabilized in Latvia with 3:27 remaining. No default.
- **EXPLORATION / REFINEMENT:** Rotation reinforced regenerating alder/birch windbreaks, wet grass, and straight parcel geometry but produced no country-specific cue. A later reopened-map Ukraine displacement was visibly detected.
- **FINAL BELIEF + PIN:** Latvia 41%, Lithuania 31%, Estonia 18%; no locality justified. The Ukraine displacement was corrected, and the stable final marker was visibly verified in Latvia at 1:15 remaining.
- **RESULT:** 28.9 km. Result animation displayed **+4,740 XP**, not official points. Actual flag was near Panka/Jaunpiebalga, Latvia; submitted marker was southwest near Sāvasīši. Country correct, rural region reasonably close, exact lane not localized. Belief-to-pin: consistent after correction. No timeout/default.

### Hard R6

- **INITIAL:** Untouched scene showed rendered numeric road overlay **3426**; a broad pale gravel road; extremely flat open grain/flax fields; sparse single-wire poles; an abandoned white agricultural building and scattered farmstead; and a cool Baltic cloud deck. Initial belief: Latvia (58%), likely a numbered local road in the southeast/Latgale or Zemgale plain. Alternatives: Estonia (23%) or Lithuania (16%).
- **PROVISIONAL PIN:** Transient Romania-scale misses were rejected. A meaningful marker was then visibly stabilized in Latvia with 3:51 remaining. No default.
- **EXPLORATION / REFINEMENT:** Rotation retained extreme flatness, flax/grain fields, pale gravel, sparse poles, and abandoned collective-farm fabric. The 3426 number could not be located at safe map scale. A later reopened-map Belarus displacement was visibly detected.
- **FINAL BELIEF + PIN:** Latvia, probably a rural 3426 road in the eastern/southeastern plain (63%). The Belarus displacement was corrected; stable final marker visibly verified in Latvia with 1:19 remaining.
- **RESULT:** 192.3 km. Result animation displayed **+4,062 XP**, not official points. Actual flag was near Ērgļi in central-eastern Latvia; submitted marker was much farther south near the Latvia–Lithuania border. Country correct, locality wrong. Belief-to-pin: consistent after correction. No timeout/default.

### Hard R7

- **INITIAL:** Untouched scene showed rendered road overlay **Skälav.**; an ultra-flat, intensively cultivated coastal plain; narrow immaculate unmarked asphalt; broad drainage verges; a large wind turbine and distant industrial/agricultural silhouettes; and a cool maritime sky. Initial belief: southern Sweden, likely Skåne (87% country; 63% region). Alternatives: Danish Jutland or Gotland.
- **PROVISIONAL PIN:** A Central-Europe miss and a too-north Sweden placement were rejected. Marker was then visibly stabilized in Skåne east of Helsingborg/Copenhagen with 3:44 remaining. No default.
- **EXPLORATION / REFINEMENT:** Reverse view confirmed a broad drained cereal plain and wind-power horizon but no settlement. A later reopened-map Baltic Sea displacement was visibly detected.
- **FINAL BELIEF + PIN:** Skåne, Sweden, on Skälavägen in the Helsingborg–Landskrona/Malmö agricultural plain (89% country; 67% region). The sea displacement was corrected; stable final marker visibly verified near Helsingborg at 1:14 remaining.
- **RESULT:** 376.9 km. Result animation displayed **+3,337 XP**, not official points. Actual flag was in western Jutland, Denmark near Skive; submitted marker was eastern Skåne. Country wrong; Scandinavian language, flat drained cropland, and wind-farm semantics correct. The road label was misread, and Denmark should have remained stronger. Belief-to-pin: consistent after correction. No timeout/default.

### Hard R8

- **INITIAL:** Untouched whole image showed an excellent two-lane paved road bending gently left through dense boreal mixed forest and a small meadow; solid double white centre lines, continuous white edge lines, gentle rolling terrain, and a visible vehicle hood. There were no signs, text, poles, houses, or overlays. Initial belief: central/eastern Finland, likely the Jyväskylä–Kuopio–Joensuu lake-district belt (83% country; 30% regional corridor). Alternatives: Sweden, then Estonia.
- **PROVISIONAL PIN:** A meaningful marker was placed at the northern-European/Finland position on the world map and initially appeared country-matched. Guess was active. Subsequent labeled-scale inspection revealed that the marker had actually landed in Estonia, so the apparent verification was rejected rather than treated as final.
- **EXPLORATION / REFINEMENT:** Reverse-view inspection preserved the solid double-white centre lines, white edge lines, dense birch/pine/spruce forest, and rolling inland terrain without adding text. Finland remained the strongest road-marking and landscape fit. A labeled Europe/Baltic zoom exposed the Estonia placement; one controlled correction moved the marker visibly onto Finland. Later pan/zoom tiles failed and carried the viewport toward the Pacific, so optional refinement stopped and the last labeled, belief-matching Finland marker was preserved.
- **FINAL BELIEF + PIN:** Finland, most likely the central/eastern inland lake district north/east of Tampere and around the Jyväskylä–Kuopio belt (86% country; 36% regional corridor). The corrected marker was visibly verified on labeled Finland before the later viewport/tile failure. It was submitted from that last verified state with 0:58 remaining; no additional displacement click was made.
- **RESULT:** 382.8 km. Result animation displayed **+3,389 XP**, not official points. Actual flag was inland Finland north of Jyväskylä and south of Oulu; submitted marker was south-central Finland around Tampere–Mikkeli latitude. Country and broad inland-Finland semantics correct; regional precision weak. Belief-to-pin: consistent after the Estonia placement was corrected. No timeout/default.

### Hard commitment

- On the exact R8 result screen, the required separate **Hard final-round result** checkpoint was sent before any navigation.
- The visible **Continue** button was clicked once; no retry was required.
- The rendered leaderboard showed **Ivan Yachnik — 31,402 Pts.** at rank #1. This numeric row is the official committed Hard competition total.
- Hard maximum: 40,000. Official percentage: **78.5050%**.

## Official score reconciliation

| Level | Rounds | Official committed points | Maximum | Official percentage | Visible XP sum | XP-to-points difference |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Easy | 8 | 39,649 | 40,000 | 99.1225% | 37,816 | +1,833 official points |
| Medium | 9 | 40,913 | 45,000 | 90.9178% | 37,819 | +3,094 official points |
| Hard | 8 | 31,402 | 40,000 | 78.5050% | 30,800 | +602 official points |
| **Combined** | **25** | **111,964** | **125,000** | **89.5712%** | **106,435** | **+5,529 official points** |

The only rendered official point values were the three committed leaderboard totals. Individual result screens rendered distance and an **XP** animation, not competition points. Therefore, exact official per-round point allocations are not defensibly recoverable from the visible evidence and are not fabricated here. Each round above reconciles the visible distance/XP to the revealed location and submitted marker; the table reconciles those XP sums against the official level totals and demonstrates that XP and official points are distinct measures.

## Aggregate distance

| Level | Aggregate distance | Mean per round |
| --- | ---: | ---: |
| Easy | 72.480 km | 9.060 km |
| Medium | 919.791 km | 102.199 km |
| Hard | 2,004.300 km | 250.538 km |
| **Combined** | **2,996.571 km** | **119.863 km** |

Distance totals use the displayed result distances, converting metre values to kilometres before summation. The arithmetic was independently recomputed from all 25 round records.

## Semantic accuracy audit

- **Country in final belief:** 22/25 correct — Easy 8/8, Medium 9/9, Hard 5/8. Hard misses were R2 (Moldova instead of Romania), R3 (North Macedonia instead of Bulgaria), and R7 (Sweden instead of Denmark).
- **Country of submitted pin:** 21/25 correct — Easy 8/8, Medium 9/9, Hard 4/8. Hard R4's refined Hungarian belief was correct, but its submitted marker remained by the Serbia–Romania border.
- **Strict named city/town correctness:** 9/25 — Easy 6/8 (Paris, Berlin, Salzburg, Český Krumlov, Pula, Flåm), Medium 3/9 (Valencia, Bologna, Galway), Hard 0/8. This deliberately excludes merely correct countries and broad rural regions.
- **Strict named feature/street success:** Easy 5/8 (Bastille, Alexanderplatz, Basteiweg, Cloak Bridge complex, Pula Arena); Medium 1/9 (Carrer de Ciril Amorós corridor); Hard 0/8 submitted pins. Hard R4's final semantic read of route 451 near Csongrád/Szentes was correct but not transferred to the pin, so it is not credited here.
- **Hard broad region/corridor semantics:** 4/8 were materially right despite rural ambiguity — R1 Peloponnese, R4 route 451/Csongrád–Szentes as a final belief, R5 Latvia/nearby rural region, and R8 inland Finland. This is reported separately from strict locality accuracy.

## Belief-to-pin audit

- **Fully consistent at the intended final scale:** 22/25.
- **Three exceptions:** Easy R5 was a feature-scale map-label misresolution (the rendered `ARENA` placement resolved 460 m from Pula Arena); Medium R8 was a material controller recovery displacement from the Žilina belief to a pin east of Košice; Hard R4 was a material refinement-transfer failure from the correct route-451/Csongrád–Szentes belief to the prior Serbia/Romania-border marker.
- Transient wrong clicks or reopened-map displacements in other rounds were detected and corrected before submission. Hard R8 is counted consistent because the Estonia placement was visibly detected, corrected onto labeled Finland, and not clicked again after the later viewport failure.

## Controller, default, timeout, and terminal-gate audit

- Disposable controller regression gate: **PASS** before scored entry, including place, zoom, move, collapse/reopen retention, Street View step, and safe abandon.
- Default markers submitted: **0/25**. Every scored round received an intentional marker.
- Timeout submissions: **0/25**. Every scored round was submitted through the visible Guess control before expiry.
- Material final transfer/control incidents: **2/25** — Medium R8 and Hard R4. Easy R5 is separately classified as a feature-label interpretation/refinement failure, not a broad unintended-country displacement.
- Recovered transient coordinate/map incidents occurred frequently and are documented per round. Easy R5 had the weakest retry margin, with final verification at 0:16, but still submitted intentionally before timeout. Hard R8 recovered an Estonia provisional to Finland and submitted with 0:58 remaining.
- Final-round terminal gates: Easy, Medium, and Hard each remained on the exact last-round result screen, issued the separate final-round checkpoint, then used the visible Continue control. All three Continue actions committed on the first click; **0 retries** were needed. Each competition was considered committed only after a rendered leaderboard row showed `Ivan Yachnik` with a numeric total.

## Final structural and provenance audit

- Round-record counts: **8 Easy + 9 Medium + 8 Hard = 25**, with one **INITIAL**, **PROVISIONAL PIN**, **FINAL BELIEF + PIN**, and **RESULT** record for every round.
- Official committed totals: Easy **39,649**, Medium **40,913**, Hard **31,402**; combined **111,964/125,000 (89.5712%)**.
- Model confirmation: **`gpt-5.6-sol`**.
- Reasoning-effort confirmation: **`xhigh` (extra high)**.
- Evaluation mode: fresh-context blind play using rendered screenshots and coordinate-based visible Chrome UI only during scored rounds; no source, DOM, network, storage, metadata, or web-search assistance.

## Comparison with the official Sol/max baseline

The comparison baseline is the previously finalized Sol/max composite: Easy **38,432**, Medium **39,583**, and the fresh official Hard replacement **32,591**, for **110,606/125,000**. Its recorded aggregate distances were 368.223 km, 1,259.230 km, and 1,690.800 km respectively. The baseline is transparent: Easy and Medium came from one isolated Sol/max player, while Hard came from the requested fresh isolated Sol/max replacement player using the same model and reasoning configuration.

| Set | Sol/xhigh points | Sol/max points | Point delta | Percentage-point delta | Sol/xhigh distance | Sol/max distance | Distance delta |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Easy | 39,649 | 38,432 | **+1,217** | **+3.0425 pp** | 72.480 km | 368.223 km | **−295.743 km (−80.3%)** |
| Medium | 40,913 | 39,583 | **+1,330** | **+2.9556 pp** | 919.791 km | 1,259.230 km | **−339.439 km (−27.0%)** |
| Hard | 31,402 | 32,591 | **−1,189** | **−2.9725 pp** | 2,004.300 km | 1,690.800 km | **+313.500 km (+18.5%)** |
| **Combined** | **111,964** | **110,606** | **+1,358** | **+1.0864 pp** | **2,996.571 km** | **3,318.253 km** | **−321.682 km (−9.7%)** |

On this single 25-round replication, xhigh performed better overall and materially better on Easy and Medium, but worse on Hard. This is one run per configuration, so it supports a run-level comparison rather than a claim that xhigh is intrinsically superior; stochastic gameplay, OCR-like text interpretation, and map-controller variance remain substantial.
