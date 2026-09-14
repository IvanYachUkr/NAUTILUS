export type Difficulty = "easy" | "medium" | "hard";
export type RunCondition = "static-image" | "static-image-covered" | "interactive-panorama";
export type CueSource = "starting-image" | "panorama" | "map";

export interface Coordinate {
  lat: number;
  lng: number;
  label?: string;
}

export interface StreetViewReference {
  viewpoint: Coordinate;
  panoId?: string;
  heading?: number;
  pitch?: number;
  fov?: number;
  label?: string;
}

export interface ExplorationPoint extends Coordinate {
  seq?: number;
  roundIndex?: number;
  tMs?: number;
  capturedAt?: string;
  heading?: number;
  pitch?: number;
  zoom?: number;
  fov?: number;
  panoId?: string;
  source?: string;
  reason?: string;
  label?: string;
}

export interface ExplorationKeyMoment {
  id?: string;
  label: string;
  description?: string;
  tMs: number;
  sampleIndex?: number;
  source?: string;
  category?: string;
  confidence?: number;
  evidence?: Record<string, unknown>;
}

export interface NormalizedExploration {
  source: string;
  path: ExplorationPoint[];
  samples: ExplorationPoint[];
  keyMoments: ExplorationKeyMoment[];
  startedAt?: string | null;
  stoppedAt?: string | null;
  durationMs?: number | null;
  sampleCount: number;
  pointCount: number;
  captureSources?: Record<string, number>;
  recorder?: { name?: string; version?: string };
}

export interface OpenGuessrRecorderExport {
  schemaVersion?: string;
  recorder?: { name?: string; version?: string };
  startedAt?: string;
  stoppedAt?: string;
  durationMs?: number;
  samples: ExplorationPoint[];
  keyMoments?: ExplorationKeyMoment[];
  captureSources?: Record<string, number>;
  [key: string]: unknown;
}

export interface CueRatings {
  visible?: boolean | null;
  correct?: boolean | null;
  useful?: boolean | null;
  consistent?: boolean | null;
}

export interface EvidenceCue {
  id?: string;
  text: string;
  source: CueSource;
  ratings?: CueRatings;
  evidenceView?: StreetViewReference;
}

export type VisualClueCategory = "signage" | "landmark" | "architecture" | "infrastructure" | "vegetation" | "geography" | "linguistic";
export type VisualClueStatus = "pending-grounding" | "needs-review" | "reviewed" | "text-only" | "not-grounded" | "excluded";

export interface ModelVisualClue {
  id: string;
  label: string;
  text: string;
  description: string;
  source: CueSource;
  category: VisualClueCategory;
  annotationStatus: VisualClueStatus;
  region?: { x: number; y: number; w: number; h: number } | null;
  regionSource?: string | null;
  sourceRuns?: string[];
  ratings?: CueRatings;
  provenance?: Array<{ runId: string; text: string }>;
}

export interface ModelClueSet {
  id: string;
  benchmarkId: string;
  model: string;
  reasoning?: string;
  sourceRuns: Array<{ runId: string; report?: string }>;
  cues: ModelVisualClue[];
}

export interface GeolocationRun {
  id: string;
  model: string;
  condition: RunCondition;
  prediction: Coordinate | null;
  runStatus?: "complete" | "recording-only";
  hypothesis: string;
  confidence?: number | null;
  durationSeconds?: number | null;
  accuracy?: {
    country?: boolean | null;
    region?: boolean | null;
  };
  cues: EvidenceCue[];
  notes?: string;
  isMock?: boolean;
  exploration?: OpenGuessrRecorderExport | NormalizedExploration | ExplorationPoint[] | null;
}

export interface GeolocationCase {
  id: string;
  title: string;
  landmark?: string;
  city: string;
  region?: string;
  country: string;
  countryCode?: string;
  difficulty: Difficulty;
  sceneType?: string;
  summary: string;
  tags?: string[];
  groundTruth: Coordinate;
  startingView: StreetViewReference;
  startingImage?: { path: string; [key: string]: unknown } | null;
  clueSets?: ModelClueSet[];
  runs: GeolocationRun[];
}

export interface ExplorerSelection {
  caseId?: string | null;
  runId?: string;
  model?: string;
  condition?: RunCondition;
}

export interface ExplorerState {
  caseId: string | null;
  runId: string | null;
  model: string | null;
  condition: RunCondition | null;
  query: string;
  filters: { country: string; difficulty: string; sceneType: string };
  caseCount: number;
  visibleCaseCount: number;
  errorKm: number | null;
  drawer?: string | null;
  playbackIndex?: number | null;
}

export interface ExplorerApi {
  setCases(cases: GeolocationCase[]): ExplorerApi;
  upsertCase(caseItem: GeolocationCase): ExplorerApi;
  selectCase(caseId: string | null | "all"): ExplorerApi;
  selectRun(runId: string): ExplorerApi;
  select(selection: ExplorerSelection): ExplorerApi;
  attachExploration(args: {
    caseId?: string;
    runId?: string;
    recorder: OpenGuessrRecorderExport | NormalizedExploration | ExplorationPoint[];
  }): ExplorerApi;
  getState(): ExplorerState;
  getCases(): GeolocationCase[];
  destroy(): void;
}

export function createExplorer(options: {
  root: HTMLElement | string;
  cases: GeolocationCase[];
  initialCaseId?: string;
  initialRunId?: string;
  mapOptions?: {
    tileUrl?: string;
    leafletTimeoutMs?: number;
    disableLeaflet?: boolean;
  };
  syncHash?: boolean;
}): ExplorerApi;

export function loadCasesFromUrl(
  url: string,
  options?: { signal?: AbortSignal; fetchImpl?: typeof fetch },
): Promise<GeolocationCase[]>;

export function validateCases(cases: unknown): string[];
export function buildStreetViewUrl(view: StreetViewReference): string;
export function haversineKm(a: Coordinate, b: Coordinate): number;
export function extractMovementPath(input: OpenGuessrRecorderExport | ExplorationPoint[]): ExplorationPoint[];
export function extractTimelineSamples(input: OpenGuessrRecorderExport | ExplorationPoint[]): ExplorationPoint[];
export function normalizeExploration(input: OpenGuessrRecorderExport | ExplorationPoint[]): NormalizedExploration | null;
export function nearestSampleIndex(samples: ExplorationPoint[], targetMs: number): number;
export function sampleToStreetView(sample: ExplorationPoint): StreetViewReference | null;
export function explorationDistanceKm(input: NormalizedExploration): number;
