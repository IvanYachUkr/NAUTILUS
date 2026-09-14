# Analysis

Reproducible analyses derived from the canonical benchmark data.

## Distance analysis

Run from the repository root:

```powershell
python .\analysis\calculate_agent_distance_stats.py
```

Inputs are recorder-backed prediction coordinates, verified GLM MCP coordinates, and the explicitly documented Astra result-distance fallback. Outputs are written to `analysis/agent_distances/`:

```text
agent_distance_rounds.csv
agent_distance_stats_by_dataset.csv
agent_distance_stats_overall.csv
agent_distance_stats_by_condition.csv
agent_distance_issues.csv
agent_distance_summary.json
```

Regenerate the compact GLM coordinate evidence with:

```powershell
python .\analysis\extract_glm_final_predictions.py `
  .\demo_and_extension\data\recorded-agent-benchmark\glm-5.3-flash-max `
  --output .\analysis\evidence\glm_final_predictions.csv
```

## Other folders

- `astra_reasoning/` — verified Astra reconstruction and provenance.
- `glm_reasoning/` — cleaned and condensed GLM reasoning analyses.
- `static-baseline-no-gui-comparison/` — paired original-versus-GUI-reduced baseline analysis.
- `visualizations/` — source and output for the benchmark location map.

Covered-static prediction and cue evidence is stored with the canonical runs for [GPT-5.6 Sol max](../demo_and_extension/data/recorded-agent-benchmark/gpt-5.6-sol-max/conditions/static-image-covered/runs/run-1/), [GPT-5.6 Sol xhigh](../demo_and_extension/data/recorded-agent-benchmark/gpt-5.6-sol-xhigh/conditions/static-image-covered/runs/run-1/), and [Grok 4.6 xhigh](../demo_and_extension/data/recorded-agent-benchmark/grok-4.6-xhigh/conditions/static-image-covered/runs/run-1/).
