/**
 * Add explanation and relatedTerms to important quiz questions across region JSON files.
 * Run: node scripts/add-quiz-explanations.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Content mappings: text (or partial match) -> { explanation, relatedTerms }
// Only add if question doesn't already have these fields
const CONTENT_MAP = {
  africa: {
    // african_kingdoms - key cities and area questions
    'カルタゴ': {
      explanation: 'フェニキア人が北アフリカに建設した植民都市。ローマとポエニ戦争で争い、紀元前146年に滅亡。',
      relatedTerms: ['ポエニ戦争', 'ハンニバル', 'スキピオ', 'ローマ帝国', 'フェニキア']
    },
    'メロエ': {
      explanation: 'クシュ王国の首都。ナイル川中流域に栄え、独自のピラミッド群で知られる。鉄器生産の中心地だった。',
      relatedTerms: ['クシュ王国', 'ナパタ', 'ヌビア', 'エジプト', 'ピラミッド']
    },
    'アクスム': {
      explanation: 'アクスム王国の首都。エチオピア高原に栄え、巨大な石柱（オベリスク）で有名。紅海貿易で繁栄した。',
      relatedTerms: ['アクスム王国', 'エザナ王', 'キリスト教', '紅海貿易', 'オベリスク']
    },
    'トンブクトゥ': {
      explanation: 'マリ帝国の学術・交易の中心都市。サハラ縦断交易路の要衝で、イスラーム学の聖地として栄えた。',
      relatedTerms: ['マリ帝国', 'マンサ・ムーサ', 'サハラ交易', 'サンコーレ大学', '金']
    },
    'ガオ': {
      explanation: 'ソンガイ帝国の首都。ニジェール川中流域に位置し、マリ帝国を滅ぼしたソンガイの中心都市。',
      relatedTerms: ['ソンガイ帝国', 'アスキア・ムハンマド', 'トンブクトゥ', 'サハラ交易', 'モロッコ']
    },
    'マリ帝国はどれ？': {
      explanation: 'マリ帝国は西アフリカのサハラ以南に栄えたイスラーム王国。14世紀のマンサ・ムーサのメッカ巡礼で黄金を撒き、伝説となった。',
      relatedTerms: ['マンサ・ムーサ', 'トンブクトゥ', 'サハラ交易', 'スンジャータ', 'ガーナ王国']
    },
    'クシュ王国はどれ？': {
      explanation: 'クシュ王国はナイル川中流域（現スーダン）に栄えた古代王国。エジプト新王国を一時支配し、メロエに遷都した。',
      relatedTerms: ['メロエ', 'ナパタ', 'ヌビア', 'ピアンキ', 'エジプト']
    },
    'アクスム王国はどれ？': {
      explanation: 'アクスム王国はエチオピア高原に栄えた古代王国。4世紀にエザナ王がキリスト教を国教とし、紅海貿易で繁栄。',
      relatedTerms: ['エザナ王', 'キリスト教', '紅海', 'オベリスク', 'エチオピア']
    },
    'ソンガイ帝国はどれ？': {
      explanation: 'ソンガイ帝国は15〜16世紀に西アフリカを支配。アスキア・ムハンマドが最盛期を築き、トンブクトゥを支配した。',
      relatedTerms: ['アスキア・ムハンマド', 'トンブクトゥ', 'ガオ', 'マリ帝国', 'サハラ交易']
    },
    // scramble_for_africa
    'アドワ': {
      explanation: '1896年、エチオピア軍がイタリア軍を撃破した戦い。アフリカで初めてヨーロッパ列強に勝利し、エチオピアの独立を守った。',
      relatedTerms: ['メネリク2世', 'イタリア', 'エチオピア', '植民地化', 'アフリカ分割']
    },
    'ファショダ': {
      explanation: '1898年、英仏がスーダンで衝突したファショダ事件の舞台。イギリスの縦断政策とフランスの横断政策が激突した。',
      relatedTerms: ['英仏協商', 'スーダン', 'キッチナー', 'マルシャン', 'アフリカ分割']
    },
    'イギリスのアフリカ縦断政策': {
      explanation: 'ケープタウンからカイロまでアフリカを縦断するイギリスの植民地政策。セシル・ローズが推進し、英仏がファショダで衝突。',
      relatedTerms: ['セシル・ローズ', 'ケープ・カイロ', 'ファショダ', 'スーダン', '英仏協商']
    },
    'フランスのアフリカ横断政策': {
      explanation: 'ダカールからジブチまで西アフリカを横断するフランスの植民地政策。イギリスの縦断政策と対立した。',
      relatedTerms: ['フランス領西アフリカ', 'ダカール', 'ジブチ', 'ファショダ', 'アフリカ分割']
    }
  },
  china: {
    // Remaining questions (4 already have: 匈奴, 鮮卑, 咸陽, 大元ウルス)
    '羯の主な居住域': {
      explanation: '羯は中央アジア系の遊牧民族で、山西地方を中心に居住。後趙を建国した石勒が有名。',
      relatedTerms: ['石勒', '後趙', '五胡十六国', '山西', '漢化']
    },
    '氐の主な居住域': {
      explanation: '氐は甘粛・四川方面に居住した民族。前秦の苻堅が華北を統一し、淝水の戦いで東晋に敗北した。',
      relatedTerms: ['苻堅', '前秦', '淝水の戦い', '東晋', '五胡十六国']
    },
    '羌の主な居住域': {
      explanation: '羌は青海・甘粛方面に居住した民族。後秦を建国し、五胡十六国時代に活躍した。',
      relatedTerms: ['後秦', '姚萇', '五胡十六国', '青海', '甘粛']
    },
    '長安 (前漢の都)': {
      explanation: '長安は前漢の首都。武帝の時代に西域経営や張騫の使節派遣が行われ、シルクロードの起点となった。',
      relatedTerms: ['武帝', '張騫', '西域', 'シルクロード', '前漢']
    },
    '洛陽 (後漢・魏の都)': {
      explanation: '洛陽は後漢・魏の首都。後漢末の黄巾の乱、三国時代の魏の拠点として重要な都市。',
      relatedTerms: ['後漢', '黄巾の乱', '曹操', '三国志', '魏']
    },
    '開封 (北宋の都)': {
      explanation: '開封は北宋の首都。澶淵の盟で遼と講和し、科挙制度が完成。『清明上河図』に描かれた繁栄の都。',
      relatedTerms: ['北宋', '澶淵の盟', '科挙', '清明上河図', '王安石']
    },
    '臨安 (杭州・南宋の都)': {
      explanation: '臨安は南宋の首都。靖康の変で開封を失い南遷後、江南の経済・文化の中心として繁栄した。',
      relatedTerms: ['南宋', '靖康の変', '江南', '杭州', 'モンゴル']
    },
    'チャガタイ・ハン国はどれ？': {
      explanation: 'チャガタイ・ハン国は中央アジアを支配したモンゴル系ハン国。ティムールがこの地から興り、サマルカンドを都とした。',
      relatedTerms: ['チャガタイ', 'ティムール', 'サマルカンド', '中央アジア', 'モンゴル帝国']
    },
    'イル・ハン国はどれ？': {
      explanation: 'イル・ハン国はフレグが建国したペルシアを中心とするハン国。イスラーム化し、都はタブリーズ。',
      relatedTerms: ['フレグ', 'タブリーズ', 'バグダード', 'イスラーム', 'モンゴル帝国']
    },
    'キプチャク・ハン国はどれ？': {
      explanation: 'キプチャク・ハン国はロシア・ウクライナを支配したハン国。サライを都とし、モスクワ大公国に貢納を課した。',
      relatedTerms: ['バトゥ', 'サライ', 'ロシア', 'モスクワ大公国', 'ジョチ・ウルス']
    },
    '北京 (明・清の都)': {
      explanation: '北京は明・清の首都。永楽帝が遷都し、紫禁城を建設。清朝も引き継ぎ、近代まで中国の政治中心だった。',
      relatedTerms: ['永楽帝', '紫禁城', '明朝', '清朝', '万里の長城']
    },
    '広州 (唯一の公行貿易港)': {
      explanation: '広州は清朝の公行制度下で唯一の対外貿易港。アヘン戦争後、南京条約で上海などが開港。',
      relatedTerms: ['公行', 'アヘン戦争', '南京条約', '十三行', '清朝']
    }
  },
  europe: {
    // Germanic migration
    'フランク王国はどこ？': {
      explanation: 'フランク王国はクローヴィスが建国。カロリング朝で最盛期を迎え、カール大帝が西ローマ皇帝の冠を受けた。',
      relatedTerms: ['クローヴィス', 'カール大帝', 'カロリング朝', 'ヴェルダン条約', 'キリスト教']
    },
    'ランゴバルド王国はどこ？': {
      explanation: 'ランゴバルド王国はイタリア北部に建国。教皇の要請でカール大帝が征服し、教皇領の基礎を築いた。',
      relatedTerms: ['イタリア', '教皇領', 'カール大帝', 'ロンバルディア', 'ゲルマン民族']
    },
    '西ゴート王国はどこ？': {
      explanation: '西ゴート王国はイベリア半島と南フランスに建国。410年のローマ略奪で有名なアラリックの子孫が建設。',
      relatedTerms: ['アラリック', 'ローマ略奪', 'トレド', 'イベリア半島', 'ゲルマン民族']
    },
    'ヴァンダル王国はどこ？': {
      explanation: 'ヴァンダル王国は北アフリカに建国。455年にローマを略奪し、「ヴァンダリズム」の語源となった。',
      relatedTerms: ['北アフリカ', 'カルタゴ', 'ローマ略奪', 'ビザンツ帝国', 'ゲルマン民族']
    },
    'アングロサクソン七王国はどこ？': {
      explanation: 'アングロサクソン七王国はブリテン島に形成。後にウェセックスが統一し、イングランド王国の基礎を築いた。',
      relatedTerms: ['アルフレッド大王', 'ウェセックス', 'イングランド', 'ノルマン征服', 'ブリテン島']
    },
    'ビザンツ帝国（東ローマ）はどこ？': {
      explanation: 'ビザンツ帝国は東ローマ帝国。コンスタンティノープルを首都とし、1453年まで存続。正教会とギリシャ文化の守護者。',
      relatedTerms: ['コンスタンティノープル', 'ユスティニアヌス', '正教会', 'オスマン帝国', '東ローマ']
    },
    // ancient
    'アテネ (ギリシャのポリス)': {
      explanation: 'アテネは古代ギリシャの主要ポリス。民主政を発展させ、ペルシア戦争で勝利。哲学・芸術の中心。',
      relatedTerms: ['民主政', 'ペリクレス', 'ペルシア戦争', 'ソクラテス', 'パルテノン']
    },
    'ローマ (帝国の首都)': {
      explanation: 'ローマは古代ローマ帝国の首都。共和政から帝政へ移行し、地中海世界を統一した。',
      relatedTerms: ['共和政', '帝政', 'アウグストゥス', '地中海', 'ローマ法']
    },
    'コンスタンティノープル (ビザンツの都)': {
      explanation: 'コンスタンティノープルはビザンツ帝国の首都。330年コンスタンティヌス帝が建設。1453年オスマン帝国に陥落。',
      relatedTerms: ['コンスタンティヌス', 'ビザンツ帝国', 'オスマン帝国', 'イスタンブール', '正教会']
    },
    // medieval
    'パリ (カペー朝の拠点)': {
      explanation: 'パリはカペー朝フランスの首都。フィリップ2世が領土を拡大し、中世ヨーロッパの文化中心となった。',
      relatedTerms: ['カペー朝', 'フィリップ2世', 'ノートルダム', 'パリ大学', 'フランス']
    },
    'カノッサ (カノッサの屈辱)': {
      explanation: '1077年、神聖ローマ皇帝ハインリヒ4世が教皇グレゴリウス7世に謝罪した地。叙任権闘争の象徴的出来事。',
      relatedTerms: ['叙任権闘争', 'グレゴリウス7世', 'ハインリヒ4世', '教皇', '神聖ローマ帝国']
    },
    // modern
    'パリ (フランス革命の舞台)': {
      explanation: 'パリはフランス革命の舞台。バスティーユ襲撃、国王処刑、ナポレオンの戴冠など、近代史の中心地。',
      relatedTerms: ['バスティーユ', 'ルイ16世', 'ナポレオン', 'フランス革命', '人権宣言']
    },
    'ベルリン (ドイツ帝国の首都)': {
      explanation: 'ベルリンは1871年ドイツ帝国の首都に。ビスマルクの統一後、ヨーロッパの強国として台頭。',
      relatedTerms: ['ビスマルク', 'ドイツ統一', 'プロイセン', 'ヴィルヘルム1世', '普仏戦争']
    },
    'サラエヴォ (第一次大戦勃発)': {
      explanation: '1914年、オーストリア皇太子フランツ・フェルディナントが暗殺された地。第一次世界大戦勃発の契機。',
      relatedTerms: ['フランツ・フェルディナント', '第一次世界大戦', 'オーストリア', 'セルビア', '三国同盟']
    }
  },
  india: {
    // ancient/medieval
    'パータリプトラ': {
      explanation: 'パータリプトラはマウリヤ朝・グプタ朝の首都。チャンドラグプタやアショーカ王がインドを統一した地。',
      relatedTerms: ['マウリヤ朝', 'アショーカ王', 'チャンドラグプタ', 'グプタ朝', 'マガダ国']
    },
    'ヴィジャヤナガル': {
      explanation: 'ヴィジャヤナガルは南インドのヒンドゥー教大国の首都。14〜16世紀に繁栄し、ムスリム勢力と対抗した。',
      relatedTerms: ['ヒンドゥー教', '南インド', 'バフマニー朝', 'タリコータの戦い', 'デカン高原']
    },
    // Mughal/colonial
    'デリー (ムガル帝国の首都)': {
      explanation: 'デリーはムガル帝国の首都。シャー・ジャハーンがタージ・マハルを建設。イギリス領インド帝国の首都にも。',
      relatedTerms: ['ムガル帝国', 'シャー・ジャハーン', 'タージ・マハル', 'アーグラ', 'イギリス領インド']
    },
    'カルカッタ (イギリスの拠点)': {
      explanation: 'カルカッタはイギリス東インド会社の拠点。プラッシーの戦い後、ベンガル支配の中心となり、英領インドの首都に。',
      relatedTerms: ['東インド会社', 'プラッシーの戦い', 'クライヴ', 'ベンガル', '英領インド']
    },
    'ゴア (ポルトガルの拠点)': {
      explanation: 'ゴアは1510年ポルトガルが占領したインド西岸の拠点。香辛料貿易とキリスト教布教の中心。',
      relatedTerms: ['ポルトガル', '香辛料', 'ヴァスコ・ダ・ガマ', 'インド貿易', 'アジアのローマ']
    }
  },
  latin_america: {
    // sun_empire - add to items that have hint
    'テノチティトラン': {
      explanation: 'アステカ帝国の首都。テスココ湖の人工島に築かれた「水上の都」。1521年コルテスに征服され、メキシコシティの基礎に。',
      relatedTerms: ['アステカ', 'コルテス', 'モクテスマ', 'メキシコ', 'スペイン征服']
    },
    'チチェン・イッツァ': {
      explanation: 'マヤ文明の聖地。ユカタン半島に聳えるエル・カスティジョは春分・秋分に蛇の影が現れる天文神殿。',
      relatedTerms: ['マヤ', 'ユカタン', 'エル・カスティジョ', 'マヤ暦', 'トルテカ']
    },
    'マチュピチュ': {
      explanation: 'インカ帝国の山岳遺跡。スペイン人に発見されず、1911年まで密林に眠っていた。世界遺産。',
      relatedTerms: ['インカ', 'パチャクテック', 'クスコ', 'スペイン征服', 'アンデス']
    },
    'ティワナク': {
      explanation: 'チチカカ湖畔の古代文明。インカ以前に栄え、巨大石造建築で知られる。建造者は謎。',
      relatedTerms: ['チチカカ湖', 'インカ', '石造建築', 'アンデス文明', 'ボリビア']
    },
    // colonial_era
    'サントドミンゴ': {
      explanation: '新大陸最初のヨーロッパ都市。コロンブスの息子ディエゴが建設。スペインのアメリカ支配の第一拠点。',
      relatedTerms: ['コロンブス', 'スペイン', 'イスパニョーラ島', 'コロニアル', '新大陸']
    },
    'ポトシ': {
      explanation: '「銀の山」セロ・リコで知られる都市。16世紀に人口20万を超え、世界の価格革命を引き起こした銀の産地。',
      relatedTerms: ['銀', '価格革命', 'スペイン帝国', 'ボリビア', 'セロ・リコ']
    },
    'リオデジャネイロ': {
      explanation: '1763年ポルトガル植民地の首都に。奴隷とサトウキビ・コーヒーの富が集まり、ナポレオン戦争時には王室が避難。',
      relatedTerms: ['ポルトガル', 'ブラジル', '奴隷', 'サトウキビ', 'ジョアン6世']
    },
    // liberation_era
    'カラカス': {
      explanation: 'シモン・ボリバルの生誕地。南米6か国をスペインから解放した「解放者」の故郷。',
      relatedTerms: ['シモン・ボリバル', 'ベネズエラ', '独立運動', '大コロンビア', '解放者']
    },
    'ボゴタ': {
      explanation: '1819年ボヤカの戦い後、ボリバルが大コロンビア共和国を樹立した首都。コロンビア・ベネズエラ・エクアドルを統合。',
      relatedTerms: ['ボリバル', '大コロンビア', 'ボヤカの戦い', 'コロンビア', '独立']
    },
    'ブエノスアイレス': {
      explanation: '1810年五月革命の舞台。サン・マルティン将軍の拠点となり、チリ・ペルー解放の起点となった。',
      relatedTerms: ['五月革命', 'サン・マルティン', 'アルゼンチン', '独立運動', 'ラプラタ']
    }
  },
  mideast: {
    // ancient_orient
    'バビロン (ハンムラビ法典の都)': {
      explanation: 'バビロンはハンムラビ王の首都。目には目をの同害報復で知られるハンムラビ法典を発布。',
      relatedTerms: ['ハンムラビ', 'ハンムラビ法典', 'メソポタミア', 'アムル人', 'バビロニア']
    },
    'ペルセポリス': {
      explanation: 'ペルセポリスはアケメネス朝ペルシアの儀式用首都。ダレイオス1世が建設し、アレクサンドロスに破壊された。',
      relatedTerms: ['アケメネス朝', 'ダレイオス1世', 'アレクサンドロス', 'ペルシア', 'イラン']
    },
    'メッカ (イスラーム最高の聖地)': {
      explanation: 'メッカはイスラームの最高聖地。ムハンマドの出生地で、カアバ神殿がある。巡礼（ハッジ）の目的地。',
      relatedTerms: ['ムハンマド', 'カアバ', 'ハッジ', 'イスラーム', 'ヒジュラ']
    },
    'バグダード (アッバース朝の都)': {
      explanation: 'バグダードはアッバース朝の首都。マンスールが建設し、『千夜一夜物語』の舞台。学問・文化の中心として栄えた。',
      relatedTerms: ['アッバース朝', 'マンスール', 'ハールーン・アッラシード', 'イスラーム黄金時代', '円城']
    },
    // islamic_expansion
    'ダマスクス (ウマイヤ朝の都)': {
      explanation: 'ダマスクスはウマイヤ朝の首都。正統カリフ時代を経て、ムアーウィヤがカリフとなりウマイヤ朝を開いた。',
      relatedTerms: ['ウマイヤ朝', 'ムアーウィヤ', 'シリア', '正統カリフ', 'イスラーム拡大']
    },
    // turco_mongol
    'サマルカンド (ティムール朝の都)': {
      explanation: 'サマルカンドはティムール朝の首都。ティムールが建設した青の都。シルクロードの要衝。',
      relatedTerms: ['ティムール', 'ティムール朝', '中央アジア', 'ウルグ・ベク', '青の都']
    },
    'イスファハーン (サファヴィー朝の都)': {
      explanation: 'イスファハーンはサファヴィー朝ペルシアの首都。アッバース1世が建設し、「イスファハーンは世界の半分」と称された。',
      relatedTerms: ['サファヴィー朝', 'アッバース1世', 'シーア派', 'ペルシア', 'イラン']
    },
    'コンスタンティノープル (オスマンの都)': {
      explanation: '1453年メフメト2世が征服し、オスマン帝国の首都に。ビザンツ帝国を滅ぼし、イスタンブールと改称。',
      relatedTerms: ['メフメト2世', 'オスマン帝国', 'ビザンツ帝国', 'イスタンブール', '1453年']
    }
  },
  north_america: {
    // frontier
    'ジェームズタウン': {
      explanation: '1607年、イギリス最初の恒久植民地。ヴァージニア会社が建設。タバコ栽培で発展。',
      relatedTerms: ['ヴァージニア', '13植民地', 'タバコ', 'ポカホンタス', '北米植民']
    },
    'フィラデルフィア': {
      explanation: 'ペンシルベニア植民地の中心。独立宣言・合衆国憲法が採択された地。建国の父たちの舞台。',
      relatedTerms: ['独立宣言', '合衆国憲法', '大陸会議', 'ペンシルベニア', '建国の父']
    },
    'サンタフェ': {
      explanation: 'サンタフェ・トレイルの終着点。メキシコ独立後、アメリカとの交易路として発展。西部開拓の要衝。',
      relatedTerms: ['サンタフェ・トレイル', '西部開拓', 'メキシコ', '交易', 'ニューメキシコ']
    },
    'サクラメント': {
      explanation: '1848年サッターズミルで金が発見され、ゴールドラッシュが始まった。カリフォルニアの州都。',
      relatedTerms: ['ゴールドラッシュ', 'サッターズミル', '1848年', 'カリフォルニア', '西部開拓']
    },
    // independence
    'レキシントン': {
      explanation: '1775年、独立戦争の最初の銃声が鳴り響いた地。「世界に響き渡る銃声」として知られる。',
      relatedTerms: ['独立戦争', '1775年', 'ミニットマン', 'コンコード', 'アメリカ独立']
    },
    'ヨークタウン': {
      explanation: '1781年、ワシントンとフランス軍がコーンウォリスを包囲し降伏させた地。実質的な独立達成の戦い。',
      relatedTerms: ['コーンウォリス', '独立戦争', 'フランス参戦', 'ラファイエット', '1781年']
    },
    // civil_war
    'フォートサムター': {
      explanation: '1861年、南軍が砲撃を開始し南北戦争が勃発。チャールストン港の要塞で、戦争の開戦地。',
      relatedTerms: ['南北戦争', '1861年', '南軍', 'チャールストン', '開戦']
    },
    'ゲティズバーグ': {
      explanation: '1863年、南北戦争の転換点となった戦い。北軍の勝利後、リンカーンが有名な演説を行った。',
      relatedTerms: ['南北戦争', 'リンカーン', 'ゲティズバーグ演説', '北軍', '転換点']
    },
    'アポマトックス': {
      explanation: '1865年、リー将軍がグラントに降伏した地。南北戦争の実質的な終結を意味した。',
      relatedTerms: ['リー将軍', 'グラント', '南北戦争終結', '1865年', '南軍降伏']
    }
  },
  southeast_asia: {
    // ancient
    'アンコール・ワット': {
      explanation: 'クメール王国のヒンドゥー・仏教寺院。12世紀スーリヤヴァルマン2世が建設。世界最大の石造宗教建築。',
      relatedTerms: ['クメール', 'カンボジア', 'スーリヤヴァルマン2世', 'ヒンドゥー教', '世界遺産']
    },
    'シュリーヴィジャヤ': {
      explanation: 'スマトラ島に栄えた海上交易王国。7〜13世紀、マラッカ海峡を支配し、仏教文化の中心だった。',
      relatedTerms: ['スマトラ', '海上交易', 'マラッカ海峡', '仏教', '東南アジア']
    },
    'ボロブドゥール': {
      explanation: 'シャイレーンドラ朝が建設した大乗仏教の石造遺跡。ジャワ島の仏教世界遺産。',
      relatedTerms: ['シャイレーンドラ朝', 'ジャワ', '大乗仏教', 'インドネシア', '世界遺産']
    },
    // colonial
    'バタヴィア': {
      explanation: 'オランダ東インド会社のアジア拠点。ジャワ島に建設され、香辛料貿易の中心。現ジャカルタ。',
      relatedTerms: ['オランダ', '東インド会社', 'ジャカルタ', '香辛料', 'ジャワ']
    },
    'マラッカ': {
      explanation: 'マラッカ海峡の要衝。ポルトガル・オランダ・イギリスが相次いで支配。東西貿易の拠点。',
      relatedTerms: ['マラッカ海峡', 'ポルトガル', 'オランダ', '海峡植民地', '交易']
    },
    'シンガポール': {
      explanation: '1819年ラッフルズが建設したイギリスの自由港。海峡植民地の中心として発展。',
      relatedTerms: ['ラッフルズ', 'イギリス', '海峡植民地', '自由港', '東南アジア']
    }
  }
};

// Helper: check if text matches any key (partial match)
function findContent(text, regionMap) {
  if (!text) return null;
  // Exact match first
  if (regionMap[text]) return regionMap[text];
  // Partial match
  for (const key of Object.keys(regionMap)) {
    if (text.includes(key) || key.includes(text)) return regionMap[key];
  }
  return null;
}

function processFile(filename) {
  const region = filename.replace('.json', '');
  const regionMap = CONTENT_MAP[region];
  if (!regionMap) {
    console.log(`  No content map for ${region}, skipping`);
    return { file: filename, updated: 0 };
  }

  const filepath = path.join(DATA_DIR, filename);
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  let updated = 0;

  if (!data.eras) return { file: filename, updated: 0 };

  for (const eraKey of Object.keys(data.eras)) {
    const era = data.eras[eraKey];
    if (!era.fixed || !Array.isArray(era.fixed)) continue;

    for (const item of era.fixed) {
      if (item.explanation && item.relatedTerms) continue;
      const text = item.text || '';
      const content = findContent(text, regionMap);
      if (!content) continue;

      if (!item.explanation) item.explanation = content.explanation;
      if (!item.relatedTerms) item.relatedTerms = content.relatedTerms;
      updated++;
    }
  }

  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  return { file: filename, updated };
}

// Main
const files = ['africa.json', 'china.json', 'europe.json', 'india.json', 'latin_america.json', 'mideast.json', 'north_america.json', 'southeast_asia.json'];
const results = [];

console.log('Adding explanation and relatedTerms to quiz questions...\n');

for (const f of files) {
  const filepath = path.join(DATA_DIR, f);
  if (!fs.existsSync(filepath)) {
    console.log(`  ${f}: not found, skipping`);
    continue;
  }
  try {
    const result = processFile(f);
    results.push(result);
    console.log(`  ${result.file}: ${result.updated} questions updated`);
  } catch (err) {
    console.error(`  ${f}: ERROR -`, err.message);
  }
}

console.log('\n--- Summary ---');
console.log('Files modified:', results.filter(r => r.updated > 0).map(r => r.file).join(', '));
console.log('Total questions updated:', results.reduce((s, r) => s + r.updated, 0));
