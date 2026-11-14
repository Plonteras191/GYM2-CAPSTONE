import React, { useEffect, useState, useRef } from 'react';
import { FiArrowRight, FiUser, FiAward, FiCheckCircle } from 'react-icons/fi';

const POPOVER_WIDTH = 320;
const ESTIMATED_HEIGHT = 260;
const MAX_ITEMS = 6;

const GROUPS = [
  { type: 'sub', label: 'Memberships', icon: FiUser },
  { type: 'coach', label: 'Coach events', icon: FiAward },
  { type: 'attendance', label: 'Check-ins', icon: FiCheckCircle },
];

const typeOf = (event) => event.type
  || (event.detail?.toLowerCase().includes('attendance') ? 'attendance' : event.detail?.toLowerCase().includes('coach') ? 'coach' : 'sub');

const relativeDay = (date) => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const days = Math.round((date - today) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  return days > 0 ? `In ${days} days` : `${Math.abs(days)} days ago`;
};

/**
 * Preview of a calendar day, shown while the pointer rests on it.
 * Clicking anywhere on it opens the full day sheet.
 */
export default function CalendarHoverPopover({ data, onClick, onMouseEnter, onMouseLeave }) {
  const popoverRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: 'bottom', arrow: POPOVER_WIDTH / 2 });

  useEffect(() => {
    if (!data?.rect) return;
    const rect = data.rect;

    let left = rect.left + rect.width / 2 - POPOVER_WIDTH / 2;
    if (left < 12) left = 12;
    if (left + POPOVER_WIDTH > window.innerWidth - 12) left = window.innerWidth - POPOVER_WIDTH - 12;

    let top = rect.bottom + 10;
    let placement = 'bottom';
    if (top + ESTIMATED_HEIGHT > window.innerHeight - 12) {
      top = Math.max(12, rect.top - ESTIMATED_HEIGHT - 10);
      placement = 'top';
    }

    // Keep the pointer arrow over the hovered day.
    const arrow = Math.min(POPOVER_WIDTH - 24, Math.max(24, rect.left + rect.width / 2 - left));
    setCoords({ top, left, placement, arrow });
  }, [data?.rect, data?.date]);

  if (!data || !data.events || data.events.length === 0) return null;

  const dateObj = new Date(`${data.date}T12:00:00`);
  const isToday = relativeDay(dateObj) === 'Today';
  const heading = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const total = data.events.length;

  let shown = 0;
  const groups = GROUPS.map(group => {
    const events = data.events.filter(ev => typeOf(ev) === group.type);
    const visible = events.slice(0, Math.max(0, MAX_ITEMS - shown));
    shown += visible.length;
    return { ...group, events: visible };
  }).filter(group => group.events.length > 0);
  const hidden = total - shown;

  return (
    <div
      ref={popoverRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ position: 'fixed', top: `${coords.top}px`, left: `${coords.left}px`, width: `${POPOVER_WIDTH}px`, zIndex: 9999, transformOrigin: `${coords.arrow}px ${coords.placement === 'bottom' ? '0' : '100%'}` }}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(data.date);
      }}
      className={`group animate-in fade-in zoom-in-95 ${coords.placement === 'bottom' ? 'slide-in-from-top-2' : 'slide-in-from-bottom-2'} pointer-events-auto cursor-pointer rounded-2xl border border-line bg-panel text-ink shadow-[0_18px_44px_-12px_rgb(13_13_13/0.28)] dark:shadow-[0_18px_44px_-12px_rgb(0_0_0/0.65)]`}
    >
      {/* Pointer toward the hovered day */}
      <span
        aria-hidden="true"
        className={`absolute h-3 w-3 rotate-45 border-line bg-panel ${coords.placement === 'bottom' ? '-top-1.5 border-l border-t' : '-bottom-1.5 border-b border-r'}`}
        style={{ left: coords.arrow - 6 }}
      />

      {/* Date */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <div className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl ${isToday ? 'bg-brand-gold text-brand-dark' : 'bg-field text-ink'}`}>
          <span className={`text-[11px] leading-none ${isToday ? 'text-brand-dark/70' : 'text-muted'}`}>{dateObj.toLocaleDateString('en-US', { month: 'short' })}</span>
          <span className="mt-0.5 text-lg font-medium leading-none tracking-[-0.02em]">{dateObj.getDate()}</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium text-ink">{heading}</p>
          <p className="text-[13px] text-muted">
            {relativeDay(dateObj)} · {total} {total === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>

      {/* Events, grouped by kind */}
      <div className="max-h-60 space-y-3 overflow-y-auto px-4 py-3">
        {groups.map(group => (
          <section key={group.type}>
            <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted">
              <group.icon size={12} aria-hidden="true" /> {group.label}
            </h4>
            <ul className="space-y-1">
              {group.events.map((ev, idx) => {
                const color = ev.type === 'attendance' ? 'var(--ui-positive)' : (ev.color || 'var(--ui-line-strong)');
                const range = ev.type === 'sub' && ev.startDate && ev.endDate ? formatDateRange(ev.startDate, ev.endDate) : '';
                return (
                  <li key={ev.id || idx} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5" style={{ background: `color-mix(in srgb, ${color} 9%, transparent)` }}>
                    <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium leading-snug text-ink">{ev.title}</span>
                      {(ev.time || ev.location || range) && (
                        <span className="block truncate text-xs text-muted">
                          {ev.time && <span className="font-mono tracking-tight text-ink-2">{ev.time}</span>}
                          {ev.time && (ev.location || range) && ' · '}
                          {range || ev.location}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {hidden > 0 && <p className="text-xs text-muted">+ {hidden} more on this day</p>}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between rounded-b-2xl border-t border-line bg-field px-4 py-2.5 text-[13px]">
        <span className="text-muted">Click to see the full day</span>
        <span className="flex items-center gap-1 font-medium text-ink">
          Open <FiArrowRight size={14} className="nudge" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function formatDateRange(startDate, endDate) {
  const formatDate = value => new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}
