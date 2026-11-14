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

/**
 * `hint` is a plain-language line under the figure ("All time, after refunds")
 * so the number reads without a manual.
 */
export function StatCell({ label, value, format = (v) => v, hint, to, state, tone = 'slate', isLoading = false, className = '' }) {
  // A preformatted string (e.g. "₱ 12,000" from the reports API) is shown as is.
  const numeric = typeof value === 'number' || (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)));
  const counted = useCountUp(numeric ? Number(value) : 0, { enabled: !isLoading && numeric });
  const shown = numeric ? format(counted) : value;

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-start gap-2 text-[13px] font-medium text-ink-2">
          <span aria-hidden="true" className={`mt-1 h-2 w-2 shrink-0 rounded-xs ${MARKERS[tone] || MARKERS.slate}`} />
          <span className="leading-tight">{label}</span>
        </span>
        {to && (
          <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-150 group-hover:bg-panel group-hover:text-ink">
            <FiArrowUpRight size={16} className="transition-transform duration-150 ease-out-quint group-hover:-translate-y-[3px] group-hover:translate-x-[3px]" />
          </span>
        )}
      </div>
      <div className="min-w-0">
        {isLoading ? (
          <span className="skeleton h-10 w-3/4 max-w-40" aria-label="Loading" />
        ) : (
          <span className="block font-display text-[clamp(1.35rem,2.4vw,2.5rem)] font-medium leading-none tracking-[-0.03em] text-ink wrap-anywhere">
            {shown}
          </span>
        )}
        {hint && <span className="mt-2 block text-[13px] text-muted">{hint}</span>}
      </div>
    </>
  );

  const base = `flex min-h-32 min-w-0 flex-col justify-between gap-5 bg-panel p-4 sm:p-5 min-[360px]:max-lg:[&:last-child:nth-child(odd)]:col-span-2 ${className}`;

  if (!to) return <div className={base}>{body}</div>;

  return (
    <Link to={to} state={state} className={`group press ${base} hover:bg-hover focus-visible:relative focus-visible:z-10 focus-visible:-outline-offset-2`}>
      {body}
    </Link>
  );
}
