# OpenGuessr Benchmark Evaluation Report

**Model:** Gemini 3.7 Flash (Medium)  
**Evaluation Mode:** Sole Blind Visual Player (Fixed Order)  
**Dataset:** `newEval`  

---

## Summary Table

| Category | Image File | Estimated Coordinates | Location |
| :--- | :--- | :--- | :--- |
| **Europe - Easy** | `loc_001.png` | `48.8526° N, 2.3698° E` | Paris, France |
| **Europe - Easy** | `loc_006.png` | `50.8875° N, 14.8385° E` | Sieniawka / Zittau Border, Poland |
| **Europe - Easy** | `loc_007.png` | `45.9560° N, 14.7435° E` | Višnja Gora, Slovenia |
| **Europe - Medium** | `loc_009.png` | `40.4285° N, 3.6965° W` | Madrid, Spain |
| **Europe - Medium** | `loc_010.png` | `44.4942° N, 11.3465° E` | Bologna, Emilia-Romagna, Italy |
| **Europe - Medium** | `loc_011.png` | `52.0907° N, 5.1214° E` | Utrecht, Netherlands |
| **Europe - Medium** | `loc_012.png` | `51.0500° N, 4.8500° E` | Flanders, Belgium |
| **Europe - Medium** | `loc_013.png` | `41.1579° N, 8.6291° W` | Porto, Portugal |
| **Europe - Medium** | `loc_014.png` | `59.3293° N, 18.0686° E` | Greater Stockholm, Sweden |
| **Europe - Medium** | `loc_015.png` | `58.3850° N, 24.5050° E` | Pärnu / Central Region, Estonia |
| **Europe - Medium** | `loc_016.png` | `49.0833° N, 19.3000° E` | Žilina / Tatra Foothills, Slovakia |
| **Europe - Hard** | `loc_018.png` | `43.7650° N, 16.1250° E` | Dalmatian Karst Hinterland, Croatia |
| **Europe - Hard** | `loc_023.png` | `55.7348° N, 24.3575° E` | Panevėžys Plains, Lithuania |
| **Europe - Hard** | `loc_024.png` | `55.4500° N, 9.6000° E` | Jutland, Denmark |

---

## Detailed Visual Analysis

### Europe - Easy

#### 1. `loc_001.png`
* **Estimated Location:** Place de la Bastille / Rue de Lyon, Paris, Île-de-France, France
* **Estimated Coordinates:** `48.8526° N, 2.3698° E`
* **Visual Clues Identified:**
  1. **Landmark:** The Colonne de Juillet (July Column) standing tall in the center-background, crowned with the gilded bronze statue *Génie de la Liberté*.
  2. **Modern Architecture:** The unmistakable curved glass-and-granite facade of the *Opéra Bastille* prominently on the right.
  3. **Transit Signage:** RATP bus shelter and pole with the circular green `BUS` emblem and station name plaque reading `Bastille`.
  4. **Urban Furniture & Markings:** Classic dark green Parisian street lamps, Haussmann-style residential facades along the square, and French bus lane yellow road zig-zags.

---

#### 2. `loc_006.png`
* **Estimated Location:** Sieniawka / Porajów (Border to Zittau, Germany), Lower Silesia, Poland
* **Estimated Coordinates:** `50.8875° N, 14.8385° E`
* **Visual Clues Identified:**
  1. **Directional Road Sign:** Large green sign with arrow pointing left to `178 Zittau [PL] [D]`, indicating the cross-border route to Zittau, Germany.
  2. **Border Signage:** Yellow rectangular road sign reading `Granica Państwa` ("State Border" in Polish).
  3. **Traffic Infrastructure:** Standard Polish blue pedestrian crossing sign (`D-6`) with triangular white inner border, cobblestone road apron, and Polish-style guardrails.
  4. **Landscape & Church:** Central European border village church tower visible in the background against a rolling low-elevation landscape.

---

#### 3. `loc_007.png`
* **Estimated Location:** Višnja Gora Train Station, Lower Carniola (Dolenjska), Slovenia
* **Estimated Coordinates:** `45.9560° N, 14.7435° E`
* **Visual Clues Identified:**
  1. **Town / Station Nameplate:** The building facade clearly displays the town sign `VIŠNJA GORA`.
  2. **Directional Road Signage:** Yellow directional signs pointing towards `Ljubljana` and `Novo mesto` with a green motorway highway symbol.
  3. **Street Name Sign:** Blue street name plaque reading `Ulica Antona Tomšiča`.
  4. **Architecture & Scenery:** Red terracotta tiled railway station with peach-painted exterior set against lush, forested Slovenian karst hills.

---

### Europe - Medium

#### 4. `loc_009.png`
* **Estimated Location:** Madrid (Chamberí / Salamanca district), Spain
* **Estimated Coordinates:** `40.4285° N, 3.6965° W`
* **Visual Clues Identified:**
  1. **Recycling Infrastructure:** Characteristic bright green domed glass recycling container (`ecovidrio`) on the sidewalk.
  2. **Commercial Signage:** Office front displaying `GENERALI Seguros` (Spanish insurance) and restaurant sign `Mama Rocha`.
  3. **Architecture:** Classic Spanish 19th/early 20th-century multi-story residential buildings with wrought-iron balconies and street-corner tile plaques.
  4. **Road Markings:** Yellow diagonal hatching indicating loading/taxi zones alongside Spanish-style cast-iron lampposts.

---

#### 5. `loc_010.png`
* **Estimated Location:** Bologna (or Florence), Emilia-Romagna / Tuscany, Italy
* **Estimated Coordinates:** `44.4942° N, 11.3465° E`
* **Visual Clues Identified:**
  1. **Municipal Waste Bins:** Standard Italian street dumpster row including yellow-top (plastic/cans), blue-top (`CARTA`), and dark grey bins with municipal sorting symbols.
  2. **Residential Architecture:** Terracotta-toned and red-brick Italian residential villas with dark green external louvers/shutters (*persiane*) and decorative wrought-iron railings.
  3. **Parking Signage & Markings:** Blue square `P` parking sign with motorcycle pictogram underneath and blue-painted street parking spaces (*strisce blu*).
  4. **Vegetation & Setting:** Mature deciduous urban tree canopy lining a quiet Northern/Central Italian residential avenue.

---

#### 6. `loc_011.png`
* **Estimated Location:** Utrecht / Randstad Region, Netherlands
* **Estimated Coordinates:** `52.0907° N, 5.1214° E`
* **Visual Clues Identified:**
  1. **Commercial Signage:** Prominent yellow-and-black vertical banner and storefront sign for `FYSIO HOLLAND`.
  2. **Bicycle Infrastructure:** Dedicated red-paved cycle path (*fietspad*) alongside the sidewalk filled with numerous Dutch city bikes.
  3. **Bollards & Street Layout:** Characteristic yellow Dutch plastic road bollards with blue directional arrow inserts.
  4. **Vehicle Plates & Architecture:** Yellow Dutch license plates on parked passenger cars and 1930s Dutch dark brick residential row houses on the left.

---

#### 7. `loc_012.png`
* **Estimated Location:** Flanders (e.g. Limburg / Antwerp / Flemish Brabant), Belgium
* **Estimated Coordinates:** `51.0500° N, 4.8500° E`
* **Visual Clues Identified:**
  1. **Business Signage:** Commercial photography shop sign reading `FOTO AKTIEF (PORTRET - REPORTAGE - STUDIO)` in Dutch.
  2. **Architectural Style:** Classic Flemish ribbon development (*lintbebouwing*) featuring varied brickwork, painted side gables, steep roof pitches, and dark roof tiles.
  3. **Road / Cycleway Design:** Red/pink concrete paver cycling path separated by concrete curbs along an unstriped provincial road.
  4. **House Numbering:** High house number marker (`750`) on a black plaque next to a low brick garden wall.

---

#### 8. `loc_013.png`
* **Estimated Location:** Porto / Central-Northern Region, Portugal
* **Estimated Coordinates:** `41.1579° N, 8.6291° W`
* **Visual Clues Identified:**
  1. **Parking Sign:** Blue square parking sign displaying `P` with the label `PRIVATIVO` underneath (Portuguese for private parking).
  2. **Architectural Features:** Traditional Portuguese urban residential facades with granite window lintels/frames, wrought-iron Juliet balconies, and ground-floor ceramic tile (*azulejo*) ornamentation.
  3. **Waste Receptacle:** Green street dumpster with Portuguese municipal notice text (`PROIBIDA...`).
  4. **Street Fabric:** Dense, narrow Portuguese urban street with granite curbs and pastel stucco facade finishes.

---

#### 9. `loc_014.png`
* **Estimated Location:** Greater Stockholm / Central Sweden, Sweden
* **Estimated Coordinates:** `59.3293° N, 18.0686° E`
* **Visual Clues Identified:**
  1. **Wooden Architecture:** Swedish single-family houses with vertical timber cladding painted in muted green and Swedish ochre/yellow, with white window casings and dark tile roofs.
  2. **Electrical & Street Infrastructure:** Slender grey Swedish street lamppost and adjacent grey/green ground utility box.
  3. **Landscape & Boundary:** Tightly clipped thuja hedge boundaries, manicured suburban lawns, and asphalt residential cul-de-sac.
  4. **Vehicles:** Swedish/Scandinavian market station wagons parked on private paved driveways.

---

#### 10. `loc_015.png`
* **Estimated Location:** Pärnu / Tartu / Southern Region, Estonia
* **Estimated Coordinates:** `58.3850° N, 24.5050° E`
* **Visual Clues Identified:**
  1. **Baltic House Architecture:** Steep-pitched sheet metal roof on the left with circular attic window, adjacent to a classic grey stucco house with an asbestos-cement/slate roof.
  2. **Fences & Gates:** Low welded metal wire-mesh front gates and vertical wooden picket fencing typical of Baltic residential suburbs.
  3. **Overhead Infrastructure:** Low-voltage overhead electrical wiring mounted on slender roadside wooden poles.
  4. **Vegetation & Topography:** Completely flat terrain with birch trees, pines, and spruce in the background and neat front flower gardens.

---

#### 11. `loc_016.png`
* **Estimated Location:** Žilina / Banská Bystrica (Tatra/Carpathian foothills), Slovakia
* **Estimated Coordinates:** `49.0833° N, 19.3000° E`
* **Visual Clues Identified:**
  1. **Mountainous Backdrop:** Dense, steep forested mountains rising directly behind the village.
  2. **Regional House Architecture:** Two-story stucco house in warm yellow tones with external covered entrance stairs, brick base, and dark tin/sheet metal gable roof with Velux roof windows.
  3. **Utility Pole:** Wooden power line pole in the foreground with electrical distribution box and danger symbol.
  4. **Fencing & Garden:** Concrete/stone pillar fence with horizontal infill slats and ornamental evergreen conifer plantings.

---

### Europe - Hard

#### 12. `loc_018.png`
* **Estimated Location:** Dalmatian Karst Plateau / Hinterland, Croatia
* **Estimated Coordinates:** `43.7650° N, 16.1250° E`
* **Visual Clues Identified:**
  1. **Vegetation:** Arid Mediterranean *macchia* / *garrigue* scrubland dominated by wild juniper bushes, cypress, and low dry shrubs.
  2. **Karst Terrain & Soil:** Pale white/grey limestone rock outcroppings and rocky, pale limestone gravel along the road shoulders.
  3. **Road Atmosphere:** Narrow single-carriageway unstriped asphalt road traversing a remote, undulating plateau with a distant white tour bus.
  4. **Climate & Light:** Intense southern Mediterranean sunlight under an open sky with fair-weather cumulus clouds.

---

#### 13. `loc_023.png`
* **Estimated Location:** Panevėžys / Šiauliai Agricultural Lowlands, Lithuania
* **Estimated Coordinates:** `55.7348° N, 24.3575° E`
* **Visual Clues Identified:**
  1. **Rural Road Type:** Wide, flat, light-grey unpaved gravel country road (*žvyrkelis*) cutting straight across vast farmland.
  2. **Historical Structures:** Derelict Soviet-era collective farm (*kolkhoz*) concrete-block barns and masonry foundations on the left roadside.
  3. **Topography & Vegetation:** Completely flat Baltic lowland plains with vast cereal crop fields bounded by distant mixed pine and spruce forests.
  4. **Atmosphere:** Expansive open sky filled with northern summer cumulus clouds.

---

#### 14. `loc_024.png`
* **Estimated Location:** Jutland Peninsula / Funen, Denmark
* **Estimated Coordinates:** `55.4500° N, 9.6000° E`
* **Visual Clues Identified:**
  1. **Landscape & Relief:** Gently rolling, open coastal agricultural plateau with bright green pastures and ripening cereal fields.
  2. **Renewable Energy Infrastructure:** Tall three-bladed commercial wind turbine standing against the horizon on the left.
  3. **Road Design:** Narrow unstriped asphalt country lane with narrow gravel shoulders and lush grassy verges blooming with white wild chervil / cow parsley.
  4. **Climate / Horizon:** Distant flat coastal industrial chimneys and low-lying maritime stratocumulus cloud cover typical of the Danish maritime countryside.
