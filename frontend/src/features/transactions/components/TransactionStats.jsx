import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiClock } from 'react-icons/fi';

const StatCard = ({ title, value, icon, colorClass }) => (
  <div className="grid min-h-24 grid-cols-[44px_minmax(0,1fr)] items-center gap-x-3 bg-white dark:bg-[#252830] p-3 sm:min-h-0 sm:p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm sm:flex sm:gap-5 transition-transform hover:-translate-y-1 hover:shadow-md duration-200">
    <div className={`h-11 w-11 rounded-lg p-2 sm:h-auto sm:w-auto sm:rounded-xl sm:p-4 flex items-center justify-center ${colorClass}`}>{icon}</div>
    <div className="flex min-w-0 flex-col gap-1 sm:flex-1">
      <p className="max-w-full break-words text-left text-[10px] leading-tight sm:text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-normal sm:tracking-widest">{title}</p>
      <h3 className="text-lg leading-tight sm:text-3xl font-normal text-slate-900 dark:text-gray-300 mt-0 sm:mt-1 break-words">{value}</h3>
    </div>
  </div>
);

export default function TransactionStats({ totalIncome, totalRefunds, netRevenue, pendingAmount }) {
  return (
    <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      <StatCard 
        title="Total Income" 
        value={`\u20B1 ${totalIncome.toLocaleString()}`} 
        icon={<FiTrendingUp size={28} strokeWidth={2.5} />} 
        colorClass="bg-emerald-700 text-white shadow-lg shadow-emerald-700/40 dark:shadow-none" 
      />
      <StatCard 
        title="Refunds" 
        value={`\u20B1 ${totalRefunds.toLocaleString()}`} 
        icon={<FiTrendingDown size={28} strokeWidth={2.5} />} 
        colorClass="bg-red-800 text-white shadow-lg shadow-red-700/40 dark:shadow-none" 
      />
      <StatCard 
        title="Net Revenue" 
        value={`\u20B1 ${netRevenue.toLocaleString()}`} 
        icon={<FiDollarSign size={28} strokeWidth={2.5} />} 
        colorClass="bg-blue-800 text-white shadow-lg shadow-blue-700/40 dark:shadow-none" 
      />
      <StatCard 
        title="Pending" 
        value={`\u20B1 ${pendingAmount.toLocaleString()}`} 
        icon={<FiClock size={28} strokeWidth={2.5} />} 
        colorClass="bg-amber-700 text-white shadow-lg shadow-amber-600/40 dark:shadow-none" 
      />
    </div>
  );
}
