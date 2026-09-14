import { appendFile, mkdir } from "node:fs/promises";
import { basename, join, relative } from "node:path";
import { haversineKm } from "../../src/geo.js";
import {
  DATA_DIR,
  RECORDINGS_INBOX_DIR,
  RECORDINGS_SESSIONS_DIR,
  RECORDINGS_CHECKPOINTS_DIR,
  ROOT,
  safeSlug,
  writeJsonAtomic,
} from "./workspace.mjs";

export const DEFAULT_LOCATION_MATCH_THRESHOLD_METERS = 300;

export function extractRecordingStart(recording) {
  const candidates = [
    recording?.round?.spawnRequested,
    recording?.round?.actualStart,
    recording?.spawnRequested,
    recording?.actualStart,
    recording?.rounds?.[0]?.spawnRequested,
    recording?.rounds?.[0]?.actualStart,
    recording?.samples?.[0],
  ];

  for (const candidate of candidates) {
    if (isCoordinate(candidate)) {
      return { lat: Number(candidate.lat), lng: Number(candidate.lng) };
    }
  }
  return null;
}

export function matchRecordingToLocation(
  recording,
  locations,
  competitions,
  { thresholdMeters = DEFAULT_LOCATION_MATCH_THRESHOLD_METERS } = {},
) {
  if (recording?.atlasLocationId) {
    const exact = locations.find((location) => location.id === recording.atlasLocationId);
    if (exact) {
      return {
        location: exact,
        membership: chooseMembership(exact, recording.competitionId),
        distanceMeters: 0,
        method: "explicit-atlas-location-id",
      };
    }
  }

  if (recording?.locationId) {
    let candidates = locations.filter(
      (location) =>
        location.id === recording.locationId || location.localId === recording.locationId,
    );
    if (recording.competitionId) {
      candidates = candidates.filter((location) =>
        location.competitions?.some(
          (membership) => membership.competitionId === recording.competitionId,
        ),
      );
    }
    if (candidates.length === 1) {
      const exact = candidates[0];
      return {
        location: exact,
        membership: chooseMembership(exact, recording.competitionId),
        distanceMeters: 0,
        method: "explicit-location-id",
      };
    }
  }

  const start = extractRecordingStart(recording);
  const competitionId = recording?.competitionId;

  if (!start && competitionId) {
    const competition = competitions.find((item) => item.id === competitionId);
    const overallIndex = deriveCompetitionOverallIndex(recording);
    const atlasLocationId =
      competition && Number.isInteger(overallIndex)
        ? competition.locationIds[overallIndex - 1]
        : null;
    const location = atlasLocationId
      ? locations.find((item) => item.id === atlasLocationId)
      : null;
    if (location) {
      return {
        location,
        membership: chooseMembership(location, competitionId),
        distanceMeters: null,
        method: "competition-round-order",
      };
    }
  }

  if (!start) return null;

  let candidates = locations;
  if (competitionId) {
    const competition = competitions.find((item) => item.id === competitionId);
    if (competition) {
      const allowed = new Set(competition.locationIds);
      candidates = locations.filter((location) => allowed.has(location.id));
    }
  }

  let best = null;
  for (const location of candidates) {
    const distanceMeters = haversineKm(start, location.groundTruth) * 1000;
    if (!best || distanceMeters < best.distanceMeters) {
      best = {
        location,
        membership: chooseMembership(location, competitionId),
        distanceMeters,
        method: "nearest-start-coordinate",
      };
    }
  }

  return best && best.distanceMeters <= thresholdMeters ? best : null;
}

export function validateRoundRecording(recording) {
  const errors = [];
  if (!recording || typeof recording !== "object" || Array.isArray(recording)) {
    return ["Recording body must be a JSON object."];
  }

  if (!Array.isArray(recording.samples)) errors.push("samples must be an array.");
  if (!isNonEmptyString(recording.model)) errors.push("model must be a non-empty string.");
  if (!["static-image", "interactive-panorama"].includes(recording.condition)) {
    errors.push("condition must be static-image or interactive-panorama.");
  }
  if (recording.prediction && !isCoordinate(recording.prediction)) {
    errors.push("prediction must contain finite lat and lng values when present.");
  }
  if (
    !extractRecordingStart(recording) &&
    !(
      isNonEmptyString(recording.competitionId) &&
      Number.isInteger(deriveCompetitionOverallIndex(recording))
    )
  ) {
    errors.push(
      "recording must contain a starting coordinate, or a competitionId plus a round number for order-based matching.",
    );
  }

  return errors;
}

export async function saveRoundRecording({
  recording,
  locations,
  competitions,
  receivedAt = new Date().toISOString(),
}) {
  const errors = validateRoundRecording(recording);
  if (errors.length) {
    const error = new TypeError(`Invalid round recording:\n- ${errors.join("\n- ")}`);
    error.validationErrors = errors;
    throw error;
  }

  const match = matchRecordingToLocation(recording, locations, competitions);
  const membership = match?.membership ?? null;
  const competitionId = safeSlug(
    recording.competitionId ?? membership?.competitionId,
    "unassigned",
  );
  const localLocationId = match?.location?.localId ?? recording.locationId ?? null;
  const locationFolder = safeSlug(localLocationId, "unmatched-location");
  const startedAt = safeTimestamp(recording.startedAt ?? receivedAt);
  const model = safeSlug(recording.model, "unknown-model");
  const condition = safeSlug(recording.condition, "unknown-condition");
  const roundId = safeSlug(
    recording.round?.id ?? recording.id ?? `round-${Date.now()}`,
    `round-${Date.now()}`,
  );

  const directory = join(RECORDINGS_INBOX_DIR, competitionId, locationFolder);
  await mkdir(directory, { recursive: true });

  const filename = `${startedAt}__${model}__${condition}__${roundId}.json`;
  const path = await uniquePath(directory, filename);

  const enriched = {
    ...recording,
    schemaVersion: recording.schemaVersion ?? "2.0",
    recordingType: recording.recordingType ?? "openguessr-round",
    receivedAt,
    competitionId: recording.competitionId ?? membership?.competitionId ?? "unassigned",
    competitionPartId: recording.competitionPartId ?? membership?.partId ?? null,
    competitionPart: recording.competitionPart ?? membership?.part ?? null,
    competitionRound: recording.competitionRound ?? membership?.round ?? null,
    competitionOverallIndex:
      recording.competitionOverallIndex ?? membership?.overallIndex ?? null,
    atlasLocationId: match?.location?.id ?? null,
    locationId: localLocationId,
    locationMatch: match
      ? {
          method: match.method,
          distanceMeters: Number.isFinite(match.distanceMeters)
            ? Number(match.distanceMeters.toFixed(3))
            : null,
        }
      : null,
  };

  await writeJsonAtomic(path, enriched);

  const indexEntry = {
    receivedAt,
    id: enriched.id ?? null,
    sessionId: enriched.sessionId ?? null,
    competitionId: enriched.competitionId,
    competitionPartId: enriched.competitionPartId,
    competitionRound: enriched.competitionRound,
    atlasLocationId: enriched.atlasLocationId,
    locationId: enriched.locationId,
    model: enriched.model,
    condition: enriched.condition,
    prediction: enriched.prediction ?? null,
    path: relative(ROOT, path).replaceAll("\\", "/"),
  };
  await appendFile(
    join(DATA_DIR, "recordings", "index.jsonl"),
    `${JSON.stringify(indexEntry)}\n`,
    "utf8",
  );

  return {
    path,
    relativePath: indexEntry.path,
    recording: enriched,
    match,
  };
}

export async function saveRecordingCheckpoint({
  checkpoint,
  receivedAt = new Date().toISOString(),
}) {
  if (!checkpoint || typeof checkpoint !== "object" || Array.isArray(checkpoint)) {
    throw new TypeError("Checkpoint body must be a JSON object.");
  }

  const competitionId = safeSlug(
    checkpoint.settings?.competitionId ??
      checkpoint.status?.session?.competitionId ??
      "unassigned",
    "unassigned",
  );
  const sessionId = safeSlug(
    checkpoint.status?.session?.id ?? checkpoint.id ?? `checkpoint-${Date.now()}`,
    `checkpoint-${Date.now()}`,
  );
  const savedAt = safeTimestamp(checkpoint.savedAt ?? receivedAt);
  const directory = join(RECORDINGS_CHECKPOINTS_DIR, competitionId, sessionId);
  await mkdir(directory, { recursive: true });
  const path = await uniquePath(directory, `${savedAt}__live-state.json`);

  const enriched = {
    ...checkpoint,
    schemaVersion: checkpoint.schemaVersion ?? "1.0",
    checkpointType: checkpoint.checkpointType ?? "openguessr-live-state",
    receivedAt,
  };
  await writeJsonAtomic(path, enriched);
  return {
    path,
    relativePath: relative(ROOT, path).replaceAll("\\", "/"),
    checkpoint: enriched,
  };
}

export async function saveCompetitionSession({ session, receivedAt = new Date().toISOString() }) {
  if (!session || typeof session !== "object" || Array.isArray(session)) {
    throw new TypeError("Session body must be a JSON object.");
  }
  if (!isNonEmptyString(session.sessionId)) {
    throw new TypeError("sessionId must be a non-empty string.");
  }

  const competitionId = safeSlug(session.competitionId, "unassigned");
  const sessionId = safeSlug(session.sessionId, `session-${Date.now()}`);
  const directory = join(RECORDINGS_SESSIONS_DIR, competitionId);
  await mkdir(directory, { recursive: true });
  const path = join(directory, `${sessionId}.json`);

  const enriched = {
    ...session,
    schemaVersion: session.schemaVersion ?? "1.0",
    receivedAt,
    updatedAt: session.updatedAt ?? receivedAt,
  };
  await writeJsonAtomic(path, enriched);
  return {
    path,
    relativePath: relative(ROOT, path).replaceAll("\\", "/"),
    session: enriched,
  };
}

function deriveCompetitionOverallIndex(recording) {
  const candidates = [
    recording?.competitionOverallIndex,
    recording?.round?.pageRoundNumber,
    Number.isInteger(recording?.round?.index)
      ? recording.round.index + 1
      : null,
    recording?.rounds?.[0]?.pageRoundNumber,
    Number.isInteger(recording?.rounds?.[0]?.index)
      ? recording.rounds[0].index + 1
      : null,
  ];
  for (const candidate of candidates) {
    const number = Number(candidate);
    if (Number.isInteger(number) && number > 0) return number;
  }
  return null;
}

function chooseMembership(location, competitionId) {
  if (!Array.isArray(location?.competitions)) return null;
  return (
    location.competitions.find(
      (membership) => membership.competitionId === competitionId,
    ) ?? location.competitions[0] ?? null
  );
}

function isCoordinate(value) {
  if (value?.lat === null || value?.lat === "" || value?.lat === undefined) return false;
  if (value?.lng === null || value?.lng === "" || value?.lng === undefined) return false;
  return (
    Number.isFinite(Number(value.lat)) &&
    Number(value.lat) >= -90 &&
    Number(value.lat) <= 90 &&
    Number.isFinite(Number(value.lng)) &&
    Number(value.lng) >= -180 &&
    Number(value.lng) <= 180
  );
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function safeTimestamp(value) {
  const date = new Date(value);
  const iso = Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  return iso.replaceAll(":", "-").replaceAll(".", "-");
}

async function uniquePath(directory, filename) {
  const { exists } = await import("./workspace.mjs");
  const initial = join(directory, filename);
  if (!(await exists(initial))) return initial;

  const extension = ".json";
  const stem = basename(filename, extension);
  for (let index = 2; index < 10_000; index += 1) {
    const candidate = join(directory, `${stem}__${index}${extension}`);
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error(`Unable to allocate a unique recording filename in ${directory}.`);
}
