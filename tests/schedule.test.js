import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dailyWorkout, SKILLS, GAMES_BY_SKILL } from '../js/core/schedule.js';
import { addDays } from '../js/core/dates.js';

test('a workout is 3 games from 3 different skills', () => {
  const w = dailyWorkout('2026-10-14');
  assert.equal(w.length, 3);
  const skills = w.map((id) => SKILLS.find((s) => GAMES_BY_SKILL[s].includes(id)));
  assert.equal(new Set(skills).size, 3);
});

test('same date always gives the same workout', () => {
  assert.deepEqual(dailyWorkout('2026-10-14'), dailyWorkout('2026-10-14'));
});

test('over 8 days every skill appears equally and every game appears', () => {
  const counts = Object.fromEntries(SKILLS.map((s) => [s, 0]));
  const games = new Set();
  for (let i = 0; i < 8; i++) {
    for (const id of dailyWorkout(addDays('2026-10-14', i))) {
      games.add(id);
      counts[SKILLS.find((s) => GAMES_BY_SKILL[s].includes(id))]++;
    }
  }
  assert.deepEqual(Object.values(counts), [6, 6, 6, 6]);
  assert.equal(games.size, 8);
});

test('consecutive days differ', () => {
  assert.notDeepEqual(dailyWorkout('2026-10-14'), dailyWorkout('2026-10-15'));
});
