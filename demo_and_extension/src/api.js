export { createExplorer } from "./app.js";
export {
  assertValidCases,
  normalizeCases,
  upsertCase,
  validateCases,
} from "./data-contract.js";
export {
  extractMovementPath,
  extractTimelineSamples,
  explorationDistanceKm,
  nearestSampleIndex,
  normalizeExploration,
  sampleToStreetView,
} from "./exploration.js";
export {
  buildStreetViewUrl,
  errorBand,
  formatCoordinate,
  formatDistance,
  haversineKm,
} from "./geo.js";

export async function loadCasesFromUrl(url, { signal, fetchImpl = fetch } = {}) {
  const response = await fetchImpl(url, {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Unable to load case data (${response.status} ${response.statusText}).`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload : payload.cases;
}
