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
    <div className={`overflow-x-auto overscroll-x-contain touch-pan-x ${className}`}>
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="border-b border-line bg-canvas">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.headerClassName || ''}`}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length || 1} className="px-6 py-24 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-brand-gold-100 dark:border-line rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-sm font-semibold text-muted animate-pulse">
                    {loadingMessage}
                  </p>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length || 1} className="px-6 py-12 text-center text-muted font-medium">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              renderRow ? renderRow(item, idx) : (
                <tr key={item[rowKey] || idx} className="hover:bg-hover transition-colors group">
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
