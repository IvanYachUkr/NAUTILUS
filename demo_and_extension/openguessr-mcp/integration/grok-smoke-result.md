# Grok 4.6 xhigh live controller smoke test

- Date: 2026-08-31
- Model: Grok 4.6
- Reasoning effort: `xhigh`
- Browser: headed Google Chrome in a disposable profile
- Connection: loopback CDP -> Playwright MCP 0.0.79 -> NAUTILUS OpenGuessr MCP 0.1.0
- Prompt: [`grok-smoke-prompt.md`](grok-smoke-prompt.md)

## Result

**Controller pass; unscored geography.** Grok took a viewport screenshot, used
the visual mouse tools, chose `45.78, 3.08`, called
`openguessr_place_guess`, and then called `openguessr_get_state` in the same MCP
session. The tool results returned:

```text
openguessr_place_guess -> verified: true
verifiedPin -> { latitude: 45.78, longitude: 3.08 }
openguessr_get_state -> the same verifiedPin
```

Grok did not call `openguessr_submit_guess` or `openguessr_continue`, so the
trial created no score and advanced no round.

The smoke test also demonstrates why controller success must be reported
separately from geolocation quality. The captured scene visibly included
`Wilson Rd`, North American-style road markings, and blue road signs, while
Grok described the scene as France and selected the Clermont-Ferrand area.
That semantic error is outside the actuator: the actuator faithfully placed
the coordinates the model chose.

No web search, geocoding, page source, network payload, hidden correct-location
state, submission, or continuation was used.
