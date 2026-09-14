import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { spawnSync } from "node:child_process";
import { stdin as input, stdout as output } from "node:process";
import { buildData } from "./build-data.mjs";
import { GENERATED_COMPETITIONS_DIR, ROOT } from "./lib/workspace.mjs";

const args = process.argv.slice(2);
const built = await buildData({ write: true, quiet: true });

if (args.includes("--list")) {
  printCompetitionList(built.competitions);
  process.exit(0);
}

const requestedId = readOption(args, "--id") ?? firstPositional(args);
const selected = requestedId
  ? resolveCompetition(requestedId, built.competitions)
  : await promptForCompetition(built.competitions);

if (!selected) {
  console.error("No competition selected.");
  process.exit(1);
}

const outputs = built.competitionOutputs.filter(
  (item) => item.competitionId === selected.id,
);
const requestedPart = Number(readOption(args, "--part"));
const selectedOutputs = Number.isInteger(requestedPart) && requestedPart > 0
  ? outputs.filter((item) => item.part === requestedPart)
  : outputs;

if (selectedOutputs.length === 0) {
  throw new RangeError(
    `Competition ${selected.id} has no exported part ${requestedPart}.`,
  );
}

if (args.includes("--stdout")) {
  const blocks = await Promise.all(
    selectedOutputs.map((item) =>
      readFile(join(GENERATED_COMPETITIONS_DIR, item.filename), "utf8"),
    ),
  );
  process.stdout.write(blocks.join("\n"));
  process.exit(0);
}

console.log(`\n${selected.name}`);
console.log(`${selected.locationIds.length} location(s)`);
console.log(
  `${selected.parts.length} OpenGuessr competition file(s); each contains at most 20 Street View URLs.\n`,
);

for (const item of selectedOutputs) {
  const path = join(GENERATED_COMPETITIONS_DIR, item.filename);
  console.log(`Part ${item.part}/${item.partCount}: ${item.urls.length} URL(s)`);
  console.log(`  ${path}`);
}

if (selected.parts.length > 1) {
  console.log("\nArchive containing all URLs (not pasteable as one OpenGuessr competition):");
  console.log(`  ${join(GENERATED_COMPETITIONS_DIR, `${selected.id}-all.txt`)}`);
}

if (args.includes("--copy")) {
  if (selectedOutputs.length !== 1) {
    throw new Error(
      "Clipboard copy requires exactly one generated TXT. Select a part with --part=<number>.",
    );
  }
  const path = join(GENERATED_COMPETITIONS_DIR, selectedOutputs[0].filename);
  const text = await readFile(path, "utf8");
  const copied = copyToClipboard(text);
  if (copied.ok) {
    console.log("\nCopied all Street View URLs to the clipboard.");
  } else {
    console.warn(`\nCould not copy automatically: ${copied.error}`);
  }
}

console.log(
  "\nOpen the generated TXT, press Ctrl+A and Ctrl+C, then paste it into OpenGuessr's Street View URLs field.",
);
console.log("Tip: add --copy to copy a single generated competition directly to the clipboard.");

function readOption(values, name) {
  const equals = values.find((value) => value.startsWith(`${name}=`));
  if (equals) return equals.slice(name.length + 1);
  const index = values.indexOf(name);
  return index >= 0 ? values[index + 1] ?? null : null;
}

function firstPositional(values) {
  return values.find((value) => !value.startsWith("-")) ?? null;
}

function resolveCompetition(value, competitions) {
  const normalized = String(value).trim();
  const byId = competitions.find((item) => item.id === normalized);
  if (byId) return byId;

  const absolute = resolve(normalized);
  const relative = absolute.startsWith(ROOT)
    ? absolute.slice(ROOT.length + 1).replaceAll("\\", "/")
    : null;
  if (relative) {
    const byPath = competitions.find((item) => item.sourceFile === relative);
    if (byPath) return byPath;
  }

  throw new RangeError(
    `Unknown competition "${value}". Run npm run competition:list.`,
  );
}

async function promptForCompetition(competitions) {
  if (competitions.length === 0) return null;
  if (competitions.length === 1) return competitions[0];
  if (!input.isTTY) {
    throw new Error("Multiple competitions are available. Pass --id=<competition-id>.");
  }

  console.log("Select a competition definition:\n");
  competitions.forEach((competition, index) => {
    console.log(
      `  ${index + 1}. ${competition.name} (${competition.locationIds.length} locations)`,
    );
  });

  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question("\nCompetition number: ");
    const index = Number(answer) - 1;
    if (!Number.isInteger(index) || !competitions[index]) {
      throw new RangeError("Invalid competition selection.");
    }
    return competitions[index];
  } finally {
    rl.close();
  }
}

function printCompetitionList(competitions) {
  for (const competition of competitions) {
    console.log(
      `${competition.id}\t${competition.locationIds.length}\t${competition.sourceFile}`,
    );
  }
}

function copyToClipboard(text) {
  const candidates =
    process.platform === "win32"
      ? [["clip.exe", []]]
      : process.platform === "darwin"
        ? [["pbcopy", []]]
        : [
            ["wl-copy", []],
            ["xclip", ["-selection", "clipboard"]],
            ["xsel", ["--clipboard", "--input"]],
          ];

  const errors = [];
  for (const [command, commandArgs] of candidates) {
    const result = spawnSync(command, commandArgs, {
      input: text,
      encoding: "utf8",
    });
    if (result.status === 0) return { ok: true, command };
    if (result.error?.code !== "ENOENT") {
      errors.push(result.stderr || result.error?.message || `${command} failed`);
    }
  }
  return {
    ok: false,
    error: errors.filter(Boolean).join("; ") || "No supported clipboard command was found.",
  };
}
