import { CALENDAR_SHADES, CALENDAR_SHADE_NAMES, toBrandColor } from '../../utils/brandColor';

/** Row of black, cyan and silver swatches used instead of a free colour picker. */
export default function ShadePicker({ value, onChange, size = 'md', label = 'Shade' }) {
  const current = toBrandColor(value)?.toLowerCase();
  const swatch = size === 'sm' ? 'h-5 w-5' : 'h-7 w-7';

  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      {CALENDAR_SHADES.map((shade, index) => {
        const selected = current === shade.toLowerCase();
        return (
          <button
            key={shade}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={CALENDAR_SHADE_NAMES[index]}
            title={CALENDAR_SHADE_NAMES[index]}
            onClick={() => onChange(shade)}
            className={`${swatch} shrink-0 rounded-full border border-black/20 transition-transform hover:scale-110 dark:border-white/25 ${selected ? 'ring-2 ring-focus ring-offset-2 ring-offset-panel' : ''}`}
            style={{ backgroundColor: shade }}
          />
        );
      })}
    </div>
  );
}
