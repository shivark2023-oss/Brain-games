import { h, rand, pick, shuffle, hud, flash, vibrate } from './kit.js';

const QUESTIONS = 8;
const SECONDS_EACH = 15;
const SHOWN = 5;

// Each generator returns the first SHOWN + 1 terms of a sequence.
const PATTERNS = [
  { from: 1, gen: () => { const a = rand(1, 20), d = rand(2, 9); return terms((i) => a + d * i); } },
  { from: 2, gen: () => { const d = rand(2, 9), a = rand(d * 6, d * 6 + 30); return terms((i) => a - d * i); } },
  { from: 3, gen: () => { const a = rand(1, 5), r = pick([2, 3]); return terms((i) => a * r ** i); } },
  { from: 4, gen: () => { const a = rand(1, 10), d = rand(1, 3); return terms((i) => a + d * (i * (i + 1)) / 2); } },
  { from: 5, gen: () => { const a = rand(10, 30), up = rand(3, 9), down = rand(1, up - 1); return seq(a, (x, i) => (i % 2 ? x - down : x + up)); } },
  { from: 6, gen: () => { const s = rand(1, 6); return terms((i) => (s + i) ** 2); } },
  { from: 7, gen: () => { const a = rand(1, 5), b = rand(2, 6); return fib(a, b); } },
  { from: 8, gen: () => { const a = rand(1, 9), da = rand(2, 5), b = rand(20, 40), db = rand(2, 5); return terms((i) => (i % 2 ? b - db * ((i - 1) / 2) : a + da * (i / 2))); } },
  { from: 9, gen: () => { const a = rand(1, 4), k = pick([2, 3]), c = rand(1, 3); return seq(a, (x) => x * k + c); } },
];

function terms(f) { return Array.from({ length: SHOWN + 1 }, (_, i) => f(i)); }
function seq(a, step) { const out = [a]; while (out.length < SHOWN + 1) out.push(step(out.at(-1), out.length - 1)); return out; }
function fib(a, b) { const out = [a, b]; while (out.length < SHOWN + 1) out.push(out.at(-1) + out.at(-2)); return out; }

export function makePattern(level) {
  // Favour the newest pattern types unlocked at this level, but keep a mix.
  const open = PATTERNS.filter((p) => p.from <= level);
  const recent = open.slice(-3);
  const all = (Math.random() < 0.7 ? pick(recent) : pick(open)).gen();
  const answer = all[SHOWN];
  const diff = Math.abs(all[SHOWN] - all[SHOWN - 1]) || 1;
  const candidates = [answer + 1, answer - 1, answer + 2, answer - diff, answer + diff, answer + 10, answer - 2, answer * 2];
  const distractors = shuffle([...new Set(candidates)].filter((n) => n !== answer && n >= 0)).slice(0, 3);
  return { shown: all.slice(0, SHOWN), answer, options: shuffle([answer, ...distractors]) };
}

export default {
  id: 'number-pattern',
  name: 'Number Pattern',
  skill: 'math',
  howTo: 'Find the number that comes next in the sequence. 8 questions, 15 seconds each.',
  create(root, { level, onFinish }) {
    let q = 0;
    let correct = 0;
    let bonus = 0;
    let done = false;
    let timer = null;
    let current = null;

    const holder = h('div');
    const seqEl = h('div', { class: 'sequence' });
    const card = h('div', { class: 'card' }, seqEl);
    const choices = h('div', { class: 'choices' });
    root.append(holder, card, choices);

    function next() {
      if (done) return;
      if (q === QUESTIONS) {
        done = true;
        onFinish({ accuracy: correct / QUESTIONS, score: correct * 10 + bonus, summary: `${correct} of ${QUESTIONS} correct` });
        return;
      }
      q += 1;
      current = makePattern(level);
      seqEl.replaceChildren(...current.shown.map((n) => h('span', {}, n)), h('span', { class: 'next' }, '?'));
      choices.replaceChildren(...current.options.map((n) => h('button', { class: 'choice', onclick: () => answer(n) }, n)));
      timer?.stop();
      timer = hud(SECONDS_EACH);
      timer.setInfo(`Question ${q}/${QUESTIONS}`);
      holder.replaceChildren(timer.el);
      current.started = performance.now();
      timer.start(() => answer(null));
    }

    function answer(n) {
      if (done) return;
      timer.stop();
      const ok = n === current.answer;
      if (ok) {
        correct += 1;
        bonus += Math.max(0, Math.round(SECONDS_EACH - (performance.now() - current.started) / 1000));
      } else vibrate(false);
      flash(card, ok);
      next();
    }

    next();
    return () => { done = true; timer?.stop(); };
  },
};
