const GLOBE_SCRIPT_URL = new URL(
  "./vendor/globe.gl.min.js",
  import.meta.url,
).href;

let loaderPromise;

export function ensureGlobe({ timeoutMs = 12000 } = {}) {
  if (typeof globalThis.Globe === "function") {
    return Promise.resolve(globalThis.Globe);
  }

  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-nautilus-globe]");
    const script = existing ?? document.createElement("script");
    let settled = false;

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      callback(value);
    };

    const timeout = window.setTimeout(() => {
      finish(reject, new Error("The interactive globe did not load in time."));
    }, timeoutMs);

    script.addEventListener(
      "load",
      () => {
        if (typeof globalThis.Globe === "function") {
          finish(resolve, globalThis.Globe);
        } else {
          finish(reject, new Error("The globe library loaded without its browser API."));
        }
      },
      { once: true },
    );

    script.addEventListener(
      "error",
      () => finish(reject, new Error("Unable to load the interactive globe library.")),
      { once: true },
    );

    if (!existing) {
      script.src = GLOBE_SCRIPT_URL;
      script.crossOrigin = "anonymous";
      script.dataset.nautilusGlobe = "true";
      script.async = true;
      document.head.append(script);
    }
  });

  return loaderPromise;
}
