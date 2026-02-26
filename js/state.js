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

    // 地図ズーム・ドラッグ用
    mapScale:       1,
    mapTranslateX:  0,
    mapTranslateY:  0,
    mapDragging:    false,
    mapDragStartX:  0,
    mapDragStartY:  0,
    mapDragStartTx: 0,
    mapDragStartTy: 0,
    mapJustDragged: false,
};
