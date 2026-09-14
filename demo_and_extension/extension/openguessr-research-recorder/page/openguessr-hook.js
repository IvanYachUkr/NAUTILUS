(() => {
  if (window.__OGRR_PAGE_HOOK_INSTALLED__) return;
  window.__OGRR_PAGE_HOOK_INSTALLED__ = true;

  const CHANNEL = "openguessr-research-recorder";
  const SOURCE = "openguessr-page";
  const GUESS_TEXT = /(^|\b)(guess|make guess|submit guess|lock in|submit)(\b|$)/i;
  const NEXT_TEXT = /(next round|continue|view result|show result|finish)/i;
  const START_TEXT = /\b(start|play|join|enter|begin|participate)\b/i;
  const RESULT_TEXT = /(distance|your guess|next round|round result|you were)/i;
  let lastGuessIntentAt = 0;
  let lastResultSignalAt = 0;
  let lastUrl = location.href;
  let latestMapPrediction = null;
  let leafletHookInstalled = false;
  const trackedGuessMaps = [];
  let verifiedAgentPin = null;
  let mcpPlacementInProgress = false;

  Object.defineProperty(window, "__NAUTILUS_OPENGUESSR_MCP__", {
    value: Object.freeze({ command: handleMcpCommand }),
    configurable: false,
    enumerable: false,
    writable: false,
  });

  emit("page-context", pageContext());

  window.addEventListener(
    "click",
    (event) => {
      const target = findActionElement(event);
      if (!target) return;
      const label = getLabel(target);
      if (!label) return;

      if (START_TEXT.test(label) && !/(tutorial|create)/i.test(label)) {
        emit("competition-start-intent", {
          label: limit(label, 120),
          at: new Date().toISOString(),
        });
      }

      if (GUESS_TEXT.test(label)) {
        lastGuessIntentAt = Date.now();
        emit("prediction-intent", {
          label: limit(label, 120),
          at: new Date().toISOString(),
        });
        emitLatestMapPrediction("guess-control");
      } else if (NEXT_TEXT.test(label)) {
        emit("round-advance-intent", {
          label: limit(label, 120),
          at: new Date().toISOString(),
        });
      }
    },
    true,
  );

  installFetchHook();
  installXhrHook();
  installWebSocketHook();
  installBeaconHook();
  installHistoryHook();
  installResultObserver();
  installLeafletPredictionHook();
  const leafletHookTimer = setInterval(() => {
    if (installLeafletPredictionHook()) clearInterval(leafletHookTimer);
  }, 250);

  function installLeafletPredictionHook() {
    if (leafletHookInstalled) return true;
    const L = window.L;
    const mapPrototype = L?.Map?.prototype;
    if (!mapPrototype || typeof mapPrototype.fire !== "function") return false;
    if (mapPrototype.fire.__ogrrPredictionWrapped) {
      leafletHookInstalled = true;
      return true;
    }

    const originalFire = mapPrototype.fire;
    function wrappedFire(type, data) {
      try {
        trackGuessMap(this);
        if (type === "click") {
          const point = normalizeLatLng(data?.latlng);
          if (point && isLikelyGuessMap(this)) {
            if (!mcpPlacementInProgress) verifiedAgentPin = null;
            latestMapPrediction = {
              ...point,
              capturedAt: new Date().toISOString(),
              capturedAtMs: Date.now(),
              source: "leaflet-map-click",
              mapHint: describeMap(this),
            };
          }
        }
      } catch {
        // Instrumentation must never interfere with Leaflet.
      }
      return originalFire.apply(this, arguments);
    }

    Object.defineProperty(wrappedFire, "__ogrrPredictionWrapped", { value: true });
    mapPrototype.fire = wrappedFire;
    leafletHookInstalled = true;
    emit("diagnostic", {
      name: "leaflet_prediction_hook_installed",
      at: new Date().toISOString(),
    });
    return true;
  }

  async function handleMcpCommand(request) {
    const action = request?.action;
    if (action === "place-guess") return placeMcpGuess(request);
    if (action === "get-state") return getMcpState();
    if (action === "submit-guess") return submitMcpGuess();
    if (action === "continue") return continueMcpRound();
    return { ok: false, error: `Unsupported OpenGuessr action: ${String(action)}` };
  }

  async function placeMcpGuess(request) {
    const latitude = finite(request?.latitude);
    const longitude = finite(request?.longitude);
    if (!isCoordinate(latitude, longitude)) {
      return { ok: false, error: "Latitude or longitude is outside the valid coordinate range." };
    }

    const map = currentGuessMap();
    if (!map) {
      return {
        ok: false,
        error: "Open the OpenGuessr guess map first, then retry coordinate placement.",
      };
    }

    verifiedAgentPin = null;
    mcpPlacementInProgress = true;
    try {
      const latlng = window.L?.latLng?.(latitude, longitude) ?? {
        lat: latitude,
        lng: longitude,
      };
      map.fire("click", { latlng, source: "nautilus-openguessr-mcp" });
    } catch (error) {
      return {
        ok: false,
        error: `OpenGuessr rejected coordinate placement: ${limit(error?.message ?? error, 240)}`,
      };
    } finally {
      mcpPlacementInProgress = false;
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (mapHasPin(map, latitude, longitude)) {
        verifiedAgentPin = { latitude, longitude, map };
        return {
          ok: true,
          action: "place-guess",
          verified: true,
          pin: { latitude, longitude },
        };
      }
      await delay(40);
    }

    latestMapPrediction = null;
    return {
      ok: false,
      error: "OpenGuessr did not render a marker at the requested coordinates.",
    };
  }

  function getMcpState() {
    const guessControl = findVisibleControl(GUESS_TEXT);
    const continueControl = findVisibleControl(NEXT_TEXT);
    const bodyText = document.body?.innerText?.slice(0, 15000) ?? "";
    return {
      ok: true,
      action: "get-state",
      path: location.pathname,
      controls: {
        guess: Boolean(guessControl),
        continue: Boolean(continueControl),
      },
      resultVisible: Boolean(continueControl || RESULT_TEXT.test(bodyText)),
      verifiedPin: verifiedAgentPin
        ? {
            latitude: verifiedAgentPin.latitude,
            longitude: verifiedAgentPin.longitude,
          }
        : null,
    };
  }

  async function submitMcpGuess() {
    const pin = verifiedAgentPin;
    if (!pin || !mapHasPin(pin.map, pin.latitude, pin.longitude)) {
      verifiedAgentPin = null;
      return {
        ok: false,
        error: "A verified pin from openguessr_place_guess is required before submission.",
      };
    }

    const control = findVisibleControl(GUESS_TEXT);
    if (!control) {
      return { ok: false, error: "The visible OpenGuessr Guess control was not found." };
    }

    const submittedPin = { latitude: pin.latitude, longitude: pin.longitude };
    control.click();
    verifiedAgentPin = null;
    await delay(0);
    return {
      ok: true,
      action: "submit-guess",
      submitted: true,
      pin: submittedPin,
    };
  }

  async function continueMcpRound() {
    const control = findVisibleControl(NEXT_TEXT);
    if (!control) {
      return { ok: false, error: "The visible OpenGuessr Continue control was not found." };
    }
    control.click();
    verifiedAgentPin = null;
    latestMapPrediction = null;
    await delay(0);
    return { ok: true, action: "continue", continued: true };
  }

  function trackGuessMap(map) {
    if (!isLikelyGuessMap(map)) return;
    const previousIndex = trackedGuessMaps.indexOf(map);
    if (previousIndex >= 0) trackedGuessMaps.splice(previousIndex, 1);
    trackedGuessMaps.push(map);
    if (trackedGuessMaps.length > 8) trackedGuessMaps.shift();
  }

  function currentGuessMap() {
    for (let index = trackedGuessMaps.length - 1; index >= 0; index -= 1) {
      const map = trackedGuessMaps[index];
      if (isLikelyGuessMap(map)) return map;
    }
    return null;
  }

  function mapHasPin(map, latitude, longitude) {
    if (!map || typeof map.eachLayer !== "function") return false;
    let found = false;
    try {
      map.eachLayer((layer) => {
        if (found || typeof layer?.getLatLng !== "function") return;
        const point = normalizeLatLng(layer.getLatLng());
        if (
          point &&
          Math.abs(point.lat - latitude) <= 1e-6 &&
          wrappedLongitudeDistance(point.lng, longitude) <= 1e-6
        ) {
          found = true;
        }
      });
    } catch {
      return false;
    }
    return found;
  }

  function wrappedLongitudeDistance(left, right) {
    const raw = Math.abs(left - right) % 360;
    return Math.min(raw, 360 - raw);
  }

  function findVisibleControl(pattern) {
    const controls = document.querySelectorAll(
      "button, [role='button'], input[type='submit'], input[type='button'], a",
    );
    for (const control of controls) {
      if (!pattern.test(getLabel(control))) continue;
      if (control.disabled || control.getAttribute?.("aria-disabled") === "true") continue;
      const rect = control.getBoundingClientRect?.();
      if (rect && (rect.width <= 0 || rect.height <= 0)) continue;
      return control;
    }
    return null;
  }

  function delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  function emitLatestMapPrediction(trigger) {
    const candidate = latestMapPrediction;
    if (!candidate) return false;
    emit("prediction-candidate", {
      lat: candidate.lat,
      lng: candidate.lng,
      confidence: 0.99,
      transport: candidate.source,
      method: "MAP_CLICK",
      requestPath: null,
      evidencePath: candidate.mapHint ?? null,
      detectedAt: new Date().toISOString(),
      pinPlacedAt: candidate.capturedAt,
      trigger,
    });
    latestMapPrediction = null;
    return true;
  }

  function normalizeLatLng(value) {
    if (!value) return null;
    const lat = finite(value.lat ?? value.latitude);
    const lng = finite(value.lng ?? value.lon ?? value.longitude);
    return isCoordinate(lat, lng) ? { lat, lng } : null;
  }

  function isLikelyGuessMap(map) {
    try {
      const container = map?.getContainer?.();
      if (!container) return true;
      const rect = container.getBoundingClientRect?.();
      if (rect && (rect.width < 80 || rect.height < 80)) return false;
      const text = [
        container.id,
        container.className,
        container.getAttribute?.("aria-label"),
        container.getAttribute?.("data-testid"),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (/(overview|result|answer|correct-location)/.test(text)) return false;
      return true;
    } catch {
      return true;
    }
  }

  function describeMap(map) {
    try {
      const container = map?.getContainer?.();
      if (!container) return "leaflet-map";
      const hint = [container.id, container.className]
        .filter(Boolean)
        .join(".")
        .replace(/\s+/g, ".")
        .slice(0, 160);
      return hint ? `leaflet:${hint}` : "leaflet-map";
    } catch {
      return "leaflet-map";
    }
  }

  function installFetchHook() {
    const originalFetch = window.fetch;
    if (typeof originalFetch !== "function" || originalFetch.__ogrrWrapped) return;

    async function wrappedFetch(input, init = {}) {
      try {
        const request = input instanceof Request ? input : null;
        const url = request?.url ?? String(input ?? "");
        const method = String(init.method ?? request?.method ?? "GET").toUpperCase();
        const body = init.body ?? null;
        if (body !== null && body !== undefined) {
          inspectOutboundRequest({ url, method, body, transport: "fetch" });
        } else if (request && !["GET", "HEAD"].includes(method)) {
          request
            .clone()
            .text()
            .then((requestBody) =>
              inspectOutboundRequest({
                url,
                method,
                body: requestBody,
                transport: "fetch-request",
              }),
            )
            .catch(() => {});
        }
      } catch {
        // Instrumentation must never interfere with the game request.
      }
      return originalFetch.apply(this, arguments);
    }

    Object.defineProperty(wrappedFetch, "__ogrrWrapped", { value: true });
    window.fetch = wrappedFetch;
  }

  function installXhrHook() {
    const OriginalXhr = window.XMLHttpRequest;
    if (typeof OriginalXhr !== "function" || OriginalXhr.prototype.__ogrrWrapped) {
      return;
    }

    const originalOpen = OriginalXhr.prototype.open;
    const originalSend = OriginalXhr.prototype.send;

    OriginalXhr.prototype.open = function (method, url) {
      this.__ogrrRequest = {
        method: String(method ?? "GET").toUpperCase(),
        url: String(url ?? ""),
      };
      return originalOpen.apply(this, arguments);
    };

    OriginalXhr.prototype.send = function (body) {
      try {
        inspectOutboundRequest({
          url: this.__ogrrRequest?.url ?? "",
          method: this.__ogrrRequest?.method ?? "GET",
          body,
          transport: "xhr",
        });
      } catch {
        // Keep the original request untouched.
      }
      return originalSend.apply(this, arguments);
    };

    Object.defineProperty(OriginalXhr.prototype, "__ogrrWrapped", {
      value: true,
    });
  }


  function installWebSocketHook() {
    const OriginalWebSocket = window.WebSocket;
    if (typeof OriginalWebSocket !== "function" || OriginalWebSocket.prototype.__ogrrWrapped) {
      return;
    }

    const originalSend = OriginalWebSocket.prototype.send;
    OriginalWebSocket.prototype.send = function (body) {
      try {
        inspectOutboundRequest({
          url: this.url ?? "websocket",
          method: "WEBSOCKET",
          body,
          transport: "websocket",
        });
      } catch {
        // Preserve the original WebSocket behavior.
      }
      return originalSend.apply(this, arguments);
    };
    Object.defineProperty(OriginalWebSocket.prototype, "__ogrrWrapped", {
      value: true,
    });
  }

  function installBeaconHook() {
    const original = navigator.sendBeacon?.bind(navigator);
    if (typeof original !== "function" || navigator.sendBeacon.__ogrrWrapped) return;

    function wrappedBeacon(url, body) {
      try {
        inspectOutboundRequest({
          url: String(url ?? ""),
          method: "BEACON",
          body,
          transport: "beacon",
        });
      } catch {
        // Preserve the original beacon behavior.
      }
      return original(url, body);
    }
    Object.defineProperty(wrappedBeacon, "__ogrrWrapped", { value: true });
    try {
      navigator.sendBeacon = wrappedBeacon;
    } catch {
      // Non-writable in some browser builds.
    }
  }

  function installHistoryHook() {
    for (const method of ["pushState", "replaceState"]) {
      const original = history[method];
      history[method] = function () {
        const result = original.apply(this, arguments);
        queueMicrotask(checkUrl);
        return result;
      };
    }
    window.addEventListener("popstate", checkUrl);
    setInterval(checkUrl, 1000);
  }

  function installResultObserver() {
    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      setTimeout(() => {
        scheduled = false;
        detectResultState();
      }, 350);
    });

    const start = () => {
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
        });
        detectResultState();
      } else {
        setTimeout(start, 50);
      }
    };
    start();
  }

  function detectResultState() {
    const now = Date.now();
    if (now - lastResultSignalAt < 1500) return;

    const buttons = [
      ...document.querySelectorAll("button, [role='button'], input[type='submit']"),
    ];
    const resultButton = buttons.find((button) => NEXT_TEXT.test(getLabel(button)));
    const recentGuess = now - lastGuessIntentAt < 15000;
    const bodyText = document.body?.innerText?.slice(0, 15000) ?? "";

    if (resultButton || (recentGuess && RESULT_TEXT.test(bodyText))) {
      lastResultSignalAt = now;
      emitLatestMapPrediction("result-visible");
      emit("result-visible", {
        detectedFrom: resultButton ? "result-control" : "page-text",
        label: resultButton ? limit(getLabel(resultButton), 120) : null,
        at: new Date().toISOString(),
      });
    }
  }

  function inspectOutboundRequest({ url, method, body, transport }) {
    if (!body || method === "GET" || method === "HEAD") return;

    const parsed = parseBody(body);
    if (parsed === null) return;

    const hints = `${url} ${safeStringify(parsed)}`.toLowerCase();
    const urlHint = /(guess|prediction|answer|submit|round|pin|coordinate|location)/i.test(
      url,
    );
    const bodyHint = /(guess|prediction|answer|latitude|longitude|lat|lng)/i.test(
      hints,
    );
    const recentGuess = Date.now() - lastGuessIntentAt < 10000;
    if (!urlHint && !bodyHint && !recentGuess) return;

    const candidate = findBestCoordinate(parsed);
    if (!candidate) return;

    const score = candidate.score + (urlHint ? 4 : 0) + (recentGuess ? 6 : 0);
    if (score < 7) return;

    emit("prediction-candidate", {
      lat: candidate.lat,
      lng: candidate.lng,
      confidence: Math.min(1, score / 16),
      transport,
      method,
      requestPath: safeRequestPath(url),
      detectedAt: new Date().toISOString(),
      evidencePath: candidate.path,
    });
  }

  function parseBody(body) {
    if (typeof body === "string") {
      const text = body.trim();
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch {
        try {
          return Object.fromEntries(new URLSearchParams(text));
        } catch {
          return text;
        }
      }
    }

    if (body instanceof URLSearchParams) return Object.fromEntries(body);
    if (body instanceof FormData) return Object.fromEntries(body.entries());
    if (body instanceof Blob || body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
      return null;
    }
    if (typeof body === "object") return body;
    return null;
  }

  function findBestCoordinate(root) {
    const candidates = [];
    const visited = new WeakSet();

    walk(root, "$", 0);
    return candidates.sort((a, b) => b.score - a.score)[0] ?? null;

    function walk(value, path, depth) {
      if (depth > 8 || value === null || value === undefined) return;

      if (Array.isArray(value)) {
        if (value.length >= 2) {
          const first = finite(value[0]);
          const second = finite(value[1]);
          if (isCoordinate(first, second)) {
            candidates.push({
              lat: first,
              lng: second,
              path,
              score: scorePath(path) + 1,
            });
          } else if (isCoordinate(second, first)) {
            candidates.push({
              lat: second,
              lng: first,
              path,
              score: scorePath(path),
            });
          }
        }
        value.forEach((item, index) => walk(item, `${path}[${index}]`, depth + 1));
        return;
      }

      if (typeof value !== "object") return;
      if (visited.has(value)) return;
      visited.add(value);

      const entries = Object.entries(value);
      for (const [latKey, latValue] of entries) {
        if (!isLatitudeKey(latKey)) continue;
        const lat = finite(latValue);
        if (!Number.isFinite(lat)) continue;

        for (const [lngKey, lngValue] of entries) {
          if (!isLongitudeKey(lngKey)) continue;
          const lng = finite(lngValue);
          if (!isCoordinate(lat, lng)) continue;

          const candidatePath = `${path}.${latKey}+${lngKey}`;
          candidates.push({
            lat,
            lng,
            path: candidatePath,
            score:
              scorePath(candidatePath) +
              scoreKey(latKey) +
              scoreKey(lngKey) +
              3,
          });
        }
      }

      for (const [key, item] of entries) {
        walk(item, `${path}.${key}`, depth + 1);
      }
    }
  }

  function scorePath(path) {
    let score = 0;
    if (/(guess|prediction|answer|pin|selected|submitted)/i.test(path)) score += 6;
    if (/(coordinate|location|position)/i.test(path)) score += 2;
    if (/(spawn|actual|target|correct|ground)/i.test(path)) score -= 5;
    return score;
  }

  function scoreKey(key) {
    if (/(guess|prediction|answer|selected)/i.test(key)) return 4;
    if (/^(lat|lng|lon|latitude|longitude)$/i.test(key)) return 2;
    return 1;
  }

  function isLatitudeKey(key) {
    return /(^|_)(lat|latitude)(itude)?($|_)/i.test(key) || /Lat$/.test(key);
  }

  function isLongitudeKey(key) {
    return /(^|_)(lng|lon|long|longitude)($|_)/i.test(key) || /Lng$/.test(key);
  }

  function isCoordinate(lat, lng) {
    return (
      Number.isFinite(lat) &&
      lat >= -90 &&
      lat <= 90 &&
      Number.isFinite(lng) &&
      lng >= -180 &&
      lng <= 180
    );
  }

  function finite(value) {
    const number = Number(value);
    return value !== null && value !== "" && value !== undefined && Number.isFinite(number)
      ? number
      : null;
  }

  function checkUrl() {
    if (location.href === lastUrl) return;
    const previousUrl = lastUrl;
    lastUrl = location.href;
    emit("page-context", { ...pageContext(), previousUrl: safePageUrl(previousUrl) });
  }

  function pageContext() {
    return {
      pageUrl: safePageUrl(location.href),
      pathname: location.pathname,
      competitionHint: deriveCompetitionHint(location),
      title: document.title,
      at: new Date().toISOString(),
    };
  }

  function deriveCompetitionHint(currentLocation) {
    const match = currentLocation.pathname.match(/\/competitions?\/([^/?#]+)/i);
    if (match?.[1]) return match[1];
    return new URLSearchParams(currentLocation.search ?? "").get("competition");
  }

  function safeRequestPath(value) {
    try {
      const url = new URL(value, location.href);
      return `${url.origin}${url.pathname}`;
    } catch {
      return limit(String(value ?? ""), 300);
    }
  }

  function safePageUrl(value) {
    try {
      const url = new URL(value, location.href);
      url.hash = "";
      return url.toString();
    } catch {
      return String(value ?? "");
    }
  }

  function safeStringify(value) {
    try {
      return JSON.stringify(value).slice(0, 10000);
    } catch {
      return "";
    }
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
      ? event.target.closest("button, [role='button'], input[type='submit'], input[type='button'], a")
      : null;
  }

  function getLabel(element) {
    if (element instanceof HTMLInputElement) {
      return element.value || element.getAttribute("aria-label") || "";
    }
    return (
      element.getAttribute("aria-label") ||
      element.getAttribute("title") ||
      element.textContent ||
      ""
    ).trim();
  }

  function limit(value, max) {
    const text = String(value ?? "");
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  }

  function emit(event, payload = {}) {
    window.postMessage(
      {
        channel: CHANNEL,
        source: SOURCE,
        event,
        payload,
      },
      "*",
    );
  }
})();
