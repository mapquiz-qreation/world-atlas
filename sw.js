/**
 * WorldAtlas Service Worker
 * キャッシュファーストで動作し、オフラインでも地図クイズの基本UIが動く
 */

const CACHE_NAME = 'worldatlas-50a7def4';

// アプリシェル（優先キャッシュ対象）
const SHELL_ASSETS = [
    './',
    './index.html',
    './timeline.html',
    './style.css',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './js/main.js',
    './js/quiz.js',
    './js/map.js',
    './js/state.js',
    './js/config.js',
    './js/user.js',
    './js/ranking.js',
    './js/srs.js',
    './js/scope.js',
    './js/shuffle.js',
    './js/mobile.js',
    './js/admin.js',
    './js/timeattack.js',
    './data/europe.json',
    './data/mideast.json',
    './data/africa.json',
    './data/india.json',
    './data/china.json',
    './data/southeast_asia.json',
    './data/north_america.json',
    './data/latin_america.json',
    './data/world_wars.json',
    './data/cold_war.json',
    './data/timeline.json',
];

// インストール時：シェルをキャッシュ
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(SHELL_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// アクティベート時：古いキャッシュを削除
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// ── フェッチ戦略 ──────────────────────────────────────────
// HTML        → ネットワーク優先（常に最新版を返す。オフライン時のみキャッシュ）
// JS/CSS/JSON → Stale-while-revalidate（キャッシュを即返しつつ裏で更新）
// 地図タイル  → ネットワーク優先
// GAS API     → キャッシュしない
self.addEventListener('fetch', event => {
    if (event.request.url.includes('script.google.com')) return;

    if (event.request.url.includes('tile.openstreetmap.org')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    const url = new URL(event.request.url);
    const isHTML = event.request.mode === 'navigate'
        || url.pathname.endsWith('.html')
        || url.pathname.endsWith('/');

    if (isHTML) {
        // HTML: ネットワーク優先 → 失敗時キャッシュ
        event.respondWith(
            fetch(event.request).then(response => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => caches.match(event.request))
        );
        return;
    }

    // その他: Stale-while-revalidate（キャッシュを即返し＋裏で更新）
    event.respondWith(
        caches.match(event.request).then(cached => {
            const networkFetch = fetch(event.request).then(response => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            });
            return cached || networkFetch;
        })
    );
});
