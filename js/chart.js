import { h } from './games/kit.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

const fmtDate = (key) => new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

// Single-series line chart with a tap/hover crosshair and tooltip.
// points: [{ date, points }]
export function trendChart(points, label) {
  const W = 320, H = 120, PAD = { l: 30, r: 10, t: 10, b: 20 };
  const data = points.slice(-30);
  const max = Math.max(100, ...data.map((p) => p.points));
  const yMax = Math.ceil(max / 50) * 50;
  const x = (i) => PAD.l + (data.length === 1 ? (W - PAD.l - PAD.r) / 2 : (i * (W - PAD.l - PAD.r)) / (data.length - 1));
  const y = (v) => PAD.t + (1 - v / yMax) * (H - PAD.t - PAD.b);

  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img', 'aria-label': `${label} trend` });
  for (const v of [0, yMax / 2, yMax]) {
    svg.append(s('line', { x1: PAD.l, x2: W - PAD.r, y1: y(v), y2: y(v), class: 'grid-line' }));
    const t = s('text', { x: PAD.l - 6, y: y(v) + 3, class: 'axis-label', 'text-anchor': 'end' });
    t.textContent = v;
    svg.append(t);
  }
  const first = s('text', { x: x(0), y: H - 4, class: 'axis-label', 'text-anchor': data.length === 1 ? 'middle' : 'start' });
  first.textContent = fmtDate(data[0].date);
  svg.append(first);
  if (data.length > 1) {
    const last = s('text', { x: x(data.length - 1), y: H - 4, class: 'axis-label', 'text-anchor': 'end' });
    last.textContent = fmtDate(data.at(-1).date);
    svg.append(last);
    svg.append(s('path', {
      d: data.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.points).toFixed(1)}`).join(''),
      class: 'trend-line',
    }));
  }
  svg.append(s('circle', { cx: x(data.length - 1), cy: y(data.at(-1).points), r: 4, class: 'trend-end' }));

  const cross = s('line', { y1: PAD.t, y2: H - PAD.b, class: 'crosshair', visibility: 'hidden' });
  const dot = s('circle', { r: 5, class: 'trend-dot', visibility: 'hidden' });
  svg.append(cross, dot);

  const tip = h('div', { class: 'tooltip', hidden: true });
  const wrap = h('div', { class: 'chart-wrap' }, svg, tip);

  const show = (evt) => {
    const box = svg.getBoundingClientRect();
    const px = ((evt.clientX - box.left) / box.width) * W;
    let i = 0;
    data.forEach((_, j) => { if (Math.abs(x(j) - px) < Math.abs(x(i) - px)) i = j; });
    const p = data[i];
    cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i));
    dot.setAttribute('cx', x(i)); dot.setAttribute('cy', y(p.points));
    cross.setAttribute('visibility', 'visible'); dot.setAttribute('visibility', 'visible');
    tip.hidden = false;
    tip.replaceChildren(h('strong', {}, p.points), ` pts · ${fmtDate(p.date)}`);
    const left = (x(i) / W) * box.width;
    tip.style.left = `${Math.min(Math.max(left, 50), box.width - 50)}px`;
  };
  const hide = () => {
    cross.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden');
    tip.hidden = true;
  };
  svg.addEventListener('pointermove', show);
  svg.addEventListener('pointerdown', show);
  svg.addEventListener('pointerleave', hide);
  return wrap;
}
