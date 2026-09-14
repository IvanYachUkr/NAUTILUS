import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";

test("the Grok launcher validates the Chrome topology and exact tool allowlist without starting processes", async () => {
  const packageRoot = new URL("..", import.meta.url);
  const result = await runPowerShell([
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    "scripts/Start-GrokOpenGuessr.ps1",
    "-PromptFile",
    "package.json",
    "-ValidateOnly",
  ], packageRoot);

  assert.equal(result.code, 0, result.stderr);
  const config = JSON.parse(result.stdout);
  assert.equal(config.browser, "chrome");
  assert.equal(config.proxyUrl, "http://127.0.0.1:8931/mcp");
  assert.equal(config.upstreamUrl, "http://127.0.0.1:8932/mcp");
  assert.equal(config.upstreamArgs.includes("--shared-browser-context"), true);
  assert.equal(config.connectionMode, "extension");
  assert.equal(config.upstreamArgs.includes("--extension"), true);
  assert.equal(config.upstreamArgs.includes("--init-script"), true);
  assert.equal(config.upstreamArgs.includes("--init-page"), true);
  assert.equal(
    config.upstreamArgs.some((value) => value.endsWith("browser\\openguessr-adapter.js")),
    true,
  );
  assert.deepEqual(config.allowedMcpTools, [
    "playwright__browser_take_screenshot",
    "playwright__browser_mouse_click_xy",
    "playwright__browser_mouse_move_xy",
    "playwright__browser_mouse_drag_xy",
    "playwright__browser_mouse_wheel",
    "playwright__browser_press_key",
    "playwright__openguessr_place_guess",
    "playwright__openguessr_get_state",
    "playwright__openguessr_submit_guess",
    "playwright__openguessr_continue",
  ]);
  assert.equal(config.processesStarted, false);
});

test("the Grok launcher supports an isolated Chrome CDP endpoint without requiring the bridge extension", async () => {
  const packageRoot = new URL("..", import.meta.url);
  const endpoint = "http://127.0.0.1:9224";
  const result = await runPowerShell([
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    "scripts/Start-GrokOpenGuessr.ps1",
    "-PromptFile",
    "package.json",
    "-CdpEndpoint",
    endpoint,
    "-ValidateOnly",
  ], packageRoot);

  assert.equal(result.code, 0, result.stderr);
  const config = JSON.parse(result.stdout);
  assert.equal(config.connectionMode, "cdp");
  assert.equal(config.cdpEndpoint, endpoint);
  assert.equal(config.upstreamArgs.includes("--extension"), false);
  assert.equal(config.upstreamArgs.includes(`--cdp-endpoint=${endpoint}`), true);
  assert.equal(config.upstreamArgs.includes("--init-script"), true);
  const viewportIndex = config.upstreamArgs.indexOf("--viewport-size");
  assert.notEqual(viewportIndex, -1);
  assert.equal(config.upstreamArgs[viewportIndex + 1], "1496x686");
  const blockedOriginsIndex = config.upstreamArgs.indexOf("--blocked-origins");
  assert.notEqual(blockedOriginsIndex, -1);
  assert.equal(config.upstreamArgs[blockedOriginsIndex + 1], "https://sonic.impactify.media");
  const actionTimeoutIndex = config.upstreamArgs.indexOf("--timeout-action");
  assert.notEqual(actionTimeoutIndex, -1);
  assert.equal(config.upstreamArgs[actionTimeoutIndex + 1], "20000");
  assert.equal(
    config.upstreamArgs.some((value) => value.endsWith("browser\\openguessr-adapter.js")),
    true,
  );
  assert.equal(config.processesStarted, false);
});

test("the Grok launcher forwards an explicit per-run MCP audit log", async () => {
  const packageRoot = new URL("..", import.meta.url);
  const auditLogPath = "C:\\benchmark\\medium-r2\\mcp-audit.jsonl";
  const result = await runPowerShell([
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    "scripts/Start-GrokOpenGuessr.ps1",
    "-PromptFile",
    "package.json",
    "-AuditLogPath",
    auditLogPath,
    "-ValidateOnly",
  ], packageRoot);

  assert.equal(result.code, 0, result.stderr);
  const config = JSON.parse(result.stdout);
  assert.equal(config.auditLogPath, auditLogPath);
  const auditIndex = config.proxyArgs.indexOf("--audit-log");
  assert.notEqual(auditIndex, -1);
  assert.equal(config.proxyArgs[auditIndex + 1], auditLogPath);
  assert.equal(config.processesStarted, false);
});

test("the Grok launcher rejects non-loopback CDP endpoints", async () => {
  const packageRoot = new URL("..", import.meta.url);
  const result = await runPowerShell([
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    "scripts/Start-GrokOpenGuessr.ps1",
    "-PromptFile",
    "package.json",
    "-CdpEndpoint",
    "https://example.com:9224",
    "-ValidateOnly",
  ], packageRoot);

  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /loopback HTTP URL/i);
});

function runPowerShell(args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn("powershell.exe", args, { cwd, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("exit", (code) => resolve({ code, stdout: stdout.trim(), stderr }));
  });
}
