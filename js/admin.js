/**
 * js/admin.js — Leaflet ベースの管理者ツール
 */

import { state }       from './state.js';
import { setupAdminClick, getMap, clearQuizLayer } from './map.js';

// ── エリアツール用の状態 ──────────────────────────────────────
let areaToolLatlngs = []; // 現在打ち込み中の頂点 [[lat, lng], ...]
let areaToolAreas   = []; // 確定済みエリア [{label, correct, color, latlngs}]

// プレビュー用 Leaflet レイヤー
let previewLayer  = null;
let adminPinLayer = null; // 点モード用ピン

const AREA_COLORS = [
    '#e53935', '#1e88e5', '#43a047', '#fb8c00',
    '#8e24aa', '#00acc1', '#6d4c41', '#546e7a',
];

// ── メイン setup ──────────────────────────────────────────────
export function setupAdminPanel(startQuizCallback) {
    // Leaflet クリックイベントで lat/lng を直接取得
    setupAdminClick((latlng) => {
        const areaTool = document.getElementById('area-tool');
        if (areaTool && areaTool.open) {
            addAreaVertex(latlng.lat, latlng.lng);
            return;
        }
        // 点モード
        handlePointClick(latlng);
    });

    // プレビュー用レイヤーグループを地図に追加
    const map = getMap();
    if (map) {
        previewLayer  = L.layerGroup().addTo(map);
        adminPinLayer = L.layerGroup().addTo(map);
    }

    // 点問題：一時保存
    document.getElementById('add-question-btn').addEventListener('click', () => {
        const t = document.getElementById('new-q-text').value.trim();
        if (!t || !state.lastClickedPos || !state.currentEra) {
            return alert('名前、場所、時代を確定させてね！');
        }
        const key   = `quiz_added_${state.currentRegion}_${state.currentEra}`;
        let saved = [];
        try { saved = JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) {}
        saved.push({ text: t, lat: state.lastClickedPos.lat, lng: state.lastClickedPos.lng });
        localStorage.setItem(key, JSON.stringify(saved));
        document.getElementById('new-q-text').value = '';
        adminPinLayer?.clearLayers();
        startQuizCallback(state.currentRegion, state.currentEra);
    });

    // JSON全エクスポート
    document.getElementById('export-btn').addEventListener('click', () => {
        const fullData = JSON.parse(JSON.stringify(state.masterData));
        Object.keys(fullData).forEach(reg => {
            Object.keys(fullData[reg].eras).forEach(era => {
                let added = [];
                try { added = JSON.parse(localStorage.getItem(`quiz_added_${reg}_${era}`) || '[]'); } catch (_) {}
                fullData[reg].eras[era].fixed = [...fullData[reg].eras[era].fixed, ...added];
            });
        });
        document.getElementById('export-area').value = JSON.stringify(fullData, null, 2);
    });

    setupAreaTool(startQuizCallback);
}

// ── 点モード ──────────────────────────────────────────────────
function handlePointClick(latlng) {
    state.lastClickedPos = { lat: latlng.lat, lng: latlng.lng };
    document.getElementById('selected-coord').innerText =
        `Lat: ${latlng.lat.toFixed(3)}, Lng: ${latlng.lng.toFixed(3)}`;

    // 管理ピンを地図に表示
    adminPinLayer?.clearLayers();
    L.marker([latlng.lat, latlng.lng], {
        icon: L.divIcon({
            className: 'admin-pin-icon',
            html: '📍',
            iconSize: [24, 24],
            iconAnchor: [12, 24],
        }),
    }).addTo(adminPinLayer);
}

// ── エリアツール ──────────────────────────────────────────────
function setupAreaTool(startQuizCallback) {
    // 頂点クリア
    document.getElementById('area-clear-btn').addEventListener('click', () => {
        areaToolLatlngs = [];
        document.getElementById('area-vertex-count').innerText = '0';
        updateAreaPreview();
    });

    // エリア確定
    document.getElementById('area-confirm-btn').addEventListener('click', () => {
        if (areaToolLatlngs.length < 3) return alert('頂点を3つ以上クリックしてください');
        const label = document.getElementById('area-label-input').value.trim();
        if (!label) return alert('ラベルを入力してください');
        const correct  = document.getElementById('area-correct-check').checked;
        const color    = document.getElementById('area-color-input').value;
        const latlngs  = areaToolLatlngs.map(p => [+p[0].toFixed(4), +p[1].toFixed(4)]);

        areaToolAreas.push({ label, correct, color, latlngs });
        areaToolLatlngs = [];
        document.getElementById('area-label-input').value      = '';
        document.getElementById('area-correct-check').checked  = false;
        document.getElementById('area-vertex-count').innerText = '0';
        document.getElementById('area-color-input').value =
            AREA_COLORS[areaToolAreas.length % AREA_COLORS.length];

        updateAreaList();
        updateAreaPreview();
    });

    // エリア問題として保存
    document.getElementById('area-save-btn').addEventListener('click', () => {
        if (areaToolAreas.length < 2)                  return alert('エリアを2つ以上確定してください');
        const corrects = areaToolAreas.filter(a => a.correct);
        if (corrects.length !== 1)                     return alert('正解エリアを1つだけチェックしてください');
        const text = document.getElementById('area-question-text').value.trim();
        if (!text)                                     return alert('問題文を入力してください');
        if (!state.currentEra)                         return alert('先に時代を選択してください');

        const key   = `quiz_added_${state.currentRegion}_${state.currentEra}`;
        let saved = [];
        try { saved = JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) {}
        saved.push({ type: 'area', text, areas: [...areaToolAreas] });
        localStorage.setItem(key, JSON.stringify(saved));

        // リセット
        areaToolAreas   = [];
        areaToolLatlngs = [];
        document.getElementById('area-question-text').value = '';
        updateAreaList();
        updateAreaPreview();
        alert('保存しました！');
        startQuizCallback(state.currentRegion, state.currentEra);
    });

    // 全リセット
    document.getElementById('area-reset-all-btn').addEventListener('click', () => {
        if (!confirm('作成中のエリアを全てリセットしますか？')) return;
        areaToolAreas   = [];
        areaToolLatlngs = [];
        document.getElementById('area-question-text').value   = '';
        document.getElementById('area-vertex-count').innerText = '0';
        updateAreaList();
        updateAreaPreview();
    });
}

// ── エリアツール内部 ──────────────────────────────────────────
function addAreaVertex(lat, lng) {
    areaToolLatlngs.push([lat, lng]);
    document.getElementById('area-vertex-count').innerText = areaToolLatlngs.length;
    updateAreaPreview();
}

function updateAreaList() {
    const list = document.getElementById('area-list');
    if (!list) return;
    if (areaToolAreas.length === 0) {
        list.innerHTML = '<span style="color:#aaa;">まだエリアなし</span>';
        return;
    }
    list.innerHTML = areaToolAreas.map((a, i) => `
        <div style="display:flex; align-items:center; gap:4px; margin:2px 0;">
            <span style="background:${a.color}; width:10px; height:10px; border-radius:2px; flex-shrink:0;"></span>
            <span>${a.label}${a.correct ? ' ✓' : ''}</span>
            <button data-idx="${i}" class="area-remove-btn"
                style="margin-left:auto; font-size:8px; color:#d32f2f; background:none; border:none; cursor:pointer;">✕</button>
        </div>`
    ).join('');

    list.querySelectorAll('.area-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            areaToolAreas.splice(parseInt(btn.dataset.idx), 1);
            updateAreaList();
            updateAreaPreview();
        });
    });
}

function updateAreaPreview() {
    if (!previewLayer) return;
    previewLayer.clearLayers();

    // 確定済みエリアをプレビュー表示
    areaToolAreas.forEach(area => {
        const poly = L.polygon(area.latlngs, {
            color:       area.color,
            weight:      1.5,
            fillColor:   area.color,
            fillOpacity: 0.25,
            dashArray:   null,
        }).addTo(previewLayer);

        const center = getCenter(area.latlngs);
        L.tooltip({ permanent: true, direction: 'center', className: 'area-label-tooltip' })
            .setContent(area.label)
            .setLatLng(center)
            .addTo(previewLayer);
    });

    // 打ち込み中のポリゴン（破線）
    if (areaToolLatlngs.length >= 3) {
        const color = document.getElementById('area-color-input')?.value || '#ffff00';
        L.polygon(areaToolLatlngs, {
            color:     color,
            weight:    1,
            fillColor: color,
            fillOpacity: 0.15,
            dashArray: '6,4',
        }).addTo(previewLayer);
    }

    // 頂点ドット
    const color = document.getElementById('area-color-input')?.value || '#ffff00';
    areaToolLatlngs.forEach(([lat, lng]) => {
        L.circleMarker([lat, lng], {
            radius:      5,
            color:       color,
            fillColor:   color,
            fillOpacity: 0.8,
            weight:      1,
        }).addTo(previewLayer);
    });
}

// [[lat, lng], ...] の重心を返す
function getCenter(latlngs) {
    const n   = latlngs.length;
    const lat = latlngs.reduce((s, p) => s + p[0], 0) / n;
    const lng = latlngs.reduce((s, p) => s + p[1], 0) / n;
    return L.latLng(lat, lng);
}
