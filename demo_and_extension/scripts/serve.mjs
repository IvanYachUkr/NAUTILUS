import { createReadStream, existsSync, statSync } from "node:fs";
import { appendFile, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  OPEN_GUESSR_COMPETITION_MAX_LOCATIONS,
  buildData,
} from "./build-data.mjs";
import {
  matchRecordingToLocation,
  saveCompetitionSession,
  saveRecordingCheckpoint,
  saveRoundRecording,
} from "./lib/recordings.mjs";
import { loadClueDocuments, saveClueDocument } from "./lib/clues.mjs";
import { haversineKm } from "../src/geo.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = Number.parseInt(process.argv[2] ?? process.env.PORT ?? "4173", 10);
const host = process.env.HOST ?? "127.0.0.1";
const MAX_BODY_BYTES = 20 * 1024 * 1024;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new RangeError("Port must be an integer between 1 and 65535.");
}

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".webm", "video/webm"],
  [".ico", "image/x-icon"],
  [".txt", "text/plain; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
]);

let workspace = await buildData({ quiet: true });

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? `${host}:${port}`}`,
    );

    if (requestUrl.pathname.startsWith("/api/")) {
      await handleApi(request, response, requestUrl);
      return;
    }

    serveStatic(response, requestUrl);
  } catch (error) {
    if (!response.headersSent) {
      const status =
        Number.isInteger(error?.statusCode)
          ? error.statusCode
          : error instanceof SyntaxError || error instanceof TypeError
            ? 400
            : 500;
      respondJson(response, status, {
        ok: false,
        error: error instanceof Error ? error.message : "Server error",
      });
    } else {
      response.destroy(error instanceof Error ? error : undefined);
    }
  }
});

server.listen(port, host, () => {
  console.log(`Geo Evidence Atlas running at http://${host}:${port}`);
  console.log(`Round collector: http://${host}:${port}/api/recordings`);
  console.log(`Starting images: http://${host}:${port}/api/starting-images`);
  console.log(`Exploration images: http://${host}:${port}/api/exploration-images`);
  console.log(`Exploration video: http://${host}:${port}/api/exploration-video-chunks`);
  console.log(
    `Loaded ${workspace.locations.length} locations and ${workspace.competitions.length} competition setups.`,
  );
  console.log("Press Ctrl+C to stop.");
});

async function handleApi(request, response, url) {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    respondJson(response, 200, {
      ok: true,
      service: "geo-evidence-atlas-collector",
      version: "0.8.17",
      supportsCheckpoints: true,
      supportsStartingImages: true,
      supportsExplorationImages: true,
      supportsExplorationVideos: true,
      locations: workspace.locations.length,
      competitions: workspace.competitions.map((competition) => ({
        id: competition.id,
        name: competition.name,
        shortName: competition.shortName,
        datasetId: competition.datasetId,
        order: competition.order,
        count: competition.locationIds.length,
        partCount: competition.parts.length,
        parts: competition.parts.map((part) => ({
          id: part.id,
          part: part.part,
          count: part.locationIds.length,
        })),
      })),
      maxCompetitionLocations: OPEN_GUESSR_COMPETITION_MAX_LOCATIONS,
      recordings: workspace.recordings.length,
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/clues") {
    const errors = [];
    const documents = await loadClueDocuments({ errors });
    if (errors.length) throw new TypeError(errors.join("\n"));
    respondJson(response, 200, {
      ok: true,
      documents: documents.map((document) => ({
        ...document,
        imagePath: startingImagePathForAtlasLocation(document.locationId),
        ...clueReviewMapContext(document.locationId),
      })),
    });
    return;
  }

  const clueDocumentMatch = /^\/api\/clues\/([^/]+)$/.exec(url.pathname);
  if (request.method === "PUT" && clueDocumentMatch) {
    const locationId = decodeURIComponent(clueDocumentMatch[1]);
    const document = await readJsonBody(request, MAX_BODY_BYTES);
    if (document?.locationId !== locationId) {
      throw new TypeError("The URL location ID must match document.locationId.");
    }
    const filename = await saveClueDocument(document);
    workspace = await buildData({ quiet: true });
    respondJson(response, 200, { ok: true, locationId, filename });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/recordings") {
    const recording = await readJsonBody(request, MAX_BODY_BYTES);
    const saved = await saveRoundRecording({
      recording,
      locations: workspace.locations,
      competitions: workspace.competitions,
    });

    // Rebuild generated indexes and attach the newest matching recording to an
    // existing result run. The browser can then refresh and see it immediately.
    workspace = await buildData({ quiet: true });

    const matchedCompetition = workspace.competitions.find(
      (competition) => competition.id === saved.recording.competitionId,
    );

    respondJson(response, 201, {
      ok: true,
      path: saved.relativePath,
      locationId: saved.recording.locationId,
      locationMatchDistanceMeters:
        saved.recording.locationMatch?.distanceMeters ?? null,
      recordingId: saved.recording.id ?? null,
      atlasLocationId: saved.recording.atlasLocationId ?? null,
      competitionPartId: saved.recording.competitionPartId ?? null,
      competitionPart: saved.recording.competitionPart ?? null,
      competitionRound: saved.recording.competitionRound ?? null,
      competitionOverallIndex: saved.recording.competitionOverallIndex ?? null,
      competitionLocationCount: matchedCompetition?.locationIds.length ?? null,
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/starting-images") {
    const payload = await readJsonBody(request, MAX_BODY_BYTES);
    const saved = await saveStartingImage(payload);
    respondJson(response, saved.created ? 201 : 200, {
      ok: true,
      created: saved.created,
      existing: !saved.created,
      path: saved.relativePath,
      competitionId: saved.competitionId,
      competitionRound: saved.competitionRound,
      locationId: saved.locationId,
      width: saved.width,
      height: saved.height,
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/exploration-images") {
    const payload = await readJsonBody(request, MAX_BODY_BYTES);
    const saved = await saveExplorationImage(payload);
    respondJson(response, saved.created ? 201 : 200, {
      ok: true,
      created: saved.created,
      existing: !saved.created,
      path: saved.relativePath,
      competitionId: saved.competitionId,
      competitionRound: saved.competitionRound,
      locationId: saved.locationId,
      sessionId: saved.sessionId,
      actionId: saved.actionId,
      actionIndex: saved.actionIndex,
      sampleSeq: saved.sampleSeq,
      tMs: saved.tMs,
      width: saved.width,
      height: saved.height,
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/exploration-video-chunks") {
    const saved = await saveExplorationVideoChunk(request, url);
    respondJson(response, 201, { ok: true, ...saved });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/exploration-videos/finalize") {
    const payload = await readJsonBody(request, 2 * 1024 * 1024);
    const saved = await finalizeExplorationVideo(payload);
    respondJson(response, 201, { ok: true, ...saved });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/checkpoints") {
    const checkpoint = await readJsonBody(request, MAX_BODY_BYTES);
    const saved = await saveRecordingCheckpoint({ checkpoint });
    respondJson(response, 201, {
      ok: true,
      path: saved.relativePath,
      checkpointId: saved.checkpoint.id ?? null,
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/sessions") {
    const session = await readJsonBody(request, 2 * 1024 * 1024);
    const saved = await saveCompetitionSession({ session });
    respondJson(response, 200, {
      ok: true,
      path: saved.relativePath,
      sessionId: saved.session.sessionId,
      roundCount: Array.isArray(saved.session.rounds) ? saved.session.rounds.length : 0,
    });
    return;
  }

  respondJson(response, 404, { ok: false, error: "API endpoint not found." });
}

function clueReviewMapContext(locationId) {
  const caseItem = workspace.atlasCases.find((item) => item.id === locationId);
  if (!caseItem) return { mapCase: null, predictionsByBenchmarkId: {} };
  const predictionsByBenchmarkId = {};
  for (const run of caseItem.runs ?? []) {
    if (run.runKind !== "model-prediction" || !run.benchmarkId || predictionsByBenchmarkId[run.benchmarkId]) continue;
    predictionsByBenchmarkId[run.benchmarkId] = {
      id: run.id,
      model: run.model,
      condition: run.condition,
      prediction: run.prediction,
      errorKm: run.prediction ? haversineKm(caseItem.groundTruth, run.prediction) : null,
      bestRunId: run.bestRunId ?? null,
      bestRunLabel: run.bestRunLabel ?? null,
    };
  }
  return {
    mapCase: {
      id: caseItem.id,
      city: caseItem.city,
      country: caseItem.country,
      groundTruth: caseItem.groundTruth,
      startingView: caseItem.startingView,
    },
    predictionsByBenchmarkId,
  };
}

function startingImagePathForAtlasLocation(locationId) {
  const match = /^(.+)--(loc-\d+)$/.exec(String(locationId));
  if (!match) throw new TypeError(`Invalid atlas location ID: ${locationId}`);
  return `data/starting-images/${match[1]}/${match[2].replace("-", "_")}.png`;
}

function serveStatic(response, requestUrl) {
  const decodedPath = decodeURIComponent(requestUrl.pathname);
  const relativePath = normalize(decodedPath).replace(/^([/\\])+/, "");
  let filePath = resolve(join(root, relativePath || "index.html"));

  if (!filePath.startsWith(root)) {
    respondText(response, 403, "Forbidden");
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    respondText(response, 404, "Not found");
    return;
  }

  const type =
    mimeTypes.get(extname(filePath).toLowerCase()) ?? "application/octet-stream";
  response.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": filePath.endsWith("index.html")
      ? "no-cache"
      : "public, max-age=60",
    "X-Content-Type-Options": "nosniff",
  });
  createReadStream(filePath).pipe(response);
}

async function readJsonBody(request, maxBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) {
      const error = new Error(
        `Request body exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB limit.`,
      );
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  const text = Buffer.concat(chunks).toString("utf8");
  if (!text.trim()) throw new TypeError("Request body is empty.");
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new SyntaxError(
      `Request body is not valid JSON: ${error instanceof Error ? error.message : error}`,
    );
  }
}

async function readBinaryBody(request, maxBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) {
      const error = new Error(
        `Request body exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB limit.`,
      );
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (!chunks.length) throw new TypeError("Request body is empty.");
  return Buffer.concat(chunks);
}

async function saveExplorationVideoChunk(request, url) {
  const competitionId = String(url.searchParams.get("competitionId") ?? "").trim();
  const captureId = String(url.searchParams.get("captureId") ?? "").trim();
  const competitionRound = Number(url.searchParams.get("competitionRound"));
  const sessionId = String(url.searchParams.get("sessionId") ?? "session").trim() || "session";
  const roundId = String(url.searchParams.get("roundId") ?? "").trim() || null;
  const sequence = Number(url.searchParams.get("sequence"));
  if (!competitionId) throw new TypeError("competitionId is required for a video chunk.");
  if (!captureId) throw new TypeError("captureId is required for a video chunk.");
  if (!Number.isInteger(sequence) || sequence < 0) {
    throw new TypeError("sequence must be a non-negative integer.");
  }
  const competition = workspace.competitions.find((item) => item.id === competitionId);
  if (!competition) {
    const error = new Error(`Unknown competition: ${competitionId}`);
    error.statusCode = 404;
    throw error;
  }

  const bytes = await readBinaryBody(request, 8 * 1024 * 1024);
  const safeCompetition = safePathPart(competitionId, "competition");
  const safeCapture = safePathPart(captureId, "capture");
  const partialRoot = join(root, "data", "exploration-videos", safeCompetition, ".partial");
  const captureDirectory = join(partialRoot, safeCapture);
  const chunkPath = join(captureDirectory, `chunk-${String(sequence).padStart(6, "0")}.webm`);
  const partialMetadataPath = join(captureDirectory, "capture.json");
  await mkdir(captureDirectory, { recursive: true });

  // Chunks are stored by sequence rather than appended blindly. A retry of the
  // same request is therefore idempotent and cannot duplicate bytes in the WebM.
  const duplicate = existsSync(chunkPath);
  if (!duplicate) await writeFile(chunkPath, bytes);

  let previous = {};
  if (existsSync(partialMetadataPath)) {
    try {
      previous = JSON.parse(await readFile(partialMetadataPath, "utf8"));
    } catch {
      previous = {};
    }
  }
  const seenSequences = new Set(
    Array.isArray(previous.sequences) ? previous.sequences.filter(Number.isInteger) : [],
  );
  seenSequences.add(sequence);
  const partialMetadata = {
    schemaVersion: "1.0-partial",
    captureId,
    competitionId,
    competitionRound: Number.isInteger(competitionRound) && competitionRound > 0 ? competitionRound : null,
    sessionId,
    roundId,
    mimeType: String(url.searchParams.get("mimeType") ?? previous.mimeType ?? "video/webm"),
    sequences: [...seenSequences].sort((a, b) => a - b),
    chunkCount: seenSequences.size,
    bytesWritten: Number(previous.bytesWritten ?? 0) + (duplicate ? 0 : bytes.length),
    createdAt: previous.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    partialDirectory: relative(root, captureDirectory).replaceAll("\\", "/"),
  };
  await writeFile(partialMetadataPath, `${JSON.stringify(partialMetadata, null, 2)}\n`, "utf8");

  return {
    ...partialMetadata,
    sequence,
    bytes: duplicate ? 0 : bytes.length,
    duplicate,
    partialMetadataPath: relative(root, partialMetadataPath).replaceAll("\\", "/"),
  };
}

async function finalizeExplorationVideo(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new TypeError("Exploration-video finalization body must be a JSON object.");
  }
  const competitionId = String(payload.competitionId ?? "").trim();
  const captureId = String(payload.captureId ?? "").trim();
  const competitionRound = Number(payload.competitionRound);
  const sessionId = String(payload.sessionId ?? "session").trim() || "session";
  const roundId = String(payload.roundId ?? "").trim() || null;
  if (!competitionId) throw new TypeError("competitionId is required to finalize video.");
  if (!captureId) throw new TypeError("captureId is required to finalize video.");
  const competition = workspace.competitions.find((item) => item.id === competitionId);
  if (!competition) {
    const error = new Error(`Unknown competition: ${competitionId}`);
    error.statusCode = 404;
    throw error;
  }

  const safeCompetition = safePathPart(competitionId, "competition");
  const safeCapture = safePathPart(captureId, "capture");
  const partialRoot = join(root, "data", "exploration-videos", safeCompetition, ".partial");
  const captureDirectory = join(partialRoot, safeCapture);
  const legacyPartialPath = join(partialRoot, `${safeCapture}.webm.partial`);

  let locationId = null;
  let directory;
  let videoPath;
  let metadataPath;
  if (Number.isInteger(competitionRound) && competitionRound > 0) {
    const match = matchRecordingToLocation(
      {
        competitionId,
        competitionRound,
        competitionOverallIndex: competitionRound,
      },
      workspace.locations,
      workspace.competitions,
    );
    locationId = match?.location?.localId ?? competition.localLocationIds?.[competitionRound - 1] ?? null;
    if (!locationId) {
      const error = new Error(`Competition ${competitionId} does not contain round ${competitionRound}.`);
      error.statusCode = 400;
      throw error;
    }
    const safeLocation = safePathPart(locationId, "location");
    const safeSession = safePathPart(sessionId, "session");
    directory = join(root, "data", "exploration-videos", safeCompetition, safeLocation, safeSession);
    const roundNumber = String(competitionRound).padStart(2, "0");
    videoPath = join(directory, `round-${roundNumber}.webm`);
    metadataPath = join(directory, `round-${roundNumber}.json`);
  } else {
    // Backward compatibility for v0.8.14/v0.8.15 competition-wide captures.
    directory = join(root, "data", "exploration-videos", safeCompetition, safeCapture);
    videoPath = join(directory, "competition.webm");
    metadataPath = join(directory, "capture.json");
  }

  await mkdir(directory, { recursive: true });
  const videoAlreadyExists = existsSync(videoPath);
  const metadataAlreadyExists = existsSync(metadataPath);

  if (!videoAlreadyExists) {
    if (existsSync(captureDirectory)) {
      const chunkNames = (await readdir(captureDirectory))
        .filter((name) => /^chunk-\d+\.webm$/.test(name))
        .sort();
      if (!chunkNames.length) {
        const error = new Error("No uploaded video chunks were found for this capture.");
        error.statusCode = 409;
        throw error;
      }
      // Build the final WebM in exact MediaRecorder sequence order.
      await writeFile(videoPath, Buffer.alloc(0));
      for (const chunkName of chunkNames) {
        await appendFile(videoPath, await readFile(join(captureDirectory, chunkName)));
      }
    } else if (existsSync(legacyPartialPath)) {
      // Support unfinished captures created by recorder <= 0.7.5.
      await rename(legacyPartialPath, videoPath);
    } else {
      const error = new Error("No uploaded video chunks were found for this capture.");
      error.statusCode = 409;
      throw error;
    }
  }

  const metadata = {
    schemaVersion: Number.isInteger(competitionRound) && competitionRound > 0 ? "1.1" : "1.0",
    captureId,
    competitionId,
    competitionRound: Number.isInteger(competitionRound) && competitionRound > 0 ? competitionRound : null,
    locationId,
    sessionId,
    roundId,
    startedAt: payload.startedAt ?? null,
    startedAtMs: Number.isFinite(Number(payload.startedAtMs)) ? Number(payload.startedAtMs) : null,
    stoppedAt: payload.stoppedAt ?? null,
    stoppedAtMs: Number.isFinite(Number(payload.stoppedAtMs)) ? Number(payload.stoppedAtMs) : null,
    stopReason: payload.stopReason ?? null,
    mimeType: payload.mimeType ?? "video/webm",
    width: Number.isFinite(Number(payload.width)) ? Number(payload.width) : null,
    height: Number.isFinite(Number(payload.height)) ? Number(payload.height) : null,
    chunkCount: Number.isInteger(Number(payload.chunkCount)) ? Number(payload.chunkCount) : null,
    bytesWritten: statSync(videoPath).size,
    pageUrl: payload.pageUrl ?? null,
    tabId: Number.isInteger(Number(payload.tabId)) ? Number(payload.tabId) : null,
    path: relative(root, videoPath).replaceAll("\\", "/"),
  };

  // If the WebM exists but its JSON write was interrupted, a later finalize
  // request repairs the metadata instead of returning 409.
  if (!metadataAlreadyExists) {
    await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  }
  const finalMetadata = metadataAlreadyExists
    ? JSON.parse(await readFile(metadataPath, "utf8"))
    : metadata;

  // Duplicate round captures are redundant once the target round is finalized.
  // Remove both the new chunk directory and legacy raw partial, if present.
  await rm(captureDirectory, { recursive: true, force: true }).catch(() => {});
  await rm(legacyPartialPath, { force: true }).catch(() => {});

  return {
    path: finalMetadata.path,
    metadataPath: relative(root, metadataPath).replaceAll("\\", "/"),
    captureId: finalMetadata.captureId ?? captureId,
    competitionId,
    competitionRound: finalMetadata.competitionRound,
    locationId: finalMetadata.locationId ?? locationId,
    sessionId: finalMetadata.sessionId ?? sessionId,
    roundId: finalMetadata.roundId ?? roundId,
    bytesWritten: finalMetadata.bytesWritten,
    chunkCount: finalMetadata.chunkCount,
    alreadyFinalized: videoAlreadyExists && metadataAlreadyExists,
    metadataRecovered: videoAlreadyExists && !metadataAlreadyExists,
  };
}

async function saveStartingImage(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new TypeError("Starting-image body must be a JSON object.");
  }

  const competitionId = String(payload.competitionId ?? "").trim();
  const competitionRound = Number(payload.competitionRound);
  if (!competitionId) {
    throw new TypeError("competitionId is required for a starting image.");
  }
  if (!Number.isInteger(competitionRound) || competitionRound < 1) {
    throw new TypeError("competitionRound must be a positive integer.");
  }

  const competition = workspace.competitions.find((item) => item.id === competitionId);
  if (!competition) {
    const error = new Error(`Unknown competition: ${competitionId}`);
    error.statusCode = 404;
    throw error;
  }

  const match = matchRecordingToLocation(
    {
      competitionId,
      competitionRound,
      competitionOverallIndex: competitionRound,
      round: { spawnRequested: payload.spawnRequested ?? null },
    },
    workspace.locations,
    workspace.competitions,
  );
  const locationId =
    match?.location?.localId ?? competition.localLocationIds?.[competitionRound - 1] ?? null;
  if (!locationId) {
    const error = new Error(
      `Competition ${competitionId} does not contain round ${competitionRound}.`,
    );
    error.statusCode = 400;
    throw error;
  }

  const imageDataUrl = String(payload.imageDataUrl ?? "");
  const imageMatch = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(imageDataUrl);
  if (!imageMatch) {
    throw new TypeError("imageDataUrl must be a base64 PNG data URL.");
  }

  const imageBuffer = Buffer.from(imageMatch[1], "base64");
  if (imageBuffer.length < 8 || imageBuffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    throw new TypeError("Starting-image payload is not a valid PNG file.");
  }
  if (imageBuffer.length > 15 * 1024 * 1024) {
    const error = new Error("Starting image exceeds the 15 MB limit.");
    error.statusCode = 413;
    throw error;
  }

  const directory = join(root, "data", "starting-images", competitionId);
  const imagePath = join(directory, `${locationId}.png`);
  const relativePath = relative(root, imagePath).replaceAll("\\", "/");
  await mkdir(directory, { recursive: true });

  let created = true;
  try {
    await writeFile(imagePath, imageBuffer, { flag: "wx" });
  } catch (error) {
    if (error?.code === "EEXIST") {
      created = false;
    } else {
      throw error;
    }
  }

  return {
    created,
    relativePath,
    competitionId,
    competitionRound,
    locationId,
    width: Number.isFinite(Number(payload.width)) ? Number(payload.width) : null,
    height: Number.isFinite(Number(payload.height)) ? Number(payload.height) : null,
  };
}

async function saveExplorationImage(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new TypeError("Exploration-image body must be a JSON object.");
  }

  const competitionId = String(payload.competitionId ?? "").trim();
  const competitionRound = Number(payload.competitionRound);
  const sessionId = String(payload.sessionId ?? "session").trim() || "session";
  const actionId = String(payload.actionId ?? "").trim();
  const actionIndex = Number(payload.actionIndex);
  const sampleSeq = Number.isInteger(Number(payload.sampleSeq))
    ? Number(payload.sampleSeq)
    : null;
  const tMs = Number.isFinite(Number(payload.tMs)) ? Math.max(0, Number(payload.tMs)) : 0;

  if (!competitionId) {
    throw new TypeError("competitionId is required for an exploration image.");
  }
  if (!Number.isInteger(competitionRound) || competitionRound < 1) {
    throw new TypeError("competitionRound must be a positive integer.");
  }
  if (!actionId) {
    throw new TypeError("actionId is required for an exploration image.");
  }
  if (!Number.isInteger(actionIndex) || actionIndex < 0) {
    throw new TypeError("actionIndex must be a non-negative integer.");
  }

  const competition = workspace.competitions.find((item) => item.id === competitionId);
  if (!competition) {
    const error = new Error(`Unknown competition: ${competitionId}`);
    error.statusCode = 404;
    throw error;
  }

  const match = matchRecordingToLocation(
    {
      competitionId,
      competitionRound,
      competitionOverallIndex: competitionRound,
      round: { spawnRequested: payload.spawnRequested ?? null },
    },
    workspace.locations,
    workspace.competitions,
  );
  const locationId =
    match?.location?.localId ?? competition.localLocationIds?.[competitionRound - 1] ?? null;
  if (!locationId) {
    const error = new Error(
      `Competition ${competitionId} does not contain round ${competitionRound}.`,
    );
    error.statusCode = 400;
    throw error;
  }

  const imageDataUrl = String(payload.imageDataUrl ?? "");
  const imageMatch = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(imageDataUrl);
  if (!imageMatch) {
    throw new TypeError("imageDataUrl must be a base64 PNG data URL.");
  }

  const imageBuffer = Buffer.from(imageMatch[1], "base64");
  if (
    imageBuffer.length < 8 ||
    imageBuffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a"
  ) {
    throw new TypeError("Exploration-image payload is not a valid PNG file.");
  }
  if (imageBuffer.length > 15 * 1024 * 1024) {
    const error = new Error("Exploration image exceeds the 15 MB limit.");
    error.statusCode = 413;
    throw error;
  }

  const safeSession = safePathPart(sessionId, "session");
  const roundPart = `round-${String(competitionRound).padStart(2, "0")}`;
  const actionNumber = String(actionIndex + 1).padStart(3, "0");
  const timePart = String(Math.round(tMs)).padStart(7, "0");
  const safeAction = safePathPart(actionId, `action-${actionNumber}`);
  const directory = join(
    root,
    "data",
    "exploration-images",
    competitionId,
    locationId,
    safeSession,
    roundPart,
  );
  const imagePath = join(
    directory,
    `${actionNumber}__${safeAction}__t-${timePart}.png`,
  );
  const relativePath = relative(root, imagePath).replaceAll("\\", "/");
  await mkdir(directory, { recursive: true });

  let created = true;
  try {
    await writeFile(imagePath, imageBuffer, { flag: "wx" });
  } catch (error) {
    if (error?.code === "EEXIST") {
      created = false;
    } else {
      throw error;
    }
  }

  return {
    created,
    relativePath,
    competitionId,
    competitionRound,
    locationId,
    sessionId,
    actionId,
    actionIndex,
    sampleSeq,
    tMs,
    width: Number.isFinite(Number(payload.width)) ? Number(payload.width) : null,
    height: Number.isFinite(Number(payload.height)) ? Number(payload.height) : null,
  };
}

function safePathPart(value, fallback) {
  const cleaned = String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
  return cleaned || fallback;
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, X-OGRR-Chunk-Sequence");
  response.setHeader("Access-Control-Max-Age", "86400");
}

function respondJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(`${JSON.stringify(body, null, 2)}\n`);
}

function respondText(response, status, body) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(body);
}
