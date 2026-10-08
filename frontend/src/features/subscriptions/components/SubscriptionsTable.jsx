import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiList, FiChevronLeft, FiChevronRight, FiLoader, FiX } from 'react-icons/fi';

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
  const filteredDropdownPlans = plans.filter(p => !p.name.toLowerCase().includes('daily') && !p.name.toLowerCase().includes('walk'));

  const filteredSubs = subscriptions.filter(sub => {
    const memberName = sub.member ? `${sub.member.first_name} ${sub.member.last_name}`.toLowerCase() : '';
    const matchesSearch = memberName.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || sub.status === filterStatus;
    const matchesPlan = filterPlan === 'All' || sub.plan_type === filterPlan;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, filterPlan]);
  const totalPages = Math.ceil(filteredSubs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubs = filteredSubs.slice(indexOfFirstItem, indexOfLastItem);
  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  const generatePageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button 
          key={i} 
          onClick={() => setCurrentPage(i)} 
          className={`px-3 py-1 rounded-md font-semibold shadow-sm transition-colors ${currentPage === i ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 hover:text-slate-900 font-medium text-slate-500 dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-white'}`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  const getStatusBadge = (status) => {
    const base = "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-solid shadow-sm";
    if (status === 'Active') return <span className={`${base} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`}>Active</span>;
    return <span className={`${base} bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50`}>Expired</span>;
  };

  const primaryButtonClass = "mx-1 flex min-h-[38px] items-center justify-center gap-2 rounded-lg border-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-3.5 py-2 font-sans text-[15px] font-bold normal-case text-black shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 bg-white dark:bg-[#252833] p-4 sm:p-5 rounded-2xl border-2 border-gray-300 dark:border-[#393e4f] shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-1 lg:flex-row lg:items-center">
          <div className="relative w-full min-w-0 lg:max-w-72">
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
          <div className="grid w-full grid-cols-2 gap-3 lg:flex lg:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full min-w-0 px-3 sm:px-4 py-2.5 bg-gray-50 dark:bg-[#191b22] border-2 border-gray-300 dark:border-[#393e4f] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-gray-100 font-medium transition-all shadow-sm lg:w-40 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
            </select>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full min-w-0 px-3 sm:px-4 py-2.5 bg-gray-50 dark:bg-[#191b22] border-2 border-gray-300 dark:border-[#393e4f] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-gray-100 font-medium transition-all shadow-sm lg:w-40 cursor-pointer"
            >
              <option value="All">All Plans</option>
              {filteredDropdownPlans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <button onClick={onAddSubscription} className={`${primaryButtonClass} w-[calc(100%-8px)] sm:w-auto lg:self-auto`}>
          <FiPlus size={18} strokeWidth={3} /> Add Subscription
        </button>
      </div>

      <div className="bg-white dark:bg-[#252833] rounded-2xl border-2 border-gray-300 dark:border-[#393e4f] shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border-b-2 border-gray-300 dark:border-[#393e4f] gap-4 bg-gray-50 dark:bg-[#191b22]/50">
          <div className="flex items-center gap-2 text-slate-800 dark:text-gray-200 font-bold text-sm tracking-wide">
            <FiList size={18} className="text-amber-500" />
            <span>{filteredSubs.length} TOTAL SUBSCRIPTIONS</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px] lg:min-w-full">
            <thead>
              <tr className="bg-gray-100 dark:bg-[#191b22] border-b-2 border-gray-300 dark:border-[#393e4f]">
                <th className="px-3.5 sm:px-4 lg:px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Color</th>
                <th className="px-3.5 sm:px-4 lg:px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Member</th>
                <th className="px-3.5 sm:px-4 lg:px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Plan</th>
                <th className="px-3.5 sm:px-4 lg:px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Duration</th>
                <th className="px-3.5 sm:px-4 lg:px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-3.5 sm:px-4 lg:px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 text-right">Actions</th>
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
                    <td className="px-3.5 sm:px-4 lg:px-6 py-3.5 whitespace-nowrap">
                      <div className="w-4 h-4 rounded-full border border-black/20 dark:border-white/20 shadow-sm" style={{ backgroundColor: sub.color }}></div>
                    </td>
                    <td className="px-3.5 sm:px-4 lg:px-6 py-3.5 font-medium text-black dark:text-gray-300 whitespace-nowrap">
                      {sub.member ? `${sub.member.first_name} ${sub.member.last_name}` : 'Unknown Member'}
                    </td>
                    <td className="px-3.5 sm:px-4 lg:px-6 py-3.5 text-sm text-black dark:text-gray-300 font-normal whitespace-nowrap">{sub.plan_type}</td>
                    <td className="px-3.5 sm:px-4 lg:px-6 py-3.5 whitespace-nowrap">
                      <div className="text-sm font-normal text-black dark:text-gray-300">{sub.start_date}</div>
                      <div className="text-xs font-normal text-slate-500 dark:text-gray-400 mt-0.5">to {sub.end_date}</div>
                    </td>
                    <td className="px-3.5 sm:px-4 lg:px-6 py-3.5 whitespace-nowrap">{getStatusBadge(sub.status)}</td>
                    <td className="px-3.5 sm:px-4 lg:px-6 py-3.5 text-right whitespace-nowrap space-x-2 sm:space-x-3">
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

        {totalPages > 1 && (
          <div className="p-4 border-t-2 border-gray-300 dark:border-[#393e4f] bg-gray-50 dark:bg-[#191b22] flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSubs.length)} of {filteredSubs.length} Entries
            </span>
            <div className="flex max-w-full flex-wrap items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1 border border-gray-300 dark:border-gray-600 shadow-inner">
              <button onClick={goToPrevPage} disabled={currentPage === 1} className="p-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <FiChevronLeft size={18} />
              </button>
              {generatePageNumbers()}
              <button onClick={goToNextPage} disabled={currentPage === totalPages} className="p-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}