import React from 'react';
import { FiLoader } from 'react-icons/fi';

export default function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = "No records found.",
  loadingMessage = "Loading Database...",
  rowKey = "id",
  renderRow,
  className = ""
}) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.headerClassName || ''}`}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length || 1} className="px-6 py-24 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-amber-200 dark:border-amber-900 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest animate-pulse">
                    {loadingMessage}
                  </p>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length || 1} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              renderRow ? renderRow(item, idx) : (
                <tr key={item[rowKey] || idx} className="hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors group">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-6 py-4 whitespace-nowrap text-sm ${col.cellClassName || ''}`}>
                      {col.render ? col.render(item, idx) : item[col.accessor]}
                    </td>
                  ))}
                </tr>
              )
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
