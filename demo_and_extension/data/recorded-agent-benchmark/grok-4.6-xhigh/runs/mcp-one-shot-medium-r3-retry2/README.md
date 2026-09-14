# Medium one-shot R3

- Competition: `24629` (`Grok Medium OneShot 300s R3c`)
- Status: valid canonical R3 replacement
- Result: **32,122 / 45,000**, 9/9 rounds
- Timeouts/defaults: 2 (rounds 1–2)
- Prompt: [Medium one-shot](../../../../../openguessr-mcp/integration/grok-medium-one-shot-mcp-prompt.md)

Files:

- `transcript.txt`: raw Grok CLI output and per-round record.
- `mcp-audit.jsonl`: ordered safe actuator calls, model arguments, and sanitized controller results.
- `official-result.png`: rendered official leaderboard proof.

Included as canonical R3 in the [three-run condition summary](../../mcp-one-shot/).
The `retry2` directory name preserves the full replacement lineage.
