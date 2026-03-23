#!/usr/bin/env node
/**
 * WorldAtlas データバリデーションスクリプト
 * 使い方: node scripts/validate_data.js
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

// ──────────────────────────────────────────────────────────────
// 各地域の緯度・経度の大まかな許容範囲
// ──────────────────────────────────────────────────────────────
const REGION_BOUNDS = {
  europe:        { latMin: 30,  latMax: 72,  lngMin: -30, lngMax: 50  },
  mideast:       { latMin: 10,  latMax: 45,  lngMin: 20,  lngMax: 75  },
  africa:        { latMin: -40, latMax: 40,  lngMin: -25, lngMax: 55  },
  india:         { latMin: 0,   latMax: 42,  lngMin: 55,  lngMax: 105 },
  china:         { latMin: 15,  latMax: 55,  lngMin: 70,  lngMax: 140 },
  southeast_asia:{ latMin: -15, latMax: 32,  lngMin: 88,  lngMax: 150 },
  north_america: { latMin: 10,  latMax: 75,  lngMin: -175,lngMax: -45 },
  latin_america: { latMin: -60, latMax: 20,  lngMin: -125,lngMax: -30 },
  world_wars:    { latMin: -90, latMax: 90,  lngMin: -180,lngMax: 180 },
  cold_war:      { latMin: -90, latMax: 90,  lngMin: -180,lngMax: 180 },
};

// ──────────────────────────────────────────────────────────────
// ユーティリティ
// ──────────────────────────────────────────────────────────────
let errorCount = 0;
let warnCount  = 0;
const errors = [];
const warns  = [];

function error(file, era, idx, msg) {
  errorCount++;
  errors.push(`  [ERROR] ${file} > ${era} #${idx}: ${msg}`);
}
function warn(file, era, idx, msg) {
  warnCount++;
  warns.push(`  [WARN]  ${file} > ${era} #${idx}: ${msg}`);
}

function inBounds(lat, lng, bounds) {
  return lat >= bounds.latMin && lat <= bounds.latMax
      && lng >= bounds.lngMin && lng <= bounds.lngMax;
}

// ──────────────────────────────────────────────────────────────
// バリデーション本体
// ──────────────────────────────────────────────────────────────
function validateFile(filePath, regionKey) {
  const raw = readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    errorCount++;
    errors.push(`  [ERROR] ${regionKey}: JSON パースエラー → ${e.message}`);
    return { total: 0, point: 0, area: 0 };
  }

  const bounds = REGION_BOUNDS[regionKey] ?? REGION_BOUNDS.cold_war;
  const allTexts = [];
  let total = 0, pointCount = 0, areaCount = 0;

  for (const [eraKey, era] of Object.entries(data.eras ?? {})) {
    const questions = era.fixed ?? [];

    questions.forEach((q, idx) => {
      total++;
      const label = `${eraKey}[${idx}]`;

      // ── 共通: text ──────────────────────────────────────────
      if (!q.text || typeof q.text !== 'string' || q.text.trim() === '') {
        error(regionKey, eraKey, idx, 'text が空または未定義');
      } else {
        // 重複チェック用に記録
        const key = `${eraKey}::${q.text.trim()}`;
        if (allTexts.includes(key)) {
          warn(regionKey, eraKey, idx, `text 重複: "${q.text}"`);
        } else {
          allTexts.push(key);
        }
      }

      // ── タイプ分岐 ──────────────────────────────────────────
      if (q.type === 'area') {
        areaCount++;
        validateArea(q, regionKey, eraKey, idx, bounds);
      } else {
        pointCount++;
        validatePoint(q, regionKey, eraKey, idx, bounds);
      }
    });
  }

  return { total, point: pointCount, area: areaCount };
}

function validatePoint(q, file, era, idx, bounds) {
  // lat / lng の存在と型
  if (q.lat === undefined || q.lat === null) {
    error(file, era, idx, 'lat が未定義');
    return;
  }
  if (q.lng === undefined || q.lng === null) {
    error(file, era, idx, 'lng が未定義');
    return;
  }
  if (typeof q.lat !== 'number') error(file, era, idx, `lat が数値でない: "${q.lat}"`);
  if (typeof q.lng !== 'number') error(file, era, idx, `lng が数値でない: "${q.lng}"`);

  // 緯度・経度の絶対的な範囲
  if (q.lat < -90 || q.lat > 90)   error(file, era, idx, `lat が範囲外: ${q.lat}`);
  if (q.lng < -180 || q.lng > 180) error(file, era, idx, `lng が範囲外: ${q.lng}`);

  // 地域ごとの範囲チェック
  if (typeof q.lat === 'number' && typeof q.lng === 'number') {
    if (!inBounds(q.lat, q.lng, bounds)) {
      warn(file, era, idx, `座標が地域範囲外 (lat:${q.lat}, lng:${q.lng}) — "${q.text}"`);
    }
  }

  // explanation なしは警告
  if (!q.explanation || q.explanation.trim() === '') {
    warn(file, era, idx, `explanation がない: "${q.text}"`);
  }

  // advancedText が text と同じなら警告
  if (q.advancedText && q.advancedText.trim() === q.text?.trim()) {
    warn(file, era, idx, `advancedText が text と同じ: "${q.text}"`);
  }
}

function validateArea(q, file, era, idx, bounds) {
  if (!Array.isArray(q.areas) || q.areas.length === 0) {
    error(file, era, idx, 'areas が空または配列でない');
    return;
  }

  const hasCorrect = q.areas.some(a => a.correct === true);
  if (!hasCorrect) {
    error(file, era, idx, 'areas に correct:true のエリアがない');
  }

  q.areas.forEach((area, ai) => {
    if (!area.label || area.label.trim() === '') {
      warn(file, era, idx, `areas[${ai}].label が空`);
    }
    if (!Array.isArray(area.latlngs) || area.latlngs.length < 3) {
      error(file, era, idx, `areas[${ai}].latlngs が3点未満`);
      return;
    }
    area.latlngs.forEach(([lat, lng], pi) => {
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        error(file, era, idx, `areas[${ai}].latlngs[${pi}] が数値でない`);
      }
    });
  });
}

// ──────────────────────────────────────────────────────────────
// メイン実行
// ──────────────────────────────────────────────────────────────
const files = readdirSync(DATA_DIR)
  .filter(f => f.endsWith('.json') && !f.startsWith('timeline') && f !== 'timeline.json')
  .filter(f => !f.includes('geojson'));

console.log('='.repeat(60));
console.log('  WorldAtlas データバリデーション');
console.log('='.repeat(60));

const summary = [];

for (const file of files) {
  const regionKey = file.replace('.json', '');
  const filePath  = join(DATA_DIR, file);
  const result    = validateFile(filePath, regionKey);
  summary.push({ file, ...result });
}

// ──────────────────────────────────────────────────────────────
// 結果出力
// ──────────────────────────────────────────────────────────────
console.log('\n📊 問題数サマリー');
console.log('-'.repeat(45));
let grandTotal = 0;
for (const s of summary) {
  console.log(`  ${s.file.padEnd(25)} 合計:${String(s.total).padStart(4)}問  (点:${s.point} / エリア:${s.area})`);
  grandTotal += s.total;
}
console.log('-'.repeat(45));
console.log(`  ${'総計'.padEnd(25)} 合計:${String(grandTotal).padStart(4)}問`);

if (errors.length > 0) {
  console.log(`\n❌ エラー (${errorCount}件)`);
  errors.forEach(e => console.log(e));
}

if (warns.length > 0) {
  console.log(`\n⚠️  警告 (${warnCount}件)`);
  warns.forEach(w => console.log(w));
}

console.log('\n' + '='.repeat(60));
if (errorCount === 0 && warnCount === 0) {
  console.log('✅ すべてのチェックをパスしました！');
} else {
  console.log(`結果: エラー ${errorCount}件 / 警告 ${warnCount}件`);
}
console.log('='.repeat(60));

process.exit(errorCount > 0 ? 1 : 0);
