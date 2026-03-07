"""
generate_historical_territories.py
歴史的版図 GeoJSON を Natural Earth 110m データから生成する
出力先: data/historical_borders/
"""

import json
import urllib.request
import os
import geopandas as gpd
import pandas as pd
from shapely.ops import unary_union

# ── 出力ディレクトリ ────────────────────────────────────────
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'historical_borders')
os.makedirs(OUT_DIR, exist_ok=True)

# ── Natural Earth 110m データを取得 ────────────────────────
NE_URL  = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
NE_FILE = os.path.join(OUT_DIR, '_ne_110m_countries.geojson')

if not os.path.exists(NE_FILE):
    print("Natural Earth データをダウンロード中...")
    urllib.request.urlretrieve(NE_URL, NE_FILE)
    print("ダウンロード完了")

world = gpd.read_file(NE_FILE)
print(f"国数: {len(world)}")

# ISO_A3 コードで検索するヘルパー
def iso_to_poly(iso_list):
    subset = world[world['ISO_A3'].isin(iso_list)]
    if subset.empty:
        # NAME でフォールバック
        subset = world[world['NAME'].isin(iso_list)]
    return unary_union(subset.geometry)

def iso_to_poly_by_name(names):
    subset = world[world['NAME'].isin(names)]
    return unary_union(subset.geometry)

def make_feature(poly, name, color, alpha=0.22):
    """Polygon/MultiPolygon → GeoJSON Feature"""
    if poly is None or poly.is_empty:
        return None
    return {
        "type": "Feature",
        "properties": {"name": name, "color": color, "fillOpacity": alpha},
        "geometry": json.loads(gpd.GeoSeries([poly]).to_json())["features"][0]["geometry"],
    }

def save_geojson(features, filename):
    features = [f for f in features if f]
    fc = {"type": "FeatureCollection", "features": features}
    path = os.path.join(OUT_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(fc, f, ensure_ascii=False, separators=(',', ':'))
    print(f"[OK] {filename} saved  ({len(features)} features)")

# ═══════════════════════════════════════════════════════════
# 1. アレクサンドロス帝国 / Successor States (~300 BC)
#    epoch: 紀元前4〜3世紀 (index 1)
# ═══════════════════════════════════════════════════════════
print("\n--- アレクサンドロス帝国 ---")

# マケドニア・ギリシャ本国
macedon = iso_to_poly(['GRC', 'MKD', 'ALB'])
# アナトリア（小アジア）
anatolia = iso_to_poly(['TUR'])
# エジプト（プトレマイオス朝の核心）
egypt = iso_to_poly(['EGY'])
# レヴァント + メソポタミア
levant = iso_to_poly(['SYR', 'LBN', 'ISR', 'JOR', 'IRQ'])
# ペルシア本土（セレウコス朝）
persia = iso_to_poly(['IRN', 'KWT'])
# 中央アジア・インダス遠征域
central_asia = iso_to_poly(['AFG', 'TKM', 'UZB', 'TJK'])

save_geojson([
    make_feature(macedon,     "マケドニア（アレクサンドロス帝国本国）", "#f4d03f"),
    make_feature(egypt,       "エジプト（プトレマイオス朝）",           "#e67e22"),
    make_feature(anatolia,    "アナトリア（セレウコス朝）",             "#2ecc71"),
    make_feature(levant,      "レヴァント・メソポタミア（セレウコス朝）","#2ecc71"),
    make_feature(persia,      "ペルシア（セレウコス朝）",               "#27ae60"),
    make_feature(central_asia,"中央アジア（アレクサンドロスの東征域）", "#16a085"),
], "alexander_300bc.geojson")

# ═══════════════════════════════════════════════════════════
# 2. ローマ帝国最大版図 (Trajan ~117 AD)
#    epoch: 1〜2世紀 (index 3)
# ═══════════════════════════════════════════════════════════
print("\n--- ローマ帝国最大版図 ---")

# 西欧
roman_west = iso_to_poly(['PRT', 'ESP', 'FRA', 'BEL', 'NLD', 'LUX', 'CHE', 'ITA', 'MCO', 'SMR', 'VAT'])
# ブリタニア（南部）
roman_britain = iso_to_poly(['GBR', 'IRL'])
# バルカン・ダキア
roman_balkans = iso_to_poly(['ROU', 'BGR', 'GRC', 'MKD', 'ALB', 'SVN', 'HRV', 'BIH', 'SRB', 'MNE', 'XKX'])
# アナトリア・東方
roman_east = iso_to_poly(['TUR', 'CYP', 'SYR', 'LBN', 'ISR', 'JOR'])
# メソポタミア（トラヤヌスの短期征服）
roman_meso = iso_to_poly(['IRQ'])
# エジプト・北アフリカ
roman_africa = iso_to_poly(['EGY', 'LBY', 'TUN', 'DZA', 'MAR'])

save_geojson([
    make_feature(roman_west,    "ローマ帝国（西ヨーロッパ）",   "#9b59b6"),
    make_feature(roman_britain, "ブリタニア（ローマ帝国）",     "#8e44ad"),
    make_feature(roman_balkans, "バルカン・ダキア（ローマ帝国）","#8e44ad"),
    make_feature(roman_east,    "東方属州（ローマ帝国）",       "#7d3c98"),
    make_feature(roman_meso,    "メソポタミア（トラヤヌス征服）","#6c3483"),
    make_feature(roman_africa,  "北アフリカ（ローマ帝国）",     "#7d3c98"),
], "roman_empire_117ad.geojson")

# ═══════════════════════════════════════════════════════════
# 3. ウマイヤ朝最大版図 (~750 AD)
#    epoch: 7世紀 (index 6)
# ═══════════════════════════════════════════════════════════
print("\n--- ウマイヤ朝 ---")

# アラビア半島（発祥地）
umayyad_arabia = iso_to_poly(['SAU', 'YEM', 'OMN', 'ARE', 'QAT', 'BHR', 'KWT'])
# メソポタミア・レヴァント
umayyad_levant = iso_to_poly(['IRQ', 'SYR', 'LBN', 'ISR', 'JOR'])
# 北アフリカ
umayyad_africa = iso_to_poly(['EGY', 'LBY', 'TUN', 'DZA', 'MAR'])
# イベリア半島（アンダルス）
umayyad_iberia = iso_to_poly(['ESP', 'PRT'])
# ペルシア・中央アジア
umayyad_east = iso_to_poly(['IRN', 'AFG', 'TKM', 'UZB', 'TJK'])

save_geojson([
    make_feature(umayyad_arabia, "アラビア半島（ウマイヤ朝の発祥地）",  "#e74c3c"),
    make_feature(umayyad_levant, "レヴァント・メソポタミア（ウマイヤ朝）","#c0392b"),
    make_feature(umayyad_africa, "北アフリカ（ウマイヤ朝）",            "#e74c3c"),
    make_feature(umayyad_iberia, "イベリア半島・アンダルス（ウマイヤ朝）","#a93226"),
    make_feature(umayyad_east,   "ペルシア・中央アジア（ウマイヤ朝）",  "#c0392b"),
], "umayyad_750ad.geojson")

# ═══════════════════════════════════════════════════════════
# 4. モンゴル帝国 4ハーン国 (~1280 AD)
#    epoch: 13世紀 (index 9)
# ═══════════════════════════════════════════════════════════
print("\n--- モンゴル帝国 ---")

# 元（大ハーン国）: 中国・モンゴル・朝鮮
yuan = iso_to_poly(['CHN', 'MNG', 'KOR', 'PRK'])
# チャガタイ・ハーン国: 中央アジア
chagatai = iso_to_poly(['KAZ', 'UZB', 'TKM', 'KGZ', 'TJK', 'AFG'])
# イルハン国: イラン・イラク・アゼルバイジャン・ジョージア・アルメニア・トルコ東部
ilkhanate = iso_to_poly(['IRN', 'IRQ', 'AZE', 'GEO', 'ARM', 'TUR'])
# キプチャク・ハーン国（金帳汗国）: ロシア・ウクライナ・カザフスタン北部
golden_horde = iso_to_poly(['RUS', 'UKR', 'MDA', 'BLR'])

save_geojson([
    make_feature(yuan,        "元（大ハーン国）",                     "#e67e22"),
    make_feature(chagatai,    "チャガタイ・ハーン国",                  "#f39c12"),
    make_feature(ilkhanate,   "イルハン国",                           "#d35400"),
    make_feature(golden_horde,"キプチャク・ハーン国（金帳汗国）",      "#e74c3c"),
], "mongol_empire_1280ad.geojson")

# ═══════════════════════════════════════════════════════════
# 5. オスマン帝国最大版図 (Suleiman ~1566 AD)
#    epoch: 16世紀 (index 11)
# ═══════════════════════════════════════════════════════════
print("\n--- オスマン帝国 ---")

# アナトリア・バルカン（核心）
ottoman_core = iso_to_poly(['TUR', 'GRC', 'BGR', 'MKD', 'ALB', 'SRB', 'BIH', 'MNE', 'XKX', 'HRV', 'ROU', 'MDA'])
# コーカサス・クリミア
ottoman_caucasus = iso_to_poly(['UKR', 'AZE', 'GEO', 'ARM'])
# レヴァント・アラビア
ottoman_levant = iso_to_poly(['SYR', 'LBN', 'ISR', 'JOR', 'IRQ', 'SAU', 'YEM', 'KWT'])
# エジプト・北アフリカ
ottoman_africa = iso_to_poly(['EGY', 'LBY', 'TUN', 'DZA'])
# ハンガリー（スレイマンの征服）
ottoman_hungary = iso_to_poly(['HUN'])

save_geojson([
    make_feature(ottoman_core,     "アナトリア・バルカン（オスマン帝国）",    "#3498db"),
    make_feature(ottoman_caucasus, "コーカサス・クリミア（オスマン帝国）",    "#2980b9"),
    make_feature(ottoman_levant,   "レヴァント・アラビア（オスマン帝国）",    "#2471a3"),
    make_feature(ottoman_africa,   "エジプト・北アフリカ（オスマン帝国）",    "#1a5276"),
    make_feature(ottoman_hungary,  "ハンガリー（スレイマン大帝の征服地）",    "#21618c"),
], "ottoman_1566ad.geojson")

print("\n[DONE] All 5 files generated!")
print(f"出力先: {os.path.abspath(OUT_DIR)}")
