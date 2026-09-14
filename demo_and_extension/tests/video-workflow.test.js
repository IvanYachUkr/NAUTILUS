import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../extension/openguessr-research-recorder/manifest.json", import.meta.url), "utf8"));
const background = await readFile(new URL("../extension/openguessr-research-recorder/background.js", import.meta.url), "utf8");
const offscreen = await readFile(new URL("../extension/openguessr-research-recorder/offscreen.js", import.meta.url), "utf8");
const server = await readFile(new URL("../scripts/serve.mjs", import.meta.url), "utf8");
const inspector = await readFile(new URL("../src/frame-inspector.js", import.meta.url), "utf8");

 test("interactive recorder declares tab-capture/offscreen support and records WebM chunks", () => {
  assert.ok(manifest.permissions.includes("tabCapture"));
  assert.ok(manifest.permissions.includes("offscreen"));
  assert.ok(background.includes("chrome.tabCapture.getMediaStreamId"));
  assert.ok(background.includes("OGRR_VIDEO_SESSION_START"));
  assert.ok(background.includes("OGRR_VIDEO_ROUND_START"));
  assert.ok(background.includes("OGRR_VIDEO_ROUND_STOP"));
  assert.ok(offscreen.includes("new MediaRecorder"));
  assert.ok(offscreen.includes("/api/exploration-video-chunks"));
  assert.ok(offscreen.includes("/api/exploration-videos/finalize"));
  assert.ok(offscreen.includes("roundCapture"));
  assert.ok(offscreen.includes("competitionRound"));
  assert.ok(background.includes("verifyInteractiveTabCapture"));
  assert.ok(background.includes("supportsExplorationVideos"));
  assert.ok(background.includes("const STATIC_CAPTURE_MIN_WAIT_MS = 450"));
  assert.ok(background.includes("const STATIC_CAPTURE_MIN_ACCEPT_MS = 900"));
  assert.ok(background.includes("const STATIC_CAPTURE_MIN_SAMPLES = 2"));
});

test("collector exposes per-round exploration-video upload/finalize endpoints", () => {
  assert.ok(server.includes('pathname === "/api/exploration-video-chunks"'));
  assert.ok(server.includes('pathname === "/api/exploration-videos/finalize"'));
  assert.ok(server.includes("supportsExplorationVideos: true"));
  assert.ok(server.includes('[".webm", "video/webm"]'));
  assert.ok(server.includes('join(root, "data", "exploration-videos", safeCompetition, safeLocation, safeSession)'));
  assert.ok(server.includes('`round-${roundNumber}.webm`'));
});

test("legacy frame inspector remains available for older competition-wide video data", () => {
  assert.ok(inspector.includes("[-600, -450, -300, -150, 0, 150, 300, 450, 600]"));
  assert.ok(inspector.includes("scoreSharpness"));
  assert.ok(inspector.includes("captureFrame"));
  assert.ok(inspector.includes("/data/exploration-videos/"));
});


test("round video start is idempotent and collector partials are recoverable", () => {
  assert.ok(background.includes('status: "starting"'));
  assert.ok(background.includes('Claim this round synchronously BEFORE awaiting the offscreen document'));
  assert.ok(offscreen.includes('duplicateStartIgnored: true'));
  assert.ok(offscreen.includes('current.competitionRound === competitionRound'));
  assert.ok(offscreen.includes('fetchJsonWithRetry'));
  assert.ok(server.includes('chunk-${String(sequence).padStart(6, "0")}.webm'));
  assert.ok(server.includes('schemaVersion: "1.0-partial"'));
  assert.ok(server.includes('alreadyFinalized: videoAlreadyExists && metadataAlreadyExists'));
  assert.ok(server.includes('metadataRecovered: videoAlreadyExists && !metadataAlreadyExists'));
  assert.ok(background.includes('round.captureMode === "interactive" && round.videoSaveSuccess === false'));
  assert.ok(background.includes('keepInteractiveSessionUsableAfterRoundError'));
});
