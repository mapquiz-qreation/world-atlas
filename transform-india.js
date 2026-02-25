const fs = require("fs");
const path = require("path");

const jsonPath = path.join(__dirname, "data", "india.json");
const data = { india: JSON.parse(fs.readFileSync(jsonPath, "utf8")) };

// 3つの基準点（india.png 上の実測値）
// デリー・ムンバイ・カルカッタは緯度経度の三角形が大きく、3点の整合性が高い
const refs = [
  { name: "デリー",    top: 27.1, left: 33.4, lat: 28.6595, lon: 77.2090 },
  { name: "ムンバイ",  top: 61.5, left: 20.5, lat: 19.0760, lon: 72.8777 },
  { name: "カルカッタ", top: 51.2, left: 69.5, lat: 22.5726, lon: 88.3639 }
];

function mercatorY(latDeg) {
  const phi = (latDeg * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + phi / 2));
}
function mercatorYInv(y) {
  const phi = 2 * Math.atan(Math.exp(y)) - Math.PI / 2;
  return (phi * 180) / Math.PI;
}

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

console.log("india.png の推定範囲 (3基準点から逆算):");
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

const coords = {
  // 古代・中世王朝
  "パータリプトラ": [25.5941, 85.1376],
  "カノウジ":       [27.0576, 79.9111],
  "サーンチー":     [23.4793, 77.7399],
  "アジャンター":   [20.5519, 75.7033],
  "エローラ":       [20.0268, 75.1785],
  "カーンチー":     [12.8342, 79.7036],
  "ヴィジャヤナガル": [15.3350, 76.4600],
  // ムガル帝国と植民地化
  "デリー":         [28.6595, 77.2090],
  "アーグラ":       [27.1767, 78.0081],
  "ゴア":           [15.4909, 73.8278],
  "カルカッタ":     [22.5726, 88.3639],
  "マドラス":       [13.0827, 80.2707],
  "ポンディシェリ": [11.9416, 79.8083],
  "ボンベイ":       [19.0760, 72.8777],
};

const india = data.india;
let updated = 0, skipped = 0;
for (const eraKey of Object.keys(india.eras)) {
  const fixed = india.eras[eraKey].fixed;
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

fs.writeFileSync(jsonPath, JSON.stringify(data.india, null, 2), "utf8");
console.log(`\nDone. ${updated} 件更新, ${skipped} 件スキップ。data/india.json updated.`);
