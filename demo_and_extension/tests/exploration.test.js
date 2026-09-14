import test from "node:test";
import assert from "node:assert/strict";
import {
  extractMovementPath,
  extractTimelineSamples,
  explorationDistanceKm,
  nearestSampleIndex,
  normalizeExploration,
  sampleToStreetView,
} from "../src/exploration.js";

test("extractMovementPath removes rotation-only duplicate positions", () => {
  const recorder = {
    recorder: { name: "Test recorder" },
    samples: [
      { lat: 59.44415, lng: 24.75288, heading: 0, tMs: 0 },
      { lat: 59.44415, lng: 24.75288, heading: 90, tMs: 250 },
      { lat: 59.44461, lng: 24.75318, heading: 90, tMs: 500 },
      { lat: 59.44461, lng: 24.75318, heading: 180, tMs: 750 },
    ],
  };

  const path = extractMovementPath(recorder);
  assert.equal(path.length, 2);
  assert.equal(path[1].lat, 59.44461);
});

test("extractTimelineSamples keeps camera-only changes", () => {
  const recorder = {
    samples: [
      { lat: 59.44415, lng: 24.75288, heading: 0, tMs: 0, zoom: 0.4 },
      { lat: 59.44415, lng: 24.75288, heading: 90, tMs: 250, zoom: 0.2 },
      { lat: 59.44461, lng: 24.75318, heading: 90, tMs: 500, zoom: 0.2 },
    ],
  };

  const samples = extractTimelineSamples(recorder);
  assert.equal(samples.length, 3);
  assert.equal(samples[1].heading, 90);
  assert.equal(samples[1].zoom, 0.2);
});

test("normalizeExploration preserves useful recorder metadata and key moments", () => {
  const recorder = {
    recorder: { name: "OpenGuessr Movement Recorder (Research)" },
    startedAt: "2026-08-07T13:26:29.280Z",
    durationMs: 32340,
    keyMoments: [{ id: "street-sign", label: "Street sign", tMs: 500, source: "agent" }],
    samples: [
      { lat: 59.44415, lng: 24.75288, tMs: 0 },
      { lat: 59.44515, lng: 24.75288, tMs: 500 },
    ],
  };

  const normalized = normalizeExploration(recorder);
  assert.equal(normalized.source, "OpenGuessr Movement Recorder (Research)");
  assert.equal(normalized.sampleCount, 2);
  assert.equal(normalized.pointCount, 2);
  assert.equal(normalized.durationMs, 32340);
  assert.equal(normalized.keyMoments[0].sampleIndex, 1);
});

test("normalizeExploration preserves image-backed playback actions and sample images", () => {
  const image = {
    path: "data/exploration-images/europe-easy/loc_001/session-x/round-01/001.png",
    captureQuality: "verified-sharp-event-frame",
    sharpness: 120.5,
  };
  const recorder = {
    condition: "interactive-panorama",
    durationMs: 1200,
    samples: [
      { lat: 48.0, lng: 14.0, tMs: 0, seq: 0, source: "api", playbackActionId: "action-001", image },
      { lat: 48.001, lng: 14.001, tMs: 1200, seq: 1, source: "api" },
    ],
    playbackActions: [
      { id: "action-001", type: "start", label: "Exploration start", tMs: 0, sampleSeq: 0, image },
    ],
    keyMoments: [
      { id: "street-sign", label: "Street sign seen", tMs: 600, image, source: "manual" },
    ],
    finalView: { tMs: 1200, image },
  };

  const normalized = normalizeExploration(recorder);
  assert.equal(normalized.samples[0].image.path, image.path);
  assert.equal(normalized.playbackActions[0].image.path, image.path);
  assert.equal(normalized.keyMoments[0].image.path, image.path);
  assert.equal(normalized.keyMoments[0].source, "manual");
  assert.equal(normalized.finalView.image.path, image.path);
});

test("explorationDistanceKm computes path distance", () => {
  const km = explorationDistanceKm({
    path: [
      { lat: 48.85837, lng: 2.29448 },
      { lat: 48.85937, lng: 2.29448 },
    ],
  });
  assert.ok(km > 0.1 && km < 0.12);
});

test("sampleToStreetView clamps recorder field of view for Google URLs", () => {
  const view = sampleToStreetView({ lat: 1, lng: 2, heading: 450, pitch: 3, fov: 109.4 });
  assert.equal(view.viewpoint.lat, 1);
  assert.equal(view.fov, 100);
});

test("nearestSampleIndex finds closest time", () => {
  const samples = [{ tMs: 0 }, { tMs: 1000 }, { tMs: 2200 }];
  assert.equal(nearestSampleIndex(samples, 1700), 2);
});

test("interactive movement path ignores late DOM spawn heartbeats that would fake a return to start", () => {
  const recorder = {
    condition: "interactive-panorama",
    captureMode: "interactive",
    samples: [
      { seq: 0, tMs: 0, lat: 48.81260, lng: 14.31298, source: "api", panoId: "start" },
      { seq: 1, tMs: 1200, lat: 48.81310, lng: 14.31360, source: "api", panoId: "moved" },
      // The embed URL still describes the spawn and can arrive later as a DOM heartbeat.
      { seq: 2, tMs: 2000, lat: 48.81260, lng: 14.31298, source: "openguessr-dom", reason: "dom_probe" },
    ],
  };

  const path = extractMovementPath(recorder);
  assert.equal(path.length, 2);
  assert.equal(path[0].source, "api");
  assert.equal(path.at(-1).panoId, "moved");
  assert.notEqual(path.at(-1).lat, path[0].lat);
});

test("interactive movement path stops at prediction intent instead of following result-screen API reset", () => {
  const recorder = {
    condition: "interactive-panorama",
    captureMode: "interactive",
    startedAt: "2026-08-08T01:00:00.000Z",
    diagnostics: {
      events: [
        { name: "prediction_intent", at: "2026-08-08T01:00:05.000Z" },
        { name: "result_visible", at: "2026-08-08T01:00:05.150Z" },
      ],
    },
    samples: [
      { seq: 0, tMs: 0, lat: 48.0, lng: 14.0, source: "api", panoId: "a" },
      { seq: 1, tMs: 4000, lat: 48.001, lng: 14.002, source: "api", panoId: "b" },
      // OpenGuessr result UI resets camera to spawn after Guess; this is not user movement.
      { seq: 2, tMs: 5100, lat: 48.0, lng: 14.0, source: "api", panoId: "a" },
    ],
  };

  const path = extractMovementPath(recorder);
  assert.equal(path.length, 2);
  assert.equal(path.at(-1).panoId, "b");
});

test("normalizeExploration preserves continuous video metadata without deriving camera-motion key events", () => {
  const recorder = {
    condition: "interactive-panorama",
    captureMode: "interactive",
    startedAt: "2026-08-08T12:00:02.000Z",
    durationMs: 4200,
    video: {
      captureId: "video-test",
      path: "data/exploration-videos/europe-easy/video-test/competition.webm",
      metadataPath: "data/exploration-videos/europe-easy/video-test/capture.json",
      mimeType: "video/webm;codecs=vp9",
      width: 1920,
      height: 1032,
      captureStartedAt: "2026-08-08T12:00:00.000Z",
      captureStartedAtMs: Date.parse("2026-08-08T12:00:00.000Z"),
      roundOffsetMs: 2000,
      crop: {
        rect: { x: 100, y: 20, width: 1720, height: 980 },
        viewport: { width: 1920, height: 1032 },
      },
    },
    samples: [
      { seq: 0, tMs: 0, lat: 48, lng: 14, heading: 0, pitch: 0, fov: 75, panoId: "a", source: "api" },
      { seq: 1, tMs: 900, lat: 48.0001, lng: 14.0001, heading: 25, pitch: 0, fov: 75, panoId: "b", source: "api" },
      { seq: 2, tMs: 2100, lat: 48.0002, lng: 14.0002, heading: 50, pitch: -12, fov: 55, panoId: "c", source: "api" },
      { seq: 3, tMs: 4100, lat: 48.0003, lng: 14.0003, heading: 50, pitch: -12, fov: 55, panoId: "d", source: "api" },
    ],
  };

  const normalized = normalizeExploration(recorder);
  assert.equal(normalized.video.path, recorder.video.path);
  assert.equal(normalized.video.roundOffsetMs, 2000);
  assert.equal(normalized.video.crop.rect.width, 1720);
  assert.equal(normalized.keyMoments.length, 0);
});


test("normalizeExploration hides legacy automatic moments but keeps semantic annotations", () => {
  const recorder = {
    condition: "interactive-panorama",
    samples: [
      { seq: 0, tMs: 0, lat: 48, lng: 14, heading: 0 },
      { seq: 1, tMs: 15000, lat: 48.001, lng: 14.001, heading: 20 },
    ],
    keyMoments: [
      { id: "exploration-start", label: "Exploration start", tMs: 0 },
      { id: "video-action-002", label: "Pan + Tilt", tMs: 2200 },
      { id: "prediction-submitted", label: "Prediction submitted", tMs: 16000 },
      { id: "street-sign-xyz", label: "Street sign XYZ seen", tMs: 15000, source: "agent", category: "text-clue" },
    ],
  };

  const normalized = normalizeExploration(recorder);
  assert.deepEqual(normalized.keyMoments.map((moment) => moment.id), ["street-sign-xyz"]);
  assert.equal(normalized.keyMoments[0].tMs, 15000);
  assert.equal(normalized.keyMoments[0].category, "text-clue");
});
