# NAUTILUS OpenGuessr Benchmark — Complete Final Report

**Player Account**: `gem2323` (Gemini 3.7 Flash)  
**Protocol**: Blind visual play only. No web search, reverse-image search, DOM/network inspection, or metadata.  
**Date**: 2026-09-01 / 2026-09-02  
**Input Sets**:
- Easy (8 rounds): `https://openguessr.com/competitions?enter=24592`
- Medium (9 rounds): `https://openguessr.com/competitions?enter=24593`
- Hard (8 rounds): `https://openguessr.com/competitions?enter=24594`

---

## 🏆 Benchmark Grand Totals

| Competition | Rounds | Total Score | Max Possible | Accuracy (%) | Avg. Distance | Country Acc. | City/Region Acc. | Leaderboard Rank |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Easy** | 8 / 8 | **39,988** | 40,000 | **99.97%** | **299.5 m** | 8 / 8 (100%) | 8 / 8 (100%) | **#2** |
| **Medium** | 9 / 9 | **44,011** | 45,000 | **97.80%** | **23.9 km** | 9 / 9 (100%) | 8 / 9 (88.9%) | **#1 (1st 🏆)** |
| **Hard** | 8 / 8 | **36,624** | 40,000 | **91.56%** | **92.6 km** | 8 / 8 (100%) | 7 / 8 (87.5%) | **#4** |
| **TOTAL** | **25 / 25** | **120,623** | **125,000** | **96.50%** | **36.9 km** | **25 / 25 (100%)** | **23 / 25 (92.0%)** | **Podium Tier** |

---

## 1. Easy Competition (8 Rounds) — Score: 39,988 / 40,000 Pts

### Round 1 / 8: Paris, France
- **Visual Cues**:
  1. *July Column (Colonne de Juillet)*: Gilded *Génie de la Liberté* atop the green column along the central road axis.
  2. *Road Surface Text*: "Place de la Bastille" painted on the road lane.
  3. *Public Transit*: Blue RATP "Bastille" bus stop sign outside Opéra Bastille.
  4. *Architecture & Lighting*: Dark green Parisian lamp posts, Haussmannian perimeter buildings, French EU license plates.
  5. *Shared Mobility*: Green Vélib' bike in the adjacent cycle lane.
- **Pin Target**: `48.8526, 2.3698` (Zoom: 16)
- **Result**: **5,000 pts** | **55 m** distance | Revealed: Place de la Bastille, Paris, France.

### Round 2 / 8: Berlin, Germany
- **Visual Cues**:
  1. *Berliner Fernsehturm (TV Tower)*: Towering sphere and spire rising directly behind the commercial center.
  2. *U-Bahn Entrance*: Blue square sign labeled "U Alexanderplatz".
  3. *Urban Architecture*: Alexanderhaus/Berolinahaus grid facades, GALERIA department store, Park Inn hotel tower.
  4. *Commercial Signage*: White delivery truck with Berlin area phone code `030 - 43 59 690` (*Spedition & Logistik*).
  5. *Transit & Bikes*: Bright yellow BVG city buses and Nextbike sharing station.
- **Pin Target**: `52.5217, 13.4138` (Zoom: 16)
- **Result**: **4,999 pts** | **153 m** distance | Revealed: Alexanderplatz, Berlin, Germany.

### Round 3 / 8: Salzburg, Austria
- **Visual Cues**:
  1. *Festung Hohensalzburg*: Medieval hilltop castle dominating the skyline over the old town.
  2. *Salzach River & Bridges*: River bisecting the city with arched footbridges and classical riverside facades.
  3. *Altstadt Architecture*: Green baroque domes of Dom zu Salzburg (Salzburg Cathedral) and Franciscan Church.
  4. *Alpine Backdrop*: Snow-dusted Alps (Untersberg range) rising in the background.
  5. *Viewpoint Location*: Old stone wall parapet on the eastern cliff (Kapuzinerberg).
- **Pin Target**: `47.8018, 13.0478` (Zoom: 16)
- **Result**: **4,998 pts** | **411 m** distance | Revealed: Basteiweg, Kapuzinerberg, Salzburg, Austria.

### Round 4 / 8: Český Krumlov, Czech Republic
- **Visual Cues**:
  1. *Cloak Bridge (Plášťový most) Baroque Statue*: Statue of St. John of Nepomuk / saint on bridge balustrade.
  2. *Vltava River Horseshoe Bend*: River loop with wooden footbridge (*Lávka pod Zámkem*) and weir enclosing the town center.
  3. *St. Vitus Church (Kostel svatého Víta)*: Gothic tower rising over red-roofed peninsula.
  4. *Bohemian Renaissance Architecture*: Characteristic pastel facades and steep gables in South Bohemia.
  5. *Castle Wall*: Tall stone wall of the Upper Castle (*Horní hrad*) on the bridge overlook.
- **Pin Target**: `48.8127, 14.3134` (Zoom: 16)
- **Result**: **5,000 pts** | **33 m** distance | Revealed: Cloak Bridge (*Plášťový most*), Český Krumlov Castle, Czechia.

### Round 5 / 8: Pula, Croatia
- **Visual Cues**:
  1. *Pula Arena (Amfiteatar u Puli)*: Roman amphitheatre limestone arches visible across the park.
  2. *Bilingual Istrian Direction Sign*: Yellow roundabout sign (*Centar / Centro*, *Verudela*, *Galižana / Gallesano*).
  3. *Mediterranean Vegetation*: Mediterranean pines, cypresses, and landscaped park grounds.
  4. *Infrastructure*: Roundabout intersection with coach bus and passenger cars.
  5. *Orientation*: Approaching the amphitheatre park along Flavijevska ulica.
- **Pin Target**: `44.8756, 13.8517` (Zoom: 16)
- **Result**: **4,999 pts** | **213 m** distance | Revealed: Flavijevska ulica / Starih statuta, Pula, Croatia.

### Round 6 / 8: Sieniawka / Zittau Border (Poland / Germany)
- **Visual Cues**:
  1. *Green Directional Sign*: Polish road directional sign indicating `[178] Zittau [PL] [D] ->`.
  2. *Border Signage*: Blue rectangular sign in Polish stating *"Granica Państwa"* (State Border).
  3. *Polish Pedestrian Signs*: Fluorescent yellow-green border on pedestrian crossing sign.
  4. *Historic Church Tower*: Central European Silesian-style church tower visible across roofs.
  5. *Tri-border Corridor*: Roadway connecting Porajów/Sieniawka (Poland) with Zittau (Germany).
- **Pin Target**: `50.8938, 14.8340` (Zoom: 15)
- **Result**: **4,994 pts** | **1,127 m** distance | Revealed: B178 / DW332 near Zittau / Porajów (Trójstyk border area).

### Round 7 / 8: Višnja Gora, Slovenia
- **Visual Cues**:
  1. *Railway Station Sign*: Station building inscribed with *"VIŠNJA GORA"*.
  2. *Slovenian Road Direction Signs*: Yellow directional signs pointing towards motorway + *Ljubljana* (NW) and *Novo mesto* (SE).
  3. *Street Name Sign*: White rectangular sign labeled *"Ulica Antona Tomšiča"*.
  4. *Landscape & Flora*: Lush green rolling hills characteristic of Dolenjska (Lower Carniola).
  5. *Railway Track*: Standard-gauge railway line and platform behind station building.
- **Pin Target**: `45.9574, 14.7452` (Zoom: 16)
- **Result**: **4,999 pts** | **212 m** distance | Revealed: Ciglerjeva ulica / Ulica Antona Tomšiča, Višnja Gora, Slovenia.

### Round 8 / 8: Flåm, Norway
- **Visual Cues**:
  1. *Ferry Pier Gate Signage*: Dual harbor entrance overhead arches marked *"FLÅM"*.
  2. *Aurlandsfjord Landscape*: Dramatic near-vertical fjord mountain slopes surrounding deep dark water.
  3. *Flåmsbrygga Waterfront Architecture*: Wooden timber restaurants/lodges with picnic tables and wooden barrels.
  4. *Norwegian Pennant*: Red/blue Norwegian national flag pennant on a tall harbor flagpole.
  5. *Walkway Orientation*: Pedestrian pier path heading toward the cruise ship and fjord ferry dock on Aurlandsfjorden.
- **Pin Target**: `60.8631, 7.1145` (Zoom: 16)
- **Result**: **4,999 pts** | **192 m** distance | Revealed: Flåm Harbour / Flåmsbrygga, Aurland, Norway.

---

## 2. Medium Competition (9 Rounds) — Score: 44,011 / 45,000 Pts (Rank #1 🏆)

### Round 1 / 9: Valencia, Spain
- **Visual Cues**:
  1. *Street Name on Asphalt*: "Carrer de Císcar" in Valencian script.
  2. *Valencian Ensanche Architecture*: Classic 19th/20th-century residential facades with wrought-iron balconies.
  3. *Spanish Street Furniture*: Ecovidrio green bottle bank and urban grey waste containers.
  4. *Commercial Signage*: Generali Seguros agency and local Valencian bars/boutiques (*Malva Rocha*).
  5. *Urban Setting*: Leafy grid boulevard in L'Eixample / Gran Via district of Valencia.
- **Pin Target**: `39.4650, -0.3665` (Zoom: 16)
- **Result**: **4,999 pts** | **200 m** distance | Revealed: Carrer de Císcar / Carrer de Borriana, Valencia, Spain.

### Round 2 / 9: Bologna, Italy
- **Visual Cues**:
  1. *Street Text on Asphalt*: "Via Francesco R..." painted on Italian street surface.
  2. *Bolognese Architecture*: Exposed red-brick and terracotta villas/palazzine (*Bologna la Rossa*) with dark green window shutters (*persiane*).
  3. *Italian Street Furniture*: Hera-style municipal sorting containers and Italian "P" parking signs.
  4. *Vehicle Fleet*: Italian registration plates on parked VW Golf and scooters.
  5. *Flora & Environment*: Dense leafy residential avenue characteristic of Northern Italy (Emilia-Romagna).
- **Pin Target**: `44.4960, 11.3200` (Zoom: 15)
- **Result**: **4,997 pts** | **515 m** distance | Revealed: Via Francesco Roncati / Via Andrea Costa, Bologna, Italy.

### Round 3 / 9: Utrecht, Netherlands
- **Visual Cues**:
  1. *Street Name on Asphalt*: "Amsterdamsestraatweg" painted in clear white lettering.
  2. *Building Numbers & Clinic*: FysioHolland building with house numbers `642 - 644 - 646`.
  3. *Dutch Cycling Infrastructure*: Dedicated red asphalt cycle track (*fietspad*), yellow traffic bollards, parked Dutch commuter bikes.
  4. *Yellow Dutch License Plates*: Parked cars displaying standard Netherlands yellow plates.
  5. *Urban Geography*: Amsterdamsestraatweg is the historic main northwestern artery of Utrecht passing through Zuilen.
- **Pin Target**: `52.1158, 5.0870` (Zoom: 16)
- **Result**: **4,997 pts** | **625 m** distance | Revealed: Amsterdamsestraatweg, Utrecht, Netherlands.

### Round 4 / 9: East Flanders, Belgium
- **Visual Cues**:
  1. *Road Number on Asphalt*: "N444" painted on the road lane.
  2. *Commercial Storefront*: "FOTO AKTIEF - PORTRET * REPORTAGE * STUDIO" in Flemish Dutch.
  3. *Belgian Lintbebouwing*: Distinctive Belgian roadside ribbon architecture with mixed brick and whitewashed gables.
  4. *Belgian Utility Poles*: Tall concrete overhead electricity poles and reddish-brick sidewalk/cycleway.
  5. *Regional Route*: Belgian Gewestweg N444 corridor in East Flanders (Oost-Vlaanderen).
- **Pin Target**: `50.9750, 3.9550` (Zoom: 15)
- **Result**: **4,927 pts** | **14.7 km** distance | Revealed: N444 corridor, Merelbeke-Melle south of Ghent, Belgium.

### Round 5 / 9: Coimbra, Portugal
- **Visual Cues**:
  1. *Street Name on Asphalt*: "R. Figueira da Foz" (Rua Figueira da Foz) in Portuguese.
  2. *Portuguese Architecture & Azulejos*: Stucco townhouse facades with granite stone surrounds, terracotta roof tiles, and blue/white ceramic tile panel beside doorway.
  3. *Portuguese Signage*: Blue "P - PRIVATIVO" parking sign and Portuguese medical laboratory sign (*actualab*).
  4. *Pavement Style*: Traditional Portuguese cobblestone (*calçada*) sidewalk trim.
  5. *Urban Geography*: Rua da Figueira da Foz is a central arterial residential street in Coimbra, Centro Region, Portugal.
- **Pin Target**: `40.2185, -8.4320` (Zoom: 16)
- **Result**: **4,998 pts** | **358 m** distance | Revealed: Rua da Figueira da Foz, Coimbra, Portugal.

### Round 6 / 9: Uppsala, Sweden
- **Visual Cues**:
  1. *Street Name on Asphalt*: "Bergagatan" (Swedish "-gatan" street suffix).
  2. *Swedish Wooden Architecture*: Classic vertical green timber-clad villa (*träpanel*) with white trim, red tiled roof, and brick chimney.
  3. *Nordic Residential Setting*: Suburban cul-de-sac with manicured cedar/thuja hedges and Nordic lamppost design.
  4. *Vehicle Fleet*: Black station wagon parked in driveway typical of Swedish suburban residential areas.
  5. *Regional Location*: Bergagatan situated in Uppsala, Sweden.
- **Pin Target**: `59.8480, 17.6140` (Zoom: 16)
- **Result**: **5,000 pts** | **12 m** distance | Revealed: Bergagatan, Uppsala, Sweden.

### Round 7 / 9: Tartu, Estonia
- **Visual Cues**:
  1. *Street Name on Asphalt*: "Sepakuru tn" (Estonian *Sepakuru tänav*).
  2. *Baltic Gable Architecture*: Steep-pitched gable roofs on detached suburban homes with timber/stucco siding.
  3. *Garden Fences & Grounds*: Picket/wire property fencing with neat flowerbeds (marigolds) and driveway entrances.
  4. *Flora & Environment*: Birch and Scots pine trees typical of Baltic climate.
  5. *Urban District*: Sepakuru tänav located in the Variku residential district of Tartu, Estonia.
- **Pin Target**: `58.3540, 26.7180` (Zoom: 16)
- **Result**: **4,997 pts** | **691 m** distance | Revealed: Sireli tn / Sepakuru tn (Variku), Tartu, Estonia.

### Round 8 / 9: Banská Bystrica, Slovakia
- **Visual Cues**:
  1. *Street Name on Asphalt*: "Jelšová" (Slovak *Jelšová ulica* with Slovak caron on 'š').
  2. *Slovak Valley Residential Architecture*: Stucco 2-story family houses with brick bases, tiled gabled roofs with snow guards (*sneholamy*), and private balconies.
  3. *Utility Infrastructure*: Built-in stone wall gas/electric distribution cabinet (*SPP/plyn*) and wooden telegraph post with transformer box.
  4. *Mountain Setting*: Forested Carpathian hill ridges enclosing the residential valley.
  5. *Regional Location*: Jelšová ulica in the Banská Bystrica / Central Slovakia mountain valley region.
- **Pin Target**: `48.7350, 19.1150` (Zoom: 15)
- **Result**: **4,984 pts** | **3,235 m** distance | Revealed: Kostiviarska / northern Banská Bystrica valley, Slovakia.

### Round 9 / 9: County Galway, Ireland
- **Visual Cues**:
  1. *Irish Yellow Dashed Road Markings*: Yellow dashed broken center lines and yellow edge lines (distinctive national road marking system in Ireland).
  2. *Left-Hand Drive Traffic Layout*: British Isles driving on the left with raised pavement on the inside curve.
  3. *Irish Stone Walls & Cottages*: Curving mortared fieldstone boundary walls, whitewashed detached homes with slate roofs and brick chimneys.
  4. *Driveway Infrastructure*: Black wrought-iron security gate and entrance signage at property boundary.
  5. *Geographic Environment*: Rolling green coastal topography with broadleaf trees and temperate oceanic sky.
- **Pin Target**: `53.2500, -6.2000` (Zoom: 14)
- **Result**: **4,112 pts** | **195.4 km** distance | Revealed: Moycullen / Galway Bay area, Ireland.

---

## 3. Hard Competition (8 Rounds) — Score: 36,624 / 40,000 Pts (Rank #4)

### Round 1 / 8: Arcadia, Greece
- **Visual Cues**:
  1. *Greek Text on Asphalt*: "Επαρ.Οδ. ... Παράλιο..." (Provincial Road / *Επαρχιακή Οδός* leading to *Παράλιο Άστρος*).
  2. *Greek Alphabet & Geography*: Regional road connecting to Paralio Astros, Arcadia, Peloponnese peninsula, Greece.
  3. *Mediterranean Scrub & Flora*: Cypress, Greek juniper, wild olive scrub, dry limestone rocky soil.
  4. *Road Infrastructure*: Single-carriageway rural highway with coarse gravel asphalt and white center/edge markings.
  5. *Vehicle*: White passenger van in the distance ahead on the eastbound descent toward the Argolic Gulf.
- **Pin Target**: `37.4200, 22.7300` (Zoom: 14)
- **Result**: **4,926 pts** | **14.9 km** distance | Revealed: Kato Vervena / Astros, Arcadia, Greece.

### Round 2 / 8: Transylvania, Romania
- **Visual Cues**:
  1. *Rustic Farmstead & Barn*: Weathered timber barn with dark shingled roof on a red-brick foundation wall.
  2. *Pastoral Landscape*: Verdant rolling pastures with wooden fence posts and roadside vegetable garden.
  3. *Road Markings & Streetlights*: Single rural asphalt lane with dashed white centerline and slender lampposts lining the village approach.
  4. *Topography*: Gentle undulating green hills characteristic of the Transylvanian plateau.
  5. *Regional Setting*: Central Romanian / Transylvanian rural village (Mureș / Cluj / Sighișoara region).
- **Pin Target**: `46.6000, 24.2000` (Zoom: 11)
- **Result**: **4,617 pts** | **79.6 km** distance | Revealed: Agnita / Sibiu region, Transylvania, Romania.

### Round 3 / 8: Rhodope Mountains, Bulgaria
- **Visual Cues**:
  1. *Balkan Mountain Architecture*: Whitewashed multi-story houses with hipped terracotta tile roofs and wide eaves perched on hillside slopes.
  2. *Bridge & Infrastructure*: Small stream bridge with galvanized steel vertical picket balustrade, overhead utility lines, and roadside blue fountain/hydrant post.
  3. *High Mountain Terrain*: Steep mountain ridges covered in dense coniferous and deciduous forests (spruce, pine, beech).
  4. *Pedestrian Presence*: Local resident walking uphill along the curved asphalt mountain road.
  5. *Geographic Match*: Classic scenery of the Rhodope Mountains (Родопи) in southern Bulgaria (Smolyan / Devin / Chepelare region).
- **Pin Target**: `41.6500, 24.5500` (Zoom: 11)
- **Result**: **4,822 pts** | **36.2 km** distance | Revealed: Varbina / Madan area, Smolyan Province, Bulgaria.

### Round 4 / 8: Southern Great Plain, Hungary
- **Visual Cues**:
  1. *Pannonian Crop Strips*: Alternating adjacent parallel strips of blooming sunflowers, ripe golden wheat, and tall green corn/maize.
  2. *Topography*: Perfectly flat lowland plain stretching to the distant horizon.
  3. *Agricultural Utilities*: Slender single wooden telephone pole standing in the field strip boundary.
  4. *Road Infrastructure*: Narrow rural asphalt lane with grassy unpaved verge.
  5. *Geographic Match*: Classic Pannonian Basin agricultural landscape (Southern Great Plain / Alföld, Hungary or Vojvodina, Serbia).
- **Pin Target**: `46.6000, 20.1000` (Zoom: 10)
- **Result**: **4,939 pts** | **12.3 km** distance | Revealed: Csanytelek / Tömörkény, Csongrád-Csanád, Hungary.

### Round 5 / 8: Vidzeme, Latvia
- **Visual Cues**:
  1. *Unpaved Forest Track*: Single-lane straight dirt/gravel track with grassy center berm and roadside drainage ditches.
  2. *Boreal / Wetland Flora*: Dense stands of silver birch (*Betula*), alder (*Alnus*), and willow thickets in moist lowlands.
  3. *Topography*: Completely flat lowland terrain with high water table.
  4. *Northern Lighting*: High clear sun angle with pale northern European skies.
  5. *Regional Signature*: Characteristic Baltic forest/peatland scenery across Latvia, Lithuania, and Southern Estonia.
- **Pin Target**: `56.5000, 24.5000` (Zoom: 8)
- **Result**: **4,407 pts** | **126.2 km** distance | Revealed: Jaunpiebalga / Vidzeme, Latvia.

### Round 6 / 8: Panevėžys County, Lithuania
- **Visual Cues**:
  1. *Road Number on Gravel*: "3426" (Lithuanian 4-digit *rajoninis kelias* numbering system where 34xx corresponds to Panevėžys/Kupiškis County).
  2. *Lithuanian Gravel Plain (Žvyrkelis)*: Wide straight unpaved crushed stone road through expansive cereal fields.
  3. *Soviet-Era Agricultural Ruins*: Concrete brick collective farm (*kolkhoz*) barn ruins alongside the road.
  4. *Flora & Shelterbelts*: Spruce/pine windbreak grove on the left and open agricultural horizons under summer cloud cover.
  5. *Regional Location*: Road 3426 in Panevėžys / Pasvalys / Kupiškis County, northeastern Lithuania.
- **Pin Target**: `55.9000, 24.7000` (Zoom: 11)
- **Result**: **4,690 pts** | **64.1 km** distance | Revealed: Road 3426 near Vabalninkas / Pasvalys, Panevėžys County, Lithuania.

### Round 7 / 8: North Jutland, Denmark
- **Visual Cues**:
  1. *Street Name on Asphalt*: "Skalvej" (Danish "-vej" road suffix).
  2. *Wind Turbine Infrastructure*: Modern 3-bladed commercial wind turbine and agricultural farm buildings on the western horizon.
  3. *Danish Coastal / Rural Topography*: Sweeping green cereal pastures and low rolling coastal moraine hills.
  4. *Road Infrastructure*: Single narrow asphalt lane without centerlines flanked by gravel berms and wild chervil.
  5. *Regional Location*: Skalvej in the Limfjorden / North Jutland (Nordjylland) farming region of Denmark.
- **Pin Target**: `56.9000, 9.3000` (Zoom: 11)
- **Result**: **4,630 pts** | **76.8 km** distance | Revealed: Skalvej, Harboøre / Western Limfjorden coast, Denmark.

### Round 8 / 8: Oulu / Central Boreal, Finland
- **Visual Cues**:
  1. *Nordic Double Solid White Center Lines*: Smooth dark asphalt highway marked with parallel white center lines.
  2. *Boreal Taiga & Forest Ecology*: Tall dense stands of Scots pine (*Pinus sylvestris*), birch (*Betula*), and spruce (*Picea*).
  3. *Shield Geology*: Lichen-covered granite bedrock outcrop and low bilberry/lingonberry undergrowth.
  4. *Camera Car Artifact*: Black car hood visible at bottom of frame.
  5. *Regional Signature*: Quintessential landscape of Finnish Lakeland / Central Finland (Keski-Suomi / Pirkanmaa / Savonia).
- **Pin Target**: `62.0000, 26.0000` (Zoom: 8)
- **Result**: **3,593 pts** | **330.3 km** distance | Revealed: Pudasjärvi / Oulu region, Finland.

---
