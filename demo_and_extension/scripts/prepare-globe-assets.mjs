import { copyFile, mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = fileURLToPath(new URL("..", import.meta.url));
const vendorDir = join(projectDir, "src", "vendor");

const globeAssets = [
  {
    source: join(projectDir, "node_modules", "globe.gl", "dist", "globe.gl.min.js"),
    destination: join(vendorDir, "globe.gl.min.js"),
  },
  {
    source: join(
      projectDir,
      "node_modules",
      "three-globe",
      "example",
      "img",
      "earth-blue-marble.jpg",
    ),
    destination: join(vendorDir, "earth-blue-marble.jpg"),
  },
  {
    source: join(
      projectDir,
      "node_modules",
      "three-globe",
      "example",
      "img",
      "earth-topology.png",
    ),
    destination: join(vendorDir, "earth-topology.png"),
  },
];

await mkdir(vendorDir, { recursive: true });

for (const asset of globeAssets) {
  const sourceStats = await stat(asset.source);
  if (!sourceStats.isFile() || sourceStats.size === 0) {
    throw new Error(`Globe dependency asset is unavailable: ${asset.source}`);
  }
  await mkdir(dirname(asset.destination), { recursive: true });
  await copyFile(asset.source, asset.destination);
}

console.log(`Prepared ${globeAssets.length} local globe asset(s).`);
