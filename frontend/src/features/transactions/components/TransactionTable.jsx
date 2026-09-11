import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiPlus, FiDownload, FiEdit2, FiTrash2, 
  FiPrinter, FiUser, FiChevronLeft, FiChevronRight, FiList, FiLoader 
} from 'react-icons/fi';

export default function TransactionTable({
  transactions,
  isLoading,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  isExporting,
  deletingId,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onExportCSV,
  onPrintReceipt
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTxns = transactions.slice(indexOfFirstItem, indexOfLastItem);

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  const generatePageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button 
          key={i} 
          onClick={() => setCurrentPage(i)} 
          className={`px-3 py-1 rounded-md font-bold shadow-sm transition-colors ${currentPage === i ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black' : 'hover:text-slate-900 dark:hover:text-white font-medium text-slate-500 dark:text-gray-400'}`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

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

  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";
  const exportButtonClass = "flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-gray-300 dark:hover:bg-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
        <button onClick={onAddTransaction} className={primaryButtonClass}>
          <FiPlus size={18} strokeWidth={3} /> Record Transaction
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#252830] p-5 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm items-center">
        <div className="relative flex-1 w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search by ID or Member Name..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm" 
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)} 
            className="w-full md:w-auto px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm"
          >
            <option value="All">All Types</option>
            <option value="Subscription Payment">Subscription Payment</option>
            <option value="Fee">Fee (Walk-in)</option>
            <option value="Refund">Refund</option>
            <option value="Other">Other</option>
          </select>

          <button onClick={onExportCSV} disabled={isExporting} className={exportButtonClass} title="Download table data to a spreadsheet">
            {isExporting ? <FiLoader className="animate-spin" size={18} /> : <FiDownload size={18} />}
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
          
          <button onClick={() => window.print()} className={primaryButtonClass}>
            <FiPrinter size={18} /> Print All
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#252830] rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-center p-5 border-b-2 border-gray-300 dark:border-gray-600 gap-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 text-slate-800 dark:text-gray-300 font-bold text-sm tracking-wide">
            <FiList size={18} />
            <span>{transactions.length} TOTAL TRANSACTIONS</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Txn ID & Date</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Member</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Details</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Method</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
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
                  <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-gray-300">{txn.transaction_id}</div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{txn.transaction_date}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-gray-300 whitespace-nowrap">
                      {txn.member ? `${txn.member.first_name} ${txn.member.last_name}` : <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500 italic"><FiUser size={14} /> Walk-in Guest</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-800 dark:text-gray-300">{txn.type}</div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{txn.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getMethodBadge(txn.payment_method)}>{txn.payment_method}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`font-normal text-lg tracking-tight ${Number(txn.amount) > 0 ? 'text-slate-800 dark:text-gray-300' : 'text-red-500'}`}>
                        {Number(txn.amount) > 0 ? `\u20B1 ${Number(txn.amount).toLocaleString()}` : `-\u20B1 ${Math.abs(Number(txn.amount)).toLocaleString()}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(txn.status)}>{txn.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap space-x-3">
                      <button 
                        onClick={() => onPrintReceipt(txn)} 
                        className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-sm"
                      >
                        <FiPrinter size={16} strokeWidth={2.5} />
                      </button>
                      <button 
                        onClick={() => onEditTransaction(txn)} 
                        disabled={deletingId === txn.id} 
                        className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-amber-600 dark:text-amber-400 border-2 border-gray-300 dark:border-gray-600 hover:border-amber-50 dark:hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-sm disabled:opacity-50"
                      >
                        <FiEdit2 size={16} strokeWidth={2.5} />
                      </button>
                      <button 
                        onClick={() => onDeleteTransaction(txn.id)} 
                        disabled={deletingId === txn.id} 
                        className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-red-600 dark:text-red-400 border-2 border-gray-300 dark:border-gray-600 hover:border-red-500 dark:hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-sm disabled:opacity-50"
                      >
                        {deletingId === txn.id ? <FiLoader size={16} className="animate-spin" strokeWidth={2.5} /> : <FiTrash2 size={16} strokeWidth={2.5} />}
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
          <div className="p-4 border-t-2 border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, transactions.length)} of {transactions.length} Entries
            </span>
            <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1 border border-gray-300 dark:border-gray-600 shadow-inner">
              <button onClick={goToPrevPage} disabled={currentPage === 1} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <FiChevronLeft size={18} />
              </button>
              {generatePageNumbers()}
              <button onClick={goToNextPage} disabled={currentPage === totalPages} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
