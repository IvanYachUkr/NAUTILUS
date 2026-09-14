import {
  DEFAULT_SETTINGS,
  EXTENSION_VERSION,
  RECORDER_NAME,
  loadSettings,
  saveSettings,
} from "./lib/config.js";

const TAB_STATE_PREFIX = "ogrr-tab-state:";
const RECOVERY_STATE_PREFIX = "ogrr-recovery-state:";
const INTERACTIVE_ARM_PENDING_KEY = "ogrr-interactive-arm-pending";
const tabStateCache = new Map();
const finalizeTimers = new Map();
const finalizeRoundPromises = new Map();
const staticImageCapturePromises = new Map();
const interactiveActionCaptureState = new Map();
const STATIC_CAPTURE_MIN_WAIT_MS = 450;
const STATIC_CAPTURE_MIN_ACCEPT_MS = 900;
const STATIC_CAPTURE_MAX_WAIT_MS = 3600;
const STATIC_CAPTURE_SAMPLE_INTERVAL_MS = 300;
const STATIC_CAPTURE_MIN_SAMPLES = 2;
const STATIC_CAPTURE_STABLE_DIFF = 2.0;
const STATIC_CAPTURE_MIN_SHARPNESS = 12;
const STATIC_CAPTURE_STABLE_STREAK = 1;
// Interactive actions use trailing-edge gesture coalescing. Quick consecutive
// camera adjustments replace the pending pose so the saved action represents
// the FINAL sharp viewpoint of the gesture, not an intermediate/transition frame.
// Interactive capture has two separate timing paths:
// - same-panorama pan/tilt/zoom uses a short trailing debounce so the final pose wins;
// - a NEW panorama gets its own fixed settle deadline that is NOT restarted by
//   the small API updates Street View emits while the panorama is rendering.
const INTERACTIVE_VIEW_TRAILING_MS = 220;
const INTERACTIVE_PANO_SETTLE_MS = 320;
const INTERACTIVE_INITIAL_MIN_WAIT_MS = 900;
const INTERACTIVE_CAPTURE_MAX_WAIT_MS = 2800;
const INTERACTIVE_CAPTURE_RETRY_INTERVAL_MS = 420;
// Keep captureVisibleTab safely below Chrome's practical ~2 screenshots/sec cap.
const INTERACTIVE_CAPTURE_MIN_SCREENSHOT_GAP_MS = 540;
const INTERACTIVE_CAPTURE_MAX_ATTEMPTS = 3;
const INTERACTIVE_PANO_CAPTURE_MAX_ATTEMPTS = 2;
const INTERACTIVE_CAPTURE_MIN_SHARPNESS = 14;
const INTERACTIVE_PANO_FAST_ACCEPT_MIN_SHARPNESS = 16;
const INTERACTIVE_CAPTURE_STABLE_DIFF = 3.5;
let settingsCache = null;

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get("settings");
  if (!stored.settings) await saveSettings(DEFAULT_SETTINGS);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  clearInteractiveActionCapture(tabId);
  void closeTabSession(tabId);
});

if (chrome.action?.onClicked?.addListener) {
  chrome.action.onClicked.addListener((tab) => {
    void authorizePendingInteractiveArmFromAction(tab).catch(() => {});
  });
}

if (chrome.tabCapture?.onStatusChanged?.addListener) {
  chrome.tabCapture.onStatusChanged.addListener((info) => {
    if (!Number.isInteger(info?.tabId) || !["stopped", "error"].includes(info.status)) return;
    void (async () => {
      const state = await getTabState(info.tabId);
      if (!state.videoCapture || !["ready", "recording"].includes(state.videoCapture.status)) return;
      state.videoCapture.status = "error";
      state.videoCapture.error = `Chrome tab capture unexpectedly ${info.status}.`;
      state.lastManualAction = {
        at: new Date().toISOString(),
        success: false,
        message: "Interactive video stopped unexpectedly. Do not continue this competition; re-arm and restart it.",
      };
      if (!state.currentRound) state.recordingArmed = false;
      await setVideoBadge(info.tabId, "error");
      await persistTabState(info.tabId, state, { forceRecovery: true });
    })().catch(() => {});
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.target === "ogrr-offscreen") return false;
  handleMessage(message, sender)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((error) =>
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  return true;
});

async function handleMessage(message, sender) {
  switch (message?.type) {
    case "OGRR_EVENT":
      return handleRecorderEvent(message, sender);
    case "OGRR_GET_STATUS":
      return { status: await getActiveTabStatus(), settings: await getSettings() };
    case "OGRR_GET_PAGE_UI_STATE":
      return await getPageUiState(sender, Boolean(message.includeCollector));
    case "OGRR_ARM_TAB":
      return await armSenderTab(sender, message.setup ?? {});
    case "OGRR_ARM_INTERACTIVE_TAB":
      return await armInteractiveSenderTab(sender, message.setup ?? {});
    case "OGRR_ARM_ACTIVE":
      return { status: await armActiveTab(message.setup ?? {}) };
    case "OGRR_STOP_TAB":
      return { status: await stopSenderTab(sender, "user_stop") };
    case "OGRR_DONE_DISARM_TAB":
      return { status: await doneAndDisarmSenderTab(sender) };
    case "OGRR_STOP_ACTIVE":
      return { status: await stopActiveTab("user_stop") };
    case "OGRR_SAVE_SETTINGS": {
      settingsCache = await saveSettings(message.settings ?? {});
      return { settings: settingsCache };
    }
    case "OGRR_TEST_COLLECTOR":
      return { collector: await testCollector() };
    case "OGRR_SAVE_CHECKPOINT":
      return await saveActiveCheckpoint();
    case "OGRR_EXPORT_DIAGNOSTICS":
      return await exportActiveDiagnostics();
    case "OGRR_FINALIZE_ACTIVE":
      return { status: await finalizeActiveTab("manual") };
    case "OGRR_RESET_ACTIVE":
      return { status: await resetActiveTab() };
    default:
      return {};
  }
}

async function handleRecorderEvent(message, sender) {
  const tabId = sender.tab?.id;
  if (!Number.isInteger(tabId)) return {};

  const settings = await getSettings();
  const state = await getTabState(tabId);
  const effectiveSettings = settingsForState(state, settings);
  state.updatedAt = new Date().toISOString();

  if (message.source === "openguessr-page") {
    await handlePageEvent(tabId, state, message.event, message.payload, effectiveSettings);
  } else if (message.source === "google-frame") {
    await handleGoogleEvent(tabId, state, message.event, message.payload, effectiveSettings);
  }

  await persistTabState(tabId, state);
  return { status: publicStatus(state) };
}

async function handlePageEvent(tabId, state, event, payload, settings) {
  if (event === "page-context") {
    const previousHint = state.pageContext?.competitionHint ?? null;
    const nextHint = payload?.competitionHint ?? null;
    state.pageContext = {
      ...payload,
      tabUrl: payload?.pageUrl ?? state.pageContext?.tabUrl ?? null,
    };

    if (previousHint && nextHint && previousHint !== nextHint) {
      state.pendingSessionReset = true;
      if (captureIsArmed(state, settings) && state.currentRound) {
        await finalizeRound(tabId, state, "competition_changed");
      }
    }
    return;
  }

  if (event === "dom-probe") {
    const previousProbe = state.pageProbe;
    state.pageProbe = sanitizePageProbe(payload);
    const startConfirmedNow = maybeConfirmCompetitionStartFromProbe(
      state,
      previousProbe,
      state.pageProbe,
      settings,
    );
    if (captureSessionReady(state, settings)) {
      if (
        startConfirmedNow &&
        !state.currentRound &&
        !state.pageProbe?.resultVisible &&
        isCoordinate(state.pageProbe?.primaryView)
      ) {
        await ensureRoundFromProbe(
          tabId,
          state,
          settings,
          "competition_start_transition",
          { force: true },
        );
      }
      await handleDomProbe(tabId, state, state.pageProbe, settings);
    }
    return;
  }

  if (event === "competition-start-intent") {
    if (captureIsArmed(state, settings) && !state.sessionId) {
      const confirmed = confirmCompetitionStart(
        state,
        payload?.label === "manual-overlay-confirmation" ? "manual confirmation" : "Start control",
        payload?.at,
      );
      if (
        confirmed &&
        !state.currentRound &&
        !state.pageProbe?.resultVisible &&
        isCoordinate(state.pageProbe?.primaryView) &&
        state.pageProbe?.competitionStartPromptVisible === false
      ) {
        await ensureRoundFromProbe(
          tabId,
          state,
          settings,
          "competition_start_control",
          { force: true },
        );
      }
    }
    return;
  }

  if (!captureSessionReady(state, settings)) return;

  if (event === "diagnostic") {
    if (state.currentRound) {
      addDiagnostic(state.currentRound, payload?.name ?? "page_diagnostic", payload);
    }
    return;
  }

  if (event === "interactive-view-intent") {
    const round = state.currentRound;
    if (round?.captureMode === "interactive") {
      markInteractiveDepartureFrame(round, payload);
    }
    return;
  }

  if (event === "prediction-intent") {
    if (!state.currentRound) {
      await ensureRoundFromProbe(tabId, state, settings, "prediction_intent");
    }
    if (state.currentRound) {
      if (eventPredatesRound(state.currentRound, payload, ["at"])) {
        addDiagnostic(state.currentRound, "stale_prediction_intent_ignored", payload);
        return;
      }
      // If the final sharp-state screenshot is already processing, let it finish
      // before sealing the exploration. This preserves the last viewpoint without
      // ever starting a new screenshot after the guess map begins to open.
      const activeCapture = interactiveActionCaptureState.get(tabId);
      if (activeCapture?.inFlight) {
        try {
          await Promise.race([activeCapture.inFlight, sleep(1200)]);
        } catch {
          // A failed final capture simply falls back to the newest prior sharp state.
        }
      }
      markInteractiveFinalFrame(state.currentRound, payload);
      state.currentRound.predictionIntentAt = payload?.at ?? new Date().toISOString();
      addDiagnostic(state.currentRound, "prediction_intent", payload);
      // Now stop pending/in-flight work so the guess map can never become an image.
      await cancelInteractiveActionCapture(tabId, state.currentRound);
    }
    return;
  }

  if (event === "prediction-candidate") {
    if (!isCoordinate(payload)) return;
    if (!state.currentRound) {
      await ensureRoundFromProbe(tabId, state, settings, "prediction_candidate", {
        force: true,
      });
    }
    if (!state.currentRound) return;
    if (eventPredatesRound(state.currentRound, payload, ["detectedAt", "at"])) {
      addDiagnostic(state.currentRound, "stale_prediction_candidate_ignored", payload);
      return;
    }
    state.currentRound.prediction = {
      lat: Number(payload.lat),
      lng: Number(payload.lng),
      capturedAt: payload.detectedAt ?? new Date().toISOString(),
      source:
        payload.transport === "leaflet-map-click"
          ? "leaflet-map-click"
          : "outgoing-request",
      requestPath: payload.requestPath ?? null,
      evidencePath: payload.evidencePath ?? null,
    };
    addDiagnostic(state.currentRound, "prediction_captured", {
      requestPath: payload.requestPath ?? null,
      transport: payload.transport ?? null,
    });
    await stopInteractiveRoundVideo(tabId, state, state.currentRound, "prediction_submitted");
    scheduleFinalize(tabId, 350, "prediction_submitted", state.currentRound);
    return;
  }

  if (event === "result-visible") {
    // A result event can be emitted repeatedly while the result screen remains
    // visible. Never create a new round from that screen: if the previous round
    // has already been finalized, this event belongs to the completed round.
    if (!state.currentRound) return;
    if (eventPredatesRound(state.currentRound, payload, ["at"])) {
      addDiagnostic(state.currentRound, "stale_result_visible_ignored", payload);
      return;
    }
    addDiagnostic(state.currentRound, "result_visible", payload);
    freezeRound(state.currentRound, payload?.at, "result_visible");
    scheduleFinalize(
      tabId,
      state.currentRound.prediction ? 500 : 1600,
      state.currentRound.prediction
        ? "prediction_submitted"
        : "prediction_submitted_coordinates_unresolved",
      state.currentRound,
    );
    return;
  }

  if (event === "round-advance-intent") {
    const intentAt = payload?.at ?? new Date().toISOString();
    // "Continue" lives on the result screen. If the round is already finalized,
    // remember the transition intent so only a genuinely new panorama can start
    // the next round.
    if (!state.currentRound) {
      state.advanceIntentAt = intentAt;
      return;
    }
    // Page events can cross the round boundary asynchronously. If the original
    // Continue click happened before this round started, it belongs to the
    // previous result screen and must never freeze/finalize the new round.
    if (eventPredatesRound(state.currentRound, payload, ["at"])) {
      addDiagnostic(state.currentRound, "stale_round_advance_intent_ignored", payload);
      return;
    }
    // Continue is a navigation signal, not sufficient evidence that the current
    // round itself is complete. In particular, a result-screen camera event can
    // race ahead and look like a new round; a subsequent Continue must not turn
    // that transient camera state into a saved partial round. Only a round with
    // an actually captured prediction may be finalized by Continue.
    if (!state.currentRound.prediction) {
      addDiagnostic(state.currentRound, "round_advance_without_prediction_ignored", payload);
      return;
    }
    state.advanceIntentAt = intentAt;
    addDiagnostic(state.currentRound, "round_advance_intent", payload);
    freezeRound(state.currentRound, payload?.at, "round_advance_intent");
    scheduleFinalize(tabId, 100, "prediction_submitted", state.currentRound);
  }
}


async function handleDomProbe(tabId, state, probe, settings) {
  if (!probe) return;

  state.pageContext = {
    ...(state.pageContext ?? {}),
    pageUrl: probe.pageUrl ?? state.pageContext?.pageUrl ?? null,
    pathname: probe.pathname ?? state.pageContext?.pathname ?? null,
    title: probe.title ?? state.pageContext?.title ?? null,
    at: probe.at ?? new Date().toISOString(),
  };

  if (Number.isInteger(probe.roundTotal)) {
    state.expectedRoundCount ??= probe.roundTotal;
  }

  const currentRoundNumber = state.currentRound?.pageRoundNumber ?? null;
  if (
    state.currentRound &&
    Number.isInteger(currentRoundNumber) &&
    Number.isInteger(probe.roundNumber) &&
    currentRoundNumber !== probe.roundNumber
  ) {
    await finalizeRound(tabId, state, "dom_round_number_changed");
  }

  if (probe.roundLikelyActive) {
    await ensureRoundFromProbe(tabId, state, settings, "dom_probe");
  }

  const round = state.currentRound;
  if (!round) return;

  round.pageRoundNumber ??= probe.roundNumber ?? null;
  round.pageRoundTotal ??= probe.roundTotal ?? null;
  round.captureMode = normalizeCaptureMode(
    probe.modeHint,
    round.settingsSnapshot?.condition ?? settings.condition,
  );
  round.lastPageProbeAt = probe.at ?? new Date().toISOString();

  const probeSignature = JSON.stringify({
    state: probe.pageState,
    round: probe.roundNumber,
    mode: probe.modeHint,
    view: probe.primaryView
      ? [
          probe.primaryView.lat,
          probe.primaryView.lng,
          probe.primaryView.panoId,
          probe.primaryView.urlFingerprint,
        ]
      : null,
  });
  if (probeSignature !== round.lastProbeSignature) {
    round.lastProbeSignature = probeSignature;
    addDiagnostic(round, "dom_probe", {
      pageState: probe.pageState,
      roundNumber: probe.roundNumber,
      roundTotal: probe.roundTotal,
      modeHint: probe.modeHint,
      streetViewCandidateCount:
        probe.diagnostics?.streetViewCandidateCount ?? null,
    });
  }

  if (probe.resultVisible) {
    freezeRound(round, probe.at, "dom_result_visible");
    if (!finalizeTimers.has(tabId)) {
      scheduleFinalize(
        tabId,
        round.prediction ? 500 : 1600,
        round.prediction
          ? "prediction_submitted"
          : "prediction_submitted_coordinates_unresolved",
        round,
      );
    }
    return;
  }

  const view = normalizeProbeView(probe.primaryView);
  if (view) {
    round.spawnRequested ??= view;
    // The iframe/embed URL is a reliable fixed-view heartbeat for NMPZ, but in
    // interactive Street View it usually remains pinned to the ORIGINAL spawn.
    // Once the live Maps API is available, feeding those DOM coordinates into
    // the exploration timeline creates fake jumps back to the start. Keep a DOM
    // point only as an initial fallback until the first API sample arrives.
    const isInteractive = round.captureMode === "interactive";
    const hasApiSamples = (round.captureSources?.api ?? 0) > 0;
    if (!isInteractive || (!hasApiSamples && round.samples.length === 0)) {
      captureSample(round, {
        ...view,
        capturedAt: probe.at ?? new Date().toISOString(),
        capturedAtMs: probe.atMs ?? Date.now(),
        source: probe.modeHint === "nmpz" ? "openguessr-nmpz" : "openguessr-dom",
        reason: probe.modeHint === "nmpz" ? "nmpz_heartbeat" : "dom_probe_initial_fallback",
        frameInstanceId: round.frameInstanceId,
      });
    }
  }

}

async function ensureRoundFromProbe(
  tabId,
  state,
  settings,
  reason,
  { force = false } = {},
) {
  if (!captureSessionReady(state, settings)) return null;
  if (state.currentRound) return state.currentRound;
  const probe = state.pageProbe;
  if (!probe) return null;
  // A result screen is never a valid starting point for a new round. Repeated
  // result probes/events are common while OpenGuessr waits for Continue.
  if (probe.resultVisible || probe.pageState === "result") return null;
  if (!force && !probe.roundLikelyActive) return null;

  const sameFinishedRound =
    Number.isInteger(probe.roundNumber) &&
    probe.roundNumber === state.lastFinishedRoundNumber;
  const resultAlreadySaved =
    sameFinishedRound &&
    probe.pageState === "result" &&
    Number.isFinite(parseTime(state.lastFinishedAt));
  if (resultAlreadySaved) return null;

  if (!canStartFormalCompetitionRound(state, probe.roundNumber)) return null;

  const view = normalizeProbeView(probe.primaryView);
  const fingerprint =
    probe.primaryView?.urlFingerprint ??
    `${probe.roundNumber ?? "unknown"}-${probe.atMs ?? Date.now()}`;
  startRound(state, settings, {
    frameInstanceId: `dom-${probe.roundNumber ?? state.roundCounter + 1}-${fingerprint}`,
    spawnRequested: view,
    detectedAt: probe.at,
    pageRoundNumber: probe.roundNumber,
    pageRoundTotal: probe.roundTotal,
    captureMode: normalizeCaptureMode(probe.modeHint, settings.condition),
    startSource: reason,
    provisional: !view,
  });

  if (view) {
    captureSample(state.currentRound, {
      ...view,
      capturedAt: probe.at ?? new Date().toISOString(),
      capturedAtMs: probe.atMs ?? Date.now(),
      source: probe.modeHint === "nmpz" ? "openguessr-nmpz" : "openguessr-dom",
      reason: `${reason}_initial_view`,
      frameInstanceId: state.currentRound.frameInstanceId,
    });
  } else {
    addDiagnostic(state.currentRound, "round_started_without_view_coordinate", {
      reason,
      pageState: probe.pageState,
      roundNumber: probe.roundNumber,
      modeHint: probe.modeHint,
    });
  }

  await persistTabState(tabId, state);
  return state.currentRound;
}

function sanitizePageProbe(value) {
  if (!value || typeof value !== "object") return null;
  const primaryView = normalizeProbeView(value.primaryView, { keepUrl: true });
  return {
    trigger: stringOrNull(value.trigger, 40),
    at: stringOrNull(value.at, 80) ?? new Date().toISOString(),
    atMs: finiteOrNull(value.atMs) ?? Date.now(),
    pageUrl: stringOrNull(value.pageUrl, 1200),
    pathname: stringOrNull(value.pathname, 500),
    title: stringOrNull(value.title, 300),
    pageState: stringOrNull(value.pageState, 40),
    roundLikelyActive: Boolean(value.roundLikelyActive),
    competitionStartPromptVisible: Boolean(value.competitionStartPromptVisible),
    competitionStartLabel: stringOrNull(value.competitionStartLabel, 160),
    competitionStartSignature: stringOrNull(value.competitionStartSignature, 160),
    guessControlVisible: Boolean(value.guessControlVisible),
    nextControlVisible: Boolean(value.nextControlVisible),
    resultVisible: Boolean(value.resultVisible),
    roundNumber: positiveIntegerOrNull(value.roundNumber),
    roundTotal: positiveIntegerOrNull(value.roundTotal),
    modeHint: ["nmpz", "streetview", "interactive", "static"].includes(
      value.modeHint,
    )
      ? value.modeHint
      : null,
    primaryView,
    controlLabels: Array.isArray(value.controlLabels)
      ? value.controlLabels.slice(0, 12).map((item) => String(item).slice(0, 160))
      : [],
    diagnostics: {
      iframeCount: finiteOrNull(value.diagnostics?.iframeCount),
      imageCount: finiteOrNull(value.diagnostics?.imageCount),
      streetViewCandidateCount: finiteOrNull(
        value.diagnostics?.streetViewCandidateCount,
      ),
      nmpzTextDetected: Boolean(value.diagnostics?.nmpzTextDetected),
    },
  };
}

function normalizeProbeView(value, { keepUrl = false } = {}) {
  if (!isCoordinate(value)) return null;
  const point = normalizeCameraPoint(value);
  if (!point) return null;
  if (keepUrl) {
    point.url = stringOrNull(value.url, 1200);
    point.urlFingerprint = stringOrNull(value.urlFingerprint, 100);
    point.source = stringOrNull(value.source, 80);
  }
  return point;
}

async function handleGoogleEvent(tabId, state, event, payload, settings) {
  observeGoogleFrameState(state, event, payload);
  maybeConfirmCompetitionStartFromGoogle(state, event, payload, settings);
  if (!captureSessionReady(state, settings)) return;

  if (state.currentRound?.frozenAtMs) {
    if (event === "diagnostic" || event === "panorama-attached" || event === "api-constructor-hooked") {
      addDiagnostic(state.currentRound, `ignored_after_freeze:${event}`, payload);
    }
    return;
  }

  if (event === "frame-ready") {
    const spawn = payload?.spawnRequested;
    if (!isCoordinate(spawn)) return;

    const isNewFrame =
      payload.frameInstanceId &&
      payload.frameInstanceId !== state.currentRound?.frameInstanceId;

    if (state.currentRound && isNewFrame) {
      if (!adoptGoogleFrameIfCompatible(state.currentRound, payload)) {
        await finalizeRound(tabId, state, "new_streetview_frame");
      }
    }

    if (
      !state.currentRound &&
      canStartNewRoundFromGoogle(state, {
        ...spawn,
        frameInstanceId: payload.frameInstanceId,
        capturedAt: payload.at,
      })
    ) {
      startRound(state, settings, {
        frameInstanceId: payload.frameInstanceId,
        spawnRequested: spawn,
        detectedAt: payload.at,
      });
    }
    return;
  }

  if (event === "spawn-requested") {
    if (!isCoordinate(payload)) return;

    if (
      state.currentRound &&
      payload.frameInstanceId !== state.currentRound.frameInstanceId
    ) {
      if (!adoptGoogleFrameIfCompatible(state.currentRound, payload)) {
        await finalizeRound(tabId, state, "new_spawn_requested");
      }
    }

    if (!state.currentRound && canStartNewRoundFromGoogle(state, payload)) {
      startRound(state, settings, {
        frameInstanceId: payload.frameInstanceId,
        spawnRequested: payload,
        detectedAt: payload.at,
      });
    } else if (state.currentRound) {
      state.currentRound.spawnRequested = normalizeCameraPoint(payload);
    }
    return;
  }

  if (event === "sample") {
    if (!isCoordinate(payload)) return;

    if (!state.currentRound) {
      if (!canStartNewRoundFromGoogle(state, payload)) return;
      startRound(state, settings, {
        frameInstanceId: payload.frameInstanceId,
        spawnRequested: payload,
        detectedAt: payload.capturedAt,
      });
    }

    if (payload.frameInstanceId !== state.currentRound.frameInstanceId) {
      if (!adoptGoogleFrameIfCompatible(state.currentRound, payload)) return;
    }
    if (state.currentRound.captureMode === "interactive") {
      await ensureInteractiveRoundVideoStarted(tabId, state, state.currentRound);
    }
    const capturedPoint = captureSample(state.currentRound, payload);
    // Interactive visual evidence is recorded as one per-round WebM in v0.7.4.
    // Camera samples remain authoritative for the trajectory and later drive
    // video-frame inspection in the demo. Live screenshot capture is intentionally
    // disabled because Street View often exposes low-resolution transition frames.
    if (capturedPoint && state.currentRound.captureMode === "interactive") {
      state.currentRound.videoSampleCount = (state.currentRound.videoSampleCount ?? 0) + 1;
    }
    return;
  }

  if (event === "panorama-attached" || event === "api-constructor-hooked") {
    if (state.currentRound) addDiagnostic(state.currentRound, event, payload);
    return;
  }

  if (event === "diagnostic" && state.currentRound) {
    addDiagnostic(state.currentRound, payload?.name ?? "google_diagnostic", payload);
  }
}


function adoptGoogleFrameIfCompatible(round, payload) {
  if (!round || !payload?.frameInstanceId) return false;
  const payloadPoint = isCoordinate(payload?.spawnRequested)
    ? payload.spawnRequested
    : isCoordinate(payload)
      ? payload
      : null;
  const reference = round.actualStart ?? round.spawnRequested ?? round.samples[0] ?? null;
  const coordinateCompatible =
    !payloadPoint ||
    !isCoordinate(reference) ||
    distanceMeters(reference, payloadPoint) <= 25;
  const canAdopt =
    coordinateCompatible &&
    (round.provisional || String(round.frameInstanceId ?? "").startsWith("dom-"));
  if (!canAdopt) return false;

  const previousFrameInstanceId = round.frameInstanceId;
  round.frameInstanceId = payload.frameInstanceId;
  round.provisional = false;
  if (payloadPoint) round.spawnRequested = normalizeCameraPoint(payloadPoint);
  addDiagnostic(round, "google_frame_adopted", {
    previousFrameInstanceId,
    frameInstanceId: payload.frameInstanceId,
  });
  return true;
}

function ensureSessionForRound(state, settings) {
  const pageHint = state.pageContext?.competitionHint ?? null;
  const context = state.sessionContext;
  const settingsChanged =
    context &&
    (context.competitionId !== settings.competitionId ||
      context.model !== settings.model ||
      context.condition !== settings.condition);
  const pageCompetitionChanged =
    context?.openGuessrCompetitionHint &&
    pageHint &&
    context.openGuessrCompetitionHint !== pageHint;

  if (
    !context ||
    state.pendingSessionReset ||
    settingsChanged ||
    pageCompetitionChanged ||
    state.sessionStatus === "complete" ||
    state.sessionStatus === "closed"
  ) {
    startNewSession(state, settings, pageHint);
    return;
  }

  if (!context.openGuessrCompetitionHint && pageHint) {
    context.openGuessrCompetitionHint = pageHint;
  }
}

function startNewSession(state, settings, pageHint = null) {
  const startedAt =
    state.competitionStartedAt ??
    state.competitionStartIntentAt ??
    new Date().toISOString();
  state.sessionId = `session-${safeIsoForId(startedAt)}-${randomId()}`;
  state.sessionStartedAt = startedAt;
  state.sessionStatus = "active";
  state.competitionStartConfirmed = true;
  state.sessionContext = {
    competitionId: settings.competitionId,
    model: settings.model,
    condition: settings.condition,
    openGuessrCompetitionHint: pageHint,
  };
  state.roundCounter = 0;
  state.completedRounds = [];
  state.expectedRoundCount = null;
  state.pendingSessionReset = false;
  state.awaitingNewFrame = false;
  state.lastFinishedFrameInstanceId = null;
  state.lastFinishedCoordinate = null;
  state.lastFinishedPanoId = null;
  state.lastFinishedAt = null;
  state.lastFinishedRoundNumber = null;
  state.lastSessionSave = null;
}

function predictedCompetitionRoundCount(state) {
  const keys = new Set();
  for (const round of state.completedRounds ?? []) {
    if (!round?.predictionCaptured || round?.saveSuccess === false) continue;
    const number = positiveIntegerOrNull(round.competitionRound ?? round.competitionOverallIndex);
    if (number) keys.add(number);
  }
  return keys.size;
}

function nextFormalCompetitionRound(state, explicitRoundNumber = null) {
  return positiveIntegerOrNull(explicitRoundNumber) ?? predictedCompetitionRoundCount(state) + 1;
}

function canStartFormalCompetitionRound(state, explicitRoundNumber = null) {
  const next = nextFormalCompetitionRound(state, explicitRoundNumber);
  return !(Number.isInteger(state.expectedRoundCount) && next > state.expectedRoundCount);
}

function firstInteractiveRoundIsVisiblyLive(state) {
  const probe = state.pageProbe;
  if (!probe || probe.competitionStartPromptVisible || probe.resultVisible || probe.pageState === "result") {
    return false;
  }
  return Boolean(
    probe.roundLikelyActive ||
      probe.pageState === "round" ||
      probe.guessControlVisible ||
      positiveIntegerOrNull(probe.roundNumber),
  );
}

function startRound(
  state,
  settings,
  {
    frameInstanceId,
    spawnRequested,
    detectedAt,
    pageRoundNumber = null,
    pageRoundTotal = null,
    captureMode = null,
    startSource = "streetview-frame",
    provisional = false,
  },
) {
  if (!captureSessionReady(state, settings)) return null;
  clearFinalizeTimer(state.tabId);
  ensureSessionForRound(state, settings);
  const nowMs = parseTime(detectedAt) ?? Date.now();
  const detectedRoundNumber = positiveIntegerOrNull(pageRoundNumber);
  const formalRoundNumber = nextFormalCompetitionRound(state, detectedRoundNumber);
  if (!canStartFormalCompetitionRound(state, formalRoundNumber)) return null;
  state.roundCounter = Math.max(state.roundCounter ?? 0, formalRoundNumber);
  const roundIndex = formalRoundNumber - 1;
  state.awaitingNewFrame = false;
  state.advanceIntentAt = null;
  state.currentRound = {
    id: `round-${roundIndex + 1}`,
    index: roundIndex,
    competitionRound: formalRoundNumber,
    pageRoundNumber: detectedRoundNumber,
    pageRoundTotal: positiveIntegerOrNull(pageRoundTotal),
    captureMode: normalizeCaptureMode(captureMode, settings.condition),
    startSource,
    provisional: Boolean(provisional),
    frameInstanceId: frameInstanceId ?? `frame-${Date.now()}`,
    startedAtMs: nowMs,
    startedAt: new Date(nowMs).toISOString(),
    spawnRequested: normalizeCameraPoint(spawnRequested),
    actualStart: null,
    samples: [],
    captureSources: {},
    prediction: null,
    predictionIntentAt: null,
    staticImage: null,
    playbackActions: [],
    departureFrames: [],
    finalView: null,
    video: null,
    videoSampleCount: 0,
    frozenAt: null,
    frozenAtMs: null,
    freezeReason: null,
    lastPageProbeAt: null,
    lastProbeSignature: null,
    diagnostics: {
      events: [],
      firstCaptureAt: null,
      lastCaptureAt: null,
      truncated: false,
    },
    settingsSnapshot: {
      competitionId: settings.competitionId,
      model: settings.model,
      condition: settings.condition,
      collectorUrl: settings.collectorUrl,
      fallbackDownload: settings.fallbackDownload,
      downloadSubfolder: settings.downloadSubfolder,
      sampleIntervalMs: settings.sampleIntervalMs,
      positionThresholdM: settings.positionThresholdM,
      angleThresholdDeg: settings.angleThresholdDeg,
      pitchThresholdDeg: settings.pitchThresholdDeg,
      zoomThreshold: settings.zoomThreshold,
      maxSilentIntervalMs: settings.maxSilentIntervalMs,
      maxSamples: settings.maxSamples,
    },
  };
  if (state.currentRound.pageRoundTotal) {
    state.expectedRoundCount ??= state.currentRound.pageRoundTotal;
  }
  addDiagnostic(state.currentRound, "round_started", {
    frameInstanceId,
    spawnRequested: state.currentRound.spawnRequested,
    competitionRound: state.currentRound.competitionRound,
    pageRoundNumber: state.currentRound.pageRoundNumber,
    pageRoundTotal: state.currentRound.pageRoundTotal,
    captureMode: state.currentRound.captureMode,
    startSource,
    provisional: state.currentRound.provisional,
  });
  if (state.currentRound.captureMode === "nmpz") {
    scheduleStaticImageCapture(state.tabId, state.currentRound);
  }
  return state.currentRound;
}

function freezeRound(round, at, reason) {
  if (!round || Number.isFinite(round.frozenAtMs)) return;
  const atMs = parseTime(at) ?? Date.now();
  round.frozenAtMs = Math.max(round.startedAtMs, atMs);
  round.frozenAt = new Date(round.frozenAtMs).toISOString();
  round.freezeReason = reason ?? "result_visible";
  addDiagnostic(round, "round_frozen", {
    at: round.frozenAt,
    reason: round.freezeReason,
    sampleCount: round.samples.length,
    predictionCaptured: Boolean(round.prediction),
  });
}

function captureSample(round, payload) {
  const settings = round.settingsSnapshot;
  const capturedAtMs =
    Number.isFinite(Number(payload.capturedAtMs))
      ? Number(payload.capturedAtMs)
      : parseTime(payload.capturedAt) ?? Date.now();
  if (
    Number.isFinite(round.frozenAtMs) &&
    capturedAtMs > round.frozenAtMs
  ) {
    return null;
  }
  // Exploration ends when the user submits the guess, not when the result DOM
  // finishes rendering. OpenGuessr may reset/recenter Street View during that
  // short transition; those API events must not become fake movement samples.
  const predictionIntentAtMs = parseTime(round.predictionIntentAt);
  if (Number.isFinite(predictionIntentAtMs) && capturedAtMs >= predictionIntentAtMs) {
    return null;
  }

  const point = {
    seq: round.samples.length,
    roundIndex: round.index,
    tMs: Math.max(0, capturedAtMs - round.startedAtMs),
    capturedAt: new Date(capturedAtMs).toISOString(),
    receivedAt: new Date().toISOString(),
    ...normalizeCameraPoint(payload),
    source: payload.source ?? "api",
    reason: payload.reason ?? "capture",
    frameInstanceId: payload.frameInstanceId ?? round.frameInstanceId,
  };

  const previous = round.samples.at(-1);
  if (previous && !sampleChanged(previous, point, settings)) return null;

  if (round.samples.length >= settings.maxSamples) {
    round.diagnostics.truncated = true;
    round.samples[round.samples.length - 1] = {
      ...point,
      seq: round.samples.length - 1,
    };
  } else {
    round.samples.push(point);
  }

  if (!round.actualStart) {
    round.actualStart = {
      lat: point.lat,
      lng: point.lng,
      capturedAt: point.capturedAt,
      panoId: point.panoId ?? null,
    };
  }

  round.captureSources[point.source] =
    (round.captureSources[point.source] ?? 0) + 1;
  round.diagnostics.firstCaptureAt ??= point.capturedAt;
  round.diagnostics.lastCaptureAt = point.capturedAt;
  return point;
}

function sampleChanged(previous, current, settings) {
  if ((current.tMs ?? 0) - (previous.tMs ?? 0) >= settings.maxSilentIntervalMs) {
    return true;
  }
  if (current.panoId && current.panoId !== previous.panoId) return true;
  if (
    distanceMeters(previous, current) >= settings.positionThresholdM ||
    angularDifference(previous.heading, current.heading) >=
      settings.angleThresholdDeg ||
    absoluteDifference(previous.pitch, current.pitch) >=
      settings.pitchThresholdDeg ||
    absoluteDifference(previous.zoom, current.zoom) >= settings.zoomThreshold ||
    absoluteDifference(previous.fov, current.fov) >= settings.zoomThreshold
  ) {
    return true;
  }
  return false;
}

async function finalizeRound(tabId, state, stopReason) {
  const round = state.currentRound;
  if (!round) return null;
  const key = `${tabId}:${round.id}:${round.startedAt}`;
  const existing = finalizeRoundPromises.get(key);
  if (existing) return existing;
  const promise = finalizeRoundInternal(tabId, state, stopReason, round)
    .finally(() => finalizeRoundPromises.delete(key));
  finalizeRoundPromises.set(key, promise);
  return promise;
}

async function finalizeRoundInternal(tabId, state, stopReason, round) {
  clearFinalizeTimer(tabId);
  if (!round || state.currentRound !== round) return null;

  await awaitStaticImageCapture(tabId, round);
  await stopInteractiveRoundVideo(tabId, state, round, stopReason);
  await cancelInteractiveActionCapture(tabId, round);

  if (!round.samples.length && isCoordinate(round.spawnRequested)) {
    captureSample(round, {
      ...round.spawnRequested,
      capturedAt: round.startedAt,
      capturedAtMs: round.startedAtMs,
      source: round.captureMode === "nmpz" ? "openguessr-nmpz" : "synthetic",
      reason: "finalize_start_fallback",
      frameInstanceId: round.frameInstanceId,
    });
  }

  const stoppedAtMs = Number.isFinite(round.frozenAtMs)
    ? round.frozenAtMs
    : Date.now();
  const lastSampleMs = round.samples.at(-1)?.tMs ?? 0;
  const durationMs = Math.max(lastSampleMs, stoppedAtMs - round.startedAtMs);
  const stoppedAt = new Date(round.startedAtMs + durationMs).toISOString();
  const settings = round.settingsSnapshot;
  const configuredCondition = settings.condition;
  const condition = effectiveConditionForRound(round, configuredCondition);
  const recordingId = `ogrr-${safeIsoForId(round.startedAt)}-${randomId()}`;
  const roundMetadata = {
    index: round.index,
    id: round.id,
    detectedAt: round.startedAt,
    detectedAtMs: round.startedAtMs,
    endedAt: stoppedAt,
    endedAtMs: round.startedAtMs + durationMs,
    roundSignal: buildRoundSignal(round),
    spawnRequested: round.spawnRequested,
    actualStart: round.actualStart,
    sampleCount: round.samples.length,
    firstSampleSeq: round.samples[0]?.seq ?? null,
    lastSampleSeq: round.samples.at(-1)?.seq ?? null,
    frameInstanceId: round.frameInstanceId,
    competitionRound: round.competitionRound ?? null,
    pageRoundNumber: round.pageRoundNumber ?? null,
    pageRoundTotal: round.pageRoundTotal ?? null,
    captureMode: round.captureMode ?? null,
    startSource: round.startSource ?? null,
    provisional: Boolean(round.provisional),
    frozenAt: round.frozenAt ?? null,
    freezeReason: round.freezeReason ?? null,
    staticImage: round.staticImage ?? null,
    playbackActionCount: Array.isArray(round.playbackActions) ? round.playbackActions.length : 0,
    departureFrameCount: Array.isArray(round.departureFrames) ? round.departureFrames.length : 0,
    finalView: round.finalView ?? null,
    video: round.video ?? null,
  };

  const recording = {
    schemaVersion: "2.0",
    recordingType: "openguessr-round",
    recorder: {
      name: RECORDER_NAME,
      version: EXTENSION_VERSION,
    },
    id: recordingId,
    sessionId: state.sessionId,
    sourceApplication: "OpenGuessr",
    pageUrl: state.pageContext?.pageUrl ?? null,
    competitionId: settings.competitionId,
    competitionOverallIndex:
      positiveIntegerOrNull(round.competitionRound) ??
      round.pageRoundNumber ??
      (Number.isInteger(round.index) ? round.index + 1 : null),
    openGuessrCompetitionHint: state.pageContext?.competitionHint ?? null,
    model: settings.model,
    condition,
    configuredCondition:
      condition === configuredCondition ? null : configuredCondition,
    captureMode: round.captureMode ?? null,
    restriction: round.captureMode === "nmpz" ? "nmpz" : null,
    staticImage: round.staticImage ?? null,
    playbackActions: Array.isArray(round.playbackActions) ? round.playbackActions : [],
    departureFrames: Array.isArray(round.departureFrames) ? round.departureFrames : [],
    finalView: round.finalView ?? null,
    video: round.video ?? null,
    partial: !round.prediction,
    startedAt: round.startedAt,
    stoppedAt,
    durationMs,
    stopReason,
    prediction: round.prediction,
    config: {
      sampleIntervalMs: settings.sampleIntervalMs,
      positionThresholdM: settings.positionThresholdM,
      angleThresholdDeg: settings.angleThresholdDeg,
      pitchThresholdDeg: settings.pitchThresholdDeg,
      zoomThreshold: settings.zoomThreshold,
      maxSilentIntervalMs: settings.maxSilentIntervalMs,
      maxSamples: settings.maxSamples,
    },
    round: roundMetadata,
    rounds: [roundMetadata],
    captureSources: round.captureSources,
    sampleCount: round.samples.length,
    // Semantic key moments are intentionally not inferred from ordinary camera
    // motion. They can be added later by a human annotator or agent analysis.
    // Raw samples remain complete for replay/scrubbing.
    keyMoments: [],
    diagnostics: {
      ...round.diagnostics,
      lastPageProbe: state.pageProbe ?? null,
    },
    samples: round.samples,
  };

  state.currentRound = null;
  const completedCompetitionRound = Boolean(round.prediction);
  state.awaitingNewFrame = completedCompetitionRound;
  if (completedCompetitionRound) {
    state.lastFinishedFrameInstanceId = round.frameInstanceId;
    // Track the terminal LIVE camera state, not the initial spawn. In interactive
    // rounds the result screen can continue emitting the explored position; using
    // the spawn here makes that old position look like a new round.
    state.lastFinishedCoordinate =
      round.samples.at(-1) ?? round.actualStart ?? round.spawnRequested ?? null;
    state.lastFinishedPanoId = round.samples.at(-1)?.panoId ?? null;
    state.lastFinishedAt = stoppedAt;
    state.lastFinishedRoundNumber =
      round.competitionRound ?? round.pageRoundNumber ?? (Number.isInteger(round.index) ? round.index + 1 : null);
  }
  state.lastRecordingId = recordingId;
  await persistTabState(tabId, state);

  const saveResult = await deliverRecording(recording, settings);
  state.lastSave = {
    at: new Date().toISOString(),
    recordingId,
    ...saveResult,
  };

  if (Number.isInteger(saveResult.competitionLocationCount)) {
    state.expectedRoundCount = saveResult.competitionLocationCount;
  }
  state.completedRounds ??= [];
  state.completedRounds.push({
    recordingId,
    roundId: round.id,
    roundIndex: round.index,
    startedAt: round.startedAt,
    stoppedAt,
    stopReason,
    sampleCount: round.samples.length,
    predictionCaptured: Boolean(round.prediction),
    condition,
    captureMode: round.captureMode ?? null,
    saveMethod: saveResult.method,
    saveSuccess: Boolean(saveResult.success),
    path: saveResult.path ?? null,
    locationId: saveResult.locationId ?? null,
    competitionPartId: saveResult.competitionPartId ?? null,
    competitionRound:
      saveResult.competitionRound ?? round.competitionRound ?? round.pageRoundNumber ?? round.index + 1,
    competitionOverallIndex:
      saveResult.competitionOverallIndex ?? round.competitionRound ?? round.pageRoundNumber ?? round.index + 1,
    locationMatchDistanceMeters: saveResult.locationMatchDistanceMeters ?? null,
    staticImage: round.staticImage ?? null,
    video: round.video ?? null,
    videoSaveSuccess:
      round.captureMode !== "interactive" || Boolean(round.video?.path),
    videoError: round.video?.status === "error" ? round.video.error ?? "Round video failed." : null,
    playbackActionCount: Array.isArray(round.playbackActions) ? round.playbackActions.length : 0,
  });

  const completedRoundCount = countCompletedRounds(state.completedRounds);
  state.sessionStatus =
    Number.isInteger(state.expectedRoundCount) &&
    completedRoundCount >= state.expectedRoundCount
      ? "complete"
      : "active";
  if (state.sessionStatus === "complete") {
    state.recordingArmed = false;
  }
  state.lastRoundSavedAt = new Date().toISOString();

  // Close the prepared tab stream after the final per-round video has been finalized
  // so that manifest contains the stopped status and finalized WebM metadata.
  if (state.sessionStatus === "complete" && ["ready", "recording"].includes(state.videoCapture?.status)) {
    await stopInteractiveVideoCapture(tabId, state, "competition_complete");
  }
  const sessionSave = await deliverSessionManifest(state, settings);
  state.lastSessionSave = {
    at: new Date().toISOString(),
    ...sessionSave,
  };
  await persistTabState(tabId, state);
  return recording;
}

async function deliverRecording(recording, settings) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(settings.collectorUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(recording),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error ?? `Collector returned HTTP ${response.status}.`);
    }
    return {
      method: "collector",
      success: true,
      path: payload.path ?? null,
      locationId: payload.locationId ?? null,
      locationMatchDistanceMeters: payload.locationMatchDistanceMeters ?? null,
      competitionPartId: payload.competitionPartId ?? null,
      competitionRound: payload.competitionRound ?? null,
      competitionOverallIndex: payload.competitionOverallIndex ?? null,
      competitionLocationCount: Number.isInteger(payload.competitionLocationCount)
        ? payload.competitionLocationCount
        : null,
    };
  } catch (error) {
    if (!settings.fallbackDownload) {
      return {
        method: "collector",
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    try {
      const filename = buildFallbackFilename(recording, settings);
      const url = `data:application/json;charset=utf-8,${encodeURIComponent(
        `${JSON.stringify(recording, null, 2)}\n`,
      )}`;
      const downloadId = await chrome.downloads.download({
        url,
        filename,
        saveAs: false,
        conflictAction: "uniquify",
      });
      return {
        method: "download-fallback",
        success: true,
        downloadId,
        collectorError: error instanceof Error ? error.message : String(error),
      };
    } catch (downloadError) {
      return {
        method: "download-fallback",
        success: false,
        error:
          downloadError instanceof Error
            ? downloadError.message
            : String(downloadError),
        collectorError: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

async function deliverSessionManifest(state, settings) {
  if (!state.sessionId || !state.sessionContext) {
    return { success: false, error: "Session has not started." };
  }

  let endpoint;
  try {
    endpoint = new URL(settings.collectorUrl);
    endpoint.pathname = "/api/sessions";
    endpoint.search = "";
    endpoint.hash = "";
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(buildSessionManifest(state)),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error ?? `Collector returned HTTP ${response.status}.`);
    }
    return {
      success: true,
      method: "collector",
      path: payload.path ?? null,
      roundCount: payload.roundCount ?? countCompletedRounds(state.completedRounds),
    };
  } catch (error) {
    return {
      success: false,
      method: "collector",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildSessionManifest(state) {
  const rounds = Array.isArray(state.completedRounds) ? state.completedRounds : [];
  const completedConditions = [
    ...new Set(rounds.map((round) => round.condition).filter(Boolean)),
  ];
  const effectiveCondition =
    completedConditions.length === 1
      ? completedConditions[0]
      : state.sessionContext?.condition ?? "interactive-panorama";
  return {
    schemaVersion: "1.0",
    sessionId: state.sessionId,
    sourceApplication: "OpenGuessr",
    recorder: {
      name: RECORDER_NAME,
      version: EXTENSION_VERSION,
    },
    competitionId: state.sessionContext?.competitionId ?? "unassigned",
    openGuessrCompetitionHint:
      state.sessionContext?.openGuessrCompetitionHint ??
      state.pageContext?.competitionHint ??
      null,
    model: state.sessionContext?.model ?? "Unknown model",
    condition: effectiveCondition,
    configuredCondition: state.sessionContext?.condition ?? null,
    pageUrl: state.pageContext?.pageUrl ?? null,
    startedAt: state.sessionStartedAt ?? null,
    updatedAt: new Date().toISOString(),
    status: state.sessionStatus ?? "active",
    expectedRoundCount: state.expectedRoundCount ?? null,
    completedRoundCount: countCompletedRounds(rounds),
    rounds,
    videoCapture: state.videoCapture
      ? {
          streamSessionId: state.videoCapture.streamSessionId ?? null,
          readyAt: state.videoCapture.readyAt ?? null,
          stoppedAt: state.videoCapture.stoppedAt ?? null,
          status: state.videoCapture.status ?? null,
          activeRoundCaptureId: state.videoCapture.activeRoundCaptureId ?? null,
        }
      : null,
  };
}


function normalizeCaptureMode(modeHint, configuredCondition) {
  if (configuredCondition === "static-image") return "nmpz";
  if (configuredCondition === "interactive-panorama") return "interactive";
  return modeHint === "nmpz" ? "nmpz" : "interactive";
}

function effectiveConditionForRound(round, configuredCondition) {
  if (configuredCondition === "static-image" || configuredCondition === "interactive-panorama") {
    return configuredCondition;
  }
  return round?.captureMode === "nmpz" ? "static-image" : "interactive-panorama";
}

function countCompletedRounds(rounds) {
  const keys = new Set();
  for (const round of rounds ?? []) {
    // A formal experiment round is only complete once its prediction was captured
    // and its JSON was successfully saved. Partial transition artifacts may still
    // be preserved for diagnostics, but they must never advance 7/8 to 8/8.
    if (!round?.predictionCaptured || round?.saveSuccess === false) continue;
    if (round.captureMode === "interactive" && round.videoSaveSuccess === false) continue;
    const key = Number.isInteger(round.competitionOverallIndex)
      ? `overall:${round.competitionOverallIndex}`
      : Number.isInteger(round.competitionRound)
        ? `round:${round.competitionRound}`
        : `local:${round.roundIndex ?? round.recordingId}`;
    keys.add(key);
  }
  return keys.size;
}

function markInteractiveDepartureFrame(round, payload = {}) {
  if (!round || round.captureMode !== "interactive") return null;
  const action = round.playbackActions?.at(-1) ?? null;
  const image = action?.image ?? null;
  if (!action || !image || (!image.path && !image.filename)) {
    addDiagnostic(round, "interactive_departure_without_sharp_frame", {
      at: payload?.at ?? null,
      pointerType: payload?.pointerType ?? null,
    });
    return null;
  }

  const atMs = parseTime(payload?.at) ?? Date.now();
  const tMs = Math.max(0, atMs - round.startedAtMs);
  round.departureFrames ??= [];
  const previous = round.departureFrames.at(-1);
  if (previous && Math.abs((previous.tMs ?? 0) - tMs) < 120) return previous;

  const departure = {
    id: `departure-${String(round.departureFrames.length + 1).padStart(3, "0")}`,
    tMs,
    capturedAt: new Date(atMs).toISOString(),
    playbackActionId: action.id ?? null,
    camera: action.camera ?? null,
    image,
    reusedSharpState: true,
    pointerType: payload?.pointerType ?? null,
  };
  round.departureFrames.push(departure);
  action.departedAt = departure.capturedAt;
  action.departureCount = (action.departureCount ?? 0) + 1;
  addDiagnostic(round, "interactive_departure_frame_marked", {
    departureId: departure.id,
    playbackActionId: departure.playbackActionId,
    tMs,
    path: image.path ?? image.filename ?? null,
  });
  return departure;
}

function markInteractiveFinalFrame(round, payload = {}) {
  if (!round || round.captureMode !== "interactive") return null;
  const action = round.playbackActions?.at(-1) ?? null;
  if (!action?.image) return null;
  const atMs = parseTime(payload?.at) ?? Date.now();
  round.finalView = {
    tMs: Math.max(0, atMs - round.startedAtMs),
    capturedAt: new Date(atMs).toISOString(),
    playbackActionId: action.id ?? null,
    camera: action.camera ?? null,
    image: action.image,
    reusedSharpState: true,
  };
  addDiagnostic(round, "interactive_final_frame_marked", {
    playbackActionId: action.id ?? null,
    path: action.image?.path ?? action.image?.filename ?? null,
  });
  return round.finalView;
}

function scheduleInteractiveActionCapture(tabId, round, point) {
  if (
    !Number.isInteger(tabId) ||
    !round ||
    round.captureMode !== "interactive" ||
    !point ||
    point.source !== "api" ||
    round.predictionIntentAt ||
    Number.isFinite(round.frozenAtMs)
  ) {
    return;
  }

  let active = interactiveActionCaptureState.get(tabId);
  if (!active || active.roundId !== round.id || active.startedAt !== round.startedAt) {
    clearInteractiveActionCapture(tabId);
    active = {
      roundId: round.id,
      startedAt: round.startedAt,
      generation: 0,
      timer: null,
      inFlight: null,
      pendingPoint: null,
      pendingKind: null,
      pendingPanoId: null,
      lastScreenshotAtMs: 0,
    };
    interactiveActionCaptureState.set(tabId, active);
  }

  const previousCamera = round.playbackActions?.at(-1)?.camera ?? null;
  const classification = classifyPlaybackAction(previousCamera, point, round.settingsSnapshot);
  if (!classification) return;

  const isInitial = !previousCamera;
  const panoChanged = Boolean(
    !isInitial &&
    point.panoId &&
    previousCamera?.panoId &&
    point.panoId !== previousCamera.panoId,
  );
  const kind = isInitial ? "initial" : panoChanged ? "pano" : "view";
  const panoId = point.panoId ?? null;

  // If a capture is already running, keep only the newest point for the NEXT
  // capture. The current capture is not cancelled by harmless same-pano API
  // updates. This is what lets a sharp panorama state survive fast exploration.
  if (active.inFlight) {
    active.pendingPoint = { ...point };
    active.pendingKind = kind;
    active.pendingPanoId = panoId;
    return;
  }

  if (kind === "pano") {
    // Once a new panoId has appeared, start one fixed render deadline. Repeated
    // heading/position samples for that SAME pano update the camera metadata but
    // DO NOT restart the timer. A truly newer pano replaces it and starts a new
    // deadline because the old panorama is no longer visible.
    if (
      active.timer &&
      active.pendingKind === "pano" &&
      active.pendingPanoId === panoId
    ) {
      active.pendingPoint = { ...point };
      return;
    }

    if (active.timer) clearTimeout(active.timer);
    active.timer = null;
    active.pendingPoint = { ...point };
    active.pendingKind = "pano";
    active.pendingPanoId = panoId;
    armInteractiveActionCaptureTimer(tabId, active, INTERACTIVE_PANO_SETTLE_MS);
    return;
  }

  if (kind === "initial") {
    // The initial frame is guaranteed. It starts immediately and temporarily
    // locks interaction inside captureInteractivePlaybackAction until a sharp
    // starting state has been saved.
    active.pendingPoint = { ...point };
    active.pendingKind = "initial";
    active.pendingPanoId = panoId;
    if (!active.timer) armInteractiveActionCaptureTimer(tabId, active, 0);
    return;
  }

  // Same-panorama pan / tilt / zoom: latest pose wins. These are the only
  // events that use a trailing debounce.
  active.pendingPoint = { ...point };
  active.pendingKind = "view";
  active.pendingPanoId = panoId;
  if (active.timer) clearTimeout(active.timer);
  active.timer = null;
  armInteractiveActionCaptureTimer(tabId, active, INTERACTIVE_VIEW_TRAILING_MS);
}

function armInteractiveActionCaptureTimer(tabId, active, delayMs) {
  if (!active || active.timer || active.inFlight || !active.pendingPoint) return;
  const generation = active.generation;
  active.timer = setTimeout(() => {
    const latest = interactiveActionCaptureState.get(tabId);
    if (!latest || latest !== active || latest.generation !== generation) return;
    latest.timer = null;
    const expected = { id: latest.roundId, startedAt: latest.startedAt };
    const captureKind = latest.pendingKind ?? "view";
    const expectedPanoId = latest.pendingPanoId ?? latest.pendingPoint?.panoId ?? null;
    const promise = captureInteractivePlaybackAction(tabId, expected, generation, {
      kind: captureKind,
      expectedPanoId,
    });
    latest.inFlight = promise;
    void promise.finally(async () => {
      const current = interactiveActionCaptureState.get(tabId);
      if (!current || current !== active || current.generation !== generation) return;
      if (current.inFlight === promise) current.inFlight = null;
      await scheduleInteractiveFollowupIfNeeded(tabId, current);
    });
  }, Math.max(0, delayMs));
}

async function scheduleInteractiveFollowupIfNeeded(tabId, active) {
  if (!active || active.timer || active.inFlight || !active.pendingPoint) return;
  const state = await getTabState(tabId);
  const round = state.currentRound;
  if (
    !round ||
    round.id !== active.roundId ||
    round.startedAt !== active.startedAt ||
    round.captureMode !== "interactive" ||
    round.predictionIntentAt ||
    Number.isFinite(round.frozenAtMs)
  ) {
    return;
  }

  const point = { ...active.pendingPoint };
  active.pendingPoint = null;
  active.pendingKind = null;
  active.pendingPanoId = null;
  scheduleInteractiveActionCapture(tabId, round, point);
}

async function cancelInteractiveActionCapture(tabId, round = null) {
  const active = interactiveActionCaptureState.get(tabId);
  if (!active) return;
  if (
    round &&
    (active.roundId !== round.id || active.startedAt !== round.startedAt)
  ) {
    return;
  }
  active.generation += 1;
  if (active.timer) clearTimeout(active.timer);
  active.timer = null;
  active.pendingPoint = null;
  active.pendingKind = null;
  active.pendingPanoId = null;
  if (active.inFlight) {
    try {
      await Promise.race([active.inFlight, sleep(2200)]);
    } catch {
      // Interactive capture failures are diagnostic-only and never block saving.
    }
  }
  if (interactiveActionCaptureState.get(tabId) === active) {
    interactiveActionCaptureState.delete(tabId);
  }
  await chrome.tabs.sendMessage(tabId, {
    type: "OGRR_RESTORE_INTERACTIVE_CAPTURE",
  }).catch(() => {});
  await chrome.tabs.sendMessage(tabId, {
    type: "OGRR_RESTORE_STATIC_CAPTURE",
  }).catch(() => {});
}

function clearInteractiveActionCapture(tabId) {
  const active = interactiveActionCaptureState.get(tabId);
  if (active?.timer) clearTimeout(active.timer);
  if (active) active.generation += 1;
  interactiveActionCaptureState.delete(tabId);
  void chrome.tabs.sendMessage(tabId, {
    type: "OGRR_RESTORE_INTERACTIVE_CAPTURE",
  }).catch(() => {});
  void chrome.tabs.sendMessage(tabId, {
    type: "OGRR_RESTORE_STATIC_CAPTURE",
  }).catch(() => {});
}

async function captureInteractivePlaybackAction(
  tabId,
  expected,
  generation,
  { kind = "view", expectedPanoId = null } = {},
) {
  const active = interactiveActionCaptureState.get(tabId);
  if (!active || active.generation !== generation || !active.pendingPoint) return null;

  const triggerPoint = { ...active.pendingPoint };
  active.pendingPoint = null;
  active.pendingKind = null;
  active.pendingPanoId = null;

  let state = await getTabState(tabId);
  let round = state.currentRound;
  if (!sameRound(round, expected) || round.captureMode !== "interactive") return null;
  if (round.predictionIntentAt || Number.isFinite(round.frozenAtMs)) return null;

  const tab = await chrome.tabs.get(tabId);
  if (!tab?.active || !Number.isInteger(tab.windowId)) return null;

  const isInitial = kind === "initial";
  const isPano = kind === "pano";
  const isView = kind === "view";
  let initialGuardStarted = false;

  try {
    if (isInitial) {
      const guard = await chrome.tabs.sendMessage(tabId, {
        type: "OGRR_BEGIN_STATIC_CAPTURE",
      }).catch(() => null);
      if (!guard?.ok) return null;
      initialGuardStarted = true;
      await chrome.tabs.sendMessage(tabId, {
        type: "OGRR_STATIC_CAPTURE_BADGE",
        visible: true,
        text: "Preparing initial exploration image…",
      }).catch(() => {});
      await sleep(INTERACTIVE_INITIAL_MIN_WAIT_MS);
    }

    const captureStartedAtMs = Date.now();
    let attempts = 0;
    let bestCandidate = null;
    let previousCandidate = null;
    const maxAttempts = isPano
      ? INTERACTIVE_PANO_CAPTURE_MAX_ATTEMPTS
      : INTERACTIVE_CAPTURE_MAX_ATTEMPTS;

    while (
      attempts < maxAttempts &&
      Date.now() - captureStartedAtMs <= INTERACTIVE_CAPTURE_MAX_WAIT_MS
    ) {
      const currentActive = interactiveActionCaptureState.get(tabId);
      if (!currentActive || currentActive.generation !== generation) return null;

      state = await getTabState(tabId);
      round = state.currentRound;
      if (!sameRound(round, expected)) return null;
      if (round.predictionIntentAt || Number.isFinite(round.frozenAtMs)) return null;

      // A same-panorama view gesture should still be "latest pose wins". Initial
      // and pano captures deliberately ignore harmless updates from the same
      // panorama; only a truly newer pano invalidates a pano capture.
      if (isView && currentActive.pendingPoint) return null;
      if (
        isPano &&
        currentActive.pendingPoint?.panoId &&
        expectedPanoId &&
        currentActive.pendingPoint.panoId !== expectedPanoId &&
        !bestCandidate
      ) {
        return null;
      }

      const prepType = isInitial
        ? "OGRR_PREPARE_STATIC_CAPTURE"
        : "OGRR_PREPARE_INTERACTIVE_CAPTURE";
      let prep;
      try {
        prep = await chrome.tabs.sendMessage(tabId, { type: prepType });
      } catch (error) {
        prep = { ok: false, error: error instanceof Error ? error.message : String(error) };
      }

      if (!prep?.ok || !prep.rect || !prep.viewport) {
        if (!isInitial) {
          await chrome.tabs.sendMessage(tabId, {
            type: "OGRR_RESTORE_INTERACTIVE_CAPTURE",
          }).catch(() => {});
        }
        if (prep?.captureClosed) return null;
        await sleep(120);
        continue;
      }

      let fullDataUrl = null;
      let screenshotAtMs = null;
      try {
        await sleep(isInitial ? 90 : 45);
        if (interactiveActionCaptureState.get(tabId)?.generation !== generation) return null;

        const latestActive = interactiveActionCaptureState.get(tabId);
        if (isView && latestActive?.pendingPoint) return null;
        if (
          isPano &&
          latestActive?.pendingPoint?.panoId &&
          expectedPanoId &&
          latestActive.pendingPoint.panoId !== expectedPanoId &&
          !bestCandidate
        ) {
          return null;
        }

        const sinceLastScreenshot = Date.now() - (latestActive?.lastScreenshotAtMs || 0);
        if (sinceLastScreenshot < INTERACTIVE_CAPTURE_MIN_SCREENSHOT_GAP_MS) {
          await sleep(INTERACTIVE_CAPTURE_MIN_SCREENSHOT_GAP_MS - sinceLastScreenshot);
        }
        if (interactiveActionCaptureState.get(tabId)?.generation !== generation) return null;

        state = await getTabState(tabId);
        round = state.currentRound;
        if (!sameRound(round, expected) || round.predictionIntentAt || Number.isFinite(round.frozenAtMs)) {
          return null;
        }

        const latestTab = await chrome.tabs.get(tabId);
        if (!latestTab?.active || latestTab.windowId !== tab.windowId) return null;
        fullDataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
        screenshotAtMs = Date.now();
        const afterCapture = interactiveActionCaptureState.get(tabId);
        if (afterCapture) afterCapture.lastScreenshotAtMs = screenshotAtMs;
      } finally {
        if (!isInitial) {
          await chrome.tabs.sendMessage(tabId, {
            type: "OGRR_RESTORE_INTERACTIVE_CAPTURE",
          }).catch(() => {});
        }
      }

      if (!fullDataUrl || !Number.isFinite(screenshotAtMs)) return null;
      if (interactiveActionCaptureState.get(tabId)?.generation !== generation) return null;

      attempts += 1;
      const candidate = await cropCapturedImage(fullDataUrl, prep.rect, prep.viewport, {
        analyze: true,
      });
      const sharpness = candidate.analysis?.sharpness ?? 0;
      const stabilityDifference =
        previousCandidate?.analysis && candidate.analysis
          ? meanGrayDifference(previousCandidate.analysis.gray, candidate.analysis.gray)
          : null;

      state = await getTabState(tabId);
      round = state.currentRound;
      if (!sameRound(round, expected)) return null;
      if (round.predictionIntentAt || Number.isFinite(round.frozenAtMs)) return null;
      const visualPoint = latestApiSampleAtOrBefore(round, screenshotAtMs) ?? triggerPoint;

      // For a pano-state capture, never attach an image from a later pano to the
      // earlier action. If the old pano has already disappeared, keep a good
      // candidate already taken; otherwise skip that transient state.
      if (
        isPano &&
        expectedPanoId &&
        visualPoint?.panoId &&
        visualPoint.panoId !== expectedPanoId
      ) {
        if (bestCandidate) break;
        return null;
      }

      const afterAnalysisActive = interactiveActionCaptureState.get(tabId);
      if (isView && afterAnalysisActive?.pendingPoint) return null;

      const scoredCandidate = {
        ...candidate,
        prep,
        attempt: attempts,
        elapsedMs: Date.now() - captureStartedAtMs,
        screenshotAtMs,
        sharpness,
        stabilityDifference,
        point: { ...visualPoint },
      };

      if (
        !candidate.analysis?.blankLike &&
        (!bestCandidate || sharpness > bestCandidate.sharpness)
      ) {
        bestCandidate = scoredCandidate;
      }

      const stableEnough =
        Number.isFinite(stabilityDifference) &&
        stabilityDifference <= INTERACTIVE_CAPTURE_STABLE_DIFF;
      const sharpEnough = bestCandidate?.sharpness >= INTERACTIVE_CAPTURE_MIN_SHARPNESS;

      if (!isPano && attempts >= 2 && bestCandidate && stableEnough && sharpEnough) {
        break;
      }

      // Pano capture is optimized for the user's actual interaction pattern:
      // once the new pano has had its fixed settle window, keep the first clearly
      // usable frame. If it still looks soft, take one verification frame. This
      // avoids waiting until the entire street traversal stops.
      if (
        isPano &&
        bestCandidate &&
        bestCandidate.sharpness >= INTERACTIVE_PANO_FAST_ACCEPT_MIN_SHARPNESS
      ) {
        break;
      }

      previousCandidate = candidate;

      if (attempts < maxAttempts) {
        await sleep(INTERACTIVE_CAPTURE_RETRY_INTERVAL_MS);
        state = await getTabState(tabId);
        round = state.currentRound;
        if (!sameRound(round, expected)) return null;

        const waitActive = interactiveActionCaptureState.get(tabId);
        if (isView && waitActive?.pendingPoint) return null;
        if (
          isPano &&
          waitActive?.pendingPoint?.panoId &&
          expectedPanoId &&
          waitActive.pendingPoint.panoId !== expectedPanoId
        ) {
          if (bestCandidate) break;
          return null;
        }
      }
    }

    const selected = bestCandidate;
    if (!selected) return null;
    if (interactiveActionCaptureState.get(tabId)?.generation !== generation) return null;

    state = await getTabState(tabId);
    round = state.currentRound;
    if (!sameRound(round, expected)) return null;
    if (round.predictionIntentAt || Number.isFinite(round.frozenAtMs)) return null;

    const finalActive = interactiveActionCaptureState.get(tabId);
    if (isView && finalActive?.pendingPoint) return null;

    const point = selected.point ?? triggerPoint;
    round.playbackActions ??= [];
    const previousCamera = round.playbackActions.at(-1)?.camera ?? null;
    const classification = classifyPlaybackAction(previousCamera, point, round.settingsSnapshot);
    if (!classification) return null;

    const actionIndex = (round.playbackActions?.length ?? 0) + 1;
    const actionId = `action-${String(actionIndex).padStart(3, "0")}`;
    const image = await deliverInteractiveActionImage({
      dataUrl: selected.dataUrl,
      width: selected.width,
      height: selected.height,
      prep: selected.prep,
      state,
      round,
      settings: round.settingsSnapshot,
      action: {
        id: actionId,
        index: actionIndex - 1,
        type: classification.type,
        label: classification.label,
        tMs: point.tMs ?? 0,
        sampleSeq: point.seq ?? null,
        camera: cameraFromSample(point),
      },
    });

    if (interactiveActionCaptureState.get(tabId)?.generation !== generation) return null;

    const captureQuality = isInitial
      ? "verified-initial-sharp-frame"
      : isPano
        ? "pano-state-frame"
        : attempts >= 2
          ? "verified-sharp-event-frame"
          : "best-event-frame";

    const playbackAction = {
      id: actionId,
      index: actionIndex - 1,
      type: classification.type,
      label: classification.label,
      description: classification.description,
      tMs: point.tMs ?? 0,
      capturedAt: new Date(selected.screenshotAtMs ?? Date.now()).toISOString(),
      sampleSeq: Number.isInteger(point.seq) ? point.seq : null,
      reason: point.reason ?? null,
      camera: cameraFromSample(point),
      image: {
        status: image.existing ? "existing" : "saved",
        storageMethod: image.method,
        path: image.path ?? null,
        filename: image.filename ?? null,
        downloadId: image.downloadId ?? null,
        width: selected.width,
        height: selected.height,
        captureQuality,
        captureAttempts: attempts,
        captureDelayMs: selected.elapsedMs,
        sharpness: roundMetric(selected.sharpness),
        stabilityDifference: roundMetric(selected.stabilityDifference),
        existing: Boolean(image.existing),
      },
    };

    round.playbackActions.push(playbackAction);
    const linkedSample = round.samples.find((sample) => sample.seq === point.seq);
    if (linkedSample) {
      linkedSample.playbackActionId = actionId;
      linkedSample.image = playbackAction.image;
    }
    addDiagnostic(round, "interactive_playback_action_captured", {
      actionId,
      actionType: classification.type,
      captureKind: kind,
      panoId: point.panoId ?? null,
      tMs: point.tMs ?? 0,
      sampleSeq: point.seq ?? null,
      path: image.path ?? image.filename ?? null,
      captureQuality: playbackAction.image.captureQuality,
      captureAttempts: attempts,
      captureDelayMs: playbackAction.image.captureDelayMs,
      sharpness: playbackAction.image.sharpness,
      stabilityDifference: playbackAction.image.stabilityDifference,
    });
    await persistTabState(tabId, state);
    return playbackAction;
  } finally {
    if (initialGuardStarted) {
      await chrome.tabs.sendMessage(tabId, {
        type: "OGRR_RESTORE_STATIC_CAPTURE",
      }).catch(() => {});
    }
  }
}

function latestApiSampleAtOrBefore(round, capturedAtMs) {
  if (!round?.samples?.length || !Number.isFinite(capturedAtMs)) return null;
  for (let index = round.samples.length - 1; index >= 0; index -= 1) {
    const sample = round.samples[index];
    if (sample?.source !== "api") continue;
    const sampleAtMs = parseTime(sample.capturedAt);
    if (!Number.isFinite(sampleAtMs) || sampleAtMs <= capturedAtMs + 60) {
      return sample;
    }
  }
  return null;
}

function classifyPlaybackAction(previous, current, settings) {
  if (!current) return null;
  if (!previous) {
    return {
      type: "start",
      label: "Exploration start",
      description: "Initial settled interactive Street View viewpoint.",
    };
  }

  const changes = [];
  const moved =
    (current.panoId && previous.panoId && current.panoId !== previous.panoId) ||
    distanceMeters(previous, current) >= Math.max(0.5, settings.positionThresholdM ?? 0.5);
  const panned =
    angularDifference(previous.heading, current.heading) >=
    Math.max(1, settings.angleThresholdDeg ?? 1);
  const tilted =
    absoluteDifference(previous.pitch, current.pitch) >=
    Math.max(1, settings.pitchThresholdDeg ?? 1);
  const zoomed =
    absoluteDifference(previous.zoom, current.zoom) >=
      Math.max(0.05, settings.zoomThreshold ?? 0.05) ||
    absoluteDifference(previous.fov, current.fov) >=
      Math.max(0.05, settings.zoomThreshold ?? 0.05);

  if (moved) changes.push("move");
  if (panned) changes.push("pan");
  if (tilted) changes.push("tilt");
  if (zoomed) changes.push("zoom");
  if (!changes.length) return null;

  const labelMap = { move: "Move", pan: "Pan", tilt: "Tilt", zoom: "Zoom" };
  return {
    type: changes.join("+"),
    label: changes.map((item) => labelMap[item]).join(" + "),
    description: `Settled Street View ${changes.join(", ")} action.`,
  };
}

function cameraFromSample(sample) {
  return {
    lat: Number.isFinite(sample?.lat) ? sample.lat : null,
    lng: Number.isFinite(sample?.lng) ? sample.lng : null,
    heading: Number.isFinite(sample?.heading) ? sample.heading : null,
    pitch: Number.isFinite(sample?.pitch) ? sample.pitch : null,
    zoom: Number.isFinite(sample?.zoom) ? sample.zoom : null,
    fov: Number.isFinite(sample?.fov) ? sample.fov : null,
    panoId: sample?.panoId ?? null,
  };
}

async function deliverInteractiveActionImage({
  dataUrl,
  width,
  height,
  prep,
  state,
  round,
  settings,
  action,
}) {
  const competitionRound =
    positiveIntegerOrNull(round.competitionRound) ??
    round.pageRoundNumber ??
    (Number.isInteger(round.index) ? round.index + 1 : null);
  if (!Number.isInteger(competitionRound) || competitionRound < 1) {
    throw new Error("Cannot save exploration image without a competition round number.");
  }

  let endpoint;
  try {
    endpoint = new URL(settings.collectorUrl);
    endpoint.pathname = "/api/exploration-images";
    endpoint.search = "";
    endpoint.hash = "";
  } catch (error) {
    throw new Error(
      `Invalid collector URL: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const payload = {
    schemaVersion: "1.0",
    competitionId: settings.competitionId,
    competitionRound,
    sessionId: state.sessionId ?? null,
    roundId: round.id ?? null,
    actionId: action.id,
    actionIndex: action.index,
    actionType: action.type,
    actionLabel: action.label,
    sampleSeq: action.sampleSeq,
    tMs: action.tMs,
    capturedAt: new Date().toISOString(),
    captureSource: "openguessr-interactive-playback-action",
    width,
    height,
    viewport: prep?.viewport ?? null,
    sourceElement: prep?.target ?? null,
    camera: action.camera ?? null,
    spawnRequested: round.spawnRequested ?? round.actualStart ?? null,
    imageDataUrl: dataUrl,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error ?? `Collector returned HTTP ${response.status}.`);
    }
    return {
      success: true,
      method: "collector",
      path: body.path ?? null,
      locationId: body.locationId ?? null,
      existing: Boolean(body.existing),
    };
  } catch (error) {
    if (!settings.fallbackDownload) throw error;
    const filename = buildInteractiveActionFallbackFilename(state, round, settings, action);
    const downloadId = await chrome.downloads.download({
      url: dataUrl,
      filename,
      saveAs: false,
      conflictAction: "uniquify",
    });
    return {
      success: true,
      method: "download-fallback",
      filename,
      downloadId,
      existing: false,
      collectorError: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildInteractiveActionFallbackFilename(state, round, settings, action) {
  const competition = safeFilenamePart(settings.competitionId, "unassigned");
  const session = safeFilenamePart(state.sessionId, "session");
  const roundNumber = String(
    round.pageRoundNumber ?? (Number.isInteger(round.index) ? round.index + 1 : 1),
  ).padStart(2, "0");
  const actionNumber = String((action.index ?? 0) + 1).padStart(3, "0");
  return `${settings.downloadSubfolder}/interactive-images-fallback/${competition}/${session}/round-${roundNumber}/action-${actionNumber}.png`;
}


function scheduleStaticImageCapture(tabId, round) {
  if (!Number.isInteger(tabId) || !round || round.captureMode !== "nmpz") return;

  round.staticImage = {
    status: "scheduled",
    captureSource: "openguessr-visible-nmpz",
    scheduledAt: new Date().toISOString(),
    capturedAt: null,
    filename: null,
    width: null,
    height: null,
    sourceElement: null,
    viewport: null,
    captureQuality: null,
    captureAttempts: 0,
    captureDelayMs: null,
    sharpness: null,
    stabilityDifference: null,
    error: null,
  };

  const expected = { id: round.id, startedAt: round.startedAt };
  const promise = (async () => {
    let guardStarted = false;
    try {
      const guard = await chrome.tabs.sendMessage(tabId, {
        type: "OGRR_BEGIN_STATIC_CAPTURE",
      });
      if (!guard?.ok) {
        throw new Error(guard?.error ?? "Could not lock the NMPZ round for image capture.");
      }
      guardStarted = true;

      const state = await getTabState(tabId);
      const current = state.currentRound;
      if (!sameRound(current, expected)) return null;
      current.staticImage = {
        ...(current.staticImage ?? {}),
        status: "capturing",
        error: null,
      };
      await persistTabState(tabId, state);

      const result = await captureStaticImageForRound(tabId, expected);
      return result;
    } catch (error) {
      const state = await getTabState(tabId);
      const current = state.currentRound;
      if (sameRound(current, expected)) {
        const message = error instanceof Error ? error.message : String(error);
        current.staticImage = {
          ...(current.staticImage ?? {}),
          status: "failed",
          error: message,
        };
        addDiagnostic(current, "static_image_capture_error", { message });
        await persistTabState(tabId, state);
      }
      return null;
    } finally {
      if (guardStarted) {
        await chrome.tabs.sendMessage(tabId, {
          type: "OGRR_RESTORE_STATIC_CAPTURE",
        }).catch(() => {});
      }
    }
  })();

  staticImageCapturePromises.set(tabId, {
    roundId: round.id,
    startedAt: round.startedAt,
    promise,
  });

  void promise.finally(() => {
    const active = staticImageCapturePromises.get(tabId);
    if (active?.roundId === expected.id && active?.startedAt === expected.startedAt) {
      staticImageCapturePromises.delete(tabId);
    }
  });
}

function sameRound(round, expected) {
  return Boolean(
    round &&
      expected &&
      round.id === expected.id &&
      round.startedAt === expected.startedAt,
  );
}

async function awaitStaticImageCapture(tabId, round) {
  if (!round || round.captureMode !== "nmpz") return;
  const active = staticImageCapturePromises.get(tabId);
  if (!active || active.roundId !== round.id || active.startedAt !== round.startedAt) return;
  try {
    await Promise.race([
      active.promise,
      // Quality-driven capture can deliberately wait several seconds for
      // Street View's high-resolution tiles before falling back to the best frame.
      sleep(STATIC_CAPTURE_MAX_WAIT_MS + 4000),
    ]);
  } catch {
    // The capture routine records its own failure metadata and diagnostics.
  }
}

async function captureStaticImageForRound(tabId, expected) {
  const tab = await chrome.tabs.get(tabId);
  if (!tab?.active || !Number.isInteger(tab.windowId)) {
    throw new Error("OpenGuessr tab is not the active tab, so Chrome cannot capture it safely.");
  }

  const startedAtMs = Date.now();
  let attempts = 0;
  let previousAnalysis = null;
  let previousSharpness = null;
  let stableStreak = 0;
  let bestCandidate = null;
  let acceptedCandidate = null;
  let lastPrep = null;

  await setStaticCaptureBadge(tabId, true, "Waiting for high-resolution Street View…");
  await sleep(STATIC_CAPTURE_MIN_WAIT_MS);

  while (Date.now() - startedAtMs <= STATIC_CAPTURE_MAX_WAIT_MS) {
    const state = await getTabState(tabId);
    const round = state.currentRound;
    if (!sameRound(round, expected)) return null;

    if (round.predictionIntentAt || Number.isFinite(round.frozenAtMs)) {
      round.staticImage = {
        ...(round.staticImage ?? {}),
        status: "missed",
        error: "Capture window closed before a clean NMPZ screenshot was obtained.",
      };
      addDiagnostic(round, "static_image_capture_missed", { attempts });
      await persistTabState(tabId, state);
      return null;
    }

    let prep;
    try {
      prep = await chrome.tabs.sendMessage(tabId, {
        type: "OGRR_PREPARE_STATIC_CAPTURE",
      });
    } catch (error) {
      prep = {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    if (!prep?.ok || !prep.rect || !prep.viewport) {
      await setStaticCaptureBadge(tabId, true, "Waiting for Street View to render…");
      await sleep(STATIC_CAPTURE_SAMPLE_INTERVAL_MS);
      continue;
    }
    lastPrep = prep;

    // One paint with the status badge hidden before the screenshot.
    await sleep(90);

    const latestTab = await chrome.tabs.get(tabId);
    if (!latestTab?.active || latestTab.windowId !== tab.windowId) {
      throw new Error("OpenGuessr tab stopped being active during image capture.");
    }

    let fullDataUrl;
    try {
      fullDataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: "png",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Chrome tab screenshot failed: ${message}`);
    }

    attempts += 1;
    const candidate = await cropCapturedImage(fullDataUrl, prep.rect, prep.viewport, {
      analyze: true,
    });
    const sharpness = candidate.analysis?.sharpness ?? 0;
    const stabilityDifference =
      previousAnalysis && candidate.analysis
        ? meanGrayDifference(previousAnalysis.gray, candidate.analysis.gray)
        : null;
    const sharpnessChange =
      previousSharpness && previousSharpness > 0
        ? Math.abs(sharpness - previousSharpness) / previousSharpness
        : null;

    const visuallyStable =
      Number.isFinite(stabilityDifference) &&
      stabilityDifference <= STATIC_CAPTURE_STABLE_DIFF &&
      Number.isFinite(sharpnessChange) &&
      sharpnessChange <= 0.08;
    stableStreak = visuallyStable ? stableStreak + 1 : 0;

    const elapsedMs = Date.now() - startedAtMs;
    const scoredCandidate = {
      ...candidate,
      prep,
      attempt: attempts,
      elapsedMs,
      sharpness,
      stabilityDifference,
      visuallyStable,
    };

    // Ignore near-blank/loading candidates when choosing the timeout fallback.
    if (
      !candidate.analysis?.blankLike &&
      (!bestCandidate || sharpness > bestCandidate.sharpness)
    ) {
      bestCandidate = scoredCandidate;
    }

    const canAccept =
      attempts >= STATIC_CAPTURE_MIN_SAMPLES &&
      elapsedMs >= STATIC_CAPTURE_MIN_ACCEPT_MS &&
      stableStreak >= STATIC_CAPTURE_STABLE_STREAK &&
      sharpness >= STATIC_CAPTURE_MIN_SHARPNESS &&
      !candidate.analysis?.blankLike;

    if (canAccept) {
      acceptedCandidate = scoredCandidate;
      break;
    }

    previousAnalysis = candidate.analysis ?? null;
    previousSharpness = sharpness;

    const qualityText = Number.isFinite(stabilityDifference)
      ? `Checking image quality… ${Math.min(99, Math.round((elapsedMs / STATIC_CAPTURE_MAX_WAIT_MS) * 100))}%`
      : "Checking image quality…";
    await setStaticCaptureBadge(tabId, true, qualityText);
    await sleep(STATIC_CAPTURE_SAMPLE_INTERVAL_MS);
  }

  const selected = acceptedCandidate ?? bestCandidate;
  if (!selected) {
    throw new Error("Street View never produced a usable image candidate before the capture timeout.");
  }

  const state = await getTabState(tabId);
  const round = state.currentRound;
  if (!sameRound(round, expected)) return null;

  await setStaticCaptureBadge(tabId, true, "Saving canonical image…");

  const settings = round.settingsSnapshot;
  const delivered = await deliverStaticImage({
    dataUrl: selected.dataUrl,
    width: selected.width,
    height: selected.height,
    prep: selected.prep ?? lastPrep,
    state,
    round,
    settings,
  });

  const captureQuality = acceptedCandidate ? "stable" : "timeout-best-frame";
  round.staticImage = {
    status: delivered.existing ? "existing" : "saved",
    captureSource: "openguessr-visible-nmpz",
    scheduledAt: round.staticImage?.scheduledAt ?? null,
    capturedAt: new Date().toISOString(),
    storageMethod: delivered.method,
    path: delivered.path ?? null,
    locationId: delivered.locationId ?? null,
    filename: delivered.filename ?? null,
    downloadId: delivered.downloadId ?? null,
    width: selected.width,
    height: selected.height,
    sourceElement: selected.prep?.target ?? null,
    viewport: selected.prep?.viewport ?? null,
    existing: Boolean(delivered.existing),
    captureQuality,
    captureAttempts: attempts,
    captureDelayMs: selected.elapsedMs,
    sharpness: roundMetric(selected.sharpness),
    stabilityDifference: roundMetric(selected.stabilityDifference),
    qualityMetrics: selected.analysis
      ? {
          luminanceStdDev: roundMetric(selected.analysis.luminanceStdDev),
          blankLike: Boolean(selected.analysis.blankLike),
        }
      : null,
    error: null,
  };
  addDiagnostic(round, "static_image_captured", {
    storageMethod: delivered.method,
    path: delivered.path ?? null,
    filename: delivered.filename ?? null,
    locationId: delivered.locationId ?? null,
    existing: Boolean(delivered.existing),
    width: selected.width,
    height: selected.height,
    source: selected.prep?.target?.source ?? null,
    tagName: selected.prep?.target?.tagName ?? null,
    captureQuality,
    captureAttempts: attempts,
    captureDelayMs: selected.elapsedMs,
    sharpness: roundMetric(selected.sharpness),
    stabilityDifference: roundMetric(selected.stabilityDifference),
  });
  await persistTabState(tabId, state);
  return round.staticImage;
}

async function setStaticCaptureBadge(tabId, visible, text) {
  await chrome.tabs.sendMessage(tabId, {
    type: "OGRR_STATIC_CAPTURE_BADGE",
    visible,
    text,
  }).catch(() => {});
}

async function deliverStaticImage({
  dataUrl,
  width,
  height,
  prep,
  state,
  round,
  settings,
}) {
  const competitionRound =
    positiveIntegerOrNull(round.competitionRound) ??
    round.pageRoundNumber ??
    (Number.isInteger(round.index) ? round.index + 1 : null);
  if (!Number.isInteger(competitionRound) || competitionRound < 1) {
    throw new Error("Cannot save canonical starting image without a competition round number.");
  }

  let endpoint;
  try {
    endpoint = new URL(settings.collectorUrl);
    endpoint.pathname = "/api/starting-images";
    endpoint.search = "";
    endpoint.hash = "";
  } catch (error) {
    throw new Error(
      `Invalid collector URL: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const capturedAt = new Date().toISOString();
  const payload = {
    schemaVersion: "1.0",
    competitionId: settings.competitionId,
    competitionRound,
    sessionId: state.sessionId ?? null,
    roundId: round.id ?? null,
    capturedAt,
    captureSource: "openguessr-visible-nmpz",
    width,
    height,
    viewport: prep.viewport ?? null,
    sourceElement: prep.target ?? null,
    spawnRequested: round.spawnRequested ?? round.actualStart ?? null,
    imageDataUrl: dataUrl,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error ?? `Collector returned HTTP ${response.status}.`);
    }
    return {
      success: true,
      method: "collector",
      path: body.path ?? null,
      locationId: body.locationId ?? null,
      existing: Boolean(body.existing),
    };
  } catch (error) {
    if (!settings.fallbackDownload) {
      throw error;
    }

    const filename = buildStaticImageFallbackFilename(state, round, settings);
    const downloadId = await chrome.downloads.download({
      url: dataUrl,
      filename,
      saveAs: false,
      conflictAction: "uniquify",
    });
    return {
      success: true,
      method: "download-fallback",
      filename,
      downloadId,
      existing: false,
      collectorError: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function cropCapturedImage(dataUrl, rect, viewport, options = {}) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  try {
    const viewportWidth = Number(viewport?.width);
    const viewportHeight = Number(viewport?.height);
    if (!(viewportWidth > 0) || !(viewportHeight > 0)) {
      throw new Error("Invalid viewport metadata for screenshot crop.");
    }

    const scaleX = bitmap.width / viewportWidth;
    const scaleY = bitmap.height / viewportHeight;
    const sx = Math.max(0, Math.round(Number(rect.x) * scaleX));
    const sy = Math.max(0, Math.round(Number(rect.y) * scaleY));
    const sw = Math.min(
      bitmap.width - sx,
      Math.max(1, Math.round(Number(rect.width) * scaleX)),
    );
    const sh = Math.min(
      bitmap.height - sy,
      Math.max(1, Math.round(Number(rect.height) * scaleY)),
    );
    if (sw < 200 || sh < 150) {
      throw new Error(`Screenshot crop is unexpectedly small (${sw}x${sh}).`);
    }

    const analysis = options.analyze
      ? analyzeBitmapRegion(bitmap, sx, sy, sw, sh)
      : null;

    const canvas = new OffscreenCanvas(sw, sh);
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Could not create screenshot crop canvas.");
    context.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);
    const outputBlob = await canvas.convertToBlob({ type: "image/png" });
    const bytes = await outputBlob.arrayBuffer();
    return {
      dataUrl: `data:image/png;base64,${arrayBufferToBase64(bytes)}`,
      width: sw,
      height: sh,
      analysis,
    };
  } finally {
    bitmap.close?.();
  }
}

function analyzeBitmapRegion(bitmap, sx, sy, sw, sh) {
  const sampleWidth = 160;
  const sampleHeight = Math.max(72, Math.round((sh / sw) * sampleWidth));
  const canvas = new OffscreenCanvas(sampleWidth, sampleHeight);
  const context = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
  if (!context) throw new Error("Could not create static-image analysis canvas.");
  context.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sampleWidth, sampleHeight);
  const rgba = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
  const gray = new Uint8Array(sampleWidth * sampleHeight);

  let luminanceSum = 0;
  let luminanceSqSum = 0;
  for (let index = 0, pixel = 0; index < rgba.length; index += 4, pixel += 1) {
    const value = Math.round(
      rgba[index] * 0.299 + rgba[index + 1] * 0.587 + rgba[index + 2] * 0.114,
    );
    gray[pixel] = value;
    luminanceSum += value;
    luminanceSqSum += value * value;
  }

  const pixelCount = gray.length;
  const luminanceMean = luminanceSum / pixelCount;
  const luminanceVariance = Math.max(
    0,
    luminanceSqSum / pixelCount - luminanceMean * luminanceMean,
  );
  const luminanceStdDev = Math.sqrt(luminanceVariance);

  // Variance of a 4-neighbour Laplacian is a compact, resolution-independent
  // sharpness signal. Low-resolution Street View tiles score substantially
  // lower than the settled high-resolution frame while using the same scene.
  let laplacianSum = 0;
  let laplacianSqSum = 0;
  let laplacianCount = 0;
  for (let y = 1; y < sampleHeight - 1; y += 1) {
    for (let x = 1; x < sampleWidth - 1; x += 1) {
      const index = y * sampleWidth + x;
      const laplacian =
        4 * gray[index] -
        gray[index - 1] -
        gray[index + 1] -
        gray[index - sampleWidth] -
        gray[index + sampleWidth];
      laplacianSum += laplacian;
      laplacianSqSum += laplacian * laplacian;
      laplacianCount += 1;
    }
  }
  const laplacianMean = laplacianCount ? laplacianSum / laplacianCount : 0;
  const sharpness = laplacianCount
    ? Math.max(
        0,
        laplacianSqSum / laplacianCount - laplacianMean * laplacianMean,
      )
    : 0;

  return {
    gray,
    sharpness,
    luminanceStdDev,
    blankLike: luminanceStdDev < 5 || sharpness < 1,
  };
}

function meanGrayDifference(previous, current) {
  if (!(previous instanceof Uint8Array) || !(current instanceof Uint8Array)) {
    return null;
  }
  if (previous.length !== current.length || previous.length === 0) return null;
  let sum = 0;
  for (let index = 0; index < current.length; index += 1) {
    sum += Math.abs(current[index] - previous[index]);
  }
  return sum / current.length;
}

function roundMetric(value) {
  return Number.isFinite(Number(value)) ? Math.round(Number(value) * 100) / 100 : null;
}

function buildStaticImageFallbackFilename(state, round, settings) {
  const competition = safeFilenamePart(settings.competitionId, "unassigned");
  const session = safeFilenamePart(state.sessionId, "session");
  const roundNumber = String(
    round.pageRoundNumber ?? (Number.isInteger(round.index) ? round.index + 1 : 1),
  ).padStart(2, "0");
  return `${settings.downloadSubfolder}/static-images-fallback/${competition}/${session}/round-${roundNumber}__nmpz.png`;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function scheduleFinalize(tabId, delayMs, reason, round = null) {
  clearFinalizeTimer(tabId);
  const expectedRound = round
    ? { id: round.id, startedAt: round.startedAt }
    : null;
  const timer = setTimeout(async () => {
    finalizeTimers.delete(tabId);
    const state = await getTabState(tabId);
    if (
      expectedRound &&
      (state.currentRound?.id !== expectedRound.id ||
        state.currentRound?.startedAt !== expectedRound.startedAt)
    ) {
      return;
    }
    await finalizeRound(tabId, state, reason);
  }, delayMs);
  finalizeTimers.set(tabId, timer);
}

function clearFinalizeTimer(tabId) {
  const timer = finalizeTimers.get(tabId);
  if (timer) clearTimeout(timer);
  finalizeTimers.delete(tabId);
}

async function closeTabSession(tabId) {
  clearFinalizeTimer(tabId);
  try {
    const state = await getTabState(tabId);
    const settings = await getSettings();
    if (state.currentRound) {
      await finalizeRound(tabId, state, "tab_closed");
    }
    if (state.sessionId && (state.completedRounds?.length ?? 0) > 0) {
      if (state.sessionStatus !== "complete") state.sessionStatus = "closed";
      state.lastSessionSave = {
        at: new Date().toISOString(),
        ...(await deliverSessionManifest(state, settings)),
      };
    }
    if (["ready", "recording", "error"].includes(state.videoCapture?.status)) {
      await stopInteractiveVideoCapture(tabId, state, "tab_closed");
    }
  } catch {
    // A tab-closing cleanup must never surface an extension error to the user.
  } finally {
    staticImageCapturePromises.delete(tabId);
    tabStateCache.delete(tabId);
    await removePersistedTabState(tabId);
  }
}


async function saveActiveCheckpoint() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!Number.isInteger(tab?.id)) {
    return {
      status: null,
      checkpoint: { success: false, error: "No active browser tab." },
    };
  }

  const settings = await getSettings();
  const state = await getTabState(tab.id);
  await refreshPageProbe(tab.id, state, settings);
  state.updatedAt = new Date().toISOString();
  const checkpoint = buildCheckpoint(state, settings, tab);
  const result = await deliverCheckpoint(checkpoint, settings);
  state.lastCheckpoint = {
    at: checkpoint.savedAt,
    checkpointId: checkpoint.id,
    ...result,
  };
  await persistTabState(tab.id, state, { forceRecovery: true });
  return {
    status: publicStatus(state),
    checkpoint: state.lastCheckpoint,
  };
}

async function exportActiveDiagnostics() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!Number.isInteger(tab?.id)) {
    return {
      status: null,
      diagnostics: { success: false, error: "No active browser tab." },
    };
  }

  const settings = await getSettings();
  const state = await getTabState(tab.id);
  await refreshPageProbe(tab.id, state, settings);
  state.updatedAt = new Date().toISOString();
  await persistTabState(tab.id, state, { forceRecovery: true });

  const diagnostics = {
    ...buildCheckpoint(state, settings, tab),
    checkpointType: "openguessr-recorder-diagnostics",
    guidance: {
      currentRoundDetected: Boolean(state.currentRound),
      nmpzDetected:
        state.currentRound?.captureMode === "nmpz" ||
        state.pageProbe?.modeHint === "nmpz",
      note:
        "This diagnostics file is not treated as a completed round. Use Save checkpoint to preserve live state or Finalize current round to create a round recording.",
    },
  };
  const filename = `${settings.downloadSubfolder}/diagnostics/${safeIsoForId(
    diagnostics.savedAt,
  )}__recorder-diagnostics.json`;
  const result = await downloadJson(diagnostics, filename);
  state.lastDiagnosticsExport = {
    at: diagnostics.savedAt,
    ...result,
  };
  await persistTabState(tab.id, state);
  return {
    status: publicStatus(state),
    diagnostics: state.lastDiagnosticsExport,
  };
}

async function refreshPageProbe(tabId, state, settings) {
  if (typeof chrome.tabs.sendMessage !== "function") return null;
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: "OGRR_PROBE_PAGE",
    });
    if (response?.probe) {
      state.pageProbe = sanitizePageProbe(response.probe);
      if (settings.enabled) {
        await handleDomProbe(tabId, state, state.pageProbe, settings);
      }
      return state.pageProbe;
    }
  } catch (error) {
    state.lastProbeError = {
      at: new Date().toISOString(),
      message: error instanceof Error ? error.message : String(error),
    };
  }
  return null;
}

function buildCheckpoint(state, settings, tab) {
  const savedAt = new Date().toISOString();
  return {
    schemaVersion: "1.0",
    checkpointType: "openguessr-live-state",
    id: `checkpoint-${safeIsoForId(savedAt)}-${randomId()}`,
    savedAt,
    recorder: {
      name: RECORDER_NAME,
      version: EXTENSION_VERSION,
    },
    tab: {
      id: tab?.id ?? state.tabId ?? null,
      url: state.pageContext?.pageUrl ?? tab?.url ?? null,
      title: tab?.title ?? state.pageContext?.title ?? null,
    },
    settings: {
      enabled: settings.enabled,
      competitionId: settings.competitionId,
      model: settings.model,
      condition: settings.condition,
      collectorUrl: settings.collectorUrl,
      fallbackDownload: settings.fallbackDownload,
      sampleIntervalMs: settings.sampleIntervalMs,
      maxSamples: settings.maxSamples,
    },
    status: publicStatus(state),
    pageContext: state.pageContext ?? null,
    pageProbe: state.pageProbe ?? null,
    currentRound: state.currentRound ?? null,
    completedRounds: state.completedRounds ?? [],
    recovery: {
      canFinalize: Boolean(state.currentRound),
      hasCoordinate:
        isCoordinate(state.currentRound?.actualStart) ||
        isCoordinate(state.currentRound?.spawnRequested) ||
        isCoordinate(state.currentRound?.samples?.[0]),
      roundCanBeMatchedByOrder:
        Boolean(settings.competitionId) &&
        (Number.isInteger(state.currentRound?.pageRoundNumber) ||
          Number.isInteger(state.currentRound?.index)),
    },
  };
}

async function deliverCheckpoint(checkpoint, settings) {
  let endpoint;
  try {
    endpoint = new URL(settings.collectorUrl);
    endpoint.pathname = "/api/checkpoints";
    endpoint.search = "";
    endpoint.hash = "";
  } catch {
    endpoint = null;
  }

  if (endpoint) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(checkpoint),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? `Collector returned HTTP ${response.status}.`);
      }
      return {
        success: true,
        method: "collector",
        path: payload.path ?? null,
      };
    } catch (error) {
      if (!settings.fallbackDownload) {
        return {
          success: false,
          method: "collector",
          error: error instanceof Error ? error.message : String(error),
        };
      }
      const filename = `${settings.downloadSubfolder}/checkpoints/${safeIsoForId(
        checkpoint.savedAt,
      )}__live-checkpoint.json`;
      const fallback = await downloadJson(checkpoint, filename);
      return {
        ...fallback,
        method: fallback.success ? "download-fallback" : "download-fallback",
        collectorError: error instanceof Error ? error.message : String(error),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  const filename = `${settings.downloadSubfolder}/checkpoints/${safeIsoForId(
    checkpoint.savedAt,
  )}__live-checkpoint.json`;
  return downloadJson(checkpoint, filename);
}

async function downloadJson(value, filename) {
  try {
    const url = `data:application/json;charset=utf-8,${encodeURIComponent(
      `${JSON.stringify(value, null, 2)}\n`,
    )}`;
    const downloadId = await chrome.downloads.download({
      url,
      filename,
      saveAs: false,
      conflictAction: "uniquify",
    });
    return { success: true, method: "download", downloadId, path: filename };
  } catch (error) {
    return {
      success: false,
      method: "download",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}



function confirmCompetitionStart(state, source, at = null) {
  if (!state.recordingArmed || state.competitionStartConfirmed || state.sessionId) return false;
  const timestamp = at ?? new Date().toISOString();
  state.competitionStartConfirmed = true;
  state.competitionStartIntentAt = timestamp;
  state.competitionStartedAt = timestamp;
  state.lastManualAction = {
    at: timestamp,
    success: true,
    message: `OpenGuessr start detected (${source}). Waiting for the first live round.`,
  };
  return true;
}

function maybeConfirmCompetitionStartFromProbe(state, previousProbe, probe, settings) {
  if (!captureIsArmed(state, settings) || state.competitionStartConfirmed || state.sessionId || !probe) {
    return false;
  }

  if (probe.competitionStartPromptVisible) {
    state.startPromptSeen = true;
    state.startPromptSignature = probe.competitionStartSignature ?? state.startPromptSignature ?? null;
    state.armPrimaryViewFingerprint ??= probeViewFingerprint(probe.primaryView);
    return false;
  }

  const promptWasVisible = Boolean(
    state.startPromptSeen || previousProbe?.competitionStartPromptVisible,
  );
  if (!promptWasVisible) return false;

  if (!state.startPromptDismissedAt) {
    state.startPromptDismissedAt = probe.at ?? new Date().toISOString();
  }

  if (probe.resultVisible || probe.pageState === "result") return false;

  const currentFingerprint = probeViewFingerprint(probe.primaryView);
  const baselineFingerprint = state.armPrimaryViewFingerprint;
  const viewChanged = Boolean(
    currentFingerprint && baselineFingerprint && currentFingerprint !== baselineFingerprint,
  );
  const explicitRoundSignal = Boolean(
    probe.roundLikelyActive ||
      probe.pageState === "round" ||
      probe.guessControlVisible ||
      Number.isInteger(probe.roundNumber),
  );
  const routeChanged = Boolean(
    previousProbe?.pathname &&
      probe.pathname &&
      previousProbe.pathname !== probe.pathname,
  );
  const promptDismissedIntoPlayableView = Boolean(
    isCoordinate(probe.primaryView) &&
      !probe.competitionStartPromptVisible &&
      (routeChanged || state.competitionStartIntentAt),
  );

  if (explicitRoundSignal || viewChanged || promptDismissedIntoPlayableView) {
    return confirmCompetitionStart(
      state,
      explicitRoundSignal
        ? "live-round transition"
        : viewChanged
          ? "Street View changed after Start"
          : "competition dialog dismissed into live view",
      probe.at,
    );
  }
  return false;
}

function observeGoogleFrameState(state, event, payload) {
  if (!["frame-ready", "spawn-requested", "sample"].includes(event)) return;
  if (payload?.frameInstanceId) {
    state.lastObservedGoogleFrameInstanceId = payload.frameInstanceId;
  }
  const point = isCoordinate(payload?.spawnRequested)
    ? payload.spawnRequested
    : isCoordinate(payload)
      ? payload
      : null;
  if (point) state.lastObservedGoogleView = normalizeCameraPoint(point);
}

function maybeConfirmCompetitionStartFromGoogle(state, event, payload, settings) {
  if (!captureIsArmed(state, settings) || state.competitionStartConfirmed || state.sessionId) {
    return false;
  }
  if (!["frame-ready", "spawn-requested", "sample"].includes(event)) return false;
  if (!state.startPromptSeen) return false;
  if (state.pageProbe?.resultVisible) return false;

  const frameInstanceId = payload?.frameInstanceId ?? null;
  const point = isCoordinate(payload?.spawnRequested)
    ? payload.spawnRequested
    : isCoordinate(payload)
      ? payload
      : null;
  const newFrame = Boolean(
    frameInstanceId && frameInstanceId !== state.armGoogleFrameInstanceId,
  );
  const currentFingerprint = probeViewFingerprint(point);
  const viewChanged = Boolean(
    currentFingerprint &&
      state.armPrimaryViewFingerprint &&
      currentFingerprint !== state.armPrimaryViewFingerprint,
  );

  const explicitStartSeen = Boolean(state.competitionStartIntentAt);
  const promptDismissed = Boolean(
    state.startPromptDismissedAt ||
      state.pageProbe?.competitionStartPromptVisible === false,
  );

  if (!viewChanged && !(newFrame && (explicitStartSeen || promptDismissed))) return false;
  return confirmCompetitionStart(
    state,
    viewChanged
      ? "new Street View location after Start"
      : "new Street View frame after Start",
    payload?.at ?? payload?.capturedAt ?? null,
  );
}

function probeViewFingerprint(value) {
  if (!value || typeof value !== "object") return null;
  if (value.urlFingerprint) return String(value.urlFingerprint);
  if (!isCoordinate(value)) return null;
  const lat = Number(value.lat).toFixed(6);
  const lng = Number(value.lng).toFixed(6);
  const pano = value.panoId ? String(value.panoId) : "none";
  return `${lat},${lng}|${pano}`;
}

function captureIsArmed(state, settings) {
  return settings.enabled !== false && Boolean(state.recordingArmed);
}

function captureSessionReady(state, settings) {
  return (
    captureIsArmed(state, settings) &&
    Boolean(state.sessionId || state.currentRound || state.competitionStartConfirmed)
  );
}

function settingsForState(state, settings) {
  if (!state.armContext) return settings;
  return {
    ...settings,
    competitionId: state.armContext.competitionId ?? settings.competitionId,
    model: state.armContext.model ?? settings.model,
    condition: state.armContext.condition ?? settings.condition,
  };
}

async function assertInteractiveVideoCollector(collectorUrl) {
  let healthUrl;
  try {
    healthUrl = new URL(collectorUrl || DEFAULT_SETTINGS.collectorUrl);
    healthUrl.pathname = "/api/health";
    healthUrl.search = "";
    healthUrl.hash = "";
  } catch (error) {
    throw new Error(`Invalid collector URL: ${error instanceof Error ? error.message : String(error)}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(healthUrl, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error ?? `HTTP ${response.status}`);
    }
    if (body.supportsExplorationVideos !== true) {
      throw new Error("The running collector does not advertise exploration-video support. Start the v0.8.18 repo with npm start.");
    }
    return body;
  } catch (error) {
    throw new Error(`Interactive video collector check failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyInteractiveTabCapture(tabId) {
  if (typeof chrome.tabCapture?.getCapturedTabs !== "function") return true;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const captures = await chrome.tabCapture.getCapturedTabs().catch(() => []);
    const match = captures.find((item) => item.tabId === tabId);
    if (match?.status === "active") return true;
    if (match?.status === "error") {
      throw new Error("Chrome reports an error for the OpenGuessr tab capture.");
    }
    await sleep(100);
  }
  throw new Error("Chrome never reported the OpenGuessr tab capture as active.");
}

async function setVideoBadge(tabId, state) {
  if (typeof chrome.action?.setBadgeText !== "function") return;
  const text = state === "recording" ? "REC" : state === "ready" ? "VID" : state === "auth" ? "ARM" : state === "error" ? "!" : "";
  await chrome.action.setBadgeText({ tabId, text }).catch(() => {});
}

async function ensureVideoOffscreenDocument() {
  const contexts = typeof chrome.runtime.getContexts === "function"
    ? await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"] })
    : [];
  const existing = contexts.some((context) =>
    String(context.documentUrl ?? "").endsWith("/offscreen.html"),
  );
  if (existing) return;
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["USER_MEDIA"],
    justification: "Keep the explicitly armed OpenGuessr tab stream available and record one WebM file per interactive round.",
  });
}

async function startInteractiveVideoCapture(tabId, setup = {}) {
  const tab = await chrome.tabs.get(tabId);
  if (!tab?.active || !Number.isInteger(tab.windowId)) {
    throw new Error("OpenGuessr must be the active tab when interactive video recording is armed.");
  }

  await ensureVideoOffscreenDocument();

  let streamId;
  try {
    streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const wrapped = new Error(`Chrome could not prepare tab video capture (${message}).`);
    wrapped.cause = error;
    throw wrapped;
  }

  return startInteractiveVideoCaptureWithStreamId(tabId, setup, streamId, tab);
}

async function startInteractiveVideoCaptureWithStreamId(tabId, setup = {}, streamId, knownTab = null) {
  const tab = knownTab ?? await chrome.tabs.get(tabId);
  if (!tab?.active || !Number.isInteger(tab.windowId)) {
    throw new Error("OpenGuessr must be the active tab when interactive video recording is armed.");
  }
  if (!streamId) throw new Error("Chrome did not provide a tab-capture stream ID.");

  const collectorUrl = String(setup.collectorUrl ?? DEFAULT_SETTINGS.collectorUrl);
  await ensureVideoOffscreenDocument();

  const competitionId = String(setup.competitionId ?? "unassigned").trim() || "unassigned";
  const streamSessionId = `stream-${safeIsoForId(new Date().toISOString())}-${randomId()}`;
  const response = await chrome.runtime.sendMessage({
    target: "ogrr-offscreen",
    type: "OGRR_VIDEO_SESSION_START",
    streamId,
    streamSessionId,
    tabId,
    pageUrl: tab.url ?? null,
    competitionId,
    collectorUrl,
  });
  if (!response?.ok) {
    throw new Error(response?.error ?? "The offscreen video stream could not be prepared.");
  }
  if (response.status !== "ready") {
    throw new Error("The offscreen video stream did not enter the ready state.");
  }
  await verifyInteractiveTabCapture(tabId);
  try {
    await assertInteractiveVideoCollector(collectorUrl);
  } catch (error) {
    await chrome.runtime.sendMessage({
      target: "ogrr-offscreen",
      type: "OGRR_VIDEO_SESSION_STOP",
      reason: "collector_unavailable",
    }).catch(() => {});
    throw error;
  }
  await setVideoBadge(tabId, "ready");

  return {
    status: "ready",
    streamSessionId: response.streamSessionId ?? streamSessionId,
    competitionId,
    readyAt: response.readyAt ?? new Date().toISOString(),
    readyAtMs: finiteOrNull(response.readyAtMs) ?? Date.now(),
    mimeType: response.mimeType ?? "video/webm",
    width: finiteOrNull(response.width),
    height: finiteOrNull(response.height),
    activeRoundCaptureId: null,
    error: null,
  };
}

async function stopInteractiveVideoCapture(tabId, state, reason = "stopped") {
  const capture = state?.videoCapture;
  if (!capture || !["ready", "recording", "error"].includes(capture.status)) {
    return capture ?? null;
  }

  let response;
  try {
    response = await chrome.runtime.sendMessage({
      target: "ogrr-offscreen",
      type: "OGRR_VIDEO_SESSION_STOP",
      reason,
    });
  } catch (error) {
    response = { ok: false, error: error instanceof Error ? error.message : String(error) };
  }

  capture.status = response?.ok && response.status !== "error" ? "stopped" : "error";
  capture.stoppedAt = response?.stoppedAt ?? new Date().toISOString();
  capture.error = capture.status === "error"
    ? response?.error ?? "Interactive video stream could not be stopped cleanly."
    : null;
  capture.activeRoundCaptureId = null;
  state.videoCapture = capture;
  await setVideoBadge(tabId, capture.status === "error" ? "error" : "stopped");
  return capture;
}

async function ensureInteractiveRoundVideoStarted(tabId, state, round) {
  if (!round || round.captureMode !== "interactive") return null;
  if (["starting", "recording", "stopped"].includes(round.video?.status) || round.video?.path) {
    return round.video;
  }
  const session = state?.videoCapture;
  if (!session || !["ready", "recording"].includes(session.status)) {
    addDiagnostic(round, "interactive_round_video_unavailable", {
      message: "The interactive tab stream was not ready when the round became visible.",
    });
    return null;
  }

  const competitionRound = positiveIntegerOrNull(round.competitionRound) ?? round.pageRoundNumber ?? (Number.isInteger(round.index) ? round.index + 1 : null);
  if (!Number.isInteger(competitionRound) || competitionRound < 1) return null;
  const captureId = `round-video-${safeIsoForId(round.startedAt)}-${randomId()}`;

  // Claim this round synchronously BEFORE awaiting the offscreen document. Google
  // Street View can emit several samples in the same render burst; without this
  // lock, two samples can both start different MediaRecorders for the same round.
  round.video = {
    status: "starting",
    captureId,
    competitionRound,
    path: null,
    metadataPath: null,
    mimeType: session.mimeType ?? "video/webm",
    width: session.width ?? null,
    height: session.height ?? null,
    captureStartedAt: null,
    captureStartedAtMs: null,
    roundOffsetMs: 0,
    crop: null,
  };
  session.activeRoundCaptureId = captureId;
  state.videoCapture = session;

  const response = await chrome.runtime.sendMessage({
    target: "ogrr-offscreen",
    type: "OGRR_VIDEO_ROUND_START",
    captureId,
    competitionId: round.settingsSnapshot.competitionId,
    competitionRound,
    sessionId: state.sessionId ?? "session",
    roundId: round.id,
    pageUrl: state.pageContext?.pageUrl ?? null,
    collectorUrl: round.settingsSnapshot.collectorUrl,
  }).catch((error) => ({ ok: false, error: error instanceof Error ? error.message : String(error) }));

  if (!response?.ok || response.status !== "recording") {
    round.video = {
      ...round.video,
      status: "error",
      error: response?.error ?? "Round MediaRecorder did not start.",
    };
    addDiagnostic(round, "interactive_round_video_start_failed", {
      message: round.video.error,
      captureId,
      competitionRound,
    });
    session.activeRoundCaptureId = null;
    await keepInteractiveSessionUsableAfterRoundError(tabId, state, session, round.video.error);
    return round.video;
  }

  round.video = {
    ...round.video,
    status: "recording",
    captureId: response.captureId ?? captureId,
    path: null,
    metadataPath: null,
    mimeType: response.mimeType ?? session.mimeType ?? "video/webm",
    width: finiteOrNull(response.width) ?? session.width ?? null,
    height: finiteOrNull(response.height) ?? session.height ?? null,
    captureStartedAt: response.startedAt ?? new Date().toISOString(),
    captureStartedAtMs: finiteOrNull(response.startedAtMs) ?? Date.now(),
    roundOffsetMs: 0,
    crop: null,
  };
  session.status = "recording";
  session.activeRoundCaptureId = round.video.captureId;
  session.error = null;
  state.videoCapture = session;
  await setVideoBadge(tabId, "recording");
  scheduleInteractiveVideoViewportProbe(tabId, round);
  addDiagnostic(round, "interactive_round_video_started", {
    captureId: round.video.captureId,
    competitionRound,
  });
  return round.video;
}

async function stopInteractiveRoundVideo(tabId, state, round, reason = "prediction_submitted") {
  if (!round || round.captureMode !== "interactive") return round?.video ?? null;
  if (!round.video || !["starting", "recording"].includes(round.video.status)) return round.video ?? null;

  const response = await chrome.runtime.sendMessage({
    target: "ogrr-offscreen",
    type: "OGRR_VIDEO_ROUND_STOP",
    captureId: round.video.captureId,
    reason,
  }).catch((error) => ({ ok: false, error: error instanceof Error ? error.message : String(error) }));

  if (response?.ok && response.status !== "error" && response.path) {
    round.video = {
      ...round.video,
      status: "stopped",
      path: response.path,
      metadataPath: response.metadataPath ?? null,
      locationId: response.locationId ?? null,
      stoppedAt: response.stoppedAt ?? new Date().toISOString(),
      stoppedAtMs: finiteOrNull(response.stoppedAtMs) ?? Date.now(),
      roundOffsetMs: 0,
    };
    addDiagnostic(round, "interactive_round_video_saved", {
      path: round.video.path,
      locationId: round.video.locationId ?? null,
      reason,
    });
  } else {
    round.video = {
      ...round.video,
      status: "error",
      error: response?.error ?? "Round video could not be finalized.",
    };
    addDiagnostic(round, "interactive_round_video_stop_failed", {
      message: round.video.error,
      reason,
    });
  }

  if (state.videoCapture) {
    state.videoCapture.activeRoundCaptureId = null;
    if (round.video.status === "error") {
      await keepInteractiveSessionUsableAfterRoundError(
        tabId,
        state,
        state.videoCapture,
        round.video.error,
      );
    } else {
      state.videoCapture.status = "ready";
      state.videoCapture.error = null;
      state.videoCapture.lastRoundError = null;
      await setVideoBadge(tabId, "ready");
    }
  }
  return round.video;
}

async function keepInteractiveSessionUsableAfterRoundError(tabId, state, session, message) {
  const status = await chrome.runtime.sendMessage({
    target: "ogrr-offscreen",
    type: "OGRR_VIDEO_STATUS",
  }).catch(() => null);
  const streamUsable = Boolean(status?.ok && ["ready", "recording"].includes(status.status));
  session.status = streamUsable ? "ready" : "error";
  session.error = streamUsable ? null : message;
  session.lastRoundError = message;
  state.videoCapture = session;
  await setVideoBadge(tabId, streamUsable ? "ready" : "error");
  return streamUsable;
}

function scheduleInteractiveVideoViewportProbe(tabId, round) {
  if (!Number.isInteger(tabId) || !round?.video) return;
  const expected = { id: round.id, startedAt: round.startedAt };
  void (async () => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await sleep(attempt === 0 ? 60 : 180);
      const state = await getTabState(tabId);
      const current = state.currentRound;
      if (!sameRound(current, expected) || !current.video) return;
      let response = null;
      try {
        response = await chrome.tabs.sendMessage(tabId, {
          type: "OGRR_GET_INTERACTIVE_VIDEO_RECT",
        });
      } catch {
        response = null;
      }
      if (response?.ok && response.rect && response.viewport) {
        current.video.crop = {
          rect: response.rect,
          viewport: response.viewport,
          target: response.target ?? null,
        };
        addDiagnostic(current, "interactive_video_crop_captured", {
          width: response.rect.width ?? null,
          height: response.rect.height ?? null,
        });
        await persistTabState(tabId, state);
        return;
      }
    }
  })();
}

async function resolveTabId(sender) {
  if (Number.isInteger(sender?.tab?.id)) return sender.tab.id;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return Number.isInteger(tab?.id) ? tab.id : null;
}

async function getPageUiState(sender, includeCollector = false) {
  const tabId = await resolveTabId(sender);
  const settings = await getSettings();
  const status = Number.isInteger(tabId)
    ? publicStatus(await getTabState(tabId))
    : null;
  return {
    status,
    settings,
    collector: includeCollector ? await testCollector() : null,
  };
}

async function armInteractiveSenderTab(sender, setup = {}) {
  const tabId = await resolveTabId(sender);
  if (!Number.isInteger(tabId)) throw new Error("No OpenGuessr tab is available to arm.");

  const previous = await getTabState(tabId);
  if (previous.currentRound) {
    throw new Error("A round is already recording. Stop it before arming another competition.");
  }
  if (previous.recordingArmed && ["ready", "recording"].includes(previous.videoCapture?.status)) {
    return { status: publicStatus(previous), settings: await getSettings() };
  }

  const effectiveSetup = {
    ...(await getSettings()),
    ...setup,
    enabled: true,
    condition: "interactive-panorama",
  };
  settingsCache = await saveSettings(effectiveSetup);

  if (["ready", "recording", "error"].includes(previous.videoCapture?.status)) {
    await stopInteractiveVideoCapture(tabId, previous, "rearm_interactive").catch(() => {});
  }
  if (previous.sessionId && (previous.completedRounds?.length ?? 0) > 0 && previous.sessionStatus !== "complete") {
    previous.sessionStatus = "closed";
    await deliverSessionManifest(previous, settingsForState(previous, settingsCache));
  }

  clearFinalizeTimer(tabId);
  const state = createTabState(tabId);
  state.pageContext = previous.pageContext ?? null;
  state.pageProbe = previous.pageProbe ?? null;
  state.lastObservedGoogleFrameInstanceId = previous.lastObservedGoogleFrameInstanceId ?? null;
  state.lastObservedGoogleView = previous.lastObservedGoogleView ?? null;
  state.recordingArmed = false;
  state.sessionStatus = "awaiting_video_authorization";
  state.armContext = {
    competitionId: settingsCache.competitionId,
    model: settingsCache.model,
    condition: "interactive-panorama",
  };
  state.videoCapture = {
    status: "authorization-required",
    error: null,
    requestedAt: new Date().toISOString(),
  };
  state.lastManualAction = {
    at: new Date().toISOString(),
    success: true,
    message: "Interactive setup saved. Click the recorder extension icon once to authorize tab video; no further setup is required.",
  };
  tabStateCache.set(tabId, state);
  await persistTabState(tabId, state, { forceRecovery: true });

  const tab = await chrome.tabs.get(tabId);
  const token = randomId();
  await chrome.storage.session.set({
    [INTERACTIVE_ARM_PENDING_KEY]: {
      token,
      tabId,
      windowId: tab.windowId,
      setup: settingsCache,
      createdAtMs: Date.now(),
    },
  });
  await setVideoBadge(tabId, "auth");
  return { pending: true, status: publicStatus(state), settings: settingsCache };
}

async function authorizePendingInteractiveArmFromAction(tab) {
  const tabId = tab?.id;
  if (!Number.isInteger(tabId)) return null;

  const stored = await chrome.storage.session.get(INTERACTIVE_ARM_PENDING_KEY);
  const pending = stored?.[INTERACTIVE_ARM_PENDING_KEY];
  if (!pending || pending.tabId !== tabId) {
    const state = await getTabState(tabId);
    state.lastManualAction = {
      at: new Date().toISOString(),
      success: false,
      message: state.recordingArmed
        ? "Recorder is already armed. Use the in-page Stop recording button to abort."
        : "No interactive arm request is waiting. Configure and press Arm in the OpenGuessr recorder first.",
    };
    await persistTabState(tabId, state, { forceRecovery: true });
    return publicStatus(state);
  }

  let videoCapture = null;
  try {
    // This function is reached from chrome.action.onClicked. That toolbar click is
    // the explicit extension invocation Chrome requires before tabCapture.
    videoCapture = await startInteractiveVideoCapture(tabId, pending.setup);
    const result = await armTab(tabId, pending.setup);
    const state = await getTabState(tabId);
    state.videoCapture = videoCapture;
    state.lastManualAction = {
      at: new Date().toISOString(),
      success: true,
      message: "Interactive recorder armed. Each location will be recorded automatically as its own WebM.",
    };
    await chrome.storage.session.remove(INTERACTIVE_ARM_PENDING_KEY).catch(() => {});
    await persistTabState(tabId, state, { forceRecovery: true });
    await chrome.tabs.sendMessage(tabId, { type: "OGRR_INTERACTIVE_ARM_RESULT", ok: true }).catch(() => {});
    return result.status;
  } catch (error) {
    if (videoCapture) {
      const cleanupState = await getTabState(tabId);
      cleanupState.videoCapture = videoCapture;
      await stopInteractiveVideoCapture(tabId, cleanupState, "arm_failed").catch(() => {});
    }
    const state = await getTabState(tabId);
    state.recordingArmed = false;
    state.sessionStatus = "awaiting_video_authorization";
    state.videoCapture = {
      status: "authorization-required",
      error: error instanceof Error ? error.message : String(error),
      requestedAt: state.videoCapture?.requestedAt ?? new Date().toISOString(),
    };
    state.lastManualAction = {
      at: new Date().toISOString(),
      success: false,
      message: `Interactive video authorization failed: ${state.videoCapture.error}`,
    };
    await setVideoBadge(tabId, "error");
    await persistTabState(tabId, state, { forceRecovery: true });
    await chrome.tabs.sendMessage(tabId, {
      type: "OGRR_INTERACTIVE_ARM_RESULT",
      ok: false,
      error: state.videoCapture.error,
    }).catch(() => {});
    return publicStatus(state);
  }
}

async function cancelPendingInteractiveArm(tabId) {
  const stored = await chrome.storage.session.get(INTERACTIVE_ARM_PENDING_KEY).catch(() => ({}));
  const pending = stored?.[INTERACTIVE_ARM_PENDING_KEY];
  if (pending?.tabId === tabId) {
    await chrome.storage.session.remove(INTERACTIVE_ARM_PENDING_KEY).catch(() => {});
  }
}

async function armSenderTab(sender, setup = {}) {
  const tabId = await resolveTabId(sender);
  if (!Number.isInteger(tabId)) throw new Error("No OpenGuessr tab is available to arm.");
  await cancelPendingInteractiveArm(tabId);
  // Static/NMPZ uses this direct path. Interactive uses the adjacent one-click
  // video-aware path so both conditions share the same visible in-page workflow.
  return armTab(tabId, setup);
}

async function armActiveTab(setup = {}) {
  const tabId = await resolveTabId(null);
  if (!Number.isInteger(tabId)) return null;

  // Resolve omitted setup fields from the already-saved popup settings. This
  // matters for static runs too: an empty setup must not accidentally start
  // tabCapture just because setup.condition is undefined.
  const hasExplicitCondition =
    setup?.condition === "static-image" || setup?.condition === "interactive-panorama";
  const effectiveSetup = hasExplicitCondition
    ? { ...setup }
    : { ...(await getSettings()), ...setup };

  let videoCapture = null;
  const wantsVideo = effectiveSetup.condition === "interactive-panorama";
  if (wantsVideo) {
    // Do this immediately after resolving local settings: tabCapture must
    // follow the user's toolbar/popup invocation.
    videoCapture = await startInteractiveVideoCapture(tabId, effectiveSetup);
  }

  try {
    const result = await armTab(tabId, setup);
    if (videoCapture) {
      const state = await getTabState(tabId);
      state.videoCapture = videoCapture;
      state.lastManualAction = {
        at: new Date().toISOString(),
        success: true,
        message: "Recorder armed and the tab video stream is ready. Each location will be recorded into its own WebM when the panorama appears.",
      };
      await persistTabState(tabId, state, { forceRecovery: true });
      return publicStatus(state);
    }
    return result.status;
  } catch (error) {
    if (videoCapture) {
      const state = await getTabState(tabId);
      state.videoCapture = videoCapture;
      await stopInteractiveVideoCapture(tabId, state, "arm_failed").catch(() => {});
    }
    throw error;
  }
}

async function armTab(tabId, setup = {}) {
  const previous = await getTabState(tabId);
  if (previous.currentRound) {
    throw new Error("A round is already recording. Stop or finalize it before arming a new competition.");
  }

  const currentSettings = await getSettings();
  const requestedSettings = {
    ...currentSettings,
    ...setup,
    enabled: true,
  };

  if (previous.recordingArmed) {
    const existing = settingsForState(previous, currentSettings);
    const sameSetup =
      String(existing.competitionId ?? "") === String(requestedSettings.competitionId ?? "") &&
      String(existing.model ?? "") === String(requestedSettings.model ?? "") &&
      String(existing.condition ?? "") === String(requestedSettings.condition ?? "");
    if (!sameSetup) {
      throw new Error("This tab is already armed with a different setup. Stop recording before changing competition, model, or condition.");
    }
    previous.lastManualAction = {
      at: new Date().toISOString(),
      success: true,
      message: "Recorder was already armed for this competition; the existing arm state was kept.",
    };
    await persistTabState(tabId, previous, { forceRecovery: true });
    return { status: publicStatus(previous), settings: currentSettings };
  }

  settingsCache = await saveSettings(requestedSettings);

  // Static/NMPZ uses the proven v0.6.x path and must never inherit an orphaned
  // interactive video capture from an earlier attempt.
  if (
    requestedSettings.condition === "static-image" &&
    ["ready", "recording"].includes(previous.videoCapture?.status)
  ) {
    await stopInteractiveVideoCapture(tabId, previous, "switch_to_static").catch(() => {});
  }

  if (
    previous.sessionId &&
    (previous.completedRounds?.length ?? 0) > 0 &&
    previous.sessionStatus !== "complete"
  ) {
    previous.sessionStatus = "closed";
    await deliverSessionManifest(previous, settingsForState(previous, settingsCache));
  }

  clearFinalizeTimer(tabId);
  const state = createTabState(tabId);
  state.pageContext = previous.pageContext ?? null;
  state.pageProbe = previous.pageProbe ?? null;
  state.recordingArmed = true;
  state.armedAt = new Date().toISOString();
  state.competitionStartConfirmed = false;
  state.competitionStartIntentAt = null;
  state.competitionStartedAt = null;
  state.startPromptSeen = Boolean(previous.pageProbe?.competitionStartPromptVisible);
  state.startPromptSignature = previous.pageProbe?.competitionStartSignature ?? null;
  state.startPromptDismissedAt = null;
  state.armPrimaryViewFingerprint = probeViewFingerprint(previous.pageProbe?.primaryView);
  state.armGoogleFrameInstanceId = previous.lastObservedGoogleFrameInstanceId ?? null;
  state.sessionStatus = "armed";
  state.armContext = {
    competitionId: settingsCache.competitionId,
    model: settingsCache.model,
    condition: settingsCache.condition,
  };
  state.lastManualAction = {
    at: state.armedAt,
    success: true,
    message: "Recorder armed. Waiting for the competition to actually start.",
  };
  tabStateCache.set(tabId, state);
  await persistTabState(tabId, state, { forceRecovery: true });
  return { status: publicStatus(state), settings: settingsCache };
}

async function stopSenderTab(sender, reason = "user_stop") {
  const tabId = await resolveTabId(sender);
  if (!Number.isInteger(tabId)) return null;
  return stopTab(tabId, reason);
}

async function doneAndDisarmSenderTab(sender) {
  const tabId = await resolveTabId(sender);
  if (!Number.isInteger(tabId)) return null;
  return doneAndDisarmTab(tabId);
}

async function doneAndDisarmTab(tabId) {
  clearFinalizeTimer(tabId);
  const previous = await getTabState(tabId);
  if (previous.currentRound) {
    throw new Error("A round is still active. Finish or stop the round before disarming the completed competition.");
  }
  if (previous.sessionStatus !== "complete") {
    throw new Error("Done & disarm is available after a competition has completed.");
  }

  const state = createTabState(tabId);
  // Keep only live page observations so the next competition start dialog can
  // be detected normally. Saved round/session data has already been written.
  state.pageContext = previous.pageContext ?? null;
  state.pageProbe = previous.pageProbe ?? null;
  state.lastObservedGoogleFrameInstanceId =
    previous.lastObservedGoogleFrameInstanceId ?? null;
  state.lastObservedGoogleView = previous.lastObservedGoogleView ?? null;
  state.lastManualAction = {
    at: new Date().toISOString(),
    success: true,
    message: "Competition finished. Recorder disarmed and waiting for a new competition start dialog.",
  };

  tabStateCache.set(tabId, state);
  await persistTabState(tabId, state, { forceRecovery: true });
  return publicStatus(state);
}

async function stopActiveTab(reason = "user_stop") {
  const tabId = await resolveTabId(null);
  if (!Number.isInteger(tabId)) return null;
  return stopTab(tabId, reason);
}

async function stopTab(tabId, reason) {
  clearFinalizeTimer(tabId);
  await cancelPendingInteractiveArm(tabId);
  const state = await getTabState(tabId);
  if (["authorization-required", "authorization-error"].includes(state.videoCapture?.status)) {
    state.videoCapture = null;
  }
  const settings = settingsForState(state, await getSettings());
  if (state.currentRound) {
    await finalizeRound(tabId, state, reason);
  }
  state.recordingArmed = false;
  if (state.sessionId && state.sessionStatus !== "complete") {
    state.sessionStatus = "closed";
    state.lastSessionSave = {
      at: new Date().toISOString(),
      ...(await deliverSessionManifest(state, settings)),
    };
  } else if (!state.sessionId) {
    state.sessionStatus = "idle";
  }
  if (["ready", "recording", "error"].includes(state.videoCapture?.status)) {
    await stopInteractiveVideoCapture(tabId, state, reason);
  }
  state.lastManualAction = {
    at: new Date().toISOString(),
    success: true,
    message: "Recorder stopped. No new round will start until you arm it again.",
  };
  await persistTabState(tabId, state, { forceRecovery: true });
  return publicStatus(state);
}

async function getActiveTabStatus() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!Number.isInteger(tab?.id)) return null;
  const state = await getTabState(tab.id);
  return publicStatus(state);
}

async function finalizeActiveTab(reason) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!Number.isInteger(tab?.id)) return null;
  const state = await getTabState(tab.id);
  const settings = await getSettings();
  await refreshPageProbe(tab.id, state, settings);
  if (!state.currentRound) {
    await ensureRoundFromProbe(tab.id, state, settings, "manual_finalize", {
      force: Boolean(state.pageProbe?.roundLikelyActive),
    });
  }
  if (!state.currentRound) {
    state.lastManualAction = {
      at: new Date().toISOString(),
      success: false,
      message:
        "No active round was detected. Save a checkpoint to inspect the page probe and recorder state.",
    };
    await persistTabState(tab.id, state);
    return publicStatus(state);
  }
  await finalizeRound(tab.id, state, reason);
  state.lastManualAction = {
    at: new Date().toISOString(),
    success: true,
    message: "Current round finalized and saved.",
  };
  await persistTabState(tab.id, state);
  return publicStatus(state);
}

async function resetActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!Number.isInteger(tab?.id)) return null;
  clearFinalizeTimer(tab.id);

  const previous = await getTabState(tab.id);
  const settings = await getSettings();
  if (previous.currentRound) {
    await finalizeRound(tab.id, previous, "session_reset");
  }
  if (
    previous.sessionId &&
    (previous.completedRounds?.length ?? 0) > 0 &&
    previous.sessionStatus !== "complete"
  ) {
    previous.sessionStatus = "closed";
    await deliverSessionManifest(previous, settings);
  }
  if (["ready", "recording"].includes(previous.videoCapture?.status)) {
    await stopInteractiveVideoCapture(tab.id, previous, "session_reset");
  }

  const state = createTabState(tab.id);
  tabStateCache.set(tab.id, state);
  await persistTabState(tab.id, state);
  return publicStatus(state);
}

async function testCollector() {
  const settings = await getSettings();
  const url = new URL(settings.collectorUrl);
  url.pathname = "/api/health";
  url.search = "";
  url.hash = "";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error ?? `HTTP ${response.status}`);
    }
    return { connected: true, ...payload };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function getSettings() {
  settingsCache ??= await loadSettings();
  return settingsCache;
}

async function getTabState(tabId) {
  if (tabStateCache.has(tabId)) return tabStateCache.get(tabId);

  const key = `${TAB_STATE_PREFIX}${tabId}`;
  const recoveryKey = `${RECOVERY_STATE_PREFIX}${tabId}`;
  const storage = chrome.storage.session ?? chrome.storage.local;
  const stored = await storage.get(key);
  const recovery = stored[key]
    ? null
    : await chrome.storage.local.get(recoveryKey);
  const state = normalizeTabState(
    stored[key] ?? recovery?.[recoveryKey] ?? createTabState(tabId),
    tabId,
  );
  tabStateCache.set(tabId, state);
  return state;
}

function createTabState(tabId) {
  return {
    tabId,
    sessionId: null,
    sessionStartedAt: null,
    sessionStatus: "idle",
    sessionContext: null,
    recordingArmed: false,
    armContext: null,
    armedAt: null,
    competitionStartConfirmed: false,
    competitionStartIntentAt: null,
    competitionStartedAt: null,
    startPromptSeen: false,
    startPromptSignature: null,
    startPromptDismissedAt: null,
    armPrimaryViewFingerprint: null,
    armGoogleFrameInstanceId: null,
    lastObservedGoogleFrameInstanceId: null,
    lastObservedGoogleView: null,
    lastRoundSavedAt: null,
    completedRounds: [],
    expectedRoundCount: null,
    pendingSessionReset: false,
    roundCounter: 0,
    currentRound: null,
    awaitingNewFrame: false,
    lastFinishedFrameInstanceId: null,
    lastFinishedCoordinate: null,
    lastFinishedPanoId: null,
    lastFinishedAt: null,
    lastFinishedRoundNumber: null,
    advanceIntentAt: null,
    pageContext: null,
    pageProbe: null,
    lastProbeError: null,
    lastSave: null,
    lastCheckpoint: null,
    lastDiagnosticsExport: null,
    lastManualAction: null,
    recoveryBackedUpAt: null,
    recoveryBackupError: null,
    lastRecoveryWriteAtMs: null,
    lastSessionSave: null,
    videoCapture: null,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeTabState(state, tabId) {
  state.tabId = tabId;
  state.sessionStartedAt ??= null;
  state.sessionStatus ??= state.sessionId ? "active" : "idle";
  state.sessionContext ??= null;
  state.recordingArmed = Boolean(state.recordingArmed);
  state.armContext ??= null;
  state.armedAt ??= null;
  state.competitionStartConfirmed = Boolean(state.competitionStartConfirmed);
  state.competitionStartIntentAt ??= null;
  state.competitionStartedAt ??= state.competitionStartIntentAt ?? null;
  state.startPromptSeen = Boolean(state.startPromptSeen);
  state.startPromptSignature ??= null;
  state.startPromptDismissedAt ??= null;
  state.armPrimaryViewFingerprint ??= null;
  state.armGoogleFrameInstanceId ??= null;
  state.lastObservedGoogleFrameInstanceId ??= null;
  state.lastObservedGoogleView ??= null;
  state.lastRoundSavedAt ??= null;
  state.completedRounds = Array.isArray(state.completedRounds)
    ? state.completedRounds
    : [];
  state.expectedRoundCount ??= null;
  state.pendingSessionReset ??= false;
  state.lastFinishedRoundNumber ??= null;
  state.pageProbe ??= null;
  state.lastProbeError ??= null;
  state.lastCheckpoint ??= null;
  state.lastDiagnosticsExport ??= null;
  state.lastManualAction ??= null;
  state.recoveryBackedUpAt ??= null;
  state.recoveryBackupError ??= null;
  state.lastRecoveryWriteAtMs ??= null;
  state.lastSessionSave ??= null;
  state.videoCapture ??= null;
  return state;
}

async function persistTabState(
  tabId,
  state,
  { forceRecovery = false } = {},
) {
  const key = `${TAB_STATE_PREFIX}${tabId}`;
  const recoveryKey = `${RECOVERY_STATE_PREFIX}${tabId}`;
  const storage = chrome.storage.session ?? chrome.storage.local;
  await storage.set({ [key]: state });

  const now = Date.now();
  const shouldWriteRecovery =
    forceRecovery ||
    !state.currentRound ||
    !Number.isFinite(state.lastRecoveryWriteAtMs) ||
    now - state.lastRecoveryWriteAtMs >= 2000;
  if (shouldWriteRecovery) {
    try {
      state.recoveryBackedUpAt = new Date(now).toISOString();
      state.lastRecoveryWriteAtMs = now;
      await chrome.storage.local.set({ [recoveryKey]: state });
      state.recoveryBackupError = null;
    } catch (error) {
      state.recoveryBackupError = {
        at: new Date().toISOString(),
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }
  tabStateCache.set(tabId, state);
}

async function removePersistedTabState(tabId) {
  const key = `${TAB_STATE_PREFIX}${tabId}`;
  const recoveryKey = `${RECOVERY_STATE_PREFIX}${tabId}`;
  const storage = chrome.storage.session ?? chrome.storage.local;
  await storage.remove(key);
  await chrome.storage.local.remove(recoveryKey);
}

function publicStatus(state) {
  const completedRoundCount = countCompletedRounds(state.completedRounds ?? []);
  const lastCompletedRound = state.completedRounds?.at(-1) ?? null;
  return {
    sessionId: state.sessionId,
    recordingArmed: Boolean(state.recordingArmed),
    armedAt: state.armedAt ?? null,
    competitionStartConfirmed: Boolean(state.competitionStartConfirmed),
    competitionStartIntentAt: state.competitionStartIntentAt ?? null,
    competitionStartedAt: state.competitionStartedAt ?? null,
    startPromptSeen: Boolean(state.startPromptSeen),
    startPromptDismissedAt: state.startPromptDismissedAt ?? null,
    armContext: state.armContext ?? null,
    recordingState: state.currentRound
      ? "recording"
      : state.sessionStatus === "complete"
        ? "complete"
        : state.recordingArmed
          ? "armed"
          : "idle",
    session: state.sessionId
      ? {
          id: state.sessionId,
          status: state.sessionStatus ?? "active",
          startedAt: state.sessionStartedAt ?? null,
          competitionId: state.sessionContext?.competitionId ?? null,
          model: state.sessionContext?.model ?? null,
          condition: state.sessionContext?.condition ?? null,
          completedRoundCount,
          expectedRoundCount: state.expectedRoundCount ?? null,
        }
      : null,
    pageUrl: state.pageContext?.pageUrl ?? null,
    currentRound: state.currentRound
      ? {
          id: state.currentRound.id,
          index: state.currentRound.index,
          startedAt: state.currentRound.startedAt,
          sampleCount: state.currentRound.samples.length,
          predictionCaptured: Boolean(state.currentRound.prediction),
          frameInstanceId: state.currentRound.frameInstanceId,
          competitionRound: state.currentRound.competitionRound ?? null,
          pageRoundNumber: state.currentRound.pageRoundNumber ?? null,
          pageRoundTotal: state.currentRound.pageRoundTotal ?? null,
          captureMode: state.currentRound.captureMode ?? null,
          provisional: Boolean(state.currentRound.provisional),
          frozen: Number.isFinite(state.currentRound.frozenAtMs),
          freezeReason: state.currentRound.freezeReason ?? null,
          staticImage: state.currentRound.staticImage ?? null,
          video: state.currentRound.video
            ? {
                status: state.currentRound.video.status ?? null,
                captureId: state.currentRound.video.captureId ?? null,
                path: state.currentRound.video.path ?? null,
                error: state.currentRound.video.error ?? null,
              }
            : null,
          hasCoordinate:
            isCoordinate(state.currentRound.actualStart) ||
            isCoordinate(state.currentRound.spawnRequested) ||
            isCoordinate(state.currentRound.samples?.[0]),
        }
      : null,
    awaitingNewFrame: state.awaitingNewFrame,
    lastRecordingId: state.lastRecordingId ?? null,
    lastRoundSavedAt: state.lastRoundSavedAt ?? null,
    lastCompletedRound: lastCompletedRound
      ? {
          recordingId: lastCompletedRound.recordingId ?? null,
          roundIndex: lastCompletedRound.roundIndex ?? null,
          competitionRound: lastCompletedRound.competitionRound ?? null,
          competitionOverallIndex: lastCompletedRound.competitionOverallIndex ?? null,
          predictionCaptured: Boolean(lastCompletedRound.predictionCaptured),
          saveSuccess: Boolean(lastCompletedRound.saveSuccess),
          videoSaveSuccess: lastCompletedRound.videoSaveSuccess !== false,
          videoPath: lastCompletedRound.video?.path ?? null,
          videoError: lastCompletedRound.videoError ?? null,
          path: lastCompletedRound.path ?? null,
          locationId: lastCompletedRound.locationId ?? null,
        }
      : null,
    pageProbe: state.pageProbe
      ? {
          at: state.pageProbe.at ?? null,
          pageState: state.pageProbe.pageState ?? null,
          roundLikelyActive: Boolean(state.pageProbe.roundLikelyActive),
          roundNumber: state.pageProbe.roundNumber ?? null,
          roundTotal: state.pageProbe.roundTotal ?? null,
          modeHint: state.pageProbe.modeHint ?? null,
          hasStreetViewCoordinate: isCoordinate(state.pageProbe.primaryView),
          streetViewCandidateCount:
            state.pageProbe.diagnostics?.streetViewCandidateCount ?? 0,
        }
      : null,
    lastSave: state.lastSave ?? null,
    lastCheckpoint: state.lastCheckpoint ?? null,
    lastDiagnosticsExport: state.lastDiagnosticsExport ?? null,
    lastManualAction: state.lastManualAction ?? null,
    lastProbeError: state.lastProbeError ?? null,
    recoveryBackedUpAt: state.recoveryBackedUpAt ?? null,
    recoveryBackupError: state.recoveryBackupError ?? null,
    lastSessionSave: state.lastSessionSave ?? null,
    videoCapture: state.videoCapture
      ? {
          status: state.videoCapture.status ?? null,
          streamSessionId: state.videoCapture.streamSessionId ?? null,
          activeRoundCaptureId: state.videoCapture.activeRoundCaptureId ?? null,
          readyAt: state.videoCapture.readyAt ?? null,
          width: state.videoCapture.width ?? null,
          height: state.videoCapture.height ?? null,
          error: state.videoCapture.error ?? null,
          lastRoundError: state.videoCapture.lastRoundError ?? null,
        }
      : null,
    updatedAt: state.updatedAt,
  };
}

function addDiagnostic(round, name, details = {}) {
  round.diagnostics.events.push({
    name,
    at: new Date().toISOString(),
    details: sanitizeDiagnostic(details),
  });
  if (round.diagnostics.events.length > 200) {
    round.diagnostics.events.splice(0, round.diagnostics.events.length - 200);
  }
}

function sanitizeDiagnostic(value) {
  if (!value || typeof value !== "object") return {};
  const copy = {};
  for (const [key, item] of Object.entries(value)) {
    if (key.toLowerCase().includes("token") || key.toLowerCase().includes("key")) {
      continue;
    }
    if (["string", "number", "boolean"].includes(typeof item) || item === null) {
      copy[key] = typeof item === "string" ? item.slice(0, 500) : item;
    } else if (key === "spawnRequested" && isCoordinate(item)) {
      copy[key] = normalizeCameraPoint(item);
    }
  }
  return copy;
}

function normalizeCameraPoint(value) {
  if (!isCoordinate(value)) return null;
  return {
    lat: Number(value.lat),
    lng: Number(value.lng),
    heading: finiteOrNull(value.heading),
    pitch: finiteOrNull(value.pitch),
    zoom: finiteOrNull(value.zoom),
    fov: finiteOrNull(value.fov),
    panoId: value.panoId ? String(value.panoId) : null,
  };
}

function isCoordinate(value) {
  if (value?.lat === null || value?.lat === "" || value?.lat === undefined) return false;
  if (value?.lng === null || value?.lng === "" || value?.lng === undefined) return false;
  return (
    Number.isFinite(Number(value.lat)) &&
    Number(value.lat) >= -90 &&
    Number(value.lat) <= 90 &&
    Number.isFinite(Number(value.lng)) &&
    Number(value.lng) >= -180 &&
    Number(value.lng) <= 180
  );
}

function finiteOrNull(value) {
  const number = Number(value);
  return value !== null && value !== "" && Number.isFinite(number) ? number : null;
}

function positiveIntegerOrNull(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function stringOrNull(value, maxLength = 500) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text.slice(0, maxLength) : null;
}

function parseTime(value) {
  const parsed = Date.parse(value ?? "");
  return Number.isFinite(parsed) ? parsed : null;
}

function eventPredatesRound(round, payload, keys = ["at", "detectedAt"]) {
  if (!round || !Number.isFinite(round.startedAtMs)) return false;
  for (const key of keys) {
    const eventAtMs = parseTime(payload?.[key]);
    if (Number.isFinite(eventAtMs)) {
      return eventAtMs < round.startedAtMs;
    }
  }
  return false;
}

function distanceMeters(a, b) {
  if (!isCoordinate(a) || !isCoordinate(b)) return Infinity;
  const radius = 6371008.8;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRadians(Number(b.lat) - Number(a.lat));
  const dLng = toRadians(Number(b.lng) - Number(a.lng));
  const lat1 = toRadians(Number(a.lat));
  const lat2 = toRadians(Number(b.lat));
  const hav =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
}

function angularDifference(a, b) {
  const aFinite = Number.isFinite(a);
  const bFinite = Number.isFinite(b);
  if (!aFinite && !bFinite) return 0;
  if (!aFinite || !bFinite) return Infinity;
  return Math.abs(((b - a + 540) % 360) - 180);
}

function absoluteDifference(a, b) {
  const aFinite = Number.isFinite(a);
  const bFinite = Number.isFinite(b);
  if (!aFinite && !bFinite) return 0;
  if (!aFinite || !bFinite) return Infinity;
  return Math.abs(b - a);
}

function canStartNewRoundFromGoogle(state, sample) {
  if (!isCoordinate(sample)) return false;
  if (!canStartFormalCompetitionRound(state)) return false;

  if (!state.awaitingNewFrame) {
    // The competition/start page may already have a Street View iframe behind
    // its UI. Never let that preview consume formal round 1. Wait until the DOM
    // independently confirms that the playable round/Guess controls are visible.
    const configuredCondition =
      state.sessionContext?.condition ?? state.armContext?.condition ?? null;
    if (
      configuredCondition === "interactive-panorama" &&
      predictedCompetitionRoundCount(state) === 0 &&
      !firstInteractiveRoundIsVisiblyLive(state)
    ) {
      return false;
    }
    return true;
  }

  const eventAtMs =
    parseTime(sample.capturedAt) ?? parseTime(sample.at) ?? Date.now();
  const lastFinishedAtMs = parseTime(state.lastFinishedAt);
  if (Number.isFinite(lastFinishedAtMs) && eventAtMs <= lastFinishedAtMs) {
    return false;
  }

  const advanceAtMs = parseTime(state.advanceIntentAt);
  const probeAtMs = parseTime(state.pageProbe?.at);
  const resultClearedAfterFinish =
    Number.isFinite(lastFinishedAtMs) &&
    Number.isFinite(probeAtMs) &&
    probeAtMs > lastFinishedAtMs &&
    !state.pageProbe?.resultVisible &&
    state.pageProbe?.pageState !== "result";
  const continueConfirmed =
    Number.isFinite(advanceAtMs) &&
    (!Number.isFinite(lastFinishedAtMs) || advanceAtMs >= lastFinishedAtMs) &&
    eventAtMs >= advanceAtMs;

  // Do not let camera events emitted by the still-visible result panorama create
  // a new round. We need either the actual Continue intent or a DOM probe that
  // proves the result screen has cleared.
  if (!continueConfirmed && !resultClearedAfterFinish) return false;

  const moved =
    isCoordinate(state.lastFinishedCoordinate) &&
    distanceMeters(state.lastFinishedCoordinate, sample) >= 20;
  const panoChanged = Boolean(
    sample.panoId &&
      state.lastFinishedPanoId &&
      sample.panoId !== state.lastFinishedPanoId
  );
  const frameChanged = Boolean(
    sample.frameInstanceId &&
      state.lastFinishedFrameInstanceId &&
      sample.frameInstanceId !== state.lastFinishedFrameInstanceId
  );

  // A pure POV/zoom update from the old result panorama is not a new round.
  return moved || panoChanged || frameChanged;
}

function buildRoundSignal(round) {
  const spawn = round.spawnRequested;
  return `${round.frameInstanceId}|${spawn?.lat ?? "none"},${
    spawn?.lng ?? "none"
  }|${spawn?.panoId ?? "none"}`;
}

function buildFallbackFilename(recording, settings) {
  const competition = safeFilenamePart(recording.competitionId, "unassigned");
  const model = safeFilenamePart(recording.model, "unknown-model");
  const condition = safeFilenamePart(recording.condition, "unknown-condition");
  const started = safeIsoForId(recording.startedAt);
  const filename = `${started}__${model}__${condition}__${recording.id}.json`;
  return `${settings.downloadSubfolder}/${competition}/${filename}`;
}

function safeFilenamePart(value, fallback) {
  const result = String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return result || fallback;
}

function safeIsoForId(value) {
  const date = new Date(value);
  const iso = Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  return iso.replaceAll(":", "-").replaceAll(".", "-");
}

function randomId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}
