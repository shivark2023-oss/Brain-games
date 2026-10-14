import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ANAGRAM_WORDS, SYNONYM_TIERS } from '../js/data/words.js';
import { scramble, wordLength } from '../js/games/anagram-rush.js';
import { makeQuestions } from '../js/games/synonym-match.js';

const sig = (w) => [...w].sort().join('');

test('anagram lists have the right lengths and no two words share letters', () => {
  for (const [len, words] of Object.entries(ANAGRAM_WORDS)) {
    assert.ok(words.length >= 30);
    for (const w of words) assert.equal(w.length, Number(len), w);
    assert.equal(new Set(words.map(sig)).size, words.length, `duplicate anagram in ${len}`);
  }
});

test('every level maps to an available word length and scramble changes the word', () => {
  for (let l = 1; l <= 10; l++) assert.ok(ANAGRAM_WORDS[wordLength(l)]);
  for (const w of ANAGRAM_WORDS[4]) {
    const s = scramble(w);
    assert.notEqual(s, w);
    assert.equal(sig(s), sig(w));
  }
});

test('synonym questions have 4 unique options including the answer', () => {
  for (let l = 1; l <= 10; l++) {
    const qs = makeQuestions(l);
    assert.equal(qs.length, 10);
    for (const q of qs) {
      assert.equal(new Set(q.options).size, 4);
      assert.ok(q.options.includes(q.answer));
      assert.ok(!q.options.includes(q.word));
    }
  }
});

test('no synonym answer is repeated within a tier', () => {
  for (const tier of SYNONYM_TIERS) {
    const answers = tier.map((p) => p[1]);
    assert.equal(new Set(answers).size, answers.length);
  }
});
