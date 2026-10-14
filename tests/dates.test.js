import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toKey, addDays, daysBetween, dayIndex } from '../js/core/dates.js';

test('toKey formats local date as YYYY-MM-DD', () => {
  assert.equal(toKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
});

test('addDays crosses month and year boundaries', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});

test('daysBetween counts whole days and ignores DST', () => {
  assert.equal(daysBetween('2026-03-07', '2026-03-09'), 2);
  assert.equal(daysBetween('2026-10-14', '2026-10-14'), 0);
  assert.equal(daysBetween('2026-10-14', '2026-10-13'), -1);
});

test('dayIndex increases by one per day', () => {
  assert.equal(dayIndex('2026-10-15') - dayIndex('2026-10-14'), 1);
});
