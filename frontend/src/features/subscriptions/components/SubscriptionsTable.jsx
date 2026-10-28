import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiList, FiLoader, FiX } from 'react-icons/fi';
import Pagination from '../../../components/ui/Pagination';
import { getSubscriptionFilterGroup } from '../packageCategories';
import { getPackageColor, getPackageCategoryLabel } from '../packageCategories';
import { getMediaUrl } from '../../../utils/mediaUrl';

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
  const filteredSubs = subscriptions.filter(sub => {
    const memberName = sub.member ? `${sub.member.first_name} ${sub.member.last_name}`.toLowerCase() : '';
    const matchesSearch = memberName.includes(searchTerm.toLowerCase());
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
              placeholder="Search by member name..." 
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
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full min-w-0 px-3 sm:px-4 py-2.5 bg-gray-50 dark:bg-[#191b22] border-2 border-gray-300 dark:border-[#393e4f] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-gray-100 font-medium transition-all shadow-sm cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
            </select>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full min-w-0 px-3 sm:px-4 py-2.5 bg-gray-50 dark:bg-[#191b22] border-2 border-gray-300 dark:border-[#393e4f] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-gray-100 font-medium transition-all shadow-sm cursor-pointer"
            >
              <option value="All">All Subscription</option>
              <option value="Annual">Annual</option>
              <option value="Monthly">Monthly</option>
              <option value="With Coach">With Coach</option>
            </select>
          </div>
        </div>
        <button onClick={onAddSubscription} className={`${primaryButtonClass} w-full shrink-0 whitespace-nowrap sm:w-auto lg:mx-0`}>
          <FiPlus size={18} strokeWidth={3} /> Add Subscription
        </button>
      </div>

      <div className="bg-white dark:bg-[#252833] rounded-2xl border-2 border-gray-300 dark:border-[#393e4f] shadow-sm overflow-hidden">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 dark:border-[#393e4f] dark:bg-[#191b22]/50 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-2">
            <FiList size={18} className="shrink-0 text-slate-800 dark:text-gray-300" />
            <span className="min-w-0 truncate text-base font-bold tracking-wide text-slate-800 dark:text-gray-300">Total Subscriptions</span>
            <span className="shrink-0 rounded-lg border-2 border-gray-300 bg-white px-2.5 py-1 text-sm font-semibold tabular-nums text-slate-700 dark:border-[#393e4f] dark:bg-[#252833] dark:text-gray-300">
              {filteredSubs.length.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left border-collapse min-w-[760px]">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[22%]" />
              <col className="w-[22%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead>
              <tr className="bg-gray-100 dark:bg-[#191b22] border-b-2 border-gray-300 dark:border-[#393e4f]">
                <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Member</th>
                <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Subscription Type</th>
                <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Duration</th>
                <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#393e4f]">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
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
                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium">No subscriptions found.</td></tr>
              ) : (
                currentSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-[#191b22]/50 transition-colors group">
                    <td className="overflow-hidden px-4 py-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        {sub.member?.profile_pic ? (
                          <img src={getMediaUrl(sub.member.profile_pic)} alt="" className="h-10 w-10 shrink-0 rounded-full border-2 border-gray-300 object-cover shadow-sm dark:border-gray-600" />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 bg-gray-100 text-xs font-bold text-slate-700 dark:border-gray-600 dark:bg-[#191b22] dark:text-gray-300">
                            {`${sub.member?.first_name?.[0] || '?'}${sub.member?.last_name?.[0] || ''}`.toUpperCase()}
                          </div>
                        )}
                        <span className="truncate font-semibold text-black dark:text-gray-300">
                          {sub.member ? `${sub.member.first_name} ${sub.member.last_name}` : 'Unknown Member'}
                        </span>
                      </div>
                    </td>
                    <td className="overflow-hidden px-4 py-3.5">
                      {(() => {
                        const plan = plans.find(item => item.name === sub.plan_type);
                        const color = getPackageColor(plan);
                        return (
                          <div className="min-w-0">
                            <span className="block truncate text-sm font-bold text-black dark:text-gray-300">{sub.plan_type}</span>
                            <span className="mt-1 inline-flex max-w-full truncate rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ color, borderColor: `color-mix(in srgb, ${color} 45%, transparent)`, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}>
                              {getPackageCategoryLabel(plan)}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="text-sm font-normal text-black dark:text-gray-400">{sub.start_date}</div>
                      <div className="text-xs font-normal text-slate-500 dark:text-gray-400 mt-0.5">to {sub.end_date}</div>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">{getStatusBadge(sub.status)}</td>
                    <td className="space-x-2 whitespace-nowrap px-4 py-3.5 text-right sm:space-x-3">
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