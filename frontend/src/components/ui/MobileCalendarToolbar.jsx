import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/** Calendar controls for phones (the desktop toolbar is FullCalendar's own). */
export default function MobileCalendarToolbar({
  title,
  onPrevious,
  onNext,
  onToday,
  isOnToday = false,
  actionLabel = 'Today',
  onAction,
  actionIcon,
  views = [],
  activeView,
  onViewChange
}) {
  const navButton = 'press flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-panel text-ink-2 hover:border-line-strong hover:text-ink';

  return (
    <div className="mb-3 space-y-2.5 sm:hidden">
      {/* Month on its own line so it never gets cut off */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="min-w-0 flex-1 truncate text-lg font-medium tracking-[-0.02em] text-ink">{title}</h3>
        <div className="flex shrink-0 items-center gap-1.5">
          <button onClick={onPrevious} aria-label="Previous month" className={navButton}>
            <FiChevronLeft size={18} />
          </button>
          <button onClick={onNext} aria-label="Next month" className={navButton}>
            <FiChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {views.length > 1 && (
          <div role="group" aria-label="Calendar view" className="grid min-w-0 flex-1 grid-cols-2 gap-1 rounded-xl border border-line bg-field p-1">
            {views.map(view => {
              const active = activeView === view.id;
              return (
                <button
                  key={view.id}
                  onClick={() => onViewChange(view.id)}
                  aria-pressed={active}
                  className={`press flex min-h-8 items-center justify-center rounded-lg text-sm font-medium ${active ? 'bg-panel text-ink shadow-[0_1px_2px_rgb(13_13_13/0.08),0_0_0_1px_var(--ui-line)]' : 'text-muted hover:text-ink'}`}
                >
                  {view.label}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex shrink-0 items-center gap-1.5">
          {onToday && (
            <button
              onClick={onToday}
              disabled={isOnToday}
              className={`press h-10 rounded-xl px-3.5 text-sm font-medium disabled:cursor-default ${isOnToday ? 'border border-line bg-panel text-muted opacity-60' : 'bg-brand-gold text-brand-dark hover:bg-brand-gold-500'}`}
            >
              Today
            </button>
          )}
          {onAction && (
            <button
              onClick={onAction}
              aria-label={actionLabel}
              title={actionLabel}
              className={`press flex h-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark text-brand-white hover:bg-brand-slate dark:bg-brand-gold dark:text-brand-dark dark:hover:bg-brand-gold-500 ${actionIcon ? 'w-10' : 'px-3.5 text-sm font-medium'}`}
            >
              {actionIcon || actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
