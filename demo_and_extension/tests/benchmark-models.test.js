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
  assert.equal(grokMcpRuns.filter((run) => Number.isFinite(run.durationSeconds)).length, 17);
  assert.ok(grokMcpRuns
    .filter((run) => !Number.isFinite(run.durationSeconds))
    .every((run) => run.id.includes("easy-r2")));
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
