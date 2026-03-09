import { state } from './state.js';
import { GAS_URL, STRIPE_PAYMENT_URL } from './config.js';
import { syncRanking, uploadScore } from './ranking.js';
import { loadSRSData } from './srs.js';

// ── 有料チェック ──────────────────────────────────────────────
export async function checkPaidStatus(username) {
    // localStorageキャッシュを確認（24時間有効）
    const cacheKey = `paid_${username}`;
    const cached   = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const { paid, ts } = JSON.parse(cached);
            if (Date.now() - ts < 24 * 60 * 60 * 1000) {
                state.isPaid = paid;
                return paid;
            }
        } catch (_) { /* 破損キャッシュは無視 */ }
    }

    // GAS に JSONP で問い合わせ
    return new Promise((resolve) => {
        const cbName = `_isPaidCb_${Date.now()}`;
        const timer  = setTimeout(() => {
            delete window[cbName];
            resolve(false);
        }, 8000);

        window[cbName] = (data) => {
            clearTimeout(timer);
            delete window[cbName];
            state.isPaid = !!data.paid;
            localStorage.setItem(cacheKey, JSON.stringify({ paid: !!data.paid, ts: Date.now() }));
            resolve(!!data.paid);
        };

        const script = document.createElement('script');
        script.src = `${GAS_URL}?action=isPaid&user=${encodeURIComponent(username)}&callback=${cbName}`;
        script.onerror = () => { clearTimeout(timer); delete window[cbName]; resolve(false); };
        document.head.appendChild(script);
    });
}

function showPurchasePrompt() {
    const msg = '👑 この機能は有料プランが必要です。\n\n'
              + '【WorldAtlas】100円（買い切り）\n'
              + '塾生の方は専用クーポンで無料！\n\n'
              + '購入ページに進みますか？';
    if (STRIPE_PAYMENT_URL && confirm(msg)) {
        window.open(STRIPE_PAYMENT_URL, '_blank');
    } else if (!STRIPE_PAYMENT_URL) {
        alert('準備中です。もうしばらくお待ちください。');
    }
}

// ── ログイン ──────────────────────────────────────────────────
export async function loginUser() {
    const name = document.getElementById('user-name-input').value.trim();
    if (!name) return alert('ネームを入力してね！');

    // Payment URL が未設定＝有料化前は全員そのままプレイ可能
    if (!STRIPE_PAYMENT_URL) {
        state.isPaid      = true;
        state.currentUser = name;
        localStorage.setItem('quiz_current_user', name);
        showUserInfo();
        syncRanking();
        return;
    }

    const btn = document.getElementById('login-btn');
    btn.disabled    = true;
    btn.textContent = '確認中...';

    const paid = await checkPaidStatus(name);

    btn.disabled    = false;
    btn.textContent = '参戦';

    if (!paid) {
        showPurchasePrompt();
        return;
    }

    state.currentUser = name;
    localStorage.setItem('quiz_current_user', name);
    showUserInfo();
    syncRanking();
}

export function logoutUser() {
    if (confirm('ユーザーを変更しますか？')) {
        localStorage.removeItem('quiz_current_user');
        state.currentUser = null;
        state.isPaid      = false;
        document.body.classList.remove('logged-in');
        document.getElementById('login-form').style.display      = 'block';
        document.getElementById('user-info-area').style.display  = 'none';
        document.getElementById('user-name-input').value         = '';
        document.getElementById('ranking-list').innerHTML        = 'ログインしてね';
        updateScoreUI();
        setScopePanelLock(true);
    }
}

export function checkLocalLogin() {
    const saved = localStorage.getItem('quiz_current_user');
    if (!saved) return;

    // Payment URL 未設定＝有料化前は保存されたユーザーでそのままプレイ可能
    if (!STRIPE_PAYMENT_URL) {
        state.isPaid      = true;
        state.currentUser = saved;
        showUserInfo();
        syncRanking();
        return;
    }

    // キャッシュから isPaid を即時反映
    const cacheKey = `paid_${saved}`;
    const cached   = localStorage.getItem(cacheKey);
    let isPaidFromCache = false;
    if (cached) {
        try {
            const { paid, ts } = JSON.parse(cached);
            isPaidFromCache = paid && (Date.now() - ts < 24 * 60 * 60 * 1000);
        } catch (_) {}
    }

    if (isPaidFromCache) {
        state.isPaid      = true;
        state.currentUser = saved;
        showUserInfo();
        syncRanking();
    } else {
        // キャッシュ切れ or 未キャッシュ → バックグラウンドで再確認
        checkPaidStatus(saved).then(paid => {
            if (paid) {
                state.currentUser = saved;
                showUserInfo();
                syncRanking();
            } else {
                // 有料確認できなければキャッシュのユーザー名を削除
                localStorage.removeItem('quiz_current_user');
            }
        });
    }
}

export function showUserInfo() {
    document.getElementById('login-form').style.display     = 'none';
    document.getElementById('user-info-area').style.display = 'block';
    document.getElementById('display-name').innerText       = state.currentUser;
    document.body.classList.add('logged-in');
    updateScoreUI();
    loadSRSData().then(() => {
        const btn = document.getElementById('review-btn');
        if (btn) btn.style.display = 'block';
    });
    setScopePanelLock(false);
}

function setScopePanelLock(locked) {
    const lockEl  = document.getElementById('scope-lock');
    const innerEl = document.getElementById('scope-inner');
    if (!lockEl || !innerEl) return;
    lockEl.style.display  = locked ? 'flex' : 'none';
    innerEl.style.display = locked ? 'none' : '';
}

export function updateScoreUI() {
    if (!state.currentUser) {
        document.getElementById('user-total-score').innerText = '0';
        return;
    }
    if (!state.currentEra) {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(`score_${state.currentUser}_`)) {
                total += parseInt(localStorage.getItem(key) || 0);
            }
        }
        document.getElementById('user-total-score').innerText = total;
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
