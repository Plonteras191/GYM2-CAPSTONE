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
    <div className={`flex min-w-0 flex-col items-center justify-between gap-3 border-t border-line bg-canvas px-3 py-3 ${stacked ? '' : 'sm:flex-row'}`}>
      <p className="max-w-full text-center text-xs font-medium text-muted tabular-nums">
        Showing {startItem} to {endItem} of {totalItems} {itemsLabel}
      </p>

      <nav aria-label="Pagination" className="flex max-w-full items-center gap-0.5 rounded-xl border border-line bg-panel p-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || totalPages <= 1}
          aria-label="Previous page"
          className="rounded-md p-1 press text-ink-2 enabled:hover:bg-hover enabled:hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FiChevronLeft size={18} />
        </button>
        {pages.map(page => typeof page === 'string' ? (
          <span key={page} aria-hidden="true" className="px-1 text-muted">…</span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
            className={`press min-w-8 rounded-lg px-2 py-1 text-sm font-semibold tabular-nums ${
              currentPage === page
                ? 'bg-brand-dark text-brand-white dark:bg-brand-gold dark:text-brand-dark'
                : 'text-ink-2 enabled:hover:bg-hover enabled:hover:text-ink'
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
          className="rounded-md p-1 press text-ink-2 enabled:hover:bg-hover enabled:hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FiChevronRight size={18} />
        </button>
      </nav>
    </div>
  );
}
