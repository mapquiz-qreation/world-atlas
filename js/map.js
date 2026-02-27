/**
 * js/map.js — Leaflet ベースのマップ初期化・操作
 */

import { state } from './state.js';

// ── 内部変数 ────────────────────────────────────────────────
let map          = null;   // L.Map インスタンス
let quizLayer    = null;   // クイズマーカー用 LayerGroup
let adminClickCb = null;   // 管理者クリックコールバック (latlng) => void

// 地図スタイル定数
const BASE_STYLE = {
    color:       '#555',
    weight:      0.8,
    fillColor:   '#c8d8a0',
    fillOpacity: 0.6,
};

const RIVER_STYLE = {
    color:   '#4fc3f7',
    weight:  0.7,
    opacity: 0.7,
};

// ── 初期化 ──────────────────────────────────────────────────
export async function initMap() {
    map = L.map('map', {
        zoomControl:       true,
        attributionControl: true,
        minZoom: 2,
        maxZoom: 10,
        worldCopyJump: true,
    });

    // デフォルト表示: 全体（ユーラシア中心）
    map.setView([30, 50], 2);

    // Natural Earth ベースレイヤー
    await loadBaseLayer();

    // 河川レイヤー（任意）
    loadRiversLayer();

    // クイズ用レイヤーグループ
    quizLayer = L.layerGroup().addTo(map);
    state.quizLayer = quizLayer;

    // 管理者クリックハンドラー
    map.on('click', (e) => {
        if (typeof adminClickCb === 'function') {
            adminClickCb(e.latlng);
        }
    });

    state.map = map;
}

async function loadBaseLayer() {
    try {
        const res  = await fetch('data/ne/countries.geojson');
        const data = await res.json();
        L.geoJSON(data, {
            style:         BASE_STYLE,
            onEachFeature: (feature, layer) => {
                // 管理者ツール用に国名 tooltip（hover 時）
                const name = feature.properties?.NAME || feature.properties?.name;
                if (name) layer.bindTooltip(name, { permanent: false, className: 'map-tooltip' });
            },
        }).addTo(map);
    } catch (e) {
        console.warn('countries.geojson の読み込みに失敗:', e);
    }
}

async function loadRiversLayer() {
    try {
        const res  = await fetch('data/ne/rivers.geojson');
        const data = await res.json();
        L.geoJSON(data, { style: RIVER_STYLE }).addTo(map);
    } catch (e) {
        console.warn('rivers.geojson の読み込みに失敗:', e);
    }
}

// ── デフォルト表示に戻す ──────────────────────────────────────
export function resetMapView() {
    if (!map) return;
    map.flyTo([30, 50], 2, { animate: true, duration: 0.6 });
}

// ── 地域ジャンプ ─────────────────────────────────────────────
/**
 * @param {[[number,number],[number,number]]} bounds  [[minLat,minLng],[maxLat,maxLng]]
 */
export function flyToRegion(bounds) {
    if (!map) return;
    map.fitBounds(bounds, { animate: true, duration: 0.6 });
}

// ── クイズレイヤー操作 ────────────────────────────────────────
export function clearQuizLayer() {
    if (quizLayer) quizLayer.clearLayers();
}

export function getQuizLayer() {
    return quizLayer;
}

// ── 管理者クリック ───────────────────────────────────────────
/**
 * 管理者クリックコールバックを設定する
 * @param {(latlng: L.LatLng) => void} cb
 */
export function setupAdminClick(cb) {
    adminClickCb = cb;
}

export function removeAdminClick() {
    adminClickCb = null;
}

// ── マップインスタンス取得 ────────────────────────────────────
export function getMap() {
    return map;
}
