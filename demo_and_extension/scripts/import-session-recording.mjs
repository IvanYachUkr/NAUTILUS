import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildData } from "./build-data.mjs";
import { saveRoundRecording } from "./lib/recordings.mjs";

const argumentsList = process.argv.slice(2);
const inputArgument = argumentsList.find((argument) => !argument.startsWith("--"));
const options = Object.fromEntries(
  argumentsList
    .filter((argument) => argument.startsWith("--") && argument.includes("="))
    .map((argument) => {
      const [key, ...rest] = argument.slice(2).split("=");
      return [key, rest.join("=")];
    }),
);

if (!inputArgument || !options.competition || !options.model) {
  console.error(
    "Usage: npm run recordings:import -- session.json --competition=<id> --model=<name> [--condition=interactive-panorama]",
  );
  process.exit(1);
}

try {
  const inputPath = resolve(inputArgument);
  const session = JSON.parse(await readFile(inputPath, "utf8"));
  const workspace = await buildData({ write: false, quiet: true });
  const rounds = normalizeRounds(session);

  if (rounds.length === 0) {
    throw new Error("The session contains no rounds or round-indexed samples.");
  }

  const saved = [];
  for (const entry of rounds) {
    const recording = toRoundRecording({
      session,
      round: entry.round,
      samples: entry.samples,
      competitionId: options.competition,
      model: options.model,
      condition: options.condition ?? "interactive-panorama",
    });

    const result = await saveRoundRecording({
      recording,
      locations: workspace.locations,
      competitions: workspace.competitions,
    });
    saved.push(result.relativePath);
  }

  await buildData({ quiet: true });
  console.log(`Imported ${saved.length} round recording(s):`);
  for (const path of saved) console.log(`- ${path}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function normalizeRounds(session) {
  const samples = Array.isArray(session.samples) ? session.samples : [];
  const roundMetadata = Array.isArray(session.rounds) ? session.rounds : [];
  const indexes = new Set([
    ...roundMetadata.map((round) => Number(round.index)),
    ...samples.map((sample) => Number(sample.roundIndex)),
  ]);

  return [...indexes]
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
    .map((index) => ({
      round:
        roundMetadata.find((round) => Number(round.index) === index) ?? {
          index,
          id: `round-${index + 1}`,
        },
      samples: samples.filter((sample) => Number(sample.roundIndex) === index),
    }));
}

function toRoundRecording({
  session,
  round,
  samples,
  competitionId,
  model,
  condition,
}) {
  const startedAt =
    round.detectedAt ?? samples[0]?.capturedAt ?? session.startedAt ?? new Date().toISOString();
  const stoppedAt =
    round.endedAt ?? samples.at(-1)?.capturedAt ?? session.stoppedAt ?? startedAt;
  const startMs = Date.parse(startedAt);
  const normalizedSamples = samples.map((sample, index) => ({
    ...sample,
    originalSeq: sample.seq ?? null,
    seq: index,
    roundIndex: 0,
    tMs: Number.isFinite(sample.tMs)
      ? sample.tMs - (samples[0]?.tMs ?? 0)
      : Math.max(0, Date.parse(sample.capturedAt) - startMs),
  }));

  return {
    schemaVersion: "2.0",
    recordingType: "openguessr-round",
    recorder: session.recorder ?? {
      name: "Imported OpenGuessr session",
      version: "unknown",
    },
    id: `${session.id ?? "imported-session"}-${round.id ?? `round-${round.index + 1}`}`,
    sessionId: session.id ?? null,
    sourceApplication: session.sourceApplication ?? "OpenGuessr",
    pageUrl: session.pageUrl ?? null,
    competitionId,
    model,
    condition,
    startedAt,
    stoppedAt,
    durationMs: Math.max(0, Date.parse(stoppedAt) - Date.parse(startedAt)),
    stopReason: "legacy-session-import",
    prediction: round.prediction ?? null,
    config: session.config ?? {},
    round: {
      ...round,
      index: 0,
      sourceRoundIndex: round.index,
      sampleCount: normalizedSamples.length,
      spawnRequested: round.spawnRequested ?? session.spawnRequested ?? null,
      actualStart: round.actualStart ?? normalizedSamples[0] ?? null,
    },
    captureSources: summarizeSources(normalizedSamples),
    sampleCount: normalizedSamples.length,
    keyMoments: session.keyMoments ?? [],
    diagnostics: session.diagnostics ?? {},
    samples: normalizedSamples,
  };
}

function summarizeSources(samples) {
  const counts = {};
  for (const sample of samples) {
    const key = sample.source ?? "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
