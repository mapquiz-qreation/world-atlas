// ranking.js ↔ user.js は循環 import だが、
// どちらも import した値を関数の中でのみ使うため ES modules の仕様上問題なく動く
import { GAS_URL, TAG_TITLES } from './config.js';
import { state } from './state.js';
import { updateScoreUI } from './user.js';

export function syncRanking() {
    if (!GAS_URL.includes('https')) return;
    const old = document.getElementById('jsonp-script');
    if (old) old.remove();
    const script = document.createElement('script');
    script.id  = 'jsonp-script';
    script.src = `${GAS_URL}?action=get&callback=receiveRanking&t=${Date.now()}`;
    document.body.appendChild(script);
}

export async function uploadScore(score) {
    if (!GAS_URL.includes('https')) return;
    const tag = `${state.currentRegion}_${state.currentEra}`;
    try {
        await fetch(GAS_URL, {
            method: 'POST',
            mode:   'no-cors',
            body:   JSON.stringify({ name: state.currentUser, score, tag }),
        });
    } catch (e) {
        console.error('送信失敗', e);
    }
    // GASの処理待ちを考慮して2秒・6秒の2段階でランキング再取得
    setTimeout(syncRanking, 2000);
    setTimeout(syncRanking, 6000);
}

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// JSONP コールバック（グローバルに公開）
window.receiveRanking = function(scores) {
    const list = document.getElementById('ranking-list');
    if (!Array.isArray(scores) || scores.length === 0) {
        list.innerHTML = 'データはまだないよ！';
        return;
    }

    // ホーム画面（時代未選択）→ 総合ランキング
    if (!state.currentRegion || !state.currentEra) {
        showOverallRanking(scores, list);
        return;
    }

    // 時代別ランキング
    document.getElementById('ranking-title').innerText = '🏆 時代別TOP10';
    const tag      = `${state.currentRegion}_${state.currentEra}`;
    const filtered = scores
        .filter(s => s.tag === tag)
        .sort((a, b) => b.score - a.score);

    if (filtered.length === 0) {
        list.innerHTML = 'この時代の挑戦者は君が初めてかも！';
    } else {
        const titleForTag = TAG_TITLES[tag] || '';
        list.innerHTML = filtered.slice(0, 10).map((s, i) => {
            const badge = i === 0 && titleForTag
                ? ` <span class="rank-title-badge">${escapeHtml(titleForTag)}</span>`
                : '';
            return `<div class="rank-row">${i + 1}位: ${escapeHtml(s.name)}${badge} (${s.score}点)</div>`;
        }).join('');
    }

    if (state.currentUser) {
        const myData = scores.find(s => s.name === state.currentUser && s.tag === tag);
        if (myData) {
            localStorage.setItem(`score_${state.currentUser}_${tag}`, myData.score);
            updateScoreUI();
        }
    }
};

function showOverallRanking(scores, list) {
    document.getElementById('ranking-title').innerText = '🌍 総合TOP10';

    // ユーザーごとに全タグのスコアを合算
    const totals = {};
    scores.forEach(s => {
        totals[s.name] = (totals[s.name] || 0) + s.score;
    });
    const sorted = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    if (sorted.length === 0) {
        list.innerHTML = 'まだ挑戦者がいないよ！';
        return;
    }

    list.innerHTML = sorted.map(([name, total], i) => {
        const badge = i === 0 ? ` <span class="rank-title-badge">🗺️ Atlas</span>` : '';
        return `<div class="rank-row">${i + 1}位: ${escapeHtml(name)}${badge} (${total}点)</div>`;
    }).join('');

    // 自分の合計スコアを表示
    if (state.currentUser) {
        const myTotal = totals[state.currentUser] || 0;
        document.getElementById('user-total-score').innerText = myTotal;
    }
}
