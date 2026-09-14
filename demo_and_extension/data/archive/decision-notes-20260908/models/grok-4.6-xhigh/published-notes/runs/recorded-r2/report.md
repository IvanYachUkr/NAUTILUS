# NAUTILUS Grok 4.6 xhigh recorded R2

Date: 2026-08-31  
Player: Ivan Yachnik  
Model: Grok 4.6, xhigh reasoning  
Recorder label: `grok-4.6-xhigh-recorded`  
Condition: `interactive-panorama`  
Recorder: OpenGuessr Research Round Recorder `0.7.26`

## Result

| Level | Dataset | Rounds | Official score | Maximum | Percent |
| --- | --- | ---: | ---: | ---: | ---: |
| Easy | `europe-easy` | 8/8 | 24,688 | 40,000 | 61.72% |
| Medium | `europe-medium` | 9/9 | 28,192 | 45,000 | 62.65% |
| Hard | `europe-hard` | 8/8 | 18,682 | 40,000 | 46.71% |
| **Overall** | — | **25/25** | **71,562** | **125,000** | **57.25%** |

All three rendered leaderboards showed the totals above. Every session reached
its expected completed-round count and was explicitly disarmed. In Hard R2 the
CLI skipped the transient result overlay near timer expiry, but the recorder
saved the authoritative prediction and advanced normally; the final Hard
leaderboard reconciled to 18,682 points.

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
