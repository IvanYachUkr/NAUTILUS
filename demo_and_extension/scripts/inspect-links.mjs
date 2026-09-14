import { readFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import { parseGoogleMapsStreetViewUrl } from "../shared/google-maps-url.js";
import { writeJsonAtomic } from "./lib/workspace.mjs";

const inputArgument = process.argv.slice(2).find((argument) => !argument.startsWith("--"));
if (!inputArgument) {
  console.error(
    "Usage: npm run links:inspect -- path/to/links.txt [--output=path/to/coordinates.json]",
  );
  process.exit(1);
}

const inputPath = resolve(inputArgument);
const outputArgument = process.argv
  .slice(2)
  .find((argument) => argument.startsWith("--output="))
  ?.slice("--output=".length);
const extension = extname(inputPath);
const outputPath = outputArgument
  ? resolve(outputArgument)
  : join(
      dirname(inputPath),
      `${basename(inputPath, extension || undefined)}.coordinates.json`,
    );

try {
  const text = await readFile(inputPath, "utf8");
  const urls = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  if (urls.length === 0) throw new Error("The TXT file contains no URLs.");

  const locations = urls.map((url, index) => {
    try {
      const parsed = parseGoogleMapsStreetViewUrl(url);
      return {
        order: index + 1,
        googleMapsUrl: parsed.sourceUrl,
        groundTruth: parsed.viewpoint,
        startingView: {
          viewpoint: parsed.viewpoint,
          ...(Number.isFinite(parsed.heading) ? { heading: parsed.heading } : {}),
          ...(Number.isFinite(parsed.pitch) ? { pitch: parsed.pitch } : {}),
          ...(Number.isFinite(parsed.fov) ? { fov: parsed.fov } : {}),
          ...(parsed.panoId ? { panoId: parsed.panoId } : {}),
        },
        canonicalGoogleMapsUrl: parsed.canonicalUrl,
        coordinateSource: parsed.coordinateSource,
      };
    } catch (error) {
      throw new Error(`Line ${index + 1}: ${error.message}`);
    }
  });

  await writeJsonAtomic(outputPath, {
    schemaVersion: "1.0",
    sourceFile: inputPath,
    count: locations.length,
    locations,
  });
  console.log(`Parsed ${locations.length} links into ${outputPath}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
