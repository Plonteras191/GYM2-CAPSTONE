/**
 * Price rules shared by the "Subscribe a member" form and the Renew dialog.
 *
 * Loyal members get PHP 20 off for every subscription they already had, on
 * packages above PHP 300, and never pay less than PHP 300. The discount only
 * applies when the member has no running subscription (a new or lapsed
 * member), never to an upgrade.
 */
export const LOYALTY_DISCOUNT_STEP = 20;
export const LOYALTY_PRICE_FLOOR = 300;

/** { price, discount } for a package, given how many subscriptions the member already had. */
export function getLoyaltyPrice(plan, previousSubscriptions) {
  const listPrice = Number(plan?.price) || 0;
  if (listPrice <= LOYALTY_PRICE_FLOOR) return { price: listPrice, discount: 0 };

  let discount = previousSubscriptions * LOYALTY_DISCOUNT_STEP;
  let price = listPrice - discount;
  if (price < LOYALTY_PRICE_FLOOR) {
    price = LOYALTY_PRICE_FLOOR;
    discount = listPrice - LOYALTY_PRICE_FLOOR;
  }
  return { price, discount };
}

/** A YYYY-MM-DD date string moved by `days` days (local calendar, no time zone surprises). */
export function addDaysToDateString(dateString, days) {
  const [year, month, day] = String(dateString || '').slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return '';
  const moved = new Date(year, month - 1, day + (Number(days) || 0));
  return [moved.getFullYear(), String(moved.getMonth() + 1).padStart(2, '0'), String(moved.getDate()).padStart(2, '0')].join('-');
}

/** "Nov 17, 2026" for a YYYY-MM-DD date string. */
export function formatDateString(dateString) {
  const [year, month, day] = String(dateString || '').slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return '';
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Whole days from today until a date (negative once it has passed), or null. */
export function daysUntilDateString(dateString) {
  const [year, month, day] = String(dateString || '').slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  const now = new Date();
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
}

/** True while a subscription is running today (Active and not past its end date). */
export function isRunningSubscription(subscription) {
  if (!subscription || subscription.status !== 'Active') return false;
  const days = daysUntilDateString(subscription.end_date);
  return days === null || days >= 0;
}

/** True when a subscription belongs to a package (by id, or by name for older records without one). */
export function isSubscriptionOfPackage(subscription, plan) {
  return String(subscription.plan_id) === String(plan.id) || (!subscription.plan_id && subscription.plan_type === plan.name);
}

/** How many subscriptions to this package are running today. */
export function countRunningSubscriptions(plan, subscriptions) {
  return subscriptions.filter(sub => isRunningSubscription(sub) && isSubscriptionOfPackage(sub, plan)).length;
}
