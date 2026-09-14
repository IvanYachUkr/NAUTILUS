import { haversineKm } from "./geo.js";

const DEFAULT_MIN_DISTANCE_METERS = 0.75;
const DEFAULT_MAX_POINTS = 3000;
const DEFAULT_MAX_SAMPLES = 5000;

export function normalizeExploration(input, options = {}) {
  if (!input) return null;

  const samples = extractTimelineSamples(input, options);
  const path = extractMovementPath(input, options);
  if (samples.length === 0 && path.length === 0) return null;

  const source = Array.isArray(input)
    ? "coordinate-array"
    : input.recorder?.name ?? input.source ?? "recorded-exploration";

  const durationMs = Number.isFinite(input.durationMs)
    ? input.durationMs
    : inferDurationMs(samples, path);

  const playbackActions = normalizePlaybackActions(input.playbackActions ?? [], samples);
  const video = normalizeVideoReference(input.video ?? input.round?.video);
  // Key moments are intentionally semantic-only. Raw camera telemetry still
  // drives the scrubber/map, but routine Move/Pan/Tilt/Zoom transitions are not
  // promoted into the Key events row. This keeps that row available for explicit
  // human/agent evidence annotations such as "Street sign XYZ seen".
  const keyMoments = normalizeKeyMoments(input.keyMoments ?? input.moments ?? [], samples)
    .filter(isSemanticKeyMoment);
  const departureFrames = normalizeDepartureFrames(input.departureFrames ?? []);
  const finalView = normalizeFrameReference(input.finalView);

  return {
    source,
    path: path.length ? path : extractMovementPath(samples, options),
    samples: samples.length ? samples : path,
    keyMoments,
    playbackActions,
    departureFrames,
    finalView,
    video,
    startedAt: input.startedAt ?? null,
    stoppedAt: input.stoppedAt ?? null,
    durationMs,
    sampleCount: Number.isFinite(input.sampleCount)
      ? input.sampleCount
      : Array.isArray(input.samples)
        ? input.samples.length
        : samples.length || path.length,
    pointCount: path.length,
    captureSources: input.captureSources ?? summarizeSources(samples),
    recorder: input.recorder ? { ...input.recorder } : undefined,
  };
}

export function extractTimelineSamples(
  input,
  {
    maxSamples = DEFAULT_MAX_SAMPLES,
  } = {},
) {
  const rawPoints = getRawPoints(input);
  const samples = [];

  for (const sample of rawPoints) {
    const point = toPoint(sample);
    if (!point) continue;
    samples.push(point);
  }

  samples.sort((a, b) => (a.tMs ?? 0) - (b.tMs ?? 0) || (a.seq ?? 0) - (b.seq ?? 0));
  return downsample(samples, Math.max(2, maxSamples));
}

export function extractMovementPath(
  input,
  {
    minDistanceMeters = DEFAULT_MIN_DISTANCE_METERS,
    maxPoints = DEFAULT_MAX_POINTS,
  } = {},
) {
  const rawPoints = movementSourcePoints(input);
  const path = [];

  for (const sample of rawPoints) {
    const point = toPoint(sample);
    if (!point) continue;

    const previous = path.at(-1);
    if (!previous) {
      path.push(point);
      continue;
    }

    const movedMeters = haversineKm(previous, point) * 1000;
    if (movedMeters >= minDistanceMeters) {
      path.push(point);
    }
  }

  if (path.length > 1) {
    const final = toPoint(rawPoints.at(-1));
    if (final && haversineKm(path.at(-1), final) * 1000 > 0.05) {
      path.push(final);
    }
  }

  return downsample(path, Math.max(2, maxPoints));
}

export function explorationDistanceKm(exploration) {
  const path = exploration?.path ?? extractMovementPath(exploration);
  let total = 0;

  for (let index = 1; index < path.length; index += 1) {
    total += haversineKm(path[index - 1], path[index]);
  }

  return total;
}

export function sampleToStreetView(sample) {
  if (!sample) return null;
  return {
    viewpoint: { lat: sample.lat, lng: sample.lng },
    ...(Number.isFinite(sample.heading) ? { heading: sample.heading } : {}),
    ...(Number.isFinite(sample.pitch) ? { pitch: sample.pitch } : {}),
    ...(Number.isFinite(sample.fov) ? { fov: Math.min(100, Math.max(10, sample.fov)) } : {}),
    ...(sample.panoId ? { panoId: sample.panoId } : {}),
  };
}

export function nearestSampleIndex(samples, targetMs) {
  if (!Array.isArray(samples) || samples.length === 0) return -1;
  if (!Number.isFinite(targetMs)) return 0;

  let bestIndex = 0;
  let bestDelta = Infinity;
  samples.forEach((sample, index) => {
    const delta = Math.abs((sample.tMs ?? 0) - targetMs);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIndex = index;
    }
  });
  return bestIndex;
}


function movementSourcePoints(input) {
  const raw = Array.isArray(input?.samples) ? input.samples : getRawPoints(input);
  const ordered = [...raw].sort(
    (a, b) => (a?.tMs ?? 0) - (b?.tMs ?? 0) || (a?.seq ?? 0) - (b?.seq ?? 0),
  );

  const interactive =
    input?.condition === "interactive-panorama" ||
    input?.captureMode === "interactive" ||
    input?.round?.captureMode === "interactive";
  if (!interactive) return ordered;

  // OpenGuessr's iframe URL remains anchored to the original spawn while the
  // live Google Maps API camera moves. Late DOM heartbeat samples therefore can
  // falsely draw a route back to the start. When live API samples exist, they
  // are the authoritative movement trace.
  let movement = ordered.filter((sample) => sample?.source === "api");
  if (!movement.length) movement = ordered;

  // Repair both new and already-recorded runs: once Guess was submitted,
  // result-screen camera resets are UI transitions rather than exploration.
  const cutoff = explorationTerminalOffsetMs(input);
  if (Number.isFinite(cutoff)) {
    movement = movement.filter((sample) => !Number.isFinite(sample?.tMs) || sample.tMs < cutoff);
  }
  return movement;
}

function explorationTerminalOffsetMs(input) {
  const startedAtMs = Date.parse(input?.startedAt ?? input?.round?.detectedAt ?? "");
  if (!Number.isFinite(startedAtMs)) return null;

  const events = Array.isArray(input?.diagnostics?.events) ? input.diagnostics.events : [];
  const terminal =
    events.find((event) => event?.name === "prediction_intent") ??
    events.find((event) => event?.name === "result_visible") ??
    null;
  const terminalAtMs = Date.parse(terminal?.at ?? terminal?.details?.at ?? "");
  if (!Number.isFinite(terminalAtMs)) return null;
  return Math.max(0, terminalAtMs - startedAtMs);
}

function getRawPoints(input) {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.samples)) return input.samples;
  if (Array.isArray(input?.path)) return input.path;
  if (Array.isArray(input?.recorderSession?.samples)) return input.recorderSession.samples;
  return [];
}

function toPoint(sample) {
  if (!sample || !Number.isFinite(sample.lat) || !Number.isFinite(sample.lng)) {
    return null;
  }

  if (sample.lat < -90 || sample.lat > 90 || sample.lng < -180 || sample.lng > 180) {
    return null;
  }

  return {
    lat: sample.lat,
    lng: sample.lng,
    ...(Number.isFinite(sample.seq) ? { seq: sample.seq } : {}),
    ...(Number.isFinite(sample.roundIndex) ? { roundIndex: sample.roundIndex } : {}),
    ...(Number.isFinite(sample.tMs) ? { tMs: sample.tMs } : {}),
    ...(sample.capturedAt ? { capturedAt: String(sample.capturedAt) } : {}),
    ...(Number.isFinite(sample.heading) ? { heading: sample.heading } : {}),
    ...(Number.isFinite(sample.pitch) ? { pitch: sample.pitch } : {}),
    ...(Number.isFinite(sample.zoom) ? { zoom: sample.zoom } : {}),
    ...(Number.isFinite(sample.fov) ? { fov: Math.min(100, Math.max(10, sample.fov)) } : {}),
    ...(sample.panoId ? { panoId: String(sample.panoId) } : {}),
    ...(sample.source ? { source: String(sample.source) } : {}),
    ...(sample.reason ? { reason: String(sample.reason) } : {}),
    ...(sample.label ? { label: String(sample.label) } : {}),
    ...(sample.playbackActionId ? { playbackActionId: String(sample.playbackActionId) } : {}),
    ...(normalizeImageReference(sample.image) ? { image: normalizeImageReference(sample.image) } : {}),
  };
}

function normalizeKeyMoments(moments, samples) {
  if (!Array.isArray(moments)) return [];

  return moments
    .map((moment, index) => {
      const tMs = Number.isFinite(moment?.tMs)
        ? moment.tMs
        : Number.isFinite(moment?.sampleIndex) && samples[moment.sampleIndex]
          ? samples[moment.sampleIndex].tMs ?? 0
          : null;

      if (!Number.isFinite(tMs)) return null;

      return {
        id: String(moment.id ?? `moment-${index + 1}`),
        label: String(moment.label ?? `Moment ${index + 1}`),
        description: String(moment.description ?? ""),
        tMs,
        sampleIndex: nearestSampleIndex(samples, tMs),
        ...(moment.actionType ? { actionType: String(moment.actionType) } : {}),
        ...(moment.source ? { source: String(moment.source) } : {}),
        ...(moment.category ? { category: String(moment.category) } : {}),
        ...(Number.isFinite(moment.confidence) ? { confidence: Number(moment.confidence) } : {}),
        ...(moment.evidence && typeof moment.evidence === "object" ? { evidence: { ...moment.evidence } } : {}),
        ...(normalizeImageReference(moment.image) ? { image: normalizeImageReference(moment.image) } : {}),
        ...(moment.camera && typeof moment.camera === "object" ? { camera: { ...moment.camera } } : {}),
        ...(moment.reusedImage ? { reusedImage: true } : {}),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.tMs - b.tMs);
}


function normalizePlaybackActions(actions, samples) {
  if (!Array.isArray(actions)) return [];
  return actions
    .map((action, index) => {
      const tMs = Number.isFinite(action?.tMs) ? action.tMs : 0;
      const image = normalizeImageReference(action?.image);
      return {
        id: String(action?.id ?? `action-${index + 1}`),
        index: Number.isInteger(action?.index) ? action.index : index,
        type: String(action?.type ?? "view"),
        label: String(action?.label ?? "View change"),
        description: String(action?.description ?? ""),
        tMs,
        sampleIndex: Number.isInteger(action?.sampleSeq)
          ? nearestSampleIndex(samples, tMs)
          : nearestSampleIndex(samples, tMs),
        ...(Number.isInteger(action?.sampleSeq) ? { sampleSeq: action.sampleSeq } : {}),
        ...(action?.capturedAt ? { capturedAt: String(action.capturedAt) } : {}),
        ...(action?.camera && typeof action.camera === "object" ? { camera: { ...action.camera } } : {}),
        ...(image ? { image } : {}),
      };
    })
    .sort((a, b) => a.tMs - b.tMs || a.index - b.index);
}

function normalizeDepartureFrames(frames) {
  if (!Array.isArray(frames)) return [];
  return frames
    .map((frame, index) => {
      const normalized = normalizeFrameReference(frame);
      return normalized
        ? { id: String(frame?.id ?? `departure-${index + 1}`), ...normalized }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => (a.tMs ?? 0) - (b.tMs ?? 0));
}

function normalizeFrameReference(frame) {
  if (!frame || typeof frame !== "object") return null;
  const image = normalizeImageReference(frame.image);
  if (!image) return null;
  return {
    ...(Number.isFinite(frame.tMs) ? { tMs: frame.tMs } : {}),
    ...(frame.capturedAt ? { capturedAt: String(frame.capturedAt) } : {}),
    ...(frame.playbackActionId ? { playbackActionId: String(frame.playbackActionId) } : {}),
    ...(frame.camera && typeof frame.camera === "object" ? { camera: { ...frame.camera } } : {}),
    ...(frame.reusedSharpState ? { reusedSharpState: true } : {}),
    image,
  };
}

function normalizeVideoReference(video) {
  if (!video || typeof video !== "object") return null;
  const path = typeof video.path === "string" && video.path.trim() ? video.path.trim() : null;
  if (!path) return null;
  const crop = normalizeVideoCrop(video.crop);
  return {
    path,
    ...(video.captureId ? { captureId: String(video.captureId) } : {}),
    ...(video.metadataPath ? { metadataPath: String(video.metadataPath) } : {}),
    ...(video.mimeType ? { mimeType: String(video.mimeType) } : {}),
    ...(Number.isFinite(video.width) ? { width: video.width } : {}),
    ...(Number.isFinite(video.height) ? { height: video.height } : {}),
    ...(video.captureStartedAt ? { captureStartedAt: String(video.captureStartedAt) } : {}),
    ...(Number.isFinite(video.captureStartedAtMs) ? { captureStartedAtMs: video.captureStartedAtMs } : {}),
    roundOffsetMs: Number.isFinite(video.roundOffsetMs) ? Math.max(0, video.roundOffsetMs) : 0,
    ...(crop ? { crop } : {}),
  };
}

function normalizeVideoCrop(crop) {
  const rect = crop?.rect;
  const viewport = crop?.viewport;
  if (!rect || !viewport) return null;
  const values = [rect.x, rect.y, rect.width, rect.height, viewport.width, viewport.height]
    .map(Number);
  if (!values.every(Number.isFinite) || values[2] <= 0 || values[3] <= 0 || values[4] <= 0 || values[5] <= 0) {
    return null;
  }
  return {
    rect: { x: values[0], y: values[1], width: values[2], height: values[3] },
    viewport: {
      width: values[4],
      height: values[5],
      ...(Number.isFinite(Number(viewport.devicePixelRatio))
        ? { devicePixelRatio: Number(viewport.devicePixelRatio) }
        : {}),
    },
    ...(crop.target && typeof crop.target === "object" ? { target: { ...crop.target } } : {}),
  };
}

function isSemanticKeyMoment(moment) {
  const id = String(moment?.id ?? "").toLowerCase();
  const source = String(moment?.source ?? "").toLowerCase();

  // Explicit annotation sources always win, even if someone deliberately reuses
  // an older-looking identifier.
  if (["agent", "manual", "human", "annotation", "semantic"].includes(source)) {
    return true;
  }

  const automaticIds = new Set([
    "exploration-start",
    "first-movement",
    "strongest-zoom",
    "prediction-submitted",
    "video-start",
    "video-final-view",
    "nmpz-start",
    "round-end",
  ]);

  if (automaticIds.has(id)) return false;
  if (id.startsWith("video-action-")) return false;
  if (id.startsWith("action-")) return false;

  return true;
}

function normalizeImageReference(image) {
  if (!image || typeof image !== "object") return null;
  const path = typeof image.path === "string" && image.path.trim() ? image.path.trim() : null;
  const filename = typeof image.filename === "string" && image.filename.trim() ? image.filename.trim() : null;
  if (!path && !filename) return null;
  return {
    ...(path ? { path } : {}),
    ...(filename ? { filename } : {}),
    ...(image.status ? { status: String(image.status) } : {}),
    ...(image.storageMethod ? { storageMethod: String(image.storageMethod) } : {}),
    ...(Number.isFinite(image.width) ? { width: image.width } : {}),
    ...(Number.isFinite(image.height) ? { height: image.height } : {}),
    ...(image.captureQuality ? { captureQuality: String(image.captureQuality) } : {}),
    ...(Number.isFinite(image.captureAttempts) ? { captureAttempts: image.captureAttempts } : {}),
    ...(Number.isFinite(image.captureDelayMs) ? { captureDelayMs: image.captureDelayMs } : {}),
    ...(Number.isFinite(image.sharpness) ? { sharpness: image.sharpness } : {}),
    ...(Number.isFinite(image.stabilityDifference) ? { stabilityDifference: image.stabilityDifference } : {}),
    ...(image.existing ? { existing: true } : {}),
  };
}

function inferDurationMs(samples, path) {
  const series = samples.length ? samples : path;
  if (!series.length) return null;
  const max = Math.max(...series.map((sample) => sample.tMs ?? 0));
  return Number.isFinite(max) && max > 0 ? max : null;
}

function summarizeSources(samples) {
  const counts = {};
  for (const sample of samples) {
    const key = sample.source || "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function downsample(points, maxPoints) {
  if (points.length <= maxPoints) return points;

  const result = [points[0]];
  const step = (points.length - 1) / (maxPoints - 1);

  for (let index = 1; index < maxPoints - 1; index += 1) {
    result.push(points[Math.round(index * step)]);
  }

  result.push(points.at(-1));
  return result;
}
