import { Link } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';
import { useCountUp } from '../../hooks/useCountUp';

/** Marker colours, one per brand hue. */
const MARKERS = {
  gold: 'bg-brand-gold',
  red: 'bg-brand-red dark:bg-brand-red-300',
  crimson: 'bg-brand-crimson dark:bg-brand-crimson-300',
  orange: 'bg-brand-orange dark:bg-brand-orange-300',
  slate: 'bg-brand-slate dark:bg-night-muted',
};

/**
 * One continuous strip of key figures divided by hairlines, instead of a row
 * of separate cards. Cells with `to` are links and answer the pointer.
 */
export function StatStrip({ children, columns = 'lg:grid-cols-4', index = 0, className = '' }) {
  return (
    <div
      className={`rise grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line min-[360px]:grid-cols-2 ${columns} ${className}`}
      style={{ '--i': index }}
    >
      {children}
    </div>
  );
}

export function StatCell({ label, value, format = (v) => v, to, state, tone = 'slate', isLoading = false, className = '' }) {
  // A preformatted string (e.g. "₱ 12,000" from the reports API) is shown as is.
  const numeric = typeof value === 'number' || (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)));
  const counted = useCountUp(numeric ? Number(value) : 0, { enabled: !isLoading && numeric });
  const shown = numeric ? format(counted) : value;

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-[2px] ${MARKERS[tone] || MARKERS.slate}`} />
          <span className="truncate">{label}</span>
        </span>
        {to && (
          <FiArrowUpRight
            size={16}
            aria-hidden="true"
            className="shrink-0 text-muted transition-transform duration-300 ease-out-quint group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
          />
        )}
      </div>
      {isLoading ? (
        <span className="skeleton mt-1 h-9 w-3/4 max-w-36" aria-label="Loading" />
      ) : (
        <span className="font-display text-[clamp(1.6rem,2.3vw,2.4rem)] font-semibold leading-none tracking-tight text-ink tabular-nums [overflow-wrap:anywhere]">
          {shown}
        </span>
      )}
    </>
  );

  const base = `flex min-h-28 min-w-0 flex-col justify-between gap-5 bg-panel p-4 sm:p-5 ${className}`;

  if (!to) return <div className={base}>{body}</div>;

  return (
    <Link to={to} state={state} className={`group press ${base} hover:bg-hover focus-visible:relative focus-visible:z-10 focus-visible:-outline-offset-2`}>
      {body}
    </Link>
  );
}
