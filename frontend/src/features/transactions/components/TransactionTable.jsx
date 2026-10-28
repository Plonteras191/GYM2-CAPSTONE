import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiPlus, FiDownload, FiRotateCcw, FiList,
  FiPrinter, FiUser, FiLoader, FiX
} from 'react-icons/fi';
import Pagination from '../../../components/ui/Pagination';

export default function TransactionTable({
  transactions,
  isLoading,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  isExporting,
  refundingId,
  onAddTransaction,
  onRefundTransaction,
  onExportCSV,
  onPrintReceipt
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTxns = transactions.slice(indexOfFirstItem, indexOfLastItem);
  useEffect(() => {
    setCurrentPage(page => Math.max(1, Math.min(page, totalPages || 1)));
  }, [totalPages]);

  const getStatusBadge = (status) => {
    const base = "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-solid shadow-sm";
    switch (status) {
      case 'Complete': return `${base} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`;
      case 'Pending': return `${base} bg-amber-50 text-amber-700 border-amber-500 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/50`;
      case 'Refunded': return `${base} bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500`;
      case 'Failed': return `${base} bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50`;
      default: return `${base} bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500`;
    }
  };

  const getMethodBadge = (method) => {
    const base = "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-solid shadow-sm";
    if ((method || '').toLowerCase() === 'gcash') return `${base} bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50`;
    if ((method || '').toLowerCase() === 'cash') return `${base} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`;
    return `${base} bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500`;
  };

  const primaryButtonClass = "flex min-h-[38px] min-w-0 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-2 py-2 font-sans text-sm font-bold normal-case text-black shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";
  const exportButtonClass = "flex min-h-[38px] min-w-0 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border-0 bg-black px-2 py-2 font-sans text-sm font-bold normal-case text-gray-300 shadow-sm transition-colors hover:bg-gray-900 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed dark:bg-gray-300 dark:text-black dark:hover:bg-gray-200";

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 bg-white dark:bg-[#252833] p-4 sm:p-5 rounded-2xl border-2 border-gray-300 dark:border-[#393e4f] shadow-sm items-stretch lg:items-center">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full min-w-0 lg:flex-1">
          <div className="relative flex-1 min-w-0">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6d758d] text-lg pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search by ID or Member Name..." 
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
          <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              aria-label="Filter transactions"
              className="w-full sm:w-auto px-4 py-2.5 bg-gray-50 dark:bg-[#191b22] border-2 border-gray-300 dark:border-[#393e4f] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-gray-100 font-medium transition-all shadow-sm cursor-pointer"
            >
              <option value="All">All Packages</option>
              <option value="Subscription">Subscriptions</option>
              <option value="Walk-In">Walk-Ins</option>
              <option value="Refund">Refunds</option>
            </select>
        </div>

        <div className="grid w-full grid-cols-3 gap-2 lg:w-[34rem]">
          <button onClick={onAddTransaction} className={`${primaryButtonClass} md:hidden`}>
            <FiPlus size={16} strokeWidth={3} /> Record
          </button>
          <button onClick={onAddTransaction} className={`${primaryButtonClass} hidden md:flex`}>
            <FiPlus size={18} strokeWidth={3} /> Record Transaction
          </button>
          <button onClick={onExportCSV} disabled={isExporting} className={exportButtonClass} title="Download filtered transactions as a spreadsheet">
            {isExporting ? <FiLoader className="animate-spin" size={18} /> : <FiDownload size={18} />}
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
          
          <button onClick={() => window.print()} className={primaryButtonClass}>
            <FiPrinter size={18} /> Print All
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#252833] rounded-2xl border-2 border-gray-300 dark:border-[#393e4f] shadow-sm overflow-hidden flex flex-col">
        <div className="flex min-w-0 items-center gap-2 border-b border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-600 dark:bg-[#191b22]/50">
          <FiList size={18} className="shrink-0 text-slate-800 dark:text-gray-300" />
          <h3 className="min-w-0 truncate text-base font-bold tracking-wide text-slate-800 dark:text-gray-300">Recent Transactions</h3>
          <span className="shrink-0 rounded-lg border-2 border-gray-300 bg-white px-2.5 py-1 text-sm font-semibold tabular-nums text-slate-700 dark:border-[#393e4f] dark:bg-[#252833] dark:text-gray-300">
            {transactions.length.toLocaleString()}
          </span>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1100px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[15%]" />
              <col className="w-[17%]" />
              <col className="w-[21%]" />
              <col className="w-[10%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[15%]" />
            </colgroup>
            <thead>
              <tr className="bg-gray-100 dark:bg-[#191b22] border-b-2 border-gray-300 dark:border-[#393e4f]">
                <th className="px-3.5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Txn ID & Date</th>
                <th className="px-3.5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Member</th>
                <th className="px-3.5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Details</th>
                <th className="px-3.5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Method</th>
                <th className="px-3.5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Amount</th>
                <th className="px-3.5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-3.5 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#393e4f]">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-amber-200 dark:border-amber-900 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest animate-pulse">Loading Database...</p>
                    </div>
                  </td>
                </tr>
              ) : currentTxns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium">No transactions found.</td>
                </tr>
              ) : (
                currentTxns.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-[#191b22]/50 transition-colors group">
                    <td className="overflow-hidden px-3.5 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-gray-300">{txn.transaction_id}</div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{txn.transaction_date}</div>
                    </td>
                    <td className="overflow-hidden px-3.5 py-3.5 font-semibold text-slate-800 dark:text-gray-300 whitespace-nowrap truncate">
                      {txn.member ? `${txn.member.first_name} ${txn.member.last_name}` : <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500 italic"><FiUser size={14} /> Walk-in Guest</span>}
                    </td>
                    <td className="overflow-hidden px-3.5 py-3.5 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-800 dark:text-gray-300">{txn.type}</div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{txn.description || '-'}</div>
                    </td>
                    <td className="overflow-hidden px-3.5 py-3.5 whitespace-nowrap">
                      <span className={getMethodBadge(txn.payment_method)}>{txn.payment_method}</span>
                    </td>
                    <td className="overflow-hidden px-3.5 py-3.5 whitespace-nowrap">
                      <div className={`font-normal text-lg tracking-tight ${Number(txn.amount) > 0 ? 'text-slate-800 dark:text-gray-300' : 'text-red-500'}`}>
                        {Number(txn.amount) > 0 ? `\u20B1 ${Number(txn.amount).toLocaleString()}` : `-\u20B1 ${Math.abs(Number(txn.amount)).toLocaleString()}`}
                      </div>
                    </td>
                    <td className="overflow-hidden px-3.5 py-3.5 whitespace-nowrap">
                      <span className={getStatusBadge(txn.status)}>{txn.status}</span>
                    </td>
                    <td className="overflow-hidden space-x-2 px-3.5 py-3.5 text-right whitespace-nowrap">
                      {txn.status === 'Complete' && txn.type !== 'Refund' && (
                        <button
                          onClick={() => onRefundTransaction(txn)}
                          disabled={refundingId === txn.id}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-gray-300 bg-white px-2.5 py-2 text-red-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-500 hover:bg-red-50 hover:shadow-md disabled:opacity-50 dark:border-[#393e4f] dark:bg-[#191b22] dark:text-red-400 dark:hover:bg-red-500/10"
                          title="Refund transaction"
                        >
                          {refundingId === txn.id ? <FiLoader size={16} className="animate-spin" /> : <FiRotateCcw size={16} strokeWidth={2.5} />}
                          <span className="text-xs font-bold">Refund</span>
                        </button>
                      )}
                      <button 
                        onClick={() => onPrintReceipt(txn)} 
                        className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#191b22] text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-[#393e4f] hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-[#252833] rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-sm"
                      >
                        <FiPrinter size={16} strokeWidth={2.5} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {isLoading ? (
            <p role="status" className="py-8 text-center text-sm font-semibold text-slate-500 dark:text-gray-400">Loading transactions…</p>
          ) : currentTxns.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-gray-400">No transactions found.</p>
          ) : currentTxns.map(txn => (
            <article key={txn.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#393e4f] dark:bg-[#1b1e26]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900 dark:text-gray-200">{txn.member ? `${txn.member.first_name} ${txn.member.last_name}` : 'Walk-in Guest'}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-gray-400">{txn.transaction_id} · {txn.transaction_date}</p>
                </div>
                <span className={`shrink-0 font-bold ${Number(txn.amount) < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-gray-200'}`}>
                  {Number(txn.amount) < 0 ? '-' : ''}₱{Math.abs(Number(txn.amount)).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-gray-300">{txn.type}</p>
              {txn.description && <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">{txn.description}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={getMethodBadge(txn.payment_method)}>{txn.payment_method}</span>
                <span className={getStatusBadge(txn.status)}>{txn.status}</span>
              </div>
              <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-[#393e4f]">
                {txn.status === 'Complete' && txn.type !== 'Refund' && (
                  <button onClick={() => onRefundTransaction(txn)} disabled={refundingId === txn.id} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50 dark:border-red-900 dark:text-red-400">
                    {refundingId === txn.id ? 'Refunding…' : 'Refund'}
                  </button>
                )}
                <button onClick={() => onPrintReceipt(txn)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-[#393e4f] dark:text-gray-300">Print receipt</button>
              </div>
            </article>
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={transactions.length}
          itemsPerPage={itemsPerPage}
          itemsLabel="transactions"
        />
      </div>
    </div>
  );
}
