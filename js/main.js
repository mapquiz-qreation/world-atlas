import { state } from './state.js';
import { setupMapZoomPan, resetMapView } from './map.js';
import { syncRanking } from './ranking.js';
import { checkLocalLogin, updateScoreUI, loginUser, logoutUser } from './user.js';
import { showQuestion, nextQuestion } from './quiz.js';
import { startScopeQuiz, buildScopeChecklist, copyScopeUrl } from './scope.js';
import { setupAdminPanel } from './admin.js';

async function fetchQuestions() {
    const regions = ['europe', 'mideast', 'india', 'china', 'southeast_asia', 'north_america', 'latin_america'];
    try {
        const results = await Promise.all(
            regions.map(r => fetch(`data/${r}.json`).then(res => {
                if (!res.ok) throw new Error(r);
                return res.json();
            }))
        );
        regions.forEach((r, i) => { state.masterData[r] = results[i]; });
    } catch (e) {
        console.warn('data/*.json 読込失敗、questions.json にフォールバック:', e.message);
        try {
            const res = await fetch('questions.json');
            state.masterData = await res.json();
        } catch (e2) {
            console.error('JSON読込失敗');
            return;
        }
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
    document.getElementById('map-image').src = data.img;
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

    document.getElementById('admin-pin').style.display = 'none';
    document.body.removeAttribute('data-era');
    document.body.dataset.region = key;
    resetMapView();
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

// モジュール script は defer 相当なので DOMContentLoaded 時点では DOM が確実に存在する
document.addEventListener('DOMContentLoaded', function() {
    setupMapZoomPan();
    setupAdminPanel(startQuiz);
    document.getElementById('login-btn').addEventListener('click', loginUser);
    document.getElementById('logout-btn').addEventListener('click', logoutUser);
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    document.getElementById('copy-scope-url-btn').addEventListener('click', copyScopeUrl);
    fetchQuestions();
});
