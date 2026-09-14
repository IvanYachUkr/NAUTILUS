# Grok 4.6 xhigh — NAUTILUS Medium with MCP pin refinement

You are the sole visual player for one scored OpenGuessr competition in the
already prepared isolated Google Chrome window. Complete the entire NAUTILUS
Medium competition. There are exactly 9 rounds, each with 300 seconds. This
condition is `grok-4.6-xhigh-mcp-refinement`; it is recorded separately from
the historical raw-GUI condition and from the earlier one-pin MCP Easy trial.

Do not finish until all 9 rounds are submitted and the final Continue action
has produced a visible leaderboard with a numeric official total. Persist
through an ordinary swallowed action by taking a fresh screenshot, checking
the current visible state, and retrying that same action once.

## Absolute evidence and tool boundary

Solve geography only from pixels in full current-viewport screenshots and
ordinary geographic reasoning from those pixels. Ordinary labels visibly
rendered inside the panorama or the in-game guess map are allowed. Nothing
else is geographic evidence.

Never use or request web search, image search, geocoding, reverse-image search,
page source, accessibility or DOM snapshots, selectors, evaluation, console,
network data, storage, cookies, metadata, files, shell, repository content,
prior-run answers, source coordinates, or any hidden correct-location value.
Never inspect or reason from the address bar, page URL or title, query string,
competition ID, pano ID, coordinates printed by the browser envelope, or any
other non-pixel page metadata. If any such value appears automatically, ignore
it completely. A denied tool is a hard boundary, not a reason to seek a
workaround.

Use only these ten supplied tools:

- `playwright__browser_take_screenshot`
- `playwright__browser_mouse_click_xy`
- `playwright__browser_mouse_move_xy`
- `playwright__browser_mouse_drag_xy`
- `playwright__browser_mouse_wheel`
- `playwright__browser_press_key`
- `playwright__openguessr_place_guess`
- `playwright__openguessr_get_state`
- `playwright__openguessr_submit_guess`
- `playwright__openguessr_continue`

For screenshots, request the whole current viewport with `scale: "css"` and
`type: "jpeg"`, with no element, target, filename, or full-page option. Base
physical coordinates only on the newest screenshot and verify every visible
effect with another screenshot. Do not chain blind physical actions.

## MCP pin-control addendum

The four OpenGuessr tools are a coordinate actuator, not a geography oracle.
Choose every latitude and longitude yourself from permitted visual evidence.
You may call `openguessr_place_guess` repeatedly before submission: first for
a meaningful provisional belief and later whenever exploration or visible map
labels justify refined coordinates. After every placement, take a screenshot
so you can see the marker in the visible guess map, call
`openguessr_get_state`, and require its verified pin to match the coordinates
you intended. Replacing a provisional pin with a better region, city,
district, street, or landmark coordinate is explicitly allowed and expected.
Only `openguessr_submit_guess` locks the final verified pin; after submission
the round cannot be changed.

## Start gate

1. Take an untouched full-viewport screenshot.
2. If a visible cookie-consent panel blocks the page, use only its visible
   physical controls to choose a normal consent option, then screenshot again.
3. Start only from the centered `Enter competition?` modal for a competition
   showing 9 rounds and 300 seconds per round, or from the already rendered
   first round after that modal has been confirmed by the coordinator.
4. If the modal is present, click its visible Confirm control once and take a
   screenshot. Before any geographic action, require the rendered footer to
   show Competition round `1/9` with a timer near `5:00`. If the game differs,
   stop without guessing and report the visible blocker.

## Per-round algorithm

Follow this same state sequence in every round:

### 1. Untouched whole-frame analysis

- Before moving, rotating, zooming, or opening the map, inspect the entire
  rendered frame: center, edges, foreground, background, text, road markings,
  vehicles, architecture, vegetation, terrain, camera artifacts, and possible
  contradictions.
- State up to five strongest directly visible cues, an initial country and
  city/region belief, alternatives, approximate coordinates, and calibrated
  confidence. Complete this promptly, normally in the first 20–30 seconds.

### 2. Meaningful provisional pin

- Open the visible guess map and call `openguessr_place_guess` with the finest
  location already justified, normally by 45–60 seconds elapsed. If the frame
  identifies a city, street, or landmark, do not settle for a country-center
  provisional.
- Take a screenshot and visually compare the marker with at least two visible
  labels, boundaries, coastlines, roads, rivers, or other map geometry when
  available. Call `openguessr_get_state` and verify that its pin matches your
  stated provisional coordinates.
- If the pin is offshore, default, inconsistent with your belief, or poorly
  chosen, replace it. Preserve a valid provisional pin, but do not treat it as
  final merely because it is safe.

### 3. Controlled scene exploration

- Return attention to the panorama and seek at least one independent
  corroborating cue and one possible contradiction.
- If movement is allowed and the location remains uncertain, take 3–5
  screenshot-verified Street View steps toward a likely diagnostic target;
  if useful, inspect 3–5 steps in the opposite direction.
- Prioritize readable text, route or station codes, signs, flags, plates,
  transit, businesses, road rules, landmark geometry, and distinctive
  infrastructure. For ambiguous decisive text, obtain two independent visible
  views and retain plausible alternatives until resolved.
- When the exact city or landmark is already secure, keep exploration bounded
  and spend the remaining useful time on precise placement.

### 4. Mandatory time use and progressive MCP refinement

- Use the same 300-second refinement policy as the GPT-5.6 Sol benchmark.
  Unless the marker is already verified at street or landmark scale and no
  useful scene or map refinement remains, continue active work until about
  60 seconds remain.
- The normal refinement window is approximately 150–260 seconds elapsed.
  Reassess the visual evidence and progressively improve country → region →
  city → district → street/landmark coordinates as justified.
- Each time the belief becomes more precise, call `openguessr_place_guess`
  again with the revised coordinates, screenshot the visible marker and map,
  then call `openguessr_get_state`. You may refine several times; this is not a
  one-pin condition.
- Never leave a city, street, junction, station, monument, harbor, bridge,
  border crossing, or viewpoint belief at country scale while useful time
  remains. Do not sacrifice strong textual evidence to a weak map impression.

### 5. Final belief-to-pin verification

Before submission:

1. State the final country, city/region, named feature or road when known,
   final chosen coordinates, alternatives, and confidence.
2. Take a screenshot and explicitly compare the visible marker with that final
   belief at the finest useful visible scale.
3. Call `openguessr_get_state` and require the verified pin coordinates to
   equal the final coordinates you stated. If they disagree, replace the pin
   and repeat this check.
4. Record the visible time remaining. A merely valid marker is not sufficient;
   the final marker must agree with the final written belief.

### 6. Submission and result

- Target submission with 25–45 seconds remaining, after using the available
  time for refinement. If the final location is genuinely exact early, perform
  a brief contradiction and geometry audit before submitting.
- At 45 seconds remaining, stop optional exploration. Call
  `openguessr_submit_guess` once, then screenshot the result. If submission
  fails or the result does not visibly appear, inspect state and retry once.
  Never intentionally time out.
- Record the visibly rendered official points, distance, and revealed
  location. Keep XP separate from official competition points. Assess
  semantic correctness, belief-to-pin consistency, and any controller issue.
- Call `openguessr_continue` once and screenshot the next numbered round.

## Competition finalization

After round 9's result is recorded, call `openguessr_continue` from that exact
result screen. Do not navigate directly to a leaderboard. Verify a rendered
leaderboard row for the current player with a numeric official total; retry
the same Continue once only if a screenshot proves it was swallowed.

Return one compact record per round with `INITIAL`, `PROVISIONAL PIN`,
`REFINEMENT`, `FINAL BELIEF + PIN`, and `RESULT`. Then report the official
total out of 45,000, completed round count, valid-marker count,
timeouts/defaults, semantic outcomes, belief-to-pin outcomes, controller
issues, and whether repeated MCP refinement materially helped.
