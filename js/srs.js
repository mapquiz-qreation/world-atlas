/**
 * js/srs.js — 忘却曲線（SM-2アルゴリズム）による復習スケジューリング
 *
 * 問題ID: `regionKey|eraKey|question.text` の32bit ハッシュ（base36）
 * データ形式: { [questionId]: { interval, easeFactor, correct, incorrect, nextReview, lastReview } }
 */

import { state }   from './state.js';
import { GAS_URL } from './config.js';

// ── 問題ID生成 ────────────────────────────────────────────────
export function getQuestionId(regionKey, eraKey, q) {
    const key = `${regionKey}|${eraKey}|${q.text}`;
    return simpleHash(key);
}

function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    }
    return Math.abs(h).toString(36);
}

// ── SM-2アルゴリズム ──────────────────────────────────────────
function applySM2(card, correct) {
    let { interval = 1, easeFactor = 2.5, correct: c = 0, incorrect: inc = 0 } = card;

    if (correct) {
        // 正解：間隔を伸ばし難易度係数を上げる
        interval   = Math.min(Math.round(interval * easeFactor), 180);
        easeFactor = Math.min(2.5, parseFloat((easeFactor + 0.1).toFixed(2)));
        c++;
    } else {
        // 不正解：翌日に再出題、難易度係数を下げる
        interval   = 1;
        easeFactor = Math.max(1.3, parseFloat((easeFactor - 0.2).toFixed(2)));
        inc++;
    }

    const nextReview = Date.now() + interval * 86400000;
    return { interval, easeFactor, correct: c, incorrect: inc, nextReview, lastReview: Date.now() };
}

// ── 解答を記録 ─────────────────────────────────────────────────
let syncTimer = null;

export function recordAnswer(q, correct) {
    if (!state.currentUser) return;

    const regionKey = state.currentRegion || q._regionKey;
    const eraKey    = state.currentEra    || q._eraKey;
    if (!regionKey || !eraKey) return;

    const id       = getQuestionId(regionKey, eraKey, q);
    const existing = state.srsData[id] || {};
    state.srsData[id] = applySM2(existing, correct);

    // ローカルキャッシュに保存
    localStorage.setItem(`srs_${state.currentUser}`, JSON.stringify(state.srsData));

    // 3秒後にGASへ一括送信（連続回答時の無駄な通信を防ぐ）
    clearTimeout(syncTimer);
    syncTimer = setTimeout(uploadSRS, 3000);
}

// ── GASへのアップロード ───────────────────────────────────────
async function uploadSRS() {
    if (!state.currentUser || !GAS_URL.includes('https')) return;
    try {
        await fetch(GAS_URL, {
            method: 'POST',
            mode:   'no-cors',
            body:   JSON.stringify({
                action: 'saveSRS',
                user:   state.currentUser,
                cards:  state.srsData,
            }),
        });
    } catch (e) {
        console.warn('SRS sync failed:', e);
    }
}

// ── GASからのロード（JSONP） ───────────────────────────────────
export function loadSRSData() {
    return new Promise((resolve) => {
        if (!state.currentUser) { resolve({}); return; }

        // ローカルキャッシュを先にセット（オフライン時のフォールバック）
        const cached = localStorage.getItem(`srs_${state.currentUser}`);
        if (cached) {
            try { state.srsData = JSON.parse(cached); } catch {}
        }

        if (!GAS_URL.includes('https')) { resolve(state.srsData); return; }

        // タイムアウト付きJSONP
        const cbName  = `_receiveSRS_${Date.now()}`;
        const timeout = setTimeout(() => {
            delete window[cbName];
            resolve(state.srsData);
        }, 6000);

        window[cbName] = (data) => {
            clearTimeout(timeout);
            delete window[cbName];
            if (data && typeof data === 'object') {
                state.srsData = { ...state.srsData, ...data };
                localStorage.setItem(`srs_${state.currentUser}`, JSON.stringify(state.srsData));
            }
            resolve(state.srsData);
        };

        const script = document.createElement('script');
        script.src = `${GAS_URL}?action=getSRS&user=${encodeURIComponent(state.currentUser)}&callback=${cbName}&t=${Date.now()}`;
        document.body.appendChild(script);
    });
}

// ── 復習が必要な問題を収集 ────────────────────────────────────
export function getDueReviewQuestions() {
    const now = Date.now();
    const due = [];

    Object.entries(state.masterData).forEach(([regionKey, regionData]) => {
        Object.entries(regionData.eras).forEach(([eraKey, eraData]) => {
            (eraData.fixed || []).forEach(q => {
                const id          = getQuestionId(regionKey, eraKey, q);
                const card        = state.srsData[id];
                const nextReview  = card ? card.nextReview : 0;

                // 未出題（nextReview=0）または期日到来したもの
                if (nextReview <= now) {
                    due.push({
                        ...q,
                        _regionKey:  regionKey,
                        _eraKey:     eraKey,
                        _srsId:      id,
                        _nextReview: nextReview,
                        _isNew:      !card,
                    });
                }
            });
        });
    });

    // 期日超過が多いものから優先、未学習は後回し
    due.sort((a, b) => {
        if (a._isNew !== b._isNew) return a._isNew ? 1 : -1;
        return a._nextReview - b._nextReview;
    });

    return due;
}

// ── SRSカードの統計取得（UI表示用） ──────────────────────────
export function getSRSStats() {
    const now    = Date.now();
    const cards  = Object.values(state.srsData);
    return {
        total:     cards.length,
        due:       cards.filter(c => c.nextReview <= now).length,
        mastered:  cards.filter(c => c.interval >= 21).length,  // 21日以上間隔 = 習得済み
    };
}
