import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeProblem } from '../js/games/quick-math.js';
import { makePattern } from '../js/games/number-pattern.js';

const evalText = (t) => Function(`return ${t.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')}`)();

test('quick math answers are correct non-negative integers at every level', () => {
  for (let level = 1; level <= 10; level++) {
    for (let i = 0; i < 300; i++) {
      const p = makeProblem(level);
      assert.ok(Number.isInteger(p.answer) && p.answer >= 0, `${p.text} = ${p.answer}`);
      assert.equal(evalText(p.text), p.answer, p.text);
    }
  }
});

test('number patterns have 4 unique options including the answer', () => {
  for (let level = 1; level <= 10; level++) {
    for (let i = 0; i < 300; i++) {
      const p = makePattern(level);
      assert.equal(p.shown.length, 5);
      assert.equal(p.options.length, 4, JSON.stringify(p));
      assert.equal(new Set(p.options).size, 4);
      assert.ok(p.options.includes(p.answer));
      assert.ok(p.shown.every(Number.isInteger));
    }
  }
});
