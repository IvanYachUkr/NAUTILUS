import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

test("overview transition keeps stats open but closes location-specific drawers", () => {
  assert.ok(source.includes('function enterOverview()'));
  assert.ok(source.includes('selectedCaseId = null;'));
  assert.ok(source.includes('if (drawerMode !== "stats")'));
  assert.ok(source.includes('clearDrawerState();'));
});

test("all overview entry points use the same drawer rule", () => {
  const calls = source.match(/enterOverview\(\);/g) ?? [];
  assert.ok(calls.length >= 5, `expected at least 5 overview transitions, found ${calls.length}`);
  assert.ok(source.includes('if (caseId === null || caseId === "all")'));
  assert.ok(source.includes('const overviewButton = event.target.closest("[data-overview]")'));
});

test("truth and prediction drawer context follows explicit location selection", () => {
  assert.ok(source.includes('if (caseItem && ["truth", "prediction"].includes(drawerMode))'));
  assert.ok(source.includes('drawerCaseId = caseItem.id;'));
  assert.ok(source.includes('drawerRunId = run?.id ?? null;'));
});
