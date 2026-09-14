# Grok 4.6 xhigh — OpenGuessr MCP one-shot Medium and Hard

Six valid games under the separate coordinate-actuator MCP condition. All used
Grok CLI 1.0.4, Grok 4.6 at `xhigh`, the same fixed NAUTILUS scenes as the
raw-GUI benchmark, and 300 seconds per round. Geography came only from rendered
pixels; the MCP placed, verified, submitted, and advanced model-chosen pins.

Exact prompts:

- [Medium one-shot](../../../../openguessr-mcp/integration/grok-medium-one-shot-mcp-prompt.md), SHA-256 `7BB3BC0E898666A1C163595560E24D1EE0158B2F89070DB2BF7713E9A98BF7AB`
- [Hard one-shot](../../../../openguessr-mcp/integration/grok-hard-one-shot-mcp-prompt.md), SHA-256 `ED937BBFA0689A75D1677C923C51438BB2AEB1F7CCA0B7E21AF009913C99034B`

## Valid runs

| Dataset | Canonical run | Competition | Official score | Completed | Timeouts/defaults | Evidence |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Medium | R1 | `24623` | **36,973 / 45,000** | 9/9 | 1 | [run](../runs/mcp-one-shot-medium-r1/) |
| Medium | R2 | `24624` | **38,125 / 45,000** | 9/9 | 1 | [run](../runs/mcp-one-shot-medium-r2/) |
| Medium | R3 | `24629` | **32,122 / 45,000** | 9/9 | 2 | [run](../runs/mcp-one-shot-medium-r3-retry2/) |
| **Medium mean** | **3 runs** | — | **35,740 / 45,000** | **27/27** | **4** | **79.42%** |
| Hard | R1 | `24630` | **32,428 / 40,000** | 8/8 | 0 | [run](../runs/mcp-one-shot-hard-r1/) |
| Hard | R2 | `24631` | **29,646 / 40,000** | 8/8 | 1 | [run](../runs/mcp-one-shot-hard-r2/) |
| Hard | R3 | `24632` | **26,162 / 40,000** | 8/8 | 1 | [run](../runs/mcp-one-shot-hard-r3/) |
| **Hard mean** | **3 runs** | — | **29,412 / 40,000** | **24/24** | **2** | **73.53%** |

The leaderboard totals are authoritative. Where a result screen displayed XP
rather than a second points field, the per-round XP reconciled exactly to the
leaderboard. Hard R3 is the one exception: seven visible XP values totalled
26,119, so the timed-out first round is the 43-point leaderboard residual.

## Prompt-selection diagnostic

Before the repeated runs, one Medium game used the [progressive-refinement
prompt](../../../../openguessr-mcp/integration/grok-medium-refinement-mcp-prompt.md)
(SHA-256 `A9D6D6A73D274329B5544E29F8839B0261F682415399C6C24FE34E3E3B52B1A7`).
It scored **35,412** on competition `24619`. The same-scenes one-shot control
then scored **36,973**, a **+1,561-point** or **+4.41%** relative improvement.

Only one progressive placement represented a changed geographic belief:
Tallinn was refined to Nõmme, while the revealed location was Tartu, and the
distance became slightly worse. Other extra map actions mostly changed zoom or
pan without improving coordinates. The one-shot prompt was therefore selected
for the remaining Medium and Hard games as the more reliable and lower-cost
controller policy. The diagnostic remains available at
[`mcp-refinement-medium-r1/`](../runs/mcp-refinement-medium-r1/) but is not part
of either three-run mean.

## Excluded replacement attempts

| Attempt | Competition | Why excluded | Retained evidence |
| --- | ---: | --- | --- |
| Medium R3 attempt 1 | `24626` | Grok backend HTTP 520 before completion | [partial run](../runs/mcp-one-shot-medium-r3/) |
| Medium R3 attempt 2 | `24627` | Chrome renderer/control transport stopped responding before a leaderboard | [partial run](../runs/mcp-one-shot-medium-r3-retry/) |

Both attempts are infrastructure-invalid, have no official result image, and
are excluded from all aggregates. Retaining their partial transcripts and
audits makes the replacement lineage explicit.

Every valid run folder contains the raw Grok CLI transcript, a safe ordered
MCP actuator audit, an official rendered leaderboard image, and a minimal
README. [`summary.json`](summary.json) is the machine-readable index with
scores, per-round values, prompt hashes, evidence hashes, and exclusions.

The immutable run-time audits predate the final response whitelist and contain
56 `get-state` entries with the literal page path `/`; no competition ID,
query, target coordinate, or geographic answer is present. The published proxy
now strips all page-path and unexpected adapter fields before returning or
logging a custom-tool result.

The earlier Easy MCP games used a 180-second prompt and are reported separately
under [`../mcp-assisted/`](../mcp-assisted/). Easy was not rerun here, so its
mean must not be combined with these Medium and Hard means as one 25-round run.
