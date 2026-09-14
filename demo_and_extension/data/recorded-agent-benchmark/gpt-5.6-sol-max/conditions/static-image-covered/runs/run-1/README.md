# GPT-5.6 Sol max — masked-image predictions (2026-09-11)

Completed static-image batch over all **15 masked images**, with **75 visual cue observations**, alternatives, confidence estimates, and one coordinate prediction per image.

- `model_report.md`: the original model report, preserved byte-for-byte, including notes, cues, guesses, and the complete summary table.
- `predictions.csv` / `predictions.json`: the 15 predictions mapped back to repository PNGs and mask condition.
- `prompt.txt`: the task delivered to the subagent, including the local-image-only execution clarification.
- `manifest.json` / `SHA256SUMS`: model settings, input provenance, validation, and integrity hashes.

The subagent used **GPT-5.6 Sol, max**, with fresh context and no inherited conversation. It received the same input-only folder and core batch prompt as GLM and Grok, with a separate output file. It was instructed to view only the supplied images and not consult prior reports, other agents, web sources, metadata, or answer mappings. All 15 images were reported viewable.

Inputs comprise 14 Google road-label-cover variants and one map-metadata-cover variant. Neutral filenames were used during prediction; the source mapping was added only during export. Input hashes match the committed masked PNGs. All images were processed in one subagent conversation, not separate fresh chats for each image.

The report's cue explanations and confidence values are the model's own. They are preserved without correction, scoring, or claims of ground-truth accuracy. This masked-image condition is separate from interactive scored benchmark runs.
