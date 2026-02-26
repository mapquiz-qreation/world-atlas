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

// JSONP コールバック（グローバルに公開）
window.receiveRanking = function(scores) {
    const list = document.getElementById('ranking-list');
    if (!Array.isArray(scores) || scores.length === 0) {
        list.innerHTML = 'この時代のデータはまだないよ！';
        return;
    }
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
                ? ` <span class="rank-title-badge">${titleForTag}</span>`
                : '';
            return `<div class="rank-row">${i + 1}位: ${s.name}${badge} (${s.score}点)</div>`;
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
