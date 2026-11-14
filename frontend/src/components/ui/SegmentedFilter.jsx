/**
 * A short list of filter choices shown as one row of buttons, so every option
 * and its count is visible without opening a dropdown.
 * options: [{ value, label, count?, dot? }]  (dot = a Tailwind bg class)
 */
export default function SegmentedFilter({ label, options, value, onChange, className = '' }) {
  return (
    <div role="group" aria-label={label} className={`inline-flex rounded-xl border border-line bg-field p-1 ${className}`}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`press flex min-h-9 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-sm font-medium ${
              active
                ? 'bg-panel text-ink shadow-[0_1px_2px_rgb(13_13_13/0.08),0_0_0_1px_var(--ui-line)]'
                : 'text-muted hover:bg-hover hover:text-ink'
            }`}
          >
            {option.dot && <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${option.dot}`} />}
            {option.label}
            {option.count != null && (
              <span className={`rounded-full px-1.5 text-xs tabular-nums transition-colors ${active ? 'bg-hover text-ink-2' : 'text-muted'}`}>
                {Number(option.count).toLocaleString()}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
