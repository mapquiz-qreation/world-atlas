const fs = require("fs");
const path = require("path");

const jsonPath = path.join(__dirname, "data", "mideast.json");
const data = { mideast: JSON.parse(fs.readFileSync(jsonPath, "utf8")) };

// 3つの基準点（mideast.png 上の実測値）
const refs = [
  { name: "メッカ",       top: 70.4, left: 41.7, lat: 21.3891, lon: 39.8579 },
  { name: "バグダード",   top: 37.6, left: 49.7, lat: 33.3152, lon: 44.3661 },
  { name: "イスファハーン", top: 39.2, left: 67.1, lat: 32.6546, lon: 51.6680 }
];

function mercatorY(latDeg) {
  const phi = (latDeg * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + phi / 2));
}
function mercatorYInv(y) {
  const phi = 2 * Math.atan(Math.exp(y)) - Math.PI / 2;
  return (phi * 180) / Math.PI;
}

// 基準点から画像の緯度経度範囲を逆算
const leftRatios = refs.map(p => p.left / 100);
const lons       = refs.map(p => p.lon);
const meanLeft   = leftRatios.reduce((s, x) => s + x, 0) / refs.length;
const meanLon    = lons.reduce((s, x) => s + x, 0) / refs.length;
let covLonLeft = 0, varLeft = 0;
for (let i = 0; i < refs.length; i++) {
  covLonLeft += (lons[i] - meanLon) * (leftRatios[i] - meanLeft);
  varLeft    += (leftRatios[i] - meanLeft) ** 2;
}
const lonRange = varLeft > 1e-10 ? covLonLeft / varLeft : 50;
const lonMin   = meanLon - lonRange * meanLeft;
const lonMax   = lonMin + lonRange;

const topRatios = refs.map(p => p.top / 100);
const mVal      = refs.map(p => mercatorY(p.lat));
const meanTop   = topRatios.reduce((s, x) => s + x, 0) / refs.length;
const meanM     = mVal.reduce((s, x) => s + x, 0) / refs.length;
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

console.log("mideast.png の推定範囲 (3基準点から逆算):");
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
  const mR   = mercatorY(latMax) - mercatorY(latMin);
  const top  = 100 * (mercatorY(latMax) - mercatorY(lat)) / mR;
  const left = 100 * (lon - lonMin) / (lonMax - lonMin);
  return toPercent(top, left);
}
function getKey(text) {
  const i = text.indexOf(" (");
  return i > 0 ? text.slice(0, i) : text;
}

// 中東全都市の緯度経度
const coords = {
  // イスラーム拡大期
  "メッカ":         [21.3891, 39.8579],
  "メディナ":       [24.5247, 39.5692],
  "ダマスクス":     [33.5102, 36.2913],
  "バグダード":     [33.3152, 44.3661],
  "カイロ":         [30.0444, 31.2357],
  "クファ":         [32.0328, 44.3728],
  "ニハーヴァンド": [34.20,   48.35  ],
  "バスラ":         [30.5085, 47.7834],
  "バビロン":       [32.5363, 44.4205],
  "クテシフォン":   [33.0942, 44.5741],
  "フスタート":     [30.00,   31.22  ],
  "アレクサンドリア": [31.2001, 29.9187],
  "エルサレム":     [31.7683, 35.2137],
  "サマッラ":       [34.20,   43.8728],
  "アンティオキア": [36.20,   36.15  ],
  // トルコ・モンゴル期
  "イスファハーン": [32.6546, 51.6680],
  "テブリーズ":     [38.0803, 46.2919],
  "サマルカンド":   [39.6542, 66.9597],
  "コンスタンティノープル": [41.0082, 28.9784],
  "アンカラ":       [39.9334, 32.8597],
  "スエズ運河":     [30.5852, 32.2654],
  "アイン・ジャールート": [32.6333, 35.35],
  "アダナ":         [37.00,   35.3213],
  "レイ":           [35.5961, 51.4456],
  "マンジケルト":   [38.9515, 42.5015],
  "ガズナ":         [33.5523, 68.4196],
  "スィヴァス":     [39.7477, 37.0179],
  "アブー・キール": [31.32,   30.06  ],
};

const mideast = data.mideast;
let updated = 0, skipped = 0;
for (const eraKey of Object.keys(mideast.eras)) {
  const fixed = mideast.eras[eraKey].fixed;
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

fs.writeFileSync(jsonPath, JSON.stringify(data.mideast, null, 2), "utf8");
console.log(`\nDone. ${updated} 件更新, ${skipped} 件スキップ。data/mideast.json updated.`);
