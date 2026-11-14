import { useState, useEffect, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useCountUp } from '../hooks/useCountUp';
import Panel, { PanelLink } from '../components/ui/Panel';
import { StatStrip, StatCell } from '../components/ui/StatStrip';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import ManualCheckInModal from '../components/ui/ManualCheckInModal';
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
import bandPhoto from '../assets/Login.jpg';

import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  FiCheckCircle, FiTrendingUp, FiClock, FiUserPlus, FiCalendar, FiArrowRight,
  FiUserCheck, FiCreditCard, FiRefreshCw, FiChevronRight, FiActivity, FiUsers
} from 'react-icons/fi';

/* ── Presentation helpers (display only) ─────────────────────────────── */

// The busiest hour is the one coloured bar; every other bar is neutral.
const CHART_THEME = {
  light: { revenue: '#D97A07', busiest: '#A61F2B', bars: '#9AA0AB', grid: '#E4E5E8', tick: '#5B6170', cursor: 'rgba(13,13,13,0.05)', dotRing: '#FFFFFF' },
  dark: { revenue: '#F2B705', busiest: '#E25563', bars: '#5E6577', grid: '#30343F', tick: '#8B93A7', cursor: 'rgba(139,147,167,0.12)', dotRing: '#22252D' },
};

const peso = (v) => `₱ ${formatNumber(v, Number.isInteger(Number(v)) ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2 })}`;

const plural = (n, one, many) => `${formatNumber(n)} ${n === 1 ? one : many}`;

const greetingFor = (date) => {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const endsLabel = (days) => {
  if (days <= 0) return 'Ends today';
  if (days === 1) return 'Ends tomorrow';
  return `Ends in ${days} days`;
};

const relativeTime = (from, now) => {
  const minutes = Math.floor((now - from) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  return from.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const parseDateKey = (value) => {
  const [y, m, d] = String(value || '').slice(0, 10).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

const formatTime = (value) => {
  const [h, m] = String(value || '').split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return '';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

const methodVariant = (method = '') => {
  const key = method.toLowerCase();
  if (key === 'gcash') return 'info';
  if (key === 'cash') return 'success';
  return 'default';
};

function ChartTooltip({ active, payload, label, format = (v) => v, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="animate-in fade-in zoom-in-95 rounded-xl border border-line bg-panel px-3.5 py-2.5 shadow-[0_12px_28px_-8px_rgb(13_13_13/0.18)]">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-0.5 font-display text-lg font-medium leading-tight tracking-[-0.02em] text-ink">
        {format(payload[0].value)}{unit ? <span className="ml-1.5 font-sans text-[13px] font-normal text-muted">{unit}</span> : null}
      </p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 py-6 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-hover text-muted">
        <Icon size={19} aria-hidden="true" />
      </span>
      <div>
        <p className="text-[15px] font-medium text-ink">{title}</p>
        {children && <p className="mx-auto mt-1 max-w-xs text-[13px] text-muted">{children}</p>}
      </div>
      {action}
    </div>
  );
}

function ListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-4 py-1" aria-label="Loading" role="status">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="skeleton h-9 w-9 rounded-full" />
          <span className="skeleton h-3.5 flex-1" style={{ maxWidth: `${70 - i * 8}%` }} />
          <span className="skeleton h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** A whole list row that is one large link: easy to hit, arrow travels on hover. */
function RowLink({ to, state, index = 0, label, className = '', children }) {
  return (
    <li className="rise" style={{ '--i': index }}>
      <Link
        to={to}
        state={state}
        aria-label={label}
        className={`group press -mx-2 flex min-h-14 items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-hover ${className}`}
      >
        {children}
        <FiChevronRight size={17} aria-hidden="true" className="nudge shrink-0 text-muted group-hover:text-ink" />
      </Link>
    </li>
  );
}

/** Shortcut on the dark welcome band that opens another page. */
function BandLink({ to, icon: Icon, hint, children }) {
  return (
    <Link
      to={to}
      title={hint}
      className="group press btn-step inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-white/[0.06] px-5 text-[15px] font-medium text-white hover:border-white/40 hover:bg-white/[0.12]"
    >
      <Icon size={18} aria-hidden="true" className="text-brand-gold" />
      {children}
      <span className="sr-only">({hint})</span>
    </Link>
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

  /* ── Display-only state ─────────────────────────────────────────────── */
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(() => new Date());
  const [now, setNow] = useState(() => new Date());
  const [firstName] = useState(() => {
    try {
      return (localStorage.getItem('admin_name') || '').trim().split(/\s+/)[0] || '';
    } catch {
      return '';
    }
  });

  // Every fetch hands back a new stats object, so this marks each refresh.
  useEffect(() => { setUpdatedAt(new Date()); }, [stats]);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchDashboardData(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  /* ── Display-only derivations ─────────────────────────────────────── */
  const checkInsShown = useCountUp(todayCheckIns, { enabled: !isLoading });
  const busiestHour = checkInsByHour.reduce(
    (best, slot) => (Number(slot?.checkIns) > Number(best?.checkIns ?? 0) ? slot : best),
    null
  );
  const sixMonthRevenue = salesData.reduce((sum, row) => sum + (Number(row?.revenue) || 0), 0);
  const thisMonth = salesData[salesData.length - 1];
  const thisMonthShown = useCountUp(Number(thisMonth?.revenue) || 0, { enabled: !isLoading });
  const chartMotion = { isAnimationActive: !reducedMotion, animationDuration: 1100, animationEasing: 'ease-out' };
  const axisProps = { stroke: chartTheme.tick, fontSize: 12, tickLine: false, axisLine: false };

  const todayKey = dateKey(now);
  const weekEndKey = dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7));
  const eventsThisWeek = (coachEvents || [])
    .filter(event => {
      const start = String(event.start_date || '').slice(0, 10);
      const end = String(event.end_date || event.start_date || '').slice(0, 10);
      return start && end >= todayKey && start <= weekEndKey;
    })
    .sort((a, b) =>
      String(a.start_date).localeCompare(String(b.start_date))
      || String(a.start_time || '').localeCompare(String(b.start_time || ''))
    );

  const summary = [
    [todayCheckIns, 'check-in so far today', 'check-ins so far today'],
    [expiringSoon.length, 'membership ending this week', 'memberships ending this week'],
    [eventsThisWeek.length, 'coach event coming up', 'coach events coming up'],
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6 lg:space-y-6">

      {/* ── Welcome band: who, what today looks like, what to do next ── */}
      <section aria-label="Today at a glance" className="rise relative isolate overflow-hidden rounded-2xl bg-brand-dark text-white" style={{ '--i': 0 }}>
        <img
          src={bandPhoto}
          alt=""
          aria-hidden="true"
          className="settle pointer-events-none absolute inset-y-0 right-0 -z-10 hidden h-full w-[62%] object-cover object-[32%_28%] opacity-70 md:block"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,#0D0D0D_38%,rgb(13_13_13/0.82)_58%,rgb(13_13_13/0.25)_100%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_0%_120%,rgb(166_3_3/0.42),transparent_55%)]" />

        <div className="flex flex-col gap-6 p-5 sm:p-7 lg:px-9 lg:py-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-[13px] font-medium text-white/70">
              <span aria-hidden="true" className="live-dot h-2 w-2 rounded-full bg-brand-gold" />
              Today at Double Alpha
            </p>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="group press inline-flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-[13px] text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-70"
              title="Load the latest numbers"
            >
              <FiRefreshCw size={14} aria-hidden="true" className={isRefreshing ? 'animate-spin' : ''} />
              <span aria-live="polite">{isRefreshing ? 'Updating…' : `Updated ${relativeTime(updatedAt, now)}`}</span>
            </button>
          </div>

          <div className="max-w-2xl">
            <p className="rise text-[clamp(1.75rem,3.4vw,2.6rem)] font-medium leading-[1.08] tracking-[-0.03em]" style={{ '--i': 1 }}>
              {greetingFor(now)}{firstName ? `, ${firstName}` : ''}.
            </p>
            <p className="rise mt-3 max-w-xl text-[15px] leading-relaxed text-white/70 sm:text-base" style={{ '--i': 2 }}>
              {isLoading ? 'Loading today’s numbers…' : summary.map(([count, one, many], i) => (
                <span key={one}>
                  <strong className="font-medium text-white">{formatNumber(count)}</strong> {count === 1 ? one : many}
                  {i < summary.length - 2 ? ', ' : i === summary.length - 2 ? ' and ' : '.'}
                </span>
              ))}
            </p>
          </div>

          <div className="rise grid grid-cols-1 gap-2.5 min-[520px]:grid-cols-2 xl:flex xl:flex-wrap" style={{ '--i': 3 }}>
            <Button size="lg" icon={<FiUserCheck size={18} />} onClick={() => setIsCheckInOpen(true)} title="Use when the camera does not recognise a member">
              Check in a member
            </Button>
            <BandLink to="/members" icon={FiUserPlus} hint="Opens Member Registration">Register a member</BandLink>
            <BandLink to="/transactions" icon={FiCreditCard} hint="Opens Transactions">Record a payment</BandLink>
            <Button size="lg" variant="onDark" icon={<FiCalendar size={18} className="text-brand-gold" />} onClick={() => handleOpenNewCoachEvent()}>
              Add a coach event
            </Button>
          </div>
        </div>
      </section>

      {/* ── Key figures, each with a plain-language caption ── */}
      <StatStrip index={1} columns="xl:grid-cols-4">
        <StatCell label="Net revenue" hint="All time, after refunds" tone="gold" to="/transactions" isLoading={isLoading} value={stats.revenue} format={peso} />
        <StatCell label="Members" hint="Registered in total" tone="red" to="/members" isLoading={isLoading} value={stats.members} format={(v) => formatNumber(v)} />
        <StatCell label="Active subscriptions" hint="Running right now" tone="orange" to="/subscriptions" isLoading={isLoading} value={stats.activeSubs} format={(v) => formatNumber(v)} />
        <StatCell label="Transactions" hint="Recorded all time" tone="slate" to="/reports" isLoading={isLoading} value={stats.reports} format={(v) => formatNumber(v)} />
      </StatStrip>

      {/* ── Today: attendance and who needs a renewal ── */}
      <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-3">
        <Panel
          index={2}
          className="xl:col-span-2"
          title="Today's check-ins"
          icon={FiActivity}
          action={
            <PanelLink as={Link} to="/reports" state={{ defaultTab: 'Attendance' }} icon={FiArrowRight}>
              Attendance report
            </PanelLink>
          }
        >
          <div className="grid gap-5 md:grid-cols-[minmax(10rem,12rem)_minmax(0,1fr)]">
            <div className="flex items-end justify-between gap-4 md:flex-col md:items-start md:justify-between md:border-r md:border-line md:pr-5">
              <div>
                {isLoading ? (
                  <span className="skeleton h-14 w-24" />
                ) : (
                  <p className="font-display text-[3.5rem] font-medium leading-none tracking-[-0.04em] text-ink">
                    {formatNumber(checkInsShown)}
                  </p>
                )}
                <p className="mt-2 text-[13px] text-muted">check-ins so far today</p>
              </div>
              {!isLoading && busiestHour && (
                <div className="text-right md:text-left">
                  <p className="flex items-center gap-2 text-[13px] text-muted md:justify-start">
                    <span aria-hidden="true" className="h-2.5 w-2.5 rounded-xs" style={{ background: chartTheme.busiest }} />
                    Busiest hour
                  </p>
                  <p className="mt-1 text-xl font-medium tracking-[-0.02em] text-ink">{busiestHour.hour}</p>
                </div>
              )}
            </div>

            <div className="relative h-[200px] min-w-0">
              {isLoading ? (
                <span className="skeleton absolute inset-0" />
              ) : todayCheckIns === 0 ? (
                <EmptyState
                  icon={FiClock}
                  title="No check-ins yet today"
                  action={<Button size="sm" variant="outline" icon={<FiUserCheck size={14} />} onClick={() => setIsCheckInOpen(true)}>Check in a member</Button>}
                >
                  Members appear here as the camera recognises them.
                </EmptyState>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={checkInsByHour} margin={{ top: 6, right: 4, left: -10, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={chartTheme.grid} />
                    <XAxis dataKey="hour" {...axisProps} fontSize={11} interval="preserveStartEnd" />
                    <YAxis {...axisProps} allowDecimals={false} width={30} />
                    <Tooltip cursor={{ fill: chartTheme.cursor, radius: 6 }} content={<ChartTooltip unit="check-ins" />} />
                    <Bar dataKey="checkIns" name="Check-ins" radius={[5, 5, 0, 0]} maxBarSize={34} {...chartMotion}>
                      {checkInsByHour.map((slot) => (
                        <Cell key={slot.hour} fill={slot === busiestHour ? chartTheme.busiest : chartTheme.bars} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </Panel>

        <Panel
          index={3}
          title="Ending this week"
          icon={FiClock}
          meta={!isLoading && expiringSoon.length > 0 && (
            <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[13px] font-medium text-warn">{expiringSoon.length}</span>
          )}
          action={<PanelLink as={Link} to="/subscriptions" icon={FiArrowRight}>Packages</PanelLink>}
          bodyClassName="xl:max-h-[330px] overflow-y-auto"
        >
          {isLoading ? (
            <ListSkeleton rows={4} />
          ) : expiringSoon.length === 0 ? (
            <EmptyState icon={FiCheckCircle} title="Nothing ending this week">
              No memberships end in the next 7 days.
            </EmptyState>
          ) : (
            <ul className="-my-1 space-y-0.5">
              {expiringSoon.map((item, i) => {
                const urgent = item.days <= 2;
                return (
                  <RowLink
                    key={i}
                    index={i * 0.6 + 3}
                    to="/members"
                    state={{ searchTerm: item.name }}
                    label={`${item.name}, ${endsLabel(item.days).toLowerCase()}. Open in Members`}
                  >
                    <span aria-hidden="true" className={`h-9 w-1 shrink-0 rounded-full ${urgent ? 'bg-accent' : 'bg-brand-gold'}`} />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink">{item.name}</span>
                    <Badge variant={urgent ? 'danger' : 'warning'}>{endsLabel(item.days)}</Badge>
                  </RowLink>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* ── Recent activity ── */}
      <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-3">
        <Panel
          index={4}
          className="xl:col-span-2"
          title="Recent payments"
          icon={FiCreditCard}
          action={<PanelLink as={Link} to="/transactions" icon={FiArrowRight}>All transactions</PanelLink>}
        >
          {isLoading ? (
            <ListSkeleton rows={5} />
          ) : recentTxns.length === 0 ? (
            <EmptyState icon={FiCreditCard} title="No payments yet">Recorded payments show up here.</EmptyState>
          ) : (
            <ul className="-my-1 space-y-0.5">
              {recentTxns.map((txn, i) => {
                const isNegative = txn.status === 'Refunded' || Number(txn.amount) < 0;
                return (
                  <RowLink
                    key={txn.id || i}
                    index={i * 0.6 + 4}
                    to="/transactions"
                    state={{ searchTerm: txn.transactionId || txn.memberName }}
                    label={`${txn.memberName}, ${Number(txn.amount) > 0 ? '' : 'minus '}₱${formatNumber(Math.abs(txn.amount))}. Open in Transactions`}
                  >
                    <Avatar name={txn.memberName === 'Walk-in Guest' ? '' : txn.memberName} fallback={<FiUsers size={15} />} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-ink">{txn.memberName}</span>
                      <span className="mt-0.5 block truncate text-[13px] text-muted">
                        {txn.packageDetails?.title || 'Package Payment'}
                        {txn.packageDetails?.category && <> · {txn.packageDetails.category}</>}
                      </span>
                    </span>
                    <span className="hidden sm:inline-flex"><Badge variant={methodVariant(txn.method)}>{txn.method}</Badge></span>
                    <span className={`w-24 shrink-0 text-right font-display text-base font-medium tracking-[-0.01em] ${isNegative ? 'text-negative' : 'text-positive'}`}>
                      {Number(txn.amount) > 0 ? '+' : '−'} ₱{formatNumber(Math.abs(txn.amount))}
                    </span>
                  </RowLink>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          index={5}
          title="New members"
          icon={FiUserPlus}
          action={<PanelLink as={Link} to="/members" icon={FiArrowRight}>All members</PanelLink>}
        >
          {isLoading ? (
            <ListSkeleton rows={5} />
          ) : recentMembers.length === 0 ? (
            <EmptyState icon={FiUserPlus} title="No members yet">Newly registered members show up here.</EmptyState>
          ) : (
            <ul className="-my-1 space-y-0.5">
              {recentMembers.map((member, i) => {
                const name = typeof member === 'string' ? member : member.name;
                return (
                  <RowLink
                    key={member.id || name || i}
                    index={i * 0.5 + 5}
                    to="/members"
                    state={{ searchTerm: name }}
                    label={`${name}. Open in Members`}
                    className="min-h-12 py-2"
                  >
                    <Avatar name={name} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink">{name}</span>
                  </RowLink>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* ── Trends and what is coming ── */}
      <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-3">
        <Panel
          index={6}
          className="xl:col-span-2"
          title="Monthly income"
          icon={FiTrendingUp}
          meta={<span className="text-[13px] font-normal text-muted">Last 6 months</span>}
          action={<PanelLink as={Link} to="/reports" icon={FiArrowRight}>Reports</PanelLink>}
          bodyClassName="flex flex-col gap-4"
        >
          <dl className="flex flex-wrap items-end gap-x-10 gap-y-3">
            <div>
              <dt className="flex items-center gap-2 text-[13px] text-muted">
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: chartTheme.revenue }} />
                {thisMonth?.name ? `${thisMonth.name} so far` : 'This month so far'}
              </dt>
              <dd className="mt-1 font-display text-3xl font-medium tracking-[-0.03em] text-ink">
                {isLoading ? <span className="skeleton h-8 w-36" /> : peso(thisMonthShown)}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-muted">6-month total</dt>
              <dd className="mt-1 text-lg font-medium tracking-[-0.02em] text-ink-2">
                {isLoading ? <span className="skeleton h-5 w-24" /> : peso(sixMonthRevenue)}
              </dd>
            </div>
          </dl>
          <div className="relative min-h-[230px] flex-1">
            {isLoading ? (
              <span className="skeleton absolute inset-0" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartTheme.revenue} stopOpacity={0.26} />
                      <stop offset="100%" stopColor={chartTheme.revenue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={chartTheme.grid} />
                  <XAxis dataKey="name" {...axisProps} />
                  <YAxis {...axisProps} width={56} tickFormatter={(val) => `₱${formatNumber(val, { notation: 'compact', maximumFractionDigits: 1 })}`} />
                  <Tooltip
                    cursor={{ stroke: chartTheme.tick, strokeDasharray: '3 3' }}
                    content={<ChartTooltip format={peso} />}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Income"
                    stroke={chartTheme.revenue}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                    dot={(props) => (props.index === salesData.length - 1
                      ? <circle key="current" cx={props.cx} cy={props.cy} r={5} fill={chartTheme.revenue} stroke={chartTheme.dotRing} strokeWidth={2.5} />
                      : <g key={props.index} />)}
                    activeDot={{ r: 6, strokeWidth: 2.5, stroke: chartTheme.dotRing }}
                    {...chartMotion}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel
          index={7}
          title="Coming up this week"
          icon={FiCalendar}
          action={<PanelLink as="a" href="#overview-calendar" icon={FiArrowRight}>Calendar</PanelLink>}
        >
          {eventsThisWeek.length === 0 ? (
            <EmptyState
              icon={FiCalendar}
              title="No coach events this week"
              action={<Button size="sm" variant="outline" icon={<FiCalendar size={14} />} onClick={() => handleOpenNewCoachEvent()}>Add a coach event</Button>}
            >
              Classes and sessions you add show up here.
            </EmptyState>
          ) : (
            <ul className="-my-1 space-y-2">
              {eventsThisWeek.slice(0, 4).map((event, i) => {
                const start = parseDateKey(event.start_date);
                const color = event.color || event.category?.color || '#3F454D';
                const category = typeof event.category === 'string' ? event.category : event.category?.name;
                const time = [formatTime(event.start_time), formatTime(event.end_time)].filter(Boolean).join('–');
                return (
                  <li key={event.id || i} className="rise flex items-stretch gap-3.5 rounded-xl border border-line p-3" style={{ '--i': i * 0.6 + 7 }}>
                    <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-lg border-l-[3px] bg-field py-1.5" style={{ borderLeftColor: color }}>
                      <span className="text-xs font-medium uppercase text-muted">{start ? start.toLocaleDateString('en-US', { weekday: 'short' }) : ''}</span>
                      <span className="text-xl font-medium leading-none tracking-[-0.02em] text-ink">{start ? start.getDate() : '—'}</span>
                    </div>
                    <div className="min-w-0 flex-1 py-0.5">
                      <p className="truncate text-[15px] font-medium text-ink">{event.title || 'Coach event'}</p>
                      <p className="mt-0.5 truncate text-[13px] text-muted">
                        {time && <span className="font-mono text-[12.5px] tracking-tight text-ink-2">{time}</span>}
                        {time && (event.location || category) && <span aria-hidden="true"> · </span>}
                        {event.location || category || (!time && start ? start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '')}
                      </p>
                    </div>
                  </li>
                );
              })}
              {eventsThisWeek.length > 4 && (
                <li className="pt-1 text-center text-[13px] text-muted">+ {plural(eventsThisWeek.length - 4, 'more event', 'more events')} in the calendar</li>
              )}
            </ul>
          )}
        </Panel>
      </div>

      <Panel index={8} id="overview-calendar" title="Subscriptions & events calendar" icon={FiCalendar} className="relative w-full scroll-mt-4">
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
      </Panel>

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
      <ManualCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onDone={(title, message, type) => {
          setAlertDialog({ isOpen: true, title, message, type });
          fetchDashboardData(false);
        }}
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

    </div>
  );
}
