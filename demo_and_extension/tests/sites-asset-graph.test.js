import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const projectDir = fileURLToPath(new URL("..", import.meta.url));

test("the Sites build emits a revisioned, self-contained globe asset graph", async () => {
  await new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [join(projectDir, "scripts", "build-site.mjs")],
      { cwd: projectDir, windowsHide: true },
      (error) => (error ? reject(error) : resolve()),
    );
  });

  const clientDir = join(projectDir, "dist", "client");
  const index = await readFile(join(clientDir, "index.html"), "utf8");
  const mainMatch = index.match(/src="\.\/(assets\/[a-f0-9]{12}\/main\.js)"/);

  assert.ok(mainMatch, "the entry module must use a content-revisioned asset path");
  assert.doesNotMatch(index, /(?:href|src)="\.\/src\//);

  const assetRoot = dirname(mainMatch[1]);
  const expectedAssets = [
    ["main.js", 100],
    ["globe-loader.js", 500],
    ["globe-controller.js", 5_000],
    ["vendor/globe.gl.min.js", 100_000],
    ["vendor/earth-blue-marble.jpg", 100_000],
    ["vendor/earth-topology.png", 10_000],
  ];

  for (const [relativePath, minimumBytes] of expectedAssets) {
    const info = await stat(join(clientDir, assetRoot, relativePath));
    assert.ok(
      info.size > minimumBytes,
      `${relativePath} should be packaged inside the revisioned asset graph`,
    );
  }

  const globeLoader = await readFile(
    join(clientDir, assetRoot, "globe-loader.js"),
    "utf8",
  );
  const globeController = await readFile(
    join(clientDir, assetRoot, "globe-controller.js"),
    "utf8",
  );

  assert.doesNotMatch(globeLoader, /https:\/\/cdn\.jsdelivr\.net/);
  assert.doesNotMatch(globeController, /https:\/\/cdn\.jsdelivr\.net/);
  assert.match(globeLoader, /vendor\/globe\.gl\.min\.js/);
  assert.match(globeController, /vendor\/earth-blue-marble\.jpg/);
  assert.match(globeController, /vendor\/earth-topology\.png/);

  const { buildProjectSnapshot, projectStoryMarkup } = await import(
    pathToFileURL(join(clientDir, assetRoot, "project-story.js")).href
  );
  const cases = JSON.parse(await readFile(join(clientDir, "data/generated/atlas-cases.json"), "utf8"));
  const story = projectStoryMarkup(buildProjectSnapshot(cases));
  const storyImages = [...story.matchAll(/<img src="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(storyImages.length, 7, "all research, method, evidence and team images must render");

  for (const imagePath of new Set(storyImages)) {
    const info = await stat(join(clientDir, imagePath.replace(/^\//, "")));
    assert.ok(info.size > 0, `${imagePath} must be included in the deployment`);
  }
});
