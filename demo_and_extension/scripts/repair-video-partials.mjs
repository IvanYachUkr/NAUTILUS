import { existsSync } from "node:fs";
import { readdir, readFile, rm } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const videoRoot = join(root, "data", "exploration-videos");
const apply = process.argv.includes("--apply");

const finalizedByCaptureId = new Map();
const partials = [];

if (!existsSync(videoRoot)) {
  console.log("No data/exploration-videos directory exists.");
  process.exit(0);
}

await walk(videoRoot, async (path, name, inPartial) => {
  if (inPartial) return;
  if (!name.endsWith(".json")) return;
  try {
    const metadata = JSON.parse(await readFile(path, "utf8"));
    const captureId = String(metadata.captureId ?? "").trim();
    const videoPath = String(metadata.path ?? "").trim();
    if (!captureId || !videoPath) return;
    const absoluteVideoPath = join(root, videoPath.replaceAll("/", "/"));
    if (!existsSync(absoluteVideoPath)) return;
    finalizedByCaptureId.set(captureId, { metadataPath: path, videoPath: absoluteVideoPath });
  } catch {
    // Non-video JSON files are ignored.
  }
});

for (const competitionEntry of await readdir(videoRoot, { withFileTypes: true })) {
  if (!competitionEntry.isDirectory()) continue;
  const partialRoot = join(videoRoot, competitionEntry.name, ".partial");
  if (!existsSync(partialRoot)) continue;
  for (const entry of await readdir(partialRoot, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".webm.partial")) {
      partials.push({
        type: "legacy-file",
        captureId: entry.name.slice(0, -".webm.partial".length),
        path: join(partialRoot, entry.name),
      });
      continue;
    }
    if (entry.isDirectory()) {
      const captureMetadataPath = join(partialRoot, entry.name, "capture.json");
      let captureId = entry.name;
      if (existsSync(captureMetadataPath)) {
        try {
          const metadata = JSON.parse(await readFile(captureMetadataPath, "utf8"));
          captureId = String(metadata.captureId ?? captureId);
        } catch {
          // Keep directory name as fallback capture id.
        }
      }
      partials.push({ type: "chunk-directory", captureId, path: join(partialRoot, entry.name) });
    }
  }
}

if (!partials.length) {
  console.log("No exploration-video partials found.");
  process.exit(0);
}

let safeCount = 0;
let unmatchedCount = 0;
for (const partial of partials) {
  const finalized = finalizedByCaptureId.get(partial.captureId);
  if (finalized) {
    safeCount += 1;
    console.log(
      `[safe duplicate] ${relative(root, partial.path)} -> ${relative(root, finalized.videoPath)}`,
    );
    if (apply) await rm(partial.path, { recursive: true, force: true });
  } else {
    unmatchedCount += 1;
    console.log(`[unmatched] ${relative(root, partial.path)} (captureId=${partial.captureId})`);
  }
}

console.log("");
console.log(`Safe duplicates: ${safeCount}`);
console.log(`Unmatched partials: ${unmatchedCount}`);
if (!apply && safeCount) {
  console.log("Dry run only. Re-run with --apply to remove the safe duplicates.");
}
if (unmatchedCount) {
  console.log("Unmatched partials were NOT removed; keep them until their round is verified.");
}

async function walk(directory, visitor, inPartial = false) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    const nextInPartial = inPartial || entry.name === ".partial";
    if (entry.isDirectory()) {
      await walk(path, visitor, nextInPartial);
    } else if (entry.isFile()) {
      await visitor(path, entry.name, nextInPartial);
    }
  }
}
