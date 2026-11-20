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
      name: `${m.first_name} ${m.last_name}`,
      joinedAt: m.created_at || null
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
      // Whole calendar days in local time, so a membership ending today reads 0.
      const [y, m, d] = String(sub.end_date || '').slice(0, 10).split('-').map(Number);
      const now = new Date();
      const daysLeft = y && m && d
        ? Math.round((Date.UTC(y, m - 1, d) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000)
        : null;
      return {
        membershipId: sub.id,
        name: sub.member ? `${sub.member.first_name} ${sub.member.last_name}` : 'Unknown Member',
        days: daysLeft
      };
    }),
  };
}
