# NAUTILUS Browser Extensions

Helper scripts and browser extensions for the NAUTILUS OpenGuessr benchmark.

---

## 📍 `openguessr_pin_helper.user.js` — OpenGuessr Pin Helper

A Tampermonkey/Violentmonkey **userscript** that solves the core map-placement problem in the NAUTILUS benchmark: the AI model correctly identifies locations visually but struggles to translate them into precise pixel clicks on the compressed minimap.

This script exposes a simple coordinate API. The agent predicts a `(lat, lng)` pair; the script uses **Leaflet's own `latLngToContainerPoint()` projection** to calculate the exact pixel, then dispatches the pointer event sequence Leaflet expects — placing the pin in the geographically correct spot every time.

---

### Installation

#### Step 1 — Install Tampermonkey (or Violentmonkey)

| Browser | Link |
|---------|------|
| Chrome  | [Tampermonkey on Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| Firefox | [Tampermonkey on AMO](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) |
| Edge    | [Tampermonkey on Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) |

#### Step 2 — Install the script

**Option A — Direct file install (easiest)**

1. In Tampermonkey, go to **Dashboard → Utilities → Install from file**
2. Select `extensions/openguessr_pin_helper.user.js`
3. Click **Install** on the confirmation page

**Option B — Manual paste**

1. Open Tampermonkey → **Dashboard → + (New script)**
2. Delete the placeholder template
3. Paste the full contents of `openguessr_pin_helper.user.js`
4. **Ctrl+S** (or File → Save)

> ✅ Done. Reload openguessr.com — the floating **📍 Pin Helper** panel will appear in the bottom-left corner.

---

### The Floating Panel

When you open any page on `openguessr.com` during an active round, a draggable panel appears:

```
┌─────────────────────────────┐
│  📍 Pin Helper           ▾  │
├─────────────────────────────┤
│  Coordinates (lat, lng):    │
│  [ 59.848, 17.614         ] │
│  Zoom (3–18):  [8]          │
│  ┌─────────┬──────┬───────┐ │
│  │Pin Only │Pan   │✨Pan+ │ │
│  │         │Only  │  Pin  │ │
│  └─────────┴──────┴───────┘ │
│  [🔍+] [🔍−] [z=8][z=12][z=15] │
│  ─────────────────────────  │
│  ✅ Marker placed! ...      │
└─────────────────────────────┘
```

**Input fields:**
- **Coordinates** — Enter `lat, lng` (e.g. `48.8566, 2.3522` for Paris). Accepts spaces or commas as separators.
- **Zoom level** — How far to zoom the map when panning. Suggested values:
  - `5–6` → continent view
  - `8–10` → country/region view
  - `12–13` → city view
  - `14–16` → street-level view

**Buttons:**
| Button | Action |
|--------|--------|
| **Pin Only** | Place marker at entered coordinates (no map movement) |
| **Pan Only** | Move map to coordinates at entered zoom (no marker) |
| **✨ Pan+Pin** | Move map first, then place marker after 400 ms *(recommended)* |
| **🔍+ / 🔍−** | Zoom in / out one level |
| **z=8 / z=12 / z=15** | Jump to a fixed zoom level |

The panel is **draggable** (grab the header) and **collapsible** (click ▾).

---

### JavaScript API (for AI agent / DevTools Console)

The script exposes a global `window.NautilusPinHelper` object. The agent can call these functions directly from the DevTools console or via an injected `evaluate_script` MCP call:

```js
// Recommended: pan to location at zoom 8, then place pin
NautilusPinHelper.go(48.8566, 2.3522, 8)       // Paris, France

// Pan only (no pin) — useful for reading street labels before committing
NautilusPinHelper.pan(55.6761, 12.5683, 12)    // Copenhagen, zoom 12

// Pin only — use after manual panning, or after .pan()
NautilusPinHelper.pin(55.6761, 12.5683)

// Get the raw Leaflet map instance for debugging
const map = NautilusPinHelper.getMap()
console.log('current zoom:', map.getZoom())
console.log('current center:', map.getCenter())
```

#### Recommended per-round agent workflow

```
1. Analyse panorama pixels → form hypothesis (e.g. "Uppsala, Sweden")
2. Estimate coarse coordinates (e.g. 59.85, 17.63)
3. NautilusPinHelper.go(59.85, 17.63, 6)   → country zoom, pin placed
4. Take screenshot → read visible map labels to refine
5. NautilusPinHelper.go(59.858, 17.638, 13) → city zoom, pin re-placed
6. Take screenshot → confirm street names
7. NautilusPinHelper.go(59.8582, 17.6389, 16) → street zoom, final pin
8. Click the "Guess" button
```

---

### How it works (technical)

The previous failure mode was computing screen-pixel coordinates manually:

```
❌ clientX = mapLeft + (longitudeFraction × mapWidth)
   → longitude math errors → pins landing in the Pacific Ocean
```

This script instead delegates all projection to **Leaflet's own API**:

```js
// 1. Find the active Leaflet map instance
const map = window.L._maps[0]

// 2. Convert geographic → container pixels (Leaflet does the Mercator math)
const point = map.latLngToContainerPoint(L.latLng(lat, lng))

// 3. Add the map container's screen offset
const rect = map.getContainer().getBoundingClientRect()
const clientX = rect.left + point.x
const clientY = rect.top  + point.y

// 4. Dispatch the pointer event sequence Leaflet's leaflet-touch mode expects
//    pointerdown → mousedown → pointerup → mouseup → click
```

This guarantees the pin lands at exactly the specified latitude/longitude, regardless of zoom level, map position, or viewport size.

---

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| Panel doesn't appear | Make sure Tampermonkey is enabled and the script is active (green dot). Hard-refresh the page. |
| "Map not found" error | The round hasn't started yet. Click through to an active game round first. |
| "Click sent, no marker yet" warning | The game is on a results/lobby screen, not in an active guessing round. |
| Panel covers the game UI | Drag it to a corner, or click ▾ to collapse it. |
| Pin lands in wrong place | Ensure the map has finished panning (use **Pan+Pin**, not **Pin Only** after a fresh pan). |

---

### Files

```
extensions/
├── README.md                        ← this file
└── openguessr_pin_helper.user.js    ← Tampermonkey userscript
```

