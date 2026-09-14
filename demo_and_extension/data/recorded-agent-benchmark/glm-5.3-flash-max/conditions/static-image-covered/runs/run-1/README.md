# GLM-5.3-Flash Max — masked-image predictions (2026-09-11)

Completed static-image batch over **15 masked starting images**: 14 Google road-label-cover variants and one map-metadata-cover variant. This is a separate masked-image condition, not one of the three interactive GLM benchmark runs.

- `model_report.md`: the complete model-written per-image cues, alternatives, confidence, and predictions, unchanged.
- `final_response.md`: the final chat answer, unchanged.
- `predictions.csv` / `predictions.json`: all 15 final guesses, mapped back to the source image and mask condition.
- `reasoning.md`: all **18 stored reasoning sections**, verbatim and chronological.
- `transcript.md` / `conversation.json`: the selected chat's full stored text and reasoning, with tool records and message provenance (21 messages, 92 parts).
- `prompt.txt`: the exact batch prompt.
- `manifest.json` / `SHA256SUMS`: source-image mapping, hashes, counts, and integrity evidence.

The model received neutral filenames `image_01.png` through `image_15.png` in an input-only folder. Input hashes match the committed masked PNGs; the source mapping was added only during this export. The recorded tools are one directory listing, 15 image reads, and one report write. No web, MCP, browser controls, or ground-truth reads appear in the chat.

All 15 images were processed sequentially in one conversation, so earlier images and answers remained in context. This differs from a fresh-chat-per-image design. Confidence values are the model's own estimates; predictions and claimed visual cues are preserved without correction or accuracy claims. The report's phrase "no external tools" describes its own method; the actual local file tools are documented above.

Only reasoning exposed and stored by ZCode is included. Binary image attachments are represented by digest records; the source PNGs already reside under `demo_and_extension/data/starting-images-covered/`. The earlier single-image pilot and all Grok work are excluded.
