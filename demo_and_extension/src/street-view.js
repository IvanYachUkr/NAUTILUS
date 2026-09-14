import { buildStreetViewUrl } from "./geo.js";

export function walkHereUrl(caseItem) {
  if (!caseItem) return null;

  try {
    return buildStreetViewUrl(caseItem.startingView ?? caseItem.groundTruth);
  } catch {
    return null;
  }
}

export function createStreetViewController(root) {
  const trigger = root.querySelector("[data-walk-here]");
  let selectedCase = null;

  function onClick(event) {
    const button = event.target.closest("button");
    if (button !== trigger || !root.contains(button)) return;
    const externalUrl = walkHereUrl(selectedCase);
    if (externalUrl) window.open(externalUrl, "_blank", "noopener,noreferrer");
  }

  root.addEventListener("click", onClick);

  return {
    setCase(caseItem) {
      selectedCase = caseItem;
      trigger.hidden = !walkHereUrl(caseItem);
    },
    destroy() {
      root.removeEventListener("click", onClick);
    },
  };
}
