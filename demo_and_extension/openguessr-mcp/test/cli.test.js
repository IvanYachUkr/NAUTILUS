import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";

test("the CLI prints usable topology help without starting a server", async () => {
  const result = await runCli("--help");

  assert.equal(result.code, 0);
  assert.match(result.stdout, /openguessr-mcp \[--host/i);
  assert.match(result.stdout, /playwright MCP upstream/i);
  assert.equal(result.stderr, "");
});

test("the CLI reports an invalid option and exits nonzero", async () => {
  const result = await runCli("--unknown");

  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /unknown option/i);
});

function runCli(...args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["bin/openguessr-mcp.js", ...args], {
      cwd: new URL("..", import.meta.url),
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("exit", (code) => resolve({ code, stdout, stderr }));
  });
}
