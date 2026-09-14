# Recorded interactive-agent benchmark

The benchmark contains published runs for GPT-6 Astra low, GPT-5.6 Sol
max/xhigh, Grok 4.6 xhigh, GLM-5.3-Flash + MCP, and Gemini 3.7/3.8 Flash.

The top three-run means are [`gemini-3.8-flash-high-aided/`](gemini-3.8-flash-high-aided/)
(**120,390.33**), [`gemini-3.7-flash-high-aided/`](gemini-3.7-flash-high-aided/)
(**120,202.67**), and [`gemini-3.7-flash-medium-aided/`](gemini-3.7-flash-medium-aided/)
(**120,152.67**). The original unaided control remains under
[`gemini-3.7-flash-high/`](gemini-3.7-flash-high/).

## GPT-6 Astra low

[`gpt-6-astra-low/`](gpt-6-astra-low/) adds three 25-location evaluations: **119,160**, **119,818**, and **118,759** points; mean **119,245.67 / 125,000**. Its summary, reports, and hashed screenshot evidence document the interrupted-tier composites and excluded attempts. Astra videos remain local; no Astra files were uploaded to Google Drive. Raw prediction coordinates are not yet validated for the globe.

## Run evidence layout

Every published evaluation lives under its model's `runs/run-N/` directory.
Model-level summaries and documentation remain in the model root. A run contains:

- `README.md`: scores, recorder label, and canonical session IDs.
- `report.md`: the detailed human-readable audit.
- `europe-{easy,medium,hard}/session.json`: the complete recorder manifest.
- `europe-{easy,medium,hard}/rounds/`: one authoritative raw telemetry JSON per scored round.
- `europe-{easy,medium,hard}/video-metadata/`: stored sidecars whose capture ID
  matches the scored-round manifest entry.
- `recovery-segments/` and `recovery-video-metadata/`, when present:
  non-prediction recorder segments excluded from the 25 official rounds;
  sidecars are retained only when their capture ID matches the stored WebM.
- Grok runs additionally include the raw Easy, Medium, and Hard CLI transcripts.

The JSON contents are copied unchanged from recorder output; only destination
filenames are normalized. Consequently, `path` and `video.path` fields still
describe the original collector layout. These frozen publication copies are
kept separate from the live collector inbox intentionally. Failed competition
attempts and pilots are excluded from published run directories, while recovery
segments inside a completed session are retained explicitly.

## Video capture-ID audit

The six new runs contain **150 official rounds and 150 unique stored WebM
paths**. A capture-ID check, stricter than path existence alone, matched the
stored sidecar to the official manifest entry for **139/150 rounds**. In the
remaining **11 rounds**, a no-prediction recovery capture and the later official
capture reused the same per-round output path; the stored WebM/sidecar is the
recovery capture, while the official prediction JSON, completed counters, and
leaderboard score remain intact.

Affected official rounds are Sol max R4 Medium 6 and Hard 5, plus Sol xhigh R3
Medium 8-9 and Hard 2-8. The unmatched sidecar copies are deliberately omitted
from `video-metadata/` rather than being presented as official video evidence.
The Drive archive stores each of the 150 physical WebMs once and preserves all
session and recovery JSON. This caveat affects continuous visual replay only;
it does not alter any score in the leaderboard.

Exact shared protocols are under [`protocols/`](protocols/). Grok's exact
dataset prompts are under [`grok-4.6-xhigh/prompts/`](grok-4.6-xhigh/prompts/).
The corresponding WebMs and complete downloadable bundles are stored in the
[shared Drive archive](https://drive.google.com/drive/folders/1Na3KE6yjYo1rxVunhIc2H_7cwZpyB6g0).

## Coordinate-actuator MCP evidence

Grok's separate MCP-assisted evidence is under
[`grok-4.6-xhigh/mcp-assisted/`](grok-4.6-xhigh/mcp-assisted/) for the earlier
180-second Easy condition and
[`grok-4.6-xhigh/mcp-one-shot/`](grok-4.6-xhigh/mcp-one-shot/) for the
300-second Medium/Hard condition. Each valid new Medium/Hard run retains the
raw Grok transcript, a rendered official leaderboard image, and an ordered
JSONL actuator audit. Two interrupted Medium replacement attempts are retained
and explicitly excluded instead of being silently discarded.

These results measure the model with precise model-chosen coordinate actuation;
they are not part of the raw-GUI leaderboard. Easy was not rerun under the
Medium/Hard prompt and timer, so the per-difficulty MCP means are not presented
as a combined 25-round total.

Scores are official OpenGuessr competition points, not the transient XP
animation shown after individual guesses. Repeated runs use the same 25 fixed
locations and therefore quantify run/controller variability, not independent
new-location generalization.
