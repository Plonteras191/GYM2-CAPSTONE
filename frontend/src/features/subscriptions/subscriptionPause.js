/**
 * Pausing a subscription (Muscle Bros does not refund).
 * While paused the days left are frozen; on resume the end date moves later
 * by the days spent paused. The server does the real work; these helpers only
 * decide what to show and which button to offer.
 */

const DAY_MS = 86400000;

const parseDay = (value) => {
  const [y, m, d] = String(value || '').slice(0, 10).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

const today = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const daysBetween = (from, to) => Math.round((to - from) / DAY_MS);

/** Running today: active, already started and not yet ended. Only these can be paused. */
export const isRunningSubscription = (sub) => {
  const start = parseDay(sub?.start_date);
  const end = parseDay(sub?.end_date);
  return sub?.status === 'Active' && Boolean(end) && end >= today() && (!start || start <= today());
};

/** Days left of a running subscription, counted from today. */
export const daysLeftToday = (sub) => {
  const end = parseDay(sub?.end_date);
  return end ? Math.max(0, daysBetween(today(), end)) : null;
};

/** Days left of a paused subscription: frozen on the day it was paused. */
export const pausedDaysLeft = (sub) => {
  if (sub?.paused_days_left !== null && sub?.paused_days_left !== undefined && Number.isFinite(Number(sub.paused_days_left))) {
    return Number(sub.paused_days_left);
  }
  const from = parseDay(sub?.paused_at);
  const end = parseDay(sub?.end_date);
  return from && end ? Math.max(0, daysBetween(from, end)) : null;
};

/** Whole days from the pause day to today: what resuming now adds to the end date. */
export const daysPausedSoFar = (sub) => {
  const from = parseDay(sub?.paused_at);
  return from ? Math.max(0, daysBetween(from, today())) : 0;
};

/** The end date the subscription would get if resumed today, as YYYY-MM-DD. */
export const endDateIfResumedToday = (sub) => {
  const end = parseDay(sub?.end_date);
  if (!end) return null;
  const moved = new Date(end.getFullYear(), end.getMonth(), end.getDate() + daysPausedSoFar(sub));
  const pad = (n) => String(n).padStart(2, '0');
  return `${moved.getFullYear()}-${pad(moved.getMonth() + 1)}-${pad(moved.getDate())}`;
};
