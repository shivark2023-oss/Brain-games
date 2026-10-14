import { addDays, daysBetween } from './dates.js';

export const FREEZE_EVERY = 7;
export const MAX_FREEZES = 2;

// Replays the history of completed days to derive the streak as of `today`.
// A freeze is earned every 7 streak days (max 2 held) and is spent automatically
// on each missed day. Missing more days than freezes held resets the streak.
export function computeStreak(completed, today) {
  const days = [...new Set(completed)].filter((d) => d <= today).sort();
  let current = 0;
  let best = 0;
  let freezes = 0;
  let frozenDates = [];
  let last = null;

  const bridgeGap = (from, to) => {
    const missed = daysBetween(from, to) - 1;
    if (missed <= 0) return;
    if (missed <= freezes) {
      freezes -= missed;
      for (let i = 1; i <= missed; i++) frozenDates.push(addDays(from, i));
    } else {
      current = 0;
      freezes = 0;
    }
  };

  for (const day of days) {
    if (last) bridgeGap(last, day);
    current += 1;
    if (current % FREEZE_EVERY === 0 && freezes < MAX_FREEZES) freezes += 1;
    best = Math.max(best, current);
    last = day;
  }

  const doneToday = last === today;
  // Days missed between the last session and today (today itself is still open).
  if (last && !doneToday) bridgeGap(last, today);

  if (current === 0) frozenDates = [];
  return { current, best, freezes, frozenDates, doneToday };
}
