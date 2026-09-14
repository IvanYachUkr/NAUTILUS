import { createHash } from "node:crypto";
import { access, mkdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import {
  loadClueDocuments,
  saveClueDocument,
} from "./lib/clues.mjs";
import {
  DATA_DIR,
  ROOT,
  readJson,
  safeSlug,
  writeJsonAtomic,
} from "./lib/workspace.mjs";

const CONDITION = "static-image-covered";
const OUTPUT_PATH = resolve(DATA_DIR, "covered-static-benchmark/results.json");
const RATINGS = { visible: null, correct: null, useful: null, consistent: null };

const MODEL_SOURCES = [
  {
    id: "glm-5-3-flash-max",
    model: "GLM-5.3-Flash + MCP · Max",
    reasoning: "Max",
    report: "data/recorded-agent-benchmark/glm-5.3-flash-max/conditions/static-image-covered/runs/run-1/model_report.md",
    predictions: "data/recorded-agent-benchmark/glm-5.3-flash-max/conditions/static-image-covered/runs/run-1/predictions.json",
  },
  {
    id: "gpt-6-astra-low",
    model: "GPT-6 Astra · low",
    reasoning: "low",
    report: "data/recorded-agent-benchmark/gpt-6-astra-low/conditions/static-image-covered/runs/run-1/model_report.md",
    predictions: "data/recorded-agent-benchmark/gpt-6-astra-low/conditions/static-image-covered/runs/run-1/predictions.json",
  },
  {
    id: "gpt-5-6-sol-xhigh",
    model: "GPT-5.6 Sol · xhigh",
    reasoning: "xhigh",
    report: "data/recorded-agent-benchmark/gpt-5.6-sol-xhigh/conditions/static-image-covered/runs/run-1/model_report.md",
    predictions: "data/recorded-agent-benchmark/gpt-5.6-sol-xhigh/conditions/static-image-covered/runs/run-1/predictions.json",
  },
  {
    id: "gpt-5-6-sol-max",
    model: "GPT-5.6 Sol · max",
    reasoning: "max",
    report: "data/recorded-agent-benchmark/gpt-5.6-sol-max/conditions/static-image-covered/runs/run-1/model_report.md",
    predictions: "data/recorded-agent-benchmark/gpt-5.6-sol-max/conditions/static-image-covered/runs/run-1/predictions.json",
  },
  {
    id: "grok-4-6-xhigh",
    model: "Grok 4.6 · xhigh",
    reasoning: "xhigh",
    report: "data/recorded-agent-benchmark/grok-4.6-xhigh/conditions/static-image-covered/runs/run-1/model_report_recovered.md",
    predictions: "data/recorded-agent-benchmark/grok-4.6-xhigh/conditions/static-image-covered/runs/run-1/predictions.json",
  },
  {
    id: "gemini-3-7-flash-high-aided",
    model: "Gemini 3.7 Flash · high, aided",
    reasoning: "high, aided",
    report: "data/recorded-agent-benchmark/gemini-3.7-flash-high-aided/conditions/static-image-covered/runs/run-1/report.md",
  },
  {
    id: "gemini-3-7-flash-medium-aided",
    model: "Gemini 3.7 Flash · medium, aided",
    reasoning: "medium, aided",
    report: "data/recorded-agent-benchmark/gemini-3.7-flash-medium-aided/conditions/static-image-covered/runs/run-1/report.md",
  },
  {
    id: "gemini-3-8-flash-high-aided",
    model: "Gemini 3.8 Flash · high, aided",
    reasoning: "high, aided",
    report: "data/recorded-agent-benchmark/gemini-3.8-flash-high-aided/conditions/static-image-covered/runs/run-1/report.md",
  },
  {
    id: "gemini-3-8-flash-medium-aided",
    model: "Gemini 3.8 Flash · medium, aided",
    reasoning: "medium, aided",
    report: "data/recorded-agent-benchmark/gemini-3.8-flash-medium-aided/conditions/static-image-covered/runs/run-1/report.md",
  },
];

const IMAGE_SEQUENCE = [
  ["europe-easy--loc-001", "data/starting-images-covered/google_road_marking_cover/europe-easy/loc_001.png"],
  ["europe-easy--loc-006", "data/starting-images-covered/google_road_marking_cover/europe-easy/loc_006.png"],
  ["europe-easy--loc-007", "data/starting-images-covered/google_road_marking_cover/europe-easy/loc_007.png"],
  ["europe-medium--loc-009", "data/starting-images-covered/google_road_marking_cover/europe-medium/loc_009.png"],
  ["europe-medium--loc-010", "data/starting-images-covered/google_road_marking_cover/europe-medium/loc_010.png"],
  ["europe-medium--loc-011", "data/starting-images-covered/google_road_marking_cover/europe-medium/loc_011.png"],
  ["europe-medium--loc-012", "data/starting-images-covered/google_road_marking_cover/europe-medium/loc_012.png"],
  ["europe-medium--loc-013", "data/starting-images-covered/google_road_marking_cover/europe-medium/loc_013.png"],
  ["europe-medium--loc-014", "data/starting-images-covered/google_road_marking_cover/europe-medium/loc_014.png"],
  ["europe-medium--loc-015", "data/starting-images-covered/google_road_marking_cover/europe-medium/loc_015.png"],
  ["europe-medium--loc-016", "data/starting-images-covered/google_road_marking_cover/europe-medium/loc_016.png"],
  ["europe-hard--loc-018", "data/starting-images-covered/google_road_marking_cover/europe-hard/loc_018.png"],
  ["europe-hard--loc-023", "data/starting-images-covered/google_road_marking_cover/europe-hard/loc_023.png"],
  ["europe-hard--loc-024", "data/starting-images-covered/google_road_marking_cover/europe-hard/loc_024.png"],
  ["europe-hard--loc-025", "data/starting-images-covered/map_metadata_cover/europe-hard/loc_025.png"],
];

const IMAGE_BY_LOCATION = new Map(IMAGE_SEQUENCE);
const LOCATION_BY_NUMBERED_IMAGE = new Map(
  IMAGE_SEQUENCE.map(([locationId], index) => [`image_${String(index + 1).padStart(2, "0")}.png`, locationId]),
);
const LOCATION_BY_LOCAL_ID = new Map(IMAGE_SEQUENCE.map(([locationId]) => [locationId.match(/loc-\d+$/)[0], locationId]));

const imported = [];
const clueSetsByLocation = new Map();

for (const source of MODEL_SOURCES) {
  const reportPath = resolve(ROOT, source.report);
  const report = await readFile(reportPath, "utf8");
  const sections = parseReportSections(report);
  const predictions = source.predictions
    ? await predictionsFromJson(source, sections)
    : predictionsFromGeminiReport(source, sections);
  const benchmarkId = `${source.id}-static-covered`;

  validateModelImport(source, sections, predictions);
  imported.push({
    id: benchmarkId,
    benchmarkId,
    model: source.model,
    reasoning: source.reasoning,
    condition: CONDITION,
    sourceReport: source.report,
    predictions,
  });

  for (const prediction of predictions) {
    const section = sections.get(prediction.locationId);
    const clueSet = buildClueSet({ source, benchmarkId, prediction, section });
    if (!clueSetsByLocation.has(prediction.locationId)) clueSetsByLocation.set(prediction.locationId, []);
    clueSetsByLocation.get(prediction.locationId).push(clueSet);
  }
}

for (const [, imagePath] of IMAGE_SEQUENCE) await access(resolve(ROOT, imagePath));

await mkdir(dirname(OUTPUT_PATH), { recursive: true });
await writeJsonAtomic(OUTPUT_PATH, {
  schemaVersion: "1.0",
  condition: CONDITION,
  label: "Static images covered",
  note: "Controlled static-image runs with selected map/interface text or metadata covered. Missing model/location pairs were not evaluated and are not imputed.",
  models: imported,
});

const documents = new Map((await loadClueDocuments()).map((document) => [document.locationId, document]));
let clueCount = 0;
for (const [locationId, importedSets] of clueSetsByLocation) {
  const document = documents.get(locationId) ?? { schemaVersion: "1.0", locationId, clueSets: [] };
  for (const nextSet of importedSets) {
    const existingIndex = document.clueSets.findIndex((item) => item.id === nextSet.id);
    const previous = existingIndex >= 0 ? document.clueSets[existingIndex] : null;
    const previousCues = new Map((previous?.cues ?? []).map((cue) => [cue.id, cue]));
    nextSet.cues = nextSet.cues.map((cue) => preserveReview(cue, previousCues.get(cue.id)));
    if (existingIndex >= 0) document.clueSets[existingIndex] = nextSet;
    else document.clueSets.push(nextSet);
    clueCount += nextSet.cues.length;
  }
  await saveClueDocument(document);
}

const totalPredictions = imported.reduce((sum, item) => sum + item.predictions.length, 0);
console.log(`Imported ${totalPredictions} covered-image predictions and ${clueCount} clues for ${imported.length} model configurations.`);

async function predictionsFromJson(source, sections) {
  const rows = await readJson(resolve(ROOT, source.predictions));
  return rows.map((row) => {
    const locationId = LOCATION_BY_NUMBERED_IMAGE.get(row.image) ?? locationIdFromPath(row.source);
    const imagePath = normalizeProjectPath(row.source);
    const section = sections.get(locationId);
    return {
      id: `${source.id}-${locationId}`,
      locationId,
      inputImage: { path: imagePath, intervention: row.condition ?? interventionFromPath(imagePath) },
      prediction: {
        lat: Number(row.latitude),
        lng: Number(row.longitude),
        label: cleanMarkdown(row.city_region ? `${row.city_region}, ${row.country}` : section?.location),
      },
      confidence: parseConfidence(row.confidence),
    };
  });
}

function predictionsFromGeminiReport(source, sections) {
  return [...sections.entries()].map(([locationId, section]) => ({
    id: `${source.id}-${locationId}`,
    locationId,
    inputImage: {
      path: IMAGE_BY_LOCATION.get(locationId),
      intervention: interventionFromPath(IMAGE_BY_LOCATION.get(locationId)),
    },
    prediction: { ...section.coordinate, label: section.location || "Reported covered-image prediction" },
    confidence: section.confidence,
  }));
}

function parseReportSections(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = new Map();
  let current = null;
  let collectingNumberedClues = false;

  const finish = () => {
    if (!current) return;
    current.clues = current.clues.filter(Boolean);
    sections.set(current.locationId, current);
  };

  for (const line of lines) {
    const heading = line.match(/^#{2,4}\s+.*?(image_\d{2}\.png|(?:europe-(?:easy|medium|hard)\/)?loc_\d{3}\.png).*$/i);
    if (heading) {
      finish();
      const token = heading[1].toLowerCase();
      const locationId = token.startsWith("image_")
        ? LOCATION_BY_NUMBERED_IMAGE.get(token)
        : LOCATION_BY_LOCAL_ID.get(token.match(/loc_\d{3}/)[0].replace("_", "-"));
      current = locationId ? { locationId, clues: [], location: "", coordinate: null, confidence: null } : null;
      collectingNumberedClues = false;
      continue;
    }
    if (!current) continue;

    const location = line.match(/^(?:[-*]\s*)?\*\*(?:Estimated Location|Location|Best country \/ city-region|Best guess|Best)(?::\*\*|\*\*:?)\s*(.+)$/i)
      ?? line.match(/^Best:\s*\*\*(.+)\*\*\.?$/i);
    if (location && !current.location) current.location = cleanMarkdown(location[1]).replace(/[.]$/, "");

    const coordinate = parseCoordinateLine(line);
    if (coordinate) current.coordinate = coordinate;
    const confidence = line.match(/\*\*Confidence:\*\*\s*([^\n]+)/i) ?? line.match(/^Confidence:\s*(.+)$/i);
    if (confidence) current.confidence = parseConfidence(confidence[1]);

    const clueHeading = cleanMarkdown(line.replace(/^\s*[-*]\s*/, "")).replace(/:$/, "");
    if (/^(?:Visible cues|Visual Clues(?: Identified)?)$/i.test(clueHeading)) {
      collectingNumberedClues = true;
      continue;
    }

    if (collectingNumberedClues) {
      const numbered = line.match(/^\s*\d+\.\s+(.+)$/);
      if (numbered) {
        current.clues.push(parseClue(numbered[1]));
        continue;
      }
      if (line.trim() && !/^\s*$/.test(line) && !/^[-*]\s/.test(line)) collectingNumberedClues = false;
    }

    // Astra's report uses five plain bullets before the Best line.
    if (!collectingNumberedClues && !current.location && /^\s*-\s+(?!\*\*)\S/.test(line) && !/^\s*-\s+Best/i.test(line)) {
      current.clues.push(parseClue(line.replace(/^\s*-\s+/, "")));
    }
  }
  finish();
  return sections;
}

function parseCoordinateLine(line) {
  if (!/(?:Coordinates?|Best-guess coordinate|Best-guess latitude, longitude)/i.test(line)) return null;
  const text = cleanMarkdown(line).replace(/^[^:]+:\s*/, "");
  const match = text.match(/(-?\d{1,2}(?:\.\d+)?)\s*°?\s*([NS])?\s*[,;]\s*(-?\d{1,3}(?:\.\d+)?)\s*°?\s*([EW])?/i);
  if (!match) return null;
  let lat = Number(match[1]);
  let lng = Number(match[3]);
  if (match[2]?.toUpperCase() === "S") lat = -Math.abs(lat);
  if (match[2]?.toUpperCase() === "N") lat = Math.abs(lat);
  if (match[4]?.toUpperCase() === "W") lng = -Math.abs(lng);
  if (match[4]?.toUpperCase() === "E") lng = Math.abs(lng);
  return { lat, lng };
}

function buildClueSet({ source, benchmarkId, prediction, section }) {
  const cues = section.clues.map((raw, index) => {
    const identity = `${source.id}|${prediction.locationId}|${normalize(raw.label)}|${normalize(raw.description)}`;
    return {
      id: `cue-${safeSlug(prediction.locationId)}-${safeSlug(benchmarkId)}-${digest(identity)}`,
      label: raw.label,
      text: raw.label,
      description: raw.description,
      groundingPhrase: groundingPhrase(raw.label, raw.description),
      source: "starting-image",
      category: categorize(`${raw.label} ${raw.description}`),
      region: null,
      regionSource: null,
      annotationStatus: shouldGround(raw.label) ? "pending-grounding" : "text-only",
      ratings: { ...RATINGS },
      sourceRuns: ["covered-static-r1"],
      provenance: [{ runId: "covered-static-r1", report: source.report, text: raw.rawText }],
    };
  });
  return {
    id: benchmarkId,
    benchmarkId,
    model: source.model.replace(/\s+·\s+.*$/, ""),
    reasoning: source.reasoning,
    condition: CONDITION,
    publicationStatus: "review-only",
    imagePath: prediction.inputImage.path,
    mergeStrategy: "single-covered-static-run",
    sourceRuns: [{ runId: "covered-static-r1", report: source.report }],
    cues,
  };
}

function preserveReview(next, previous) {
  if (!previous) return next;
  return {
    ...next,
    region: previous.region ?? next.region,
    regionSource: previous.regionSource ?? next.regionSource,
    annotationStatus: previous.annotationStatus ?? next.annotationStatus,
    ratings: previous.ratings ?? next.ratings,
    ...(previous.groundingLabel ? { groundingLabel: previous.groundingLabel } : {}),
    ...(previous.ratingsReviewedAt ? { ratingsReviewedAt: previous.ratingsReviewedAt } : {}),
    ...(previous.ratingsExclusionReason ? { ratingsExclusionReason: previous.ratingsExclusionReason } : {}),
    ...(previous.ratingsExcludedAt ? { ratingsExcludedAt: previous.ratingsExcludedAt } : {}),
    ...(previous.ratingsPreviousStatus ? { ratingsPreviousStatus: previous.ratingsPreviousStatus } : {}),
  };
}

function validateModelImport(source, sections, predictions) {
  const expected = source.predictions ? 15 : 14;
  if (sections.size !== expected) throw new Error(`${source.id}: expected ${expected} report sections, found ${sections.size}.`);
  if (predictions.length !== expected) throw new Error(`${source.id}: expected ${expected} predictions, found ${predictions.length}.`);
  for (const prediction of predictions) {
    if (!prediction.locationId || !IMAGE_BY_LOCATION.has(prediction.locationId)) throw new Error(`${source.id}: unknown location in prediction.`);
    if (!Number.isFinite(prediction.prediction?.lat) || !Number.isFinite(prediction.prediction?.lng)) throw new Error(`${source.id}/${prediction.locationId}: missing coordinate.`);
    const clues = sections.get(prediction.locationId)?.clues ?? [];
    const expectedClues = source.predictions ? 5 : 4;
    if (clues.length !== expectedClues) throw new Error(`${source.id}/${prediction.locationId}: expected ${expectedClues} clues, found ${clues.length}: ${clues.map((item) => item.label).join(" | ")}`);
  }
}

function parseClue(value) {
  const rawText = cleanMarkdown(value).replace(/[.]$/, "");
  const colon = rawText.indexOf(":");
  if (colon > 1 && colon < 100) {
    const label = rawText.slice(0, colon).trim();
    return { rawText, label, description: sentence(rawText.slice(colon + 1).trim() || label) };
  }
  const dash = rawText.search(/\s+[—–-]\s+/);
  if (dash > 1 && dash < 100) {
    const label = rawText.slice(0, dash).trim();
    return { rawText, label, description: sentence(rawText.slice(dash).replace(/^\s+[—–-]\s+/, "")) };
  }
  const label = rawText.replace(/\s+(?:with|featuring|indicating|showing|reading|reads|match(?:es)?|fit(?:s)?)\s+.+$/i, "").slice(0, 88).trim();
  return { rawText, label: label || rawText.slice(0, 88), description: sentence(rawText) };
}

function locationIdFromPath(path) {
  const match = String(path).match(/(europe-(?:easy|medium|hard)).*\/(loc_\d{3})\.png$/i);
  return match ? `${match[1].toLowerCase()}--${match[2].toLowerCase().replace("_", "-")}` : null;
}

function normalizeProjectPath(path) {
  return String(path).replace(/^demo_and_extension\//, "").replaceAll("\\", "/");
}

function interventionFromPath(path) {
  return String(path).includes("map_metadata_cover") ? "map-metadata-cover" : "google-road-marking-cover";
}

function parseConfidence(value) {
  const percent = String(value ?? "").match(/(\d+(?:\.\d+)?)\s*%/);
  return percent ? Math.min(1, Math.max(0, Number(percent[1]) / 100)) : null;
}

function cleanMarkdown(value) {
  return String(value ?? "")
    .replace(/[`*_\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sentence(value) {
  const text = cleanMarkdown(value);
  if (!text) return text;
  return `${text[0].toUpperCase()}${text.slice(1)}${/[.!?]$/.test(text) ? "" : "."}`;
}

function normalize(value) {
  return cleanMarkdown(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 10);
}

function groundingPhrase(label, description) {
  const specific = label.length >= 4 ? label : description;
  return specific.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim().slice(0, 140);
}

function shouldGround(label) {
  return !/^(?:urban fabric|regional landscape|regional setting|landscape|vegetation|terrain|topography|road layout|architectural typology|settlement pattern|urbanism|vehicles?|vehicle plates?|regional architecture|regional church architecture)$/i.test(label.trim());
}

function categorize(value) {
  const text = normalize(value);
  if (/\b(language|letter|word|name|phone|prefix|sign|signage|label|inscription|script|plaque|reads)\b/.test(text)) return "signage";
  if (/\b(tower|fort|column|arena|church|cathedral|statue|opera|monument|landmark|bridge)\b/.test(text)) return "landmark";
  if (/\b(tree|forest|pine|spruce|birch|alder|aspen|fern|grass|vegetation|crop)\b/.test(text)) return "vegetation";
  if (/\b(river|fjord|mountain|alps|hill|coast|water|plain|terrain|slope|valley|soil)\b/.test(text)) return "geography";
  if (/\b(facade|roof|house|villa|shutter|balcony|brick|stone|timber|stucco|baroque|gothic|building)\b/.test(text)) return "architecture";
  if (/\b(bus|train|track|path|lane|asphalt|bollard|plate|vehicle|roundabout|utility|pole|turbine|curb|traffic|lamp|bike|cycle|ferry|pier|harbor|bin|dumpster|parking)\b/.test(text)) return "infrastructure";
  if (/\b(linguistic|dialect|bilingual)\b/.test(text)) return "linguistic";
  return "geography";
}
