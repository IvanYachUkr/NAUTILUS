# Design QA

## Comparison target

- Source visual truth:
  - `C:\Users\vanya\AppData\Local\Temp\codex-clipboard-030e4fc5-1edc-40c2-81e3-7ee0271e86df.png`
  - `C:\Users\vanya\AppData\Local\Temp\codex-clipboard-8e746407-db1f-4da6-976a-b1bcd1bbaf9a.png`
  - `C:\Users\vanya\AppData\Local\Temp\codex-clipboard-b2148248-85cc-4690-a8fb-4309f64fbdfe.png`
  - `C:\Users\vanya\AppData\Local\Temp\codex-clipboard-9176d781-18fe-47e6-9f47-ac31fd684469.png`
  - `C:\Users\vanya\AppData\Local\Temp\codex-clipboard-ba135920-4a76-4f7f-bb6e-f6929bd433c2.png`
- Implementation evidence: local Playwright browser captures and accessibility snapshots.
- Checked viewports: 1440 x 900 and 430 x 932 CSS px.
- Checked states: Utrecht interactive and covered-static conditions; GLM-5.3-Flash + MCP, GPT-6 Astra, and Grok 4.6 + MCP runtime displays; overview with the covered-static filter retained.

## Findings

- Statistics placement: passed. The control is in the image's top-right corner and matches the visual-evidence control height on desktop; it remains compact at the top-right on mobile.
- Globe legend: passed. The desktop legend uses the released bottom width instead of crowding three labels; mobile retains a thin single row.
- Condition comparison: passed. The count is a separate gold badge, so no isolated dot or count wraps onto an awkward line.
- Runtime wording: passed. Missing per-location static timing reads `Batch processed`; its tooltip explains that batched timings are not comparable. Missing interactive timing reads `Unavailable`.
- Runtime evidence: passed for every timestamped source. GLM and Astra show per-location values for all 25 scenes; Grok MCP shows all 17 timestamped medium/hard values and accurately leaves its eight unaudited easy scenes unavailable.
- Overview copy: passed. It remains `25 benchmark locations` when the selected condition changes, instead of presenting partial covered-static prediction coverage as the dataset size.
- Responsive composition: passed. The two comparison controls remain aligned, and the top controls and bottom legend do not overlap at 430 px.
- Console: application code emitted no errors; the local server returned only an unrelated missing `favicon.ico` 404.

final result: passed
