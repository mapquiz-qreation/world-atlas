// アプリ全体で共有する可変状態
// 各モジュールはこのオブジェクトを import して読み書きする
export const state = {
    masterData:     {},
    currentUser:    null,
    currentRegion:  '',
    currentEra:     '',
    questions:      [],
    currentIdx:     0,
    isAnswered:     false,
    lastClickedPos: null,

    // Leaflet インスタンス（map.js が設定）
    map:        null,
    quizLayer:  null,
};
