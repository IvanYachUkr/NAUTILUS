import http from "node:http";

const HOST = "127.0.0.1";
const SESSION_ID = "nautilus-authenticated-chrome";
const GUESS_TEXT = /(^|\b)(guess|make guess|submit guess|lock in|submit)(\b|$)/i;
const NEXT_TEXT = /next round|continue|view result|show result|finish/i;

const TOOLS = [
  tool("browser_take_screenshot", "Take a screenshot", "Capture the current visible Chrome viewport.", {
    type: { type: "string" },
    scale: { type: "string" },
  }, [], true),
  tool("browser_mouse_click_xy", "Click", "Click at a visible viewport coordinate.", {
    x: { type: "number" },
    y: { type: "number" },
    button: { type: "string" },
    clickCount: { type: "number" },
    delay: { type: "number" },
  }, ["x", "y"]),
  tool("browser_mouse_move_xy", "Move mouse", "Move the mouse to a visible viewport coordinate.", {
    x: { type: "number" },
    y: { type: "number" },
  }, ["x", "y"]),
  tool("browser_mouse_drag_xy", "Drag mouse", "Drag between visible viewport coordinates.", {
    startX: { type: "number" },
    startY: { type: "number" },
    endX: { type: "number" },
    endY: { type: "number" },
  }, ["startX", "startY", "endX", "endY"]),
  tool("browser_mouse_wheel", "Scroll mouse wheel", "Scroll at the current mouse position.", {
    deltaX: { type: "number" },
    deltaY: { type: "number" },
  }, ["deltaX", "deltaY"]),
  tool("browser_press_key", "Press a key", "Press a keyboard key.", {
    key: { type: "string" },
  }, ["key"]),
  tool("openguessr_place_guess", "Place an OpenGuessr guess", "Physically pan and zoom the visible guess map, then place and verify a pin at model-chosen coordinates.", {
    latitude: { type: "number", minimum: -90, maximum: 90 },
    longitude: { type: "number", minimum: -180, maximum: 180 },
  }, ["latitude", "longitude"]),
  tool("openguessr_get_state", "Read safe OpenGuessr state", "Read visible round controls and the last bridge-verified pin only.", {}, [], true),
  tool("openguessr_submit_guess", "Submit the verified OpenGuessr guess", "Click the visible Guess control only after a verified pin.", {}),
  tool("openguessr_continue", "Continue after an OpenGuessr result", "Click the visible Continue or Next Round control.", {}),
];

export function projectMercator(latitude, longitude, zoom) {
  const worldSize = 256 * (2 ** zoom);
  const safeLatitude = clamp(latitude, -85.05112878, 85.05112878);
  const sin = Math.sin(safeLatitude * Math.PI / 180);
  return {
    x: (longitude + 180) / 360 * worldSize,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * worldSize,
    worldSize,
  };
}

export function targetInCalibration(calibration, latitude, longitude) {
  const projected = projectMercator(latitude, longitude, calibration.tile.z);
  const centerWorldX = calibration.tile.x * 256 +
    (calibration.rect.width / 2 - calibration.pane.x - calibration.tile.left);
  const wrappedX = projected.x +
    Math.round((centerWorldX - projected.x) / projected.worldSize) * projected.worldSize;
  return {
    x: calibration.pane.x + calibration.tile.left +
      (wrappedX - calibration.tile.x * 256),
    y: calibration.pane.y + calibration.tile.top +
      (projected.y - calibration.tile.y * 256),
  };
}

export async function startAuthenticatedChromeBridge({ tab, port = 8931 } = {}) {
  if (!tab?.screenshot || !tab?.playwright || !tab?.cua) {
    throw new TypeError("A controllable Chrome tab is required.");
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new RangeError("port must be an integer between 1 and 65535.");
  }

  const queue = [];
  let wake;
  let stopped = false;
  let mouse = { x: 750, y: 400 };
  let verifiedPin = null;

  const enqueue = (name, args) => new Promise((resolve, reject) => {
    queue.push({ name, args, resolve, reject });
    const currentWake = wake;
    wake = undefined;
    currentWake?.();
  });

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", `http://${HOST}`);
      if (url.pathname === "/healthz") {
        sendJson(response, 200, { ok: true, service: "nautilus-authenticated-chrome-bridge" }, false);
        return;
      }
      if (url.pathname === "/shutdown" && request.method === "POST") {
        stopped = true;
        const currentWake = wake;
        wake = undefined;
        currentWake?.();
        sendJson(response, 200, { ok: true }, false);
        setImmediate(() => server.close());
        return;
      }
      if (url.pathname !== "/mcp") {
        sendJson(response, 404, { error: "Not found" }, false);
        return;
      }
      if (request.method === "GET") {
        response.writeHead(405, { Allow: "POST, DELETE" }).end();
        return;
      }
      if (request.method === "DELETE") {
        response.writeHead(200).end();
        return;
      }
      if (request.method !== "POST") {
        response.writeHead(405, { Allow: "POST, DELETE" }).end();
        return;
      }

      const message = await readMessage(request);
      if (message.method === "initialize") {
        sendJson(response, 200, {
          jsonrpc: "2.0",
          id: message.id,
          result: {
            protocolVersion: message.params?.protocolVersion ?? "2025-03-26",
            capabilities: { tools: {} },
            serverInfo: { name: "nautilus-authenticated-chrome-bridge", version: "0.1.0" },
            instructions: "Use only visible screenshots and controls. Choose all geography yourself. The coordinate tool only actuates the visible guess map.",
          },
        });
        return;
      }
      if (message.method === "notifications/initialized" || message.method === "notifications/cancelled") {
        response.writeHead(202).end();
        return;
      }
      if (message.method === "tools/list") {
        sendJson(response, 200, { jsonrpc: "2.0", id: message.id, result: { tools: TOOLS } });
        return;
      }
      if (message.method === "tools/call") {
        const result = await enqueue(message.params?.name, message.params?.arguments ?? {});
        sendJson(response, 200, { jsonrpc: "2.0", id: message.id, result });
        return;
      }
      if (message.id === undefined) {
        response.writeHead(202).end();
        return;
      }
      sendJson(response, 200, {
        jsonrpc: "2.0",
        id: message.id,
        error: { code: -32601, message: "Method not found" },
      });
    } catch (error) {
      if (response.headersSent) response.destroy();
      else sendJson(response, 500, {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32603, message: safeError(error) },
      }, false);
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, HOST, resolve);
  });

  async function execute(name, args) {
    try {
      if (name === "browser_take_screenshot") {
        const image = await tab.screenshot();
        return { content: [{ type: "image", data: Buffer.from(image).toString("base64"), mimeType: "image/png" }] };
      }
      if (name === "browser_mouse_click_xy") {
        verifiedPin = null;
        mouse = { x: args.x, y: args.y };
        if ((args.clickCount ?? 1) > 1) await tab.cua.double_click(mouse);
        else await tab.cua.click({ ...mouse, button: mouseButton(args.button) });
        if (args.delay) await tab.playwright.waitForTimeout(args.delay);
        return textResult("Clicked the visible viewport coordinate.");
      }
      if (name === "browser_mouse_move_xy") {
        mouse = { x: args.x, y: args.y };
        await tab.cua.move(mouse);
        return textResult("Moved the mouse.");
      }
      if (name === "browser_mouse_drag_xy") {
        verifiedPin = null;
        const start = { x: args.startX, y: args.startY };
        const end = { x: args.endX, y: args.endY };
        await tab.cua.drag({ path: [start, midpoint(start, end), end] });
        mouse = end;
        return textResult("Dragged the visible viewport.");
      }
      if (name === "browser_mouse_wheel") {
        await tab.cua.scroll({ x: mouse.x, y: mouse.y, scrollX: args.deltaX, scrollY: args.deltaY });
        return textResult("Scrolled the visible viewport.");
      }
      if (name === "browser_press_key") {
        await tab.cua.keypress({ keys: [normalizeKey(args.key)] });
        return textResult("Pressed the key.");
      }
      if (name === "openguessr_place_guess") {
        const payload = await placeGuess(Number(args.latitude), Number(args.longitude));
        return payloadResult(payload);
      }
      if (name === "openguessr_get_state") return payloadResult(await getState());
      if (name === "openguessr_submit_guess") return payloadResult(await submitGuess());
      if (name === "openguessr_continue") return payloadResult(await continueRound());
      return { ...textResult(`MCP tool is not allowed: ${String(name)}`), isError: true };
    } catch (error) {
      return { ...textResult(safeError(error)), isError: true };
    }
  }

  async function calibration() {
    const map = tab.playwright.locator("#map");
    if (!await map.isVisible()) return null;
    return map.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const tile = element.querySelector("img.leaflet-tile");
      if (!tile) return null;
      const source = new URL(tile.getAttribute("src"), location.href);
      const translate = (value) => {
        const match = String(value ?? "").match(/translate3d\((-?[\d.]+)px,\s*(-?[\d.]+)px/i);
        return match ? { x: Number(match[1]), y: Number(match[2]) } : { x: 0, y: 0 };
      };
      const pane = translate(element.querySelector(".leaflet-map-pane")?.getAttribute("style"));
      const tilePosition = translate(tile.getAttribute("style"));
      return {
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        pane,
        tile: {
          x: Number(source.searchParams.get("x")),
          y: Number(source.searchParams.get("y")),
          z: Number(source.searchParams.get("z")),
          left: tilePosition.x,
          top: tilePosition.y,
        },
      };
    }, undefined, { timeoutMs: 5000 });
  }

  async function centerTarget(latitude, longitude) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const current = await calibration();
      if (!current) throw new Error("The visible OpenGuessr guess map is not ready.");
      const target = targetInCalibration(current, latitude, longitude);
      const wantedX = current.rect.width / 2 - target.x;
      const wantedY = current.rect.height / 2 - target.y;
      if (Math.abs(wantedX) < 4 && Math.abs(wantedY) < 4) return;
      const deltaX = clamp(wantedX, -(current.rect.width / 2 - 24), current.rect.width / 2 - 24);
      const deltaY = clamp(wantedY, -(current.rect.height / 2 - 24), current.rect.height / 2 - 24);
      const start = {
        x: current.rect.x + current.rect.width / 2,
        y: current.rect.y + current.rect.height / 2,
      };
      const end = { x: start.x + deltaX, y: start.y + deltaY };
      await tab.cua.drag({ path: [start, midpoint(start, end), end] });
      mouse = end;
      await tab.playwright.waitForTimeout(300);
    }
    throw new Error("The visible guess map could not be centered on the chosen coordinates.");
  }

  async function placeGuess(latitude, longitude) {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
        !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return { ok: false, error: "Latitude or longitude is outside the valid coordinate range." };
    }
    let current = await calibration();
    if (!current) return { ok: false, error: "Open the visible OpenGuessr guess map first, then retry." };
    mouse = {
      x: current.rect.x + current.rect.width / 2,
      y: current.rect.y + current.rect.height / 2,
    };
    await tab.cua.move(mouse);
    await tab.playwright.waitForTimeout(400);
    await centerTarget(latitude, longitude);

    for (let index = 0; index < 4; index += 1) {
      current = await calibration();
      if (!current || current.tile.z >= 6) break;
      const zoomIn = tab.playwright.locator("#map .leaflet-control-zoom-in");
      if (!await zoomIn.isVisible() || !await zoomIn.isEnabled()) break;
      await zoomIn.click({ timeoutMs: 5000 });
      await tab.playwright.waitForTimeout(250);
    }
    await centerTarget(latitude, longitude);
    current = await calibration();
    if (!current) return { ok: false, error: "The visible guess map disappeared." };
    const target = targetInCalibration(current, latitude, longitude);
    if (target.x < 4 || target.y < 4 ||
        target.x > current.rect.width - 4 || target.y > current.rect.height - 4) {
      return { ok: false, error: "The chosen coordinates remain outside the visible guess map." };
    }
    mouse = { x: current.rect.x + target.x, y: current.rect.y + target.y };
    await tab.cua.click({ ...mouse, button: 1 });
    await tab.playwright.waitForTimeout(350);

    const markers = await tab.playwright.locator("#map .leaflet-marker-icon").all();
    let markerVisible = false;
    for (const marker of markers) {
      if (await marker.isVisible()) {
        markerVisible = true;
        break;
      }
    }
    if (!markerVisible) {
      verifiedPin = null;
      return { ok: false, error: "OpenGuessr did not render a marker at the requested coordinates." };
    }
    verifiedPin = { latitude, longitude };
    return { ok: true, action: "place-guess", verified: true, pin: verifiedPin };
  }

  async function getState() {
    const guess = await findControl(GUESS_TEXT);
    const next = await findControl(NEXT_TEXT);
    return {
      ok: true,
      action: "get-state",
      controls: { guess: Boolean(guess), continue: Boolean(next) },
      resultVisible: Boolean(next),
      verifiedPin,
    };
  }

  async function submitGuess() {
    if (!verifiedPin) {
      return { ok: false, error: "A verified pin from openguessr_place_guess is required before submission." };
    }
    const control = await findControl(GUESS_TEXT);
    if (!control) return { ok: false, error: "The visible OpenGuessr Guess control was not found." };
    const pin = verifiedPin;
    await control.click({ timeoutMs: 5000 });
    verifiedPin = null;
    await tab.playwright.waitForTimeout(250);
    return { ok: true, action: "submit-guess", submitted: true, pin };
  }

  async function continueRound() {
    const control = await findControl(NEXT_TEXT);
    if (!control) return { ok: false, error: "The visible OpenGuessr Continue control was not found." };
    await control.click({ timeoutMs: 5000 });
    verifiedPin = null;
    await tab.playwright.waitForTimeout(250);
    return { ok: true, action: "continue", continued: true };
  }

  async function findControl(pattern) {
    const controls = tab.playwright.locator("button, [role='button'], input[type='submit'], input[type='button'], a");
    const metadata = await controls.evaluateAll((elements) => elements.map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const label = element.tagName === "INPUT"
          ? String(element.value || element.getAttribute("aria-label") || "")
          : String(element.getAttribute("aria-label") || element.getAttribute("title") || element.textContent || "");
        return {
          label: label.trim(),
          visible: rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 &&
            rect.top < innerHeight && rect.left < innerWidth &&
            style.display !== "none" && style.visibility !== "hidden",
          disabled: Boolean(element.disabled) || element.getAttribute("aria-disabled") === "true",
        };
      }), undefined, { timeoutMs: 5000 });
    const index = metadata.findIndex((meta) =>
      meta.visible && !meta.disabled && pattern.test(meta.label));
    return index === -1 ? null : controls.nth(index);
  }

  return {
    url: `http://${HOST}:${port}/mcp`,
    shutdownUrl: `http://${HOST}:${port}/shutdown`,
    async run() {
      while (!stopped) {
        if (!queue.length) {
          await new Promise((resolve) => { wake = resolve; });
          continue;
        }
        const job = queue.shift();
        try {
          job.resolve(await execute(job.name, job.args));
        } catch (error) {
          job.reject(error);
        }
      }
    },
  };
}

function tool(name, title, description, properties, required = [], readOnly = false) {
  return {
    name,
    title,
    description,
    inputSchema: { type: "object", additionalProperties: false, properties, required },
    ...(readOnly ? { annotations: { readOnlyHint: true } } : {}),
  };
}

async function readMessage(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new Error("MCP request body exceeds 1 MiB.");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(response, status, value, includeSession = true) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    ...(includeSession ? { "Mcp-Session-Id": SESSION_ID } : {}),
  });
  response.end(body);
}

function payloadResult(payload) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload) }],
    ...(payload.ok ? {} : { isError: true }),
  };
}

function textResult(text) {
  return { content: [{ type: "text", text }] };
}

function midpoint(start, end) {
  return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
}

function mouseButton(button) {
  if (button === "right") return 3;
  if (button === "middle") return 2;
  return 1;
}

function normalizeKey(key) {
  const aliases = { " ": "SPACE", Escape: "ESC", Esc: "ESC" };
  return aliases[key] ?? String(key).toUpperCase();
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function safeError(error) {
  return error instanceof Error ? error.message : String(error);
}
