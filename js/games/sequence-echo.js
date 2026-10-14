import { h, rand, wait, vibrate } from './kit.js';

const TRIALS = 5;
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316'];

export default {
  id: 'sequence-echo',
  name: 'Sequence Echo',
  skill: 'memory',
  howTo: 'Watch the pads light up in order, then tap them back in the same order. 5 rounds, getting longer.',
  create(root, { level, onFinish }) {
    let alive = true;
    const padCount = level >= 5 ? 6 : 4;
    const baseLen = 2 + Math.ceil(level / 2);
    const stepMs = Math.max(350, 750 - level * 40);
    let correctSteps = 0;
    let totalSteps = 0;
    let trial = 0;

    const status = h('p', { class: 'game-status' });
    const msg = h('span', { class: 'hud-info' });
    const pads = COLORS.slice(0, padCount).map((c, i) =>
      h('button', { class: 'pad', style: { '--pad': c }, 'aria-label': `pad ${i + 1}` }));
    const board = h('div', { class: `pads pads-${padCount}` }, pads);
    root.append(h('div', { class: 'hud' }, h('div', { class: 'hud-row' }, msg, status)), board);

    let onTap = null;
    pads.forEach((p, i) => p.addEventListener('click', () => onTap && onTap(i)));

    async function lightUp(i, ms) {
      pads[i].classList.add('lit');
      await wait(ms);
      pads[i].classList.remove('lit');
    }

    async function runTrial() {
      if (!alive) return;
      if (trial === TRIALS) {
        onFinish({ accuracy: correctSteps / totalSteps, score: correctSteps, summary: `${correctSteps} of ${totalSteps} steps` });
        return;
      }
      const len = baseLen + Math.floor(trial / 2);
      trial += 1;
      totalSteps += len;
      status.textContent = `Round ${trial}/${TRIALS}`;
      msg.textContent = 'Watch…';
      board.classList.add('locked');
      const seq = Array.from({ length: len }, () => rand(0, padCount - 1));
      await wait(600);
      for (const i of seq) {
        if (!alive) return;
        await lightUp(i, stepMs * 0.7);
        await wait(stepMs * 0.3);
      }
      msg.textContent = `Your turn (${len})`;
      board.classList.remove('locked');
      let pos = 0;
      onTap = async (i) => {
        lightUp(i, 180);
        if (i === seq[pos]) {
          pos += 1;
          correctSteps += 1;
          if (pos < len) return;
          msg.textContent = 'Nice!';
        } else {
          vibrate(false);
          msg.textContent = 'Oops';
          board.classList.add('wrong');
        }
        onTap = null;
        board.classList.add('locked');
        await wait(700);
        board.classList.remove('wrong');
        runTrial();
      };
    }

    runTrial();
    return () => { alive = false; onTap = null; };
  },
};
