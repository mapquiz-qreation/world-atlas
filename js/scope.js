import { state }          from './state.js';
import { shuffle }        from './shuffle.js';
import { showQuestion }   from './quiz.js';
import { flyToRegion, clearQuizLayer } from './map.js';
import { ERA_DISPLAY_NAMES, GAS_URL } from './config.js';

function eraLabel(region, era) {
    return ERA_DISPLAY_NAMES[`${region}_${era}`]
        || state.masterData[region]?.eras[era]?.name
        || era;
}

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
            `${state.masterData[p.region].name}／${eraLabel(p.region, p.era)}`
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
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" value="${region}_${era}">${eraLabel(region, era)}`;
            div.appendChild(label);
        });
    });
}

// キーワードで問題を全文検索してクイズ開始（URLパラメータからも呼べる）
export function startKeywordQuiz(overrideInput) {
    const input    = overrideInput || document.getElementById('keyword-input').value.trim();
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

// チェックした時代からURLを生成してモーダル表示
export function copyScopeUrl() {
    const checked = [...document.querySelectorAll('#scope-checklist input:checked')]
        .map(i => i.value).join(',');
    if (!checked) { alert('時代を1つ以上チェックしてください'); return; }
    const url = location.origin + location.pathname + '?scope=' + checked;
    showScopeUrlModal(url);
}

function showScopeUrlModal(url, title) {
    // 既存モーダルがあれば削除
    document.getElementById('scope-url-modal')?.remove();

    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(url)}`;

    const modal = document.createElement('div');
    modal.id = 'scope-url-modal';
    modal.innerHTML = `
        <div id="scope-url-inner">
            <div id="scope-url-title">🔗 ${title || '試験範囲URL'}</div>
            <img id="scope-url-qr" src="${qrSrc}" alt="QRコード" />
            <div id="scope-url-hint">カメラで読み取るか、下のリンクをタップ</div>
            <a id="scope-url-link" href="${url}" target="_blank" rel="noopener">${url}</a>
            <div id="scope-url-actions">
                <button id="scope-url-copy-btn">📋 URLをコピー</button>
                <button id="scope-url-close-btn">閉じる</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    document.getElementById('scope-url-close-btn').addEventListener('click', close);
    document.getElementById('scope-url-copy-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(url).then(() => {
            const btn = document.getElementById('scope-url-copy-btn');
            btn.textContent = '✅ コピーしました！';
            setTimeout(() => { btn.textContent = '📋 URLをコピー'; }, 2000);
        }).catch(() => {
            prompt('以下のURLをコピーしてください:', url);
        });
    });
}

// ── 一問一答から問題を探す ───────────────────────────────
export async function startIchimondaiQuiz() {
    const input    = document.getElementById('ichimondai-input').value.trim();
    const statusEl = document.getElementById('ichimondai-status');
    const btn      = document.getElementById('ichimondai-start-btn');

    if (!input) { alert('問題文を貼り付けてください'); return; }

    btn.disabled      = true;
    btn.textContent   = '⏳ 解析中...';
    statusEl.textContent = 'AIがキーワードを抽出しています...';

    try {
        // GAS経由でClaudeにキーワード抽出を依頼
        const res = await fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'extractKeywords', text: input })
        });
        const data = await res.json();
        const raw  = data.keywords || '';

        // カンマ・読点・スペースで分割して2文字以上のみ使用
        const keywords = raw.split(/[,、，\s]+/).map(k => k.trim()).filter(k => k.length >= 2);

        if (!keywords.length) {
            statusEl.textContent = 'キーワードを抽出できませんでした';
            return;
        }

        statusEl.textContent = `抽出キーワード：${keywords.join('・')}`;

        // 既存のキーワード検索で問題を絞り込む
        const matched = [];
        Object.keys(state.masterData).forEach(region => {
            Object.keys(state.masterData[region].eras).forEach(era => {
                (state.masterData[region].eras[era].fixed || []).forEach(q => {
                    if (keywords.some(kw => q.text.includes(kw))) matched.push(q);
                });
            });
        });

        if (!matched.length) {
            statusEl.textContent = `「${keywords.join('・')}」に一致する問題が見つかりませんでした`;
            return;
        }

        // QRコードボタンを表示
        const kwParam = encodeURIComponent(keywords.join(','));
        const kwUrl   = location.origin + location.pathname + '?kw=' + kwParam;
        statusEl.innerHTML =
            `抽出キーワード：${keywords.join('・')}<br>` +
            `<button id="ichimondai-qr-btn" style="margin-top:6px; width:100%; padding:6px; background:#333; color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:12px;">📋 QRコードを生成（${matched.length}問）</button>`;
        document.getElementById('ichimondai-qr-btn').addEventListener('click', () => {
            showScopeUrlModal(kwUrl, `📖 一問一答連動 ${matched.length}問`);
        });

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
            `<strong>📖 一問一答連動モード</strong><br>` +
            `「${keywords.join('・')}」関連 ${matched.length}問`;

        document.getElementById('era-display').innerText =
            `📖 一問一答連動（${matched.length}問）`;

        showQuestion();

    } catch (err) {
        statusEl.textContent = 'エラーが発生しました: ' + err.message;
    } finally {
        btn.disabled    = false;
        btn.textContent = '🔍 対応問題を探す';
    }
}
