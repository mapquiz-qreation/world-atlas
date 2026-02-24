const fs = require("fs");
const path = require("path");

const jsonPath = path.join(__dirname, "questions.json");
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

// 4つの基準点（緯度経度 → 画像上の top/left %）
const refs = [
  { name: "パリ", top: 11.5, left: 28.3, lat: 48.8566, lon: 2.3522 },
  { name: "ローマ", top: 40.0, left: 47.0, lat: 41.8902, lon: 12.4922 },
  { name: "ベルリン", top: 10.5, left: 46.0, lat: 52.52, lon: 13.405 },
  { name: "アテネ", top: 54.6, left: 68.5, lat: 37.9838, lon: 23.7275 }
];

// ヨーロッパ全地点の緯度経度（名称の先頭一致で使用）
const coords = {
  "アテネ": [37.9838, 23.7275],
  "ローマ": [41.8902, 12.4922],
  "アレクサンドリア": [31.2001, 29.9187],
  "カルタゴ": [36.8531, 10.3233],
  "スパルタ": [37.0819, 22.4536],
  "ミラノ": [45.4642, 9.19],
  "マッシリア": [43.2965, 5.3698],
  "ビザンティウム": [41.0082, 28.9784],
  "シラクサ": [37.0755, 15.2866],
  "ニケーア": [40.4286, 29.7211],
  "アンティオキア": [36.2, 36.15],
  "デルフォイ": [38.4822, 22.5011],
  "テーバイ": [38.3192, 23.3192],
  "エフェソス": [37.9392, 27.3414],
  "アクティウムの海戦": [38.9333, 20.7333],
  "コンスタンティノープル": [41.0082, 28.9784],
  "ヴェネツィア": [45.4408, 12.3155],
  "コルドバ": [37.8882, -4.7794],
  "エルサレム": [31.7683, 35.2137],
  "プラハ": [50.0755, 14.4378],
  "フィレンツェ": [43.7696, 11.2558],
  "ジェノヴァ": [44.4056, 8.9463],
  "リューベック": [53.8655, 10.6866],
  "クリュニー": [46.4342, 4.6589],
  "カノッサ": [44.5736, 10.4542],
  "パリ": [48.8566, 2.3522],
  "ロンドン": [51.5074, -0.1278],
  "ブリュージュ": [51.2093, 3.2247],
  "ケルン": [50.9375, 6.9603],
  "サンティアゴ・デ・コンポステラ": [42.8805, -8.5457],
  "ベルリン": [52.52, 13.405],
  "ウィーン": [48.2082, 16.3738],
  "マドリード": [40.4168, -3.7038],
  "ヴェルサイユ": [48.8049, 2.1204],
  "アムステルダム": [52.3676, 4.9041],
  "リスボン": [38.7223, -9.1393],
  "ジュネーヴ": [46.2044, 6.1432],
  "ワルシャワ": [52.2297, 21.0122],
  "ナポリ": [40.8518, 14.2681],
  "サラエヴォ": [43.8516, 18.3864],
  "ブリュッセル": [50.8503, 4.3517],
  "アルザス・ロレーヌ地方": [48.5734, 7.7521]
};

// 最小二乗法: Ax = b の解 x = (A^T A)^{-1} A^T b （A: n×3, b: n×1 → x: 3×1）
function leastSquares(A, b) {
  const n = A.length;
  // A^T (3×n)
  const At = [];
  for (let j = 0; j < 3; j++) {
    At[j] = [];
    for (let i = 0; i < n; i++) At[j][i] = A[i][j];
  }
  // A^T A (3×3)
  const AtA = [];
  for (let i = 0; i < 3; i++) {
    AtA[i] = [];
    for (let j = 0; j < 3; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += At[i][k] * A[k][j];
      AtA[i][j] = s;
    }
  }
  // A^T b (3×1)
  const Atb = [];
  for (let i = 0; i < 3; i++) {
    let s = 0;
    for (let k = 0; k < n; k++) s += At[i][k] * b[k];
    Atb[i] = s;
  }
  const invAtA = inv3(AtA);
  const x = [];
  for (let i = 0; i < 3; i++) {
    x[i] = invAtA[i][0] * Atb[0] + invAtA[i][1] * Atb[1] + invAtA[i][2] * Atb[2];
  }
  return x;
}

function inv3(M) {
  const [[a00, a01, a02], [a10, a11, a12], [a20, a21, a22]] = M;
  const det = a00 * (a11 * a22 - a12 * a21) - a01 * (a10 * a22 - a12 * a20) + a02 * (a10 * a21 - a11 * a20);
  if (Math.abs(det) < 1e-10) throw new Error("singular matrix");
  return [
    [(a11 * a22 - a12 * a21) / det, (a02 * a21 - a01 * a22) / det, (a01 * a12 - a02 * a11) / det],
    [(a12 * a20 - a10 * a22) / det, (a00 * a22 - a02 * a20) / det, (a02 * a10 - a00 * a12) / det],
    [(a10 * a21 - a11 * a20) / det, (a01 * a20 - a00 * a21) / det, (a00 * a11 - a01 * a10) / det]
  ];
}

// 4点すべてを使ってアフィン係数を最小二乗で求める
const A = refs.map(p => [1, p.lat, p.lon]);
const bTop = refs.map(p => p.top);
const bLeft = refs.map(p => p.left);
const a = leastSquares(A, bTop);  // top = a[0] + a[1]*lat + a[2]*lon
const b = leastSquares(A, bLeft); // left = b[0] + b[1]*lat + b[2]*lon

console.log("Affine (least squares): top =", a[0].toFixed(4), "+", a[1].toFixed(4), "*lat +", a[2].toFixed(4), "*lon");
console.log("Affine (least squares): left =", b[0].toFixed(4), "+", b[1].toFixed(4), "*lat +", b[2].toFixed(4), "*lon");
refs.forEach(p => {
  const topFit = a[0] + a[1] * p.lat + a[2] * p.lon;
  const leftFit = b[0] + b[1] * p.lat + b[2] * p.lon;
  console.log("  ", p.name, "=> top", topFit.toFixed(1), "(ref", p.top, "), left", leftFit.toFixed(1), "(ref", p.left, ")");
});

function toPercent(topVal, leftVal) {
  const t = Math.max(0, Math.min(100, topVal));
  const l = Math.max(0, Math.min(100, leftVal));
  return { top: t.toFixed(1) + "%", left: l.toFixed(1) + "%" };
}
function transform(lat, lon) {
  const top = a[0] + a[1] * lat + a[2] * lon;
  const left = b[0] + b[1] * lat + b[2] * lon;
  return toPercent(top, left);
}

function getKey(text) {
  const i = text.indexOf(" (");
  return i > 0 ? text.slice(0, i) : text;
}

const europe = data.europe;
for (const eraKey of Object.keys(europe.eras)) {
  const fixed = europe.eras[eraKey].fixed;
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
console.log("Done. Europe top/left updated (4-point least squares affine).");
