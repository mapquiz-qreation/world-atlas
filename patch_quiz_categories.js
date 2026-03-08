/**
 * patch_quiz_categories.js (v3)
 * quizStatements に category フィールドを付与する
 *
 * 方針:
 *   各帝国の policies[category] の keywords のみを使い
 *   statement＋explanation とマッチング。
 *   ただし「税制」カテゴリのキーワード（「税」「貢納」など）は
 *   他カテゴリの文章にも出やすいため、税制は「税」「課税」「徴税」「財政」などの
 *   専用トークンが含まれる場合のみ付与する追加バイアスを設ける。
 *
 *   同スコア時は policies 出現順優先。スコア 0 は null（汎用）。
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'data', 'timeline.json');
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

// 税制特化トークン：これが含まれない文章には税制カテゴリを付与しない
const TAX_TOKENS = ['税', '課税', '徴税', '財政', '貢納', '租税', '税収', '免税', '課賦', '税制', '歳入', '徴収', '税率'];

let assigned = 0;
let nulled   = 0;

data.forEach(epoch => {
    (epoch.empires || []).forEach(empire => {
        // カテゴリ → キーワード配列（policies.keywords のみ、3文字以上）
        const catKeywords = {};
        (empire.policies || []).forEach(policy => {
            const cat = policy.category;
            if (!catKeywords[cat]) catKeywords[cat] = [];
            (policy.keywords || []).forEach(k => {
                if (k && k.length >= 3) catKeywords[cat].push(k);
            });
        });

        // カテゴリの出現順序を保持
        const catOrder = [...new Set((empire.policies || []).map(p => p.category))];

        (empire.quizStatements || []).forEach(stmt => {
            const text = (stmt.statement || '') + ' ' + (stmt.explanation || '');

            let bestCat   = null;
            let bestScore = 0;

            catOrder.forEach(cat => {
                const keywords = catKeywords[cat] || [];
                let score = 0;
                keywords.forEach(kw => {
                    if (text.includes(kw)) {
                        score += kw.length;
                    }
                });

                // 税制カテゴリは税関連トークンが文章に含まれない場合は対象外
                if (cat === '税制') {
                    const hasTaxToken = TAX_TOKENS.some(t => text.includes(t));
                    if (!hasTaxToken) score = 0;
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestCat   = cat;
                }
            });

            if (bestCat && bestScore >= 4) {
                stmt.category = bestCat;
                assigned++;
            } else {
                stmt.category = null;
                nulled++;
            }
        });
    });
});

fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
console.log(`完了: ${assigned} 件に category 付与、${nulled} 件は null`);
