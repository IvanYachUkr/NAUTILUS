#!/usr/bin/env python3
"""
Clean a NAUTILUS / ZCode transcript.md into a compact, chronologically ordered
reasoning-focused Markdown file.

This version fixes misleading round labels by tracking the current benchmark
block and round from screenshot filenames and tool actions, instead of guessing
from arbitrary "Round N" mentions inside the reasoning text.

Usage:
    python clean_transcript_reasoning.py

A Windows file picker opens. Select a transcript.md file.
The cleaned file is written next to the original as:

    transcript_reasoning.md
"""

import json
import re
import sys
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox

MESSAGE_RE = re.compile(
    r"(?ms)^## Message\s+(\d+):\s+assistant\s*$\n(.*?)(?=^## Message\s+\d+:|\Z)"
)

REASONING_RE = re.compile(
    r"(?ms)^### Recorded reasoning\s*$\n(.*?)(?=^### |\Z)"
)

TOOL_BLOCK_RE = re.compile(
    r"(?ms)^### tool\s*$\n\s*````json\s*\n(.*?)\n````"
)

SCREENSHOT_CONTEXT_RE = re.compile(
    r"GLM_FLASH_MAX_R(?P<run>\d+)_(?P<block>EASY|MEDIUM|HARD)"
    r"(?:_R(?P<round>\d{2})_(?P<kind>START|LOOK\d*|RESULT)|_(?P<special>ENTRY|LEADERBOARD))",
    re.IGNORECASE,
)


def clean_reasoning_text(text: str) -> str:
    text = text.strip()
    text = re.split(r"(?m)^Part metadata:\s*$", text, maxsplit=1)[0].strip()
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def parse_tool_blocks(message_body: str):
    tools = []
    for raw_json in TOOL_BLOCK_RE.findall(message_body):
        try:
            obj = json.loads(raw_json)
        except json.JSONDecodeError:
            continue
        tools.append(obj)
    return tools


def screenshot_filename(tool_obj):
    tool = tool_obj.get("tool", "")
    state = tool_obj.get("state") or {}
    inp = state.get("input") or {}
    if tool.endswith("browser_take_screenshot"):
        return inp.get("filename")
    return None


def compact_tool_action(tool_obj: dict):
    tool = tool_obj.get("tool", "")
    state = tool_obj.get("state") or {}
    inp = state.get("input") or {}
    out = state.get("output")

    if tool.endswith("browser_take_screenshot"):
        filename = inp.get("filename")
        return f"Screenshot: `{filename}`" if filename else "Screenshot taken"

    if tool.endswith("openguessr_place_guess"):
        lat = inp.get("latitude")
        lon = inp.get("longitude")
        if lat is not None and lon is not None:
            return f"Place guess: `{lat}, {lon}`"
        return "Place guess"

    if tool.endswith("openguessr_submit_guess"):
        lat = lon = None
        if isinstance(out, str):
            try:
                parsed = json.loads(out)
                pin = parsed.get("pin") or {}
                lat = pin.get("latitude")
                lon = pin.get("longitude")
            except Exception:
                pass
        if lat is not None and lon is not None:
            return f"Submit guess: `{lat}, {lon}`"
        return "Submit guess"

    if tool.endswith("openguessr_continue"):
        return "Continue to next round"

    if tool.endswith("browser_mouse_drag_xy"):
        return "Panorama drag"

    if tool.endswith("browser_mouse_wheel"):
        return "Panorama zoom / wheel"

    return None


def update_context_from_tools(tools, context):
    """
    Reliable context source: screenshot filenames created by the benchmark protocol.
    They encode run, difficulty block and (usually) round.
    """
    for tool_obj in tools:
        filename = screenshot_filename(tool_obj)
        if not filename:
            continue

        match = SCREENSHOT_CONTEXT_RE.search(filename)
        if not match:
            continue

        context["run"] = int(match.group("run"))
        context["block"] = match.group("block").title()

        if match.group("round"):
            context["round"] = int(match.group("round"))
            context["phase"] = (match.group("kind") or "").upper()
        elif match.group("special"):
            special = match.group("special").upper()
            context["phase"] = special
            if special == "ENTRY":
                context["round"] = None


def cautious_reasoning_context(reasoning, context):
    """
    Fallback only when a screenshot has not already established context.
    Uses phrases that normally identify the current round, not arbitrary mentions.
    """
    # Explicit current-block forms such as "Medium Round 2 of 9" / "Hard R02".
    patterns = [
        r"(?im)^\s*(Easy|Medium|Hard)\s+Round\s+0*(\d+)(?:\s+of\s+\d+)?\b",
        r"(?im)^\s*(Easy|Medium|Hard)\s+R0*(\d+)\b",
        r"(?im)^\s*Round\s+0*(\d+)\s+of\s+\d+\b",
    ]

    for i, pattern in enumerate(patterns):
        match = re.search(pattern, reasoning)
        if not match:
            continue

        if i < 2:
            context["block"] = match.group(1).title()
            context["round"] = int(match.group(2))
        else:
            context["round"] = int(match.group(1))
        return


def context_heading(context, message_number):
    run = context.get("run")
    block = context.get("block")
    round_num = context.get("round")

    if block and round_num is not None:
        prefix = f"{block} · Round {round_num}"
        if run is not None:
            prefix = f"Run {run} · {prefix}"
        return prefix

    if block:
        prefix = f"{block} · Setup / transition"
        if run is not None:
            prefix = f"Run {run} · {prefix}"
        return prefix

    return f"Assistant message {message_number}"


def make_output(source_text: str, source_name: str) -> str:
    context = {
        "run": None,
        "block": None,
        "round": None,
        "phase": None,
    }

    sections = []
    count = 0
    last_heading = None

    for message_number, body in MESSAGE_RE.findall(source_text):
        reasoning_match = REASONING_RE.search(body)
        if not reasoning_match:
            continue

        reasoning = clean_reasoning_text(reasoning_match.group(1))
        if not reasoning:
            continue

        tools = parse_tool_blocks(body)

        # First use benchmark screenshot filenames, the most reliable source.
        update_context_from_tools(tools, context)

        # Then use only cautious "current round" phrasing as a fallback/refinement.
        cautious_reasoning_context(reasoning, context)

        actions = []
        for tool_obj in tools:
            action = compact_tool_action(tool_obj)
            if action:
                actions.append(action)

        heading = context_heading(context, message_number)

        # Do not create a giant repeated heading for every message in one round.
        # The first message gets ##; subsequent messages in the same context get ###.
        heading_level = "##" if heading != last_heading else "###"
        section = [f"{heading_level} {heading}", "", reasoning]

        if actions:
            section.extend(["", "**Actions:**"])
            section.extend(f"- {action}" for action in actions)

        sections.append("\n".join(section).strip())
        last_heading = heading
        count += 1

    output = [
        "# Cleaned model reasoning",
        "",
        f"Source: `{source_name}`",
        "",
        "Chronological order is preserved from the original transcript.",
        "Round labels are tracked primarily from the benchmark screenshot filenames, so references to older rounds inside the model's reasoning no longer mislabel later messages.",
        "",
        "---",
        "",
    ]

    if sections:
        output.append("\n\n---\n\n".join(sections))
        output.extend([
            "",
            "---",
            "",
            f"Extracted reasoning blocks: **{count}**",
        ])
    else:
        output.append("No non-empty `### Recorded reasoning` blocks were found.")

    return "\n".join(output).rstrip() + "\n"


def choose_transcript():
    root = tk.Tk()
    root.withdraw()
    root.update()

    selected = filedialog.askopenfilename(
        title="Select NAUTILUS transcript.md",
        filetypes=[
            ("Markdown transcripts", "*.md"),
            ("Text files", "*.txt"),
            ("All files", "*.*"),
        ],
    )

    root.destroy()
    return Path(selected) if selected else None


def main():
    source_path = choose_transcript()
    if source_path is None:
        return 0

    try:
        text = source_path.read_text(encoding="utf-8-sig", errors="replace")
        cleaned = make_output(text, source_path.name)

        if source_path.stem.lower() == "transcript":
            output_path = source_path.with_name("transcript_reasoning.md")
        else:
            output_path = source_path.with_name(source_path.stem + "_reasoning.md")

        output_path.write_text(cleaned, encoding="utf-8")

    except Exception as exc:
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror(
            "Transcript cleaner",
            f"Could not process the transcript:\n\n{exc}",
        )
        root.destroy()
        return 1

    root = tk.Tk()
    root.withdraw()
    messagebox.showinfo(
        "Transcript cleaner",
        f"Done.\n\nCreated:\n{output_path}",
    )
    root.destroy()

    print(f"Created: {output_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
