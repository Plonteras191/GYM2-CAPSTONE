/**
 * A small rounded square tinted with an item's own colour (a package, an
 * event category). It carries the colour as a mark beside the content,
 * instead of a stripe down the edge of the card.
 *
 * The fill is a light tint of the colour; the icon or text inside is mixed
 * toward the ink so it stays readable on any category colour.
 */
export default function ColorTile({ color = 'var(--ui-line-strong)', icon: Icon, size = 'md', className = '', children }) {
  const sizes = {
    sm: 'h-8 w-8 rounded-lg',
    md: 'h-10 w-10 rounded-xl',
    lg: 'h-12 w-12 rounded-xl',
  };
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center ${sizes[size] || sizes.md} ${className}`}
      style={{
        background: `color-mix(in srgb, ${color} 16%, var(--ui-panel))`,
        color: `color-mix(in srgb, ${color} 72%, var(--ui-ink))`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 22%, transparent)`,
      }}
    >
      {Icon ? <Icon size={size === 'sm' ? 15 : 18} /> : children}
    </span>
  );
}

/** The same tint for a date block (month above, day number below). */
export function tintStyle(color = 'var(--ui-line-strong)') {
  return {
    background: `color-mix(in srgb, ${color} 14%, var(--ui-panel))`,
    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 22%, transparent)`,
  };
}
