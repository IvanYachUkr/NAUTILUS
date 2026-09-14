import { formatDistance } from "./geo.js";
import { comparisonColor } from "./comparison-colors.js";

const DIFFICULTY_LABELS = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const DIFFICULTY_COLORS = {
  easy: "#38bdf8",
  medium: "#fbbf24",
  hard: "#fb7185",
};
export function buildGlobeSceneData({
  cases = [],
  caseItem = null,
  run = null,
  overviewRuns = [],
  comparisonRuns = [],
  overview = !caseItem,
  playback = null,
} = {}) {
  if (overview || !caseItem) {
    const locationById = new Map(cases.map((item) => [item.id, item]));
    const points = cases
      .filter((item) => hasCoordinate(item?.groundTruth))
      .map((item) => ({
        kind: "location",
        caseId: item.id,
        lat: item.groundTruth.lat,
        lng: item.groundTruth.lng,
        label: `${item.city}, ${item.country} · ${DIFFICULTY_LABELS[item.difficulty] ?? item.difficulty}`,
        color: DIFFICULTY_COLORS[item.difficulty] ?? "#38bdf8",
        radius: 0.44,
        altitude: 0.026,
      }));
    const arcs = [];

    for (const entry of overviewRuns) {
      const item = locationById.get(entry?.caseId);
      const predictionRun = entry?.run;
      if (!item || !hasCoordinate(item.groundTruth) || !hasCoordinate(predictionRun?.prediction)) {
        continue;
      }

      const pinError = formatDistance(predictionRun.errorKm);
      points.push({
        kind: "prediction",
        caseId: item.id,
        runId: predictionRun.id,
        lat: predictionRun.prediction.lat,
        lng: predictionRun.prediction.lng,
        label: `${predictionRun.model} prediction · ${item.city}, ${item.country} · ${pinError} pin error`,
        color: "#ff8a30",
        radius: 0.24,
        altitude: 0.105,
      });
      arcs.push({
        kind: "overview-error",
        caseId: item.id,
        runId: predictionRun.id,
        startLat: item.groundTruth.lat,
        startLng: item.groundTruth.lng,
        endLat: predictionRun.prediction.lat,
        endLng: predictionRun.prediction.lng,
        label: `${predictionRun.model} · ${pinError} pin error`,
        color: ["#355071", "#ff8a30"],
        stroke: 0.18,
        altitudeScale: 0.08,
      });
    }

    return {
      points,
      arcs,
      paths: [],
      labels: [],
    };
  }

  const points = [];
  const arcs = [];
  const paths = [];
  const labels = [];
  const runId = run?.id ?? null;

  if (hasCoordinate(caseItem.groundTruth)) {
    points.push({
      kind: "truth",
      caseId: caseItem.id,
      runId,
      lat: caseItem.groundTruth.lat,
      lng: caseItem.groundTruth.lng,
      label: `Truth · ${caseItem.groundTruth.label || `${caseItem.city}, ${caseItem.country}`}`,
      color: "#b7f34a",
      radius: 0.48,
      altitude: 0.045,
    });
  }

  const renderedRuns = comparisonRuns.length ? comparisonRuns : run ? [run] : [];
  renderedRuns.forEach((predictionRun, index) => {
    if (!hasCoordinate(predictionRun.prediction)) return;
    const comparisonLabel = predictionRun.comparisonLabel ?? predictionRun.model;
    const color = comparisonRuns.length
      ? comparisonColor(predictionRun.comparisonColorKey ?? predictionRun.model)
      : "#ff8a30";
    points.push({
      kind: "prediction",
      caseId: caseItem.id,
      runId: predictionRun.id,
      lat: predictionRun.prediction.lat,
      lng: predictionRun.prediction.lng,
      label: `${comparisonLabel} · ${formatDistance(predictionRun.errorKm)} pin error`,
      color,
      radius: comparisonRuns.length ? 0.38 : 0.44,
      altitude: 0.055 + index * 0.004,
    });
    if (comparisonRuns.length) {
      labels.push({
        kind: "prediction-label",
        caseId: caseItem.id,
        runId: predictionRun.id,
        lat: predictionRun.prediction.lat,
        lng: predictionRun.prediction.lng,
        text: comparisonLabel,
        label: `${comparisonLabel} · ${formatDistance(predictionRun.errorKm)} pin error`,
        color,
        altitude: 0.078 + index * 0.012,
      });
    }

    if (hasCoordinate(caseItem.groundTruth)) {
      arcs.push({
        kind: "error",
        caseId: caseItem.id,
        runId: predictionRun.id,
        startLat: caseItem.groundTruth.lat,
        startLng: caseItem.groundTruth.lng,
        endLat: predictionRun.prediction.lat,
        endLng: predictionRun.prediction.lng,
        label: comparisonRuns.length
          ? `${comparisonLabel} · ${formatDistance(predictionRun.errorKm)} pin error`
          : `${formatDistance(predictionRun.errorKm)} pin error`,
        color: ["#b7f34a", color],
      });
    }
  });

  const route = (comparisonRuns.length ? [] : run?.exploration?.path ?? [])
    .filter(hasCoordinate)
    .map((sample) => [sample.lat, sample.lng, 0.012]);

  if (route.length > 1) {
    paths.push({
      kind: "exploration",
      caseId: caseItem.id,
      runId,
      label: "Recorded exploration",
      color: "#60a5fa",
      points: route,
    });
  }

  const playbackTrace = (playback?.trace ?? [])
    .filter(hasCoordinate)
    .map((sample) => [sample.lat, sample.lng, 0.022]);

  if (playbackTrace.length > 1) {
    paths.push({
      kind: "playback",
      caseId: caseItem.id,
      runId,
      label: "Travelled playback trace",
      color: "#f472b6",
      points: playbackTrace,
    });
  }

  if (hasCoordinate(playback?.sample)) {
    points.push({
      kind: "playback",
      caseId: caseItem.id,
      runId,
      lat: playback.sample.lat,
      lng: playback.sample.lng,
      label: `Playback · ${formatPlaybackTime(playback.sample.tMs)}`,
      color: "#f472b6",
      radius: 0.38,
      altitude: 0.07,
    });
  }

  return { points, arcs, paths, labels };
}

function formatPlaybackTime(tMs = 0) {
  return `${((tMs ?? 0) / 1000).toFixed(1)} s`;
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
