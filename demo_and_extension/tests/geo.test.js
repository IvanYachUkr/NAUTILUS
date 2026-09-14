import test from "node:test";
import assert from "node:assert/strict";
import {
  buildStreetViewUrl,
  errorBand,
  formatDistance,
  predictionLocationLabel,
  haversineKm,
} from "../src/geo.js";

test("haversineKm returns zero for identical points", () => {
  assert.equal(haversineKm({ lat: 48.85837, lng: 2.294481 }, { lat: 48.85837, lng: 2.294481 }), 0);
});

test("haversineKm is plausible for Paris to Berlin", () => {
  const distance = haversineKm(
    { lat: 48.8566, lng: 2.3522 },
    { lat: 52.52, lng: 13.405 },
  );
  assert.ok(distance > 870 && distance < 890, `Unexpected distance: ${distance}`);
});

test("formatDistance changes precision by scale", () => {
  assert.equal(formatDistance(0.042), "42 m");
  assert.equal(formatDistance(2.345), "2.35 km");
  assert.equal(formatDistance(42.34), "42.3 km");
  assert.equal(formatDistance(432.1), "432 km");
});

test("predictionLocationLabel prefers a place name and falls back to exact coordinates", () => {
  assert.equal(
    predictionLocationLabel({ lat: 50.89700386777002, lng: 14.831542968750002, label: "Zittau, Germany" }),
    "Zittau, Germany",
  );
  assert.equal(
    predictionLocationLabel({ lat: 50.89700386777002, lng: 14.831542968750002, label: "Recorded OpenGuessr prediction" }),
    "50.89700, 14.83154",
  );
});

test("errorBand follows the evaluation distance buckets", () => {
  assert.equal(errorBand(0.02), "exact");
  assert.equal(errorBand(0.2), "local");
  assert.equal(errorBand(12), "regional");
  assert.equal(errorBand(120), "country");
  assert.equal(errorBand(500), "miss");
});

test("buildStreetViewUrl creates a panorama deep link", () => {
  const url = new URL(
    buildStreetViewUrl({
      viewpoint: { lat: 48.85866, lng: 2.29483 },
      heading: -45,
      pitch: 8,
      fov: 78,
    }),
  );

  assert.equal(url.hostname, "www.google.com");
  assert.equal(url.searchParams.get("api"), "1");
  assert.equal(url.searchParams.get("map_action"), "pano");
  assert.equal(url.searchParams.get("viewpoint"), "48.85866,2.29483");
  assert.equal(url.searchParams.get("heading"), "315");
  assert.equal(url.searchParams.get("pitch"), "8");
  assert.equal(url.searchParams.get("fov"), "78");
});
