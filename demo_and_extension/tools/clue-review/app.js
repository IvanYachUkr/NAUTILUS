import { createMapController } from "../../src/map-controller.js";

const COLORS = {
  signage: "#6ea8ff", landmark: "#ff9b52", architecture: "#bf86ff",
  infrastructure: "#42d5cf", vegetation: "#66d17a", geography: "#c99568", linguistic: "#f0d45c",
};
const els = Object.fromEntries([...document.querySelectorAll("[data-location], [data-clue-set], [data-status-filter], [data-cue-list], [data-image], [data-stage], [data-box-layer], [data-inspector], [data-progress], [data-save], [data-next-pending], [data-stage-note], [data-toast], [data-instructions]")].map((element) => [Object.keys(element.dataset)[0], element]));
const reviewParams = new URLSearchParams(window.location.search);
const ratingMode = reviewParams.get("mode") === "ratings";
const conditionScope = reviewParams.get("condition");
const clueSetScope = reviewParams.get("clueSet");
const RATING_KEYS = ["visible", "correct", "useful", "consistent"];
let documents = [];
let locationIndex = 0;
let clueSetIndex = 0;
let selectedCueId = null;
let dirty = false;
let gesture = null;
let ratingMapController = null;

boot().catch((error) => showToast(error.message, true));

async function boot() {
  const response = await fetch("/api/clues", { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Start the NAUTILUS local server before opening the clue reviewer.");
  const payload = await response.json();
  documents = payload.documents ?? [];
  if (conditionScope) {
    documents = documents.filter((item) => item.clueSets?.some((set) => set.condition === conditionScope));
  }
  if (clueSetScope) {
    documents = documents.filter((item) => item.clueSets?.some((set) => set.id === clueSetScope));
  }
  documents = documents.filter((item) => item.clueSets?.some(isEligibleClueSet));
  if (!documents.length) throw new Error("No clue documents were found. Run npm run clues:extract first.");
  els.location.innerHTML = documents.map((document, index) => `<option value="${index}">${escapeHtml(document.locationId)}</option>`).join("");
  if (ratingMode) {
    document.body.classList.add("is-rating-mode");
    els.statusFilter.value = "rating-ready";
    els.save.textContent = "Save progress";
    els.nextPending.textContent = "Save ratings & next";
    els.instructions.innerHTML = "<strong>Rate the annotations you already reviewed.</strong> Tick every property that applies. Saving and continuing records unticked properties as No. Bounding boxes and clue text are locked in this pass.";
  }
  bindEvents();
  if (ratingMode) selectFirstUnrated();
  else selectFirstUnresolved();
  render();
}

function bindEvents() {
  els.location.addEventListener("change", () => { locationIndex = Number(els.location.value); clueSetIndex = firstEligibleClueSetIndex(); selectedCueId = null; render(); });
  els.clueSet.addEventListener("change", () => { clueSetIndex = Number(els.clueSet.value); selectedCueId = null; render(); });
  els.statusFilter.addEventListener("change", render);
  els.save.addEventListener("click", () => saveCurrent().catch((error) => showToast(error.message, true)));
  els.nextPending.addEventListener("click", () => {
    if (ratingMode) saveRatingsAndNext().catch((error) => showToast(error.message, true));
    else { selectNextUnresolved(); render(); }
  });
  els.cueList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cue-id]");
    if (!button) return;
    selectedCueId = button.dataset.cueId;
    render();
  });
  els.inspector.addEventListener("input", updateFromInspector);
  els.inspector.addEventListener("change", updateFromInspector);
  els.inspector.addEventListener("click", handleInspectorAction);
  els.boxLayer.addEventListener("pointerdown", startBoxGesture);
  els.stage.addEventListener("pointerdown", startDrawGesture);
  window.addEventListener("pointermove", updateGesture);
  window.addEventListener("pointerup", endGesture);
  window.addEventListener("beforeunload", (event) => { if (dirty) event.preventDefault(); });
  window.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); saveCurrent().catch((error) => showToast(error.message, true)); }
    if (!event.ctrlKey && !event.metaKey && !event.altKey && !/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) {
      const shortcutIndex = /^Numpad[1-4]$/.test(event.code) ? Number(event.code.at(-1)) - 1 : -1;
      if (shortcutIndex >= 0) {
        event.preventDefault();
        toggleRatingShortcut(shortcutIndex);
      }
    }
    if (event.key === "ArrowDown" && !/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) { event.preventDefault(); selectAdjacentCue(1); }
    if (event.key === "ArrowUp" && !/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) { event.preventDefault(); selectAdjacentCue(-1); }
  });
}

function render() {
  const document = currentDocument();
  const clueSets = document.clueSets ?? [];
  const eligibleSets = clueSets.map((item, index) => ({ item, index })).filter(({ item }) => isEligibleClueSet(item));
  if (!eligibleSets.some(({ index }) => index === clueSetIndex)) clueSetIndex = eligibleSets[0]?.index ?? 0;
  const clueSet = currentClueSet();
  els.location.value = String(locationIndex);
  els.clueSet.innerHTML = eligibleSets.map(({ item, index }) => `<option value="${index}">${escapeHtml(item.model)} · ${escapeHtml(item.reasoning ?? "")}${item.condition ? ` · ${escapeHtml(conditionLabel(item.condition))}` : ""}</option>`).join("");
  els.clueSet.value = String(clueSetIndex);
  els.image.src = `/${clueSet?.imagePath ?? document.imagePath}`;

  const visibleCues = (clueSet?.cues ?? []).filter((cue) => matchesStatusFilter(cue, els.statusFilter.value));
  if (!selectedCueId || !visibleCues.some((cue) => cue.id === selectedCueId)) selectedCueId = visibleCues[0]?.id ?? null;
  els.cueList.innerHTML = visibleCues.map((cue) => {
    const index = clueSet.cues.indexOf(cue) + 1;
    return `<li><button type="button" class="${cue.id === selectedCueId ? "is-active" : ""}" data-cue-id="${escapeHtml(cue.id)}"><i class="status-dot ${escapeHtml(cue.annotationStatus)}"></i><span>${index}. ${escapeHtml(cue.label)}</span><small>${escapeHtml(cue.annotationStatus)}</small></button></li>`;
  }).join("");
  renderBoxes(clueSet);
  renderInspector();
  renderProgress();
}

function renderBoxes(clueSet) {
  els.boxLayer.innerHTML = (clueSet?.cues ?? []).filter((cue) => cue.region && cue.annotationStatus !== "excluded").map((cue, index) => {
    const region = cue.region;
    return `<div class="annotation-box ${cue.id === selectedCueId ? "is-active" : ""}" data-cue-id="${escapeHtml(cue.id)}" data-index="${index + 1}" style="left:${region.x * 100}%;top:${region.y * 100}%;width:${region.w * 100}%;height:${region.h * 100}%;--box-color:${COLORS[cue.category] ?? COLORS.signage}"><span class="resize-handle" data-resize></span></div>`;
  }).join("");
}

function renderInspector() {
  destroyRatingMap();
  const clue = currentCue();
  if (!clue) { els.inspector.innerHTML = '<div class="empty">Select a clue to review it.</div>'; return; }
  if (ratingMode) {
    if (isRatingsExcluded(clue)) {
      els.inspector.innerHTML = `
        <h2>${escapeHtml(clue.label)}</h2>
        <p class="inspector__meta">${escapeHtml(clue.sourceRuns.join(", "))} · excluded from interpretability ratings</p>
        <p>${escapeHtml(clue.description)}</p>
        ${ratingMapMarkup(clue)}
        <div class="rating-exclusion-note"><strong>Excluded from ratings</strong><span>This clue is retained for audit purposes, but is omitted from the four interpretability measures and from the public clue display.</span></div>
        <div class="actions">
          <button type="button" class="primary wide" data-action="ratings-restore">Restore clue to ratings</button>
        </div>
        <div class="provenance"><strong>Original reports</strong>${clue.provenance.map((item) => `<details><summary>${escapeHtml(item.runId)}</summary><p>${escapeHtml(item.text)}</p></details>`).join("")}</div>`;
      els.stageNote.textContent = `${clue.label} · excluded from ratings`;
      renderRatingMap();
      return;
    }
    const complete = ratingsComplete(clue);
    els.inspector.innerHTML = `
      <h2>${escapeHtml(clue.label)}</h2>
      <p class="inspector__meta">${escapeHtml(clue.sourceRuns.join(", "))} · ${escapeHtml(clue.annotationStatus)} · ${complete ? "ratings complete" : "ratings pending"}</p>
      <p>${escapeHtml(clue.description)}</p>
      ${ratingMapMarkup(clue)}
      <div class="ratings ratings--focused">${RATING_KEYS.map((rating, index) => `<label class="${clue.ratings?.[rating] === null ? "is-unrated" : ""}"><kbd>${index + 1}</kbd><input type="checkbox" data-rating="${rating}" ${clue.ratings?.[rating] === true ? "checked" : ""} aria-keyshortcuts="Numpad${index + 1}" /> ${rating}</label>`).join("")}</div>
      <p class="rating-help"><strong>Numpad:</strong> 1 Visible · 2 Correct · 3 Useful · 4 Consistent. Press again to untick. When you continue, every unticked box is saved as false.</p>
      <div class="actions">
        <button type="button" class="primary wide" data-action="ratings-next">Save ratings &amp; next</button>
        <button type="button" class="wide" data-action="ratings-skip">Skip for now</button>
        <button type="button" class="danger wide" data-action="ratings-exclude">Exclude clue from ratings</button>
      </div>
      <div class="provenance"><strong>Original reports</strong>${clue.provenance.map((item) => `<details><summary>${escapeHtml(item.runId)}</summary><p>${escapeHtml(item.text)}</p></details>`).join("")}</div>`;
    els.stageNote.textContent = clue.region ? `${clue.label} · reviewed image region` : `${clue.label} · reviewed text-only clue`;
    renderRatingMap();
    return;
  }
  els.inspector.innerHTML = `
    <h2>${escapeHtml(clue.label)}</h2>
    <p class="inspector__meta">${escapeHtml(clue.sourceRuns.join(", "))} · ${escapeHtml(clue.annotationStatus)}</p>
    <label>Label<input data-field="label" value="${escapeHtml(clue.label)}" /></label>
    <label>Description<textarea data-field="description">${escapeHtml(clue.description)}</textarea></label>
    <div class="field-row">
      <label>Category<select data-field="category">${Object.keys(COLORS).map((category) => `<option ${category === clue.category ? "selected" : ""}>${category}</option>`).join("")}</select></label>
      <label>Status<select data-field="annotationStatus">${["needs-review", "reviewed", "text-only", "not-grounded", "excluded"].map((status) => `<option ${status === clue.annotationStatus ? "selected" : ""}>${status}</option>`).join("")}</select></label>
    </div>
    ${ratingMapMarkup(clue)}
    <div class="ratings">${["visible", "correct", "useful", "consistent"].map((rating) => `<label><input type="checkbox" data-rating="${rating}" ${clue.ratings?.[rating] === true ? "checked" : ""} /> ${rating}</label>`).join("")}</div>
    <div class="actions">
      <button type="button" class="primary" data-action="approve">Approve box</button>
      <button type="button" data-action="text-only">Text only</button>
      <button type="button" data-action="clear">Clear box</button>
      <button type="button" data-action="exclude">Exclude clue</button>
      <button type="button" class="wide" data-action="next">Approve and next unresolved</button>
    </div>
    <div class="provenance"><strong>Original reports</strong>${clue.provenance.map((item) => `<details><summary>${escapeHtml(item.runId)}</summary><p>${escapeHtml(item.text)}</p></details>`).join("")}</div>`;
  els.stageNote.textContent = clue.region ? `${clue.label} · ${clue.regionSource ?? "manual region"}` : `${clue.label} · no region`;
  renderRatingMap();
}

function updateFromInspector(event) {
  const clue = currentCue();
  if (!clue) return;
  if (event.target.dataset.field) clue[event.target.dataset.field] = event.target.value;
  if (event.target.dataset.rating) clue.ratings[event.target.dataset.rating] = event.target.checked;
  markDirty();
  if (event.type === "change" && !event.target.dataset.rating) render();
}

function handleInspectorAction(event) {
  const action = event.target.closest("[data-action]")?.dataset.action;
  const clue = currentCue();
  if (!action || !clue) return;
  if (action === "ratings-next") {
    saveRatingsAndNext().catch((error) => showToast(error.message, true));
    return;
  }
  if (action === "ratings-skip") {
    selectNextUnrated();
    render();
    return;
  }
  if (action === "ratings-exclude") {
    excludeRatingAndNext().catch((error) => showToast(error.message, true));
    return;
  }
  if (action === "ratings-restore") {
    restoreRatingCue().catch((error) => showToast(error.message, true));
    return;
  }
  if (action === "approve" || action === "next") {
    if (!clue.region) { showToast("Draw or keep a box before approving this clue.", true); return; }
    clue.annotationStatus = "reviewed";
    clue.regionSource = `${clue.regionSource ?? "manual"}+manual-review`;
    finalizeRatings(clue);
  } else if (action === "text-only") {
    clue.region = null; clue.annotationStatus = "text-only"; clue.regionSource = null;
    finalizeRatings(clue);
  } else if (action === "clear") {
    clue.region = null; clue.annotationStatus = "not-grounded"; clue.regionSource = null;
  } else if (action === "exclude") {
    clue.region = null; clue.annotationStatus = "excluded"; clue.regionSource = null;
  }
  markDirty();
  if (action === "next") selectNextUnresolved();
  render();
}

function startBoxGesture(event) {
  if (ratingMode) return;
  const box = event.target.closest("[data-cue-id]");
  if (!box) return;
  event.stopPropagation();
  selectedCueId = box.dataset.cueId;
  const clue = currentCue();
  gesture = { type: event.target.matches("[data-resize]") ? "resize" : "move", clue, startX: event.clientX, startY: event.clientY, region: { ...clue.region } };
  box.setPointerCapture?.(event.pointerId);
  renderInspector();
}

function startDrawGesture(event) {
  if (ratingMode) return;
  if (event.target !== els.stage && event.target !== els.boxLayer) return;
  const clue = currentCue();
  if (!clue) return;
  const point = normalizedPoint(event);
  gesture = { type: "draw", clue, start: point };
  clue.region = { x: point.x, y: point.y, w: 0.001, h: 0.001 };
  clue.annotationStatus = "needs-review";
  clue.regionSource = "manual";
  markDirty();
}

function updateGesture(event) {
  if (!gesture) return;
  const rect = els.stage.getBoundingClientRect();
  if (gesture.type === "draw") {
    const point = normalizedPoint(event);
    gesture.clue.region = normalizedRegion({ x: Math.min(gesture.start.x, point.x), y: Math.min(gesture.start.y, point.y), w: Math.abs(point.x - gesture.start.x), h: Math.abs(point.y - gesture.start.y) });
  } else {
    const dx = (event.clientX - gesture.startX) / rect.width;
    const dy = (event.clientY - gesture.startY) / rect.height;
    const start = gesture.region;
    gesture.clue.region = gesture.type === "move"
      ? normalizedRegion({ ...start, x: start.x + dx, y: start.y + dy })
      : normalizedRegion({ ...start, w: start.w + dx, h: start.h + dy });
    gesture.clue.annotationStatus = "needs-review";
    gesture.clue.regionSource = "manual";
  }
  markDirty();
  renderBoxes(currentClueSet());
}

function endGesture() { if (gesture) { gesture = null; render(); } }
function normalizedPoint(event) { const rect = els.stage.getBoundingClientRect(); return { x: clamp((event.clientX - rect.left) / rect.width), y: clamp((event.clientY - rect.top) / rect.height) }; }
function normalizedRegion(region) { const x = clamp(region.x), y = clamp(region.y); return { x, y, w: Math.max(.002, Math.min(1 - x, region.w)), h: Math.max(.002, Math.min(1 - y, region.h)) }; }

async function saveCurrent() {
  const clueDocument = currentDocument();
  const response = await fetch(`/api/clues/${encodeURIComponent(clueDocument.locationId)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(clueDocument) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Unable to save clue document.");
  dirty = false;
  window.document.body.classList.remove("is-dirty");
  if (typeof BroadcastChannel === "function") {
    const channel = new BroadcastChannel("nautilus-clue-updates");
    channel.postMessage({ type: "clues-updated", locationId: clueDocument.locationId });
    channel.close();
  }
  showToast(`Saved ${clueDocument.locationId}.`);
}

async function saveRatingsAndNext() {
  const clue = currentCue();
  if (!clue || !isRatingCandidate(clue)) return;
  finalizeRatings(clue);
  markDirty();
  await saveCurrent();
  const found = selectNextUnrated();
  render();
  if (!found) showToast("All previously reviewed clues have interpretability ratings.");
}

async function excludeRatingAndNext() {
  const clue = currentCue();
  if (!clue || !isRatingCandidate(clue)) return;
  clue.ratingsPreviousStatus = clue.annotationStatus;
  clue.annotationStatus = "excluded";
  clue.ratingsExclusionReason = "not-ratable";
  clue.ratingsExcludedAt = new Date().toISOString();
  delete clue.ratingsReviewedAt;
  markDirty();
  await saveCurrent();
  const found = selectNextUnrated();
  render();
  if (!found) showToast("All rating candidates are complete or explicitly excluded.");
}

async function restoreRatingCue() {
  const clue = currentCue();
  if (!clue || !isRatingsExcluded(clue)) return;
  clue.annotationStatus = ["reviewed", "text-only"].includes(clue.ratingsPreviousStatus)
    ? clue.ratingsPreviousStatus
    : clue.region
      ? "reviewed"
      : "text-only";
  delete clue.ratingsPreviousStatus;
  delete clue.ratingsExclusionReason;
  delete clue.ratingsExcludedAt;
  markDirty();
  await saveCurrent();
  render();
}

function selectFirstUnresolved() {
  for (let d = 0; d < documents.length; d += 1) for (let s = 0; s < documents[d].clueSets.length; s += 1) {
    if (!isEligibleClueSet(documents[d].clueSets[s])) continue;
    const cue = documents[d].clueSets[s].cues.find(isUnresolved);
    if (cue) { locationIndex = d; clueSetIndex = s; selectedCueId = cue.id; return; }
  }
}
function selectNextUnresolved() {
  const flattened = flattenedCues();
  const current = flattened.findIndex((item) => item.d === locationIndex && item.s === clueSetIndex && item.cue.id === selectedCueId);
  const next = [...flattened.slice(current + 1), ...flattened.slice(0, current + 1)].find((item) => isUnresolved(item.cue));
  if (next) { locationIndex = next.d; clueSetIndex = next.s; selectedCueId = next.cue.id; }
  else showToast("All clues have been reviewed or intentionally classified.");
}
function selectFirstUnrated() {
  const first = flattenedCues().find((item) => isRatingCandidate(item.cue) && !ratingsComplete(item.cue));
  const fallback = flattenedCues().find((item) => isRatingCandidate(item.cue));
  const next = first ?? fallback;
  if (next) { locationIndex = next.d; clueSetIndex = next.s; selectedCueId = next.cue.id; }
}
function selectNextUnrated() {
  const flattened = flattenedCues().filter((item) => isRatingCandidate(item.cue));
  const current = flattened.findIndex((item) => item.d === locationIndex && item.s === clueSetIndex && item.cue.id === selectedCueId);
  const next = [...flattened.slice(current + 1), ...flattened.slice(0, Math.max(0, current + 1))].find((item) => !ratingsComplete(item.cue));
  if (next) { locationIndex = next.d; clueSetIndex = next.s; selectedCueId = next.cue.id; return true; }
  return false;
}
function selectAdjacentCue(delta) { const cues = currentClueSet()?.cues ?? []; const index = cues.findIndex((cue) => cue.id === selectedCueId); selectedCueId = cues[(index + delta + cues.length) % cues.length]?.id ?? selectedCueId; render(); }
function isUnresolved(cue) { return ["pending-grounding", "needs-review", "not-grounded"].includes(cue.annotationStatus); }
function isRatingCandidate(cue) { return cue.annotationStatus === "reviewed" || cue.annotationStatus === "text-only"; }
function isRatingsExcluded(cue) { return cue.annotationStatus === "excluded" && cue.ratingsExclusionReason === "not-ratable"; }
function isRatingScopeCue(cue) { return isRatingCandidate(cue) || isRatingsExcluded(cue); }
function ratingsComplete(cue) { return isRatingsExcluded(cue) || RATING_KEYS.every((key) => typeof cue.ratings?.[key] === "boolean"); }
function finalizeRatings(cue) {
  cue.ratings ??= {};
  for (const key of RATING_KEYS) {
    if (typeof cue.ratings[key] !== "boolean") cue.ratings[key] = false;
  }
  cue.ratingsReviewedAt = new Date().toISOString();
}
function flattenedCues() {
  return documents.flatMap((document, d) => document.clueSets.flatMap((set, s) =>
    isEligibleClueSet(set) ? set.cues.map((cue) => ({ cue, d, s })) : [],
  ));
}
function isEligibleClueSet(set) {
  return (!conditionScope || set?.condition === conditionScope) &&
    (!clueSetScope || set?.id === clueSetScope) &&
    (!ratingMode || set?.cues?.some(isRatingScopeCue));
}
function conditionLabel(condition) {
  return condition === "static-image-covered"
    ? "Static images covered"
    : condition === "interactive-panorama"
      ? "Interactive panorama"
      : condition;
}
function firstEligibleClueSetIndex() {
  const index = currentDocument()?.clueSets?.findIndex(isEligibleClueSet) ?? 0;
  return Math.max(0, index);
}
function matchesStatusFilter(cue, filter) {
  if (ratingMode && filter === "rating-excluded") return isRatingsExcluded(cue);
  if (ratingMode && !isRatingCandidate(cue)) return false;
  if (!filter || filter === "rating-ready") return !ratingMode || isRatingCandidate(cue);
  return cue.annotationStatus === filter;
}
function renderProgress() {
  const cues = flattenedCues().map((item) => item.cue);
  if (ratingMode) {
    const candidates = cues.filter(isRatingScopeCue);
    const excluded = candidates.filter(isRatingsExcluded).length;
    const completed = candidates.filter((cue) => !isRatingsExcluded(cue) && ratingsComplete(cue)).length;
    els.progress.textContent = `${completed} rated · ${excluded} excluded · ${candidates.length - completed - excluded} remaining · ${candidates.length} total`;
    return;
  }
  const resolved = cues.filter((cue) => !isUnresolved(cue)).length;
  els.progress.textContent = `${resolved} / ${cues.length} classified · ${cues.length - resolved} unresolved`;
}
function currentDocument() { return documents[locationIndex]; }
function currentClueSet() { return currentDocument()?.clueSets?.[clueSetIndex]; }
function currentCue() { return currentClueSet()?.cues?.find((cue) => cue.id === selectedCueId) ?? null; }
function toggleRatingShortcut(index) {
  const clue = currentCue();
  const key = RATING_KEYS[index];
  if (!clue || !key || (ratingMode && !isRatingCandidate(clue))) return;
  clue.ratings ??= {};
  clue.ratings[key] = clue.ratings[key] !== true;
  const input = els.inspector.querySelector(`[data-rating="${key}"]`);
  if (input) {
    input.checked = clue.ratings[key];
    input.closest("label")?.classList.remove("is-unrated");
  }
  markDirty();
}
function ratingMapMarkup() {
  const clueSet = currentClueSet();
  const run = currentPredictionRun();
  const runLabel = run?.bestRunLabel ?? "best overall run";
  const detail = run?.prediction
    ? `${formatDistance(run.errorKm)} pin error · ${runLabel}`
    : "Prediction coordinates are not available for this model yet.";
  return `<section class="rating-map-card">
    <header><strong>Prediction used for consistency</strong><span>${escapeHtml(clueSet?.model ?? "Model")} · ${escapeHtml(clueSet?.reasoning ?? "")}</span></header>
    <div class="rating-map" data-rating-map aria-label="Ground truth and model prediction map"></div>
    <p><i class="map-key map-key--truth"></i> Ground truth <i class="map-key map-key--prediction"></i> Model prediction · ${escapeHtml(detail)}</p>
  </section>`;
}
function currentPredictionRun() {
  const clueSet = currentClueSet();
  return currentDocument()?.predictionsByBenchmarkId?.[clueSet?.benchmarkId ?? clueSet?.id] ?? null;
}
function renderRatingMap() {
  const container = els.inspector.querySelector("[data-rating-map]");
  const caseItem = currentDocument()?.mapCase;
  const run = currentPredictionRun();
  if (!container || !caseItem) return;
  ratingMapController = createMapController(container, { leafletTimeoutMs: 7000 });
  ratingMapController.update({ cases: [caseItem], caseItem, run, overview: false }, { fit: true });
}
function destroyRatingMap() {
  ratingMapController?.destroy();
  ratingMapController = null;
}
function formatDistance(km) {
  if (!Number.isFinite(km)) return "unknown";
  if (km < .1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(2)} km`;
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString("en-US")} km`;
}
function markDirty() { dirty = true; document.body.classList.add("is-dirty"); }
function showToast(message, error = false) { els.toast.textContent = message; els.toast.style.borderColor = error ? "#ff7185" : ""; els.toast.hidden = false; window.setTimeout(() => { els.toast.hidden = true; }, 4000); }
function clamp(value) { return Math.max(0, Math.min(1, value)); }
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
