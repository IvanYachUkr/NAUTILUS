import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
export const DATA_DIR = join(ROOT, "data");
export const COMPETITIONS_DIR = join(DATA_DIR, "competitions");
export const RESULTS_DIR = join(DATA_DIR, "results");
export const CLUES_DIR = join(DATA_DIR, "clues");
export const RECORDED_AGENT_BENCHMARK_DIR = join(
  DATA_DIR,
  "recorded-agent-benchmark",
);
export const RECORDINGS_DIR = join(DATA_DIR, "recordings");
export const STARTING_IMAGES_DIR = join(DATA_DIR, "starting-images");
export const RECORDINGS_INBOX_DIR = join(RECORDINGS_DIR, "inbox");
export const RECORDINGS_SESSIONS_DIR = join(RECORDINGS_DIR, "sessions");
export const RECORDINGS_CHECKPOINTS_DIR = join(RECORDINGS_DIR, "checkpoints");
export const GENERATED_DIR = join(DATA_DIR, "generated");
export const GENERATED_COMPETITIONS_DIR = join(
  GENERATED_DIR,
  "competition-links",
);

export async function readJson(path) {
  const text = await readFile(path, "utf8");
  try {
    return JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new SyntaxError(`${relative(ROOT, path)}: ${message}`);
  }
}

export async function listJsonFiles(directory, { recursive = false } = {}) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory() && recursive) {
        files.push(...(await listJsonFiles(path, { recursive: true })));
      } else if (entry.isFile() && extname(entry.name).toLowerCase() === ".json") {
        files.push(path);
      }
    }

    return files.sort((a, b) => a.localeCompare(b));
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

export async function ensureWorkspaceDirectories() {
  await Promise.all(
    [
      COMPETITIONS_DIR,
      RESULTS_DIR,
      CLUES_DIR,
      RECORDINGS_INBOX_DIR,
      RECORDINGS_SESSIONS_DIR,
      RECORDINGS_CHECKPOINTS_DIR,
      STARTING_IMAGES_DIR,
      GENERATED_DIR,
      GENERATED_COMPETITIONS_DIR,
    ].map((path) => mkdir(path, { recursive: true })),
  );
}

export async function resetGeneratedDirectory() {
  await rm(GENERATED_DIR, { recursive: true, force: true });
  await mkdir(GENERATED_COMPETITIONS_DIR, { recursive: true });
}

export async function writeJsonAtomic(path, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  await writeTextAtomic(path, text);
}

export async function writeTextAtomic(path, text) {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporaryPath, text, "utf8");
  await rename(temporaryPath, path);
}

export async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

export function safeSlug(input, fallback = "unknown") {
  const value = String(input ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return value || fallback;
}

export function assertInsideRoot(path) {
  const normalizedRoot = `${ROOT}${sep}`;
  const normalizedPath = `${resolve(path)}${sep}`;
  if (!normalizedPath.startsWith(normalizedRoot)) {
    throw new Error(`Path escapes repository root: ${path}`);
  }
}
