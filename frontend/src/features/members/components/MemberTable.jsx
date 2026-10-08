import React from 'react';
import {
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye, FiLoader, FiUsers,
  FiChevronLeft, FiChevronRight, FiX
} from 'react-icons/fi';

const getStatusBadge = (status) => {
  const base = "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-solid shadow-sm";
  if (status === 'Active') return <span className={`${base} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`}>Active</span>;
  if (status === 'Inactive') return <span className={`${base} bg-slate-50 text-slate-700 border-slate-500 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/50`}>Inactive</span>;
  return <span className={`${base} bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50`}>Expired</span>;
};

const getInitials = (first, last) => `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase();

export default function MemberTable({
  members,
  isLoading,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  deletingId,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onViewProfile,
}) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;

  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus]);

  const totalPages = Math.ceil(members.length / itemsPerPage);
  const indexOfFirst = (currentPage - 1) * itemsPerPage;
  const currentMembers = members.slice(indexOfFirst, indexOfFirst + itemsPerPage);

  const primaryBtn = "mx-1 flex min-h-[38px] items-center justify-center gap-2 rounded-lg border-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-3.5 py-2 font-sans text-[15px] font-bold normal-case text-black shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";

  const generatePageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button key={i} onClick={() => setCurrentPage(i)} className={`px-3 py-1 rounded-md font-semibold shadow-sm transition-colors ${currentPage === i ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 hover:text-slate-900 font-medium text-slate-500 dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-white'}`}>
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="hidden md:flex md:justify-end">
        <div />
        <button onClick={onAddMember} className={`${primaryBtn} w-[calc(100%-8px)] sm:w-auto`}>
          <FiPlus size={18} strokeWidth={3} /> Add Member
        </button>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_auto] items-center gap-2 bg-white dark:bg-[#252833] p-4 sm:p-5 rounded-2xl border-2 border-gray-300 dark:border-[#393e4f] shadow-sm md:flex md:flex-row md:gap-4">
        <div className="relative min-w-0 md:flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6d758d] text-lg pointer-events-none" />
          <input
            type="text"
            placeholder="Search"
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
        <div className="min-w-0 md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full min-w-0 px-2 py-2.5 sm:px-4 md:w-auto bg-gray-50 dark:bg-[#191b22] border-2 border-gray-300 dark:border-[#393e4f] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-gray-100 font-medium transition-all shadow-sm cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <button onClick={onAddMember} className={`${primaryBtn} min-w-0 whitespace-nowrap px-2 md:hidden`}>
          <FiPlus size={18} strokeWidth={3} /> Add Member
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#252833] rounded-2xl shadow-sm border-2 border-gray-300 dark:border-[#393e4f] overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border-b-2 border-gray-300 dark:border-[#393e4f] gap-4 bg-gray-50 dark:bg-[#191b22]/50">
          <div className="flex items-center gap-2 text-slate-800 dark:text-gray-200 font-bold text-sm tracking-wide">
            <FiUsers size={18} className="text-amber-500" />
            <span>{members.length} TOTAL MEMBERS</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px] lg:min-w-full">
            <thead>
              <tr className="bg-gray-100 dark:bg-[#191b22] border-b-2 border-gray-300 dark:border-[#393e4f]">
                {['Member Details', 'Phone Number', 'Address', 'Membership Plan', 'Customer Since', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} className={`px-3.5 sm:px-4 lg:px-6 py-3.5 sm:py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest${i === 6 ? ' text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#393e4f]">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-amber-200 dark:border-amber-900 rounded-full" />
                        <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                      <p className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest animate-pulse">Loading Database...</p>
                    </div>
                  </td>
                </tr>
              ) : currentMembers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium">
                    No members found in the database.
                  </td>
                </tr>
              ) : (
                currentMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-[#191b22]/50 transition-colors group border-b border-gray-200 dark:border-[#393e4f]">
                    <td className="px-3.5 sm:px-4 lg:px-6 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3 sm:gap-4">
                        {member.profilePicUrl ? (
                          <img src={member.profilePicUrl} alt="Avatar" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-gray-300 dark:border-[#393e4f] flex-shrink-0 shadow-sm" />
                        ) : (
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-200 dark:bg-[#191b22] flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm border-2 border-gray-300 dark:border-[#393e4f] flex-shrink-0 shadow-sm">
                            {getInitials(member.firstName, member.lastName)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-gray-300">{member.firstName} {member.lastName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 sm:px-4 lg:px-6 py-3.5 text-sm text-slate-700 dark:text-gray-300 font-normal whitespace-nowrap">{member.phone}</td>
                    <td className="px-3.5 sm:px-4 lg:px-6 py-3.5 text-sm text-slate-700 dark:text-gray-300 font-normal truncate max-w-[150px]">{member.address || '-'}</td>
                    <td className="px-3.5 sm:px-4 lg:px-6 py-3.5 text-sm font-bold text-slate-900 dark:text-gray-400 whitespace-nowrap">{member.plan}</td>
                    <td className="px-3.5 sm:px-4 lg:px-6 py-3.5 text-sm text-slate-500 dark:text-gray-400 font-normal whitespace-nowrap">{member.customerSince}</td>
                    <td className="px-3.5 sm:px-4 lg:px-6 py-3.5 whitespace-nowrap">{getStatusBadge(member.status)}</td>
                    <td className="px-3.5 sm:px-4 lg:px-6 py-3.5 text-right whitespace-nowrap space-x-2 sm:space-x-3">
                      <button onClick={() => onViewProfile(member)} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#191b22] text-blue-600 dark:text-blue-400 border-2 border-gray-300 dark:border-[#393e4f] hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm">
                        <FiEye size={16} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => onEditMember(member)} disabled={deletingId === member.id} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#191b22] text-amber-600 dark:text-amber-400 border-2 border-gray-300 dark:border-[#393e4f] hover:border-amber-50 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50">
                        <FiEdit2 size={16} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => onDeleteMember(member.id)} disabled={deletingId === member.id} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#191b22] text-red-600 dark:text-red-400 border-2 border-gray-300 dark:border-[#393e4f] hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50">
                        {deletingId === member.id ? <FiLoader size={16} className="animate-spin" /> : <FiTrash2 size={16} strokeWidth={2.5} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t-2 border-gray-300 dark:border-[#393e4f] bg-gray-50 dark:bg-[#191b22] flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">
              Showing {indexOfFirst + 1} to {Math.min(indexOfFirst + itemsPerPage, members.length)} of {members.length} Entries
            </span>
            <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1 border border-gray-300 dark:border-gray-600 shadow-inner">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <FiChevronLeft size={18} />
              </button>
              {generatePageNumbers()}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
