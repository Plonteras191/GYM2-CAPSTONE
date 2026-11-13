import { useId } from 'react';

/**
 * The surface every data table sits in: a title row with an optional count
 * and action, then whatever the table renders (desktop table, mobile cards,
 * pagination). `index` drives the page-load stagger.
 */
export default function TableShell({ title, icon: Icon, count, action, index, className = '', children }) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className={`rise flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-panel ${className}`}
      style={index != null ? { '--i': index } : undefined}
    >
      <header className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-line bg-field px-4 py-3 sm:px-5">
        <h3 id={headingId} className="flex min-w-0 items-center gap-2.5 text-[15px] font-semibold leading-tight text-ink">
          {Icon && <Icon size={16} aria-hidden="true" className="shrink-0 text-muted" />}
          <span className="truncate">{title}</span>
          {count != null && (
            <span className="rounded-full bg-hover px-2.5 py-0.5 font-display text-sm font-semibold tabular-nums text-ink-2">
              {Number(count).toLocaleString()}
            </span>
          )}
        </h3>
        {action}
      </header>
      {children}
    </section>
  );
}

/** The filter row above a table. */
export function Toolbar({ index, className = '', children }) {
  return (
    <div
      className={`rise flex flex-col gap-3 rounded-2xl border border-line bg-panel p-3 sm:p-4 ${className}`}
      style={index != null ? { '--i': index } : undefined}
    >
      {children}
    </div>
  );
}

/** Skeleton rows while a table loads. */
export function TableLoading({ colSpan, rows = 5 }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-2" role="status" aria-label="Loading">
        <div className="divide-y divide-line">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex items-center gap-4 py-3.5">
              <span className="skeleton h-10 w-10 shrink-0 rounded-full" />
              <span className="skeleton h-3.5 flex-1" style={{ maxWidth: `${34 - i * 3}%` }} />
              <span className="skeleton h-3.5 w-1/6" />
              <span className="skeleton h-3.5 w-1/12" />
              <span className="skeleton ml-auto h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </td>
    </tr>
  );
}

export function TableEmpty({ colSpan, icon: Icon, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          {Icon && (
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-hover text-muted">
              <Icon size={20} aria-hidden="true" />
            </span>
          )}
          <p className="text-sm font-medium text-muted">{children}</p>
        </div>
      </td>
    </tr>
  );
}

/** Skeleton cards for the mobile list. */
export function CardListLoading({ rows = 3 }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="rounded-xl border border-line p-4">
          <div className="flex items-center gap-3">
            <span className="skeleton h-11 w-11 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <span className="skeleton h-3.5 w-1/2" />
              <span className="skeleton h-3 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardListEmpty({ children }) {
  return <p className="py-10 text-center text-sm font-medium text-muted">{children}</p>;
}

/** One card in the mobile list. */
export function MobileCard({ index = 0, className = '', children }) {
  return (
    <article className={`rise rounded-xl border border-line bg-panel p-4 ${className}`} style={{ '--i': Math.min(index, 8) * 0.6 }}>
      {children}
    </article>
  );
}
