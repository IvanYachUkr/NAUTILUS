# GLM Reasoning Analysis

This folder contains the cleaned and condensed reasoning traces for the three GLM benchmark runs, together with the cross-run qualitative analysis.

The separate [covered-static run](../../demo_and_extension/data/recorded-agent-benchmark/glm-5.3-flash-max/conditions/static-image-covered/runs/run-1/) contains all 15 static-image predictions, model notes, the complete stored chat text, and all 18 stored reasoning sections for GLM-5.3-Flash Max. These covered-image results are a distinct condition from the three interactive runs below.

## Structure

```text
analysis/glm_reasoning/
├── README.md
├── clean_transcript_reasoning.py
├── cross_run_glm_reasoning_analysis.md
├── run_1/
│   ├── cleaned_transcript_reasoning.md
│   └── condensed_reasoning.md
├── run_2/
│   ├── cleaned_transcript_reasoning.md
│   └── condensed_reasoning.md
└── run_3/
    ├── cleaned_transcript_reasoning.md
    └── condensed_reasoning.md
```

## Files

- `clean_transcript_reasoning.py` cleans the exported NAUTILUS GLM chat transcripts and extracts the reasoning-relevant content.
- `run_X/cleaned_transcript_reasoning.md` contains the cleaned reasoning trace for one run and stays relatively close to the original transcript.
- `run_X/condensed_reasoning.md` contains a shorter structured summary of the reasoning for each round.
- `cross_run_glm_reasoning_analysis.md` compares the reasoning behavior across Runs 1, 2, and 3, including differences in clue interpretation, knowledge retrieval, cue weighting, spatial reasoning, and verified movement effects.

## Processing Flow

```text
raw NAUTILUS GLM chat export
        ↓
clean_transcript_reasoning.py
        ↓
cleaned_transcript_reasoning.md
        ↓
condensed_reasoning.md
        ↓
cross_run_glm_reasoning_analysis.md
```

The raw NAUTILUS chat exports are not stored in this folder. The committed files are cleaned or derived analysis artifacts intended to make the reasoning process easier to inspect and reproduce.

When evaluating movement-related reasoning, the analysis distinguishes between movement claimed in the transcript and movement that can be verified from the saved screenshots.
