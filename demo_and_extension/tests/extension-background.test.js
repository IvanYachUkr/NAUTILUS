import test from "node:test";
import assert from "node:assert/strict";

const localStore = new Map();
const sessionStore = new Map();
let messageListener = null;
let actionClickListener = null;
let activeProbe = null;
const fetchCalls = [];
const roundVideoStartCalls = [];
let roundVideoStartDelayMs = 0;

function storageArea(store) {
  return {
    async get(key) {
      if (typeof key === "string") return { [key]: store.get(key) };
      return Object.fromEntries(store);
    },
    async set(values) {
      for (const [key, value] of Object.entries(values)) store.set(key, value);
    },
    async remove(key) {
      store.delete(key);
    },
  };
}

globalThis.chrome = {
  runtime: {
    onInstalled: { addListener() {} },
    onMessage: {
      addListener(listener) {
        messageListener = listener;
      },
    },
    async getContexts() {
      return [{ contextType: "OFFSCREEN_DOCUMENT", documentUrl: "chrome-extension://test/offscreen.html" }];
    },
    async sendMessage(message) {
      if (message?.target === "ogrr-offscreen" && ["OGRR_VIDEO_SESSION_START", "OGRR_VIDEO_START"].includes(message.type)) {
        const readyAtMs = Date.now();
        return {
          ok: true,
          status: "ready",
          streamSessionId: message.streamSessionId ?? "mock-stream-session",
          competitionId: message.competitionId,
          readyAt: new Date(readyAtMs).toISOString(),
          readyAtMs,
          mimeType: "video/webm;codecs=vp9",
          width: 1920,
          height: 1032,
        };
      }
      if (message?.target === "ogrr-offscreen" && message.type === "OGRR_VIDEO_ROUND_START") {
        roundVideoStartCalls.push(structuredClone(message));
        if (roundVideoStartDelayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, roundVideoStartDelayMs));
        }
        const startedAtMs = Date.now();
        return {
          ok: true,
          status: "recording",
          captureId: message.captureId,
          competitionId: message.competitionId,
          competitionRound: message.competitionRound,
          sessionId: message.sessionId,
          roundId: message.roundId,
          startedAt: new Date(startedAtMs).toISOString(),
          startedAtMs,
          mimeType: "video/webm;codecs=vp9",
          width: 1920,
          height: 1032,
        };
      }
      if (message?.target === "ogrr-offscreen" && message.type === "OGRR_VIDEO_ROUND_STOP") {
        const stoppedAtMs = Date.now();
        return {
          ok: true,
          status: "stopped",
          captureId: message.captureId,
          stoppedAt: new Date(stoppedAtMs).toISOString(),
          stoppedAtMs,
          path: `data/exploration-videos/europe-easy/loc_001/session-test/round-01.webm`,
          metadataPath: `data/exploration-videos/europe-easy/loc_001/session-test/round-01.json`,
          locationId: "loc_001",
        };
      }
      if (message?.target === "ogrr-offscreen" && message.type === "OGRR_VIDEO_STATUS") {
        return {
          ok: true,
          status: "ready",
          streamSessionId: "mock-stream-session",
          roundRecording: false,
        };
      }
      if (message?.target === "ogrr-offscreen" && ["OGRR_VIDEO_SESSION_STOP", "OGRR_VIDEO_STOP"].includes(message.type)) {
        return {
          ok: true,
          status: "stopped",
          stoppedAt: new Date().toISOString(),
        };
      }
      return { ok: true };
    },
  },
  offscreen: {
    async createDocument() {},
  },
  action: {
    onClicked: {
      addListener(listener) {
        actionClickListener = listener;
      },
    },
    async setBadgeText() {},
  },
  tabCapture: {
    onStatusChanged: { addListener() {} },
    async getMediaStreamId() {
      return "mock-tab-stream-id";
    },
    async getCapturedTabs() {
      return [{ tabId: 1, status: "active" }];
    },
  },
  tabs: {
    onRemoved: { addListener() {} },
    async query() {
      return [{ id: 1, active: true, windowId: 1, url: "https://www.openguessr.com/competitions/example" }];
    },
    async get(tabId) {
      return { id: tabId, active: true, windowId: 1, url: "https://www.openguessr.com/competitions/example" };
    },
    async sendMessage(_tabId, message) {
      if (message?.type === "OGRR_PROBE_PAGE") {
        return { ok: true, probe: activeProbe };
      }
      if (message?.type === "OGRR_BEGIN_STATIC_CAPTURE") {
        // Static-image capture is integration-tested in the browser; keep these
        // state-machine unit tests fast and deterministic.
        return { ok: false, error: "static capture disabled in unit test" };
      }
      if (message?.type === "OGRR_GET_INTERACTIVE_VIDEO_RECT") {
        return {
          ok: true,
          rect: { x: 0, y: 0, width: 1920, height: 1032 },
          viewport: { width: 1920, height: 1032 },
          target: { source: "unit-test", tagName: "DIV" },
        };
      }
      return { ok: true };
    },
  },
  storage: {
    local: storageArea(localStore),
    session: storageArea(sessionStore),
  },
  downloads: {
    async download() {
      return 1;
    },
  },
};

globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input));
  const body = init.body ? JSON.parse(init.body) : null;
  fetchCalls.push({ url: url.pathname, body });

  if (url.pathname === "/api/recordings") {
    const round = body.round.index + 1;
    return new Response(
      JSON.stringify({
        ok: true,
        path: `data/recordings/inbox/europe-easy/loc_${String(round).padStart(3, "0")}/round.json`,
        locationId: `loc_${String(round).padStart(3, "0")}`,
        competitionPartId: "europe-easy",
        competitionRound: round,
        competitionOverallIndex: round,
        competitionLocationCount: 8,
        locationMatchDistanceMeters: 0.5,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  }

  if (url.pathname === "/api/checkpoints") {
    return new Response(
      JSON.stringify({
        ok: true,
        path: `data/recordings/checkpoints/europe-easy/test/${body.id}.json`,
        checkpointId: body.id,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  }

  if (url.pathname === "/api/sessions") {
    return new Response(
      JSON.stringify({
        ok: true,
        path: `data/recordings/sessions/europe-easy/${body.sessionId}.json`,
        sessionId: body.sessionId,
        roundCount: body.rounds.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  if (url.pathname === "/api/health") {
    return new Response(
      JSON.stringify({
        ok: true,
        locations: 25,
        supportsExplorationVideos: true,
        competitions: [{ id: "europe-easy", name: "Easy", count: 8 }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ ok: false }), { status: 404 });
};

await import(`../extension/openguessr-research-recorder/background.js?test=${Date.now()}`);

function send(message, sender = { tab: { id: 1 } }) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`No response for ${message.type}`)), 2000);
    const keepAlive = messageListener(message, sender, (response) => {
      clearTimeout(timeout);
      resolve(response);
    });
    assert.equal(keepAlive, true);
  });
}

function recorderEvent(source, event, payload) {
  return send({ type: "OGRR_EVENT", source, event, payload });
}

async function arm(setup = {}, { confirmStart = true } = {}) {
  const response = await send({ type: "OGRR_ARM_ACTIVE", setup });
  assert.equal(response.ok, true);
  assert.equal(response.status.recordingArmed, true);
  if (confirmStart) {
    await recorderEvent("openguessr-page", "competition-start-intent", {
      label: "Start competition",
      at: new Date().toISOString(),
    });
  }
  return response;
}

test("interactive in-page Arm only stores setup; one toolbar action click authorizes video and completes arming", async () => {
  await send({ type: "OGRR_RESET_ACTIVE" });
  await send({
    type: "OGRR_SAVE_SETTINGS",
    settings: {
      enabled: true,
      competitionId: "europe-easy",
      model: "manual",
      condition: "interactive-panorama",
      collectorUrl: "http://127.0.0.1:4173/api/recordings",
      fallbackDownload: true,
      downloadSubfolder: "openguessr-research-recordings",
    },
  });

  const prepared = await send({
    type: "OGRR_ARM_INTERACTIVE_TAB",
    setup: { competitionId: "europe-easy", model: "manual", condition: "interactive-panorama" },
  });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.pending, true);
  assert.equal(prepared.status.recordingArmed, false);
  assert.equal(prepared.status.videoCapture.status, "authorization-required");
  assert.equal(typeof actionClickListener, "function");

  await actionClickListener({
    id: 1,
    active: true,
    windowId: 1,
    url: "https://www.openguessr.com/competitions/example",
  });
  await new Promise((resolve) => setTimeout(resolve, 0));

  const armed = await send({ type: "OGRR_GET_STATUS" });
  assert.equal(armed.status.recordingArmed, true);
  assert.equal(armed.status.videoCapture.status, "ready");
});

test("concurrent Street View samples start only one MediaRecorder for the same interactive round", async () => {
  await send({ type: "OGRR_RESET_ACTIVE" });
  roundVideoStartCalls.length = 0;
  roundVideoStartDelayMs = 40;

  await send({
    type: "OGRR_SAVE_SETTINGS",
    settings: {
      enabled: true,
      competitionId: "europe-easy",
      model: "manual",
      condition: "interactive-panorama",
      collectorUrl: "http://127.0.0.1:4173/api/recordings",
      fallbackDownload: true,
      downloadSubfolder: "openguessr-research-recordings",
    },
  });
  const prepared = await send({
    type: "OGRR_ARM_INTERACTIVE_TAB",
    setup: { competitionId: "europe-easy", model: "manual", condition: "interactive-panorama" },
  });
  assert.equal(prepared.pending, true);
  await actionClickListener({
    id: 1,
    active: true,
    windowId: 1,
    url: "https://www.openguessr.com/competitions/example",
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  await recorderEvent("openguessr-page", "competition-start-intent", {
    label: "Start competition",
    at: new Date().toISOString(),
  });
  await recorderEvent("openguessr-page", "dom-probe", {
    trigger: "heartbeat",
    at: new Date().toISOString(),
    atMs: Date.now(),
    pageUrl: "https://openguessr.com/",
    pathname: "/",
    pageState: "round",
    roundLikelyActive: true,
    guessControlVisible: true,
    nextControlVisible: false,
    resultVisible: false,
    roundNumber: 1,
    roundTotal: 8,
    modeHint: "streetview",
    primaryView: { lat: 48.8521298, lng: 2.3696389, heading: 347.03, fov: 90 },
  });

  const now = Date.now();
  const sample = {
    lat: 48.8521298,
    lng: 2.3696389,
    heading: 347.03,
    pitch: 0,
    zoom: 1,
    fov: 90,
    panoId: "pano-round-1",
    frameInstanceId: "interactive-round-1",
    capturedAt: new Date(now).toISOString(),
    capturedAtMs: now,
    source: "google-maps-api",
    reason: "sample",
  };

  await Promise.all([
    recorderEvent("google-frame", "sample", sample),
    recorderEvent("google-frame", "sample", { ...sample, heading: 348, capturedAtMs: now + 5 }),
  ]);

  assert.equal(roundVideoStartCalls.length, 1);
  const status = await send({ type: "OGRR_GET_STATUS" });
  assert.equal(status.status.currentRound.video.status, "recording");
  roundVideoStartDelayMs = 0;
});

test("interactive pre-game Street View preview cannot consume formal round 1", async () => {
  await send({ type: "OGRR_RESET_ACTIVE" });
  roundVideoStartCalls.length = 0;
  await send({
    type: "OGRR_SAVE_SETTINGS",
    settings: {
      enabled: true,
      competitionId: "europe-easy",
      model: "manual",
      condition: "interactive-panorama",
      collectorUrl: "http://127.0.0.1:4173/api/recordings",
      fallbackDownload: true,
      downloadSubfolder: "openguessr-research-recordings",
    },
  });
  const prepared = await send({
    type: "OGRR_ARM_INTERACTIVE_TAB",
    setup: { competitionId: "europe-easy", model: "manual", condition: "interactive-panorama" },
  });
  assert.equal(prepared.pending, true);
  await actionClickListener({ id: 1, active: true, windowId: 1, url: "https://openguessr.com/" });
  await new Promise((resolve) => setTimeout(resolve, 0));
  await recorderEvent("openguessr-page", "competition-start-intent", {
    label: "Start competition",
    at: new Date().toISOString(),
  });

  const previewAt = Date.now();
  await recorderEvent("google-frame", "sample", {
    lat: 1, lng: 2, heading: 0, pitch: 0, fov: 90, panoId: "preview",
    frameInstanceId: "preview-frame", capturedAt: new Date(previewAt).toISOString(),
    capturedAtMs: previewAt, source: "api", reason: "sample",
  });
  let status = await send({ type: "OGRR_GET_STATUS" });
  assert.equal(status.status.currentRound, null);
  assert.equal(roundVideoStartCalls.length, 0);

  const liveAt = previewAt + 1000;
  await recorderEvent("openguessr-page", "dom-probe", {
    trigger: "heartbeat", at: new Date(liveAt).toISOString(), atMs: liveAt,
    pageUrl: "https://openguessr.com/", pathname: "/", pageState: "round",
    roundLikelyActive: true, guessControlVisible: true, nextControlVisible: false,
    resultVisible: false, roundNumber: 1, roundTotal: 8, modeHint: "streetview",
    primaryView: { lat: 48.8521298, lng: 2.3696389, heading: 347.03, fov: 90 },
  });
  await recorderEvent("google-frame", "sample", {
    lat: 48.8521298, lng: 2.3696389, heading: 347.03, pitch: 0, fov: 90, panoId: "live",
    frameInstanceId: "live-frame", capturedAt: new Date(liveAt + 20).toISOString(),
    capturedAtMs: liveAt + 20, source: "api", reason: "sample",
  });
  status = await send({ type: "OGRR_GET_STATUS" });
  assert.equal(status.status.currentRound.competitionRound, 1);
  assert.equal(status.status.currentRound.index, 0);
  assert.equal(roundVideoStartCalls.length, 1);
});

test("an enabled but unarmed recorder ignores competition-list Street View candidates", async () => {
  await send({ type: "OGRR_RESET_ACTIVE" });
  fetchCalls.length = 0;
  await send({
    type: "OGRR_SAVE_SETTINGS",
    settings: {
      enabled: true,
      competitionId: "europe-easy",
      model: "manual",
      condition: "static-image",
      collectorUrl: "http://127.0.0.1:4173/api/recordings",
      fallbackDownload: true,
      downloadSubfolder: "openguessr-research-recordings",
    },
  });

  await recorderEvent("openguessr-page", "dom-probe", {
    trigger: "heartbeat",
    at: new Date().toISOString(),
    atMs: Date.now(),
    pageUrl: "https://openguessr.com/competitions",
    pathname: "/competitions",
    title: "Competitions - OpenGuessr",
    pageState: "round",
    roundLikelyActive: true,
    guessControlVisible: false,
    nextControlVisible: false,
    resultVisible: false,
    roundNumber: null,
    roundTotal: null,
    modeHint: "nmpz",
    primaryView: { lat: 53.37844, lng: -111.79701, heading: 180.5, fov: 90 },
    diagnostics: { streetViewCandidateCount: 1, nmpzTextDetected: true },
  });
  await recorderEvent("google-frame", "frame-ready", {
    frameInstanceId: "background-frame",
    spawnRequested: { lat: 53.37844, lng: -111.79701, heading: 180.5, fov: 90 },
    at: new Date().toISOString(),
  });

  const status = await send({ type: "OGRR_GET_STATUS" });
  assert.equal(status.status.recordingArmed, false);
  assert.equal(status.status.currentRound, null);
  assert.equal(fetchCalls.filter((call) => call.url === "/api/recordings").length, 0);
});

test("arming waits for the actual OpenGuessr start action before accepting round frames", async () => {
  await send({ type: "OGRR_RESET_ACTIVE" });
  fetchCalls.length = 0;
  await send({
    type: "OGRR_SAVE_SETTINGS",
    settings: {
      enabled: true,
      competitionId: "europe-easy",
      model: "manual",
      condition: "static-image",
      collectorUrl: "http://127.0.0.1:4173/api/recordings",
      fallbackDownload: true,
      downloadSubfolder: "openguessr-research-recordings",
    },
  });
  await arm({}, { confirmStart: false });

  const spawn = { lat: 53.37844, lng: -111.79701, heading: 180.5, fov: 90 };
  await recorderEvent("google-frame", "frame-ready", {
    frameInstanceId: "lobby-background-frame",
    spawnRequested: spawn,
    at: new Date().toISOString(),
  });
  let status = await send({ type: "OGRR_GET_STATUS" });
  assert.equal(status.status.recordingArmed, true);
  assert.equal(status.status.competitionStartConfirmed, false);
  assert.equal(status.status.currentRound, null);

  await recorderEvent("openguessr-page", "competition-start-intent", {
    label: "Start competition",
    at: new Date().toISOString(),
  });
  await recorderEvent("google-frame", "frame-ready", {
    frameInstanceId: "real-round-frame",
    spawnRequested: { lat: 48.8521298, lng: 2.3696389, heading: 347.03, fov: 90 },
    at: new Date().toISOString(),
  });
  status = await send({ type: "OGRR_GET_STATUS" });
  assert.equal(status.status.competitionStartConfirmed, true);
  assert.equal(status.status.currentRound.index, 0);
});

test("the extension automatically records a full eight-round competition as separate rounds and one session manifest", { timeout: 10000 }, async () => {
  await send({ type: "OGRR_RESET_ACTIVE" });
  fetchCalls.length = 0;
  await send({
    type: "OGRR_SAVE_SETTINGS",
    settings: {
      enabled: true,
      competitionId: "europe-easy",
      model: "GPT-5.6 Sol",
      condition: "interactive-panorama",
      collectorUrl: "http://127.0.0.1:4173/api/recordings",
      fallbackDownload: true,
      downloadSubfolder: "openguessr-research-recordings",
    },
  });
  await arm();

  await recorderEvent("openguessr-page", "page-context", {
    pageUrl: "https://www.openguessr.com/competitions/example",
    competitionHint: "example",
    at: new Date().toISOString(),
  });

  let sessionId = null;
  for (let index = 0; index < 8; index += 1) {
    const frameInstanceId = `frame-${index + 1}`;
    const started = Date.now();
    const spawn = {
      frameInstanceId,
      lat: 48 + index * 0.01,
      lng: 2 + index * 0.01,
      heading: 10,
      pitch: 0,
      fov: 75,
      panoId: `pano-${index + 1}`,
      at: new Date(started).toISOString(),
    };

    await recorderEvent("openguessr-page", "dom-probe", {
      trigger: "heartbeat",
      at: spawn.at,
      atMs: started,
      pageUrl: "https://www.openguessr.com/competitions/example",
      pathname: "/competitions/example",
      pageState: "round",
      roundLikelyActive: true,
      guessControlVisible: true,
      nextControlVisible: false,
      resultVisible: false,
      roundNumber: index + 1,
      roundTotal: 8,
      modeHint: "streetview",
      primaryView: spawn,
    });
    await recorderEvent("google-frame", "frame-ready", {
      frameInstanceId,
      spawnRequested: spawn,
      at: spawn.at,
    });
    await recorderEvent("google-frame", "sample", {
      ...spawn,
      capturedAt: new Date(started + 20).toISOString(),
      capturedAtMs: started + 20,
      source: "api",
      reason: "attached",
    });
    await recorderEvent("openguessr-page", "prediction-candidate", {
      lat: 48.5 + index * 0.01,
      lng: 2.5 + index * 0.01,
      transport: "fetch",
      requestPath: "https://www.openguessr.com/api/guess",
      detectedAt: new Date(started + 100).toISOString(),
    });
    await recorderEvent("openguessr-page", "round-advance-intent", {
      label: "Next round",
      at: new Date(started + 120).toISOString(),
    });

    await new Promise((resolve) => setTimeout(resolve, 330));
    const response = await send({ type: "OGRR_GET_STATUS" });
    assert.equal(response.ok, true);
    assert.equal(response.status.currentRound, null);
    assert.equal(response.status.session.completedRoundCount, index + 1);
    assert.equal(response.status.session.expectedRoundCount, 8);
    sessionId ??= response.status.session.id;
    assert.equal(response.status.session.id, sessionId);
  }

  const recordingPosts = fetchCalls.filter((call) => call.url === "/api/recordings");
  const sessionPosts = fetchCalls.filter((call) => call.url === "/api/sessions");
  assert.equal(recordingPosts.length, 8);
  assert.equal(sessionPosts.length, 8);
  assert.deepEqual(recordingPosts.map((call) => call.body.round.index), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.ok(recordingPosts.every((call) => call.body.sessionId === sessionId));

  const lastManifest = sessionPosts.at(-1).body;
  assert.equal(lastManifest.status, "complete");
  assert.equal(lastManifest.completedRoundCount, 8);
  assert.equal(lastManifest.expectedRoundCount, 8);
  assert.equal(lastManifest.rounds.length, 8);

  const finalStatus = await send({ type: "OGRR_GET_STATUS" });
  assert.equal(finalStatus.status.session.status, "complete");

  const sessionPostCountAtCompletion = fetchCalls.filter((call) => call.url === "/api/sessions").length;
  const done = await send({ type: "OGRR_DONE_DISARM_TAB" });
  assert.equal(done.ok, true);
  assert.equal(done.status.recordingState, "idle");
  assert.equal(done.status.recordingArmed, false);
  assert.equal(done.status.session, null);
  assert.equal(
    fetchCalls.filter((call) => call.url === "/api/sessions").length,
    sessionPostCountAtCompletion,
    "Done & disarm must not re-upload the completed session manifest",
  );

  const nextArm = await arm({}, { confirmStart: false });
  assert.equal(nextArm.status.recordingState, "armed");
  assert.equal(nextArm.status.session, null);
  assert.equal(
    fetchCalls.filter((call) => call.url === "/api/sessions").length,
    sessionPostCountAtCompletion,
    "Arming the next competition after Done & disarm must not touch the previous manifest",
  );
  await send({ type: "OGRR_STOP_ACTIVE" });
});


test("NMPZ starts from the page probe, survives a checkpoint, and finalizes without movement samples", { timeout: 10000 }, async () => {
  await send({ type: "OGRR_RESET_ACTIVE" });
  await send({
    type: "OGRR_SAVE_SETTINGS",
    settings: {
      enabled: true,
      competitionId: "europe-easy",
      model: "GPT-5.6 Sol",
      // The configured experiment condition is authoritative.
      condition: "static-image",
      collectorUrl: "http://127.0.0.1:4173/api/recordings",
      fallbackDownload: true,
      downloadSubfolder: "openguessr-research-recordings",
    },
  });
  await arm();

  activeProbe = {
    trigger: "test",
    at: new Date().toISOString(),
    atMs: Date.now(),
    pageUrl: "https://www.openguessr.com/competitions/example",
    pathname: "/competitions/example",
    title: "OpenGuessr NMPZ",
    pageState: "round",
    roundLikelyActive: true,
    guessControlVisible: true,
    nextControlVisible: false,
    resultVisible: false,
    roundNumber: 1,
    roundTotal: 8,
    modeHint: "nmpz",
    primaryView: null,
    diagnostics: {
      iframeCount: 0,
      imageCount: 1,
      streetViewCandidateCount: 0,
      nmpzTextDetected: true,
    },
  };

  await recorderEvent("openguessr-page", "dom-probe", activeProbe);
  let status = await send({ type: "OGRR_GET_STATUS" });
  assert.equal(status.status.currentRound.captureMode, "nmpz");
  assert.equal(status.status.currentRound.pageRoundNumber, 1);
  assert.equal(status.status.currentRound.sampleCount, 0);
  assert.equal(status.status.currentRound.hasCoordinate, false);

  const checkpoint = await send({ type: "OGRR_SAVE_CHECKPOINT" });
  assert.equal(checkpoint.checkpoint.success, true);
  assert.equal(checkpoint.status.currentRound.captureMode, "nmpz");
  assert.equal(checkpoint.status.currentRound.sampleCount, 0);
  assert.ok(fetchCalls.some((call) => call.url === "/api/checkpoints"));

  const recordingCountBefore = fetchCalls.filter(
    (call) => call.url === "/api/recordings",
  ).length;
  const finalized = await send({ type: "OGRR_FINALIZE_ACTIVE" });
  assert.equal(finalized.status.currentRound, null);
  assert.equal(finalized.status.lastManualAction.success, true);

  const recordingPosts = fetchCalls.filter((call) => call.url === "/api/recordings");
  assert.equal(recordingPosts.length, recordingCountBefore + 1);
  const recording = recordingPosts.at(-1).body;
  assert.equal(recording.condition, "static-image");
  assert.equal(recording.configuredCondition, null);
  assert.equal(recording.captureMode, "nmpz");
  assert.equal(recording.restriction, "nmpz");
  assert.equal(recording.competitionOverallIndex, 1);
  assert.equal(recording.sampleCount, 0);
  assert.equal(recording.partial, true);
});

test("manual Leaflet prediction is saved and post-result Street View samples are excluded", { timeout: 10000 }, async () => {
  await send({ type: "OGRR_RESET_ACTIVE" });
  await send({
    type: "OGRR_SAVE_SETTINGS",
    settings: {
      enabled: true,
      competitionId: "europe-easy",
      model: "manual",
      condition: "static-image",
      collectorUrl: "http://127.0.0.1:4173/api/recordings",
      fallbackDownload: true,
      downloadSubfolder: "openguessr-research-recordings",
    },
  });
  await arm();

  const started = Date.now();
  const frameInstanceId = "flam-frame";
  await recorderEvent("google-frame", "frame-ready", {
    frameInstanceId,
    spawnRequested: {
      lat: 60.8634735,
      lng: 7.1179637,
      heading: 43.12,
      pitch: 0,
      fov: 75,
    },
    at: new Date(started).toISOString(),
  });
  await recorderEvent("google-frame", "sample", {
    frameInstanceId,
    lat: 60.8634735,
    lng: 7.1179637,
    heading: 43.12,
    pitch: 0,
    fov: 75,
    capturedAt: new Date(started + 20).toISOString(),
    capturedAtMs: started + 20,
    source: "api",
    reason: "position_changed",
  });

  await recorderEvent("openguessr-page", "prediction-intent", {
    label: "Guess",
    at: new Date(started + 100).toISOString(),
  });
  await recorderEvent("openguessr-page", "prediction-candidate", {
    lat: 61.101,
    lng: 6.901,
    transport: "leaflet-map-click",
    method: "MAP_CLICK",
    detectedAt: new Date(started + 101).toISOString(),
    trigger: "guess-control",
  });
  await recorderEvent("openguessr-page", "result-visible", {
    detectedFrom: "result-control",
    label: "Continue",
    at: new Date(started + 200).toISOString(),
  });

  // This reproduces the bad sample seen in the real Flåm recording. It belongs
  // to the post-result/next state and must never enter the completed round.
  await recorderEvent("google-frame", "sample", {
    frameInstanceId,
    lat: -29.697982659371753,
    lng: -51.24331119298978,
    heading: 103.10331,
    pitch: 0,
    fov: 90,
    capturedAt: new Date(started + 500).toISOString(),
    capturedAtMs: started + 500,
    source: "openguessr-dom",
    reason: "dom_probe",
  });

  await recorderEvent("openguessr-page", "round-advance-intent", {
    label: "Continue",
    at: new Date(started + 220).toISOString(),
  });
  await new Promise((resolve) => setTimeout(resolve, 180));

  const recording = fetchCalls.filter((call) => call.url === "/api/recordings").at(-1).body;
  assert.equal(recording.model, "manual");
  assert.equal(recording.prediction.lat, 61.101);
  assert.equal(recording.prediction.lng, 6.901);
  assert.equal(recording.prediction.source, "leaflet-map-click");
  assert.equal(recording.partial, false);
  assert.equal(recording.round.freezeReason, "result_visible");
  assert.ok(recording.samples.every((sample) => sample.lat > 50));
  assert.ok(!recording.samples.some((sample) => sample.lat < 0));
});


test("repeated result events after finalization do not create a phantom second round", { timeout: 10000 }, async () => {
  await send({ type: "OGRR_RESET_ACTIVE" });
  fetchCalls.length = 0;

  await send({
    type: "OGRR_SAVE_SETTINGS",
    settings: {
      enabled: true,
      competitionId: "europe-easy",
      model: "manual",
      condition: "static-image",
      collectorUrl: "http://127.0.0.1:4173/api/recordings",
      fallbackDownload: true,
      downloadSubfolder: "openguessr-research-recordings",
    },
  });
  await arm();

  const started = Date.now();
  const frameInstanceId = "paris-nmpz-frame";
  await recorderEvent("google-frame", "frame-ready", {
    frameInstanceId,
    spawnRequested: {
      lat: 48.8521298,
      lng: 2.3696389,
      heading: 347.03,
      fov: 90,
    },
    at: new Date(started).toISOString(),
  });
  await recorderEvent("google-frame", "sample", {
    frameInstanceId,
    lat: 48.8521298,
    lng: 2.3696389,
    heading: 347.03,
    fov: 90,
    capturedAt: new Date(started + 20).toISOString(),
    capturedAtMs: started + 20,
    source: "api",
    reason: "position_changed",
  });
  await recorderEvent("openguessr-page", "prediction-candidate", {
    lat: 47.32658839583286,
    lng: 2.109375,
    transport: "leaflet-map-click",
    detectedAt: new Date(started + 100).toISOString(),
  });
  await recorderEvent("openguessr-page", "result-visible", {
    detectedFrom: "result-control",
    label: "Continue",
    at: new Date(started + 120).toISOString(),
  });

  // Wait until the real round has been posted and currentRound is cleared.
  await new Promise((resolve) => setTimeout(resolve, 700));
  assert.equal(fetchCalls.filter((call) => call.url === "/api/recordings").length, 1);

  activeProbe = {
    trigger: "heartbeat",
    at: new Date(started + 800).toISOString(),
    atMs: started + 800,
    pageUrl: "https://openguessr.com/",
    pathname: "/",
    title: "OpenGuessr - Free GeoGuessr Alternative",
    pageState: "result",
    roundLikelyActive: false,
    guessControlVisible: false,
    nextControlVisible: true,
    resultVisible: true,
    roundNumber: null,
    roundTotal: null,
    modeHint: "streetview",
    primaryView: {
      lat: 48.8521298,
      lng: 2.3696389,
      heading: 347.03,
      fov: 90,
      urlFingerprint: "3426ef12",
      source: "iframe",
    },
  };

  await recorderEvent("openguessr-page", "dom-probe", activeProbe);
  await recorderEvent("openguessr-page", "result-visible", {
    detectedFrom: "result-control",
    label: "Continue",
    at: new Date(started + 820).toISOString(),
  });
  await recorderEvent("openguessr-page", "round-advance-intent", {
    label: "Continue",
    at: new Date(started + 840).toISOString(),
  });
  await new Promise((resolve) => setTimeout(resolve, 250));

  assert.equal(fetchCalls.filter((call) => call.url === "/api/recordings").length, 1);
  const status = await send({ type: "OGRR_GET_STATUS" });
  assert.equal(status.status.currentRound, null);
  activeProbe = null;
});

test("stale Continue/result events from the previous screen cannot finalize a newly started round", { timeout: 10000 }, async () => {
  await send({ type: "OGRR_RESET_ACTIVE" });
  fetchCalls.length = 0;
  await send({
    type: "OGRR_SAVE_SETTINGS",
    settings: {
      enabled: true,
      competitionId: "europe-easy",
      model: "manual",
      condition: "static-image",
      collectorUrl: "http://127.0.0.1:4173/api/recordings",
      fallbackDownload: true,
      downloadSubfolder: "openguessr-research-recordings",
    },
  });
  await arm();

  // Reproduce the real Salzburg race: the previous result-screen Continue click
  // happened shortly BEFORE the new Street View round was detected, but its
  // event reached the background script shortly AFTER the new round started.
  const started = Date.now();
  const frameInstanceId = "salzburg-race-frame";
  await recorderEvent("google-frame", "frame-ready", {
    frameInstanceId,
    spawnRequested: {
      lat: 47.8005438,
      lng: 13.0529765,
      heading: 192.57,
      pitch: 0,
      fov: 90,
    },
    at: new Date(started).toISOString(),
  });

  await recorderEvent("openguessr-page", "round-advance-intent", {
    label: "Continue",
    at: new Date(started - 80).toISOString(),
  });
  await recorderEvent("openguessr-page", "result-visible", {
    detectedFrom: "result-control",
    label: "Continue",
    at: new Date(started - 60).toISOString(),
  });

  await new Promise((resolve) => setTimeout(resolve, 220));
  assert.equal(fetchCalls.filter((call) => call.url === "/api/recordings").length, 0);
  let status = await send({ type: "OGRR_GET_STATUS" });
  assert.equal(status.status.currentRound?.roundId ?? status.status.currentRound?.id, "round-1");
  assert.equal(status.status.currentRound?.predictionCaptured, false);

  // A real prediction/result for the new round must still finalize normally.
  await recorderEvent("openguessr-page", "prediction-candidate", {
    lat: 47.756798,
    lng: 13.051758,
    transport: "leaflet-map-click",
    detectedAt: new Date(started + 600).toISOString(),
  });
  await recorderEvent("openguessr-page", "result-visible", {
    detectedFrom: "result-control",
    label: "Continue",
    at: new Date(started + 700).toISOString(),
  });
  await new Promise((resolve) => setTimeout(resolve, 650));

  const recordings = fetchCalls.filter((call) => call.url === "/api/recordings");
  assert.equal(recordings.length, 1);
  assert.equal(recordings[0].body.partial, false);
  assert.equal(recordings[0].body.stopReason, "prediction_submitted");
  assert.equal(recordings[0].body.round.index, 0);
  assert.equal(recordings[0].body.prediction.lat, 47.756798);
  assert.ok(
    recordings[0].body.diagnostics.events.some(
      (event) => event.name === "stale_round_advance_intent_ignored",
    ),
  );
  assert.ok(
    recordings[0].body.diagnostics.events.some(
      (event) => event.name === "stale_result_visible_ignored",
    ),
  );

  status = await send({ type: "OGRR_GET_STATUS" });
  assert.equal(status.status.currentRound, null);
  assert.equal(status.status.session.completedRoundCount, 1);
});

test("armed recorder starts round 1 immediately when the competition dialog disappears into the playable view", async () => {
  await send({ type: "OGRR_RESET_ACTIVE" });
  fetchCalls.length = 0;
  await send({
    type: "OGRR_SAVE_SETTINGS",
    settings: {
      enabled: true,
      competitionId: "europe-easy",
      model: "manual",
      condition: "static-image",
      collectorUrl: "http://127.0.0.1:4173/api/recordings",
      fallbackDownload: true,
      downloadSubfolder: "openguessr-research-recordings",
    },
  });

  const now = Date.now();
  const lobby = {
    lat: 53.3784406,
    lng: -111.797016,
    heading: 180.5,
    fov: 90,
    urlFingerprint: "lobby-view",
  };
  await recorderEvent("openguessr-page", "dom-probe", {
    trigger: "initial",
    at: new Date(now).toISOString(),
    atMs: now,
    pageUrl: "https://openguessr.com/competitions",
    pathname: "/competitions",
    pageState: "competition-ready",
    roundLikelyActive: false,
    competitionStartPromptVisible: true,
    competitionStartLabel: "Start Competition",
    competitionStartSignature: "ready-123",
    guessControlVisible: false,
    nextControlVisible: false,
    resultVisible: false,
    primaryView: lobby,
    diagnostics: { streetViewCandidateCount: 1 },
  });
  await recorderEvent("google-frame", "frame-ready", {
    frameInstanceId: "lobby-frame",
    spawnRequested: lobby,
    at: new Date(now + 5).toISOString(),
  });

  const firstArm = await arm({}, { confirmStart: false });
  const armedAt = firstArm.status.armedAt;
  const secondArm = await arm({}, { confirmStart: false });
  assert.equal(secondArm.status.armedAt, armedAt);
  assert.equal(secondArm.status.competitionStartConfirmed, false);

  await recorderEvent("openguessr-page", "dom-probe", {
    trigger: "mutation",
    at: new Date(now + 1000).toISOString(),
    atMs: now + 1000,
    pageUrl: "https://openguessr.com/",
    pathname: "/",
    pageState: "game-page",
    roundLikelyActive: false,
    competitionStartPromptVisible: false,
    guessControlVisible: false,
    nextControlVisible: false,
    resultVisible: false,
    primaryView: lobby,
    diagnostics: { streetViewCandidateCount: 1 },
  });
  let status = await send({ type: "OGRR_GET_STATUS" });
  assert.equal(status.status.startPromptSeen, true);
  assert.ok(status.status.startPromptDismissedAt);
  assert.equal(status.status.competitionStartConfirmed, true);
  assert.equal(status.status.currentRound.index, 0);
  assert.equal(status.status.currentRound.sampleCount, 1);
  assert.equal(status.status.currentRound.captureMode, "nmpz");
  assert.equal(status.status.session.startedAt, new Date(now + 1000).toISOString());
  assert.match(status.status.lastManualAction.message, /start detected/i);
});

test("interactive round 1 begins at the start transition and keeps early movement samples", { timeout: 10000 }, async () => {
  await send({ type: "OGRR_RESET_ACTIVE" });
  fetchCalls.length = 0;
  await send({
    type: "OGRR_SAVE_SETTINGS",
    settings: {
      enabled: true,
      competitionId: "europe-easy",
      model: "manual",
      condition: "interactive-panorama",
      collectorUrl: "http://127.0.0.1:4173/api/recordings",
      fallbackDownload: true,
      downloadSubfolder: "openguessr-research-recordings",
    },
  });

  const now = Date.now();
  const firstView = {
    lat: 48.8521298,
    lng: 2.3696389,
    heading: 347.03,
    pitch: 0,
    fov: 75,
    urlFingerprint: "paris-first-view",
  };

  await recorderEvent("openguessr-page", "dom-probe", {
    trigger: "initial",
    at: new Date(now).toISOString(),
    atMs: now,
    pageUrl: "https://openguessr.com/competitions",
    pathname: "/competitions",
    pageState: "competition-ready",
    roundLikelyActive: false,
    competitionStartPromptVisible: true,
    competitionStartLabel: "Start Competition",
    competitionStartSignature: "interactive-ready",
    guessControlVisible: false,
    nextControlVisible: false,
    resultVisible: false,
    modeHint: "streetview",
    primaryView: firstView,
    diagnostics: { streetViewCandidateCount: 1 },
  });
  await arm({}, { confirmStart: false });

  const startAt = now + 500;
  await recorderEvent("openguessr-page", "dom-probe", {
    trigger: "competition-start-prompt-transition",
    at: new Date(startAt).toISOString(),
    atMs: startAt,
    pageUrl: "https://openguessr.com/",
    pathname: "/",
    pageState: "game-page",
    roundLikelyActive: false,
    competitionStartPromptVisible: false,
    guessControlVisible: false,
    nextControlVisible: false,
    resultVisible: false,
    modeHint: "streetview",
    primaryView: firstView,
    diagnostics: { streetViewCandidateCount: 1 },
  });

  let status = await send({ type: "OGRR_GET_STATUS" });
  assert.equal(status.status.currentRound.index, 0);
  assert.equal(status.status.currentRound.captureMode, "interactive");
  assert.equal(status.status.currentRound.sampleCount, 1);
  assert.equal(status.status.session.startedAt, new Date(startAt).toISOString());

  await recorderEvent("google-frame", "frame-ready", {
    frameInstanceId: "interactive-frame-1",
    spawnRequested: firstView,
    at: new Date(startAt + 20).toISOString(),
  });
  await recorderEvent("google-frame", "sample", {
    frameInstanceId: "interactive-frame-1",
    lat: 48.8521298,
    lng: 2.3696389,
    heading: 347.03,
    pitch: 0,
    fov: 75,
    capturedAt: new Date(startAt + 30).toISOString(),
    capturedAtMs: startAt + 30,
    source: "api",
    reason: "position_changed",
  });
  await recorderEvent("google-frame", "sample", {
    frameInstanceId: "interactive-frame-1",
    lat: 48.8525,
    lng: 2.3701,
    heading: 12,
    pitch: -3,
    fov: 55,
    capturedAt: new Date(startAt + 300).toISOString(),
    capturedAtMs: startAt + 300,
    source: "api",
    reason: "position_changed",
  });

  status = await send({ type: "OGRR_GET_STATUS" });
  assert.equal(status.status.currentRound.sampleCount >= 2, true);

  await recorderEvent("openguessr-page", "prediction-candidate", {
    lat: 52.52,
    lng: 13.405,
    transport: "leaflet-map-click",
    detectedAt: new Date(startAt + 500).toISOString(),
  });
  await recorderEvent("openguessr-page", "result-visible", {
    detectedFrom: "result-control",
    label: "Continue",
    at: new Date(startAt + 520).toISOString(),
  });
  await new Promise((resolve) => setTimeout(resolve, 700));

  const recording = fetchCalls.filter((call) => call.url === "/api/recordings").at(-1).body;
  assert.equal(recording.condition, "interactive-panorama");
  assert.equal(recording.captureMode, "interactive");
  assert.equal(recording.round.startSource, "competition_start_transition");
  assert.equal(recording.startedAt, new Date(startAt).toISOString());
  assert.ok(recording.samples.some((sample) => sample.lat === 48.8525));
  assert.ok(recording.samples.some((sample) => sample.pitch === -3));
  assert.deepEqual(recording.keyMoments, []);
});

test("static-image mode cannot be overwritten by a generic streetview DOM hint", async () => {
  await send({ type: "OGRR_RESET_ACTIVE" });
  fetchCalls.length = 0;
  await send({
    type: "OGRR_SAVE_SETTINGS",
    settings: {
      enabled: true,
      competitionId: "europe-easy",
      model: "manual",
      condition: "static-image",
      collectorUrl: "http://127.0.0.1:4173/api/recordings",
      fallbackDownload: true,
      downloadSubfolder: "openguessr-research-recordings",
    },
  });
  await arm();

  const now = Date.now();
  await recorderEvent("google-frame", "frame-ready", {
    frameInstanceId: "static-frame",
    spawnRequested: { lat: 48.8521298, lng: 2.3696389, heading: 347.03, fov: 90 },
    at: new Date(now).toISOString(),
  });
  await recorderEvent("openguessr-page", "dom-probe", {
    trigger: "heartbeat",
    at: new Date(now + 100).toISOString(),
    atMs: now + 100,
    pageUrl: "https://openguessr.com/",
    pathname: "/",
    pageState: "game-page",
    roundLikelyActive: false,
    competitionStartPromptVisible: false,
    guessControlVisible: false,
    nextControlVisible: false,
    resultVisible: false,
    modeHint: "streetview",
    primaryView: { lat: 48.8521298, lng: 2.3696389, heading: 347.03, fov: 90 },
    diagnostics: { streetViewCandidateCount: 1 },
  });

  const status = await send({ type: "OGRR_GET_STATUS" });
  assert.equal(status.status.currentRound.captureMode, "nmpz");
});

test("interactive result panorama cannot become the next round before Continue and a genuine new view", { timeout: 10000 }, async () => {
  await send({ type: "OGRR_RESET_ACTIVE" });
  fetchCalls.length = 0;
  activeProbe = null;
  await send({
    type: "OGRR_SAVE_SETTINGS",
    settings: {
      enabled: true,
      competitionId: "europe-easy",
      model: "manual",
      condition: "interactive-panorama",
      collectorUrl: "http://127.0.0.1:4173/api/recordings",
      fallbackDownload: true,
      downloadSubfolder: "openguessr-research-recordings",
    },
  });
  await arm();

  const t0 = Date.now();
  const frameInstanceId = "interactive-shared-frame";
  await recorderEvent("openguessr-page", "dom-probe", {
    trigger: "heartbeat",
    at: new Date(t0).toISOString(),
    atMs: t0,
    pageUrl: "https://openguessr.com/",
    pathname: "/",
    pageState: "round",
    roundLikelyActive: true,
    guessControlVisible: true,
    nextControlVisible: false,
    resultVisible: false,
    roundNumber: 1,
    roundTotal: 8,
    modeHint: "streetview",
    primaryView: { lat: 48.8126024, lng: 14.3129755, heading: 178.87, fov: 90 },
  });
  await recorderEvent("google-frame", "frame-ready", {
    frameInstanceId,
    spawnRequested: {
      lat: 48.8126024,
      lng: 14.3129755,
      heading: 178.87,
      pitch: 0,
      fov: 90,
      panoId: "pano-start",
    },
    at: new Date(t0).toISOString(),
  });
  await recorderEvent("google-frame", "sample", {
    frameInstanceId,
    lat: 48.8123612,
    lng: 14.3131977,
    heading: 136.10,
    pitch: -17.65,
    zoom: 0.4,
    fov: 90,
    panoId: "pano-explored",
    source: "api",
    reason: "position_changed",
    capturedAt: new Date(t0 + 1000).toISOString(),
    capturedAtMs: t0 + 1000,
  });
  await recorderEvent("openguessr-page", "prediction-candidate", {
    lat: 48.9,
    lng: 14.4,
    transport: "leaflet-map-click",
    detectedAt: new Date(t0 + 2000).toISOString(),
  });
  await recorderEvent("openguessr-page", "result-visible", {
    detectedFrom: "result-control",
    label: "Continue",
    at: new Date(t0 + 2100).toISOString(),
  });
  await new Promise((resolve) => setTimeout(resolve, 650));

  assert.equal(fetchCalls.filter((call) => call.url === "/api/recordings").length, 1);
  let status = await send({ type: "OGRR_GET_STATUS" });
  assert.equal(status.status.currentRound, null);

  // Reproduce the observed interactive failure: the old explored panorama emits
  // another POV sample while the previous result screen is still awaiting Continue.
  await recorderEvent("google-frame", "sample", {
    frameInstanceId,
    lat: 48.8123612,
    lng: 14.3131977,
    heading: 136.10,
    pitch: -17.65,
    zoom: 0.4,
    fov: 90,
    panoId: "pano-explored",
    source: "api",
    reason: "pov_changed",
    capturedAt: new Date(t0 + 2200).toISOString(),
    capturedAtMs: t0 + 2200,
  });
  status = await send({ type: "OGRR_GET_STATUS" });
  assert.equal(status.status.currentRound, null);

  await recorderEvent("openguessr-page", "round-advance-intent", {
    label: "Continue",
    at: new Date(t0 + 2300).toISOString(),
  });

  // Even after Continue, a repeated sample from the same terminal panorama is not
  // sufficient to start the next round.
  await recorderEvent("google-frame", "sample", {
    frameInstanceId,
    lat: 48.8123612,
    lng: 14.3131977,
    heading: 140,
    pitch: -15,
    zoom: 0.4,
    fov: 90,
    panoId: "pano-explored",
    source: "api",
    reason: "pov_changed",
    capturedAt: new Date(t0 + 2350).toISOString(),
    capturedAtMs: t0 + 2350,
  });
  status = await send({ type: "OGRR_GET_STATUS" });
  assert.equal(status.status.currentRound, null);

  // A genuinely new panorama after Continue starts exactly one next round.
  await recorderEvent("google-frame", "sample", {
    frameInstanceId,
    lat: 44.8665,
    lng: 13.8496,
    heading: 260,
    pitch: 0,
    zoom: 0.4,
    fov: 90,
    panoId: "pano-next-round",
    source: "api",
    reason: "position_changed",
    capturedAt: new Date(t0 + 2400).toISOString(),
    capturedAtMs: t0 + 2400,
  });
  status = await send({ type: "OGRR_GET_STATUS" });
  assert.equal(status.status.currentRound?.roundId ?? status.status.currentRound?.id, "round-2");
  assert.equal(status.status.currentRound?.predictionCaptured, false);
  assert.equal(fetchCalls.filter((call) => call.url === "/api/recordings").length, 1);

  await send({ type: "OGRR_STOP_ACTIVE" });
  activeProbe = null;
});
