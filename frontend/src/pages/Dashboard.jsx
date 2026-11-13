import { useState, useEffect, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useCountUp } from '../hooks/useCountUp';
import Panel, { PanelLink } from '../components/ui/Panel';
import { StatStrip, StatCell } from '../components/ui/StatStrip';
import api from '../api'; 
import { getPaymentMethodLabel } from '../utils/paymentMethod';
import { formatNumber } from '../utils/numberFormat';
import { getPackageDetails } from '../utils/packageDisplay';
import { useDataCache } from '../context/DataCacheContext';
import { useSubscriptions } from '../features/subscriptions/hooks/useSubscriptions';
import SubscriptionsCalendarView from '../features/subscriptions/components/SubscriptionsCalendarView';
import CoachEventModal from '../features/subscriptions/components/CoachEventModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AlertDialog from '../components/ui/AlertDialog';

import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  FiCheckCircle, FiDollarSign, FiTrendingUp, FiClock, FiUserPlus, FiCalendar, FiArrowRight
} from 'react-icons/fi';

/* ── Presentation helpers (display only) ─────────────────────────────── */

const CHART_THEME = {
  light: { revenue: '#D97A07', bars: '#A61F2B', grid: '#DCDDE1', tick: '#5B6170', cursor: 'rgba(13,13,13,0.05)' },
  dark: { revenue: '#F2B705', bars: '#E25563', grid: '#353A47', tick: '#8B93A7', cursor: 'rgba(139,147,167,0.12)' },
};

const initialsOf = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?';

const methodTone = (method = '') => {
  const key = method.toLowerCase();
  if (key === 'gcash') return 'bg-brand-navy-50 text-brand-navy dark:bg-brand-navy-200/10 dark:text-brand-navy-200';
  if (key === 'cash') return 'bg-positive-soft text-positive';
  return 'bg-hover text-ink-2';
};

function ChartTooltip({ active, payload, label, format = (v) => v, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-2 shadow-[0_8px_24px_rgb(13_13_13/0.12)]">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="font-display text-lg font-semibold leading-tight text-ink tabular-nums">
        {format(payload[0].value)}{unit ? <span className="ml-1 font-sans text-xs font-medium text-muted">{unit}</span> : null}
      </p>
    </div>
  );
}

function EmptyState({ icon: Icon, children }) {
  return (
    <div className="flex h-full min-h-32 flex-col items-center justify-center gap-3 py-6 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-hover text-muted">
        <Icon size={18} aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-muted">{children}</p>
    </div>
  );
}

function ListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-4 py-1" aria-label="Loading" role="status">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="skeleton h-8 w-8 rounded-full" />
          <span className="skeleton h-3.5 flex-1" style={{ maxWidth: `${70 - i * 8}%` }} />
          <span className="skeleton h-3.5 w-14" />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { isDarkMode } = useContext(ThemeContext);
  const reducedMotion = useReducedMotion();
  const chartTheme = isDarkMode ? CHART_THEME.dark : CHART_THEME.light;

  const { getCache, setCache } = useDataCache();
  const {
    subscriptions,
    coachEvents,
    showSubscriptions,
    setShowSubscriptions,
    showCoachEvents,
    setShowCoachEvents,
    isEventModalOpen,
    setIsEventModalOpen,
    isSavingEvent,
    isSavingCategory,
    eventCategories,
    eventForm,
    setEventForm,
    recentColors,
    handleSaveCoachEvent,
    handleUpdateCoachEventCategory,
    handleDeleteCoachEventCategory,
    handleOpenNewCoachEvent,
    handleEditCoachEvent,
    handleDeleteCoachEvent,
    deletingEventId,
    confirmDialog,
    setConfirmDialog,
    alertDialog,
    setAlertDialog
  } = useSubscriptions();

  const cachedDash = getCache('dashboard');
  const [isLoading, setIsLoading] = useState(!cachedDash);
  const [salesData, setSalesData] = useState(cachedDash?.salesData || []);
  const [todayCheckIns, setTodayCheckIns] = useState(cachedDash?.todayCheckIns ?? 0);
  const [checkInsByHour, setCheckInsByHour] = useState(cachedDash?.checkInsByHour || []);
  const [stats, setStats] = useState(cachedDash?.stats || { revenue: 0, members: 0, activeSubs: 0, reports: 0 });
  const [recentMembers, setRecentMembers] = useState(cachedDash?.recentMembers || []);
  const [recentTxns, setRecentTxns] = useState(cachedDash?.recentTxns || []);
  const [expiringSoon, setExpiringSoon] = useState(cachedDash?.expiringSoon || []);
  const fetchDashboardData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    try {
      const response = await api.get('/dashboard');
      const data = response.data;

      const newStats = data.stats;
      const newSalesData = data.salesData;
      const newRecentMembers = data.recentMembers.map(m => ({
        id: m.id,
        name: `${m.first_name} ${m.last_name}`
      }));
      const newRecentTxns = data.recentTxns.map(t => ({
        id: t.id,
        transactionId: t.transaction_id,
        packageDetails: getPackageDetails(t),
        amount: t.amount,
        status: t.status,
        method: getPaymentMethodLabel(t.payment_method),
        memberName: t.member ? `${t.member.first_name} ${t.member.last_name}` : 'Walk-in Guest'
      }));
      const newExpiringSoon = data.expiringSoon.map(sub => {
        const daysLeft = Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24));
        return {
          name: sub.member ? `${sub.member.first_name} ${sub.member.last_name}` : 'Unknown Member',
          days: daysLeft
        };
      });
      setStats(newStats);
      setSalesData(newSalesData);
      setTodayCheckIns(data.todayCheckIns ?? 0);
      setCheckInsByHour(data.checkInsByHour || []);
      setRecentMembers(newRecentMembers);
      setRecentTxns(newRecentTxns);
      setExpiringSoon(newExpiringSoon);
      setCache('dashboard', {
        stats: newStats,
        salesData: newSalesData,
        todayCheckIns: data.todayCheckIns ?? 0,
        checkInsByHour: data.checkInsByHour || [],
        recentMembers: newRecentMembers,
        recentTxns: newRecentTxns,
        expiringSoon: newExpiringSoon,
      });

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [setCache]);

  useEffect(() => {
    const hasCached = !!getCache('dashboard');
    fetchDashboardData(!hasCached);
  }, [fetchDashboardData, getCache]);

  /* ── Display-only derivations ─────────────────────────────────────── */
  const checkInsShown = useCountUp(todayCheckIns, { enabled: !isLoading });
  const busiestHour = checkInsByHour.reduce(
    (best, slot) => (Number(slot?.checkIns) > Number(best?.checkIns ?? 0) ? slot : best),
    null
  );
  const sixMonthRevenue = salesData.reduce((sum, row) => sum + (Number(row?.revenue) || 0), 0);
  const chartMotion = { isAnimationActive: !reducedMotion, animationDuration: 1100, animationEasing: 'ease-out' };
  const axisProps = { stroke: chartTheme.tick, fontSize: 12, tickLine: false, axisLine: false };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6 lg:space-y-6">

      <StatStrip index={0}>
        <StatCell label="Total Revenue" tone="gold" to="/transactions" isLoading={isLoading} value={stats.revenue} format={(v) => `₱ ${formatNumber(v)}`} />
        <StatCell label="Total Members" tone="red" to="/members" isLoading={isLoading} value={stats.members} format={(v) => formatNumber(v)} />
        <StatCell label="Active Subs" tone="orange" to="/subscriptions" isLoading={isLoading} value={stats.activeSubs} format={(v) => formatNumber(v)} />
        <StatCell label="Transactions" tone="slate" to="/reports" isLoading={isLoading} value={stats.reports} format={(v) => formatNumber(v)} />
      </StatStrip>

      <Panel
        index={1}
        title="Today's Check-ins"
        icon={FiCheckCircle}
        action={
          <PanelLink as={Link} to="/reports" state={{ defaultTab: 'Attendance' }} icon={FiArrowRight}>
            Attendance report
          </PanelLink>
        }
      >
        <div className="grid gap-5 md:grid-cols-[minmax(10rem,12rem)_minmax(0,1fr)]">
          <div className="flex items-end justify-between gap-4 md:flex-col md:items-start md:border-r md:border-line md:pr-5">
            <div>
              {isLoading ? (
                <span className="skeleton h-14 w-20" />
              ) : (
                <p className="flex items-center gap-3 font-display text-6xl font-semibold leading-none tracking-tight text-ink tabular-nums">
                  {formatNumber(checkInsShown)}
                  {todayCheckIns > 0 && <span aria-hidden="true" className="live-dot h-2.5 w-2.5 rounded-full bg-brand-gold" />}
                </p>
              )}
              <p className="mt-2 text-sm text-muted">check-ins so far today</p>
            </div>
            {!isLoading && busiestHour && (
              <p className="text-right md:text-left">
                <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-muted">Busiest hour</span>
                <span className="font-display text-2xl font-semibold text-ink-2">{busiestHour.hour}</span>
              </p>
            )}
          </div>

          <div className="relative h-[180px] min-w-0">
            {isLoading ? (
              <span className="skeleton absolute inset-0" />
            ) : todayCheckIns === 0 ? (
              <EmptyState icon={FiClock}>No check-ins yet today.</EmptyState>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={checkInsByHour} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={chartTheme.grid} />
                  <XAxis dataKey="hour" {...axisProps} fontSize={11} />
                  <YAxis {...axisProps} allowDecimals={false} width={28} />
                  <Tooltip cursor={{ fill: chartTheme.cursor, radius: 4 }} content={<ChartTooltip unit="check-ins" />} />
                  <Bar dataKey="checkIns" name="Check-ins" fill={chartTheme.bars} radius={[4, 4, 0, 0]} maxBarSize={36} {...chartMotion} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
        <Panel
          index={2}
          className="lg:col-span-2"
          title="Revenue Growth"
          icon={FiTrendingUp}
          meta={<span className="text-xs font-medium text-muted">Last 6 months</span>}
          action={
            !isLoading && (
              <span className="text-right">
                <span className="sr-only">Six-month total: </span>
                <span className="font-display text-xl font-semibold text-ink tabular-nums">₱ {formatNumber(sixMonthRevenue)}</span>
              </span>
            )
          }
          bodyClassName="flex flex-col"
        >
          <div className="relative min-h-[260px] flex-1">
            {isLoading ? (
              <span className="skeleton absolute inset-0" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartTheme.revenue} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={chartTheme.revenue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={chartTheme.grid} />
                  <XAxis dataKey="name" {...axisProps} />
                  <YAxis {...axisProps} width={64} tickFormatter={(val) => `₱${formatNumber(val, { notation: 'compact', maximumFractionDigits: 1 })}`} />
                  <Tooltip
                    cursor={{ stroke: chartTheme.tick, strokeDasharray: '3 3' }}
                    content={<ChartTooltip format={(v) => `₱ ${formatNumber(v)}`} />}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={chartTheme.revenue}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                    activeDot={{ r: 5, strokeWidth: 2, stroke: isDarkMode ? '#22252D' : '#FFFFFF' }}
                    {...chartMotion}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel
          index={3}
          title="Expiring within 7 Days"
          icon={FiClock}
          meta={!isLoading && expiringSoon.length > 0 && (
            <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn tabular-nums">{expiringSoon.length}</span>
          )}
          bodyClassName="lg:max-h-[340px] overflow-y-auto"
        >
          {isLoading ? (
            <ListSkeleton rows={4} />
          ) : expiringSoon.length === 0 ? (
            <EmptyState icon={FiCheckCircle}>No memberships expiring soon.</EmptyState>
          ) : (
            <ul className="-my-1 divide-y divide-line">
              {expiringSoon.map((item, i) => {
                const urgent = item.days <= 2;
                return (
                  <li key={i} className="rise flex items-center justify-between gap-3 py-3" style={{ '--i': i * 0.6 + 3 }}>
                    <span className="flex min-w-0 items-center gap-3">
                      <span aria-hidden="true" className={`h-8 w-1 shrink-0 rounded-full ${urgent ? 'bg-accent' : 'bg-brand-gold'}`} />
                      <span className="truncate text-sm font-medium text-ink">{item.name}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${urgent ? 'bg-accent-soft text-accent' : 'bg-warn-soft text-warn'}`}>
                      {item.days} days left
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5 lg:gap-6">
        <Panel index={4} className="lg:col-span-2" title="Recently Added Members" icon={FiUserPlus}>
          {isLoading ? (
            <ListSkeleton rows={4} />
          ) : recentMembers.length === 0 ? (
            <EmptyState icon={FiUserPlus}>No members found.</EmptyState>
          ) : (
            <ul className="-my-1 divide-y divide-line">
              {recentMembers.map((member, i) => {
                const name = typeof member === 'string' ? member : member.name;
                return (
                  <li key={member.id || name || i} className="rise flex items-center justify-between gap-3 py-2.5" style={{ '--i': i * 0.6 + 4 }}>
                    <span className="flex min-w-0 items-center gap-3">
                      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-hover font-display text-sm font-semibold text-ink-2">
                        {initialsOf(name)}
                      </span>
                      <Link to="/members" state={{ searchTerm: name }} className="link-draw min-w-0 truncate py-1 text-sm font-semibold text-ink hover:text-accent">
                        {name}
                      </Link>
                    </span>
                    <span className="shrink-0 rounded-full bg-positive-soft px-2.5 py-1 text-xs font-semibold text-positive">New</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel index={5} className="lg:col-span-3" title="Recent Transactions" icon={FiDollarSign}>
          {isLoading ? (
            <ListSkeleton rows={4} />
          ) : recentTxns.length === 0 ? (
            <EmptyState icon={FiDollarSign}>No transactions found.</EmptyState>
          ) : (
            <ul className="-my-1 divide-y divide-line">
              {recentTxns.map((txn, i) => {
                const isNegative = txn.status === 'Refunded' || Number(txn.amount) < 0;
                return (
                  <li key={txn.id || i} className="rise grid grid-cols-[minmax(0,1fr)_4.75rem_6.5rem] items-center gap-3 py-3" style={{ '--i': i * 0.6 + 5 }}>
                    <div className="min-w-0">
                      <Link to="/transactions" state={{ searchTerm: txn.transactionId || txn.memberName }} className="link-draw block w-fit max-w-full truncate text-sm font-semibold text-ink hover:text-accent">
                        {txn.memberName}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {txn.packageDetails?.title || 'Package Payment'}
                        {txn.packageDetails?.category && <span> · {txn.packageDetails.category}</span>}
                      </p>
                    </div>
                    <span className={`inline-flex w-full items-center justify-center rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${methodTone(txn.method)}`}>
                      {txn.method}
                    </span>
                    <span className={`whitespace-nowrap text-right font-display text-base font-semibold tabular-nums ${isNegative ? 'text-negative' : 'text-positive'}`}>
                      {Number(txn.amount) > 0 ? '+' : '-'} ₱{formatNumber(Math.abs(txn.amount))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel index={6} title="Subscriptions & Events" icon={FiCalendar} className="relative w-full">
        <SubscriptionsCalendarView
          subscriptions={subscriptions}
          coachEvents={coachEvents}
          showSubscriptions={showSubscriptions}
          setShowSubscriptions={setShowSubscriptions}
          showCoachEvents={showCoachEvents}
          setShowCoachEvents={setShowCoachEvents}
          onOpenEventModal={() => handleOpenNewCoachEvent()}
          onEditCoachEvent={handleEditCoachEvent}
          onDeleteCoachEvent={handleDeleteCoachEvent}
          deletingEventId={deletingEventId}
          onDateClick={info => handleOpenNewCoachEvent(info.dateStr)}
          calendarOnly
          readOnly
        />
        <CoachEventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          eventForm={eventForm}
          setEventForm={setEventForm}
          recentColors={recentColors}
          eventCategories={eventCategories}
          isSaving={isSavingEvent}
          isSavingCategory={isSavingCategory}
          onUpdateCategory={handleUpdateCoachEventCategory}
          onDeleteCategory={handleDeleteCoachEventCategory}
          onSave={handleSaveCoachEvent}
        />
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          confirmText="Confirm"
          isDanger
        />
        <AlertDialog
          isOpen={alertDialog.isOpen}
          title={alertDialog.title}
          message={alertDialog.message}
          type={alertDialog.type}
          onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
        />
      </Panel>

    </div>
  );
}
