# Recovered Grok MCP Easy timings

The earlier plain-text transcripts retained only startup/error timestamps. The original Grok `updates.jsonl` files retain millisecond timestamps for tool requests and completions. This export restores those events for the three published Easy games (24 scored rounds); transport-diagnostic competitions 24613 and 24614 remain excluded.

The website's selected run is **mcp-assisted-r2 / competition 24615**. Its eight durations are now in `mcp-composite-best/predictions.json` and the generated website data.

| Easy round | Seconds | Timing basis |
| ---: | ---: | --- |
| 1 | 52.543 | CLI process start to successful Submit request |
| 2 | 95.160 | Previous Continue completion to successful Submit request |
| 3 | 42.263 | Previous Continue completion to successful Submit request |
| 4 | 65.076 | Previous Continue completion to successful Submit request |
| 5 | 69.771 | Previous Continue completion to successful Submit request |
| 6 | 180.000 | Configured round limit; inferred timeout, not a directly timestamped finish |
| 7 | 65.848 | Previous Continue completion to successful Submit request |
| 8 | 26.031 | Previous Continue completion to successful Submit request |

These are elapsed runtime measures, not model inference time. They include thinking, tool use, and stalls within the measured window. Round 1 starts from the CLI startup timestamp because the scene was already prepared; it excludes time before launch. Continue completion occurs slightly after the browser starts the next round, and Submit request precedes its response, so these are event-defined windows rather than exact game-clock measurements.

## Timeout and controller recovery

Easy R2 round 6 has a verified chosen pin but no successful player Submit event before the result. The parent recovery record at `2026-09-01T01:34:12.661Z` explicitly reports `resultVisible: true` **before** its submit acknowledgement. Treating that late acknowledgement as the actual finish would incorrectly add post-result waiting. The 180-second duration is inferred from the configured limit; its method and wider observation interval are retained in `round-timings.json`.

The older adapter-development R1 rounds 1 and 2 have ambiguous click/timeout/recovery endpoints. Their `durationMs` values remain null, with lower and upper observation bounds. The other 21 of 24 rows have direct event-derived durations; R2 round 6 supplies the one inferred duration. Do not replace the two nulls with zero or their following Continue times.

## Files and provenance

- [round-timings.csv](round-timings.csv): 24 rows with durations, methods, and bounds where applicable.
- [round-timings.json](round-timings.json): start/end references, source line numbers, tool-call IDs, and limitations.
- `mcp-assisted-r1-events.jsonl`, `mcp-assisted-r2-events.jsonl`, `mcp-assisted-r3-events.jsonl`: timestamped tool requests/completions and narrowly selected outputs. These are session-event exports, not retroactively created server audit logs.
- [controller-recovery.json](controller-recovery.json): original controller response evidence for R1 round 2 and R2 round 6.
- [sources.json](sources.json): source session IDs, original file hashes, and exported event hashes. Timestamps are UTC. The timestamp source is `params._meta.agentTimestampMs` in the original stream.

Original scores, coordinate predictions, and the existing Medium/Hard timing values are unchanged. Hidden reasoning, image payloads, and unrelated session data are not included.
