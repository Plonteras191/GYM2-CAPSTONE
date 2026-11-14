import { getPaymentMethodLabel } from './paymentMethod';
import { getPackageDetails } from './packageDisplay';

/**
 * Turns the /dashboard response into the shape the Overview shows and caches.
 * Shared by the Overview page and the background prefetcher, so a prefetched
 * Overview looks exactly like one the page loaded itself.
 */
export function mapDashboardResponse(data) {
  return {
    stats: data.stats,
    salesData: data.salesData,
    todayCheckIns: data.todayCheckIns ?? 0,
    checkInsByHour: data.checkInsByHour || [],
    recentMembers: data.recentMembers.map(m => ({
      id: m.id,
      name: `${m.first_name} ${m.last_name}`
    })),
    recentTxns: data.recentTxns.map(t => ({
      id: t.id,
      transactionId: t.transaction_id,
      packageDetails: getPackageDetails(t),
      amount: t.amount,
      status: t.status,
      method: getPaymentMethodLabel(t.payment_method),
      memberName: t.member ? `${t.member.first_name} ${t.member.last_name}` : 'Walk-in Guest'
    })),
    expiringSoon: data.expiringSoon.map(sub => {
      const daysLeft = Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24));
      return {
        name: sub.member ? `${sub.member.first_name} ${sub.member.last_name}` : 'Unknown Member',
        days: daysLeft
      };
    }),
  };
}
