import { dayIndex } from './dates.js';

export const SKILLS = ['memory', 'speed', 'math', 'words'];

export const SKILL_LABELS = {
  memory: 'Memory',
  speed: 'Focus & Speed',
  math: 'Math & Logic',
  words: 'Words',
};

export const GAMES_BY_SKILL = {
  memory: ['grid-recall', 'sequence-echo'],
  speed: ['color-clash', 'odd-one-out'],
  math: ['quick-math', 'number-pattern'],
  words: ['anagram-rush', 'synonym-match'],
};

export function skillOf(gameId) {
  return SKILLS.find((s) => GAMES_BY_SKILL[s].includes(gameId));
}

// Deterministic per date: one skill rests each day in rotation, and each
// skill alternates between its two games every time it comes around.
export function dailyWorkout(dateKey) {
  const day = dayIndex(dateKey);
  const rest = ((day % 4) + 4) % 4;
  const cycle = Math.floor(day / 4);
  return SKILLS.filter((_, i) => i !== rest).map((skill, i) => {
    const games = GAMES_BY_SKILL[skill];
    return games[(((cycle + i) % 2) + 2) % 2];
  });
}
