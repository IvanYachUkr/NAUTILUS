const EARTH_RADIUS_KM = 6371.0088;

export function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function haversineKm(a, b) {
  assertCoordinate(a, "first coordinate");
  assertCoordinate(b, "second coordinate");

  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const deltaLat = toRadians(b.lat - a.lat);
  const deltaLng = toRadians(b.lng - a.lng);

  const sinLat = Math.sin(deltaLat / 2);
  const sinLng = Math.sin(deltaLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function assertCoordinate(value, label = "coordinate") {
  if (!value || typeof value !== "object") {
    throw new TypeError(`${label} must be an object with lat and lng.`);
  }

  if (!Number.isFinite(value.lat) || value.lat < -90 || value.lat > 90) {
    throw new RangeError(`${label}.lat must be between -90 and 90.`);
  }

  if (!Number.isFinite(value.lng) || value.lng < -180 || value.lng > 180) {
    throw new RangeError(`${label}.lng must be between -180 and 180.`);
  }
}

export function formatDistance(km) {
  if (!Number.isFinite(km) || km < 0) {
    return "—";
  }

  if (km < 0.1) {
    return `${Math.round(km * 1000)} m`;
  }

  if (km < 10) {
    return `${km.toFixed(2)} km`;
  }

  if (km < 100) {
    return `${km.toFixed(1)} km`;
  }

  return `${Math.round(km).toLocaleString("en-US")} km`;
}

export function errorBand(km) {
  if (km <= 0.025) return "exact";
  if (km <= 0.25) return "local";
  if (km <= 25) return "regional";
  if (km <= 250) return "country";
  return "miss";
}

export function formatCoordinate(point, digits = 5) {
  assertCoordinate(point);
  return `${point.lat.toFixed(digits)}, ${point.lng.toFixed(digits)}`;
}

export function predictionLocationLabel(prediction) {
  assertCoordinate(prediction, "prediction");
  const label = typeof prediction.label === "string" ? prediction.label.trim() : "";

  if (
    label &&
    label !== "Recorded OpenGuessr prediction" &&
    label !== "Recorded prediction"
  ) {
    return label;
  }

  return formatCoordinate(prediction);
}

export function buildStreetViewUrl(view) {
  if (!view || typeof view !== "object") {
    throw new TypeError("Street View configuration is required.");
  }

  const viewpoint = view.viewpoint ?? view;
  assertCoordinate(viewpoint, "Street View viewpoint");

  const url = new URL("https://www.google.com/maps/@");
  url.searchParams.set("api", "1");
  url.searchParams.set("map_action", "pano");
  url.searchParams.set("viewpoint", `${viewpoint.lat},${viewpoint.lng}`);

  if (view.panoId) {
    url.searchParams.set("pano", String(view.panoId));
  }

  if (view.heading !== undefined) {
    const heading = normalizeHeading(view.heading);
    url.searchParams.set("heading", String(heading));
  }

  if (view.pitch !== undefined) {
    if (!Number.isFinite(view.pitch) || view.pitch < -90 || view.pitch > 90) {
      throw new RangeError("Street View pitch must be between -90 and 90.");
    }
    url.searchParams.set("pitch", String(view.pitch));
  }

  if (view.fov !== undefined) {
    if (!Number.isFinite(view.fov) || view.fov < 10 || view.fov > 100) {
      throw new RangeError("Street View fov must be between 10 and 100.");
    }
    url.searchParams.set("fov", String(view.fov));
  }

  return url.toString();
}

export function normalizeHeading(value) {
  if (!Number.isFinite(value)) {
    throw new TypeError("Street View heading must be a finite number.");
  }

  return ((value % 360) + 360) % 360;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
