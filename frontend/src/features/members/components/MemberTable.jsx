import React from 'react';
import {
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye, FiLoader, FiX, FiList
} from 'react-icons/fi';
import Pagination from '../../../components/ui/Pagination';

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
  const itemsPerPage = 10;

  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus]);

  const totalPages = Math.ceil(members.length / itemsPerPage);
  const indexOfFirst = (currentPage - 1) * itemsPerPage;
  const currentMembers = members.slice(indexOfFirst, indexOfFirst + itemsPerPage);
  React.useEffect(() => {
    setCurrentPage(page => Math.max(1, Math.min(page, totalPages || 1)));
  }, [totalPages]);

  const primaryBtn = "flex min-h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl border-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-3.5 py-2 font-sans text-sm font-bold normal-case text-black shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Search & Filter */}
      <div className="flex flex-col items-stretch gap-3 bg-white p-4 shadow-sm dark:bg-[#252833] sm:flex-row sm:items-center sm:p-5 sm:gap-4 rounded-2xl border-2 border-gray-300 dark:border-[#393e4f]">
        <div className="relative min-w-0 flex-1">
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
        <div className="min-w-0 sm:w-40">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full min-w-0 px-3 py-2.5 bg-gray-50 dark:bg-[#191b22] border-2 border-gray-300 dark:border-[#393e4f] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-gray-100 font-medium transition-all shadow-sm cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <button onClick={onAddMember} className={`${primaryBtn} w-full whitespace-nowrap sm:w-auto`}>
          <FiPlus size={18} strokeWidth={3} /> Add Member
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#252833] rounded-2xl shadow-sm border-2 border-gray-300 dark:border-[#393e4f] overflow-hidden flex flex-col">
        <div className="flex min-w-0 items-center gap-2 border-b border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-600 dark:bg-[#191b22]/50">
          <div className="flex min-w-0 items-center gap-2">
            <FiList size={18} className="shrink-0 text-slate-800 dark:text-gray-300" />
            <h3 className="min-w-0 truncate text-base font-bold tracking-wide text-slate-800 dark:text-gray-300">Total Members</h3>
            <span className="shrink-0 rounded-lg border-2 border-gray-300 bg-white px-2.5 py-1 text-sm font-semibold tabular-nums text-slate-700 dark:border-[#393e4f] dark:bg-[#252833] dark:text-gray-300">
              {members.length.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1050px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
              <col className="w-[9%]" />
              <col className="w-[15%]" />
            </colgroup>
            <thead>
              <tr className="bg-gray-100 dark:bg-[#191b22] border-b-2 border-gray-300 dark:border-[#393e4f]">
                {['Member Details', 'Phone Number', 'Address', 'Package Type', 'Customer Since', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} scope="col" className={`px-3.5 py-4 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest${i === 6 ? ' text-right' : ''}`}>{h}</th>
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
                    <td className="overflow-hidden px-3.5 py-3.5 whitespace-nowrap">
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
                    <td className="overflow-hidden px-3.5 py-3.5 text-sm font-normal text-slate-700 dark:text-gray-300 whitespace-nowrap">{member.phone}</td>
                    <td className="overflow-hidden px-3.5 py-3.5 text-sm font-normal text-slate-700 dark:text-gray-300 truncate">{member.address || '-'}</td>
                    <td className="overflow-hidden px-3.5 py-3.5 text-sm font-bold text-slate-900 dark:text-gray-400 whitespace-nowrap truncate">{member.plan}</td>
                    <td className="overflow-hidden px-3.5 py-3.5 text-sm font-normal text-slate-500 dark:text-gray-400 whitespace-nowrap">{member.customerSince}</td>
                    <td className="overflow-hidden px-3.5 py-3.5 whitespace-nowrap">{getStatusBadge(member.status)}</td>
                    <td className="overflow-hidden px-3.5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                      <button onClick={() => onViewProfile(member)} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#191b22] text-blue-600 dark:text-blue-400 border-2 border-gray-300 dark:border-[#393e4f] hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm">
                        <FiEye size={16} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => onEditMember(member)} disabled={deletingId === member.id} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#191b22] text-amber-600 dark:text-amber-400 border-2 border-gray-300 dark:border-[#393e4f] hover:border-amber-50 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50">
                        <FiEdit2 size={16} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => onDeleteMember(member.id)} disabled={deletingId === member.id} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#191b22] text-red-600 dark:text-red-400 border-2 border-gray-300 dark:border-[#393e4f] hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50">
                        {deletingId === member.id ? <FiLoader size={16} className="animate-spin" /> : <FiTrash2 size={16} strokeWidth={2.5} />}
                      </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {isLoading ? (
            <p role="status" className="py-8 text-center text-sm font-semibold text-slate-500 dark:text-gray-400">Loading members…</p>
          ) : currentMembers.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-gray-400">No members found in the database.</p>
          ) : currentMembers.map(member => (
            <article key={member.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#393e4f] dark:bg-[#1b1e26]">
              <div className="flex items-start gap-3">
                {member.profilePicUrl ? (
                  <img src={member.profilePicUrl} alt="" className="h-11 w-11 shrink-0 rounded-full border border-slate-300 object-cover dark:border-[#393e4f]" />
                ) : (
                  <div aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-sm font-bold text-slate-700 dark:border-[#393e4f] dark:bg-[#252833] dark:text-gray-300">
                    {getInitials(member.firstName, member.lastName)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900 dark:text-gray-200">{member.firstName} {member.lastName}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-gray-400">{member.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-gray-300">
                    <span>{member.phone || 'No phone'}</span>
                    <span>{member.plan || 'No package'}</span>
                    {getStatusBadge(member.status)}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-[#393e4f]">
                <button onClick={() => onViewProfile(member)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-blue-700 dark:border-[#393e4f] dark:text-blue-400">View profile</button>
                <button onClick={() => onEditMember(member)} disabled={deletingId === member.id} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-amber-700 disabled:opacity-50 dark:border-[#393e4f] dark:text-amber-400">Edit</button>
                <button onClick={() => onDeleteMember(member.id)} disabled={deletingId === member.id} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50 dark:border-red-900 dark:text-red-400">Delete</button>
              </div>
            </article>
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={members.length}
          itemsPerPage={itemsPerPage}
          itemsLabel="members"
        />
      </div>
    </div>
  );
}
