import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildData, OPEN_GUESSR_COMPETITION_MAX_LOCATIONS, isPhantomResultScreenRecording } from "../scripts/build-data.mjs";
import {
  matchRecordingToLocation,
  validateRoundRecording,
} from "../scripts/lib/recordings.mjs";

const EXPECTED_COMPETITIONS = new Map([
  ["europe-easy", { count: 8, first: "loc_001", last: "loc_008" }],
  ["europe-medium", { count: 9, first: "loc_009", last: "loc_017" }],
  ["europe-hard", { count: 8, first: "loc_018", last: "loc_025" }],
]);

test("easy, medium, and hard export as three independent OpenGuessr TXT files", async () => {
  const built = await buildData({ write: false, quiet: true });
  assert.equal(OPEN_GUESSR_COMPETITION_MAX_LOCATIONS, 20);
  assert.equal(built.competitions.length, 3);
  assert.equal(built.competitionOutputs.length, 3);

  for (const [id, expected] of EXPECTED_COMPETITIONS) {
    const competition = built.competitions.find((item) => item.id === id);
    const output = built.competitionOutputs.find((item) => item.competitionId === id);
    assert.ok(competition, `${id} definition missing`);
    assert.ok(output, `${id} output missing`);
    assert.equal(competition.parts.length, 1);
    assert.equal(output.urls.length, expected.count);
    assert.equal(output.localLocationIds[0], expected.first);
    assert.equal(output.localLocationIds.at(-1), expected.last);
    assert.ok(output.urls.every((url) => url.startsWith("https://www.google.com/maps/")));
    assert.ok(output.urls.length <= OPEN_GUESSR_COMPETITION_MAX_LOCATIONS);
  }
});

test("all 25 source locations are partitioned exactly once by difficulty", async () => {
  const built = await buildData({ write: false, quiet: true });
  const localIds = built.competitions.flatMap((item) => item.localLocationIds);
  assert.equal(localIds.length, 25);
  assert.equal(new Set(localIds).size, 25);

  for (const location of built.locations) {
    const membership = location.competitions[0];
    const expectedCompetition = `europe-${location.difficulty}`;
    assert.equal(membership.competitionId, expectedCompetition);
    assert.equal(membership.competitionShortName.toLowerCase(), location.difficulty);
  }
});

test("reference prediction pins retain stable labels as the recording archive grows", async () => {
  const built = await buildData({ write: false, quiet: true });
  const predictedRuns = built.atlasCases.flatMap((item) =>
    item.runs
      .filter((run) => Number.isFinite(run.prediction?.lat) && Number.isFinite(run.prediction?.lng))
      .map((run) => ({ caseId: item.id, run })),
  );
  assert.ok(
    predictedRuns.every(({ run }) =>
      typeof run.prediction.label === "string" &&
      run.prediction.label.length > 0 &&
      !run.prediction.label.startsWith("Recorded"),
    ),
  );

  const referenceRuns = predictedRuns.filter(({ run }) =>
    run.runKind === "model-prediction" || run.model === "manual",
  );

  // 275 interactive model predictions with coordinates
  // + 200 static baseline predictions (4 models x 2 image variants x 25 locations)
  // + 131 controlled covered-static predictions
  // + 50 manual reference runs
  assert.equal(referenceRuns.length, 656);

  const staticBaselineRuns = referenceRuns.filter(
    ({ run }) =>
      run.runKind === "model-prediction" &&
      run.condition === "static-image",
  );

  // The four static baselines contribute
  // 4 models x 2 image variants x 25 locations = 200 predictions.
  // Their result CSVs contain exact coordinates, not authoritative
  // reverse-geocoded place labels.
  assert.equal(staticBaselineRuns.length, 200);
  assert.deepEqual(
    [...new Set(staticBaselineRuns.map(({ run }) => run.imageVariant))].sort(),
    ["no-location-gui", "original"],
  );
  assert.ok(staticBaselineRuns.every(({ run }) =>
    Number.isFinite(run.prediction?.lat) &&
    Number.isFinite(run.prediction?.lng),
  ));

  const bogatyniaReferences = referenceRuns
    .filter(({ caseId, run }) => caseId === "europe-easy--loc-006" && run.condition !== "static-image-covered")
    .map(({ run }) => [run.model, run.condition, run.prediction.label]);

  assert.equal(bogatyniaReferences.length, 21);
  assert.deepEqual(bogatyniaReferences.slice(-2), [
    ["manual", "interactive-panorama", "Zittau, Germany"],
    ["manual", "static-image", "Hrádek nad Nisou, Czechia"],
  ]);
});

test("canonical benchmark predictions are available independently of replay recordings", async () => {
  const built = await buildData({ write: false, quiet: true });

  const expectedInteractiveModels = [
    "GLM-5.3-Flash + MCP · Max",
    "GPT-6 Astra · low",
    "Gemini 3.7 Flash · high, aided",
    "Gemini 3.7 Flash · medium, aided",
    "Gemini 3.8 Flash · high, aided",
    "Gemini 3.8 Flash · medium, aided",
    "GPT-5.6 Sol · xhigh",
    "GPT-5.6 Sol · max",
    "Grok 4.6 · xhigh",
    "Grok 4.6 + MCP · xhigh",
    "Gemini 3.7 Flash · high, unaided",
  ];

  const expectedStaticBaselineModels = [
    "GeoCLIP",
    "SALAD + OSV-5M",
    "PLONK OSV-5M",
    "Chipoint v2",
  ];
  const expectedStaticImageVariants = [
    "original",
    "no-location-gui",
  ];

  const predictionRuns = built.atlasCases.flatMap((item) =>
    item.runs.filter((run) => run.runKind === "model-prediction"),
  );

  const interactivePredictionRuns = predictionRuns.filter(
    (run) => run.condition === "interactive-panorama",
  );
  const staticPredictionRuns = predictionRuns.filter(
    (run) => run.condition === "static-image",
  );
  const coveredStaticPredictionRuns = predictionRuns.filter(
    (run) => run.condition === "static-image-covered",
  );

  assert.equal(predictionRuns.length, 606);
  assert.equal(interactivePredictionRuns.length, 275);
  assert.equal(staticPredictionRuns.length, 200);
  assert.equal(coveredStaticPredictionRuns.length, 131);

  assert.deepEqual(
    [...new Set(interactivePredictionRuns.map((run) => run.model))],
    expectedInteractiveModels,
  );

  assert.deepEqual(
    [...new Set(staticPredictionRuns.map((run) => run.model))],
    expectedStaticBaselineModels,
  );

  for (const item of built.atlasCases) {
    const runs = item.runs.filter((run) => run.runKind === "model-prediction");

    const interactiveRuns = runs.filter(
      (run) => run.condition === "interactive-panorama",
    );
    const staticRuns = runs.filter(
      (run) => run.condition === "static-image",
    );

    assert.deepEqual(
      interactiveRuns.map((run) => run.model),
      expectedInteractiveModels,
      item.id,
    );

    assert.equal(
      staticRuns.length,
      expectedStaticBaselineModels.length * expectedStaticImageVariants.length,
      item.id,
    );

    assert.deepEqual(
      [...new Set(staticRuns.map((run) => run.model))],
      expectedStaticBaselineModels,
      item.id,
    );
    assert.ok(
      staticRuns.every(
        (run) => Number.isFinite(run.durationSeconds) && run.durationSeconds > 0,
      ),
      `${item.id} static baseline timing`,
    );

    for (const model of expectedStaticBaselineModels) {
      const variants = staticRuns
        .filter((run) => run.model === model)
        .map((run) => run.imageVariant)
        .sort();

      assert.deepEqual(
        variants,
        [...expectedStaticImageVariants].sort(),
        `${item.id} / ${model}`,
      );
    }

    const unavailablePins = runs.filter((run) =>
      !Number.isFinite(run.prediction?.lat) || !Number.isFinite(run.prediction?.lng),
    );
    assert.deepEqual(unavailablePins, [], item.id);
    assert.ok(
      runs.every((run) => run.exploration === undefined),
      item.id,
    );
    assert.ok(interactiveRuns.every((run) => run.bestRunId), item.id);
    assert.equal(
      new Set(interactiveRuns.map((run) => run.benchmarkId)).size,
      expectedInteractiveModels.length,
      item.id,
    );
  }
});

test("the public atlas includes only completed covered-image clues", async () => {
  const built = await buildData({ write: false, quiet: true });
  const coveredSets = built.atlasCases.flatMap((item) =>
    item.clueSets.filter((set) => set.condition === "static-image-covered"),
  );
  const coveredClues = coveredSets.flatMap((set) => set.cues);

  assert.equal(coveredSets.length, 131);
  assert.equal(coveredClues.length, 597);
  assert.equal(coveredClues.filter((clue) => clue.region).length, 350);
  assert.ok(coveredClues.every((clue) =>
    clue.annotationStatus === "reviewed" || clue.annotationStatus === "text-only"
  ));
  assert.ok(coveredClues.every((clue) =>
    ["visible", "correct", "useful", "consistent"].every(
      (key) => typeof clue.ratings?.[key] === "boolean",
    )
  ));
});

test("recording matching is restricted to the selected competition and uses the spawn coordinate", async () => {
  const built = await buildData({ write: false, quiet: true });
  const recording = {
    model: "GPT-5.6 Sol",
    condition: "interactive-panorama",
    competitionId: "europe-easy",
    round: {
      spawnRequested: { lat: 48.8521298, lng: 2.3696389 },
    },
    samples: [{ lat: 48.8521298, lng: 2.3696389 }],
  };

  const match = matchRecordingToLocation(
    recording,
    built.locations,
    built.competitions,
  );
  assert.equal(match.location.id, "europe-easy--loc-001");
  assert.equal(match.location.localId, "loc_001");
  assert.equal(match.membership.competitionRound, undefined);
  assert.equal(match.membership.round, 1);
  assert.ok(match.distanceMeters < 1);
});

test("round recording validation accepts the extension schema and rejects missing samples", () => {
  const valid = {
    model: "Gemini 3.6 Flash",
    condition: "interactive-panorama",
    competitionId: "europe-medium",
    round: { spawnRequested: { lat: 39.4667928, lng: -0.3661343 } },
    prediction: { lat: 39.47, lng: -0.37 },
    samples: [{ lat: 39.4667928, lng: -0.3661343 }],
  };
  assert.deepEqual(validateRoundRecording(valid), []);
  assert.ok(
    validateRoundRecording({ ...valid, samples: null }).some((message) =>
      message.includes("samples"),
    ),
  );
});


test("NMPZ recordings without coordinates are matched by competition round order", async () => {
  const built = await buildData({ write: false, quiet: true });
  const recording = {
    model: "GPT-5.6 Sol",
    condition: "static-image",
    captureMode: "nmpz",
    competitionId: "europe-hard",
    competitionOverallIndex: 3,
    round: { index: 2, pageRoundNumber: 3, spawnRequested: null },
    samples: [],
  };

  assert.deepEqual(validateRoundRecording(recording), []);
  const match = matchRecordingToLocation(
    recording,
    built.locations,
    built.competitions,
  );
  assert.equal(match.method, "competition-round-order");
  assert.equal(match.location.localId, "loc_020");
  assert.equal(match.distanceMeters, null);
});


test("v0.5.0 result-screen phantom duplicate is recognized while a real recording is preserved", () => {
  const phantom = {
    recorder: { version: "0.5.0" },
    partial: true,
    prediction: null,
    round: { startSource: "result_visible" },
    samples: [
      {
        source: "openguessr-dom",
        reason: "result_visible_initial_view",
        lat: 48.8521298,
        lng: 2.3696389,
      },
    ],
  };
  const real = {
    recorder: { version: "0.5.0" },
    partial: false,
    prediction: { lat: 47.32658839583286, lng: 2.109375 },
    round: { startSource: "streetview-frame" },
    samples: [
      {
        source: "api",
        reason: "position_changed",
        lat: 48.8521298,
        lng: 2.3696389,
      },
    ],
  };

  assert.equal(isPhantomResultScreenRecording(phantom), true);
  assert.equal(isPhantomResultScreenRecording(real), false);
});

test("Berlin competition entry uses the revised Street View viewpoint", async () => {
  const competition = JSON.parse(await readFile(new URL("../data/competitions/europe-easy.json", import.meta.url), "utf8"));
  const berlin = competition.locations.find((item) => item.id === "loc_002");
  assert.ok(berlin);
  assert.match(berlin.google_maps_link, /@52\.5206008,13\.4151229,3a,75y,281\.32h,90t/);
});


test("all 25 competition source links use zero starting pitch", async () => {
  const built = await buildData({ write: false, quiet: true });
  assert.equal(built.locations.length, 25);
  for (const location of built.locations) {
    assert.equal(location.startingView.pitch, 0, `${location.id} should start at pitch 0`);
    assert.match(location.googleMapsUrl, /,-?\d+(?:\.\d+)?h,90t(?:\/|,)/i);
  }
});
