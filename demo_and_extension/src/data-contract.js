import { assertCoordinate, haversineKm } from "./geo.js";
import { normalizeExploration } from "./exploration.js";

const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const VALID_CONDITIONS = new Set(["static-image", "static-image-covered", "interactive-panorama"]);
const VALID_IMAGE_VARIANTS = new Set(["original", "no-location-gui"]);
const VALID_SOURCES = new Set(["starting-image", "panorama", "map"]);
const VALID_CLUE_CATEGORIES = new Set([
  "signage",
  "landmark",
  "architecture",
  "infrastructure",
  "vegetation",
  "geography",
  "linguistic",
]);
const VALID_CLUE_STATUSES = new Set([
  "pending-grounding",
  "needs-review",
  "reviewed",
  "text-only",
  "not-grounded",
  "excluded",
]);

export function validateCases(input) {
  const errors = [];

  if (!Array.isArray(input)) {
    return ["The data root must be an array of cases."];
  }

  if (input.length === 0) {
    errors.push("At least one case is required.");
  }

  const caseIds = new Set();

  input.forEach((item, caseIndex) => {
    const path = `cases[${caseIndex}]`;

    if (!isNonEmptyString(item?.id)) {
      errors.push(`${path}.id must be a non-empty string.`);
    } else if (caseIds.has(item.id)) {
      errors.push(`${path}.id duplicates "${item.id}".`);
    } else {
      caseIds.add(item.id);
    }

    ["title", "city", "country", "summary"].forEach((key) => {
      if (!isNonEmptyString(item?.[key])) {
        errors.push(`${path}.${key} must be a non-empty string.`);
      }
    });

    if (!VALID_DIFFICULTIES.has(item?.difficulty)) {
      errors.push(`${path}.difficulty must be easy, medium, or hard.`);
    }

    collectCoordinateError(errors, item?.groundTruth, `${path}.groundTruth`);

    if (!item?.startingView) {
      errors.push(`${path}.startingView is required.`);
    } else {
      collectStreetViewErrors(errors, item.startingView, `${path}.startingView`);
    }

    if (item?.startingImage !== undefined && item?.startingImage !== null) {
      if (!isNonEmptyString(item.startingImage?.path)) {
        errors.push(`${path}.startingImage.path must be a non-empty string when startingImage is provided.`);
      }
    }

    if (item?.clueSets !== undefined && !Array.isArray(item.clueSets)) {
      errors.push(`${path}.clueSets must be an array when provided.`);
    } else {
      const clueSetIds = new Set();
      (item.clueSets ?? []).forEach((clueSet, setIndex) => {
        const setPath = `${path}.clueSets[${setIndex}]`;
        if (!isNonEmptyString(clueSet?.id)) errors.push(`${setPath}.id must be a non-empty string.`);
        else if (clueSetIds.has(clueSet.id)) errors.push(`${setPath}.id duplicates "${clueSet.id}".`);
        else clueSetIds.add(clueSet.id);
        if (clueSet?.benchmarkId !== undefined && !isNonEmptyString(clueSet.benchmarkId)) {
          errors.push(`${setPath}.benchmarkId must be a non-empty string when provided.`);
        }
        if (!isNonEmptyString(clueSet?.model)) errors.push(`${setPath}.model must be a non-empty string.`);
        if (!Array.isArray(clueSet?.sourceRuns) || clueSet.sourceRuns.length === 0) {
          errors.push(`${setPath}.sourceRuns must be a non-empty array.`);
        }
        if (!Array.isArray(clueSet?.cues)) {
          errors.push(`${setPath}.cues must be an array.`);
          return;
        }
        clueSet.cues.forEach((cue, cueIndex) => {
          const cuePath = `${setPath}.cues[${cueIndex}]`;
          if (!isNonEmptyString(cue?.id)) errors.push(`${cuePath}.id must be a non-empty string.`);
          if (!isNonEmptyString(cue?.label)) errors.push(`${cuePath}.label must be a non-empty string.`);
          if (!isNonEmptyString(cue?.description)) errors.push(`${cuePath}.description must be a non-empty string.`);
          if (!VALID_SOURCES.has(cue?.source)) errors.push(`${cuePath}.source is not supported.`);
          if (!VALID_CLUE_CATEGORIES.has(cue?.category)) errors.push(`${cuePath}.category is not supported.`);
          if (!VALID_CLUE_STATUSES.has(cue?.annotationStatus)) errors.push(`${cuePath}.annotationStatus is not supported.`);
          if (cue?.region != null) collectRegionErrors(errors, cue.region, `${cuePath}.region`);
        });
      });
    }

    if (!Array.isArray(item?.runs)) {
      errors.push(`${path}.runs must be an array.`);
      return;
    }

    const runIds = new Set();

    item.runs.forEach((run, runIndex) => {
      const runPath = `${path}.runs[${runIndex}]`;

      if (!isNonEmptyString(run?.id)) {
        errors.push(`${runPath}.id must be a non-empty string.`);
      } else if (runIds.has(run.id)) {
        errors.push(`${runPath}.id duplicates "${run.id}" within the case.`);
      } else {
        runIds.add(run.id);
      }

      if (!isNonEmptyString(run?.model)) {
        errors.push(`${runPath}.model must be a non-empty string.`);
      }

      if (!VALID_CONDITIONS.has(run?.condition)) {
        errors.push(
          `${runPath}.condition must be static-image, static-image-covered, or interactive-panorama.`,
        );
      }

      if (
        run?.imageVariant !== undefined &&
        run?.imageVariant !== null &&
        !VALID_IMAGE_VARIANTS.has(run.imageVariant)
      ) {
        errors.push(
          `${runPath}.imageVariant must be original or no-location-gui.`,
        );
      }

      if (
        run?.imageVariant != null &&
        run?.condition !== "static-image"
      ) {
        errors.push(
          `${runPath}.imageVariant is only valid for static-image runs.`,
        );
      }

      if (run?.inputImage !== undefined && run?.inputImage !== null) {
        if (!isNonEmptyString(run.inputImage?.path)) {
          errors.push(
            `${runPath}.inputImage.path must be a non-empty string when inputImage is provided.`,
          );
        }

        if (
          run?.imageVariant != null &&
          run.inputImage?.variant !== undefined &&
          run.inputImage?.variant !== run.imageVariant
        ) {
          errors.push(
            `${runPath}.inputImage.variant must match imageVariant when provided.`,
          );
        }
      }

      if (run?.hypothesis !== undefined && typeof run.hypothesis !== "string") {
        errors.push(`${runPath}.hypothesis must be a string when provided.`);
      }

      if (run?.prediction !== undefined && run?.prediction !== null) {
        collectCoordinateError(errors, run.prediction, `${runPath}.prediction`);
      }

      if (
        run?.confidence !== undefined &&
        run?.confidence !== null &&
        (!Number.isFinite(run.confidence) ||
          run.confidence < 0 ||
          run.confidence > 1)
      ) {
        errors.push(`${runPath}.confidence must be between 0 and 1.`);
      }

      if (run?.cues !== undefined && !Array.isArray(run.cues)) {
        errors.push(`${runPath}.cues must be an array when provided.`);
      } else {
        (run.cues ?? []).forEach((cue, cueIndex) => {
          const cuePath = `${runPath}.cues[${cueIndex}]`;

          if (!isNonEmptyString(cue?.text)) {
            errors.push(`${cuePath}.text must be a non-empty string.`);
          }

          if (!VALID_SOURCES.has(cue?.source)) {
            errors.push(
              `${cuePath}.source must be starting-image, panorama, or map.`,
            );
          }

          if (cue?.evidenceView) {
            collectStreetViewErrors(
              errors,
              cue.evidenceView,
              `${cuePath}.evidenceView`,
            );
          }

          if (cue?.ratings) {
            ["visible", "correct", "useful", "consistent"].forEach((key) => {
              if (
                cue.ratings[key] !== undefined &&
                typeof cue.ratings[key] !== "boolean"
              ) {
                errors.push(`${cuePath}.ratings.${key} must be boolean.`);
              }
            });
          }
        });
      }

      if (run?.statisticsRuns !== undefined && !Array.isArray(run.statisticsRuns)) {
        errors.push(`${runPath}.statisticsRuns must be an array when provided.`);
      } else {
        (run.statisticsRuns ?? []).forEach((statisticsRun, statisticsIndex) => {
          const statisticsPath = `${runPath}.statisticsRuns[${statisticsIndex}]`;
          if (!isNonEmptyString(statisticsRun?.id)) {
            errors.push(`${statisticsPath}.id must be a non-empty string.`);
          }
          if (!isNonEmptyString(statisticsRun?.runId)) {
            errors.push(`${statisticsPath}.runId must be a non-empty string.`);
          }
          collectCoordinateError(errors, statisticsRun?.prediction, `${statisticsPath}.prediction`);
          if (
            statisticsRun?.accuracy?.country !== undefined &&
            statisticsRun.accuracy.country !== null &&
            typeof statisticsRun.accuracy.country !== "boolean"
          ) {
            errors.push(`${statisticsPath}.accuracy.country must be boolean or null.`);
          }
        });
      }
    });
  });

  return errors;
}

export function assertValidCases(input) {
  const errors = validateCases(input);
  if (errors.length > 0) {
    const error = new TypeError(`Invalid Geo Evidence Atlas data:\n- ${errors.join("\n- ")}`);
    error.validationErrors = errors;
    throw error;
  }
  return input;
}

export function normalizeCases(input) {
  assertValidCases(input);

  return input.map((item) => ({
    ...item,
    tags: Array.isArray(item.tags) ? [...item.tags] : [],
    startingImage: item.startingImage ? { ...item.startingImage } : null,
    visual: {
      code: item.visual?.code ?? item.city.slice(0, 3).toUpperCase(),
      accent: item.visual?.accent ?? "#d9ff6b",
      motif: item.visual?.motif ?? "grid",
    },
    clueSets: structuredClone(item.clueSets ?? []).map((clueSet) => ({
      ...clueSet,
      benchmarkId: clueSet.benchmarkId ?? clueSet.id,
    })),
    runs: item.runs.map((run) => ({
      ...run,
      imageVariant: run.imageVariant ?? null,
      inputImage: run.inputImage ? { ...run.inputImage } : null,
      confidence: run.confidence ?? null,
      durationSeconds: run.durationSeconds ?? null,
      notes: run.notes ?? "",
      isMock: run.isMock ?? false,
      accuracy: {
        country: run.accuracy?.country ?? null,
        region: run.accuracy?.region ?? null,
      },
      exploration: normalizeExploration(run.exploration),
      hypothesis: run.hypothesis ?? "",
      cues: (run.cues ?? []).map((cue, index) => ({
        id: cue.id ?? `${run.id}-cue-${index + 1}`,
        ...cue,
        ratings: {
          visible: cue.ratings?.visible ?? null,
          correct: cue.ratings?.correct ?? null,
          useful: cue.ratings?.useful ?? null,
          consistent: cue.ratings?.consistent ?? null,
        },
      })),
      statisticsRuns: (run.statisticsRuns ?? []).map((statisticsRun) => ({
        ...statisticsRun,
        durationSeconds: statisticsRun.durationSeconds ?? null,
        accuracy: {
          country: statisticsRun.accuracy?.country ?? null,
          region: statisticsRun.accuracy?.region ?? null,
        },
        errorKm: haversineKm(item.groundTruth, statisticsRun.prediction),
      })),
      errorKm: run.prediction ? haversineKm(item.groundTruth, run.prediction) : null,
    })),
  }));
}

export function upsertCase(cases, nextCase) {
  const copy = [...cases];
  const index = copy.findIndex((item) => item.id === nextCase.id);

  if (index === -1) {
    copy.push(nextCase);
  } else {
    copy[index] = nextCase;
  }

  return normalizeCases(copy);
}

function collectStreetViewErrors(errors, value, path) {
  collectCoordinateError(
    errors,
    value?.viewpoint ?? value,
    `${path}.viewpoint`,
  );

  if (value?.heading !== undefined && !Number.isFinite(value.heading)) {
    errors.push(`${path}.heading must be a finite number.`);
  }

  if (
    value?.pitch !== undefined &&
    (!Number.isFinite(value.pitch) || value.pitch < -90 || value.pitch > 90)
  ) {
    errors.push(`${path}.pitch must be between -90 and 90.`);
  }

  if (
    value?.fov !== undefined &&
    (!Number.isFinite(value.fov) || value.fov < 10 || value.fov > 100)
  ) {
    errors.push(`${path}.fov must be between 10 and 100.`);
  }
}

function collectRegionErrors(errors, region, path) {
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

function collectCoordinateError(errors, value, path) {
  try {
    assertCoordinate(value, path);
  } catch (error) {
    errors.push(error.message);
  }
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
