(() => {
  const CHANNEL = "openguessr-research-recorder";
  const SOURCE = "openguessr-page";
  const GUESS_TEXT = /(^|\b)(guess|make guess|submit guess|lock in|submit)(\b|$)/i;
  const NEXT_TEXT = /(next round|continue|view result|show result|finish)/i;
  const START_TEXT = /\b(start|play|join|enter|begin|participate)\b/i;
  const RESULT_TEXT = /(distance|your guess|round result|you were|correct location)/i;
  const NMPZ_TEXT = /(\bnmpz\b|no\s+move(?:ment)?[\s,/+-]*(?:pan(?:ning)?[\s,/+-]*)?(?:zoom(?:ing)?)?|moving\s+disabled|panning\s+disabled|zooming\s+disabled)/i;
  const ROUND_TEXT = /\bround\s*(\d{1,3})(?:\s*(?:\/|of)\s*(\d{1,3}))?/i;
  const RELEVANT_URL = /(google\.[^/]+\/maps|maps\.google|streetview|street-view|panorama|panoid|cbll=|viewpoint=|location=|@-?\d{1,2}(?:\.\d+)?,-?\d{1,3}(?:\.\d+)?)/i;
  const PROBE_INTERVAL_MS = 1250;
  let lastPassiveSignature = "";
  let lastPassiveSentAt = 0;
  let overlayRoot = null;
  let overlayShadow = null;
  let overlaySetup = null;
  let overlayCollectorLoaded = false;
  let overlayViewKey = null;
  let acknowledgedRecordingId = null;
  let promptDismissedUntil = 0;
  let lastCompetitionStartPromptVisible = false;
  let promptTransitionTimer = null;
  let lastStartIntentAt = 0;
  let staticCaptureInProgress = false;
  let overlayVisibilityBeforeCapture = null;
  let staticCaptureGuard = null;
  let staticCaptureBadge = null;
  let interactiveCaptureOverlayVisibility = null;
  let lastInteractiveViewIntentAt = 0;
  let interactiveArmPending = false;
  let interactiveArmError = null;

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const message = event.data;
    if (
      !message ||
      message.channel !== CHANNEL ||
      message.source !== SOURCE
    ) {
      return;
    }

    chrome.runtime
      .sendMessage({
        type: "OGRR_EVENT",
        source: message.source,
        event: message.event,
        payload: message.payload,
      })
      .catch(() => {});
  });

  if (typeof document.addEventListener === "function") {
    document.addEventListener(
      "click",
      (event) => {
        const target = findActionElement(event);
        if (!target) return;
        const label = getLabel(target);
        if (!label || !START_TEXT.test(label) || /(tutorial|create)/i.test(label)) return;
        const now = Date.now();
        if (now - lastStartIntentAt < 500) return;
        lastStartIntentAt = now;
        chrome.runtime.sendMessage({
          type: "OGRR_EVENT",
          source: SOURCE,
          event: "competition-start-intent",
          payload: { label: label.slice(0, 120), at: new Date(now).toISOString() },
        }).catch(() => {});
        for (const delay of [0, 80, 220]) {
          setTimeout(() => {
            const probe = buildPageProbe("start-control-transition");
            void sendProbe(probe);
          }, delay);
        }
      },
      true,
    );
  }

  if (typeof document.addEventListener === "function") {
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (staticCaptureInProgress) return;
        if (event.button !== undefined && event.button !== 0) return;
        if (overlayRoot?.contains?.(event.target)) return;

        const target = findStaticCaptureTarget();
        if (!target?.element) return;
        if (isCaptureTargetOccluded(target.element)) return;

        const rect = target.element.getBoundingClientRect();
        const x = Number(event.clientX);
        const y = Number(event.clientY);
        const inside =
          Number.isFinite(x) &&
          Number.isFinite(y) &&
          x >= rect.left && x <= rect.right &&
          y >= rect.top && y <= rect.bottom;
        if (!inside) return;

        const now = Date.now();
        if (now - lastInteractiveViewIntentAt < 100) return;
        lastInteractiveViewIntentAt = now;
        chrome.runtime.sendMessage({
          type: "OGRR_EVENT",
          source: SOURCE,
          event: "interactive-view-intent",
          payload: {
            at: new Date(now).toISOString(),
            pointerType: event.pointerType || "mouse",
            clientX: x,
            clientY: y,
          },
        }).catch(() => {});
      },
      true,
    );
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "OGRR_INTERACTIVE_ARM_RESULT") {
      interactiveArmPending = false;
      interactiveArmError = message.ok ? null : (message.error ?? "Interactive video could not be armed.");
      overlayViewKey = null;
      const probe = buildPageProbe("interactive-arm-result");
      void refreshRecorderOverlay(probe);
      sendResponse({ ok: true });
      return false;
    }

    if (message?.type === "OGRR_BEGIN_STATIC_CAPTURE") {
      const result = beginStaticCapture();
      sendResponse(result);
      return false;
    }

    if (message?.type === "OGRR_PREPARE_STATIC_CAPTURE") {
      const result = prepareStaticCapture();
      sendResponse(result);
      return false;
    }

    if (message?.type === "OGRR_STATIC_CAPTURE_BADGE") {
      setStaticCaptureBadge(
        message.visible !== false,
        message.text ?? "Preparing canonical NMPZ image…",
      );
      sendResponse({ ok: true });
      return false;
    }

    if (message?.type === "OGRR_RESTORE_STATIC_CAPTURE") {
      restoreStaticCapture();
      sendResponse({ ok: true });
      return false;
    }

    if (message?.type === "OGRR_PREPARE_INTERACTIVE_CAPTURE") {
      const result = prepareInteractiveCapture();
      sendResponse(result);
      return false;
    }

    if (message?.type === "OGRR_GET_INTERACTIVE_VIDEO_RECT") {
      const result = getInteractiveVideoRect();
      sendResponse(result);
      return false;
    }

    if (message?.type === "OGRR_RESTORE_INTERACTIVE_CAPTURE") {
      restoreInteractiveCapture();
      sendResponse({ ok: true });
      return false;
    }

    if (message?.type !== "OGRR_PROBE_PAGE") return undefined;
    const probe = buildPageProbe("manual");
    sendResponse({ ok: true, probe });
    void sendProbe(probe);
    return false;
  });

  const timer = setInterval(() => {
    const probe = buildPageProbe("heartbeat");
    const signature = JSON.stringify({
      active: probe.roundLikelyActive,
      state: probe.pageState,
      round: probe.roundNumber,
      total: probe.roundTotal,
      mode: probe.modeHint,
      guess: probe.guessControlVisible,
      next: probe.nextControlVisible,
      result: probe.resultVisible,
      view: probe.primaryView
        ? [
            probe.primaryView.lat,
            probe.primaryView.lng,
            probe.primaryView.panoId,
            probe.primaryView.urlFingerprint,
          ]
        : null,
    });
    const now = Date.now();
    const shouldSend =
      probe.roundLikelyActive ||
      signature !== lastPassiveSignature ||
      now - lastPassiveSentAt >= 5000;

    if (shouldSend) {
      lastPassiveSignature = signature;
      lastPassiveSentAt = now;
      void sendProbe(probe);
    }
    lastCompetitionStartPromptVisible = probe.competitionStartPromptVisible;
    void refreshRecorderOverlay(probe);
  }, PROBE_INTERVAL_MS);

  window.addEventListener("pagehide", () => clearInterval(timer), { once: true });
  queueMicrotask(() => {
    const probe = buildPageProbe("initial");
    lastCompetitionStartPromptVisible = probe.competitionStartPromptVisible;
    void sendProbe(probe);
    void refreshRecorderOverlay(probe);
    installPromptTransitionObserver();
  });

  function installPromptTransitionObserver() {
    if (typeof MutationObserver !== "function" || !document.documentElement) return;
    const observer = new MutationObserver(() => {
      if (!lastCompetitionStartPromptVisible || promptTransitionTimer) return;
      promptTransitionTimer = setTimeout(() => {
        promptTransitionTimer = null;
        const probe = buildPageProbe("competition-start-prompt-transition");
        const disappeared =
          lastCompetitionStartPromptVisible &&
          !probe.competitionStartPromptVisible;
        lastCompetitionStartPromptVisible = probe.competitionStartPromptVisible;
        if (disappeared) {
          void sendProbe(probe);
          void refreshRecorderOverlay(probe);
        }
      }, 40);
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "aria-hidden"],
    });
  }

  function findActionElement(event) {
    const path = typeof event?.composedPath === "function" ? event.composedPath() : [];
    for (const item of path) {
      if (!(item instanceof Element)) continue;
      if (item.matches?.("button, [role='button'], input[type='submit'], input[type='button'], a")) {
        return item;
      }
    }
    return event?.target instanceof Element
      ? event.target.closest?.("button, [role='button'], input[type='submit'], input[type='button'], a") ?? null
      : null;
  }

  async function sendProbe(probe) {
    try {
      await chrome.runtime.sendMessage({
        type: "OGRR_EVENT",
        source: SOURCE,
        event: "dom-probe",
        payload: probe,
      });
    } catch {
      // The service worker may be restarting. The next heartbeat retries.
    }
  }

  function buildPageProbe(trigger) {
    const atMs = Date.now();
    const bodyText = document.body?.innerText?.slice(0, 30000) ?? "";
    const controls = collectControls();
    const competitionStartPrompt = detectCompetitionStartPrompt(controls, bodyText);
    const guessControlVisible = controls.some((item) => GUESS_TEXT.test(item.label));
    const nextControlVisible = controls.some((item) => NEXT_TEXT.test(item.label));
    const resultVisible =
      nextControlVisible ||
      (RESULT_TEXT.test(bodyText) && !guessControlVisible);
    const roundMatch = bodyText.match(ROUND_TEXT);
    const roundNumber = finiteInteger(roundMatch?.[1]);
    const roundTotal = finiteInteger(roundMatch?.[2]);
    const viewCandidates = collectViewCandidates();
    const primaryView = viewCandidates[0] ?? null;
    const modeHint = NMPZ_TEXT.test(bodyText)
      ? "nmpz"
      : primaryView
        ? "streetview"
        : null;

    // Guess control visibility is the strongest generic signal that the player
    // is inside a live round. A Street View candidate is used as a fallback for
    // layouts where the submit control is rendered inside a canvas or shadow UI.
    const pathLooksLikeGame = /\/(play|game|competition|competitions|challenge)\b/i.test(
      location.pathname,
    );
    const roundLikelyActive =
      !resultVisible &&
      !competitionStartPrompt.visible &&
      (guessControlVisible ||
        (pathLooksLikeGame && Boolean(primaryView) && !nextControlVisible));

    return {
      trigger,
      at: new Date(atMs).toISOString(),
      atMs,
      pageUrl: safePageUrl(location.href),
      pathname: location.pathname,
      title: document.title,
      pageState: resultVisible
        ? "result"
        : roundLikelyActive
          ? "round"
          : competitionStartPrompt.visible
            ? "competition-ready"
            : pathLooksLikeGame
              ? "game-page"
              : "other",
      roundLikelyActive,
      competitionStartPromptVisible: competitionStartPrompt.visible,
      competitionStartLabel: competitionStartPrompt.label,
      competitionStartSignature: competitionStartPrompt.signature,
      guessControlVisible,
      nextControlVisible,
      resultVisible,
      roundNumber,
      roundTotal,
      modeHint,
      primaryView,
      viewCandidates: viewCandidates.slice(0, 5),
      controlLabels: controls.slice(0, 12).map((item) => item.label),
      diagnostics: {
        iframeCount: document.querySelectorAll("iframe").length,
        imageCount: document.images?.length ?? 0,
        streetViewCandidateCount: viewCandidates.length,
        nmpzTextDetected: modeHint === "nmpz",
      },
    };
  }


  function detectCompetitionStartPrompt(controls, bodyText) {
    const pathname = String(location.pathname ?? "");
    if (!/\/competitions?(?:\/|$)/i.test(pathname)) {
      return { visible: false, label: null, signature: null };
    }

    const startControl = controls.find((item) =>
      START_TEXT.test(item.label) && !/(tutorial|create)/i.test(item.label),
    );
    let dialogText = "";
    let dialogVisible = false;
    try {
      const dialogs = document.querySelectorAll(
        "dialog, [role='dialog'], [aria-modal='true'], [class*='modal'], [class*='dialog']",
      );
      for (const dialog of dialogs) {
        if (!isVisible(dialog)) continue;
        const text = String(dialog.innerText ?? dialog.textContent ?? "")
          .replace(/\s+/g, " ")
          .trim();
        if (!text) continue;
        if (
          /(competition|round|restriction|nmpz|moving|leaderboard|duration|ready)/i.test(text) &&
          START_TEXT.test(text)
        ) {
          dialogVisible = true;
          dialogText = text.slice(0, 500);
          break;
        }
      }
    } catch {
      // Some test/fallback DOMs do not implement complex selectors.
    }

    const bodyLooksReady =
      /(start competition|join competition|enter competition|competition rules|round length|restriction)/i.test(
        bodyText,
      );
    const visible = Boolean(startControl && (dialogVisible || bodyLooksReady));
    const label = visible ? startControl.label : null;
    return {
      visible,
      label,
      signature: visible ? hashText(`${pathname}|${label}|${dialogText}`) : null,
    };
  }

  function collectControls() {
    const elements = [
      ...document.querySelectorAll(
        "button, [role='button'], input[type='submit'], input[type='button'], a",
      ),
    ];
    const controls = [];
    for (const element of elements) {
      if (!isVisible(element)) continue;
      const label = getLabel(element);
      if (!label) continue;
      controls.push({ label: label.slice(0, 160) });
      if (controls.length >= 60) break;
    }
    return controls;
  }

  function collectViewCandidates() {
    const raw = [];
    const seen = new Set();

    for (const element of document.querySelectorAll(
      "iframe[src], img[src], source[src], video[poster]",
    )) {
      const value =
        element.getAttribute("src") ?? element.getAttribute("poster") ?? "";
      pushRaw(value, element.tagName.toLowerCase());
    }

    for (const element of document.querySelectorAll("[style*='background']")) {
      const value = element.style?.backgroundImage ?? "";
      for (const match of value.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
        pushRaw(match[1], "background-image");
      }
    }

    function pushRaw(value, source) {
      const text = String(value ?? "").trim();
      if (!text || !RELEVANT_URL.test(text)) return;
      const absolute = toAbsoluteUrl(text);
      const key = `${source}|${absolute}`;
      if (seen.has(key)) return;
      seen.add(key);
      raw.push({ source, url: absolute });
    }

    const parsed = raw
      .map(({ source, url }) => parseStreetViewReference(url, source))
      .filter(Boolean)
      .sort((a, b) => candidateScore(b) - candidateScore(a));
    return parsed;
  }

  function parseStreetViewReference(rawUrl, source) {
    const decoded = repeatedlyDecode(String(rawUrl ?? ""));
    const urls = [String(rawUrl ?? ""), decoded];
    let lat = null;
    let lng = null;
    let heading = null;
    let pitch = null;
    let fov = null;
    let panoId = null;

    for (const candidate of urls) {
      try {
        const url = new URL(candidate, location.href);
        const pair =
          parsePair(url.searchParams.get("location")) ??
          parsePair(url.searchParams.get("viewpoint")) ??
          parsePair(url.searchParams.get("cbll")) ??
          parsePair(url.searchParams.get("center")) ??
          parseLatLngParams(url.searchParams);
        if (pair) ({ lat, lng } = pair);
        heading ??= finiteOrNull(
          url.searchParams.get("heading") ?? url.searchParams.get("yaw"),
        );
        pitch ??= finiteOrNull(url.searchParams.get("pitch"));
        fov ??= finiteOrNull(url.searchParams.get("fov"));
        panoId ??=
          url.searchParams.get("pano") ??
          url.searchParams.get("panoid") ??
          url.searchParams.get("panoId") ??
          null;
      } catch {
        // The decoded text can contain a nested URL fragment rather than a URL.
      }

      const atMatch = candidate.match(
        /@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)(?:,[^/?#]*)?/,
      );
      if (atMatch && isCoordinate(atMatch[1], atMatch[2])) {
        lat ??= Number(atMatch[1]);
        lng ??= Number(atMatch[2]);
        const camera = candidate.slice(atMatch.index ?? 0).match(
          /@[^,]+,[^,]+,[^,]*?(?:,(\d+(?:\.\d+)?)y)?(?:,(-?\d+(?:\.\d+)?)h)?(?:,(-?\d+(?:\.\d+)?)t)?/,
        );
        fov ??= finiteOrNull(camera?.[1]);
        heading ??= finiteOrNull(camera?.[2]);
        const tilt = finiteOrNull(camera?.[3]);
        if (pitch === null && tilt !== null) pitch = 90 - tilt;
      }

      const legacy = candidate.match(
        /!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/,
      );
      if (legacy && isCoordinate(legacy[1], legacy[2])) {
        lat ??= Number(legacy[1]);
        lng ??= Number(legacy[2]);
      }

      const panoMatch = candidate.match(/!1s([A-Za-z0-9_-]{8,})/);
      panoId ??= panoMatch?.[1] ?? null;
    }

    if (!isCoordinate(lat, lng) && !panoId) return null;
    return {
      source,
      lat: isCoordinate(lat, lng) ? Number(lat) : null,
      lng: isCoordinate(lat, lng) ? Number(lng) : null,
      heading: finiteOrNull(heading),
      pitch: finiteOrNull(pitch),
      fov: finiteOrNull(fov),
      zoom: null,
      panoId: panoId ? String(panoId) : null,
      urlFingerprint: hashText(decoded),
      url: safeCandidateUrl(rawUrl),
    };
  }

  function candidateScore(candidate) {
    let score = 0;
    if (isCoordinate(candidate.lat, candidate.lng)) score += 10;
    if (candidate.panoId) score += 5;
    if (candidate.source === "iframe") score += 4;
    if (Number.isFinite(candidate.heading)) score += 2;
    if (Number.isFinite(candidate.pitch)) score += 1;
    return score;
  }

  function parsePair(value) {
    if (!value) return null;
    const match = String(value).match(
      /(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/,
    );
    if (!match || !isCoordinate(match[1], match[2])) return null;
    return { lat: Number(match[1]), lng: Number(match[2]) };
  }

  function parseLatLngParams(params) {
    const lat =
      params.get("lat") ?? params.get("latitude") ?? params.get("y");
    const lng =
      params.get("lng") ??
      params.get("lon") ??
      params.get("longitude") ??
      params.get("x");
    return isCoordinate(lat, lng) ? { lat: Number(lat), lng: Number(lng) } : null;
  }

  function repeatedlyDecode(value) {
    let result = value;
    for (let index = 0; index < 3; index += 1) {
      try {
        const next = decodeURIComponent(result);
        if (next === result) break;
        result = next;
      } catch {
        break;
      }
    }
    return result;
  }

  function toAbsoluteUrl(value) {
    try {
      return new URL(value, location.href).href;
    } catch {
      return value;
    }
  }

  function safeCandidateUrl(value) {
    const text = String(value ?? "");
    try {
      const url = new URL(text, location.href);
      for (const key of ["key", "token", "access_token", "signature", "client", "authuser"]) {
        if (url.searchParams.has(key)) url.searchParams.set(key, "[redacted]");
      }
      return url.toString().slice(0, 1200);
    } catch {
      return text
        .replace(/([?&](?:key|token|access_token|signature|client|authuser)=)[^&#]+/gi, "$1[redacted]")
        .slice(0, 1200);
    }
  }

  function safePageUrl(value) {
    try {
      const url = new URL(value);
      url.hash = "";
      return url.toString().slice(0, 1200);
    } catch {
      return String(value ?? "").slice(0, 1200);
    }
  }

  function getLabel(element) {
    return String(
      element.getAttribute?.("aria-label") ??
        element.getAttribute?.("title") ??
        (element instanceof HTMLInputElement ? element.value : element.textContent) ??
        "",
    )
      .replace(/\s+/g, " ")
      .trim();
  }

  function isVisible(element) {
    if (!(element instanceof Element)) return false;
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function isCoordinate(lat, lng) {
    if (lat === null || lat === "" || lat === undefined) return false;
    if (lng === null || lng === "" || lng === undefined) return false;
    return (
      Number.isFinite(Number(lat)) &&
      Number(lat) >= -90 &&
      Number(lat) <= 90 &&
      Number.isFinite(Number(lng)) &&
      Number(lng) >= -180 &&
      Number(lng) <= 180
    );
  }

  function finiteOrNull(value) {
    const number = Number(value);
    return value !== null && value !== "" && Number.isFinite(number)
      ? number
      : null;
  }

  function finiteInteger(value) {
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : null;
  }


  function beginStaticCapture() {
    if (!staticCaptureInProgress) {
      staticCaptureInProgress = true;

      if (overlayRoot?.isConnected) {
        overlayVisibilityBeforeCapture = overlayRoot.style.visibility || "";
        overlayRoot.style.setProperty("visibility", "hidden", "important");
      } else {
        overlayVisibilityBeforeCapture = null;
      }

      staticCaptureGuard = document.createElement("div");
      staticCaptureGuard.id = "__ogrrStaticCaptureGuard";
      Object.assign(staticCaptureGuard.style, {
        position: "fixed",
        inset: "0",
        zIndex: "2147483646",
        background: "rgba(0,0,0,0)",
        pointerEvents: "auto",
        cursor: "progress",
        userSelect: "none",
      });

      staticCaptureBadge = document.createElement("div");
      staticCaptureBadge.id = "__ogrrStaticCaptureBadge";
      staticCaptureBadge.setAttribute("role", "status");
      staticCaptureBadge.setAttribute("aria-live", "polite");
      staticCaptureBadge.textContent = "Preparing canonical NMPZ image…";
      Object.assign(staticCaptureBadge.style, {
        position: "fixed",
        top: "18px",
        left: "50%",
        transform: "translateX(-50%)",
        padding: "9px 14px",
        borderRadius: "10px",
        background: "rgba(15,23,42,0.88)",
        color: "#fff",
        font: "600 13px/1.3 system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        boxShadow: "0 4px 18px rgba(0,0,0,0.28)",
        pointerEvents: "none",
        whiteSpace: "nowrap",
      });
      staticCaptureGuard.appendChild(staticCaptureBadge);
      (document.body ?? document.documentElement).appendChild(staticCaptureGuard);
    }

    setStaticCaptureBadge(true, "Preparing canonical NMPZ image…");
    return {
      ok: true,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
      },
    };
  }

  function prepareStaticCapture() {
    beginStaticCapture();
    const target = findStaticCaptureTarget();
    if (!target) {
      setStaticCaptureBadge(true, "Waiting for Street View to render…");
      return {
        ok: false,
        error: "No visible Street View/NMPZ image element could be identified.",
      };
    }

    const rect = target.element.getBoundingClientRect();
    const left = Math.max(0, rect.left);
    const top = Math.max(0, rect.top);
    const right = Math.min(window.innerWidth, rect.right);
    const bottom = Math.min(window.innerHeight, rect.bottom);
    const clippedWidth = Math.max(0, right - left);
    const clippedHeight = Math.max(0, bottom - top);

    if (clippedWidth < 200 || clippedHeight < 150) {
      setStaticCaptureBadge(true, "Waiting for Street View size…");
      return {
        ok: false,
        error: "Detected Street View element is too small for a benchmark image.",
      };
    }

    // Hide only the visible status badge for the screenshot. The transparent
    // full-page guard remains in place, so the player still cannot click the
    // guess map while Chrome captures the canonical frame.
    setStaticCaptureBadge(false);

    return {
      ok: true,
      rect: {
        x: left,
        y: top,
        width: clippedWidth,
        height: clippedHeight,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
      },
      target: {
        source: target.source,
        tagName: target.element.tagName.toLowerCase(),
        urlFingerprint: target.urlFingerprint ?? null,
      },
    };
  }

  function setStaticCaptureBadge(visible, text = null) {
    if (!staticCaptureBadge?.isConnected) return;
    if (text) staticCaptureBadge.textContent = String(text);
    staticCaptureBadge.style.setProperty(
      "visibility",
      visible ? "visible" : "hidden",
      "important",
    );
  }

  function restoreStaticCapture() {
    staticCaptureInProgress = false;

    staticCaptureGuard?.remove();
    staticCaptureGuard = null;
    staticCaptureBadge = null;

    if (overlayRoot?.isConnected) {
      if (overlayVisibilityBeforeCapture) {
        overlayRoot.style.setProperty(
          "visibility",
          overlayVisibilityBeforeCapture,
        );
      } else {
        overlayRoot.style.removeProperty("visibility");
      }
    }
    overlayVisibilityBeforeCapture = null;
  }

  function getInteractiveVideoRect() {
    const probe = buildPageProbe("interactive-video-rect");
    if (probe.resultVisible || probe.pageState === "result") {
      return { ok: false, captureClosed: true, error: "Result screen is visible." };
    }
    const target = findStaticCaptureTarget();
    if (!target) {
      return { ok: false, error: "No visible Street View panorama element could be identified." };
    }
    if (isCaptureTargetOccluded(target.element)) {
      return { ok: false, captureClosed: false, error: "Street View is covered by another large OpenGuessr surface." };
    }
    const rect = target.element.getBoundingClientRect();
    const left = Math.max(0, rect.left);
    const top = Math.max(0, rect.top);
    const right = Math.min(window.innerWidth, rect.right);
    const bottom = Math.min(window.innerHeight, rect.bottom);
    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);
    if (width < 200 || height < 150) {
      return { ok: false, error: "Detected Street View panorama is too small." };
    }
    return {
      ok: true,
      rect: { x: left, y: top, width, height },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
      },
      target: {
        source: target.source,
        tagName: target.element.tagName.toLowerCase(),
        urlFingerprint: target.urlFingerprint ?? null,
      },
    };
  }

  function prepareInteractiveCapture() {
    const probe = buildPageProbe("interactive-capture");
    if (probe.resultVisible || probe.pageState === "result") {
      return {
        ok: false,
        captureClosed: true,
        error: "Round result is visible; Street View exploration capture is closed.",
      };
    }

    const target = findStaticCaptureTarget();
    if (!target) {
      return {
        ok: false,
        error: "No visible Street View panorama element could be identified.",
      };
    }

    if (isCaptureTargetOccluded(target.element)) {
      return {
        ok: false,
        captureClosed: false,
        error: "Street View is currently covered by another large OpenGuessr surface (for example the guess map).",
      };
    }

    const rect = target.element.getBoundingClientRect();
    const left = Math.max(0, rect.left);
    const top = Math.max(0, rect.top);
    const right = Math.min(window.innerWidth, rect.right);
    const bottom = Math.min(window.innerHeight, rect.bottom);
    const clippedWidth = Math.max(0, right - left);
    const clippedHeight = Math.max(0, bottom - top);

    if (clippedWidth < 200 || clippedHeight < 150) {
      return {
        ok: false,
        error: "Detected Street View panorama is too small for an exploration frame.",
      };
    }

    // Interactive capture must never block exploration. Hide only the recorder
    // overlay for the brief screenshot paint; the Street View and OpenGuessr
    // controls remain interactive and are restored immediately afterwards.
    if (overlayRoot?.isConnected) {
      interactiveCaptureOverlayVisibility = overlayRoot.style.visibility || "";
      overlayRoot.style.setProperty("visibility", "hidden", "important");
    } else {
      interactiveCaptureOverlayVisibility = null;
    }

    return {
      ok: true,
      rect: {
        x: left,
        y: top,
        width: clippedWidth,
        height: clippedHeight,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
      },
      target: {
        source: target.source,
        tagName: target.element.tagName.toLowerCase(),
        urlFingerprint: target.urlFingerprint ?? null,
      },
    };
  }

  function isCaptureTargetOccluded(target) {
    if (!(target instanceof Element)) return true;
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return true;

    const points = [
      [0.5, 0.5],
      [0.28, 0.32],
      [0.72, 0.32],
      [0.28, 0.68],
      [0.72, 0.68],
    ];

    let tested = 0;
    let blocked = 0;

    for (const [fx, fy] of points) {
      const x = Math.max(1, Math.min(window.innerWidth - 2, rect.left + rect.width * fx));
      const y = Math.max(1, Math.min(window.innerHeight - 2, rect.top + rect.height * fy));
      const stack = document.elementsFromPoint(x, y);
      if (!stack.length) continue;
      tested += 1;

      const targetIndex = stack.findIndex(
        (element) =>
          element === target ||
          element.contains?.(target) ||
          target.contains?.(element),
      );
      if (targetIndex < 0) {
        blocked += 1;
        continue;
      }

      const blockingElement = stack.slice(0, targetIndex).find((element) => {
        if (!(element instanceof Element)) return false;
        if (element === overlayRoot || overlayRoot?.contains?.(element)) return false;
        if (element.id?.startsWith?.("__ogrr")) return false;
        const style = getComputedStyle(element);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          Number(style.opacity || 1) <= 0.02 ||
          style.pointerEvents === "none"
        ) {
          return false;
        }
        const blockerRect = element.getBoundingClientRect();
        const blockerArea = blockerRect.width * blockerRect.height;
        const targetArea = rect.width * rect.height;
        return (
          blockerArea >= targetArea * 0.18 ||
          (blockerRect.width >= rect.width * 0.65 &&
            blockerRect.height >= rect.height * 0.65)
        );
      });

      if (blockingElement) blocked += 1;
    }

    return tested >= 3 && blocked >= Math.ceil(tested / 2);
  }

  function restoreInteractiveCapture() {
    if (overlayRoot?.isConnected) {
      if (interactiveCaptureOverlayVisibility) {
        overlayRoot.style.setProperty(
          "visibility",
          interactiveCaptureOverlayVisibility,
        );
      } else {
        overlayRoot.style.removeProperty("visibility");
      }
    }
    interactiveCaptureOverlayVisibility = null;
  }


  function findStaticCaptureTarget() {
    const candidates = [];

    for (const element of document.querySelectorAll(
      "iframe[src], img[src], video[poster]",
    )) {
      const value =
        element.getAttribute("src") ?? element.getAttribute("poster") ?? "";
      addCandidate(element, element.tagName.toLowerCase(), value);
    }

    for (const element of document.querySelectorAll("[style*='background']")) {
      const background = element.style?.backgroundImage ?? "";
      for (const match of background.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
        addCandidate(element, "background-image", match[1]);
      }
    }

    function addCandidate(element, source, rawUrl) {
      if (!isVisible(element)) return;
      const decoded = repeatedlyDecode(String(rawUrl ?? ""));
      if (!RELEVANT_URL.test(decoded)) return;
      const rect = element.getBoundingClientRect();
      const clippedWidth = Math.max(
        0,
        Math.min(window.innerWidth, rect.right) - Math.max(0, rect.left),
      );
      const clippedHeight = Math.max(
        0,
        Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top),
      );
      const area = clippedWidth * clippedHeight;
      if (area < 300 * 180) return;
      candidates.push({
        element,
        source,
        area,
        urlFingerprint: hashText(decoded),
        score:
          area *
          (source === "iframe" ? 1.15 : source === "img" ? 1.1 : 1),
      });
    }

    candidates.sort((a, b) => b.score - a.score);
    if (candidates.length) return candidates[0];

    // Conservative fallback for OpenGuessr layouts whose iframe URL is hidden
    // behind an opaque wrapper: accept only a very large visible iframe/image.
    const fallbacks = [...document.querySelectorAll("iframe, img")]
      .filter((element) => isVisible(element))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const width = Math.max(
          0,
          Math.min(window.innerWidth, rect.right) - Math.max(0, rect.left),
        );
        const height = Math.max(
          0,
          Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top),
        );
        return { element, source: element.tagName.toLowerCase(), area: width * height };
      })
      .filter((item) => item.area >= window.innerWidth * window.innerHeight * 0.35)
      .sort((a, b) => b.area - a.area);

    return fallbacks[0] ?? null;
  }


  async function refreshRecorderOverlay(probe) {
    if (typeof document.createElement !== "function" || !document.documentElement) return;
    if (staticCaptureInProgress) {
      if (overlayRoot?.isConnected) {
        overlayRoot.style.setProperty("visibility", "hidden", "important");
      }
      return;
    }
    try {
      const includeCollector =
        probe.competitionStartPromptVisible && !overlayCollectorLoaded;
      const response = await chrome.runtime.sendMessage({
        type: "OGRR_GET_PAGE_UI_STATE",
        includeCollector,
      });
      if (!response?.ok) return;
      if (includeCollector) {
        overlayCollectorLoaded = true;
        overlaySetup = {
          settings: response.settings ?? {},
          competitions: response.collector?.competitions ?? [],
        };
      } else if (!overlaySetup) {
        overlaySetup = { settings: response.settings ?? {}, competitions: [] };
      } else if (response.settings) {
        overlaySetup.settings = response.settings;
      }
      renderRecorderOverlay(probe, response.status, response.settings ?? {});
    } catch {
      // The service worker may be restarting. The next UI heartbeat retries.
    }
  }

  function renderRecorderOverlay(probe, status, settings) {
    if (settings.enabled === false) {
      removeRecorderOverlay();
      return;
    }

    const lastCompleted = status?.lastCompletedRound ?? null;
    const showCompletion =
      Boolean(lastCompleted?.recordingId) &&
      lastCompleted.recordingId !== acknowledgedRecordingId &&
      (probe.resultVisible || probe.pageState === "result" || status?.recordingState === "complete");

    if (status?.recordingState === "complete") {
      showOverlayCard({
        tone: "success",
        title: "Competition recorded",
        body: `${status.session?.completedRoundCount ?? 0}/${status.session?.expectedRoundCount ?? status.session?.completedRoundCount ?? 0} rounds saved.`,
        actions: [
          { id: "done-disarm", label: "Done & disarm", primary: true },
        ],
      });
      return;
    }

    if (status?.currentRound) {
      const roundNumber =
        status.currentRound.pageRoundNumber ?? status.currentRound.index + 1;
      const expected = status.session?.expectedRoundCount;
      const roundLabel = Number.isInteger(expected)
        ? `Round ${roundNumber}/${expected}`
        : `Round ${roundNumber}`;
      const roundVideoError = status.currentRound.captureMode === "interactive"
        ? status.currentRound.video?.error ?? null
        : null;
      showOverlayCard({
        tone: roundVideoError ? "warning" : status.currentRound.frozen ? "saving" : "recording",
        title: roundVideoError
          ? `VIDEO ERROR · ${roundLabel}`
          : status.currentRound.frozen
            ? `SAVING · ${roundLabel}`
            : `REC · ${roundLabel}`,
        body: roundVideoError
          ? `${roundVideoError} Telemetry continues and the next round will still attempt video recording.`
          : status.currentRound.frozen
            ? "Prediction detected. Saving this location."
            : status.currentRound.captureMode === "nmpz"
              ? "Static/NMPZ location is being recorded."
              : status.currentRound.video?.status === "starting"
                ? "Starting this location video and recording telemetry."
                : "Interactive location video and telemetry are being recorded.",
        meta: progressText(status),
        actions: [
          { id: "stop", label: "Stop recording" },
        ],
      });
      return;
    }

    if (showCompletion) {
      const roundNumber =
        lastCompleted.competitionOverallIndex ?? lastCompleted.competitionRound ?? lastCompleted.roundIndex + 1;
      const roundSaved = lastCompleted.saveSuccess && lastCompleted.videoSaveSuccess !== false;
      showOverlayCard({
        tone: roundSaved ? "success" : "warning",
        title: roundSaved
          ? `SAVED · Round ${roundNumber}`
          : `SAVE ERROR · Round ${roundNumber}`,
        body: !lastCompleted.saveSuccess
          ? "The round JSON could not be saved. Do not rely on this round as complete."
          : lastCompleted.videoSaveSuccess === false
            ? `The prediction JSON was saved, but the round video failed${lastCompleted.videoError ? `: ${lastCompleted.videoError}` : "."} The next round will still attempt recording.`
            : lastCompleted.predictionCaptured
              ? "Location saved. Continue in OpenGuessr when ready."
              : "Location saved without a prediction coordinate.",
        meta: progressText(status),
        actions: [
          { id: "stop", label: "Stop recording" },
        ],
      });
      return;
    }

    if (
      !status?.recordingArmed &&
      status?.videoCapture?.status === "authorization-required"
    ) {
      showOverlayCard({
        tone: status.videoCapture?.error ? "warning" : "armed",
        title: status.videoCapture?.error ? "VIDEO AUTHORIZATION FAILED" : "AUTHORIZE VIDEO",
        body: status.videoCapture?.error
          ? `${status.videoCapture.error} Click the recorder extension icon once to retry.`
          : "Interactive setup is saved. Click the recorder extension icon once. Chrome will authorize the tab video and the recorder will arm automatically; there is nothing else to configure.",
        meta: `${progressText(status)} · ${setupText(status.armContext ?? overlaySetup?.settings ?? settings)}`,
        actions: [
          { id: "stop", label: "Stop recording" },
        ],
      });
      return;
    }

    if (status?.recordingArmed) {
      showOverlayCard({
        tone: "armed",
        title: "ARMED",
        body: status.competitionStartConfirmed
          ? "Start detected. Waiting for the first location."
          : "Ready. Press Start in OpenGuessr; no recorder confirmation is required.",
        meta: `${progressText(status)} · ${setupText(status.armContext ?? overlaySetup?.settings ?? settings)}`,
        actions: [
          { id: "stop", label: "Stop recording" },
        ],
      });
      return;
    }

    if (
      probe.competitionStartPromptVisible &&
      Date.now() >= promptDismissedUntil
    ) {
      showStartPrompt(settings);
      return;
    }

    removeRecorderOverlay();
  }

  function showStartPrompt(settings) {
    ensureOverlay();
    // Keep the setup form DOM stable while the user is typing/selecting.
    // The 1.25 s page heartbeat must not recreate the inputs and erase draft values.
    if (overlayViewKey === "prompt") return;
    const configured = overlaySetup?.settings ?? settings;
    const competitions = overlaySetup?.competitions ?? [];
    const options = competitions.length
      ? competitions
          .map((item) => {
            const id = escapeHtml(String(item.id ?? ""));
            const label = escapeHtml(String(item.name ?? item.id ?? ""));
            const selected = item.id === configured.competitionId ? " selected" : "";
            return `<option value="${id}"${selected}>${label}</option>`;
          })
          .join("")
      : `<option value="${escapeHtml(configured.competitionId ?? "europe-easy")}" selected>${escapeHtml(configured.competitionId ?? "europe-easy")}</option>`;

    overlayViewKey = "prompt";
    overlayShadow.innerHTML = `${overlayStyles()}
      <section class="ogrr-card prompt" role="dialog" aria-label="OpenGuessr recorder setup">
        <div class="ogrr-kicker">Research recorder</div>
        <h2>Record this competition?</h2>
        <p>The recorder will wait for the actual first round, capture every round automatically, and stop after the competition is complete.</p>
        <label>Competition<select id="ogrr-competition">${options}</select></label>
        <label>Model<input id="ogrr-model" value="${escapeHtml(configured.model ?? "manual")}" /></label>
        <label>Condition<select id="ogrr-condition">
          <option value="interactive-panorama"${configured.condition === "interactive-panorama" ? " selected" : ""}>Interactive panorama</option>
          <option value="static-image"${configured.condition === "static-image" ? " selected" : ""}>Static image / NMPZ</option>
        </select></label>
        <div class="ogrr-actions">
          <button data-action="arm" class="primary">Arm / start recorder</button>
          <button data-action="dismiss">Not now</button>
        </div>
        <small>No recording starts until you press the green button.</small>
        ${interactiveArmError ? `<div class="error">${escapeHtml(interactiveArmError)}</div>` : ""}
      </section>`;
    bindOverlayActions();
  }

  function showOverlayCard({ tone, title, body, meta = "", actions = [] }) {
    ensureOverlay();
    const viewKey = JSON.stringify({ tone, title, body, meta, actions });
    // Preserve button disabled/text state across heartbeats. A real recorder-state
    // change produces a different key and replaces the card as expected.
    if (overlayViewKey === viewKey) return;
    overlayViewKey = viewKey;
    overlayShadow.innerHTML = `${overlayStyles()}
      <section class="ogrr-card status compact-status ${escapeHtml(tone)}">
        <div class="ogrr-status-line"><span class="dot"></span><strong>${escapeHtml(title)}</strong></div>
        <p>${escapeHtml(body)}</p>
        ${meta ? `<div class="meta">${escapeHtml(meta)}</div>` : ""}
        <div class="ogrr-actions compact">
          ${actions.map((action) => `<button data-action="${escapeHtml(action.id)}" class="${action.primary ? "primary" : ""}">${escapeHtml(action.label)}</button>`).join("")}
        </div>
      </section>`;
    bindOverlayActions();
  }

  function bindOverlayActions() {
    overlayShadow.querySelectorAll("button[data-action]").forEach((button) => {
      button.addEventListener("click", async () => {
        const action = button.getAttribute("data-action");
        if (action === "dismiss") {
          promptDismissedUntil = Date.now() + 10 * 60 * 1000;
          removeRecorderOverlay();
          return;
        }
        if (action === "done-disarm") {
          button.disabled = true;
          button.textContent = "Disarming…";
          const response = await chrome.runtime.sendMessage({ type: "OGRR_DONE_DISARM_TAB" }).catch(
            (error) => ({ ok: false, error: String(error) }),
          );
          if (response?.ok) {
            acknowledgedRecordingId = null;
            removeRecorderOverlay();
          } else {
            button.disabled = false;
            button.textContent = "Done & disarm";
          }
          return;
        }
        if (action === "stop") {
          button.disabled = true;
          button.textContent = "Stopping…";
          await chrome.runtime.sendMessage({ type: "OGRR_STOP_TAB" }).catch(() => {});
          return;
        }
        if (action === "arm") {
          const competitionId = overlayShadow.querySelector("#ogrr-competition")?.value;
          const model = overlayShadow.querySelector("#ogrr-model")?.value;
          const condition = overlayShadow.querySelector("#ogrr-condition")?.value;
          button.disabled = true;

          button.textContent = condition === "interactive-panorama" ? "Arming video…" : "Arming…";
          interactiveArmError = null;

          const response = await chrome.runtime.sendMessage({
            type: condition === "interactive-panorama"
              ? "OGRR_ARM_INTERACTIVE_TAB"
              : "OGRR_ARM_TAB",
            setup: { competitionId, model, condition },
          }).catch((error) => ({ ok: false, error: String(error) }));

          if (condition === "interactive-panorama" && response?.pending) {
            interactiveArmPending = true;
            button.textContent = "Click extension icon once";
            overlayViewKey = null;
            const probe = buildPageProbe("interactive-authorization-required");
            void refreshRecorderOverlay(probe);
            return;
          }
          if (!response?.ok) {
            interactiveArmPending = false;
            interactiveArmError = response?.error ?? "Recorder could not be armed.";
            button.disabled = false;
            button.textContent = "Arm / start recorder";
            const card = overlayShadow.querySelector(".ogrr-card");
            card?.insertAdjacentHTML(
              "beforeend",
              `<div class="error">${escapeHtml(interactiveArmError)}</div>`,
            );
          }
        }
      });
    });
  }

  function progressText(status) {
    const completed = status?.session?.completedRoundCount ?? 0;
    const expected = status?.session?.expectedRoundCount;
    return Number.isInteger(expected)
      ? `${completed}/${expected} rounds saved`
      : `${completed} round${completed === 1 ? "" : "s"} saved`;
  }

  function setupText(value) {
    const competition = value?.competitionId ?? "unassigned";
    const model = value?.model ?? "Unknown model";
    const condition = value?.condition === "static-image" ? "NMPZ / static" : "interactive";
    return `${competition} · ${model} · ${condition}`;
  }

  function ensureOverlay() {
    if (overlayRoot?.isConnected && overlayShadow) return;
    overlayRoot = document.createElement("div");
    overlayRoot.id = "ogrr-in-page-recorder";
    overlayRoot.style.position = "fixed";
    overlayRoot.style.top = "18px";
    overlayRoot.style.right = "18px";
    overlayRoot.style.zIndex = "2147483647";
    overlayRoot.style.pointerEvents = "auto";
    overlayShadow = overlayRoot.attachShadow({ mode: "open" });
    (document.body ?? document.documentElement).appendChild(overlayRoot);
  }

  function removeRecorderOverlay() {
    overlayRoot?.remove?.();
    overlayRoot = null;
    overlayShadow = null;
    overlayViewKey = null;
  }

  function overlayStyles() {
    return `<style>
      :host{all:initial}.ogrr-card{box-sizing:border-box;width:340px;padding:16px;border:1px solid #30363d;border-radius:14px;background:#0d1117;color:#e6edf3;box-shadow:0 18px 48px rgba(0,0,0,.48);font:13px/1.45 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.ogrr-kicker{color:#8b949e;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.ogrr-card h2{margin:4px 0 7px;font-size:19px}.ogrr-card p{margin:0 0 12px;color:#b1bac4}.ogrr-card label{display:grid;gap:5px;margin-top:9px;color:#8b949e;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}.ogrr-card input,.ogrr-card select,.ogrr-card button{box-sizing:border-box;border:1px solid #30363d;border-radius:8px;background:#161b22;color:#e6edf3;font:inherit}.ogrr-card input,.ogrr-card select{width:100%;min-height:36px;padding:7px 9px}.ogrr-actions{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:14px}.ogrr-actions.compact{margin-top:11px}.ogrr-card button{min-height:34px;padding:7px 11px;cursor:pointer;font-weight:700}.ogrr-card button.primary{background:#238636;border-color:#2ea043;color:#fff}.ogrr-card button:disabled{opacity:.6;cursor:wait}.ogrr-card small,.meta{display:block;margin-top:9px;color:#8b949e;font-size:10px}.ogrr-card.compact-status{width:270px;padding:11px 12px}.ogrr-card.compact-status p{margin-top:5px;margin-bottom:0}.ogrr-card.compact-status .ogrr-actions{margin-top:8px}.ogrr-status-line{display:flex;align-items:center;gap:8px}.dot{width:9px;height:9px;border-radius:50%;background:#58a6ff;box-shadow:0 0 0 3px rgba(88,166,255,.14)}.recording .dot{background:#f85149;box-shadow:0 0 0 3px rgba(248,81,73,.16)}.saving .dot{background:#d29922}.success .dot{background:#3fb950}.warning .dot{background:#d29922}.armed .dot{background:#58a6ff}.status p{margin:7px 0 0}.error{margin-top:10px;padding:8px;border-radius:8px;background:#3b1518;color:#ffb4ae;font-size:11px}
    </style>`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function hashText(value) {
    let hash = 2166136261;
    const text = String(value ?? "");
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }
})();
