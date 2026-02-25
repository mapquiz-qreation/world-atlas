const fs = require("fs");
const path = require("path");

const jsonPath = path.join(__dirname, "data", "southeast_asia.json");
const data = { sea: JSON.parse(fs.readFileSync(jsonPath, "utf8")) };

// 3つの基準点（southeast_asia.png の目視推定値）
// ラングーン（上左）・バタヴィア（下中）・ボロブドゥール（下右）は整合性が高い
const refs = [
  { name: "ラングーン",    top: 12.5, left: 14.5, lat: 16.8661, lon:  96.1951 },
  { name: "バタヴィア",    top: 88.0, left: 48.1, lat: -6.2146, lon: 106.8451 },
  { name: "ボロブドゥール", top: 89.5, left: 56.0, lat: -7.6079, lon: 110.2038 },
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

console.log("southeast_asia.png の推定範囲 (3基準点から逆算):");
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
  // 古代・諸王朝時代
  "アンコール・ワット":  [13.4125, 103.8670],
  "パガン":              [21.1717,  94.8640],
  "アユタヤ":            [14.3570, 100.5693],
  "シュリーヴィジャヤ":  [-2.9909, 104.7561],
  "ボロブドゥール":      [-7.6079, 110.2038],
  "マジャパヒト王国":    [-7.5396, 112.4381],
  // 植民地時代
  "バタヴィア":          [-6.2146, 106.8451],
  "マラッカ":            [ 2.1896, 102.2501],
  "シンガポール":        [ 1.3521, 103.8198],
  "サイゴン":            [10.8231, 106.6297],
  "ラングーン":          [16.8661,  96.1951],
};

const sea = data.sea;
let updated = 0, skipped = 0;
for (const eraKey of Object.keys(sea.eras)) {
  const fixed = sea.eras[eraKey].fixed;
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

fs.writeFileSync(jsonPath, JSON.stringify(data.sea, null, 2), "utf8");
console.log(`\nDone. ${updated} 件更新, ${skipped} 件スキップ。data/southeast_asia.json updated.`);
