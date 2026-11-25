import { GRAY_SHADES, toGray } from '../../utils/grayscale';

const SHADE_NAMES = ['Black', 'Charcoal', 'Dark grey', 'Grey', 'Light grey', 'Silver'];

/** Row of grey swatches used instead of a colour picker (the system is black and white only). */
export default function GrayShadePicker({ value, onChange, size = 'md', label = 'Shade' }) {
  const current = toGray(value)?.toLowerCase();
  const swatch = size === 'sm' ? 'h-5 w-5' : 'h-7 w-7';

  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      {GRAY_SHADES.map((shade, index) => {
        const selected = current === shade.toLowerCase();
        return (
          <button
            key={shade}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={SHADE_NAMES[index]}
            title={SHADE_NAMES[index]}
            onClick={() => onChange(shade)}
            className={`${swatch} shrink-0 rounded-full border border-black/20 transition-transform hover:scale-110 dark:border-white/25 ${selected ? 'ring-2 ring-focus ring-offset-2 ring-offset-panel' : ''}`}
            style={{ backgroundColor: shade }}
          />
        );
      })}
    </div>
  );
}
