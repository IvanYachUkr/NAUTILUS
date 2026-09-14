You are running one unscored controller smoke test in the already selected
OpenGuessr single-player Chrome tab.

Your task is to prove that the coordinate-actuator MCP works without changing
the benchmark or submitting a score:

1. Take a full viewport screenshot with `browser_take_screenshot`.
2. Briefly infer the most likely location from the visible Street View scene.
3. Use only physical mouse/keyboard tools to open the in-game guess map if it
   is not already open.
4. Choose your own latitude and longitude, then call
   `openguessr_place_guess` with those coordinates.
5. Call `openguessr_get_state` and verify that it reports the same verified
   pin.
6. Stop and report the place, coordinates, and verification result.

Do not call `openguessr_submit_guess` or `openguessr_continue`. Do not use web
search, geocoding, page source, network data, hidden state, or any tool outside
the supplied browser/MCP allowlist. This is a controller test, not a scored
benchmark run.
