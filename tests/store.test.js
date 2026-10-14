import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, recordGame, completedDates, parseBackup, skillTrend, bestScores } from '../js/core/store.js';

const result = (gameId, skill, level, accuracy, score = 10) => ({ gameId, skill, level, accuracy, score });

test('recording all workout games marks the day complete and adjusts level', () => {
  let s = emptyState();
  const workout = ['grid-recall', 'color-clash', 'quick-math'];
  s = recordGame(s, '2026-10-14', workout, result('grid-recall', 'memory', 1, 0.9));
  assert.deepEqual(completedDates(s), []);
  assert.equal(s.levels['grid-recall'], 2);
  s = recordGame(s, '2026-10-14', workout, result('color-clash', 'speed', 1, 0.6));
  s = recordGame(s, '2026-10-14', workout, result('quick-math', 'math', 1, 0.3));
  assert.deepEqual(completedDates(s), ['2026-10-14']);
  assert.equal(s.levels['quick-math'], 1);
});

test('replaying a game on the same day does not double count', () => {
  let s = emptyState();
  const workout = ['grid-recall', 'color-clash', 'quick-math'];
  s = recordGame(s, '2026-10-14', workout, result('grid-recall', 'memory', 1, 0.9));
  s = recordGame(s, '2026-10-14', workout, result('grid-recall', 'memory', 2, 0.9));
  assert.equal(s.days['2026-10-14'].games.length, 1);
  assert.equal(s.levels['grid-recall'], 2);
});

test('parseBackup accepts an exported state and rejects junk', () => {
  let s = emptyState();
  s = recordGame(s, '2026-10-14', ['a', 'b', 'c'], result('a', 'memory', 1, 0.9));
  assert.deepEqual(parseBackup(JSON.stringify(s)), s);
  assert.throws(() => parseBackup('not json'));
  assert.throws(() => parseBackup('{"hello":1}'));
});

test('skillTrend returns daily average points per skill in date order', () => {
  let s = emptyState();
  s = recordGame(s, '2026-10-15', ['a', 'b', 'c'], result('a', 'memory', 2, 0.5));
  s = recordGame(s, '2026-10-14', ['a', 'b', 'c'], result('a', 'memory', 1, 0.5));
  s = recordGame(s, '2026-10-14', ['a', 'b', 'c'], result('b', 'speed', 1, 0.5));
  const t = skillTrend(s, 'memory');
  assert.deepEqual(t.map((p) => p.date), ['2026-10-14', '2026-10-15']);
  assert.ok(t[1].points > t[0].points);
});

test('bestScores keeps the top raw score per game', () => {
  let s = emptyState();
  s = recordGame(s, '2026-10-14', ['a', 'b', 'c'], result('a', 'memory', 1, 0.5, 12));
  s = recordGame(s, '2026-10-15', ['a', 'b', 'c'], result('a', 'memory', 1, 0.5, 30));
  s = recordGame(s, '2026-10-16', ['a', 'b', 'c'], result('a', 'memory', 1, 0.5, 20));
  assert.equal(bestScores(s).a, 30);
});
