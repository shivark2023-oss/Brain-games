import { h } from './games/kit.js';
import { GAMES } from './games/index.js';
import { toKey, addDays, daysBetween } from './core/dates.js';
import { computeStreak, MAX_FREEZES } from './core/streak.js';
import { dailyWorkout, SKILLS, SKILL_LABELS, GAMES_BY_SKILL } from './core/schedule.js';
import {
  load, save, emptyState, recordGame, completedDates, levelOf, skillTrend, bestScores, parseBackup, isComplete,
} from './core/store.js';
import { trendChart } from './chart.js';

const app = document.getElementById('app');
let state = load();
let cleanup = null;
let tab = 'today';

const today = () => toKey();
const streakNow = () => computeStreak(completedDates(state), today());

function workoutFor(date) {
  return state.days[date]?.workout ?? dailyWorkout(date);
}

function resultFor(date, gameId) {
  return state.days[date]?.games.find((g) => g.gameId === gameId);
}

function stop() {
  if (cleanup) cleanup();
  cleanup = null;
}

function layout(content, { nav = true } = {}) {
  stop();
  const tabs = [['today', 'Today', '🧠'], ['progress', 'Progress', '📈'], ['settings', 'Settings', '⚙️']];
  app.replaceChildren(...[
    h('main', { class: 'screen' }, content),
    nav && h('nav', { class: 'tabbar' }, tabs.map(([id, label, icon]) =>
      h('button', { class: `tab ${tab === id ? 'active' : ''}`, onclick: () => go(id) },
        h('span', { class: 'tab-icon' }, icon), label))),
  ].filter(Boolean));
  window.scrollTo(0, 0);
}

function go(id) {
  tab = id;
  ({ today: renderToday, progress: renderProgress, settings: renderSettings })[id]();
}

// ---------- Today ----------

function streakCard(st) {
  const yesterday = addDays(today(), -1);
  let note = null;
  if (st.frozenDates.includes(yesterday)) note = '❄️ A streak freeze saved your streak yesterday.';
  else if (st.current === 0 && st.best > 0) note = 'Your streak ended. Today starts a new one!';
  else if (!st.doneToday && st.current > 0) note = 'Finish today’s workout to keep your streak.';

  return h('section', { class: 'card streak-card' },
    h('div', { class: 'streak-main' },
      h('span', { class: 'flame', 'aria-hidden': 'true' }, st.doneToday ? '🔥' : '🕯️'),
      h('div', {},
        h('div', { class: 'streak-num' }, st.current),
        h('div', { class: 'muted' }, st.current === 1 ? 'day streak' : 'days in a row'))),
    h('div', { class: 'streak-side' },
      h('div', {}, h('span', { class: 'muted' }, 'Best '), h('strong', {}, st.best)),
      h('div', { title: 'Earn a freeze every 7 days in a row. A freeze covers one missed day.' },
        h('span', { class: 'muted' }, 'Freezes '),
        h('strong', {}, '❄️'.repeat(st.freezes) || '—'),
        h('span', { class: 'muted' }, ` ${st.freezes}/${MAX_FREEZES}`))),
    note && h('p', { class: 'streak-note' }, note));
}

function renderToday() {
  const date = today();
  const workout = workoutFor(date);
  const st = streakNow();
  const complete = isComplete(state.days[date]);
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  const items = workout.map((id, i) => {
    const g = GAMES[id];
    const r = resultFor(date, id);
    return h('li', { class: `workout-item ${r ? 'done' : ''}` },
      h('span', { class: 'step' }, r ? '✓' : i + 1),
      h('div', { class: 'grow' },
        h('div', { class: 'item-name' }, g.name),
        h('div', { class: 'muted small' }, `${SKILL_LABELS[g.skill]} · Level ${r ? r.level : levelOf(state, id)}`)),
      r && h('span', { class: 'pill' }, `${Math.round(r.accuracy * 100)}%`));
  });

  const started = workout.some((id) => resultFor(date, id));
  const action = complete
    ? h('div', { class: 'card done-card' },
      h('div', { class: 'big' }, '✅ Workout complete'),
      h('p', { class: 'muted' }, 'Nice work. Come back tomorrow for a new workout.'))
    : h('button', { class: 'btn primary block', onclick: () => playNext(date) }, started ? 'Continue workout' : 'Start today’s workout');

  layout([
    h('header', { class: 'top' },
      h('h1', {}, greeting),
      h('p', { class: 'muted' }, new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }))),
    streakCard(st),
    h('h2', {}, 'Today’s workout'),
    h('p', { class: 'muted small' }, '3 games · about 5 minutes'),
    h('ol', { class: 'workout' }, items),
    action,
  ]);
}

// ---------- Playing ----------

function playNext(date) {
  const id = workoutFor(date).find((g) => !resultFor(date, g));
  if (!id) return finish(date);
  const game = GAMES[id];
  const level = levelOf(state, id);
  const index = workoutFor(date).indexOf(id) + 1;

  layout([
    h('div', { class: 'play-top' },
      h('button', { class: 'icon-btn', onclick: () => go('today'), 'aria-label': 'Back' }, '✕'),
      h('span', { class: 'muted' }, `Game ${index} of 3`)),
    h('section', { class: 'card intro' },
      h('div', { class: 'pill' }, SKILL_LABELS[game.skill]),
      h('h1', {}, game.name),
      h('p', { class: 'muted' }, `Level ${level}`),
      h('p', {}, game.howTo),
      h('button', { class: 'btn primary block', onclick: () => startGame(date, id, level) }, 'Start')),
  ], { nav: false });
}

function startGame(date, id, level) {
  const game = GAMES[id];
  const stage = h('div', { class: 'stage' });
  layout([
    h('div', { class: 'play-top' },
      h('button', { class: 'icon-btn', onclick: () => go('today'), 'aria-label': 'Quit game' }, '✕'),
      h('strong', {}, game.name),
      h('span', { class: 'muted' }, `Lv ${level}`)),
    stage,
  ], { nav: false });

  cleanup = game.create(stage, {
    level,
    onFinish: (res) => {
      cleanup = null;
      const accuracy = Math.max(0, Math.min(1, res.accuracy || 0));
      const before = streakNow();
      state = recordGame(state, date, workoutFor(date), {
        gameId: id, skill: game.skill, level, accuracy, score: res.score,
      });
      save(state);
      showResult(date, id, level, { ...res, accuracy }, before);
    },
  });
}

function showResult(date, id, level, res, before) {
  const game = GAMES[id];
  const newLevel = levelOf(state, id);
  const change = newLevel > level ? `⬆️ Level up! Next time: level ${newLevel}`
    : newLevel < level ? `⬇️ Easing off to level ${newLevel}`
      : `Staying on level ${level}`;
  const last = isComplete(state.days[date]);

  layout([
    h('section', { class: 'card result' },
      h('div', { class: 'pill' }, SKILL_LABELS[game.skill]),
      h('h1', {}, game.name),
      h('div', { class: 'result-score' }, `${Math.round(res.accuracy * 100)}%`),
      h('p', {}, res.summary),
      h('p', { class: 'muted' }, change),
      h('button', { class: 'btn primary block', onclick: () => (last ? finish(date, before) : playNext(date)) },
        last ? 'Finish workout' : 'Next game →')),
  ], { nav: false });
}

function finish(date, before = null) {
  const st = streakNow();
  const earned = before && st.freezes > before.freezes;
  const games = state.days[date]?.games ?? [];
  layout([
    h('section', { class: 'card celebrate' },
      h('div', { class: 'confetti', 'aria-hidden': 'true' }, '🎉'),
      h('h1', {}, 'Workout complete!'),
      h('div', { class: 'streak-num' }, `🔥 ${st.current}`),
      h('p', { class: 'muted' }, st.current === 1 ? 'day streak' : 'days in a row'),
      earned && h('p', { class: 'streak-note' }, '❄️ You earned a streak freeze! It will cover a missed day automatically.'),
      st.current > 0 && st.current === st.best && st.best > 1 && h('p', {}, '🏆 New personal best!'),
      h('ul', { class: 'summary' }, games.map((g) =>
        h('li', {}, h('span', {}, GAMES[g.gameId].name), h('strong', {}, `${Math.round(g.accuracy * 100)}%`)))),
      h('button', { class: 'btn primary block', onclick: () => go('today') }, 'Done')),
  ], { nav: false });
}

// ---------- Progress ----------

function calendar(st) {
  const done = new Set(completedDates(state));
  const frozen = new Set(st.frozenDates);
  const t = today();
  // 6 weeks ending this week, Monday first.
  const dow = (new Date().getDay() + 6) % 7;
  const start = addDays(t, -dow - 35);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = addDays(start, i);
    const future = daysBetween(t, d) > 0;
    const cls = done.has(d) ? 'done' : frozen.has(d) ? 'frozen' : '';
    return h('div', {
      class: `cal-day ${cls} ${d === t ? 'today' : ''} ${future ? 'future' : ''}`,
      title: d,
    }, done.has(d) ? '' : frozen.has(d) ? '❄' : '');
  });
  return h('section', { class: 'card' },
    h('h3', {}, 'Last 6 weeks'),
    h('div', { class: 'cal-head' }, ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((x) => h('span', {}, x))),
    h('div', { class: 'cal' }, cells),
    h('div', { class: 'legend small muted' },
      h('span', {}, h('i', { class: 'cal-key done' }), 'Workout done'),
      h('span', {}, h('i', { class: 'cal-key frozen' }), 'Freeze used')));
}

function renderProgress() {
  const st = streakNow();
  const total = completedDates(state).length;
  const best = bestScores(state);

  const skills = SKILLS.map((skill) => {
    const trend = skillTrend(state, skill);
    let body;
    if (!trend.length) body = h('p', { class: 'muted small' }, 'No games played yet.');
    else {
      const first = trend[0].points;
      const latest = trend.at(-1).points;
      const delta = latest - first;
      body = [
        h('div', { class: 'skill-stat' },
          h('strong', {}, latest), h('span', { class: 'muted small' }, ' latest'),
          trend.length > 1 && h('span', { class: `delta ${delta >= 0 ? 'up' : 'down'}` },
            `${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)} since start`)),
        trendChart(trend, SKILL_LABELS[skill]),
      ];
    }
    return h('section', { class: 'card' }, h('h3', {}, SKILL_LABELS[skill]), body);
  });

  const table = h('table', { class: 'games-table' },
    h('thead', {}, h('tr', {}, h('th', {}, 'Game'), h('th', {}, 'Level'), h('th', {}, 'Best'))),
    h('tbody', {}, SKILLS.flatMap((s) => GAMES_BY_SKILL[s]).map((id) =>
      h('tr', {}, h('td', {}, GAMES[id].name), h('td', {}, levelOf(state, id)), h('td', {}, best[id] ?? '—')))));

  layout([
    h('header', { class: 'top' }, h('h1', {}, 'Progress')),
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('strong', {}, st.current), h('span', {}, 'Current streak')),
      h('div', { class: 'stat' }, h('strong', {}, st.best), h('span', {}, 'Best streak')),
      h('div', { class: 'stat' }, h('strong', {}, total), h('span', {}, 'Workouts'))),
    calendar(st),
    h('h2', {}, 'Skill trends'),
    h('p', { class: 'muted small' }, 'Points account for difficulty level, so levelling up does not look like a drop.'),
    skills,
    h('h2', {}, 'Games'),
    h('section', { class: 'card' }, table),
  ]);
}

// ---------- Settings ----------

function renderSettings() {
  const msg = h('p', { class: 'small', role: 'status' });

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `brain-games-backup-${today()}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    msg.textContent = 'Backup file saved to your Downloads.';
  };

  const fileInput = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    try {
      const data = parseBackup(await file.text());
      if (!confirm('Replace all current progress with this backup?')) return;
      state = data;
      save(state);
      msg.textContent = `Restored ${completedDates(state).length} workouts.`;
    } catch (e) {
      msg.textContent = e.message || 'Could not read that file.';
    }
    fileInput.value = '';
  });

  const reset = () => {
    if (!confirm('Delete ALL progress, streaks and levels? This cannot be undone.')) return;
    state = emptyState();
    save(state);
    msg.textContent = 'All progress deleted.';
  };

  layout([
    h('header', { class: 'top' }, h('h1', {}, 'Settings')),
    h('section', { class: 'card' },
      h('h3', {}, 'Backup'),
      h('p', { class: 'muted small' }, 'Your progress lives only on this phone. Save a backup now and then, so clearing browser data or switching phones doesn’t lose your streak.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', onclick: exportData }, 'Save backup'),
        h('button', { class: 'btn', onclick: () => fileInput.click() }, 'Restore backup')),
      fileInput,
      msg),
    h('section', { class: 'card' },
      h('h3', {}, 'How streaks work'),
      h('ul', { class: 'small' },
        h('li', {}, 'Finish all 3 games on a day to count it. Any time of day works.'),
        h('li', {}, `Every 7 days in a row earns a streak freeze (hold up to ${MAX_FREEZES}).`),
        h('li', {}, 'A freeze is used automatically when you miss a day.'),
        h('li', {}, 'Miss more days than you have freezes and the streak resets.'))),
    h('section', { class: 'card' },
      h('h3', {}, 'Danger zone'),
      h('button', { class: 'btn danger', onclick: reset }, 'Delete all progress')),
  ]);
}

// ---------- Boot ----------

// If the app is left open overnight, refresh the Today screen when it comes back.
let shownDate = today();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && today() !== shownDate && !cleanup) {
    shownDate = today();
    if (tab === 'today') renderToday();
  }
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

go('today');
