import gridRecall from './grid-recall.js';
import sequenceEcho from './sequence-echo.js';
import colorClash from './color-clash.js';
import oddOneOut from './odd-one-out.js';
import quickMath from './quick-math.js';
import numberPattern from './number-pattern.js';
import anagramRush from './anagram-rush.js';
import synonymMatch from './synonym-match.js';

export const GAMES = Object.fromEntries(
  [gridRecall, sequenceEcho, colorClash, oddOneOut, quickMath, numberPattern, anagramRush, synonymMatch]
    .map((g) => [g.id, g]),
);
