# Cross-Run GLM Reasoning Analysis

## Summary

Across Runs 1, 2, and 3, the largest differences are not always caused by different visual evidence. In many rounds, the model sees essentially the same scene but:

- reads ambiguous text differently,
- recalls different geographic knowledge,
- assigns different weight to the same clues,
- reconstructs viewpoint geometry differently,
- or falls back to different regional priors when the scene is weakly discriminative.

The interaction conditions also differ across runs:

| Run | Verified panorama rotation | Verified forward movement | Effective condition |
|---|---|---|---|
| **Run 1** | No | No | Effectively static |
| **Run 2** | No convincing successful pan | Yes, in several rounds | Limited active exploration |
| **Run 3** | No | No | Effectively static |

A repeated issue in Runs 1 and 3 is that the model sometimes claims that it can now see or read something better after a drag even though the before/after screenshots show no meaningful camera movement. These cases are best interpreted as **same-frame reinspection or reinterpretation**, not evidence gained through movement.

The clearest verified movement effect occurs in **Run 2 Medium R4**, where forward movement contributes to a change from a Netherlands hypothesis to Belgium/Flanders. Other movement cases mainly confirm an existing hypothesis or expose additional clues that the model cannot localize reliably.

---

# Main Cross-Run Patterns

## 1. Stable reasoning in high-information scenes

Distinctive landmarks and explicit place-name cues produce the most repeatable reasoning.

Examples:

- **Bastille**
- **Alexanderplatz**
- **Pula Arena**
- **Flåm**

Across runs, the same dominant cues are recognized and the model converges quickly on the same location.

---

## 2. Same scene, different text interpretation

Several of the largest cross-run changes begin with different readings of artificial map text.

Examples:

- **Medium R1:** similar `Carrer de ...` text contributes to Valencia in Runs 1-2 and Barcelona in Run 3.
- **Medium R3:** the Dutch road label is interpreted differently across runs, leading to Amersfoort, Utrecht, or the Baarn/Amersfoort region.
- **Medium R8:** `Jelšová` is treated as Slovak in Run 1 and Slovenian in Runs 2-3.
- **Hard R1:** Greek provincial-road text is correctly treated as Greek in Runs 1-2 but interpreted as Bulgarian/Cyrillic in Run 3.

The visual scene can remain nearly unchanged while the text reading activates a different geographic hypothesis.

---

## 3. Same clue, different recalled geographic knowledge

Some differences appear after the cue itself has already been identified.

The strongest example is **Hard R6**, where the same artificial road number `3426` is associated with:

- Finland in Run 1,
- Latvia in Run 2,
- Lithuania in Run 3.

The main difference is therefore not the visible cue, but the geographic rule retrieved from memory.

---

## 4. Same evidence, different cue weighting

In some rounds the runs identify broadly similar clues but prioritize them differently.

### Medium R2 — Italy

All runs recognize a northern-Italian residential environment. The main difference is how much weight is given to:

- brick architecture,
- bins and local infrastructure,
- vegetation,
- and remembered street-name associations.

Runs 1 and 3 end in Milan, while Run 2 favors Bologna.

A small AC Milan flag is visible in the scene but is not mentioned in any recorded reasoning trace. It could have reinforced a Milan association if noticed, but it was not part of the model's stated reasoning.

---

## 5. Same location, different spatial reconstruction

Some differences happen after the city has already been identified correctly.

### Easy R3 — Salzburg

All three runs recognize Salzburg and Hohensalzburg Fortress.

Runs 1-2 favor a Kapuzinerberg-side viewpoint, while Run 3 favors Mönchsberg.

This is mainly a difference in remembered city geometry rather than landmark recognition.

### Easy R4 — Český Krumlov

All three runs recognize Český Krumlov and reason from the river bend, elevated viewpoint, and old-town/castle structures.

The semantic localization is relatively consistent, while the submitted coordinates differ more strongly. Run 1 also revises its interpretation of the visible tower during the reasoning process.

---

## 6. Low-information scenes are dominated by regional priors

When the scene contains few distinctive clues, the runs often follow similar broad reasoning but end in different countries or regions.

### Hard R4 — flat agricultural plain

All runs use similar evidence:

- sunflowers,
- corn,
- harvested fields,
- extreme flatness,
- sparse rural infrastructure.

Final choices differ:

- Hungary in Run 1,
- Serbia/Vojvodina in Run 2,
- Romania in Run 3.

### Hard R3 — Balkan mountain village

Run 1 favors Bosnia/Dinaric terrain, while Runs 2-3 favor Bulgaria/Rhodopes.

### Hard R5 — scrub track

The scene contains very little discriminative information. The runs remain within broadly plausible central/eastern-European regions, but the exact fallback differs.

---

# Static vs Movement

## Run 1

No successful panorama rotation or forward movement could be verified from the saved screenshots.

The model repeatedly issues drag actions, but the panorama geometry remains effectively unchanged.

A notable example is **Hard R8**. After a drag, the model says that it can now see more and then discusses `© Autori`. However, the screenshots show no meaningful camera movement, and the provider attribution was already visible before the drag.

The reasoning change therefore comes from reinspection or reinterpretation of the same visual input rather than newly acquired scene information.

Failed drag attempts can still affect the decision process because they consume time and sometimes cause the model to stop exploring and submit a broader fallback.

---

## Run 2

Run 2 contains genuine forward movement in several rounds, even though successful panorama rotation still could not be verified convincingly.

The movement effects vary.

### Easy R7 — Slovenia

Forward movement changes the camera position and makes `Ulica Antona Tomašiča` readable.

The model gains a real new clue, but cannot reliably map the street name to a specific town. The final reasoning remains corridor-level.

### Medium R4 — N444

This is the strongest movement-driven reasoning change.

The model initially favors the Netherlands from `N444`, Dutch-language text, cycling infrastructure, and housing.

After verified forward movement, it inspects additional architecture and infrastructure and revises the country hypothesis toward Belgium/Flanders.

This is the clearest case of:

> new visual evidence → hypothesis revision

### Medium R5 — Coimbra

Movement exposes additional Portuguese commercial text and street context.

The new information mainly confirms the existing Portugal/Coimbra hypothesis.

### Medium R6 — Bergagatan

Movement reveals more houses and local details such as a house number.

The added information does not provide a strong city-level discriminator, so the city remains uncertain.

### Medium R9 — Galway region

Movement improves the visibility of local road/townland text.

The model gains a more specific-looking clue but cannot ground it reliably enough to resolve the exact location.

### Hard R3 — Balkan village

Movement exposes more houses and village details.

The model already favors Bulgaria before moving, so the new evidence mainly strengthens the existing hypothesis rather than changing it.

---

## Run 3

No successful panorama rotation or forward movement could be verified from the saved screenshots.

As in Run 1, some reasoning after a drag sounds as if the model obtained a better view, even though the panorama remains unchanged.

In **Hard R1**, the model claims that road text can now be read better after a drag and then develops a Bulgarian interpretation. The screenshot sequence does not show a meaningful viewpoint change, so the change is better explained as reinterpretation of the same frame.

---

# Detailed Round-by-Round Comparison

| Tier | Round | Main reasoning difference across runs | Movement relevance |
|---|---:|---|---|
| Easy | 1 | Bastille is recognized immediately in all runs; only minor camera-side placement differs. | No verified movement effect. |
| Easy | 2 | Alexanderplatz reasoning is highly stable across runs. | No verified movement effect. |
| Easy | 3 | Same Salzburg recognition, but Kapuzinerberg vs Mönchsberg viewpoint reconstruction. | No verified movement effect. |
| Easy | 4 | Same Český Krumlov recognition; stronger difference in coordinate placement than in semantic reasoning. | No verified movement effect. |
| Easy | 5 | Pula Arena is recognized consistently and immediately. | No verified movement effect. |
| Easy | 6 | Same Zittau border region; local crossing/road geometry is reconstructed differently. | No verified movement effect. |
| Easy | 7 | Same Slovenian corridor; Run 2 gains `Ulica Antona Tomašiča` through forward movement but cannot ground it precisely. | Genuine movement in Run 2. |
| Easy | 8 | Flåm is consistently solved from explicit text and fjord context. | No meaningful movement dependency. |
| Medium | 1 | Different interpretation of artificial street text produces Valencia vs Barcelona. | No verified movement explanation for the split. |
| Medium | 2 | Similar Italian cues are weighted differently; Milan vs Bologna. | No major movement effect. |
| Medium | 3 | Different reading of the same Dutch road label activates different city hypotheses. | No verified movement explanation for the split. |
| Medium | 4 | Runs 1 and 3 stay with Dutch interpretations; Run 2 revises toward Belgium/Flanders after exploration. | Strongest verified movement effect. |
| Medium | 5 | Coimbra reasoning is stable; extra Run 2 movement mainly confirms existing evidence. | Confirmatory movement. |
| Medium | 6 | Sweden is stable, but Jönköping vs Växjö depends on weaker city-level priors. | Movement adds detail but little discrimination. |
| Medium | 7 | Estonia is stable; Tallinn/Nõmme vs Pärnu reflects city-level prior variation. | No strong movement effect. |
| Medium | 8 | Same label is interpreted as Slovak in Run 1 and Slovenian in Runs 2-3. | Primarily text interpretation, not movement. |
| Medium | 9 | All runs favor west Galway; Run 2 gains extra local road text but still cannot resolve the exact place. | Genuine but limited movement benefit. |
| Hard | 1 | Run 1 anchors on Greek Paramythia/Epirus; Run 2 keeps a broader Greek hypothesis; Run 3 misreads the text as Bulgarian. | Run 3 change occurs without verified movement. |
| Hard | 2 | Romania/Transylvania reasoning is relatively stable; only the subregion differs. | No strong movement effect. |
| Hard | 3 | Bosnia/Dinarics in Run 1 vs Bulgaria/Rhodopes in Runs 2-3. | Run 2 movement mainly confirms Bulgaria. |
| Hard | 4 | Similar agricultural reasoning produces Hungary, Serbia, or Romania. | Difference is mainly regional prior. |
| Hard | 5 | Extremely weak visual evidence produces different central/eastern-European fallbacks. | No strong movement effect. |
| Hard | 6 | Same `3426` cue is associated with Finland, Latvia, or Lithuania. | Difference is mainly recalled geographic knowledge. |
| Hard | 7 | Denmark and western Jutland are stable; exact west-coast subregion differs. | No major movement effect. |
| Hard | 8 | All runs choose Finland; Run 1 relies strongly on `© Autori`, while Runs 2-3 rely more on physical Nordic road/forest cues. | Run 1 attribution was not revealed by movement. |

---

# Overall Findings

Across the three runs, reasoning variation can be separated into several recurring types:

1. **Stable recognition**  
   Distinctive landmarks or explicit place names produce highly repeatable predictions.

2. **Cue-perception variation**  
   The same visible text is sometimes read differently across runs.

3. **Knowledge-retrieval variation**  
   The same recognized cue can activate different geographic facts or road-number conventions.

4. **Cue-weighting variation**  
   Similar observations can lead to different predictions because different clues dominate the decision.

5. **Spatial-reconstruction variation**  
   The city is recognized correctly, but the viewpoint or local geometry is reconstructed differently.

6. **Regional-prior variation**  
   In low-information scenes, similar reasoning can end in different plausible countries or regions.

7. **Same-frame reinterpretation**  
   The model can report seeing something new after a failed movement action even when the screenshots show no meaningful camera change.

8. **Movement-driven evidence acquisition**  
   Run 2 contains several cases where forward movement genuinely exposes new information. The effect ranges from major hypothesis revision to simple confirmation or no useful improvement.

The main difference between the runs is therefore not only the final prediction. It is also **where in the reasoning pipeline the variation occurs: perception, interpretation, memory retrieval, cue weighting, spatial reconstruction, or active evidence acquisition.**
