import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextLevel, skillPoints, MIN_LEVEL, MAX_LEVEL } from '../js/core/adaptive.js';

test('levels up on high accuracy, down on low, holds otherwise', () => {
  assert.equal(nextLevel(3, 0.85), 4);
  assert.equal(nextLevel(3, 0.4), 2);
  assert.equal(nextLevel(3, 0.65), 3);
});

test('level is clamped to the valid range', () => {
  assert.equal(nextLevel(MAX_LEVEL, 1), MAX_LEVEL);
  assert.equal(nextLevel(MIN_LEVEL, 0), MIN_LEVEL);
});

test('skill points reward the same accuracy more at a higher level', () => {
  assert.ok(skillPoints(5, 0.7) > skillPoints(4, 0.7));
  assert.ok(skillPoints(4, 0.9) > skillPoints(4, 0.7));
});

test('levelling up after a strong game does not drop skill points much', () => {
  // 85% at level 4 then 65% at level 5 should be roughly comparable, not a cliff
  const before = skillPoints(4, 0.85);
  const after = skillPoints(5, 0.65);
  assert.ok(after >= before * 0.8, `${after} vs ${before}`);
});
