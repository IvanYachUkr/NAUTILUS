import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

import { loadClueDocuments, validateClueDocument } from "../scripts/lib/clues.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

test("the cleaned Gemini clue set covers every benchmark location and all three runs", async () => {
  const errors = [];
  const documents = await loadClueDocuments({ errors });
  assert.deepEqual(errors, []);
  assert.equal(documents.length, 25);

  const clues = documents.flatMap((document) => document.clueSets[0].cues);
  assert.ok(clues.length >= documents.length);
  assert.ok(documents.every((document) => document.clueSets[0].id === "gemini-3.7-flash-high-aided"));
  assert.ok(documents.every((document) => !document.clueSets[0].benchmarkId || document.clueSets[0].benchmarkId === "gemini-3-7-flash-high-aided"));
  assert.ok(documents.every((document) => document.clueSets[0].sourceRuns.length === 3));
  assert.ok(clues.some((clue) => clue.sourceRuns.length >= 2));
  assert.ok(clues.every((clue) => clue.provenance.length >= 1));
  assert.ok(clues.some((clue) => clue.annotationStatus === "reviewed"));
});

test("clue documents reject out-of-bounds regions", () => {
  const document = {
    locationId: "example--loc-001",
    clueSets: [{
      id: "example",
      model: "Example model",
      sourceRuns: [{ runId: "r1" }],
      cues: [{
        id: "cue-1",
        label: "Tower",
        text: "Tower",
        description: "A visible tower.",
        source: "starting-image",
        category: "landmark",
        annotationStatus: "needs-review",
        region: { x: 0.8, y: 0.2, w: 0.4, h: 0.2 },
        provenance: [{ runId: "r1", text: "tower" }],
      }],
    }],
  };
  assert.ok(validateClueDocument(document).some((error) => error.includes("x + width")));
});

test("clue documents accept an auditable ratings exclusion", () => {
  const document = {
    locationId: "example--loc-001",
    clueSets: [{
      id: "example",
      model: "Example model",
      sourceRuns: [{ runId: "r1" }],
      cues: [{
        id: "cue-1",
        label: "Unratable clue",
        text: "Unratable clue",
        description: "Retained for audit, but intentionally left out of ratings.",
        source: "starting-image",
        category: "landmark",
        annotationStatus: "excluded",
        region: { x: 0.1, y: 0.2, w: 0.3, h: 0.2 },
        ratingsExclusionReason: "not-ratable",
        ratingsPreviousStatus: "reviewed",
        ratingsExcludedAt: "2026-09-11T12:00:00.000Z",
        provenance: [{ runId: "r1", text: "unratable" }],
      }],
    }],
  };
  assert.deepEqual(validateClueDocument(document), []);
});

test("the local review tool can load and save validated clue documents", async () => {
  const [markup, client, server] = await Promise.all([
    readFile(join(root, "tools/clue-review/index.html"), "utf8"),
    readFile(join(root, "tools/clue-review/app.js"), "utf8"),
    readFile(join(root, "scripts/serve.mjs"), "utf8"),
  ]);
  assert.ok(markup.includes("data-stage"));
  assert.ok(markup.includes("data-inspector"));
  assert.ok(client.includes('method: "PUT"'));
  assert.ok(client.includes("data-resize"));
  assert.ok(client.includes('reviewParams.get("mode") === "ratings"'));
  assert.ok(client.includes('cue.annotationStatus === "reviewed" || cue.annotationStatus === "text-only"'));
  assert.ok(client.includes('data-action="ratings-next"'));
  assert.ok(client.includes('data-action="ratings-exclude"'));
  assert.ok(client.includes("Numpad[1-4]"));
  assert.ok(client.includes("toggleRatingShortcut"));
  assert.ok(client.includes("finalizeRatings(clue)"));
  assert.ok(client.includes("ratingMode && !isRatingCandidate(clue)"));
  assert.ok(markup.includes("records every unticked rating as No"));
  assert.ok(client.includes('ratingsExclusionReason = "not-ratable"'));
  assert.ok(client.includes("createMapController"));
  assert.equal(client.match(/\$\{ratingMapMarkup\(clue\)\}/g)?.length, 3);
  assert.ok(client.includes("cue.ratings[key] = false"));
  assert.ok(client.includes('get("condition")'));
  assert.ok(client.includes("clueSet?.imagePath ?? document.imagePath"));
  assert.ok(markup.includes('value="rating-ready"'));
  assert.ok(markup.includes('value="rating-excluded"'));
  assert.ok(server.includes('url.pathname === "/api/clues"'));
  assert.ok(server.includes("predictionsByBenchmarkId"));
  assert.ok(server.includes('request.method === "PUT" && clueDocumentMatch'));
  assert.ok(client.includes('get("clueSet")'));
});

test("covered-static clues are published after review and retain their covered input image", async () => {
  const documents = await loadClueDocuments();
  const coveredSets = documents.flatMap((document) =>
    document.clueSets.filter((set) => set.condition === "static-image-covered"),
  );
  const coveredClues = coveredSets.flatMap((set) => set.cues);

  assert.equal(coveredSets.length, 131);
  assert.equal(coveredClues.length, 599);
  assert.ok(coveredSets.every((set) => set.publicationStatus === "published"));
  assert.ok(coveredSets.every((set) => set.imagePath.startsWith("data/starting-images-covered/")));
  assert.ok(coveredClues.every((clue) => clue.source === "starting-image"));
});

test("the Grok MCP composite has grounded review drafts for every location", async () => {
  const documents = await loadClueDocuments();
  const clueSets = documents.map((document) =>
    document.clueSets.find((set) => set.id === "grok-4-6-xhigh-mcp"),
  );
  const clues = clueSets.flatMap((set) => set?.cues ?? []);

  assert.equal(clueSets.filter(Boolean).length, 25);
  assert.equal(clues.length, 62);
  assert.ok(clueSets.every((set) => set?.benchmarkId === "grok-4-6-xhigh-mcp"));
  assert.ok(clueSets.every((set) => set?.mergeStrategy === "tier-best-composite"));
  assert.ok(clueSets.every((set) => set?.sourceRuns.length === 3));
  assert.ok(clues.every((clue) => clue.provenance.length === 1));
  assert.ok(clues.every((clue) => clue.annotationStatus !== "pending-grounding"));
  assert.ok(clues.every((clue) =>
    clue.region || ["text-only", "excluded", "not-grounded"].includes(clue.annotationStatus),
  ));
});
