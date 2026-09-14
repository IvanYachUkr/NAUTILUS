import assert from "node:assert/strict";
import test from "node:test";

let buildImmersiveView;
let mapLegendItems;
let mapResetActionLabel;
let nextCaseId;
let previousCaseId;
let shouldShowPlaybackMarker;
let shouldFocusLocationCard;
let resolvePlaybackReviewMedia;

try {
  ({
    buildImmersiveView,
    mapLegendItems,
    mapResetActionLabel,
    nextCaseId,
    previousCaseId,
    resolvePlaybackReviewMedia,
    shouldFocusLocationCard,
    shouldShowPlaybackMarker,
  } = await import("../src/immersive-view.js"));
} catch {
  buildImmersiveView = undefined;
  mapLegendItems = undefined;
  mapResetActionLabel = undefined;
  nextCaseId = undefined;
  previousCaseId = undefined;
  resolvePlaybackReviewMedia = undefined;
  shouldFocusLocationCard = undefined;
  shouldShowPlaybackMarker = undefined;
}

const cases = [
  {
    id: "paris",
    city: "Paris",
    country: "France",
    difficulty: "easy",
    sceneType: "urban",
    startingImage: { path: "data/starting-images/paris.png" },
  },
  {
    id: "berlin",
    city: "Berlin",
    country: "Germany",
    difficulty: "medium",
    sceneType: "urban",
    startingImage: { path: "data/starting-images/berlin.png" },
  },
];

test("overview keeps the globe as the only scene and exposes dataset progress", () => {
  assert.equal(typeof buildImmersiveView, "function");

  const view = buildImmersiveView({ cases, caseItem: null, run: null });

  assert.equal(view.state, "overview");
  assert.equal(view.backgroundImage, null);
  assert.equal(view.locationCount, 2);
  assert.equal(view.progressStep, 1);
});

test("selected location promotes its real image without exposing disabled public replay", () => {
  assert.equal(typeof buildImmersiveView, "function");

  const view = buildImmersiveView({
    cases,
    caseItem: cases[0],
    run: {
      model: "GPT-5.6 Sol",
      condition: "interactive-panorama",
      prediction: { lat: 48.85, lng: 2.35 },
      errorKm: 2.24,
      exploration: { samples: [{ tMs: 0 }, { tMs: 1200 }] },
    },
  });

  assert.equal(view.state, "detail");
  assert.equal(view.backgroundImage, "data/starting-images/paris.png");
  assert.equal(view.progressStep, 4);
  assert.equal(view.model, "GPT-5.6 Sol");
  assert.equal(view.conditionLabel, "Interactive panorama");
  assert.equal(view.hasPlayback, false);
});

test("next-location navigation follows the filtered order and wraps", () => {
  assert.equal(typeof nextCaseId, "function");
  assert.equal(nextCaseId(cases, "paris"), "berlin");
  assert.equal(nextCaseId(cases, "berlin"), "paris");
  assert.equal(nextCaseId([], "paris"), null);
});

test("previous-location navigation follows the filtered order and wraps", () => {
  assert.equal(typeof previousCaseId, "function");
  assert.equal(previousCaseId(cases, "berlin"), "paris");
  assert.equal(previousCaseId(cases, "paris"), "berlin");
  assert.equal(previousCaseId([], "paris"), null);
});

test("map reset action describes the result instead of map-fitting jargon", () => {
  assert.equal(typeof mapResetActionLabel, "function");
  assert.equal(mapResetActionLabel(), "Focus on predictions");
  assert.equal(mapResetActionLabel({ hasSelection: true }), "Focus location");
  assert.equal(
    mapResetActionLabel({ hasSelection: true, hasRun: true }),
    "Focus recorded path",
  );
  assert.equal(
    mapResetActionLabel({ hasSelection: true, hasRun: true, hasPrediction: true }),
    "Focus comparison",
  );
});

test("the globe legend describes only the evidence visible in each view", () => {
  assert.equal(typeof mapLegendItems, "function");
  assert.deepEqual(mapLegendItems({ overview: true, hasPrediction: true }), [
    { kind: "locations", label: "Dataset locations · by difficulty" },
    { kind: "prediction", label: "Selected model predictions" },
    { kind: "error", label: "Pin error" },
  ]);
  assert.deepEqual(
    mapLegendItems({
      overview: false,
      hasPrediction: true,
      hasExploration: false,
    }),
    [
      { kind: "truth", label: "Ground truth" },
      { kind: "prediction", label: "Model prediction" },
      { kind: "error", label: "Pin error" },
    ],
  );
});

test("the playback marker stays out of the way until playback is active or moved", () => {
  assert.equal(typeof shouldShowPlaybackMarker, "function");
  assert.equal(shouldShowPlaybackMarker({ playing: false, index: 0, drawerMode: null }), false);
  assert.equal(shouldShowPlaybackMarker({ playing: true, index: 0, drawerMode: null }), true);
  assert.equal(shouldShowPlaybackMarker({ playing: false, index: 4, drawerMode: null }), true);
  assert.equal(shouldShowPlaybackMarker({ playing: false, index: 0, drawerMode: "playback" }), true);
});

test("location-card focus never scrolls the document after the list becomes hidden", () => {
  assert.equal(shouldFocusLocationCard({ requested: true, listHidden: false }), true);
  assert.equal(shouldFocusLocationCard({ requested: true, listHidden: true }), false);
  assert.equal(shouldFocusLocationCard({ requested: false, listHidden: false }), false);
});

test("raw recording review stays disabled while captured-frame review remains available", () => {
  assert.equal(typeof resolvePlaybackReviewMedia, "function");

  assert.deepEqual(
    resolvePlaybackReviewMedia({ videoUrl: "/data/exploration-videos/round-01.webm" }),
    { imageUrl: null, videoUrl: null, hasReview: false },
  );
  assert.deepEqual(
    resolvePlaybackReviewMedia({
      imageUrl: "/data/captured-frames/bastille.webp",
      videoUrl: "/data/exploration-videos/round-01.webm",
    }),
    {
      imageUrl: "/data/captured-frames/bastille.webp",
      videoUrl: null,
      hasReview: true,
    },
  );
});
