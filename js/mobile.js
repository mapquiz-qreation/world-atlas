/**
 * js/mobile.js — スマホ向けボトムナビ・ボトムシート・問題オーバーレイ
 */

import { invalidateMapSize } from './map.js';

const BREAKPOINT = 768;
let sheetOwner   = null; // 現在シートに移動中の要素キー

function isMobile() {
    return window.innerWidth <= BREAKPOINT;
}

// ── question-box の移動 ──────────────────────────────────────
// #mobile-question-panel（地図の下の固定パネル）に移動することで
// タッチ貫通問題を根本解決し、ボタンも確実に表示できる
function moveQuestionBox() {
    const qBox  = document.getElementById('question-box');
    const panel = document.getElementById('mobile-question-panel');
    if (qBox && panel && qBox.parentElement !== panel) {
        qBox.classList.remove('in-map-overlay');
        panel.appendChild(qBox);
    }
}

function returnQuestionBox() {
    const qBox    = document.getElementById('question-box');
    const content = document.getElementById('sidebar-content');
    if (qBox && content && qBox.parentElement !== content) {
        qBox.classList.remove('in-map-overlay');
        content.prepend(qBox);
    }
}

// ── シートを閉じて要素を元の場所に戻す ──────────────────────
function returnToSidebar() {
    if (!sheetOwner) return;
    const controls = document.getElementById('sidebar-controls');
    const content  = document.getElementById('sidebar-content');

    if (sheetOwner === 'region' || sheetOwner === 'era') {
        const modeEl = document.getElementById('mode-selector');
        const eraEl  = document.getElementById('era-selector');
        if (controls) {
            const labels = controls.querySelectorAll('.section-label');
            if (labels[0]) labels[0].after(modeEl);
            if (labels[1]) labels[1].after(eraEl);
        }
    } else if (sheetOwner === 'rank') {
        const userPanel = document.getElementById('user-panel');
        if (content && userPanel) content.prepend(userPanel);
    }
    sheetOwner = null;
}

export function closeMobileSheet() {
    returnToSidebar();
    const sheet    = document.getElementById('mobile-sheet');
    const backdrop = document.getElementById('mobile-backdrop');
    if (sheet)    sheet.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
    document.querySelectorAll('.mob-tab').forEach(t => t.classList.remove('active'));
}

// ── シートを開いてコンテンツを表示 ──────────────────────────
function openSheet(tabName) {
    returnToSidebar();
    const sheet    = document.getElementById('mobile-sheet');
    const inner    = document.getElementById('mobile-sheet-inner');
    const backdrop = document.getElementById('mobile-backdrop');
    inner.innerHTML = '';

    if (tabName === 'region') {
        const l1 = makeLabel('🌍 REGION / 地域');
        const l2 = makeLabel('🕐 ERA / 時代', '12px');
        inner.append(l1, document.getElementById('mode-selector'), l2, document.getElementById('era-selector'));
        sheetOwner = 'region';
    } else if (tabName === 'era') {
        const l = makeLabel('🕐 ERA / 時代');
        inner.append(l, document.getElementById('era-selector'));
        sheetOwner = 'era';
    } else if (tabName === 'rank') {
        inner.appendChild(document.getElementById('user-panel'));
        sheetOwner = 'rank';
    }

    sheet.classList.add('open');
    backdrop.classList.add('active');
}

function makeLabel(text, marginTop = '0') {
    const el = document.createElement('div');
    el.className = 'section-label';
    el.style.marginTop = marginTop;
    el.textContent = text;
    return el;
}

// ── ボトムナビのセットアップ ─────────────────────────────────
function setupNav() {
    const tabs     = document.querySelectorAll('.mob-tab');
    const sheet    = document.getElementById('mobile-sheet');
    const backdrop = document.getElementById('mobile-backdrop');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const name    = tab.dataset.tab;
            const isOpen  = sheet.classList.contains('open');
            const wasMe   = tab.classList.contains('active');

            tabs.forEach(t => t.classList.remove('active'));

            if (name === 'quiz') { closeMobileSheet(); return; }
            if (wasMe && isOpen) { closeMobileSheet(); return; }

            tab.classList.add('active');
            openSheet(name);
        });
    });

    // backdrop は pointer-events: none のため不要（タブ再タップで閉じる）
}

// ── 公開エントリポイント ─────────────────────────────────────
// ── Leafletへのタッチ貫通を防ぐ（ナビ・シート用） ────────────
function blockLeafletTouch() {
    // ナビとシートは#mapの外にある → Leaflet公式のブロックを適用
    const targets = ['mobile-nav', 'mobile-sheet', 'mobile-backdrop'];
    targets.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (window.L && window.L.DomEvent) {
            window.L.DomEvent.disableClickPropagation(el);
            window.L.DomEvent.disableScrollPropagation(el);
        }
    });
    // question-box は #map の内側に移動済みなので Leaflet が自動認識する
}

export function initMobile() {
    if (isMobile()) moveQuestionBox();
    setupNav();

    // Leaflet 初期化後（DOMContentLoaded + initMap が完了している）に実行
    setTimeout(() => {
        blockLeafletTouch();
        invalidateMapSize();
    }, 150);

    window.addEventListener('resize', () => {
        if (isMobile()) {
            moveQuestionBox();
        } else {
            closeMobileSheet();
            returnQuestionBox();
        }
        setTimeout(invalidateMapSize, 100);
    });
}
