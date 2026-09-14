import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ROOT } from "./lib/workspace.mjs";
import { parseGoogleMapsStreetViewUrl } from "../shared/google-maps-url.js";

const competitionDir = join(ROOT, "data", "competitions");
const files = ["europe-easy.json", "europe-medium.json", "europe-hard.json"];
let changed = 0;

for (const filename of files) {
  const path = join(competitionDir, filename);
  const doc = JSON.parse(await readFile(path, "utf8"));
  for (const location of doc.locations ?? []) {
    if (!location?.google_maps_link) continue;
    const before = location.google_maps_link;
    const after = normalizeZeroPitch(before);
    const parsed = parseGoogleMapsStreetViewUrl(after);
    if (parsed.pitch !== 0) {
      throw new Error(`${filename} ${location.id}: zero-pitch normalization produced pitch ${parsed.pitch}`);
    }
    if (after !== before) {
      location.google_maps_link = after;
      changed += 1;
    }
  }
  await writeFile(path, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
}

console.log(`Normalized ${changed} location URL(s) to zero starting pitch.`);

export function normalizeZeroPitch(input) {
  let output = String(input);

  // Google Maps desktop Street View URLs encode level camera pitch as 90t.
  output = output.replace(
    /(,-?\d+(?:\.\d+)?h,)-?\d+(?:\.\d+)?t(?=\/|,)/i,
    "$190t",
  );

  // Keep the thumbnail metadata consistent with the top-level camera state.
  output = output.replace(/%26pitch%3D-?\d+(?:\.\d+)?/gi, "%26pitch%3D0");
  output = output.replace(/([?&]pitch=)-?\d+(?:\.\d+)?/gi, "$10");
  output = output.replace(/-pi-?\d+(?:\.\d+)?-ya/gi, "-pi0-ya");

  return output;
}
