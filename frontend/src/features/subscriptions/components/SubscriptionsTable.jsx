import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiList, FiLoader, FiX, FiAlertCircle } from 'react-icons/fi';
import Pagination from '../../../components/ui/Pagination';
import StyledSelect from '../../../components/ui/StyledSelect';
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

  const getStatusBadge = (status) => {
    const base = "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-solid shadow-sm";
    if (status === 'Active') return <span className={`${base} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`}>Active</span>;
    return <span className={`${base} bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50`}>Expired</span>;
  };

  const primaryButtonClass = "mx-1 flex min-h-[38px] items-center justify-center gap-2 rounded-lg border-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-3.5 py-2 font-sans text-[15px] font-bold normal-case text-black shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 bg-white dark:bg-[#252833] p-4 sm:p-5 rounded-2xl border-2 border-gray-300 dark:border-[#393e4f] shadow-sm lg:flex-row lg:items-center">
        <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-1 lg:flex-row lg:items-center">
          <div className="relative w-full min-w-0 lg:flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6d758d] text-lg pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search by member name or ID..."
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 dark:bg-[#191b22] border-2 border-gray-300 dark:border-[#393e4f] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-[#6d758d] font-medium transition-all shadow-sm" 
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')} 
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-[#6d758d] dark:hover:text-white p-1"
              >
                <FiX size={15} />
              </button>
            )}
          </div>
          <div className="grid w-full grid-cols-2 gap-3 lg:w-[26rem] lg:flex-none">
            <StyledSelect
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter subscriptions by status"
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer dark:border-slate-700 dark:bg-[#1b1e26] dark:text-gray-200 dark:hover:border-slate-600 dark:focus:ring-slate-600 sm:px-4"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
            </StyledSelect>
            <StyledSelect
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              aria-label="Filter subscriptions by plan"
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer dark:border-slate-700 dark:bg-[#1b1e26] dark:text-gray-200 dark:hover:border-slate-600 dark:focus:ring-slate-600 sm:px-4"
            >
              <option value="All">All Subscriptions</option>
              <option value="Annual">Annual</option>
              <option value="Monthly">Monthly</option>
              <option value="With Coach">With Coach</option>
            </StyledSelect>
          </div>
        </div>
        <button onClick={onAddSubscription} className={`${primaryButtonClass} w-full shrink-0 whitespace-nowrap sm:w-auto lg:mx-0`}>
          <FiPlus size={18} strokeWidth={3} /> Add Subscriber
        </button>
      </div>

      <div className="bg-white dark:bg-[#252833] rounded-2xl border-2 border-gray-300 dark:border-[#393e4f] shadow-sm overflow-hidden">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 dark:border-[#393e4f] dark:bg-[#191b22]/50 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-2">
            <FiList size={18} className="shrink-0 text-slate-800 dark:text-gray-300" />
            <span className="min-w-0 truncate text-base font-bold tracking-wide text-slate-800 dark:text-gray-300">Total Subscribers</span>
            <span className="shrink-0 rounded-lg border-2 border-gray-300 bg-white px-2.5 py-1 text-sm font-semibold tabular-nums text-slate-700 dark:border-[#393e4f] dark:bg-[#252833] dark:text-gray-300">
              {filteredSubs.length.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="hidden overflow-hidden xl:block">
          <table className="w-full min-w-0 table-fixed border-collapse text-left align-middle">
            <colgroup>
              <col className="w-[9%]" />
              <col className="w-[27%]" />
              <col className="w-[22%]" />
              <col className="w-[20%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr className="bg-gray-100 dark:bg-[#191b22] border-b-2 border-gray-300 dark:border-[#393e4f]">
                <th className="whitespace-nowrap px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Member ID</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Member Details</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Subscription Type</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Duration</th>
                <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Subscription Status</th>
                <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#393e4f]">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-amber-200 dark:border-amber-900 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest animate-pulse">Loading Database...</p>
                    </div>
                  </td>
                </tr>
              ) : currentSubs.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium">No subscriptions found.</td></tr>
              ) : (
                currentSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-[#191b22]/50 transition-colors group">
                    <td className="px-3 py-3 text-center text-sm font-bold tabular-nums text-slate-600 dark:text-gray-400">{sub.member?.id ?? sub.member_id ?? '-'}</td>
                    <td className="overflow-hidden px-3 py-3">
                      <button type="button" onClick={() => sub.member && navigate('/members', { state: { memberId: sub.member.id } })} className="flex min-w-0 items-center gap-3 text-left">
                        {(sub.member?.profile_pic || sub.member_profile_pic_snapshot) ? (
                          <img src={getMediaUrl(sub.member?.profile_pic || sub.member_profile_pic_snapshot)} alt="" className="h-10 w-10 shrink-0 rounded-full border-2 border-gray-300 object-cover shadow-sm dark:border-gray-600" />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 bg-gray-100 text-xs font-bold text-slate-700 dark:border-gray-600 dark:bg-[#191b22] dark:text-gray-300">
                            {(sub.member
                              ? `${sub.member.first_name?.[0] || ''}${sub.member.last_name?.[0] || ''}`
                              : (sub.member_name_snapshot || '?').trim().split(/\s+/).slice(0, 2).map(name => name[0] || '').join('')
                            ).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="block truncate font-semibold text-black dark:text-gray-300">
                            {sub.member ? `${sub.member.first_name} ${sub.member.last_name}` : sub.member_name_snapshot || 'Unknown Member'}
                          </span>
                          {sub.member?.email && <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">{sub.member.email}</span>}
                      </div>
                      </button>
                    </td>
                    <td className="overflow-hidden px-3 py-3">
                      <div className="min-w-0">
                        <span className="block truncate text-sm font-bold text-black dark:text-gray-300">{sub.plan_type}</span>
                        <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500 dark:text-gray-400">
                          {getPackageCategoryLabel(plans.find(item => item.name === sub.plan_type))}
                        </span>
                        {sub.has_upgraded && <span className="mt-1 inline-block rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">+ Upgraded</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-sm font-normal text-black dark:text-gray-400">{sub.start_date}</div>
                      <div className="text-xs font-normal text-slate-500 dark:text-gray-400 mt-0.5">to {sub.end_date}</div>
                      {(() => {
                        const daysRemaining = getDaysRemaining(sub.end_date);
                        return daysRemaining === null ? null : (
                          <div className={`mt-1 flex items-center gap-1 text-xs font-semibold ${daysRemaining < 0 ? 'text-red-600 dark:text-red-400' : daysRemaining <= 7 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-gray-400'}`}>
                            {daysRemaining >= 0 && daysRemaining <= 7 && <FiAlertCircle aria-label="Expires within 7 days" size={13} />}
                            {daysRemaining < 0 ? `Expired ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'} ago` : daysRemaining === 0 ? 'Ends today' : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">{getStatusBadge(sub.status)}</td>
                    <td className="space-x-2 whitespace-nowrap px-3 py-3 text-right sm:space-x-3">
                      <button 
                        onClick={() => onEditSubscription(sub)} 
                        disabled={deletingId === sub.id} 
                        className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#191b22] text-amber-600 dark:text-amber-400 border-2 border-gray-300 dark:border-[#393e4f] hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50"
                      >
                        <FiEdit2 size={16} strokeWidth={2.5} />
                      </button>
                      <button 
                        onClick={() => onDeleteSubscription(sub.id)} 
                        disabled={deletingId === sub.id} 
                        className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#191b22] text-red-600 dark:text-red-400 border-2 border-gray-300 dark:border-[#393e4f] hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50"
                      >
                        {deletingId === sub.id ? <FiLoader size={16} className="animate-spin" /> : <FiTrash2 size={16} strokeWidth={2.5} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-3 xl:hidden">
          {isLoading ? (
            <p role="status" className="py-8 text-center text-sm font-semibold text-slate-500 dark:text-gray-400">Loading subscriptions…</p>
          ) : currentSubs.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-gray-400">No subscriptions found.</p>
          ) : currentSubs.map(sub => {
            const plan = plans.find(item => item.name === sub.plan_type);
            const daysRemaining = getDaysRemaining(sub.end_date);
            return (
              <article key={sub.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#393e4f] dark:bg-[#1b1e26]">
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => sub.member && navigate('/members', { state: { memberId: sub.member.id } })} className="flex min-w-0 items-center gap-3 text-left">
                    {(sub.member?.profile_pic || sub.member_profile_pic_snapshot) ? (
                      <img src={getMediaUrl(sub.member?.profile_pic || sub.member_profile_pic_snapshot)} alt="" className="h-10 w-10 shrink-0 rounded-full border-2 border-gray-300 object-cover dark:border-gray-600" />
                    ) : (
                      <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 bg-gray-100 text-xs font-bold text-slate-700 dark:border-gray-600 dark:bg-[#191b22] dark:text-gray-300">
                        {(sub.member
                          ? `${sub.member.first_name?.[0] || ''}${sub.member.last_name?.[0] || ''}`
                          : (sub.member_name_snapshot || '?').trim().split(/\s+/).slice(0, 2).map(name => name[0] || '').join('')
                        ).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900 dark:text-gray-200">{sub.member ? `${sub.member.first_name} ${sub.member.last_name}` : sub.member_name_snapshot || 'Unknown Member'}</p>
                      {sub.member?.email && <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-gray-400">{sub.member.email}</p>}
                      <p className="mt-0.5 text-xs font-bold tabular-nums text-slate-500 dark:text-gray-400">Member ID: {sub.member?.id ?? sub.member_id ?? '-'}</p>
                  </div>
                  </button>
                  {getStatusBadge(sub.status)}
                </div>
                <div className="mt-3 border-t border-slate-100 pt-3 dark:border-[#393e4f]">
                  <span className="block truncate text-sm font-bold text-slate-900 dark:text-gray-200">{sub.plan_type}</span>
                  <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500 dark:text-gray-400">
                    {getPackageCategoryLabel(plan)}
                  </span>
                  {sub.has_upgraded && <span className="mt-1 inline-block rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">+ Upgraded</span>}
                  <p className="mt-2 text-xs text-slate-600 dark:text-gray-400">{sub.start_date} <span className="text-slate-400">to</span> {sub.end_date}</p>
                  {daysRemaining !== null && <p className={`mt-1 flex items-center gap-1 text-xs font-semibold ${daysRemaining < 0 ? 'text-red-600 dark:text-red-400' : daysRemaining <= 7 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-gray-400'}`}>{daysRemaining >= 0 && daysRemaining <= 7 && <FiAlertCircle aria-label="Expires within 7 days" size={13} />}{daysRemaining < 0 ? `Expired ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'} ago` : daysRemaining === 0 ? 'Ends today' : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`}</p>}
                </div>
                <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-[#393e4f]">
                  <button
                    onClick={() => onEditSubscription(sub)}
                    disabled={deletingId === sub.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 disabled:opacity-50 dark:border-amber-900 dark:text-amber-400"
                  >
                    <FiEdit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => onDeleteSubscription(sub.id)}
                    disabled={deletingId === sub.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50 dark:border-red-900 dark:text-red-400"
                  >
                    {deletingId === sub.id ? <FiLoader size={14} className="animate-spin" /> : <FiTrash2 size={14} />} Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredSubs.length}
          itemsPerPage={itemsPerPage}
          itemsLabel="subscriptions"
        />
      </div>
    </div>
  );
}