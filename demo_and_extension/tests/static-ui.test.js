import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildStreetViewUrl } from "../src/geo.js";
import { overviewPredictionRuns } from "../src/app.js";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const buildSiteSource = await readFile(new URL("../scripts/build-site.mjs", import.meta.url), "utf8");
const indexSource = await readFile(new URL("../index.html", import.meta.url), "utf8");
const storyStylesSource = await readFile(new URL("../src/story-redesign.css", import.meta.url), "utf8");
const expeditionStylesSource = await readFile(new URL("../src/expedition.css", import.meta.url), "utf8");

function styleBlock(source, selector) {
  const start = source.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `Missing style rule for ${selector}`);
  return source.slice(start, source.indexOf("}", start) + 1);
}

test("the public site suppresses playback UI and the playback drawer", () => {
  assert.ok(appSource.includes("const isStatic = isStaticImageCondition(run?.condition);"));
  assert.ok(appSource.includes("elements.explorationPlayer.hidden = true;"));
  assert.ok(appSource.includes("mapController.setPlayback(null);"));
  assert.ok(appSource.includes("EXPLORATION_PLAYBACK_ENABLED &&"));
  assert.ok(appSource.includes("if (!EXPLORATION_PLAYBACK_ENABLED) return null;"));
  assert.ok(appSource.includes("isStaticImageCondition(run.condition)"));
});

test("ground truth uses canonical static imagery while predictions keep an optional Street View link", () => {
  assert.ok(appSource.includes("No canonical scene image yet"));
  assert.ok(!appSource.includes("Open ground-truth Street View ↗"));
  assert.ok(appSource.includes("Open Street View at prediction ↗"));
  assert.ok(appSource.includes("safeStreetViewUrl(run.prediction)"));
});

test("prediction details pair best-run facts with model-specific image highlights", () => {
  assert.ok(appSource.includes("What this model noticed"));
  assert.ok(appSource.includes("run.bestRunPoints"));
  assert.ok(appSource.includes("run.benchmarkMeanPoints"));
  assert.ok(appSource.includes("data-highlight-clue-id"));
  assert.ok(appSource.includes("item.benchmarkId === run.benchmarkId"));
  assert.ok(appSource.includes("renderEvidenceView(caseItem, run, comparisonRuns)"));
  assert.ok(appSource.includes("data-evidence-view"));
  assert.ok(appSource.includes("data-open-model-evidence"));
  assert.ok(appSource.includes("evidenceMarksMarkup(grounded, selectedCueId, evidenceComparisonMode)"));
  assert.ok(appSource.includes("data-side-comparison-map"));
  assert.ok(appSource.includes("data-toggle-comparison-map-fullscreen"));
  assert.ok(appSource.includes("setComparisonMapFullscreen(!comparisonMapFullscreen)"));
  assert.ok(appSource.includes("data-compare-model"));
  assert.ok(appSource.includes("data-open-comparison-evidence"));
  assert.ok(appSource.includes("data-close-text-clues"));
  assert.ok(appSource.includes("data-close-evidence-detail"));
  assert.ok(appSource.includes("ratingPills(selected.clue.ratings)"));
  assert.ok(appSource.includes("selectedCueId === nextCueId ? null : nextCueId"));
  assert.match(expeditionStylesSource, /\.evidence-marks\s*\{[^}]*z-index:\s*1;/s);
  assert.match(expeditionStylesSource, /\.evidence-clue-detail,[\s\S]*?z-index:\s*18;/s);
});

test("the detail header project button blends into the location header", () => {
  assert.match(expeditionStylesSource, /\.atlas-app\[data-view-state="detail"\] \.site-jump\s*\{[^}]*background:\s*transparent;/s);
});

test("interactive playback keeps restorable video review code behind the website feature gate", () => {
  assert.ok(appSource.includes("Review captured frame"));
  assert.ok(appSource.includes("resolvePlaybackReviewMedia"));
  assert.ok(appSource.includes('event.target.closest("[data-open-current-view]")'));
  assert.ok(appSource.includes('drawerMode = "playback";'));
  assert.ok(appSource.includes("evidenceVideoMarkup"));
  assert.ok(appSource.includes("data-inline-round-video"));
  assert.ok(appSource.includes("primeInlineVideos"));
  assert.ok(appSource.includes("The player contains only this location/round"));
  assert.ok(!appSource.includes("Inspect recorded frame ↗"));
  assert.ok(!appSource.includes("Open this Street View ↗"));
});

test("key moments seek the embedded round video to their exact timestamp", () => {
  assert.ok(appSource.includes("data-moment-time-ms"));
  assert.ok(appSource.includes("exactTimeMs"));
  assert.ok(appSource.includes("drawerSeekMs"));
  assert.ok(appSource.includes("playbackDrawerMarkup(sample, run, drawerSeekMs)"));
  assert.ok(appSource.includes("formatSeconds(playbackTimeMs)"));
});

test("playback drawer stays open when switching locations", () => {
  assert.ok(appSource.includes('["stats", "truth", "prediction", "playback"].includes(drawerMode)'));
  assert.ok(appSource.includes("drawerCaseId = caseItem?.id ?? null"));
  assert.ok(appSource.includes("drawerRunId = run?.id ?? null"));
});

test("prediction coordinates create a Google Street View deep link", () => {
  const url = new URL(buildStreetViewUrl({ lat: 48.737710577671855, lng: 15.1171875 }));
  assert.equal(url.hostname, "www.google.com");
  assert.equal(url.searchParams.get("map_action"), "pano");
  assert.equal(url.searchParams.get("viewpoint"), "48.737710577671855,15.1171875");
});


test("map overview only includes cases with a prediction for the selected run slice", () => {
  const cases = [
    {
      id: "matching",
      runs: [{
        id: "grok-match",
        model: "Grok 4.6 · xhigh",
        condition: "interactive-panorama",
        runKind: "model-prediction",
        prediction: { lat: 48, lng: 14 },
      }],
    },
    {
      id: "wrong-model",
      runs: [{
        id: "sol-only",
        model: "GPT-5.6 Sol · xhigh",
        condition: "interactive-panorama",
        runKind: "model-prediction",
        prediction: { lat: 49, lng: 15 },
      }],
    },
    {
      id: "missing-pin",
      runs: [{
        id: "grok-no-pin",
        model: "Grok 4.6 · xhigh",
        condition: "interactive-panorama",
        runKind: "model-prediction",
        prediction: null,
      }],
    },
  ];

  assert.deepEqual(
    overviewPredictionRuns(cases, "Grok 4.6 · xhigh", "interactive-panorama")
      .map((entry) => entry.caseId),
    ["matching"],
  );
  assert.ok(appSource.includes("${filteredCases.length} benchmark location"));
  assert.ok(!appSource.includes("${overviewRuns.length} prediction"));
});

test("detail runtime labels distinguish batched static evaluation from missing interactive timing", () => {
  assert.ok(appSource.includes('? "Batch processed"'));
  assert.ok(appSource.includes(': "Unavailable";'));
  assert.ok(appSource.includes("Images were evaluated in batches, so per-location runtime is not comparable."));
  assert.ok(!appSource.includes('"Not recorded"'));
});

test("detail utilities keep statistics in the top-right overlay and use a count badge", () => {
  assert.ok(appSource.includes("elements.mapUtilityActions"));
  assert.ok(!appSource.includes("isNarrowDetailViewport()\n      ? elements.leftRailStatsSlot"));
  assert.ok(appSource.includes("compareConditionsCount.textContent = conditionCount ? String(conditionCount) : \"\""));
  assert.ok(!appSource.includes('` · ${conditionCount}`'));
  assert.match(expeditionStylesSource, /data-view-state="detail"[^}]*\.map-utility-actions\s*\{[^}]*top:\s*20px;[^}]*right:\s*20px;/s);
  assert.match(expeditionStylesSource, /\.scene-clue-summary\s*\{[^}]*width:\s*min\(760px, calc\(100% - 190px\)\);/s);
});

test("static/NMPZ never creates a map playback descriptor", () => {
  assert.ok(appSource.includes("if (isStaticImageCondition(run?.condition)) return null;"));
});


test("static direction remains visible without re-enabling playback", async () => {
  const mapSource = await readFile(new URL("../src/map-controller.js", import.meta.url), "utf8");
  const cssSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.ok(mapSource.includes("renderStaticHeading(selectedCase, selectedRun)"));
  assert.ok(cssSource.includes(".static-heading-marker { pointer-events: none !important; }"));
  assert.ok(cssSource.includes(".static-heading-marker .playback-marker__wrap"));
  assert.ok(cssSource.includes("width: 78px;"));
  assert.ok(mapSource.includes("const size = isStatic ? 78 : 46;"));
  assert.ok(appSource.includes("if (isStaticImageCondition(run?.condition)) return null;"));
});

test("covered static images are selectable and support same-model condition comparison", () => {
  assert.ok(appSource.includes('"static-image-covered": "Static images covered"'));
  assert.ok(appSource.includes("data-toggle-condition-comparison"));
  assert.ok(appSource.includes("conditionComparisonMode"));
  assert.ok(appSource.includes("comparisonColorKey(item, true)"));
  assert.ok(appSource.includes("elements.compareConditionsButton.hidden = !caseItem || evidenceMode;"));
  assert.ok(appSource.includes("elements.compareConditionsButton.disabled = conditionCount < 2;"));
  assert.ok(appSource.includes("elements.conditionSelect.disabled = conditions.length <= 1;"));
});

test("view changes inside the explorer cannot move the long project page through scroll anchoring", async () => {
  const cssSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(cssSource, /\.atlas-app\s*\{[^}]*overflow-anchor:\s*none;/s);
});

test("the full-site header returns to a two-column grid at narrow viewports", async () => {
  const cssSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  const finalNarrowBlock = cssSource.slice(cssSource.lastIndexOf("@media (max-width: 900px)"));

  assert.match(finalNarrowBlock, /\.app-header\s*\{[^}]*grid-template-columns:\s*1fr auto;/s);
  assert.match(finalNarrowBlock, /\.header-actions\s*\{[^}]*justify-self:\s*end;/s);
});

test("the mobile story navigation scrolls without exposing native scrollbars", async () => {
  const cssSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(cssSource, /\.story-nav__links\s*\{[^}]*scrollbar-width:\s*none;/s);
  assert.match(cssSource, /\.story-nav__links::\-webkit-scrollbar\s*\{[^}]*display:\s*none;/s);
});

test("interface text stays at least 16px across desktop and mobile styles", async () => {
  for (const filename of ["styles.css", "story-redesign.css", "expedition.css"]) {
    const css = await readFile(new URL(`../src/${filename}`, import.meta.url), "utf8");
    for (const match of css.matchAll(/font-size:\s*([\d.]+)(px|rem)\b/g)) {
      const pixels = Number(match[1]) * (match[2] === "rem" ? 16 : 1);
      assert.ok(pixels >= 16, `${filename}: ${match[0]} is too small`);
    }
  }
});

test("the document requests the enlarged story typography stylesheet revision", () => {
  assert.ok(indexSource.includes('./src/story-redesign.css?v=9-1'));
});

test("the workflow navigation connects evenly centered controls instead of label-sized fragments", async () => {
  const cssSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  const progressBlock = cssSource.slice(
    cssSource.indexOf(".journey-progress {"),
    cssSource.indexOf(".header-stats"),
  );

  assert.match(progressBlock, /\.journey-progress button\s*\{[^}]*justify-items:\s*center;/s);
  assert.match(
    progressBlock,
    /\.journey-progress li:not\(:last-child\)::after\s*\{[^}]*left:\s*50%;[^}]*width:\s*100%;/s,
  );
  assert.doesNotMatch(cssSource, /\.journey-progress li:not\(:last-child\)::after\s*\{[^}]*left:\s*calc\(100%/s);
});

test("the mobile run method cards reserve separate columns for icon, label, and number", () => {
  const journeyCardRule = expeditionStylesSource.indexOf("grid-template-columns: 32px minmax(0, 1fr) auto");
  const mobileStart = expeditionStylesSource.lastIndexOf("@media (max-width: 680px)", journeyCardRule);
  const mobileEnd = expeditionStylesSource.indexOf("@media (min-width: 681px)", mobileStart);
  const mobileStyles = expeditionStylesSource.slice(mobileStart, mobileEnd);

  assert.match(mobileStyles, /\.journey-progress\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(mobileStyles, /\.journey-progress button\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*32px\s+minmax\(0,\s*1fr\)\s+auto;[^}]*grid-template-rows:\s*1fr;[^}]*border:\s*1px solid[^}]*border-radius:\s*16px[^}]*linear-gradient/s);
  assert.match(mobileStyles, /\.journey-progress button > i\s*\{[^}]*grid-column:\s*1;[^}]*grid-row:\s*1;[^}]*border-radius:\s*50%/s);
  assert.match(mobileStyles, /\.journey-progress button b\s*\{[^}]*grid-column:\s*2;[^}]*grid-row:\s*1;[^}]*font-size:\s*1rem;[^}]*text-align:\s*left;/s);
  assert.match(mobileStyles, /\.journey-progress button span\s*\{[^}]*display:\s*block;[^}]*grid-column:\s*3;[^}]*grid-row:\s*1;[^}]*justify-self:\s*end;[^}]*font-family:\s*var\(--display-font\)/s);
  assert.doesNotMatch(mobileStyles, /\.journey-progress button::after\s*\{/s);
  assert.match(mobileStyles, /\.journey-progress li:not\(:last-child\)::after\s*\{[^}]*display:\s*none/s);
  assert.match(mobileStyles, /\.journey-progress button:focus-visible\s*\{[^}]*outline:/s);
  assert.match(expeditionStylesSource, /@keyframes\s+journey-card-arrive/);
  assert.match(expeditionStylesSource, /prefers-reduced-motion:\s*reduce[^}]*\.journey-progress li\s*\{[^}]*animation:\s*none/s);

  const narrowStart = expeditionStylesSource.indexOf("@media (max-width: 360px)", mobileStart);
  const narrowEnd = expeditionStylesSource.indexOf("@media (prefers-reduced-motion", narrowStart);
  const narrowStyles = expeditionStylesSource.slice(narrowStart, narrowEnd);
  assert.match(narrowStyles, /\.journey-progress button\s*\{[^}]*grid-template-columns:\s*24px\s+minmax\(0,\s*1fr\)\s+auto;[^}]*column-gap:\s*3px;[^}]*padding:\s*5px\s+3px;/s);
  assert.match(narrowStyles, /\.journey-progress button b\s*\{[^}]*font-size:\s*1rem;[^}]*letter-spacing:\s*-\.04em;[^}]*white-space:\s*nowrap;/s);

  for (const icon of ["ph-eye", "ph-lightbulb", "ph-binoculars", "ph-map-pin"]) {
    assert.ok(appSource.includes(icon), `Missing method icon ${icon}`);
  }
});

test("the public website keeps raw recording review disabled and out of its package", () => {
  assert.ok(appSource.includes("resolvePlaybackReviewMedia"));
  assert.ok(appSource.includes("elements.openCurrentView.hidden = !reviewMedia.hasReview;"));
  assert.ok(!appSource.includes("Review round recording"));
  assert.ok(!appSource.includes("No round video yet"));
  assert.ok(!appSource.includes("Video time"));

  assert.ok(buildSiteSource.includes("const RECORDING_REVIEW_ENABLED = false;"));
  assert.ok(buildSiteSource.includes("if (RECORDING_REVIEW_ENABLED)"));
  assert.ok(buildSiteSource.includes('normalized.startsWith("data/recordings/")'));
});
