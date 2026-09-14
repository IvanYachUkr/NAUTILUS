import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const hookSource = await readFile(
  new URL(
    "../extension/openguessr-research-recorder/page/openguessr-hook.js",
    import.meta.url,
  ),
  "utf8",
);

test("the OpenGuessr page hook initializes on the root page without a competition query", () => {
  const messages = runHook("https://openguessr.com/");
  assert.equal(messages[0]?.event, "page-context");
  assert.equal(messages[0]?.payload?.competitionHint, null);
});

test("the OpenGuessr page hook derives competition hints from paths and queries", () => {
  const pathMessages = runHook("https://openguessr.com/competitions/server-competition-123");
  assert.equal(
    pathMessages[0]?.payload?.competitionHint,
    "server-competition-123",
  );

  const queryMessages = runHook(
    "https://openguessr.com/play?competition=server-competition-456",
  );
  assert.equal(
    queryMessages[0]?.payload?.competitionHint,
    "server-competition-456",
  );
});

function runHook(href) {
  const emitted = [];
  const url = new URL(href);

  class FakeMutationObserver {
    observe() {}
  }

  class FakeHtmlInputElement {}

  const window = {
    fetch: undefined,
    XMLHttpRequest: undefined,
    WebSocket: undefined,
    addEventListener() {},
    postMessage(message) {
      emitted.push(message);
    },
  };

  const context = {
    URL,
    URLSearchParams,
    Request: class {},
    FormData: class {},
    Blob: class {},
    ArrayBuffer,
    Date,
    Math,
    Number,
    Object,
    String,
    RegExp,
    WeakSet,
    MutationObserver: FakeMutationObserver,
    HTMLInputElement: FakeHtmlInputElement,
    Element: class {},
    navigator: {},
    document: {
      title: "OpenGuessr",
      body: { innerText: "" },
      querySelectorAll() {
        return [];
      },
    },
    history: {
      pushState() {},
      replaceState() {},
    },
    location: {
      href: url.href,
      pathname: url.pathname,
      search: url.search,
    },
    window,
    queueMicrotask() {},
    setInterval() {
      return 1;
    },
    setTimeout(callback) {
      callback();
      return 1;
    },
    clearInterval() {},
    clearTimeout() {},
  };

  vm.runInNewContext(hookSource, context, {
    filename: "openguessr-hook.js",
  });

  return emitted.filter(
    (message) =>
      message?.channel === "openguessr-research-recorder" &&
      message?.source === "openguessr-page",
  );
}

test("the OpenGuessr page hook captures the Leaflet guess-map pin when Guess is pressed", () => {
  const emitted = [];
  const listeners = new Map();
  const url = new URL("https://openguessr.com/competitions/example");

  class FakeElement {
    constructor(label = "") {
      this.textContent = label;
      this.id = "";
      this.className = "";
    }
    closest() { return this; }
    getAttribute() { return null; }
    getBoundingClientRect() { return { width: 400, height: 300 }; }
  }
  class FakeHtmlInputElement extends FakeElement {}
  class FakeMutationObserver { observe() {} }
  class FakeMap {
    fire() { return this; }
    getContainer() {
      const el = new FakeElement();
      el.id = "guess-map";
      el.className = "leaflet-container";
      return el;
    }
  }

  const window = {
    fetch: undefined,
    XMLHttpRequest: undefined,
    WebSocket: undefined,
    L: { Map: FakeMap },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    postMessage(message) {
      emitted.push(message);
    },
  };

  const context = {
    URL,
    URLSearchParams,
    Request: class {},
    FormData: class {},
    Blob: class {},
    ArrayBuffer,
    Date,
    Math,
    Number,
    Object,
    String,
    RegExp,
    WeakSet,
    MutationObserver: FakeMutationObserver,
    HTMLInputElement: FakeHtmlInputElement,
    Element: FakeElement,
    navigator: {},
    document: {
      title: "OpenGuessr",
      body: { innerText: "" },
      querySelectorAll() { return []; },
    },
    history: { pushState() {}, replaceState() {} },
    location: { href: url.href, pathname: url.pathname, search: url.search },
    window,
    queueMicrotask() {},
    setInterval() { return 1; },
    setTimeout(callback) { callback(); return 1; },
    clearInterval() {},
    clearTimeout() {},
  };

  vm.runInNewContext(hookSource, context, { filename: "openguessr-hook.js" });

  const map = new FakeMap();
  map.fire("click", { latlng: { lat: 61.123456, lng: 6.654321 } });
  listeners.get("click")?.({ target: new FakeElement("Guess") });

  const messages = emitted.filter(
    (message) =>
      message?.channel === "openguessr-research-recorder" &&
      message?.source === "openguessr-page",
  );
  const candidate = messages.find((message) => message.event === "prediction-candidate");

  assert.ok(candidate);
  assert.equal(candidate.payload.lat, 61.123456);
  assert.equal(candidate.payload.lng, 6.654321);
  assert.equal(candidate.payload.transport, "leaflet-map-click");
  assert.equal(candidate.payload.trigger, "guess-control");
});

test("Leaflet pin is recovered from the result transition even when no Guess click is observable", () => {
  const emitted = [];
  let mutationCallback = null;
  let controls = [];
  const url = new URL("https://openguessr.com/");

  class FakeElement {
    constructor(label = "") {
      this.textContent = label;
      this.id = "";
      this.className = "";
    }
    closest() { return this; }
    getAttribute() { return null; }
    getBoundingClientRect() { return { width: 500, height: 320 }; }
  }
  class FakeHtmlInputElement extends FakeElement {}
  class FakeMutationObserver {
    constructor(callback) { mutationCallback = callback; }
    observe() {}
  }
  class FakeMap {
    fire() { return this; }
    getContainer() {
      const el = new FakeElement();
      el.id = "guess-map";
      el.className = "leaflet-container";
      return el;
    }
  }

  const window = {
    fetch: undefined,
    XMLHttpRequest: undefined,
    WebSocket: undefined,
    L: { Map: FakeMap },
    addEventListener() {},
    postMessage(message) { emitted.push(message); },
  };
  const context = {
    URL, URLSearchParams,
    Request: class {}, FormData: class {}, Blob: class {}, ArrayBuffer,
    Date, Math, Number, Object, String, RegExp, WeakSet,
    MutationObserver: FakeMutationObserver,
    HTMLInputElement: FakeHtmlInputElement,
    Element: FakeElement,
    navigator: {},
    document: {
      title: "OpenGuessr",
      body: { innerText: "" },
      querySelectorAll() { return controls; },
    },
    history: { pushState() {}, replaceState() {} },
    location: { href: url.href, pathname: url.pathname, search: url.search },
    window,
    queueMicrotask() {},
    setInterval() { return 1; },
    setTimeout(callback) { callback(); return 1; },
    clearInterval() {}, clearTimeout() {},
  };

  vm.runInNewContext(hookSource, context, { filename: "openguessr-hook.js" });
  new FakeMap().fire("click", { latlng: { lat: 60.95, lng: 7.01 } });

  controls = [new FakeElement("Continue")];
  context.document.body.innerText = "Round result";
  mutationCallback?.();

  const messages = emitted.filter((message) => message?.source === "openguessr-page");
  const candidateIndex = messages.findIndex((message) => message.event === "prediction-candidate");
  const resultIndex = messages.findIndex((message) => message.event === "result-visible");
  assert.ok(candidateIndex >= 0);
  assert.ok(resultIndex > candidateIndex);
  assert.equal(messages[candidateIndex].payload.lat, 60.95);
  assert.equal(messages[candidateIndex].payload.lng, 7.01);
  assert.equal(messages[candidateIndex].payload.trigger, "result-visible");
});

test("the OpenGuessr page hook emits competition-start-intent for the real Start control", () => {
  const emitted = [];
  const listeners = new Map();
  const url = new URL("https://openguessr.com/competitions/example");

  class FakeElement {
    constructor(label = "") { this.textContent = label; }
    closest() { return this; }
    getAttribute() { return null; }
  }
  class FakeHtmlInputElement extends FakeElement {}
  class FakeMutationObserver { observe() {} }

  const window = {
    fetch: undefined,
    XMLHttpRequest: undefined,
    WebSocket: undefined,
    addEventListener(type, listener) { listeners.set(type, listener); },
    postMessage(message) { emitted.push(message); },
  };
  const context = {
    URL,
    URLSearchParams,
    Request: class {},
    FormData: class {},
    Blob: class {},
    ArrayBuffer,
    Date,
    Math,
    Number,
    Object,
    String,
    RegExp,
    WeakSet,
    MutationObserver: FakeMutationObserver,
    HTMLInputElement: FakeHtmlInputElement,
    Element: FakeElement,
    navigator: {},
    document: {
      title: "OpenGuessr",
      body: { innerText: "Competition ready" },
      querySelectorAll() { return []; },
    },
    history: { pushState() {}, replaceState() {} },
    location: { href: url.href, pathname: url.pathname, search: url.search },
    window,
    queueMicrotask() {},
    setInterval() { return 1; },
    setTimeout(callback) { callback(); return 1; },
    clearInterval() {},
    clearTimeout() {},
  };

  vm.runInNewContext(hookSource, context, { filename: "openguessr-hook.js" });
  const startButton = new FakeElement("Start competition");
  listeners.get("click")?.({ target: startButton });

  const messages = emitted.filter(
    (message) => message?.channel === "openguessr-research-recorder",
  );
  const start = messages.find((message) => message.event === "competition-start-intent");
  assert.ok(start);
  assert.equal(start.payload.label, "Start competition");
});

test("the MCP page adapter places an exact Leaflet pin and submits only after verification", async () => {
  const harness = createMcpHookHarness();
  const map = new harness.FakeMap();
  map.fire("load");

  const placed = await harness.window.__NAUTILUS_OPENGUESSR_MCP__.command({
    action: "place-guess",
    latitude: 48.8566,
    longitude: 2.3522,
  });
  const submitted = await harness.window.__NAUTILUS_OPENGUESSR_MCP__.command({
    action: "submit-guess",
  });

  assert.deepEqual(plain(placed), {
    ok: true,
    action: "place-guess",
    verified: true,
    pin: { latitude: 48.8566, longitude: 2.3522 },
  });
  assert.deepEqual(plain(submitted), {
    ok: true,
    action: "submit-guess",
    submitted: true,
    pin: { latitude: 48.8566, longitude: 2.3522 },
  });
  assert.equal(harness.guessButton.clickCount, 1);
});

test("the MCP page adapter refuses placement without a visible guess map and refuses an unverified submit", async () => {
  const harness = createMcpHookHarness();

  const placement = await harness.window.__NAUTILUS_OPENGUESSR_MCP__.command({
    action: "place-guess",
    latitude: 35.6895,
    longitude: 139.6917,
  });
  const submission = await harness.window.__NAUTILUS_OPENGUESSR_MCP__.command({
    action: "submit-guess",
  });

  assert.equal(placement.ok, false);
  assert.match(placement.error, /open the openguessr guess map/i);
  assert.equal(submission.ok, false);
  assert.match(submission.error, /verified pin/i);
  assert.equal(harness.guessButton.clickCount, 0);
});

test("the MCP page adapter state omits result text and hidden answer coordinates", async () => {
  const harness = createMcpHookHarness({
    bodyText: "Round result. Correct location: 52.5200, 13.4050.",
  });

  const state = await harness.window.__NAUTILUS_OPENGUESSR_MCP__.command({
    action: "get-state",
  });

  assert.deepEqual(plain(state), {
    ok: true,
    action: "get-state",
    path: "/competitions/example",
    controls: { guess: true, continue: false },
    resultVisible: true,
    verifiedPin: null,
  });
  assert.equal(JSON.stringify(state).includes("52.5200"), false);
  assert.equal(JSON.stringify(state).includes("13.4050"), false);
});

function createMcpHookHarness({ bodyText = "Round in progress" } = {}) {
  const url = new URL("https://openguessr.com/competitions/example");

  class FakeElement {
    constructor(label = "") {
      this.textContent = label;
      this.id = "";
      this.className = "";
      this.disabled = false;
      this.isConnected = true;
      this.clickCount = 0;
    }
    closest() { return this; }
    getAttribute() { return null; }
    getBoundingClientRect() { return { width: 500, height: 320 }; }
    click() { this.clickCount += 1; }
  }
  class FakeHtmlInputElement extends FakeElement {}
  class FakeMutationObserver { observe() {} }
  class FakeMap {
    constructor() {
      this.layers = [];
      this.container = new FakeElement();
      this.container.id = "guess-map";
      this.container.className = "leaflet-container";
    }
    fire(type, data) {
      if (type === "click" && data?.latlng) {
        const point = { lat: data.latlng.lat, lng: data.latlng.lng };
        this.layers = [{ getLatLng: () => point }];
      }
      return this;
    }
    getContainer() { return this.container; }
    eachLayer(callback) { this.layers.forEach(callback); }
  }

  const guessButton = new FakeElement("Guess");
  const window = {
    fetch: undefined,
    XMLHttpRequest: undefined,
    WebSocket: undefined,
    L: {
      Map: FakeMap,
      latLng(latitude, longitude) {
        return { lat: latitude, lng: longitude };
      },
    },
    addEventListener() {},
    postMessage() {},
  };
  const context = {
    URL,
    URLSearchParams,
    Request: class {},
    FormData: class {},
    Blob: class {},
    ArrayBuffer,
    Date,
    Math,
    Number,
    Object,
    String,
    RegExp,
    WeakSet,
    Set,
    MutationObserver: FakeMutationObserver,
    HTMLInputElement: FakeHtmlInputElement,
    Element: FakeElement,
    navigator: {},
    document: {
      title: "OpenGuessr",
      body: { innerText: bodyText },
      querySelectorAll() { return [guessButton]; },
    },
    history: { pushState() {}, replaceState() {} },
    location: { href: url.href, pathname: url.pathname, search: url.search },
    window,
    queueMicrotask(callback) { callback(); },
    setInterval() { return 1; },
    setTimeout(callback) { callback(); return 1; },
    clearInterval() {},
    clearTimeout() {},
  };

  vm.runInNewContext(hookSource, context, { filename: "openguessr-hook.js" });
  return { window, FakeMap, guessButton };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}
