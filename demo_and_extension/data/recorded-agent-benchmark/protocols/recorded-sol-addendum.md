# NAUTILUS recorded Sol benchmark addendum

Apply this addendum together with
`NAUTILUS_BLIND_PLAY_PROTOCOL_V3_PIN_REFINEMENT.md`. It changes only the
recording workflow; all blind-play, timing, pin-refinement, and completion
requirements remain mandatory.

## Recorder workflow

The unpacked OpenGuessr Research Round Recorder 0.7.21 and the local collector
are already installed and tested. Each scored competition must be recorded as
one explicitly armed interactive session.

Before clicking the private entry dialog's **Confirm**:

1. Wait for the in-page `Record this competition?` card.
2. Select the matching dataset: `europe-easy`, `europe-medium`, or
   `europe-hard`.
3. Enter the exact model/participant label supplied in the assignment.
4. Select `Interactive panorama — automatic visible-tab frame stream` and
   click `Arm / start recorder`.
5. Keep the OpenGuessr tab active and use the visible
   `Use automatic video fallback` action when prompted. Leave the inactive
   `OpenGuessr frame coordinator` tab open; the recorder owns and closes it.
6. Do not enter the competition until the visible recorder HUD says `ARMED`
   and the recorder status says `VID`. If it does not, stop before exposing
   round one and repair the recorder in an unscored tab.

During play, verify the HUD reports `REC` in active rounds and that its saved
round counter advances after each submitted result. Do not hide, disable, or
bypass the recorder.

After the final result, preserve the ordinary competition gate: record the
result, click the result screen's visible **Continue**, and verify the player
and numeric official total. Then click the recorder HUD's visible
`Done & disarm`, verify the expected 8/9/8 saved-round count and successful
session state, and only then leave the tab.

## Reporting

For each level, record:

- the recorder model label and dataset ID;
- visible `ARMED`, `VID`, and per-round `REC` evidence;
- saved-round counter progression and terminal saved count;
- official committed leaderboard total;
- any swallowed action, interruption, capture warning, or recorder recovery.

The run is invalid if a scored round is exposed before `ARMED` + `VID`, if any
round lacks a valid non-default submission, if the final leaderboard is not
committed, or if the recorder session is not explicitly disarmed after its
expected number of saved rounds.
