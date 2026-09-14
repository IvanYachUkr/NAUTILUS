import { normalizeCases, upsertCase as mergeCase } from "./data-contract.js";
import { assetImageUrl } from "./asset-url.js";
import { createStreetViewController } from "./street-view.js";
import {
  explorationDistanceKm,
  nearestSampleIndex,
  normalizeExploration,
  sampleToStreetView,
} from "./exploration.js";
import {
  buildStreetViewUrl,
  errorBand,
  formatCoordinate,
  formatDistance,
  predictionLocationLabel,
} from "./geo.js";
import { createGlobeController } from "./globe-controller.js";
import { createMapController } from "./map-controller.js";
import { comparisonColor } from "./comparison-colors.js";
import {
  buildImmersiveView,
  EXPLORATION_PLAYBACK_ENABLED,
  mapLegendItems,
  mapResetActionLabel,
  nextCaseId,
  previousCaseId,
  resolvePlaybackReviewMedia,
  shouldFocusLocationCard,
  shouldShowPlaybackMarker,
} from "./immersive-view.js";
import {
  buildProjectSnapshot,
  projectSectionAtViewport,
  projectStoryMarkup,
  setActiveProjectSection,
  scrollToMethodStage,
  scrollToProjectSection,
} from "./project-story.js";

const CONDITION_LABELS = {
  "static-image": "Static image",
  "static-image-covered": "Static images covered",
  "interactive-panorama": "Interactive panorama",
};

const IMAGE_VARIANT_LABELS = {
  original: "Original OpenGuessr",
  "no-location-gui": "No location GUI",
};

const DEFAULT_IMAGE_VARIANT = "original";

function runImageVariant(run) {
  return run?.imageVariant ?? DEFAULT_IMAGE_VARIANT;
}

function imageForRun(caseItem, run) {
  if (isStaticImageCondition(run?.condition) && run?.inputImage) {
    return run.inputImage;
  }

  return caseItem?.startingImage ?? null;
}

function isStaticImageCondition(condition) {
  return condition === "static-image" || condition === "static-image-covered";
}

function comparisonColorKey(run, compareConditions = false) {
  return compareConditions ? `${run?.model}:${run?.condition}` : run?.model;
}

function comparisonRunLabel(run, compareConditions = false) {
  return compareConditions
    ? CONDITION_LABELS[run?.condition] ?? run?.condition ?? "Condition"
    : run?.model ?? "Model";
}

function runConditionLabel(run) {
  const condition = CONDITION_LABELS[run?.condition] ?? run?.condition ?? "";

  if (!isStaticBaselineModel(run?.model)) {
    return condition;
  }

  const variant = runImageVariant(run);
  const variantLabel = IMAGE_VARIANT_LABELS[variant] ?? variant;
  return `${condition} · ${variantLabel}`;
}

function runTimeLabel(run) {
  if (Number.isFinite(run?.durationSeconds)) {
    return `${Math.round(run.durationSeconds)} s`;
  }

  return isStaticImageCondition(run?.condition)
    ? "Batch processed"
    : "Unavailable";
}

function runTimeDescription(run) {
  return isStaticImageCondition(run?.condition) && !Number.isFinite(run?.durationSeconds)
    ? "Images were evaluated in batches, so per-location runtime is not comparable."
    : "";
}

const STATIC_BASELINE_ORDER = [
  "GeoCLIP",
  "SALAD + OSV-5M",
  "PLONK OSV-5M",
  "Chipoint v2",
];

const STATIC_BASELINE_MODELS = new Set(STATIC_BASELINE_ORDER);

function isStaticBaselineModel(model) {
  return STATIC_BASELINE_MODELS.has(model);
}

function splitModelsForSelector(models = []) {
  const available = new Set(models);
  return {
    regular: models.filter((model) => !STATIC_BASELINE_MODELS.has(model)),
    baselines: STATIC_BASELINE_ORDER.filter((model) => available.has(model)),
  };
}

export function availableEvidenceCues(caseItem, run) {
  if (!caseItem || !run) return [];

  const clueSet = (caseItem.clueSets ?? []).find(
    (item) => item.benchmarkId === run.benchmarkId || item.id === run.benchmarkId,
  );
  return (clueSet?.cues ?? []).filter((clue) => clue.annotationStatus !== "excluded");
}

const DIFFICULTY_LABELS = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const PLAYBACK_SPEEDS = [0.5, 1, 2, 4, 8];
export function createExplorer({
  root,
  cases,
  initialCaseId,
  initialRunId,
  mapOptions,
  syncHash = true,
} = {}) {
  const rootElement = resolveRoot(root);
  let data = normalizeCases(cases);
  let destroyed = false;
  let query = "";
  let filters = { competition: "", country: "", difficulty: "", sceneType: "" };
  let lastSelectionSignature = "";
  let drawerMode = null;
  let drawerSample = null;
  let drawerCaseId = null;
  let drawerRunId = null;
  let drawerSeekMs = 0;
  let selectedCueId = null;
  let evidenceMode = false;
  let evidenceComparisonMode = false;
  let showTextOnlyClues = false;
  let comparisonMode = false;
  let conditionComparisonMode = false;
  let comparisonMapFullscreen = false;
  let comparedModels = new Set();
  let playbackIndex = 0;
  let playbackTimeMs = 0;
  let playbackSpeed = 1;
  let playbackPlaying = false;
  let playbackFrame = 0;
  let playbackLastTick = 0;

  const hashSelection = syncHash ? readSelectionFromHash() : {};
  let selectedCaseId = initialCaseId ?? hashSelection.caseId ?? null;
  let selectedModel = hashSelection.model ?? null;
  let selectedCondition = hashSelection.condition ?? null;
  let selectedImageVariant =
    hashSelection.imageVariant ?? DEFAULT_IMAGE_VARIANT;

  if (selectedCaseId && !data.some((item) => item.id === selectedCaseId)) {
    selectedCaseId = null;
  }

  if (initialRunId && selectedCaseId) {
    const initialCase = data.find((item) => item.id === selectedCaseId);
    const initialRun = initialCase?.runs.find((run) => run.id === initialRunId);
    if (initialRun) {
      selectedModel = initialRun.model;
      selectedCondition = initialRun.condition;
      selectedImageVariant = runImageVariant(initialRun);
    }
  }

  rootElement.classList.add("geo-evidence-atlas-host");
  rootElement.innerHTML = shellMarkup(data);

  const elements = collectElements(rootElement);
  const mapController = createGlobeController(elements.map, {
    ...mapOptions,
    onCaseSelect(caseId) {
      selectedCaseId = caseId;
      if (!["stats", "truth", "prediction", "playback"].includes(drawerMode)) {
        clearDrawerState();
      }
      render({ fitMap: true, focusActiveCard: true });
    },
    onMarkerSelect(kind, detail) {
      if (detail?.caseId && data.some((item) => item.id === detail.caseId)) {
        selectedCaseId = detail.caseId;
      }
      if (detail?.runId) {
        const caseItem = getSelectedCase();
        const run = caseItem?.runs.find((item) => item.id === detail.runId);
        if (run) {
          selectedModel = run.model;
          selectedCondition = run.condition;
          selectedImageVariant = runImageVariant(run);
        }
      }
      drawerMode = kind === "playback" ? "playback" : kind;
      drawerSample = detail?.sample ?? null;
      drawerCaseId = detail?.caseId ?? selectedCaseId ?? drawerCaseId;
      drawerRunId = detail?.runId ?? null;
      render({ fitMap: false });
    },
  });
  let sideMapController = null;
  const disposers = [];
  const streetView = createStreetViewController(rootElement);
  disposers.push(() => streetView.destroy());

  const api = {
    setCases(nextCases) {
      assertAlive();
      stopPlayback();
      data = normalizeCases(nextCases);
      if (selectedCaseId && !data.some((item) => item.id === selectedCaseId)) {
        selectedCaseId = null;
      }
      clearDrawerState();
      renderFilterOptions();
      render({ announceData: true, fitMap: true });
      return api;
    },

    upsertCase(nextCase) {
      assertAlive();
      stopPlayback();
      data = mergeCase(data, nextCase);
      selectedCaseId = nextCase.id;
      clearDrawerState();
      renderFilterOptions();
      render({ announceData: true, focusActiveCard: true, fitMap: true });
      return api;
    },

    selectCase(caseId) {
      assertAlive();
      if (caseId === null || caseId === "all") {
        enterOverview();
        render({ fitMap: true });
        return api;
      }
      if (!data.some((item) => item.id === caseId)) {
        throw new RangeError(`Unknown case id: ${caseId}`);
      }
      selectedCaseId = caseId;
      if (!["stats", "truth", "prediction", "playback"].includes(drawerMode)) {
        clearDrawerState();
      }
      render({ focusActiveCard: true, fitMap: true });
      return api;
    },

    selectRun(runId) {
      assertAlive();
      const caseItem = getSelectedCase();
      if (!caseItem) throw new Error("Select a location before selecting a run.");
      const run = caseItem.runs.find((item) => item.id === runId);
      if (!run) {
        throw new RangeError(`Unknown run id for ${caseItem.id}: ${runId}`);
      }
      selectedModel = run.model;
      selectedCondition = run.condition;
      selectedImageVariant = runImageVariant(run);
      drawerSample = null;
      render({ fitMap: true });
      return api;
    },

    select({
      caseId,
      model,
      condition,
      imageVariant,
      runId,
    } = {}) {
      assertAlive();
      if (caseId !== undefined) {
        if (caseId === null || caseId === "all") {
          enterOverview();
        } else if (!data.some((item) => item.id === caseId)) {
          throw new RangeError(`Unknown case id: ${caseId}`);
        } else {
          selectedCaseId = caseId;
        }
      }

      if (runId !== undefined) {
        const caseItem = getSelectedCase();
        const run = caseItem?.runs.find((item) => item.id === runId);
        if (!run) throw new RangeError(`Unknown run id: ${runId}`);
        selectedModel = run.model;
        selectedCondition = run.condition;
        selectedImageVariant = runImageVariant(run);
      } else {
        if (model !== undefined) selectedModel = model;
        if (condition !== undefined) selectedCondition = condition;
        if (imageVariant !== undefined) {
          selectedImageVariant = imageVariant || DEFAULT_IMAGE_VARIANT;
        }
      }

      drawerSample = null;
      render({ fitMap: true });
      return api;
    },

    attachExploration({ caseId = selectedCaseId, runId, recorder } = {}) {
      assertAlive();
      if (!caseId) throw new Error("A caseId is required to attach exploration data.");
      const caseItem = data.find((item) => item.id === caseId);
      if (!caseItem) throw new RangeError(`Unknown case id: ${caseId}`);
      const run = runId
        ? caseItem.runs.find((item) => item.id === runId)
        : getSelectedRun(caseItem);
      if (!run) throw new RangeError(`Unknown run id: ${runId}`);

      const exploration = normalizeExploration(recorder);
      if (!exploration) {
        throw new TypeError("Recorder JSON contains no valid movement or camera samples.");
      }
      run.exploration = exploration;
      selectedCaseId = caseItem.id;
      selectedModel = run.model;
      selectedCondition = run.condition;
      selectedImageVariant = runImageVariant(run);
      drawerMode = "playback";
      drawerSample = exploration.samples[0] ?? null;
      playbackIndex = 0;
      playbackTimeMs = drawerSample?.tMs ?? 0;
      render({ fitMap: true });
      return api;
    },

    getState() {
      assertAlive();
      const filteredCases = getFilteredCases();
      ensureRunControlState(getSelectedCase(), filteredCases);
      const caseItem = getSelectedCase();
      const run = caseItem ? getSelectedRun(caseItem) : null;
      return {
        caseId: caseItem?.id ?? null,
        runId: run?.id ?? null,
        model: run?.model ?? selectedModel,
        condition: run?.condition ?? selectedCondition,
        imageVariant: isStaticBaselineModel(run?.model ?? selectedModel)
          ? runImageVariant(run)
          : null,
        query,
        filters: { ...filters },
        caseCount: data.length,
        visibleCaseCount: caseItem ? 1 : getOverviewMapCases(filteredCases).length,
        errorKm: run?.errorKm ?? null,
        drawer: drawerMode,
        playbackIndex: run?.exploration?.samples?.length ? playbackIndex : null,
        comparisonMapFullscreen,
      };
    },

    getCases() {
      assertAlive();
      return structuredCloneSafe(data);
    },

    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopPlayback();
      for (const dispose of disposers) dispose();
      mapController.destroy();
      sideMapController?.destroy();
      document.documentElement.classList.remove("explorer-detail-open", "explorer-comparison-map-fullscreen");
      delete rootElement.geoEvidenceAtlas;
      rootElement.classList.remove("geo-evidence-atlas-host");
      rootElement.replaceChildren();
    },
  };

  rootElement.geoEvidenceAtlas = api;

  bindEvents();
  renderFilterOptions();
  render({ fitMap: true });

  queueMicrotask(() => {
    rootElement.dispatchEvent(
      new CustomEvent("geoatlas:ready", {
        bubbles: true,
        detail: { api, caseCount: data.length },
      }),
    );
  });

  return api;

  function bindEvents() {
    const projectSections = [...rootElement.querySelectorAll("[data-site-section-id]")];
    let storyNavigationFrame = 0;

    const updateStoryNavigation = () => {
      storyNavigationFrame = 0;
      const sectionId = projectSectionAtViewport(projectSections, window.innerHeight * 0.38);
      if (sectionId) setActiveProjectSection(rootElement, sectionId);
    };

    const onStoryPositionChange = () => {
      if (storyNavigationFrame) return;
      storyNavigationFrame = window.requestAnimationFrame(updateStoryNavigation);
    };

    const onClick = (event) => {
      const methodNavigation = event.target.closest("[data-method-stage]");
      if (methodNavigation && rootElement.contains(methodNavigation)) {
        scrollToMethodStage(rootElement, methodNavigation.dataset.methodStage);
        return;
      }

      const siteNavigation = event.target.closest("[data-scroll-target]");
      if (siteNavigation && rootElement.contains(siteNavigation)) {
        const sectionId = siteNavigation.dataset.scrollTarget;
        setActiveProjectSection(rootElement, sectionId);
        scrollToProjectSection(rootElement, sectionId);
        return;
      }

      const backButton = event.target.closest("[data-back-overview]");
      if (backButton && rootElement.contains(backButton)) {
        enterOverview();
        render({ fitMap: true });
        rootElement.querySelector("[data-discover-location]").focus({ preventScroll: true });
        return;
      }

      const overviewButton = event.target.closest("[data-overview]");
      if (overviewButton && rootElement.contains(overviewButton)) {
        query = "";
        filters = { competition: "", country: "", difficulty: "", sceneType: "" };
        elements.search.value = "";
        enterOverview();
        renderFilterOptions();
        render({ fitMap: true });
        return;
      }

      const previousButton = event.target.closest("[data-previous-location]");
      if (previousButton && rootElement.contains(previousButton)) {
        const previousId = previousCaseId(getFilteredCases(), selectedCaseId);
        if (previousId) {
          selectedCaseId = previousId;
          if (!["stats", "truth", "prediction", "playback"].includes(drawerMode)) clearDrawerState();
          render({ focusActiveCard: true, fitMap: true });
        }
        return;
      }

      const nextButton = event.target.closest("[data-next-location]");
      if (nextButton && rootElement.contains(nextButton)) {
        const nextId = nextCaseId(getFilteredCases(), selectedCaseId);
        if (nextId) {
          selectedCaseId = nextId;
          if (!["stats", "truth", "prediction", "playback"].includes(drawerMode)) {
            clearDrawerState();
          }
          render({ focusActiveCard: true, fitMap: true });
        }
        return;
      }

      const discoverButton = event.target.closest("[data-discover-location]");
      if (discoverButton && rootElement.contains(discoverButton)) {
        const candidates = getAvailableOverviewCases(getFilteredCases());
        const destination = candidates[Math.floor(Math.random() * candidates.length)];
        if (destination) {
          clearDrawerState();
          api.selectCase(destination.id);
          elements.backOverview.focus({ preventScroll: true });
        }
        return;
      }

      const caseButton = event.target.closest("[data-case-id]");
      if (caseButton && rootElement.contains(caseButton)) {
        selectedCaseId = caseButton.dataset.caseId;
        if (caseButton.dataset.caseModel) selectedModel = caseButton.dataset.caseModel;
        if (caseButton.dataset.caseCondition) selectedCondition = caseButton.dataset.caseCondition;
        if (caseButton.dataset.openEvidence === "true") {
          evidenceMode = true;
          evidenceComparisonMode = false;
          showTextOnlyClues = false;
          selectedCueId = null;
        }
        if (!["stats", "truth", "prediction", "playback"].includes(drawerMode)) {
          clearDrawerState();
        }
        render({ focusActiveCard: true, fitMap: true });
        if (caseButton.closest("[data-project-story]")) {
          scrollToProjectSection(rootElement, "explorer");
          elements.backOverview.focus({ preventScroll: true });
        }
        return;
      }

      const resetButton = event.target.closest("[data-reset-map]");
      if (resetButton && rootElement.contains(resetButton)) {
        mapController.resetView();
        sideMapController?.resetView();
        return;
      }

      const clearButton = event.target.closest("[data-clear-filters]");
      if (clearButton && rootElement.contains(clearButton)) {
        query = "";
        filters = { competition: "", country: "", difficulty: "", sceneType: "" };
        elements.search.value = "";
        renderFilterOptions();
        render({ updateHash: false, fitMap: true });
        return;
      }

      const statsButton = event.target.closest("[data-stats-button]");
      if (statsButton && rootElement.contains(statsButton)) {
        if (drawerMode === "stats") {
          clearDrawerState();
        } else {
          clearDrawerState();
          drawerMode = "stats";
        }
        render({ fitMap: false });
        return;
      }

      const evidenceButton = event.target.closest("[data-open-model-evidence]");
      if (evidenceButton && rootElement.contains(evidenceButton)) {
        const caseItem = getSelectedCase();
        const run = caseItem ? getSelectedRun(caseItem) : null;
        if (caseItem && run) {
          setComparisonMapFullscreen(false);
          evidenceMode = true;
          evidenceComparisonMode = false;
          showTextOnlyClues = false;
          selectedCueId = null;
          clearDrawerState();
          render({ fitMap: false });
        }
        return;
      }

      const evidenceBackButton = event.target.closest("[data-close-evidence]");
      if (evidenceBackButton && rootElement.contains(evidenceBackButton)) {
        const wasComparison = evidenceComparisonMode;
        evidenceMode = false;
        evidenceComparisonMode = false;
        showTextOnlyClues = false;
        selectedCueId = null;
        render({ fitMap: true });
        window.requestAnimationFrame(() => {
          (wasComparison ? elements.compareModelsButton : elements.sceneClueSummary).focus({ preventScroll: true });
        });
        return;
      }

      const textOnlyButton = event.target.closest("[data-toggle-text-clues]");
      if (textOnlyButton && rootElement.contains(textOnlyButton)) {
        showTextOnlyClues = !showTextOnlyClues;
        const caseItem = getSelectedCase();
        renderEvidenceView(caseItem, caseItem ? getSelectedRun(caseItem) : null, comparisonRunsForCase(caseItem));
        return;
      }

      const closeTextOnlyButton = event.target.closest("[data-close-text-clues]");
      if (closeTextOnlyButton && rootElement.contains(closeTextOnlyButton)) {
        showTextOnlyClues = false;
        const caseItem = getSelectedCase();
        renderEvidenceView(caseItem, caseItem ? getSelectedRun(caseItem) : null, comparisonRunsForCase(caseItem));
        return;
      }

      const closeEvidenceDetailButton = event.target.closest("[data-close-evidence-detail]");
      if (closeEvidenceDetailButton && rootElement.contains(closeEvidenceDetailButton)) {
        selectedCueId = null;
        const caseItem = getSelectedCase();
        renderEvidenceView(caseItem, caseItem ? getSelectedRun(caseItem) : null, comparisonRunsForCase(caseItem));
        return;
      }

      const compareButton = event.target.closest("[data-toggle-model-comparison]");
      if (compareButton && rootElement.contains(compareButton)) {
        const caseItem = getSelectedCase();
        if (caseItem) {
          comparisonMode = !comparisonMode;
          conditionComparisonMode = false;
          if (comparisonMode && comparedModels.size === 0) {
            modelPredictionRuns(caseItem.runs).forEach((item) => comparedModels.add(item.model));
          }
          render({ fitMap: true });
        }
        return;
      }

      const compareConditionsButton = event.target.closest("[data-toggle-condition-comparison]");
      if (compareConditionsButton && rootElement.contains(compareConditionsButton)) {
        const caseItem = getSelectedCase();
        if (caseItem) {
          conditionComparisonMode = !conditionComparisonMode;
          comparisonMode = false;
          render({ fitMap: true });
        }
        return;
      }

      const comparisonMapFullscreenButton = event.target.closest("[data-toggle-comparison-map-fullscreen]");
      if (comparisonMapFullscreenButton && rootElement.contains(comparisonMapFullscreenButton)) {
        setComparisonMapFullscreen(!comparisonMapFullscreen);
        return;
      }

      const comparisonCloseButton = event.target.closest("[data-close-model-comparison]");
      if (comparisonCloseButton && rootElement.contains(comparisonCloseButton)) {
        comparisonMode = false;
        conditionComparisonMode = false;
        render({ fitMap: true });
        return;
      }

      const comparisonInput = event.target.closest("[data-compare-model]");
      if (comparisonInput && rootElement.contains(comparisonInput)) {
        if (comparisonInput.checked) comparedModels.add(comparisonInput.value);
        else comparedModels.delete(comparisonInput.value);
        render({ fitMap: true });
        return;
      }

      const openComparisonEvidence = event.target.closest("[data-open-comparison-evidence]");
      if (openComparisonEvidence && rootElement.contains(openComparisonEvidence) && comparedModels.size) {
        setComparisonMapFullscreen(false);
        selectedCueId = null;
        evidenceMode = true;
        evidenceComparisonMode = true;
        showTextOnlyClues = false;
        render({ fitMap: false });
        return;
      }

      const clueButton = event.target.closest("[data-highlight-clue-id]");
      if (clueButton && rootElement.contains(clueButton)) {
        const nextCueId = clueButton.dataset.highlightClueId;
        selectedCueId = evidenceMode && selectedCueId === nextCueId ? null : nextCueId;
        if (evidenceMode) {
          const caseItem = getSelectedCase();
          renderEvidenceView(caseItem, caseItem ? getSelectedRun(caseItem) : null, comparisonRunsForCase(caseItem));
        } else {
          renderDrawer(getSelectedCase(), getSelectedCase() ? getSelectedRun(getSelectedCase()) : null, getFilteredCases());
        }
        return;
      }

      const closeDrawerButton = event.target.closest("[data-close-drawer]");
      if (closeDrawerButton && rootElement.contains(closeDrawerButton)) {
        clearDrawerState();
        renderDrawer(getSelectedCase(), getSelectedCase() ? getSelectedRun(getSelectedCase()) : null, getFilteredCases());
        return;
      }

      const openCurrentViewButton = event.target.closest("[data-open-current-view]");
      if (
        EXPLORATION_PLAYBACK_ENABLED &&
        openCurrentViewButton &&
        rootElement.contains(openCurrentViewButton)
      ) {
        const caseItem = getSelectedCase();
        const run = caseItem ? getSelectedRun(caseItem) : null;
        const sample = run?.exploration?.samples?.[playbackIndex] ?? null;
        const frame = run?.exploration && sample ? playbackFrameForSample(run.exploration, sample) : null;
        const reviewMedia = resolvePlaybackReviewMedia({
          imageUrl: assetImageUrl(frame?.image),
          videoUrl: assetVideoUrl(run?.exploration?.video),
        });
        if (reviewMedia.videoUrl && !reviewMedia.imageUrl) {
          event.preventDefault();
          drawerMode = "playback";
          drawerSample = sample;
          drawerSeekMs = Number.isFinite(playbackTimeMs)
            ? playbackTimeMs
            : sample?.tMs ?? 0;
          drawerCaseId = caseItem?.id ?? null;
          drawerRunId = run?.id ?? null;
          render({ fitMap: false });
          return;
        }
      }

      const momentButton = event.target.closest("[data-moment-index]");
      if (
        EXPLORATION_PLAYBACK_ENABLED &&
        momentButton &&
        rootElement.contains(momentButton)
      ) {
        const index = Number(momentButton.dataset.momentIndex);
        const momentTimeMs = Number(momentButton.dataset.momentTimeMs);

        if (Number.isInteger(index)) {
          const caseItem = getSelectedCase();
          const run = caseItem ? getSelectedRun(caseItem) : null;

          // Open the playback sidebar automatically.
          drawerMode = "playback";
          drawerCaseId = caseItem?.id ?? null;
          drawerRunId = run?.id ?? null;

          // Jump both timeline and video to the exact semantic keypoint.
          setPlaybackIndex(index, {
            keepPlaying: false,
            exactTimeMs: Number.isFinite(momentTimeMs)
              ? momentTimeMs
              : null,
          });
        }

        return;
      }
    };

    const onSearch = (event) => {
      query = event.target.value.trim().toLocaleLowerCase();
      if (selectedCaseId && !getFilteredCases().some((item) => item.id === selectedCaseId)) {
        enterOverview();
      }
      render({ updateHash: false, fitMap: true });
    };

    const onFilterChange = () => {
      filters = {
        competition: elements.competitionFilter.value,
        country: elements.countryFilter.value,
        difficulty: elements.difficultyFilter.value,
        sceneType: elements.sceneFilter.value,
      };
      if (selectedCaseId && !getFilteredCases().some((item) => item.id === selectedCaseId)) {
        enterOverview();
      }
      render({ updateHash: false, fitMap: true });
    };

    const onModelChange = (event) => {
      selectedModel = event.target.value || null;
      if (isStaticBaselineModel(selectedModel)) {
        selectedCondition = "static-image";
      }
      selectedCueId = null;
      showTextOnlyClues = false;
      drawerSample = null;
      render({ fitMap: true });
    };

    const onConditionChange = (event) => {
      selectedCondition = event.target.value || null;
      drawerSample = null;
      render({ fitMap: true });
    };

    const onImageVariantChange = (event) => {
      selectedImageVariant =
        event.target.value || DEFAULT_IMAGE_VARIANT;
      selectedCueId = null;
      showTextOnlyClues = false;
      drawerSample = null;
      render({ fitMap: true });
    };

    const onPlayToggle = () => {
      if (!EXPLORATION_PLAYBACK_ENABLED) return;
      if (playbackPlaying) {
        stopPlayback();
      } else {
        startPlayback();
      }
      renderPlaybackView();
    };

    const onTimelineInput = (event) => {
      if (!EXPLORATION_PLAYBACK_ENABLED) return;
      const index = Number(event.target.value);
      if (Number.isInteger(index)) {
        setPlaybackIndex(index, { keepPlaying: playbackPlaying });
      }
    };

    const onSpeedChange = (event) => {
      if (!EXPLORATION_PLAYBACK_ENABLED) return;
      playbackSpeed = Number(event.target.value) || 1;
      renderPlaybackView();
    };

    const onHashChange = () => {
      if (!syncHash) return;
      const selection = readSelectionFromHash();
      selectedCaseId =
        selection.caseId && data.some((item) => item.id === selection.caseId)
          ? selection.caseId
          : null;
      if (selection.model) selectedModel = selection.model;
      if (selection.condition) selectedCondition = selection.condition;
      if (selection.imageVariant) {
        selectedImageVariant = selection.imageVariant;
      }
      clearDrawerState();
      render({ updateHash: false, fitMap: true });
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape" && comparisonMapFullscreen) {
        setComparisonMapFullscreen(false, { restoreFocus: true });
      } else if (event.key === "Escape" && evidenceMode && selectedCueId) {
        selectedCueId = null;
        const caseItem = getSelectedCase();
        renderEvidenceView(caseItem, caseItem ? getSelectedRun(caseItem) : null, comparisonRunsForCase(caseItem));
      } else if (event.key === "Escape" && drawerMode === "stats") {
        clearDrawerState();
        renderDrawer(getSelectedCase(), getSelectedCase() ? getSelectedRun(getSelectedCase()) : null, getFilteredCases());
      }
    };

    const onOutsideStatsTap = (event) => {
      if (drawerMode !== "stats" || event.target.closest("[data-drawer], [data-stats-button]")) return;
      clearDrawerState();
      renderDrawer(getSelectedCase(), getSelectedCase() ? getSelectedRun(getSelectedCase()) : null, getFilteredCases());
    };

    rootElement.addEventListener("click", onClick);
    document.addEventListener("pointerdown", onOutsideStatsTap);
    elements.search.addEventListener("input", onSearch);
    elements.competitionFilter.addEventListener("change", onFilterChange);
    elements.countryFilter.addEventListener("change", onFilterChange);
    elements.difficultyFilter.addEventListener("change", onFilterChange);
    elements.sceneFilter.addEventListener("change", onFilterChange);
    elements.modelSelect.addEventListener("change", onModelChange);
    elements.conditionSelect.addEventListener("change", onConditionChange);
    elements.imageVariantSelect.addEventListener("change", onImageVariantChange);
    elements.playToggle.addEventListener("click", onPlayToggle);
    elements.timeline.addEventListener("input", onTimelineInput);
    elements.speedSelect.addEventListener("change", onSpeedChange);
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("scroll", onStoryPositionChange, { passive: true });
    const onViewportResize = () => {
      onStoryPositionChange();
      syncDetailControlPlacement(rootElement.dataset.viewState === "detail" && !evidenceMode);
      mapController.invalidateSize();
    };
    window.addEventListener("resize", onViewportResize);
    window.addEventListener("keydown", onKeyDown);
    updateStoryNavigation();

    disposers.push(() => rootElement.removeEventListener("click", onClick));
    disposers.push(() => document.removeEventListener("pointerdown", onOutsideStatsTap));
    disposers.push(() => elements.search.removeEventListener("input", onSearch));
    disposers.push(() => elements.competitionFilter.removeEventListener("change", onFilterChange));
    disposers.push(() => elements.countryFilter.removeEventListener("change", onFilterChange));
    disposers.push(() => elements.difficultyFilter.removeEventListener("change", onFilterChange));
    disposers.push(() => elements.sceneFilter.removeEventListener("change", onFilterChange));
    disposers.push(() => elements.modelSelect.removeEventListener("change", onModelChange));
    disposers.push(() => elements.conditionSelect.removeEventListener("change", onConditionChange));
    disposers.push(() => elements.imageVariantSelect.removeEventListener("change", onImageVariantChange));
    disposers.push(() => elements.playToggle.removeEventListener("click", onPlayToggle));
    disposers.push(() => elements.timeline.removeEventListener("input", onTimelineInput));
    disposers.push(() => elements.speedSelect.removeEventListener("change", onSpeedChange));
    disposers.push(() => window.removeEventListener("hashchange", onHashChange));
    disposers.push(() => window.removeEventListener("scroll", onStoryPositionChange));
    disposers.push(() => window.removeEventListener("resize", onViewportResize));
    disposers.push(() => window.removeEventListener("keydown", onKeyDown));
    disposers.push(() => {
      if (storyNavigationFrame) window.cancelAnimationFrame(storyNavigationFrame);
    });
  }

  function render({
    updateHash = true,
    fitMap = false,
    focusActiveCard = false,
    announceData = false,
  } = {}) {
    assertAlive();

    const filteredCases = getFilteredCases();
    const caseItem = getSelectedCase();
    ensureRunControlState(caseItem, filteredCases);
    const run = caseItem ? getSelectedRun(caseItem) : null;
    const overviewRuns = caseItem
      ? []
      : overviewPredictionRuns(
        filteredCases,
        selectedModel,
        selectedCondition,
        selectedImageVariant,
      );
    const overviewCases = caseItem
      ? filteredCases
      : getAvailableOverviewCases(filteredCases);
    const overviewCaseIds = new Set(overviewRuns.map((entry) => entry.caseId));
    const mapCases = caseItem
      ? [caseItem]
      : filteredCases.filter((item) => overviewCaseIds.has(item.id));
    const comparisonRuns = comparisonRunsForCase(caseItem);

    resetPlaybackIfSelectionChanged(caseItem, run);
    renderImmersiveShell(caseItem, run, filteredCases);
    renderLocationList(overviewCases);
    renderRunControls(caseItem, run, filteredCases);
    renderMapHeader(caseItem, run, overviewCases, overviewRuns);
    renderComparison(caseItem, run, comparisonRuns);
    renderModelComparison(caseItem, comparisonRuns);
    renderEvidenceView(caseItem, run, comparisonRuns);
    renderExplorationPlayer(caseItem, run);
    renderDrawer(caseItem, run, getStatsCases(caseItem, filteredCases));

    mapController.update(
      {
        cases: mapCases,
        caseItem,
        run,
        overviewRuns,
        comparisonRuns,
        overview: !caseItem,
        playback: getPlaybackDescriptor(run),
      },
      { fit: fitMap },
    );

    if (syncHash && updateHash) {
      writeSelectionToHash(caseItem, run);
    }

    const signature = caseItem && run ? `${caseItem.id}:${run.id}` : "overview";
    if (signature !== lastSelectionSignature) {
      lastSelectionSignature = signature;
      rootElement.dispatchEvent(
        new CustomEvent("geoatlas:selectionchange", {
          bubbles: true,
          detail: {
            caseId: caseItem?.id ?? null,
            runId: run?.id ?? null,
            model: run?.model ?? selectedModel,
            condition: run?.condition ?? selectedCondition,
            imageVariant: isStaticBaselineModel(run?.model ?? selectedModel)
              ? runImageVariant(run)
              : null,
            errorKm: run?.errorKm ?? null,
          },
        }),
      );
    }

    if (announceData) {
      rootElement.dispatchEvent(
        new CustomEvent("geoatlas:datachange", {
          bubbles: true,
          detail: { caseCount: data.length },
        }),
      );
    }

    if (shouldFocusLocationCard({
      requested: focusActiveCard && Boolean(selectedCaseId),
      listHidden: elements.datasetBrowser.hidden,
    })) {
      window.requestAnimationFrame(() => {
        elements.locationList
          .querySelector(`[data-case-id="${cssEscape(selectedCaseId)}"]`)
          ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    }
  }

  function renderImmersiveShell(caseItem, run, filteredCases) {
    const view = buildImmersiveView({ cases: filteredCases, caseItem, run });
    const imageUrl = caseItem
      ? assetImageUrl(imageForRun(caseItem, run))
      : null;
    streetView.setCase(caseItem);

    rootElement.dataset.viewState = view.state;
    rootElement.dataset.evidenceMode = String(Boolean(evidenceMode && caseItem && run));
    elements.appShell.dataset.viewState = view.state;
    elements.appShell.dataset.evidenceMode = String(Boolean(evidenceMode && caseItem && run));
    syncDetailControlPlacement(view.state === "detail" && !evidenceMode);
    document.documentElement.classList.toggle("explorer-detail-open", view.state === "detail");
    elements.backOverview.hidden = view.state === "overview";
    elements.datasetBrowser.hidden = view.state === "detail";
    elements.nextLocation.hidden = view.state === "overview";
    elements.previousLocation.hidden = view.state === "overview";
    elements.globeStatsSlot.hidden = Boolean(evidenceMode);
    syncComparisonMapFullscreenControl();

    if (imageUrl && caseItem) {
      const sceneAlt = `Starting street scene in ${caseItem.city}, ${caseItem.country}`;
      swapImageSourceWithoutFlicker(elements.sceneImage, imageUrl, sceneAlt);
      swapImageSourceWithoutFlicker(elements.detailSceneImage, imageUrl, sceneAlt);
    } else {
      for (const image of [elements.sceneImage, elements.detailSceneImage]) {
        image.dataset.pendingSrc = "";
        image.hidden = true;
        image.removeAttribute("src");
        image.alt = "";
      }
    }

    renderEvidenceSummary(caseItem, run);

    const nextId = nextCaseId(filteredCases, caseItem?.id ?? null);
    const nextCase = filteredCases.find((item) => item.id === nextId) ?? null;
    elements.nextLabel.textContent = nextCase
      ? `${nextCase.city}, ${nextCase.country}`
      : "Next location";
    const previousId = previousCaseId(filteredCases, caseItem?.id ?? null);
    const previousCase = filteredCases.find((item) => item.id === previousId) ?? null;
    elements.previousLabel.textContent = previousCase
      ? `${previousCase.city}, ${previousCase.country}`
      : "Previous location";

  }

  function syncDetailControlPlacement(useDetailRail) {
    const destination = useDetailRail
      ? elements.detailActions
      : elements.experienceDock;
    const controls = [
      elements.compareModelsButton,
      elements.compareConditionsButton,
      elements.previousLocation,
      elements.nextLocation,
    ];

    controls.forEach((control) => {
      if (control.parentElement !== destination) destination.append(control);
    });

    const runControlsDestination = useDetailRail
      ? elements.detailRunControls
      : elements.experienceDock;
    if (elements.runControls.parentElement !== runControlsDestination) {
      if (useDetailRail) {
        runControlsDestination.append(elements.runControls);
      } else {
        runControlsDestination.prepend(elements.runControls);
      }
    }

    const statsDestination = useDetailRail
      ? elements.mapUtilityActions
      : elements.experienceDock;
    if (elements.globeStatsSlot.parentElement !== statsDestination) {
      statsDestination.prepend(elements.globeStatsSlot);
    }
  }

  function setComparisonMapFullscreen(next, { restoreFocus = false } = {}) {
    comparisonMapFullscreen = Boolean(next && getSelectedCase() && !evidenceMode);
    syncComparisonMapFullscreenControl();
    window.requestAnimationFrame(() => {
      sideMapController?.invalidateSize();
      window.requestAnimationFrame(() => {
        sideMapController?.resetView();
        if (restoreFocus) elements.comparisonMapFullscreenButton.focus({ preventScroll: true });
      });
    });
  }

  function syncComparisonMapFullscreenControl() {
    rootElement.dataset.comparisonMapFullscreen = String(comparisonMapFullscreen);
    elements.appShell.dataset.comparisonMapFullscreen = String(comparisonMapFullscreen);
    document.documentElement.classList.toggle("explorer-comparison-map-fullscreen", comparisonMapFullscreen);
    elements.comparisonMapFullscreenButton.setAttribute("aria-pressed", String(comparisonMapFullscreen));
    elements.comparisonMapFullscreenButton.setAttribute(
      "aria-label",
      comparisonMapFullscreen
        ? "Exit full-screen ground truth and prediction map"
        : "Expand ground truth and prediction map",
    );
    elements.comparisonMapFullscreenIcon.className = comparisonMapFullscreen
      ? "ph ph-corners-in"
      : "ph ph-corners-out";
    elements.comparisonMapFullscreenLabel.textContent = comparisonMapFullscreen
      ? "Exit full screen"
      : "Expand map";
  }

  function renderEvidenceSummary(caseItem, run) {
    const clues = availableEvidenceCues(caseItem, run);
    const visible = Boolean(caseItem && run && clues.length && !evidenceMode);
    elements.sceneClueSummary.hidden = !visible;

    if (!visible) {
      elements.sceneClueCount.textContent = "0";
      elements.sceneClueModel.textContent = "";
      return;
    }

    elements.sceneClueCount.textContent = String(clues.length);
    elements.sceneClueModel.textContent = run.model;
    elements.sceneClueSummary.setAttribute(
      "aria-label",
      `Open ${clues.length} visual clues reported by ${run.model}`,
    );
  }

  function renderEvidenceView(caseItem, run, comparisonRuns = []) {
    const visible = Boolean(evidenceMode && caseItem && run);
    elements.evidenceView.hidden = !visible;
    if (!visible) return;
    elements.evidenceView.dataset.comparison = String(evidenceComparisonMode);

    const evidenceRuns = evidenceComparisonMode && comparisonRuns.length ? comparisonRuns : [run];
    const items = evidenceRuns.flatMap((item) => {
      const clueSet = (caseItem.clueSets ?? []).find((set) => set.benchmarkId === item.benchmarkId || set.id === item.benchmarkId);
      return (clueSet?.cues ?? [])
        .filter((clue) => clue.annotationStatus !== "excluded")
        .map((clue) => ({
          clue,
          color: comparisonColor(item.comparisonColorKey ?? item.model),
          key: evidenceComparisonMode ? `${item.id}::${clue.id}` : clue.id,
          model: item.comparisonLabel ?? item.model,
        }));
    });
    const grounded = items
      .filter(({ clue }) => clue.region)
      .map((item, index) => ({ ...item, number: index + 1 }));
    const nonSpatial = items.filter(({ clue }) => !clue.region);
    const selected = items.find((item) => item.key === selectedCueId) ?? null;
    const imageUrl = assetImageUrl(imageForRun(caseItem, run));

    elements.evidenceImage.src = imageUrl || "";
    elements.evidenceImage.alt = evidenceComparisonMode
      ? `Visual clue comparison for ${caseItem.city}, ${caseItem.country}`
      : `Visual clues reported by ${run.model} for ${caseItem.city}, ${caseItem.country}`;
    elements.evidenceMarks.innerHTML = evidenceMarksMarkup(grounded, selectedCueId, evidenceComparisonMode);
    elements.evidenceHeading.textContent = `${caseItem.city}, ${caseItem.country}`;
    elements.evidenceModel.textContent = evidenceComparisonMode
      ? `${evidenceRuns.length} models compared`
      : "";
    elements.evidenceModel.hidden = !evidenceComparisonMode;
    elements.evidenceCount.textContent = String(items.length);
    elements.evidenceLegend.hidden = !evidenceComparisonMode;
    elements.evidenceLegend.innerHTML = evidenceComparisonMode
      ? evidenceRuns.map((item) => `<span style="--comparison-color:${comparisonColor(item.comparisonColorKey ?? item.model)}"><i aria-hidden="true"></i>${escapeHtml(item.comparisonLabel ?? item.model)}</span>`).join("")
      : "";
    elements.evidenceTextToggle.hidden = nonSpatial.length === 0;
    elements.evidenceTextToggle.innerHTML = `<i class="ph-fill ph-sparkle" aria-hidden="true"></i><span class="evidence-text-toggle__full">Non-spatial clues · ${nonSpatial.length}</span><span class="evidence-text-toggle__compact">Text clues · ${nonSpatial.length}</span>`;
    elements.evidenceTextToggle.setAttribute(
      "aria-label",
      `${showTextOnlyClues ? "Hide" : "Open"} ${nonSpatial.length} non-spatial ${nonSpatial.length === 1 ? "clue" : "clues"}`,
    );
    elements.evidenceTextToggle.setAttribute("aria-expanded", String(showTextOnlyClues));
    elements.evidenceTextPanel.hidden = !showTextOnlyClues;
    elements.evidenceTextPanel.innerHTML = `<header><h3>Non-spatial evidence</h3><button type="button" data-close-text-clues aria-label="Close non-spatial evidence"><i class="ph ph-x" aria-hidden="true"></i></button></header><p>Reported clues that Florence could not localize reliably stay visible here without invented boxes.</p><ul>${nonSpatial.map((item) => `<li style="--comparison-color:${item.color}">${evidenceComparisonMode ? `<small>${escapeHtml(item.model)}</small>` : ""}<strong>${escapeHtml(item.clue.label)}</strong><span>${escapeHtml(item.clue.description)}</span></li>`).join("")}</ul>`;
    elements.evidenceDetail.hidden = !selected;
    elements.evidenceDetail.style.setProperty("--comparison-color", selected?.color ?? "");
    elements.evidenceDetail.innerHTML = selected ? `
      <header class="evidence-clue-detail__header">
        <small>${escapeHtml(evidenceComparisonMode ? `${selected.model} · ${clueStatusLabel(selected.clue.annotationStatus)}` : clueStatusLabel(selected.clue.annotationStatus))}</small>
        <button type="button" data-close-evidence-detail aria-label="Close clue description"><i class="ph ph-x" aria-hidden="true"></i></button>
      </header>
      <h3>${escapeHtml(selected.clue.label)}</h3>
      <p>${escapeHtml(selected.clue.description)}</p>
      <div class="cue-ratings cue-ratings--detail" aria-label="Clue rating verdicts">${ratingPills(selected.clue.ratings)}</div>` : "";
  }

  function renderFilterOptions() {
    const competitions = uniqueBy(
      data.flatMap((item) => item.competitions ?? []),
      (item) => item.competitionId,
    ).sort(
      (a, b) =>
        (a.competitionOrder ?? Number.MAX_SAFE_INTEGER) -
        (b.competitionOrder ?? Number.MAX_SAFE_INTEGER) ||
        a.competitionName.localeCompare(b.competitionName),
    );

    setSelectOptions(
      elements.competitionFilter,
      competitions.map((item) => item.competitionId),
      "All competitions",
      filters.competition,
      (value) => competitions.find((item) => item.competitionId === value)?.competitionName ?? value,
    );
    setSelectOptions(
      elements.countryFilter,
      unique(data.map((item) => item.country)).sort(),
      "All countries",
      filters.country,
    );
    setSelectOptions(
      elements.difficultyFilter,
      ["easy", "medium", "hard"],
      "All difficulties",
      filters.difficulty,
      (value) => DIFFICULTY_LABELS[value] ?? value,
    );
    setSelectOptions(
      elements.sceneFilter,
      unique(data.map((item) => item.sceneType).filter(Boolean)).sort(),
      "All scene types",
      filters.sceneType,
    );
  }

  function renderLocationList(filteredCases) {
    rootElement.querySelector("[data-discover-location]").disabled = filteredCases.length === 0;
    elements.resultCount.textContent = `${filteredCases.length} / ${data.length}`;
    elements.overviewCount.textContent = String(filteredCases.length);
    elements.overviewButton.classList.toggle("is-active", selectedCaseId === null);
    elements.overviewButton.setAttribute("aria-pressed", String(selectedCaseId === null));

    if (filteredCases.length === 0) {
      elements.locationList.innerHTML = `
        <div class="empty-state">
          <strong>No matching locations</strong>
          <span>Change the search or filters.</span>
        </div>
      `;
      return;
    }

    // Keep the existing card/image DOM when only the selected run slice changes
    // (for example Original OpenGuessr -> No location GUI). Replacing the whole
    // list makes every image element disappear and reappear, which causes a
    // visible flash even when the files are already cached.
    const existingCards = [...elements.locationList.querySelectorAll(
      ":scope > .location-card[data-case-id]",
    )];
    const sameCaseOrder =
      existingCards.length === filteredCases.length &&
      existingCards.every(
        (card, index) => card.dataset.caseId === filteredCases[index]?.id,
      );

    if (sameCaseOrder) {
      filteredCases.forEach((item, index) => {
        syncLocationCard(existingCards[index], item);
      });
      return;
    }

    elements.locationList.innerHTML = filteredCases
      .map((item) => locationCardMarkup(item))
      .join("");
  }

  function syncLocationCard(card, item) {
    if (!card || !item) return;

    const active = item.id === selectedCaseId;
    card.classList.toggle("is-active", active);
    card.setAttribute("aria-pressed", String(active));

    const matchingRun = chooseRun(
      item,
      selectedModel,
      selectedCondition,
      selectedImageVariant,
    );
    const thumbnail = assetImageUrl(imageForRun(item, matchingRun));

    let image = card.querySelector(".location-card__image");
    if (thumbnail) {
      if (!image) {
        image = document.createElement("img");
        image.className = "location-card__image";
        image.alt = "";
        image.loading = "lazy";
        image.decoding = "async";
        const pin = card.querySelector(".location-card__pin");
        card.insertBefore(image, pin ?? card.firstChild);
      }
      swapImageSourceWithoutFlicker(image, thumbnail, "");
    } else if (image) {
      image.remove();
    }

    const meta = card.querySelector(".location-card__meta");
    if (meta) {
      meta.innerHTML = matchingRun
        ? `<span>${escapeHtml(runConditionLabel(matchingRun))}</span><b>${hasCoordinate(matchingRun.prediction) ? escapeHtml(formatDistance(matchingRun.errorKm)) : "Recording only"}</b>`
        : `<span>${escapeHtml(DIFFICULTY_LABELS[item.difficulty])}</span><b>Unavailable</b>`;
    }
  }

  function swapImageSourceWithoutFlicker(image, nextUrl, alt = "") {
    if (!image) return;

    const currentUrl = image.getAttribute("src") ?? "";
    image.alt = alt;

    if (!nextUrl) {
      image.dataset.pendingSrc = "";
      image.hidden = true;
      image.removeAttribute("src");
      return;
    }

    if (currentUrl === nextUrl) {
      image.dataset.pendingSrc = nextUrl;
      image.hidden = false;
      return;
    }

    // Keep the old bitmap visible until the replacement is loaded and decoded.
    // The token prevents a slower previous request from winning if the user
    // switches variants quickly.
    image.dataset.pendingSrc = nextUrl;
    if (!currentUrl) image.hidden = true;

    const preload = new Image();
    preload.decoding = "async";

    const commit = () => {
      if (image.dataset.pendingSrc !== nextUrl) return;
      image.src = nextUrl;
      image.alt = alt;
      image.hidden = false;
    };

    preload.onload = commit;
    preload.onerror = () => {
      if (image.dataset.pendingSrc !== nextUrl) return;
      if (!currentUrl) image.hidden = true;
    };
    preload.src = nextUrl;

    if (typeof preload.decode === "function") {
      preload.decode().then(commit).catch(() => {
        // onload remains the fallback for browsers that reject decode().
      });
    }
  }

  function renderRunControls(caseItem, run, filteredCases) {
    const scope = getScopeRuns(caseItem, filteredCases);
    const allModels = unique(scope.map((item) => item.model));
    const { regular: regularModels, baselines: baselineModels } =
      splitModelsForSelector(allModels);

    const hasRuns = scope.length > 0;
    elements.modelSelect.disabled = !hasRuns;

    if (!hasRuns) {
      elements.modelSelect.innerHTML = '<option value="">No runs yet</option>';
      elements.conditionControl.hidden = false;
      elements.conditionControl.style.display = "";
      elements.conditionSelect.innerHTML = '<option value="">No runs yet</option>';
      elements.conditionSelect.disabled = true;
      elements.imageVariantControl.hidden = true;
      elements.imageVariantControl.style.display = "none";
      elements.imageVariantSelect.disabled = true;
      elements.imageVariantSelect.innerHTML = "";
      return;
    }

    const activeModel = run?.model ?? selectedModel;
    const activeCondition = run?.condition ?? selectedCondition;
    const activeImageVariant =
      run?.imageVariant ??
      selectedImageVariant ??
      DEFAULT_IMAGE_VARIANT;

    const optionMarkup = (model) =>
      '<option value="' +
      escapeAttribute(model) +
      '" ' +
      (model === activeModel ? "selected" : "") +
      ">" +
      escapeHtml(model) +
      "</option>";

    const modelGroups = [];

    if (regularModels.length) {
      modelGroups.push(
        '<optgroup label="MLLM agents">' +
        regularModels.map(optionMarkup).join("") +
        "</optgroup>",
      );
    }

    if (baselineModels.length) {
      modelGroups.push(
        '<optgroup label="Static baselines">' +
        baselineModels.map(optionMarkup).join("") +
        "</optgroup>",
      );
    }

    elements.modelSelect.innerHTML = modelGroups.join("");

    if (isStaticBaselineModel(activeModel)) {
      // Static baselines only have the Static/NMPZ benchmark condition.
      // Hide the redundant Condition control and show the image-variant control.
      elements.conditionControl.hidden = true;
      elements.conditionControl.style.display = "none";
      elements.conditionSelect.innerHTML =
        '<option value="static-image" selected>' +
        escapeHtml(CONDITION_LABELS["static-image"] ?? "Static image") +
        "</option>";
      elements.conditionSelect.disabled = true;

      const imageVariants = unique(
        scope
          .filter(
            (item) =>
              item.model === activeModel &&
              item.condition === "static-image",
          )
          .map((item) => runImageVariant(item)),
      );

      elements.imageVariantControl.hidden = false;
      elements.imageVariantControl.style.display = "";
      elements.imageVariantSelect.disabled = imageVariants.length <= 1;
      elements.imageVariantSelect.innerHTML = imageVariants
        .map(
          (variant) =>
            '<option value="' +
            escapeAttribute(variant) +
            '" ' +
            (variant === activeImageVariant ? "selected" : "") +
            ">" +
            escapeHtml(IMAGE_VARIANT_LABELS[variant] ?? variant) +
            "</option>",
        )
        .join("");
      return;
    }

    // MLLM/agent models use benchmark conditions, not image variants.
    // Show Condition and remove the image-variant control from the layout entirely.
    elements.conditionControl.hidden = false;
    elements.conditionControl.style.display = "";
    elements.imageVariantControl.hidden = true;
    elements.imageVariantControl.style.display = "none";
    elements.imageVariantSelect.disabled = true;
    elements.imageVariantSelect.innerHTML = "";

    const modelConditions = unique(
      scope
        .filter((item) => item.model === activeModel)
        .map((item) => item.condition),
    );

    const conditions = modelConditions.length
      ? modelConditions
      : unique(scope.map((item) => item.condition));

    // A one-item native select only opens a detached browser popup without
    // offering a choice. Keep its value readable but make it inert.
    elements.conditionSelect.disabled = conditions.length <= 1;
    elements.conditionSelect.innerHTML = conditions
      .map(
        (condition) =>
          '<option value="' +
          escapeAttribute(condition) +
          '" ' +
          (condition === activeCondition ? "selected" : "") +
          ">" +
          escapeHtml(CONDITION_LABELS[condition] ?? condition) +
          "</option>",
      )
      .join("");
  }
  function renderMapHeader(caseItem, run, filteredCases, overviewRuns = []) {
    elements.resetMapLabel.textContent = mapResetActionLabel({
      hasSelection: Boolean(caseItem),
      hasRun: Boolean(run),
      hasPrediction: hasCoordinate(run?.prediction),
    });
    elements.mapLegend.innerHTML = mapLegendMarkup(
      mapLegendItems({
        overview: !caseItem,
        hasPrediction: caseItem
          ? hasCoordinate(run?.prediction)
          : overviewRuns.length > 0,
        hasExploration: Boolean(run?.exploration?.path?.length > 1),
      }),
    );

    if (!caseItem) {
      const competition = filteredCases
        .flatMap((item) => item.competitions ?? [])
        .find((membership) => membership.competitionId === filters.competition);
      elements.mapEyebrow.textContent = competition
        ? competition.competitionName
        : "An atlas of machine perception";
      elements.mapTitle.innerHTML = "Follow the<br /><em>guess.</em>";
      elements.mapSubtitle.textContent = `${filteredCases.length} benchmark location${filteredCases.length === 1 ? "" : "s"}. Explore the distance between what a model sees and where it thinks it is.`;
      return;
    }

    const membership = preferredMembership(caseItem, filters.competition);
    const competitionLabel = membership
      ? `${membership.competitionName} · ${membership.partCount > 1 ? `Part ${membership.part}/${membership.partCount} · ` : ""}Round ${membership.round}`
      : "Unassigned competition";

    const difficultyLabel = DIFFICULTY_LABELS[caseItem.difficulty];
    const metadata = [competitionLabel];
    if (!competitionLabel.toLocaleLowerCase().includes(difficultyLabel.toLocaleLowerCase())) {
      metadata.push(difficultyLabel);
    }
    metadata.push(humanizeLabel(caseItem.sceneType));
    elements.mapEyebrow.textContent = metadata.join(" · ");
    elements.mapTitle.textContent = `${caseItem.city}, ${caseItem.country}`;

    if (!run) {
      elements.mapSubtitle.textContent = `${caseItem.localId ?? caseItem.id} · no model result or completed recording imported yet`;
      return;
    }

    if (!hasCoordinate(run.prediction)) {
      elements.mapSubtitle.textContent = `${run.model} · ${runConditionLabel(run)} · prediction coordinate unavailable`;
      return;
    }

    elements.mapSubtitle.textContent = `${run.model} · ${runConditionLabel(run)} · ${formatDistance(run.errorKm)} pin error`;
  }

  function renderComparison(caseItem, run, comparisonRuns = []) {
    elements.comparison.hidden = !caseItem || !run;
    if (!caseItem || !run) return;

    elements.pinError.textContent = hasCoordinate(run.prediction)
      ? formatDistance(run.errorKm)
      : "Not captured";
    elements.runTime.textContent = runTimeLabel(run);
    elements.runTime.title = runTimeDescription(run);

    if (!sideMapController) {
      sideMapController = createMapController(elements.sideComparisonMap, {
        onMarkerSelect() { },
      });
    }
    sideMapController.update(
      { cases: [caseItem], caseItem, run, comparisonRuns, overview: false, playback: null },
      { fit: true },
    );
    window.requestAnimationFrame(() => sideMapController?.invalidateSize());
  }

  function renderModelComparison(caseItem, comparisonRuns) {
    const compareConditions = conditionComparisonMode;
    const visible = Boolean(caseItem && (comparisonMode || compareConditions) && !evidenceMode);
    elements.modelComparison.hidden = !visible;
    elements.compareModelsButton.hidden = !caseItem || evidenceMode;
    elements.compareModelsButton.classList.toggle("is-active", comparisonMode && visible);
    const comparedModelCount = comparisonMode ? comparisonRuns.length : 0;
    elements.compareModelsButton.classList.toggle("has-count", comparedModelCount > 0);
    elements.compareModelsCount.textContent = comparedModelCount ? String(comparedModelCount) : "";
    const conditionRuns = caseItem
      ? modelPredictionRuns(caseItem.runs).filter((item) => item.model === selectedModel)
      : [];
    const conditionCount = unique(conditionRuns.map((item) => item.condition)).length;
    elements.compareConditionsButton.hidden = !caseItem || evidenceMode;
    elements.compareConditionsButton.disabled = conditionCount < 2;
    elements.compareConditionsButton.setAttribute(
      "aria-label",
      conditionCount < 2
        ? "Compare conditions unavailable: only one condition is recorded for this model"
        : `Compare ${conditionCount} conditions`,
    );
    elements.compareConditionsButton.classList.toggle("is-active", compareConditions && visible);
    elements.compareConditionsButton.classList.toggle("has-count", conditionCount > 0);
    elements.compareConditionsCount.textContent = conditionCount ? String(conditionCount) : "";
    if (!visible) return;

    elements.modelComparisonTitle.textContent = compareConditions ? "Compare conditions" : "Compare models";
    elements.modelComparisonIntro.textContent = compareConditions
      ? `The predictions from ${selectedModel} are shown for every evaluated condition at this location.`
      : "Select models to place their best-run predictions together on the globe.";

    if (compareConditions) {
      elements.modelComparisonOptions.innerHTML = comparisonRuns.map((item) => {
        const label = comparisonRunLabel(item, true);
        const color = comparisonColor(comparisonColorKey(item, true));
        return `<div class="model-comparison__condition">
          <i style="--comparison-color:${color}" aria-hidden="true"></i>
          <span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(formatDistance(item.errorKm))} error</small></span>
        </div>`;
      }).join("");
      elements.modelComparisonClues.innerHTML = `<p>${comparisonRuns.length} condition predictions are visible on the map. Covered-image clues remain in the review tool until their annotations and ratings are approved.</p>`;
      return;
    }

    const comparisonImageVariant = isStaticBaselineModel(selectedModel)
      ? selectedImageVariant
      : DEFAULT_IMAGE_VARIANT;
    const available = modelPredictionRuns(caseItem.runs).filter(
      (item) =>
        item.condition === selectedCondition &&
        (!isStaticBaselineModel(item.model) || runImageVariant(item) === comparisonImageVariant),
    );
    elements.modelComparisonOptions.innerHTML = available.map((item, index) => {
      const checked = comparedModels.has(item.model);
      const color = comparisonColor(item.model);
      return `<label>
        <input type="checkbox" data-compare-model value="${escapeAttribute(item.model)}" ${checked ? "checked" : ""} />
        <i style="--comparison-color:${color}" aria-hidden="true"></i>
        <span><strong>${escapeHtml(item.model)}</strong><small>${escapeHtml(formatDistance(item.errorKm))} error</small></span>
      </label>`;
    }).join("");

    const comparisonClueCount = comparisonRuns.reduce((total, item) => {
      return total + availableEvidenceCues(caseItem, item).length;
    }, 0);
    elements.modelComparisonClues.innerHTML = comparisonRuns.length
      ? comparisonClueCount
        ? `<p>${comparisonRuns.length} model predictions are visible on the globe. Open the shared scene to compare their ${comparisonClueCount} reported cues using the same colors.</p><button class="comparison-evidence-action" type="button" data-open-comparison-evidence>Compare cues <i class="ph ph-arrow-up-right" aria-hidden="true"></i></button>`
        : `<p>${comparisonRuns.length} model predictions are visible on the globe. Clue annotations for this condition are still in review.</p>`
      : `<p>Select at least one model to compare its prediction and reported clues.</p>`;
  }

  function renderExplorationPlayer(caseItem, run) {
    const samples = run?.exploration?.samples ?? [];
    const isStatic = isStaticImageCondition(run?.condition);

    if (!EXPLORATION_PLAYBACK_ENABLED || (caseItem && run && isStatic)) {
      stopPlayback();
      elements.explorationPlayer.hidden = true;
      mapController.setPlayback(null);
      return;
    }

    const hasPlayback = Boolean(caseItem && samples.length > 0);
    elements.explorationPlayer.hidden = !hasPlayback;
    if (!hasPlayback) {
      mapController.setPlayback(null);
      return;
    }

    playbackIndex = clamp(playbackIndex, 0, samples.length - 1);
    const sample = samples[playbackIndex];
    if (!Number.isFinite(playbackTimeMs)) playbackTimeMs = sample.tMs ?? 0;
    const durationMs = run.exploration.durationMs ?? samples.at(-1)?.tMs ?? 0;
    const capturedFrame = playbackFrameForSample(run.exploration, sample);
    const reviewMedia = resolvePlaybackReviewMedia({
      imageUrl: assetImageUrl(capturedFrame?.image),
      videoUrl: assetVideoUrl(run.exploration?.video),
    });
    const visualUrl = reviewMedia.imageUrl || reviewMedia.videoUrl;

    elements.playerEyebrow.textContent = "Interactive exploration";
    const playbackAction = playbackPlaying ? "Pause" : "Play";
    elements.playToggle.innerHTML = `
      <i class="ph-fill ph-${playbackPlaying ? "pause" : "play"}" aria-hidden="true"></i>
      <span>${playbackAction}</span>
    `;
    elements.playToggle.setAttribute("aria-label", playbackPlaying ? "Pause exploration playback" : "Play exploration playback");
    elements.timeline.max = String(Math.max(0, samples.length - 1));
    elements.timeline.value = String(playbackIndex);
    elements.timeline.setAttribute("aria-valuetext", `${formatSeconds(playbackTimeMs)} of ${formatSeconds(durationMs)}`);
    elements.timeLabel.textContent = `${formatSeconds(playbackTimeMs)} / ${formatSeconds(durationMs)}`;
    elements.speedSelect.value = String(playbackSpeed);
    elements.openCurrentView.href = visualUrl || "#";
    const reviewLabel = reviewMedia.imageUrl ? "Review captured frame" : "Review exploration";
    elements.openCurrentView.innerHTML = `
      <i class="ph ph-${reviewMedia.imageUrl ? "frame-corners" : "path"}" aria-hidden="true"></i>
      <span>${reviewLabel}</span>
    `;
    elements.openCurrentView.hidden = !reviewMedia.hasReview;
    elements.openCurrentView.toggleAttribute("aria-disabled", !reviewMedia.hasReview);
    elements.openCurrentView.classList.toggle("is-disabled", !reviewMedia.hasReview);
    if (reviewMedia.videoUrl && !reviewMedia.imageUrl) elements.openCurrentView.removeAttribute("target");

    elements.keyMoments.innerHTML = keyMomentMarkup(run.exploration.keyMoments ?? [], samples);
    elements.sampleReadout.innerHTML = sampleReadoutMarkup(sample, run.exploration, playbackIndex, capturedFrame);
  }

  function renderDrawer(caseItem, run, filteredCases) {
    if (caseItem && ["truth", "prediction"].includes(drawerMode)) {
      drawerCaseId = caseItem.id;
      drawerRunId = run?.id ?? null;
    }

    const detailCase =
      caseItem ??
      (drawerCaseId ? data.find((item) => item.id === drawerCaseId) ?? null : null);
    const detailRun = detailCase
      ? (drawerRunId ? detailCase.runs.find((item) => item.id === drawerRunId) : null) ??
      chooseRun(
        detailCase,
        selectedModel,
        selectedCondition,
        selectedImageVariant,
      )
      : null;
    const playbackAllowed =
      EXPLORATION_PLAYBACK_ENABLED && !isStaticImageCondition(run?.condition);
    const valid =
      drawerMode === "stats" ||
      (drawerMode === "truth" && Boolean(detailCase)) ||
      (drawerMode === "prediction" && Boolean(detailCase && detailRun)) ||
      (caseItem && run && drawerMode === "playback" && playbackAllowed);
    const layoutWasOpen = elements.mapWorkspace.classList.contains("has-drawer");
    elements.drawer.hidden = !valid;
    elements.drawer.dataset.drawerMode = valid ? drawerMode : "";
    rootElement.querySelector("[data-stats-button]").setAttribute("aria-expanded", String(drawerMode === "stats"));
    elements.drawer.classList.toggle("is-open", Boolean(valid));
    elements.mapWorkspace.classList.toggle("has-drawer", Boolean(valid));
    if (layoutWasOpen !== Boolean(valid)) {
      window.requestAnimationFrame(() => mapController.invalidateSize());
    }
    if (!valid) return;

    let title = "Details";
    let body = "";

    if (drawerMode === "stats") {
      title = "Evaluation statistics";
      body = statsDrawerMarkup(filteredCases);
    } else if (drawerMode === "truth") {
      title = "Ground truth";
      body = truthDrawerMarkup(detailCase, detailRun);
    } else if (drawerMode === "prediction") {
      title = "Prediction and cue review";
      body = predictionDrawerMarkup(detailCase, detailRun);
    } else if (drawerMode === "playback") {
      title = "Playback sample";
      const sample = drawerSample ?? run.exploration?.samples?.[playbackIndex] ?? null;
      body = playbackDrawerMarkup(sample, run, drawerSeekMs);
    }

    elements.drawerTitle.textContent = title;
    elements.drawer.querySelector(".section-label").textContent = drawerMode === "stats" ? "Benchmark overview" : "Selected pin";
    elements.drawerBody.innerHTML = body;
    primeInlineVideos(elements.drawerBody);
  }

  function enterOverview() {
    selectedCaseId = null;
    comparisonMapFullscreen = false;
    evidenceMode = false;
    evidenceComparisonMode = false;
    comparisonMode = false;
    conditionComparisonMode = false;
    showTextOnlyClues = false;
    selectedCueId = null;
    if (drawerMode !== "stats") {
      clearDrawerState();
    }
  }

  function clearDrawerState() {
    drawerMode = null;
    drawerSample = null;
    drawerSeekMs = 0;
    drawerCaseId = null;
    drawerRunId = null;
  }

  function renderPlaybackView() {
    const caseItem = getSelectedCase();
    const run = caseItem ? getSelectedRun(caseItem) : null;
    renderExplorationPlayer(caseItem, run);
    if (drawerMode === "playback") {
      drawerSample = run?.exploration?.samples?.[playbackIndex] ?? drawerSample;
      drawerSeekMs = Number.isFinite(playbackTimeMs) ? playbackTimeMs : drawerSample?.tMs ?? 0;
      renderDrawer(caseItem, run, getFilteredCases());
    }
    mapController.setPlayback(getPlaybackDescriptor(run));
  }

  function startPlayback() {
    if (!EXPLORATION_PLAYBACK_ENABLED) return;
    const run = getSelectedCase() ? getSelectedRun(getSelectedCase()) : null;
    const samples = run?.exploration?.samples ?? [];
    if (samples.length < 2) return;

    if (playbackIndex >= samples.length - 1) {
      playbackIndex = 0;
      playbackTimeMs = samples[0].tMs ?? 0;
    }

    playbackPlaying = true;
    playbackLastTick = 0;
    cancelAnimationFrame(playbackFrame);
    playbackFrame = requestAnimationFrame(playbackLoop);
  }

  function stopPlayback() {
    playbackPlaying = false;
    playbackLastTick = 0;
    if (playbackFrame) {
      cancelAnimationFrame(playbackFrame);
      playbackFrame = 0;
    }
  }

  function playbackLoop(timestamp) {
    if (!playbackPlaying) return;

    const caseItem = getSelectedCase();
    const run = caseItem ? getSelectedRun(caseItem) : null;
    const samples = run?.exploration?.samples ?? [];
    if (samples.length < 2) {
      stopPlayback();
      renderPlaybackView();
      return;
    }

    if (!playbackLastTick) playbackLastTick = timestamp;
    const delta = Math.min(500, timestamp - playbackLastTick);
    playbackLastTick = timestamp;
    playbackTimeMs += delta * playbackSpeed;

    const durationMs = run.exploration.durationMs ?? samples.at(-1)?.tMs ?? 0;
    if (playbackTimeMs >= durationMs) {
      playbackTimeMs = durationMs;
      playbackIndex = samples.length - 1;
      stopPlayback();
      renderPlaybackView();
      return;
    }

    const nextIndex = nearestSampleIndex(samples, playbackTimeMs);
    if (nextIndex !== playbackIndex) {
      playbackIndex = nextIndex;
      renderPlaybackView();
    }

    playbackFrame = requestAnimationFrame(playbackLoop);
  }

  function setPlaybackIndex(index, { keepPlaying = false, exactTimeMs = null } = {}) {
    if (!EXPLORATION_PLAYBACK_ENABLED) return;
    const caseItem = getSelectedCase();
    const run = caseItem ? getSelectedRun(caseItem) : null;
    const samples = run?.exploration?.samples ?? [];
    if (samples.length === 0) return;

    playbackIndex = clamp(index, 0, samples.length - 1);
    playbackTimeMs = Number.isFinite(exactTimeMs)
      ? Math.max(0, exactTimeMs)
      : samples[playbackIndex].tMs ?? 0;
    drawerSample = samples[playbackIndex];
    drawerSeekMs = playbackTimeMs;
    if (!keepPlaying) stopPlayback();
    renderPlaybackView();
  }

  function getPlaybackDescriptor(run) {
    if (!EXPLORATION_PLAYBACK_ENABLED) return null;
    if (isStaticImageCondition(run?.condition)) return null;
    const samples = run?.exploration?.samples ?? [];
    if (!samples.length) return null;

    playbackIndex = clamp(playbackIndex, 0, samples.length - 1);
    const sample = samples[playbackIndex];
    const showMarker = shouldShowPlaybackMarker({
      playing: playbackPlaying,
      index: playbackIndex,
      drawerMode,
    });
    return {
      index: playbackIndex,
      sample: showMarker ? sample : null,
      trace: showMarker ? samples.slice(0, playbackIndex + 1) : [],
    };
  }

  function resetPlaybackIfSelectionChanged(caseItem, run) {
    const signature = caseItem && run ? `${caseItem.id}:${run.id}` : "overview";
    if (signature === lastSelectionSignature) return;
    stopPlayback();
    playbackIndex = 0;
    playbackTimeMs = run?.exploration?.samples?.[0]?.tMs ?? 0;
    if (drawerMode === "playback") {
      drawerSample = run?.exploration?.samples?.[0] ?? null;
      drawerSeekMs = playbackTimeMs;
      drawerCaseId = caseItem?.id ?? null;
      drawerRunId = run?.id ?? null;
    }
  }

  function getFilteredCases() {
    const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
    return data.filter((item) => {
      if (
        filters.competition &&
        !(item.competitions ?? []).some(
          (membership) => membership.competitionId === filters.competition,
        )
      ) {
        return false;
      }
      if (filters.country && item.country !== filters.country) return false;
      if (filters.difficulty && item.difficulty !== filters.difficulty) return false;
      if (filters.sceneType && item.sceneType !== filters.sceneType) return false;
      if (!query) return true;

      return [
        item.title,
        item.landmark,
        item.city,
        item.region,
        item.country,
        item.sceneType,
        item.difficulty,
        item.primaryClueType,
        item.selectionNotes,
        item.summary,
        item.groundTruth?.label,
        item.localId,
        ...(item.competitions ?? []).flatMap((membership) => [
          membership.competitionId,
          membership.competitionName,
          membership.competitionShortName,
          membership.competitionDatasetId,
          membership.partId,
        ]),
        ...(item.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase()
        .includes(query);
    }).sort((left, right) =>
      (difficultyOrder[left.difficulty] ?? 99) - (difficultyOrder[right.difficulty] ?? 99) ||
      String(left.localId ?? left.id).localeCompare(String(right.localId ?? right.id), undefined, { numeric: true })
    );
  }

  function getOverviewMapCases(filteredCases) {
    const caseIds = new Set(
      overviewPredictionRuns(
        filteredCases,
        selectedModel,
        selectedCondition,
        selectedImageVariant,
      ).map((entry) => entry.caseId),
    );
    return filteredCases.filter((item) => caseIds.has(item.id));
  }

  function getAvailableOverviewCases(filteredCases) {
    return availableOverviewCases(
      filteredCases,
      selectedModel,
      selectedCondition,
      selectedImageVariant,
    );
  }

  function getStatsCases(caseItem, filteredCases) {
    if (caseItem) return [caseItem];
    return filteredCases.filter((item) => chooseRun(
      item,
      selectedModel,
      selectedCondition,
      selectedImageVariant,
    ));
  }

  function getSelectedCase() {
    if (!selectedCaseId) return null;
    return data.find((item) => item.id === selectedCaseId) ?? null;
  }

  function getSelectedRun(caseItem) {
    if (!caseItem) return null;
    return chooseRun(
      caseItem,
      selectedModel,
      selectedCondition,
      selectedImageVariant,
    );
  }

  function comparisonRunsForCase(caseItem) {
    if (!caseItem || (!comparisonMode && !conditionComparisonMode)) return [];

    if (conditionComparisonMode) {
      return modelPredictionRuns(caseItem.runs)
        .filter((item) => item.model === selectedModel)
        .map((item) => ({
          ...item,
          comparisonColorKey: comparisonColorKey(item, true),
          comparisonLabel: comparisonRunLabel(item, true),
        }));
    }

    const comparisonImageVariant = isStaticBaselineModel(selectedModel)
      ? selectedImageVariant
      : DEFAULT_IMAGE_VARIANT;

    return modelPredictionRuns(caseItem.runs).filter(
      (item) =>
        comparedModels.has(item.model) &&
        item.condition === selectedCondition &&
        (
          !isStaticBaselineModel(item.model) ||
          runImageVariant(item) === comparisonImageVariant
        ),
    );
  }

  function ensureRunControlState(caseItem, filteredCases) {
    const scope = getScopeRuns(caseItem, filteredCases);
    const models = unique(scope.map((item) => item.model));

    if (!selectedModel || !models.includes(selectedModel)) {
      selectedModel = models[0] ?? null;
    }

    if (isStaticBaselineModel(selectedModel)) {
      selectedCondition = "static-image";

      const imageVariants = unique(
        scope
          .filter(
            (item) =>
              item.model === selectedModel &&
              item.condition === "static-image",
          )
          .map((item) => runImageVariant(item)),
      );

      if (!imageVariants.includes(selectedImageVariant)) {
        selectedImageVariant = imageVariants.includes(DEFAULT_IMAGE_VARIANT)
          ? DEFAULT_IMAGE_VARIANT
          : imageVariants[0] ?? DEFAULT_IMAGE_VARIANT;
      }

      return;
    }

    const modelConditions = unique(
      scope
        .filter((item) => item.model === selectedModel)
        .map((item) => item.condition),
    );

    const conditions = modelConditions.length
      ? modelConditions
      : unique(scope.map((item) => item.condition));

    if (!selectedCondition || !conditions.includes(selectedCondition)) {
      selectedCondition = conditions[0] ?? null;
    }
  }
  function getScopeRuns(caseItem, filteredCases) {
    return caseItem
      ? modelPredictionRuns(caseItem.runs)
      : filteredCases.flatMap((item) => modelPredictionRuns(item.runs));
  }

  function locationCardMarkup(item) {
    const active = item.id === selectedCaseId;
    const matchingRun = chooseRun(
      item,
      selectedModel,
      selectedCondition,
      selectedImageVariant,
    );
    const thumbnail = assetImageUrl(imageForRun(item, matchingRun));
    const runMeta = matchingRun
      ? `<span>${escapeHtml(runConditionLabel(matchingRun))}</span><b>${hasCoordinate(matchingRun.prediction) ? escapeHtml(formatDistance(matchingRun.errorKm)) : "Recording only"}</b>`
      : `<span>${escapeHtml(DIFFICULTY_LABELS[item.difficulty])}</span><b>Unavailable</b>`;
    return `
      <button
        class="location-card ${active ? "is-active" : ""}"
        type="button"
        data-case-id="${escapeAttribute(item.id)}"
        data-difficulty="${escapeAttribute(item.difficulty)}"
        aria-pressed="${active}"
      >
        ${thumbnail ? `<img class="location-card__image" src="${escapeAttribute(thumbnail)}" alt="" loading="lazy" decoding="async" />` : ""}
        <span class="location-card__pin" aria-hidden="true"></span>
        <span class="location-card__body">
          <strong>${escapeHtml(item.city)}</strong>
          <small>${escapeHtml(item.country)}</small>
        </span>
        <span class="location-card__meta">${runMeta}</span>
      </button>
    `;
  }

  function statsDrawerMarkup(filteredCases) {
    const stats = computeStats(
      filteredCases,
      selectedModel,
      selectedCondition,
      selectedImageVariant,
    );
    const competitionName = filteredCases
      .flatMap((item) => item.competitions ?? [])
      .find((membership) => membership.competitionId === filters.competition)
      ?.competitionName;
    const selectedStatsCase = getSelectedCase();
    const filterText = [
      selectedStatsCase ? selectedStatsCase.city : null,
      competitionName,
      selectedModel,
      selectedCondition ? CONDITION_LABELS[selectedCondition] : null,
      isStaticBaselineModel(selectedModel)
        ? IMAGE_VARIANT_LABELS[selectedImageVariant] ?? selectedImageVariant
        : null,
      filters.country || null,
      filters.difficulty ? DIFFICULTY_LABELS[filters.difficulty] : null,
      filters.sceneType || null,
      query ? `search: ${query}` : null,
    ].filter(Boolean).join(" · ");

    return `
      <div class="drawer-section">
        <p class="drawer-muted">Current slice: ${escapeHtml(filterText || "all visible locations")}</p>
      </div>
      <div class="stat-grid">
        ${metricMarkup("Benchmark cases", String(stats.caseCount), `${stats.pinRunCount} recorded predictions`)}
        ${metricMarkup("Median error", formatDistance(stats.medianErrorKm), "robust location score")}
        ${metricMarkup("Mean error", formatDistance(stats.meanErrorKm), "sensitive to large misses")}
        ${metricMarkup("Country accuracy", formatPercent(stats.countryAccuracy), `${stats.countryRated} rated`)}
        ${metricMarkup("Within 25 km", formatPercent(stats.within25), "regional hit rate")}
        ${stats.cueCount ? metricMarkup("Cue useful", formatPercent(stats.cueUseful), `${stats.cueCount} cues`) : ""}
      </div>
      ${selectedStatsCase ? "" : `<div class="drawer-section">
        <h4>Error buckets</h4>
        ${bucketMarkup(stats.bands)}
      </div>`}
      ${stats.cueCount ? `<div class="drawer-section">
        <h4>Explanation review</h4>
        <p class="rating-summary-note">Human-verified positive / rated clues${stats.cueRatings.visible.unrated ? ` · ${stats.cueRatings.visible.unrated} unrated clue${stats.cueRatings.visible.unrated === 1 ? "" : "s"} omitted` : ""}</p>
        ${progressMarkup("Visible", stats.cueRatings.visible)}
        ${progressMarkup("Correct", stats.cueRatings.correct)}
        ${progressMarkup("Useful", stats.cueRatings.useful)}
        ${progressMarkup("Consistent", stats.cueRatings.consistent)}
      </div>` : ""}
    `;
  }

  function truthDrawerMarkup(caseItem, run) {
    const imageUrl = assetImageUrl(imageForRun(caseItem, run));
    const interactive = run?.condition === "interactive-panorama";
    const reviewMedia = resolvePlaybackReviewMedia({
      imageUrl,
      videoUrl: interactive ? assetVideoUrl(run?.exploration?.video) : null,
    });
    const visualMarkup = reviewMedia.videoUrl
      ? evidenceVideoMarkup(reviewMedia.videoUrl, reviewMedia.imageUrl, `Interactive exploration · ${caseItem.city}, ${caseItem.country}`, 0)
      : reviewMedia.imageUrl
        ? evidenceImageMarkup(reviewMedia.imageUrl, `${interactive ? "Interactive starting scene" : "Canonical static view"} · ${caseItem.city}, ${caseItem.country}`)
        : `<div class="evidence-image evidence-image--missing">
            <strong>No canonical scene image yet</strong>
            <span>The location data and coordinates remain available.</span>
          </div>`;

    return `
      <div class="detail-hero detail-hero--truth">
        <span class="detail-badge">T</span>
        <div>
          <h3>${escapeHtml(caseItem.landmark || caseItem.title)}</h3>
          <p>${escapeHtml(caseItem.city)}, ${escapeHtml(caseItem.country)}</p>
        </div>
      </div>
      ${visualMarkup}
      <dl class="detail-list">
        <div><dt>Condition</dt><dd>${escapeHtml(runConditionLabel(run))}</dd></div>
        ${isStaticBaselineModel(run?.model)
        ? `<div><dt>Image variant</dt><dd>${escapeHtml(IMAGE_VARIANT_LABELS[runImageVariant(run)] ?? runImageVariant(run))}</dd></div>`
        : ""}
        <div><dt>Difficulty</dt><dd>${escapeHtml(DIFFICULTY_LABELS[caseItem.difficulty] ?? caseItem.difficulty)}</dd></div>
        <div><dt>Scene type</dt><dd>${escapeHtml(caseItem.sceneType || "—")}</dd></div>
        <div><dt>Coordinates</dt><dd><code>${escapeHtml(formatCoordinate(caseItem.groundTruth))}</code></dd></div>
      </dl>
    `;
  }

  function predictionDrawerMarkup(caseItem, run) {
    const route = isStaticImageCondition(run.condition)
      ? `${runConditionLabel(run)} · fixed view`
      : run.exploration?.path?.length > 1
        ? `${run.exploration.path.length} positions · ${formatDistance(explorationDistanceKm(run.exploration))}`
        : run.exploration?.samples?.length
          ? `${run.exploration.samples.length} camera observations`
          : "—";
    const predictionAvailable = hasCoordinate(run.prediction);
    const predictionStreetView = predictionAvailable ? safeStreetViewUrl(run.prediction) : "#";
    const clueSet = (caseItem.clueSets ?? []).find((item) => item.benchmarkId === run.benchmarkId || item.id === run.benchmarkId) ?? null;

    return `
      <div class="detail-hero detail-hero--prediction">
        <span class="detail-badge">${predictionAvailable ? "P" : "R"}</span>
        <div>
          <h3>${escapeHtml(predictionAvailable ? predictionLocationLabel(run.prediction) : "Prediction unavailable")}</h3>
          <p>${escapeHtml(run.model)} · ${escapeHtml(runConditionLabel(run))}</p>
        </div>
      </div>
      ${predictionAvailable ? "" : `<p class="drawer-muted">The submitted guess coordinate was not independently validated. The model and its reviewed evidence remain available, but no prediction pin, error line, or location-error statistic is shown.</p>`}
      <dl class="detail-list">
        <div><dt>Pin error</dt><dd>${predictionAvailable ? escapeHtml(formatDistance(run.errorKm)) : "—"}</dd></div>
        <div><dt>Selected run</dt><dd>${escapeHtml(run.bestRunLabel ?? "Best overall run")}</dd></div>
        <div><dt>Run score</dt><dd>${Number.isFinite(run.bestRunPoints) ? `${run.bestRunPoints.toLocaleString("en-US")} / 125,000` : "—"}</dd></div>
        <div><dt>3-run mean</dt><dd>${Number.isFinite(run.benchmarkMeanPoints) ? `${Math.round(run.benchmarkMeanPoints).toLocaleString("en-US")} pts` : "—"}</dd></div>
        <div><dt>Run time</dt><dd${runTimeDescription(run) ? ` title="${escapeAttribute(runTimeDescription(run))}"` : ""}>${escapeHtml(runTimeLabel(run))}</dd></div>
        ${isStaticBaselineModel(run.model)
        ? `<div><dt>Image variant</dt><dd>${escapeHtml(IMAGE_VARIANT_LABELS[runImageVariant(run)] ?? runImageVariant(run))}</dd></div>`
        : ""}
        <div><dt>Country</dt><dd>${predictionAvailable ? accuracyLabel(run.accuracy?.country) : "—"}</dd></div>
        <div><dt>Region / city</dt><dd>${predictionAvailable ? accuracyLabel(run.accuracy?.region) : "—"}</dd></div>
        <div><dt>Exploration</dt><dd>${escapeHtml(route)}</dd></div>
        <div><dt>Coordinates</dt><dd>${predictionAvailable ? `<code>${escapeHtml(formatCoordinate(run.prediction))}</code>` : "Not captured"}</dd></div>
      </dl>
      ${predictionAvailable ? `<a class="drawer-action" href="${escapeAttribute(predictionStreetView)}" target="_blank" rel="noopener noreferrer">Open Street View at prediction ↗</a>` : ""}
      ${isStaticBaselineModel(run.model) ? "" : modelCluesMarkup(caseItem, run, clueSet)}
      ${run.hypothesis ? `<div class="drawer-section"><h4>Initial hypothesis</h4><p>${escapeHtml(run.hypothesis)}</p></div>` : ""}
      ${isStaticBaselineModel(run.model) ? "" : `<div class="drawer-section">
        <h4>Reported cues</h4>
        <ol class="cue-list">${cueListMarkup(run.cues)}</ol>
      </div>`}
      ${run.notes ? `<div class="drawer-section"><h4>Run notes</h4><p>${escapeHtml(run.notes)}</p></div>` : ""}
    `;
  }

  function modelCluesMarkup(caseItem, run, clueSet) {
    if (!clueSet) return `<div class="drawer-section"><h4>Visual evidence</h4><p class="drawer-muted">No model-authored clue report is available for this run.</p></div>`;
    const clues = (clueSet.cues ?? []).filter((clue) => clue.annotationStatus !== "excluded");
    if (!selectedCueId || !clues.some((clue) => clue.id === selectedCueId)) selectedCueId = clues[0]?.id ?? null;
    const selected = clues.find((clue) => clue.id === selectedCueId) ?? null;
    const imageUrl = assetImageUrl(imageForRun(caseItem, run));
    const reviewed = clues.filter((clue) => clue.annotationStatus === "reviewed").length;
    const grounded = clues.filter((clue) => clue.region).length;
    return `
      <div class="drawer-section model-evidence">
        <h4>What this model noticed</h4>
        <p class="drawer-muted">${clueSet.sourceRuns.length} source run${clueSet.sourceRuns.length === 1 ? "" : "s"} merged · ${grounded} image highlight${grounded === 1 ? "" : "s"} · ${reviewed} reviewed</p>
        ${imageUrl ? clueEvidenceMarkup(imageUrl, clues, selectedCueId, caseItem) : ""}
        ${selected ? `<article class="selected-clue-card"><small>${escapeHtml(selected.category)} · ${escapeHtml(clueStatusLabel(selected.annotationStatus))}</small><h3>${escapeHtml(selected.label)}</h3><p>${escapeHtml(selected.description)}</p><div class="cue-ratings cue-ratings--detail" aria-label="Clue rating verdicts">${ratingPills(selected.ratings)}</div></article>` : ""}
        <ol class="visual-clue-list">${clues.map((clue, index) => `<li><button type="button" class="${clue.id === selectedCueId ? "is-active" : ""}" data-highlight-clue-id="${escapeAttribute(clue.id)}"><span>${index + 1}</span><strong>${escapeHtml(clue.label)}</strong><small>${clue.region ? "Image highlight" : "Text clue"} · ${escapeHtml(clueStatusLabel(clue.annotationStatus))}</small></button></li>`).join("")}</ol>
      </div>`;
  }

  function clueEvidenceMarkup(imageUrl, clues, activeId, caseItem) {
    return `<div class="clue-evidence-image">
      <img src="${escapeAttribute(imageUrl)}" alt="Annotated starting scene in ${escapeAttribute(caseItem.city)}, ${escapeAttribute(caseItem.country)}" />
      <div class="clue-box-layer">${clues.filter((clue) => clue.region).map((clue) => `<button type="button" class="clue-box ${clue.id === activeId ? "is-active" : ""} ${clue.annotationStatus === "reviewed" ? "is-reviewed" : "is-draft"}" data-highlight-clue-id="${escapeAttribute(clue.id)}" aria-label="${escapeAttribute(clue.label)}" style="left:${clue.region.x * 100}%;top:${clue.region.y * 100}%;width:${clue.region.w * 100}%;height:${clue.region.h * 100}%"><span>${clues.indexOf(clue) + 1}</span></button>`).join("")}</div>
    </div>`;
  }

  function playbackDrawerMarkup(sample, run, exactSeekMs = null) {
    if (!sample) {
      return `<p class="drawer-muted">No playback sample selected.</p>`;
    }
    const frame = playbackFrameForSample(run.exploration, sample);
    const imageUrl = assetImageUrl(frame?.image);
    const reviewMedia = resolvePlaybackReviewMedia({
      imageUrl,
      videoUrl: assetVideoUrl(run.exploration?.video),
    });
    const seekMs = Number.isFinite(exactSeekMs)
      ? Math.max(0, exactSeekMs)
      : Number.isFinite(sample.tMs)
        ? sample.tMs
        : 0;
    return `
      <div class="detail-hero detail-hero--playback">
        <span class="detail-badge">▶</span>
        <div>
          <h3>${escapeHtml(frame?.label || sample.label || "Timeline sample")}</h3>
          <p>${formatSeconds(sample.tMs)} · ${escapeHtml(frame?.type || sample.reason || "sample")}</p>
        </div>
      </div>
      ${reviewMedia.imageUrl
        ? evidenceImageMarkup(reviewMedia.imageUrl, `${frame?.label || "Captured exploration frame"} · ${formatSeconds(frame?.tMs ?? sample.tMs)}`)
        : reviewMedia.videoUrl
          ? evidenceVideoMarkup(reviewMedia.videoUrl, null, `Interactive exploration · ${formatSeconds(seekMs)}`, seekMs)
          : `<div class="evidence-image evidence-image--missing">
              <strong>No captured frame for this point</strong>
              <span>The timeline still uses the exploration camera samples.</span>
            </div>`}
      <dl class="detail-list">
        <div><dt>Playback time</dt><dd>${formatSeconds(seekMs)}</dd></div>
        <div><dt>Heading</dt><dd>${formatDegrees(sample.heading)}</dd></div>
        <div><dt>Pitch</dt><dd>${formatDegrees(sample.pitch)}</dd></div>
        <div><dt>Zoom</dt><dd>${formatNumber(sample.zoom)}</dd></div>
        <div><dt>FOV</dt><dd>${formatDegrees(sample.fov)}</dd></div>
        <div><dt>Source</dt><dd>${escapeHtml(sample.source || run.exploration?.source || "—")}</dd></div>
        <div><dt>Coordinates</dt><dd><code>${escapeHtml(formatCoordinate(sample))}</code></dd></div>
      </dl>
      ${reviewMedia.videoUrl ? `<p class="drawer-muted">The player contains only this location/round. Selecting a playback action seeks this player near the same exploration time.</p>` : ""}
    `;
  }

  function assertAlive() {
    if (destroyed) throw new Error("This explorer instance has been destroyed.");
  }
}

export function shellMarkup(cases = []) {
  const projectSnapshot = buildProjectSnapshot(cases);

  return `
    <div class="atlas-app" data-app-shell data-view-state="overview" data-site-section-id="explorer">
      <img class="scene-backdrop" data-scene-image alt="" hidden />
      <div class="scene-vignette" aria-hidden="true"></div>
      <header class="app-header">
        <div class="app-brand">
          <i class="ph ph-compass app-brand__mark" aria-hidden="true"></i>
          <div>
            <strong>NAUTILUS</strong>
            <small>A field guide to machine perception</small>
          </div>
        </div>

        <nav class="journey-guide" aria-label="Run method">
          <span class="journey-guide__label">Run method</span>
          <ol class="journey-progress">
            <li><button type="button" data-method-stage="observe" aria-label="Read the Observe method stage"><span>1</span><b>Observe</b><i class="ph ph-eye" aria-hidden="true"></i></button></li>
            <li><button type="button" data-method-stage="hypothesize" aria-label="Read the Hypothesize method stage"><span>2</span><b>Hypothesize</b><i class="ph ph-lightbulb" aria-hidden="true"></i></button></li>
            <li><button type="button" data-method-stage="explore" aria-label="Read the Explore method stage"><span>3</span><b>Explore</b><i class="ph ph-binoculars" aria-hidden="true"></i></button></li>
            <li><button type="button" data-method-stage="pin" aria-label="Read the Pin method stage"><span>4</span><b>Pin</b><i class="ph ph-map-pin" aria-hidden="true"></i></button></li>
          </ol>
        </nav>

        <div class="header-actions">
          <button class="site-jump" type="button" data-scroll-target="research" aria-label="Read the project">
            <span>Project</span>
            <i class="ph ph-arrow-down" aria-hidden="true"></i>
          </button>
        </div>
      </header>

      <div class="workspace">
        <aside class="location-rail" aria-label="Location selection">
          <section class="scene-story" aria-live="polite">
            <div class="detail-brand" aria-label="NAUTILUS">
              <i class="ph ph-compass" aria-hidden="true"></i>
              <strong>NAUTILUS</strong>
            </div>

            <div class="scene-actions">
              <button class="back-to-globe" type="button" data-back-overview hidden>
                <i class="ph ph-arrow-left" aria-hidden="true"></i>
                <span>Back to globe</span>
              </button>
              <button class="walk-here" type="button" data-walk-here aria-label="Open this location in Google Maps" hidden>
                <i class="ph ph-person-simple-walk" aria-hidden="true"></i>
                <span>Walk here</span>
                <i class="ph ph-arrow-up-right" aria-hidden="true"></i>
              </button>
            </div>

            <div class="scene-story__heading">
              <span class="section-label" data-map-eyebrow></span>
              <h1 data-map-title></h1>
              <p data-map-subtitle></p>
              <button class="discover-location" type="button" data-discover-location>
                <span>Take me somewhere</span>
                <i class="ph ph-arrow-up-right" aria-hidden="true"></i>
              </button>
              <button class="project-entry" type="button" data-scroll-target="research">
                <span>Read the project</span>
                <i class="ph ph-arrow-down-right" aria-hidden="true"></i>
              </button>
            </div>

            <div class="detail-actions" data-detail-actions aria-label="Location tools"></div>

            <div class="detail-run-controls" data-detail-run-controls aria-label="Model and image controls"></div>

            <footer class="comparison-bar" data-comparison hidden>
              <div class="side-comparison-map-shell" data-side-comparison-map-shell>
                <div class="side-comparison-map" data-side-comparison-map aria-label="Ground truth and model prediction map"></div>
                <button class="side-map-fullscreen-button" type="button" data-toggle-comparison-map-fullscreen aria-label="Expand ground truth and prediction map" aria-pressed="false">
                  <i class="ph ph-corners-out" data-comparison-map-fullscreen-icon aria-hidden="true"></i>
                  <span data-comparison-map-fullscreen-label>Expand map</span>
                </button>
              </div>
              <div class="comparison-stat"><small>Pin error</small><strong data-pin-error></strong></div>
              <div class="comparison-stat"><small>Run time</small><strong data-run-time></strong></div>
            </footer>
          </section>

          <section class="dataset-browser" data-dataset-browser>
            <div class="dataset-browser__controls">
            <div class="rail-heading">
              <div>
                <span class="section-label">Choose a place to begin</span>
                <h2>The field collection</h2>
              </div>
              <span class="result-count" data-result-count></span>
            </div>

            <label class="search-field">
              <i class="ph ph-magnifying-glass" aria-hidden="true"></i>
              <input data-search type="search" aria-label="Search city or country" placeholder="Search city or country" autocomplete="off" />
            </label>

            <details class="filter-panel">
              <summary>
                <span><i class="ph ph-funnel" aria-hidden="true"></i> Filter locations</span>
                <i class="ph ph-caret-down" aria-hidden="true"></i>
              </summary>
              <div class="filter-grid" aria-label="Location filters">
                <label class="filter-grid__wide"><span>Competition</span><select data-competition-filter></select></label>
                <label><span>Country</span><select data-country-filter></select></label>
                <label><span>Difficulty</span><select data-difficulty-filter></select></label>
                <label class="filter-grid__wide"><span>Scene type</span><select data-scene-filter></select></label>
                <button class="text-button filter-grid__clear" type="button" data-clear-filters>Clear filters</button>
              </div>
            </details>

            <button class="overview-card is-active" type="button" data-overview aria-pressed="true">
              <span class="overview-card__icon" aria-hidden="true"><i class="ph-fill ph-globe-hemisphere-west"></i></span>
              <span><strong>All locations</strong><small>Globe overview</small></span>
              <b data-overview-count></b>
            </button>
            </div>

            <div class="location-list" data-location-list aria-label="Street scene collection" tabindex="0"></div>
          </section>
        </aside>

        <main class="map-workspace" data-map-workspace>
          <section class="map-panel">
            <img class="detail-scene-media" data-detail-scene-image alt="" hidden />
            <button class="scene-clue-summary" type="button" data-scene-clue-summary data-open-model-evidence hidden>
              <span>Visual evidence · <b data-scene-clue-model></b></span>
              <strong><b data-scene-clue-count>0</b> clues <i class="ph ph-arrow-up-right" aria-hidden="true"></i></strong>
            </button>
            <section class="evidence-view" data-evidence-view hidden aria-label="Model visual evidence">
              <button class="evidence-back" type="button" data-close-evidence><i class="ph ph-arrow-left" aria-hidden="true"></i> Back to location</button>
              <header class="evidence-heading">
                <span><b data-evidence-count>0</b><span class="evidence-count-label evidence-count-label--full"> visual clues</span><span class="evidence-count-label evidence-count-label--compact"> cues</span><strong data-evidence-model></strong></span>
                <h2 data-evidence-heading></h2>
                <div class="evidence-model-legend" data-evidence-legend hidden></div>
                <button type="button" data-toggle-text-clues aria-controls="non-spatial-evidence" hidden></button>
              </header>
              <div class="evidence-image-stage">
                <div class="evidence-canvas">
                  <img data-evidence-image alt="" />
                  <div class="evidence-marks" data-evidence-marks></div>
                </div>
              </div>
              <article class="evidence-clue-detail" data-evidence-detail hidden></article>
              <aside class="evidence-text-panel" id="non-spatial-evidence" data-evidence-text-panel hidden></aside>
            </section>
            <div class="globe-caption" aria-hidden="true">
              <span class="globe-caption__pointer"><i class="ph ph-hand" aria-hidden="true"></i> Drag to rotate · Scroll to zoom</span>
              <span class="globe-caption__touch">Drag to rotate · Pinch to zoom</span>
            </div>
            <div class="map-stage" data-map></div>

            <div class="map-utilities">
              <div class="map-legend" data-map-legend aria-label="Globe legend">
                ${mapLegendMarkup(mapLegendItems({ overview: true }))}
              </div>
              <div class="map-utility-actions" data-map-utility-actions>
                <button class="secondary-button" type="button" data-reset-map>
                  <i class="ph ph-crosshair" aria-hidden="true"></i>
                  <span data-reset-map-label>Show all predictions</span>
                </button>
              </div>
            </div>

            <aside class="model-comparison" data-model-comparison hidden>
              <header><div><span>Location comparison</span><h2 data-model-comparison-title>Compare models</h2></div><button type="button" data-close-model-comparison aria-label="Close comparison"><i class="ph ph-x" aria-hidden="true"></i></button></header>
              <p data-model-comparison-intro>Select models to place their best-run predictions together on the globe.</p>
              <div class="model-comparison__options" data-model-comparison-options></div>
              <div class="model-comparison__clues" data-model-comparison-clues></div>
            </aside>

            <section class="exploration-player" data-exploration-player hidden>
              <div class="player-header">
                <div>
                  <span class="section-label" data-player-eyebrow>Recorded exploration</span>
                  <h3>Replay the model's route</h3>
                </div>
                <a class="secondary-button player-open" data-open-current-view target="_blank" rel="noopener noreferrer">
                  <i class="ph ph-frame-corners" aria-hidden="true"></i>
                  <span>Open captured image</span>
                </a>
              </div>
              <div class="player-controls">
                <button class="play-toggle" type="button" data-play-toggle>
                  <i class="ph-fill ph-play" aria-hidden="true"></i>
                  <span>Play</span>
                </button>
                <input class="timeline" data-timeline type="range" min="0" max="0" value="0" step="1" aria-label="Exploration timeline" />
                <select class="speed-select" data-speed-select aria-label="Playback speed">
                  ${PLAYBACK_SPEEDS.map((speed) => `<option value="${speed}">${speed}×</option>`).join("")}
                </select>
                <div class="time-label" data-time-label>0.0 s / 0.0 s</div>
              </div>
              <div class="key-moments" data-key-moments aria-label="Key moments"></div>
              <div class="sample-readout" data-sample-readout></div>
            </section>

            <div class="experience-dock" data-experience-dock aria-label="Run and location controls">
              <div class="run-controls" data-run-controls aria-label="Run controls">
                <label>
                  <span>Model</span>
                  <select data-model-select></select>
                </label>
                <label data-condition-control>
                  <span>Condition</span>
                  <select data-condition-select></select>
                </label>
                <label data-image-variant-control hidden style="display:none">
                  <span>Image variant</span>
                  <select data-image-variant-select></select>
                </label>
              </div>
              <div class="globe-stats-slot" data-globe-stats-slot>
                <button class="stats-button globe-stats-button" type="button" data-stats-button aria-label="Open statistics" aria-expanded="false">
                  <i class="ph ph-chart-line-up" aria-hidden="true"></i><span>Statistics</span>
                </button>
              </div>
              <button class="next-location next-location--previous" type="button" data-previous-location hidden>
                <i class="ph-fill ph-arrow-fat-left" aria-hidden="true"></i>
                <span><small>Previous location</small><strong data-previous-label>Previous location</strong></span>
              </button>
              <button class="compare-models-button" type="button" data-toggle-model-comparison hidden>
                <i class="ph ph-stack" aria-hidden="true"></i><span><span>Compare models</span><b data-compare-models-count></b></span>
              </button>
              <button class="compare-models-button" type="button" data-toggle-condition-comparison hidden>
                <i class="ph ph-arrows-left-right" aria-hidden="true"></i><span><span>Compare conditions</span><b data-compare-conditions-count></b></span>
              </button>
              <button class="next-location" type="button" data-next-location hidden>
                <span><small>Continue exploring</small><strong data-next-label>Next location</strong></span>
                <i class="ph-fill ph-arrow-fat-right" aria-hidden="true"></i>
              </button>
            </div>
          </section>

          <aside class="detail-drawer" data-drawer hidden>
            <div class="detail-drawer__panel">
              <header class="detail-drawer__header">
                <div>
                  <span class="section-label">Selected pin</span>
                  <h2 data-drawer-title>Details</h2>
                </div>
                <button class="icon-button" type="button" data-close-drawer aria-label="Close details"><i class="ph ph-x" aria-hidden="true"></i></button>
              </header>
              <div class="detail-drawer__body" data-drawer-body></div>
            </div>
          </aside>
        </main>
      </div>
    </div>
    ${projectStoryMarkup(projectSnapshot)}
  `;
}

function mapLegendMarkup(items = []) {
  return items
    .map((item) => {
      const markerClass = ["error", "exploration", "playback"].includes(item.kind)
        ? `legend-line legend-line--${item.kind}`
        : `legend-dot legend-dot--${item.kind}`;
      return `<span><i class="${markerClass}" aria-hidden="true"></i>${escapeHtml(item.label)}</span>`;
    })
    .join("");
}

function evidenceMarksMarkup(items, selectedId, comparison = false) {
  return items.map(({ clue, number, key, model, color }) => {
    const statusClass = clue.annotationStatus === "reviewed" ? "is-reviewed" : "is-draft";
    const selectedClass = key === selectedId ? "is-active" : "";
    const comparisonClass = comparison ? "is-comparison" : "";
    const tooltipPlacementClass = clue.region.y > 0.46 ? "evidence-tooltip--above" : "evidence-tooltip--below";
    const tooltipAlignmentClass = clue.region.x + clue.region.w > 0.78 ? "evidence-tooltip--end" : "";
    const layer = Math.round(1000 - clue.region.w * clue.region.h * 900);
    return `<button type="button" class="evidence-mark ${statusClass} ${comparisonClass} ${selectedClass} ${tooltipPlacementClass} ${tooltipAlignmentClass}" data-highlight-clue-id="${escapeAttribute(key)}" aria-label="${escapeAttribute(`${number}. ${comparison ? `${model}. ` : ""}${clue.label}`)}" style="--comparison-color:${color};left:${clue.region.x * 100}%;top:${clue.region.y * 100}%;width:${clue.region.w * 100}%;height:${clue.region.h * 100}%;z-index:${layer}">
      <span>${number}</span><em>${escapeHtml(comparison ? `${model} · ${clue.label}` : clue.label)}</em>
    </button>`;
  }).join("");
}

function collectElements(root) {
  const selectors = {
    appShell: "[data-app-shell]",
    sceneImage: "[data-scene-image]",
    detailSceneImage: "[data-detail-scene-image]",
    sceneClueSummary: "[data-scene-clue-summary]",
    sceneClueCount: "[data-scene-clue-count]",
    sceneClueModel: "[data-scene-clue-model]",
    evidenceView: "[data-evidence-view]",
    evidenceImage: "[data-evidence-image]",
    evidenceMarks: "[data-evidence-marks]",
    evidenceHeading: "[data-evidence-heading]",
    evidenceModel: "[data-evidence-model]",
    evidenceCount: "[data-evidence-count]",
    evidenceLegend: "[data-evidence-legend]",
    evidenceDetail: "[data-evidence-detail]",
    evidenceTextToggle: "[data-toggle-text-clues]",
    evidenceTextPanel: "[data-evidence-text-panel]",
    backOverview: "[data-back-overview]",
    datasetBrowser: "[data-dataset-browser]",
    search: "[data-search]",
    resultCount: "[data-result-count]",
    competitionFilter: "[data-competition-filter]",
    countryFilter: "[data-country-filter]",
    difficultyFilter: "[data-difficulty-filter]",
    sceneFilter: "[data-scene-filter]",
    overviewButton: "[data-overview]",
    overviewCount: "[data-overview-count]",
    locationList: "[data-location-list]",
    modelSelect: "[data-model-select]",
    conditionControl: "[data-condition-control]",
    conditionSelect: "[data-condition-select]",
    imageVariantControl: "[data-image-variant-control]",
    imageVariantSelect: "[data-image-variant-select]",
    mapWorkspace: "[data-map-workspace]",
    map: "[data-map]",
    mapEyebrow: "[data-map-eyebrow]",
    mapTitle: "[data-map-title]",
    mapSubtitle: "[data-map-subtitle]",
    detailActions: "[data-detail-actions]",
    detailRunControls: "[data-detail-run-controls]",
    experienceDock: "[data-experience-dock]",
    runControls: "[data-run-controls]",
    globeStatsSlot: "[data-globe-stats-slot]",
    mapLegend: "[data-map-legend]",
    resetMapLabel: "[data-reset-map-label]",
    mapUtilityActions: "[data-map-utility-actions]",
    comparison: "[data-comparison]",
    sideComparisonMapShell: "[data-side-comparison-map-shell]",
    sideComparisonMap: "[data-side-comparison-map]",
    comparisonMapFullscreenButton: "[data-toggle-comparison-map-fullscreen]",
    comparisonMapFullscreenIcon: "[data-comparison-map-fullscreen-icon]",
    comparisonMapFullscreenLabel: "[data-comparison-map-fullscreen-label]",
    pinError: "[data-pin-error]",
    runTime: "[data-run-time]",
    modelComparison: "[data-model-comparison]",
    modelComparisonTitle: "[data-model-comparison-title]",
    modelComparisonIntro: "[data-model-comparison-intro]",
    modelComparisonOptions: "[data-model-comparison-options]",
    modelComparisonClues: "[data-model-comparison-clues]",
    compareModelsButton: "[data-toggle-model-comparison]",
    compareModelsCount: "[data-compare-models-count]",
    compareConditionsButton: "[data-toggle-condition-comparison]",
    compareConditionsCount: "[data-compare-conditions-count]",
    explorationPlayer: "[data-exploration-player]",
    playerEyebrow: "[data-player-eyebrow]",
    playToggle: "[data-play-toggle]",
    timeline: "[data-timeline]",
    speedSelect: "[data-speed-select]",
    timeLabel: "[data-time-label]",
    openCurrentView: "[data-open-current-view]",
    keyMoments: "[data-key-moments]",
    sampleReadout: "[data-sample-readout]",
    drawer: "[data-drawer]",
    drawerTitle: "[data-drawer-title]",
    drawerBody: "[data-drawer-body]",
    nextLocation: "[data-next-location]",
    nextLabel: "[data-next-label]",
    previousLocation: "[data-previous-location]",
    previousLabel: "[data-previous-label]",
  };

  return Object.fromEntries(
    Object.entries(selectors).map(([key, selector]) => {
      const element = root.querySelector(selector);
      if (!element) throw new Error(`Explorer template is missing ${selector}.`);
      return [key, element];
    }),
  );
}

export function modelPredictionRuns(runs = []) {
  const availableRuns = Array.isArray(runs) ? runs : [];
  const predictionRuns = availableRuns.filter(
    (run) => run?.runKind === "model-prediction",
  );
  return predictionRuns.length > 0 ? predictionRuns : availableRuns;
}

export function availableOverviewCases(
  cases = [],
  model = null,
  condition = null,
  imageVariant = DEFAULT_IMAGE_VARIANT,
) {
  return cases.filter((caseItem) => Boolean(
    chooseRun(caseItem, model, condition, imageVariant),
  ));
}

export function overviewPredictionRuns(
  cases = [],
  model = null,
  condition = null,
  imageVariant = DEFAULT_IMAGE_VARIANT,
) {
  return cases.flatMap((caseItem) => {
    const runs = modelPredictionRuns(caseItem?.runs);

    const run = model
      ? runs.find(
        (item) =>
          item.model === model &&
          (!condition || item.condition === condition) &&
          (
            !isStaticBaselineModel(model) ||
            runImageVariant(item) === imageVariant
          ),
      )
      : chooseRun(
        caseItem,
        model,
        condition,
        imageVariant,
      );

    return run && hasCoordinate(run.prediction)
      ? [{ caseId: caseItem.id, run }]
      : [];
  });
}

function chooseRun(
  caseItem,
  model,
  condition,
  imageVariant = DEFAULT_IMAGE_VARIANT,
) {
  const runs = modelPredictionRuns(caseItem.runs);

  if (isStaticBaselineModel(model)) {
    return (
      runs.find(
        (run) =>
          run.model === model &&
          run.condition === "static-image" &&
          runImageVariant(run) === imageVariant,
      ) ?? null
    );
  }

  return (
    (model && condition
      ? runs.find((run) => run.model === model && run.condition === condition) ?? null
      : null) ??
    (!condition ? runs.find((run) => run.model === model) : null) ??
    (!model ? runs.find((run) => run.condition === condition) : null) ??
    (!model && !condition ? runs[0] : null) ??
    null
  );
}

function keyMomentMarkup(moments, samples) {
  if (!moments.length) {
    return `<span class="key-moments__empty">No key moments defined</span>`;
  }

  return moments
    .map((moment) => {
      const sampleIndex = Number.isInteger(moment.sampleIndex)
        ? moment.sampleIndex
        : nearestSampleIndex(samples, moment.tMs);

      return `
        <button
          type="button"
          data-moment-index="${sampleIndex}"
          data-moment-time-ms="${Number.isFinite(moment.tMs) ? Math.max(0, moment.tMs) : 0}"
          title="${escapeAttribute(moment.description)}"
        >
          <strong>${escapeHtml(moment.label)}</strong>
          <small>${formatSeconds(moment.tMs)}</small>
        </button>
      `;
    })
    .join("");
}

function sampleReadoutMarkup(sample, exploration, index, frame = null) {
  const imageUrl = assetImageUrl(frame?.image);
  return [
    readoutCell("Sample", `${index + 1} / ${exploration.samples.length}`),
    readoutCell("Heading", formatDegrees(sample.heading)),
    readoutCell("Pitch", formatDegrees(sample.pitch)),
    readoutCell("Zoom", formatNumber(sample.zoom)),
    readoutCell("FOV", formatDegrees(sample.fov)),
    readoutCell("Frame", imageUrl
      ? (frame?.label || frame?.type || "Captured")
      : frame?.video
        ? (frame?.label || "Recorded video")
        : "—"),
  ].join("");
}

function cueListMarkup(cues) {
  if (!cues.length) return `<li class="cue-empty">No cues reported.</li>`;
  return cues
    .map((cue) => {
      const evidence = cue.evidenceView
        ? `<a href="${escapeAttribute(safeStreetViewUrl(cue.evidenceView))}" target="_blank" rel="noopener noreferrer">Evidence view ↗</a>`
        : "";
      return `
        <li class="cue-card">
          <div>
            <strong>${escapeHtml(cue.text)}</strong>
            <small>${escapeHtml(sourceLabel(cue.source))}</small>
          </div>
          <div class="cue-ratings">${ratingPills(cue.ratings)}</div>
          ${evidence}
        </li>
      `;
    })
    .join("");
}

function ratingPills(ratings = {}) {
  return [
    ["Visible", ratings.visible],
    ["Correct", ratings.correct],
    ["Useful", ratings.useful],
    ["Consistent", ratings.consistent],
  ]
    .map(([label, value]) => `<span class="rating-pill ${value === true ? "is-good" : value === false ? "is-bad" : ""}">${escapeHtml(label)} ${value === true ? "✓" : value === false ? "×" : "—"}</span>`)
    .join("");
}

export function summarizeClueRatings(clues = []) {
  return Object.fromEntries(
    ["visible", "correct", "useful", "consistent"].map((key) => {
      const values = clues.map((clue) => clue?.ratings?.[key]);
      const rated = values.filter((value) => typeof value === "boolean");
      const positive = rated.filter(Boolean).length;
      return [key, {
        positive,
        negative: rated.length - positive,
        rated: rated.length,
        unrated: values.length - rated.length,
        ratio: ratio(positive, rated.length),
      }];
    }),
  );
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

export function computeStats(
  cases,
  model,
  condition,
  imageVariant = DEFAULT_IMAGE_VARIANT,
) {
  const selections = cases
    .map((caseItem) => ({
      caseItem,
      run: chooseRun(caseItem, model, condition, imageVariant),
    }))
    .filter(({ run }) => Boolean(run));
  const runs = selections.map(({ run }) => run);
  const scoredRuns = selections.flatMap(({ run }) =>
    run.statisticsRuns?.length ? run.statisticsRuns : [run]
  );
  const errors = scoredRuns.map((run) => run.errorKm).filter(Number.isFinite).sort((a, b) => a - b);
  const clues = selections.flatMap(({ caseItem, run }) => {
    const clueSet = (caseItem.clueSets ?? []).find(
      (item) => item.benchmarkId === run.benchmarkId || item.id === run.benchmarkId,
    );
    return (clueSet?.cues ?? []).filter((clue) => clue.annotationStatus !== "excluded");
  });
  const cueRatings = summarizeClueRatings(clues);
  const explorations = runs.map((run) => run.exploration).filter((exploration) => exploration?.path?.length > 1);

  return {
    caseCount: scoredRuns.length,
    runCount: scoredRuns.length,
    pinRunCount: errors.length,
    medianErrorKm: median(errors),
    meanErrorKm: mean(errors),
    within25: ratio(errors.filter((km) => km <= 25).length, errors.length),
    within250: ratio(errors.filter((km) => km <= 250).length, errors.length),
    within750: ratio(errors.filter((km) => km <= 750).length, errors.length),
    countryAccuracy: booleanRatio(scoredRuns.map((run) => run.accuracy?.country)),
    countryRated: scoredRuns.filter((run) => typeof run.accuracy?.country === "boolean").length,
    cueCount: clues.length,
    cueRatings,
    cueVisible: cueRatings.visible.ratio,
    cueCorrect: cueRatings.correct.ratio,
    cueUseful: cueRatings.useful.ratio,
    cueConsistent: cueRatings.consistent.ratio,
    bands: summarizeBands(errors),
    explorationRuns: explorations.length,
    meanRouteKm: mean(explorations.map((exploration) => explorationDistanceKm(exploration))),
    meanDurationMs: explorations.length ? mean(explorations.map((exploration) => exploration.durationMs).filter(Number.isFinite)) : null,
  };
}

function summarizeBands(errors) {
  const labels = {
    exact: "≤25 m",
    local: "≤250 m",
    regional: "≤25 km",
    country: "≤250 km",
    miss: ">250 km",
  };
  const counts = { exact: 0, local: 0, regional: 0, country: 0, miss: 0 };
  errors.forEach((km) => {
    counts[errorBand(km)] += 1;
  });
  return Object.entries(counts).map(([key, count]) => ({
    key,
    label: labels[key],
    count,
    share: ratio(count, errors.length),
  }));
}

function bucketMarkup(bands) {
  return `<div class="bucket-list">${bands.map((band) => `
    <div class="bucket-row">
      <span>${escapeHtml(band.label)}</span>
      <b>${band.count}</b>
      <i><em style="width:${Math.round((band.share ?? 0) * 100)}%"></em></i>
    </div>`).join("")}</div>`;
}

function progressMarkup(label, summary) {
  const percent = summary.ratio === null ? 0 : Math.round(summary.ratio * 100);
  const count = summary.rated ? `${summary.positive} / ${summary.rated}` : "—";
  const title = summary.rated
    ? `${summary.positive} yes, ${summary.negative} no${summary.unrated ? `, ${summary.unrated} unrated` : ""}`
    : "No rated clues";
  return `
    <div class="progress-row" title="${escapeAttribute(title)}">
      <span>${escapeHtml(label)}</span>
      <b>${escapeHtml(count)}</b>
      <i><em style="width:${percent}%"></em></i>
    </div>
  `;
}

function metricMarkup(label, value, note) {
  return `
    <div class="metric-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(note)}</small>
    </div>
  `;
}

function readoutCell(label, value) {
  return `<div class="readout-cell"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function setSelectOptions(select, values, emptyLabel, selected, labeler = (value) => value) {
  select.innerHTML = [
    `<option value="">${escapeHtml(emptyLabel)}</option>`,
    ...values.map(
      (value) =>
        `<option value="${escapeAttribute(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(labeler(value))}</option>`,
    ),
  ].join("");
}

function resolveRoot(root) {
  if (root instanceof HTMLElement) return root;
  if (typeof root === "string") {
    const element = document.querySelector(root);
    if (element instanceof HTMLElement) return element;
  }
  throw new TypeError("createExplorer requires a root HTMLElement or selector.");
}

function unique(values) {
  return [...new Set(values)];
}

function uniqueBy(values, keyer) {
  const seen = new Set();
  return values.filter((value) => {
    const key = keyer(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function preferredMembership(caseItem, competitionId) {
  const memberships = caseItem?.competitions ?? [];
  return (
    memberships.find((membership) => membership.competitionId === competitionId) ??
    memberships[0] ??
    null
  );
}

function humanizeLabel(value) {
  return String(value ?? "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function readSelectionFromHash() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return {
    caseId: params.get("case") || null,
    model: params.get("model") || null,
    condition: params.get("condition") || null,
    imageVariant: params.get("imageVariant") || null,
  };
}

function writeSelectionToHash(caseItem, run) {
  const params = new URLSearchParams();
  if (caseItem) params.set("case", caseItem.id);
  if (run?.model) params.set("model", run.model);
  if (run?.condition) params.set("condition", run.condition);
  if (isStaticBaselineModel(run?.model) && run?.imageVariant) {
    params.set("imageVariant", run.imageVariant);
  }

  const next = params.toString();
  const current = window.location.hash.replace(/^#/, "");
  if (next === current) return;

  history.replaceState(null, "", `${window.location.pathname}${window.location.search}${next ? `#${next}` : ""}`);
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function assetVideoUrl(video) {
  const raw = typeof video?.path === "string" ? video.path.trim() : "";
  if (!raw) return null;
  if (/^(?:https?:|blob:)/i.test(raw)) return raw;
  return `/${raw.replace(/^[/\\]+/, "")}`;
}

function videoFrameInspectorUrl(exploration, sample, label = "Recorded Street View frame") {
  const video = exploration?.video;
  const videoUrl = assetVideoUrl(video);
  if (!videoUrl || !sample) return null;
  const roundOffsetMs = Number.isFinite(video.roundOffsetMs) ? video.roundOffsetMs : 0;
  const sampleMs = Number.isFinite(sample.tMs) ? sample.tMs : 0;
  const targetMs = Math.max(0, roundOffsetMs + sampleMs);
  const durationMs = Number.isFinite(exploration?.durationMs) ? exploration.durationMs : null;
  const params = new URLSearchParams({
    video: videoUrl,
    t: (targetMs / 1000).toFixed(3),
    label: String(label),
  });
  if (Number.isFinite(durationMs)) {
    params.set("min", (roundOffsetMs / 1000).toFixed(3));
    params.set("max", ((roundOffsetMs + durationMs) / 1000).toFixed(3));
  }
  const crop = video.crop;
  if (crop?.rect && crop?.viewport) {
    params.set("x", String(crop.rect.x));
    params.set("y", String(crop.rect.y));
    params.set("w", String(crop.rect.width));
    params.set("h", String(crop.rect.height));
    params.set("vw", String(crop.viewport.width));
    params.set("vh", String(crop.viewport.height));
  }
  return `/frame-inspector.html?${params.toString()}`;
}

function playbackFrameForSample(exploration, sample) {
  if (!exploration || !sample) return null;
  if (sample.image && assetImageUrl(sample.image)) {
    return {
      id: sample.playbackActionId ?? `sample-${sample.seq ?? 0}`,
      label: sample.label || "Captured sample",
      type: sample.reason || "sample",
      tMs: sample.tMs ?? 0,
      camera: sample,
      image: sample.image,
    };
  }

  const actions = Array.isArray(exploration.playbackActions)
    ? exploration.playbackActions.filter((action) => assetImageUrl(action.image))
    : [];
  if (!actions.length) {
    if (exploration.finalView?.image) return exploration.finalView;
    if (exploration.video?.path) {
      const targetMs = Number.isFinite(sample.tMs) ? sample.tMs : 0;
      const moments = Array.isArray(exploration.keyMoments) ? exploration.keyMoments : [];
      let moment = moments[0] ?? null;
      for (const candidate of moments) {
        if ((candidate.tMs ?? 0) > targetMs) break;
        moment = candidate;
      }
      return {
        id: moment?.id ?? `video-sample-${sample.seq ?? 0}`,
        label: moment?.label ?? "Recorded Street View frame",
        type: moment?.actionType ?? sample.reason ?? "video-frame",
        tMs: targetMs,
        camera: sample,
        video: exploration.video,
      };
    }
    return null;
  }

  const targetMs = Number.isFinite(sample.tMs) ? sample.tMs : 0;
  let frame = actions[0];
  for (const action of actions) {
    if ((action.tMs ?? 0) > targetMs) break;
    frame = action;
  }
  return frame;
}

function evidenceImageMarkup(url, alt) {
  return `
    <a class="evidence-image" href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">
      <img src="${escapeAttribute(url)}" alt="${escapeAttribute(alt)}" loading="lazy" />
      <span>Click image to inspect full resolution ↗</span>
    </a>
  `;
}

function evidenceVideoMarkup(url, posterUrl, label, seekMs = 0) {
  return `
    <div class="evidence-video">
      <video
        class="evidence-video__player"
        controls
        playsinline
        preload="metadata"
        ${posterUrl ? `poster="${escapeAttribute(posterUrl)}"` : ""}
        data-inline-round-video
        data-seek-ms="${Number.isFinite(seekMs) ? Math.max(0, seekMs) : 0}"
        aria-label="${escapeAttribute(label)}"
      >
        <source src="${escapeAttribute(url)}" type="video/webm" />
      </video>
      <span>${escapeHtml(label)}</span>
    </div>
  `;
}

function primeInlineVideos(container) {
  if (!container?.querySelectorAll) return;

  container
    .querySelectorAll("video[data-inline-round-video]")
    .forEach((video) => {
      const seekMs = Number(video.dataset.seekMs ?? 0);
      const seekSeconds = Number.isFinite(seekMs)
        ? Math.max(0, seekMs / 1000)
        : 0;

      let seekApplied = false;

      const cleanup = () => {
        for (const eventName of [
          "loadedmetadata",
          "durationchange",
          "loadeddata",
          "canplay",
          "progress",
        ]) {
          video.removeEventListener(eventName, applySeek);
        }
      };

      const applySeek = () => {
        if (seekApplied) return;

        // We need at least metadata before currentTime can reliably be assigned.
        if (video.readyState < 1) return;

        let targetSeconds = seekSeconds;

        // If the browser knows the real duration, clamp against it.
        // WebM may temporarily report Infinity, so do NOT require a finite
        // duration before attempting the seek.
        if (Number.isFinite(video.duration) && video.duration > 0) {
          targetSeconds = Math.min(
            seekSeconds,
            Math.max(0, video.duration - 0.04),
          );
        }

        try {
          video.pause();
          video.currentTime = targetSeconds;
          seekApplied = true;
          cleanup();
        } catch {
          // Browser may not have a usable seek range yet.
          // A later media event will retry.
        }
      };

      for (const eventName of [
        "loadedmetadata",
        "durationchange",
        "loadeddata",
        "canplay",
        "progress",
      ]) {
        video.addEventListener(eventName, applySeek);
      }

      if (video.readyState >= 1) {
        applySeek();
      }
    });
}

function safeStreetViewUrl(view) {
  try {
    return buildStreetViewUrl(view);
  } catch {
    return "#";
  }
}

function formatSeconds(ms) {
  if (!Number.isFinite(ms)) return "0.0 s";
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatDegrees(value) {
  return Number.isFinite(value) ? `${Math.round(value)}°` : "—";
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "—";
}

function formatPercent(value) {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function accuracyLabel(value) {
  if (value === true) return "Correct";
  if (value === false) return "Incorrect";
  return "Not rated";
}

function sourceLabel(source) {
  return {
    "starting-image": "Starting image",
    panorama: "Panorama",
    map: "Map",
  }[source] ?? source;
}

function clueStatusLabel(status) {
  return {
    reviewed: "reviewed",
    "needs-review": "draft — review needed",
    "not-grounded": "not found in this frame",
    "text-only": "text only",
    "pending-grounding": "awaiting grounding",
  }[status] ?? status ?? "unreviewed";
}

function median(values) {
  if (!values.length) return null;
  const middle = Math.floor(values.length / 2);
  return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
}

function mean(values) {
  const clean = values.filter(Number.isFinite);
  if (!clean.length) return null;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function ratio(numerator, denominator) {
  return denominator ? numerator / denominator : null;
}

function booleanRatio(values) {
  const rated = values.filter((value) => typeof value === "boolean");
  if (!rated.length) return null;
  return rated.filter(Boolean).length / rated.length;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cssEscape(value) {
  if (window.CSS?.escape) return window.CSS.escape(value);
  return String(value).replaceAll('"', '\\"');
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
