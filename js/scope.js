import { state }          from './state.js';
import { shuffle }        from './shuffle.js';
import { showQuestion }   from './quiz.js';
import { flyToRegion, clearQuizLayer } from './map.js';

// scopeStr 例: "europe_ancient,china_ancient_china,mideast_islamic_expansion"
export function startScopeQuiz(scopeStr) {
    const pairs = scopeStr.split(',').map(s => {
        // region キーに "_" が含まれる (north_america 等) ケースを正確に分割
        const region = Object.keys(state.masterData).find(r => s.startsWith(r + '_'));
        if (!region) return null;
        const era = s.slice(region.length + 1);
        return state.masterData[region]?.eras[era] ? { region, era } : null;
    }).filter(Boolean);

    if (!pairs.length) {
        console.warn('有効な試験範囲が見つかりませんでした:', scopeStr);
        return;
    }

    const allQ = pairs.flatMap(p => state.masterData[p.region].eras[p.era].fixed || []);
    state.questions  = shuffle(allQ);
    state.currentIdx = 0;

    const first = pairs[0];
    state.currentRegion = first.region;
    state.currentEra    = first.era;
    const bounds = state.masterData[first.region].bounds;
    if (bounds) flyToRegion(bounds);
    document.body.dataset.region = first.region;
    document.body.dataset.era    = first.era;

    const banner = document.getElementById('scope-banner');
    banner.style.display = 'block';
    banner.innerHTML = '<strong>📋 試験範囲モード</strong><br>' +
        pairs.map(p =>
            `${state.masterData[p.region].name}／${state.masterData[p.region].eras[p.era].name}`
        ).join('、');

    document.getElementById('era-display').innerText =
        `📋 試験範囲モード（${pairs.length}時代 / 全${state.questions.length}問）`;

    showQuestion();
}

// チェックボックス一覧を動的生成
export function buildScopeChecklist() {
    const div = document.getElementById('scope-checklist');
    if (!div) return;
    div.innerHTML = '';
    Object.keys(state.masterData).forEach(region => {
        const grp = document.createElement('div');
        grp.innerText = state.masterData[region].name;
        div.appendChild(grp);

        Object.keys(state.masterData[region].eras).forEach(era => {
            const eraName = state.masterData[region].eras[era].name;
            const label   = document.createElement('label');
            label.innerHTML = `<input type="checkbox" value="${region}_${era}">${eraName}`;
            div.appendChild(label);
        });
    });
}

// キーワードで問題を全文検索してクイズ開始
export function startKeywordQuiz() {
    const input    = document.getElementById('keyword-input').value.trim();
    if (!input) { alert('キーワードを入力してください'); return; }

    // スペース・読点・改行・カンマで分割、2文字以上のみ有効
    const keywords = input.split(/[\s,、。\n]+/).filter(k => k.length >= 2);

    const matched = [];
    Object.keys(state.masterData).forEach(region => {
        Object.keys(state.masterData[region].eras).forEach(era => {
            (state.masterData[region].eras[era].fixed || []).forEach(q => {
                if (keywords.some(kw => q.text.includes(kw))) {
                    matched.push(q);
                }
            });
        });
    });

    if (!matched.length) {
        alert(`「${keywords.join('・')}」に一致する問題が見つかりませんでした`);
        return;
    }

    clearQuizLayer();
    state.questions     = shuffle(matched);
    state.currentIdx    = 0;
    state.currentRegion = null;
    state.currentEra    = null;

    document.querySelectorAll('.mode-btn, .era-btn').forEach(b => b.classList.remove('active'));
    document.body.removeAttribute('data-era');
    document.body.removeAttribute('data-region');

    const banner = document.getElementById('scope-banner');
    banner.style.display = 'block';
    banner.innerHTML =
        `<strong>🔍 キーワード検索モード</strong><br>` +
        `「${keywords.join('・')}」に関連する問題 ${matched.length}問`;

    document.getElementById('era-display').innerText =
        `🔍 キーワード検索（${matched.length}問）`;

    showQuestion();
}

// チェックした時代からURLを生成してクリップボードにコピー
export function copyScopeUrl() {
    const checked = [...document.querySelectorAll('#scope-checklist input:checked')]
        .map(i => i.value).join(',');
    if (!checked) { alert('時代を1つ以上チェックしてください'); return; }
    const url = location.origin + location.pathname + '?scope=' + checked;
    navigator.clipboard.writeText(url).then(() => {
        alert('URLをコピーしました！\n生徒にこのURLを共有してください。\n\n' + url);
    }).catch(() => {
        prompt('以下のURLをコピーしてください:', url);
    });
}
