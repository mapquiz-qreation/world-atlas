import { state } from './state.js';
import { containerToContentPercent } from './map.js';

export function setupAdminPanel(startQuizCallback) {
    document.getElementById('map-container').addEventListener('click', function(e) {
        if (e.target.closest('.target-node') || e.target.closest('#map-reset-btn')) return;
        if (state.mapJustDragged) { state.mapJustDragged = false; return; }
        const p = containerToContentPercent(e.clientX, e.clientY);
        if (!p) return;
        state.lastClickedPos = { top: p.top, left: p.left };
        document.getElementById('selected-coord').innerText = `T:${p.top} L:${p.left}`;
        const pin = document.getElementById('admin-pin');
        pin.style.display = 'block';
        pin.style.top     = p.top;
        pin.style.left    = p.left;
    });

    document.getElementById('add-question-btn').addEventListener('click', function() {
        const t = document.getElementById('new-q-text').value.trim();
        if (!t || !state.lastClickedPos || !state.currentEra) {
            return alert('名前、場所、時代を確定させてね！');
        }
        const key = `quiz_added_${state.currentRegion}_${state.currentEra}`;
        const saved = JSON.parse(localStorage.getItem(key) || '[]');
        saved.push({ text: t, ...state.lastClickedPos });
        localStorage.setItem(key, JSON.stringify(saved));
        document.getElementById('new-q-text').value = '';
        startQuizCallback(state.currentRegion, state.currentEra);
    });

    document.getElementById('export-btn').addEventListener('click', function() {
        const fullData = JSON.parse(JSON.stringify(state.masterData));
        Object.keys(fullData).forEach(reg => {
            Object.keys(fullData[reg].eras).forEach(era => {
                const added = JSON.parse(localStorage.getItem(`quiz_added_${reg}_${era}`) || '[]');
                fullData[reg].eras[era].fixed = [...fullData[reg].eras[era].fixed, ...added];
            });
        });
        document.getElementById('export-area').value = JSON.stringify(fullData, null, 2);
    });
}
