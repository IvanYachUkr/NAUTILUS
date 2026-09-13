import assert from "node:assert/strict";
import test from "node:test";

import { buildData } from "../scripts/build-data.mjs";

test("the explorer includes Astra and the disclosed Grok MCP tier composite", async () => {
  const { atlasCases } = await buildData({ write: false, quiet: true });

  const astraRuns = atlasCases.flatMap((item) =>
    item.runs.filter((run) => run.model === "GPT-6 Astra · low" && run.condition === "interactive-panorama"),
  );
  const glmRuns = atlasCases.flatMap((item) =>
    item.runs.filter((run) => run.model === "GLM-5.3-Flash + MCP · Max" && run.condition === "interactive-panorama"),
  );
  const grokMcpRuns = atlasCases.flatMap((item) =>
    item.runs.filter((run) => run.model === "Grok 4.6 + MCP · xhigh"),
  );

  assert.equal(astraRuns.length, 25);
  assert.ok(astraRuns.every((run) => run.runKind === "model-prediction"));
  assert.ok(astraRuns.every((run) => Number.isFinite(run.prediction?.lat) && Number.isFinite(run.prediction?.lng)));
  assert.ok(astraRuns.every((run) => run.bestRunId === "run-2"));
  assert.ok(astraRuns.every((run) => Number.isFinite(run.durationSeconds)));

  assert.equal(glmRuns.length, 25);
  assert.ok(glmRuns.every((run) => Number.isFinite(run.durationSeconds)));

  assert.equal(grokMcpRuns.length, 25);
  assert.ok(grokMcpRuns.every((run) => run.runKind === "model-prediction"));
  assert.ok(grokMcpRuns.every((run) => Number.isFinite(run.prediction?.lat) && Number.isFinite(run.prediction?.lng)));
  assert.ok(grokMcpRuns.every((run) => run.bestRunId === "tier-best-composite"));
  assert.equal(grokMcpRuns.filter((run) => Number.isFinite(run.durationSeconds)).length, 25);
  const easyTimings = grokMcpRuns
    .filter((run) => run.id.includes("easy-r2"))
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((run) => run.durationSeconds);
  assert.deepEqual(easyTimings, [52.543, 95.16, 42.263, 65.076, 69.771, 180, 65.848, 26.031]);

  const threeRunBenchmarkIds = [
    "glm-5-3-flash-max",
    "gpt-6-astra-low",
    "gemini-3-7-flash-high-aided",
    "gemini-3-7-flash-medium-aided",
    "gemini-3-8-flash-high-aided",
    "gemini-3-8-flash-medium-aided",
    "gpt-5-6-sol-xhigh",
    "gpt-5-6-sol-max",
    "grok-4-6-xhigh",
    "grok-4-6-xhigh-mcp",
  ];
  for (const benchmarkId of threeRunBenchmarkIds) {
    const runs = atlasCases.flatMap((item) =>
      item.runs.filter((run) => run.benchmarkId === benchmarkId),
    );
    assert.equal(runs.length, 25, `${benchmarkId} should cover all benchmark locations`);
    assert.ok(
      runs.every((run) => run.statisticsRuns?.length === 3),
      `${benchmarkId} should retain all three predictions per location`,
    );
    assert.ok(
      runs.every((run) => run.statisticsRuns.every((item) => typeof item.accuracy?.country === "boolean")),
      `${benchmarkId} should rate country accuracy for every recorded prediction`,
    );
  }
});

test("covered static predictions retain the exact evaluated model/location coverage", async () => {
  const { atlasCases } = await buildData({ write: false, quiet: true });
  const covered = atlasCases.flatMap((item) =>
    item.runs.filter((run) => run.condition === "static-image-covered"),
  );

  assert.equal(covered.length, 131);
  assert.equal(new Set(covered.map((run) => run.model)).size, 9);
  assert.ok(covered.every((run) => run.inputImage?.path?.startsWith("data/starting-images-covered/")));
  assert.ok(covered.every((run) => Number.isFinite(run.prediction?.lat) && Number.isFinite(run.prediction?.lng)));
  assert.equal(covered.filter((run) => run.inputImage.intervention === "map-metadata-cover" || run.inputImage.intervention === "map_metadata_cover").length, 5);
});
