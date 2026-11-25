import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FiCalendar, FiSearch, FiX, FiAlertCircle, FiChevronRight } from 'react-icons/fi';
import api from '../api';
import { useDataCache } from '../context/DataCacheContext';
import { StatStrip, StatCell } from '../components/ui/StatStrip';
import TableShell, { Toolbar, TableLoading, CardListLoading, MobileCard } from '../components/ui/TableShell';
import { fieldClass, thClass, tdClass } from '../components/ui/field';
import SearchInput from '../components/ui/SearchInput';
import SegmentedFilter from '../components/ui/SegmentedFilter';
import StyledSelect from '../components/ui/StyledSelect';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import AlertDialog from '../components/ui/AlertDialog';
import { getMediaUrl } from '../utils/mediaUrl';
import { formatNumber } from '../utils/numberFormat';
import AttendanceDetailModal from '../features/attendance/components/AttendanceDetailModal';
import SubscriptionBadge from '../features/attendance/components/SubscriptionBadge';
import WeekStrip from '../features/attendance/components/WeekStrip';
import { ABSENT_AFTER_DAYS, isAbsent, lastVisitLabel } from '../features/attendance/attendanceFormat';

const CACHE_KEY = 'attendance_tracker';
const PAGE_SIZE = 10;
const ABSENT = 'Absent';

const SORTS = {
  absent: { label: 'Longest absent first', compare: (a, b) => (b.attendance.days_since_last_visit ?? Infinity) - (a.attendance.days_since_last_visit ?? Infinity) },
  recent: { label: 'Most recent visit first', compare: (a, b) => (a.attendance.days_since_last_visit ?? Infinity) - (b.attendance.days_since_last_visit ?? Infinity) },
  month: { label: 'Most visits this month', compare: (a, b) => b.attendance.month_visits - a.attendance.month_visits },
  name: { label: 'Name (A–Z)', compare: (a, b) => a.member.name.localeCompare(b.member.name) },
};

const daysWord = (n) => `${n} day${n === 1 ? '' : 's'}`;

function subscriptionNote(subscription) {
  if (subscription.status === 'Active' && subscription.days_left !== null) return `${daysWord(subscription.days_left)} left`;
  if (subscription.status === 'Paused' && subscription.paused_days_left !== null) return `${daysWord(subscription.paused_days_left)} kept`;
  if (subscription.status === 'Expired') return 'Ended';
  return '';
}

function LastVisit({ row }) {
  const absent = isAbsent(row);
  const { attendance } = row;
  return (
    <div className="min-w-0">
      <span className={`inline-flex items-center gap-1 text-sm ${absent ? 'font-semibold text-negative' : 'font-medium text-ink'}`}>
        {absent && <FiAlertCircle size={13} aria-hidden="true" />}
        {lastVisitLabel(attendance)}
      </span>
      {absent && <span className="block text-[12px] text-negative">Not seen in {ABSENT_AFTER_DAYS}+ days</span>}
    </div>
  );
}

function PlanProgress({ plan }) {
  if (!plan) return <span className="text-[13px] text-muted">No coach plan</span>;
  if (plan.week_assigned === 0) return <span className="text-[13px] text-muted">No tasks this week</span>;
  const share = plan.week_done / plan.week_assigned;
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="font-medium text-ink">{plan.week_done}/{plan.week_assigned} done</span>
        {plan.week_missed > 0 && <span className="text-negative">{plan.week_missed} missed</span>}
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-hover" role="img" aria-label={`${Math.round(share * 100)}% of this week's tasks done`}>
        <div className="h-full rounded-full bg-brand-gold" style={{ width: `${share * 100}%` }} />
      </div>
    </div>
  );
}

function MemberCell({ row, size = 'md' }) {
  const { member, subscription } = row;
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar size={size} src={member.profile_pic ? getMediaUrl(member.profile_pic) : null} name={member.name} />
      <div className="min-w-0">
        <span className="block truncate text-[15px] font-medium text-ink">{member.name}</span>
        <span className="mt-0.5 block truncate text-[13px] text-muted">
          <span className="font-mono">#{member.id}</span> · {subscription.plan_type}
        </span>
      </div>
    </div>
  );
}

/** Every subscriber's attendance at a glance; a row opens their calendar in a side panel. */
export default function AttendanceTracker() {
  const location = useLocation();
  const { getCache, setCache, invalidateCache } = useDataCache();
  const cached = getCache(CACHE_KEY);
  const [data, setData] = useState(cached || { summary: {}, rows: [] });
  const [isLoading, setIsLoading] = useState(!cached);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('absent');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const fetchData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    try {
      const { data: next } = await api.get('/attendance/subscribers');
      setData(next);
      setCache(CACHE_KEY, next);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setCache]);

  useEffect(() => { fetchData(!getCache(CACHE_KEY)); }, [fetchData, getCache]);

  // The "Not seen in 7+ days" card links here with this flag.
  useEffect(() => {
    if (location.state?.absentOnly) setFilter(ABSENT);
  }, [location.key, location.state]);

  const rows = useMemo(() => data.rows || [], [data.rows]);
  const summary = data.summary || {};
  const weekStart = data.week_start;

  const matchesFilter = (row, value) => (
    value === 'All' ? true : value === ABSENT ? isAbsent(row) : row.subscription.status === value
  );
  const filterOptions = [
    { value: 'All', label: 'All' },
    { value: 'Active', label: 'Active', dot: 'bg-positive' },
    { value: ABSENT, label: `Not seen ${ABSENT_AFTER_DAYS}+ days`, dot: 'bg-negative' },
    { value: 'Paused', label: 'Paused', dot: 'bg-warn' },
    { value: 'Expired', label: 'Expired', dot: 'bg-line-strong' },
  ].map(option => ({ ...option, count: rows.filter(row => matchesFilter(row, option.value)).length }));

  const filtered = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    const inFilter = (row) => (filter === 'All' ? true : filter === ABSENT ? isAbsent(row) : row.subscription.status === filter);
    return rows
      .filter(row => !needle || row.member.name.toLowerCase().includes(needle) || String(row.member.id).includes(needle))
      .filter(inFilter)
      .sort(SORTS[sortBy].compare);
  }, [rows, searchTerm, filter, sortBy]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filter, sortBy]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectedRow = rows.find(row => row.member.id === selectedId) || null;

  const isFiltered = searchTerm.trim() !== '' || filter !== 'All';
  const clearFilters = () => { setSearchTerm(''); setFilter('All'); };

  const afterCheckIn = () => {
    invalidateCache(CACHE_KEY);
    invalidateCache('dashboard');
    fetchData(false);
  };

  const noResults = (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-hover text-muted">
        {isFiltered ? <FiSearch size={20} aria-hidden="true" /> : <FiCalendar size={20} aria-hidden="true" />}
      </span>
      <p className="text-[15px] font-medium text-ink">{isFiltered ? 'No subscribers match these filters' : 'No subscribers yet'}</p>
      <p className="max-w-sm text-[13px] text-muted">
        {isFiltered ? 'Try another name or member ID, or clear the filters.' : 'Members appear here once they have a subscription on the Packages page.'}
      </p>
      {isFiltered && <Button size="sm" variant="outline" icon={<FiX size={14} />} onClick={clearFilters}>Clear filters</Button>}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6 lg:space-y-6">
      <StatStrip>
        <StatCell
          label="Checked in today"
          hint={`of ${formatNumber(summary.subscribers ?? 0)} subscribers`}
          tone="gold"
          isLoading={isLoading}
          value={summary.checked_in_today ?? 0}
          format={formatNumber}
        />
        <StatCell label="Visits this week" hint="Monday to today" tone="slate" isLoading={isLoading} value={summary.visits_this_week ?? 0} format={formatNumber} />
        <StatCell
          label={`Not seen in ${ABSENT_AFTER_DAYS}+ days`}
          hint="Active subscribers to check on"
          tone="crimson"
          to="/attendance"
          state={{ absentOnly: true }}
          isLoading={isLoading}
          value={summary.absent ?? 0}
          format={formatNumber}
        />
        <StatCell label="Paused" hint="Days kept until resumed" tone="orange" isLoading={isLoading} value={summary.paused ?? 0} format={formatNumber} />
      </StatStrip>

      <Toolbar index={1}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
            placeholder="Search by name or member ID"
            containerClassName="relative w-full min-w-0 sm:flex-1"
          />
          <div className="w-full min-w-0 sm:w-60">
            <StyledSelect value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort subscribers" className={fieldClass}>
              {Object.entries(SORTS).map(([value, sort]) => <option key={value} value={value}>{sort.label}</option>)}
            </StyledSelect>
          </div>
        </div>
        <div className="-mx-1 overflow-x-auto px-1 pb-0.5">
          <SegmentedFilter label="Filter subscribers" value={filter} onChange={setFilter} className="min-w-max" options={filterOptions} />
        </div>
      </Toolbar>

      <TableShell
        index={2}
        title={isFiltered ? 'Matching subscribers' : 'All subscribers'}
        icon={FiCalendar}
        count={filtered.length}
        action={isFiltered && !isLoading && (
          <button type="button" onClick={clearFilters} className="press inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold text-ink-2 hover:bg-hover hover:text-ink">
            <FiX size={14} aria-hidden="true" /> Clear filters
          </button>
        )}
      >
        <div className="hidden overflow-hidden xl:block">
          <table className="w-full min-w-0 table-fixed border-collapse text-left align-middle">
            <colgroup>
              <col className="w-[26%]" />
              <col className="w-[15%]" />
              <col className="w-[19%]" />
              <col className="w-[15%]" />
              <col className="w-[9%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-line">
                <th className={thClass}>Member</th>
                <th className={thClass}>Subscription</th>
                <th className={thClass}>This week</th>
                <th className={thClass}>Last visit</th>
                <th className={`${thClass} text-center`}>This month</th>
                <th className={thClass}>Coach plan (week)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                <TableLoading colSpan={6} />
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={6}>{noResults}</td></tr>
              ) : pageRows.map((row, i) => (
                <tr
                  key={row.member.id}
                  tabIndex={0}
                  onClick={() => setSelectedId(row.member.id)}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedId(row.member.id); } }}
                  aria-label={`Open attendance of ${row.member.name}`}
                  className="rise group cursor-pointer transition-colors duration-150 hover:bg-hover focus-visible:bg-hover focus-visible:outline-none"
                  style={{ '--i': Math.min(i, 8) * 0.5 + 3 }}
                >
                  <td className={`${tdClass} overflow-hidden`}><MemberCell row={row} /></td>
                  <td className={tdClass}>
                    <SubscriptionBadge status={row.subscription.status} />
                    <span className="mt-1 block text-[13px] text-muted">{subscriptionNote(row.subscription)}</span>
                  </td>
                  <td className={tdClass}>
                    <WeekStrip days={row.attendance.week_days} weekStart={weekStart} />
                    <span className="mt-1 block text-[12px] text-muted">{row.attendance.week_visits} of 7 days</span>
                  </td>
                  <td className={`${tdClass} overflow-hidden`}><LastVisit row={row} /></td>
                  <td className={`${tdClass} text-center font-display text-xl font-medium tabular-nums text-ink`}>{row.attendance.month_visits}</td>
                  <td className={`${tdClass} overflow-hidden`}>
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1"><PlanProgress plan={row.plan} /></div>
                      <FiChevronRight size={18} className="shrink-0 text-line-strong transition-colors group-hover:text-ink" aria-hidden="true" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-3 xl:hidden">
          {isLoading ? <CardListLoading /> : pageRows.length === 0 ? noResults : pageRows.map((row, i) => (
            <MobileCard key={row.member.id} index={i}>
              <button type="button" onClick={() => setSelectedId(row.member.id)} className="block w-full text-left normal-case" aria-label={`Open attendance of ${row.member.name}`}>
                <div className="flex items-start justify-between gap-3">
                  <MemberCell row={row} size="lg" />
                  <SubscriptionBadge status={row.subscription.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-3">
                  <div>
                    <span className="mb-1.5 block text-[12px] text-muted">This week · {row.attendance.month_visits} this month</span>
                    <WeekStrip days={row.attendance.week_days} weekStart={weekStart} />
                  </div>
                  <div className="text-right"><LastVisit row={row} /></div>
                </div>
                {row.plan && <div className="mt-3 border-t border-line pt-3"><PlanProgress plan={row.plan} /></div>}
              </button>
            </MobileCard>
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          itemsPerPage={PAGE_SIZE}
          itemsLabel="subscribers"
        />
      </TableShell>

      <AttendanceDetailModal
        row={selectedRow}
        weekStart={weekStart}
        onClose={() => setSelectedId(null)}
        onCheckedIn={afterCheckIn}
        onShowAlert={(title, message, type) => setAlertDialog({ isOpen: true, title, message, type })}
        isCovered={alertDialog.isOpen}
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
