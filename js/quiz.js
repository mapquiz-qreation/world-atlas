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
function showPointQuestion(q) {
    const layer  = getQuizLayer();
    const others = shuffle(
        state.questions.filter(o => o.text !== q.text && o.type !== 'area')
    );
    const choiceCount = Math.min(3, others.length);
    const choices     = shuffle([{ ...q, correct: true }, ...others.slice(0, choiceCount)]);

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
                showExplanation(q);
            } else {
                marker.setStyle({ fillColor: '#9e9e9e', fillOpacity: 0.4 });
                document.getElementById('result').innerText = '❌ 不正解';
                recordAnswer(q, false);
                highlightCorrectMarker(layer, q);
            }
            document.getElementById('next-btn').style.display = 'block';
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
                showExplanation(q);
                polygon._labelTooltip?.setOpacity(1);
            } else {
                polygon.setStyle({ fillOpacity: 0.1, weight: 0.5 });
                document.getElementById('result').innerText = '❌ 不正解';
                recordAnswer(q, false);
                polygon._labelTooltip?.setOpacity(1);
                highlightCorrectArea(layer);
            }
            document.getElementById('next-btn').style.display = 'block';
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
    state.currentIdx = (state.currentIdx + 1) % state.questions.length;
    showQuestion();
}

// ── 解説・関連用語表示 ─────────────────────────────────────────
function showExplanation(q) {
    const box = document.getElementById('explanation-box');
    const textEl = document.getElementById('explanation-text');
    const termsEl = document.getElementById('related-terms');
    if (!q.explanation && (!q.relatedTerms || q.relatedTerms.length === 0)) {
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
    box.style.display = 'block';
}

function hideExplanation() {
    const box = document.getElementById('explanation-box');
    box.style.display = 'none';
}
