import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiClock } from 'react-icons/fi';

const StatCard = ({ title, value, icon, colorClass }) => (
  <div className="bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1 hover:shadow-md duration-200">
    <div className={`p-4 rounded-xl flex items-center justify-center ${colorClass}`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">{title}</p>
      <h3 className="text-3xl font-normal text-slate-900 dark:text-gray-300 mt-1">{value}</h3>
    </div>
  </div>
);

export default function TransactionStats({ totalIncome, totalRefunds, netRevenue, pendingAmount }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
