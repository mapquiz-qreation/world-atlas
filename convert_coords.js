/**
 * convert_coords.js
 * 各地域 JSON の top%/left% 座標を lat/lng に変換するスクリプト
 *
 * 各地域の変換式は既存データの都市座標から逆算した線形近似
 * 実行: node convert_coords.js
 */

const fs   = require('fs');
const path = require('path');

// ── 地域ごとの逆変換係数 ─────────────────────────────────────
// top%  = topRef  - (lat - latRef)  * scaleV
// left% = leftRef + (lng - lngRef)  * scaleH
// → lat = latRef  - (top  - topRef)  / scaleV
// → lng = lngRef  + (left - leftRef) / scaleH

const CALIBRATION = {
    europe: {
        latRef: 41.9, topRef:  42.2, scaleV: 3.6,
        lngRef: 12.5, leftRef: 47.0, scaleH: 1.929,
    },
    china: {
        latRef: 39.9, topRef:  44.2, scaleV: 2.607,
        lngRef: 116.4, leftRef: 69.1, scaleH: 1.627,
    },
    mideast: {
        latRef: 33.5, topRef:  36.9, scaleV: 2.769,
        lngRef: 36.3, leftRef: 33.2, scaleH: 2.173,
    },
    india: {
        latRef: 28.6, topRef:  27.5, scaleV: 3.587,
        lngRef: 77.2, leftRef: 33.9, scaleH: 3.129,
    },
    southeast_asia: {
        latRef: 13.4, topRef:  23.9, scaleV: 3.194,
        lngRef: 103.9, leftRef: 37.9, scaleH: 3.103,
    },
    north_america: {
        latRef: 42.4, topRef:  22.8, scaleV: 4.415,
        lngRef: -71.1, leftRef: 93.0, scaleH: 1.675,
    },
    latin_america: {
        latRef: 19.43, topRef: 16.7, scaleV: 0.997,
        lngRef: -99.13, leftRef: 22.5, scaleH: 1.191,
    },
};

// 地域ごとの表示 bounds (Leaflet fitBounds 用)
const BOUNDS = {
    europe:        [[25, -15], [70, 45]],
    mideast:       [[12, 25],  [45, 65]],
    india:         [[5,  65],  [38, 95]],
    china:         [[15, 70],  [55, 140]],
    southeast_asia:[[-10, 95], [25, 140]],
    north_america: [[20, -130],[60, -55]],
    latin_america: [[-55, -85],[25, -30]],
};

function pctToNum(str) {
    return parseFloat(str.replace('%', ''));
}

function convertPoint(top, left, cal) {
    const t = pctToNum(top);
    const l = pctToNum(left);
    const lat = cal.latRef - (t - cal.topRef) / cal.scaleV;
    const lng = cal.lngRef + (l - cal.leftRef) / cal.scaleH;
    return { lat: +lat.toFixed(4), lng: +lng.toFixed(4) };
}

// "left%,top% left%,top% ..." → [[lat,lng], ...]
function convertPolygonPoints(pointsStr, cal) {
    return pointsStr.trim().split(/\s+/).map(pair => {
        const [lStr, tStr] = pair.split(',');
        const l = parseFloat(lStr);
        const t = parseFloat(tStr);
        const lat = cal.latRef - (t - cal.topRef) / cal.scaleV;
        const lng = cal.lngRef + (l - cal.leftRef) / cal.scaleH;
        return [+lat.toFixed(4), +lng.toFixed(4)];
    });
}

function convertQuestion(q, cal) {
    const out = { ...q };

    // 点問題
    if (q.top !== undefined && q.left !== undefined) {
        const { lat, lng } = convertPoint(q.top, q.left, cal);
        out.lat = lat;
        out.lng = lng;
        delete out.top;
        delete out.left;
    }

    // エリア問題
    if (q.type === 'area' && Array.isArray(q.areas)) {
        out.areas = q.areas.map(area => {
            const a = { ...area };
            if (a.points) {
                a.latlngs = convertPolygonPoints(a.points, cal);
                delete a.points;
            }
            return a;
        });
    }

    return out;
}

const dataDir = path.join(__dirname, 'data');
const regions = Object.keys(CALIBRATION);

regions.forEach(region => {
    const filePath = path.join(dataDir, `${region}.json`);
    if (!fs.existsSync(filePath)) {
        console.warn(`Skip (not found): ${filePath}`);
        return;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const cal  = CALIBRATION[region];

    // img → bounds
    delete data.img;
    data.bounds = BOUNDS[region];

    // 各時代の questions を変換
    Object.keys(data.eras).forEach(eraKey => {
        const era = data.eras[eraKey];
        if (Array.isArray(era.fixed)) {
            era.fixed = era.fixed.map(q => convertQuestion(q, cal));
        }
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Converted: ${region}.json`);
});

console.log('\nAll done!');
