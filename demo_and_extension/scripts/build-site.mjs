import { createHash } from "node:crypto";
import {
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import "./prepare-globe-assets.mjs";
import { loadMapsEmbedKey, mapsConfigSource } from "./lib/maps-config.mjs";

const projectDir = fileURLToPath(new URL("..", import.meta.url));
const distDir = join(projectDir, "dist");
const clientDir = join(distDir, "client");
const serverDir = join(distDir, "server");
const RECORDING_REVIEW_ENABLED = false;

if (relative(projectDir, resolve(distDir)) !== "dist") {
  throw new Error(`Refusing to rebuild unexpected output directory: ${distDir}`);
}

await rm(distDir, { recursive: true, force: true });
await mkdir(clientDir, { recursive: true });
await mkdir(serverDir, { recursive: true });

const mapsConfig = mapsConfigSource(await loadMapsEmbedKey(projectDir));
const assetRevision = await contentRevision(join(projectDir, "src"), mapsConfig);
const assetRoot = `assets/${assetRevision}`;

await copyProjectPath("index.html");
await rewriteIndexAssetPaths(assetRoot);
if (RECORDING_REVIEW_ENABLED) {
  await copyProjectPath("frame-inspector.html");
}
await copyProjectPath("src", assetRoot);
await writeFile(join(clientDir, assetRoot, "maps-config.js"), mapsConfig, "utf8");
if (!RECORDING_REVIEW_ENABLED) {
  await rm(join(clientDir, assetRoot, "frame-inspector.js"), { force: true });
}
await copyProjectPath("data/generated/atlas-cases.json");

const atlas = JSON.parse(
  await readFile(join(projectDir, "data/generated/atlas-cases.json"), "utf8"),
);
const referencedAssets = collectReferencedAssets(atlas);

for (const assetPath of referencedAssets) {
  await copyProjectPath(assetPath);
}

await writeFile(
  join(serverDir, "index.js"),
  `const INDEX_PATH = "/index.html";

function hasFileExtension(pathname) {
  const finalSegment = pathname.split("/").pop() || "";
  return finalSegment.includes(".");
}

function withSiteHeaders(response, pathname) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (pathname === INDEX_PATH) {
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  } else if (pathname.startsWith("/assets/")) {
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function fetchAsset(request, env, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return env.ASSETS.fetch(new Request(url, request));
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }

    if (!env?.ASSETS?.fetch) {
      return new Response("Static asset binding unavailable", { status: 503 });
    }

    const url = new URL(request.url);
    const pathname = url.pathname.endsWith("/")
      ? url.pathname + "index.html"
      : url.pathname;
    let servedPath = pathname;
    let response = await fetchAsset(request, env, pathname);

    if (response.status === 404 && !hasFileExtension(pathname)) {
      servedPath = INDEX_PATH;
      response = await fetchAsset(request, env, INDEX_PATH);
    }

    return withSiteHeaders(response, servedPath);
  },
};
`,
  "utf8",
);

const totalFiles = 4 + referencedAssets.size;
console.log(`Built Sites output with ${totalFiles} source asset(s).`);

async function copyProjectPath(projectRelativePath, destinationRelativePath) {
  const normalized = projectRelativePath.replaceAll("\\", "/").replace(/^\.\//, "");
  const source = resolve(projectDir, normalized);
  const sourceRelative = relative(projectDir, source);

  if (sourceRelative.startsWith("..") || resolve(source) === resolve(projectDir)) {
    throw new Error(`Refusing to copy path outside the project: ${projectRelativePath}`);
  }

  const sourceStats = await stat(source);

  const destination = join(
    clientDir,
    destinationRelativePath ?? sourceRelative,
  );
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, {
    recursive: sourceStats.isDirectory(),
    force: true,
  });
}

async function rewriteIndexAssetPaths(assetRoot) {
  const indexPath = join(clientDir, "index.html");
  const index = await readFile(indexPath, "utf8");
  await writeFile(
    indexPath,
    index.replaceAll("./src/", `./${assetRoot}/`),
    "utf8",
  );
}

async function contentRevision(directory, mapsConfig) {
  const hash = createHash("sha256");
  hash.update(mapsConfig);
  const paths = await listFiles(directory);

  for (const path of paths) {
    hash.update(relative(directory, path).replaceAll("\\", "/"));
    hash.update(await readFile(path));
  }

  return hash.digest("hex").slice(0, 12);
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else if (entry.isFile()) files.push(path);
  }

  return files;
}

function collectReferencedAssets(value, assets = new Set()) {
  if (typeof value === "string") {
    const normalized = value.replaceAll("\\", "/").replace(/^\.\//, "");
    if (
      normalized.startsWith("data/recordings/") ||
      normalized.startsWith("data/exploration-videos/")
    ) {
      return assets;
    }
    if (
      normalized.startsWith("data/") &&
      [".gif", ".jpeg", ".jpg", ".json", ".mp4", ".png", ".webm", ".webp"]
        .includes(extname(normalized).toLowerCase())
    ) {
      assets.add(normalized);
    }
    return assets;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectReferencedAssets(item, assets);
    return assets;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectReferencedAssets(item, assets);
  }

  return assets;
}
