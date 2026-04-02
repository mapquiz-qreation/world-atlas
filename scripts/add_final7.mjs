/**
 * 750問達成・最後の7問
 * node scripts/add_final7.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'data');

function load(f) { return JSON.parse(readFileSync(join(DATA, f), 'utf8')); }
function save(f, d) { writeFileSync(join(DATA, f), JSON.stringify(d, null, 2), 'utf8'); }
function add(data, eraKey, questions) {
  if (!data.eras[eraKey]) { console.warn('⚠ era not found:', eraKey); return 0; }
  if (!data.eras[eraKey].fixed) data.eras[eraKey].fixed = [];
  const existing = new Set(data.eras[eraKey].fixed.map(q => q.text));
  const newQ = questions.filter(q => !existing.has(q.text));
  data.eras[eraKey].fixed.push(...newQ);
  return newQ.length;
}

let grand = 0;

// cold_war +3問
{
  const d = load('cold_war.json');
  let n = 0;
  n += add(d, 'cold_war_early', [
    {
      text: "インチョン (朝鮮戦争・マッカーサーの仁川上陸作戦)",
      lat: 37.4563, lng: 126.7052,
      explanation: "1950年9月マッカーサー将軍が指揮した「仁川上陸作戦」の地。北朝鮮軍に押されていた国連軍（米軍主体）が仁川への奇襲上陸でソウルを奪還し局面を逆転させた。朝鮮戦争における最大の転換点。",
      relatedTerms: ["朝鮮戦争", "マッカーサー", "仁川上陸作戦", "国連軍", "ソウル奪還"],
      year: 1950, sortLabel: "仁川上陸作戦（朝鮮戦争の大逆転1950年）",
      advancedText: "1950年9月マッカーサー将軍が奇襲上陸を敢行し朝鮮戦争の局面を逆転させた「仁川上陸作戦」の地はどこ？"
    }
  ]);
  n += add(d, 'cold_war_proxy', [
    {
      text: "アンゴラ (内戦・米ソキューバの代理戦争)",
      lat: -11.2027, lng: 17.8739,
      explanation: "1975年ポルトガルから独立後に3つの解放運動組織（MPLA・FNLA・UNITA）が争う内戦に突入。ソ連・キューバがMPLAを、アメリカ・南アフリカがFNLA・UNITAを支援した典型的な冷戦代理戦争。内戦は2002年まで続いた。",
      relatedTerms: ["アンゴラ内戦", "MPLA", "UNITA", "ソ連・キューバ支援", "冷戦代理戦争"],
      year: 1975, sortLabel: "アンゴラ内戦（米ソキューバの代理戦争）",
      advancedText: "1975年独立後にMPLA（ソ連・キューバ支援）とUNITA（米・南ア支援）が争った冷戦の典型的な代理戦争が起きたアフリカ南西部の国の首都はどこ？"
    }
  ]);
  n += add(d, 'cold_war_end', [
    {
      text: "マルタ島 (マルタ会談・冷戦終結宣言)",
      lat: 35.8989, lng: 14.5146,
      explanation: "1989年12月地中海のマルタ島沖の艦船上でブッシュ（米）とゴルバチョフ（ソ連）が会談し「冷戦終結」を宣言した。ベルリンの壁崩壊（1989年11月）の翌月に行われた歴史的会談。ヤルタ会談（1945年）と対比される。",
      relatedTerms: ["マルタ会談", "冷戦終結宣言", "ブッシュ", "ゴルバチョフ", "ベルリンの壁崩壊後"],
      year: 1989, sortLabel: "マルタ会談（冷戦終結宣言1989年）",
      advancedText: "1989年12月ベルリンの壁崩壊の翌月にブッシュとゴルバチョフが地中海沖の艦船上で「冷戦終結」を宣言した会談が行われた地はどこ？"
    }
  ]);
  save('cold_war.json', d);
  console.log(`✅ cold_war.json +${n}問`);
  grand += n;
}

// world_wars +2問
{
  const d = load('world_wars.json');
  let n = 0;
  n += add(d, 'ww2_pacific', [
    {
      text: "ミズーリ号 (東京湾・日本の降伏調印)",
      lat: 35.4, lng: 139.75,
      explanation: "1945年9月2日東京湾に停泊した米戦艦ミズーリ号の甲板で日本の降伏文書調印式が行われた。マッカーサー元帥が連合国を代表して調印を受け、重光葵・梅津美治郎が日本代表として署名した。第二次世界大戦の公式終結の地。",
      relatedTerms: ["降伏文書調印", "東京湾", "マッカーサー", "第二次大戦終結", "1945年9月2日"],
      year: 1945, sortLabel: "ミズーリ号の降伏調印（第二次世界大戦の公式終結）",
      advancedText: "1945年9月2日マッカーサー元帥立会いのもと日本の降伏文書調印式が行われた東京湾に停泊した米戦艦の名称は？"
    }
  ]);
  n += add(d, 'ww1', [
    {
      text: "カポレット (イタリア戦線・ドイツ・オーストリア軍の大突破)",
      lat: 46.1588, lng: 13.5677,
      explanation: "現スロベニアのコバリド（当時カポレット）。1917年10月ドイツ・オーストリア軍がイタリア軍を大破した「カポレットの戦い」の地。イタリア軍約30万人が捕虜となる大敗で「カポレット」は英語で大敗北の代名詞となった。",
      relatedTerms: ["カポレットの戦い", "イタリア戦線", "ドイツ・オーストリア", "第一次大戦大敗北", "浸透戦術"],
      year: 1917, sortLabel: "カポレット（イタリア軍の大敗・第一次大戦）",
      advancedText: "1917年10月ドイツ・オーストリア軍がイタリア軍約30万人を捕虜とし「大敗北の代名詞」となったイタリア戦線の激戦地はどこ？"
    }
  ]);
  save('world_wars.json', d);
  console.log(`✅ world_wars.json +${n}問`);
  grand += n;
}

// africa +2問
{
  const d = load('africa.json');
  let n = 0;
  n += add(d, 'scramble_for_africa', [
    {
      text: "リベリア (アメリカに解放された奴隷の国・アフリカ唯一の独立国)",
      lat: 6.3, lng: -10.8,
      explanation: "1847年にアメリカで解放されたアフリカ系アメリカ人（freed slaves）が建国した共和国。エチオピアとともにアフリカ分割期（19世紀末〜20世紀初）に植民地化を免れた「アフリカ2つの独立国」の一つ。首都モンロビアはモンロー大統領にちなむ。",
      relatedTerms: ["解放奴隷の建国", "アフリカ独立国", "モンロビア", "アフリカ系アメリカ人", "エチオピアと並ぶ"],
      year: 1847, sortLabel: "リベリア（解放奴隷が建国・アフリカ分割期の独立国）",
      advancedText: "アメリカで解放されたアフリカ系アメリカ人が1847年に建国しエチオピアとともにアフリカ分割期を独立で乗り越えた西アフリカの国はどこ？"
    },
    {
      text: "プレトリア (アパルトヘイト・南アフリカ共和国の行政首都)",
      lat: -25.7461, lng: 28.1881,
      explanation: "南アフリカ共和国の行政首都。1948年アフリカーナー系のNP（国民党）が政権を取り「人種隔離政策（アパルトヘイト）」を法制化した中心地。ANC（アフリカ民族会議）の抵抗運動・マンデラの投獄・1994年初の全人種選挙でのANC勝利まで続いた。",
      relatedTerms: ["アパルトヘイト", "国民党政権", "ANC", "マンデラ", "全人種選挙1994年"],
      year: 1948, sortLabel: "プレトリア（アパルトヘイト法制化・南アフリカ行政首都）",
      advancedText: "1948年国民党がアパルトヘイトを法制化し1994年の全人種選挙でANCが勝利するまで人種差別政策の中心となった南アフリカの行政首都はどこ？"
    }
  ]);
  save('africa.json', d);
  console.log(`✅ africa.json +${n}問`);
  grand += n;
}

console.log(`\n=== 最終7問追加完了: +${grand}問 ===`);
