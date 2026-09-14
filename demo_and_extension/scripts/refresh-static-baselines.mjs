#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildData } from "./build-data.mjs";
import { importStaticBaselines } from "./import-static-baselines.mjs";

export async function refreshStaticBaselines({ quiet = false } = {}) {
  const imported = await importStaticBaselines({ quiet });
  const built = await buildData({ quiet });

  if (!quiet) {
    console.log(
      `Refreshed static baseline website data: ` +
      `${imported.baselineCount} baselines, ` +
      `${imported.imageVariantCount} image variants, ` +
      `${imported.locationCount} locations.`,
    );
  }

  return { imported, built };
}

const isDirect =
  process.argv[1]
    ? resolve(process.argv[1]) === fileURLToPath(import.meta.url)
    : false;

if (isDirect) {
  refreshStaticBaselines().catch((error) => {
    console.error(
      error instanceof Error
        ? error.stack ?? error.message
        : String(error),
    );
    process.exitCode = 1;
  });
}
