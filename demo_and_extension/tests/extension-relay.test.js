import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const relaySource = await readFile(
  new URL(
    "../extension/openguessr-research-recorder/content/openguessr-relay.js",
    import.meta.url,
  ),
  "utf8",
);

test("the OpenGuessr relay detects an NMPZ round and derives its fixed Street View camera", async () => {
  const sent = [];
  let runtimeListener = null;

  class FakeElement {
    constructor(tagName, attributes = {}, textContent = "") {
      this.tagName = tagName.toUpperCase();
      this.attributes = attributes;
      this.textContent = textContent;
      this.style = { backgroundImage: "" };
    }
    getAttribute(name) {
      return this.attributes[name] ?? null;
    }
    getBoundingClientRect() {
      return { width: 120, height: 40 };
    }
  }
  class FakeInputElement extends FakeElement {}

  const guessButton = new FakeElement("button", {}, "Guess");
  const frame = new FakeElement("iframe", {
    src: "https://www.google.com/maps/embed/v1/streetview?location=48.8521298%2C2.3696389&heading=347.03&pitch=-4.79&fov=75&pano=3LHk4xqsT_FzWEB_TgLG-A",
  });
  const document = {
    title: "OpenGuessr NMPZ",
    body: { innerText: "NMPZ · Round 2 / 8" },
    images: { length: 0 },
    querySelectorAll(selector) {
      if (selector.includes("button")) return [guessButton];
      if (selector.includes("iframe[src]")) return [frame];
      if (selector === "[style*='background']") return [];
      if (selector === "iframe") return [frame];
      return [];
    },
  };
  const location = new URL("https://openguessr.com/competitions/example");
  const window = {
    addEventListener() {},
  };
  window.window = window;

  const context = {
    URL,
    decodeURIComponent,
    encodeURIComponent,
    Date,
    Math,
    Number,
    Object,
    String,
    RegExp,
    JSON,
    Element: FakeElement,
    HTMLInputElement: FakeInputElement,
    document,
    location: {
      href: location.href,
      pathname: location.pathname,
    },
    window,
    getComputedStyle() {
      return { display: "block", visibility: "visible" };
    },
    chrome: {
      runtime: {
        onMessage: {
          addListener(listener) {
            runtimeListener = listener;
          },
        },
        async sendMessage(message) {
          sent.push(message);
          return { ok: true };
        },
      },
    },
    queueMicrotask(callback) {
      callback();
    },
    setInterval() {
      return 1;
    },
    clearInterval() {},
  };

  vm.runInNewContext(relaySource, context, {
    filename: "openguessr-relay.js",
  });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(typeof runtimeListener, "function");
  const probeMessage = sent.find(
    (message) => message.type === "OGRR_EVENT" && message.event === "dom-probe",
  );
  assert.ok(probeMessage);
  assert.equal(probeMessage.payload.roundLikelyActive, true);
  assert.equal(probeMessage.payload.modeHint, "nmpz");
  assert.equal(probeMessage.payload.roundNumber, 2);
  assert.equal(probeMessage.payload.roundTotal, 8);
  assert.equal(probeMessage.payload.primaryView.lat, 48.8521298);
  assert.equal(probeMessage.payload.primaryView.lng, 2.3696389);
  assert.equal(probeMessage.payload.primaryView.heading, 347.03);
  assert.equal(probeMessage.payload.primaryView.pitch, -4.79);
  assert.equal(probeMessage.payload.primaryView.fov, 75);
  assert.equal(probeMessage.payload.primaryView.panoId, "3LHk4xqsT_FzWEB_TgLG-A");
});

test("the OpenGuessr relay recognizes a competition start dialog without treating it as a live round", async () => {
  const sent = [];

  class FakeElement {
    constructor(tagName, attributes = {}, textContent = "") {
      this.tagName = tagName.toUpperCase();
      this.attributes = attributes;
      this.textContent = textContent;
      this.innerText = textContent;
      this.style = { backgroundImage: "" };
    }
    getAttribute(name) { return this.attributes[name] ?? null; }
    getBoundingClientRect() { return { width: 320, height: 120 }; }
  }
  class FakeInputElement extends FakeElement {}

  const startButton = new FakeElement("button", {}, "Start competition");
  const dialog = new FakeElement(
    "div",
    { role: "dialog", "aria-modal": "true" },
    "European Evaluation Easy · 8 rounds · NMPZ · Start competition",
  );
  const document = {
    title: "Competitions - OpenGuessr",
    body: { innerText: "European Evaluation Easy Competition · 8 rounds · NMPZ" },
    images: { length: 0 },
    documentElement: null,
    querySelectorAll(selector) {
      if (selector.includes("button")) return [startButton];
      if (selector.includes("dialog") || selector.includes("aria-modal")) return [dialog];
      if (selector.includes("iframe[src]")) return [];
      if (selector === "[style*='background']") return [];
      if (selector === "iframe") return [];
      return [];
    },
  };
  const location = new URL("https://openguessr.com/competitions");
  const window = { addEventListener() {} };
  window.window = window;

  const context = {
    URL,
    decodeURIComponent,
    encodeURIComponent,
    Date,
    Math,
    Number,
    Object,
    String,
    RegExp,
    JSON,
    Element: FakeElement,
    HTMLInputElement: FakeInputElement,
    document,
    location: { href: location.href, pathname: location.pathname },
    window,
    getComputedStyle() { return { display: "block", visibility: "visible" }; },
    chrome: {
      runtime: {
        onMessage: { addListener() {} },
        async sendMessage(message) { sent.push(message); return { ok: true }; },
      },
    },
    queueMicrotask(callback) { callback(); },
    setInterval() { return 1; },
    clearInterval() {},
  };

  vm.runInNewContext(relaySource, context, { filename: "openguessr-relay.js" });
  await new Promise((resolve) => setImmediate(resolve));

  const probeMessage = sent.find(
    (message) => message.type === "OGRR_EVENT" && message.event === "dom-probe",
  );
  assert.ok(probeMessage);
  assert.equal(probeMessage.payload.competitionStartPromptVisible, true);
  assert.equal(probeMessage.payload.pageState, "competition-ready");
  assert.equal(probeMessage.payload.roundLikelyActive, false);
});

test("completed competition UI offers Done & disarm and sends the dedicated reset action", async () => {
  assert.match(relaySource, /Done & disarm/);
  assert.match(relaySource, /OGRR_DONE_DISARM_TAB/);
});


test("the Arm overlay is stable across UI heartbeats so draft inputs are not reset", () => {
  assert.match(relaySource, /let overlayViewKey = null/);
  assert.match(relaySource, /if \(overlayViewKey === "prompt"\) return/);
  assert.match(relaySource, /overlayViewKey = "prompt"/);
});

test("status cards are not recreated by an identical heartbeat", () => {
  assert.match(relaySource, /const viewKey = JSON\.stringify\(\{ tone, title, body, meta, actions \}\)/);
  assert.match(relaySource, /if \(overlayViewKey === viewKey\) return/);
  assert.match(relaySource, /overlayViewKey = null;/);
});

test("armed in-page status has no second Start confirmation and always offers Stop", () => {
  assert.doesNotMatch(relaySource, /I started it/);
  assert.doesNotMatch(relaySource, /id: "confirm-start"/);
  assert.match(relaySource, /title: "ARMED"/);
  assert.match(relaySource, /Ready\. Press Start in OpenGuessr; no recorder confirmation is required\./);
  assert.match(relaySource, /\{ id: "stop", label: "Stop recording" \}/);
});

test("interactive recording keeps the compact progress overlay visible", () => {
  assert.doesNotMatch(relaySource, /Keep research instrumentation out of the continuously recorded Street/);
  assert.match(relaySource, /REC · \$\{roundLabel\}/);
  assert.match(relaySource, /SAVED · Round \$\{roundNumber\}/);
  assert.match(relaySource, /compact-status/);
});


test("interactive Arm stores setup in-page and requests exactly one toolbar authorization click", () => {
  assert.match(relaySource, /OGRR_ARM_INTERACTIVE_TAB/);
  assert.match(relaySource, /AUTHORIZE VIDEO/);
  assert.match(relaySource, /Click the recorder extension icon once/);
  assert.doesNotMatch(relaySource, /OGRR_OPEN_POPUP/);
  assert.doesNotMatch(relaySource, /Opening video controls/);
  assert.doesNotMatch(relaySource, /Not armed yet — use popup/);
  assert.doesNotMatch(relaySource, /Prepare video \+ arm/);
});
