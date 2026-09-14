import { formatDistance, predictionLocationLabel } from "./geo.js";
import { explorationDistanceKm } from "./exploration.js";
import { ensureLeaflet } from "./leaflet-loader.js";
import { comparisonColor } from "./comparison-colors.js";

const EUROPE_VIEW = {
  center: [50.3, 12.5],
  zoom: 4,
};
export function createMapController(container, options = {}) {
  if (!(container instanceof HTMLElement)) {
    throw new TypeError("A map container element is required.");
  }

  let cases = [];
  let selectedCase = null;
  let selectedRun = null;
  let comparisonRuns = [];
  let overview = true;
  let playback = null;
  let leaflet = null;
  let map = null;
  let locationLayer = null;
  let routeLayer = null;
  let comparisonLayer = null;
  let playbackLayer = null;
  let resizeObserver = null;
  let destroyed = false;
  let tileHasLoaded = false;
  let tileErrors = 0;

  renderFallback();

  if (options.disableLeaflet) {
    setFallbackStatus("Schematic fallback · offline mode");
  } else {
    ensureLeaflet({ timeoutMs: options.leafletTimeoutMs ?? 7000 })
      .then((L) => {
        if (destroyed) return;
        leaflet = L;
        initializeLeafletMap();
        renderLeafletData({ fit: true });
      })
      .catch((error) => {
        if (destroyed) return;
        container.dataset.mapMode = "fallback";
        setFallbackStatus("Schematic fallback · map library unavailable");
        console.info(error.message);
      });
  }

  return {
    update(next = {}, { fit = true } = {}) {
      cases = next.cases ?? cases;
      selectedCase = next.caseItem ?? null;
      selectedRun = next.run ?? null;
      comparisonRuns = next.comparisonRuns ?? [];
      overview = next.overview ?? !selectedCase;
      playback = next.playback ?? playback;

      if (map) {
        renderLeafletData({ fit });
      } else {
        renderFallbackData();
      }
    },

    setPlayback(nextPlayback) {
      playback = nextPlayback;
      if (map) {
        renderPlayback();
      } else {
        renderFallbackData();
      }
    },

    resetView() {
      if (map) fitCurrentView();
    },

    invalidateSize() {
      map?.invalidateSize({ pan: false });
    },

    destroy() {
      destroyed = true;
      resizeObserver?.disconnect();
      resizeObserver = null;
      map?.remove();
      map = null;
      container.replaceChildren();
    },
  };

  function initializeLeafletMap() {
    container.replaceChildren();
    container.dataset.mapMode = "openstreetmap";

    const surface = document.createElement("div");
    surface.className = "leaflet-map-surface";
    surface.setAttribute("aria-label", "OpenStreetMap geolocation comparison map");

    const status = document.createElement("div");
    status.className = "map-network-status";
    status.dataset.mapNetworkStatus = "true";
    status.textContent = "Loading OpenStreetMap…";

    container.append(surface, status);

    map = leaflet.map(surface, {
      center: EUROPE_VIEW.center,
      zoom: EUROPE_VIEW.zoom,
      preferCanvas: true,
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: true,
      zoomAnimation: !prefersReducedMotion(),
      fadeAnimation: !prefersReducedMotion(),
      markerZoomAnimation: !prefersReducedMotion(),
      worldCopyJump: true,
    });

    leaflet.control.zoom({ position: "bottomright" }).addTo(map);

    const tileLayer = leaflet.tileLayer(
      options.tileUrl ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        minZoom: 2,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        updateWhenIdle: true,
        keepBuffer: 2,
        detectRetina: false,
        crossOrigin: true,
      },
    );

    tileLayer.on("load", () => {
      tileHasLoaded = true;
      status.hidden = true;
    });

    tileLayer.on("tileerror", () => {
      tileErrors += 1;
      if (!tileHasLoaded && tileErrors >= 2) {
        status.hidden = false;
        status.textContent = "Map tiles unavailable · data overlays remain interactive";
      }
    });

    tileLayer.addTo(map);
    locationLayer = leaflet.layerGroup().addTo(map);
    routeLayer = leaflet.layerGroup().addTo(map);
    comparisonLayer = leaflet.layerGroup().addTo(map);
    playbackLayer = leaflet.layerGroup().addTo(map);

    resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => map?.invalidateSize({ pan: false }));
    });
    resizeObserver.observe(container);
  }

  function renderLeafletData({ fit = false } = {}) {
    if (!map || !locationLayer || !comparisonLayer || !routeLayer || !playbackLayer) return;

    locationLayer.clearLayers();
    routeLayer.clearLayers();
    comparisonLayer.clearLayers();
    playbackLayer.clearLayers();

    if (overview || !selectedCase) {
      cases.forEach((item) => addLocationMarker(item));
    } else if (!selectedRun) {
      addLocationMarker(selectedCase);
    }

    if (selectedCase && selectedRun) {
      if (comparisonRuns.length) {
        renderComparisonSet(selectedCase, comparisonRuns);
      } else {
        if (!isStaticImageCondition(selectedRun.condition)) {
          renderRoute(selectedRun);
        } else {
          renderStaticHeading(selectedCase, selectedRun);
        }
        renderComparison(selectedCase, selectedRun);
        renderPlayback();
      }
    }

    if (fit) {
      window.requestAnimationFrame(() => fitCurrentView());
    }
  }

  function addLocationMarker(item) {
    const active = item.id === selectedCase?.id;
    const marker = leaflet.circleMarker([item.groundTruth.lat, item.groundTruth.lng], {
      radius: active ? 9 : 7.5,
      weight: active ? 3.5 : 3,
      color: active ? "#fff7c2" : "#e0f2fe",
      fillColor: active ? "#facc15" : "#22d3ee",
      fillOpacity: 0.98,
      opacity: 1,
      interactive: true,
    });

    marker.bindTooltip(escapeHtml(`${item.city}, ${item.country}`), {
      direction: "top",
      offset: [0, -8],
      opacity: 0.95,
    });

    marker.on("click", () => {
      if (typeof options.onCaseSelect === "function") {
        options.onCaseSelect(item.id);
      }
    });

    marker.on("mouseover", () => {
      marker.setRadius(active ? 10 : 8.5);
      marker.setStyle({ weight: active ? 4 : 3.5 });
    });

    marker.on("mouseout", () => {
      marker.setRadius(active ? 9 : 7.5);
      marker.setStyle({ weight: active ? 3.5 : 3 });
    });

    marker.addTo(locationLayer);
  }

  function renderStaticHeading(caseItem, run) {
    const sample = (run.exploration?.samples ?? []).find((item) =>
      Number.isFinite(item?.heading) && Number.isFinite(item?.lat) && Number.isFinite(item?.lng),
    );
    const heading = Number.isFinite(sample?.heading)
      ? sample.heading
      : Number.isFinite(caseItem.startingView?.heading)
        ? caseItem.startingView.heading
        : null;
    if (!Number.isFinite(heading)) return;

    const lat = Number.isFinite(caseItem.startingView?.lat)
      ? caseItem.startingView.lat
      : caseItem.groundTruth.lat;
    const lng = Number.isFinite(caseItem.startingView?.lng)
      ? caseItem.startingView.lng
      : caseItem.groundTruth.lng;

    leaflet
      .marker([lat, lng], {
        keyboard: false,
        interactive: false,
        icon: headingIcon(heading, "static-heading-marker"),
        zIndexOffset: 450,
      })
      .addTo(comparisonLayer);
  }

  function renderComparison(caseItem, run) {
    const truthPoint = [caseItem.groundTruth.lat, caseItem.groundTruth.lng];
    const predictionAvailable = hasCoordinate(run.prediction);

    const truthMarker = leaflet
      .marker(truthPoint, {
        keyboard: true,
        title: `Ground truth: ${caseItem.groundTruth.label}`,
        icon: markerIcon("truth", "T"),
        zIndexOffset: 700,
      })
      .addTo(comparisonLayer);

    truthMarker.bindTooltip("Ground truth", { direction: "top", offset: [0, -18] });
    truthMarker.on("click", (event) => {
      if (event?.originalEvent) leaflet.DomEvent.stopPropagation(event.originalEvent);
      selectMapDetail("truth", caseItem, run);
    });

    if (!predictionAvailable) return;

    const predictionPoint = [run.prediction.lat, run.prediction.lng];

    leaflet
      .polyline([truthPoint, predictionPoint], {
        color: "#273444",
        weight: 3,
        opacity: 0.96,
        dashArray: "7 8",
        interactive: false,
      })
      .addTo(comparisonLayer);

    const predictionMarker = leaflet
      .marker(predictionPoint, {
        keyboard: true,
        title: `Prediction: ${predictionLocationLabel(run.prediction)}`,
        icon: markerIcon("prediction", "P"),
        zIndexOffset: 800,
      })
      .addTo(comparisonLayer);

    predictionMarker.bindTooltip("Prediction", { direction: "top", offset: [0, -18] });
    predictionMarker.on("click", (event) => {
      if (event?.originalEvent) leaflet.DomEvent.stopPropagation(event.originalEvent);
      selectMapDetail("prediction", caseItem, run);
    });
  }

  function renderComparisonSet(caseItem, runs) {
    const truthPoint = [caseItem.groundTruth.lat, caseItem.groundTruth.lng];
    leaflet.marker(truthPoint, {
      keyboard: true,
      title: `Ground truth: ${caseItem.groundTruth.label}`,
      icon: markerIcon("truth", "T"),
      zIndexOffset: 700,
    }).bindTooltip("Ground truth", { direction: "top", offset: [0, -18] }).addTo(comparisonLayer);

    runs.forEach((run) => {
      if (!hasCoordinate(run.prediction)) return;
      const color = comparisonColor(run.comparisonColorKey ?? run.model);
      const label = run.comparisonLabel ?? run.model;
      const predictionPoint = [run.prediction.lat, run.prediction.lng];
      leaflet.polyline([truthPoint, predictionPoint], {
        color,
        weight: 3,
        opacity: 0.88,
        dashArray: "7 8",
        interactive: false,
      }).addTo(comparisonLayer);
      leaflet.circleMarker(predictionPoint, {
        radius: 9,
        weight: 3,
        color: "#061e2b",
        fillColor: color,
        fillOpacity: 1,
      }).bindTooltip(`${escapeHtml(label)} · ${escapeHtml(formatDistance(run.errorKm))}`, {
        direction: "top",
        permanent: true,
        className: "comparison-model-tooltip",
        opacity: 0.95,
      }).addTo(comparisonLayer);
    });
  }

  function renderRoute(run) {
    const path = run.exploration?.path;
    if (!Array.isArray(path) || path.length < 2) return;

    const latLngs = path.map((point) => [point.lat, point.lng]);
    const route = leaflet
      .polyline(latLngs, {
        color: "#38bdf8",
        weight: 4,
        opacity: 0.56,
        lineCap: "round",
        lineJoin: "round",
        smoothFactor: 1.25,
      })
      .bindTooltip(
        `Exploration · ${path.length} position points · ${formatDistance(explorationDistanceKm(run.exploration))}`,
        { sticky: true },
      )
      .addTo(routeLayer);

    const start = path[0];
    const end = path.at(-1);

    leaflet
      .circleMarker([start.lat, start.lng], {
        radius: 5,
        weight: 2,
        color: "#e0f2fe",
        fillColor: "#38bdf8",
        fillOpacity: 1,
      })
      .bindTooltip("Exploration start", { direction: "top" })
      .addTo(routeLayer);

    leaflet
      .circleMarker([end.lat, end.lng], {
        radius: 5,
        weight: 2,
        color: "#38bdf8",
        fillColor: "#020617",
        fillOpacity: 1,
      })
      .bindTooltip("Exploration end", { direction: "top" })
      .addTo(routeLayer);

    route.bringToBack();
  }

  function renderPlayback() {
    if (!map || !playbackLayer) return;
    playbackLayer.clearLayers();

    const sample = playback?.sample;
    if (!sample || !Number.isFinite(sample.lat) || !Number.isFinite(sample.lng)) return;

    const trace = Array.isArray(playback.trace) ? playback.trace : [];
    if (trace.length > 1) {
      leaflet
        .polyline(trace.map((point) => [point.lat, point.lng]), {
          color: "#f472b6",
          weight: 5,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
          smoothFactor: 1.1,
        })
        .addTo(playbackLayer);
    }

    const marker = leaflet
      .marker([sample.lat, sample.lng], {
        keyboard: false,
        interactive: true,
        title: "Current playback sample",
        icon: headingIcon(sample.heading),
        zIndexOffset: 1000,
      })
      .bindTooltip(playbackTooltip(sample), {
        direction: "top",
        offset: [0, -18],
        opacity: 0.95,
      })
      .addTo(playbackLayer);

    marker.on("click", () => selectMapDetail("playback", selectedCase, selectedRun, sample));
  }

  function fitCurrentView() {
    if (!map) return;

    if (overview || !selectedCase) {
      if (cases.length === 0) {
        map.setView(EUROPE_VIEW.center, EUROPE_VIEW.zoom, { animate: false });
        return;
      }

      if (cases.length === 1) {
        const point = cases[0].groundTruth;
        map.setView([point.lat, point.lng], 10, { animate: !prefersReducedMotion() });
        return;
      }

      const bounds = leaflet.latLngBounds(
        cases.map((item) => [item.groundTruth.lat, item.groundTruth.lng]),
      );
      map.fitBounds(bounds.pad(0.22), {
        animate: !prefersReducedMotion(),
        maxZoom: 6,
        paddingTopLeft: [54, 54],
        paddingBottomRight: [54, 54],
      });
      return;
    }

    if (!selectedRun) {
      const point = selectedCase.groundTruth;
      map.setView([point.lat, point.lng], 12, { animate: !prefersReducedMotion() });
      return;
    }

    const points = [
      [selectedCase.groundTruth.lat, selectedCase.groundTruth.lng],
      ...(comparisonRuns.length
        ? comparisonRuns.filter((item) => hasCoordinate(item.prediction)).map((item) => [item.prediction.lat, item.prediction.lng])
        : hasCoordinate(selectedRun.prediction)
          ? [[selectedRun.prediction.lat, selectedRun.prediction.lng]]
          : []),
      ...(comparisonRuns.length ? [] : selectedRun.exploration?.path ?? []).map((point) => [point.lat, point.lng]),
    ];

    if (points.length === 1) {
      map.setView(points[0], 13, { animate: !prefersReducedMotion() });
      return;
    }

    const bounds = leaflet.latLngBounds(points);
    map.fitBounds(bounds.pad(0.32), {
      animate: !prefersReducedMotion(),
      duration: 0.55,
      maxZoom: Number.isFinite(selectedRun.errorKm)
        ? selectedRun.errorKm > 250
          ? 6
          : selectedRun.errorKm > 25
            ? 8
            : 17
        : 17,
      paddingTopLeft: [58, 66],
      paddingBottomRight: [58, 74],
    });
  }

  function markerIcon(kind, label) {
    return leaflet.divIcon({
      className: `atlas-marker atlas-marker--${kind}`,
      html: `<span aria-hidden="true">${label}</span>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      tooltipAnchor: [0, -19],
    });
  }

  function headingIcon(heading = 0, className = "playback-marker") {
    const rotation = Number.isFinite(heading) ? heading : 0;
    const isStatic = className === "static-heading-marker";
    const size = isStatic ? 78 : 46;
    const anchor = size / 2;
    return leaflet.divIcon({
      className,
      html: `<span class="playback-marker__wrap" style="--heading:${rotation}deg"><i></i><b></b></span>`,
      iconSize: [size, size],
      iconAnchor: [anchor, anchor],
      tooltipAnchor: [0, -(anchor + 1)],
    });
  }

  function selectMapDetail(kind, caseItem, run, sample = null) {
    if (typeof options.onMarkerSelect === "function" && caseItem) {
      options.onMarkerSelect(kind, {
        caseId: caseItem.id,
        runId: run?.id ?? null,
        sample,
      });
    }
  }

  function renderFallback() {
    container.dataset.mapMode = "fallback";
    container.innerHTML = `
      <div class="fallback-map" role="img" aria-label="Schematic map fallback">
        <div class="fallback-map__grid"></div>
        <div class="fallback-map__message">
          <strong>Map preview unavailable</strong>
          <span>OpenStreetMap will appear when network access is available.</span>
        </div>
        <div class="fallback-map__status" data-fallback-status>Loading OpenStreetMap…</div>
      </div>
    `;
  }

  function renderFallbackData() {
    const status = container.querySelector("[data-fallback-status]");
    if (!status) return;
    if (playback?.sample) {
      status.textContent = `Playback sample · ${formatPlaybackTime(playback.sample.tMs)}`;
    } else if (selectedCase && selectedRun) {
      const route = selectedRun.exploration?.path?.length
        ? ` · ${selectedRun.exploration.path.length} route points`
        : selectedRun.exploration?.samples?.length
          ? ` · ${selectedRun.exploration.samples.length} samples`
          : "";
      status.textContent = comparisonRuns.length
        ? `${selectedCase.city} · ${comparisonRuns.length} model predictions`
        : hasCoordinate(selectedRun.prediction)
        ? `${selectedCase.city} · ${formatDistance(selectedRun.errorKm)} error${route}`
        : `${selectedCase.city} · recording only · prediction not captured${route}`;
    } else if (selectedCase) {
      status.textContent = `${selectedCase.city} · awaiting model run`;
    } else {
      status.textContent = `${cases.length} locations in overview`;
    }
  }

  function setFallbackStatus(text) {
    container
      .querySelector("[data-fallback-status]")
      ?.replaceChildren(document.createTextNode(text));
  }
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

function isStaticImageCondition(condition) {
  return condition === "static-image" || condition === "static-image-covered";
}

function playbackTooltip(sample) {
  const bits = [formatPlaybackTime(sample.tMs)];
  if (Number.isFinite(sample.heading)) bits.push(`heading ${Math.round(sample.heading)}°`);
  if (Number.isFinite(sample.pitch)) bits.push(`pitch ${Math.round(sample.pitch)}°`);
  return bits.join(" · ");
}

function formatPlaybackTime(tMs = 0) {
  return `${((tMs ?? 0) / 1000).toFixed(1)} s`;
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
