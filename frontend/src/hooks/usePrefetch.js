import { useEffect, useRef } from 'react';
import api, { whenPageSettled } from '../api';
import { toMembers } from '../services/memberService';
import { useDataCache } from '../context/DataCacheContext';
import { mapDashboardResponse } from '../utils/dashboardData';
import { normalizeTransactions } from '../features/transactions/transactionData';

const localDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * App-level background prefetcher.
 *
 * Once the page you opened has finished loading its own data, this quietly
 * loads the data for the other pages, so opening them afterwards is instant.
 * The local API answers one request at a time, so it waits for the current
 * page first instead of queueing in front of it. Each page's data is saved in
 * the same shape that page saves it, under the same cache key.
 * It runs once per session and skips anything already cached.
 */
export function usePrefetch() {
  const { getCache, setCache } = useDataCache();
  const hasPrefetched = useRef(false);

  useEffect(() => {
    if (hasPrefetched.current) return undefined;
    let cancelled = false;

    const prefetchAll = async () => {
      const now = new Date();
      const today = localDate(now);
      const currentMonthStart = localDate(new Date(now.getFullYear(), now.getMonth(), 1));

      // The member and package lists are often already loaded by the page
      // you opened (the Overview's calendar loads both); reuse them. When
      // they are not, overlapping requests for one URL are sent once (api.js).
      const loaded = getCache('subscriptions_data');
      const listFrom = (res) => (Array.isArray(res.data) ? res.data : []);
      const getMembers = () => (loaded?.membersList?.length
        ? Promise.resolve({ data: loaded.membersList })
        : api.get('/members'));
      const getPlans = () => (loaded?.plans?.length
        ? Promise.resolve({ data: loaded.plans })
        : api.get('/plans'));

      await Promise.allSettled([
        // Overview
        (async () => {
          if (getCache('dashboard')) return;
          const res = await api.get('/dashboard');
          setCache('dashboard', mapDashboardResponse(res.data));
        })(),

        // Member registration
        (async () => {
          if (getCache('members')) return;
          setCache('members', toMembers((await getMembers()).data));
        })(),

        // Packages (memberships + members + plans)
        (async () => {
          if (getCache('subscriptions_data')) return;
          const [subsRes, membersRes, plansRes] = await Promise.all([
            api.get('/memberships'),
            getMembers(),
            getPlans(),
          ]);
          setCache('subscriptions_data', {
            subscriptions: listFrom(subsRes),
            membersList: listFrom(membersRes),
            plans: listFrom(plansRes),
          });
        })(),

        // Transactions
        (async () => {
          if (getCache('transactions_data')) return;
          const [txnRes, membersRes, plansRes] = await Promise.all([
            api.get('/transactions'),
            getMembers(),
            getPlans(),
          ]);
          setCache('transactions_data', {
            transactions: normalizeTransactions(txnRes.data),
            membersList: listFrom(membersRes),
            plansList: listFrom(plansRes),
          });
        })(),

        // Reports: this month so far, the range the Reports page opens on
        (async () => {
          const reportKey = `reports_v3_${currentMonthStart}_${today}`;
          if (getCache(reportKey)) return;
          const res = await api.get(`/reports?start=${currentMonthStart}&end=${today}`);
          setCache(reportKey, res.data);
        })(),
      ]);
      // Failures are ignored: each page still loads its own data when opened.
    };

    whenPageSettled(1000).then(() => {
      if (cancelled || hasPrefetched.current) return;
      hasPrefetched.current = true;
      prefetchAll();
    });

    return () => { cancelled = true; };
  }, [getCache, setCache]);
}
