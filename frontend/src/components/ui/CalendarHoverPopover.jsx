import React, { useEffect, useState, useRef } from 'react';
import { 
  FiCalendar, FiClock, FiMapPin, FiExternalLink, 
  FiUser, FiAward, FiCheckCircle 
} from 'react-icons/fi';

export default function CalendarHoverPopover({ data, onClose, onClick, onMouseEnter, onMouseLeave }) {
  const popoverRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: 'bottom' });

  useEffect(() => {
    if (!data?.rect) return;
    const rect = data.rect;
    const popoverWidth = 310; // w-[310px]
    const estimatedHeight = 220;

    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    if (left < 12) left = 12;
    if (left + popoverWidth > window.innerWidth - 12) {
      left = window.innerWidth - popoverWidth - 12;
    }

    let top = rect.bottom + 8;
    let placement = 'bottom';
    if (top + estimatedHeight > window.innerHeight - 12) {
      top = Math.max(12, rect.top - estimatedHeight - 8);
      placement = 'top';
    }

    setCoords({ top, left, placement });
  }, [data?.rect, data?.date]);

  if (!data || !data.events || data.events.length === 0) return null;

  const dateObj = new Date(`${data.date}T12:00:00`);
  const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const dayNum = dateObj.getDate();
  const weekdayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const fullDateFormatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getEventBadge = (event) => {
    const type = event.type || (event.detail?.toLowerCase().includes('attendance') ? 'attendance' : event.detail?.toLowerCase().includes('coach') ? 'coach' : 'sub');
    if (type === 'attendance') {
      return {
        label: 'Attendance',
        icon: <FiCheckCircle size={10} />,
        classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      };
    }
    if (type === 'coach') {
      return {
        label: 'Coach Event',
        icon: <FiAward size={10} />,
        classes: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
      };
    }
    return {
      label: 'Membership',
      icon: <FiUser size={10} />,
      classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    };
  };

  return (
    <div
      ref={popoverRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 9999
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(data.date);
      }}
      className="w-[310px] rounded-2xl bg-white/95 dark:bg-[#191b22]/95 backdrop-blur-xl p-4 shadow-2xl border border-slate-200/80 dark:border-[#393e4f] text-slate-900 dark:text-gray-100 animate-in fade-in zoom-in-95 duration-150 cursor-pointer pointer-events-auto transition-all hover:border-amber-500/60"
    >
      {/* Header with Mini Date Block */}
      <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100 dark:border-[#252833]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#252833] border border-amber-500/40 text-center shrink-0">
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 leading-none">
              {monthShort}
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-white leading-none mt-0.5">
              {dayNum}
            </span>
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
              {weekdayName}, {fullDateFormatted}
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-[#6d758d] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              <span>{data.events.length} {data.events.length === 1 ? 'Scheduled Event' : 'Scheduled Events'}</span>
            </p>
          </div>
        </div>

        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/30 shrink-0">
          View
        </span>
      </div>

      {/* Events List */}
      <div className="space-y-2 max-h-48 overflow-y-auto hidden-scrollbar pr-0.5">
        {data.events.map((ev, idx) => {
          const badge = getEventBadge(ev);
          const accentColor = ev.color || '#f59e0b';

          return (
            <div
              key={ev.id || idx}
              className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-[#252833]/70 border border-slate-200/60 dark:border-[#393e4f]/60 flex flex-col gap-1 transition-all hover:border-amber-500/40 hover:bg-slate-100/80 dark:hover:bg-[#252833]"
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${badge.classes}`}>
                  {badge.icon}
                  {badge.label}
                </span>
                <span 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: accentColor }} 
                />
              </div>

              <span className="text-xs font-extrabold text-slate-900 dark:text-gray-100 truncate mt-0.5">
                {ev.title}
              </span>

              {ev.detail && (
                <p className="text-[10px] text-slate-500 dark:text-[#6d758d] font-medium truncate">
                  {ev.detail}
                </p>
              )}

              {(ev.time || ev.location) && (
                <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-gray-300 pt-0.5">
                  {ev.time && (
                    <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                      <FiClock size={10} />
                      {ev.time}
                    </span>
                  )}
                  {ev.location && (
                    <span className="flex items-center gap-1 truncate text-slate-400 dark:text-gray-400">
                      <FiMapPin size={10} />
                      {ev.location}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#252833] flex items-center justify-between text-[10px] font-medium text-slate-400 dark:text-[#6d758d]">
        <span>Click day to open full sheet</span>
        <div className="flex items-center gap-1 text-amber-500 font-bold">
          <span>Details</span>
          <FiExternalLink size={11} />
        </div>
      </div>
    </div>
  );
}
