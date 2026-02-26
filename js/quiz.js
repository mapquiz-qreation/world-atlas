import { state } from './state.js';
import { shuffle } from './shuffle.js';
import { addPoint } from './user.js';

export function showQuestion() {
    if (!state.questions.length) return;
    state.isAnswered = false;
    const q = state.questions[state.currentIdx];
    document.getElementById('q-text').innerText        = q.text;
    document.getElementById('result').innerText        = '';
    document.getElementById('next-btn').style.display  = 'none';

    const container = document.getElementById('node-container');
    container.innerHTML = '';

    const others      = shuffle(state.questions.filter(o => o.text !== q.text));
    const choiceCount = Math.min(3, others.length);
    const choices     = shuffle([{ ...q, correct: true }, ...others.slice(0, choiceCount)]);

    choices.forEach(c => {
        const n = document.createElement('div');
        n.className  = 'target-node';
        n.style.top  = c.top;
        n.style.left = c.left;
        if (c.correct) n.dataset.isCorrect = 'true';

        n.onclick = (e) => {
            e.stopPropagation();
            if (state.isAnswered) return;
            state.isAnswered = true;
            if (c.correct) {
                n.classList.add('correct');
                document.getElementById('result').innerText = '⭕ 正解！';
                addPoint();
            } else {
                n.classList.add('wrong');
                document.getElementById('result').innerText = '❌ 不正解';
                highlightCorrect();
            }
            document.getElementById('next-btn').style.display = 'block';
        };
        container.appendChild(n);
    });
}

export function highlightCorrect() {
    document.querySelectorAll('.target-node').forEach(n => {
        if (n.dataset.isCorrect === 'true') n.classList.add('highlight');
    });
}

export function nextQuestion() {
    state.currentIdx = (state.currentIdx + 1) % state.questions.length;
    showQuestion();
}
