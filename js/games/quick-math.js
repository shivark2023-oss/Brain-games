import { h, rand, pick, hud, flash, vibrate, timedAccuracy } from './kit.js';

const SECONDS = 60;

const add = (max) => { const a = rand(1, max), b = rand(1, max); return { text: `${a} + ${b}`, answer: a + b }; };
const sub = (max) => { const a = rand(2, max), b = rand(1, a - 1); return { text: `${a} − ${b}`, answer: a - b }; };
const mul = (amax, bmax, amin = 2, bmin = 2) => { const a = rand(amin, amax), b = rand(bmin, bmax); return { text: `${a} × ${b}`, answer: a * b }; };
const div = (dmax, qmax) => { const d = rand(2, dmax), q = rand(2, qmax); return { text: `${d * q} ÷ ${d}`, answer: q }; };
const mulAdd = () => {
  const a = rand(2, 9), b = rand(2, 9), c = rand(2, 20);
  return Math.random() < 0.5
    ? { text: `${a} × ${b} + ${c}`, answer: a * b + c }
    : (a * b > c ? { text: `${a} × ${b} − ${c}`, answer: a * b - c } : { text: `${a} × ${b} + ${c}`, answer: a * b + c });
};
const groupMul = () => { const a = rand(2, 15), b = rand(2, 15), c = rand(2, 9); return { text: `(${a} + ${b}) × ${c}`, answer: (a + b) * c }; };

const BY_LEVEL = [
  () => add(10),
  () => pick([() => add(20), () => sub(20)])(),
  () => pick([() => add(50), () => sub(50), () => mul(5, 10)])(),
  () => pick([() => add(100), () => sub(100), () => mul(10, 10)])(),
  () => pick([() => sub(100), () => mul(25, 9, 11), () => div(9, 12)])(),
  () => pick([() => add(500), () => sub(500), () => mul(25, 9, 11), () => div(12, 12)])(),
  () => pick([mulAdd, () => div(12, 15), () => mul(50, 9, 12)])(),
  () => pick([mulAdd, () => mul(19, 19, 11, 11), () => div(15, 20)])(),
  () => pick([mulAdd, groupMul, () => mul(25, 19, 11, 11), () => sub(1000)])(),
  () => pick([groupMul, () => mul(49, 19, 12, 12), () => div(25, 25), () => add(1000)])(),
];

export function makeProblem(level) {
  return BY_LEVEL[Math.min(level, 10) - 1]();
}

export default {
  id: 'quick-math',
  name: 'Quick Math',
  skill: 'math',
  howTo: 'Solve as many problems as you can. Your answer is checked as soon as you type enough digits. 60 seconds.',
  create(root, { level, onFinish }) {
    const target = 10 + level;
    let correct = 0;
    let attempts = 0;
    let problem = null;
    let typed = '';
    let done = false;

    const timer = hud(SECONDS);
    const question = h('div', { class: 'math-q' });
    const entry = h('div', { class: 'math-a' });
    const card = h('div', { class: 'card' }, question, entry);
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) =>
      h('button', { class: 'key', onclick: () => press(k) }, k));
    root.append(timer.el, card, h('div', { class: 'keypad' }, keys));

    function next() {
      problem = makeProblem(level);
      typed = '';
      question.textContent = `${problem.text} =`;
      entry.textContent = '?';
    }

    function press(k) {
      if (done) return;
      if (k === 'C') typed = '';
      else if (k === '⌫') typed = typed.slice(0, -1);
      else typed += k;
      entry.textContent = typed || '?';
      const want = String(problem.answer);
      if (typed.length === want.length) {
        attempts += 1;
        const ok = typed === want;
        if (ok) correct += 1; else vibrate(false);
        flash(card, ok);
        timer.setInfo(`✓ ${correct}`);
        next();
      }
    }

    timer.setInfo('✓ 0');
    next();
    timer.start(() => {
      done = true;
      onFinish({ accuracy: timedAccuracy(correct, attempts, target), score: correct, summary: `${correct} correct of ${attempts}` });
    });
    return () => { done = true; timer.stop(); };
  },
};
