import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { computeStats, summarizeClueRatings } from "../src/app.js";

const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

test("overview statistics include the selected model even when a prediction pin is missing", () => {
  assert.ok(source.includes("return filteredCases.filter((item) => chooseRun("));
  assert.ok(source.includes("renderDrawer(caseItem, run, getStatsCases(caseItem, filteredCases));"));
  assert.ok(source.includes("stats.cueRatings.visible"));
});

test("statistics stay open across overview transitions while pin-detail drawers close", () => {
  assert.ok(source.includes('function enterOverview()'));
  assert.ok(source.includes('if (drawerMode !== "stats")'));
  assert.ok(source.includes('clearDrawerState();'));
});

test("statistics identify an explicitly selected location in the current slice", () => {
  assert.ok(source.includes("selectedStatsCase"));
  assert.ok(source.includes("selectedStatsCase.city"));
});

test("clue rating summaries report positive, negative, rated, and unrated counts", () => {
  const summary = summarizeClueRatings([
    { ratings: { visible: true, correct: false } },
    { ratings: { visible: false, correct: false } },
    { ratings: { visible: true, correct: null } },
  ]);
  assert.deepEqual(summary.visible, {
    positive: 2,
    negative: 1,
    rated: 3,
    unrated: 0,
    ratio: 2 / 3,
  });
  assert.deepEqual(summary.correct, {
    positive: 0,
    negative: 2,
    rated: 2,
    unrated: 1,
    ratio: 0,
  });
});

test("location statistics omit error buckets", () => {
  assert.ok(source.includes('selectedStatsCase ? "" : `<div class="drawer-section">'));
});

test("statistics use human-review wording and suppress empty baseline explanation panels", () => {
  assert.ok(source.includes("Human-verified positive / rated clues"));
  assert.ok(source.includes('stats.cueCount ? `<div class="drawer-section">'));
  assert.ok(source.includes('stats.cueCount ? metricMarkup("Cue useful"'));
  assert.ok(!source.includes("<h4>Interactive exploration</h4>"));
});

test("prediction metrics aggregate repeated runs while cue review stays single-counted", () => {
  const stats = computeStats([{
    clueSets: [{
      id: "benchmark-a",
      benchmarkId: "benchmark-a",
      cues: [{ annotationStatus: "reviewed", ratings: { useful: true } }],
    }],
    runs: [{
      model: "Model A",
      condition: "interactive-panorama",
      benchmarkId: "benchmark-a",
      errorKm: 9,
      accuracy: { country: true },
      statisticsRuns: [
        { errorKm: 1, accuracy: { country: true } },
        { errorKm: 9, accuracy: { country: false } },
        { errorKm: 25, accuracy: { country: true } },
      ],
    }],
  }], "Model A", "interactive-panorama");

  assert.equal(stats.caseCount, 3);
  assert.equal(stats.pinRunCount, 3);
  assert.equal(stats.medianErrorKm, 9);
  assert.equal(stats.meanErrorKm, 35 / 3);
  assert.equal(stats.within25, 1);
  assert.equal(stats.countryAccuracy, 2 / 3);
  assert.equal(stats.countryRated, 3);
  assert.equal(stats.cueCount, 1);
  assert.equal(stats.cueUseful, 1);
});
