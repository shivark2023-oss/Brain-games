import { h, pick, rand, hud, vibrate, timedAccuracy } from './kit.js';

const SECONDS = 45;
// Look-alike pairs, from easy to hard to tell apart.
const TIERS = [
  [['O', 'X'], ['A', 'V'], ['T', 'L'], ['K', 'W'], ['H', 'Z']],
  [['E', 'F'], ['M', 'N'], ['C', 'G'], ['P', 'R'], ['V', 'Y']],
  [['O', 'Q'], ['b', 'd'], ['6', '9'], ['8', 'B'], ['p', 'q']],
  [['l', 'I'], ['0', 'O'], ['5', 'S'], ['u', 'v'], ['2', 'Z']],
];
const CELLS = [9, 12, 16, 16, 20, 20, 25, 25, 30, 30];

export default {
  id: 'odd-one-out',
  name: 'Odd One Out',
  skill: 'speed',
  howTo: 'All symbols match except one. Find it and tap it as fast as you can. 45 seconds.',
  create(root, { level, onFinish }) {
    const cells = CELLS[level - 1];
    const cols = cells <= 12 ? 3 : cells <= 20 ? 4 : 5;
    const tier = TIERS[level <= 2 ? 0 : level <= 5 ? 1 : level <= 8 ? 2 : 3];
    const target = 10 + level;
    let found = 0;
    let attempts = 0;
    let done = false;

    const timer = hud(SECONDS);
    const grid = h('div', { class: 'grid symbols', style: { gridTemplateColumns: `repeat(${cols}, 1fr)` } });
    root.append(timer.el, grid);

    function next() {
      const pair = pick(tier);
      const [common, odd] = Math.random() < 0.5 ? pair : [pair[1], pair[0]];
      const oddAt = rand(0, cells - 1);
      grid.replaceChildren(...Array.from({ length: cells }, (_, i) => {
        const isOdd = i === oddAt;
        const b = h('button', { class: 'tile symbol' }, isOdd ? odd : common);
        b.style.transform = `rotate(${rand(-8, 8)}deg)`;
        b.addEventListener('click', () => tap(b, isOdd));
        return b;
      }));
    }

    function tap(b, ok) {
      if (done) return;
      attempts += 1;
      if (ok) {
        found += 1;
        timer.setInfo(`✓ ${found}`);
        next();
      } else {
        vibrate(false);
        b.classList.add('miss');
      }
    }

    timer.setInfo('✓ 0');
    next();
    timer.start(() => {
      done = true;
      onFinish({ accuracy: timedAccuracy(found, attempts, target), score: found, summary: `${found} found, ${attempts - found} misses` });
    });
    return () => { done = true; timer.stop(); };
  },
};
