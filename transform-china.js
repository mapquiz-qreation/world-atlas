const fs = require("fs");
const path = require("path");

const jsonPath = path.join(__dirname, "questions.json");
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

// 3つの基準点（china.png 上の実測値。JSON の top/left をそのまま使用）
const refs = [
  { name: "北京", top: 43.7, left: 69.0, lat: 39.9042, lon: 116.4074 },
  { name: "南京", top: 65.2, left: 73.0, lat: 32.0603, lon: 118.7969 },
  { name: "広州", top: 84.5, left: 64.0, lat: 23.1291, lon: 113.2644 }
];

// メルカトル投影: 緯度 φ(rad) → y = ln(tan(π/4 + φ/2))
function mercatorY(latDeg) {
  const phi = (latDeg * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + phi / 2));
}
function mercatorYInv(y) {
  const phi = 2 * Math.atan(Math.exp(y)) - Math.PI / 2;
  return (phi * 180) / Math.PI;
}

// 中国全地点の緯度経度（名称の先頭一致で使用）
const coords = {
  "咸陽": [34.33, 108.70],
  "長安": [34.27, 108.94],
  "洛陽": [34.62, 112.45],
  "成都": [30.67, 104.06],
  "建業": [32.06, 118.80],
  "平城": [40.08, 113.30],
  "北京": [39.9042, 116.4074],
  "南京": [32.0603, 118.7969],
  "広州": [23.1291, 113.2644],
  "開封": [34.80, 114.35],
  "臨安": [30.25, 120.15],
  "上海": [31.23, 121.47],
  "景徳鎮": [29.27, 117.18],
  "金陵": [32.0603, 118.7969],
  "マカオ": [22.20, 113.55],
  "香港": [22.28, 114.16]
};

// 基準点から画像の緯度経度範囲を逆算（china.png = 矩形メルカトルと仮定）
const leftRatios = refs.map(p => p.left / 100);
const lons = refs.map(p => p.lon);
const meanLeft = leftRatios.reduce((s, x) => s + x, 0) / refs.length;
const meanLon = lons.reduce((s, x) => s + x, 0) / refs.length;
let covLonLeft = 0, varLeft = 0;
for (let i = 0; i < refs.length; i++) {
  covLonLeft += (lons[i] - meanLon) * (leftRatios[i] - meanLeft);
  varLeft += (leftRatios[i] - meanLeft) ** 2;
}
const lonRange = varLeft > 1e-10 ? covLonLeft / varLeft : 25;
const lonMin = meanLon - lonRange * meanLeft;
const lonMax = lonMin + lonRange;

const topRatios = refs.map(p => p.top / 100);
const mVal = refs.map(p => mercatorY(p.lat));
const meanTop = topRatios.reduce((s, x) => s + x, 0) / refs.length;
const meanM = mVal.reduce((s, x) => s + x, 0) / refs.length;
let covMTop = 0, varTop = 0;
for (let i = 0; i < refs.length; i++) {
  covMTop += (mVal[i] - meanM) * (topRatios[i] - meanTop);
  varTop += (topRatios[i] - meanTop) ** 2;
}
const mRange = varTop > 1e-10 ? -covMTop / varTop : 1;
const mNorth = meanM + mRange * meanTop;
const mSouth = meanM - mRange * (1 - meanTop);
const latMax = mercatorYInv(mNorth);
const latMin = mercatorYInv(mSouth);

console.log("china.png の推定範囲 (基準点から逆算):");
console.log("  lon:", lonMin.toFixed(2), "～", lonMax.toFixed(2), "  lat:", latMin.toFixed(2), "～", latMax.toFixed(2));
refs.forEach(p => {
  const topFit = 100 * (mercatorY(latMax) - mercatorY(p.lat)) / (mercatorY(latMax) - mercatorY(latMin));
  const leftFit = 100 * (p.lon - lonMin) / (lonMax - lonMin);
  console.log("  ", p.name, "=> top", topFit.toFixed(1), "(ref", p.top, "), left", leftFit.toFixed(1), "(ref", p.left, ")");
});

function toPercent(topVal, leftVal) {
  const t = Math.max(0, Math.min(100, topVal));
  const l = Math.max(0, Math.min(100, leftVal));
  return { top: t.toFixed(1) + "%", left: l.toFixed(1) + "%" };
}
function transform(lat, lon) {
  const mRange = mercatorY(latMax) - mercatorY(latMin);
  const top = 100 * (mercatorY(latMax) - mercatorY(lat)) / mRange;
  const left = 100 * (lon - lonMin) / (lonMax - lonMin);
  return toPercent(top, left);
}

function getKey(text) {
  const i = text.indexOf(" (");
  return i > 0 ? text.slice(0, i) : text;
}

const china = data.china;
for (const eraKey of Object.keys(china.eras)) {
  const fixed = china.eras[eraKey].fixed;
  for (const item of fixed) {
    const key = getKey(item.text);
    const latlon = coords[key];
    if (latlon) {
      const { top, left } = transform(latlon[0], latlon[1]);
      item.top = top;
      item.left = left;
    }
  }
}

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf8");
console.log("Done. China top/left updated (china.png の範囲を基準点から逆算したメルカトル変換).");
