import assert from "node:assert/strict";
import test from "node:test";

import {
  projectMercator,
  targetInCalibration,
} from "../integration/authenticated-chrome-bridge.mjs";

test("projectMercator maps the equator and prime meridian to the world center", () => {
  assert.deepEqual(projectMercator(0, 0, 2), {
    x: 512,
    y: 512,
    worldSize: 1024,
  });
});

test("targetInCalibration converts a chosen coordinate into visible Leaflet pixels", () => {
  const calibration = {
    rect: { x: 1146, y: 487.6, width: 304, height: 150 },
    pane: { x: 0, y: 75 },
    tile: { x: 1, y: 1, z: 2, left: -135, top: -191 },
  };

  assert.deepEqual(targetInCalibration(calibration, 0, 0), { x: 121, y: 140 });
});
