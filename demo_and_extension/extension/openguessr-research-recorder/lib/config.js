export const EXTENSION_VERSION = "0.7.8";
export const RECORDER_NAME = "OpenGuessr Research Round Recorder";

export const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  collectorUrl: "http://127.0.0.1:4173/api/recordings",
  competitionId: "europe-easy",
  model: "GPT-5.6 Sol",
  condition: "interactive-panorama",
  fallbackDownload: true,
  downloadSubfolder: "openguessr-research-recordings",
  sampleIntervalMs: 250,
  positionThresholdM: 0.5,
  angleThresholdDeg: 1,
  pitchThresholdDeg: 1,
  zoomThreshold: 0.05,
  maxSilentIntervalMs: 2000,
  maxSamples: 50000
});

export async function loadSettings() {
  const stored = await chrome.storage.local.get("settings");
  return { ...DEFAULT_SETTINGS, ...(stored.settings ?? {}) };
}

export async function saveSettings(next) {
  const settings = sanitizeSettings({ ...DEFAULT_SETTINGS, ...next });
  await chrome.storage.local.set({ settings });
  return settings;
}

export function sanitizeSettings(value) {
  const collectorUrl = normalizeCollectorUrl(value.collectorUrl);
  return {
    enabled: value.enabled !== false,
    collectorUrl,
    competitionId: nonEmpty(value.competitionId, "unassigned"),
    model: nonEmpty(value.model, "Unknown model"),
    condition:
      value.condition === "static-image"
        ? "static-image"
        : "interactive-panorama",
    fallbackDownload: value.fallbackDownload !== false,
    downloadSubfolder: safeRelativeFolder(
      value.downloadSubfolder,
      "openguessr-research-recordings",
    ),
    sampleIntervalMs: boundedNumber(value.sampleIntervalMs, 50, 5000, 250),
    positionThresholdM: boundedNumber(value.positionThresholdM, 0, 100, 0.5),
    angleThresholdDeg: boundedNumber(value.angleThresholdDeg, 0, 180, 1),
    pitchThresholdDeg: boundedNumber(value.pitchThresholdDeg, 0, 180, 1),
    zoomThreshold: boundedNumber(value.zoomThreshold, 0, 10, 0.05),
    maxSilentIntervalMs: boundedNumber(
      value.maxSilentIntervalMs,
      250,
      30000,
      2000,
    ),
    maxSamples: Math.round(boundedNumber(value.maxSamples, 100, 100000, 50000)),
  };
}

function normalizeCollectorUrl(value) {
  const fallback = DEFAULT_SETTINGS.collectorUrl;
  try {
    const url = new URL(String(value ?? fallback));
    if (!["http:", "https:"].includes(url.protocol)) return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
}

function safeRelativeFolder(value, fallback) {
  const normalized = String(value ?? "")
    .replaceAll("\\", "/")
    .split("/")
    .map((part) =>
      part
        .trim()
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/^\.+$/, ""),
    )
    .filter(Boolean)
    .join("/");
  return normalized || fallback;
}

function nonEmpty(value, fallback) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function boundedNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}
