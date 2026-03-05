"""
Generate an approximate 1815 Congress of Vienna powers GeoJSON
from Natural Earth current country polygons.

Output:
  data/historical_borders/vienna_1815_major_powers.geojson
"""

from __future__ import annotations

import json
import os
import urllib.request


SOURCE_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/"
    "ne_110m_admin_0_countries.geojson"
)


# NOTE:
# These are intentionally approximate and built from modern country boundaries.
# For exam-learning map drills, this gives a fast visual guide to major powers.
EMPIRE_MEMBERS = {
    "Austria (Habsburg Empire, approx. 1815)": [
        "Austria",
        "Czechia",
        "Slovakia",
        "Hungary",
        "Slovenia",
        "Croatia",
    ],
    "Prussia (approx. 1815 influence area)": [
        "Germany",
        "Poland",
    ],
    "Russian Empire (approx. 1815)": [
        "Russia",
        "Belarus",
        "Ukraine",
        "Lithuania",
        "Latvia",
        "Estonia",
        "Finland",
    ],
    "France (Bourbon Restoration, 1815)": [
        "France",
    ],
    "United Kingdom (with Ireland, 1815)": [
        "United Kingdom",
        "Ireland",
    ],
}


def to_multi_polygon_coords(geometry: dict) -> list:
    gtype = geometry.get("type")
    coords = geometry.get("coordinates", [])
    if gtype == "Polygon":
        return [coords]
    if gtype == "MultiPolygon":
        return coords
    return []


def main() -> None:
    with urllib.request.urlopen(SOURCE_URL) as resp:
        world = json.load(resp)

    by_name = {}
    for ft in world.get("features", []):
        props = ft.get("properties", {})
        name = props.get("NAME")
        if name:
            by_name[name] = ft

    features = []
    for empire_name, member_names in EMPIRE_MEMBERS.items():
        missing = [n for n in member_names if n not in by_name]
        if missing:
            raise ValueError(f"Missing countries in Natural Earth: {missing}")

        mp_coords = []
        for name in member_names:
            geom = by_name[name]["geometry"]
            mp_coords.extend(to_multi_polygon_coords(geom))

        features.append(
            {
                "type": "Feature",
                "properties": {
                    "period": "1815",
                    "name": empire_name,
                    "members_modern": member_names,
                    "source": "Natural Earth (Public Domain) - ne_110m_admin_0_countries",
                    "accuracy": "approximation_from_modern_boundaries",
                },
                "geometry": {
                    "type": "MultiPolygon",
                    "coordinates": mp_coords,
                },
            }
        )

    out = {
        "type": "FeatureCollection",
        "name": "vienna_1815_major_powers_approx",
        "features": features,
    }

    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    out_dir = os.path.join(root, "data", "historical_borders")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "vienna_1815_major_powers.geojson")

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)

    print(out_path)
    print(f"features: {len(features)}")


if __name__ == "__main__":
    main()
