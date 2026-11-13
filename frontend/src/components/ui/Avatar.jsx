const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-11 w-11 text-sm',
  xl: 'h-20 w-20 text-xl',
};

export const initialsOf = (name = '') =>
  String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();

/** Photo when there is one, otherwise initials on a neutral disc. */
export default function Avatar({ src, name = '', size = 'md', fallback = null, className = '' }) {
  const sizeClass = SIZES[size] || SIZES.md;
  if (src) {
    return <img src={src} alt="" className={`${sizeClass} shrink-0 rounded-full border border-line object-cover ${className}`} />;
  }
  const initials = initialsOf(name);
  return (
    <span aria-hidden="true" className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-hover font-display font-semibold text-ink-2 ${className}`}>
      {initials || fallback || '?'}
    </span>
  );
}
