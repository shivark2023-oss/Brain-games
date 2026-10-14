export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10;
const LEVEL_UP_AT = 0.8;
const LEVEL_DOWN_BELOW = 0.5;

export function nextLevel(level, accuracy) {
  if (accuracy >= LEVEL_UP_AT) return Math.min(MAX_LEVEL, level + 1);
  if (accuracy < LEVEL_DOWN_BELOW) return Math.max(MIN_LEVEL, level - 1);
  return level;
}

// Level-weighted score used for the per-skill trend, so that a game getting
// harder does not look like a decline.
export function skillPoints(level, accuracy) {
  return Math.round(accuracy * 100 * (1 + 0.25 * (level - 1)));
}
