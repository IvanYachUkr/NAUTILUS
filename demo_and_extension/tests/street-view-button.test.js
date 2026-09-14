import assert from "node:assert/strict";
import test from "node:test";
import { shellMarkup } from "../src/app.js";
import { readFile } from "node:fs/promises";
import { walkHereUrl } from "../src/street-view.js";

test("the location shell renders a direct Google Maps walk control", () => {
  const markup = shellMarkup([]);
  assert.match(markup, /data-walk-here[^>]*aria-label="Open this location in Google Maps"/);
  assert.match(markup, />\s*<span>Walk here<\/span>/);
  assert.doesNotMatch(markup, /data-street-view-dialog/);
});

test("Walk here opens a keyless Google Maps panorama URL", async () => {
  const caseItem = {
    startingView: { lat: 52.0907, lng: 5.1214 },
  };

  const url = new URL(walkHereUrl(caseItem));
  const source = await readFile(new URL("../src/street-view.js", import.meta.url), "utf8");
  assert.equal(url.origin, "https://www.google.com");
  assert.equal(url.searchParams.get("map_action"), "pano");
  assert.equal(url.searchParams.has("key"), false);
  assert.match(source, /window\.open\(externalUrl, "_blank", "noopener,noreferrer"\)/);
});
