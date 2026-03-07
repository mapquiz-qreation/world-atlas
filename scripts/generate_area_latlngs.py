"""
generate_area_latlngs.py
Natural Earth ポリゴンから歴史的王国の latlngs（Leaflet形式）を生成し
data/europe.json の germanic エラに反映する
"""

import json, os, sys
import geopandas as gpd
from shapely.ops import unary_union
from shapely.geometry import mapping

BASE  = os.path.dirname(__file__)
NE_FILE = os.path.join(BASE, '..', 'data', 'historical_borders', '_ne_110m_countries.geojson')
EU_FILE = os.path.join(BASE, '..', 'data', 'europe.json')

world = gpd.read_file(NE_FILE)

def get_union(iso_list):
    sub = world[world['ISO_A3'].isin(iso_list)]
    if sub.empty:
        sub = world[world['NAME'].isin(iso_list)]
    return unary_union(sub.geometry)

def poly_to_latlngs(geom, simplify_tol=0.6):
    """
    Polygon/MultiPolygon を [[lat,lng],...] に変換（最大面積のポリゴンのみ）
    GeoJSON は [lng,lat] なので反転する
    """
    geom = geom.simplify(simplify_tol, preserve_topology=True)
    if geom.geom_type == 'MultiPolygon':
        geom = max(geom.geoms, key=lambda g: g.area)
    if geom.geom_type != 'Polygon':
        return []
    # exterior ring: [lng, lat] → [lat, lng], 末尾の閉じ点を除く
    coords = list(geom.exterior.coords)[:-1]
    return [[round(lat, 3), round(lng, 3)] for lng, lat in coords]

# ── 歴史的王国の定義 ──────────────────────────────────────────
KINGDOMS = {
    'フランク': {
        'iso':   ['FRA', 'DEU', 'BEL', 'NLD', 'LUX', 'CHE', 'AUT'],
        'color': '#1565C0',
    },
    'ランゴバルド': {
        'iso':   ['ITA', 'SVN'],
        'color': '#6A1B9A',
    },
    '西ゴート': {
        'iso':   ['ESP', 'PRT'],
        'color': '#AD1457',
    },
    'ヴァンダル': {
        'iso':   ['TUN', 'DZA', 'LBY'],
        'color': '#E65100',
    },
    'アングロサクソン': {
        'iso':   ['GBR'],
        'color': '#2E7D32',
    },
    'ビザンツ': {
        'iso':   ['TUR', 'GRC', 'BGR', 'MKD', 'ALB', 'SRB', 'BIH', 'MNE',
                  'ROU', 'CYP', 'SYR', 'LBN', 'ISR', 'JOR', 'EGY'],
        'color': '#F9A825',
    },
}

# 各王国のポリゴン生成
latlngs_map = {}
for name, cfg in KINGDOMS.items():
    geom = get_union(cfg['iso'])
    pts  = poly_to_latlngs(geom, simplify_tol=0.5)
    latlngs_map[name] = pts
    print(f"  {name}: {len(pts)} points")

# ── europe.json に反映 ────────────────────────────────────────
with open(EU_FILE, 'r', encoding='utf-8') as f:
    europe = json.load(f)

germanic = europe['eras']['germanic']
updated = 0
for q in germanic['fixed']:
    if q.get('type') != 'area':
        continue
    for area in q.get('areas', []):
        label = area.get('label', '')
        if label in latlngs_map and latlngs_map[label]:
            old_len = len(area['latlngs'])
            area['latlngs'] = latlngs_map[label]
            print(f"  Updated: {q['text']} / {label}: {old_len} -> {len(area['latlngs'])} pts")
            updated += 1

with open(EU_FILE, 'w', encoding='utf-8') as f:
    json.dump(europe, f, ensure_ascii=False, indent=2)

print(f"\n[OK] {updated} areas updated -> europe.json saved")
