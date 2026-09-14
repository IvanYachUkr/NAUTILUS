# NAUTILUS recorded blind-play protocol for Grok 4.6

This protocol is executed in three independent headless sessions, one each for
Easy, Medium, and Hard, with `grok-4.6` at `xhigh` reasoning effort. The
coordinator supplies one fresh private OpenGuessr entry tab at a time before
Confirm; the visual player must arm recorder 0.7.21 itself before exposing
round one.

## Absolute evidence boundary

Solve locations only from pixels visibly rendered in the attached browser tab.
Ordinary in-game map labels that become visible while manually panning or
zooming are allowed. Nothing else is evidence.

Never:

- use web search, web fetch, image search, geocoding, reverse-image search, or
  another website;
- read or inspect the address bar, entry URL, query string, pano ID,
  coordinates, source object, metadata, page source, accessibility tree, DOM,
  scripts, console, storage, cookies, network traffic, request bodies, or
  developer tools;
- call JavaScript evaluation, Playwright code execution, element locators,
  snapshot/find tools, or any non-visual browser automation;
- read repository files, manifests, prior reports, recordings, ground truth,
  or earlier model results;
- infer a location from a competition ID or any hidden/non-rendered value.

Use only full screenshots and these physical page-input tools:
`browser_mouse_click_xy`, `browser_mouse_move_xy`,
`browser_mouse_drag_xy`, `browser_mouse_wheel`, and `browser_press_key`.
Screenshots must omit element, target, filename, and fullPage arguments. If the
MCP response envelope automatically emits a Page URL or Page Title, treat it as
prohibited non-pixel material and do not quote, interpret, store, or reason
from it. If an unapproved tool is unavailable, do not seek a workaround.

## Recorder gate

Before clicking the private entry card's Confirm control:

1. Select the matching `europe-easy`, `europe-medium`, or `europe-hard`
   dataset and enter exact label `grok-4.6-xhigh-recorded`.
2. Select `Interactive panorama - automatic visible-tab frame stream` and
   click `Arm / start recorder`.
3. Use the visible `Use automatic video fallback` action if it appears. Leave
   the inactive recorder coordinator tab alone.
4. Verify through screenshots that the HUD says `ARMED` and status says `VID`.
   Stop before Confirm if either state cannot be established.

During play, verify `REC` in every live round and a one-step saved-round count
advance or visible `SAVED` state after every result. After the numeric final
leaderboard is committed, click `Done & disarm` and verify exactly 8/9/8 saved
rounds for Easy/Medium/Hard.

## Controller gate

Before the scored competition, use a disposable unscored OpenGuessr round to
prove by screenshots that you can place a marker, zoom the map from world to a
named city, move the marker to a second named city, collapse the map without
losing the marker, move one Street View step, reopen the map, and retain the
marker. Abandon the disposable round without submitting it. Do not enter the
scored tab until this gate passes.

## Every scored round

1. Wait for the panorama to finish rendering. Before moving, rotating, zooming,
   or opening the map, inspect the untouched whole frame and record up to five
   strongest visible cues, an initial belief, alternatives, and calibrated
   confidence.
2. Within roughly the first minute, place a meaningful non-default provisional
   pin at the finest location already justified. Verify it against at least two
   visibly rendered labels, boundaries, coastlines, roads, or rivers.
3. Collapse the map and confirm the valid marker and active Guess control
   survive. If the location is not city-specific, take three to five verified
   Street View steps in one direction and, if still unresolved, three to five
   in the opposite direction. Take a screenshot after every action. Seek
   independent text, signs, route numbers, road rules, transit, architecture,
   infrastructure, terrain, and contradictions.
4. For ambiguous text, obtain two independently rendered views and transcribe
   glyphs in both directions. Do not promote a remembered street-name match to
   corroboration merely because the in-game map contains a similar label.
5. Use the full 300 seconds to improve the location. Unless a street/landmark
   pin is already exact and no useful refinement remains, keep working until
   about 60 seconds remain. Refine country to region to city to district to
   street/feature as justified. Screenshot and verify after each short map
   action; never assume a click, drag, zoom, or marker placement succeeded.
6. Establish a stable belief-matching marker by about 55-60 seconds remaining.
   State the final belief and verify the marker at both country/region and
   city/feature scale. Submit immediately after final verification, preserving
   time for one screenshot-checked retry if the first Guess click is swallowed.
7. On the result screen, record distance, the revealed location, semantic
   correctness, belief-to-pin consistency, and any controller issue. Distinguish
   XP animation from official competition points.

## Competition completion

After the last result, remain on that exact screen and click its visible
Continue control. Retry once only if a screenshot proves the click was
swallowed. Completion requires a rendered leaderboard row with the player name
and numeric official total. Do not navigate directly to a leaderboard URL.

Return a concise checkpoint for every round with exactly these headings:
`INITIAL`, `PROVISIONAL PIN`, `FINAL BELIEF + PIN`, and `RESULT`. At the end,
return `FINAL ROUND RESULT`, `FINAL CONTINUE CLICKED`, and
`LEADERBOARD COMMITTED`, followed by an audit of round count, valid markers,
timeouts/defaults, semantic outcomes, belief-to-pin outcomes, distances, and
the official total.
