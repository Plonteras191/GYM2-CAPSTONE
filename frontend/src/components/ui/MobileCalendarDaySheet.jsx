import React from 'react';
import { 
  FiX, FiCalendar, FiMapPin, FiClock, FiUser, 
  FiAward, FiCheckCircle, FiLayers, FiEdit2, FiTrash2
} from 'react-icons/fi';

export default function MobileCalendarDaySheet({ 
  date, 
  events = [], 
  onClose, 
  onEditCoachEvent,
  onDeleteCoachEvent,
  deletingEventId,
  emptyMessage = 'No activities recorded for this date.' 
}) {
  if (!date) return null;

  const dateObj = new Date(`${date}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const isToday = dateObj.toDateString() === today.toDateString();
  const isPast = dateObj < today && !isToday;
  const isFuture = dateObj > today;

  const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const dayNum = dateObj.getDate();
  const weekdayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const fullDateFormatted = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const getEventBadge = (event) => {
    const type = event.type || (event.detail?.toLowerCase().includes('attendance') ? 'attendance' : event.detail?.toLowerCase().includes('coach') ? 'coach' : 'sub');
    if (type === 'attendance') {
      return {
        label: 'Attendance Check-in',
        icon: <FiCheckCircle size={12} />,
        classes: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-200 dark:border-emerald-400/30'
      };
    }
    if (type === 'coach') {
      return {
        label: event.category || 'Coach Event',
        icon: <FiAward size={12} />,
        classes: 'bg-slate-100 text-black dark:bg-white/[.06] dark:text-gray-300 border-slate-200 dark:border-[#393e4f]'
      };
    }
    return {
      label: 'Membership Pass',
      icon: <FiUser size={12} />,
      classes: 'bg-slate-100 text-black dark:bg-white/[.06] dark:text-gray-300 border-slate-200 dark:border-[#393e4f]'
    };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <button 
        type="button"
        onClick={onClose} 
        aria-label="Close day details" 
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity" 
      />

      {/* Modal Dialog Card */}
      <section 
        role="dialog" 
        aria-modal="true" 
        aria-label={`Activities for ${weekdayName}, ${fullDateFormatted}`} 
        className="relative flex w-full max-h-[88svh] sm:max-w-xl flex-col rounded-t-[2rem] sm:rounded-3xl border-2 border-gray-300 bg-white/95 shadow-sm backdrop-blur-xl dark:border-gray-600 dark:bg-[#191b22]/95 text-slate-900 dark:text-gray-100 overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-[#393e4f]" />
        </div>

        {/* Hero Header */}
        <div className="relative border-b border-slate-200/80 dark:border-[#252833] p-5 sm:p-6 bg-gradient-to-b from-slate-50/80 via-white to-transparent dark:from-[#252833]/50 dark:via-[#191b22] dark:to-transparent">
          <div className="flex items-start justify-between gap-4">
            
            {/* Calendar Day Block */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white dark:bg-[#252833] border-2 border-gray-300 dark:border-gray-600 shadow-sm shrink-0">
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide text-black dark:text-gray-300 uppercase">
                  {monthShort}
                </span>
                <span className="text-xl sm:text-2xl font-semibold leading-none text-black dark:text-gray-300 mt-0.5">
                  {dayNum}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-gray-300 truncate">
                    {weekdayName}
                  </span>
                  {isToday && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Today
                    </span>
                  )}
                  {isFuture && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      Upcoming
                    </span>
                  )}
                  {isPast && !isToday && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 dark:bg-[#252833] dark:text-[#6d758d] border border-slate-200 dark:border-[#393e4f]">
                      Past
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-[#6d758d] font-medium flex items-center gap-1.5">
                  <FiCalendar size={13} className="text-black dark:text-gray-300 shrink-0" />
                  <span>{fullDateFormatted}</span>
                  <span className="mx-1">•</span>
                  <span className="font-medium text-slate-700 dark:text-gray-300">
                    {events.length} {events.length === 1 ? 'Activity' : 'Activities'}
                  </span>
                </p>
              </div>
            </div>

            {/* Circular Close Button */}
            <button 
              type="button"
              onClick={onClose} 
              aria-label="Close dialog" 
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#252833] dark:hover:bg-[#2e3240] text-slate-500 dark:text-gray-300 transition-all border border-slate-200/80 dark:border-[#393e4f] shadow-sm active:scale-95"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 custom-scrollbar">
          {events.length === 0 ? (
            /* Modern Empty State */
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-[#393e4f] bg-slate-50/50 dark:bg-[#191b22]/50">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-3 shadow-inner">
                <FiLayers size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200 mb-1">
                No Activities Scheduled
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#6d758d] max-w-xs leading-relaxed">
                {emptyMessage}
              </p>
            </div>
          ) : (
            /* Activity Cards */
            <div className="space-y-3">
              {events.map((event, index) => {
                const badge = getEventBadge(event);
                const accentColor = event.color || '#f59e0b';
                const badgeStyle = event.type === 'coach' || event.type === 'sub' ? {
                  backgroundColor: `color-mix(in srgb, ${accentColor} 14%, transparent)`,
                  borderColor: `color-mix(in srgb, ${accentColor} 50%, transparent)`,
                } : undefined;

                return (
                  <article 
                    key={event.id ?? index} 
                    className="group relative flex min-w-0 flex-col gap-2.5 overflow-hidden rounded-2xl border-2 border-gray-300 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-600 dark:bg-[#1f222b]"
                    style={{
                      borderLeft: event.type === 'coach' || event.type === 'sub'
                        ? `4px solid ${accentColor}`
                        : event.type === 'attendance' ? '4px solid #10b981' : undefined
                    }}
                  >
                    {/* Top Row: Category Badge & Glow Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <span style={badgeStyle} className={`inline-flex min-w-0 max-w-[80%] items-center gap-1.5 truncate rounded-lg border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${badge.classes}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {event.type === 'coach' && onEditCoachEvent && (
                          <button
                            type="button"
                            onClick={() => onEditCoachEvent(event)}
                            aria-label={`Edit ${event.title}`}
                            title="Edit event"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-amber-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-500 hover:bg-amber-50 dark:border-[#393e4f] dark:bg-[#191b22] dark:text-amber-400 dark:hover:bg-amber-500/10"
                          >
                            <FiEdit2 size={15} strokeWidth={2.5} />
                          </button>
                        )}
                        {event.type === 'coach' && onDeleteCoachEvent && (
                          <button
                            type="button"
                            onClick={() => onDeleteCoachEvent(event.id)}
                            disabled={deletingEventId === event.id}
                            aria-label={`Delete ${event.title}`}
                            title="Delete event"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-red-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-500 hover:bg-red-50 disabled:opacity-50 dark:border-[#393e4f] dark:bg-[#191b22] dark:text-red-400 dark:hover:bg-red-500/10"
                          >
                            <FiTrash2 size={15} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-gray-300 leading-snug break-words">
                      {event.title}
                    </h3>

                    {/* Detail Description */}
                    {event.detail && (
                      <p className="text-xs text-black dark:text-gray-300 font-medium leading-relaxed">
                        {event.detail}
                      </p>
                    )}
                    {event.description && (
                      <div className="min-w-0 rounded-lg bg-slate-50 px-3 py-2 dark:bg-white/[.03]">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
                          Description
                        </p>
                        <p className="break-words whitespace-pre-wrap text-xs leading-relaxed text-slate-700 dark:text-gray-300">
                        {event.description}
                        </p>
                      </div>
                    )}

                    {/* Metadata Chips (Time & Location) */}
                    {(event.time || event.location || (event.type === 'sub' && event.startDate && event.endDate)) && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-[#252833] mt-1">
                        {event.type === 'sub' && event.startDate && event.endDate && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/60 bg-slate-50 px-2.5 py-1 text-xs font-medium text-black shadow-xs dark:border-[#393e4f]/80 dark:bg-[#191b22] dark:text-gray-300">
                            <FiCalendar className="shrink-0 text-black dark:text-gray-300" size={13} />
                            <span>{formatDateRange(event.startDate, event.endDate)}</span>
                          </span>
                        )}
                        {event.time && (
                          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium shadow-xs ${event.type === 'attendance' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/25' : 'bg-slate-50 text-slate-700 border-slate-200/60 dark:bg-[#191b22] dark:text-gray-200 dark:border-[#393e4f]/80'}`}>
                            <FiClock className={`shrink-0 ${event.type === 'attendance' ? 'text-emerald-600 dark:text-emerald-300' : 'text-black dark:text-gray-300'}`} size={13} />
                            <span>{event.time}</span>
                          </span>
                        )}
                        {event.location && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 dark:bg-[#191b22] text-black dark:text-gray-300 border border-slate-200/60 dark:border-[#393e4f]/80 shadow-xs">
                            <FiMapPin className="text-black dark:text-gray-300 shrink-0" size={13} />
                            <span className="truncate max-w-[200px]">{event.location}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="border-t border-slate-200/80 dark:border-[#252833] bg-slate-50/90 dark:bg-[#16181f]/90 px-5 py-3.5 sm:px-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="mx-1 ml-auto flex min-h-[38px] items-center justify-center rounded-lg border-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-3.5 py-2 font-sans text-[15px] font-bold normal-case text-black shadow-sm transition-all hover:brightness-105 active:scale-95"
          >
            Done
          </button>
        </div>
      </section>
    </div>
  );
}

function formatDateRange(startDate, endDate) {
  const formatDate = value => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}
