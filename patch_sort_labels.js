/**
 * patch_sort_labels.js
 * 並べ替えクイズ専用の説明文 sortLabel を全問題に追加する。
 * 実行: node patch_sort_labels.js
 */

const fs   = require('fs');
const path = require('path');

const PATCHES = [
  // ======= EUROPE — germanic =======
  { match: 'フランク王国はどこ',           sortLabel: 'フランク王国がガリアを支配' },
  { match: 'ランゴバルド王国はどこ',       sortLabel: 'ランゴバルド族がイタリアへ侵入' },
  { match: '西ゴート王国はどこ',           sortLabel: '西ゴート族がイベリア半島を支配' },
  { match: 'ヴァンダル王国はどこ',         sortLabel: 'ヴァンダル族が北アフリカへ定住' },
  { match: 'アングロサクソン七王国はどこ', sortLabel: 'アングロサクソン七王国のブリテン支配' },
  { match: 'ビザンツ帝国（東ローマ）はどこ', sortLabel: 'ユスティニアヌス帝の東ローマ全盛' },

  // ======= EUROPE — ancient =======
  { match: 'アテネ (ギリシャのポリス)',    sortLabel: 'ペリクレス時代のアテネ民主政' },
  { match: 'ローマ (帝国の首都)',          sortLabel: 'アウグストゥスのローマ帝政開始' },
  { match: 'アレクサンドリア (エジプトの港)', sortLabel: 'アレクサンドロスによるアレクサンドリア建設' },
  { match: 'カルタゴ (フェニキア人の都市)', sortLabel: 'ポエニ戦争（カルタゴvsローマ）' },
  { match: 'スパルタ (ペロポネソス半島',   sortLabel: 'テルモピュライの戦い（ペルシア戦争）' },
  { match: 'ミラノ (メディオラヌム)',       sortLabel: 'ローマ帝国分割とミラノの台頭' },
  { match: 'マッシリア (マルセイユ',       sortLabel: 'ギリシャ人のマッシリア植民市建設' },
  { match: 'ビザンティウム (のちのコンスタンティノープル)', sortLabel: 'ビザンティウム建設（コンスタンティノープルの前身）' },
  { match: 'シラクサ (シチリアのギリシャ', sortLabel: 'アテネ遠征軍のシラクサ惨敗' },
  { match: 'ニケーア (小アジアの都市)',    sortLabel: 'ニケーア公会議（キリスト教正統教義の決定）' },
  { match: 'アンティオキア (シリアの大都市)', sortLabel: 'セレウコス朝アンティオキアの建設' },
  { match: 'デルフォイ (アポロン神託)',    sortLabel: 'ペルシア戦争期のデルフォイ神託' },
  { match: 'テーバイ (ボイオティア',       sortLabel: 'テーバイの覇権（レウクトラの戦い）' },
  { match: 'エフェソス (小アジアのギリシャ', sortLabel: 'アルテミス神殿焼失とアレクサンドロス時代' },
  { match: 'アクティウムの海戦',           sortLabel: 'アクティウムの海戦（オクタウィアヌスの勝利）' },

  // ======= EUROPE — medieval =======
  { match: 'コンスタンティノープル (ビザンツの都)', sortLabel: 'オスマン帝国のコンスタンティノープル征服' },
  { match: 'ヴェネツィア (アドリア海',     sortLabel: 'ヴェネツィア商業共和国の全盛' },
  { match: 'コルドバ (後ウマイヤ朝',       sortLabel: '後ウマイヤ朝のカリフ制宣言' },
  { match: 'エルサレム (聖地・十字軍',     sortLabel: '第一次十字軍のエルサレム奪還' },
  { match: 'プラハ (神聖ローマ帝国',       sortLabel: 'カレル大学設立（神聖ローマ帝国）' },
  { match: 'フィレンツェ (ルネサンス',     sortLabel: 'メディチ家とルネサンスのフィレンツェ' },
  { match: 'ジェノヴァ (地中海の海運',     sortLabel: 'ジェノヴァの地中海交易覇権' },
  { match: 'リューベック (ハンザ同盟)',    sortLabel: 'ハンザ同盟の成立とリューベック' },
  { match: 'クリュニー (修道院改革)',      sortLabel: 'クリュニー修道院改革の開始' },
  { match: 'カノッサ (カノッサの屈辱)',    sortLabel: 'カノッサの屈辱（叙任権闘争）' },
  { match: 'パリ (カペー朝',              sortLabel: 'カペー朝フランスの王権確立' },
  { match: 'ロンドン (ノルマン朝',         sortLabel: 'ノルマン征服とイングランド王国成立' },
  { match: 'ブリュージュ (北海貿易)',      sortLabel: 'ブリュージュの北海交易都市としての繁栄' },
  { match: 'ケルン (ハンザ・大司教座)',    sortLabel: 'ケルン大聖堂建設開始（ゴシック建築）' },
  { match: 'サンティアゴ・デ・コンポステラ', sortLabel: '中世巡礼路サンティアゴの全盛' },

  // ======= EUROPE — modern =======
  { match: 'パリ (フランス革命',           sortLabel: 'フランス革命の勃発（バスティーユ襲撃）' },
  { match: 'ベルリン (ドイツ帝国',         sortLabel: 'ビスマルクのドイツ帝国統一' },
  { match: 'ウィーン (ハプスブルク家',     sortLabel: 'ウィーン体制とハプスブルク家の支配' },
  { match: 'マドリード (スペインの首都)',  sortLabel: 'スペイン無敵艦隊の最盛期' },
  { match: 'ヴェルサイユ (宮廷・条約)',    sortLabel: 'ルイ14世のヴェルサイユ宮殿完成' },
  { match: 'アムステルダム (商業・オランダ)', sortLabel: 'オランダ黄金時代の商業帝国' },
  { match: 'リスボン (大航海時代の港)',    sortLabel: 'ポルトガルの大航海時代全盛' },
  { match: 'ジュネーヴ (宗教改革',         sortLabel: 'カルヴァンのジュネーヴ宗教改革' },
  { match: 'ワルシャワ (ポーランド)',      sortLabel: 'ポーランド5月3日憲法の制定' },
  { match: 'ナポリ (南イタリア)',          sortLabel: 'スペイン継承戦争とナポリ王国' },
  { match: 'サラエヴォ (第一次大戦',       sortLabel: 'フランツ・フェルディナント暗殺（第一次大戦の導火線）' },
  { match: 'ロンドン (産業革命',           sortLabel: '産業革命の中心地・世界の工場ロンドン' },
  { match: 'ローマ (イタリア統一)',         sortLabel: 'リソルジメントとイタリア統一' },
  { match: 'ブリュッセル (ベルギー',       sortLabel: 'ベルギー独立革命' },
  { match: 'アルザス・ロレーヌ',          sortLabel: '普仏戦争後のアルザス・ロレーヌ割譲' },

  // ======= EUROPE — age_of_exploration =======
  { match: 'リスボン (大航海時代の出発点)', sortLabel: 'バスコ・ダ・ガマのインド航路開拓' },
  { match: 'サグレス岬',                   sortLabel: 'エンリケ航海王子の航海学校設立' },
  { match: 'セビリャ (スペイン・新大陸',   sortLabel: 'コロンブスの新大陸到達とスペイン' },
  { match: '喜望峰 (バスコ・ダ・ガマ',    sortLabel: 'ディアスによる喜望峰の発見' },
  { match: 'カリカット (バスコ・ダ・ガマ', sortLabel: 'バスコ・ダ・ガマのインド到達' },
  { match: 'マルク諸島 (香辛料',           sortLabel: 'ポルトガルの香辛料諸島（モルッカ）到達' },
  { match: 'サン・サルバドル島',           sortLabel: 'コロンブスのサン・サルバドル島上陸' },
  { match: 'マカオ (ポルトガルの中国',     sortLabel: 'ポルトガルのマカオ居住権獲得' },
  { match: 'トルデシリャス',              sortLabel: 'トルデシリャス条約（スペイン・ポルトガル世界分割）' },
  { match: 'セブ島 (マゼラン',            sortLabel: 'マゼランのセブ島上陸と死（世界一周）' },

  // ======= EUROPE — russia =======
  { match: 'モスクワ (クレムリン',         sortLabel: 'イワン雷帝のツァーリ戴冠' },
  { match: 'カザン (雷帝',                sortLabel: 'イワン雷帝のカザン・ハン国征服' },
  { match: 'ノヴゴロド (キエフ・ルーシ',  sortLabel: 'ノヴゴロド共和国の商業全盛' },
  { match: 'キエフ (キエフ公国',           sortLabel: 'リューリク朝キエフ公国の成立' },
  { match: 'サンクトペテルブルク',         sortLabel: 'ピョートル大帝の新都建設' },
  { match: 'ポルタヴァ (大北方戦争)',      sortLabel: 'ポルタヴァの戦い（ロシアがスウェーデンを破る）' },
  { match: 'クリミア半島 (エカチェリーナ', sortLabel: 'エカチェリーナ2世のクリミア半島獲得' },
  { match: 'ワルシャワ (ポーランド分割)',  sortLabel: 'ポーランド第1次分割（ロシア・プロイセン・オーストリア）' },
  { match: 'ボロジノ (ナポレオン',         sortLabel: 'ボロジノの戦い（ナポレオンのロシア遠征）' },
  { match: 'セヴァストポリ',              sortLabel: 'クリミア戦争のセヴァストポリ包囲戦' },

  // ======= EUROPE — napoleon =======
  { match: 'パリ (ナポレオン戴冠',         sortLabel: 'ナポレオンの皇帝戴冠式（ノートルダム）' },
  { match: 'アウステルリッツ',             sortLabel: '三帝会戦・アウステルリッツの戦い' },
  { match: 'トラファルガー岬',             sortLabel: 'トラファルガー海戦（ネルソン提督の戦死）' },
  { match: 'ティルジット',                sortLabel: 'ティルジット条約（ナポレオンの全盛期）' },
  { match: 'マドリード (スペイン民衆',     sortLabel: 'スペイン民衆の蜂起（半島戦争開始）' },
  { match: 'モスクワ (ロシア遠征',         sortLabel: 'ナポレオンのモスクワ遠征失敗' },
  { match: 'ライプツィヒ (諸国民の戦い)', sortLabel: '諸国民の戦い（ナポレオンの退勢）' },
  { match: 'エルバ島',                    sortLabel: 'ナポレオン第1次退位とエルバ島流刑' },
  { match: 'ワーテルロー',                sortLabel: 'ワーテルローの戦い（ナポレオン最終敗北）' },
  { match: 'セントヘレナ島',              sortLabel: 'ナポレオンのセントヘレナ島配流と死' },

  // ======= EUROPE — britain =======
  { match: 'ロンドン塔 (権力と処刑',       sortLabel: 'テューダー朝のロンドン塔と政治的処刑' },
  { match: 'エディンバラ (スコットランド', sortLabel: 'イングランド・スコットランド合同' },
  { match: 'ダブリン (アイルランド',       sortLabel: 'アイルランド反乱とイギリス支配' },
  { match: 'ウォータールー (ナポレオン最後', sortLabel: 'ウェリントン将軍のナポレオン最終撃破' },
  { match: 'マンチェスター (産業革命',     sortLabel: '産業革命の心臓部マンチェスター' },
  { match: 'リヴァプール (奴隷貿易',       sortLabel: '大西洋奴隷貿易廃止とリヴァプール' },
  { match: 'カルカッタ (東インド会社',     sortLabel: 'プラッシーの戦いとイギリスのインド支配確立' },
  { match: 'スエズ運河 (ディズレーリ',     sortLabel: 'ディズレーリのスエズ運河株買収' },
  { match: 'ケープタウン (アフリカ支配',   sortLabel: 'イギリスのケープ植民地占領' },

  // ======= MIDEAST — ancient_orient =======
  { match: 'ウル (シュメール',             sortLabel: 'ウル第三王朝（シュメール文明の全盛）' },
  { match: 'ウルク (シュメール最古',       sortLabel: 'ウルクへの楔形文字の発明' },
  { match: 'バビロン (ハンムラビ',         sortLabel: 'ハンムラビ王のバビロン法典' },
  { match: 'ニネヴェ (アッシリア帝国',     sortLabel: 'アッシリア帝国のニネヴェ全盛' },
  { match: 'メンフィス (エジプト古王国)',  sortLabel: 'エジプト古王国とピラミッド建設' },
  { match: 'テーベ (エジプト新王国',       sortLabel: 'エジプト新王国・アメンホテプ3世の全盛' },
  { match: 'ペルセポリス (アケメネス朝',   sortLabel: 'ダレイオス1世のペルセポリス建設' },
  { match: 'ハットゥシャ (ヒッタイト',     sortLabel: 'ヒッタイト帝国の最盛期' },
  { match: 'ビブロス (フェニキアの港',     sortLabel: 'フェニキア人のビブロスとアルファベット起源' },
  { match: 'ティルス (フェニキアの海上',   sortLabel: 'フェニキアの海上交易全盛とカルタゴ建設' },
  { match: 'スサ (エラムの都',             sortLabel: 'ダレイオス1世のスサ（ペルシア冬の都）' },
  { match: 'アッカド (アッカド帝国',       sortLabel: 'サルゴン王のアッカド帝国成立' },
  { match: 'エクバタナ (メディア王国',     sortLabel: 'メディア王国の建国（エクバタナ）' },
  { match: 'アケタアトン (アメンホテプ4世', sortLabel: 'アメンホテプ4世のアマルナ宗教改革' },
  { match: 'アッシュール (アッシリア発祥', sortLabel: 'アッシリア発祥の地アッシュール' },
  { match: 'マリ (メソポタミア北部',       sortLabel: 'マリ王国の都市国家繁栄' },
  { match: 'ラガシュ (シュメール',         sortLabel: 'シュメール都市国家ラガシュの全盛' },
  { match: 'エリドゥ (シュメール最古の都市伝説)', sortLabel: '最古のシュメール都市エリドゥ' },
  { match: 'シドン (フェニキアの主要港)',  sortLabel: 'フェニキアの主要港シドンの交易' },
  { match: 'カルケミシュ (ヒッタイトとエジプト)', sortLabel: 'カデシュの戦い（ヒッタイトvsエジプト）' },

  // ======= MIDEAST — islamic_expansion =======
  { match: 'メッカ (イスラーム最高',       sortLabel: 'ムハンマドのヒジュラ（聖遷）' },
  { match: 'メディナ (聖遷の地)',          sortLabel: 'ムハンマドのメディナ建国' },
  { match: 'ダマスクス (ウマイヤ朝',       sortLabel: 'ウマイヤ朝のダマスクス遷都' },
  { match: 'バグダード (アッバース朝の都)', sortLabel: 'アッバース朝のバグダード建都' },
  { match: 'カイロ (ファーティマ朝',       sortLabel: 'ファーティマ朝のカイロ建設' },
  { match: 'クファ (正統カリフ',           sortLabel: '正統カリフ時代のクファ建設' },
  { match: 'ニハーヴァンド',              sortLabel: 'ニハーヴァンドの戦い（ササン朝の滅亡）' },
  { match: 'バスラ (イラクの港',           sortLabel: 'イスラーム帝国のバスラ建設' },
  { match: 'バビロン (メソポタミアの古都)', sortLabel: 'イスラーム勢力のメソポタミア征服' },
  { match: 'クテシフォン (ササン朝',       sortLabel: 'イスラーム軍のクテシフォン征服（ササン朝滅亡）' },
  { match: 'フスタート',                  sortLabel: 'エジプト初のイスラーム都市フスタート建設' },
  { match: 'アレクサンドリア (エジプトの港)', sortLabel: 'イスラーム軍のアレクサンドリア征服' },
  { match: 'エルサレム (聖地)',            sortLabel: 'カリフ・ウマルのエルサレム征服' },
  { match: 'サマッラ (アッバース朝',       sortLabel: 'アッバース朝のサマッラー遷都' },
  { match: 'アンティオキア (シリアの要衝)', sortLabel: 'イスラーム軍のアンティオキア征服' },

  // ======= MIDEAST — turco_mongol =======
  { match: 'イスファハーン (サファヴィー', sortLabel: 'サファヴィー朝のイスファハーン遷都' },
  { match: 'テブリーズ (イル・ハン国',     sortLabel: 'イル・ハン国のテブリーズ都城' },
  { match: 'サマルカンド (ティムール',     sortLabel: 'ティムール朝のサマルカンド全盛' },
  { match: 'コンスタンティノープル (オスマンの都)', sortLabel: 'メフメト2世のコンスタンティノープル征服' },
  { match: 'アンカラ (1402年',            sortLabel: 'アンカラの戦い（ティムールがオスマンを破る）' },
  { match: 'スエズ運河 (近代の生命線)',    sortLabel: 'スエズ運河の開通（フランス・エジプト）' },
  { match: 'アイン・ジャールート',         sortLabel: 'アイン・ジャールートの戦い（マムルークがモンゴルを破る）' },
  { match: 'アダナ (小アジア',            sortLabel: 'アナトリア支配下のアダナ（ラーマザーンオウルラリー）' },
  { match: 'レイ (イル・ハン国',           sortLabel: 'モンゴルによるレイ破壊' },
  { match: 'マンジケルト',                sortLabel: 'マンジケルトの戦い（セルジューク朝がビザンツを破る）' },
  { match: 'ガズナ (ガズナ朝',            sortLabel: 'ガズナ朝のインド侵攻開始' },
  { match: 'スィヴァス',                  sortLabel: 'ティムールのアナトリア征服' },
  { match: 'アブー・キール',              sortLabel: 'アブー・キールの戦い（ナポレオンのエジプト遠征）' },
  { match: 'カイロ (マムルーク朝',         sortLabel: 'マムルーク朝のカイロ支配' },
  { match: 'バグダード (フレグ攻略)',      sortLabel: 'フレグのバグダード征服（アッバース朝滅亡）' },
  { match: 'エディルネ (オスマン帝国',     sortLabel: 'オスマン帝国のエディルネ遷都' },
  { match: 'モハーチ (オスマン',           sortLabel: 'モハーチの戦い（オスマンのハンガリー征服）' },
  { match: 'ウィーン (第一次包囲',         sortLabel: 'ウィーン第一次包囲（スレイマン大帝）' },
  { match: 'スレイマニエ・モスク',         sortLabel: 'スレイマン大帝のスレイマニエ・モスク完成' },
  { match: 'レパント (オスマン艦隊',       sortLabel: 'レパントの海戦（オスマン艦隊の敗北）' },

  // ======= MIDEAST — modern_turkey =======
  { match: 'アンカラ (トルコ共和国',       sortLabel: 'ケマル＝アタテュルクのトルコ共和国建国' },
  { match: 'ガリポリ',                    sortLabel: 'ガリポリの戦い（第一次大戦のダーダネルス作戦）' },
  { match: 'エルサレム (バルフォア宣言)',  sortLabel: 'バルフォア宣言（ユダヤ人国家の約束）' },
  { match: 'ダマスカス (アラブ独立運動)',  sortLabel: 'フサイン＝マクマホン協定とアラブ反乱' },
  { match: 'バグダード (イギリス委任統治', sortLabel: 'イギリス委任統治下のイラク成立' },
  { match: 'リヤド (サウジアラビア建国)',  sortLabel: 'イブン・サウードのサウジアラビア建国' },
  { match: 'テヘラン (パフラヴィー朝',     sortLabel: 'テヘラン会談（第二次大戦中の連合国首脳会議）' },
  { match: 'カイロ (エジプト独立運動)',    sortLabel: 'エジプト独立運動（ワフド党の台頭）' },
  { match: 'メッカ (イブン・サウード',     sortLabel: 'イブン・サウードのメッカ聖地掌握' },
  { match: 'イスタンブール (オスマン帝国の旧都)', sortLabel: 'オスマン帝国の解体とトルコ独立戦争' },

  // ======= AFRICA — african_kingdoms =======
  { match: 'カルタゴ (フェニキア人の植民', sortLabel: 'ポエニ戦争（カルタゴ滅亡）' },
  { match: 'アレクサンドリア (プトレマイオス', sortLabel: 'プトレマイオス朝エジプトのアレクサンドリア建設' },
  { match: 'メロエ (クシュ王国',           sortLabel: 'クシュ王国のメロエ遷都と鉄器文化' },
  { match: 'アクスム (アクスム王国',       sortLabel: 'アクスム王国のキリスト教化' },
  { match: 'トンブクトゥ (マリ帝国',       sortLabel: 'マリ帝国のトンブクトゥ・イスラーム学術都市' },
  { match: 'キルワ・キシワニ',             sortLabel: 'スワヒリ海岸キルワの黄金交易全盛' },
  { match: 'ザンジバル島',                sortLabel: 'ザンジバルのインド洋交易ネットワーク参入' },
  { match: 'モガディシュ',                sortLabel: 'モガディシュのアフリカ東岸交易全盛' },
  { match: 'グレート・ジンバブエ',         sortLabel: 'グレート・ジンバブエ石造建築の全盛' },
  { match: 'カノ (ハウサ諸国',            sortLabel: 'ハウサ諸国カノのイスラーム都市発展' },
  { match: 'ガオ (ソンガイ帝国',           sortLabel: 'ソンガイ帝国のガオ支配（スンニ・アリー）' },
  { match: 'カーネム (チャド湖',           sortLabel: 'カーネム王国のチャド湖周辺支配' },
  { match: 'マリ帝国はどれ',              sortLabel: 'マンサ・ムーサのマリ帝国（黄金の王国）' },
  { match: 'クシュ王国はどれ',            sortLabel: 'クシュ王国のエジプト支配（第25王朝）' },
  { match: 'アクスム王国はどれ',          sortLabel: 'アクスム王国の最大版図' },
  { match: 'ソンガイ帝国はどれ',          sortLabel: 'ソンガイ帝国のマリ帝国征服' },

  // ======= AFRICA — scramble_for_africa =======
  { match: 'ケープタウン (オランダ東インド会社設立', sortLabel: 'ヨーロッパ列強のアフリカ分割競争' },
  { match: 'ダカール (フランス領西アフリカ', sortLabel: 'フランス領西アフリカの成立' },
  { match: 'カイロ (イギリスの保護',       sortLabel: 'イギリスのエジプト保護国化' },
  { match: 'ハルツーム (英エジプト共同',   sortLabel: '英エジプト共同統治スーダンの征服' },
  { match: 'ナイロビ (イギリス領東アフリカ', sortLabel: 'イギリス領東アフリカのナイロビ建設' },
  { match: 'ダルエスサラーム (ドイツ領',   sortLabel: 'ドイツ領東アフリカのダルエスサラーム首都化' },
  { match: 'ルアンダ (ポルトガル領アンゴラ', sortLabel: 'ポルトガル領アンゴラのルアンダ支配確立' },
  { match: 'ラゴス (イギリス領ナイジェリア', sortLabel: 'イギリスのラゴス占領（奴隷貿易廃止後）' },
  { match: 'アジスアベバ (独立を守った',   sortLabel: 'エチオピア帝国のアジスアベバ建設' },
  { match: 'アドワ (エチオピアがイタリア軍', sortLabel: 'アドワの戦い（エチオピアがイタリアを破る）' },
  { match: 'キンシャサ (ベルギー領コンゴ', sortLabel: 'ベルギー領コンゴの設立（レオポルド2世）' },
  { match: 'アルジェ (フランス領北アフリカ', sortLabel: 'フランスのアルジェリア征服' },
  { match: 'ファショダ (英仏が激突',       sortLabel: 'ファショダ事件（英仏のアフリカ縦断vs横断）' },
  { match: 'スエズ (イギリスが買収',       sortLabel: 'スエズ運河のイギリス実質支配' },
  { match: 'マプト (ポルトガル領モザンビーク', sortLabel: 'ポルトガル領モザンビークの植民地化' },
  { match: 'イギリスのアフリカ縦断',      sortLabel: 'イギリスのアフリカ縦断政策（ケープ〜カイロ）' },
  { match: 'フランスのアフリカ横断',      sortLabel: 'フランスのアフリカ横断政策' },

  // ======= INDIA — indus =======
  { match: 'モヘンジョ＝ダーロ',           sortLabel: 'モヘンジョ＝ダーロ（インダス文明最大都市）' },
  { match: 'ハラッパー (インダス文明の命名', sortLabel: 'ハラッパー（インダス文明の命名地）' },
  { match: 'ロータル (インダス文明の港',   sortLabel: 'インダス文明の港湾都市ロータル' },
  { match: 'ドーラヴィーラー',             sortLabel: 'インダス文明の水利都市ドーラヴィーラー' },
  { match: 'カーリーバンガン',             sortLabel: 'インダス文明初期の農耕遺跡カーリーバンガン' },
  { match: 'メヘルガル',                  sortLabel: 'インダス文明の先駆けメヘルガル農耕集落' },
  { match: 'コートディジ',                sortLabel: '初期インダス文明の砦都市コートディジ' },
  { match: 'チャンフーダーロー',           sortLabel: 'インダス文明の印章製作都市' },
  { match: 'ガネーリーワーラー',           sortLabel: 'インダス文明の未発掘巨大都市' },
  { match: 'バナーワリー',                sortLabel: 'インダス文明のハリヤーナー遺跡バナーワリー' },

  // ======= INDIA — ancient_medieval_india =======
  { match: 'パータリプトラ (マウリヤ朝',   sortLabel: 'チャンドラグプタのマウリヤ朝建国' },
  { match: 'カノウジ (ヴァルダナ朝',       sortLabel: 'ハルシャ王のヴァルダナ朝統一' },
  { match: 'サーンチー (アショーカ王',     sortLabel: 'アショーカ王のサーンチー仏塔建立' },
  { match: 'アジャンター (石窟寺院',       sortLabel: 'グプタ朝のアジャンター石窟壁画' },
  { match: 'エローラ (三宗教',            sortLabel: 'エローラ石窟（仏教・ヒンドゥー・ジャイナ教）' },
  { match: 'カーンチー (南インド',         sortLabel: '南インドのパッラヴァ朝ヒンドゥー文化' },
  { match: 'ヴィジャヤナガル',             sortLabel: 'ヴィジャヤナガル王国の建国' },

  // ======= INDIA — mughal_colonial =======
  { match: 'デリー (ムガル帝国',           sortLabel: 'バーブルのムガル帝国建国（デリー征服）' },
  { match: 'アーグラ (タージ・マハル',     sortLabel: 'シャー・ジャハーンのタージ・マハル建設' },
  { match: 'ゴア (ポルトガルの拠点)',      sortLabel: 'ポルトガルのゴア占領' },
  { match: 'カルカッタ (イギリスの拠点)',  sortLabel: 'プラッシーの戦いとイギリスのベンガル支配' },
  { match: 'マドラス (イギリスの南',       sortLabel: 'イギリスのマドラス城砦建設' },
  { match: 'ポンディシェリ (フランス',     sortLabel: 'フランスのポンディシェリ占領' },
  { match: 'ボンベイ (イギリスの西',       sortLabel: 'イギリスのボンベイ獲得（ポルトガルから）' },

  // ======= CHINA — five_hu =======
  { match: '匈奴の主な居住域',             sortLabel: '匈奴の中国北方支配' },
  { match: '鮮卑の主な居住域',             sortLabel: '鮮卑の北魏建国と中国支配' },
  { match: '羯の主な居住域',              sortLabel: '羯の石勒による後趙建国' },
  { match: '氐の主な居住域',              sortLabel: '氐の前秦建国（苻堅）' },
  { match: '羌の主な居住域',              sortLabel: '羌の後秦建国' },

  // ======= CHINA — ancient_china =======
  { match: '咸陽 (秦の都)',               sortLabel: '始皇帝の秦統一（中国最初の帝国）' },
  { match: '長安 (前漢の都)',              sortLabel: '高祖劉邦の前漢建国' },
  { match: '洛陽 (後漢・魏の都)',          sortLabel: '光武帝の後漢再興' },
  { match: '成都 (蜀の拠点)',             sortLabel: '劉備の蜀（三国時代）' },
  { match: '建業 (呉の都・南京)',          sortLabel: '孫権の呉（三国時代）' },
  { match: '平城 (北魏の都)',             sortLabel: '北魏の平城遷都（鮮卑の中国支配）' },

  // ======= CHINA — medieval_china =======
  { match: '北京／大都 (元・モンゴル',     sortLabel: 'フビライ・ハンの元朝建国と大都建設' },
  { match: '南京 (金陵・呉越',            sortLabel: '南北朝時代の江南文化' },
  { match: '広州 (南海貿易',              sortLabel: '唐代の広州南海貿易全盛' },
  { match: '長安 (西安・隋唐',            sortLabel: '唐の長安・国際都市の全盛' },
  { match: '洛陽 (隋の東都)',             sortLabel: '隋の大運河建設と洛陽東都化' },
  { match: '開封 (北宋の都)',             sortLabel: '趙匡胤の宋建国と開封都市文化' },
  { match: '臨安 (杭州・南宋',            sortLabel: '南宋の臨安遷都（金の圧迫）' },
  { match: 'カラコルム (モンゴル帝国の初代', sortLabel: 'チンギス・ハン後継のカラコルム建設' },
  { match: 'サライ (キプチャク',          sortLabel: 'キプチャク・ハン国のサライ建都' },
  { match: 'タブリーズ (イル・ハン国',     sortLabel: 'イル・ハン国のタブリーズ支配' },
  { match: 'アルマリク (チャガタイ',       sortLabel: 'チャガタイ・ハン国のアルマリク都城' },
  { match: 'カンバリク (大都・フビライ)',  sortLabel: 'フビライの大都（カンバリク）建設' },
  { match: 'ワールシュタット (モンゴル',   sortLabel: 'ワールシュタットの戦い（モンゴルのヨーロッパ侵攻）' },
  { match: '泉州 (マルコ・ポーロ',         sortLabel: 'マルコ・ポーロが訪れた泉州（世界最大の港）' },
  { match: '大元ウルス（元朝）はどれ',    sortLabel: 'モンゴル帝国の元朝（中国支配）' },
  { match: 'チャガタイ・ハン国はどれ',    sortLabel: 'チャガタイ・ハン国の中央アジア支配' },
  { match: 'イル・ハン国はどれ',          sortLabel: 'イル・ハン国のイラン・イラク支配' },
  { match: 'キプチャク・ハン国はどれ',    sortLabel: 'キプチャク・ハン国のロシア支配' },

  // ======= CHINA — early_modern_china =======
  { match: '北京 (明・清の都)',            sortLabel: '永楽帝の北京遷都と紫禁城建設' },
  { match: '金陵 (南京・明の初都)',        sortLabel: '朱元璋の明建国と南京首都化' },
  { match: '上海 (開港された重要港)',      sortLabel: 'アヘン戦争後の南京条約と上海開港' },
  { match: '景徳鎮 (陶磁器',             sortLabel: '明代景徳鎮の陶磁器生産全盛' },
  { match: '広州 (唯一の公行',            sortLabel: '清の公行制度（広州一港貿易）' },
  { match: 'マカオ (ポルトガル居住',       sortLabel: 'ポルトガルのマカオ居住権獲得（明に許可）' },
  { match: '香港 (英に割譲',             sortLabel: 'アヘン戦争後の南京条約で香港割譲' },

  // ======= SOUTHEAST ASIA — ancient =======
  { match: 'アンコール・ワット',           sortLabel: 'スールヤヴァルマン2世のアンコール・ワット建設' },
  { match: 'パガン (ビルマ初の',           sortLabel: 'アノーラタのパガン朝統一（ビルマ最初の王国）' },
  { match: 'アユタヤ (タイの古都)',        sortLabel: 'タイのアユタヤ朝建国' },
  { match: 'シュリーヴィジャヤ',           sortLabel: 'シュリーヴィジャヤ王国の海上交易支配' },
  { match: 'ボロブドゥール',              sortLabel: 'シャイレーンドラ朝のボロブドゥール建設' },
  { match: 'マジャパヒト王国',            sortLabel: 'マジャパヒト王国のジャワ支配' },
  { match: 'スコータイ (タイ最初',         sortLabel: 'スコータイ朝（タイ最初の王国）' },
  { match: 'チャンパ王国・ミーソン',       sortLabel: 'チャンパ王国のミーソン聖域建設' },
  { match: 'タンロン (李朝ベトナム',       sortLabel: '李朝ベトナムのタンロン建都' },
  { match: 'アヌラーダプラ (スリランカ',   sortLabel: 'スリランカへの上座部仏教伝来' },

  // ======= SOUTHEAST ASIA — colonial =======
  { match: 'バタヴィア (オランダ',         sortLabel: 'オランダ東インド会社のバタヴィア建設' },
  { match: 'マラッカ (支配者が変遷',       sortLabel: 'ポルトガルのマラッカ征服' },
  { match: 'シンガポール (英のラッフルズ', sortLabel: 'ラッフルズのシンガポール建設（イギリス）' },
  { match: 'サイゴン (フランス領インドシナ', sortLabel: 'フランスのサイゴン占領とインドシナ進出' },
  { match: 'ラングーン (イギリス領ビルマ)', sortLabel: 'イギリスのラングーン占領（ビルマ征服）' },
  { match: 'マニラ (スペイン統治',         sortLabel: 'スペインのマニラ建設とフィリピン統治' },
  { match: 'フエ (グエン朝',              sortLabel: 'グエン朝によるベトナム統一とフエ都城' },
  { match: 'ホイアン (朱印船貿易)',        sortLabel: 'ホイアンの日本町と朱印船貿易' },

  // ======= SOUTHEAST ASIA — independence =======
  { match: 'ハノイ (ホーチミンのベトナム独立', sortLabel: 'ホーチミンのベトナム独立宣言' },
  { match: 'ディエンビエンフー',           sortLabel: 'ディエンビエンフーの戦い（フランス軍の敗北）' },
  { match: 'ジャカルタ (スカルノ',         sortLabel: 'スカルノのインドネシア独立宣言' },
  { match: 'バンドン (アジア・アフリカ会議)', sortLabel: 'バンドン会議（アジア・アフリカ会議）' },
  { match: 'プノンペン (カンボジア独立',   sortLabel: 'シハヌーク王のカンボジア独立' },
  { match: 'ビエンチャン (ラオス独立)',    sortLabel: 'フランスからのラオス独立' },
  { match: 'クアラルンプール (マラヤ',     sortLabel: 'マラヤ連邦のイギリスからの独立' },

  // ======= NORTH AMERICA — frontier =======
  { match: 'ジェームズタウン',             sortLabel: '最初のイギリス人恒久植民地ジェームズタウン建設' },
  { match: 'ボストン (ピルグリム',         sortLabel: 'ピルグリム・ファーザーズのボストン上陸' },
  { match: 'フィラデルフィア (13植民地',   sortLabel: 'ペンシルベニア植民地フィラデルフィア建設' },
  { match: 'ニューオーリンズ (ルイジアナ買収', sortLabel: 'ルイジアナ買収とニューオーリンズ' },
  { match: 'セントルイス',                sortLabel: 'ルイス・クラーク探検隊の西部探検出発' },
  { match: 'サンタフェ',                  sortLabel: 'サンタフェトレイルの開通（西部交易）' },
  { match: 'サンアントニオ',              sortLabel: 'アラモの砦の戦い（テキサス独立）' },
  { match: 'ソルトレークシティ',           sortLabel: 'モルモン教徒のソルトレークシティ建設' },
  { match: 'サクラメント',                sortLabel: 'カリフォルニア・ゴールドラッシュの発端' },
  { match: 'サンフランシスコ',            sortLabel: 'ゴールドラッシュで急成長したサンフランシスコ' },

  // ======= NORTH AMERICA — independence =======
  { match: 'ボストン (ボストン茶会',       sortLabel: 'ボストン茶会事件（アメリカ独立の導火線）' },
  { match: 'レキシントン',                sortLabel: 'レキシントンの戦い（独立戦争開始）' },
  { match: 'フィラデルフィア (独立宣言',   sortLabel: 'アメリカ独立宣言の採択' },
  { match: 'サラトガ (フランス参戦',       sortLabel: 'サラトガの戦い（フランスが参戦決定）' },
  { match: 'バレーフォージ',              sortLabel: 'ワシントン将軍のバレーフォージ越冬' },
  { match: 'ヨークタウン',                sortLabel: 'ヨークタウンの戦い（コーンウォリス降伏）' },
  { match: 'ワシントンD.C.',              sortLabel: 'アメリカ合衆国の連邦首都建設' },
  { match: 'ニューオーリンズ (英米戦争',   sortLabel: '英米戦争最後の戦い（ジャクソン将軍の勝利）' },

  // ======= NORTH AMERICA — civil_war =======
  { match: 'フォートサムター',             sortLabel: 'フォートサムター攻撃（南北戦争開戦）' },
  { match: 'ブルラン (第一次',            sortLabel: '第一次ブルランの戦い（南軍の勝利）' },
  { match: 'リッチモンド (南部連合',       sortLabel: '南部連合の首都リッチモンド' },
  { match: 'アンティータム',              sortLabel: 'アンティータムの戦い（奴隷解放宣言の契機）' },
  { match: 'ゲティズバーグ',              sortLabel: 'ゲティズバーグの戦い（南北戦争の転換点）' },
  { match: 'ヴィックスバーグ',            sortLabel: 'ヴィックスバーグ陥落（南部を分断）' },
  { match: 'アトランタ (シャーマン',       sortLabel: 'シャーマン将軍のアトランタ焦土作戦' },
  { match: 'アポマトックス',              sortLabel: 'リー将軍降伏（南北戦争終結）' },

  // ======= LATIN AMERICA — sun_empire =======
  { match: 'テノチティトラン',             sortLabel: 'アステカ帝国の首都テノチティトラン建設' },
  { match: 'チチェン・イッツァ',           sortLabel: 'マヤ後期古典のチチェン・イッツァ全盛' },
  { match: 'マチュピチュ',                sortLabel: 'インカ帝国のマチュピチュ建設' },
  { match: 'ティワナク',                  sortLabel: 'インカ以前のティワナク文明全盛' },
  { match: 'テオティワカン',              sortLabel: 'テオティワカン・太陽のピラミッド建設' },
  { match: 'クスコ',                      sortLabel: 'インカ帝国のクスコ首都化' },
  { match: 'コパン',                      sortLabel: 'マヤ古典期のコパン石碑文化' },
  { match: 'ナスカ',                      sortLabel: 'ナスカ文明の地上絵作成' },

  // ======= LATIN AMERICA — colonial_era =======
  { match: 'サントドミンゴ',              sortLabel: '新大陸最初のヨーロッパ都市サントドミンゴ建設' },
  { match: 'ポトシ',                      sortLabel: 'ポトシ銀山の発見（世界経済を変えた銀）' },
  { match: 'リオデジャネイロ',             sortLabel: 'ポルトガルのリオデジャネイロ建設' },
  { match: 'リマ',                        sortLabel: 'スペイン副王領ペルーの首都リマ建設' },
  { match: 'アカプルコ',                  sortLabel: 'マニラ・ガレオン貿易のアカプルコ開始' },
  { match: 'カルタヘナ',                  sortLabel: 'スペイン帝国の要塞港カルタヘナ建設' },
  { match: 'サルバドール',                sortLabel: 'ブラジル植民地の砂糖貿易首都サルバドール' },

  // ======= LATIN AMERICA — liberation_era =======
  { match: 'カラカス',                    sortLabel: 'シモン・ボリバルの独立運動開始（ベネズエラ）' },
  { match: 'ボゴタ',                      sortLabel: 'ボリバルの大コロンビア独立' },
  { match: 'ブエノスアイレス',             sortLabel: 'ブエノスアイレスの五月革命（独立宣言）' },
  { match: 'メキシコシティ（イダルゴ',    sortLabel: 'イダルゴ神父のドロレスの叫び（メキシコ独立）' },
  { match: 'サンティアゴ（サン・マルティン', sortLabel: 'サン・マルティンのアンデス越えとチリ解放' },
  { match: 'アヤクーチョ',                sortLabel: 'アヤクーチョの戦い（南米独立最後の決戦）' },
  { match: 'ポルトープランス',             sortLabel: 'ハイチ独立（世界初の黒人共和国）' },

  // ======= WORLD WARS — ww1 =======
  { match: 'サラエヴォ (第一次世界大戦の導火線)', sortLabel: 'フランツ・フェルディナント暗殺（第一次大戦勃発）' },
  { match: 'ヴェルダン (最大の消耗戦)',    sortLabel: 'ヴェルダンの戦い（最大の消耗戦）' },
  { match: 'ソンム川',                    sortLabel: 'ソンムの戦い（塹壕戦の地獄）' },
  { match: 'タンネンベルク',              sortLabel: 'タンネンベルクの戦い（東部戦線の決戦）' },
  { match: 'キール (ドイツ革命',           sortLabel: 'キール軍港の反乱（ドイツ革命の発火点）' },
  { match: 'ヴェルサイユ (講和条約',       sortLabel: 'ヴェルサイユ条約の締結（第一次大戦終結）' },
  { match: 'ペトログラード',              sortLabel: 'ペトログラードのロシア革命（二月・十月）' },
  { match: 'マルヌ川',                    sortLabel: 'マルヌの戦い（パリを救った反撃）' },

  // ======= WORLD WARS — interwar =======
  { match: 'ウォール街 (世界大恐慌',       sortLabel: 'ウォール街大暴落（世界大恐慌の始まり）' },
  { match: 'ミュンヘン (ヒトラー台頭',     sortLabel: 'ミュンヘン協定（ヒトラーへの宥和政策）' },
  { match: 'ローマ (ムッソリーニ',         sortLabel: 'ムッソリーニのローマ進軍（ファシズム政権）' },
  { match: '瀋陽 (満州事変',              sortLabel: '柳条湖事件と満州事変の勃発' },
  { match: 'ゲルニカ',                    sortLabel: 'ゲルニカ爆撃（スペイン内戦・無差別爆撃）' },
  { match: 'ウィーン (オーストリア併合',   sortLabel: 'アンシュルス（ドイツのオーストリア併合）' },
  { match: 'マドリード (スペイン内戦',     sortLabel: 'スペイン内戦のマドリード攻防戦' },

  // ======= WORLD WARS — ww2_europe =======
  { match: 'ダンケルク',                  sortLabel: 'ダンケルクの撤退（奇跡の大撤退）' },
  { match: 'スターリングラード',           sortLabel: 'スターリングラードの戦い（独ソ戦の転換点）' },
  { match: 'アウシュビッツ',              sortLabel: 'アウシュビッツ強制収容所（ホロコースト）' },
  { match: 'ノルマンディー',              sortLabel: 'ノルマンディー上陸作戦（Dデイ）' },
  { match: 'エル・アラメイン',             sortLabel: 'エル・アラメインの戦い（砂漠の狐の敗北）' },
  { match: 'レニングラード',              sortLabel: 'レニングラード包囲戦（900日）' },
  { match: 'ベルリン (第三帝国',           sortLabel: 'ベルリン陥落（ナチス・ドイツの終焉）' },

  // ======= WORLD WARS — ww2_pacific =======
  { match: '真珠湾',                      sortLabel: '真珠湾攻撃（太平洋戦争開戦）' },
  { match: '南京 (日中戦争',              sortLabel: '南京攻略と南京事件（日中戦争）' },
  { match: 'シンガポール (大英帝国の屈辱)', sortLabel: 'シンガポール陥落（大英帝国の屈辱）' },
  { match: 'ミッドウェー島',              sortLabel: 'ミッドウェー海戦（太平洋戦争の転換点）' },
  { match: 'ガダルカナル島',              sortLabel: 'ガダルカナル島の戦い（消耗戦）' },
  { match: '広島 (人類初の原爆',           sortLabel: '広島への原爆投下（人類初の核攻撃）' },
  { match: '長崎 (2発目の原爆)',          sortLabel: '長崎への原爆投下（戦争終結へ）' },
  { match: '沖縄 (最後の地上戦)',          sortLabel: '沖縄の戦い（太平洋戦争最後の地上戦）' },

  // ======= COLD WAR — early =======
  { match: 'ベルリン (封鎖・壁',           sortLabel: 'ベルリン封鎖（東西冷戦の象徴化）' },
  { match: 'ワシントンD.C. (西側陣営',     sortLabel: 'トルーマン・ドクトリン（封じ込め政策）' },
  { match: 'モスクワ (東側陣営',           sortLabel: 'ワルシャワ条約機構の成立' },
  { match: '平壌 (朝鮮戦争',              sortLabel: '朝鮮戦争の勃発（38度線を越える北朝鮮軍）' },
  { match: 'ハバナ (キューバ革命',         sortLabel: 'カストロのキューバ革命とキューバ危機' },
  { match: 'バイコヌール',                sortLabel: 'スプートニク打ち上げ（宇宙開発競争）' },
  { match: 'ケープカナベラル',            sortLabel: 'アメリカの宇宙開発拠点ケープカナベラル' },
  { match: '仁川 (朝鮮戦争',              sortLabel: 'マッカーサーの仁川上陸作戦' },

  // ======= COLD WAR — proxy =======
  { match: 'ハノイ (ベトナム戦争',         sortLabel: '北爆開始とベトナム戦争の本格化' },
  { match: 'サイゴン (南ベトナム陥落',     sortLabel: 'サイゴン陥落（ベトナム戦争終結）' },
  { match: 'プラハ (プラハの春',           sortLabel: 'プラハの春とソ連の軍事介入' },
  { match: 'カブール (ソ連のアフガニスタン', sortLabel: 'ソ連のアフガニスタン侵攻' },
  { match: 'サンティアゴ (チリ・CIA',      sortLabel: 'チリ・クーデター（アジェンデ政権の打倒）' },
  { match: 'ソウル (韓国の奇跡',           sortLabel: '漢江の奇跡・ソウル五輪（韓国の経済発展）' },
  { match: 'テヘラン (イラン革命',         sortLabel: 'ホメイニーのイラン・イスラーム革命' },

  // ======= COLD WAR — end =======
  { match: 'ベルリンの壁崩壊',             sortLabel: 'ベルリンの壁崩壊（冷戦終結の象徴）' },
  { match: 'ワルシャワ (連帯運動',         sortLabel: 'ポーランド「連帯」運動による民主化' },
  { match: 'プラハ (ビロード革命)',        sortLabel: 'ビロード革命（チェコスロバキアの民主化）' },
  { match: 'ブカレスト',                  sortLabel: 'チャウシェスク処刑（ルーマニア革命）' },
  { match: 'ヴィリニュス',                sortLabel: 'バルト三国の独立宣言' },
  { match: 'モスクワ (ソ連崩壊',           sortLabel: 'ゴルバチョフの辞任とソ連崩壊' },
  { match: 'レイキャビク',                sortLabel: 'レイキャビク米ソ首脳会談（核軍縮の転換点）' },
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
            if (q.sortLabel !== undefined) return; // 既にあればスキップ
            const patch = PATCHES.find(p => q.text && q.text.includes(p.match));
            if (patch) {
                q.sortLabel = patch.sortLabel;
                changed     = true;
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

console.log(`\n完了: ${totalPatched}問にsortLabelを追加。マッチなし: ${totalSkipped}問`);
