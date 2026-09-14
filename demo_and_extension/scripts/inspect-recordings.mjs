import { buildData } from "./build-data.mjs";

const asJson = process.argv.includes("--json");
const built = await buildData({ write: false, quiet: true });

const rows = built.recordings.map((recording) => ({
  file: recording.sourceFile,
  model: recording.model ?? "—",
  condition: recording.condition ?? "—",
  competition: recording.competitionId ?? "—",
  location: recording.atlasLocationId ?? recording.locationId ?? "UNMATCHED",
  samples: Array.isArray(recording.samples) ? recording.samples.length : 0,
  prediction: isCoordinate(recording.prediction) ? "yes" : "NO",
  partial: recording.partial === true ? "yes" : "no",
}));

const summary = {
  files: rows.length,
  matched: rows.filter((row) => row.location !== "UNMATCHED").length,
  unmatched: rows.filter((row) => row.location === "UNMATCHED").length,
  withPrediction: rows.filter((row) => row.prediction === "yes").length,
  withoutPrediction: rows.filter((row) => row.prediction === "NO").length,
  atlasRuns: built.atlasCases.reduce((sum, item) => sum + item.runs.length, 0),
  recordingOnlyRuns: built.atlasCases.reduce(
    (sum, item) => sum + item.runs.filter((run) => !isCoordinate(run.prediction)).length,
    0,
  ),
};

if (asJson) {
  console.log(JSON.stringify({ summary, recordings: rows }, null, 2));
} else {
  console.log("Recording import summary");
  console.table(summary);
  if (rows.length) console.table(rows);
  else console.log("No JSON recordings were found under data/recordings/inbox.");

  if (summary.withoutPrediction > 0) {
    console.log(
      "\nRecordings without predictions are still shown as playback-only runs in v0.7.1. " +
        "They cannot display a prediction pin, error line, or distance statistics until a guess coordinate is available.",
    );
  }
}

function isCoordinate(value) {
  if (!value || typeof value !== "object") return false;
  if (value.lat === null || value.lat === "" || value.lat === undefined) return false;
  if (value.lng === null || value.lng === "" || value.lng === undefined) return false;
  return Boolean(
    Number.isFinite(Number(value.lat)) &&
      Number(value.lat) >= -90 &&
      Number(value.lat) <= 90 &&
      Number.isFinite(Number(value.lng)) &&
      Number(value.lng) >= -180 &&
      Number(value.lng) <= 180,
  );
}
