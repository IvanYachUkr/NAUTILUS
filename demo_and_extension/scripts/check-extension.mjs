import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT } from "./lib/workspace.mjs";

const extensionRoot = join(ROOT, "extension", "openguessr-research-recorder");
const files = await walk(extensionRoot);
const errors = [];

for (const path of files) {
  const extension = extname(path).toLowerCase();
  if (extension === ".json") {
    try {
      JSON.parse(await readFile(path, "utf8"));
    } catch (error) {
      errors.push(`${relative(ROOT, path)}: ${error.message}`);
    }
  }

  if (extension === ".js") {
    const result = spawnSync(process.execPath, ["--check", path], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      errors.push(
        `${relative(ROOT, path)}: ${result.stderr || result.stdout || "syntax check failed"}`,
      );
    }
  }
}

if (errors.length) {
  console.error(`Extension validation failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(`Extension validation passed (${files.length} files checked).`);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await walk(path)));
    else if (entry.isFile()) result.push(path);
  }
  return result.sort();
}
