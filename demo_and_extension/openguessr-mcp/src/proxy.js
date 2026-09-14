const SAFE_UPSTREAM_TOOL_NAMES = new Set([
  "browser_take_screenshot",
  "browser_mouse_click_xy",
  "browser_mouse_move_xy",
  "browser_mouse_drag_xy",
  "browser_mouse_wheel",
  "browser_press_key",
]);

const CUSTOM_TOOLS = [
  {
    name: "openguessr_place_guess",
    title: "Place an OpenGuessr guess",
    description:
      "Place and verify a pin at coordinates you already chose. This tool does not geocode names or reveal the correct location. Open the in-game guess map before calling it.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        latitude: {
          type: "number",
          minimum: -90,
          maximum: 90,
          description: "Model-chosen latitude in decimal degrees.",
        },
        longitude: {
          type: "number",
          minimum: -180,
          maximum: 180,
          description: "Model-chosen longitude in decimal degrees.",
        },
      },
      required: ["latitude", "longitude"],
    },
  },
  {
    name: "openguessr_get_state",
    title: "Read safe OpenGuessr state",
    description:
      "Read only round controls and the last MCP-verified pin. Correct-location data and hidden page/network data are never returned.",
    inputSchema: emptyInputSchema(),
    annotations: { readOnlyHint: true },
  },
  {
    name: "openguessr_submit_guess",
    title: "Submit the verified OpenGuessr guess",
    description:
      "Click the visible Guess control only when this MCP has verified a placed pin. It refuses default or unverified submissions.",
    inputSchema: emptyInputSchema(),
  },
  {
    name: "openguessr_continue",
    title: "Continue after an OpenGuessr result",
    description:
      "Click the visible Continue or Next Round control. It does not inspect or return the correct location.",
    inputSchema: emptyInputSchema(),
  },
];

const CUSTOM_COMMANDS = new Map([
  ["openguessr_place_guess", "place-guess"],
  ["openguessr_get_state", "get-state"],
  ["openguessr_submit_guess", "submit-guess"],
  ["openguessr_continue", "continue"],
]);

const SAFE_TOOL_TIMEOUT_MS = 20_000;
const SCREENSHOT_TIMEOUT_MS = 15_000;

export function createOpenGuessrProxy({ upstream, onAuditEvent, now = () => new Date().toISOString() }) {
  if (!upstream?.listTools || !upstream?.callTool) {
    throw new TypeError("An upstream MCP client with listTools and callTool is required.");
  }

  let auditSequence = 0;
  let round = 1;

  return {
    async listTools() {
      const result = await upstream.listTools();
      const safeTools = (result.tools ?? []).filter(({ name }) =>
        SAFE_UPSTREAM_TOOL_NAMES.has(name),
      );
      return { tools: [...safeTools, ...CUSTOM_TOOLS] };
    },

    async callTool(request) {
      const name = request?.name;
      if (SAFE_UPSTREAM_TOOL_NAMES.has(name)) {
        const forwardedRequest = {
          name,
          arguments: request.arguments ?? {},
        };
        const options = {
          timeout: name === "browser_take_screenshot" ? SCREENSHOT_TIMEOUT_MS : SAFE_TOOL_TIMEOUT_MS,
          maxTotalTimeout:
            name === "browser_take_screenshot" ? SCREENSHOT_TIMEOUT_MS : SAFE_TOOL_TIMEOUT_MS,
        };
        let result;
        try {
          result = await upstream.callTool(forwardedRequest, options);
        } catch (error) {
          if (name !== "browser_take_screenshot" || !isTimeoutError(error)) throw error;
          return upstream.callTool(forwardedRequest, options);
        }
        if (name === "browser_take_screenshot" && isTimeoutResult(result)) {
          return upstream.callTool(forwardedRequest, options);
        }
        return result;
      }

      const command = CUSTOM_COMMANDS.get(name);
      if (!command) throw new Error(`MCP tool is not allowed: ${String(name)}`);

      const args = validateCommandArguments(command, request.arguments ?? {});
      const upstreamResult = await upstream.callTool({
        name: "browser_evaluate",
        arguments: {
          function: buildPageAdapterCall(command, args),
        },
      }, {
        timeout: SAFE_TOOL_TIMEOUT_MS,
        maxTotalTimeout: SAFE_TOOL_TIMEOUT_MS,
      });
      const payload = sanitizeCommandPayload(command, parseEvaluationResult(upstreamResult));
      if (typeof onAuditEvent === "function") {
        try {
          await onAuditEvent({
            timestamp: String(now()),
            sequence: ++auditSequence,
            round,
            tool: name,
            arguments: args,
            result: payload,
          });
        } catch {
          // Observability must never change benchmark behavior.
        }
      }
      if (command === "continue" && payload.ok === true) round += 1;
      return {
        content: [{ type: "text", text: JSON.stringify(payload) }],
        ...(payload.ok === true ? {} : { isError: true }),
      };
    },
  };
}

function emptyInputSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {},
  };
}

function validateCommandArguments(command, args) {
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    throw new TypeError("Tool arguments must be an object.");
  }

  if (command !== "place-guess") {
    if (Object.keys(args).length) {
      throw new TypeError(`${command} does not accept arguments.`);
    }
    return {};
  }

  const { latitude, longitude } = args;
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new RangeError("latitude must be between -90 and 90.");
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new RangeError("longitude must be between -180 and 180.");
  }
  if (Object.keys(args).some((key) => !["latitude", "longitude"].includes(key))) {
    throw new TypeError("openguessr_place_guess accepts only latitude and longitude.");
  }
  return { latitude, longitude };
}

function buildPageAdapterCall(command, args) {
  const request = JSON.stringify({ action: command, ...args });
  return `async () => {
    const adapter = window.__NAUTILUS_OPENGUESSR_MCP__;
    if (!adapter || typeof adapter.command !== "function") {
      return { ok: false, error: "The NAUTILUS OpenGuessr page adapter is not installed in this tab." };
    }
    return await adapter.command(${request});
  }`;
}

function parseEvaluationResult(result) {
  if (result?.isError) {
    return {
      ok: false,
      error: textFromContent(result.content) || "Playwright could not execute the OpenGuessr command.",
    };
  }

  const text = textFromContent(result?.content);
  const candidates = [
    text,
    text.match(/(?:^|\n)### Result\s*\n([\s\S]*?)(?=\n### |$)/i)?.[1],
    text.replace(/^### Result\s*/i, ""),
    text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1],
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const value = JSON.parse(candidate.trim());
      if (value && typeof value === "object") return value;
    } catch {
      // Try the next documented Playwright MCP text envelope.
    }
  }

  return {
    ok: false,
    error: text || "Playwright returned no OpenGuessr command result.",
  };
}

function sanitizeCommandPayload(command, payload) {
  if (payload?.ok !== true) {
    return {
      ok: false,
      error: String(payload?.error ?? "OpenGuessr command failed.").slice(0, 240),
    };
  }

  if (command === "place-guess") {
    return {
      ok: true,
      action: "place-guess",
      verified: payload.verified === true,
      pin: safePin(payload.pin),
    };
  }
  if (command === "get-state") {
    return {
      ok: true,
      action: "get-state",
      controls: {
        guess: payload.controls?.guess === true,
        continue: payload.controls?.continue === true,
      },
      resultVisible: payload.resultVisible === true,
      verifiedPin: safePin(payload.verifiedPin),
    };
  }
  if (command === "submit-guess") {
    return {
      ok: true,
      action: "submit-guess",
      submitted: payload.submitted === true,
      pin: safePin(payload.pin),
    };
  }
  return {
    ok: true,
    action: "continue",
    continued: payload.continued === true,
  };
}

function safePin(value) {
  if (!Number.isFinite(value?.latitude) || !Number.isFinite(value?.longitude)) return null;
  return { latitude: value.latitude, longitude: value.longitude };
}

function textFromContent(content) {
  return (content ?? [])
    .filter((item) => item?.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n")
    .trim();
}

function isTimeoutResult(result) {
  return result?.isError === true && /TimeoutError/i.test(textFromContent(result.content));
}

function isTimeoutError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /TimeoutError|Request\s*timed?\s*out|RequestTimeout/i.test(message);
}
