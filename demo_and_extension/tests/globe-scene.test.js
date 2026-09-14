import test from "node:test";
import assert from "node:assert/strict";

let sceneModule = {};
try {
  sceneModule = await import("../src/globe-scene.js");
} catch (error) {
  if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
}

const paris = {
  id: "paris",
  city: "Paris",
  country: "France",
  difficulty: "easy",
  groundTruth: { lat: 48.8532, lng: 2.3693, label: "Paris, France" },
};

const berlin = {
  id: "berlin",
  city: "Berlin",
  country: "Germany",
  difficulty: "medium",
  groundTruth: { lat: 52.52, lng: 13.405, label: "Berlin, Germany" },
};

test("overview scene exposes every benchmark location as a selectable globe point", () => {
  const scene = sceneModule.buildGlobeSceneData?.({
    cases: [paris, berlin],
    overview: true,
  });

  assert.deepEqual(scene?.points, [
    {
      kind: "location",
      caseId: "paris",
      lat: 48.8532,
      lng: 2.3693,
      label: "Paris, France · Easy",
      color: "#38bdf8",
      radius: 0.44,
      altitude: 0.026,
    },
    {
      kind: "location",
      caseId: "berlin",
      lat: 52.52,
      lng: 13.405,
      label: "Berlin, Germany · Medium",
      color: "#fbbf24",
      radius: 0.44,
      altitude: 0.026,
    },
  ]);
  assert.deepEqual(scene?.arcs, []);
  assert.deepEqual(scene?.paths, []);
});

test("overview scene overlays the selected model predictions and their real pin errors", () => {
  const scene = sceneModule.buildGlobeSceneData?.({
    cases: [paris, berlin],
    overview: true,
    overviewRuns: [
      {
        caseId: "paris",
        run: {
          id: "sol-paris",
          model: "GPT-5.6 Sol · xhigh",
          prediction: { lat: 48.8496, lng: 2.3719 },
          errorKm: 0.45,
        },
      },
      {
        caseId: "berlin",
        run: {
          id: "grok-berlin",
          model: "Grok 4.6 · xhigh",
          prediction: { lat: 53.1204, lng: 16.3281 },
          errorKm: 209.7,
        },
      },
    ],
  });

  assert.deepEqual(
    scene?.points.map((point) => `${point.kind}:${point.caseId}:${point.runId ?? "location"}`),
    [
      "location:paris:location",
      "location:berlin:location",
      "prediction:paris:sol-paris",
      "prediction:berlin:grok-berlin",
    ],
  );
  assert.deepEqual(scene?.points.at(-1), {
    kind: "prediction",
    caseId: "berlin",
    runId: "grok-berlin",
    lat: 53.1204,
    lng: 16.3281,
    label: "Grok 4.6 · xhigh prediction · Berlin, Germany · 210 km pin error",
    color: "#ff8a30",
    radius: 0.24,
    altitude: 0.105,
  });
  assert.equal(scene?.arcs.length, 2);
  assert.deepEqual(scene?.arcs.at(-1), {
    kind: "overview-error",
    caseId: "berlin",
    runId: "grok-berlin",
    startLat: 52.52,
    startLng: 13.405,
    endLat: 53.1204,
    endLng: 16.3281,
    label: "Grok 4.6 · xhigh · 210 km pin error",
    color: ["#355071", "#ff8a30"],
    stroke: 0.18,
    altitudeScale: 0.08,
  });
});

test("accurate overview predictions rise as narrow cores from visible location cylinders", () => {
  const scene = sceneModule.buildGlobeSceneData?.({
    cases: [paris],
    overview: true,
    overviewRuns: [{
      caseId: "paris",
      run: {
        id: "perfect-paris",
        model: "GPT-5.6 Sol · max",
        prediction: { lat: paris.groundTruth.lat, lng: paris.groundTruth.lng },
        errorKm: 0,
      },
    }],
  });

  const location = scene?.points.find((point) => point.kind === "location");
  const prediction = scene?.points.find((point) => point.kind === "prediction");

  assert.equal(location?.lat, prediction?.lat);
  assert.equal(location?.lng, prediction?.lng);
  assert.ok(location?.radius > prediction?.radius, "location base should remain visible around the prediction");
  assert.ok(location?.altitude < prediction?.altitude, "prediction should rise above the location base");
});

test("selected scene keeps truth, prediction, and the recorded exploration on one globe", () => {
  const run = {
    id: "run-1",
    model: "GPT-5.6 Sol",
    prediction: { lat: 48.8368, lng: 2.3895, label: "Prediction" },
    errorKm: 2.24,
    exploration: {
      path: [
        { lat: 48.8521, lng: 2.3696, tMs: 0 },
        { lat: 48.85245, lng: 2.36949, tMs: 10000 },
      ],
    },
  };

  const scene = sceneModule.buildGlobeSceneData?.({
    cases: [paris],
    caseItem: paris,
    run,
    overview: false,
  });

  assert.deepEqual(scene?.points, [
    {
      kind: "truth",
      caseId: "paris",
      runId: "run-1",
      lat: 48.8532,
      lng: 2.3693,
      label: "Truth · Paris, France",
      color: "#b7f34a",
      radius: 0.48,
      altitude: 0.045,
    },
    {
      kind: "prediction",
      caseId: "paris",
      runId: "run-1",
      lat: 48.8368,
      lng: 2.3895,
      label: "GPT-5.6 Sol · 2.24 km pin error",
      color: "#ff8a30",
      radius: 0.44,
      altitude: 0.055,
    },
  ]);
  assert.deepEqual(scene?.arcs, [
    {
      kind: "error",
      caseId: "paris",
      runId: "run-1",
      startLat: 48.8532,
      startLng: 2.3693,
      endLat: 48.8368,
      endLng: 2.3895,
      label: "2.24 km pin error",
      color: ["#b7f34a", "#ff8a30"],
    },
  ]);
  assert.deepEqual(scene?.paths, [
    {
      kind: "exploration",
      caseId: "paris",
      runId: "run-1",
      label: "Recorded exploration",
      color: "#60a5fa",
      points: [
        [48.8521, 2.3696, 0.012],
        [48.85245, 2.36949, 0.012],
      ],
    },
  ]);
});

test("model comparison keeps one truth point and plots every selected best-run prediction", () => {
  const comparisonRuns = [
    {
      id: "run-sol",
      model: "GPT-5.6 Sol · max",
      prediction: { lat: 48.85, lng: 2.37 },
      errorKm: 0.4,
    },
    {
      id: "run-gemini",
      model: "Gemini 3.7 Flash · high, aided",
      prediction: { lat: 48.86, lng: 2.36 },
      errorKm: 1.1,
    },
  ];

  const scene = sceneModule.buildGlobeSceneData?.({
    cases: [paris],
    caseItem: paris,
    run: comparisonRuns[0],
    comparisonRuns,
    overview: false,
  });

  assert.equal(scene?.points.filter((point) => point.kind === "truth").length, 1);
  assert.deepEqual(
    scene?.points.filter((point) => point.kind === "prediction").map((point) => point.runId),
    ["run-sol", "run-gemini"],
  );
  assert.equal(scene?.arcs.length, 2);
  assert.deepEqual(scene?.labels.map((label) => label.text), [
    "GPT-5.6 Sol · max",
    "Gemini 3.7 Flash · high, aided",
  ]);
  assert.deepEqual(scene?.paths, []);
  assert.match(scene?.arcs[0].label, /GPT-5\.6 Sol/);
  assert.match(scene?.arcs[1].label, /Gemini 3\.7 Flash/);
  assert.notDeepEqual(scene?.arcs[0].color, scene?.arcs[1].color);
});

test("condition comparison uses condition-specific labels and colors", () => {
  const comparisonRuns = [
    {
      id: "interactive",
      model: "Example model",
      comparisonLabel: "Interactive panorama",
      comparisonColorKey: "Example model:interactive-panorama",
      prediction: { lat: 48.85, lng: 2.37 },
      errorKm: 0.4,
    },
    {
      id: "covered",
      model: "Example model",
      comparisonLabel: "Static images covered",
      comparisonColorKey: "Example model:static-image-covered",
      prediction: { lat: 49.1, lng: 2.8 },
      errorKm: 41,
    },
  ];
  const scene = sceneModule.buildGlobeSceneData?.({
    cases: [paris],
    caseItem: paris,
    run: comparisonRuns[0],
    comparisonRuns,
    overview: false,
  });

  assert.deepEqual(scene.labels.map((label) => label.text), [
    "Interactive panorama",
    "Static images covered",
  ]);
  assert.notDeepEqual(scene.arcs[0].color, scene.arcs[1].color);
});

test("recording-only selections never invent a prediction or error arc", () => {
  const scene = sceneModule.buildGlobeSceneData?.({
    cases: [paris],
    caseItem: paris,
    run: {
      id: "run-recording-only",
      model: "Grok 4.6",
      prediction: null,
      exploration: { path: [] },
    },
    overview: false,
  });

  assert.equal(scene?.points.length, 1);
  assert.equal(scene?.points[0].kind, "truth");
  assert.deepEqual(scene?.arcs, []);
});

test("playback adds the travelled trace and current sample without replacing the recorded route", () => {
  const scene = sceneModule.buildGlobeSceneData?.({
    cases: [paris],
    caseItem: paris,
    run: {
      id: "run-playback",
      model: "GPT-5.6 Sol",
      prediction: { lat: 48.84, lng: 2.38 },
      errorKm: 1.8,
      exploration: {
        path: [
          { lat: 48.8521, lng: 2.3696 },
          { lat: 48.8524, lng: 2.3695 },
        ],
      },
    },
    overview: false,
    playback: {
      sample: { lat: 48.8524, lng: 2.3695, tMs: 5100 },
      trace: [
        { lat: 48.8521, lng: 2.3696 },
        { lat: 48.8524, lng: 2.3695 },
      ],
    },
  });

  assert.equal(scene?.points.at(-1).kind, "playback");
  assert.equal(scene?.points.at(-1).label, "Playback · 5.1 s");
  assert.equal(scene?.paths.length, 2);
  assert.equal(scene?.paths[1].kind, "playback");
  assert.equal(scene?.paths[1].color, "#f472b6");
});
