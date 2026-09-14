# Medium progressive-refinement diagnostic

- Competition: `24619` (`Grok MCP Medium 300s R1`)
- Status: complete diagnostic; excluded from the one-shot three-run mean
- Result: **35,412 / 45,000**, 9/9 rounds
- Timeouts/defaults: 1 (round 1)
- Prompt: [progressive Medium](../../../../../openguessr-mcp/integration/grok-medium-refinement-mcp-prompt.md)

`transcript.txt` is the raw completed Grok CLI output and
`official-result.png` is the rendered leaderboard proof.
`transcript-start-gate-failed.txt` preserves an earlier launch that stopped at
the start gate and is not part of the score. MCP JSONL auditing was added after
this diagnostic, so this folder has no `mcp-audit.jsonl`.

The same-scenes one-shot control scored 36,973 (+1,561), so this policy was not
used for the repeated Medium or Hard runs. See the [condition
summary](../../mcp-one-shot/).
