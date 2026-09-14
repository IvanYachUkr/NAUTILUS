import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  assertValidCases,
  normalizeCases,
  validateCases,
} from "../src/data-contract.js";

const atlasCases = JSON.parse(
  await readFile(new URL("../data/generated/atlas-cases.json", import.meta.url), "utf8"),
);
const LOCATION_COUNT = 25;

function caseWithRun(overrides = {}) {
  return {
    ...atlasCases[0],
    runs: [
      {
        id: "test-run",
        model: "Test model",
        condition: "interactive-panorama",
        prediction: {
          lat: atlasCases[0].groundTruth.lat + 0.001,
          lng: atlasCases[0].groundTruth.lng + 0.001,
          label: "Test prediction",
        },
        hypothesis: "Synthetic test run.",
        cues: [],
        ...overrides,
      },
    ],
  };
}

test("the generated 25-location dataset satisfies the data contract", () => {
  assert.equal(atlasCases.length, LOCATION_COUNT);
  assert.deepEqual(validateCases(atlasCases), []);
  assert.doesNotThrow(() => assertValidCases(atlasCases));
});

test("every location has one competition membership and a derived Street View start", () => {
  for (const item of atlasCases) {
    assert.equal(item.competitions.length, 1, `${item.id} membership count`);
    assert.ok(Number.isFinite(item.groundTruth.lat));
    assert.ok(Number.isFinite(item.groundTruth.lng));
    assert.ok(Number.isFinite(item.startingView.heading));
    assert.ok(Number.isFinite(item.startingView.pitch));
    assert.ok(Number.isFinite(item.startingView.fov));
    assert.match(item.startingView.originalUrl, /^https:\/\/www\.google\.com\/maps\//);
  }
});

test("normalization computes an error for an imported model run", () => {
  const normalized = normalizeCases([caseWithRun()]);
  const run = normalized[0].runs[0];
  assert.equal(typeof run.errorKm, "number");
  assert.ok(run.errorKm > 0);
});

test("validation accepts omitted or null confidence scores", () => {
  assert.deepEqual(validateCases([caseWithRun({ confidence: null })]), []);
  assert.deepEqual(validateCases([caseWithRun({ confidence: undefined })]), []);
});

test("validation accepts the controlled covered-static condition and its input image", () => {
  const item = caseWithRun({
    condition: "static-image-covered",
    inputImage: {
      path: "data/starting-images-covered/google_road_marking_cover/europe-easy/loc_001.png",
      intervention: "google-road-marking-cover",
    },
  });
  assert.deepEqual(validateCases([item]), []);
});

test("validation rejects duplicate case ids", () => {
  const duplicate = [atlasCases[0], { ...atlasCases[1], id: atlasCases[0].id }];
  const errors = validateCases(duplicate);
  assert.ok(errors.some((error) => error.includes("duplicates")));
});

test("validation rejects invalid coordinates", () => {
  const invalid = [
    {
      ...atlasCases[0],
      groundTruth: { lat: 120, lng: 2.2 },
    },
  ];
  const errors = validateCases(invalid);
  assert.ok(errors.some((error) => error.includes("lat must be between -90 and 90")));
});

test("validation rejects invalid Street View fields", () => {
  const invalid = [
    {
      ...atlasCases[0],
      startingView: {
        ...atlasCases[0].startingView,
        fov: 180,
      },
    },
  ];
  const errors = validateCases(invalid);
  assert.ok(errors.some((error) => error.includes("fov must be between 10 and 100")));
});

test("recording-only runs may omit a prediction and retain playback data", () => {
  const item = caseWithRun({
    prediction: null,
    runStatus: "recording-only",
    hypothesis: "",
    exploration: {
      durationMs: 1000,
      samples: [
        {
          seq: 0,
          tMs: 0,
          lat: atlasCases[0].groundTruth.lat,
          lng: atlasCases[0].groundTruth.lng,
          heading: atlasCases[0].startingView.heading,
          pitch: atlasCases[0].startingView.pitch,
          fov: atlasCases[0].startingView.fov,
          reason: "nmpz_starting_view_recovered",
        },
      ],
    },
  });

  assert.deepEqual(validateCases([item]), []);
  const normalized = normalizeCases([item]);
  assert.equal(normalized[0].runs[0].prediction, null);
  assert.equal(normalized[0].runs[0].errorKm, null);
  assert.equal(normalized[0].runs[0].exploration.samples.length, 1);
});
