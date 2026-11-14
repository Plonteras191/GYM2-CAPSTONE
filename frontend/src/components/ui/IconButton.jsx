const TONES = {
  neutral: 'hover:border-line-strong hover:text-ink',
  warn: 'hover:border-warn/40 hover:bg-warn-soft hover:text-warn',
  danger: 'hover:border-negative/40 hover:bg-negative-soft hover:text-negative',
  info: 'hover:border-brand-navy/30 hover:bg-brand-navy-50 hover:text-brand-navy dark:hover:border-brand-navy-200/30 dark:hover:bg-brand-navy-200/10 dark:hover:text-brand-navy-200',
};

/** Compact row action. `label` is the accessible name and the tooltip. */
export default function IconButton({ tone = 'neutral', label, icon, children, className = '', ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`press btn-step inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-lg border border-line bg-panel px-2 text-muted disabled:cursor-not-allowed disabled:opacity-50 ${TONES[tone] || TONES.neutral} ${className}`}
      {...props}
    >
      {icon}
      {children && <span className="text-[13px] font-medium">{children}</span>}
    </button>
  );
}
