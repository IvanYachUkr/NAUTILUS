import { basename, join, relative } from "node:path";
import {
  CLUES_DIR,
  ROOT,
  listJsonFiles,
  readJson,
  safeSlug,
  writeJsonAtomic,
} from "./workspace.mjs";

export const CLUE_CATEGORIES = new Set([
  "signage",
  "landmark",
  "architecture",
  "infrastructure",
  "vegetation",
  "geography",
  "linguistic",
]);

export const CLUE_STATUSES = new Set([
  "pending-grounding",
  "needs-review",
  "reviewed",
  "text-only",
  "not-grounded",
  "excluded",
]);

export async function loadClueDocuments({ errors = [] } = {}) {
  const documents = [];
  const files = await listJsonFiles(CLUES_DIR);

  for (const path of files) {
    const source = relative(ROOT, path).replaceAll("\\", "/");
    let input;
    try {
      input = await readJson(path);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      continue;
    }

    const documentErrors = validateClueDocument(input, source);
    if (documentErrors.length) {
      errors.push(...documentErrors);
      continue;
    }

    documents.push({ ...input, sourceFile: source });
  }

  return documents.sort((left, right) => left.locationId.localeCompare(right.locationId));
}

export function validateClueDocument(input, source = "clue document") {
  const errors = [];
  if (!isNonEmptyString(input?.locationId)) {
    errors.push(`${source}: locationId must be a non-empty string.`);
  }
  if (!Array.isArray(input?.clueSets) || input.clueSets.length === 0) {
    errors.push(`${source}: clueSets must be a non-empty array.`);
    return errors;
  }

  const setIds = new Set();
  for (const [setIndex, clueSet] of input.clueSets.entries()) {
    const path = `${source}: clueSets[${setIndex}]`;
    if (!isNonEmptyString(clueSet?.id)) errors.push(`${path}.id must be a non-empty string.`);
    else if (setIds.has(clueSet.id)) errors.push(`${path}.id duplicates "${clueSet.id}".`);
    else setIds.add(clueSet.id);
    if (!isNonEmptyString(clueSet?.model)) errors.push(`${path}.model must be a non-empty string.`);
    if (!Array.isArray(clueSet?.sourceRuns) || clueSet.sourceRuns.length === 0) {
      errors.push(`${path}.sourceRuns must be a non-empty array.`);
    }
    if (!Array.isArray(clueSet?.cues)) {
      errors.push(`${path}.cues must be an array.`);
      continue;
    }

    const cueIds = new Set();
    for (const [cueIndex, cue] of clueSet.cues.entries()) {
      const cuePath = `${path}.cues[${cueIndex}]`;
      if (!isNonEmptyString(cue?.id)) errors.push(`${cuePath}.id must be a non-empty string.`);
      else if (cueIds.has(cue.id)) errors.push(`${cuePath}.id duplicates "${cue.id}".`);
      else cueIds.add(cue.id);
      if (!isNonEmptyString(cue?.label)) errors.push(`${cuePath}.label must be a non-empty string.`);
      if (!isNonEmptyString(cue?.text)) errors.push(`${cuePath}.text must be a non-empty string.`);
      if (!isNonEmptyString(cue?.description)) errors.push(`${cuePath}.description must be a non-empty string.`);
      if (cue?.source !== "panorama" && cue?.source !== "starting-image" && cue?.source !== "map") {
        errors.push(`${cuePath}.source must be panorama, starting-image, or map.`);
      }
      if (!CLUE_CATEGORIES.has(cue?.category)) {
        errors.push(`${cuePath}.category is not supported.`);
      }
      if (!CLUE_STATUSES.has(cue?.annotationStatus)) {
        errors.push(`${cuePath}.annotationStatus is not supported.`);
      }
      if (cue?.ratings !== undefined) {
        if (!cue.ratings || typeof cue.ratings !== "object" || Array.isArray(cue.ratings)) {
          errors.push(`${cuePath}.ratings must be an object.`);
        } else {
          for (const key of ["visible", "correct", "useful", "consistent"]) {
            if (cue.ratings[key] !== undefined && cue.ratings[key] !== null && typeof cue.ratings[key] !== "boolean") {
              errors.push(`${cuePath}.ratings.${key} must be boolean or null.`);
            }
          }
        }
      }
      if (cue?.ratingsReviewedAt !== undefined && !isNonEmptyString(cue.ratingsReviewedAt)) {
        errors.push(`${cuePath}.ratingsReviewedAt must be a non-empty ISO timestamp when provided.`);
      }
      if (cue?.ratingsExclusionReason !== undefined && cue.ratingsExclusionReason !== "not-ratable") {
        errors.push(`${cuePath}.ratingsExclusionReason must be \"not-ratable\" when provided.`);
      }
      if (cue?.ratingsExcludedAt !== undefined && !isNonEmptyString(cue.ratingsExcludedAt)) {
        errors.push(`${cuePath}.ratingsExcludedAt must be a non-empty ISO timestamp when provided.`);
      }
      if (cue?.ratingsPreviousStatus !== undefined && !["reviewed", "text-only"].includes(cue.ratingsPreviousStatus)) {
        errors.push(`${cuePath}.ratingsPreviousStatus must be reviewed or text-only when provided.`);
      }
      if (!Array.isArray(cue?.provenance) || cue.provenance.length === 0) {
        errors.push(`${cuePath}.provenance must be a non-empty array.`);
      }
      if (cue?.region !== null && cue?.region !== undefined) {
        validateRegion(cue.region, `${cuePath}.region`, errors);
      }
    }
  }
  return errors;
}

export function clueDocumentsByLocation(documents) {
  return new Map(documents.map((document) => [document.locationId, document]));
}

export async function saveClueDocument(document) {
  const errors = validateClueDocument(document);
  if (errors.length) throw new TypeError(errors.join("\n"));
  const filename = `${safeSlug(document.locationId)}.json`;
  const clean = structuredClone(document);
  delete clean.sourceFile;
  delete clean.imagePath;
  delete clean.mapCase;
  delete clean.predictionsByBenchmarkId;
  await writeJsonAtomic(join(CLUES_DIR, filename), clean);
  return filename;
}

function validateRegion(region, path, errors) {
  for (const key of ["x", "y", "w", "h"]) {
    if (!Number.isFinite(region?.[key]) || region[key] < 0 || region[key] > 1) {
      errors.push(`${path}.${key} must be between 0 and 1.`);
    }
  }
  if (Number.isFinite(region?.x) && Number.isFinite(region?.w) && region.x + region.w > 1.000001) {
    errors.push(`${path}.x + width must not exceed 1.`);
  }
  if (Number.isFinite(region?.y) && Number.isFinite(region?.h) && region.y + region.h > 1.000001) {
    errors.push(`${path}.y + height must not exceed 1.`);
  }
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
