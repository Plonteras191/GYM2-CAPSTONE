import { useEffect, useRef } from 'react';
import api from '../api';
import { useDataCache } from '../context/DataCacheContext';

/**
 * App-level background prefetcher.
 *
 * Fires ALL page API calls in parallel the moment the app loads.
 * Results are stored in the cache so every page after the first one
 * loads INSTANTLY — data is already there before the user even clicks.
 *
 * This runs silently in the background and never blocks the UI.
 * It only runs ONCE per session (skips if cache already has data).
 */
export function usePrefetch() {
  const { getCache, setCache } = useDataCache();
  const hasPrefetched = useRef(false);

  useEffect(() => {
    // Don't prefetch more than once per session
    if (hasPrefetched.current) return;

    // If cache is already populated (e.g. from sessionStorage after refresh),
    // no need to prefetch — everything is already fast.
    const alreadyCached =
      getCache('dashboard') &&
      getCache('members') &&
      getCache('subscriptions_data') &&
      getCache('transactions_data');

    if (alreadyCached) {
      hasPrefetched.current = true;
      return;
    }

    hasPrefetched.current = true;

    const currentMonthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    // Fire ALL requests in parallel — none block each other
    const prefetchAll = async () => {
      await Promise.allSettled([

        // Dashboard
        (async () => {
          if (getCache('dashboard')) return;
          try {
            const res = await api.get('/dashboard');
            const data = res.data;
            setCache('dashboard', {
              stats: data.stats,
              salesData: data.salesData,
              recentMembers: data.recentMembers.map(m => `${m.first_name} ${m.last_name}`),
              recentTxns: data.recentTxns.map(t => ({
                type: t.type,
                amount: t.amount,
                method: t.payment_method,
                memberName: t.member
                  ? `${t.member.first_name} ${t.member.last_name}`
                  : 'Walk-in Guest',
              })),
              expiringSoon: data.expiringSoon.map(sub => ({
                name: sub.member
                  ? `${sub.member.first_name} ${sub.member.last_name}`
                  : 'Unknown Member',
                days: Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24)),
              })),
              rawCalendarEvents: data.calendarEvents || [],
            });
          } catch { /* silently ignore — page will fetch itself */ }
        })(),

        // Members list (shared by Members, Subscriptions, Transactions pages)
        (async () => {
          if (getCache('members')) return;
          try {
            const res = await api.get('/members');
            const data = Array.isArray(res.data) ? res.data : [];
            setCache('members', data);
          } catch { /* silently ignore */ }
        })(),

        // Subscriptions data (memberships + members + plans)
        (async () => {
          if (getCache('subscriptions_data')) return;
          try {
            const [subsRes, membersRes, plansRes] = await Promise.all([
              api.get('/memberships'),
              api.get('/members'),
              api.get('/plans'),
            ]);
            setCache('subscriptions_data', {
              subscriptions: Array.isArray(subsRes.data) ? subsRes.data : [],
              membersList: Array.isArray(membersRes.data) ? membersRes.data : [],
              plans: Array.isArray(plansRes.data) ? plansRes.data : [],
            });
          } catch { /* silently ignore */ }
        })(),

        // Transactions data
        (async () => {
          if (getCache('transactions_data')) return;
          try {
            const [txnRes, membersRes, plansRes] = await Promise.all([
              api.get('/transactions'),
              api.get('/members'),
              api.get('/plans'),
            ]);
            setCache('transactions_data', {
              transactions: Array.isArray(txnRes.data) ? txnRes.data : (txnRes.data?.data || []),
              membersList: Array.isArray(membersRes.data) ? membersRes.data : [],
              plansList: Array.isArray(plansRes.data) ? plansRes.data : [],
            });
          } catch { /* silently ignore */ }
        })(),

        // Reports (default: current month — the most common view)
        (async () => {
          const reportKey = `reports_${currentMonthStart}_${today}`;
          if (getCache(reportKey)) return;
          try {
            const res = await api.get(`/reports?start=${currentMonthStart}&end=${today}`);
            setCache(reportKey, res.data);
          } catch { /* silently ignore */ }
        })(),

      ]);
    };

    // Small delay so the current page's own fetch gets priority
    const timer = setTimeout(prefetchAll, 300);
    return () => clearTimeout(timer);
  }, [getCache, setCache]);
}
