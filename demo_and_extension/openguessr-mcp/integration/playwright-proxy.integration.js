import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";
import test from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { startOpenGuessrProxyServer } from "../src/http-server.js";
import { connectHttpUpstream } from "../src/upstream-client.js";

test("real Playwright MCP places, verifies, and submits a coordinate through the proxy", { timeout: 90_000 }, async (t) => {
  const fixture = await startFixtureServer();
  t.after(() => fixture.close());

  const playwright = await startPlaywrightMcp(fixture.url);
  t.after(() => playwright.close());

  const proxy = await startOpenGuessrProxyServer({
    host: "127.0.0.1",
    port: 0,
    upstreamFactory: () => connectHttpUpstream(playwright.url),
  });
  t.after(() => proxy.close());

  const client = new Client({ name: "real-playwright-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(proxy.url));
  await client.connect(transport);
  t.after(() => client.close());

  const listed = await client.listTools();
  const screenshot = await client.callTool({
    name: "browser_take_screenshot",
    arguments: { scale: "css", type: "jpeg" },
  });
  const placement = await client.callTool({
    name: "openguessr_place_guess",
    arguments: { latitude: 48.8566, longitude: 2.3522 },
  });
  const state = await client.callTool({
    name: "openguessr_get_state",
    arguments: {},
  });
  const submission = await client.callTool({
    name: "openguessr_submit_guess",
    arguments: {},
  });
  const resultState = await client.callTool({
    name: "openguessr_get_state",
    arguments: {},
  });

  assert.equal(listed.tools.some(({ name }) => name === "browser_evaluate"), false);
  assert.equal(screenshot.isError, undefined);
  assert.equal(screenshot.content.some(({ type }) => type === "image"), true);
  assert.deepEqual(JSON.parse(placement.content[0].text), {
    ok: true,
    action: "place-guess",
    verified: true,
    pin: { latitude: 48.8566, longitude: 2.3522 },
  });
  assert.deepEqual(JSON.parse(state.content[0].text).verifiedPin, {
    latitude: 48.8566,
    longitude: 2.3522,
  });
  assert.equal(JSON.parse(submission.content[0].text).submitted, true);
  assert.equal(JSON.parse(resultState.content[0].text).controls.continue, true);
});

async function startFixtureServer() {
  const html = `<!doctype html>
<html><body>
  <div id="guess-map" class="leaflet-container" style="width:500px;height:320px"></div>
  <div id="guess" class="standard-button" style="width:120px;height:40px">Guess</div>
  <script>
    window.fixtureSubmitted = false;
    class FixtureMap {
      constructor() {
        this.layers = [];
        this.container = document.querySelector('#guess-map');
      }
      fire(type, data) {
        if (type === 'click' && data && data.latlng) {
          const point = { lat: data.latlng.lat, lng: data.latlng.lng };
          this.layers = [{ getLatLng: () => point }];
        }
        return this;
      }
      getContainer() { return this.container; }
      eachLayer(callback) { this.layers.forEach(callback); }
    }
    window.L = {
      Map: FixtureMap,
      latLng: (latitude, longitude) => ({ lat: latitude, lng: longitude })
    };
    document.querySelector('#guess').addEventListener('click', () => {
      window.fixtureSubmitted = true;
      document.querySelector('#guess').textContent = 'Continue';
    });
  </script>
  <script>
    window.fixtureMap = new L.Map();
    window.fixtureMap.fire('load');
  </script>
</body></html>`;

  const server = http.createServer((request, response) => {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(html);
  });
  await listen(server, 0);
  const address = server.address();
  return {
    url: `http://127.0.0.1:${address.port}/fixture`,
    close: () => closeServer(server),
  };
}

async function startPlaywrightMcp(fixtureUrl) {
  const port = await reservePort();
  const cliPath = new URL("../node_modules/@playwright/mcp/cli.js", import.meta.url);
  const initPagePath = new URL("./init-page.mjs", import.meta.url);
  const adapterPath = new URL("../browser/openguessr-adapter.js", import.meta.url);
  const child = spawn(
    process.execPath,
    [
      cliPath.pathname.replace(/^\/(?=[A-Za-z]:)/, ""),
      "--browser", "chrome",
      "--headless",
      "--isolated",
      "--caps=vision",
      "--snapshot-mode=none",
      "--image-responses=allow",
      "--codegen=none",
      "--shared-browser-context",
      "--init-script", adapterPath.pathname.replace(/^\/(?=[A-Za-z]:)/, ""),
      "--init-page", initPagePath.pathname.replace(/^\/(?=[A-Za-z]:)/, ""),
      "--host", "127.0.0.1",
      `--allowed-hosts=127.0.0.1:${port},localhost:${port}`,
      "--port", String(port),
    ],
    {
      windowsHide: true,
      env: { ...process.env, NAUTILUS_OPENGUESSR_FIXTURE_URL: fixtureUrl },
    },
  );
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
  child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
  await waitForPort(port, child, () => `${stdout}\n${stderr}`);
  return {
    url: `http://127.0.0.1:${port}/mcp`,
    async close() {
      if (child.exitCode !== null) return;
      child.kill();
      await new Promise((resolve) => child.once("exit", resolve));
    },
  };
}

async function reservePort() {
  const server = net.createServer();
  await listen(server, 0);
  const port = server.address().port;
  await closeServer(server);
  return port;
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
}

function closeServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

async function waitForPort(port, child, output) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Playwright MCP exited early (${child.exitCode}).\n${output()}`);
    }
    const connected = await new Promise((resolve) => {
      const socket = net.connect(port, "127.0.0.1");
      socket.once("connect", () => { socket.destroy(); resolve(true); });
      socket.once("error", () => resolve(false));
    });
    if (connected) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for Playwright MCP.\n${output()}`);
}
