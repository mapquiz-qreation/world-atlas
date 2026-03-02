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

    // 忘却曲線（SRS）データ
    srsData:        {},
    isReviewMode:   false,

    // 1周の正誤追跡
    missedQuestions: [],  // 今の周で間違えた問題

    // 有料プラン
    isPaid:         false,

    // タイムアタック
    timeAttack: {
        active:     false,
        score:      0,
        total:      0,
        streak:     0,
        bestStreak: 0,
        minutes:    0,
        onAnswer:   null,
    },

    // Leaflet インスタンス（map.js が設定）
    map:        null,
    quizLayer:  null,
};
