// Dates are handled as local-calendar keys ("YYYY-MM-DD") so a "day" means the
// player's day, not a UTC day. Arithmetic goes through UTC to dodge DST shifts.

const pad = (n) => String(n).padStart(2, '0');

export function toKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function keyToUTC(key) {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

const DAY_MS = 86400000;

export function dayIndex(key) {
  return Math.round(keyToUTC(key) / DAY_MS);
}

export function daysBetween(from, to) {
  return dayIndex(to) - dayIndex(from);
}

export function addDays(key, n) {
  const d = new Date(keyToUTC(key) + n * DAY_MS);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
