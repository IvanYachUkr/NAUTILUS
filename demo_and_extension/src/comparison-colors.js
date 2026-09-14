const MODEL_COLORS = [
  ["glm-5.3-flash + mcp · max", "#ff8a30"],
  ["gemini 3.7 flash · high, aided", "#a3e635"],
  ["gemini 3.7 flash · medium, aided", "#38bdf8"],
  ["gemini 3.8 flash · high, aided", "#c084fc"],
  ["gemini 3.8 flash · medium, aided", "#facc15"],
  ["gpt-5.6 sol · xhigh", "#f472b6"],
  ["gpt-5.6 sol · max", "#fb7185"],
  ["grok 4.6 · xhigh", "#60a5fa"],
  ["gemini 3.7 flash · high, unaided", "#2dd4bf"],
];

const FALLBACK_COLORS = [
  "#ff8a30",
  "#a3e635",
  "#38bdf8",
  "#c084fc",
  "#facc15",
  "#f472b6",
  "#fb7185",
  "#60a5fa",
  "#2dd4bf",
  "#fb923c",
  "#818cf8",
  "#34d399",
];

export function comparisonColor(model) {
  const normalized = String(model).trim().toLowerCase();
  const known = MODEL_COLORS.find(([label]) => label === normalized);
  if (known) return known[1];

  let hash = 2166136261;
  for (const character of normalized) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return FALLBACK_COLORS[(hash >>> 0) % FALLBACK_COLORS.length];
}
