/**
 * The /transactions list as the Transactions page shows it: a payment for a
 * daily plan is listed as a walk-in. Shared with the background prefetcher.
 */
export function normalizeTransactions(data) {
  const responseTransactions = Array.isArray(data) ? data : (data?.data || []);
  return responseTransactions.map(transaction => {
    const dailyPlanPayment = transaction.type === 'Subscription Payment'
      && (
        (transaction.membership?.plan_type || '').toLowerCase().includes('daily')
        || (transaction.description || '').toLowerCase().includes('daily')
      );
    return dailyPlanPayment
      ? { ...transaction, type: 'Walk-in Guest', description: 'Walk-in Guest' }
      : transaction;
  });
}
