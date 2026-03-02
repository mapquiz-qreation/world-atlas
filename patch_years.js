/**
 * patch_years.js
 * 全 data/*.json の問題に year（西暦の整数。BC は負数）を追加する。
 * 実行: node patch_years.js
 */

const fs   = require('fs');
const path = require('path');

// ── 年号パッチ一覧 ────────────────────────────────────────────
// match: q.text の部分一致で検索
// year : 整数（BC → 負数）

const YEAR_PATCHES = [
  // ======= EUROPE — germanic =======
  { match: 'フランク王国はどこ',          year:  500 },
  { match: 'ランゴバルド王国はどこ',      year:  572 },
  { match: '西ゴート王国はどこ',          year:  475 },
  { match: 'ヴァンダル王国はどこ',        year:  435 },
  { match: 'アングロサクソン七王国はどこ', year:  600 },
  { match: 'ビザンツ帝国（東ローマ）はどこ', year: 527 },

  // ======= EUROPE — ancient =======
  { match: 'アテネ (ギリシャのポリス)',   year: -450 },
  { match: 'ローマ (帝国の首都)',         year:  -27 },
  { match: 'アレクサンドリア (エジプトの港)', year: -331 },
  { match: 'カルタゴ (フェニキア人の都市)', year: -264 },
  { match: 'スパルタ (ペロポネソス半島',  year: -480 },
  { match: 'ミラノ (メディオラヌム)',      year:  286 },
  { match: 'マッシリア (マルセイユ',      year: -600 },
  { match: 'ビザンティウム (のちのコンスタンティノープル)', year: -657 },
  { match: 'シラクサ (シチリアのギリシャ', year: -415 },
  { match: 'ニケーア (小アジアの都市)',    year:  325 },
  { match: 'アンティオキア (シリアの大都市)', year: -300 },
  { match: 'デルフォイ (アポロン神託)',    year: -480 },
  { match: 'テーバイ (ボイオティア',       year: -371 },
  { match: 'エフェソス (小アジアのギリシャ', year: -356 },
  { match: 'アクティウムの海戦',          year:  -31 },

  // ======= EUROPE — medieval =======
  { match: 'コンスタンティノープル (ビザンツの都)', year: 1453 },
  { match: 'ヴェネツィア (アドリア海',    year: 1100 },
  { match: 'コルドバ (後ウマイヤ朝',      year:  929 },
  { match: 'エルサレム (聖地・十字軍',    year: 1099 },
  { match: 'プラハ (神聖ローマ帝国',      year: 1348 },
  { match: 'フィレンツェ (ルネサンス',    year: 1400 },
  { match: 'ジェノヴァ (地中海の海運',    year: 1200 },
  { match: 'リューベック (ハンザ同盟)',   year: 1358 },
  { match: 'クリュニー (修道院改革)',     year:  910 },
  { match: 'カノッサ (カノッサの屈辱)',   year: 1077 },
  { match: 'パリ (カペー朝',             year:  987 },
  { match: 'ロンドン (ノルマン朝',        year: 1066 },
  { match: 'ブリュージュ (北海貿易)',     year: 1300 },
  { match: 'ケルン (ハンザ・大司教座)',   year: 1248 },
  { match: 'サンティアゴ・デ・コンポステラ', year: 1100 },

  // ======= EUROPE — modern =======
  { match: 'パリ (フランス革命',          year: 1789 },
  { match: 'ベルリン (ドイツ帝国',        year: 1871 },
  { match: 'ウィーン (ハプスブルク家',    year: 1700 },
  { match: 'マドリード (スペインの首都)', year: 1588 },
  { match: 'ヴェルサイユ (宮廷・条約)',   year: 1682 },
  { match: 'アムステルダム (商業・オランダ)', year: 1648 },
  { match: 'リスボン (大航海時代の港)',   year: 1498 },
  { match: 'ジュネーヴ (宗教改革',        year: 1536 },
  { match: 'ワルシャワ (ポーランド)',     year: 1791 },
  { match: 'ナポリ (南イタリア)',         year: 1700 },
  { match: 'サラエヴォ (第一次大戦',      year: 1914 },
  { match: 'ロンドン (産業革命',          year: 1800 },
  { match: 'ローマ (イタリア統一)',        year: 1871 },
  { match: 'ブリュッセル (ベルギー',      year: 1830 },
  { match: 'アルザス・ロレーヌ',         year: 1871 },

  // ======= EUROPE — age_of_exploration =======
  { match: 'リスボン (大航海時代の出発点)', year: 1498 },
  { match: 'サグレス岬',                  year: 1420 },
  { match: 'セビリャ (スペイン・新大陸', year: 1492 },
  { match: '喜望峰 (バスコ・ダ・ガマ',   year: 1488 },
  { match: 'カリカット (バスコ・ダ・ガマ', year: 1498 },
  { match: 'マルク諸島 (香辛料',          year: 1512 },
  { match: 'サン・サルバドル島',          year: 1492 },
  { match: 'マカオ (ポルトガルの中国',    year: 1557 },
  { match: 'トルデシリャス',             year: 1494 },
  { match: 'セブ島 (マゼラン',           year: 1521 },

  // ======= EUROPE — russia =======
  { match: 'モスクワ (クレムリン',        year: 1547 },
  { match: 'カザン (雷帝',               year: 1552 },
  { match: 'ノヴゴロド (キエフ・ルーシ', year: 1100 },
  { match: 'キエフ (キエフ公国',          year:  882 },
  { match: 'サンクトペテルブルク',        year: 1703 },
  { match: 'ポルタヴァ (大北方戦争)',     year: 1709 },
  { match: 'クリミア半島 (エカチェリーナ', year: 1783 },
  { match: 'ワルシャワ (ポーランド分割)', year: 1772 },
  { match: 'ボロジノ (ナポレオン',        year: 1812 },
  { match: 'セヴァストポリ (クリミア戦争)', year: 1854 },

  // ======= EUROPE — napoleon =======
  { match: 'パリ (ナポレオン戴冠',        year: 1804 },
  { match: 'アウステルリッツ',            year: 1805 },
  { match: 'トラファルガー岬',            year: 1805 },
  { match: 'ティルジット',               year: 1807 },
  { match: 'マドリード (スペイン民衆',   year: 1808 },
  { match: 'モスクワ (ロシア遠征',        year: 1812 },
  { match: 'ライプツィヒ (諸国民の戦い)', year: 1813 },
  { match: 'エルバ島',                   year: 1814 },
  { match: 'ワーテルロー',               year: 1815 },
  { match: 'セントヘレナ島',             year: 1821 },

  // ======= EUROPE — britain =======
  { match: 'ロンドン塔 (権力と処刑',      year: 1483 },
  { match: 'エディンバラ (スコットランド', year: 1707 },
  { match: 'ダブリン (アイルランド',      year: 1798 },
  { match: 'ウォータールー (ナポレオン最後', year: 1815 },
  { match: 'マンチェスター (産業革命',    year: 1800 },
  { match: 'リヴァプール (奴隷貿易',      year: 1807 },
  { match: 'カルカッタ (東インド会社',    year: 1757 },
  { match: 'スエズ運河 (ディズレーリ',    year: 1875 },
  { match: 'ケープタウン (アフリカ支配',  year: 1806 },

  // ======= MIDEAST — ancient_orient =======
  { match: 'ウル (シュメール',            year: -2100 },
  { match: 'ウルク (シュメール最古',      year: -3200 },
  { match: 'バビロン (ハンムラビ',        year: -1750 },
  { match: 'ニネヴェ (アッシリア帝国',    year:  -650 },
  { match: 'メンフィス (エジプト古王国)', year: -2500 },
  { match: 'テーベ (エジプト新王国',      year: -1450 },
  { match: 'ペルセポリス (アケメネス朝',  year:  -500 },
  { match: 'ハットゥシャ (ヒッタイト',    year: -1300 },
  { match: 'ビブロス (フェニキアの港',    year: -1000 },
  { match: 'ティルス (フェニキアの海上',  year:  -900 },
  { match: 'スサ (エラムの都',            year:  -500 },
  { match: 'アッカド (アッカド帝国',      year: -2350 },
  { match: 'エクバタナ (メディア王国',    year:  -700 },
  { match: 'アケタアトン (アメンホテプ4世', year: -1350 },
  { match: 'アッシュール (アッシリア発祥', year: -1800 },
  { match: 'マリ (メソポタミア北部',      year: -2000 },
  { match: 'ラガシュ (シュメール',        year: -2500 },
  { match: 'エリドゥ (シュメール最古の都市伝説)', year: -3500 },
  { match: 'シドン (フェニキアの主要港)', year: -1100 },
  { match: 'カルケミシュ (ヒッタイトとエジプト)', year: -1274 },

  // ======= MIDEAST — islamic_expansion =======
  { match: 'メッカ (イスラーム最高',      year:  622 },
  { match: 'メディナ (聖遷の地)',         year:  622 },
  { match: 'ダマスクス (ウマイヤ朝',      year:  661 },
  { match: 'バグダード (アッバース朝の都)', year:  762 },
  { match: 'カイロ (ファーティマ朝',      year:  969 },
  { match: 'クファ (正統カリフ',          year:  638 },
  { match: 'ニハーヴァンド',             year:  642 },
  { match: 'バスラ (イラクの港',          year:  636 },
  { match: 'バビロン (メソポタミアの古都)', year:  700 },
  { match: 'クテシフォン (ササン朝',      year:  637 },
  { match: 'フスタート (エジプト初のイスラーム', year: 641 },
  { match: 'アレクサンドリア (エジプトの港)', year: 642 },
  { match: 'エルサレム (聖地)',           year:  638 },
  { match: 'サマッラ (アッバース朝',      year:  836 },
  { match: 'アンティオキア (シリアの要衝)', year: 637 },

  // ======= MIDEAST — turco_mongol =======
  { match: 'イスファハーン (サファヴィー', year: 1598 },
  { match: 'テブリーズ (イル・ハン国',    year: 1258 },
  { match: 'サマルカンド (ティムール',    year: 1370 },
  { match: 'コンスタンティノープル (オスマンの都)', year: 1453 },
  { match: 'アンカラ (1402年',           year: 1402 },
  { match: 'スエズ運河 (近代の生命線)',   year: 1869 },
  { match: 'アイン・ジャールート',        year: 1260 },
  { match: 'アダナ (小アジア',           year: 1375 },
  { match: 'レイ (イル・ハン国',          year: 1220 },
  { match: 'マンジケルト',               year: 1071 },
  { match: 'ガズナ (ガズナ朝',           year:  998 },
  { match: 'スィヴァス',                  year: 1400 },
  { match: 'アブー・キール',              year: 1798 },
  { match: 'カイロ (マムルーク朝',        year: 1250 },
  { match: 'バグダード (フレグ攻略)',     year: 1258 },
  { match: 'エディルネ (オスマン帝国',    year: 1365 },
  { match: 'モハーチ (オスマン',          year: 1526 },
  { match: 'ウィーン (第一次包囲',        year: 1529 },
  { match: 'スレイマニエ・モスク',        year: 1557 },
  { match: 'レパント (オスマン艦隊',      year: 1571 },

  // ======= MIDEAST — modern_turkey =======
  { match: 'アンカラ (トルコ共和国',      year: 1923 },
  { match: 'ガリポリ',                    year: 1915 },
  { match: 'エルサレム (バルフォア宣言)', year: 1917 },
  { match: 'ダマスカス (アラブ独立運動)', year: 1916 },
  { match: 'バグダード (イギリス委任統治', year: 1920 },
  { match: 'リヤド (サウジアラビア建国)', year: 1932 },
  { match: 'テヘラン (パフラヴィー朝',    year: 1941 },
  { match: 'カイロ (エジプト独立運動)',   year: 1919 },
  { match: 'メッカ (イブン・サウード',    year: 1925 },
  { match: 'イスタンブール (オスマン帝国の旧都)', year: 1922 },

  // ======= AFRICA — african_kingdoms =======
  { match: 'カルタゴ (フェニキア人の植民', year: -264 },
  { match: 'アレクサンドリア (プトレマイオス', year: -323 },
  { match: 'メロエ (クシュ王国',          year:  300 },
  { match: 'アクスム (アクスム王国',      year:  350 },
  { match: 'トンブクトゥ (マリ帝国',      year: 1400 },
  { match: 'キルワ・キシワニ',            year: 1300 },
  { match: 'ザンジバル島 (インド洋交易)', year: 1200 },
  { match: 'モガディシュ (アフリカの角)', year: 1300 },
  { match: 'グレート・ジンバブエ',        year: 1300 },
  { match: 'カノ (ハウサ諸国',           year: 1400 },
  { match: 'ガオ (ソンガイ帝国',          year: 1464 },
  { match: 'カーネム (チャド湖',          year:  900 },
  { match: 'マリ帝国はどれ',             year: 1300 },
  { match: 'クシュ王国はどれ',           year: -100 },
  { match: 'アクスム王国はどれ',         year:  350 },
  { match: 'ソンガイ帝国はどれ',         year: 1464 },

  // ======= AFRICA — scramble_for_africa =======
  { match: 'ケープタウン (オランダ東インド会社設立', year: 1880 },
  { match: 'ダカール (フランス領西アフリカ', year: 1895 },
  { match: 'カイロ (イギリスの保護',      year: 1882 },
  { match: 'ハルツーム (英エジプト共同',  year: 1899 },
  { match: 'ナイロビ (イギリス領東アフリカ', year: 1899 },
  { match: 'ダルエスサラーム (ドイツ領', year: 1891 },
  { match: 'ルアンダ (ポルトガル領アンゴラ', year: 1880 },
  { match: 'ラゴス (イギリス領ナイジェリア', year: 1861 },
  { match: 'アジスアベバ (独立を守った',  year: 1889 },
  { match: 'アドワ (エチオピアがイタリア軍', year: 1896 },
  { match: 'キンシャサ (ベルギー領コンゴ', year: 1881 },
  { match: 'アルジェ (フランス領北アフリカ', year: 1830 },
  { match: 'ファショダ (英仏が激突',      year: 1898 },
  { match: 'スエズ (イギリスが買収',      year: 1882 },
  { match: 'マプト (ポルトガル領モザンビーク', year: 1898 },
  { match: 'イギリスのアフリカ縦断',     year: 1890 },
  { match: 'フランスのアフリカ横断',     year: 1890 },

  // ======= INDIA — indus =======
  { match: 'モヘンジョ＝ダーロ',          year: -2500 },
  { match: 'ハラッパー (インダス文明の命名', year: -2300 },
  { match: 'ロータル (インダス文明の港',  year: -2200 },
  { match: 'ドーラヴィーラー',            year: -2100 },
  { match: 'カーリーバンガン',            year: -2800 },
  { match: 'メヘルガル',                  year: -6500 },
  { match: 'コートディジ',               year: -2800 },
  { match: 'チャンフーダーロー',          year: -2200 },
  { match: 'ガネーリーワーラー',          year: -2500 },
  { match: 'バナーワリー',               year: -2300 },

  // ======= INDIA — ancient_medieval_india =======
  { match: 'パータリプトラ (マウリヤ朝',  year:  -321 },
  { match: 'カノウジ (ヴァルダナ朝',      year:   606 },
  { match: 'サーンチー (アショーカ王',    year:  -260 },
  { match: 'アジャンター (石窟寺院',      year:   400 },
  { match: 'エローラ (三宗教',            year:   600 },
  { match: 'カーンチー (南インド',        year:   600 },
  { match: 'ヴィジャヤナガル',            year:  1336 },

  // ======= INDIA — mughal_colonial =======
  { match: 'デリー (ムガル帝国',          year: 1526 },
  { match: 'アーグラ (タージ・マハル',    year: 1632 },
  { match: 'ゴア (ポルトガルの拠点)',     year: 1510 },
  { match: 'カルカッタ (イギリスの拠点)', year: 1757 },
  { match: 'マドラス (イギリスの南',      year: 1639 },
  { match: 'ポンディシェリ (フランス',    year: 1674 },
  { match: 'ボンベイ (イギリスの西',      year: 1661 },

  // ======= CHINA — five_hu =======
  { match: '匈奴の主な居住域',            year:  400 },
  { match: '鮮卑の主な居住域',            year:  400 },
  { match: '羯の主な居住域',              year:  400 },
  { match: '氐の主な居住域',              year:  400 },
  { match: '羌の主な居住域',              year:  400 },

  // ======= CHINA — ancient_china =======
  { match: '咸陽 (秦の都)',               year:  -221 },
  { match: '長安 (前漢の都)',             year:  -202 },
  { match: '洛陽 (後漢・魏の都)',         year:    25 },
  { match: '成都 (蜀の拠点)',             year:   221 },
  { match: '建業 (呉の都・南京)',         year:   229 },
  { match: '平城 (北魏の都)',             year:   398 },

  // ======= CHINA — medieval_china =======
  { match: '北京／大都 (元・モンゴル',    year: 1271 },
  { match: '南京 (金陵・呉越',            year:  500 },
  { match: '広州 (南海貿易',              year:  700 },
  { match: '長安 (西安・隋唐',            year:  618 },
  { match: '洛陽 (隋の東都)',             year:  605 },
  { match: '開封 (北宋の都)',             year:  960 },
  { match: '臨安 (杭州・南宋',           year: 1127 },
  { match: 'カラコルム (モンゴル帝国の初代', year: 1235 },
  { match: 'サライ (キプチャク',          year: 1254 },
  { match: 'タブリーズ (イル・ハン国',    year: 1258 },
  { match: 'アルマリク (チャガタイ',      year: 1227 },
  { match: 'カンバリク (大都・フビライ)', year: 1271 },
  { match: 'ワールシュタット (モンゴル',  year: 1241 },
  { match: '泉州 (マルコ・ポーロ',        year: 1290 },
  { match: '大元ウルス（元朝）はどれ',   year: 1271 },
  { match: 'チャガタイ・ハン国はどれ',   year: 1227 },
  { match: 'イル・ハン国はどれ',         year: 1256 },
  { match: 'キプチャク・ハン国はどれ',   year: 1242 },

  // ======= CHINA — early_modern_china =======
  { match: '北京 (明・清の都)',           year: 1421 },
  { match: '金陵 (南京・明の初都)',       year: 1368 },
  { match: '上海 (開港された重要港)',     year: 1842 },
  { match: '景徳鎮 (陶磁器',             year: 1400 },
  { match: '広州 (唯一の公行',            year: 1757 },
  { match: 'マカオ (ポルトガル居住',      year: 1557 },
  { match: '香港 (英に割譲',             year: 1842 },

  // ======= SOUTHEAST ASIA — ancient =======
  { match: 'アンコール・ワット',          year: 1113 },
  { match: 'パガン (ビルマ初の',          year: 1044 },
  { match: 'アユタヤ (タイの古都)',       year: 1350 },
  { match: 'シュリーヴィジャヤ',          year:  700 },
  { match: 'ボロブドゥール',             year:  800 },
  { match: 'マジャパヒト王国',           year: 1293 },
  { match: 'スコータイ (タイ最初',        year: 1238 },
  { match: 'チャンパ王国・ミーソン',      year:  400 },
  { match: 'タンロン (李朝ベトナム',      year: 1010 },
  { match: 'アヌラーダプラ (スリランカ', year:  -300 },

  // ======= SOUTHEAST ASIA — colonial =======
  { match: 'バタヴィア (オランダ',        year: 1619 },
  { match: 'マラッカ (支配者が変遷',      year: 1511 },
  { match: 'シンガポール (英のラッフルズ', year: 1819 },
  { match: 'サイゴン (フランス領インドシナ', year: 1859 },
  { match: 'ラングーン (イギリス領ビルマ)', year: 1852 },
  { match: 'マニラ (スペイン統治',        year: 1571 },
  { match: 'フエ (グエン朝',              year: 1804 },
  { match: 'ホイアン (朱印船貿易)',       year: 1600 },

  // ======= SOUTHEAST ASIA — independence =======
  { match: 'ハノイ (ホーチミンのベトナム独立', year: 1945 },
  { match: 'ディエンビエンフー',          year: 1954 },
  { match: 'ジャカルタ (スカルノ',        year: 1945 },
  { match: 'バンドン (アジア・アフリカ会議)', year: 1955 },
  { match: 'プノンペン (カンボジア独立', year: 1953 },
  { match: 'ビエンチャン (ラオス独立)',   year: 1954 },
  { match: 'クアラルンプール (マラヤ',    year: 1957 },

  // ======= NORTH AMERICA — frontier =======
  { match: 'ジェームズタウン',            year: 1607 },
  { match: 'ボストン (ピルグリム',        year: 1620 },
  { match: 'フィラデルフィア (13植民地',  year: 1682 },
  { match: 'ニューオーリンズ (ルイジアナ買収', year: 1803 },
  { match: 'セントルイス',               year: 1804 },
  { match: 'サンタフェ (サンタフェトレイル)', year: 1821 },
  { match: 'サンアントニオ (アラモの砦)', year: 1836 },
  { match: 'ソルトレークシティ',          year: 1847 },
  { match: 'サクラメント (サッターズミル)', year: 1848 },
  { match: 'サンフランシスコ (ゴールドラッシュ)', year: 1849 },

  // ======= NORTH AMERICA — independence =======
  { match: 'ボストン (ボストン茶会事件)', year: 1773 },
  { match: 'レキシントン',               year: 1775 },
  { match: 'フィラデルフィア (独立宣言', year: 1776 },
  { match: 'サラトガ (フランス参戦',      year: 1777 },
  { match: 'バレーフォージ',             year: 1777 },
  { match: 'ヨークタウン',               year: 1781 },
  { match: 'ワシントンD.C.',             year: 1790 },
  { match: 'ニューオーリンズ (英米戦争', year: 1815 },

  // ======= NORTH AMERICA — civil_war =======
  { match: 'フォートサムター',            year: 1861 },
  { match: 'ブルラン (第一次',            year: 1861 },
  { match: 'リッチモンド (南部連合',      year: 1861 },
  { match: 'アンティータム',             year: 1862 },
  { match: 'ゲティズバーグ',             year: 1863 },
  { match: 'ヴィックスバーグ',           year: 1863 },
  { match: 'アトランタ (シャーマン',      year: 1864 },
  { match: 'アポマトックス',             year: 1865 },

  // ======= LATIN AMERICA — sun_empire =======
  { match: 'テノチティトラン',            year: 1325 },
  { match: 'チチェン・イッツァ',          year:  800 },
  { match: 'マチュピチュ',               year: 1450 },
  { match: 'ティワナク',                  year:  500 },
  { match: 'テオティワカン',             year:  200 },
  { match: 'クスコ',                      year: 1200 },
  { match: 'コパン',                      year:  400 },
  { match: 'ナスカ',                      year:  200 },

  // ======= LATIN AMERICA — colonial_era =======
  { match: 'サントドミンゴ',             year: 1496 },
  { match: 'ポトシ',                      year: 1545 },
  { match: 'リオデジャネイロ',            year: 1565 },
  { match: 'リマ',                        year: 1535 },
  { match: 'アカプルコ',                  year: 1565 },
  { match: 'カルタヘナ',                  year: 1533 },
  { match: 'サルバドール',               year: 1549 },

  // ======= LATIN AMERICA — liberation_era =======
  { match: 'カラカス',                    year: 1810 },
  { match: 'ボゴタ',                      year: 1819 },
  { match: 'ブエノスアイレス',            year: 1810 },
  { match: 'メキシコシティ（イダルゴ',   year: 1810 },
  { match: 'サンティアゴ（サン・マルティン', year: 1818 },
  { match: 'アヤクーチョ',               year: 1824 },
  { match: 'ポルトープランス',            year: 1804 },

  // ======= WORLD WARS — ww1 =======
  { match: 'サラエヴォ (第一次世界大戦の導火線)', year: 1914 },
  { match: 'ヴェルダン (最大の消耗戦)',   year: 1916 },
  { match: 'ソンム川',                    year: 1916 },
  { match: 'タンネンベルク',             year: 1914 },
  { match: 'キール (ドイツ革命',          year: 1918 },
  { match: 'ヴェルサイユ (講和条約',      year: 1919 },
  { match: 'ペトログラード (ロシア革命)', year: 1917 },
  { match: 'マルヌ川',                    year: 1914 },

  // ======= WORLD WARS — interwar =======
  { match: 'ウォール街 (世界大恐慌',      year: 1929 },
  { match: 'ミュンヘン (ヒトラー台頭',    year: 1938 },
  { match: 'ローマ (ムッソリーニ',        year: 1922 },
  { match: '瀋陽 (満州事変',             year: 1931 },
  { match: 'ゲルニカ',                    year: 1937 },
  { match: 'ウィーン (オーストリア併合', year: 1938 },
  { match: 'マドリード (スペイン内戦',    year: 1936 },

  // ======= WORLD WARS — ww2_europe =======
  { match: 'ダンケルク',                  year: 1940 },
  { match: 'スターリングラード',          year: 1942 },
  { match: 'アウシュビッツ',             year: 1942 },
  { match: 'ノルマンディー',             year: 1944 },
  { match: 'エル・アラメイン',            year: 1942 },
  { match: 'レニングラード',             year: 1941 },
  { match: 'ベルリン (第三帝国',          year: 1945 },

  // ======= WORLD WARS — ww2_pacific =======
  { match: '真珠湾',                      year: 1941 },
  { match: '南京 (日中戦争',             year: 1937 },
  { match: 'シンガポール (大英帝国の屈辱)', year: 1942 },
  { match: 'ミッドウェー島',             year: 1942 },
  { match: 'ガダルカナル島',             year: 1942 },
  { match: '広島 (人類初の原爆',          year: 1945 },
  { match: '長崎 (2発目の原爆)',         year: 1945 },
  { match: '沖縄 (最後の地上戦)',         year: 1945 },

  // ======= COLD WAR — early =======
  { match: 'ベルリン (封鎖・壁',          year: 1948 },
  { match: 'ワシントンD.C. (西側陣営',    year: 1947 },
  { match: 'モスクワ (東側陣営',          year: 1955 },
  { match: '平壌 (朝鮮戦争',             year: 1950 },
  { match: 'ハバナ (キューバ革命',        year: 1959 },
  { match: 'バイコヌール',               year: 1957 },
  { match: 'ケープカナベラル',           year: 1958 },
  { match: '仁川 (朝鮮戦争',             year: 1950 },

  // ======= COLD WAR — proxy =======
  { match: 'ハノイ (ベトナム戦争',        year: 1964 },
  { match: 'サイゴン (南ベトナム陥落',    year: 1975 },
  { match: 'プラハ (プラハの春',          year: 1968 },
  { match: 'カブール (ソ連のアフガニスタン', year: 1979 },
  { match: 'サンティアゴ (チリ・CIA',     year: 1973 },
  { match: 'ソウル (韓国の奇跡',          year: 1988 },
  { match: 'テヘラン (イラン革命',        year: 1979 },

  // ======= COLD WAR — end =======
  { match: 'ベルリンの壁崩壊',            year: 1989 },
  { match: 'ワルシャワ (連帯運動',        year: 1989 },
  { match: 'プラハ (ビロード革命)',       year: 1989 },
  { match: 'ブカレスト (ルーマニア革命)', year: 1989 },
  { match: 'ヴィリニュス',               year: 1990 },
  { match: 'モスクワ (ソ連崩壊',          year: 1991 },
  { match: 'レイキャビク',               year: 1986 },
];

// ── 漏れ補完パッチ（より短いキーで再マッチ） ──────────────────
const YEAR_PATCHES_EXTRA = [
  { match: 'ザンジバル島',               year: 1200 },
  { match: 'モガディシュ',               year: 1300 },
  { match: 'カンバリク',                  year: 1271 },
  { match: 'ブカレスト',                  year: 1989 },
  { match: 'ポルタヴァ',                  year: 1709 },
  { match: 'ワルシャワ (ポーランド分割)', year: 1772 },
  { match: 'セヴァストポリ',             year: 1854 },
  { match: 'ライプツィヒ',               year: 1813 },
  { match: 'メンフィス (エジプト古王国)', year: -2500 },
  { match: 'カルケミシュ',               year: -1274 },
  { match: 'エルサレム (バルフォア',      year: 1917 },
  { match: 'ダマスカス',                  year: 1916 },
  { match: 'リヤド',                      year: 1932 },
  { match: 'カイロ (エジプト独立',        year: 1919 },
  { match: 'サンタフェ',                  year: 1821 },
  { match: 'サンアントニオ',             year: 1836 },
  { match: 'サクラメント',               year: 1848 },
  { match: 'サンフランシスコ',           year: 1849 },
  { match: 'ボストン (ボストン茶会',      year: 1773 },
  { match: 'ホイアン',                    year: 1600 },
  { match: 'ペトログラード',             year: 1917 },
];

// ── パッチ適用 ────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
const files    = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json') && f !== 'timeline.json');

let totalPatched = 0;
let totalSkipped = 0;

files.forEach(file => {
    const filePath = path.join(DATA_DIR, file);
    const data     = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let changed    = false;

    Object.values(data.eras).forEach(era => {
        (era.fixed || []).forEach(q => {
            if (q.year !== undefined) return; // 既にあればスキップ

            const patch = YEAR_PATCHES.find(p => q.text && q.text.includes(p.match))
                       || YEAR_PATCHES_EXTRA.find(p => q.text && q.text.includes(p.match));
            if (patch) {
                q.year   = patch.year;
                changed  = true;
                totalPatched++;
            } else {
                totalSkipped++;
            }
        });
    });

    if (changed) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`✅ ${file} を更新`);
    }
});

console.log(`\n完了: ${totalPatched}問にyearを追加。マッチなし: ${totalSkipped}問`);
