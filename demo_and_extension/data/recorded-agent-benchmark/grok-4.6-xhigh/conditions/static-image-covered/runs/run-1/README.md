# Grok 4.6 Extra High — masked-image predictions (2026-09-11)

**All 15 predictions are present, but the final report-write tool was cancelled.** The CLI stopped with `cancelled`; this archive recovers the complete report verbatim from that recorded write request. It is not a cleanly completed CLI run and has no successful model file-save receipt.

- `model_report_recovered.md`: all 15 per-image cue lists, alternatives, confidence estimates, coordinate guesses, and the summary table, unchanged.
- `predictions.csv` / `predictions.json`: the 15 report guesses mapped to source PNGs and mask condition.
- `reasoning.md` / `reasoning.json`: all six readable reasoning summaries exposed and stored by the CLI, unchanged. They match the streamed thought text exactly. Encrypted internal reasoning is omitted; token usage is not a count of available reasoning text.
- `transcript.md` / `conversation.jsonl`: the complete stored conversation update stream, including tools and cancellation evidence, with image bytes replaced by hashes.
- `prompt.txt`: the exact batch prompt, identical to GLM's apart from the report output filename.
- `manifest.json` / `SHA256SUMS`: session/model settings, status, input provenance, tool counts, and integrity evidence.

The condition contains 14 Google road-label-cover images and one map-metadata-cover image, with neutral filenames in an input-only folder. Source hashes match the committed masked inputs. The source mapping was added only at export time. The model setting was `grok-4.6`, served as `grok-4.6-build`, at `xhigh` (Extra High).

Recorded tools: one directory listing, 19 image reads covering all 15 images (02, 03, 04, and 06 reread), two todo updates, and the cancelled report write. No web, MCP, ground-truth reads, or browser controls appear. The tool's image responses are JPEG payloads derived from the input PNGs; their payload digests are retained in the conversation records.

The model inspected batches of five images in one conversation and reread four frames. This is not a fresh-chat-per-image design. Confidence and visual-cue claims are the model's own, preserved without correction or accuracy claims, including conflicting statements about visual access in its readable reasoning. This is a separate masked-image condition, not an interactive scored benchmark run.
