import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  itemsLabel = 'entries',
  stacked = false,
}) {
  if (totalItems === 0 || totalPages <= 1) return null;

  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  let pages;
  if (totalPages <= 7) {
    pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  } else if (currentPage <= 4) {
    pages = [1, 2, 3, 4, 5, 'end-ellipsis', totalPages];
  } else if (currentPage >= totalPages - 3) {
    pages = [1, 'start-ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  } else {
    pages = [1, 'start-ellipsis', currentPage - 1, currentPage, currentPage + 1, 'end-ellipsis', totalPages];
  }

  return (
    <div className={`flex min-w-0 flex-col items-center justify-between gap-3 border-t-2 border-gray-300 bg-gray-50 px-3 py-3 dark:border-[#393e4f] dark:bg-[#191b22] ${stacked ? '' : 'sm:flex-row'}`}>
      <p className="max-w-full text-center text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-gray-400">
        Showing {startItem} to {endItem} of {totalItems} {itemsLabel}
      </p>

      <nav aria-label="Pagination" className="flex max-w-full items-center rounded-lg border border-gray-300 bg-gray-200 p-1 shadow-inner dark:border-gray-600 dark:bg-gray-700">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || totalPages <= 1}
          aria-label="Previous page"
          className="rounded-md p-1 text-slate-600 transition-colors enabled:hover:bg-gray-600 enabled:hover:text-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:enabled:hover:bg-gray-300 dark:enabled:hover:text-gray-900"
        >
          <FiChevronLeft size={18} />
        </button>
        {pages.map(page => typeof page === 'string' ? (
          <span key={page} aria-hidden="true" className="px-1 text-slate-500 dark:text-gray-400">…</span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
            className={`min-w-8 rounded-md px-2 py-1 font-semibold shadow-sm transition-colors ${
              currentPage === page
                ? 'bg-black text-gray-300 dark:bg-gray-300 dark:text-black'
                : 'text-slate-700 dark:text-gray-300 enabled:hover:bg-gray-600 enabled:hover:text-gray-100 dark:enabled:hover:bg-gray-300 dark:enabled:hover:text-gray-900'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || totalPages <= 1}
          aria-label="Next page"
          className="rounded-md p-1 text-slate-600 transition-colors enabled:hover:bg-gray-600 enabled:hover:text-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:enabled:hover:bg-gray-300 dark:enabled:hover:text-gray-900"
        >
          <FiChevronRight size={18} />
        </button>
      </nav>
    </div>
  );
}
