import { createMapController } from "./map-controller.js";
import { ensureGlobe } from "./globe-loader.js";
import { buildGlobeSceneData } from "./globe-scene.js";

const EARTH_TEXTURE_URL = new URL(
  "./vendor/earth-blue-marble.jpg",
  import.meta.url,
).href;
const EARTH_BUMP_URL = new URL(
  "./vendor/earth-topology.png",
  import.meta.url,
).href;
const EUROPE_VIEW = { lat: 50.4, lng: 12.2, altitude: 1.55 };

export function globeOffsetForView({ overview, width, height, mobile = false }) {
  if (overview) {
    return [0, 0];
  }

  if (mobile) {
    return [0, 0];
  }

  return [
    Math.round(Math.min(width * 0.08, 58)),
    Math.round(Math.min(height * 0.08, 42)),
  ];
}

export function globePointOfViewForSelection({ focus, altitude, mobile = false }) {
  if (!mobile) {
    return { lat: focus.lat, lng: focus.lng, altitude };
  }

  // On phones the globe itself sits mostly beyond the lower-right edge of the
  // scene. Aim the camera south-east of the selected point so the pin rotates
  // onto the small, visible upper-left curve instead of disappearing with the
  // globe's centre.
  return {
    lat: Math.max(-70, Math.min(70, focus.lat - 38)),
    lng: ((focus.lng + 25 + 540) % 360) - 180,
    altitude: 1.45,
  };
}

export function createGlobeController(container, options = {}) {
  if (!(container instanceof HTMLElement)) {
    throw new TypeError("A globe container element is required.");
  }

  let cases = [];
  let selectedCase = null;
  let selectedRun = null;
  let overviewRuns = [];
  let comparisonRuns = [];
  let overview = true;
  let playback = null;
  let world = null;
  let surface = null;
  let status = null;
  let resizeObserver = null;
  let fallbackController = null;
  let destroyed = false;
  let lastFitSignature = "";

  renderLoading();

  if (options.disableGlobe) {
    activateFallback("Interactive globe disabled · map fallback active");
  } else {
    ensureGlobe({ timeoutMs: options.globeTimeoutMs ?? 12000 })
      .then((Globe) => {
        if (destroyed) return;
        initializeGlobe(Globe);
        renderGlobeData({ fit: true });
      })
      .catch((error) => {
        if (destroyed) return;
        console.info(error.message);
        activateFallback("Interactive globe unavailable · map fallback active");
      });
  }

  return {
    update(next = {}, { fit = true } = {}) {
      cases = next.cases ?? cases;
      selectedCase = next.caseItem ?? null;
      selectedRun = next.run ?? null;
      overviewRuns = next.overviewRuns ?? [];
      comparisonRuns = next.comparisonRuns ?? [];
      overview = next.overview ?? !selectedCase;
      playback = next.playback ?? null;

      container.dataset.viewState = overview ? "overview" : "detail";

      if (world) {
        renderGlobeData({ fit });
      } else if (fallbackController) {
        fallbackController.update(
          { cases, caseItem: selectedCase, run: selectedRun, overviewRuns, comparisonRuns, overview, playback },
          { fit },
        );
      } else {
        renderLoadingData();
      }
    },

    setPlayback(nextPlayback) {
      playback = nextPlayback;
      if (world) {
        renderGlobeData({ fit: false });
      } else {
        fallbackController?.setPlayback(nextPlayback);
      }
    },

    resetView() {
      if (world) {
        fitCurrentView(true);
      } else {
        fallbackController?.resetView();
      }
    },

    invalidateSize() {
      if (world) {
        resizeGlobe();
      } else {
        fallbackController?.invalidateSize();
      }
    },

    destroy() {
      destroyed = true;
      resizeObserver?.disconnect();
      resizeObserver = null;
      fallbackController?.destroy();
      fallbackController = null;
      world?._destructor?.();
      world = null;
      container.replaceChildren();
    },
  };

  function initializeGlobe(Globe) {
    container.replaceChildren();
    container.dataset.mapMode = "globe";

    surface = document.createElement("div");
    surface.className = "globe-surface";
    surface.setAttribute("role", "application");
    surface.setAttribute(
      "aria-label",
      "Interactive globe showing benchmark locations, predictions, and exploration paths",
    );

    status = document.createElement("div");
    status.className = "globe-network-status";
    status.textContent = "Rendering the evidence globe…";

    container.append(surface, status);

    const reducedMotion = prefersReducedMotion();
    world = new Globe(surface, {
      animateIn: !reducedMotion,
      rendererConfig: {
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      },
    })
      .backgroundColor("rgba(0, 0, 0, 0)")
      .globeImageUrl(options.globeImageUrl ?? EARTH_TEXTURE_URL)
      .bumpImageUrl(options.bumpImageUrl ?? EARTH_BUMP_URL)
      .showAtmosphere(true)
      .atmosphereColor("#38bdf8")
      .atmosphereAltitude(0.14)
      .pointLat("lat")
      .pointLng("lng")
      .pointLabel((point) => escapeHtml(point.label))
      .pointColor("color")
      .pointAltitude("altitude")
      .pointRadius((point) => point.radius * (isMobileDetailGlobe() ? 2.4 : 1))
      .pointResolution(18)
      .pointsTransitionDuration(reducedMotion ? 0 : 560)
      .arcLabel((arc) => escapeHtml(arc.label))
      .arcColor("color")
      .arcAltitudeAutoScale((arc) => arc.altitudeScale ?? 0.16)
      .arcStroke((arc) => arc.stroke ?? 0.34)
      .arcDashLength(0.46)
      .arcDashGap(0.18)
      .arcDashAnimateTime(reducedMotion ? 0 : 3200)
      .arcsTransitionDuration(reducedMotion ? 0 : 650)
      .pathLabel((path) => escapeHtml(path.label))
      .pathPoints("points")
      .pathPointLat((point) => point[0])
      .pathPointLng((point) => point[1])
      .pathPointAlt((point) => point[2])
      .pathColor("color")
      .pathStroke((path) => (path.kind === "playback" ? 0.42 : 0.27))
      .pathDashLength((path) => (path.kind === "playback" ? 0.16 : 0.24))
      .pathDashGap((path) => (path.kind === "playback" ? 0.08 : 0.12))
      .pathDashAnimateTime(reducedMotion ? 0 : 2600)
      .pathTransitionDuration(reducedMotion ? 0 : 520)
      .labelLat("lat")
      .labelLng("lng")
      .labelAltitude("altitude")
      .labelText("text")
      .labelLabel((label) => escapeHtml(label.label))
      .labelColor("color")
      .labelSize(0.24)
      .labelResolution(3)
      .labelIncludeDot(false)
      .labelsTransitionDuration(reducedMotion ? 0 : 420)
      .onPointClick((point) => selectPoint(point))
      .onArcClick((arc) => selectPoint({ ...arc, kind: "prediction" }))
      .onPathClick((path) => selectPoint({ ...path, kind: "playback" }))
      .onGlobeReady(() => {
        if (status) status.hidden = true;
      });

    const renderer = world.renderer?.();
    renderer?.setPixelRatio?.(Math.min(window.devicePixelRatio || 1, 1.5));

    const controls = world.controls?.();
    if (controls) {
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.rotateSpeed = 0.34;
      controls.zoomSpeed = 0.58;
      controls.autoRotateSpeed = 0.22;
      const radius = world.getGlobeRadius?.() ?? 100;
      controls.minDistance = radius * 1.18;
      controls.maxDistance = radius * 6.5;
    }

    resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(resizeGlobe);
    });
    resizeObserver.observe(container);
    resizeGlobe();
  }

  function renderGlobeData({ fit = false } = {}) {
    if (!world) return;

    const scene = buildGlobeSceneData({
      cases,
      caseItem: selectedCase,
      run: selectedRun,
      overviewRuns,
      comparisonRuns,
      overview,
      playback,
    });

    world.pointsData(scene.points);
    world.arcsData(scene.arcs);
    world.pathsData(scene.paths);
    world.labelsData(scene.labels ?? []);

    syncGlobeInteractionMode();

    if (fit) fitCurrentView(false);
  }

  function fitCurrentView(force) {
    if (!world) return;
    const signature = overview
      ? `overview:${cases.map((item) => item.id).join(",")}`
      : `${selectedCase?.id ?? "none"}:${selectedRun?.id ?? "none"}:${comparisonRuns.map((item) => item.id).join(",")}`;

    if (!force && signature === lastFitSignature) return;
    lastFitSignature = signature;

    const duration = prefersReducedMotion() ? 0 : 900;
    if (overview || !selectedCase) {
      world.globeOffset(globeOffsetForView({
        overview: true,
        width: container.clientWidth,
        height: container.clientHeight,
      }));
      world.pointOfView(EUROPE_VIEW, duration);
      return;
    }

    const mobileDetail = isMobileDetailGlobe();
    world.globeOffset(globeOffsetForView({
      overview: false,
      width: container.clientWidth,
      height: container.clientHeight,
      mobile: mobileDetail,
    }));
    const comparedPredictions = comparisonRuns.map((item) => item.prediction).filter(hasCoordinate);
    const focus = mobileDetail && selectedRun?.prediction && hasCoordinate(selectedRun.prediction)
      ? selectedRun.prediction
      : comparedPredictions.length
        ? averageCoordinate([selectedCase.groundTruth, ...comparedPredictions])
        : selectedRun?.prediction && hasCoordinate(selectedRun.prediction)
          ? midpoint(selectedCase.groundTruth, selectedRun.prediction)
          : selectedCase.groundTruth;
    const errorKm = comparedPredictions.length
      ? Math.max(...comparisonRuns.map((item) => Number(item.errorKm) || 0))
      : selectedRun?.errorKm;
    const fittedAltitude = Number.isFinite(errorKm)
      ? errorKm < 5
        ? 1.18
        : errorKm < 50
          ? 1.28
          : errorKm < 500
            ? 1.48
            : 1.72
      : 1.32;
    world.pointOfView(globePointOfViewForSelection({
      focus,
      altitude: fittedAltitude,
      mobile: mobileDetail,
    }), duration);
  }

  function resizeGlobe() {
    if (!world || !surface) return;
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    world.width(width).height(height);
    syncGlobeInteractionMode();
  }

  function isMobileDetailGlobe() {
    return !overview && isMobileViewport();
  }

  function syncGlobeInteractionMode() {
    if (!world || !surface) return;
    const staticMobileDetail = isMobileDetailGlobe();
    const controls = world.controls?.();
    if (controls) {
      controls.enabled = !staticMobileDetail;
      controls.autoRotate = Boolean(overview && !prefersReducedMotion());
    }
    surface.dataset.mobileStatic = String(staticMobileDetail);
    surface.setAttribute("role", staticMobileDetail ? "img" : "application");
    surface.setAttribute(
      "aria-label",
      staticMobileDetail
        ? "Globe view centered on the selected benchmark location"
        : "Interactive globe showing benchmark locations, predictions, and exploration paths",
    );
  }

  function selectPoint(point) {
    if (point?.kind === "location" && point.caseId) {
      options.onCaseSelect?.(point.caseId);
      return;
    }

    if (!point?.caseId) return;
    const kind = ["truth", "prediction", "playback"].includes(point.kind)
      ? point.kind
      : "prediction";
    options.onMarkerSelect?.(kind, {
      caseId: point.caseId,
      runId: point.runId ?? selectedRun?.id ?? null,
      sample: kind === "playback" ? playback?.sample ?? null : null,
    });
  }

  function renderLoading() {
    container.dataset.mapMode = "loading";
    container.dataset.viewState = "overview";
    container.innerHTML = `
      <div class="globe-loading" role="status">
        <i class="ph-fill ph-globe-hemisphere-west globe-loading__icon" aria-hidden="true"></i>
        <strong>Preparing the evidence globe</strong>
        <small data-globe-loading-status>Loading 3D geography…</small>
      </div>
    `;
  }

  function renderLoadingData() {
    const label = container.querySelector("[data-globe-loading-status]");
    if (!label) return;
    label.textContent = selectedCase
      ? `Preparing ${selectedCase.city}, ${selectedCase.country}…`
      : `Preparing ${cases.length} benchmark locations…`;
  }

  function activateFallback(message) {
    if (destroyed || fallbackController) return;
    resizeObserver?.disconnect();
    resizeObserver = null;
    world?._destructor?.();
    world = null;
    container.replaceChildren();
    container.dataset.mapMode = "fallback";

    fallbackController = createMapController(container, {
      ...options,
      disableLeaflet: options.disableLeaflet,
      onCaseSelect: options.onCaseSelect,
      onMarkerSelect: options.onMarkerSelect,
    });
    fallbackController.update(
      { cases, caseItem: selectedCase, run: selectedRun, overviewRuns, comparisonRuns, overview, playback },
      { fit: true },
    );

    const notice = document.createElement("div");
    notice.className = "globe-fallback-notice";
    notice.textContent = message;
    container.append(notice);
  }
}

function midpoint(a, b) {
  return {
    lat: (a.lat + b.lat) / 2,
    lng: (a.lng + b.lng) / 2,
  };
}

function averageCoordinate(points) {
  return {
    lat: points.reduce((sum, point) => sum + point.lat, 0) / points.length,
    lng: points.reduce((sum, point) => sum + point.lng, 0) / points.length,
  };
}

function hasCoordinate(value) {
  return Boolean(
    value &&
      Number.isFinite(value.lat) &&
      value.lat >= -90 &&
      value.lat <= 90 &&
      Number.isFinite(value.lng) &&
      value.lng >= -180 &&
      value.lng <= 180,
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function isMobileViewport() {
  return window.matchMedia?.("(max-width: 680px)").matches ?? false;
}
