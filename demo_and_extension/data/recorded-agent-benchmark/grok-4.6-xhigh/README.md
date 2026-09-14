# Grok 4.6 (xhigh)

Three complete recorded runs, **75/75 official rounds**.

| Run | Recorder label | Easy | Medium | Hard | **Total** | Report |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Run 1 | `grok-4.6-xhigh-recorded` | 23,729 | 29,986 | 26,366 | **80,081** | [run](runs/run-1/) |
| Run 2 | `grok-4.6-xhigh-recorded` | 24,688 | 28,192 | 18,682 | **71,562** | [run](runs/run-2/) |
| Run 3 | `grok-4.6-xhigh-recorded` | 24,075 | 25,093 | 24,054 | **73,222** | [run](runs/run-3/) |
| **Three-run mean** | — | **24,164** | **27,757** | **23,034** | **74,955** | — |

Run 2 and R3 used the same exact dataset prompts in [`prompts/`](prompts/)
with Grok 4.6 at xhigh reasoning, web search/memory/subagents disabled, and only
six screenshot/coordinate browser controls. Their raw CLI transcripts are kept
beside each run. See [`../README.md`](../README.md) for the shared layout and
Drive archive.

## MCP-assisted conditions

The separate [`mcp-assisted/`](mcp-assisted/) condition contains three complete
8-round Easy games played with the benchmark-safe OpenGuessr coordinate MCP.
Their rendered leaderboard scores were **39,661**, **39,981**, and **39,979**
(mean **39,873.67 / 40,000**). These are not mixed into the raw-GUI leaderboard
above because the controller condition is materially different.

The [`mcp-one-shot/`](mcp-one-shot/) condition adds three valid 300-second runs
on each remaining difficulty:

| Dataset | Valid runs | Scores | Mean | Mean max |
| --- | ---: | --- | ---: | ---: |
| Medium | 3 | 36,973; 38,125; 32,122 | **35,740 / 45,000** | **79.42%** |
| Hard | 3 | 32,428; 29,646; 26,162 | **29,412 / 40,000** | **73.53%** |

A same-scenes Medium diagnostic scored **35,412** with progressive pin
refinement. The one-shot control scored **36,973** (+1,561), while the only
belief-driven refinement observed (Tallinn to Nõmme) slightly worsened that
round. The remaining Medium and Hard runs therefore used the one-shot prompt.
Easy retained its earlier 180-second prompt and is not combined with these
300-second results into a synthetic 25-round total.
