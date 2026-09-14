import { assetImageUrl } from "./asset-url.js";

export const PROJECT_SECTION_IDS = [
  "explorer",
  "research",
  "method",
  "results",
  "evidence",
  "team",
];

export const METHOD_STAGE_IDS = ["observe", "hypothesize", "explore", "pin"];

export const RECORDED_BENCHMARKS = [
  {
    id: "glm-5-3-flash-max",
    dataDirectory: "glm-5.3-flash-max",
    model: "GLM-5.3-Flash + MCP",
    reasoning: "Max",
    points: (111_161 + 113_530 + 108_249) / 3,
    maxPoints: 125_000,
    sample: "3 runs · mean score · resumptions disclosed",
    runs: [
      { label: "Run 1", easy: 39_773, medium: 41_229, hard: 30_159, total: 111_161 },
      { label: "Run 2 (resumed)", easy: 39_900, medium: 41_142, hard: 32_488, total: 113_530 },
      { label: "Run 3 (resumed)", easy: 39_954, medium: 38_026, hard: 30_269, total: 108_249 },
    ],
    bestRun: { id: "run-2", label: "Run 2 (resumed)", points: 113_530 },
    predictionSource: { type: "glm-conversation", path: "runs/run-2/conversation.json" },
    statisticsSource: { type: "curated-json", path: "statistics/all-runs.json" },
  },
  {
    id: "gpt-6-astra-low",
    dataDirectory: "gpt-6-astra-low",
    model: "GPT-6 Astra",
    reasoning: "low",
    points: (119_160 + 119_818 + 118_759) / 3,
    maxPoints: 125_000,
    sample: "3 runs · mean score",
    runs: [
      { label: "Run 1", easy: 39_997, medium: 44_189, hard: 34_974, total: 119_160 },
      { label: "Run 2", easy: 39_998, medium: 44_686, hard: 35_134, total: 119_818 },
      { label: "Run 3", easy: 39_998, medium: 43_482, hard: 35_279, total: 118_759 },
    ],
    bestRun: { id: "run-2", label: "Run 2", points: 119_818 },
    predictionSource: { type: "curated-json", path: "runs/run-2/predictions.json" },
    statisticsSource: { type: "curated-json", path: "statistics/all-runs.json" },
    predictionNotes: "Run 2 coordinates were recovered from browser result maps. Four are original numeric values; 21 are conservative map-pixel reconstructions with recorded uncertainty.",
  },
  {
    id: "gemini-3-7-flash-high-aided",
    dataDirectory: "gemini-3.7-flash-high-aided",
    model: "Gemini 3.7 Flash",
    reasoning: "high, aided",
    points: (120_029 + 120_624 + 119_955) / 3,
    maxPoints: 125_000,
    sample: "3 runs · mean score",
    runs: [
      { label: "Run 1", easy: 39_999, medium: 43_026, hard: 37_004, total: 120_029 },
      { label: "Run 2", easy: 39_988, medium: 44_011, hard: 36_625, total: 120_624 },
      { label: "Run 3", easy: 39_964, medium: 43_323, hard: 36_668, total: 119_955 },
    ],
    bestRun: { id: "r2", label: "Run 2", points: 120_624 },
    predictionSource: { type: "recorded-directory", path: "runs/run-2" },
    statisticsSource: { type: "recorded-runs", path: "runs" },
  },
  {
    id: "gemini-3-7-flash-medium-aided", dataDirectory: "gemini-3.7-flash-medium-aided",
    model: "Gemini 3.7 Flash", reasoning: "medium, aided",
    points: (121_264 + 117_702 + 121_492) / 3, maxPoints: 125_000, sample: "3 runs · mean score",
    runs: [
      { label: "Run 1", easy: 39_988, medium: 44_105, hard: 37_170, total: 121_264 },
      { label: "Run 2", easy: 40_000, medium: 42_320, hard: 35_382, total: 117_702 },
      { label: "Run 3", easy: 40_000, medium: 43_324, hard: 38_168, total: 121_492 },
    ],
    bestRun: { id: "r3", label: "Run 3", points: 121_492 },
    predictionSource: { type: "recorded-directory", path: "runs/run-3" },
    statisticsSource: { type: "recorded-runs", path: "runs" },
  },
  {
    id: "gemini-3-8-flash-high-aided", dataDirectory: "gemini-3.8-flash-high-aided",
    model: "Gemini 3.8 Flash", reasoning: "high, aided",
    points: (120_919 + 119_950 + 120_302) / 3, maxPoints: 125_000, sample: "3 runs · mean score",
    runs: [
      { label: "Run 1", easy: 39_985, medium: 43_872, hard: 37_062, total: 120_919 },
      { label: "Run 2", easy: 39_986, medium: 43_233, hard: 36_731, total: 119_950 },
      { label: "Run 3", easy: 39_984, medium: 43_229, hard: 37_089, total: 120_302 },
    ],
    bestRun: { id: "r1", label: "Run 1", points: 120_919 },
    predictionSource: { type: "recorded-directory", path: "runs/run-1" },
    statisticsSource: { type: "recorded-runs", path: "runs" },
  },
  {
    id: "gemini-3-8-flash-medium-aided", dataDirectory: "gemini-3.8-flash-medium-aided",
    model: "Gemini 3.8 Flash", reasoning: "medium, aided",
    points: (119_061 + 119_673 + 120_677) / 3, maxPoints: 125_000, sample: "3 runs · mean score",
    runs: [
      { label: "Run 1", easy: 39_977, medium: 41_933, hard: 37_151, total: 119_061 },
      { label: "Run 2", easy: 39_997, medium: 42_649, hard: 37_027, total: 119_673 },
      { label: "Run 3", easy: 39_984, medium: 43_857, hard: 36_836, total: 120_677 },
    ],
    bestRun: { id: "r3", label: "Run 3", points: 120_677 },
    predictionSource: { type: "recorded-directory", path: "runs/run-3" },
    statisticsSource: { type: "recorded-runs", path: "runs" },
  },
  {
    id: "gpt-5-6-sol-xhigh",
    dataDirectory: "gpt-5.6-sol-xhigh",
    model: "GPT-5.6 Sol",
    reasoning: "xhigh",
    points: (110_273 + 107_436 + 114_716) / 3,
    maxPoints: 125_000,
    sample: "3 runs · mean score",
    bestRun: { id: "r3", label: "Run 3", points: 114_716 },
    predictionSource: { type: "recorded-directory", path: "runs/run-3" },
    statisticsSource: { type: "recorded-runs", path: "runs" },
  },
  {
    id: "gpt-5-6-sol-max",
    dataDirectory: "gpt-5.6-sol-max",
    model: "GPT-5.6 Sol",
    reasoning: "max",
    points: (107_838 + 114_794 + 111_149) / 3,
    maxPoints: 125_000,
    sample: "3 runs · mean score",
    bestRun: { id: "r2", label: "Run 2", points: 114_794 },
    predictionSource: { type: "recorded-directory", path: "runs/run-2" },
    statisticsSource: { type: "recorded-runs", path: "runs" },
  },
  {
    id: "grok-4-6-xhigh",
    dataDirectory: "grok-4.6-xhigh",
    model: "Grok 4.6",
    reasoning: "xhigh",
    points: (80_081 + 71_562 + 73_222) / 3,
    maxPoints: 125_000,
    sample: "3 runs · mean score",
    bestRun: { id: "r1", label: "Run 1", points: 80_081 },
    predictionSource: { type: "recorded-directory", path: "runs/run-1" },
    statisticsSource: { type: "recorded-runs", path: "runs" },
  },
  {
    id: "grok-4-6-xhigh-mcp",
    dataDirectory: "grok-4.6-xhigh",
    model: "Grok 4.6 + MCP",
    reasoning: "xhigh",
    points: 105_026,
    maxPoints: 125_000,
    sample: "3 runs per difficulty · composite mean",
    bestRun: {
      id: "tier-best-composite",
      label: "Best available run per difficulty (composite)",
      points: 110_534,
    },
    predictionSource: {
      type: "curated-json",
      path: "mcp-composite-best/predictions.json",
    },
    statisticsSource: { type: "grok-mcp-runs" },
    predictionNotes: "Best available complete run is selected independently for each difficulty because this condition was evaluated as separate Easy, Medium, and Hard runs. The Medium round-1 marker is the recorded default Gulf of Guinea pin after a timeout.",
  },
  {
    id: "gemini-3-7-flash-high-unaided",
    dataDirectory: "gemini-3.7-flash-high",
    model: "Gemini 3.7 Flash",
    reasoning: "high, unaided",
    points: 64_350,
    maxPoints: 125_000,
    sample: "1 run",
    bestRun: { id: "r1", label: "Run 1", points: 64_350 },
    predictionSource: { type: "recorded-directory", path: "runs/run-1" },
    statisticsSource: { type: "recorded-runs", path: "runs" },
  },
];

export function buildProjectSnapshot(cases = [], benchmarks = RECORDED_BENCHMARKS) {
  const difficultyCounts = { easy: 0, medium: 0, hard: 0 };
  const evidenceCounts = { reviewed: 0, textOnly: 0, excluded: 0 };
  const sceneImages = {};

  for (const item of cases) {
    if (Object.hasOwn(difficultyCounts, item?.difficulty)) {
      difficultyCounts[item.difficulty] += 1;
    }
    const imageUrl = assetImageUrl(item?.startingImage);
    if (item?.id && imageUrl) sceneImages[item.id] = imageUrl;
    for (const clueSet of item?.clueSets ?? []) {
      for (const cue of clueSet?.cues ?? []) {
        if (cue?.annotationStatus === "reviewed") evidenceCounts.reviewed += 1;
        if (cue?.annotationStatus === "text-only") evidenceCounts.textOnly += 1;
        if (cue?.annotationStatus === "excluded") evidenceCounts.excluded += 1;
      }
    }
  }

  const leaderboard = benchmarks
    .map((entry) => ({
      ...entry,
      scorePercent: roundToOne((entry.points / entry.maxPoints) * 100),
    }))
    .sort((left, right) => right.points - left.points)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return {
    locationCount: cases.length,
    difficultyCounts,
    evidenceCounts,
    sceneImages,
    leaderboard,
  };
}

export function normalizeProjectSection(value) {
  const normalized = String(value ?? "").trim().toLocaleLowerCase();
  return PROJECT_SECTION_IDS.includes(normalized) ? normalized : null;
}

export function scrollToProjectSection(root, value, { behavior = "smooth" } = {}) {
  const sectionId = normalizeProjectSection(value);
  if (!sectionId || !root?.querySelector) return false;

  const target = root.querySelector(`[data-site-section-id="${sectionId}"]`);
  if (!target?.scrollIntoView) return false;

  target.scrollIntoView({ behavior, block: "start" });
  return true;
}

export function scrollToMethodStage(root, value, { behavior = "smooth" } = {}) {
  const stageId = String(value ?? "").trim().toLocaleLowerCase();
  if (!METHOD_STAGE_IDS.includes(stageId) || !root?.querySelector) return false;

  const target = root.querySelector(`[data-method-stage-id="${stageId}"]`);
  if (!target?.scrollIntoView) return false;

  target.scrollIntoView({ behavior, block: "center" });
  target.focus?.({ preventScroll: true });
  return true;
}

export function setActiveProjectSection(root, value) {
  const sectionId = normalizeProjectSection(value);
  if (!sectionId || !root?.querySelectorAll) return false;

  root.dataset.activeSection = sectionId;
  for (const item of root.querySelectorAll("[data-story-navigation] [data-scroll-target]")) {
    const isCurrent = item.dataset.scrollTarget === sectionId;
    item.classList.toggle("is-active", isCurrent);
    if (isCurrent) item.setAttribute("aria-current", "location");
    else item.removeAttribute("aria-current");
  }
  return true;
}

export function projectSectionAtViewport(sections, anchorY) {
  let activeSection = null;
  for (const section of sections ?? []) {
    if (section.getBoundingClientRect().top > anchorY) break;
    activeSection = normalizeProjectSection(section.dataset.siteSectionId) ?? activeSection;
  }
  return activeSection;
}

export function projectStoryMarkup(snapshot = buildProjectSnapshot()) {
  const counts = snapshot.difficultyCounts ?? { easy: 0, medium: 0, hard: 0 };
  const evidenceCounts = snapshot.evidenceCounts ?? { reviewed: 0, textOnly: 0, excluded: 0 };
  const leaderboard = snapshot.leaderboard ?? [];

  return `
    <div class="project-story" data-project-story>
      <nav class="story-nav" data-story-navigation aria-label="Project sections">
        <button class="story-nav__brand" type="button" data-scroll-target="explorer">
          <span>NAUTILUS</span>
          <small>Back to atlas</small>
        </button>
        <div class="story-nav__links">
          <button type="button" data-scroll-target="research">Question</button>
          <button type="button" data-scroll-target="method">Method</button>
          <button type="button" data-scroll-target="results">Results</button>
          <button type="button" data-scroll-target="evidence">Explainability</button>
          <button type="button" data-scroll-target="team">Team</button>
        </div>
        <a class="story-nav__github" href="https://github.com/IvanYachUkr/NAUTILUS" target="_blank" rel="noopener noreferrer">
          <i class="ph ph-github-logo" aria-hidden="true"></i>
          <span>Source</span>
        </a>
      </nav>

      <main class="story-main">
        <section class="story-section story-intro" id="research" data-site-section-id="research">
          <div class="story-section__eyebrow"><span>01</span> The research question</div>
          <div class="story-intro__grid">
            <div>
              <p class="story-overline">Evaluating explainability and agentic exploration in MLLM image geolocation</p>
              <h2>A correct pin is<br /><em>not enough.</em></h2>
            </div>
            <div class="story-intro__copy">
              <p>NAUTILUS tests whether vision-capable models can geolocate European street scenes and show evidence that a person can actually verify.</p>
              <p>We compare the model's stated clues with its final pin, so a confident explanation can be checked against what was visible.</p>
              <button class="story-cta story-cta--primary" type="button" data-scroll-target="explorer">
                <i class="ph-fill ph-globe-hemisphere-west" aria-hidden="true"></i>
                Explore the atlas
              </button>
            </div>
          </div>

          <div class="scene-triptych" aria-label="Representative benchmark scenes">
            <figure class="scene-frame scene-frame--wide">
              ${sceneImageMarkup(snapshot, "europe-easy--loc-001", "Paris street scene at Place de la Bastille")}
              <figcaption><span>Easy · Landmark evidence</span><strong>Paris, France</strong></figcaption>
              <button class="scene-frame__open" type="button" data-case-id="europe-easy--loc-001" data-case-model="Gemini 3.7 Flash · high, aided" data-case-condition="interactive-panorama" aria-label="Explore the reviewed July Column clue in Paris"><i class="ph ph-arrow-up-right" aria-hidden="true"></i></button>
            </figure>
            <figure class="scene-frame">
              ${sceneImageMarkup(snapshot, "europe-medium--loc-009", "Residential street scene in Valencia")}
              <figcaption><span>Medium · Street-name evidence</span><strong>Valencia, Spain</strong></figcaption>
              <button class="scene-frame__open" type="button" data-case-id="europe-medium--loc-009" data-case-model="Gemini 3.7 Flash · high, aided" data-case-condition="interactive-panorama" aria-label="Explore the reviewed Carrer de Císcar clue in Valencia"><i class="ph ph-arrow-up-right" aria-hidden="true"></i></button>
            </figure>
            <figure class="scene-frame">
              ${sceneImageMarkup(snapshot, "europe-hard--loc-018", "Rural road scene in Greece")}
              <figcaption><span>Hard · Script evidence</span><strong>Peloponnese, Greece</strong></figcaption>
              <button class="scene-frame__open" type="button" data-case-id="europe-hard--loc-018" data-case-model="Gemini 3.7 Flash · high, aided" data-case-condition="interactive-panorama" aria-label="Explore the reviewed Greek road-label clue in Peloponnese"><i class="ph ph-arrow-up-right" aria-hidden="true"></i></button>
            </figure>
          </div>
        </section>

        <section class="story-section method-section" id="method" data-site-section-id="method">
          <div class="story-section__eyebrow"><span>02</span> Method</div>
          <div class="story-heading-row">
            <h2>From first glance<br /><em>to final pin.</em></h2>
            <p>Every run uses the same four-stage protocol, from the fixed starting scene to one final map prediction.</p>
          </div>

          <figure class="method-scene" aria-hidden="true">
            ${sceneImageMarkup(snapshot, "europe-medium--loc-013")}
          </figure>

          <ol class="method-steps">
            <li data-method-stage-id="observe" tabindex="-1">
              <i class="ph ph-eye" aria-hidden="true"></i>
              <span>01</span>
              <h3>Observe</h3>
              <p>Inspect the fixed starting scene and report visible geographic cues.</p>
            </li>
            <li data-method-stage-id="hypothesize" tabindex="-1">
              <i class="ph ph-lightbulb" aria-hidden="true"></i>
              <span>02</span>
              <h3>Hypothesize</h3>
              <p>State an initial country, region, or city belief before using the map.</p>
            </li>
            <li data-method-stage-id="explore" tabindex="-1">
              <i class="ph ph-path" aria-hidden="true"></i>
              <span>03</span>
              <h3>Explore</h3>
              <p>Move through the panorama, test the hypothesis, and collect more evidence.</p>
            </li>
            <li data-method-stage-id="pin" tabindex="-1">
              <i class="ph ph-map-pin-line" aria-hidden="true"></i>
              <span>04</span>
              <h3>Pin</h3>
              <p>Commit one final map prediction and compare it with ground truth.</p>
            </li>
          </ol>

          <div class="conditions-grid">
            <article class="condition-panel">
              <div class="condition-panel__number">A</div>
              <div>
                <span>Control condition</span>
                <h3>Static image</h3>
                <p>One canonical starting frame. No movement, panning, or zooming inside the street scene.</p>
              </div>
              <i class="ph ph-image" aria-hidden="true"></i>
            </article>
            <article class="condition-panel condition-panel--active">
              <div class="condition-panel__number">B</div>
              <div>
                <span>Agentic condition</span>
                <h3>Interactive panorama</h3>
                <p>The model may move, pan, and zoom before placing its pin; the full route is recorded for replay.</p>
              </div>
              <i class="ph ph-arrows-out-cardinal" aria-hidden="true"></i>
            </article>
          </div>

          <div class="protocol-grid">
            <div>
              <span class="protocol-label protocol-label--allow">Allowed</span>
              <p>Ordinary map labels, visual road comparison, panning, zooming, and a controlled interaction budget.</p>
            </div>
            <div>
              <span class="protocol-label protocol-label--block">Disabled</span>
              <p>Map search, automatic geocoding, reverse-image search, metadata access, and dedicated geolocation APIs.</p>
            </div>
          </div>
        </section>

        <section class="story-section results-section" id="results" data-site-section-id="results">
          <div class="story-section__eyebrow"><span>03</span> Recorded benchmark</div>
          <div class="story-heading-row">
            <h2>${formatInteger(snapshot.locationCount)} European scenes.<br />Three difficulty bands.</h2>
            <p>Interactive OpenGuessr results on the same fixed locations. Repeated conditions are ranked by mean points; percentages show the share of the maximum score. Controller conditions and continuation composites are labelled.</p>
          </div>

          <figure class="results-scene" aria-hidden="true">
            ${sceneImageMarkup(snapshot, "europe-easy--loc-004")}
          </figure>

          <div class="benchmark-facts" aria-label="Benchmark composition">
            <div aria-label="${formatInteger(snapshot.locationCount)} locations"><strong>${formatInteger(snapshot.locationCount)}</strong><span>locations</span></div>
            <div aria-label="${formatInteger(counts.easy)} easy locations"><strong>${formatInteger(counts.easy)}</strong><span>easy</span></div>
            <div aria-label="${formatInteger(counts.medium)} medium locations"><strong>${formatInteger(counts.medium)}</strong><span>medium</span></div>
            <div aria-label="${formatInteger(counts.hard)} hard locations"><strong>${formatInteger(counts.hard)}</strong><span>hard</span></div>
            <div aria-label="2 evaluation conditions"><strong>2</strong><span>conditions</span></div>
          </div>

          <div class="leaderboard" aria-label="Recorded benchmark leaderboard">
            <header>
              <span>Rank / model</span>
              <span>Mean points</span>
              <span>Share of 125,000</span>
            </header>
            ${leaderboard.map(leaderboardRowMarkup).join("")}
          </div>
          <p class="results-note"><i class="ph ph-info" aria-hidden="true"></i> Fixed set: 8 easy, 9 medium, and 8 hard scenes; rankings use repeat means, while Grok MCP combines difficulty-level means.</p>
        </section>

        <section class="story-section evidence-section" id="evidence" data-site-section-id="evidence">
          <div class="story-section__eyebrow"><span>04</span> Explainability</div>
          <div class="evidence-grid">
            <div class="evidence-copy">
              <h2>Can the clue survive <em>inspection?</em></h2>
              <p>A polished explanation can still be wrong. Human review treats each reported clue as evidence to test, not prose to admire.</p>
              <p class="evidence-audit"><strong>${formatInteger(evidenceCounts.reviewed)}</strong> image regions verified · <strong>${formatInteger(evidenceCounts.textOnly)}</strong> text-only clues retained</p>
              <div class="cue-rubric" aria-label="Cue review rubric">
                <span><i class="ph ph-eye" aria-hidden="true"></i> Visible</span>
                <span><i class="ph ph-check-circle" aria-hidden="true"></i> Correct</span>
                <span><i class="ph ph-compass" aria-hidden="true"></i> Useful</span>
                <span><i class="ph ph-link" aria-hidden="true"></i> Consistent</span>
              </div>
            </div>

            <article class="evidence-example">
              <div class="evidence-example__image">
                ${sceneImageMarkup(snapshot, "europe-easy--loc-001", "The reviewed July Column clue in the Paris source scene")}
              </div>
              <div class="evidence-example__body">
                <span>Reviewed evidence trace · Easy · Paris</span>
                <h3>The gilded figure crowns the July Column.</h3>
                <p>The statue-topped column is visibly centered in the frame. It is a distinctive landmark that supports Place de la Bastille in Paris.</p>
                <div class="evidence-verdicts">
                  <b><i class="ph-fill ph-check-circle" aria-hidden="true"></i> Visible</b>
                  <b><i class="ph-fill ph-check-circle" aria-hidden="true"></i> Correct</b>
                  <b><i class="ph-fill ph-check-circle" aria-hidden="true"></i> Useful</b>
                  <b><i class="ph-fill ph-check-circle" aria-hidden="true"></i> Consistent</b>
                </div>
                <button class="evidence-example__open" type="button" data-case-id="europe-easy--loc-001" data-case-model="Gemini 3.7 Flash · high, aided" data-case-condition="interactive-panorama" data-open-evidence="true">
                  Inspect the reviewed clue <i class="ph ph-arrow-up-right" aria-hidden="true"></i>
                </button>
              </div>
            </article>
          </div>
        </section>

        <section class="story-section team-section" id="team" data-site-section-id="team">
          <div class="story-section__eyebrow"><span>05</span> The team</div>
          <figure class="team-scene" aria-hidden="true">
            ${sceneImageMarkup(snapshot, "europe-hard--loc-022")}
          </figure>
          <div class="team-layout">
            <div>
              <p class="story-overline">Multimodal AI systems · street-level geospatial analysis</p>
              <h2>Built to make model reasoning inspectable.</h2>
            </div>
            <div class="team-list" aria-label="Project team">
              <div><span>01</span><strong>Ivan Iachnyk</strong></div>
              <div><span>02</span><strong>Clemens Roßkopf</strong></div>
              <div><span>03</span><strong>Claudius Kühn</strong></div>
            </div>
          </div>

          <div class="closing-panel">
            <div>
              <span>Open the evidence</span>
              <h3>Every guess has a story.<br /><em>Go find one.</em></h3>
            </div>
            <div class="closing-panel__actions">
              <button class="story-cta story-cta--light" type="button" data-scroll-target="explorer">
                <i class="ph-fill ph-globe-hemisphere-west" aria-hidden="true"></i>
                Enter the explorer
              </button>
              <a class="story-cta story-cta--ghost" href="https://github.com/IvanYachUkr/NAUTILUS" target="_blank" rel="noopener noreferrer">
                <i class="ph ph-github-logo" aria-hidden="true"></i>
                View on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer class="site-footer">
        <strong>NAUTILUS</strong>
        <span>Explainable · agentic image geolocation</span>
        <span>Computer Vision Project · 2026</span>
      </footer>
    </div>
  `;
}

function sceneImageMarkup(snapshot, caseId, alt = "") {
  const imageUrl = snapshot.sceneImages?.[caseId];
  if (!imageUrl) return "";
  return `<img src="${escapeMarkup(imageUrl)}" alt="${escapeMarkup(alt)}" loading="lazy" />`;
}

function leaderboardRowMarkup(entry) {
  const model = escapeMarkup(entry.model);
  const reasoning = escapeMarkup(entry.reasoning);
  const points = Number(entry.points) || 0;
  const maxPoints = Number(entry.maxPoints) || 0;

  return `
    <article class="leaderboard-row">
      <div class="leaderboard-row__model">
        <span>${String(entry.rank).padStart(2, "0")}</span>
        <div><strong>${model}</strong><small>${reasoning} reasoning · ${escapeMarkup(entry.sample ?? "1 run")}</small></div>
      </div>
      <strong class="leaderboard-row__score">${formatInteger(points)}</strong>
      <div class="leaderboard-row__progress">
        <progress value="${points}" max="${maxPoints}" aria-label="${model} score: ${formatInteger(points)} of ${formatInteger(maxPoints)}"></progress>
        <span>${Number(entry.scorePercent).toFixed(1)}%</span>
      </div>
    </article>
  `;
}

function formatInteger(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function escapeMarkup(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function roundToOne(value) {
  return Math.round(value * 10) / 10;
}
