import { h, pick, shuffle, hud, flash, vibrate } from './kit.js';
import { SYNONYM_TIERS } from '../data/words.js';

const QUESTIONS = 10;
const SECONDS_EACH = 10;

export function tiersFor(level) {
  return level <= 2 ? [0] : level <= 4 ? [0, 1] : level <= 6 ? [1, 2] : level <= 8 ? [2] : [2, 3];
}

export function makeQuestions(level) {
  const tiers = tiersFor(level);
  const items = shuffle(tiers.flatMap((t) => SYNONYM_TIERS[t].map((pair) => ({ pair, t })))).slice(0, QUESTIONS);
  return items.map(({ pair: [word, answer], t }) => {
    const others = shuffle(SYNONYM_TIERS[t].map((p) => p[1]).filter((w) => w !== answer)).slice(0, 3);
    return { word, answer, options: shuffle([answer, ...others]) };
  });
}

export default {
  id: 'synonym-match',
  name: 'Synonym Match',
  skill: 'words',
  howTo: 'Pick the word closest in meaning. 10 words, 10 seconds each.',
  create(root, { level, onFinish }) {
    const questions = makeQuestions(level);
    let q = 0;
    let correct = 0;
    let bonus = 0;
    let done = false;
    let timer = null;
    let started = 0;

    const holder = h('div');
    const wordEl = h('div', { class: 'big-word' });
    const card = h('div', { class: 'card' }, h('div', { class: 'rule' }, 'Same meaning as'), wordEl);
    const choices = h('div', { class: 'choices' });
    root.append(holder, card, choices);

    function next() {
      if (done) return;
      if (q === questions.length) {
        done = true;
        onFinish({ accuracy: correct / questions.length, score: correct * 10 + bonus, summary: `${correct} of ${questions.length} correct` });
        return;
      }
      const cur = questions[q];
      q += 1;
      wordEl.textContent = cur.word;
      choices.replaceChildren(...cur.options.map((o) => h('button', { class: 'choice', onclick: () => answer(o === cur.answer) }, o)));
      timer?.stop();
      timer = hud(SECONDS_EACH);
      timer.setInfo(`Word ${q}/${questions.length}`);
      holder.replaceChildren(timer.el);
      started = performance.now();
      timer.start(() => answer(false));
    }

    function answer(ok) {
      if (done) return;
      timer.stop();
      if (ok) {
        correct += 1;
        bonus += Math.max(0, Math.round(SECONDS_EACH - (performance.now() - started) / 1000));
      } else vibrate(false);
      flash(card, ok);
      next();
    }

    next();
    return () => { done = true; timer?.stop(); };
  },
};
