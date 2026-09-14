import test from "node:test";
import assert from "node:assert/strict";
import * as appModule from "../src/app.js";

test("model selector prefers prediction results over recorder-only fallback runs", () => {
  const runs = [
    {
      id: "legacy-manual",
      model: "manual",
      condition: "static-image",
      runKind: "recording",
      prediction: { lat: 1, lng: 2 },
    },
    {
      id: "sol-xhigh",
      model: "GPT-5.6 Sol · xhigh",
      condition: "interactive-panorama",
      runKind: "model-prediction",
      prediction: { lat: 3, lng: 4 },
    },
    {
      id: "grok-xhigh",
      model: "Grok 4.6 · xhigh",
      condition: "interactive-panorama",
      runKind: "model-prediction",
      prediction: { lat: 5, lng: 6 },
    },
  ];

  const selected = appModule.modelPredictionRuns?.(runs);

  assert.deepEqual(
    selected?.map((run) => run.model),
    ["GPT-5.6 Sol · xhigh", "Grok 4.6 · xhigh"],
  );
});

test("legacy datasets remain usable when no explicit prediction results exist", () => {
  const runs = [
    {
      id: "legacy-manual",
      model: "manual",
      condition: "interactive-panorama",
      prediction: { lat: 1, lng: 2 },
    },
  ];

  assert.deepEqual(appModule.modelPredictionRuns?.(runs), runs);
});

test("overview predictions follow the currently selected model instead of recorder runs", () => {
  const cases = [
    {
      id: "paris",
      runs: [
        {
          id: "manual-paris",
          model: "manual",
          condition: "interactive-panorama",
          runKind: "recording",
          prediction: { lat: 48.84, lng: 2.38 },
        },
        {
          id: "sol-paris",
          model: "GPT-5.6 Sol · xhigh",
          condition: "interactive-panorama",
          runKind: "model-prediction",
          prediction: { lat: 48.85, lng: 2.37 },
        },
        {
          id: "grok-paris",
          model: "Grok 4.6 · xhigh",
          condition: "interactive-panorama",
          runKind: "model-prediction",
          prediction: { lat: 41.24, lng: -3.95 },
        },
      ],
    },
  ];

  assert.deepEqual(
    appModule.overviewPredictionRuns?.(
      cases,
      "Grok 4.6 · xhigh",
      "interactive-panorama",
    ),
    [{ caseId: "paris", run: cases[0].runs[2] }],
  );
});
