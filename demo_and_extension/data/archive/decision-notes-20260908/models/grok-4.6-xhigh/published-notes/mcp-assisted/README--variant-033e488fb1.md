# Grok 4.6 xhigh — OpenGuessr MCP-assisted Easy

Three complete games under the separate `grok-4.6-xhigh-mcp-assisted`
condition. All games used the same eight fixed `europe-easy` scenes, 180 seconds
per round, Grok CLI 1.0.4, and the exact prompt at
[`../../../../openguessr-mcp/integration/grok-easy-full-game-prompt.md`](../../../../openguessr-mcp/integration/grok-easy-full-game-prompt.md).

Prompt SHA-256:
`9105E46B19BC1565670F05EA3352845DAC0BD2924B51EAB6E5F285EDE504CFB7`.

| Run | Competition | Rounds | Official score | Defaults | Belief-to-pin mismatches | Audit |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| MCP R1 | `24612` | 8/8 | **39,661** | 0 | 0 | [run](../runs/mcp-assisted-r1/) |
| MCP R2 | `24615` | 8/8 | **39,981** | 0 | 0 | [run](../runs/mcp-assisted-r2/) |
| MCP R3 | `24616` | 8/8 | **39,979** | 0 | 0 | [run](../runs/mcp-assisted-r3/) |
| **Mean** | — | **8/8** | **39,873.67** | **0** | **0** | — |

The rendered leaderboards were independently re-opened after play and showed
Ivan Yachnik with the numeric totals above. Across 24 rounds, every submitted
marker matched Grok's stated coordinates. R1 was the adapter-development game:
the original Guess detector missed OpenGuessr's `div.standard-button` in rounds
1–2, and round 2 needed a controller-only submit of Grok's already verified pin.
R2 had one controller-only recovery that submitted Grok's unchanged verified
round-6 pin after a screenshot transport stall. R3 ran without human recovery;
the proxy automatically bounded the same screenshot stall, discarded the stale
upstream MCP session, reconnected, and continued.

This condition is intentionally reported separately from `interactive-panorama`.
The MCP removed coarse world-map motor error but did not provide geographic
answers, geocoding, DOM/accessibility data, network data, or hidden target
coordinates. Raw CLI transcripts and minimal per-run notes are retained beside
each run. Two interrupted transport-diagnostic attempts (`24613`, `24614`) are
excluded from the table and from the three-run mean.
