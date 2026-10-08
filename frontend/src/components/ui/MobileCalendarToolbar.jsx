import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function MobileCalendarToolbar({
  title,
  onPrevious,
  onNext,
  actionLabel = 'Today',
  actionActive = true,
  onAction,
  actionIcon,
  views = [],
  activeView,
  onViewChange
}) {
  return (
    <div className="mb-3 sm:hidden space-y-2.5">
      {/* Top Row: Title on Left, Controls on Right */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="min-w-0 flex-1 truncate text-left text-sm font-black uppercase tracking-wide text-slate-900 dark:text-gray-300">
          {title}
        </h3>
        <div className="flex items-center gap-0 shrink-0">
          <button 
            onClick={onPrevious} 
            aria-label="Previous month" 
            className="calendar-nav-button mx-1 flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-[#e5e7eb] text-black shadow-sm transition-colors active:scale-95"
          >
            <FiChevronLeft size={16} />
          </button>
          <button 
            onClick={onNext} 
            aria-label="Next month" 
            className="calendar-nav-button mx-1 flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-[#e5e7eb] text-black shadow-sm transition-colors active:scale-95"
          >
            <FiChevronRight size={16} />
          </button>
          {onAction && (
            <button 
              onClick={onAction} 
              aria-label={actionLabel} 
              title={actionLabel} 
              className={`calendar-action-button flex shrink-0 items-center justify-center rounded-lg border-0 shadow-sm transition-colors active:scale-95 ${actionIcon ? 'h-8 w-8' : 'mx-1 min-h-[38px] px-3.5 py-2 font-sans text-[15px] font-bold normal-case'} ${actionActive ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-600 opacity-70 hover:bg-slate-300 dark:bg-slate-700 dark:text-gray-400 dark:hover:bg-slate-600'}`}
            >
              {actionIcon || actionLabel}
            </button>
          )}
        </div>
      </div>

      {/* Segmented View Switcher */}
      {views.length > 1 && (
        <div className="grid w-full grid-cols-2 rounded-xl border border-gray-300 bg-gray-100 p-1 shadow-sm dark:border-[#393e4f] dark:bg-[#191b22]">
          {views.map(view => (
            <button 
              key={view.id} 
              onClick={() => onViewChange(view.id)} 
              aria-pressed={activeView === view.id}
              className={`calendar-view-button mx-1 flex min-h-[38px] items-center justify-center rounded-lg px-3.5 py-2 font-sans text-[15px] font-bold normal-case transition-all active:scale-[0.98] ${activeView === view.id ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-sm' : 'text-slate-600 hover:bg-white dark:text-gray-300 dark:hover:bg-[#252833]'}`}
            >
              {view.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}