"""
generate_five_hu_latlngs.py
五胡（匈奴・鮮卑・羯・氐・羌）の居住域を
Natural Earth 50m admin-1（省レベル）データから生成し
data/china.json に反映する
"""

import json, os, urllib.request
import geopandas as gpd
from shapely.ops import unary_union

BASE    = os.path.dirname(__file__)
BORDER_DIR = os.path.join(BASE, '..', 'data', 'historical_borders')
NE_COUNTRY = os.path.join(BORDER_DIR, '_ne_110m_countries.geojson')
NE_PROV_FILE = os.path.join(BORDER_DIR, '_ne_50m_admin1_provinces.geojson')
CN_FILE = os.path.join(BASE, '..', 'data', 'china.json')

# ── 省レベルデータを取得 ──────────────────────────────────────
NE_PROV_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector"
    "/master/geojson/ne_50m_admin_1_states_provinces.geojson"
)
if not os.path.exists(NE_PROV_FILE):
    print("省データをダウンロード中...")
    urllib.request.urlretrieve(NE_PROV_URL, NE_PROV_FILE)
    print("完了")

world    = gpd.read_file(NE_COUNTRY)
prov_all = gpd.read_file(NE_PROV_FILE)
cn_prov  = prov_all[prov_all['admin'] == 'China']

def country_poly(iso_list):
    sub = world[world['ISO_A3'].isin(iso_list)]
    return unary_union(sub.geometry)

def prov_poly(prov_names):
    sub = cn_prov[cn_prov['name'].isin(prov_names)]
    return unary_union(sub.geometry)

def merge(*geoms):
    valid = [g for g in geoms if g and not g.is_empty]
    return unary_union(valid)

def poly_to_latlngs(geom, simplify_tol=0.6):
    geom = geom.simplify(simplify_tol, preserve_topology=True)
    if geom.geom_type == 'MultiPolygon':
        geom = max(geom.geoms, key=lambda g: g.area)
    if geom.geom_type != 'Polygon':
        return []
    coords = list(geom.exterior.coords)[:-1]
    return [[round(lat, 3), round(lng, 3)] for lng, lat in coords]

# ── 五胡の居住域定義 ───────────────────────────────────────────
# 匈奴: モンゴル高原中心（モンゴル国 + 内モンゴル）
xiongnu = merge(
    country_poly(['MNG']),
    prov_poly(['Inner Mongol']),
)

# 鮮卑: モンゴル高原東部 + 満洲（内モンゴル + 東北三省）
xianbei = merge(
    prov_poly(['Inner Mongol', 'Heilongjiang', 'Jilin', 'Liaoning']),
)

# 羯: 山西盆地 + 河北（現山西省・河北省）
jie = merge(
    prov_poly(['Shanxi', 'Hebei']),
)

# 氐: 関中・隴西（陝西省・甘粛省）
di = merge(
    prov_poly(['Shaanxi', 'Gansu']),
)

# 羌: 青海チベット高原 + 四川北部（青海・チベット・甘粛・四川）
qiang = merge(
    prov_poly(['Qinghai', 'Xizang', 'Sichuan', 'Gansu']),
)

TRIBES = {
    '匈奴':     (xiongnu,  0.7),
    '鮮卑':     (xianbei,  0.5),
    '羯':       (jie,      0.3),
    '氐':       (di,       0.3),
    '羌':       (qiang,    0.5),
}

latlngs_map = {}
for name, (geom, tol) in TRIBES.items():
    pts = poly_to_latlngs(geom, simplify_tol=tol)
    latlngs_map[name] = pts
    print(f"  tribe: {len(pts)} points")

# ── china.json に反映 ────────────────────────────────────────
with open(CN_FILE, 'r', encoding='utf-8') as f:
    china = json.load(f)

updated = 0
for q in china['eras']['five_hu']['fixed']:
    if q.get('type') != 'area':
        continue
    for area in q.get('areas', []):
        label = area.get('label', '')
        if label in latlngs_map and latlngs_map[label]:
            old_len = len(area['latlngs'])
            area['latlngs'] = latlngs_map[label]
            print(f"  Updated area: {old_len} -> {len(area['latlngs'])} pts")
            updated += 1

with open(CN_FILE, 'w', encoding='utf-8') as f:
    json.dump(china, f, ensure_ascii=False, indent=2)

print(f"\n[OK] {updated} areas updated -> china.json saved")
