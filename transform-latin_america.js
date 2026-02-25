/**
 * transform-latin_america.js
 * メルカトル図法に基づいて latin_america.png 内の各地点の
 * top% / left% を計算し data/latin_america.json を更新する。
 *
 * 画像範囲の推定値:
 *   latMax = 35°N (メキシコ南部・カリブ海北端)
 *   latMin = -56°S (ティエラ・デル・フエゴ南端)
 *   lonMin = -118°W (バハカリフォルニア太平洋岸)
 *   lonMax = -34°W  (ブラジル大西洋岸)
 *
 * 実測基準点が得られたら refs を追加して再実行することで精度を高められる。
 */

const fs = require('fs');
const path = require('path');

// ─── 画像推定範囲 ──────────────────────────────────────
const LAT_MAX =  35;   // °N
const LON_MIN = -118;  // °W
const LON_MAX =  -34;  // °W

// メルカトル Y 座標 (ラジアン)
function mercY(latDeg) {
  const phi = latDeg * Math.PI / 180;
  return Math.log(Math.tan(Math.PI / 4 + phi / 2));
}

// ─── 参照点（実測があれば追記して精度向上）──────────────
// top/left は画像での実測パーセンテージ
const refs = [
  // ユーザー実測値が得られたらここに追加
  // { name: "テノチティトラン", top: ??, left: ??, lat: 19.43, lon: -99.13 },
];

// 参照点がある場合: 線形フィットで latMax / lonMin / lonMax を補正
// 参照点がない場合: 推定値をそのまま使用
let mNorth = mercY(LAT_MAX);
let lonRange = LON_MAX - LON_MIN;

if (refs.length >= 2) {
  // 1D 線形フィット: left = a*(lon) + b
  const sumLon  = refs.reduce((s, r) => s + r.lon,  0);
  const sumLeft = refs.reduce((s, r) => s + r.left, 0);
  const sumLL   = refs.reduce((s, r) => s + r.lon * r.left, 0);
  const sumLL2  = refs.reduce((s, r) => s + r.lon * r.lon,  0);
  const n = refs.length;
  const aL = (n * sumLL - sumLon * sumLeft) / (n * sumLL2 - sumLon * sumLon);
  const bL = (sumLeft - aL * sumLon) / n;
  // left = aL*(lon - LON_MIN)/lonRange*100 ではなく left = aL*lon + bL
  // → lonMin を補正
  const lonMinFit = -bL / aL;
  const lonMaxFit = (100 - bL) / aL;
  lonRange = lonMaxFit - lonMinFit;
  console.log(`[フィット] lonMin≈${lonMinFit.toFixed(1)}  lonMax≈${lonMaxFit.toFixed(1)}`);

  // top = c*(mNorth - mercY(lat)) / mRange*100
  const mYs = refs.map(r => mercY(r.lat));
  const sumMY   = mYs.reduce((s, y) => s + y, 0);
  const sumTop  = refs.reduce((s, r) => s + r.top, 0);
  const sumMT   = mYs.reduce((s, y, i) => s + y * refs[i].top, 0);
  const sumMY2  = mYs.reduce((s, y) => s + y * y, 0);
  const aT = (n * sumMT - sumMY * sumTop) / (n * sumMY2 - sumMY * sumMY);
  const bT = (sumTop - aT * sumMY) / n;
  // top = aT * mercY(lat) + bT を解析的に逆算して mNorth を補正
  mNorth = (0 - bT) / aT;
  console.log(`[フィット] latMax_fit≈${(Math.atan(Math.exp(mNorth))*2*180/Math.PI - 90).toFixed(1)}°N`);
}

const mSouth_raw = mercY(-56);
const mRange = mNorth - mSouth_raw;

// ─── 変換関数 ────────────────────────────────────────────
function transform(lat, lon) {
  const mY_ = mercY(lat);
  const top  = (mNorth - mY_) / mRange * 100;
  const left = (lon - LON_MIN) / lonRange * 100;
  return {
    top:  Math.max(0, Math.min(100, top)).toFixed(1)  + '%',
    left: Math.max(0, Math.min(100, left)).toFixed(1) + '%',
  };
}

// ─── 地点データ ───────────────────────────────────────────
const coords = [
  // ━━ 時代1: 太陽の帝国（古代〜15世紀）━━
  { era: 'sun_empire',   lat:  19.43, lon:  -99.13, key: 'テノチティトラン' },
  { era: 'sun_empire',   lat:  20.68, lon:  -88.57, key: 'チチェン・イッツァ' },
  { era: 'sun_empire',   lat: -13.16, lon:  -72.54, key: 'マチュピチュ' },
  { era: 'sun_empire',   lat: -16.55, lon:  -68.68, key: 'ティワナク' },

  // ━━ 時代2: 黄金と十字架（16〜18世紀）━━
  { era: 'colonial_era', lat:  18.48, lon:  -69.90, key: 'サントドミンゴ' },
  { era: 'colonial_era', lat: -19.58, lon:  -65.75, key: 'ポトシ' },
  { era: 'colonial_era', lat: -22.91, lon:  -43.17, key: 'リオデジャネイロ' },

  // ━━ 時代3: 解放者の嵐（19世紀〜独立後）━━
  { era: 'liberation_era', lat:  10.48, lon: -66.88, key: 'カラカス' },
  { era: 'liberation_era', lat:   4.71, lon: -74.07, key: 'ボゴタ' },
  { era: 'liberation_era', lat: -34.60, lon: -58.38, key: 'ブエノスアイレス' },
];

// 結果を表示
console.log('\n── 変換結果 ──────────────────────────────');
coords.forEach(c => {
  const r = transform(c.lat, c.lon);
  console.log(`${c.key.padEnd(16)} top:${r.top.padStart(6)}  left:${r.left.padStart(6)}`);
});

// ─── JSON を生成 ──────────────────────────────────────────
function getKey(nameJa) {
  const r = transform(
    coords.find(c => c.key === nameJa).lat,
    coords.find(c => c.key === nameJa).lon
  );
  return r;
}

const data = {
  name: 'ラテンアメリカ',
  img: 'latin_america.png',
  eras: {
    sun_empire: {
      name: '太陽の帝国（古代〜15世紀）',
      fixed: [
        {
          text: 'テノチティトラン（アステカ帝国の「水上に浮かぶ都」）',
          hint: '湖の中央に人工島を築いたこの都市は、現在のメキシコシティの地下に眠っている。アステカの皇帝モクテスマはここで太陽神ウィツィロポチトリに供物を捧げた。',
          choices: ['テノチティトラン', 'テスココ', 'トラテロルコ', 'チョルーラ'],
          ...transform(19.43, -99.13),
        },
        {
          text: 'チチェン・イッツァ（マヤ文明の「時を刻む聖地」）',
          hint: 'ユカタン半島に聳えるエル・カスティジョ（ピラミッド）は、春分・秋分に太陽が蛇の影を生み出す天文神殿。マヤの暦はここで完成した。',
          choices: ['チチェン・イッツァ', 'ウシュマル', 'パレンケ', 'ティカル'],
          ...transform(20.68, -88.57),
        },
        {
          text: 'マチュピチュ（インカの「天空に隠された城砦」）',
          hint: 'アンデス山脈の稜線に忽然と現れるこの遺跡は、スペイン人に発見されることなく400年以上も密林に眠り続けた。インカ皇帝パチャクテックが建造したとされる。',
          choices: ['マチュピチュ', 'クスコ', 'オリャンタイタンボ', 'チャビン・デ・ワンタル'],
          ...transform(-13.16, -72.54),
        },
        {
          text: 'ティワナク（インカ以前の「謎の湖畔文明」）',
          hint: '標高3800mのチチカカ湖のほとりにそびえる巨大な石造建築。インカの人々はここを「世界の始まりの地」と信じた。建造者は今も謎に包まれている。',
          choices: ['ティワナク', 'プマプンク', 'チャビン', 'モチェ'],
          ...transform(-16.55, -68.68),
        },
      ],
    },
    colonial_era: {
      name: '黄金と十字架（16〜18世紀）',
      fixed: [
        {
          text: 'サントドミンゴ（新大陸「最初のヨーロッパ都市」）',
          hint: 'コロンブスの息子ディエゴが建設したこの街は、スペインのアメリカ支配の第一拠点。現在も残る「コロニアル・ゾーン」はユネスコ世界遺産第一号のひとつ。',
          choices: ['サントドミンゴ', 'ハバナ', 'サンフアン', 'カルタヘナ'],
          ...transform(18.48, -69.90),
        },
        {
          text: 'ポトシ（世界経済を変えた「銀の山」）',
          hint: '16世紀のこの都市は人口20万を誇り、当時のロンドンより大きかった。セロ・リコ（豊かな丘）から採掘された銀は、スペイン帝国の繁栄と世界の価格革命を引き起こした。',
          choices: ['ポトシ', 'オルロ', 'スクレ', 'ラパス'],
          ...transform(-19.58, -65.75),
        },
        {
          text: 'リオデジャネイロ（ブラジル植民地の「南の都」）',
          hint: '1763年にポルトガル植民地の首都となったこの港湾都市には、大量の奴隷とサトウキビ・コーヒーの富が集まった。19世紀にはナポレオン戦争を逃れたポルトガル王室が移住してきた。',
          choices: ['リオデジャネイロ', 'サルバドール', 'レシフェ', 'サンパウロ'],
          ...transform(-22.91, -43.17),
        },
      ],
    },
    liberation_era: {
      name: '解放者の嵐（19世紀〜独立後）',
      fixed: [
        {
          text: 'カラカス（シモン・ボリバルの「生誕の地」）',
          hint: '「リベルタドール（解放者）」と呼ばれたシモン・ボリバルは、ここで1783年に生まれた。彼は南アメリカの6か国をスペインから解放し、大コロンビア共和国の建国を夢見た。',
          choices: ['カラカス', 'マラカイボ', 'バレンシア', 'カルタヘナ'],
          ...transform(10.48, -66.88),
        },
        {
          text: 'ボゴタ（大コロンビア「解放の首都」）',
          hint: '1819年のボヤカの戦いで決定的な勝利を収めたボリバルは、この地にコロンビア・ベネズエラ・エクアドルを統合した「大コロンビア共和国」を樹立した。',
          choices: ['ボゴタ', 'メデジン', 'カリ', 'ポパヤン'],
          ...transform(4.71, -74.07),
        },
        {
          text: 'ブエノスアイレス（南の「五月革命」の舞台）',
          hint: '1810年5月25日、この都市でスペイン総督を追放する「五月革命」が起き、ラテンアメリカ独立運動の狼煙があがった。サン・マルティン将軍はここを拠点にアンデスを越え、チリとペルーを解放した。',
          choices: ['ブエノスアイレス', 'モンテビデオ', 'アスンシオン', 'サンティアゴ'],
          ...transform(-34.60, -58.38),
        },
      ],
    },
  },
};

const outPath = path.join(__dirname, 'data', 'latin_america.json');
fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`\n✅  data/latin_america.json を更新しました`);
console.log(`   地点数: ${Object.values(data.eras).reduce((s, e) => s + e.fixed.length, 0)}`);
