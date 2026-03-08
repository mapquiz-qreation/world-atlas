"""
generate_all_territories.py
残り9エポックの版図 GeoJSON を Natural Earth データから一括生成
出力先: data/historical_borders/
"""

import json, os
import geopandas as gpd
from shapely.ops import unary_union

BASE      = os.path.dirname(__file__)
OUT_DIR   = os.path.join(BASE, '..', 'data', 'historical_borders')
NE_FILE   = os.path.join(OUT_DIR, '_ne_110m_countries.geojson')

world = gpd.read_file(NE_FILE)

def iso(*codes):
    sub = world[world['ISO_A3'].isin(codes)]
    return unary_union(sub.geometry)

def poly_to_latlngs(geom, tol=0.5):
    geom = geom.simplify(tol, preserve_topology=True)
    if geom.geom_type == 'MultiPolygon':
        geom = max(geom.geoms, key=lambda g: g.area)
    if geom.geom_type != 'Polygon':
        return None
    return geom

def feat(geom, name, color):
    if geom is None or geom.is_empty:
        return None
    geom = geom.simplify(0.4, preserve_topology=True)
    import json as _j
    geo = _j.loads(gpd.GeoSeries([geom]).to_json())["features"][0]["geometry"]
    return {"type": "Feature", "properties": {"name": name, "color": color}, "geometry": geo}

def save(features, filename):
    features = [f for f in features if f]
    fc = {"type": "FeatureCollection", "features": features}
    path = os.path.join(OUT_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(fc, f, ensure_ascii=False, separators=(',', ':'))
    print(f"[OK] {filename}  ({len(features)} features)")

# ═══════════════════════════════════════════════════════════
# 0. 紀元前5世紀 — アケメネス朝ペルシア + ギリシャ
# ═══════════════════════════════════════════════════════════
save([
    feat(iso('IRN','IRQ','SYR','TUR','EGY','PAK','AFG','UZB','TKM',
             'AZE','ARM','GEO','ISR','JOR','LBN','LBY','KWT'),
         "アケメネス朝ペルシア（最大版図 前525年頃）", "#e67e22"),
    feat(iso('GRC','MKD','ALB','CYP'),
         "ギリシャ諸ポリス圏", "#3498db"),
], "achaemenid_500bc.geojson")

# ═══════════════════════════════════════════════════════════
# 2. 紀元前2世紀 — ローマ共和国 + 前漢
# ═══════════════════════════════════════════════════════════
save([
    feat(iso('ITA','ESP','PRT','FRA','GRC','TUN','ALB','SRB',
             'HRV','BIH','MKD','BGR','MNE','SVN'),
         "ローマ共和国（前200年頃）", "#9b59b6"),
    feat(iso('CHN','MNG','PRK','KOR'),
         "前漢帝国（前200〜前100年頃）", "#e74c3c"),
], "roman_republic_han_200bc.geojson")

# ═══════════════════════════════════════════════════════════
# 4. 3〜4世紀 — ローマ帝国（分裂期）+ ササン朝
# ═══════════════════════════════════════════════════════════
save([
    feat(iso('ITA','ESP','PRT','FRA','GBR','BEL','NLD','CHE','AUT','DEU','LUX'),
         "西ローマ帝国（3世紀）", "#8e44ad"),
    feat(iso('TUR','GRC','BGR','ROU','EGY','SYR','LBN','ISR','JOR',
             'LBY','TUN','DZA','MAR','ALB','SRB','MKD','MNE','BIH','HRV'),
         "東ローマ帝国（3世紀）", "#7d3c98"),
    feat(iso('IRN','IRQ','ARM','AZE','AFG','TKM','UZB','PKS'),
         "ササン朝ペルシア（3〜4世紀）", "#f39c12"),
], "rome_sassanid_300ad.geojson")

# ═══════════════════════════════════════════════════════════
# 5. 5〜6世紀 — ゲルマン諸王国 + 東ローマ（ユスティニアヌス）
# ═══════════════════════════════════════════════════════════
save([
    feat(iso('FRA','BEL','NLD','LUX','CHE','DEU','AUT'),
         "フランク王国（5〜6世紀）", "#1565C0"),
    feat(iso('ESP','PRT'),
         "西ゴート王国", "#AD1457"),
    feat(iso('ITA','SVN'),
         "東ゴート→ランゴバルド王国", "#6A1B9A"),
    feat(iso('GBR'),
         "アングロサクソン七王国", "#2E7D32"),
    feat(iso('TUR','GRC','BGR','SRB','ALB','MKD','MNE','BIH','HRV',
             'ROU','CYP','SYR','LBN','ISR','JOR','EGY','LBY','TUN'),
         "東ローマ（ビザンツ）帝国（ユスティニアヌス期）", "#F9A825"),
], "germanic_byzantine_500ad.geojson")

# ═══════════════════════════════════════════════════════════
# 7. 8〜9世紀 — フランク王国（カール大帝）+ アッバース朝
# ═══════════════════════════════════════════════════════════
save([
    feat(iso('FRA','DEU','BEL','NLD','LUX','CHE','AUT','ITA','SVN',
             'HRV','CZE','SVK','HUN','POL'),
         "フランク王国（カール大帝）", "#1565C0"),
    feat(iso('IRQ','SYR','LBN','ISR','JOR','EGY','LBY','TUN','DZA',
             'IRN','AFG','UZB','TKM','TJK','SAU','YEM','OMN','ARE','QAT','BHR','KWT'),
         "アッバース朝（8〜9世紀）", "#e74c3c"),
    feat(iso('TUR','GRC','BGR','SRB','ALB','MKD','MNE','BIH','ROU'),
         "東ローマ（ビザンツ）帝国（8〜9世紀）", "#F9A825"),
], "frankish_abbasid_800ad.geojson")

# ═══════════════════════════════════════════════════════════
# 8. 10〜11世紀 — セルジューク朝 + 宋朝
# ═══════════════════════════════════════════════════════════
save([
    feat(iso('TUR','IRN','IRQ','SYR','AZE','ARM','GEO','AFG','UZB','TKM'),
         "セルジューク朝（1071年頃最大版図）", "#27ae60"),
    feat(iso('CHN'),
         "宋朝（10〜11世紀）", "#e74c3c"),
    feat(iso('GRC','BGR','MKD','SRB','ALB','MNE','BIH','HRV','ROU','CYP'),
         "東ローマ（ビザンツ）帝国（10〜11世紀）", "#F9A825"),
], "seljuk_song_1000ad.geojson")

# ═══════════════════════════════════════════════════════════
# 10. 14〜15世紀 — 明朝 + オスマン帝国（拡大期）+ ティムール朝
# ═══════════════════════════════════════════════════════════
save([
    feat(iso('CHN','MNG','PRK','KOR','VNM'),
         "明朝（14〜15世紀）", "#e74c3c"),
    feat(iso('TUR','GRC','BGR','SRB','ALB','MKD','MNE','BIH','HRV',
             'ROU','ARM','AZE','SYR','LBN','ISR','JOR','IRQ'),
         "オスマン帝国（拡大期・15世紀）", "#3498db"),
    feat(iso('AFG','UZB','TJK','TKM','IRN','KAZ'),
         "ティムール朝（14〜15世紀）", "#f39c12"),
], "ming_ottoman_timurid_1400ad.geojson")

# ═══════════════════════════════════════════════════════════
# 12. 17〜18世紀 — 清帝国 + ムガル帝国
# ═══════════════════════════════════════════════════════════
save([
    feat(iso('CHN','MNG','PRK','KOR'),
         "清帝国（17〜18世紀）", "#e74c3c"),
    feat(iso('IND','PAK','BGD','AFG'),
         "ムガル帝国（17〜18世紀）", "#f39c12"),
    feat(iso('TUR','GRC','BGR','ROU','UKR','MDA','SRB','BIH','HRV','ALB',
             'MKD','MNE','HUN','SYR','LBN','ISR','JOR','IRQ',
             'SAU','YEM','EGY','LBY','TUN','DZA'),
         "オスマン帝国（17〜18世紀）", "#3498db"),
], "qing_mughal_ottoman_1700ad.geojson")

# ═══════════════════════════════════════════════════════════
# 14. 20世紀前半 — 大日本帝国 + ナチスドイツ最大版図（1942）
# ═══════════════════════════════════════════════════════════
save([
    feat(iso('JPN','KOR','PRK','TWN','MNG'),
         "大日本帝国（1942年頃）", "#e74c3c"),
    feat(iso('DEU','AUT','POL','CZE','SVK','BEL','NLD','LUX',
             'DNK','NOR','FRA','HUN','SRB','BIH','HRV','MNE','ALB',
             'MKD','GRC','UKR','BLR','LTU','LVA','EST'),
         "ナチスドイツ支配圏（1942年最大版図）", "#2c3e50"),
    feat(iso('ITA','LBY','TUN','ALB'),
         "イタリア帝国（ファシスト）", "#27ae60"),
], "japan_nazi_1942ad.geojson")

print("\n[DONE] 9 files generated")
