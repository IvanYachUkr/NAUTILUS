import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCanonicalStreetViewUrl,
  parseGoogleMapsStreetViewUrl,
} from "../shared/google-maps-url.js";

test("parses an official Google Maps panorama URL", () => {
  const parsed = parseGoogleMapsStreetViewUrl(
    "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=48.85866,2.29483&heading=225&pitch=8&fov=78",
  );
  assert.deepEqual(parsed.viewpoint, { lat: 48.85866, lng: 2.29483 });
  assert.equal(parsed.heading, 225);
  assert.equal(parsed.pitch, 8);
  assert.equal(parsed.fov, 78);
  assert.equal(parsed.coordinateSource, "query:viewpoint");
});

test("parses a copied desktop Street View URL and converts tilt to pitch", () => {
  const parsed = parseGoogleMapsStreetViewUrl(
    "https://www.google.com/maps/@48.85866,2.29483,3a,75y,225h,82t/data=!3m6!1e1",
  );
  assert.deepEqual(parsed.viewpoint, { lat: 48.85866, lng: 2.29483 });
  assert.equal(parsed.heading, 225);
  assert.equal(parsed.pitch, 8);
  assert.equal(parsed.fov, 75);
});

test("rejects shortened links because coordinates are not contained in them", () => {
  assert.throws(
    () => parseGoogleMapsStreetViewUrl("https://maps.app.goo.gl/example"),
    /do not contain coordinates/i,
  );
});

test("rejects an ordinary map URL when Street View is required", () => {
  assert.throws(
    () =>
      parseGoogleMapsStreetViewUrl(
        "https://www.google.com/maps/@48.85866,2.29483,17z",
      ),
    /does not appear to be a Street View/i,
  );
});

test("canonical URL round-trips camera state", () => {
  const url = buildCanonicalStreetViewUrl({
    viewpoint: { lat: 52.51651, lng: 13.37812 },
    heading: 265,
    pitch: 3,
    fov: 76,
  });
  const parsed = parseGoogleMapsStreetViewUrl(url);
  assert.deepEqual(parsed.viewpoint, { lat: 52.51651, lng: 13.37812 });
  assert.equal(parsed.heading, 265);
  assert.equal(parsed.pitch, 3);
  assert.equal(parsed.fov, 76);
});
