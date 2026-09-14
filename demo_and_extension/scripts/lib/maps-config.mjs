import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function loadMapsEmbedKey(projectDir, env = process.env) {
  let value = env.GOOGLE_MAPS_EMBED_API_KEY;
  if (value === undefined) {
    try {
      const local = await readFile(join(projectDir, ".env.local"), "utf8");
      value = local.match(/^[ \t]*GOOGLE_MAPS_EMBED_API_KEY[ \t]*=[ \t]*(.*?)[ \t]*\r?$/m)?.[1];
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const key = (value ?? "").trim().replace(/^(["'])(.*)\1$/, "$2");
  if (key && !/^AIza[A-Za-z0-9_-]{35}$/.test(key)) {
    throw new Error("GOOGLE_MAPS_EMBED_API_KEY must be a valid Google API key or empty.");
  }
  return key;
}

export function mapsConfigSource(key) {
  return `// Public browser key, restricted to Maps Embed and approved websites.\nexport const mapsEmbedApiKey = ${JSON.stringify(key)};\n`;
}
