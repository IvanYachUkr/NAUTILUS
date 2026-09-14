const CONDITION_LABELS = {
  "static-image": "Static image",
  "static-image-covered": "Static images covered",
  "interactive-panorama": "Interactive panorama",
};

export const RECORDING_REVIEW_ENABLED = false;
export const EXPLORATION_PLAYBACK_ENABLED = false;

export function buildImmersiveView({ cases = [], caseItem = null, run = null } = {}) {
  const isDetail = Boolean(caseItem);
  const samples = run?.exploration?.samples ?? [];

  return {
    state: isDetail ? "detail" : "overview",
    backgroundImage: isDetail ? caseItem.startingImage?.path ?? null : null,
    locationCount: cases.length,
    progressStep: isDetail ? 4 : 1,
    model: run?.model ?? null,
    conditionLabel: run
      ? CONDITION_LABELS[run.condition] ?? humanize(run.condition)
      : null,
    hasPlayback:
      EXPLORATION_PLAYBACK_ENABLED &&
      !["static-image", "static-image-covered"].includes(run?.condition) &&
      samples.length > 0,
  };
}

export function nextCaseId(cases = [], currentCaseId = null) {
  if (!cases.length) return null;
  const index = cases.findIndex((item) => item.id === currentCaseId);
  return cases[(index + 1 + cases.length) % cases.length]?.id ?? cases[0]?.id ?? null;
}

export function previousCaseId(cases = [], currentCaseId = null) {
  if (!cases.length) return null;
  const index = cases.findIndex((item) => item.id === currentCaseId);
  const currentIndex = index === -1 ? 0 : index;
  return cases[(currentIndex - 1 + cases.length) % cases.length]?.id ?? cases.at(-1)?.id ?? null;
}

export function mapResetActionLabel({
  hasSelection = false,
  hasRun = false,
  hasPrediction = false,
} = {}) {
  if (!hasSelection) return "Focus on predictions";
  if (!hasRun) return "Focus location";
  return hasPrediction ? "Focus comparison" : "Focus recorded path";
}

export function mapLegendItems({
  overview = true,
  hasPrediction = false,
  hasExploration = false,
} = {}) {
  if (overview) {
    return [
      { kind: "locations", label: "Dataset locations · by difficulty" },
      ...(hasPrediction
        ? [
            { kind: "prediction", label: "Selected model predictions" },
            { kind: "error", label: "Pin error" },
          ]
        : []),
    ];
  }

  return [
    { kind: "truth", label: "Ground truth" },
    ...(hasPrediction
      ? [
          { kind: "prediction", label: "Model prediction" },
          { kind: "error", label: "Pin error" },
        ]
      : []),
    ...(hasExploration ? [{ kind: "exploration", label: "Exploration" }] : []),
  ];
}

export function shouldShowPlaybackMarker({ playing = false, index = 0, drawerMode = null } = {}) {
  return Boolean(playing || index > 0 || drawerMode === "playback");
}

export function shouldFocusLocationCard({ requested = false, listHidden = false } = {}) {
  return Boolean(requested && !listHidden);
}

export function resolvePlaybackReviewMedia({ imageUrl = null, videoUrl = null } = {}) {
  const resolvedImageUrl = typeof imageUrl === "string" && imageUrl.trim() ? imageUrl : null;
  const resolvedVideoUrl = RECORDING_REVIEW_ENABLED && typeof videoUrl === "string" && videoUrl.trim()
    ? videoUrl
    : null;

  return {
    imageUrl: resolvedImageUrl,
    videoUrl: resolvedVideoUrl,
    hasReview: Boolean(resolvedImageUrl || resolvedVideoUrl),
  };
}

function humanize(value) {
  return String(value ?? "")
    .replaceAll(/[-_]+/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}
