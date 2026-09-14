const GOOGLE_HOST_PATTERN = /(^|\.)(google\.[a-z.]+|googleapis\.com)$/i;
const SHORT_HOSTS = new Set(["maps.app.goo.gl", "goo.gl"]);

export class GoogleMapsUrlError extends TypeError {
  constructor(message, details = {}) {
    super(message);
    this.name = "GoogleMapsUrlError";
    this.details = details;
  }
}

/**
 * Parse the coordinate and camera state from a full Google Maps Street View URL.
 *
 * Supported forms include:
 * - Maps URLs: ?api=1&map_action=pano&viewpoint=lat,lng
 * - Embed URLs: /maps/embed/v1/streetview?location=lat,lng
 * - Desktop copied URLs: /maps/@lat,lng,3a,75y,120h,90t/...
 * - Legacy URLs that expose coordinates through !3dLAT!4dLNG tokens
 *
 * Shortened maps.app.goo.gl links are deliberately rejected because their
 * coordinates are not present in the link itself and would require a network
 * redirect lookup.
 */
export function parseGoogleMapsStreetViewUrl(
  input,
  { requireStreetView = true } = {},
) {
  const sourceUrl = String(input ?? "").trim();
  if (!sourceUrl) {
    throw new GoogleMapsUrlError("Google Maps URL must be a non-empty string.");
  }

  let url;
  try {
    url = new URL(sourceUrl);
  } catch {
    throw new GoogleMapsUrlError(`Invalid URL: ${sourceUrl}`);
  }

  const hostname = url.hostname.toLowerCase();
  if (SHORT_HOSTS.has(hostname)) {
    throw new GoogleMapsUrlError(
      "Short Google Maps links do not contain coordinates. Open the link in a desktop browser and copy the full address-bar Street View URL instead.",
      { hostname },
    );
  }

  if (!GOOGLE_HOST_PATTERN.test(hostname)) {
    throw new GoogleMapsUrlError(
      `Expected a Google Maps host, received ${hostname}.`,
      { hostname },
    );
  }

  const decoded = safeDecode(`${url.pathname}${url.search}${url.hash}`);
  const camera = parseCamera(url, decoded);
  const coordinate = parseCoordinate(url, decoded);
  const isStreetView = detectStreetView(url, decoded);

  if (!coordinate) {
    throw new GoogleMapsUrlError(
      "No latitude/longitude pair was found in the Google Maps URL.",
      { sourceUrl },
    );
  }

  if (requireStreetView && !isStreetView) {
    throw new GoogleMapsUrlError(
      "The URL contains coordinates but does not appear to be a Street View panorama link. Open Street View first, then copy the full address-bar URL.",
      { sourceUrl },
    );
  }

  const viewpoint = validateCoordinate(coordinate.lat, coordinate.lng);
  const heading = normalizeHeading(camera.heading);
  const pitch = normalizePitch(camera.pitch);
  const fov = normalizeFov(camera.fov);

  return {
    sourceUrl,
    viewpoint,
    coordinateSource: coordinate.source,
    isStreetView,
    ...(heading !== null ? { heading } : {}),
    ...(pitch !== null ? { pitch } : {}),
    ...(fov !== null ? { fov } : {}),
    ...(camera.panoId ? { panoId: camera.panoId } : {}),
    canonicalUrl: buildCanonicalStreetViewUrl({
      viewpoint,
      heading,
      pitch,
      fov,
      panoId: camera.panoId,
    }),
  };
}

export function buildCanonicalStreetViewUrl({
  viewpoint,
  heading,
  pitch,
  fov,
  panoId,
}) {
  const coordinate = validateCoordinate(viewpoint?.lat, viewpoint?.lng);
  const url = new URL("https://www.google.com/maps/@");
  url.searchParams.set("api", "1");
  url.searchParams.set("map_action", "pano");
  url.searchParams.set(
    "viewpoint",
    `${formatNumber(coordinate.lat)},${formatNumber(coordinate.lng)}`,
  );

  if (panoId) url.searchParams.set("pano", String(panoId));

  const normalizedHeading = normalizeHeading(heading);
  const normalizedPitch = normalizePitch(pitch);
  const normalizedFov = normalizeFov(fov);

  if (normalizedHeading !== null) {
    url.searchParams.set("heading", formatNumber(normalizedHeading));
  }
  if (normalizedPitch !== null) {
    url.searchParams.set("pitch", formatNumber(normalizedPitch));
  }
  if (normalizedFov !== null) {
    url.searchParams.set("fov", formatNumber(normalizedFov));
  }

  return url.toString();
}

function parseCoordinate(url, decoded) {
  const queryKeys = [
    "viewpoint",
    "location",
    "cbll",
    "ll",
    "center",
    "query",
    "q",
  ];

  for (const key of queryKeys) {
    const value = url.searchParams.get(key);
    const pair = parseCoordinatePair(value);
    if (pair) return { ...pair, source: `query:${key}` };
  }

  const atMatch = decoded.match(
    /@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)(?:,|\/|$)/,
  );
  if (atMatch) {
    return {
      lat: Number(atMatch[1]),
      lng: Number(atMatch[2]),
      source: "path:@",
    };
  }

  const dataMatch = decoded.match(
    /!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/,
  );
  if (dataMatch) {
    return {
      lat: Number(dataMatch[1]),
      lng: Number(dataMatch[2]),
      source: "path:!3d!4d",
    };
  }

  const alternateDataMatch = decoded.match(
    /!2d(-?\d{1,3}(?:\.\d+)?)!3d(-?\d{1,2}(?:\.\d+)?)/,
  );
  if (alternateDataMatch) {
    return {
      lat: Number(alternateDataMatch[2]),
      lng: Number(alternateDataMatch[1]),
      source: "path:!2d!3d",
    };
  }

  return null;
}

function parseCamera(url, decoded) {
  const camera = {
    heading: firstFinite(
      url.searchParams.get("heading"),
      url.searchParams.get("yaw"),
    ),
    pitch: firstFinite(url.searchParams.get("pitch")),
    fov: firstFinite(url.searchParams.get("fov")),
    panoId:
      url.searchParams.get("pano") ??
      url.searchParams.get("panoid") ??
      url.searchParams.get("panoId") ??
      parsePanoId(decoded),
  };

  const atCamera = decoded.match(
    /@-?\d{1,2}(?:\.\d+)?,-?\d{1,3}(?:\.\d+)?,3a,([^/?#]+)/,
  );

  if (atCamera) {
    const tokens = atCamera[1].split(",");
    for (const token of tokens) {
      const match = token.match(/^(-?\d+(?:\.\d+)?)([a-z])$/i);
      if (!match) continue;
      const value = Number(match[1]);
      const suffix = match[2].toLowerCase();
      if (!Number.isFinite(value)) continue;

      if (suffix === "h" && !Number.isFinite(camera.heading)) {
        camera.heading = value;
      } else if (suffix === "y" && !Number.isFinite(camera.fov)) {
        camera.fov = value;
      } else if (suffix === "t" && !Number.isFinite(camera.pitch)) {
        // Desktop Street View URLs express tilt with 90 at the horizon.
        camera.pitch = 90 - value;
      }
    }
  }

  return camera;
}

function parsePanoId(decoded) {
  const dataToken = decoded.match(/!1s([^!/?#]+)/);
  if (dataToken?.[1]) return dataToken[1];

  const embeddedParameter = decoded.match(/(?:^|[?&\s])panoid=([^&!\s]+)/i);
  if (embeddedParameter?.[1]) return embeddedParameter[1];

  return null;
}

function detectStreetView(url, decoded) {
  const action = url.searchParams.get("map_action");
  if (action?.toLowerCase() === "pano") return true;
  if (/\/maps\/embed\/v1\/streetview/i.test(url.pathname)) return true;
  if (/\/streetview(?:\/|$)/i.test(url.pathname)) return true;
  if (/@-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?,3a(?:,|\/|$)/i.test(decoded)) {
    return true;
  }
  if (url.searchParams.get("layer")?.toLowerCase() === "c") return true;
  if (url.searchParams.has("pano") || url.searchParams.has("panoid")) return true;
  return false;
}

function parseCoordinatePair(value) {
  if (typeof value !== "string") return null;
  const match = value
    .trim()
    .match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
  if (!match) return null;
  return { lat: Number(match[1]), lng: Number(match[2]) };
}

function validateCoordinate(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new GoogleMapsUrlError(`Latitude must be between -90 and 90; received ${lat}.`);
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new GoogleMapsUrlError(
      `Longitude must be between -180 and 180; received ${lng}.`,
    );
  }
  return { lat: latitude, lng: longitude };
}

function firstFinite(...values) {
  for (const value of values) {
    const number = Number(value);
    if (value !== null && value !== "" && Number.isFinite(number)) return number;
  }
  return null;
}

function normalizeHeading(value) {
  if (!Number.isFinite(Number(value))) return null;
  return ((Number(value) % 360) + 360) % 360;
}

function normalizePitch(value) {
  if (!Number.isFinite(Number(value))) return null;
  return Math.max(-90, Math.min(90, Number(value)));
}

function normalizeFov(value) {
  if (!Number.isFinite(Number(value))) return null;
  return Math.max(10, Math.min(100, Number(value)));
}

function formatNumber(value) {
  return Number(value.toFixed(7)).toString();
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
