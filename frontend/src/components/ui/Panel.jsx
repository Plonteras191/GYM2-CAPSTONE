import { useId } from 'react';

/**
 * The one surface used for page sections: hairline border, title row,
 * optional action on the right. `index` drives the page-load stagger.
 */
export default function Panel({
  title,
  icon: Icon,
  action,
  meta,
  index,
  id,
  className = '',
  bodyClassName = '',
  children,
}) {
  const headingId = useId();

  return (
    <section
      id={id}
      aria-labelledby={title ? headingId : undefined}
      className={`rise flex min-w-0 flex-col rounded-2xl border border-line bg-panel ${className}`}
      style={index != null ? { '--i': index } : undefined}
    >
      {title && (
        <header className="flex min-h-14 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line px-4 py-3 sm:px-5">
          <h3 id={headingId} className="flex min-w-0 items-center gap-2.5 text-base font-medium leading-tight text-ink">
            {Icon && <Icon size={17} aria-hidden="true" className="shrink-0 text-muted" />}
            <span className="min-w-0">{title}</span>
            {meta}
          </h3>
          {action}
        </header>
      )}
      <div className={`min-w-0 flex-1 p-4 sm:p-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

/** Text link used in panel headers: label + arrow that travels 3px on hover. */
export function PanelLink({ as: Tag, icon: Icon, children, className = '', ...props }) {
  return (
    <Tag
      {...props}
      className={`group press inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-ink-2 hover:bg-hover hover:text-ink ${className}`}
    >
      <span>{children}</span>
      {Icon && <Icon size={14} aria-hidden="true" className="nudge" />}
    </Tag>
  );
}
