import test from "node:test";
import assert from "node:assert/strict";
import { countryForCoordinate, isPredictionInCountry } from "../scripts/lib/country-accuracy.mjs";

test("country accuracy resolves submitted pins against offline country boundaries", () => {
  assert.equal(countryForCoordinate({ lat: 44.8747, lng: 13.8493 }), "191");
  assert.equal(isPredictionInCountry({ lat: 44.8747, lng: 13.8493 }, "Croatia"), true);
  assert.equal(isPredictionInCountry({ lat: 52.52, lng: 13.405 }, "Croatia"), false);
});

test("ocean and missing pins remain distinct", () => {
  assert.equal(countryForCoordinate({ lat: 0, lng: 0 }), null);
  assert.equal(isPredictionInCountry({ lat: 0, lng: 0 }, "Spain"), false);
  assert.equal(isPredictionInCountry(null, "Spain"), null);
});
