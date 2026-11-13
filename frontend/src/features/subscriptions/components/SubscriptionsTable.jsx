import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiList, FiLoader, FiAlertCircle, FiCheckSquare } from 'react-icons/fi';
import Pagination from '../../../components/ui/Pagination';
import StyledSelect from '../../../components/ui/StyledSelect';
import SearchInput from '../../../components/ui/SearchInput';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import IconButton from '../../../components/ui/IconButton';
import TableShell, { Toolbar, TableLoading, TableEmpty, CardListLoading, CardListEmpty, MobileCard } from '../../../components/ui/TableShell';
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

const memberNameOf = (sub) => (sub.member ? `${sub.member.first_name} ${sub.member.last_name}` : sub.member_name_snapshot || 'Unknown Member');

function DaysRemaining({ endDate }) {
  const daysRemaining = getDaysRemaining(endDate);
  if (daysRemaining === null) return null;
  const urgent = daysRemaining <= 7;
  return (
    <p className={`mt-1 flex items-center gap-1 text-xs font-semibold ${urgent ? 'text-negative' : 'text-muted'}`}>
      {daysRemaining >= 0 && daysRemaining <= 7 && <FiAlertCircle aria-label="Expires within 7 days" size={13} />}
      {daysRemaining < 0
        ? `Expired ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'} ago`
        : daysRemaining === 0 ? 'Ends today' : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`}
    </p>
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

  const getStatusBadge = (status) => (status === 'Active' ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Expired</Badge>);

  const rowActions = (sub, withLabels = false) => (
    <div className="inline-flex items-center gap-1.5">
      <IconButton tone="warn" label="Edit subscription" icon={<FiEdit2 size={15} />} onClick={() => onEditSubscription(sub)} disabled={deletingId === sub.id}>{withLabels && 'Edit'}</IconButton>
      <IconButton tone="danger" label="Delete subscription" icon={deletingId === sub.id ? <FiLoader size={15} className="animate-spin" /> : <FiTrash2 size={15} />} onClick={() => onDeleteSubscription(sub.id)} disabled={deletingId === sub.id}>{withLabels && 'Delete'}</IconButton>
    </div>
  );

  const memberCell = (sub, size = 'md') => (
    <button type="button" onClick={() => sub.member && navigate('/members', { state: { memberId: sub.member.id } })} className="flex min-w-0 items-center gap-3 rounded-lg text-left">
      <Avatar size={size} src={(sub.member?.profile_pic || sub.member_profile_pic_snapshot) ? getMediaUrl(sub.member?.profile_pic || sub.member_profile_pic_snapshot) : null} name={memberNameOf(sub)} />
      <div className="min-w-0">
        <span className="link-draw block truncate font-semibold text-ink">{memberNameOf(sub)}</span>
        {sub.member?.email && <span className="mt-0.5 block truncate text-xs text-muted">{sub.member.email}</span>}
      </div>
    </button>
  );

  return (
    <div className="space-y-5 lg:space-y-6">
      <Toolbar index={1} className="lg:flex-row lg:items-center">
        <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-1 lg:flex-row lg:items-center">
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
            placeholder="Search by member name or ID"
            containerClassName="relative w-full min-w-0 lg:flex-1"
          />
          <div className="grid w-full grid-cols-2 gap-3 lg:w-[24rem] lg:flex-none">
            <StyledSelect value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter subscriptions by status" className={fieldClass}>
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
            </StyledSelect>
            <StyledSelect value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} aria-label="Filter subscriptions by plan" className={fieldClass}>
              <option value="All">All Subscriptions</option>
              <option value="Annual">Annual</option>
              <option value="Monthly">Monthly</option>
              <option value="With Coach">With Coach</option>
            </StyledSelect>
          </div>
        </div>
        <Button onClick={onAddSubscription} icon={<FiPlus size={18} strokeWidth={2.5} />} className="w-full shrink-0 whitespace-nowrap sm:w-auto">
          Add Subscriber
        </Button>
      </Toolbar>

      <TableShell index={2} title="Total Subscribers" icon={FiList} count={filteredSubs.length}>
        <div className="hidden overflow-hidden xl:block">
          <table className="w-full min-w-0 table-fixed border-collapse text-left align-middle">
            <colgroup>
              <col className="w-[9%]" />
              <col className="w-[28%]" />
              <col className="w-[23%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-line">
                <th className={`${thClass} whitespace-nowrap text-center`}>Member ID</th>
                <th className={thClass}>Member Details</th>
                <th className={thClass}>Subscription Type</th>
                <th className={thClass}>Duration</th>
                <th className={`${thClass} text-center`}>Status</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                <TableLoading colSpan={6} />
              ) : currentSubs.length === 0 ? (
                <TableEmpty colSpan={6} icon={FiCheckSquare}>No subscriptions found.</TableEmpty>
              ) : (
                currentSubs.map((sub, i) => (
                  <tr key={sub.id} className="rise transition-colors hover:bg-hover" style={{ '--i': Math.min(i, 8) * 0.5 + 2 }}>
                    <td className={`${tdClass} text-center font-display text-base tabular-nums text-muted`}>{sub.member?.id ?? sub.member_id ?? '-'}</td>
                    <td className={`${tdClass} overflow-hidden`}>{memberCell(sub)}</td>
                    <td className={`${tdClass} overflow-hidden`}>
                      <div className="min-w-0">
                        <span className="block truncate font-semibold text-ink">{sub.plan_type}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted">{getPackageCategoryLabel(plans.find(item => item.name === sub.plan_type))}</span>
                        {sub.has_upgraded && <Badge variant="info" size="sm" className="mt-1.5 normal-case tracking-normal">+ Upgraded</Badge>}
                      </div>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <div className="text-sm text-ink tabular-nums">{sub.start_date}</div>
                      <div className="mt-0.5 text-xs text-muted tabular-nums">to {sub.end_date}</div>
                      <DaysRemaining endDate={sub.end_date} />
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-center`}>{getStatusBadge(sub.status)}</td>
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
            <CardListEmpty>No subscriptions found.</CardListEmpty>
          ) : currentSubs.map((sub, i) => (
            <MobileCard key={sub.id} index={i}>
              <div className="flex items-start justify-between gap-3">
                {memberCell(sub, 'lg')}
                {getStatusBadge(sub.status)}
              </div>
              <div className="mt-3 border-t border-line pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-ink">{sub.plan_type}</span>
                  {sub.has_upgraded && <Badge variant="info" size="sm" className="normal-case tracking-normal">+ Upgraded</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-muted">{getPackageCategoryLabel(plans.find(item => item.name === sub.plan_type))}</p>
                <p className="mt-2 text-xs text-ink-2 tabular-nums">{sub.start_date} <span className="text-muted">to</span> {sub.end_date}</p>
                <DaysRemaining endDate={sub.end_date} />
                <p className="mt-1 text-xs text-muted">Member ID <span className="font-semibold tabular-nums text-ink-2">{sub.member?.id ?? sub.member_id ?? '-'}</span></p>
              </div>
              <div className="mt-3 flex justify-end border-t border-line pt-3">{rowActions(sub, true)}</div>
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
