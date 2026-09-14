import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/map-controller.js", import.meta.url), "utf8");

test("selected run hides generic location markers so truth/prediction markers receive clicks", () => {
  assert.ok(source.includes("if (overview || !selectedCase)"));
  assert.ok(source.includes("else if (!selectedRun)"));
  assert.ok(source.includes("renderComparison(selectedCase, selectedRun)"));
});

test("ground truth and prediction marker clicks stop propagation and open detail selection", () => {
  assert.ok(source.includes('selectMapDetail("truth", caseItem, run)'));
  assert.ok(source.includes('selectMapDetail("prediction", caseItem, run)'));
  assert.ok((source.match(/DomEvent\.stopPropagation/g) ?? []).length >= 2);
});

test("truth-to-prediction connector uses a dark gray tone", () => {
  assert.ok(source.includes('color: "#273444"'));
  assert.ok(source.includes("weight: 3"));
  assert.ok(source.includes("opacity: 0.96"));
});

test("static runs use a non-interactive heading marker instead of route playback", () => {
  assert.ok(source.includes("!isStaticImageCondition(selectedRun.condition)"));
  assert.ok(source.includes('renderStaticHeading(selectedCase, selectedRun)'));
  assert.ok(source.includes('interactive: false'));
  assert.ok(source.includes('headingIcon(heading, "static-heading-marker")'));
  assert.ok(source.includes('zIndexOffset: 450'));
  assert.ok(source.includes('const size = isStatic ? 78 : 46;')); 
});

test("condition comparisons can label and color runs independently of model name", () => {
  assert.ok(source.includes("run.comparisonColorKey ?? run.model"));
  assert.ok(source.includes("run.comparisonLabel ?? run.model"));
});
