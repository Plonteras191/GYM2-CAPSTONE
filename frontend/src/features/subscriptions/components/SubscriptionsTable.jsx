import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiList, FiLoader, FiAlertCircle, FiSearch, FiX, FiCheckSquare } from 'react-icons/fi';
import Pagination from '../../../components/ui/Pagination';
import StyledSelect from '../../../components/ui/StyledSelect';
import SearchInput from '../../../components/ui/SearchInput';
import SegmentedFilter from '../../../components/ui/SegmentedFilter';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import IconButton from '../../../components/ui/IconButton';
import TableShell, { Toolbar, TableLoading, CardListLoading, MobileCard } from '../../../components/ui/TableShell';
import { fieldClass, thClass, tdClass } from '../../../components/ui/field';
import { getSubscriptionFilterGroup } from '../packageCategories';
import { getPackageCategoryLabel } from '../packageCategories';
import { getMediaUrl } from '../../../utils/mediaUrl';
import { useNavigate } from 'react-router-dom';

const getDaysRemaining = (endDate) => {
  if (!endDate) return null;
  const [year, month, day] = String(endDate).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  const end = Date.UTC(year, month - 1, day);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((end - today) / 86400000);
};

/* ── Display-only helpers ── */
const parseDay = (value) => {
  const [y, m, d] = String(value || '').slice(0, 10).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};
const formatDay = (value) => parseDay(value)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || value || '—';

/** Share of the membership already used, 0 to 1. */
const progressOf = (start, end) => {
  const a = parseDay(start);
  const b = parseDay(end);
  if (!a || !b || b <= a) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.min(1, Math.max(0, (today - a) / (b - a)));
};

const memberNameOf = (sub) => (sub.member ? `${sub.member.first_name} ${sub.member.last_name}` : sub.member_name_snapshot || 'Unknown Member');

function Remaining({ endDate }) {
  const daysRemaining = getDaysRemaining(endDate);
  if (daysRemaining === null) return null;
  if (daysRemaining < 0) {
    return <span className="text-[13px] text-muted">Ended {Math.abs(daysRemaining)} day{Math.abs(daysRemaining) === 1 ? '' : 's'} ago</span>;
  }
  const urgent = daysRemaining <= 7;
  return (
    <span className={`inline-flex items-center gap-1 text-[13px] ${urgent ? 'font-medium text-negative' : 'text-muted'}`}>
      {urgent && <FiAlertCircle aria-label="Ends within 7 days" size={13} />}
      {daysRemaining === 0 ? 'Ends today' : daysRemaining === 1 ? 'Ends tomorrow' : `${daysRemaining} days left`}
    </span>
  );
}

/** Dates in words plus a thin bar showing how much of the membership is used up. */
function Duration({ sub }) {
  const progress = progressOf(sub.start_date, sub.end_date);
  const days = getDaysRemaining(sub.end_date);
  const barColor = days !== null && days < 0 ? 'bg-line-strong' : days !== null && days <= 7 ? 'bg-negative' : 'bg-brand-gold';
  return (
    <div className="min-w-0">
      <div className="truncate text-sm text-ink">{formatDay(sub.start_date)} <span className="text-muted">→</span> {formatDay(sub.end_date)}</div>
      {progress !== null && (
        <div className="mt-2 h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-hover" role="img" aria-label={`${Math.round(progress * 100)}% of the membership used`}>
          <div className={`grow-bar h-full rounded-full ${barColor}`} style={{ '--w': progress }} />
        </div>
      )}
      <div className="mt-1.5"><Remaining endDate={sub.end_date} /></div>
    </div>
  );
}

function NoResults({ isFiltered, searchTerm, onClear, onAdd }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-hover text-muted">
        {isFiltered ? <FiSearch size={20} aria-hidden="true" /> : <FiCheckSquare size={20} aria-hidden="true" />}
      </span>
      <div>
        <p className="text-[15px] font-medium text-ink">
          {isFiltered ? (searchTerm.trim() ? `No subscriptions match “${searchTerm.trim()}”` : 'No subscriptions with these filters') : 'No subscriptions yet'}
        </p>
        <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted">
          {isFiltered ? 'Try another name or member ID, or clear the filters.' : 'Members you subscribe to a package will be listed here.'}
        </p>
      </div>
      {isFiltered
        ? <Button size="sm" variant="outline" icon={<FiX size={14} />} onClick={onClear}>Clear search and filters</Button>
        : <Button size="sm" icon={<FiPlus size={14} />} onClick={onAdd}>Add subscriber</Button>}
    </div>
  );
}

export default function SubscriptionsTable({
  subscriptions,
  isLoading,
  plans,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterPlan,
  setFilterPlan,
  deletingId,
  onAddSubscription,
  onEditSubscription,
  onDeleteSubscription
}) {
  const navigate = useNavigate();
  const filteredSubs = subscriptions.filter(sub => {
    const memberName = sub.member ? `${sub.member.first_name} ${sub.member.last_name}`.toLowerCase() : '';
    const memberId = String(sub.member?.id ?? sub.member_id ?? '');
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch = memberName.includes(normalizedSearch) || memberId.includes(normalizedSearch);
    const matchesStatus = filterStatus === 'All' || sub.status === filterStatus;
    const matchesPlan = filterPlan === 'All' || getSubscriptionFilterGroup(sub, plans) === filterPlan;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, filterPlan]);
  const totalPages = Math.ceil(filteredSubs.length / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const currentSubs = filteredSubs.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage);
  useEffect(() => {
    setCurrentPage(page => Math.max(1, Math.min(page, totalPages || 1)));
  }, [totalPages]);

  /* ── Display-only ── */
  const counts = {
    All: subscriptions.length,
    Active: subscriptions.filter(sub => sub.status === 'Active').length,
    Expired: subscriptions.filter(sub => sub.status === 'Expired').length,
  };
  const isFiltered = searchTerm.trim() !== '' || filterStatus !== 'All' || filterPlan !== 'All';
  const clearFilters = () => { setSearchTerm(''); setFilterStatus('All'); setFilterPlan('All'); };

  const getStatusBadge = (status) => (status === 'Active' ? <Badge variant="success" dot>Active</Badge> : <Badge variant="danger" dot>Expired</Badge>);

  const rowActions = (sub, withLabels = false) => (
    <div className="inline-flex items-center gap-1.5">
      <IconButton tone="warn" label={`Edit subscription of ${memberNameOf(sub)}`} icon={<FiEdit2 size={15} />} onClick={() => onEditSubscription(sub)} disabled={deletingId === sub.id}>{withLabels && 'Edit'}</IconButton>
      <IconButton tone="danger" label={`Delete subscription of ${memberNameOf(sub)}`} icon={deletingId === sub.id ? <FiLoader size={15} className="animate-spin" /> : <FiTrash2 size={15} />} onClick={() => onDeleteSubscription(sub.id)} disabled={deletingId === sub.id}>{withLabels && 'Delete'}</IconButton>
    </div>
  );

  const memberCell = (sub, size = 'md') => (
    <button type="button" onClick={() => sub.member && navigate('/members', { state: { memberId: sub.member.id } })} className="flex min-w-0 items-center gap-3 rounded-lg text-left">
      <Avatar size={size} src={(sub.member?.profile_pic || sub.member_profile_pic_snapshot) ? getMediaUrl(sub.member?.profile_pic || sub.member_profile_pic_snapshot) : null} name={memberNameOf(sub)} />
      <div className="min-w-0">
        <span className={`block truncate text-[15px] font-medium text-ink${sub.member ? ' link-draw' : ''}`}>{memberNameOf(sub)}</span>
        {sub.member?.email && <span className="mt-0.5 block truncate text-[13px] text-muted">{sub.member.email}</span>}
      </div>
    </button>
  );

  const packageCell = (sub) => (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="truncate font-medium text-ink">{sub.plan_type}</span>
        {sub.has_upgraded && <Badge variant="info" size="sm">Upgraded</Badge>}
      </div>
      <span className="mt-0.5 block truncate text-[13px] text-muted">{getPackageCategoryLabel(plans.find(item => item.name === sub.plan_type))}</span>
    </div>
  );

  return (
    <div className="space-y-5 lg:space-y-6">
      <Toolbar index={2} className="lg:flex-row lg:items-center">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search by member name or ID"
          containerClassName="relative w-full min-w-0 lg:flex-1"
        />
        <SegmentedFilter
          label="Filter subscriptions by status"
          value={filterStatus}
          onChange={setFilterStatus}
          className="w-full lg:w-auto"
          options={[
            { value: 'All', label: 'All', count: counts.All },
            { value: 'Active', label: 'Active', count: counts.Active, dot: 'bg-positive' },
            { value: 'Expired', label: 'Expired', count: counts.Expired, dot: 'bg-negative' },
          ]}
        />
        <div className="w-full min-w-0 lg:w-48">
          <StyledSelect value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} aria-label="Filter subscriptions by type" className={fieldClass}>
            <option value="All">All types</option>
            <option value="Annual">Annual</option>
            <option value="Monthly">Monthly</option>
            <option value="With Coach">With coach</option>
          </StyledSelect>
        </div>
        <Button onClick={onAddSubscription} icon={<FiPlus size={18} strokeWidth={2.5} />} className="w-full shrink-0 whitespace-nowrap lg:w-auto">
          Add subscriber
        </Button>
      </Toolbar>

      <TableShell
        index={3}
        title={isFiltered ? 'Matching subscriptions' : 'All subscriptions'}
        icon={FiList}
        count={filteredSubs.length}
        action={isFiltered && !isLoading && (
          <div className="flex items-center gap-3 text-[13px]">
            <span className="text-muted">Showing {filteredSubs.length.toLocaleString()} of {subscriptions.length.toLocaleString()}</span>
            <button type="button" onClick={clearFilters} className="press inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 font-medium text-ink-2 hover:bg-hover hover:text-ink">
              <FiX size={14} aria-hidden="true" /> Clear filters
            </button>
          </div>
        )}
      >
        <div className="hidden overflow-hidden xl:block">
          <table className="w-full min-w-0 table-fixed border-collapse text-left align-middle">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[8%]" />
              <col className="w-[20%]" />
              <col className="w-[22%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-line">
                <th className={thClass}>Member</th>
                <th className={`${thClass} whitespace-nowrap`}>Member ID</th>
                <th className={thClass}>Package</th>
                <th className={thClass}>Duration</th>
                <th className={thClass}>Status</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                <TableLoading colSpan={6} />
              ) : currentSubs.length === 0 ? (
                <tr><td colSpan={6}><NoResults isFiltered={isFiltered} searchTerm={searchTerm} onClear={clearFilters} onAdd={onAddSubscription} /></td></tr>
              ) : (
                currentSubs.map((sub, i) => (
                  <tr key={sub.id} className="rise transition-colors duration-150 hover:bg-hover" style={{ '--i': Math.min(i, 8) * 0.5 + 3 }}>
                    <td className={`${tdClass} overflow-hidden`}>{memberCell(sub)}</td>
                    <td className={`${tdClass} font-mono text-[13px] text-muted`}>{sub.member?.id ?? sub.member_id ?? '-'}</td>
                    <td className={`${tdClass} overflow-hidden`}>{packageCell(sub)}</td>
                    <td className={`${tdClass} overflow-hidden`}><Duration sub={sub} /></td>
                    <td className={`${tdClass} whitespace-nowrap`}>{getStatusBadge(sub.status)}</td>
                    <td className={`${tdClass} whitespace-nowrap text-right`}>{rowActions(sub)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-3 xl:hidden">
          {isLoading ? (
            <CardListLoading />
          ) : currentSubs.length === 0 ? (
            <NoResults isFiltered={isFiltered} searchTerm={searchTerm} onClear={clearFilters} onAdd={onAddSubscription} />
          ) : currentSubs.map((sub, i) => (
            <MobileCard key={sub.id} index={i}>
              <div className="flex items-start justify-between gap-3">
                {memberCell(sub, 'lg')}
                {getStatusBadge(sub.status)}
              </div>
              <div className="mt-3 grid gap-3 border-t border-line pt-3 sm:grid-cols-2">
                {packageCell(sub)}
                <Duration sub={sub} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                <span className="text-[13px] text-muted">Member ID <span className="font-mono text-ink-2">{sub.member?.id ?? sub.member_id ?? '-'}</span></span>
                {rowActions(sub, true)}
              </div>
            </MobileCard>
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredSubs.length}
          itemsPerPage={itemsPerPage}
          itemsLabel="subscriptions"
        />
      </TableShell>
    </div>
  );
}
