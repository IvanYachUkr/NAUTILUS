import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { validateCases } from "../src/data-contract.js";

const input = process.argv[2];

if (!input) {
  console.error("Usage: node scripts/check-data.mjs <results.json|data-module.js>");
  process.exitCode = 2;
} else {
  const path = resolve(process.cwd(), input);
  const data = await loadData(path);
  const errors = validateCases(data);

  if (errors.length > 0) {
    console.error(`Data validation failed with ${errors.length} issue(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    const runCount = data.reduce((sum, item) => sum + item.runs.length, 0);
    console.log(`Valid data: ${data.length} case(s), ${runCount} run(s).`);
  }
}

async function loadData(path) {
  if (extname(path).toLowerCase() === ".json") {
    const parsed = JSON.parse(await readFile(path, "utf8"));
    return Array.isArray(parsed) ? parsed : parsed.cases;
  }

  const module = await import(pathToFileURL(path));
  return module.demoCases ?? module.cases ?? module.default;
}
