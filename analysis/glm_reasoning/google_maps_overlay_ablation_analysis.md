# Effect of Covering Google Maps Road Markings on Geo-Localization Reasoning

## Scope

This comparison examines how the model's reasoning and final localization changed when the artificial Google Maps road-name / road-number overlay was covered in the static starting images.

The comparison uses:

- three runs with the Google Maps overlay visible;
- one run with the overlay covered;
- for the final Finland case, the relevant map-provider attribution was removed.

The goal is not only to compare whether the final prediction was correct, but also to examine **how the source of evidence changed**. In particular, the analysis distinguishes between reasoning based on real scene content and reasoning based on artificial interface information.

Here, “Google Maps road marking” refers to the artificial road-name or road-number text rendered by the map interface, not to physical lane markings painted on the road.

## Overall effect

The clearest overall effect of covering the Google Maps overlay was a change in **reasoning strategy** rather than a uniform drop in localization accuracy.

With the overlay visible, the model frequently started from an artificial textual cue such as `Carrer de ...`, `Via Francesco ...`, `N444`, `Bergagatan`, an Estonian street label ending in `tn`, `Jelšová`, `3426`, or `Skålvej`. It then tried to connect that text to remembered streets, road-number systems, municipalities, or regional geography. In several cases, this became the dominant early anchor for the rest of the reasoning.

With the overlay covered, the model had to rely more heavily on **physical visual evidence** such as architecture, vegetation, road design, terrain, cycling infrastructure, buildings, waste bins, utility infrastructure, physical signs, and settlement morphology. Candidate sets generally became broader, city-level confidence often decreased, and the model more frequently ended with a regional or city-level hedge.

However, removing the overlay did **not simply make the predictions worse**. The artificial text sometimes provided a useful shortcut, but it also caused strong anchoring errors when the text was misread or when the model's remembered map knowledge was wrong. As a result, covering the overlay improved some predictions, worsened others, and had almost no effect in several scenes where the physical image already contained sufficient evidence.

## Location-by-location effects

| Difficulty | Location | Effect of covering the artificial cue | Reasoning / prediction impact |
| --- | --- | --- | --- |
| Easy | France · Bastille | **Almost no effect** | The July Column, visible Bastille signage, Opéra Bastille, and surrounding architecture already identified the location very strongly. The covered run still reached Place de la Bastille directly. The artificial road label mainly acted as redundant confirmation in some of the original runs. |
| Easy | Poland · Zittau border | **Small effect** | Even without the map overlay, physical signs such as `Zittau`, `PL`, `D`, and `Granica Państwa` strongly constrained the scene to the Polish-German border near Zittau. The model still struggled with the exact crossing, but the broad localization remained stable. |
| Easy | Slovenia · Višnja Gora corridor | **Small effect** | The physical Ljubljana / Novo mesto direction signs already localized the scene to the correct Slovenian corridor. The larger failure was not removal of the overlay but the model's repeated failure to correctly read the visible `Višnja Gora` text on the building. |
| Medium | Spain · Valencia | **Negative effect on the final prediction** | With the overlay visible, the `Carrer de ...` cue immediately placed the scene in a Catalan/Valencian language context. Two of the three visible-overlay runs selected Valencia, while one was misled toward Barcelona. With the overlay covered, the model still recognized Spain but lost that language anchor and selected Madrid from architectural resemblance. The cue was therefore useful, but not consistently reliable. |
| Medium | Italy · Bologna | **Positive effect** | The visible `Via Francesco ...`-type overlay repeatedly triggered speculative street-name reconstruction and pulled two of the three original runs toward Milan. Without it, the model relied more heavily on the red-brick architecture, residential morphology, bins, and street environment and selected Bologna. Here, removing the artificial cue reduced map-memory anchoring. |
| Medium | Netherlands | **Mixed / limited effect** | The Netherlands remained easy to recognize from bicycle infrastructure, brick housing, bollards, flat terrain, and other physical cues. The artificial street labels narrowed the search in the original runs, but they were interpreted differently across runs and produced different city hypotheses. Without the overlay, the country remained strong while the municipality was still unresolved. The main effect was therefore reduced apparent city-level specificity rather than loss of country recognition. |
| Medium | Belgium · Flanders | **Clear positive effect at country level** | The `N444` overlay strongly anchored the model to remembered Dutch road networks. Two of the three visible-overlay runs ultimately chose the Netherlands, while only one self-corrected to Belgium. With the overlay covered, the model relied on Flemish road morphology, ribbon development, overhead wiring, cycling infrastructure, and the correctly read `FOTO AKTIEF` sign and preferred Belgium/Flanders. This is one of the clearest cases where removing the overlay prevented an incorrect map-memory anchor. |
| Medium | Portugal · Coimbra | **Almost no effect on the prediction** | All three visible-overlay runs used `R. Figueira da Foz` as a major city-level clue and selected Coimbra. After covering the overlay, the model still selected Coimbra from Portuguese architectural cues, azulejo-style façades, balconies, slope, and old-town character. The artificial label made the route to the answer easier, but it was not necessary for the same final city prediction. |
| Medium | Sweden | **Country stable, city still weak** | `Bergagatan` made Sweden immediately obvious in the visible-overlay runs, but because the street name is common, it did not solve the city. The three runs still produced different city-level hypotheses. After the overlay was covered, the model identified Sweden from wooden housing and suburban morphology but again had no reliable city-specific evidence. The artificial cue mainly increased country confidence rather than precise localization. |
| Medium | Estonia | **Country stable, city still weak** | In the original runs, an artificial Estonian street-name label containing the abbreviation `tn` provided a strong language shortcut. The model still disagreed about the city, alternating mainly between Tallinn/Nõmme and Pärnu-type hypotheses. With the overlay covered, the model again identified Estonia from wooden houses, vegetation, fences, and road character, but city-level localization remained appearance-based. |
| Medium | Slovakia | **Positive effect on country robustness** | The artificial `Jelšova/Jelšová` label was linguistically ambiguous for the model. One visible-overlay run chose Slovakia, but two interpreted the label as Slovenian and selected Celje. With the label removed, the model used houses, forested hills, gardens, and settlement morphology and independently favored Slovakia. This reduced a direct language-reading failure. |
| Hard | Greece · Peloponnese | **Negative final prediction, but more genuinely visual reasoning** | With artificial Greek road text visible, two runs at least kept the country in Greece, although their regional placements were wrong, while one run catastrophically misread the Greek text as Bulgarian/Cyrillic and localized to Bulgaria. With the overlay covered, the model generated Greece and specifically the Peloponnese as one of its strongest hypotheses, but then changed its final answer to Turkey/Gallipoli. Human verification showed that the earlier Greece/Peloponnese hypothesis was correct. The failure therefore changed from text/script anchoring to visual hypothesis-selection under ambiguity. |
| Hard | Lithuania | **Clear positive effect** | The road-number overlay `3426` caused three different country interpretations across the visible runs: Finland, Latvia, and Lithuania. The model repeatedly tried to infer national road-number conventions from memory. With the number covered, it instead used the flat farmland, gravel road, farm buildings, and Baltic landscape and selected Lithuania directly. This is one of the strongest examples of removing an unreliable shortcut improving robustness. |
| Hard | Denmark | **Very little final effect** | `Skålvej` / `Skalvej` made Denmark easy in all three visible-overlay runs, but the physical scene itself was already highly suggestive: extreme flatness, wind turbine, maritime farmland, narrow road, and Wadden-Sea-like landscape. The covered run still selected Denmark and a similar southwestern Jutland / Ribe-Tønder region. |
| Hard | Finland | **Very little effect** | In one visible run, the `© Autori` provider attribution became a strong Finland shortcut. The other visible runs already selected Finland from forest and road appearance without relying on that attribution. After the attribution was removed, the model still chose Finland from the boreal forest, road markings, shoulders, and terrain. The attribution increased confidence but was not necessary for the country prediction. |

## Effect on the reasoning process

### 1. Less early anchoring on text

The largest qualitative difference is that the covered condition removed a common first step: **read an artificial label, map it to a language or road system, then search memory for a matching place**.

With the overlay visible, the model repeatedly treated interface text as if it were a strong geographic observation. Even when it knew that a road or street name might be common, the text often framed the rest of the candidate search. This can be seen in the repeated attempts to reconstruct `Via Francesco ...`, associate `N444` with a remembered road network, interpret `3426` through national road-number conventions, or infer a country from `Jelšová`.

After covering the overlay, the reasoning usually started from the physical scene instead. The model compared countries and regions from visual evidence first and only used genuine scene text when it was actually present.

### 2. Greater reliance on physical scene content

The covered condition increased the importance of architecture, vegetation, topography, road construction, cycling infrastructure, settlement density, utility infrastructure, and other real-world visual features.

This made the reasoning more representative of a genuine static-image geolocation task. For example, Belgium was inferred from Flemish road morphology rather than `N444`, Bologna from residential architecture rather than a speculative `Via Francesco ...` match, and Lithuania from rural landscape characteristics rather than the number `3426`.

### 3. Broader candidate sets and more hedging

Without the artificial text, the model often had fewer city-specific constraints. It therefore generated more competing hypotheses and more frequently ended with a regional hedge.

This is particularly visible in the Netherlands, Sweden, Estonia, Greece, Lithuania, Denmark, and Finland scenes. The country could often still be identified, but selecting a city or exact road became much harder.

The artificial overlay therefore often increased **apparent precision**, even when that precision was not always justified.

### 4. Fewer map-memory and language-interpretation failures

Several original runs show that the artificial text could become actively harmful when the model misread it or recalled the associated geography incorrectly.

The strongest examples are:

- `N444`, which repeatedly anchored the model to Dutch road geography even though the scene was in Belgium;
- `Jelšova/Jelšová`, which was interpreted as Slovenian in two runs and caused Slovakia to be missed;
- `3426`, which generated three different national road-number interpretations across three runs;
- the Greek road label, which in one run was misidentified as Bulgarian Cyrillic and drove the entire prediction into the wrong country;
- `Via Francesco ...`, which encouraged repeated speculative matching against remembered streets in Milan, Turin, Bologna, and other Italian cities.

Covering the overlay removed this entire class of shortcut failure.

### 5. But useful textual shortcuts were also lost

The overlay was not always harmful. In some locations it provided genuinely useful regional or language information.

Valencia is the clearest example. `Carrer de ...` immediately constrained the visible-overlay runs to a Catalan/Valencian-language setting. Once that cue was removed, the model still recognized Spain but chose Madrid based on architectural resemblance.

Likewise, `Skålvej` made Denmark almost immediate, `Bergagatan` strongly confirmed Sweden, and an Estonian street label containing `tn` strongly confirmed Estonia. In these cases, removing the artificial text did not necessarily destroy the prediction, but it reduced confidence and removed a convenient country-level shortcut.

## Effect on the final predictions

The effect on predictions is best separated into **country-level** and **city/region-level** localization.

At the **country level**, the covered condition was surprisingly robust. Many scenes still provided enough physical evidence to recover the same country: France, Poland, Slovenia, the Netherlands, Portugal, Sweden, Estonia, Denmark, and Finland all remained broadly stable. In Belgium, Slovakia, and Lithuania, removing the artificial overlay arguably made the country prediction more robust because it removed misleading text/map-memory anchors.

At the **city or regional level**, the effect was less stable. Removing the overlay sometimes removed information that had helped the model narrow the search, as in Valencia. In other cases, however, the apparent city precision produced by the overlay was itself unreliable and changed substantially from run to run.

The covered condition therefore tended to produce **less confident but more visually grounded localization**. It did not consistently increase or decrease final geographic error; instead, it changed what the model was basing the prediction on.

## Change in failure mode

One of the most important findings is that covering the artificial cues changed the **type of error** the model made.

With the overlay visible, many failures were **text- or map-memory anchoring failures**. The model read or partially read a label, connected it to remembered geography, and then continued reasoning within that interpretation even when the physical scene was not uniquely supportive.

Without the overlay, errors were more often **visual-similarity or hypothesis-selection failures**. Examples include:

- Madrid versus Valencia from architectural resemblance;
- Greece versus Turkey from Mediterranean vegetation and terrain;
- Tallinn/Nõmme versus other Estonian cities from residential appearance;
- uncertainty among Nordic/Baltic countries from road and vegetation characteristics.

The Greece/Peloponnese case demonstrates this especially well. In the covered run, the correct country and region were actually generated during reasoning, but a speculative Gallipoli analogy was given greater final weight. This is a fundamentally different failure from the original run that misread Greek interface text as Bulgarian.

## Interpretation

The experiment suggests that the Google Maps road-name / road-number overlay acted as a **high-leverage shortcut**. It could rapidly constrain language, country, road network, or even a city, but it also encouraged the model to overuse uncertain text readings and imperfect remembered map knowledge.

Removing it made the task harder in the intended way. The model had to extract geographic information from the actual image rather than from interface metadata. The resulting reasoning was usually less precise and more uncertain, but it was also easier to interpret as genuine visual geolocation.

This means that a worse performance in the covered condition should not automatically be interpreted as worse visual reasoning. In some cases, the original prediction benefited from information that would not normally be part of the scene. Conversely, a correct overlay-visible answer can still contain weak reasoning if the model reached it mainly through an artificial road label.


## Conclusion

Covering the Google Maps road labels did **not produce a simple accuracy decrease**. Instead, it changed the model's localization strategy.

With the labels visible, the model frequently used them as shortcuts into language identification, road-number systems, street-name matching, and remembered map geography. This could make localization faster and more specific, but it also created strong anchoring errors when the label was ambiguous, misread, or connected to incorrect remembered geography.

With the labels covered, the model relied more heavily on genuine visual evidence. This generally increased uncertainty and reduced street- or city-level specificity, but country-level localization often remained intact. In several cases—particularly Belgium, Slovakia, Lithuania, and the Bologna scene—removing the artificial cue actually prevented misleading map-memory reasoning and produced a more appropriate prediction.

The main effect of the intervention is therefore best described as a **shift from shortcut-driven geolocation toward visually grounded geolocation**. The resulting errors also changed character: instead of primarily failing through text interpretation and map-memory anchoring, the model more often failed through visual ambiguity, regional resemblance, or incorrect weighting between plausible visual hypotheses.

For evaluating the model as a computer-vision geolocator, this distinction is important. The covered condition provides a cleaner indication of what the model can infer from the image itself, while the original condition partly measures its ability to exploit artificial map-interface metadata.
