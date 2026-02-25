const fs = require("fs");
const path = require("path");

// data/europe.json を直接読み書き
const jsonPath = path.join(__dirname, "data", "europe.json");
const data = { europe: JSON.parse(fs.readFileSync(jsonPath, "utf8")) };

// 3つの基準点（europe.png 上の幾何学的に正しい実測値）
// ※ ベルリン(52.5°N)は地図上端(53°N付近)にほぼ接しているため top≈2%
const refs = [
  { name: "アテネ",   top: 55.2, left: 68.6, lat: 37.9838, lon: 23.7275 },
  { name: "パリ",     top: 16.9, left: 27.5, lat: 48.8566, lon:  2.3522 },
  { name: "ベルリン", top:  2.2, left: 48.7, lat: 52.52,   lon: 13.405  }
];

function mercatorY(latDeg) {
  const phi = (latDeg * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + phi / 2));
}
function mercatorYInv(y) {
  const phi = 2 * Math.atan(Math.exp(y)) - Math.PI / 2;
  return (phi * 180) / Math.PI;
}

// 基準点から画像の緯度経度範囲を逆算（中国版と同じロジック）
const leftRatios = refs.map(p => p.left / 100);
const lons = refs.map(p => p.lon);
const meanLeft = leftRatios.reduce((s, x) => s + x, 0) / refs.length;
const meanLon  = lons.reduce((s, x) => s + x, 0) / refs.length;
let covLonLeft = 0, varLeft = 0;
for (let i = 0; i < refs.length; i++) {
  covLonLeft += (lons[i] - meanLon) * (leftRatios[i] - meanLeft);
  varLeft    += (leftRatios[i] - meanLeft) ** 2;
}
const lonRange = varLeft > 1e-10 ? covLonLeft / varLeft : 50;
const lonMin   = meanLon - lonRange * meanLeft;
const lonMax   = lonMin + lonRange;

const topRatios = refs.map(p => p.top / 100);
const mVal = refs.map(p => mercatorY(p.lat));
const meanTop = topRatios.reduce((s, x) => s + x, 0) / refs.length;
const meanM   = mVal.reduce((s, x) => s + x, 0) / refs.length;
let covMTop = 0, varTop = 0;
for (let i = 0; i < refs.length; i++) {
  covMTop += (mVal[i] - meanM) * (topRatios[i] - meanTop);
  varTop  += (topRatios[i] - meanTop) ** 2;
}
const mRange = varTop > 1e-10 ? -covMTop / varTop : 1;
const mNorth = meanM + mRange * meanTop;
const mSouth = meanM - mRange * (1 - meanTop);
const latMax = mercatorYInv(mNorth);
const latMin = mercatorYInv(mSouth);

console.log("europe.png の推定範囲 (3基準点から逆算):");
console.log("  lon:", lonMin.toFixed(2), "～", lonMax.toFixed(2), "  lat:", latMin.toFixed(2), "～", latMax.toFixed(2));
refs.forEach(p => {
  const topFit  = 100 * (mercatorY(latMax) - mercatorY(p.lat)) / (mercatorY(latMax) - mercatorY(latMin));
  const leftFit = 100 * (p.lon - lonMin) / (lonMax - lonMin);
  console.log(" ", p.name, "=> top", topFit.toFixed(1), "(ref", p.top, "), left", leftFit.toFixed(1), "(ref", p.left, ")");
});

function toPercent(topVal, leftVal) {
  const t = Math.max(0, Math.min(100, topVal));
  const l = Math.max(0, Math.min(100, leftVal));
  return { top: t.toFixed(1) + "%", left: l.toFixed(1) + "%" };
}
function transform(lat, lon) {
  const mR  = mercatorY(latMax) - mercatorY(latMin);
  const top  = 100 * (mercatorY(latMax) - mercatorY(lat)) / mR;
  const left = 100 * (lon - lonMin) / (lonMax - lonMin);
  return toPercent(top, left);
}
function getKey(text) {
  const i = text.indexOf(" (");
  return i > 0 ? text.slice(0, i) : text;
}

// ヨーロッパ全都市の緯度経度
const coords = {
  "アテネ":                   [37.9838, 23.7275],
  "ローマ":                   [41.8902, 12.4922],
  "アレクサンドリア":          [31.2001, 29.9187],
  "カルタゴ":                  [36.8529, 10.3230],
  "スパルタ":                  [37.0819, 22.4536],
  "ミラノ":                    [45.4642,  9.19  ],
  "マッシリア":                [43.2965,  5.3698],
  "ビザンティウム":            [41.0082, 28.9784],
  "シラクサ":                  [37.0755, 15.2866],
  "ニケーア":                  [40.4286, 29.7211],
  "アンティオキア":            [36.2,    36.15  ],
  "デルフォイ":                [38.4822, 22.5011],
  "テーバイ":                  [38.3192, 23.3192],
  "エフェソス":                [37.9392, 27.3414],
  "アクティウムの海戦":        [38.9333, 20.7333],
  "コンスタンティノープル":    [41.0082, 28.9784],
  "ヴェネツィア":              [45.4408, 12.3155],
  "コルドバ":                  [37.8882, -4.7794],
  "エルサレム":                [31.7683, 35.2137],
  "プラハ":                    [50.0755, 14.4378],
  "フィレンツェ":              [43.7696, 11.2558],
  "ジェノヴァ":                [44.4056,  8.9463],
  "リューベック":              [53.8655, 10.6866],
  "クリュニー":                [46.4342,  4.6589],
  "カノッサ":                  [44.5736, 10.4542],
  "パリ":                      [48.8566,  2.3522],
  "ロンドン":                  [51.5074, -0.1278],
  "ブリュージュ":              [51.2093,  3.2247],
  "ケルン":                    [50.9375,  6.9603],
  "サンティアゴ・デ・コンポステラ": [42.8805, -8.5457],
  "ベルリン":                  [52.52,   13.405 ],
  "ウィーン":                  [48.2082, 16.3738],
  "マドリード":                [40.4168, -3.7038],
  "ヴェルサイユ":              [48.8049,  2.1204],
  "アムステルダム":            [52.3676,  4.9041],
  "リスボン":                  [38.7223, -9.1393],
  "ジュネーヴ":                [46.2044,  6.1432],
  "ワルシャワ":                [52.2297, 21.0122],
  "ナポリ":                    [40.8518, 14.2681],
  "サラエヴォ":                [43.8516, 18.3864],
  "ブリュッセル":              [50.8503,  4.3517],
  "アルザス・ロレーヌ地方":    [48.5734,  7.7521]
};

const europe = data.europe;
let updated = 0, skipped = 0;
for (const eraKey of Object.keys(europe.eras)) {
  const fixed = europe.eras[eraKey].fixed;
  for (const item of fixed) {
    const key = getKey(item.text);
    const latlon = coords[key];
    if (latlon) {
      const { top, left } = transform(latlon[0], latlon[1]);
      item.top  = top;
      item.left = left;
      updated++;
    } else {
      skipped++;
      console.warn("  座標未定義:", key);
    }
  }
}

fs.writeFileSync(jsonPath, JSON.stringify(data.europe, null, 2), "utf8");
console.log(`\nDone. ${updated} 件更新, ${skipped} 件スキップ。data/europe.json updated.`);
