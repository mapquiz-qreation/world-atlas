import { state }                                         from './state.js';
import { GAS_URL, STRIPE_PAYMENT_URL }                   from './config.js';
import { initMap, flyToRegion, resetMapView, clearQuizLayer } from './map.js';
import { syncRanking }                                    from './ranking.js';
import { checkLocalLogin, updateScoreUI, loginUser, logoutUser } from './user.js';
import { showQuestion, nextQuestion }                     from './quiz.js';
import { startScopeQuiz, buildScopeChecklist, copyScopeUrl, startKeywordQuiz } from './scope.js';
import { setupAdminPanel }                                from './admin.js';
import { initMobile, closeMobileSheet }                   from './mobile.js';
import { loadSRSData, getDueReviewQuestions, getSRSStats } from './srs.js';
import { startTimeAttack, abortTimeAttack, endTimeAttack } from './timeattack.js';

async function fetchQuestions() {
    const regions = ['europe', 'mideast', 'africa', 'india', 'china', 'southeast_asia', 'north_america', 'latin_america', 'world_wars', 'cold_war'];
    try {
        const results = await Promise.all(
            regions.map(r => fetch(`data/${r}.json`).then(res => {
                if (!res.ok) throw new Error(r);
                return res.json();
            }))
        );
        regions.forEach((r, i) => { state.masterData[r] = results[i]; });
    } catch (e) {
        console.warn('data/*.json 読込失敗:', e.message);
        return;
    }
    setupRegionButtons();
    buildScopeChecklist();
    checkLocalLogin();
    const scopeParam = new URLSearchParams(window.location.search).get('scope');
    if (scopeParam) startScopeQuiz(scopeParam);
}

function setupRegionButtons() {
    const selector = document.getElementById('mode-selector');
    selector.innerHTML = '';
    Object.keys(state.masterData).forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'mode-btn';
        btn.innerText = state.masterData[key].name;
        btn.id        = `btn-${key}`;
        btn.onclick   = () => selectRegion(key);
        selector.appendChild(btn);
    });
}

function selectRegion(key) {
    state.currentRegion = key;
    const data = state.masterData[key];

    // Leaflet で地域 bounds にジャンプ
    if (data.bounds) flyToRegion(data.bounds);

    document.querySelectorAll('.mode-btn').forEach(b =>
        b.classList.toggle('active', b.id === `btn-${key}`)
    );

    const eraSelector = document.getElementById('era-selector');
    eraSelector.innerHTML = '';
    Object.keys(data.eras).forEach(eraKey => {
        const btn = document.createElement('button');
        btn.className = 'era-btn';
        btn.innerText = data.eras[eraKey].name;
        btn.id        = `era-${eraKey}`;
        btn.onclick   = () => startQuiz(key, eraKey);
        eraSelector.appendChild(btn);
    });

    document.body.removeAttribute('data-era');
    document.body.dataset.region = key;
}

export function startQuiz(regionKey, eraKey) {
    state.currentRegion = regionKey;
    state.currentEra    = eraKey;
    document.body.dataset.era = eraKey;
    const eraData = state.masterData[regionKey].eras[eraKey];
    let added = [];
    try {
        added = JSON.parse(localStorage.getItem(`quiz_added_${regionKey}_${eraKey}`) || '[]');
    } catch (_) { /* 不正なJSONは無視 */ }
    state.questions      = [...(eraData.fixed || []).filter(q => !q.quizExclude), ...added];
    state.currentIdx     = 0;
    state.missedQuestions = [];

    document.querySelectorAll('.era-btn').forEach(b =>
        b.classList.toggle('active', b.id === `era-${eraKey}`)
    );
    document.getElementById('era-display').innerText =
        `${state.masterData[regionKey].name} / ${eraData.name}`;

    if (state.masterData[regionKey].bounds) flyToRegion(state.masterData[regionKey].bounds);
    closeMobileSheet();
    showQuestion();
    syncRanking();
    updateScoreUI();
}

function goHome() {
    if (state.timeAttack.active) abortTimeAttack();
    document.getElementById('ta-result-modal').style.display = 'none';

    state.questions     = [];
    state.currentIdx    = 0;
    state.currentRegion = '';
    state.currentEra    = '';
    state.isReviewMode  = false;
    clearQuizLayer();

    document.querySelectorAll('.mode-btn, .era-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('era-selector').innerHTML = '地域を先に選んでね';

    document.getElementById('q-text').innerText        = 'Ready?';
    document.getElementById('result').innerText        = '';
    document.getElementById('next-btn').style.display  = 'none';
    document.getElementById('era-display').innerText   = '-';
    document.getElementById('scope-banner').style.display = 'none';

    document.body.removeAttribute('data-era');
    document.body.removeAttribute('data-region');

    resetMapView();
    syncRanking();
    updateReviewBtn();
}

// ── 復習モード ────────────────────────────────────────────────
export async function startReviewMode() {
    if (!state.currentUser || !state.isPaid) {
        alert('復習モードは有料プランが必要です。\nログイン後にご利用いただけます。');
        return;
    }

    const btn = document.getElementById('review-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⌛ 読み込み中...'; }

    await loadSRSData();
    const due = getDueReviewQuestions();

    if (btn) { btn.disabled = false; btn.textContent = '📚 復習スタート'; }

    if (due.length === 0) {
        alert('今日の復習問題はありません！\nしっかり覚えられています 🎉');
        return;
    }

    state.isReviewMode  = true;
    state.questions     = due;
    state.currentIdx    = 0;

    document.getElementById('era-display').innerText = '📚 復習モード';
    document.body.removeAttribute('data-region');
    document.body.removeAttribute('data-era');

    closeMobileSheet();
    showQuestion();
    updateReviewBtn();
}

function updateReviewBtn() {
    const btn = document.getElementById('review-btn');
    if (!btn) return;
    if (!state.currentUser) {
        btn.style.display = 'none';
        return;
    }
    btn.style.display = 'block';
    const stats = getSRSStats();
    const dueCount = stats.due;
    btn.textContent = dueCount > 0
        ? `📚 復習スタート（${dueCount}問）`
        : `📚 復習スタート`;
}

    document.addEventListener('DOMContentLoaded', async function() {
    await initMap();
    setupAdminPanel(startQuiz);
    document.getElementById('login-btn').addEventListener('click', loginUser);
    document.getElementById('logout-btn').addEventListener('click', logoutUser);
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    document.getElementById('copy-scope-url-btn').addEventListener('click', copyScopeUrl);
    document.getElementById('keyword-start-btn').addEventListener('click', startKeywordQuiz);
    document.getElementById('home-btn').addEventListener('click', goHome);
    document.getElementById('review-btn').addEventListener('click', startReviewMode);

    // タイムアタック：時間ボタン
    document.querySelectorAll('.ta-time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const minutes = parseInt(btn.dataset.min, 10);
            closeMobileSheet();
            startTimeAttack(minutes);
        });
    });

    // タイムアタック：結果モーダルのボタン
    document.getElementById('ta-retry-btn').addEventListener('click', () => {
        document.getElementById('ta-result-modal').style.display = 'none';
        const minutes = state.timeAttack.minutes || 3;
        startTimeAttack(minutes);
    });
    document.getElementById('ta-end-btn').addEventListener('click', () => {
        document.getElementById('ta-result-modal').style.display = 'none';
        goHome();
    });

    // Stripe 購入ボタンに URL をセット
    const buyBtn = document.getElementById('buy-btn');
    if (buyBtn && STRIPE_PAYMENT_URL) {
        buyBtn.href = STRIPE_PAYMENT_URL;
    } else if (buyBtn) {
        buyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            alert('準備中です。もうしばらくお待ちください。');
        });
    }

    fetchQuestions();
    initMobile();
});
