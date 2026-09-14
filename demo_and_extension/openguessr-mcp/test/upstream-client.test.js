import assert from "node:assert/strict";
import test from "node:test";

import { startOpenGuessrProxyServer } from "../src/http-server.js";
import { connectHttpUpstream } from "../src/upstream-client.js";

test("the upstream client connects to a loopback MCP and forwards its contract", async (t) => {
  const upstreamServer = await startOpenGuessrProxyServer({
    host: "127.0.0.1",
    port: 0,
    upstreamFactory: async () => ({
      async listTools() {
        return {
          tools: [
            {
              name: "browser_take_screenshot",
              description: "Take a screenshot",
              inputSchema: { type: "object", properties: {} },
            },
          ],
        };
      },
      async callTool() {
        return { content: [{ type: "text", text: "real HTTP boundary" }] };
      },
      async close() {},
    }),
  });
  t.after(() => upstreamServer.close());

  const upstream = await connectHttpUpstream(upstreamServer.url);
  t.after(() => upstream.close());

  const tools = await upstream.listTools();
  const result = await upstream.callTool({
    name: "browser_take_screenshot",
    arguments: {},
  });

  assert.equal(tools.tools[0].name, "browser_take_screenshot");
  assert.equal(result.content[0].text, "real HTTP boundary");
});

test("the upstream client refuses a non-loopback MCP URL", async () => {
  await assert.rejects(
    connectHttpUpstream("https://example.com/mcp"),
    /loopback/i,
  );
});

test("a timed-out upstream request resets the MCP session before the next call", async (t) => {
  let sessionCount = 0;
  const upstreamServer = await startOpenGuessrProxyServer({
    host: "127.0.0.1",
    port: 0,
    upstreamFactory: async () => {
      const sessionNumber = ++sessionCount;
      let release;
      return {
        async listTools() {
          return {
            tools: [
              {
                name: "browser_take_screenshot",
                description: "Take a screenshot",
                inputSchema: { type: "object", properties: {} },
              },
            ],
          };
        },
        async callTool() {
          if (sessionNumber > 1) {
            return { content: [{ type: "text", text: "fresh session" }] };
          }
          return new Promise((resolve) => {
            release = resolve;
          });
        },
        async close() {
          release?.({ content: [{ type: "text", text: "closed stale session" }] });
        },
      };
    },
  });
  t.after(() => upstreamServer.close());

  const upstream = await connectHttpUpstream(upstreamServer.url);
  t.after(() => upstream.close());

  await assert.rejects(
    upstream.callTool(
      { name: "browser_take_screenshot", arguments: {} },
      { timeout: 50, maxTotalTimeout: 50 },
    ),
    /timed out/i,
  );

  const result = await upstream.callTool(
    { name: "browser_take_screenshot", arguments: {} },
    { timeout: 1_000, maxTotalTimeout: 1_000 },
  );

  assert.equal(result.content[0].text, "fresh session");
  assert.equal(sessionCount, 2);
});
