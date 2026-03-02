/**
 * js/timeattack.js — タイムアタックモード
 * ログイン済みユーザーのみ利用可能。全地域の問題をシャッフルして
 * 制限時間内に何問正解できるか競う。回答後は自動進行。
 */

import { state } from './state.js';

let timerInterval = null;
let secondsLeft   = 0;

// ── スタート ──────────────────────────────────────────────────
export function startTimeAttack(minutes) {
    // 全地域・全時代の問題を収集
    const allQ = [];
    Object.values(state.masterData).forEach(data => {
        Object.values(data.eras).forEach(eraData => {
            (eraData.fixed || []).forEach(q => allQ.push(q));
        });
    });

    if (allQ.length < 4) return;
    shuffleArr(allQ);

    // TA 状態を初期化
    const ta      = state.timeAttack;
    ta.active     = true;
    ta.score      = 0;
    ta.total      = 0;
    ta.streak     = 0;
    ta.bestStreak = 0;
    ta.minutes    = minutes;
    ta.onAnswer   = handleTaAnswer;

    secondsLeft = minutes * 60;

    // クイズ状態をセット
    state.questions       = allQ;
    state.currentIdx      = 0;
    state.isReviewMode    = false;
    state.missedQuestions = [];

    document.body.removeAttribute('data-region');
    document.body.removeAttribute('data-era');
    document.getElementById('scope-banner').style.display = 'none';
    document.getElementById('next-btn').style.display     = 'none';
    document.getElementById('era-display').innerText      = `⚡ タイムアタック（${minutes}分）`;

    // タイマーバー表示
    document.getElementById('ta-bar').style.display = 'flex';
    refreshTimerBar();

    // カウントダウン開始
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        secondsLeft--;
        refreshTimerBar();
        if (secondsLeft <= 0) endTimeAttack();
    }, 1000);

    // 第一問を表示（quiz.js を動的インポートして循環依存を回避）
    import('./quiz.js').then(m => m.showQuestion());
}

// ── 中断（ホームボタンなどで強制終了） ───────────────────────
export function abortTimeAttack() {
    clearInterval(timerInterval);
    timerInterval = null;
    const ta    = state.timeAttack;
    ta.active   = false;
    ta.onAnswer = null;
    document.getElementById('ta-bar').style.display = 'none';
}

// ── 回答コールバック（quiz.js から呼ばれる） ─────────────────
function handleTaAnswer(correct) {
    const ta = state.timeAttack;
    ta.total++;
    if (correct) {
        ta.score++;
        ta.streak++;
        ta.bestStreak = Math.max(ta.bestStreak, ta.streak);
    } else {
        ta.streak = 0;
    }
    refreshTimerBar();

    // 正解: 0.8秒後、不正解: 1.3秒後に自動進行
    setTimeout(() => {
        if (!ta.active) return;
        state.currentIdx = (state.currentIdx + 1) % state.questions.length;
        if (state.currentIdx === 0) shuffleArr(state.questions);
        import('./quiz.js').then(m => m.showQuestion());
    }, correct ? 800 : 1300);
}

// ── 終了（タイムアップ） ──────────────────────────────────────
export function endTimeAttack() {
    clearInterval(timerInterval);
    timerInterval = null;

    const ta    = state.timeAttack;
    ta.active   = false;
    ta.onAnswer = null;

    document.getElementById('ta-bar').style.display   = 'none';
    document.getElementById('next-btn').style.display = 'none';

    // 結果モーダルを表示
    const accuracy = ta.total > 0 ? Math.round((ta.score / ta.total) * 100) : 0;
    document.getElementById('ta-result-stats').innerHTML = `
        <div class="ta-stat">
            <span class="ta-stat-val">${ta.score}</span>
            <span class="ta-stat-lbl">正解</span>
        </div>
        <div class="ta-stat">
            <span class="ta-stat-val">${ta.total}</span>
            <span class="ta-stat-lbl">解答数</span>
        </div>
        <div class="ta-stat">
            <span class="ta-stat-val">${accuracy}%</span>
            <span class="ta-stat-lbl">正答率</span>
        </div>
        <div class="ta-stat">
            <span class="ta-stat-val">${ta.bestStreak}</span>
            <span class="ta-stat-lbl">最大連続</span>
        </div>
    `;
    document.getElementById('ta-result-modal').style.display = 'flex';
}

// ── タイマーバー UI 更新 ──────────────────────────────────────
function refreshTimerBar() {
    const ta  = state.timeAttack;
    const min = Math.floor(secondsLeft / 60);
    const sec = (secondsLeft % 60).toString().padStart(2, '0');

    const timerEl = document.getElementById('ta-timer-display');
    if (timerEl) {
        timerEl.textContent = `${min}:${sec}`;
        timerEl.classList.toggle('ta-timer-urgent', secondsLeft <= 30);
    }

    const scoreEl = document.getElementById('ta-score-display');
    if (scoreEl) scoreEl.textContent = `${ta.score}問正解`;
}

// ── ユーティリティ ─────────────────────────────────────────────
function shuffleArr(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}
