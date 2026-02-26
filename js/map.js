import { state } from './state.js';

export function applyMapTransform() {
    const content = document.getElementById('map-content');
    content.style.transform =
        `translate(${state.mapTranslateX}px, ${state.mapTranslateY}px) scale(${state.mapScale})`;
}

export function containerToContentPercent(clientX, clientY) {
    const container = document.getElementById('map-container');
    const content   = document.getElementById('map-content');
    const rect = container.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    const cw = content.offsetWidth;
    const ch = content.offsetHeight;
    if (!cw || !ch) return null;
    const contentX = (cx - state.mapTranslateX) / state.mapScale;
    const contentY = (cy - state.mapTranslateY) / state.mapScale;
    return {
        top:  (contentY / ch * 100).toFixed(1) + '%',
        left: (contentX / cw * 100).toFixed(1) + '%',
    };
}

export function resetMapView() {
    state.mapScale      = 1;
    state.mapTranslateX = 0;
    state.mapTranslateY = 0;
    applyMapTransform();
}

export function setupMapZoomPan() {
    const container = document.getElementById('map-container');
    const MIN_SCALE = 0.5, MAX_SCALE = 3;

    container.addEventListener('wheel', function(e) {
        e.preventDefault();
        const rect   = container.getBoundingClientRect();
        const cx     = e.clientX - rect.left;
        const cy     = e.clientY - rect.top;
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, state.mapScale * factor));
        const contentX = (cx - state.mapTranslateX) / state.mapScale;
        const contentY = (cy - state.mapTranslateY) / state.mapScale;
        state.mapTranslateX = cx - contentX * newScale;
        state.mapTranslateY = cy - contentY * newScale;
        state.mapScale = newScale;
        applyMapTransform();
    }, { passive: false });

    container.addEventListener('mousedown', function(e) {
        if (e.target.closest('.target-node') || e.target.closest('#map-reset-btn')) return;
        state.mapDragging    = true;
        state.mapJustDragged = false;
        state.mapDragStartX  = e.clientX;
        state.mapDragStartY  = e.clientY;
        state.mapDragStartTx = state.mapTranslateX;
        state.mapDragStartTy = state.mapTranslateY;
        container.classList.add('dragging');
    });

    document.addEventListener('mousemove', function(e) {
        if (!state.mapDragging) return;
        state.mapTranslateX  = state.mapDragStartTx + (e.clientX - state.mapDragStartX);
        state.mapTranslateY  = state.mapDragStartTy + (e.clientY - state.mapDragStartY);
        state.mapJustDragged = true;
        applyMapTransform();
    });

    document.addEventListener('mouseup', function() {
        if (state.mapDragging) container.classList.remove('dragging');
        state.mapDragging = false;
    });

    container.addEventListener('touchstart', function(e) {
        if (e.target.closest('.target-node') || e.target.closest('#map-reset-btn')) return;
        if (e.touches.length === 1) {
            state.mapDragging    = true;
            state.mapJustDragged = false;
            state.mapDragStartX  = e.touches[0].clientX;
            state.mapDragStartY  = e.touches[0].clientY;
            state.mapDragStartTx = state.mapTranslateX;
            state.mapDragStartTy = state.mapTranslateY;
        }
    }, { passive: true });

    container.addEventListener('touchmove', function(e) {
        if (state.mapDragging && e.touches.length === 1) {
            e.preventDefault();
            state.mapTranslateX  = state.mapDragStartTx + (e.touches[0].clientX - state.mapDragStartX);
            state.mapTranslateY  = state.mapDragStartTy + (e.touches[0].clientY - state.mapDragStartY);
            state.mapJustDragged = true;
            applyMapTransform();
        }
    }, { passive: false });

    container.addEventListener('touchend', function() {
        state.mapDragging = false;
    });

    document.getElementById('map-reset-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        resetMapView();
    });
}
