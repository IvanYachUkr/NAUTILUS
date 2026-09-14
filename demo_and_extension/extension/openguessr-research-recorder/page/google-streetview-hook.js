(() => {
  if (window.__OGRR_STREETVIEW_HOOK_INSTALLED__) return;
  window.__OGRR_STREETVIEW_HOOK_INSTALLED__ = true;

  const CHANNEL = "openguessr-research-recorder";
  const SOURCE = "google-frame";
  const frameInstanceId =
    typeof crypto?.randomUUID === "function"
      ? crypto.randomUUID()
      : `frame-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const attached = new WeakSet();
  const patchedPrototypes = new WeakSet();
  let hookedConstructor = null;
  let hookAttempts = 0;

  const spawnRequested = parseSpawnFromUrl(location.href);
  emit("frame-ready", {
    frameInstanceId,
    origin: location.origin,
    pathname: location.pathname,
    spawnRequested,
    at: new Date().toISOString(),
  });

  if (spawnRequested) {
    emit("spawn-requested", {
      frameInstanceId,
      ...spawnRequested,
      at: new Date().toISOString(),
    });
  }

  const timer = setInterval(() => {
    hookAttempts += 1;
    tryHook();
    if (hookedConstructor || hookAttempts >= 600) clearInterval(timer);
  }, 50);
  tryHook();

  function tryHook() {
    const maps = window.google?.maps;
    const Original = maps?.StreetViewPanorama;
    if (typeof Original !== "function") return;

    patchPrototype(Original.prototype);

    if (Original.__ogrrWrapped) {
      hookedConstructor = Original;
      return;
    }

    function WrappedStreetViewPanorama(...args) {
      const instance = Reflect.construct(
        Original,
        args,
        new.target === WrappedStreetViewPanorama ? Original : new.target,
      );
      attachPanorama(instance, "constructor");
      return instance;
    }

    try {
      Object.setPrototypeOf(WrappedStreetViewPanorama, Original);
      WrappedStreetViewPanorama.prototype = Original.prototype;
      Object.defineProperty(WrappedStreetViewPanorama, "__ogrrWrapped", {
        value: true,
      });
      Object.defineProperty(WrappedStreetViewPanorama, "__ogrrOriginal", {
        value: Original,
      });
      maps.StreetViewPanorama = WrappedStreetViewPanorama;
      hookedConstructor = WrappedStreetViewPanorama;
      emit("api-constructor-hooked", {
        frameInstanceId,
        at: new Date().toISOString(),
      });
    } catch (error) {
      emit("diagnostic", {
        frameInstanceId,
        name: "constructor_hook_failed",
        message: String(error?.message ?? error),
        at: new Date().toISOString(),
      });
    }
  }

  function patchPrototype(prototype) {
    if (!prototype || patchedPrototypes.has(prototype)) return;
    patchedPrototypes.add(prototype);

    for (const methodName of ["setPosition", "setPov", "setZoom", "setPano"]) {
      const original = prototype[methodName];
      if (typeof original !== "function" || original.__ogrrWrapped) continue;

      function wrappedMethod(...args) {
        attachPanorama(this, `method:${methodName}`);
        const result = original.apply(this, args);
        queueMicrotask(() => capture(this, `${methodName}_called`));
        return result;
      }
      Object.defineProperty(wrappedMethod, "__ogrrWrapped", { value: true });
      try {
        prototype[methodName] = wrappedMethod;
      } catch {
        // Some API builds may expose non-writable methods; event listeners still work.
      }
    }
  }

  function attachPanorama(instance, reason) {
    if (!instance || attached.has(instance)) return;
    attached.add(instance);

    const events = [
      "position_changed",
      "pov_changed",
      "zoom_changed",
      "pano_changed",
      "status_changed",
      "visible_changed",
    ];

    for (const eventName of events) {
      try {
        if (typeof instance.addListener === "function") {
          instance.addListener(eventName, () => capture(instance, eventName));
        } else if (window.google?.maps?.event?.addListener) {
          window.google.maps.event.addListener(instance, eventName, () =>
            capture(instance, eventName),
          );
        }
      } catch {
        // A missing event must not block other listeners.
      }
    }

    emit("panorama-attached", {
      frameInstanceId,
      reason,
      hasPosition: typeof instance.getPosition === "function",
      hasPov: typeof instance.getPov === "function",
      hasZoom: typeof instance.getZoom === "function",
      at: new Date().toISOString(),
    });
    capture(instance, "attached");
  }

  function capture(instance, reason) {
    try {
      const position = readPosition(instance);
      if (!position) return;
      const pov = readPov(instance);
      const zoom = readFinite(() => instance.getZoom?.());
      const panoId = readString(() => instance.getPano?.());

      emit("sample", {
        frameInstanceId,
        capturedAt: new Date().toISOString(),
        capturedAtMs: Date.now(),
        lat: position.lat,
        lng: position.lng,
        heading: pov?.heading ?? null,
        pitch: pov?.pitch ?? null,
        zoom,
        fov: zoomToApproximateFov(zoom),
        panoId,
        source: "api",
        reason,
      });
    } catch (error) {
      emit("diagnostic", {
        frameInstanceId,
        name: "capture_failed",
        message: String(error?.message ?? error),
        at: new Date().toISOString(),
      });
    }
  }

  function readPosition(instance) {
    const value = instance.getPosition?.();
    if (!value) return null;

    const lat = typeof value.lat === "function" ? value.lat() : value.lat;
    const lng = typeof value.lng === "function" ? value.lng() : value.lng;
    if (!isCoordinate(lat, lng)) return null;
    return { lat: Number(lat), lng: Number(lng) };
  }

  function readPov(instance) {
    const value = instance.getPov?.();
    if (!value) return null;
    const heading = Number(value.heading);
    const pitch = Number(value.pitch);
    return {
      heading: Number.isFinite(heading) ? heading : null,
      pitch: Number.isFinite(pitch) ? pitch : null,
    };
  }

  function readFinite(reader) {
    try {
      const value = Number(reader());
      return Number.isFinite(value) ? value : null;
    } catch {
      return null;
    }
  }

  function readString(reader) {
    try {
      const value = reader();
      return value ? String(value) : null;
    } catch {
      return null;
    }
  }

  function parseSpawnFromUrl(value) {
    try {
      const url = new URL(value);
      const pair =
        parsePair(url.searchParams.get("location")) ??
        parsePair(url.searchParams.get("viewpoint"));
      if (!pair) return null;
      return {
        ...pair,
        heading: finiteOrNull(url.searchParams.get("heading")),
        pitch: finiteOrNull(url.searchParams.get("pitch")),
        fov: finiteOrNull(url.searchParams.get("fov")) ?? 90,
        panoId:
          url.searchParams.get("pano") ?? url.searchParams.get("panoid") ?? null,
      };
    } catch {
      return null;
    }
  }

  function parsePair(value) {
    if (!value) return null;
    const match = String(value).match(
      /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/,
    );
    if (!match) return null;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    return isCoordinate(lat, lng) ? { lat, lng } : null;
  }

  function finiteOrNull(value) {
    const number = Number(value);
    return value !== null && value !== "" && Number.isFinite(number)
      ? number
      : null;
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

  function zoomToApproximateFov(zoom) {
    if (!Number.isFinite(zoom)) return null;
    // Google Street View does not expose FOV directly through getZoom(). This
    // monotonic approximation is only for timeline display and URL playback.
    return Math.max(10, Math.min(100, 90 / 2 ** Math.max(0, zoom - 1)));
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
