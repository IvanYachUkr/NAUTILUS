let activeSession = null;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.target !== "ogrr-offscreen") return undefined;
  void handleMessage(message)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((error) => sendResponse({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }));
  return true;
});

async function handleMessage(message) {
  if (message.type === "OGRR_VIDEO_SESSION_START" || message.type === "OGRR_VIDEO_START") {
    return startSession(message);
  }
  if (message.type === "OGRR_VIDEO_ROUND_START") {
    return startRoundCapture(message);
  }
  if (message.type === "OGRR_VIDEO_ROUND_STOP") {
    return stopRoundCapture(message.reason ?? "prediction_submitted");
  }
  if (message.type === "OGRR_VIDEO_SESSION_STOP" || message.type === "OGRR_VIDEO_STOP") {
    return stopSession(message.reason ?? "stopped");
  }
  if (message.type === "OGRR_VIDEO_STATUS") {
    return activeSession ? publicSession(activeSession) : { status: "idle" };
  }
  return {};
}

async function startSession(message) {
  if (activeSession) {
    if (activeSession.tabId === message.tabId && activeSession.stream?.active) {
      return publicSession(activeSession);
    }
    await stopSession("replaced");
  }

  const streamId = String(message.streamId ?? "");
  if (!streamId) throw new Error("Missing tab-capture stream ID.");

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    },
  });

  const track = stream.getVideoTracks()[0];
  if (!track) {
    stream.getTracks().forEach((item) => item.stop());
    throw new Error("Chrome returned a tab capture without a video track.");
  }

  await track.applyConstraints({
    frameRate: { ideal: 20, max: 30 },
  }).catch(() => {});

  const settings = track.getSettings?.() ?? {};
  activeSession = {
    streamSessionId: String(message.streamSessionId ?? `stream-${Date.now()}`),
    competitionId: String(message.competitionId ?? "unassigned"),
    collectorUrl: String(message.collectorUrl ?? ""),
    tabId: Number.isInteger(message.tabId) ? message.tabId : null,
    pageUrl: message.pageUrl ? String(message.pageUrl) : null,
    stream,
    track,
    readyAtMs: Date.now(),
    readyAt: new Date().toISOString(),
    width: Number.isFinite(settings.width) ? settings.width : null,
    height: Number.isFinite(settings.height) ? settings.height : null,
    mimeType: chooseMimeType() || "video/webm",
    roundCapture: null,
    error: null,
  };

  track.addEventListener("ended", () => {
    if (!activeSession || activeSession.stream !== stream) return;
    activeSession.error = "Chrome tab-capture video track ended unexpectedly.";
  }, { once: true });

  return publicSession(activeSession);
}

async function startRoundCapture(message) {
  const session = activeSession;
  if (!session?.stream?.active) {
    throw new Error("Interactive tab video stream is not ready. Re-arm from the extension toolbar.");
  }

  const captureId = String(message.captureId ?? "").trim();
  if (!captureId) throw new Error("Missing round video capture ID.");
  const competitionRound = Number(message.competitionRound);
  if (!Number.isInteger(competitionRound) || competitionRound < 1) {
    throw new Error("Missing valid competition round for round video.");
  }
  const requestedSessionId = String(message.sessionId ?? "session");
  const requestedRoundId = String(message.roundId ?? `round-${competitionRound}`);

  if (session.roundCapture) {
    const current = session.roundCapture;
    if (current.captureId === captureId) {
      return publicRound(current);
    }
    // A second Street View sample can race the first start request. Treat a
    // second request for the SAME logical round as an idempotent duplicate;
    // never finalize/replace the active recorder just because captureId differs.
    if (
      current.competitionRound === competitionRound &&
      current.sessionId === requestedSessionId &&
      current.roundId === requestedRoundId
    ) {
      return { ...publicRound(current), duplicateStartIgnored: true };
    }
    await stopRoundCapture("replaced_by_next_round");
  }

  const mimeType = chooseMimeType();
  const recorder = new MediaRecorder(session.stream, {
    ...(mimeType ? { mimeType } : {}),
    videoBitsPerSecond: 6_000_000,
  });

  const capture = {
    captureId,
    competitionId: String(message.competitionId ?? session.competitionId ?? "unassigned"),
    competitionRound,
    sessionId: requestedSessionId,
    roundId: requestedRoundId,
    collectorUrl: String(message.collectorUrl ?? session.collectorUrl ?? ""),
    tabId: session.tabId,
    pageUrl: message.pageUrl ? String(message.pageUrl) : session.pageUrl,
    recorder,
    startedAtMs: Date.now(),
    startedAt: null,
    mimeType: recorder.mimeType || mimeType || session.mimeType || "video/webm",
    width: session.width,
    height: session.height,
    chunkCount: 0,
    bytesWritten: 0,
    uploadQueue: Promise.resolve(),
    uploadError: null,
    stopPromise: null,
  };
  capture.startedAt = new Date(capture.startedAtMs).toISOString();

  recorder.addEventListener("dataavailable", (event) => {
    if (!event.data || event.data.size <= 0) return;
    const sequence = capture.chunkCount;
    capture.chunkCount += 1;
    capture.bytesWritten += event.data.size;
    capture.uploadQueue = capture.uploadQueue
      .then(() => uploadChunk(capture, event.data, sequence))
      .catch((error) => {
        capture.uploadError = error instanceof Error ? error.message : String(error);
      });
  });

  recorder.addEventListener("error", (event) => {
    const error = event.error ?? new Error("MediaRecorder failed.");
    capture.uploadError = error instanceof Error ? error.message : String(error);
  });

  recorder.start(500);
  session.roundCapture = capture;
  return publicRound(capture);
}

async function stopRoundCapture(reason) {
  const session = activeSession;
  const capture = session?.roundCapture;
  if (!capture) return { status: "idle" };
  if (capture.stopPromise) return capture.stopPromise;

  capture.stopPromise = new Promise((resolve) => {
    const finish = async () => {
      try {
        await capture.uploadQueue;
        if (capture.uploadError) {
          throw new Error(`Video chunk upload failed: ${capture.uploadError}`);
        }
        const stoppedAtMs = Date.now();
        const stoppedAt = new Date(stoppedAtMs).toISOString();
        const finalized = await finalizeVideo(capture, {
          reason,
          stoppedAtMs,
          stoppedAt,
        });
        resolve({
          ...publicRound(capture),
          status: "stopped",
          stoppedAtMs,
          stoppedAt,
          path: finalized.path ?? null,
          metadataPath: finalized.metadataPath ?? null,
          locationId: finalized.locationId ?? null,
        });
      } catch (error) {
        resolve({
          ...publicRound(capture),
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        if (activeSession === session && session.roundCapture === capture) {
          session.roundCapture = null;
        }
      }
    };

    if (capture.recorder.state === "inactive") {
      void finish();
      return;
    }
    capture.recorder.addEventListener("stop", () => void finish(), { once: true });
    capture.recorder.stop();
  });

  return capture.stopPromise;
}

async function stopSession(reason) {
  const session = activeSession;
  if (!session) return { status: "idle" };

  let roundResult = null;
  if (session.roundCapture) {
    roundResult = await stopRoundCapture(reason);
  }
  session.stream.getTracks().forEach((track) => track.stop());
  if (activeSession === session) activeSession = null;
  return {
    status: "stopped",
    streamSessionId: session.streamSessionId,
    stoppedAt: new Date().toISOString(),
    roundResult,
  };
}

function publicSession(session) {
  return {
    status: session.stream?.active ? "ready" : "error",
    streamSessionId: session.streamSessionId,
    competitionId: session.competitionId,
    readyAt: session.readyAt,
    readyAtMs: session.readyAtMs,
    mimeType: session.mimeType,
    width: session.width,
    height: session.height,
    roundRecording: Boolean(session.roundCapture),
    roundCapture: session.roundCapture ? publicRound(session.roundCapture) : null,
    error: session.error,
  };
}

function publicRound(capture) {
  return {
    status: capture.recorder?.state === "recording" ? "recording" : "starting",
    captureId: capture.captureId,
    competitionId: capture.competitionId,
    competitionRound: capture.competitionRound,
    sessionId: capture.sessionId,
    roundId: capture.roundId,
    startedAt: capture.startedAt,
    startedAtMs: capture.startedAtMs,
    mimeType: capture.mimeType,
    width: capture.width,
    height: capture.height,
    chunkCount: capture.chunkCount,
    bytesWritten: capture.bytesWritten,
  };
}

function chooseMimeType() {
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

async function uploadChunk(capture, blob, sequence) {
  const endpoint = collectorEndpoint(capture.collectorUrl, "/api/exploration-video-chunks");
  endpoint.searchParams.set("competitionId", capture.competitionId);
  endpoint.searchParams.set("competitionRound", String(capture.competitionRound));
  endpoint.searchParams.set("sessionId", capture.sessionId);
  endpoint.searchParams.set("roundId", capture.roundId);
  endpoint.searchParams.set("captureId", capture.captureId);
  endpoint.searchParams.set("sequence", String(sequence));
  endpoint.searchParams.set("mimeType", capture.mimeType);

  return fetchJsonWithRetry(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": capture.mimeType || "video/webm",
      "X-OGRR-Chunk-Sequence": String(sequence),
    },
    body: blob,
  }, `video chunk ${sequence}`);
}

async function finalizeVideo(capture, stop) {
  const endpoint = collectorEndpoint(capture.collectorUrl, "/api/exploration-videos/finalize");
  return fetchJsonWithRetry(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      schemaVersion: "1.1",
      captureId: capture.captureId,
      competitionId: capture.competitionId,
      competitionRound: capture.competitionRound,
      sessionId: capture.sessionId,
      roundId: capture.roundId,
      tabId: capture.tabId,
      pageUrl: capture.pageUrl,
      startedAt: capture.startedAt,
      startedAtMs: capture.startedAtMs,
      stoppedAt: stop.stoppedAt,
      stoppedAtMs: stop.stoppedAtMs,
      stopReason: stop.reason,
      mimeType: capture.mimeType,
      width: capture.width,
      height: capture.height,
      chunkCount: capture.chunkCount,
      bytesWritten: capture.bytesWritten,
    }),
  }, "round video finalization");
}

async function fetchJsonWithRetry(url, options, label, attempts = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, options);
      const payload = await response.json().catch(() => ({}));
      if (response.ok) return payload;
      const error = new Error(payload.error ?? `Collector returned HTTP ${response.status} for ${label}.`);
      // 4xx responses are deterministic except 408/409/429. 409 is intentionally
      // retryable because the collector finalizer is idempotent since recorder 0.7.7.
      if (response.status >= 400 && response.status < 500 && ![408, 409, 429].includes(response.status)) {
        throw error;
      }
      lastError = error;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, 150 * 2 ** (attempt - 1)));
    }
  }
  throw lastError ?? new Error(`Collector request failed for ${label}.`);
}

function collectorEndpoint(collectorUrl, pathname) {
  const url = new URL(collectorUrl || "http://127.0.0.1:4173/api/recordings");
  url.pathname = pathname;
  url.search = "";
  url.hash = "";
  return url;
}
