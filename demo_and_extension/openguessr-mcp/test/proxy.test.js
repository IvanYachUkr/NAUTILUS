import assert from "node:assert/strict";
import test from "node:test";

import { createOpenGuessrProxy } from "../src/proxy.js";

const upstreamTools = [
  tool("browser_take_screenshot"),
  tool("browser_mouse_click_xy"),
  tool("browser_mouse_move_xy"),
  tool("browser_mouse_drag_xy"),
  tool("browser_mouse_wheel"),
  tool("browser_press_key"),
  tool("browser_evaluate"),
  tool("browser_navigate"),
  tool("browser_network_requests"),
];

test("tool discovery exposes safe visual controls and OpenGuessr actions only", async () => {
  const proxy = createOpenGuessrProxy({
    upstream: fakeUpstream({ tools: upstreamTools }),
  });

  const result = await proxy.listTools();

  assert.deepEqual(
    result.tools.map(({ name }) => name),
    [
      "browser_take_screenshot",
      "browser_mouse_click_xy",
      "browser_mouse_move_xy",
      "browser_mouse_drag_xy",
      "browser_mouse_wheel",
      "browser_press_key",
      "openguessr_place_guess",
      "openguessr_get_state",
      "openguessr_submit_guess",
      "openguessr_continue",
    ],
  );
});

test("a safe visual call is forwarded without changing its arguments or result", async () => {
  const calls = [];
  const expected = {
    content: [{ type: "text", text: "screenshot ready" }],
  };
  const proxy = createOpenGuessrProxy({
    upstream: fakeUpstream({ tools: upstreamTools, calls, callResult: expected }),
  });

  const actual = await proxy.callTool({
    name: "browser_take_screenshot",
    arguments: { type: "png" },
  });

  assert.deepEqual(actual, expected);
  assert.deepEqual(calls, [
    { name: "browser_take_screenshot", arguments: { type: "png" } },
  ]);
});

test("a timed-out screenshot is retried once through the same safe upstream tool", async () => {
  const calls = [];
  const timeout = {
    content: [{ type: "text", text: "TimeoutError: taking page screenshot" }],
    isError: true,
  };
  const expected = {
    content: [{ type: "image", data: "aGVsbG8=", mimeType: "image/jpeg" }],
  };
  const proxy = createOpenGuessrProxy({
    upstream: {
      async listTools() {
        return { tools: upstreamTools };
      },
      async callTool(request) {
        calls.push(request);
        return calls.length === 1 ? timeout : expected;
      },
    },
  });

  const actual = await proxy.callTool({
    name: "browser_take_screenshot",
    arguments: { scale: "css", type: "jpeg" },
  });

  assert.deepEqual(actual, expected);
  assert.deepEqual(calls, [
    { name: "browser_take_screenshot", arguments: { scale: "css", type: "jpeg" } },
    { name: "browser_take_screenshot", arguments: { scale: "css", type: "jpeg" } },
  ]);
});

test("a screenshot request-timeout rejection is retried once", async () => {
  const calls = [];
  const expected = {
    content: [{ type: "image", data: "aGVsbG8=", mimeType: "image/jpeg" }],
  };
  const proxy = createOpenGuessrProxy({
    upstream: {
      async listTools() {
        return { tools: upstreamTools };
      },
      async callTool(request) {
        calls.push(request);
        if (calls.length === 1) {
          throw new Error("MCP error -32001: Request timed out");
        }
        return expected;
      },
    },
  });

  const actual = await proxy.callTool({
    name: "browser_take_screenshot",
    arguments: { scale: "css", type: "jpeg" },
  });

  assert.deepEqual(actual, expected);
  assert.equal(calls.length, 2);
});

test("an unlisted upstream tool cannot be reached through the proxy", async () => {
  const calls = [];
  const proxy = createOpenGuessrProxy({
    upstream: fakeUpstream({ tools: upstreamTools, calls }),
  });

  await assert.rejects(
    proxy.callTool({ name: "browser_evaluate", arguments: { function: "() => 1" } }),
    /not allowed/i,
  );
  assert.deepEqual(calls, []);
});

test("invalid coordinates are rejected before any browser operation", async () => {
  const calls = [];
  const proxy = createOpenGuessrProxy({
    upstream: fakeUpstream({ tools: upstreamTools, calls }),
  });

  await assert.rejects(
    proxy.callTool({
      name: "openguessr_place_guess",
      arguments: { latitude: 91, longitude: 2.3522 },
    }),
    /latitude must be between -90 and 90/i,
  );
  assert.deepEqual(calls, []);
});

test("coordinate placement uses the hidden page adapter and returns its verified pin", async () => {
  const calls = [];
  const upstreamResult = {
    content: [
      {
        type: "text",
        text: [
          "### Result",
          '{"ok":true,"action":"place-guess","verified":true,"pin":{"latitude":48.8566,"longitude":2.3522}}',
          "### Page",
          "- Page URL: https://openguessr.com/competitions/example",
        ].join("\n"),
      },
    ],
  };
  const proxy = createOpenGuessrProxy({
    upstream: fakeUpstream({ tools: upstreamTools, calls, callResult: upstreamResult }),
  });

  const result = await proxy.callTool({
    name: "openguessr_place_guess",
    arguments: { latitude: 48.8566, longitude: 2.3522 },
  });

  assert.deepEqual(JSON.parse(result.content[0].text), {
    ok: true,
    action: "place-guess",
    verified: true,
    pin: { latitude: 48.8566, longitude: 2.3522 },
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, "browser_evaluate");
  assert.equal(calls[0].arguments.function.includes("__NAUTILUS_OPENGUESSR_MCP__"), true);
  assert.equal(calls[0].arguments.function.includes("48.8566"), true);
  assert.equal(calls[0].arguments.function.includes("2.3522"), true);
});

test("custom tool results expose only the documented safe state fields", async () => {
  const proxy = createOpenGuessrProxy({
    upstream: fakeUpstream({
      tools: upstreamTools,
      callResult: {
        content: [
          {
            type: "text",
            text: [
              "### Result",
              JSON.stringify({
                ok: true,
                action: "get-state",
                path: "/competitions/secret-id",
                hiddenTarget: { latitude: 1, longitude: 2 },
                controls: { guess: true, continue: false },
                resultVisible: false,
                verifiedPin: { latitude: 48.8566, longitude: 2.3522 },
              }),
            ].join("\n"),
          },
        ],
      },
    }),
  });

  const result = await proxy.callTool({ name: "openguessr_get_state", arguments: {} });

  assert.deepEqual(JSON.parse(result.content[0].text), {
    ok: true,
    action: "get-state",
    controls: { guess: true, continue: false },
    resultVisible: false,
    verifiedPin: { latitude: 48.8566, longitude: 2.3522 },
  });
});

test("a page-adapter failure is returned as a failed MCP tool result", async () => {
  const proxy = createOpenGuessrProxy({
    upstream: fakeUpstream({
      tools: upstreamTools,
      callResult: {
        content: [
          {
            type: "text",
            text: '### Result\n{"ok":false,"error":"Open the OpenGuessr guess map first."}',
          },
        ],
      },
    }),
  });

  const result = await proxy.callTool({
    name: "openguessr_place_guess",
    arguments: { latitude: 35.6895, longitude: 139.6917 },
  });

  assert.equal(result.isError, true);
  assert.deepEqual(JSON.parse(result.content[0].text), {
    ok: false,
    error: "Open the OpenGuessr guess map first.",
  });
});

test("custom-tool auditing records ordered placement refinements and round transitions", async () => {
  const auditEvents = [];
  const responses = [
    { ok: true, action: "place-guess", verified: true, pin: { latitude: 50, longitude: 8 } },
    { ok: true, action: "place-guess", verified: true, pin: { latitude: 50.2, longitude: 8.4 } },
    { ok: true, action: "submit-guess", submitted: true, pin: { latitude: 50.2, longitude: 8.4 } },
    { ok: true, action: "continue", continued: true },
    { ok: true, action: "place-guess", verified: true, pin: { latitude: 41, longitude: 12 } },
  ];
  const proxy = createOpenGuessrProxy({
    upstream: {
      async listTools() {
        return { tools: upstreamTools };
      },
      async callTool() {
        const payload = responses.shift();
        return { content: [{ type: "text", text: `### Result\n${JSON.stringify(payload)}` }] };
      },
    },
    onAuditEvent(event) {
      auditEvents.push(event);
    },
    now: () => "2026-09-01T15:00:00.000Z",
  });

  await proxy.callTool({
    name: "openguessr_place_guess",
    arguments: { latitude: 50, longitude: 8 },
  });
  await proxy.callTool({
    name: "openguessr_place_guess",
    arguments: { latitude: 50.2, longitude: 8.4 },
  });
  await proxy.callTool({ name: "openguessr_submit_guess", arguments: {} });
  await proxy.callTool({ name: "openguessr_continue", arguments: {} });
  await proxy.callTool({
    name: "openguessr_place_guess",
    arguments: { latitude: 41, longitude: 12 },
  });

  assert.deepEqual(auditEvents, [
    {
      timestamp: "2026-09-01T15:00:00.000Z",
      sequence: 1,
      round: 1,
      tool: "openguessr_place_guess",
      arguments: { latitude: 50, longitude: 8 },
      result: { ok: true, action: "place-guess", verified: true, pin: { latitude: 50, longitude: 8 } },
    },
    {
      timestamp: "2026-09-01T15:00:00.000Z",
      sequence: 2,
      round: 1,
      tool: "openguessr_place_guess",
      arguments: { latitude: 50.2, longitude: 8.4 },
      result: { ok: true, action: "place-guess", verified: true, pin: { latitude: 50.2, longitude: 8.4 } },
    },
    {
      timestamp: "2026-09-01T15:00:00.000Z",
      sequence: 3,
      round: 1,
      tool: "openguessr_submit_guess",
      arguments: {},
      result: { ok: true, action: "submit-guess", submitted: true, pin: { latitude: 50.2, longitude: 8.4 } },
    },
    {
      timestamp: "2026-09-01T15:00:00.000Z",
      sequence: 4,
      round: 1,
      tool: "openguessr_continue",
      arguments: {},
      result: { ok: true, action: "continue", continued: true },
    },
    {
      timestamp: "2026-09-01T15:00:00.000Z",
      sequence: 5,
      round: 2,
      tool: "openguessr_place_guess",
      arguments: { latitude: 41, longitude: 12 },
      result: { ok: true, action: "place-guess", verified: true, pin: { latitude: 41, longitude: 12 } },
    },
  ]);
});

function tool(name) {
  return {
    name,
    description: `${name} description`,
    inputSchema: { type: "object", properties: {} },
  };
}

function fakeUpstream({ tools, calls = [], callResult = { content: [] } }) {
  return {
    async listTools() {
      return { tools };
    },
    async callTool(request) {
      calls.push(request);
      return callResult;
    },
  };
}
