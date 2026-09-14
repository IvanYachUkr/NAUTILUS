# Archived model decision notes

> Historical source export retained for provenance. These files are not read by the website or benchmark build; canonical published runs live in [`../../recorded-agent-benchmark/`](../../recorded-agent-benchmark/).

Locally saved decision notes and text conversations, collected on 2026-09-08. GLM scored runs 1–3 are already in the separate GLM archive in the Proton folder.

## What is included

- GPT-5.6 Sol max and xhigh: original runs, recorded repeats, pin refinement, continuations, and saved per-round cues, initial hypotheses, and final decisions.
- GPT-6 Astra low: run 1 with its final-two-round continuation, run 2, run 3 interrupted attempt, and clean replacement.
- Grok: recorded runs, MCP-assisted, one-shot and refinement runs, saved CLI transcripts, and local session text with recorded thought summaries. Related preliminary and interrupted attempts remain identifiable by session title and source report.
- Gemini 3.7 Flash high and aided: locally saved reports and the available reasoning-details export.
- Original owner-attributed GPT-5.6 max pilot notes retain their provenance caveat.

## Coverage limits

These files preserve what was actually saved. GPT records are the explicit decision notes and reports, not a promise of a full hidden reasoning transcript. Grok text records contain the exposed message/thought text; unavailable internal reasoning cannot be reconstructed. Interrupted or invalid runs remain labeled by their original reports. GeoCLIP is a numerical baseline and no free-form model decision narrative was found for it.

Videos, screenshots, software, credentials, browser state, system prompts from session stores, and encrypted payloads are excluded. Some source reports refer to screenshot/video files that are intentionally absent. Exact duplicate files are stored once; differing local versions have a variant suffix. Original attribution, corrections, and uncertainty remain in the source reports.

## Browse the notes

| Model/configuration | Saved source documents |
|---|---:|
| [gemini-3.7-flash-high](models/gemini-3.7-flash-high/) | 3 |
| [gemini-3.7-flash-high-aided](models/gemini-3.7-flash-high-aided/) | 2 |
| [gpt-5.6-owner-attributed-max](models/gpt-5.6-owner-attributed-max/) | 1 |
| [gpt-5.6-sol-max](models/gpt-5.6-sol-max/) | 16 |
| [gpt-5.6-sol-xhigh](models/gpt-5.6-sol-xhigh/) | 12 |
| [gpt-6-astra-low](models/gpt-6-astra-low/) | 9 |
| [grok-4.6-xhigh](models/grok-4.6-xhigh/) | 62 |

Additionally: 61 Grok sessions with text exports, containing 3308 recorded thought-text updates.

See manifest.json for the exact source-to-export mapping and original SHA-256 hashes. SHA256SUMS.txt verifies every exported file.

## Source documents

- [gemini-3.7-flash-high-aided: README.md](models/gemini-3.7-flash-high-aided/published-notes/README.md)
- [gemini-3.7-flash-high-aided: report.md](models/gemini-3.7-flash-high-aided/published-notes/report.md)
- [gemini-3.7-flash-high: README.md](models/gemini-3.7-flash-high/published-notes/README.md)
- [gemini-3.7-flash-high: reasoning_details.md](models/gemini-3.7-flash-high/published-notes/reasoning_details.md)
- [gemini-3.7-flash-high: report.md](models/gemini-3.7-flash-high/published-notes/report.md)
- [gpt-5.6-sol-max: README.md](models/gpt-5.6-sol-max/published-notes/README.md)
- [gpt-5.6-sol-max: report.md](models/gpt-5.6-sol-max/published-notes/report.md)
- [gpt-5.6-sol-max: README.md](models/gpt-5.6-sol-max/published-notes/runs/recorded-r3/README.md)
- [gpt-5.6-sol-max: report.md](models/gpt-5.6-sol-max/published-notes/runs/recorded-r3/report.md)
- [gpt-5.6-sol-max: README.md](models/gpt-5.6-sol-max/published-notes/runs/recorded-r4/README.md)
- [gpt-5.6-sol-max: report.md](models/gpt-5.6-sol-max/published-notes/runs/recorded-r4/report.md)
- [gpt-5.6-sol-xhigh: README.md](models/gpt-5.6-sol-xhigh/published-notes/README.md)
- [gpt-5.6-sol-xhigh: report.md](models/gpt-5.6-sol-xhigh/published-notes/report.md)
- [gpt-5.6-sol-xhigh: README.md](models/gpt-5.6-sol-xhigh/published-notes/runs/recorded-r2/README.md)
- [gpt-5.6-sol-xhigh: report.md](models/gpt-5.6-sol-xhigh/published-notes/runs/recorded-r2/report.md)
- [gpt-5.6-sol-xhigh: README.md](models/gpt-5.6-sol-xhigh/published-notes/runs/recorded-r3/README.md)
- [gpt-5.6-sol-xhigh: report.md](models/gpt-5.6-sol-xhigh/published-notes/runs/recorded-r3/report.md)
- [gpt-6-astra-low: README.md](models/gpt-6-astra-low/published-notes/README.md)
- [gpt-6-astra-low: NAUTILUS_ASTRA_LOW_RUN2_20260907.md](models/gpt-6-astra-low/published-notes/reports/NAUTILUS_ASTRA_LOW_RUN2_20260907.md)
- [gpt-6-astra-low: NAUTILUS_ASTRA_LOW_RUN3_20260907.md](models/gpt-6-astra-low/published-notes/reports/NAUTILUS_ASTRA_LOW_RUN3_20260907.md)
- [gpt-6-astra-low: NAUTILUS_ASTRA_LOW_RUN3_CLEAN_20260907.md](models/gpt-6-astra-low/published-notes/reports/NAUTILUS_ASTRA_LOW_RUN3_CLEAN_20260907.md)
- [gpt-6-astra-low: NAUTILUS_ASTRA_LOW_RUN_20260906.md](models/gpt-6-astra-low/published-notes/reports/NAUTILUS_ASTRA_LOW_RUN_20260906.md)
- [grok-4.6-xhigh: README.md](models/grok-4.6-xhigh/published-notes/README.md)
- [grok-4.6-xhigh: README.md](models/grok-4.6-xhigh/published-notes/mcp-assisted/README.md)
- [grok-4.6-xhigh: README.md](models/grok-4.6-xhigh/published-notes/mcp-one-shot/README.md)
- [grok-4.6-xhigh: report.md](models/grok-4.6-xhigh/published-notes/report.md)
- [grok-4.6-xhigh: README.md](models/grok-4.6-xhigh/published-notes/runs/mcp-assisted-r1/README.md)
- [grok-4.6-xhigh: transcript-easy.txt](models/grok-4.6-xhigh/published-notes/runs/mcp-assisted-r1/transcript-easy.txt)
- [grok-4.6-xhigh: README.md](models/grok-4.6-xhigh/published-notes/runs/mcp-assisted-r2/README.md)
- [grok-4.6-xhigh: transcript-easy.txt](models/grok-4.6-xhigh/published-notes/runs/mcp-assisted-r2/transcript-easy.txt)
- [grok-4.6-xhigh: README.md](models/grok-4.6-xhigh/published-notes/runs/mcp-assisted-r3/README.md)
- [grok-4.6-xhigh: transcript-easy.txt](models/grok-4.6-xhigh/published-notes/runs/mcp-assisted-r3/transcript-easy.txt)
- [grok-4.6-xhigh: README.md](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-hard-r1/README.md)
- [grok-4.6-xhigh: transcript.txt](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-hard-r1/transcript.txt)
- [grok-4.6-xhigh: README.md](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-hard-r2/README.md)
- [grok-4.6-xhigh: transcript.txt](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-hard-r2/transcript.txt)
- [grok-4.6-xhigh: README.md](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-hard-r3/README.md)
- [grok-4.6-xhigh: transcript.txt](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-hard-r3/transcript.txt)
- [grok-4.6-xhigh: README.md](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-medium-r1/README.md)
- [grok-4.6-xhigh: transcript.txt](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-medium-r1/transcript.txt)
- [grok-4.6-xhigh: README.md](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-medium-r2/README.md)
- [grok-4.6-xhigh: transcript.txt](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-medium-r2/transcript.txt)
- [grok-4.6-xhigh: README.md](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-medium-r3-retry/README.md)
- [grok-4.6-xhigh: transcript.txt](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-medium-r3-retry/transcript.txt)
- [grok-4.6-xhigh: README.md](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-medium-r3-retry2/README.md)
- [grok-4.6-xhigh: transcript.txt](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-medium-r3-retry2/transcript.txt)
- [grok-4.6-xhigh: README.md](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-medium-r3/README.md)
- [grok-4.6-xhigh: transcript.txt](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-medium-r3/transcript.txt)
- [grok-4.6-xhigh: README.md](models/grok-4.6-xhigh/published-notes/runs/mcp-refinement-medium-r1/README.md)
- [grok-4.6-xhigh: transcript-start-gate-failed.txt](models/grok-4.6-xhigh/published-notes/runs/mcp-refinement-medium-r1/transcript-start-gate-failed.txt)
- [grok-4.6-xhigh: transcript.txt](models/grok-4.6-xhigh/published-notes/runs/mcp-refinement-medium-r1/transcript.txt)
- [grok-4.6-xhigh: README.md](models/grok-4.6-xhigh/published-notes/runs/recorded-r2/README.md)
- [grok-4.6-xhigh: report.md](models/grok-4.6-xhigh/published-notes/runs/recorded-r2/report.md)
- [grok-4.6-xhigh: transcript-easy.txt](models/grok-4.6-xhigh/published-notes/runs/recorded-r2/transcript-easy.txt)
- [grok-4.6-xhigh: transcript-hard.txt](models/grok-4.6-xhigh/published-notes/runs/recorded-r2/transcript-hard.txt)
- [grok-4.6-xhigh: transcript-medium.txt](models/grok-4.6-xhigh/published-notes/runs/recorded-r2/transcript-medium.txt)
- [grok-4.6-xhigh: README.md](models/grok-4.6-xhigh/published-notes/runs/recorded-r3/README.md)
- [grok-4.6-xhigh: report.md](models/grok-4.6-xhigh/published-notes/runs/recorded-r3/report.md)
- [grok-4.6-xhigh: transcript-easy.txt](models/grok-4.6-xhigh/published-notes/runs/recorded-r3/transcript-easy.txt)
- [grok-4.6-xhigh: transcript-hard.txt](models/grok-4.6-xhigh/published-notes/runs/recorded-r3/transcript-hard.txt)
- [grok-4.6-xhigh: transcript-medium.txt](models/grok-4.6-xhigh/published-notes/runs/recorded-r3/transcript-medium.txt)
- [gpt-5.6-sol-max: README--variant-8c47f58dc2.md](models/gpt-5.6-sol-max/published-notes/README--variant-8c47f58dc2.md)
- [gpt-5.6-sol-xhigh: README--variant-0a8e0b5394.md](models/gpt-5.6-sol-xhigh/published-notes/README--variant-0a8e0b5394.md)
- [grok-4.6-xhigh: README--variant-bc61df7585.md](models/grok-4.6-xhigh/published-notes/README--variant-bc61df7585.md)
- [grok-4.6-xhigh: README--variant-38b398f3f7.md](models/grok-4.6-xhigh/published-notes/README--variant-38b398f3f7.md)
- [grok-4.6-xhigh: README--variant-033e488fb1.md](models/grok-4.6-xhigh/published-notes/mcp-assisted/README--variant-033e488fb1.md)
- [grok-4.6-xhigh: README--variant-99845527aa.md](models/grok-4.6-xhigh/published-notes/mcp-one-shot/README--variant-99845527aa.md)
- [grok-4.6-xhigh: README--variant-4235581163.md](models/grok-4.6-xhigh/published-notes/runs/mcp-assisted-r1/README--variant-4235581163.md)
- [grok-4.6-xhigh: README--variant-0951a7000b.md](models/grok-4.6-xhigh/published-notes/runs/mcp-assisted-r2/README--variant-0951a7000b.md)
- [grok-4.6-xhigh: README--variant-6036caac1f.md](models/grok-4.6-xhigh/published-notes/runs/mcp-assisted-r3/README--variant-6036caac1f.md)
- [grok-4.6-xhigh: README--variant-88936b02d8.md](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-hard-r1/README--variant-88936b02d8.md)
- [grok-4.6-xhigh: README--variant-4472cf5734.md](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-hard-r2/README--variant-4472cf5734.md)
- [grok-4.6-xhigh: README--variant-b1a3744391.md](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-hard-r3/README--variant-b1a3744391.md)
- [grok-4.6-xhigh: README--variant-8fed5b2569.md](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-medium-r1/README--variant-8fed5b2569.md)
- [grok-4.6-xhigh: README--variant-3908bde824.md](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-medium-r2/README--variant-3908bde824.md)
- [grok-4.6-xhigh: README--variant-c062d5b934.md](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-medium-r3-retry/README--variant-c062d5b934.md)
- [grok-4.6-xhigh: README--variant-86ef425b62.md](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-medium-r3-retry2/README--variant-86ef425b62.md)
- [grok-4.6-xhigh: README--variant-18876ec6ca.md](models/grok-4.6-xhigh/published-notes/runs/mcp-one-shot-medium-r3/README--variant-18876ec6ca.md)
- [grok-4.6-xhigh: README--variant-325a028f32.md](models/grok-4.6-xhigh/published-notes/runs/mcp-refinement-medium-r1/README--variant-325a028f32.md)
- [grok-4.6-xhigh: README--variant-8464128bfe.md](models/grok-4.6-xhigh/published-notes/README--variant-8464128bfe.md)
- [gpt-5.6-sol-max: README--variant-3cf1c9984e.md](models/gpt-5.6-sol-max/published-notes/README--variant-3cf1c9984e.md)
- [gpt-5.6-sol-max: report--variant-b01d0f8b06.md](models/gpt-5.6-sol-max/published-notes/report--variant-b01d0f8b06.md)
- [gpt-5.6-sol-xhigh: README--variant-238a7e5a24.md](models/gpt-5.6-sol-xhigh/published-notes/README--variant-238a7e5a24.md)
- [gpt-5.6-sol-xhigh: report--variant-08c0750391.md](models/gpt-5.6-sol-xhigh/published-notes/report--variant-08c0750391.md)
- [grok-4.6-xhigh: README--variant-1c6e77caa6.md](models/grok-4.6-xhigh/published-notes/README--variant-1c6e77caa6.md)
- [grok-4.6-xhigh: report--variant-c4d48b3452.md](models/grok-4.6-xhigh/published-notes/report--variant-c4d48b3452.md)
- [gpt-6-astra-low: NAUTILUS_ASTRA_LOW_HARD_FINAL2_20260907.md](models/gpt-6-astra-low/original-run-notes/NAUTILUS_ASTRA_LOW_HARD_FINAL2_20260907.md)
- [gpt-6-astra-low: NAUTILUS_ASTRA_LOW_RUN2_20260907.md](models/gpt-6-astra-low/original-run-notes/NAUTILUS_ASTRA_LOW_RUN2_20260907.md)
- [gpt-6-astra-low: NAUTILUS_ASTRA_LOW_RUN3_20260907.md](models/gpt-6-astra-low/original-run-notes/NAUTILUS_ASTRA_LOW_RUN3_20260907.md)
- [gpt-6-astra-low: NAUTILUS_ASTRA_LOW_RUN_20260906.md](models/gpt-6-astra-low/original-run-notes/NAUTILUS_ASTRA_LOW_RUN_20260906.md)
- [gpt-5.6-owner-attributed-max: NAUTILUS_BLIND_AGENT_RUN.md](models/gpt-5.6-owner-attributed-max/original-run-notes/NAUTILUS_BLIND_AGENT_RUN.md)
- [gpt-5.6-sol-max: NAUTILUS_SOL_MAX_HARD_CONTINUATION.md](models/gpt-5.6-sol-max/original-run-notes/NAUTILUS_SOL_MAX_HARD_CONTINUATION.md)
- [gpt-5.6-sol-max: NAUTILUS_SOL_MAX_HARD_FINAL_RUN.md](models/gpt-5.6-sol-max/original-run-notes/NAUTILUS_SOL_MAX_HARD_FINAL_RUN.md)
- [gpt-5.6-sol-max: NAUTILUS_SOL_MAX_HARD_RESUME.md](models/gpt-5.6-sol-max/original-run-notes/NAUTILUS_SOL_MAX_HARD_RESUME.md)
- [gpt-5.6-sol-max: NAUTILUS_SOL_MAX_PIN_REFINEMENT_RUN.md](models/gpt-5.6-sol-max/original-run-notes/NAUTILUS_SOL_MAX_PIN_REFINEMENT_RUN.md)
- [gpt-5.6-sol-max: NAUTILUS_SOL_MAX_RECORDED_R3_RUN.md](models/gpt-5.6-sol-max/original-run-notes/NAUTILUS_SOL_MAX_RECORDED_R3_RUN.md)
- [gpt-5.6-sol-max: NAUTILUS_SOL_MAX_RECORDED_R4_RUN.md](models/gpt-5.6-sol-max/original-run-notes/NAUTILUS_SOL_MAX_RECORDED_R4_RUN.md)
- [gpt-5.6-sol-max: NAUTILUS_SOL_MAX_RUN.md](models/gpt-5.6-sol-max/original-run-notes/NAUTILUS_SOL_MAX_RUN.md)
- [gpt-5.6-sol-xhigh: NAUTILUS_SOL_XHIGH_RECORDED_R2_RUN.md](models/gpt-5.6-sol-xhigh/original-run-notes/NAUTILUS_SOL_XHIGH_RECORDED_R2_RUN.md)
- [gpt-5.6-sol-xhigh: NAUTILUS_SOL_XHIGH_RECORDED_R3_RUN.md](models/gpt-5.6-sol-xhigh/original-run-notes/NAUTILUS_SOL_XHIGH_RECORDED_R3_RUN.md)
- [gpt-5.6-sol-xhigh: NAUTILUS_SOL_XHIGH_RUN.md](models/gpt-5.6-sol-xhigh/original-run-notes/NAUTILUS_SOL_XHIGH_RUN.md)
- [grok-4.6-xhigh: grok-easy-wrapper-20260814-002307.out.log](models/grok-4.6-xhigh/additional-cli-transcripts/Computer_Vision_FInal_Project/logs/grok-easy-wrapper-20260814-002307.out.log)
- [grok-4.6-xhigh: grok-easy-wrapper-r3-20260813-230936.out.log](models/grok-4.6-xhigh/additional-cli-transcripts/Computer_Vision_FInal_Project/logs/grok-easy-wrapper-r3-20260813-230936.out.log)
- [grok-4.6-xhigh: grok-hard-wrapper-20260814-012109.out.log](models/grok-4.6-xhigh/additional-cli-transcripts/Computer_Vision_FInal_Project/logs/grok-hard-wrapper-20260814-012109.out.log)
- [grok-4.6-xhigh: grok-medium-wrapper-20260814-005023.out.log](models/grok-4.6-xhigh/additional-cli-transcripts/Computer_Vision_FInal_Project/logs/grok-medium-wrapper-20260814-005023.out.log)

## Grok local sessions

- [2026-08-31 — OpenGuessr MCP Coordinate Actuator Smoke Test](models/grok-4.6-xhigh/local-session-text/01a059ac-d67c-7291-9b70-dd0870999a3f/notes.md)
- [2026-08-31 — OpenGuessr MCP coordinate-actuator smoke test](models/grok-4.6-xhigh/local-session-text/01a059bb-ac04-79b2-ad26-e441f2206eb2/notes.md)
- [2026-08-13 — OpenGuessr Visual Controller Preflight Test](models/grok-4.6-xhigh/local-session-text/019ff9a4-6fb3-7451-ac7d-4629d207e41c/notes.md)
- [2026-08-13 — OpenGuessr Visual Controller Preflight Test](models/grok-4.6-xhigh/local-session-text/019ff9a5-34a2-7f31-bdbb-f0bd463698ca/notes.md)
- [2026-08-13 — OpenGuessr Visual Controller Preflight Test](models/grok-4.6-xhigh/local-session-text/019ff9aa-07a3-70c2-90fd-67f37a196511/notes.md)
- [2026-08-13 — OpenGuessr Visual Controller Preflight Disposable Round](models/grok-4.6-xhigh/local-session-text/019ff9ad-cb25-7e02-ac2e-f2be779204a2/notes.md)
- [2026-08-13 — Playwright Screenshot Tool Schema CSS Scale](models/grok-4.6-low/local-session-text/019ffa58-ab9a-77d3-9af1-a382746eabc7/notes.md)
- [2026-08-13 — Playwright CSS-scale Screenshot Tool Call](models/grok-4.6-low/local-session-text/019ffa59-efb3-72f3-a80a-c7838e7514d5/notes.md)
- [2026-08-13 — Playwright Screenshot Tool Schema Scale CSS](models/grok-4.6-xhigh/local-session-text/019ffa5f-59b6-7453-b8c3-868db3e64cd6/notes.md)
- [2026-08-13 — OpenGuessr Visual Controller Preflight Test](models/grok-4.6-xhigh/local-session-text/019ffa61-f974-7822-9551-f7ab1be5ac16/notes.md)
- [2026-08-13 — OpenGuessr Visual Controller Preflight Test](models/grok-4.6-xhigh/local-session-text/019ffa66-4a92-7080-a1f9-2df8e4770b58/notes.md)
- [2026-08-13 — OpenGuessr Easy Europe Blind Run Competition](models/grok-4.6-xhigh/local-session-text/019ffa6f-3eb7-7a13-b867-de6b28ae826b/notes.md)
- [2026-08-13 — OpenGuessr Europe Easy 8-Round Blind Competition](models/grok-4.6-xhigh/local-session-text/019ffa72-76a7-7e80-bd77-10568ef855a1/notes.md)
- [2026-08-13 — OpenGuessr Europe-Easy Blind Run Recorder](models/grok-4.6-xhigh/local-session-text/019ffa74-8541-7b22-bde6-af7cc812a62a/notes.md)
- [2026-08-13 — OpenGuessr Europe-Easy 8-Round Blind Competition](models/grok-4.6-xhigh/local-session-text/019ffa7a-f704-7eb3-9391-eba902898ab2/notes.md)
- [2026-08-13 — Grok OpenGuessr Europe Easy Blind Run](models/grok-4.6-xhigh/local-session-text/019ffa82-4a96-79c3-974a-0676fa348aa3/notes.md)
- [2026-08-13 — OpenGuessr Europe Easy 8-Round Blind Run](models/grok-4.6-xhigh/local-session-text/019ffcbe-ed85-7a33-99a0-2bfb9036ff25/notes.md)
- [2026-08-13 — OpenGuessr Europe-Easy 8-Round Blind Run](models/grok-4.6-xhigh/local-session-text/019ffcc2-66be-70f0-b40f-0dc01f4c7fe7/notes.md)
- [2026-08-13 — Grok OpenGuessr Europe Easy Blind Run](models/grok-4.6-xhigh/local-session-text/019ffcc7-b656-7fb1-826c-31525e5e6251/notes.md)
- [2026-08-13 — Grok OpenGuessr Europe Easy Blind Run](models/grok-4.6-xhigh/local-session-text/019ffcca-1307-7370-8dbe-90e037c79814/notes.md)
- [2026-08-13 — OpenGuessr Easy Competition Blind Run Recorder](models/grok-4.6-xhigh/local-session-text/019ffcd0-eda0-7531-9c05-2070a9f8c8cb/notes.md)
- [2026-08-13 — Grok OpenGuessr Europe Easy Blind Run](models/grok-4.6-xhigh/local-session-text/019ffcd2-b394-7fb2-a27f-339503aaa255/notes.md)
- [2026-08-13 — Grok OpenGuessr Europe-Easy Blind Run](models/grok-4.6-xhigh/local-session-text/019ffcf5-8a6f-7140-96ba-e6d46b6e4851/notes.md)
- [2026-08-13 — Grok OpenGuessr Europe Easy Blind Run](models/grok-4.6-xhigh/local-session-text/019ffd38-d733-79c3-98c1-0a4a01f56e2f/notes.md)
- [2026-08-13 — Grok OpenGuessr Europe Medium Blind Run](models/grok-4.6-xhigh/local-session-text/019ffd51-cea4-7180-9028-9cef0820901b/notes.md)
- [2026-08-13 — Grok OpenGuessr Europe Hard Blind Run](models/grok-4.6-xhigh/local-session-text/019ffd6d-fbd6-7711-8c59-113a4db59448/notes.md)
- [2026-08-31 — OpenGuessr Europe-Easy 8-Round Blind Run](models/grok-4.6-xhigh/local-session-text/01a05734-7b21-79d2-aa42-a4761ac6221f/notes.md)
- [2026-08-31 — Grok 4.6 Europe Easy OpenGuessr Blind Run](models/grok-4.6-xhigh/local-session-text/01a0573c-4085-7de2-8066-1b3a7b1e49b9/notes.md)
- [2026-08-31 — OpenGuessr Europe Easy 8-Round Blind Run](models/grok-4.6-xhigh/local-session-text/01a0575b-e4da-7e11-ba06-cc6d75fdffd6/notes.md)
- [2026-08-31 — OpenGuessr europe-easy 8-round competition](models/grok-4.6-xhigh/local-session-text/01a05765-cd67-7dd2-bbb5-41155aca9bd3/notes.md)
- [2026-08-31 — OpenGuessr Europe Medium 9-Round Blind Run](models/grok-4.6-xhigh/local-session-text/01a0577c-6f60-77d0-9b39-6d5ed679f5a9/notes.md)
- [2026-08-31 — Grok OpenGuessr Europe Hard Blind Run](models/grok-4.6-xhigh/local-session-text/01a05798-b5d6-7671-bc06-a05a75bc33e3/notes.md)
- [2026-08-31 — OpenGuessr Easy Europe 8-Round Blind Run](models/grok-4.6-xhigh/local-session-text/01a057b3-6a02-7412-b12e-9a3703f364e1/notes.md)
- [2026-08-31 — OpenGuessr Europe Medium Blind Run Recorder](models/grok-4.6-xhigh/local-session-text/01a057d2-d003-7aa0-8bef-25353cd7591d/notes.md)
- [2026-08-31 — OpenGuessr Europe-Hard 8-Round Blind Run](models/grok-4.6-xhigh/local-session-text/01a057e3-29f9-76f2-b7e4-340f64df6d67/notes.md)
- [2026-08-31 — Grok 4.6 OpenGuessr MCP 8-round Easy](models/grok-4.6-xhigh/local-session-text/01a059f9-3d90-7d12-bc3b-a9a6ceb765aa/notes.md)
- [2026-08-31 — OpenGuessr MCP-assisted 8-round Easy competition](models/grok-4.6-xhigh/local-session-text/01a05a09-63ad-7cc2-9422-f3cc87abf6c6/notes.md)
- [2026-08-31 — OpenGuessr 8-round MCP-assisted full game](models/grok-4.6-xhigh/local-session-text/01a05a10-1d3d-7ee2-92fb-efa4d9baac02/notes.md)
- [2026-08-31 — OpenGuessr MCP-assisted Easy 8-round competition](models/grok-4.6-xhigh/local-session-text/01a05a13-4b94-7ab3-8d9c-300bf111db35/notes.md)
- [2026-08-31 — OpenGuessr MCP-assisted 8-round Easy game](models/grok-4.6-xhigh/local-session-text/01a05a25-6a63-7941-b984-5f96e33c39f6/notes.md)
- [2026-08-31 — OpenGuessr MCP 8-round Easy Competition](models/grok-4.6-xhigh/local-session-text/01a05a2c-245c-75a0-bb42-1a24ff5dd38d/notes.md)
- [2026-08-31 — OpenGuessr Easy MCP-assisted 8-round game](models/grok-4.6-xhigh/local-session-text/01a05a2f-5b15-7210-9f47-ea44c51df987/notes.md)
- [2026-09-01 — OpenGuessr MCP-assisted 8-round Easy competition](models/grok-4.6-xhigh/local-session-text/01a05a45-bc5b-7a10-93b4-5ddc81571595/notes.md)
- [2026-09-01 — OpenGuessr MCP Easy 8-Round Competition Playthrough](models/grok-4.6-xhigh/local-session-text/01a05a5a-118b-7c70-9ff4-b3d51e01649a/notes.md)
- [2026-09-01 — OpenGuessr MCP 8-Round Easy Competition Play](models/grok-4.6-xhigh/local-session-text/01a05a6a-941e-77f0-be28-b0afbc88539f/notes.md)
- [2026-09-01 — OpenGuessr MCP-assisted 8-round Easy competition](models/grok-4.6-xhigh/local-session-text/01a05a7b-e5a3-7483-9c8e-ed25784234e2/notes.md)
- [2026-09-01 — OpenGuessr MCP-assisted Easy 8-round game](models/grok-4.6-xhigh/local-session-text/01a05a87-7561-7ea2-9d9e-9ecc0dbfc364/notes.md)
- [2026-09-01 — OpenGuessr MCP 8-round Easy competition](models/grok-4.6-xhigh/local-session-text/01a05a90-8941-7950-bd9e-317faffec081/notes.md)
- [2026-09-01 — OpenGuessr 8-round MCP-assisted Easy competition](models/grok-4.6-xhigh/local-session-text/01a05a9f-f68b-7e61-b533-bfbab4fea92e/notes.md)
- [2026-09-01 — NAUTILUS Medium OpenGuessr MCP Pin Refinement](models/grok-4.6-xhigh/local-session-text/01a05cdc-9c27-7b82-91f0-26b473b55b14/notes.md)
- [2026-09-01 — NAUTILUS Medium OpenGuessr MCP pin refinement](models/grok-4.6-xhigh/local-session-text/01a05d70-343e-7c72-9e75-0a11cdc8f182/notes.md)
- [2026-09-01 — OpenGuessr MCP 9-round medium one-shot](models/grok-4.6-xhigh/local-session-text/01a05d9d-9fb4-79a3-af20-667bd6206cfd/notes.md)
- [2026-09-01 — OpenGuessr MCP Medium One-Shot 9-Round Game](models/grok-4.6-xhigh/local-session-text/01a05db4-d23b-7202-addb-d02e79644bec/notes.md)
- [2026-09-01 — OpenGuessr MCP 9-round Medium One-shot Control](models/grok-4.6-xhigh/local-session-text/01a05dcb-3ebb-7da3-9144-91c228862ad9/notes.md)
- [2026-09-01 — OpenGuessr MCP 9-round medium one-shot game](models/grok-4.6-xhigh/local-session-text/01a05dd8-fdc8-7520-9586-c69db73b2020/notes.md)
- [2026-09-01 — OpenGuessr 9-round MCP visual geography play](models/grok-4.6-xhigh/local-session-text/01a05df2-2fdf-7a02-a984-123a2988ff03/notes.md)
- [2026-09-01 — OpenGuessr MCP hard one-shot 8-round game](models/grok-4.6-xhigh/local-session-text/01a05e0d-c909-7da2-9508-a1dfb0e7506c/notes.md)
- [2026-09-01 — OpenGuessr 8-round hard MCP one-shot](models/grok-4.6-xhigh/local-session-text/01a05e25-dc85-7a11-bbcf-9c7d1346856d/notes.md)
- [2026-09-01 — OpenGuessr 8-round MCP one-shot hard competition](models/grok-4.6-xhigh/local-session-text/01a05e39-7c19-7aa0-a689-7ea2516ac9e8/notes.md)
- [2026-08-12 — Simple OK-only response request](models/grok-4.6-high/local-session-text/019ff7ff-507c-7693-80df-601ba9cd3683/notes.md)
- [2026-08-12 — 019ff83b-1f4a-7f03-92c6-8477fb95d614](models/grok-4.6-xhigh/local-session-text/019ff83b-1f4a-7f03-92c6-8477fb95d614/notes.md)
