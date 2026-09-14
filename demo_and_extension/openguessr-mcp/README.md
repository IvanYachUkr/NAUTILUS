# NAUTILUS OpenGuessr MCP

A small, benchmark-safe MCP layer for playing OpenGuessr through an existing
Chrome tab. It keeps Microsoft Playwright MCP as the browser backend, filters
that backend down to visual controls, and adds precise tools for turning a
model's own latitude/longitude decision into a verified Leaflet pin.

This is deliberately a companion proxy rather than a fork of Playwright MCP.
The upstream package can be upgraded independently, while the OpenGuessr
policy and page adapter stay reviewable in this repository.

## Architecture

```text
Grok or another MCP client
          |
          | http://127.0.0.1:8931/mcp
          v
NAUTILUS OpenGuessr MCP
  - exposes six visual browser tools
  - exposes four OpenGuessr tools
  - rejects every other upstream tool
          |
          | private MCP connection on 127.0.0.1:8932
          v
Microsoft Playwright MCP --extension
          |
          v
user-approved Google Chrome tab
          |
          v
packaged page adapter or recorder extension -> OpenGuessr Leaflet guess map
```

Each downstream MCP session creates its own server, transport, and upstream
client. Both listeners are loopback-only, and browser-origin HTTP requests are
rejected.

## Exposed tools

| Tool | Purpose |
| --- | --- |
| `browser_take_screenshot` | Observe the current Chrome tab. |
| `browser_mouse_click_xy` | Click a visible coordinate. |
| `browser_mouse_move_xy` | Move the pointer. |
| `browser_mouse_drag_xy` | Drag the panorama or a visible control. |
| `browser_mouse_wheel` | Scroll or zoom the visible surface. |
| `browser_press_key` | Send an ordinary key press. |
| `openguessr_place_guess` | Place a model-chosen latitude/longitude and verify the rendered Leaflet marker. |
| `openguessr_get_state` | Return sanitized control state and the last MCP-verified pin. |
| `openguessr_submit_guess` | Submit only a pin verified by `openguessr_place_guess`. |
| `openguessr_continue` | Click the visible Continue or Next Round control. |

The proxy internally uses Playwright's page-evaluation tool to call one fixed
adapter function. That general evaluation tool is never advertised or
forwardable by the model.

## Research boundary

The MCP does not geocode place names, browse the web, read network requests,
return page source, or expose correct-location coordinates. Geography remains
the model's decision; the MCP fixes the belief-to-pin control bottleneck.

Results produced with this MCP are a separate **coordinate-actuator MCP**
condition. Do not merge them into the existing NAUTILUS raw-GUI leaderboard:
the original runs measure both geographic reasoning and manual map control,
while this condition intentionally removes most map-control error.

## Prerequisites

- Node.js 20 or newer.
- Google Chrome.
- One of these Chrome connections:
  - the official [Playwright MCP Bridge extension](https://github.com/microsoft/playwright/tree/main/packages/extension), plus the unpacked NAUTILUS recorder extension from `../extension/openguessr-research-recorder` version 0.7.9 or newer; or
  - a separate Chrome process exposing a loopback CDP endpoint. In this mode the launcher injects the package's minimal page adapter itself.
- In Bridge mode, an OpenGuessr tab selected in the Playwright Bridge connection page.

Install dependencies:

```powershell
cd demo_and_extension\openguessr-mcp
npm.cmd install
```

## Start the two MCP layers

Terminal 1, the upstream Playwright MCP:

```powershell
node node_modules\@playwright\mcp\cli.js --extension --browser chrome --caps=vision --snapshot-mode=none --image-responses=allow --codegen=none --shared-browser-context --host 127.0.0.1 --allowed-hosts=127.0.0.1:8932,localhost:8932 --port 8932
```

Terminal 2, the filtering proxy:

```powershell
npm.cmd start
```

Point the MCP client at the proxy, not directly at Playwright:

```toml
[mcp_servers.playwright]
url = "http://127.0.0.1:8931/mcp"
enabled = true
```

The health endpoint is `http://127.0.0.1:8931/healthz`.

## Grok launcher

The Windows launcher starts both MCP layers in hidden processes, runs Grok 4.6
with `xhigh` reasoning and only the ten tools above, then stops exactly those
two child processes:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\Start-GrokOpenGuessr.ps1 -PromptFile path\to\prompt.md -TranscriptPath path\to\transcript.txt
```

Add `-AuditLogPath path\to\mcp-audit.jsonl` to retain an ordered JSONL record
of the four OpenGuessr actuator calls. Each record contains a timestamp,
sequence number, logical round, model-supplied arguments, and the sanitized
controller result. Screenshot bytes, browser metadata, correct-location data,
and upstream page envelopes are not written. Audit failures are deliberately
non-fatal so observability cannot change a scored run.

If the Bridge extension is unavailable, start a separate Chrome profile with a
loopback-only debugging port. This leaves the user's ordinary Chrome profile
and tabs untouched:

```powershell
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' `
  --no-first-run `
  --no-default-browser-check `
  --remote-debugging-address=127.0.0.1 `
  --remote-debugging-port=9224 `
  --user-data-dir="$env:LOCALAPPDATA\NAUTILUS-OpenGuessr-Chrome"
```

Open an OpenGuessr round in that window, then select CDP mode explicitly:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\Start-GrokOpenGuessr.ps1 -PromptFile path\to\prompt.md -CdpEndpoint http://127.0.0.1:9224 -TranscriptPath path\to\transcript.txt
```

The launcher accepts only a loopback CDP endpoint. It does not alter Chrome's
normal profile or enable remote debugging globally.

All custom-tool responses are reduced at the proxy boundary to their
documented fields. Unexpected adapter properties, page paths, and other page
metadata are discarded before either the model response or audit log is
created.

Inspect its resolved topology and allowlist without starting anything:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\Start-GrokOpenGuessr.ps1 -PromptFile path\to\prompt.md -ValidateOnly
```

## Test

```powershell
npm.cmd test
npm.cmd run test:playwright
npm.cmd audit
```

`test:playwright` launches a disposable headless Google Chrome instance and the
real pinned Playwright MCP, serves a local Leaflet fixture, and verifies the
complete place/state/submit path through both MCP transports.

The controlled Grok 4.6 `xhigh` live smoke-test record is in
[`integration/grok-smoke-result.md`](integration/grok-smoke-result.md). It is a
controller test, not a benchmark score.

The parent recorder suite must also remain green:

```powershell
cd ..
npm.cmd test
npm.cmd run check:extension
```

## License

MIT. See [LICENSE](LICENSE).
