(() => {
  if (typeof window.__NAUTILUS_OPENGUESSR_MCP__?.command === "function") return;

  const GUESS_TEXT = /(^|\b)(guess|make guess|submit guess|lock in|submit)(\b|$)/i;
  const NEXT_TEXT = /(next round|continue|view result|show result|finish)/i;
  const trackedMaps = [];
  let verifiedPin = null;
  let placementInProgress = false;

  Object.defineProperty(window, "__NAUTILUS_OPENGUESSR_MCP__", {
    value: Object.freeze({ command }),
    configurable: false,
    enumerable: false,
    writable: false,
  });

  armLeafletHook();

  async function command(request) {
    if (request?.action === "place-guess") return placeGuess(request);
    if (request?.action === "get-state") return getState();
    if (request?.action === "submit-guess") return submitGuess();
    if (request?.action === "continue") return continueRound();
    return { ok: false, error: `Unsupported OpenGuessr action: ${String(request?.action)}` };
  }

  function armLeafletHook() {
    if (installLeafletHook()) return;

    try {
      if (!Object.getOwnPropertyDescriptor(window, "L")) {
        let leaflet;
        Object.defineProperty(window, "L", {
          configurable: true,
          enumerable: true,
          get: () => leaflet,
          set(value) {
            leaflet = value;
            Object.defineProperty(window, "L", {
              configurable: true,
              enumerable: true,
              writable: true,
              value,
            });
            installLeafletHook();
          },
        });
      }
    } catch {
      // Polling below remains a safe fallback for a locked global.
    }

    const timer = setInterval(() => {
      if (installLeafletHook()) clearInterval(timer);
    }, 250);
  }

  function installLeafletHook() {
    const prototype = window.L?.Map?.prototype;
    if (!prototype || typeof prototype.fire !== "function") return false;
    if (prototype.fire.__nautilusOpenGuessrWrapped) return true;

    const originalFire = prototype.fire;
    function wrappedFire(type) {
      try {
        trackMap(this);
        if (type === "click" && !placementInProgress) verifiedPin = null;
      } catch {
        // The adapter must never interfere with Leaflet.
      }
      return originalFire.apply(this, arguments);
    }
    Object.defineProperty(wrappedFire, "__nautilusOpenGuessrWrapped", { value: true });
    prototype.fire = wrappedFire;
    return true;
  }

  async function placeGuess(request) {
    const latitude = finite(request?.latitude);
    const longitude = finite(request?.longitude);
    if (!validCoordinate(latitude, longitude)) {
      return { ok: false, error: "Latitude or longitude is outside the valid coordinate range." };
    }

    const map = currentMap();
    if (!map) {
      return { ok: false, error: "Open the OpenGuessr guess map first, then retry coordinate placement." };
    }

    verifiedPin = null;
    placementInProgress = true;
    try {
      const latlng = window.L?.latLng?.(latitude, longitude) ?? {
        lat: latitude,
        lng: longitude,
      };
      map.fire("click", { latlng, source: "nautilus-openguessr-mcp" });
    } catch (error) {
      return {
        ok: false,
        error: `OpenGuessr rejected coordinate placement: ${String(error?.message ?? error).slice(0, 240)}`,
      };
    } finally {
      placementInProgress = false;
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (mapHasPin(map, latitude, longitude)) {
        verifiedPin = { latitude, longitude, map };
        return {
          ok: true,
          action: "place-guess",
          verified: true,
          pin: { latitude, longitude },
        };
      }
      await delay(40);
    }
    return { ok: false, error: "OpenGuessr did not render a marker at the requested coordinates." };
  }

  function getState() {
    const guess = findVisibleControl(GUESS_TEXT);
    const next = findVisibleControl(NEXT_TEXT);
    return {
      ok: true,
      action: "get-state",
      controls: { guess: Boolean(guess), continue: Boolean(next) },
      resultVisible: Boolean(next),
      verifiedPin: verifiedPin
        ? { latitude: verifiedPin.latitude, longitude: verifiedPin.longitude }
        : null,
    };
  }

  async function submitGuess() {
    const pin = verifiedPin;
    if (!pin || !mapHasPin(pin.map, pin.latitude, pin.longitude)) {
      verifiedPin = null;
      return { ok: false, error: "A verified pin from openguessr_place_guess is required before submission." };
    }
    const control = findVisibleControl(GUESS_TEXT);
    if (!control) return { ok: false, error: "The visible OpenGuessr Guess control was not found." };

    const submittedPin = { latitude: pin.latitude, longitude: pin.longitude };
    control.click();
    verifiedPin = null;
    await delay(0);
    return { ok: true, action: "submit-guess", submitted: true, pin: submittedPin };
  }

  async function continueRound() {
    const control = findVisibleControl(NEXT_TEXT);
    if (!control) return { ok: false, error: "The visible OpenGuessr Continue control was not found." };
    control.click();
    verifiedPin = null;
    await delay(0);
    return { ok: true, action: "continue", continued: true };
  }

  function trackMap(map) {
    if (!likelyGuessMap(map)) return;
    const index = trackedMaps.indexOf(map);
    if (index >= 0) trackedMaps.splice(index, 1);
    trackedMaps.push(map);
    if (trackedMaps.length > 8) trackedMaps.shift();
  }

  function currentMap() {
    for (let index = trackedMaps.length - 1; index >= 0; index -= 1) {
      if (likelyGuessMap(trackedMaps[index])) return trackedMaps[index];
    }
    return null;
  }

  function likelyGuessMap(map) {
    try {
      const container = map?.getContainer?.();
      if (!container) return false;
      const rect = container.getBoundingClientRect();
      if (rect.width < 80 || rect.height < 80) return false;
      const hint = [
        container.id,
        container.className,
        container.getAttribute("aria-label"),
        container.getAttribute("data-testid"),
      ].filter(Boolean).join(" ").toLowerCase();
      return !/(overview|result|answer|correct-location)/.test(hint);
    } catch {
      return false;
    }
  }

  function mapHasPin(map, latitude, longitude) {
    if (!map || typeof map.eachLayer !== "function") return false;
    let found = false;
    try {
      map.eachLayer((layer) => {
        if (found || typeof layer?.getLatLng !== "function") return;
        const point = layer.getLatLng();
        const lat = finite(point?.lat ?? point?.latitude);
        const lng = finite(point?.lng ?? point?.lon ?? point?.longitude);
        if (
          validCoordinate(lat, lng) &&
          Math.abs(lat - latitude) <= 1e-6 &&
          longitudeDistance(lng, longitude) <= 1e-6
        ) found = true;
      });
    } catch {
      return false;
    }
    return found;
  }

  function findVisibleControl(pattern) {
    const controls = document.querySelectorAll(
      "button, [role='button'], input[type='submit'], input[type='button'], a, .standard-button",
    );
    for (const control of controls) {
      if (!pattern.test(label(control))) continue;
      if (control.disabled || control.getAttribute("aria-disabled") === "true") continue;
      const rect = control.getBoundingClientRect();
      const style = getComputedStyle(control);
      if (
        rect.width <= 0 || rect.height <= 0 ||
        style.display === "none" || style.visibility === "hidden" ||
        rect.bottom <= 0 || rect.right <= 0 ||
        rect.top >= innerHeight || rect.left >= innerWidth
      ) continue;
      return control;
    }
    return null;
  }

  function label(element) {
    if (element instanceof HTMLInputElement) {
      return String(element.value || element.getAttribute("aria-label") || "").trim();
    }
    return String(
      element.getAttribute("aria-label") ?? element.getAttribute("title") ??
      element.textContent ?? "",
    ).trim();
  }

  function finite(value) {
    const number = Number(value);
    return value !== null && value !== "" && value !== undefined && Number.isFinite(number)
      ? number
      : null;
  }

  function validCoordinate(latitude, longitude) {
    return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 &&
      Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
  }

  function longitudeDistance(left, right) {
    const raw = Math.abs(left - right) % 360;
    return Math.min(raw, 360 - raw);
  }

  function delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
})();
