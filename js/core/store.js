import { nextLevel, skillPoints, START_LEVEL } from './adaptive.js';

const VERSION = 1;

// State shape:
// { version, levels: { gameId: level },
//   days: { 'YYYY-MM-DD': { workout: [gameId], games: [result] } } }
// result: { gameId, skill, level, accuracy, score, points }

export function emptyState() {
  return { version: VERSION, levels: {}, days: {} };
}

export function levelOf(state, gameId) {
  return state.levels[gameId] ?? START_LEVEL;
}

// One-time upgrade for progress saved before games started at START_LEVEL.
export function raiseToStartLevel(state) {
  if (state.startLevelApplied) return state;
  const levels = Object.fromEntries(
    Object.entries(state.levels).map(([id, l]) => [id, Math.max(l, START_LEVEL)]),
  );
  return { ...state, levels, startLevelApplied: true };
}

export function recordGame(state, date, workout, result) {
  const day = state.days[date] ?? { workout, games: [] };
  if (day.games.some((g) => g.gameId === result.gameId)) return state;
  const entry = { ...result, points: skillPoints(result.level, result.accuracy) };
  return {
    ...state,
    levels: { ...state.levels, [result.gameId]: nextLevel(result.level, result.accuracy) },
    days: { ...state.days, [date]: { ...day, games: [...day.games, entry] } },
  };
}

export function isComplete(day) {
  return !!day && day.workout.every((id) => day.games.some((g) => g.gameId === id));
}

export function completedDates(state) {
  return Object.keys(state.days).filter((d) => isComplete(state.days[d])).sort();
}

export function skillTrend(state, skill) {
  return Object.keys(state.days)
    .sort()
    .map((date) => {
      const games = state.days[date].games.filter((g) => g.skill === skill);
      if (!games.length) return null;
      const points = Math.round(games.reduce((sum, g) => sum + g.points, 0) / games.length);
      return { date, points };
    })
    .filter(Boolean);
}

export function bestScores(state) {
  const best = {};
  for (const day of Object.values(state.days)) {
    for (const g of day.games) best[g.gameId] = Math.max(best[g.gameId] ?? 0, g.score);
  }
  return best;
}

export function parseBackup(text) {
  const data = JSON.parse(text);
  const valid =
    data && data.version === VERSION &&
    typeof data.levels === 'object' && data.levels !== null &&
    typeof data.days === 'object' && data.days !== null &&
    Object.entries(data.days).every(
      ([k, d]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && Array.isArray(d.workout) && Array.isArray(d.games),
    );
  if (!valid) throw new Error('This file is not a Brain Games backup.');
  return data;
}

// Browser persistence. Kept separate so the logic above stays testable in Node.
const KEY = 'brain-games-state';

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raiseToStartLevel(raw ? parseBackup(raw) : emptyState());
  } catch {
    return emptyState();
  }
}

export function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}
