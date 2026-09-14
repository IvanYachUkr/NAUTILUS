import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { readJson, ROOT, writeJsonAtomic } from "./lib/workspace.mjs";

const sourcePath = join(
  ROOT,
  "..",
  "analysis",
  "astra_reasoning",
  "agentic_browser",
  "2026-09-12",
  "reconstruction",
  "all_75_predictions.json",
);
const outputPath = join(
  ROOT,
  "data",
  "recorded-agent-benchmark",
  "gpt-6-astra-low",
  "statistics",
  "all-runs.json",
);

const source = await readJson(sourcePath);
const tierOffsets = { easy: 0, medium: 8, hard: 17 };
const predictions = source.map((item) => {
  const globalIndex = tierOffsets[item.tier] + Number(item.round);
  return {
    id: `run-${item.run}-${item.tier}-${String(item.round).padStart(2, "0")}`,
    runId: `run-${item.run}`,
    atlasLocationId: `europe-${item.tier}--loc-${String(globalIndex).padStart(3, "0")}`,
    condition: "interactive-panorama",
    prediction: {
      lat: Number(item.predicted_latitude),
      lng: Number(item.predicted_longitude),
    },
    reportedDistanceMeters: Number.isFinite(item.reported_distance_m)
      ? Number(item.reported_distance_m)
      : null,
    coordinateSource: item.coordinate_source,
    sourceRecord: item.source_record,
  };
});

await writeJsonAtomic(outputPath, {
  schemaVersion: "1.0",
  description: "All three GPT-6 Astra low interactive-panorama runs, compacted from the audited 75-round reconstruction for portable site builds.",
  source: "analysis/astra_reasoning/agentic_browser/2026-09-12/reconstruction/all_75_predictions.json",
  predictions,
});

console.log(`Wrote ${predictions.length} Astra statistics predictions.`);

const glmSourcePath = join(ROOT, "..", "analysis", "evidence", "glm_final_predictions.csv");
const glmOutputPath = join(
  ROOT,
  "data",
  "recorded-agent-benchmark",
  "glm-5.3-flash-max",
  "statistics",
  "all-runs.json",
);
const [header, ...rows] = (await readFile(glmSourcePath, "utf8"))
  .trim()
  .split(/\r?\n/)
  .map((line) => line.split(","));
const columns = new Map(header.map((name, index) => [name, index]));
const glmPredictions = rows.map((row) => {
  const tier = row[columns.get("dataset")].replace("europe-", "");
  const round = Number(row[columns.get("round")]);
  const globalIndex = tierOffsets[tier] + round;
  const run = Number(row[columns.get("run")]);
  return {
    id: `run-${run}-${tier}-${String(round).padStart(2, "0")}`,
    runId: `run-${run}`,
    atlasLocationId: `europe-${tier}--loc-${String(globalIndex).padStart(3, "0")}`,
    condition: "interactive-panorama",
    prediction: {
      lat: Number(row[columns.get("pred_lat")]),
      lng: Number(row[columns.get("pred_lon")]),
    },
    coordinateSource: row[columns.get("evidence_type")],
    sourceConversation: row[columns.get("source_conversation")],
  };
});
await writeJsonAtomic(glmOutputPath, {
  schemaVersion: "1.0",
  description: "All three GLM-5.3-Flash + MCP Max interactive-panorama runs, compacted from the audited final-prediction CSV for portable site builds.",
  source: "analysis/evidence/glm_final_predictions.csv",
  predictions: glmPredictions,
});
console.log(`Wrote ${glmPredictions.length} GLM statistics predictions.`);
