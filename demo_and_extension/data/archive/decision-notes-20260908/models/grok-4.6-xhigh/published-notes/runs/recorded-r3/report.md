# NAUTILUS Grok 4.6 xhigh recorded R3

Date: 2026-08-31  
Player: Ivan Yachnik  
Model: Grok 4.6, xhigh reasoning  
Recorder label: `grok-4.6-xhigh-recorded`  
Condition: `interactive-panorama`  
Recorder: OpenGuessr Research Round Recorder `0.7.26`

## Result

| Level | Dataset | Rounds | Official score | Maximum | Percent |
| --- | --- | ---: | ---: | ---: | ---: |
| Easy | `europe-easy` | 8/8 | 24,075 | 40,000 | 60.19% |
| Medium | `europe-medium` | 9/9 | 25,093 | 45,000 | 55.76% |
| Hard | `europe-hard` | 8/8 | 24,054 | 40,000 | 60.14% |
| **Overall** | — | **25/25** | **73,222** | **125,000** | **58.58%** |

All three rendered leaderboards showed the totals above. Every session reached
its expected completed-round count and was explicitly disarmed.

## Method and artifacts

The run used the exact dataset prompts in `../../prompts/` and the protocol in
`../../protocol.md`: no web search, memory, subagents, DOM/accessibility data,
page scripts, hidden coordinates, or prior answers. Grok acted through the six
allowed screenshot and coordinate browser controls. Scene recognition was
often stronger than coarse world-map pin control; the official points above
are the result, without adjustment.

Canonical session IDs are listed in [`README.md`](README.md). Each dataset
folder contains the complete manifest, 25 authoritative prediction records in
total, and matching non-video sidecars. The raw Easy, Medium, and Hard CLI
transcripts beside this report are the detailed round audit. WebMs are retained
in the shared Drive bundle.
