import { state } from './state.js';
import { syncRanking, uploadScore } from './ranking.js';

export function loginUser() {
    const name = document.getElementById('user-name-input').value.trim();
    if (!name) return alert('ネームを入力してね！');
    state.currentUser = name;
    localStorage.setItem('quiz_current_user', name);
    showUserInfo();
    if (state.currentRegion && state.currentEra) syncRanking();
}

export function logoutUser() {
    if (confirm('ユーザーを変更しますか？')) {
        localStorage.removeItem('quiz_current_user');
        state.currentUser = null;
        document.getElementById('login-form').style.display      = 'block';
        document.getElementById('user-info-area').style.display  = 'none';
        document.getElementById('user-name-input').value         = '';
        document.getElementById('ranking-list').innerHTML        = 'ログインしてね';
        updateScoreUI();
    }
}

export function checkLocalLogin() {
    const saved = localStorage.getItem('quiz_current_user');
    if (saved) { state.currentUser = saved; showUserInfo(); }
}

export function showUserInfo() {
    document.getElementById('login-form').style.display     = 'none';
    document.getElementById('user-info-area').style.display = 'block';
    document.getElementById('display-name').innerText       = state.currentUser;
    updateScoreUI();
}

export function updateScoreUI() {
    if (!state.currentUser || !state.currentEra) {
        document.getElementById('user-total-score').innerText = '0';
        return;
    }
    const tag   = `${state.currentRegion}_${state.currentEra}`;
    const score = localStorage.getItem(`score_${state.currentUser}_${tag}`) || 0;
    document.getElementById('user-total-score').innerText = score;
}

export function addPoint() {
    if (!state.currentUser || !state.currentEra) return;
    const tag   = `${state.currentRegion}_${state.currentEra}`;
    const score = parseInt(localStorage.getItem(`score_${state.currentUser}_${tag}`) || 0) + 1;
    localStorage.setItem(`score_${state.currentUser}_${tag}`, score);
    updateScoreUI();
    uploadScore(score);
}
