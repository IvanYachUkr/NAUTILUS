#!/usr/bin/env python3
"""
Create a screenshot-friendly HTML map of the NAUTILUS benchmark locations.

Reads:
    demo_and_extension/data/competitions/europe-easy.json
    demo_and_extension/data/competitions/europe-medium.json
    demo_and_extension/data/competitions/europe-hard.json

Coordinates are extracted from each location's google_maps_link.

Dependency:
    pip install folium

Run:
    python benchmark_locations_map_no_key.py

Output:
    benchmark_locations_map.html
"""

from __future__ import annotations

import json
import re
import webbrowser
from collections import Counter
from pathlib import Path

import folium


# =============================================================================
# CUSTOMIZE THESE SETTINGS
# =============================================================================

DIFFICULTY_COLORS = {
    "easy": "#2ECC71",
    "medium": "#F39C12",
    "hard": "#E74C3C",
}

MARKER_RADIUS = 8
MARKER_BORDER_COLOR = "#FFFFFF"
MARKER_BORDER_WIDTH = 2
MARKER_OPACITY = 0.95

# No API key required.
# "esri_light" keeps the clean light-gray presentation look.
# "osm" uses standard OpenStreetMap.
MAP_STYLE = "esri_light"

MAP_PADDING = (35, 35)

SHOW_TITLE = True
TITLE_TEXT = "NAUTILUS Benchmark Locations"

OPEN_AFTER_CREATE = False
OUTPUT_HTML = "benchmark_locations_map.html"

# =============================================================================


COMPETITION_FILES = (
    "europe-easy.json",
    "europe-medium.json",
    "europe-hard.json",
)

COORDINATE_RE = re.compile(r"@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)")


def find_repo_root() -> Path:
    candidates = []

    try:
        script_path = Path(__file__).resolve()
        candidates.extend([script_path.parent, *script_path.parents])
    except NameError:
        pass

    cwd = Path.cwd().resolve()
    candidates.extend([cwd, *cwd.parents])

    seen = set()
    for candidate in candidates:
        if candidate in seen:
            continue
        seen.add(candidate)

        competitions_dir = candidate / "demo_and_extension" / "data" / "competitions"
        if competitions_dir.is_dir():
            return candidate

    raise FileNotFoundError(
        "Could not find the NAUTILUS repository root.\n"
        "Expected: demo_and_extension/data/competitions/\n"
        "Put this script inside the repository, or run it from the repository."
    )


def extract_coordinates(google_maps_link: str) -> tuple[float, float]:
    match = COORDINATE_RE.search(google_maps_link)
    if not match:
        raise ValueError(
            "Could not extract coordinates from Google Maps URL:\n"
            f"{google_maps_link}"
        )
    return float(match.group(1)), float(match.group(2))


def load_locations(competitions_dir: Path) -> list[dict]:
    locations = []

    for filename in COMPETITION_FILES:
        path = competitions_dir / filename
        if not path.exists():
            raise FileNotFoundError(f"Missing competition definition: {path}")

        with path.open("r", encoding="utf-8") as f:
            competition = json.load(f)

        for location in competition.get("locations", []):
            difficulty = str(location.get("difficulty", "")).lower().strip()

            if difficulty not in DIFFICULTY_COLORS:
                raise ValueError(
                    f"Unknown difficulty '{difficulty}' in {path.name} / "
                    f"{location.get('id', '<unknown>')}"
                )

            link = location.get("google_maps_link")
            if not link:
                raise ValueError(
                    f"No google_maps_link in {path.name} / "
                    f"{location.get('id', '<unknown>')}"
                )

            lat, lon = extract_coordinates(link)

            locations.append(
                {
                    "id": location.get("id", ""),
                    "country": location.get("country", ""),
                    "city_or_region": location.get("city_or_region", ""),
                    "scene_type": location.get("scene_type", ""),
                    "difficulty": difficulty,
                    "primary_clue_type": location.get("primary_clue_type", ""),
                    "lat": lat,
                    "lon": lon,
                }
            )

    return locations


def add_basemap(map_object: folium.Map) -> None:
    if MAP_STYLE == "esri_light":
        folium.TileLayer(
            tiles=(
                "https://server.arcgisonline.com/ArcGIS/rest/services/"
                "Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            ),
            attr=(
                "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, "
                "Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, "
                "Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), "
                "swisstopo, and the GIS User Community"
            ),
            name="Esri Light Gray",
            overlay=False,
            control=False,
        ).add_to(map_object)

    elif MAP_STYLE == "osm":
        folium.TileLayer(
            tiles="OpenStreetMap",
            name="OpenStreetMap",
            overlay=False,
            control=False,
        ).add_to(map_object)

    else:
        raise ValueError(
            f"Unknown MAP_STYLE: {MAP_STYLE!r}. "
            "Use 'esri_light' or 'osm'."
        )


def add_title(map_object: folium.Map) -> None:
    if not SHOW_TITLE:
        return

    title_html = f"""
    <div style="
        position: fixed;
        top: 18px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        background: rgba(255,255,255,0.94);
        border: 1px solid rgba(0,0,0,0.15);
        border-radius: 8px;
        padding: 9px 16px;
        font-family: Arial, sans-serif;
        font-size: 18px;
        font-weight: 700;
        color: #222;
        box-shadow: 0 1px 5px rgba(0,0,0,0.12);
        white-space: nowrap;
    ">
        {TITLE_TEXT}
    </div>
    """
    map_object.get_root().html.add_child(folium.Element(title_html))


def add_legend(map_object: folium.Map, counts: Counter) -> None:
    rows = []

    for difficulty in ("easy", "medium", "hard"):
        color = DIFFICULTY_COLORS[difficulty]
        label = difficulty.capitalize()
        count = counts.get(difficulty, 0)

        rows.append(
            f"""
            <div style="display:flex;align-items:center;gap:8px;margin:5px 0;">
                <span style="
                    width:13px;
                    height:13px;
                    border-radius:50%;
                    background:{color};
                    border:2px solid white;
                    box-shadow:0 0 0 1px rgba(0,0,0,0.25);
                    display:inline-block;
                    flex:0 0 auto;
                "></span>
                <span>{label} ({count})</span>
            </div>
            """
        )

    legend_html = f"""
    <div style="
        position: fixed;
        bottom: 26px;
        left: 26px;
        z-index: 9999;
        background: rgba(255,255,255,0.94);
        border: 1px solid rgba(0,0,0,0.15);
        border-radius: 8px;
        padding: 11px 14px;
        font-family: Arial, sans-serif;
        font-size: 13px;
        color: #222;
        box-shadow: 0 1px 5px rgba(0,0,0,0.12);
    ">
        <div style="font-weight:700;margin-bottom:6px;">Difficulty</div>
        {''.join(rows)}
    </div>
    """

    map_object.get_root().html.add_child(folium.Element(legend_html))


def build_map(locations: list[dict], output_path: Path) -> None:
    if not locations:
        raise RuntimeError("No benchmark locations were found.")

    avg_lat = sum(loc["lat"] for loc in locations) / len(locations)
    avg_lon = sum(loc["lon"] for loc in locations) / len(locations)

    benchmark_map = folium.Map(
        location=[avg_lat, avg_lon],
        zoom_start=4,
        tiles=None,
        control_scale=True,
        zoom_control=True,
    )

    add_basemap(benchmark_map)

    bounds = []

    for loc in locations:
        color = DIFFICULTY_COLORS[loc["difficulty"]]
        bounds.append([loc["lat"], loc["lon"]])

        tooltip = (
            f"{loc['city_or_region']}, {loc['country']} "
            f"- {loc['difficulty'].capitalize()}"
        )

        popup_html = f"""
        <div style="font-family:Arial,sans-serif;min-width:210px;">
            <div style="font-weight:700;font-size:15px;margin-bottom:5px;">
                {loc['city_or_region']}
            </div>
            <div><b>Country:</b> {loc['country']}</div>
            <div><b>Difficulty:</b> {loc['difficulty'].capitalize()}</div>
            <div><b>Scene:</b> {loc['scene_type']}</div>
            <div><b>Primary clue:</b> {loc['primary_clue_type']}</div>
            <div><b>ID:</b> {loc['id']}</div>
            <div style="margin-top:5px;color:#666;font-size:11px;">
                {loc['lat']:.6f}, {loc['lon']:.6f}
            </div>
        </div>
        """

        folium.CircleMarker(
            location=[loc["lat"], loc["lon"]],
            radius=MARKER_RADIUS,
            color=MARKER_BORDER_COLOR,
            weight=MARKER_BORDER_WIDTH,
            fill=True,
            fill_color=color,
            fill_opacity=MARKER_OPACITY,
            tooltip=tooltip,
            popup=folium.Popup(popup_html, max_width=320),
        ).add_to(benchmark_map)

    benchmark_map.fit_bounds(bounds, padding=MAP_PADDING)

    counts = Counter(loc["difficulty"] for loc in locations)
    add_title(benchmark_map)
    add_legend(benchmark_map, counts)

    benchmark_map.save(str(output_path))


def main() -> None:
    repo_root = find_repo_root()
    competitions_dir = repo_root / "demo_and_extension" / "data" / "competitions"
    locations = load_locations(competitions_dir)

    try:
        output_dir = Path(__file__).resolve().parent
    except NameError:
        output_dir = Path.cwd()

    output_path = output_dir / OUTPUT_HTML
    build_map(locations, output_path)

    counts = Counter(loc["difficulty"] for loc in locations)

    print(f"Loaded {len(locations)} benchmark locations:")
    print(f"  Easy:   {counts.get('easy', 0)}")
    print(f"  Medium: {counts.get('medium', 0)}")
    print(f"  Hard:   {counts.get('hard', 0)}")
    print()
    print(f"Created: {output_path}")

    if OPEN_AFTER_CREATE:
        webbrowser.open(output_path.resolve().as_uri())


if __name__ == "__main__":
    main()
