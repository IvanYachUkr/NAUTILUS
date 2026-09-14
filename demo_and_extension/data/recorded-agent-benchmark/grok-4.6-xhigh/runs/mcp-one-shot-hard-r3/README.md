# Hard one-shot R3

- Competition: `24632` (`Grok Hard OneShot 300s R3`)
- Status: valid canonical run
- Result: **26,162 / 40,000**, 8/8 rounds
- Timeouts/defaults: 1 (round 1)
- Prompt: [Hard one-shot](../../../../../openguessr-mcp/integration/grok-hard-one-shot-mcp-prompt.md)

Files:

- `transcript.txt`: raw Grok CLI output and per-round record.
- `mcp-audit.jsonl`: ordered safe actuator calls, model arguments, and sanitized controller results.
- `official-result.png`: rendered official leaderboard proof.

Seven visible XP values totalled 26,119; the official leaderboard total makes
the timed-out first round a 43-point residual. Because round 1 advanced outside
the proxy, the audit's logical `round` label is one behind thereafter; tool
order, transcript, and leaderboard remain authoritative. Included in the
[three-run condition summary](../../mcp-one-shot/).
