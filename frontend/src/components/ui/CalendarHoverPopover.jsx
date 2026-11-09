import React, { useEffect, useState, useRef } from 'react';
import {
  FiCalendar, FiClock, FiMapPin, FiExternalLink,
  FiUser, FiAward, FiCheckCircle
} from 'react-icons/fi';

export default function CalendarHoverPopover({ data, onClick, onMouseEnter, onMouseLeave }) {
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
        classes: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-200 dark:border-emerald-400/30'
      };
    }
    if (type === 'coach') {
      return {
        label: event.category || 'Coach Event',
        icon: <FiAward size={10} />,
        classes: 'bg-slate-100 text-black dark:bg-white/[.06] dark:text-gray-300 border-slate-200 dark:border-[#393e4f]'
      };
    }
    return {
      label: 'Membership',
      icon: <FiUser size={10} />,
      classes: 'bg-slate-100 text-black dark:bg-white/[.06] dark:text-gray-300 border-slate-200 dark:border-[#393e4f]'
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
      className="w-[310px] rounded-2xl border-2 border-gray-300 bg-white/95 p-4 text-slate-900 shadow-sm backdrop-blur-xl transition-all duration-150 animate-in fade-in zoom-in-95 cursor-pointer pointer-events-auto dark:border-gray-600 dark:bg-[#191b22]/95 dark:text-gray-100"
    >
      {/* Header with Mini Date Block */}
      <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b-2 border-gray-300 dark:border-gray-600">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#252833] border-2 border-gray-300 dark:border-gray-600 text-center shrink-0 shadow-sm">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-black dark:text-gray-300 leading-none">
              {monthShort}
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-gray-300 leading-none mt-0.5">
              {dayNum}
            </span>
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {weekdayName}, {fullDateFormatted}
            </h4>
            <p className="text-[10px] text-slate-700 dark:text-gray-300 font-medium flex items-center gap-1">
              <span>{data.events.length} {data.events.length === 1 ? 'Scheduled Event' : 'Scheduled Events'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-2 max-h-48 overflow-y-auto hidden-scrollbar pr-0.5">
        {data.events.map((ev, idx) => {
          const badge = getEventBadge(ev);
          const accentColor = ev.color || '#f59e0b';
          const badgeStyle = ev.type === 'coach' || ev.type === 'sub' ? {
            backgroundColor: `color-mix(in srgb, ${accentColor} 14%, transparent)`,
            borderColor: `color-mix(in srgb, ${accentColor} 50%, transparent)`,
          } : undefined;

          return (
            <div
              key={ev.id || idx}
              className={`flex min-w-0 flex-col gap-1 rounded-xl border-2 border-gray-300 bg-slate-50/80 p-2.5 transition-all hover:bg-slate-100/80 dark:border-gray-600 dark:bg-[#252833]/70 dark:hover:bg-[#252833] ${ev.type === 'attendance' ? 'border-emerald-200/80 bg-emerald-50/40 hover:bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/[.04] dark:hover:bg-emerald-500/[.08]' : ''}`}
              style={{
                borderLeft: ev.type === 'coach' || ev.type === 'sub'
                  ? `4px solid ${accentColor}`
                  : ev.type === 'attendance' ? '4px solid #10b981' : undefined
              }}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span style={badgeStyle} className={`inline-flex min-w-0 items-center gap-1 truncate rounded-md border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide ${badge.classes}`}>
                  {badge.icon}
                  {badge.label}
                </span>
              </div>

              <span className="text-xs font-semibold text-slate-900 dark:text-gray-100 truncate mt-0.5">
                {ev.title}
              </span>

              {ev.detail && (
                <p className="text-[10px] text-black dark:text-gray-300 font-medium truncate">
                  {ev.detail}
                </p>
              )}

              {ev.type === 'sub' && ev.startDate && ev.endDate && (
                <span className="flex items-center gap-1 font-medium text-black dark:text-gray-300 text-[10px]">
                  <FiCalendar size={10} />
                  {formatDateRange(ev.startDate, ev.endDate)}
                </span>
              )}

              {(ev.time || ev.location) && (
                <div className="flex items-center gap-2 text-[10px] text-black dark:text-gray-300 pt-0.5">
                  {ev.time && (
                    <span className={`flex items-center gap-1 font-medium ${ev.type === 'attendance' ? 'text-emerald-800 dark:text-emerald-300' : 'text-black dark:text-gray-300'}`}>
                      <FiClock className={ev.type === 'attendance' ? 'text-emerald-600 dark:text-emerald-300' : ''} size={10} />
                      {ev.time}
                    </span>
                  )}
                  {ev.location && (
                    <span className="flex min-w-0 items-center gap-1 truncate text-black dark:text-gray-300">
                      <FiMapPin size={10} />
                      <span className="truncate">{ev.location}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="mt-3 pt-2.5 border-t-2 border-gray-300 dark:border-gray-600 flex items-center justify-between text-[10px] font-medium text-slate-700 dark:text-gray-300">
        <span>Click day to open full sheet</span>
        <div className="flex items-center gap-1 font-semibold text-black dark:text-gray-300">
          <span>Details</span>
          <FiExternalLink size={11} />
        </div>
      </div>
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
