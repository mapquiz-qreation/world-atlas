/**
 * js/quiz.js — Leaflet ベースのクイズ表示
 */

import { state }          from './state.js';
import { shuffle }        from './shuffle.js';
import { addPoint }       from './user.js';
import { clearQuizLayer, getQuizLayer, flyToRegion } from './map.js';
import { recordAnswer }   from './srs.js';

// ── 問題表示エントリ ─────────────────────────────────────────
export function showQuestion() {
    if (!state.questions.length) return;
    state.isAnswered = false;
    const q = state.questions[state.currentIdx];

    // 復習モード：問題ごとに地域・時代を切り替える
    if (state.isReviewMode && q._regionKey) {
        state.currentRegion = q._regionKey;
        state.currentEra    = q._eraKey;
        const regionName = state.masterData[q._regionKey]?.name || q._regionKey;
        const eraName    = state.masterData[q._regionKey]?.eras[q._eraKey]?.name || q._eraKey;
        document.getElementById('era-display').innerText = `📚 復習 / ${regionName} / ${eraName}`;
        document.body.dataset.region = q._regionKey;
        document.body.dataset.era    = q._eraKey;
    }

    document.getElementById('q-text').innerText       = q.text;
    document.getElementById('result').innerText       = '';
    document.getElementById('next-btn').style.display = 'none';
    hideExplanation();

    clearQuizLayer();

    if (q.type === 'area') {
        showAreaQuestion(q);
    } else {
        showPointQuestion(q);
    }
}

// ── 点クリック問題 ────────────────────────────────────────────
// マーカー同士が近すぎるか判定（度数ベースの近似距離）
const MIN_DIST_DEG = 5; // 約500km以上離れていること
function tooClose(a, b) {
    const dlat = (a.lat ?? 0) - (b.lat ?? 0);
    const dlng = (a.lng ?? 0) - (b.lng ?? 0);
    return Math.sqrt(dlat * dlat + dlng * dlng) < MIN_DIST_DEG;
}

function showPointQuestion(q) {
    const layer      = getQuizLayer();
    const candidates = shuffle(
        state.questions.filter(o => o.text !== q.text && o.type !== 'area')
    );

    // 正解から離れていて、かつ選択済みデコイ同士も離れているものを最大3つ選ぶ
    const decoys = [];
    for (const c of candidates) {
        if (tooClose(c, q)) continue;                        // 正解に近すぎる
        if (decoys.some(d => tooClose(d, c))) continue;     // 他のデコイに近すぎる
        decoys.push(c);
        if (decoys.length >= 3) break;
    }

    const choices = shuffle([{ ...q, correct: true }, ...decoys]);

    choices.forEach(c => {
        const marker = L.circleMarker([c.lat, c.lng], {
            radius:      14,
            color:       '#fff',
            weight:      2,
            fillColor:   '#e53935',
            fillOpacity: 0.85,
        });
        marker.addTo(layer);

        // クリックハンドラー
        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            if (state.isAnswered) return;
            state.isAnswered = true;
            if (c.correct) {
                marker.setStyle({ fillColor: '#43a047', color: '#fff' });
                document.getElementById('result').innerText = '⭕ 正解！';
                addPoint();
                recordAnswer(q, true);
                if (state.timeAttack.active) {
                    state.timeAttack.onAnswer?.(true);
                } else {
                    showExplanation(q);
                }
            } else {
                marker.setStyle({ fillColor: '#9e9e9e', fillOpacity: 0.4 });
                document.getElementById('result').innerText = '❌ 不正解';
                recordAnswer(q, false);
                highlightCorrectMarker(layer, q);
                // 間違えた問題を記録（重複なし）
                if (!state.missedQuestions.some(m => m.text === q.text)) {
                    state.missedQuestions.push(q);
                }
                if (state.timeAttack.active) {
                    state.timeAttack.onAnswer?.(false);
                }
            }
            document.getElementById('next-btn').style.display =
                state.timeAttack.active ? 'none' : 'block';
        });

        // 答え確認用にマーカーに情報を付与
        marker._isCorrect = c.correct;
        marker._latlng_ref = [c.lat, c.lng];
    });
}

function highlightCorrectMarker(layer, q) {
    layer.eachLayer(marker => {
        if (marker._isCorrect) {
            marker.setStyle({ fillColor: '#43a047', color: '#fff' });
            marker.setRadius(18);
        }
    });
}

// ── エリア選択問題 ────────────────────────────────────────────
function showAreaQuestion(q) {
    const layer = getQuizLayer();

    // 問題ごとに指定された広域ビューがあればズーム（モンゴル帝国など広大な地域用）
    if (q.mapBounds) flyToRegion(q.mapBounds);

    q.areas.forEach(area => {
        const polygon = L.polygon(area.latlngs, {
            color:       area.color,
            weight:      1.5,
            fillColor:   area.color,
            fillOpacity: 0.35,
            className:   'area-polygon',
        });
        polygon.addTo(layer);
        polygon._areaData = area;

        // ラベルは回答前は非表示（クイズの答えになるため）
        const center  = getLatLngCenter(area.latlngs);
        const tooltip = L.tooltip({
            permanent:   true,
            direction:   'center',
            className:   'area-label-tooltip',
            interactive: false,
            opacity:     0,
        }).setContent(area.label);
        polygon.bindTooltip(tooltip).openTooltip(center);
        polygon._labelTooltip = tooltip;

        // クリックハンドラー
        polygon.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            if (state.isAnswered) return;
            state.isAnswered = true;
            if (area.correct) {
                polygon.setStyle({ fillColor: area.color, fillOpacity: 0.75, weight: 3 });
                document.getElementById('result').innerText = '⭕ 正解！';
                addPoint();
                recordAnswer(q, true);
                polygon._labelTooltip?.setOpacity(1);
                if (state.timeAttack.active) {
                    state.timeAttack.onAnswer?.(true);
                } else {
                    showExplanation(q);
                }
            } else {
                polygon.setStyle({ fillOpacity: 0.1, weight: 0.5 });
                document.getElementById('result').innerText = '❌ 不正解';
                recordAnswer(q, false);
                polygon._labelTooltip?.setOpacity(1);
                highlightCorrectArea(layer);
                // 間違えた問題を記録（重複なし）
                if (!state.missedQuestions.some(m => m.text === q.text)) {
                    state.missedQuestions.push(q);
                }
                if (state.timeAttack.active) {
                    state.timeAttack.onAnswer?.(false);
                }
            }
            document.getElementById('next-btn').style.display =
                state.timeAttack.active ? 'none' : 'block';
        });
    });
}

function highlightCorrectArea(layer) {
    layer.eachLayer(polygon => {
        const area = polygon._areaData;
        if (area?.correct) {
            polygon.setStyle({ fillOpacity: 0.8, weight: 3 });
            polygon.getElement()?.classList.add('area-pulse');
            polygon._labelTooltip?.setOpacity(1);
        }
    });
}

// ── ユーティリティ ────────────────────────────────────────────
export function getLatLngCenter(latlngs) {
    const n   = latlngs.length;
    const lat = latlngs.reduce((s, p) => s + p[0], 0) / n;
    const lng = latlngs.reduce((s, p) => s + p[1], 0) / n;
    return L.latLng(lat, lng);
}

export function nextQuestion() {
    const nextIdx = state.currentIdx + 1;

    if (nextIdx >= state.questions.length) {
        // 1周終了
        if (state.missedQuestions.length === 0) {
            // 全問正解 → クリア画面
            showClear();
        } else {
            // 間違えた問題だけで次の周回へ
            state.questions     = [...state.missedQuestions];
            state.missedQuestions = [];
            state.currentIdx    = 0;
            showRetryBanner(state.questions.length);
            showQuestion();
        }
    } else {
        state.currentIdx = nextIdx;
        showQuestion();
    }
}

function showClear() {
    clearQuizLayer();
    const qBox  = document.getElementById('question-box');
    const qText = document.getElementById('q-text');
    const result = document.getElementById('result');
    const nextBtn = document.getElementById('next-btn');
    const eraDisp = document.getElementById('era-display');
    const expBox  = document.getElementById('explanation-box');

    if (expBox)  expBox.style.display  = 'none';
    if (result)  result.innerText      = '';
    if (eraDisp) eraDisp.innerText     = '🎉 CLEAR!';

    if (qText) {
        qText.innerHTML = `
            <div style="text-align:center; padding: 8px 0;">
                <div style="font-size:2em; margin-bottom:8px;">🏆</div>
                <div style="font-weight:bold; font-size:1.1em; margin-bottom:6px;">全問正解！</div>
                <div style="font-size:0.85em; opacity:0.8;">この時代をマスターしました</div>
            </div>`;
    }

    if (nextBtn) {
        nextBtn.style.display  = 'block';
        nextBtn.textContent    = '🔄 もう一度チャレンジ';
        nextBtn.onclick = () => {
            nextBtn.onclick = null;
            nextBtn.textContent = '次の問題へ →';
            import('./main.js').then(m => {
                m.startQuiz(state.currentRegion, state.currentEra);
            });
        };
    }
}

function showRetryBanner(count) {
    const eraDisp = document.getElementById('era-display');
    if (eraDisp) {
        const prev = eraDisp.innerText;
        eraDisp.innerText = `❌ 不正解 ${count}問 — 復習ラウンド`;
        setTimeout(() => { eraDisp.innerText = prev; }, 2500);
    }
}

// ── Syncroタグ定数 ───────────────────────────────────────────
const SYNCRO_PATTERNS = {
    '交易で栄えた':       '#ffd54f',
    '外圧が改革を生む':   '#80cbc4',
    '帝国の拡大と崩壊':   '#ef9a9a',
    '宗教が統治を支えた': '#ce93d8',
    '知の革命':           '#4fc3f7',
};

function isTagMode() {
    return document.getElementById('tag-mode-toggle')?.checked || false;
}

function getSyncroTagKey(q) {
    return `syncro_tag|${state.currentRegion}|${state.currentEra}|${q.text}`;
}

// ── 解説・関連用語表示 ─────────────────────────────────────────
function showExplanation(q) {
    const box = document.getElementById('explanation-box');
    const textEl = document.getElementById('explanation-text');
    const termsEl = document.getElementById('related-terms');

    // localStorage のタグオーバーライドを q に適用
    const storedTag = localStorage.getItem(getSyncroTagKey(q));
    if (storedTag) q.syncro = { pattern: storedTag };

    // 既存の動的要素を削除
    document.getElementById('syncro-btn')?.remove();
    document.getElementById('syncro-tag-panel')?.remove();

    if (!q.explanation && (!q.relatedTerms || q.relatedTerms.length === 0) && !q.syncro && !isTagMode()) {
        box.style.display = 'none';
        return;
    }
    textEl.textContent = q.explanation || '';
    textEl.style.display = q.explanation ? 'block' : 'none';
    if (q.relatedTerms && q.relatedTerms.length > 0) {
        termsEl.innerHTML = '<strong>関連用語：</strong> ' + q.relatedTerms.join('　・　');
        termsEl.style.display = 'block';
    } else {
        termsEl.style.display = 'none';
    }

    // Syncro Eras ボタン
    if (q.syncro?.pattern) {
        box.appendChild(buildSyncroBtn(q));
    }

    // タグモード時：タグパネルを追加
    if (isTagMode()) {
        box.appendChild(buildSyncroTagPanel(q));
    }

    box.style.display = 'block';
}

function buildSyncroBtn(q) {
    const btn = document.createElement('button');
    btn.id = 'syncro-btn';
    btn.textContent = '🔄 Syncro Erasで見る';
    btn.style.cssText = [
        'margin-top:10px', 'width:100%', 'padding:8px 12px',
        'background:linear-gradient(135deg,#1a3a5c,#0d2a4a)',
        'color:#82c4f8', 'border:2px solid #4a7ab5',
        'border-radius:8px', 'cursor:pointer',
        'font-size:0.85em', 'font-weight:bold', 'letter-spacing:0.5px',
    ].join(';');
    btn.onclick = () => {
        const url = `timeline.html?pattern=${encodeURIComponent(q.syncro.pattern)}&from=${encodeURIComponent(q.text)}`;
        window.open(url, '_blank');
    };
    return btn;
}

function buildSyncroTagPanel(q) {
    const key     = getSyncroTagKey(q);
    const current = localStorage.getItem(key) || q.syncro?.pattern || null;

    const panel = document.createElement('div');
    panel.id = 'syncro-tag-panel';
    panel.className = 'syncro-tag-panel';

    const label = document.createElement('div');
    label.textContent = '🏷️ Syncroタグ';
    label.className = 'syncro-tag-label';
    panel.appendChild(label);

    const btnsWrap = document.createElement('div');
    btnsWrap.className = 'syncro-tag-btns';
    panel.appendChild(btnsWrap);

    Object.entries(SYNCRO_PATTERNS).forEach(([name, color]) => {
        const btn = document.createElement('button');
        btn.textContent = name;
        const isActive = current === name;
        btn.className = 'syncro-tag-btn' + (isActive ? ' active' : '');
        btn.style.setProperty('--tag-color', color);
        btn.onclick = () => {
            localStorage.setItem(key, name);
            q.syncro = { pattern: name };
            refreshExplanationDynamic(q);
        };
        btnsWrap.appendChild(btn);
    });

    const clearBtn = document.createElement('button');
    clearBtn.textContent = '🚫 なし';
    clearBtn.className = 'syncro-tag-btn syncro-tag-clear' + (!current ? ' active' : '');
    clearBtn.onclick = () => {
        localStorage.removeItem(key);
        q.syncro = null;
        refreshExplanationDynamic(q);
    };
    btnsWrap.appendChild(clearBtn);

    return panel;
}

function refreshExplanationDynamic(q) {
    document.getElementById('syncro-btn')?.remove();
    document.getElementById('syncro-tag-panel')?.remove();
    const box = document.getElementById('explanation-box');
    if (q.syncro?.pattern) box.appendChild(buildSyncroBtn(q));
    if (isTagMode())       box.appendChild(buildSyncroTagPanel(q));
}

function hideExplanation() {
    const box = document.getElementById('explanation-box');
    box.style.display = 'none';
    document.getElementById('syncro-btn')?.remove();
    document.getElementById('syncro-tag-panel')?.remove();
}

