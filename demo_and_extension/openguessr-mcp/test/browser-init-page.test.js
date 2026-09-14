import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import initializeAdapter from "../browser/init-page.mjs";

test("the CDP page initializer installs the packaged adapter for the current page and future navigations", async () => {
  const expected = await readFile(
    new URL("../browser/openguessr-adapter.js", import.meta.url),
    "utf8",
  );
  const calls = [];
  const context = {
    async addInitScript(options) {
      calls.push(["addInitScript", options]);
    },
  };
  const page = {
    context: () => context,
    async evaluate(source) {
      calls.push(["evaluate", source]);
    },
  };

  await initializeAdapter({ page });

  assert.deepEqual(calls, [
    ["addInitScript", { content: expected }],
    ["evaluate", expected],
  ]);
});

test("the CDP page initializer tolerates navigation destroying the current evaluation context", async () => {
  const calls = [];
  const context = {
    async addInitScript(options) {
      calls.push(["addInitScript", options]);
    },
  };
  const page = {
    context: () => context,
    async evaluate() {
      calls.push(["evaluate"]);
      throw new Error("page.evaluate: Execution context was destroyed, most likely because of a navigation");
    },
  };

  await initializeAdapter({ page });

  assert.deepEqual(calls.map(([name]) => name), ["addInitScript", "evaluate"]);
});
