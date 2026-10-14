// Small helpers shared by the games.

export function h(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'style' && typeof v === 'object') {
      for (const [prop, val] of Object.entries(v)) {
        if (prop.startsWith('--')) node.style.setProperty(prop, val); else node.style[prop] = val;
      }
    }
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c != null && c !== false) node.append(c instanceof Node ? c : String(c));
  }
  return node;
}

export const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Timed games: rewards accuracy, and also volume against a level-based target.
export function timedAccuracy(correct, attempts, target) {
  if (!attempts) return 0;
  return (correct / attempts) * Math.min(1, correct / target);
}

// A countdown bar plus HUD. Returns { el, start(onEnd), stop(), setInfo(text) }.
export function hud(seconds) {
  const fill = h('div', { class: 'timer-fill' });
  const info = h('span', { class: 'hud-info' });
  const time = h('span', { class: 'hud-time' }, `${seconds}s`);
  const el = h('div', { class: 'hud' },
    h('div', { class: 'hud-row' }, info, time),
    h('div', { class: 'timer' }, fill));
  let id = null;
  return {
    el,
    setInfo: (t) => { info.textContent = t; },
    start(onEnd) {
      const end = performance.now() + seconds * 1000;
      const tick = () => {
        const left = Math.max(0, end - performance.now());
        fill.style.width = `${(left / (seconds * 1000)) * 100}%`;
        time.textContent = `${Math.ceil(left / 1000)}s`;
        if (left <= 0) { id = null; onEnd(); } else id = requestAnimationFrame(tick);
      };
      id = requestAnimationFrame(tick);
    },
    stop() { if (id) cancelAnimationFrame(id); id = null; },
  };
}

// Brief green/red flash on an element.
export function flash(node, ok) {
  node.classList.remove('flash-ok', 'flash-bad');
  void node.offsetWidth;
  node.classList.add(ok ? 'flash-ok' : 'flash-bad');
}

export function vibrate(ok) {
  if (!ok && navigator.vibrate) navigator.vibrate(60);
}
