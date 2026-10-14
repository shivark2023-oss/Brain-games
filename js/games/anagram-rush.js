import { h, pick, shuffle, hud, flash, vibrate, timedAccuracy } from './kit.js';
import { ANAGRAM_WORDS } from '../data/words.js';

const SECONDS = 60;

export function wordLength(level) {
  return level <= 2 ? 4 : level <= 4 ? 5 : level <= 7 ? 6 : 7;
}

export function scramble(word) {
  let s = word;
  while (s === word) s = shuffle([...word]).join('');
  return s;
}

export default {
  id: 'anagram-rush',
  name: 'Anagram Rush',
  skill: 'words',
  howTo: 'Tap the letters in order to spell the hidden word. Skip if you are stuck. 60 seconds.',
  create(root, { level, onFinish }) {
    const len = wordLength(level);
    const target = { 4: 6, 5: 5, 6: 4, 7: 3 }[len];
    const pool = shuffle(ANAGRAM_WORDS[len]);
    let solved = 0;
    let skipped = 0;
    let word = '';
    let picked = [];
    let done = false;

    const timer = hud(SECONDS);
    const slots = h('div', { class: 'slots' });
    const letters = h('div', { class: 'letters' });
    const card = h('div', { class: 'card' }, slots);
    const controls = h('div', { class: 'row' },
      h('button', { class: 'btn ghost', onclick: undo }, '⌫ Undo'),
      h('button', { class: 'btn ghost', onclick: skip }, 'Skip →'));
    root.append(timer.el, card, letters, controls);

    function next() {
      word = pool.length ? pool.pop() : pick(ANAGRAM_WORDS[len]);
      picked = [];
      letters.replaceChildren(...[...scramble(word)].map((ch) => {
        const b = h('button', { class: 'letter' }, ch);
        b.addEventListener('click', () => choose(b));
        return b;
      }));
      render();
    }

    function render() {
      slots.replaceChildren(...[...word].map((_, i) => h('span', { class: 'slot' }, picked[i]?.textContent ?? '')));
    }

    function choose(b) {
      if (done || b.disabled) return;
      b.disabled = true;
      picked.push(b);
      render();
      if (picked.length < word.length) return;
      const guess = picked.map((p) => p.textContent).join('');
      if (guess === word) {
        solved += 1;
        timer.setInfo(`✓ ${solved}`);
        flash(card, true);
        next();
      } else {
        vibrate(false);
        flash(card, false);
        picked.forEach((p) => { p.disabled = false; });
        picked = [];
        render();
      }
    }

    function undo() {
      const b = picked.pop();
      if (b) { b.disabled = false; render(); }
    }

    function skip() {
      if (done) return;
      skipped += 1;
      slots.replaceChildren(...[...word].map((ch) => h('span', { class: 'slot reveal' }, ch)));
      letters.replaceChildren();
      setTimeout(() => { if (!done) next(); }, 700);
    }

    timer.setInfo('✓ 0');
    next();
    timer.start(() => {
      done = true;
      onFinish({ accuracy: timedAccuracy(solved, solved + skipped, target), score: solved, summary: `${solved} solved, ${skipped} skipped` });
    });
    return () => { done = true; timer.stop(); };
  },
};
