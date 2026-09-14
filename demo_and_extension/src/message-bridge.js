export function installMessageBridge(
  api,
  {
    allowedOrigins = [window.location.origin],
    targetWindow = window,
    announceReady = true,
  } = {},
) {
  const allowed = new Set(allowedOrigins);

  const onMessage = (event) => {
    if (!isAllowedOrigin(event.origin, allowed)) return;
    if (!event.data || typeof event.data !== "object") return;

    const { type, payload, requestId } = event.data;

    try {
      switch (type) {
        case "geoatlas:set-cases":
          api.setCases(payload);
          reply(event, "geoatlas:ack", { action: type }, requestId);
          break;
        case "geoatlas:upsert-case":
          api.upsertCase(payload);
          reply(event, "geoatlas:ack", { action: type }, requestId);
          break;
        case "geoatlas:select":
          api.select(payload);
          reply(event, "geoatlas:ack", { action: type }, requestId);
          break;
        case "geoatlas:attach-exploration":
          api.attachExploration(payload);
          reply(event, "geoatlas:ack", { action: type }, requestId);
          break;
        case "geoatlas:get-state":
          reply(event, "geoatlas:state", api.getState(), requestId);
          break;
        default:
          break;
      }
    } catch (error) {
      reply(
        event,
        "geoatlas:error",
        { message: error instanceof Error ? error.message : String(error) },
        requestId,
      );
    }
  };

  targetWindow.addEventListener("message", onMessage);

  if (announceReady && window.parent !== window) {
    window.parent.postMessage(
      {
        type: "geoatlas:ready",
        payload: api.getState(),
      },
      safeTargetOrigin(window.location.origin),
    );
  }

  return () => targetWindow.removeEventListener("message", onMessage);
}

function isAllowedOrigin(origin, allowed) {
  return allowed.has("*") || allowed.has(origin) || (origin === "null" && allowed.has("null"));
}

function reply(event, type, payload, requestId) {
  event.source?.postMessage(
    { type, payload, ...(requestId ? { requestId } : {}) },
    safeTargetOrigin(event.origin),
  );
}

function safeTargetOrigin(origin) {
  return !origin || origin === "null" ? "*" : origin;
}
