import { state }                                         from './state.js';
import { initMap, flyToRegion, resetMapView, clearQuizLayer } from './map.js';
import { syncRanking }                                    from './ranking.js';
import { checkLocalLogin, updateScoreUI, loginUser, logoutUser } from './user.js';
import { showQuestion, nextQuestion }                     from './quiz.js';
import { startScopeQuiz, buildScopeChecklist, copyScopeUrl, startKeywordQuiz } from './scope.js';
import { setupAdminPanel }                                from './admin.js';

async function fetchQuestions() {
    const regions = ['europe', 'mideast', 'africa', 'india', 'china', 'southeast_asia', 'north_america', 'latin_america'];
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
    const added   = JSON.parse(localStorage.getItem(`quiz_added_${regionKey}_${eraKey}`) || '[]');
    state.questions  = [...(eraData.fixed || []), ...added];
    state.currentIdx = 0;

    document.querySelectorAll('.era-btn').forEach(b =>
        b.classList.toggle('active', b.id === `era-${eraKey}`)
    );
    document.getElementById('era-display').innerText =
        `${state.masterData[regionKey].name} / ${eraData.name}`;

    showQuestion();
    syncRanking();
    updateScoreUI();
}

function goHome() {
    // クイズ状態をリセット
    state.questions  = [];
    state.currentIdx = 0;
    clearQuizLayer();

    // ボタンのアクティブ状態をリセット
    document.querySelectorAll('.mode-btn, .era-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('era-selector').innerHTML = '地域を先に選んでね';

    // 問題ボックスをリセット
    document.getElementById('q-text').innerText        = 'Ready?';
    document.getElementById('result').innerText        = '';
    document.getElementById('next-btn').style.display  = 'none';
    document.getElementById('era-display').innerText   = '-';
    document.getElementById('scope-banner').style.display = 'none';

    // テーマをリセット
    document.body.removeAttribute('data-era');
    document.body.removeAttribute('data-region');

    // 地図をワールドビューに戻す
    resetMapView();

    // ログイン中なら総合ランキングを表示
    if (state.currentUser) syncRanking();
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
    fetchQuestions();
});
