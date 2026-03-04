/**
 * patch_quiz_exclude.js
 * 共通テストに出題可能性が低い問題に quizExclude: true を付与する。
 * 問題データはそのまま残し（エリア問題のデコイ候補・連鎖学習に使用）、
 * クイズ出題からのみ除外する。
 * 実行: node patch_quiz_exclude.js
 */

const fs   = require('fs');
const path = require('path');

// match: q.text の部分一致で対象を特定
const EXCLUDES = [
    // ── インダス文明：マニアック遺跡 ──────────────────────────
    { file: 'india.json',     match: 'ドーラヴィーラー' },
    { file: 'india.json',     match: 'カーリーバンガン' },
    { file: 'india.json',     match: 'メヘルガル' },
    { file: 'india.json',     match: 'コートディジ' },
    { file: 'india.json',     match: 'チャンフーダーロー' },
    { file: 'india.json',     match: 'ガネーリーワーラー' },
    { file: 'india.json',     match: 'バナーワリー' },

    // ── 五胡：羯・氐・羌は細かすぎる ─────────────────────────
    { file: 'china.json',     match: '羯の主な居住域' },
    { file: 'china.json',     match: '氐の主な居住域' },
    { file: 'china.json',     match: '羌の主な居住域' },

    // ── 中東古代：超マニアック都市 ───────────────────────────
    { file: 'mideast.json',   match: 'エリドゥ' },
    { file: 'mideast.json',   match: 'マリ (メソポタミア北部' },
    { file: 'mideast.json',   match: 'ラガシュ' },

    // ── 中東トルコ・モンゴル：地名が共テに出にくい ───────────
    { file: 'mideast.json',   match: 'アダナ' },
    { file: 'mideast.json',   match: 'スィヴァス' },
    { file: 'mideast.json',   match: 'レイ (イル・ハン国' },

    // ── 北米：マニアックな戦場 ───────────────────────────────
    { file: 'north_america.json', match: 'ブルラン' },
    { file: 'north_america.json', match: 'バレーフォージ' },
];

const DATA_DIR = path.join(__dirname, 'data');
let totalExcluded = 0;

EXCLUDES.forEach(({ file, match }) => {
    const filePath = path.join(DATA_DIR, file);
    const data     = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let changed    = false;

    Object.values(data.eras).forEach(era => {
        (era.fixed || []).forEach(q => {
            if (q.text && q.text.includes(match) && !q.quizExclude) {
                q.quizExclude = true;
                changed       = true;
                totalExcluded++;
                console.log(`  除外: [${file}] ${q.text.substring(0, 40)}`);
            }
        });
    });

    if (changed) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    }
});

console.log(`\n完了: ${totalExcluded}問に quizExclude:true を付与`);
