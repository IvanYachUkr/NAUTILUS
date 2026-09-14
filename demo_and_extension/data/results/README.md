# Model results and human review

These files contain model outputs and annotation data, separate from both the
location catalog and raw extension recordings.

Use one file per location or multiple files with the same `locationId`. Runs are
merged during `npm run data:build`.

For an interactive run, the generator attaches a recording using:

1. `recordingId` when explicitly provided; otherwise
2. the newest recording with the same location ID, exact model name, and
   condition.

The extension's model field must therefore use the same spelling as `run.model`.

## Recorded agent benchmark

Canonical completed interactive-agent runs are published under
[`../recorded-agent-benchmark/`](../recorded-agent-benchmark/). That directory
keeps the raw non-video recorder evidence separate from optional visualization
result annotations.
