import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import { feature } from "topojson-client";
import countries50m from "world-atlas/countries-50m.json" with { type: "json" };

const COUNTRY_NUMERIC_IDS = new Map(Object.entries({
  Austria: "040",
  Belgium: "056",
  Bulgaria: "100",
  Croatia: "191",
  Czechia: "203",
  Denmark: "208",
  Estonia: "233",
  Finland: "246",
  France: "250",
  Germany: "276",
  Greece: "300",
  Hungary: "348",
  Ireland: "372",
  Italy: "380",
  Latvia: "428",
  Lithuania: "440",
  Netherlands: "528",
  Norway: "578",
  Poland: "616",
  Portugal: "620",
  Romania: "642",
  Slovakia: "703",
  Slovenia: "705",
  Spain: "724",
  Sweden: "752",
}));

const COUNTRY_FEATURES = feature(
  countries50m,
  countries50m.objects.countries,
).features;

export function countryForCoordinate(coordinate) {
  if (!isCoordinate(coordinate)) return null;
  const candidate = point([Number(coordinate.lng), Number(coordinate.lat)]);
  const match = COUNTRY_FEATURES.find((country) => booleanPointInPolygon(candidate, country));
  return match ? String(match.id).padStart(3, "0") : null;
}

export function isPredictionInCountry(coordinate, countryName) {
  if (!isCoordinate(coordinate)) return null;
  const expected = COUNTRY_NUMERIC_IDS.get(countryName);
  if (!expected) return null;
  return countryForCoordinate(coordinate) === expected;
}

function isCoordinate(value) {
  return Number.isFinite(value?.lat) && value.lat >= -90 && value.lat <= 90 &&
    Number.isFinite(value?.lng) && value.lng >= -180 && value.lng <= 180;
}
