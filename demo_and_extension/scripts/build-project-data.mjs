#!/usr/bin/env node

import { buildData } from "./build-data.mjs";
import { importStaticBaselines } from "./import-static-baselines.mjs";

const checkOnly = process.argv.includes("--check");

async function main() {
  await importStaticBaselines({ quiet: checkOnly });

  const result = await buildData({
    write: !checkOnly,
  });

  if (checkOnly) {
    console.log(
      `Data check passed: ` +
      `${result.locations.length} locations, ` +
      `${result.competitions.length} competitions, ` +
      `${result.atlasCases.length} atlas cases.`,
    );
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.stack ?? error.message
      : String(error),
  );
  process.exitCode = 1;
});
