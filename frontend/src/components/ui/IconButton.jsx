// Resting look is the same for every tone, only stronger than before: a visible
// border (--ui-line-strong) and a darker icon (--ui-ink-2), in light and dark.
// The tone colours still appear only on hover, as they always did.
const TONES = {
  neutral: 'hover:text-ink',
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
      className={`press btn-step inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-lg border border-line-strong bg-panel px-2 text-ink-2 disabled:cursor-not-allowed disabled:opacity-50 ${TONES[tone] || TONES.neutral} ${className}`}
      {...props}
    >
      {icon}
      {children && <span className="text-[13px] font-semibold">{children}</span>}
    </button>
  );
}
