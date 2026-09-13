import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseGoogleMapsStreetViewUrl } from "../shared/google-maps-url.js";
import { validateCases } from "../src/data-contract.js";
import { RECORDED_BENCHMARKS } from "../src/project-story.js";
import { clueDocumentsByLocation, loadClueDocuments } from "./lib/clues.mjs";
import { isPredictionInCountry } from "./lib/country-accuracy.mjs";
import { matchRecordingToLocation } from "./lib/recordings.mjs";
import {
  COMPETITIONS_DIR,
  DATA_DIR,
  GENERATED_COMPETITIONS_DIR,
  GENERATED_DIR,
  RECORDED_AGENT_BENCHMARK_DIR,
  RECORDINGS_INBOX_DIR,
  RESULTS_DIR,
  STARTING_IMAGES_DIR,
  ROOT,
  ensureWorkspaceDirectories,
  listJsonFiles,
  readJson,
  resetGeneratedDirectory,
  writeJsonAtomic,
  writeTextAtomic,
} from "./lib/workspace.mjs";

export const OPEN_GUESSR_COMPETITION_MAX_LOCATIONS = 20;

export async function buildData({
  write = true,
  quiet = false,
  now = new Date(),
} = {}) {
  await ensureWorkspaceDirectories();

  const warnings = [];
  const errors = [];
  const predictionLocationLabels = await loadPredictionLocationLabels();

  const { competitions, embeddedLocations } = await loadCompetitions({
    errors,
    warnings,
  });

  const locations = mergeLocations(
    embeddedLocations,
    competitions,
    errors,
  );

  const resultFiles = await loadResults(locations, errors);
  const clueDocuments = await loadClueDocuments({ errors });
  const benchmarkPredictionResults = await loadRecordedBenchmarkPredictions(
    locations,
    predictionLocationLabels,
    errors,
  );
  const coveredStaticResults = await loadCoveredStaticPredictions(
    locations,
    errors,
  );
  const results = [...resultFiles, ...benchmarkPredictionResults, ...coveredStaticResults];
  const rawRecordings = await loadRecordings(warnings);

  const recordings = resolveRecordingLocations(
    rawRecordings,
    locations,
    competitions,
    warnings,
  );

  const recordingIndex = indexRecordings(recordings);

  const atlasCases = compileAtlasCases({
    locations,
    results,
    recordingIndex,
    predictionLocationLabels,
    clueDocumentsByLocation: clueDocumentsByLocation(clueDocuments),
    warnings,
  });

  const atlasErrors = validateCases(atlasCases);

  errors.push(
    ...atlasErrors.map(
      (message) => `Generated atlas data: ${message}`,
    ),
  );

  if (errors.length) {
    const error = new Error(
      `Data build failed:\n- ${errors.join("\n- ")}`,
    );

    error.validationErrors = errors;
    throw error;
  }

  const generatedAt = now.toISOString();

  const competitionOutputs = buildCompetitionOutputs(
    competitions,
    locations,
  );

  const competitionArchives = buildCompetitionArchives(
    competitions,
    locations,
  );

  const report = {
    schemaVersion: "1.0",
    generatedAt,

    limits: {
      openGuessrCompetitionLocations:
        OPEN_GUESSR_COMPETITION_MAX_LOCATIONS,
    },

    counts: {
      locations: locations.length,
      competitions: competitions.length,
      competitionParts: competitionOutputs.length,
      resultFiles: resultFiles.length,
      clueDocuments: clueDocuments.length,
      clueSets: clueDocuments.reduce((sum, document) => sum + document.clueSets.length, 0),
      clues: clueDocuments.reduce((sum, document) => sum + document.clueSets.reduce((setSum, clueSet) => setSum + clueSet.cues.length, 0), 0),
      benchmarkPredictionRuns: benchmarkPredictionResults.length,
      coveredStaticPredictionRuns: coveredStaticResults.length,

      recordings: recordings.length,

      matchedRecordings: recordings.filter(
        (item) => item.atlasLocationId,
      ).length,

      unmatchedRecordings: recordings.filter(
        (item) => !item.atlasLocationId,
      ).length,

      recordingsWithPrediction: recordings.filter(
        (item) => isCoordinate(item.prediction),
      ).length,

      recordingsWithoutPrediction: recordings.filter(
        (item) => !isCoordinate(item.prediction),
      ).length,

      atlasCases: atlasCases.length,

      atlasRuns: atlasCases.reduce(
        (sum, item) => sum + item.runs.length,
        0,
      ),

      recordingOnlyRuns: atlasCases.reduce(
        (sum, item) =>
          sum +
          item.runs.filter(
            (run) => !isCoordinate(run.prediction),
          ).length,
        0,
      ),
    },

    warnings,
  };

  if (write) {
    await resetGeneratedDirectory();

    await Promise.all([
      writeJsonAtomic(
        join(GENERATED_DIR, "locations.resolved.json"),
        {
          schemaVersion: "1.0",
          generatedAt,
          locations,
        },
      ),

      writeJsonAtomic(
        join(GENERATED_DIR, "competitions.resolved.json"),
        {
          schemaVersion: "1.0",
          generatedAt,
          competitions,
        },
      ),

      writeJsonAtomic(
        join(GENERATED_DIR, "recordings.index.json"),
        {
          schemaVersion: "1.0",
          generatedAt,
          recordings: recordings.map(summarizeRecording),
        },
      ),

      writeJsonAtomic(
        join(GENERATED_DIR, "atlas-cases.json"),
        atlasCases,
      ),

      writeJsonAtomic(
        join(GENERATED_DIR, "build-report.json"),
        report,
      ),
    ]);

    for (const output of competitionOutputs) {
      await writeTextAtomic(
        join(GENERATED_COMPETITIONS_DIR, output.filename),
        `${output.urls.join("\n")}\n`,
      );
    }

    for (const archive of competitionArchives) {
      await writeTextAtomic(
        join(GENERATED_COMPETITIONS_DIR, archive.filename),
        `${archive.urls.join("\n")}\n`,
      );
    }

    await writeJsonAtomic(
      join(GENERATED_COMPETITIONS_DIR, "index.json"),
      {
        schemaVersion: "1.0",
        generatedAt,

        maxLocationsPerCompetition:
          OPEN_GUESSR_COMPETITION_MAX_LOCATIONS,

        competitions: competitions.map((competition) => ({
          id: competition.id,
          name: competition.name,
          shortName: competition.shortName,
          datasetId: competition.datasetId,
          order: competition.order,
          description: competition.description,
          count: competition.locationIds.length,
          partCount: competition.parts.length,
          sourceFile: competition.sourceFile,

          parts: competition.parts.map((part) => ({
            id: part.id,
            part: part.part,
            partCount: part.partCount,
            count: part.locationIds.length,
            filename: `${part.id}.txt`,
            locationIds: part.locationIds,
            localLocationIds: part.localLocationIds,
          })),

          archiveFilename:
            competition.parts.length > 1
              ? `${competition.id}-all.txt`
              : null,
        })),

        files: competitionOutputs.map(
          ({ urls, ...output }) => ({
            ...output,
            count: urls.length,
          }),
        ),
      },
    );
  }

  if (!quiet) {
    console.log(
      `Built ${locations.length} location(s), ` +
      `${competitions.length} competition definition(s), ` +
      `${competitionOutputs.length} OpenGuessr TXT part(s), ` +
      `and ${atlasCases.length} atlas case(s).`,
    );

    for (const warning of warnings) {
      console.warn(`Warning: ${warning}`);
    }
  }

  return {
    locations,
    competitions,
    results,
    recordings,
    atlasCases,
    competitionOutputs,
    competitionArchives,
    report,
  };
}

async function loadPredictionLocationLabels() {
  const sourceNames = [
    "prediction-locations.json",
    "benchmark-prediction-locations.json",
  ];
  const labels = new Map();

  for (const sourceName of sourceNames) {
    const input = await readJson(join(DATA_DIR, sourceName));
    const entries = Object.entries(input?.labelsByRecordingId ?? {});

    if (input?.schemaVersion !== "1.0" || entries.length === 0) {
      throw new Error(`data/${sourceName} must provide schemaVersion 1.0 and prediction labels.`);
    }

    for (const [recordingId, label] of entries) {
      if (!nonEmptyString(recordingId) || !nonEmptyString(label)) {
        throw new Error(`data/${sourceName} contains an invalid recording id or place label.`);
      }
      labels.set(recordingId, label.trim());
    }
  }

  return labels;
}

async function loadCompetitions({
  errors,
  warnings,
}) {
  const files = await listJsonFiles(COMPETITIONS_DIR);

  const seenCompetitionIds = new Set();
  const competitions = [];
  const embeddedLocations = [];

  for (const path of files) {
    const input = await readJson(path);
    const source = relative(ROOT, path).replaceAll("\\", "/");

    const fallbackId = slugify(
      basename(path, extname(path)),
    );

    const id = nonEmptyString(input?.id)
      ? input.id.trim()
      : fallbackId;

    const name = nonEmptyString(input?.name)
      ? input.name.trim()
      : humanize(id);

    const shortName =
      firstString(
        input?.shortName,
        input?.short_name,
        name,
      ) ?? name;

    const datasetId =
      firstString(
        input?.datasetId,
        input?.dataset_id,
        id,
      ) ?? id;

    const order = Number.isInteger(Number(input?.order))
      ? Number(input.order)
      : Number.MAX_SAFE_INTEGER;

    if (!id) {
      errors.push(
        `${source}: competition id could not be derived.`,
      );
      continue;
    }

    if (seenCompetitionIds.has(id)) {
      errors.push(
        `${source}: duplicate competition id "${id}".`,
      );
      continue;
    }

    seenCompetitionIds.add(id);

    /*
     * Current project format:
     *
     * Each competition JSON contains its locations directly.
     *
     * Example:
     *
     * {
     *   "id": "europe-easy",
     *   "locations": [...]
     * }
     *
     * The old locationIds -> data/locations/*.json mechanism
     * is intentionally no longer supported.
     */
    if (
      !Array.isArray(input?.locations) ||
      input.locations.length === 0
    ) {
      errors.push(
        `${source}: locations must contain at least one embedded location.`,
      );
      continue;
    }

    const locationIds = [];
    const localLocationIds = [];
    const seenLocalIds = new Set();

    input.locations.forEach(
      (locationInput, index) => {
        const prefix =
          `${source}: locations[${index}]`;

        const localId = requiredString(
          locationInput?.id,
          `${prefix}.id`,
          errors,
        );

        if (!localId) return;

        if (seenLocalIds.has(localId)) {
          errors.push(
            `${prefix}: duplicate local location id "${localId}".`,
          );
          return;
        }

        seenLocalIds.add(localId);

        const atlasId =
          `${slugify(id)}--${slugify(localId)}`;

        const normalized = normalizeLocation(
          locationInput,
          {
            source,
            sourceIndex: index,
            localId,
            atlasId,
            competitionId: id,
            errors,
          },
        );

        if (!normalized) return;

        embeddedLocations.push(normalized);
        locationIds.push(atlasId);
        localLocationIds.push(localId);
      },
    );

    const splitIfNeeded =
      input?.splitIfNeeded !== false;

    if (
      locationIds.length >
      OPEN_GUESSR_COMPETITION_MAX_LOCATIONS &&
      !splitIfNeeded
    ) {
      errors.push(
        `${source}: OpenGuessr currently accepts at most ` +
        `${OPEN_GUESSR_COMPETITION_MAX_LOCATIONS} links; ` +
        `remove splitIfNeeded:false or split the source file.`,
      );
    }

    if (
      locationIds.length >
      OPEN_GUESSR_COMPETITION_MAX_LOCATIONS
    ) {
      warnings.push(
        `${id} contains ${locationIds.length} locations and ` +
        `is exported as ${Math.ceil(
          locationIds.length /
          OPEN_GUESSR_COMPETITION_MAX_LOCATIONS,
        )} OpenGuessr competition parts.`,
      );
    }

    const partCount = Math.max(
      1,
      Math.ceil(
        locationIds.length /
        OPEN_GUESSR_COMPETITION_MAX_LOCATIONS,
      ),
    );

    const parts = chunk(
      locationIds,
      OPEN_GUESSR_COMPETITION_MAX_LOCATIONS,
    ).map(
      (partLocationIds, index) => {
        const offset =
          index *
          OPEN_GUESSR_COMPETITION_MAX_LOCATIONS;

        const part = index + 1;

        const partId =
          partCount > 1
            ? `${id}-part-${String(part).padStart(
              2,
              "0",
            )}`
            : id;

        return {
          id: partId,
          part,
          partCount,
          locationIds: partLocationIds,

          localLocationIds:
            localLocationIds.slice(
              offset,
              offset + partLocationIds.length,
            ),
        };
      },
    );

    competitions.push({
      schemaVersion:
        input?.schemaVersion ?? "1.0",

      id,
      name,
      shortName,
      datasetId,
      order,

      description:
        input?.description ?? "",

      locationIds,
      localLocationIds,

      splitIfNeeded,
      parts,

      openGuessr: {
        roundLengthSeconds:
          input?.openGuessr?.roundLengthSeconds ??
          null,

        duration:
          input?.openGuessr?.duration ?? null,

        visibility:
          input?.openGuessr?.visibility ?? null,

        restriction:
          input?.openGuessr?.restriction ?? null,
      },

      sourceFile: source,
      sourceFormat: "embedded-locations",
    });
  }

  competitions.sort(
    (a, b) =>
      a.order - b.order ||
      a.name.localeCompare(b.name),
  );

  return {
    competitions,
    embeddedLocations,
  };
}

function normalizeLocation(
  input,
  {
    source,
    sourceIndex = null,
    localId,
    atlasId,
    competitionId,
    errors,
  },
) {
  const prefix =
    sourceIndex === null
      ? source
      : `${source}: locations[${sourceIndex}]`;

  const country =
    firstString(input?.country);

  const city =
    firstString(
      input?.city_or_region,
      input?.city,
      input?.region,
    );

  const sceneType =
    firstString(
      input?.scene_type,
      input?.sceneType,
    );

  const difficulty =
    firstString(
      input?.difficulty,
    )?.toLowerCase();

  const primaryClueType =
    firstString(
      input?.primary_clue_type,
      input?.primaryClueType,
    );

  const selectionNotes =
    firstString(
      input?.selection_notes,
      input?.selectionNotes,
      input?.summary,
    );

  const googleMapsUrl =
    firstString(
      input?.google_maps_link,
      input?.googleMapsUrl,
    );

  if (!country) {
    errors.push(
      `${prefix}: country must be a non-empty string.`,
    );
  }

  if (!city) {
    errors.push(
      `${prefix}: city_or_region must be a non-empty string.`,
    );
  }

  if (!sceneType) {
    errors.push(
      `${prefix}: scene_type must be a non-empty string.`,
    );
  }

  if (!googleMapsUrl) {
    errors.push(
      `${prefix}: google_maps_link must be a non-empty string.`,
    );
  }

  if (
    !["easy", "medium", "hard"].includes(
      difficulty,
    )
  ) {
    errors.push(
      `${prefix}: difficulty must be easy, medium, or hard.`,
    );
  }

  if (
    !country ||
    !city ||
    !sceneType ||
    !googleMapsUrl ||
    !["easy", "medium", "hard"].includes(
      difficulty,
    )
  ) {
    return null;
  }

  if (
    input?.groundTruth ||
    input?.startingView?.viewpoint
  ) {
    errors.push(
      `${prefix}: do not enter groundTruth or ` +
      `startingView.viewpoint manually; coordinates ` +
      `are derived from google_maps_link.`,
    );
  }

  let parsed;

  try {
    parsed =
      parseGoogleMapsStreetViewUrl(
        googleMapsUrl,
      );
  } catch (error) {
    errors.push(
      `${prefix}: ${error.message}`,
    );
    return null;
  }

  const title =
    firstString(
      input?.title,
      input?.landmark,
      city,
    ) ?? localId;

  const summary =
    selectionNotes ||
    `${sceneType} evaluation scene in ${city}, ${country}.`;

  const tags = unique(
    [
      ...(Array.isArray(input?.tags)
        ? input.tags.map(String)
        : []),

      primaryClueType,
      sceneType,
      localId,
    ].filter(Boolean),
  );

  return {
    schemaVersion:
      input?.schemaVersion ?? "1.0",

    id: atlasId,
    localId,

    title,

    landmark:
      firstString(
        input?.landmark,
        title,
      ),

    city,

    region:
      firstString(
        input?.region,
        city,
      ),

    country,

    countryCode:
      firstString(
        input?.countryCode,
        input?.country_code,
      ) ?? "",

    difficulty,
    sceneType,

    primaryClueType:
      primaryClueType ?? "",

    selectionNotes:
      selectionNotes ?? "",

    summary,
    tags,

    ...(input?.visual
      ? { visual: input.visual }
      : {}),

    googleMapsUrl:
      parsed.sourceUrl,

    canonicalGoogleMapsUrl:
      parsed.canonicalUrl,

    coordinateSource:
      parsed.coordinateSource,

    groundTruth: {
      ...parsed.viewpoint,

      label:
        firstString(
          input?.groundTruthLabel,
          `${city}, ${country}`,
        ),
    },

    startingView: {
      viewpoint:
        parsed.viewpoint,

      ...(Number.isFinite(parsed.heading)
        ? { heading: parsed.heading }
        : {}),

      ...(Number.isFinite(parsed.pitch)
        ? { pitch: parsed.pitch }
        : {}),

      ...(Number.isFinite(parsed.fov)
        ? { fov: parsed.fov }
        : {}),

      ...(parsed.panoId
        ? { panoId: parsed.panoId }
        : {}),

      label:
        firstString(
          input?.startingViewLabel,
          `Starting panorama: ${city}`,
        ),

      originalUrl:
        parsed.sourceUrl,
    },

    sourceFile: source,
    sourceIndex,
    sourceCompetitionId:
      competitionId,

    competitions: [],
  };
}

function mergeLocations(
  embeddedLocations,
  competitions,
  errors,
) {
  const byId = new Map();

  for (const location of embeddedLocations) {
    if (byId.has(location.id)) {
      errors.push(
        `Duplicate internal location id "${location.id}".`,
      );
    } else {
      byId.set(
        location.id,
        location,
      );
    }
  }

  for (const competition of competitions) {
    competition.parts.forEach((part) => {
      part.locationIds.forEach(
        (locationId, roundIndex) => {
          const location =
            byId.get(locationId);

          if (!location) return;

          const overallIndex =
            (part.part - 1) *
            OPEN_GUESSR_COMPETITION_MAX_LOCATIONS +
            roundIndex +
            1;

          location.competitions.push({
            competitionId:
              competition.id,

            competitionName:
              competition.name,

            competitionShortName:
              competition.shortName,

            competitionDatasetId:
              competition.datasetId,

            competitionOrder:
              competition.order,

            competitionDescription:
              competition.description,

            partId:
              part.id,

            part:
              part.part,

            partCount:
              part.partCount,

            round:
              roundIndex + 1,

            overallIndex,
          });
        },
      );
    });
  }

  return [...byId.values()];
}

async function loadResults(
  locations,
  errors,
) {
  const files =
    await listJsonFiles(
      RESULTS_DIR,
      { recursive: true },
    );

  const results = [];

  for (const path of files) {
    const input =
      await readJson(path);

    const source =
      relative(ROOT, path)
        .replaceAll("\\", "/");

    if (
      !nonEmptyString(input?.locationId) &&
      !nonEmptyString(input?.atlasLocationId)
    ) {
      errors.push(
        `${source}: locationId or atlasLocationId must be a non-empty string.`,
      );
      continue;
    }

    if (!Array.isArray(input?.runs)) {
      errors.push(
        `${source}: runs must be an array.`,
      );
      continue;
    }

    const location =
      resolveLocationReference(
        input,
        locations,
      );

    if (!location) {
      errors.push(
        `${source}: could not resolve location ` +
        `"${input.locationId ?? input.atlasLocationId}"` +
        `${input.competitionId
          ? ` in competition "${input.competitionId}"`
          : ""
        }.`,
      );

      continue;
    }

    results.push({
      ...input,
      atlasLocationId:
        location.id,

      locationId:
        location.localId,

      sourceFile:
        source,
    });
  }

  return results;
}

async function loadRecordedBenchmarkPredictions(
  locations,
  predictionLocationLabels,
  errors,
) {
  const locationsById = new Map(locations.map((location) => [location.id, location]));
  const results = [];

  for (const benchmark of RECORDED_BENCHMARKS) {
    const benchmarkDirectory = join(
      RECORDED_AGENT_BENCHMARK_DIR,
      benchmark.dataDirectory ?? benchmark.id,
    );
    if (!benchmark.predictionSource) {
      for (const location of locations) {
        results.push(buildUnavailableBenchmarkPrediction(benchmark, location));
      }
      continue;
    }
    const predictions = benchmark.predictionSource.type === "glm-conversation"
      ? await loadGlmConversationPredictions(
        join(benchmarkDirectory, benchmark.predictionSource.path),
        errors,
        benchmark.bestRun?.id,
      )
      : benchmark.predictionSource.type === "curated-json"
        ? await loadCuratedBenchmarkPredictions(join(benchmarkDirectory, benchmark.predictionSource.path), errors)
        : await loadRecordedDirectoryPredictions(join(benchmarkDirectory, benchmark.predictionSource.path ?? "."), errors);
    const statisticsPredictions = await loadBenchmarkStatisticsPredictions(
      benchmark,
      benchmarkDirectory,
      errors,
    );
    const statisticsByLocation = groupStatisticsPredictionsByLocation(statisticsPredictions);

    if (predictions.length !== 25) {
      errors.push(`${benchmark.id}: best run ${benchmark.bestRun?.label ?? "selection"} must resolve to exactly 25 predictions; found ${predictions.length}.`);
      continue;
    }

    for (const { input, source } of predictions) {
      const location = locationsById.get(input.atlasLocationId);

      if (!location) {
        errors.push(`${source}: atlasLocationId must reference a benchmark location.`);
        continue;
      }

      if (!isCoordinate(input.prediction)) {
        errors.push(`${source}: benchmark prediction must contain valid coordinates.`);
        continue;
      }

      const prediction = {
        lat: Number(input.prediction.lat),
        lng: Number(input.prediction.lng),
      };

      results.push({
        schemaVersion: "1.0",
        atlasLocationId: location.id,
        locationId: location.localId,
        sourceFile: source,
        runs: [
          {
            id: `benchmark-${benchmark.id}-${input.id}`,
            model: `${benchmark.model} · ${benchmark.reasoning}`,
            condition: input.condition,
            prediction: {
              ...prediction,
              label: input.prediction.label ?? resolvePredictionLocationLabel(null, { id: input.id, prediction }, predictionLocationLabels),
            },
            runKind: "model-prediction",
            benchmarkId: benchmark.id,
            bestRunId: benchmark.bestRun?.id ?? null,
            bestRunLabel: benchmark.bestRun?.label ?? "Best run",
            bestRunPoints: benchmark.bestRun?.points ?? null,
            benchmarkMeanPoints: benchmark.points,
            sourcePredictionId: input.id,
            hypothesis: "",
            cues: [],
            notes: benchmark.predictionNotes ?? "Canonical submitted benchmark pin; replay media is not required for this prediction.",
            isMock: false,
            accuracy: { country: null, region: null },
            statisticsRuns: statisticsByLocation.get(location.id) ?? [],
            durationSeconds: Number.isFinite(input.durationMs)
              ? input.durationMs / 1000
              : null,
          },
        ],
      });
    }
  }

  return results;
}

async function loadCoveredStaticPredictions(locations, errors) {
  const path = join(DATA_DIR, "covered-static-benchmark", "results.json");
  if (!existsSync(path)) return [];

  const sourceFile = relative(ROOT, path).replaceAll("\\", "/");
  const input = await readJson(path);
  const locationsById = new Map(locations.map((location) => [location.id, location]));
  const results = [];

  if (!Array.isArray(input?.models)) {
    errors.push(`${sourceFile}: models must be an array.`);
    return results;
  }

  for (const model of input.models) {
    if (!nonEmptyString(model?.benchmarkId) || !nonEmptyString(model?.model)) {
      errors.push(`${sourceFile}: each covered-static model needs benchmarkId and model.`);
      continue;
    }
    for (const prediction of model.predictions ?? []) {
      const location = locationsById.get(prediction.locationId);
      if (!location) {
        errors.push(`${sourceFile}: ${model.benchmarkId} references unknown location ${prediction.locationId}.`);
        continue;
      }
      if (!isCoordinate(prediction.prediction)) {
        errors.push(`${sourceFile}: ${model.benchmarkId}/${prediction.locationId} has no valid prediction.`);
        continue;
      }
      if (!nonEmptyString(prediction.inputImage?.path) || !existsSync(resolve(ROOT, prediction.inputImage.path))) {
        errors.push(`${sourceFile}: ${model.benchmarkId}/${prediction.locationId} has no valid covered input image.`);
        continue;
      }

      results.push({
        schemaVersion: "1.0",
        atlasLocationId: location.id,
        locationId: location.localId,
        sourceFile,
        runs: [{
          id: `covered-${model.benchmarkId}-${location.localId}`,
          model: model.model,
          condition: "static-image-covered",
          inputImage: prediction.inputImage,
          prediction: prediction.prediction,
          confidence: Number.isFinite(prediction.confidence) ? prediction.confidence : null,
          runKind: "model-prediction",
          benchmarkId: model.benchmarkId,
          bestRunId: "covered-static-r1",
          bestRunLabel: "Covered static-image run",
          bestRunPoints: null,
          benchmarkMeanPoints: null,
          sourcePredictionId: prediction.id ?? null,
          hypothesis: "",
          cues: [],
          notes: "Single controlled static-image run with selected map/interface evidence covered.",
          isMock: false,
          accuracy: { country: null, region: null },
          durationSeconds: null,
        }],
      });
    }
  }

  return results;
}

function buildUnavailableBenchmarkPrediction(benchmark, location) {
  return {
    schemaVersion: "1.0",
    atlasLocationId: location.id,
    locationId: location.localId,
    sourceFile: `data/recorded-agent-benchmark/${benchmark.dataDirectory ?? benchmark.id}/summary.json`,
    runs: [{
      id: `benchmark-${benchmark.id}-${location.id}`,
      model: `${benchmark.model} · ${benchmark.reasoning}`,
      condition: "interactive-panorama",
      prediction: null,
      runKind: "model-prediction",
      benchmarkId: benchmark.id,
      bestRunId: benchmark.bestRun?.id ?? null,
      bestRunLabel: benchmark.bestRun?.label ?? "Best reported run",
      bestRunPoints: benchmark.bestRun?.points ?? null,
      benchmarkMeanPoints: benchmark.points,
      sourcePredictionId: null,
      hypothesis: "",
      cues: [],
      notes: "This model is included in the explorer and its reviewed clue set is available, but its submitted pin coordinates were not independently validated. No prediction marker or error line is shown.",
      isMock: false,
      accuracy: { country: null, region: null },
      durationSeconds: null,
    }],
  };
}

async function loadCuratedBenchmarkPredictions(path, errors) {
  if (!existsSync(path)) {
    errors.push(`${relative(ROOT, path)}: curated benchmark predictions are missing.`);
    return [];
  }
  const input = await readJson(path);
  const predictions = Array.isArray(input) ? input : input.predictions;
  if (!Array.isArray(predictions)) {
    errors.push(`${relative(ROOT, path)}: predictions must be an array.`);
    return [];
  }
  const source = relative(ROOT, path).replaceAll("\\", "/");
  return predictions.map((item) => ({ input: item, source }));
}

async function loadBenchmarkStatisticsPredictions(benchmark, benchmarkDirectory, errors) {
  const source = benchmark.statisticsSource;
  if (!source) return [];

  if (source.type === "curated-json") {
    const predictions = await loadCuratedBenchmarkPredictions(
      join(benchmarkDirectory, source.path),
      errors,
    );
    return predictions.map((item) => ({
      ...item,
      runId: item.input.runId ?? "recorded-run",
    }));
  }

  if (source.type === "recorded-runs") {
    const runsDirectory = join(benchmarkDirectory, source.path ?? "runs");
    const runDirectories = existsSync(runsDirectory)
      ? readdirSync(runsDirectory, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && /^run-\d+$/i.test(entry.name))
        .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }))
      : [];
    const predictions = [];
    for (const runDirectory of runDirectories) {
      const items = await loadRecordedDirectoryPredictions(
        join(runsDirectory, runDirectory.name),
        errors,
      );
      predictions.push(...items.map((item) => ({ ...item, runId: runDirectory.name })));
    }
    const supplementalPath = join(benchmarkDirectory, "statistics", "supplemental.json");
    if (existsSync(supplementalPath)) {
      const supplements = await loadCuratedBenchmarkPredictions(supplementalPath, errors);
      predictions.push(...supplements.map((item) => ({
        ...item,
        runId: item.input.runId ?? "supplemental",
      })));
    }
    return predictions;
  }

  if (source.type === "glm-conversations") {
    const runsDirectory = join(benchmarkDirectory, source.path ?? "runs");
    const runDirectories = existsSync(runsDirectory)
      ? readdirSync(runsDirectory, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && /^run-\d+$/i.test(entry.name))
        .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }))
      : [];
    const predictions = [];
    for (const runDirectory of runDirectories) {
      const items = await loadGlmConversationPredictions(
        join(runsDirectory, runDirectory.name, "conversation.json"),
        errors,
        runDirectory.name,
      );
      predictions.push(...items.map((item) => ({ ...item, runId: runDirectory.name })));
    }
    return predictions;
  }

  if (source.type === "grok-mcp-runs") {
    return loadGrokMcpStatisticsPredictions(benchmarkDirectory, errors);
  }

  errors.push(`${benchmark.id}: unsupported statistics source type ${source.type}.`);
  return [];
}

function groupStatisticsPredictionsByLocation(predictions) {
  const byLocation = new Map();
  for (const { input, source, runId } of predictions) {
    if (!nonEmptyString(input?.atlasLocationId) || !isCoordinate(input?.prediction)) continue;
    if (!byLocation.has(input.atlasLocationId)) byLocation.set(input.atlasLocationId, []);
    byLocation.get(input.atlasLocationId).push({
      id: input.id ?? `${runId}-${input.atlasLocationId}`,
      runId,
      prediction: {
        lat: Number(input.prediction.lat),
        lng: Number(input.prediction.lng),
      },
      durationSeconds: Number.isFinite(input.durationMs) ? input.durationMs / 1000 : null,
      accuracy: { country: null, region: null },
      sourceFile: source,
    });
  }
  return byLocation;
}

async function loadGrokMcpStatisticsPredictions(benchmarkDirectory, errors) {
  const predictions = [];
  const easyRuns = ["mcp-assisted-r1", "mcp-assisted-r2", "mcp-assisted-r3"];
  for (const runId of easyRuns) {
    const path = join(benchmarkDirectory, "runs", runId, "README.md");
    try {
      const text = await readFile(path, "utf8");
      for (const line of text.split(/\r?\n/)) {
        const match = line.match(/^\|\s*(\d+)\s*\|.*?`\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\s*`/);
        if (!match) continue;
        const round = Number(match[1]);
        predictions.push(statisticsPrediction(
          runId,
          "easy",
          round,
          Number(match[2]),
          Number(match[3]),
          relative(ROOT, path).replaceAll("\\", "/"),
        ));
      }
    } catch (error) {
      errors.push(`${relative(ROOT, path)}: could not load Grok MCP statistics (${error.message}).`);
    }
  }

  const auditedRuns = [
    { runId: "mcp-one-shot-medium-r1", tier: "medium", defaults: [1] },
    { runId: "mcp-one-shot-medium-r2", tier: "medium", defaults: [1] },
    { runId: "mcp-one-shot-medium-r3-retry2", tier: "medium", defaults: [1, 2] },
    { runId: "mcp-one-shot-hard-r1", tier: "hard", defaults: [] },
    { runId: "mcp-one-shot-hard-r2", tier: "hard", defaults: [1] },
    { runId: "mcp-one-shot-hard-r3", tier: "hard", defaults: [1], roundOffset: 1 },
  ];
  for (const config of auditedRuns) {
    const path = join(benchmarkDirectory, "runs", config.runId, "mcp-audit.jsonl");
    const source = relative(ROOT, path).replaceAll("\\", "/");
    for (const round of config.defaults) {
      predictions.push(statisticsPrediction(config.runId, config.tier, round, 0, 0, source));
    }
    try {
      const rows = (await readFile(path, "utf8"))
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      for (const row of rows) {
        const pin = row.tool === "openguessr_submit_guess" && row.result?.submitted
          ? row.result.pin
          : null;
        if (!Number.isFinite(pin?.latitude) || !Number.isFinite(pin?.longitude)) continue;
        predictions.push(statisticsPrediction(
          config.runId,
          config.tier,
          Number(row.round) + (config.roundOffset ?? 0),
          Number(pin.latitude),
          Number(pin.longitude),
          source,
        ));
      }
    } catch (error) {
      errors.push(`${source}: could not load Grok MCP statistics (${error.message}).`);
    }
  }
  return predictions;
}

function statisticsPrediction(runId, tier, round, lat, lng, source) {
  const offsets = { easy: 0, medium: 8, hard: 17 };
  const globalIndex = offsets[tier] + round;
  return {
    input: {
      id: `${runId}-${tier}-${String(round).padStart(2, "0")}`,
      atlasLocationId: `europe-${tier}--loc-${String(globalIndex).padStart(3, "0")}`,
      condition: "interactive-panorama",
      prediction: { lat, lng },
    },
    source,
    runId,
  };
}

async function loadRecordedDirectoryPredictions(directory, errors) {
  const localRoundFiles = (await listJsonFiles(directory, { recursive: true }))
    .filter((path) => {
      const parts = relative(directory, path).split(/[\\/]/);
      return parts.length === 3 && /^europe-(?:easy|medium|hard)$/i.test(parts[0]) &&
        parts[1] === "rounds" && /^round-\d+\.json$/i.test(parts[2]);
    })
    .sort((left, right) => left.localeCompare(right));

  const byLocation = new Map();
  for (const path of localRoundFiles) {
    const input = withBenchmarkAtlasLocation(await readJson(path), relative(directory, path));
    if (!isCoordinate(input.prediction) || !nonEmptyString(input.atlasLocationId)) continue;
    byLocation.set(input.atlasLocationId, {
      input,
      source: relative(ROOT, path).replaceAll("\\", "/"),
    });
  }
  if (byLocation.size === 25) return [...byLocation.values()];

  const sessionFiles = (await listJsonFiles(directory, { recursive: true }))
    .filter((path) => {
      const parts = relative(directory, path).split(/[\\/]/);
      return parts.length === 2 && /^europe-(?:easy|medium|hard)$/i.test(parts[0]) && parts[1] === "session.json";
    })
    .sort((left, right) => left.localeCompare(right));
  for (const sessionPath of sessionFiles) {
    const session = await readJson(sessionPath);
    for (const round of session.rounds ?? []) {
      const candidatePaths = [
        nonEmptyString(round.path) ? resolve(ROOT, round.path) : null,
        join(sessionPath, "..", "rounds", `round-${String(round.competitionRound ?? round.roundIndex + 1).padStart(2, "0")}.json`),
      ].filter(Boolean);
      const path = candidatePaths.find((candidate) => existsSync(candidate));
      if (!path) continue;
      const input = await readJson(path);
      if (!isCoordinate(input.prediction) || !nonEmptyString(input.atlasLocationId)) continue;
      byLocation.set(input.atlasLocationId, { input, source: relative(ROOT, path).replaceAll("\\", "/") });
    }
  }
  if (byLocation.size === 0 && localRoundFiles.length > 0) {
    errors.push(`${relative(ROOT, directory)} contains ${localRoundFiles.length} canonical round files, expected 25.`);
  }
  return [...byLocation.values()].sort((left, right) => left.input.atlasLocationId.localeCompare(right.input.atlasLocationId));
}

function withBenchmarkAtlasLocation(input, relativePath) {
  if (nonEmptyString(input?.atlasLocationId)) return input;
  const match = relativePath.match(/^(europe-(easy|medium|hard))[\\/]rounds[\\/]round-(\d+)\.json$/i);
  if (!match) return input;
  const offsets = { easy: 0, medium: 8, hard: 17 };
  const globalIndex = offsets[match[2].toLowerCase()] + Number.parseInt(match[3], 10);
  return { ...input, atlasLocationId: `${match[1].toLowerCase()}--loc-${String(globalIndex).padStart(3, "0")}` };
}

async function loadGlmConversationPredictions(sourcePath, errors, runId = "run-2") {
  const absolutePath = resolve(ROOT, sourcePath);
  if (!existsSync(absolutePath)) {
    errors.push(`${sourcePath}: GLM best-run conversation is missing.`);
    return [];
  }
  const conversation = await readJson(absolutePath);
  const toolEvents = [];
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (typeof value.title === "string" && Number.isFinite(value.time?.start)) {
      toolEvents.push(value);
    }
    for (const child of Object.values(value)) visit(child);
  };
  visit(conversation);
  toolEvents.sort((left, right) => left.time.start - right.time.start);

  // The immutable Run 2 export includes the start/finish timestamps for every
  // browser and OpenGuessr tool. A confirmed competition entry or successful
  // Continue starts the next round; the successful submit finishes it.
  let roundStartedAt = null;
  const rounds = [];
  for (const event of toolEvents) {
    if (
      event.title.endsWith("browser_mouse_click_xy") &&
      event.input?.x === 988 &&
      event.input?.y === 466
    ) {
      roundStartedAt = event.time.end ?? event.time.start;
      continue;
    }

    if (event.title.endsWith("openguessr_continue") && nonEmptyString(event.output)) {
      try {
        if (JSON.parse(event.output)?.continued) {
          roundStartedAt = event.time.end ?? event.time.start;
        }
      } catch { /* Ignore non-JSON presentation fragments. */ }
      continue;
    }

    if (!event.title.endsWith("openguessr_submit_guess") || !nonEmptyString(event.output)) continue;
    try {
      const result = JSON.parse(event.output);
      const pin = result?.pin;
      if (!result?.submitted || !Number.isFinite(pin?.latitude) || !Number.isFinite(pin?.longitude)) continue;
      const previous = rounds.at(-1)?.prediction;
      if (previous?.lat === pin.latitude && previous?.lng === pin.longitude) continue;
      rounds.push({
        prediction: { lat: pin.latitude, lng: pin.longitude },
        durationMs: Number.isFinite(roundStartedAt)
          ? Math.max(0, event.time.start - roundStartedAt)
          : null,
      });
    } catch { /* Ignore non-JSON presentation fragments. */ }
  }

  return rounds.map(({ prediction, durationMs }, index) => {
    const globalIndex = index + 1;
    const competitionId = globalIndex <= 8 ? "europe-easy" : globalIndex <= 17 ? "europe-medium" : "europe-hard";
    return {
      input: {
        id: `glm-${runId}-round-${String(globalIndex).padStart(2, "0")}`,
        atlasLocationId: `${competitionId}--loc-${String(globalIndex).padStart(3, "0")}`,
        condition: "interactive-panorama",
        prediction,
        durationMs,
      },
      source: relative(ROOT, absolutePath).replaceAll("\\", "/"),
    };
  });
}

async function loadRecordings(
  warnings,
) {
  const files =
    await listJsonFiles(
      RECORDINGS_INBOX_DIR,
      { recursive: true },
    );

  const recordings = [];

  for (const path of files) {
    try {
      const input =
        await readJson(path);

      if (!Array.isArray(input.samples)) {
        warnings.push(
          `${relative(ROOT, path)} was ignored because it does not contain a samples array.`,
        );
        continue;
      }

      if (
        isPhantomResultScreenRecording(
          input,
        )
      ) {
        warnings.push(
          `${relative(ROOT, path)} was ignored because it is a phantom result-screen round ` +
          `created by recorder 0.5.0 after the real round had already been finalized.`,
        );

        continue;
      }

      recordings.push({
        ...input,

        sourceFile:
          relative(ROOT, path)
            .replaceAll("\\", "/"),
      });
    } catch (error) {
      warnings.push(
        `${relative(ROOT, path)} was ignored: ${error.message}`,
      );
    }
  }

  return recordings;
}

export function isPhantomResultScreenRecording(
  recording,
) {
  if (
    !recording ||
    typeof recording !== "object"
  ) {
    return false;
  }

  const startSource =
    recording.round?.startSource ??
    null;

  const samples =
    Array.isArray(recording.samples)
      ? recording.samples
      : [];

  const onlyResultInitialSample =
    samples.length <= 1 &&
    samples.every((sample) =>
      String(
        sample?.reason ?? "",
      ).includes(
        "result_visible_initial_view",
      ),
    );

  return Boolean(
    recording.partial === true &&
    !isCoordinate(
      recording.prediction,
    ) &&
    startSource === "result_visible" &&
    onlyResultInitialSample,
  );
}

function resolveRecordingLocations(
  recordings,
  locations,
  competitions,
  warnings,
) {
  return recordings.map((recording) => {
    const direct =
      resolveLocationReference(
        recording,
        locations,
      );

    if (direct) {
      return enrichRecordingLocation(
        recording,
        direct,
        recording.locationMatch,
      );
    }

    const match =
      matchRecordingToLocation(
        recording,
        locations,
        competitions,
      );

    if (!match) {
      warnings.push(
        `${recording.sourceFile} could not be matched to a known location and remains indexed but unattached.`,
      );

      return recording;
    }

    return enrichRecordingLocation(
      recording,
      match.location,
      {
        method:
          match.method,

        distanceMeters:
          Number.isFinite(
            match.distanceMeters,
          )
            ? Number(
              match.distanceMeters.toFixed(
                3,
              ),
            )
            : null,

        derivedDuringBuild:
          true,
      },
      match.membership,
    );
  });
}

function enrichRecordingLocation(
  recording,
  location,
  locationMatch = null,
  membership = null,
) {
  const resolvedMembership =
    membership ??
    location.competitions.find(
      (item) =>
        item.competitionId ===
        recording.competitionId,
    ) ??
    location.competitions[0] ??
    null;

  const recovered =
    recoverNmpzSamples(
      recording,
      location,
    );

  return {
    ...recording,
    ...recovered,

    atlasLocationId:
      location.id,

    locationId:
      location.localId,

    competitionId:
      recording.competitionId ??
      resolvedMembership?.competitionId ??
      null,

    competitionPartId:
      recording.competitionPartId ??
      resolvedMembership?.partId ??
      null,

    competitionPart:
      recording.competitionPart ??
      resolvedMembership?.part ??
      null,

    competitionRound:
      recording.competitionRound ??
      resolvedMembership?.round ??
      null,

    competitionOverallIndex:
      recording.competitionOverallIndex ??
      resolvedMembership?.overallIndex ??
      null,

    ...(locationMatch
      ? { locationMatch }
      : {}),
  };
}

function recoverNmpzSamples(
  recording,
  location,
) {
  if (
    Array.isArray(recording.samples) &&
    recording.samples.length > 0
  ) {
    return {};
  }

  if (
    recording.condition !== "static-image" &&
    recording.captureMode !== "nmpz" &&
    recording.restriction !== "nmpz"
  ) {
    return {};
  }

  const view =
    location?.startingView;

  const lat = Number(
    view?.viewpoint?.lat ??
    location?.groundTruth?.lat,
  );

  const lng = Number(
    view?.viewpoint?.lng ??
    location?.groundTruth?.lng,
  );

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return {};
  }

  const durationMs =
    Number.isFinite(
      recording.durationMs,
    )
      ? Math.max(
        0,
        Number(recording.durationMs),
      )
      : 0;

  const base = {
    roundIndex:
      Number.isInteger(
        recording.round?.index,
      )
        ? recording.round.index
        : Math.max(
          0,
          Number(
            recording.competitionOverallIndex ??
            1,
          ) - 1,
        ),

    lat,
    lng,

    heading:
      Number.isFinite(view?.heading)
        ? view.heading
        : null,

    pitch:
      Number.isFinite(view?.pitch)
        ? view.pitch
        : null,

    zoom:
      null,

    fov:
      Number.isFinite(view?.fov)
        ? view.fov
        : null,

    panoId:
      view?.panoId ??
      null,

    source:
      "competition-definition",
  };

  const samples = [
    {
      ...base,

      seq: 0,
      tMs: 0,

      capturedAt:
        recording.startedAt ??
        null,

      reason:
        "nmpz_starting_view_recovered",
    },
  ];

  if (durationMs > 0) {
    samples.push({
      ...base,

      seq: 1,
      tMs: durationMs,

      capturedAt:
        recording.stoppedAt ??
        null,

      reason:
        "nmpz_round_end_recovered",
    });
  }

  return {
    samples,

    sampleCount:
      samples.length,

    captureSources: {
      ...(recording.captureSources ?? {}),

      "competition-definition":
        samples.length,
    },

    keyMoments:
      Array.isArray(
        recording.keyMoments,
      ) &&
        recording.keyMoments.length
        ? recording.keyMoments
        : [
          {
            id: "nmpz-start",
            label: "NMPZ view shown",

            description:
              "Fixed starting view recovered from the competition definition after the round.",

            tMs: 0,
          },

          ...(durationMs > 0
            ? [
              {
                id: "round-end",
                label: "Round ended",

                description:
                  "End of the fixed-view recording.",

                tMs:
                  durationMs,
              },
            ]
            : []),
        ],

    recoveredStartingView:
      true,
  };
}

function indexRecordings(
  recordings,
) {
  const byId =
    new Map();

  const byMatchKey =
    new Map();

  const byLocation =
    new Map();

  for (const recording of recordings) {
    if (recording.id) {
      byId.set(
        recording.id,
        recording,
      );
    }

    if (recording.atlasLocationId) {
      if (
        !byLocation.has(
          recording.atlasLocationId,
        )
      ) {
        byLocation.set(
          recording.atlasLocationId,
          [],
        );
      }

      byLocation
        .get(
          recording.atlasLocationId,
        )
        .push(recording);
    }

    if (
      !recording.atlasLocationId ||
      !recording.model ||
      !recording.condition
    ) {
      continue;
    }

    const key =
      recordingMatchKey(
        recording.atlasLocationId,
        recording.model,
        recording.condition,
      );

    const current =
      byMatchKey.get(key);

    if (
      !current ||
      recordingTimestamp(recording) >
      recordingTimestamp(current)
    ) {
      byMatchKey.set(
        key,
        recording,
      );
    }
  }

  for (
    const list
    of byLocation.values()
  ) {
    list.sort(
      (a, b) =>
        recordingTimestamp(a) -
        recordingTimestamp(b),
    );
  }

  return {
    byId,
    byMatchKey,
    byLocation,
  };
}

function compileAtlasCases({
  locations,
  results,
  recordingIndex,
  predictionLocationLabels,
  clueDocumentsByLocation,
  warnings,
}) {
  const resultsByLocation =
    new Map();

  for (const result of results) {
    if (
      !resultsByLocation.has(
        result.atlasLocationId,
      )
    ) {
      resultsByLocation.set(
        result.atlasLocationId,
        [],
      );
    }

    resultsByLocation
      .get(
        result.atlasLocationId,
      )
      .push(...result.runs);
  }

  const cases = [];

  for (const location of locations) {
    const rawRuns =
      resultsByLocation.get(
        location.id,
      ) ?? [];

    const usedRecordingIds =
      new Set();

    const runs =
      rawRuns.map((run) => {
        const recording =
          findRecordingForRun(
            location.id,
            run,
            recordingIndex,
          );

        if (recording?.id) {
          usedRecordingIds.add(
            recording.id,
          );
        }

        return combineRunAndRecording(
          run,
          recording,
          predictionLocationLabels,
        );
      });

    for (
      const recording
      of recordingIndex.byLocation.get(
        location.id,
      ) ?? []
    ) {
      if (
        recording.id &&
        usedRecordingIds.has(
          recording.id,
        )
      ) {
        continue;
      }

      if (
        !nonEmptyString(
          recording.model,
        ) ||
        !nonEmptyString(
          recording.condition,
        )
      ) {
        warnings.push(
          `${recording.sourceFile} was matched to ${location.id} ` +
          `but cannot be shown because model or condition is missing.`,
        );

        continue;
      }

      runs.push(
        recordingToRun(
          recording,
          predictionLocationLabels,
        ),
      );

      if (
        !isCoordinate(
          recording.prediction,
        )
      ) {
        warnings.push(
          `${location.id} imported recording ` +
          `${recording.id ?? recording.sourceFile} for model ` +
          `"${recording.model}", but no prediction coordinate was captured. ` +
          `Playback is available; pin comparison and error statistics are disabled for this run.`,
        );
      }
    }

    const scoredRuns = runs.map((run) => addLocationAccuracy(run, location));

    if (runs.length === 0) {
      warnings.push(
        `${location.id} has no model result or matched recording yet.`,
      );
    }

    cases.push({
      id:
        location.id,

      localId:
        location.localId,

      title:
        location.title,

      landmark:
        location.landmark,

      city:
        location.city,

      region:
        location.region,

      country:
        location.country,

      countryCode:
        location.countryCode,

      difficulty:
        location.difficulty,

      sceneType:
        location.sceneType,

      primaryClueType:
        location.primaryClueType,

      selectionNotes:
        location.selectionNotes,

      summary:
        location.summary,

      tags:
        location.tags,

      competitions:
        location.competitions,

      ...(location.visual
        ? { visual: location.visual }
        : {}),

      groundTruth:
        location.groundTruth,

      startingView:
        location.startingView,

      startingImage:
        resolveStartingImage(
          location,
        ),

      clueSets: (clueDocumentsByLocation.get(location.id)?.clueSets ?? [])
        .filter((clueSet) => clueSet.publicationStatus !== "review-only")
        .map((clueSet) => ({
          ...clueSet,
          cues: (clueSet.cues ?? []).filter((clue) =>
            clue.annotationStatus === "reviewed" || clue.annotationStatus === "text-only"
          ),
        }))
        .filter((clueSet) => clueSet.cues.length > 0),

      runs: scoredRuns,
    });
  }

  return cases;
}

function addLocationAccuracy(run, location) {
  const withAccuracy = (candidate) => ({
    ...candidate,
    accuracy: {
      ...candidate.accuracy,
      country: isPredictionInCountry(candidate.prediction, location.country),
    },
  });
  return {
    ...withAccuracy(run),
    statisticsRuns: (run.statisticsRuns ?? []).map(withAccuracy),
  };
}

function resolveStartingImage(
  location,
) {
  const memberships = [
    ...(location.competitions ?? []),
  ].sort(
    (a, b) =>
      (a.competitionOrder ??
        Number.MAX_SAFE_INTEGER) -
      (b.competitionOrder ??
        Number.MAX_SAFE_INTEGER) ||
      (a.overallIndex ??
        Number.MAX_SAFE_INTEGER) -
      (b.overallIndex ??
        Number.MAX_SAFE_INTEGER),
  );

  for (
    const membership
    of memberships
  ) {
    const competitionId =
      membership?.competitionId;

    if (
      !nonEmptyString(
        competitionId,
      ) ||
      !nonEmptyString(
        location.localId,
      )
    ) {
      continue;
    }

    const absolutePath =
      join(
        STARTING_IMAGES_DIR,
        competitionId,
        `${location.localId}.png`,
      );

    if (
      !existsSync(
        absolutePath,
      )
    ) {
      continue;
    }

    return {
      path:
        relative(
          ROOT,
          absolutePath,
        ).replaceAll("\\", "/"),

      competitionId,

      locationId:
        location.localId,

      source:
        "canonical-nmpz",
    };
  }

  return null;
}

function combineRunAndRecording(
  run,
  recording,
  predictionLocationLabels,
) {
  const prediction =
    isCoordinate(
      recording?.prediction,
    )
      ? {
        lat: Number(
          recording.prediction.lat,
        ),

        lng: Number(
          recording.prediction.lng,
        ),

        label:
          resolvePredictionLocationLabel(
            run.prediction?.label,
            recording,
            predictionLocationLabels,
          ),
      }
      : isCoordinate(run.prediction)
        ? {
          ...run.prediction,
          label: resolvePredictionLocationLabel(
            run.prediction?.label,
            { id: run.recordingId, prediction: run.prediction },
            predictionLocationLabels,
          ),
        }
        : null;

  return {
    ...run,
    prediction,

    hypothesis:
      run.hypothesis ?? "",

    cues:
      Array.isArray(run.cues)
        ? run.cues
        : [],

    ...(recording
      ? {
        exploration:
          recording,

        durationSeconds:
          Number.isFinite(
            recording.durationMs,
          )
            ? recording.durationMs /
            1000
            : run.durationSeconds,

        recordingId:
          recording.id ??
          null,

        recordingSourceFile:
          recording.sourceFile,

        competitionId:
          recording.competitionId ??
          run.competitionId ??
          null,

        competitionPartId:
          recording.competitionPartId ??
          null,

        competitionRound:
          recording.competitionRound ??
          null,
      }
      : {}),
  };
}

function recordingToRun(
  recording,
  predictionLocationLabels,
) {
  const hasPrediction =
    isCoordinate(
      recording.prediction,
    );

  return {
    id:
      recording.id ??
      `recording-${Math.random()
        .toString(36)
        .slice(2)}`,

    model:
      recording.model,

    runKind:
      "recording",

    condition:
      recording.condition,

    prediction:
      hasPrediction
        ? {
          lat: Number(
            recording.prediction.lat,
          ),

          lng: Number(
            recording.prediction.lng,
          ),

          label:
            resolvePredictionLocationLabel(
              null,
              recording,
              predictionLocationLabels,
            ),
        }
        : null,

    runStatus:
      hasPrediction
        ? "complete"
        : "recording-only",

    hypothesis:
      "",

    cues:
      [],

    notes:
      hasPrediction
        ? "Recorder data is available; the model explanation and human cue review have not been imported yet."
        : "Recorder data is available, but the submitted prediction coordinate was not captured. Playback remains available.",

    isMock:
      false,

    accuracy: {
      country: null,
      region: null,
    },

    durationSeconds:
      Number.isFinite(
        recording.durationMs,
      )
        ? recording.durationMs /
        1000
        : null,

    exploration:
      recording,

    recordingId:
      recording.id ??
      null,

    recordingSourceFile:
      recording.sourceFile,

    competitionId:
      recording.competitionId ??
      null,

    competitionPartId:
      recording.competitionPartId ??
      null,

    competitionRound:
      recording.competitionRound ??
      null,
  };
}

function resolvePredictionLocationLabel(
  currentLabel,
  recording,
  predictionLocationLabels,
) {
  if (
    nonEmptyString(currentLabel) &&
    currentLabel !== "Recorded OpenGuessr prediction" &&
    currentLabel !== "Recorded prediction"
  ) {
    return currentLabel.trim();
  }

  const resolved = recording?.id
    ? predictionLocationLabels.get(recording.id)
    : null;

  if (nonEmptyString(resolved)) {
    return resolved.trim();
  }

  return formatPredictionCoordinate(recording?.prediction);
}

function formatPredictionCoordinate(prediction) {
  if (!isCoordinate(prediction)) return "Prediction location unavailable";
  return `${Number(prediction.lat).toFixed(5)}, ${Number(prediction.lng).toFixed(5)}`;
}

function findRecordingForRun(
  atlasLocationId,
  run,
  recordingIndex,
) {
  if (
    run.recordingId &&
    recordingIndex.byId.has(
      run.recordingId,
    )
  ) {
    return recordingIndex.byId.get(
      run.recordingId,
    );
  }

  const key =
    recordingMatchKey(
      atlasLocationId,
      run.model,
      run.condition,
    );

  return (
    recordingIndex.byMatchKey.get(
      key,
    ) ?? null
  );
}

function buildCompetitionOutputs(
  competitions,
  locations,
) {
  const locationMap =
    new Map(
      locations.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    );

  return competitions.flatMap(
    (competition) =>
      competition.parts.map(
        (part) => ({
          competitionId:
            competition.id,

          competitionName:
            competition.name,

          partId:
            part.id,

          part:
            part.part,

          partCount:
            part.partCount,

          filename:
            `${part.id}.txt`,

          locationIds:
            part.locationIds,

          localLocationIds:
            part.localLocationIds,

          urls:
            part.locationIds.map(
              (id) =>
                locationMap.get(id)
                  .googleMapsUrl,
            ),
        }),
      ),
  );
}

function buildCompetitionArchives(
  competitions,
  locations,
) {
  const locationMap =
    new Map(
      locations.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    );

  return competitions
    .filter(
      (competition) =>
        competition.parts.length >
        1,
    )
    .map(
      (competition) => ({
        competitionId:
          competition.id,

        filename:
          `${competition.id}-all.txt`,

        urls:
          competition.locationIds.map(
            (id) =>
              locationMap.get(id)
                .googleMapsUrl,
          ),
      }),
    );
}

function resolveLocationReference(
  reference,
  locations,
) {
  if (
    nonEmptyString(
      reference?.atlasLocationId,
    )
  ) {
    const exact =
      locations.find(
        (item) =>
          item.id ===
          reference.atlasLocationId,
      );

    if (exact) return exact;
  }

  if (
    !nonEmptyString(
      reference?.locationId,
    )
  ) {
    return null;
  }

  const locationId =
    reference.locationId.trim();

  const exact =
    locations.find(
      (item) =>
        item.id === locationId,
    );

  if (exact) return exact;

  let candidates =
    locations.filter(
      (item) =>
        item.localId ===
        locationId,
    );

  if (
    nonEmptyString(
      reference?.competitionId,
    )
  ) {
    candidates =
      candidates.filter((item) =>
        item.competitions.some(
          (membership) =>
            membership.competitionId ===
            reference.competitionId,
        ),
      );
  }

  return candidates.length === 1
    ? candidates[0]
    : null;
}

function summarizeRecording(
  recording,
) {
  return {
    id:
      recording.id ?? null,

    sessionId:
      recording.sessionId ??
      null,

    competitionId:
      recording.competitionId ??
      null,

    competitionPartId:
      recording.competitionPartId ??
      null,

    competitionRound:
      recording.competitionRound ??
      null,

    atlasLocationId:
      recording.atlasLocationId ??
      null,

    locationId:
      recording.locationId ??
      null,

    model:
      recording.model ?? null,

    condition:
      recording.condition ?? null,

    startedAt:
      recording.startedAt ??
      null,

    stoppedAt:
      recording.stoppedAt ??
      null,

    sampleCount:
      Array.isArray(
        recording.samples,
      )
        ? recording.samples.length
        : 0,

    hasPrediction:
      Boolean(
        recording.prediction,
      ),

    sourceFile:
      recording.sourceFile,
  };
}

function recordingMatchKey(
  atlasLocationId,
  model,
  condition,
) {
  return (
    `${String(atlasLocationId).trim()}` +
    `\u0000${String(model).trim()}` +
    `\u0000${String(condition).trim()}`
  );
}

function recordingTimestamp(
  recording,
) {
  const value =
    Date.parse(
      recording.stoppedAt ??
      recording.receivedAt ??
      recording.startedAt ??
      0,
    );

  return Number.isFinite(value)
    ? value
    : 0;
}

function chunk(
  items,
  size,
) {
  const chunks = [];

  for (
    let index = 0;
    index < items.length;
    index += size
  ) {
    chunks.push(
      items.slice(
        index,
        index + size,
      ),
    );
  }

  return chunks;
}

function requiredString(
  value,
  label,
  errors,
) {
  if (!nonEmptyString(value)) {
    errors.push(
      `${label} must be a non-empty string.`,
    );

    return null;
  }

  return value.trim();
}

function firstString(
  ...values
) {
  for (const value of values) {
    if (nonEmptyString(value)) {
      return value.trim();
    }
  }

  return null;
}

function nonEmptyString(
  value,
) {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function slugify(
  value,
) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    )
    .slice(
      0,
      100,
    );
}

function humanize(
  value,
) {
  return String(value ?? "")
    .replace(
      /[-_]+/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function unique(
  values,
) {
  return [...new Set(values)];
}

function isCoordinate(
  value,
) {
  if (
    value?.lat === null ||
    value?.lat === "" ||
    value?.lat === undefined
  ) {
    return false;
  }

  if (
    value?.lng === null ||
    value?.lng === "" ||
    value?.lng === undefined
  ) {
    return false;
  }

  return (
    Number.isFinite(
      Number(value.lat),
    ) &&
    Number(value.lat) >= -90 &&
    Number(value.lat) <= 90 &&
    Number.isFinite(
      Number(value.lng),
    ) &&
    Number(value.lng) >= -180 &&
    Number(value.lng) <= 180
  );
}

async function runCli() {
  const checkOnly =
    process.argv.includes(
      "--check",
    );

  const result =
    await buildData({
      write: !checkOnly,
    });

  if (checkOnly) {
    console.log(
      `Data check passed: ` +
      `${result.locations.length} locations, ` +
      `${result.competitions.length} competitions, ` +
      `${result.atlasCases.length} atlas cases.`,
    );
  }
}

const isDirect =
  process.argv[1]
    ? resolve(process.argv[1]) ===
    fileURLToPath(import.meta.url)
    : false;

if (isDirect) {
  runCli().catch((error) => {
    console.error(
      error instanceof Error
        ? error.message
        : String(error),
    );

    process.exitCode = 1;
  });
}
