import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, levelOf, raiseToStartLevel, recordGame, completedDates, parseBackup, skillTrend, bestScores } from '../js/core/store.js';

const result = (gameId, skill, level, accuracy, score = 10) => ({ gameId, skill, level, accuracy, score });

test('recording all workout games marks the day complete and adjusts level', () => {
  let s = emptyState();
  const workout = ['grid-recall', 'color-clash', 'quick-math'];
  s = recordGame(s, '2026-10-14', workout, result('grid-recall', 'memory', 1, 0.85));
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
  s = recordGame(s, '2026-10-14', workout, result('grid-recall', 'memory', 1, 0.85));
  s = recordGame(s, '2026-10-14', workout, result('grid-recall', 'memory', 2, 0.85));
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

test('an unplayed game starts at the start level', () => {
  assert.equal(levelOf(emptyState(), 'grid-recall'), 3);
});

test('raiseToStartLevel lifts old beginner levels once and keeps higher ones', () => {
  const s = { ...emptyState(), levels: { a: 1, b: 2, c: 6 } };
  const r = raiseToStartLevel(s);
  assert.deepEqual(r.levels, { a: 3, b: 3, c: 6 });
  assert.equal(r.startLevelApplied, true);
  // Once applied, a later ease-off below 3 is respected.
  const later = { ...r, levels: { ...r.levels, a: 2 } };
  assert.equal(raiseToStartLevel(later).levels.a, 2);
});
