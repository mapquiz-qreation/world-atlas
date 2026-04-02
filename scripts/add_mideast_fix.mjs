/**
 * mideast.json に5問追加（eraキー修正版）
 * node scripts/add_mideast_fix.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'data');

function load(f) { return JSON.parse(readFileSync(join(DATA, f), 'utf8')); }
function save(f, d) { writeFileSync(join(DATA, f), JSON.stringify(d, null, 2), 'utf8'); }
function add(data, eraKey, questions) {
  if (!data.eras[eraKey]) { console.warn('  ⚠ era not found:', eraKey); return 0; }
  if (!data.eras[eraKey].fixed) data.eras[eraKey].fixed = [];
  const existing = new Set(data.eras[eraKey].fixed.map(q => q.text));
  const newQ = questions.filter(q => !existing.has(q.text));
  data.eras[eraKey].fixed.push(...newQ);
  return newQ.length;
}

let grand = 0;
const d = load('mideast.json');
let n = 0;

n += add(d, 'islamic_expansion', [
  {
    text: "サマッラー (アッバース朝第二首都・マムルーク台頭)",
    lat: 34.198, lng: 43.874,
    explanation: "836年アッバース朝のカリフ・ムータスィムがトルコ人軍人（マムルーク）の政治的圧力を避けてバグダードから遷都した都市。アッバース朝はマムルークの影響力増大で「カリフの傀儡化」が進んだ時代の象徴。",
    relatedTerms: ["アッバース朝", "マムルーク", "カリフ傀儡化", "バグダードから遷都", "トルコ人軍人"],
    year: 836, sortLabel: "サマッラー（アッバース朝第二首都・マムルーク台頭）",
    advancedText: "836年アッバース朝カリフがマムルーク（トルコ人軍人）の影響力を避けてバグダードから遷都したイスラーム世界の第二首都はどこ？"
  }
]);

n += add(d, 'turco_mongol', [
  {
    text: "アレッポ (シルクロード西端・オスマン帝国の交易都市)",
    lat: 36.2021, lng: 37.1343,
    explanation: "シルクロード西端の古代から続く交易都市。オスマン帝国支配下でイスタンブール・カイロに次ぐ大都市として1600年頃に人口20〜30万を誇った。ヴェネツィア・フランスの商人が活動した中継貿易の要衝。",
    relatedTerms: ["シルクロード西端", "オスマン帝国交易都市", "ヴェネツィア商人", "シリア", "中継貿易"],
    year: 1600, sortLabel: "アレッポ（シルクロード西端・オスマン帝国の交易要衝）",
    advancedText: "シルクロード西端に位置しオスマン帝国支配下でイスタンブール・カイロに次ぐ大都市としてヴェネツィア商人が活動した交易の要衝はどこ？"
  },
  {
    text: "スエズ運河 (1869年開通・英のエジプト支配の足がかり)",
    lat: 30.5852, lng: 32.2654,
    explanation: "1869年フランスのレセップス主導で開通した地中海と紅海を結ぶ全長約193kmの運河。1875年イギリスがスエズ運河会社株式を購入し実効支配を確立。1882年「アラービー革命」を口実にエジプトを保護国化した。",
    relatedTerms: ["スエズ運河開通", "レセップス", "イギリスのエジプト支配", "1875年株式購入", "アラービー革命"],
    year: 1869, sortLabel: "スエズ運河（1869年開通・英のエジプト保護国化）",
    advancedText: "1869年レセップス主導で開通しイギリスが1875年に株式を購入してエジプト実効支配の足がかりとした地中海と紅海を結ぶ運河はどこ？"
  }
]);

n += add(d, 'modern_turkey', [
  {
    text: "アンカラ (アタテュルク・トルコ共和国の新首都)",
    lat: 39.9334, lng: 32.8597,
    explanation: "1923年ムスタファ・ケマル（アタテュルク）がオスマン帝国に代わるトルコ共和国を建国し首都とした都市。イスタンブールからアナトリア内陸への遷都はカリフ制廃止・文字改革・女性参政権など「西洋化改革」の象徴。",
    relatedTerms: ["アタテュルク", "トルコ共和国建国", "イスタンブールから遷都", "カリフ制廃止", "近代化改革"],
    year: 1923, sortLabel: "アンカラ（アタテュルク・トルコ共和国の新首都）",
    advancedText: "1923年ムスタファ・ケマルがトルコ共和国を建国しカリフ制廃止・文字改革などの西洋化改革を進めた新首都はどこ？"
  },
  {
    text: "テヘラン (イラン革命・ホメイニー・イスラーム共和国成立)",
    lat: 35.6892, lng: 51.389,
    explanation: "1979年イラン革命でパフラヴィー朝が打倒されホメイニー師率いるイスラーム共和国が成立した首都。イスラーム法学者による統治（ウラマー統治）という前例のない体制を確立。アメリカ大使館人質事件（444日間）も発生した。",
    relatedTerms: ["イラン革命", "ホメイニー", "イスラーム共和国", "パフラヴィー朝打倒", "アメリカ大使館人質"],
    year: 1979, sortLabel: "テヘラン（イラン革命・イスラーム共和国成立）",
    advancedText: "1979年ホメイニー師がパフラヴィー朝を打倒しイスラーム法学者統治（ウラマー統治）を確立したイラン革命の舞台の首都はどこ？"
  }
]);

save('mideast.json', d);
console.log(`✅ mideast.json +${n}問`);
grand += n;
console.log(`=== mideast修正完了: +${grand}問 ===`);
