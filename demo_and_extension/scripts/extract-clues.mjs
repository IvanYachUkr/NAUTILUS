import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadClueDocuments, saveClueDocument } from "./lib/clues.mjs";
import { ROOT, safeSlug } from "./lib/workspace.mjs";

const PRESETS = {
  "gemini-3.7-flash-high-aided": {
    id: "gemini-3.7-flash-high-aided",
    benchmarkId: "gemini-3-7-flash-high-aided",
    model: "Gemini 3.7 Flash",
    reasoning: "high, aided",
    reports: [
      { runId: "r2", path: "data/recorded-agent-benchmark/gemini-3.7-flash-high-aided/runs/run-2/report.md" },
      { runId: "r3", path: "data/recorded-agent-benchmark/gemini-3.7-flash-high-aided/runs/run-3/report.md" },
      { runId: "r1", path: "data/recorded-agent-benchmark/gemini-3.7-flash-high-aided/runs/run-1/report.md" },
    ],
  },
  "gemini-3.7-flash-medium-aided": {
    id: "gemini-3.7-flash-medium-aided",
    benchmarkId: "gemini-3-7-flash-medium-aided",
    model: "Gemini 3.7 Flash",
    reasoning: "medium, aided",
    reports: [
      { runId: "r1", path: "data/recorded-agent-benchmark/gemini-3.7-flash-medium-aided/runs/run-1/report.md" },
      { runId: "r2", path: "data/recorded-agent-benchmark/gemini-3.7-flash-medium-aided/runs/run-2/report.md" },
      { runId: "r3", path: "data/recorded-agent-benchmark/gemini-3.7-flash-medium-aided/runs/run-3/report.md" },
    ],
  },
  "gemini-3.8-flash-high-aided": {
    id: "gemini-3.8-flash-high-aided",
    benchmarkId: "gemini-3-8-flash-high-aided",
    model: "Gemini 3.8 Flash",
    reasoning: "high, aided",
    reports: [
      { runId: "r1", path: "data/recorded-agent-benchmark/gemini-3.8-flash-high-aided/runs/run-1/report.md" },
      { runId: "r2", path: "data/recorded-agent-benchmark/gemini-3.8-flash-high-aided/runs/run-2/report.md" },
      { runId: "r3", path: "data/recorded-agent-benchmark/gemini-3.8-flash-high-aided/runs/run-3/report.md" },
    ],
  },
  "gemini-3.8-flash-medium-aided": {
    id: "gemini-3.8-flash-medium-aided",
    benchmarkId: "gemini-3-8-flash-medium-aided",
    model: "Gemini 3.8 Flash",
    reasoning: "medium, aided",
    reports: [
      { runId: "r1", path: "data/recorded-agent-benchmark/gemini-3.8-flash-medium-aided/runs/run-1/report.md" },
      { runId: "r2", path: "data/recorded-agent-benchmark/gemini-3.8-flash-medium-aided/runs/run-2/report.md" },
      { runId: "r3", path: "data/recorded-agent-benchmark/gemini-3.8-flash-medium-aided/runs/run-3/report.md" },
    ],
  },
  "gpt-5-6-sol-xhigh": {
    id: "gpt-5-6-sol-xhigh",
    model: "GPT-5.6 Sol",
    reasoning: "xhigh",
    reports: [
      { runId: "r1", path: "data/recorded-agent-benchmark/gpt-5.6-sol-xhigh/runs/run-1/report.md" },
      { runId: "r2", path: "data/recorded-agent-benchmark/gpt-5.6-sol-xhigh/runs/run-2/report.md" },
      { runId: "r3", path: "data/recorded-agent-benchmark/gpt-5.6-sol-xhigh/runs/run-3/report.md" },
    ],
  },
  "gpt-5-6-sol-max": {
    id: "gpt-5-6-sol-max",
    model: "GPT-5.6 Sol",
    reasoning: "max",
    reports: [
      { runId: "r1", path: "data/recorded-agent-benchmark/gpt-5.6-sol-max/runs/run-1/report.md" },
      { runId: "r2", path: "data/recorded-agent-benchmark/gpt-5.6-sol-max/runs/run-2/report.md" },
      { runId: "r3", path: "data/recorded-agent-benchmark/gpt-5.6-sol-max/runs/run-3/report.md" },
    ],
  },
  "gpt-6-astra-low": {
    id: "gpt-6-astra-low",
    model: "GPT-6 Astra",
    reasoning: "low",
    reports: [
      { runId: "r1", path: "data/recorded-agent-benchmark/gpt-6-astra-low/runs/run-1/report.md" },
      { runId: "r2", path: "data/recorded-agent-benchmark/gpt-6-astra-low/runs/run-2/report.md" },
      { runId: "r3", path: "data/recorded-agent-benchmark/gpt-6-astra-low/runs/run-3/report.md" },
    ],
  },
  "grok-4-6-xhigh": {
    id: "grok-4-6-xhigh",
    model: "Grok 4.6",
    reasoning: "xhigh",
    reports: [
      { runId: "r1", path: "data/recorded-agent-benchmark/grok-4.6-xhigh/runs/run-1/report.md" },
      { runId: "r2", path: "data/recorded-agent-benchmark/grok-4.6-xhigh/runs/run-2/report.md" },
      { runId: "r3", path: "data/recorded-agent-benchmark/grok-4.6-xhigh/runs/run-3/report.md" },
    ],
  },
  "glm-5-3-flash-max": {
    id: "glm-5-3-flash-max",
    model: "GLM-5.3-Flash + MCP",
    reasoning: "Max",
    reports: [
      {
        runId: "r1",
        path: "data/recorded-agent-benchmark/glm-5.3-flash-max/runs/run-1/conversation.json",
        format: "glm-conversation",
      },
      {
        runId: "r2",
        path: "data/recorded-agent-benchmark/glm-5.3-flash-max/runs/run-2/conversation.json",
        format: "glm-conversation",
      },
      {
        runId: "r3",
        path: "data/recorded-agent-benchmark/glm-5.3-flash-max/runs/run-3/conversation.json",
        format: "glm-conversation",
      },
    ],
  },
  "gemini-3-7-flash-high-unaided": {
    id: "gemini-3-7-flash-high-unaided",
    model: "Gemini 3.7 Flash",
    reasoning: "high, unaided",
    reports: [
      { runId: "r1", path: "data/recorded-agent-benchmark/gemini-3.7-flash-high/runs/run-1/report.md" },
    ],
  },
  "grok-4-6-xhigh-mcp": {
    id: "grok-4-6-xhigh-mcp",
    benchmarkId: "grok-4-6-xhigh-mcp",
    model: "Grok 4.6 + MCP",
    reasoning: "xhigh",
    mergeStrategy: "tier-best-composite",
    reports: [{
      runId: "tier-best-composite",
      path: "data/recorded-agent-benchmark/grok-4.6-xhigh/mcp-composite-best/clues.json",
      format: "curated-clues",
    }],
    sourceRuns: [
      {
        runId: "easy-r2",
        report: "data/recorded-agent-benchmark/grok-4.6-xhigh/runs/mcp-assisted-r2/transcript-easy.txt",
      },
      {
        runId: "medium-r2",
        report: "data/recorded-agent-benchmark/grok-4.6-xhigh/runs/mcp-one-shot-medium-r2/transcript.txt",
      },
      {
        runId: "hard-r1",
        report: "data/recorded-agent-benchmark/grok-4.6-xhigh/runs/mcp-one-shot-hard-r1/transcript.txt",
      },
    ],
  },
};

const COMPETITIONS = {
  easy: { id: "europe-easy", start: 1, count: 8 },
  medium: { id: "europe-medium", start: 9, count: 9 },
  hard: { id: "europe-hard", start: 18, count: 8 },
};

const STOP_TOKENS = new Set([
  "and", "the", "with", "from", "behind", "around", "across", "towards", "toward",
  "visible", "directly", "local", "regional", "historic", "modern", "prominent", "central",
  "architecture", "architectural", "infrastructure", "landscape", "geography", "orientation",
  "feature", "features", "viewpoint", "surrounding", "backdrop", "foreground", "signage",
  "street", "road", "public", "urban", "city", "area", "style", "building", "buildings",
  "paris", "berlin", "salzburg", "pula", "flam", "valencia", "bologna", "utrecht", "coimbra",
  "uppsala", "tartu", "galway", "greece", "romania", "bulgaria", "hungary", "latvia",
  "lithuania", "denmark", "finland", "norway", "slovenia", "croatia", "poland", "germany",
  "portugal", "spain", "sweden", "estonia", "slovakia", "belgium", "dutch", "regional",
  "france", "austria", "czechia", "italy", "netherlands", "hungary", "serbia", "latvian",
  "lithuanian", "danish", "finnish", "norwegian", "slovenian", "croatian", "polish",
  "greek", "romanian", "bulgarian", "evidence", "initial", "location", "country", "city",
]);

const args = parseArgs(process.argv.slice(2));
const preset = PRESETS[args.preset];
if (!preset) throw new Error(`Unknown clue extraction preset: ${args.preset}`);

const extracted = new Map();
for (const report of preset.reports) {
  const absolutePath = resolve(ROOT, report.path);
  const markdown = await readFile(absolutePath, "utf8");
  const reportItems = report.format === "glm-conversation"
    ? parseGlmConversation(JSON.parse(markdown), report.runId, report.path)
    : report.format === "curated-clues"
      ? parseCuratedClues(JSON.parse(markdown), report.path)
      : parseReport(markdown, report.runId, report.path);
  for (const item of reportItems) {
    if (!extracted.has(item.locationId)) extracted.set(item.locationId, []);
    extracted.get(item.locationId).push(item);
  }
}

const existing = new Map(
  (await loadClueDocuments()).map((document) => [document.locationId, document]),
);

let clueCount = 0;
for (const competition of Object.values(COMPETITIONS)) {
  for (let round = 1; round <= competition.count; round += 1) {
    const globalIndex = competition.start + round - 1;
    const locationId = `${competition.id}--loc-${String(globalIndex).padStart(3, "0")}`;
    const raw = extracted.get(locationId) ?? [];
    const current = existing.get(locationId) ?? {
      schemaVersion: "1.0",
      locationId,
      clueSets: [],
    };
    const previousSet = current.clueSets.find((item) => item.id === preset.id);
    const previousCues = new Map((previousSet?.cues ?? []).map((cue) => [cue.id, cue]));
    const cues = mergeClues(raw, locationId, preset.id).map((cue) => {
      const previous = previousCues.get(cue.id);
      if (!previous) return cue;
      return {
        ...cue,
        region: previous.region ?? cue.region,
        regionSource: previous.regionSource ?? cue.regionSource,
        annotationStatus: previous.annotationStatus ?? cue.annotationStatus,
        ratings: previous.ratings ?? cue.ratings,
        ...(previous.groundingLabel ? { groundingLabel: previous.groundingLabel } : {}),
      };
    });
    clueCount += cues.length;

    const clueSet = {
      id: preset.id,
      benchmarkId: preset.benchmarkId ?? preset.id,
      model: preset.model,
      reasoning: preset.reasoning,
      mergeStrategy: preset.mergeStrategy ?? "canonical-model-set",
      sourceRuns: preset.sourceRuns ?? preset.reports.map(({ runId, path }) => ({ runId, report: path })),
      cues,
    };
    const setIndex = current.clueSets.findIndex((item) => item.id === clueSet.id);
    if (setIndex === -1) current.clueSets.push(clueSet);
    else current.clueSets[setIndex] = clueSet;
    await saveClueDocument(current);
  }
}

console.log(`Extracted ${clueCount} cleaned clues for ${preset.model} (${preset.reasoning}) across ${extracted.size} locations.`);

function parseReport(markdown, runId, reportPath) {
  const lines = markdown.split(/\r?\n/);
  const items = [];
  let competition = null;
  let round = null;
  let roundFromHeading = false;
  let collectingList = false;

  for (const line of lines) {
    const directRound = line.match(/^#{2,4}\s+(?:Authoritative\s+)?(Easy|Medium|Hard)(?:\s+R|\s+)(\d+)(?:\/\d+)?\b/i)
      ?? line.match(/^#{2,4}\s+\d+\.\s+(Easy|Medium|Hard)\s+R(\d+)\b/i);
    if (directRound) {
      competition = COMPETITIONS[directRound[1].toLowerCase()] ?? null;
      round = Number.parseInt(directRound[2], 10);
      roundFromHeading = true;
      collectingList = false;
      continue;
    }
    const competitionMatch = line.match(/^#{2,3}\s+.*\b(?:Europe\s*[-:]?\s*)?(Easy|Medium|Hard)\b.*(?:Competition|Rounds?)/i)
      ?? line.match(/^#{2,3}\s+.*\bCompetition\b.*\b(Easy|Medium|Hard)\b/i)
      ?? line.match(/^#{2,3}\s+.*\bTier\b.*\b(Easy|Medium|Hard)\b/i)
      ?? line.match(/^#{2,3}\s+(Easy|Medium|Hard)\s*[-—]/i);
    if (competitionMatch) {
      competition = COMPETITIONS[competitionMatch[1].toLowerCase()] ?? null;
      round = null;
      roundFromHeading = false;
      collectingList = false;
      continue;
    }
    const astraRound = line.match(/^##\s+(Easy|Medium|Hard)\s+R(\d+)\b/i);
    if (astraRound) {
      competition = COMPETITIONS[astraRound[1].toLowerCase()] ?? null;
      round = Number.parseInt(astraRound[2], 10);
      roundFromHeading = true;
      collectingList = false;
      continue;
    }
    if (/^##\s+/.test(line)) {
      competition = null;
      round = null;
      roundFromHeading = false;
      collectingList = false;
      continue;
    }

    const roundMatch = line.match(/^###\s+Round\s+(\d+)/i);
    if (roundMatch && competition) {
      round = Number.parseInt(roundMatch[1], 10);
      roundFromHeading = true;
      collectingList = false;
      continue;
    }
    const compactRound = line.match(/^\s*(\d+)\.\s+\*\*[^*]+\*\*\s+(.+)$/);
    if (compactRound && competition && !roundFromHeading && !collectingList) {
      round = Number.parseInt(compactRound[1], 10);
      if (round > competition.count) continue;
      const compactText = compactRound[2];
      const initialClause = compactText.match(/\bInitial:\s*(.+?)(?=\b(?:Provisional|Final belief|Final|Actual|Result|Recorder)\b|$)/i);
      const cueSentence = initialClause?.[1] ?? compactText.split(/\b(?:Result|Initial belief|Final belief|Its first|The intended|The pin|Scene belief)\b/i)[0];
      for (const text of splitInlineClues(cueSentence)) {
        items.push(makeRawClue({ competition, round, runId, reportPath, text }));
      }
      continue;
    }

    const tableRound = line.match(/^\|\s*\*\*R(\d+)\*\*\s*\|\s*([^|]+)\|/i);
    if (tableRound && competition) {
      round = Number.parseInt(tableRound[1], 10);
      if (round <= competition.count) {
        for (const text of splitInlineClues(tableRound[2])) {
          items.push(makeRawClue({ competition, round, runId, reportPath, text }));
        }
      }
      continue;
    }

    if (!competition || !round || round > competition.count) continue;

    const numberedCueLine = line.match(/^\s*\d+\.\s+\*\*(?:Untouched (?:cues?|initial cues?)|(?:Visual|Visible) Cues?|Strongest Visual Cues?|Visible Clues Identified|Key Clues \(Visual Evidence\)):\*\*\s*(.+)$/i);
    if (numberedCueLine) {
      for (const text of splitInlineClues(numberedCueLine[1])) {
        items.push(makeRawClue({ competition, round, runId, reportPath, text }));
      }
      continue;
    }

    const inline = line.match(/^\s*-\s*\*\*(?:Visual|Visible) Clues?\*\*:\s*(.+)$/i);
    if (inline) {
      for (const text of splitInlineClues(inline[1])) {
        items.push(makeRawClue({ competition, round, runId, reportPath, text }));
      }
      continue;
    }

    if (/^\s*-\s*\*\*(?:(?:Untouched Initial )?(?:Visual|Visible) Cues?|Strongest Visual Cues?|Visible Clues Identified|Key Clues \(Visual Evidence\))(?:\*\*:|:\*\*)/i.test(line)) {
      collectingList = true;
      continue;
    }

    const proseFive = line.match(/^(?:Initial five cues|Hard R\d+ initial cues):\s*(.+)$/i);
    if (proseFive) {
      for (const text of splitInlineClues(proseFive[1])) {
        items.push(makeRawClue({ competition, round, runId, reportPath, text }));
      }
      continue;
    }

    const untouchedInline = line.match(/^\s*-\s*\*\*Untouched cues(?:\s*\/\s*initial belief)?(?:\*\*:|:\*\*)\s*(.+)$/i);
    if (untouchedInline) {
      for (const text of splitInlineClues(untouchedInline[1])) {
        items.push(makeRawClue({ competition, round, runId, reportPath, text }));
      }
      continue;
    }

    if (collectingList) {
      const numbered = line.match(/^\s*\d+\.\s+(.+)$/);
      if (numbered) {
        items.push(makeRawClue({ competition, round, runId, reportPath, text: numbered[1] }));
        continue;
      }
      if (items.length && (/^\s*-\s*\*\*/.test(line) || /^#{2,4}\s/.test(line) || /^---\s*$/.test(line))) {
        collectingList = false;
      }
    }
  }
  return items;
}

function parseGlmConversation(conversation, runId, reportPath) {
  const items = [];
  let lastCues = [];
  let globalIndex = 0;
  let previousPin = null;
  const messages = [...(conversation.messages ?? [])].sort((left, right) => left.sequence - right.sequence);

  for (const message of messages) {
    for (const part of [...(message.parts ?? [])].sort((left, right) => left.sequence - right.sequence)) {
      const data = part.data ?? {};
      if (typeof data.text === "string") {
        const matches = [...data.text.matchAll(/Five cues:\s*((?:\(1\)[^\n]+))/gi)];
        const text = matches.at(-1)?.[1];
        if (text) {
          lastCues = text
            .split(/\s*\(\d+\)\s*/)
            .map((value) => value.trim())
            .filter(Boolean)
            .slice(0, 5);
        }
      }

      const state = data.state;
      if (!String(state?.title ?? data.tool ?? "").endsWith("openguessr_submit_guess")) continue;
      try {
        const output = JSON.parse(state.output);
        const pin = output?.pin;
        if (!Number.isFinite(pin?.latitude) || !Number.isFinite(pin?.longitude)) continue;
        const pinKey = `${pin.latitude},${pin.longitude}`;
        if (pinKey === previousPin) continue;
        previousPin = pinKey;
        globalIndex += 1;
        const competition = globalIndex <= 8 ? COMPETITIONS.easy : globalIndex <= 17 ? COMPETITIONS.medium : COMPETITIONS.hard;
        const round = globalIndex - competition.start + 1;
        for (const text of lastCues) {
          items.push(makeRawClue({ competition, round, runId, reportPath, text }));
        }
      } catch {
        // Ignore presentation fragments that are not completed submit results.
      }
    }
  }
  return items;
}

function parseCuratedClues(document, fallbackReportPath) {
  if (document?.schemaVersion !== "1.0" || !Array.isArray(document?.locations)) {
    throw new Error(`${fallbackReportPath} must contain schemaVersion 1.0 and a locations array.`);
  }

  const items = [];
  const seenLocations = new Set();
  for (const location of document.locations) {
    const locationId = String(location?.locationId ?? "").trim();
    const runId = String(location?.sourceRun ?? "").trim();
    const report = String(location?.report ?? fallbackReportPath).trim();
    if (!/^europe-(?:easy|medium|hard)--loc-\d{3}$/.test(locationId)) {
      throw new Error(`${fallbackReportPath} contains invalid locationId "${locationId}".`);
    }
    if (seenLocations.has(locationId)) {
      throw new Error(`${fallbackReportPath} duplicates ${locationId}.`);
    }
    if (!runId || !Array.isArray(location?.clues) || location.clues.length === 0) {
      throw new Error(`${fallbackReportPath} ${locationId} requires sourceRun and at least one clue.`);
    }
    seenLocations.add(locationId);

    for (const clue of location.clues) {
      const label = cleanMarkdown(clue?.label);
      const description = cleanMarkdown(clue?.description);
      const rawText = cleanMarkdown(clue?.sourceText);
      if (!label || !description || !rawText) {
        throw new Error(`${fallbackReportPath} ${locationId} contains an incomplete curated clue.`);
      }
      items.push({
        locationId,
        runId,
        report,
        rawText,
        label,
        description: sentence(description),
        category: clue.category ?? categorize(`${label} ${description}`),
      });
    }
  }

  const missing = Object.values(COMPETITIONS).flatMap((competition) =>
    Array.from({ length: competition.count }, (_, index) => {
      const globalIndex = competition.start + index;
      return `${competition.id}--loc-${String(globalIndex).padStart(3, "0")}`;
    }),
  ).filter((locationId) => !seenLocations.has(locationId));
  if (missing.length) {
    throw new Error(`${fallbackReportPath} is missing curated clues for: ${missing.join(", ")}`);
  }
  return items;
}

function makeRawClue({ competition, round, runId, reportPath, text }) {
  const globalIndex = competition.start + round - 1;
  const locationId = `${competition.id}--loc-${String(globalIndex).padStart(3, "0")}`;
  const parsed = parseLabelAndDescription(text);
  return {
    locationId,
    runId,
    report: reportPath,
    rawText: cleanMarkdown(text),
    label: parsed.label,
    description: parsed.description,
    category: categorize(`${parsed.label} ${parsed.description}`),
  };
}

function mergeClues(items, locationId, modelId) {
  const groups = [];
  for (const item of items) {
    if (!isUsefulVisualClue(item)) continue;
    let group = groups.find((candidate) =>
      !candidate.some((member) => member.runId === item.runId) &&
      candidate.some((member) => cluesOverlap(member, item)),
    );
    if (!group) {
      group = [];
      groups.push(group);
    }
    group.push(item);
  }

  return groups.map((group, index) => {
    const preferred = [...group].sort((left, right) =>
      runPriority(right.runId) - runPriority(left.runId) ||
      labelQuality(right.label) - labelQuality(left.label) ||
      right.description.length - left.description.length,
    )[0];
    const description = [...group].sort((left, right) => right.description.length - left.description.length)[0].description;
    const sourceRuns = [...new Set(group.map((item) => item.runId))].sort();
    return {
      id: `cue-${safeSlug(locationId)}-${safeSlug(modelId)}-${stableDigest(`${preferred.label}-${description}-${index}`)}`,
      label: preferred.label,
      text: preferred.label,
      description,
      groundingPhrase: groundingPhrase(preferred.label, description),
      source: "panorama",
      category: mostCommon(group.map((item) => item.category)),
      region: null,
      regionSource: null,
      annotationStatus: shouldGround(preferred.label) ? "pending-grounding" : "text-only",
      ratings: { visible: null, correct: null, useful: null, consistent: null },
      sourceRuns,
      provenance: group.map(({ runId, report, rawText }) => ({ runId, report, text: rawText })),
    };
  }).sort((left, right) =>
    right.sourceRuns.length - left.sourceRuns.length ||
    labelQuality(right.label) - labelQuality(left.label) ||
    right.description.length - left.description.length,
  ).slice(0, 12);
}

function isUsefulVisualClue(item) {
  const label = cleanMarkdown(item?.label);
  const description = cleanMarkdown(item?.description);
  if (label.length < 4 || description.length < 4) return false;
  if (/^(?:the|a|an|and|initial evidence|visual clues?|visible clues?|geographical match)$/i.test(label)) return false;
  return tokenSet(`${label} ${description}`).size > 0;
}

function runPriority(runId) {
  return { r2: 3, r3: 2, r1: 1 }[runId] ?? 0;
}

function stableDigest(value) {
  return createHash("sha256").update(normalize(value)).digest("hex").slice(0, 10);
}

function shouldGround(label) {
  return !/^(?:orientation|regional (?:location|setting|signature|route)|geographic (?:match|environment)|urban (?:setting|district|geography)|topography|continental climate|atmospheric lighting|northern lighting|shield geology|vehicle characteristics|vehicle fleet|regional vehicle markers|road quality & finish)$/i.test(label.trim());
}

function cluesOverlap(left, right) {
  const labelA = tokenSet(left.label);
  const labelB = tokenSet(right.label);
  if (!labelA.size || !labelB.size) return normalize(left.label) === normalize(right.label);
  const labelIntersection = intersectionSize(labelA, labelB);
  const labelContainment = labelIntersection / Math.min(labelA.size, labelB.size);
  if (labelContainment >= 0.5 || labelIntersection >= 2) return true;

  const featureA = tokenSet(`${left.label} ${left.description}`);
  const featureB = tokenSet(`${right.label} ${right.description}`);
  const featureIntersection = intersectionSize(featureA, featureB);
  const featureContainment = featureIntersection / Math.min(featureA.size, featureB.size);
  const required = left.category === right.category ? 0.3 : 0.45;
  return featureIntersection >= 2 && featureContainment >= required;
}

function intersectionSize(left, right) {
  return [...left].filter((token) => right.has(token)).length;
}

function tokenSet(value) {
  return new Set(normalize(value).split(" ").filter((token) => token.length > 2 && !STOP_TOKENS.has(token)));
}

function normalize(value) {
  return cleanMarkdown(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(television|tv)\b/g, "tower")
    .replace(/\b(bicycle|bicycles|bike|bikes)\b/g, "cycle")
    .replace(/\b(fortress|fortifications|castle)\b/g, "fort")
    .replace(/\b(sign|signs)\b/g, "signage")
    .replace(/\b(railway|rail)\b/g, "train")
    .replace(/\b(pennant|flagpole)\b/g, "flag")
    .replace(/\b(amphitheatre|colosseum)\b/g, "arena")
    .replace(/\b(pavement|asphalt|surface)\b/g, "road")
    .replace(/\b(lettering|marking|markings|text|name|designation)\b/g, "label")
    .replace(/\b(flora|ecology|vegetation)\b/g, "plants")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseLabelAndDescription(value) {
  const clean = cleanMarkdown(value).replace(/[.;]+$/, "");
  const colon = clean.indexOf(":");
  if (colon > 1 && colon < 90) {
    return {
      label: clean.slice(0, colon).trim(),
      description: sentence(clean.slice(colon + 1).trim() || clean.slice(0, colon).trim()),
    };
  }
  const label = clean
    .replace(/\s+with\s+.+$/i, "")
    .replace(/\s+(?:rising|flowing|running|visible|painted|indicating|stating)\s+.+$/i, "")
    .slice(0, 88)
    .trim();
  return { label: label || clean.slice(0, 88), description: sentence(clean) };
}

function splitInlineClues(value) {
  const normalized = value.replace(/,\s+and\s+/i, ", ").replace(/\s+and\s+(?=[A-Z][^,]+$)/, ", ");
  const parts = [];
  let current = "";
  let depth = 0;
  for (const char of normalized) {
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);
    if ((char === "," || char === ";") && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = "";
    } else current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function cleanMarkdown(value) {
  return String(value ?? "")
    .replace(/[`*_\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sentence(value) {
  const clean = value.trim();
  if (!clean) return clean;
  return `${clean[0].toUpperCase()}${clean.slice(1)}${/[.!?]$/.test(clean) ? "" : "."}`;
}

function groundingPhrase(label, description) {
  const phrase = label.length >= 4 ? label : description;
  return phrase.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim().slice(0, 140);
}

function categorize(value) {
  const text = normalize(value);
  if (/\b(language|letter|word|name|phone|prefix|stencil|signage|label|inscri|script|catalan|polish|slovak|dutch)\b/.test(text)) return "signage";
  if (/\b(tower|fort|column|arena|amphitheatre|church|cathedral|statue|opera|monument|landmark|bridge)\b/.test(text)) return "landmark";
  if (/\b(tree|forest|pine|spruce|birch|alder|aspen|fern|grass|vegetation|flora|gorse|sunflower|wheat|corn|canola|crop)\b/.test(text)) return "vegetation";
  if (/\b(river|fjord|mountain|alps|hill|ravine|coast|water|horizon|plain|terrain|slope|valley|soil)\b/.test(text)) return "geography";
  if (/\b(facade|roof|house|villa|palazz|shutter|balcon|brick|stone|timber|stucco|baroque|gothic|renaissance|chimney|gable)\b/.test(text)) return "architecture";
  if (/\b(bus|train|track|path|lane|asphalt|bollard|plate|vehicle|roundabout|utility|pole|turbine|curb|traffic|lighting|lamp|bike|cycle|ferry|pier|harbor|harbour)\b/.test(text)) return "infrastructure";
  if (/\b(language|linguistic|dialect|bilingual)\b/.test(text)) return "linguistic";
  return "geography";
}

function labelQuality(label) {
  const words = label.split(/\s+/).length;
  return (label.includes("(") ? 2 : 0) + Math.min(words, 7) - Math.max(0, words - 9) * 2;
}

function mostCommon(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "geography";
}

function parseArgs(argv) {
  const result = { preset: "gemini-3.7-flash-high-aided" };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--preset") result.preset = argv[++index];
    else if (argv[index] === "--help") {
      console.log(`Usage: node ${relative(process.cwd(), fileURLToPath(import.meta.url))} [--preset gemini-3.7-flash-high-aided]`);
      process.exit(0);
    } else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return result;
}
