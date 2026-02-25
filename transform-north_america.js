/**
 * transform-north_america.js
 * Lambert Conformal Conic 正角円錐図法による座標変換
 * 米国標準パラメータ（標準緯線 33°N / 45°N、中央経線 96°W）を使用し、
 * 3つの実測基準点から画像座標への変換行列を求める。
 */
const fs = require("fs");
const path = require("path");

const jsonPath = path.join(__dirname, "data", "north_america.json");
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

// ── 実測基準点 ──────────────────────────────────────────────
const refs = [
  { name: "ボストン",           top: 24.3, left: 93.1, lat: 42.3601, lon:  -71.0589 },
  { name: "フィラデルフィア",   top: 35.5, left: 88.5, lat: 39.9526, lon:  -75.1652 },
  { name: "ヨークタウン",       top: 39.1, left: 86.2, lat: 37.2388, lon:  -76.5097 },
  { name: "ニューオーリンズ",   top: 77.1, left: 65.2, lat: 29.9511, lon:  -90.0715 },
  { name: "ソルトレークシティ", top: 42.2, left: 26.1, lat: 40.7608, lon: -111.8910 }
];

// ── Lambert 正角円錐図法パラメータ（米国標準） ────────────────
const DEG = Math.PI / 180;
const phi1 = 33 * DEG, phi2 = 45 * DEG;  // 標準緯線
const lam0 = -96 * DEG;                   // 中央経線

const n = Math.log(Math.cos(phi1) / Math.cos(phi2)) /
          Math.log(Math.tan(Math.PI/4 + phi2/2) / Math.tan(Math.PI/4 + phi1/2));
const F = Math.cos(phi1) * Math.pow(Math.tan(Math.PI/4 + phi1/2), n) / n;

function lambertXY(latDeg, lonDeg) {
  const phi = latDeg * DEG;
  const lam = lonDeg * DEG;
  const rho   = F / Math.pow(Math.tan(Math.PI/4 + phi/2), n);
  const theta = n * (lam - lam0);
  return { x: rho * Math.sin(theta), y: rho * Math.cos(theta) };
}

// ── 3×3 連立方程式をガウス消去法で解く ──────────────────────
function solve3x3(M, b) {
  const n3 = 3;
  const A = M.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n3; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n3; row++)
      if (Math.abs(A[row][col]) > Math.abs(A[maxRow][col])) maxRow = row;
    [A[col], A[maxRow]] = [A[maxRow], A[col]];
    for (let row = col + 1; row < n3; row++) {
      const f = A[row][col] / A[col][col];
      for (let j = col; j <= n3; j++) A[row][j] -= f * A[col][j];
    }
  }
  const x = new Array(n3).fill(0);
  for (let i = n3 - 1; i >= 0; i--) {
    x[i] = A[i][n3];
    for (let j = i + 1; j < n3; j++) x[i] -= A[i][j] * x[j];
    x[i] /= A[i][i];
  }
  return x;
}

// ── 2D アフィン最小二乗フィット: val ≈ a*x + b*y + c ─────────
// Lambert (x,y) → 画像 left%/top% を x・y 両方で推定
function fitAffine2D(points, values) {
  let sx2=0, sxy=0, sx=0, sy2=0, sy=0, sn=0;
  let svx=0, svy=0, sv=0;
  for (let i = 0; i < points.length; i++) {
    const { x, y } = points[i], v = values[i];
    sx2 += x*x; sxy += x*y; sx += x;
    sy2 += y*y; sy += y; sn++;
    svx += x*v; svy += y*v; sv += v;
  }
  return solve3x3([[sx2,sxy,sx],[sxy,sy2,sy],[sx,sy,sn]], [svx,svy,sv]);
}

const lxys = refs.map(r => lambertXY(r.lat, r.lon));
const [aL, bL, cL] = fitAffine2D(lxys, refs.map(r => r.left));
const [aT, bT, cT] = fitAffine2D(lxys, refs.map(r => r.top));

console.log("── Lambert 変換パラメータ（2D アフィン）──────────────────");
console.log(`  n(cone constant) = ${n.toFixed(4)},  F = ${F.toFixed(4)}`);
console.log(`  left% = ${aL.toFixed(3)}*x + ${bL.toFixed(3)}*y + ${cL.toFixed(3)}`);
console.log(`  top%  = ${aT.toFixed(3)}*x + ${bT.toFixed(3)}*y + ${cT.toFixed(3)}`);
console.log("\n── 基準点誤差チェック ─────────────────────────────────────");
refs.forEach((r, i) => {
  const { x, y } = lxys[i];
  const leftFit = aL*x + bL*y + cL;
  const topFit  = aT*x + bT*y + cT;
  const dL = (leftFit - r.left).toFixed(1);
  const dT = (topFit  - r.top ).toFixed(1);
  console.log(`  ${r.name}: left ${leftFit.toFixed(1)} (ref ${r.left}, diff ${dL}%),  top ${topFit.toFixed(1)} (ref ${r.top}, diff ${dT}%)`);
});

function transform(lat, lon) {
  const { x, y } = lambertXY(lat, lon);
  const left = Math.max(0, Math.min(100, aL*x + bL*y + cL));
  const top  = Math.max(0, Math.min(100, aT*x + bT*y + cT));
  return { top: top.toFixed(1) + "%", left: left.toFixed(1) + "%" };
}
function getKey(text) {
  const i = text.indexOf(" (");
  return i > 0 ? text.slice(0, i) : text;
}

// ── 全都市の緯度経度 ───────────────────────────────────────
const coords = {
  // frontier (西漸運動)
  "ジェームズタウン":    [37.2099, -76.7781],
  "ボストン":            [42.3601, -71.0589],
  "フィラデルフィア":    [39.9526, -75.1652],
  "ニューオーリンズ":    [29.9511, -90.0715],
  "セントルイス":        [38.6270, -90.1994],
  "サンタフェ":          [35.6870, -105.9378],
  "サンアントニオ":      [29.4241, -98.4936],
  "ソルトレークシティ":  [40.7608, -111.8910],
  "サクラメント":        [38.5816, -121.4944],
  "サンフランシスコ":    [37.7749, -122.4194],
  // independence (独立革命)
  "レキシントン":        [42.4473, -71.2272],
  "サラトガ":            [43.0831, -73.7846],
  "バレーフォージ":      [40.1007, -75.4566],
  "ヨークタウン":        [37.2388, -76.5097],
  "ワシントンD.C.":      [38.9072, -77.0369],
  // civil_war (南北戦争)
  "フォートサムター":    [32.7524, -79.8745],
  "ブルラン":            [38.8140, -77.5265],
  "リッチモンド":        [37.5407, -77.4360],
  "アンティータム":      [39.4767, -77.7447],
  "ゲティズバーグ":      [39.8309, -77.2311],
  "ヴィックスバーグ":    [32.3526, -90.8779],
  "アトランタ":          [33.7490, -84.3880],
  "アポマトックス":      [37.3626, -78.7978],
};

console.log("\n── 全都市の計算結果 ──────────────────────────────────────");
let updated = 0, skipped = 0;
for (const eraKey of Object.keys(data.eras)) {
  const fixed = data.eras[eraKey].fixed;
  for (const item of fixed) {
    const key = getKey(item.text);
    const latlon = coords[key];
    if (latlon) {
      const { top, left } = transform(latlon[0], latlon[1]);
      console.log(`  ${key}: top ${top}, left ${left}`);
      item.top  = top;
      item.left = left;
      updated++;
    } else {
      skipped++;
      console.warn("  座標未定義:", key);
    }
  }
}

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf8");
console.log(`\nDone. ${updated} 件更新, ${skipped} 件スキップ。data/north_america.json updated.`);
