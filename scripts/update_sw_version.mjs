/**
 * Service Worker のキャッシュバージョンを自動更新するスクリプト
 *
 * キャッシュ対象ファイルの内容を SHA-1 でハッシュ化し、
 * sw.js の CACHE_NAME を自動で書き換える。
 * ファイルが変わったときだけキャッシュが無効になる。
 *
 * 実行: node scripts/update_sw_version.mjs
 * デプロイ前に必ず実行すること（または npm run update-sw）
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// sw.js の SHELL_ASSETS と同じファイル一覧
const TRACKED = [
    'index.html',
    'timeline.html',
    'style.css',
    'manifest.json',
    'js/main.js',
    'js/quiz.js',
    'js/map.js',
    'js/state.js',
    'js/config.js',
    'js/user.js',
    'js/ranking.js',
    'js/srs.js',
    'js/scope.js',
    'js/shuffle.js',
    'js/mobile.js',
    'js/admin.js',
    'js/timeattack.js',
    'data/europe.json',
    'data/mideast.json',
    'data/africa.json',
    'data/india.json',
    'data/china.json',
    'data/southeast_asia.json',
    'data/north_america.json',
    'data/latin_america.json',
    'data/world_wars.json',
    'data/cold_war.json',
    'data/timeline.json',
];

// ── ハッシュ計算 ──────────────────────────────────────────────
const hash = createHash('sha1');
let missing = [];

for (const f of TRACKED) {
    const fullPath = join(ROOT, f);
    if (!existsSync(fullPath)) {
        missing.push(f);
        continue;
    }
    hash.update(readFileSync(fullPath));
}

const shortHash = hash.digest('hex').slice(0, 8);
const newVersion = `worldatlas-${shortHash}`;

// ── sw.js の CACHE_NAME を書き換え ───────────────────────────
const swPath = join(ROOT, 'sw.js');
const swSrc  = readFileSync(swPath, 'utf8');
const oldMatch = swSrc.match(/const CACHE_NAME = '([^']+)';/);
const oldVersion = oldMatch ? oldMatch[1] : '(不明)';

if (oldVersion === newVersion) {
    console.log(`✅ CACHE_NAME はすでに最新です: ${newVersion}`);
} else {
    const newSrc = swSrc.replace(
        /const CACHE_NAME = '[^']+';/,
        `const CACHE_NAME = '${newVersion}';`
    );
    writeFileSync(swPath, newSrc, 'utf8');
    console.log(`✅ CACHE_NAME を更新しました`);
    console.log(`   ${oldVersion}  →  ${newVersion}`);
}

if (missing.length > 0) {
    console.warn(`⚠  存在しないファイル（ハッシュをスキップ）:`);
    missing.forEach(f => console.warn(`   - ${f}`));
}
