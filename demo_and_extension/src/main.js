import { createExplorer, loadCasesFromUrl } from "./api.js";
import { installMessageBridge } from "./message-bridge.js";

boot().catch((error) => {
  const root = document.querySelector("#app");
  if (root) {
    root.innerHTML = `
      <main class="fatal-error">
        <span>Visualization error</span>
        <h1>The explorer could not start.</h1>
        <pre>${escapeHtml(error instanceof Error ? error.message : String(error))}</pre>
      </main>
    `;
  }
  console.error(error);
});

async function boot() {
  const root = document.querySelector("#app");
  const params = new URLSearchParams(window.location.search);
  const dataUrl = params.get("data");
  const cases = await loadCasesFromUrl(
    dataUrl || "./data/generated/atlas-cases.json",
  );

  const api = createExplorer({
    root,
    cases,
    syncHash: params.get("syncHash") !== "false",
    mapOptions: {
      disableGlobe: params.get("offline") === "1",
      disableLeaflet: params.get("offline") === "1",
    },
  });

  window.geoEvidenceAtlas = api;

  const clueUpdateChannel = typeof BroadcastChannel === "function"
    ? new BroadcastChannel("nautilus-clue-updates")
    : null;
  let clueRefreshPending = false;
  clueUpdateChannel?.addEventListener("message", async (event) => {
    if (event.data?.type !== "clues-updated" || clueRefreshPending) return;
    clueRefreshPending = true;
    try {
      const refreshUrl = new URL(dataUrl || "./data/generated/atlas-cases.json", window.location.href);
      refreshUrl.searchParams.set("updated", String(Date.now()));
      api.setCases(await loadCasesFromUrl(refreshUrl.href));
    } catch (error) {
      console.error("Unable to refresh reviewed clues.", error);
    } finally {
      clueRefreshPending = false;
    }
  });

  const allowedOrigin = params.get("parentOrigin");
  const disposeBridge = installMessageBridge(api, {
    allowedOrigins: allowedOrigin
      ? [allowedOrigin]
      : [window.location.origin, ...(window.location.origin === "null" ? ["null"] : [])],
  });

  window.addEventListener(
    "pagehide",
    () => {
      clueUpdateChannel?.close();
      disposeBridge();
    },
    { once: true },
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
