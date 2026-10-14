import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStreak } from '../js/core/streak.js';
import { addDays } from '../js/core/dates.js';

const run = (start, n) => Array.from({ length: n }, (_, i) => addDays(start, i));

test('no history gives an empty streak', () => {
  assert.deepEqual(computeStreak([], '2026-10-14'), {
    current: 0, best: 0, freezes: 0, frozenDates: [], doneToday: false,
  });
});

test('consecutive days build a streak, including today', () => {
  const s = computeStreak(run('2026-10-10', 5), '2026-10-14');
  assert.equal(s.current, 5);
  assert.equal(s.best, 5);
  assert.equal(s.doneToday, true);
});

test('streak stays alive when today is not played yet', () => {
  const s = computeStreak(run('2026-10-10', 4), '2026-10-14');
  assert.equal(s.current, 4);
  assert.equal(s.doneToday, false);
});

test('earns one freeze per 7 streak days, capped at 2', () => {
  assert.equal(computeStreak(run('2026-01-01', 6), '2026-01-06').freezes, 0);
  assert.equal(computeStreak(run('2026-01-01', 7), '2026-01-07').freezes, 1);
  assert.equal(computeStreak(run('2026-01-01', 14), '2026-01-14').freezes, 2);
  assert.equal(computeStreak(run('2026-01-01', 21), '2026-01-21').freezes, 2);
});

test('a freeze covers a missed day and is consumed', () => {
  const days = [...run('2026-01-01', 7), '2026-01-09']; // missed 01-08
  const s = computeStreak(days, '2026-01-09');
  assert.equal(s.current, 8);
  assert.equal(s.freezes, 0);
  assert.deepEqual(s.frozenDates, ['2026-01-08']);
});

test('missing more days than freezes resets the streak', () => {
  const days = [...run('2026-01-01', 7), '2026-01-10']; // missed 08 and 09, only 1 freeze
  const s = computeStreak(days, '2026-01-10');
  assert.equal(s.current, 1);
  assert.equal(s.best, 7);
  assert.equal(s.freezes, 0);
  assert.deepEqual(s.frozenDates, []);
});

test('pending missed days up to yesterday apply freezes before today is played', () => {
  // played 7 days, skipped yesterday (01-08), today is 01-09 not played yet
  const s = computeStreak(run('2026-01-01', 7), '2026-01-09');
  assert.equal(s.current, 7);
  assert.equal(s.freezes, 0);
  assert.deepEqual(s.frozenDates, ['2026-01-08']);
});

test('pending gap larger than freezes shows streak as broken', () => {
  const s = computeStreak(run('2026-01-01', 7), '2026-01-11');
  assert.equal(s.current, 0);
  assert.equal(s.best, 7);
  assert.equal(s.freezes, 0);
});

test('duplicate and unsorted dates are handled', () => {
  const s = computeStreak(['2026-01-03', '2026-01-01', '2026-01-02', '2026-01-02'], '2026-01-03');
  assert.equal(s.current, 3);
});

test('a freeze earned again after being used', () => {
  // 7 days, miss one (freeze used), 6 more days -> total streak 14 -> earns second freeze at 14
  const days = [...run('2026-01-01', 7), ...run('2026-01-09', 7)];
  const s = computeStreak(days, '2026-01-15');
  assert.equal(s.current, 14);
  assert.equal(s.freezes, 1);
});
