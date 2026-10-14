import { h, pick, shuffle, hud, flash, vibrate, timedAccuracy } from './kit.js';

const SECONDS = 45;
const ALL = [
  { name: 'RED', hex: '#ef4444' },
  { name: 'BLUE', hex: '#3b82f6' },
  { name: 'GREEN', hex: '#16a34a' },
  { name: 'YELLOW', hex: '#eab308' },
  { name: 'PURPLE', hex: '#a855f7' },
  { name: 'ORANGE', hex: '#f97316' },
];

export default {
  id: 'color-clash',
  name: 'Color Clash',
  skill: 'speed',
  howTo: 'Tap the INK color of the word, not what it says. At higher levels, a label may ask for the WORD instead. 45 seconds.',
  create(root, { level, onFinish }) {
    const colors = ALL.slice(0, level >= 4 ? 6 : 4);
    const switching = level >= 6;
    const target = 14 + level * 2;
    let correct = 0;
    let attempts = 0;
    let current = null;
    let done = false;

    const timer = hud(SECONDS);
    const rule = h('div', { class: 'rule' });
    const word = h('div', { class: 'stroop-word' });
    const card = h('div', { class: 'card stroop' }, rule, word);
    const buttons = shuffle(colors).map((c) =>
      h('button', { class: 'choice', onclick: () => answer(c.name) }, c.name));
    root.append(timer.el, card, h('div', { class: 'choices' }, buttons));

    function next() {
      const text = pick(colors);
      const congruent = Math.random() < 0.2;
      const ink = congruent ? text : pick(colors.filter((c) => c !== text));
      const mode = switching && Math.random() < 0.35 ? 'WORD' : 'INK';
      current = { answer: mode === 'INK' ? ink.name : text.name };
      word.textContent = text.name;
      word.style.color = ink.hex;
      rule.textContent = switching ? `Tap the ${mode}` : 'Tap the INK color';
      rule.classList.toggle('alt', mode === 'WORD');
    }

    function answer(name) {
      if (done) return;
      attempts += 1;
      const ok = name === current.answer;
      if (ok) correct += 1; else vibrate(false);
      flash(card, ok);
      timer.setInfo(`✓ ${correct}`);
      next();
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
