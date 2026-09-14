# Visual clue pipeline

The JSON files in this directory are the editable source of truth for the website's model-specific visual clues. Each location document contains canonical clues merged across a model's three benchmark reports while retaining the original run text as provenance.

## 1. Extract and merge report clues

From `demo_and_extension/`:

```sh
npm run clues:extract -- --preset gemini-3.7-flash-high-aided
```

Re-running extraction keeps existing regions, review states, and ratings when a clue's stable ID is unchanged.
Available presets cover both Gemini 3.7/3.8 aided variants, GPT-5.6 Sol xhigh/max,
GPT-6 Astra low, Grok 4.6 xhigh, GLM-5.3-Flash + MCP, and the Gemini 3.7
high unaided control. Each preset merges the detailed reports that are actually
available and keeps per-run provenance on every surviving clue.

## 2. Install and run Florence-2

Create an isolated environment while reusing an existing PyTorch installation:

```sh
python3 -m venv --system-site-packages .cache/florence-venv
.cache/florence-venv/bin/python -m pip install -r scripts/requirements-florence2.txt
HF_HOME=.cache/huggingface npm run clues:annotate
```

The command uses the immutable Microsoft model revision recorded in the annotation script and batches all phrases for one scene into Florence's native caption-to-phrase grounding task. Florence output is always stored as `needs-review`: phrase grounding does not provide a calibrated per-box confidence score. Clues that describe off-frame or abstract evidence remain `text-only` and are not assigned invented regions.

## 3. Review and adjust annotations

```sh
npm start
```

Open `http://127.0.0.1:4173/tools/clue-review/`. The local editor lets you move, resize, replace, approve, remove, or reclassify every box. Use `Ctrl/Cmd+S` to save the current location. Saving validates the document and rebuilds the generated atlas data.

Use the model dropdown to review one model-specific clue set at a time. Draft
boxes are never silently approved: they remain `needs-review` until you approve
them in this editor. `not-grounded` entries are retained as an explicit queue so
you can draw a missing box or convert the clue to text-only evidence.

## 4. Validate the website data

```sh
npm run data:check
npm run build:site
```

The public explorer reads `clueSets` compiled into `data/generated/atlas-cases.json`. Dashed image regions are Florence drafts awaiting review; solid regions have been manually reviewed.
