const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS_INTEGRITY =
  "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
const LEAFLET_JS_INTEGRITY =
  "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";

let loaderPromise;

export function ensureLeaflet({ timeoutMs = 7000 } = {}) {
  if (globalThis.L?.map) {
    return Promise.resolve(globalThis.L);
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  loaderPromise = new Promise((resolve, reject) => {
    installStylesheet();

    const existing = document.querySelector("script[data-geoatlas-leaflet]");
    const script = existing ?? document.createElement("script");
    let settled = false;

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback(value);
    };

    const timeout = window.setTimeout(() => {
      finish(
        reject,
        new Error(
          "Leaflet did not load in time. The explorer will keep its schematic fallback map.",
        ),
      );
    }, timeoutMs);

    script.addEventListener(
      "load",
      () => {
        if (globalThis.L?.map) {
          finish(resolve, globalThis.L);
        } else {
          finish(reject, new Error("Leaflet loaded without exposing window.L."));
        }
      },
      { once: true },
    );

    script.addEventListener(
      "error",
      () => {
        finish(reject, new Error("Unable to load Leaflet from the CDN."));
      },
      { once: true },
    );

    if (!existing) {
      script.src = LEAFLET_JS_URL;
      script.integrity = LEAFLET_JS_INTEGRITY;
      script.crossOrigin = "anonymous";
      script.dataset.geoatlasLeaflet = "true";
      script.async = true;
      document.head.append(script);
    }
  });

  return loaderPromise;
}

function installStylesheet() {
  if (document.querySelector("link[data-geoatlas-leaflet]")) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = LEAFLET_CSS_URL;
  link.integrity = LEAFLET_CSS_INTEGRITY;
  link.crossOrigin = "anonymous";
  link.dataset.geoatlasLeaflet = "true";
  document.head.append(link);
}
