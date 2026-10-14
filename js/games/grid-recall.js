import { h, shuffle, wait, vibrate } from './kit.js';

const TRIALS = 5;

export default {
  id: 'grid-recall',
  name: 'Grid Recall',
  skill: 'memory',
  howTo: 'Some tiles light up for a moment. Tap the same tiles from memory. 5 rounds.',
  create(root, { level, onFinish }) {
    let alive = true;
    const size = Math.min(6, 3 + Math.floor((level - 1) / 3));
    const count = Math.min(size * size - 2, 2 + level);
    const showMs = 900 + count * 160;
    let found = 0;
    let trial = 0;

    const status = h('p', { class: 'game-status' });
    const grid = h('div', { class: 'grid', style: { gridTemplateColumns: `repeat(${size}, 1fr)` } });
    root.append(h('div', { class: 'hud' }, h('div', { class: 'hud-row' },
      h('span', { class: 'hud-info' }, `Remember ${count} tiles`), status)), grid);

    async function runTrial() {
      if (!alive) return;
      if (trial === TRIALS) {
        onFinish({ accuracy: found / (TRIALS * count), score: found, summary: `${found} of ${TRIALS * count} tiles` });
        return;
      }
      trial += 1;
      status.textContent = `Round ${trial}/${TRIALS}`;
      const targets = new Set(shuffle([...Array(size * size).keys()]).slice(0, count));
      const tiles = [...Array(size * size).keys()].map((i) => h('button', { class: 'tile', 'aria-label': `tile ${i + 1}` }));
      grid.replaceChildren(...tiles);
      grid.classList.add('locked');
      await wait(400);
      targets.forEach((i) => tiles[i].classList.add('lit'));
      await wait(showMs);
      if (!alive) return;
      targets.forEach((i) => tiles[i].classList.remove('lit'));
      grid.classList.remove('locked');

      let hits = 0;
      let over = false;
      tiles.forEach((tile, i) => tile.addEventListener('click', async () => {
        if (over || tile.classList.contains('hit')) return;
        if (targets.has(i)) {
          tile.classList.add('hit');
          hits += 1;
          found += 1;
          if (hits < count) return;
        } else {
          tile.classList.add('miss');
          vibrate(false);
          targets.forEach((t) => { if (!tiles[t].classList.contains('hit')) tiles[t].classList.add('reveal'); });
        }
        over = true;
        grid.classList.add('locked');
        await wait(hits === count ? 500 : 1100);
        runTrial();
      }));
    }

    runTrial();
    return () => { alive = false; };
  },
};
