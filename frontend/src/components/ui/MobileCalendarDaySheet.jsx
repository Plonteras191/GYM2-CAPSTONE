import React from 'react';
import { FiX, FiCalendar, FiMapPin, FiClock, FiUser, FiAward, FiCheckCircle, FiEdit2, FiTrash2, FiLoader, FiLogIn, FiFlag } from 'react-icons/fi';
import Button from './Button';
import Badge from './Badge';
import IconButton from './IconButton';
import ColorTile from './ColorTile';

const GROUPS = [
  { type: 'coach', label: 'Coach events', icon: FiAward },
  { type: 'sub', label: 'Memberships', icon: FiUser },
  { type: 'attendance', label: 'Check-ins', icon: FiCheckCircle },
];

const typeOf = (event) => event.type
  || (event.detail?.toLowerCase().includes('attendance') ? 'attendance' : event.detail?.toLowerCase().includes('coach') ? 'coach' : 'sub');

/** Everything on one calendar day. A bottom sheet on phones, a dialog on larger screens. */
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
  const days = Math.round((dateObj - today) / 86400000);
  const isToday = days === 0;
  const relative = isToday ? 'Today' : days === 1 ? 'Tomorrow' : days === -1 ? 'Yesterday' : days > 0 ? `In ${days} days` : `${Math.abs(days)} days ago`;

  const weekdayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const fullDateFormatted = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const groups = GROUPS.map(group => ({ ...group, events: events.filter(ev => typeOf(ev) === group.type) })).filter(group => group.events.length);

  return (
    <div className="animate-fade-in fixed inset-0 z-[100] flex items-end p-0 sm:items-center sm:justify-center sm:p-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close day details"
        className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Activities for ${weekdayName}, ${fullDateFormatted}`}
        className="animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 relative flex max-h-[88svh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-line bg-panel text-ink shadow-2xl sm:max-w-xl sm:rounded-2xl"
      >
        {/* Drag handle (phones) */}
        <div className="flex justify-center pb-1 pt-3 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-line" />
        </div>

        {/* Date */}
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 pb-4 pt-3 sm:px-6 sm:pt-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl ${isToday ? 'bg-brand-gold text-brand-dark' : 'bg-field text-ink'}`}>
              <span className={`text-xs leading-none ${isToday ? 'text-brand-dark/70' : 'text-muted'}`}>{dateObj.toLocaleDateString('en-US', { month: 'short' })}</span>
              <span className="mt-1 text-2xl font-medium leading-none tracking-[-0.03em]">{dateObj.getDate()}</span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-medium tracking-[-0.02em] text-ink">{weekdayName}</h2>
                <Badge variant={isToday ? 'success' : days > 0 ? 'info' : 'default'} dot={isToday}>{relative}</Badge>
              </div>
              <p className="mt-0.5 text-[13px] text-muted">
                {fullDateFormatted} · {events.length} {events.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="press flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-muted hover:bg-hover hover:text-ink"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Activities */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-canvas p-4 sm:p-6">
          {events.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong px-4 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-hover text-muted"><FiCalendar size={20} /></span>
              <div>
                <p className="text-[15px] font-medium text-ink">Nothing on this day</p>
                <p className="mx-auto mt-1 max-w-xs text-[13px] text-muted">{emptyMessage}</p>
              </div>
            </div>
          ) : groups.map(group => (
            <section key={group.type}>
              <h3 className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-muted">
                <group.icon size={14} aria-hidden="true" /> {group.label}
                <span className="rounded-full bg-hover px-1.5 text-xs tabular-nums text-ink-2">{group.events.length}</span>
              </h3>
              <div className="space-y-2.5">
                {group.events.map((event, index) => {
                  const color = group.type === 'attendance' ? 'var(--ui-positive)' : (event.color || 'var(--ui-line-strong)');
                  // Memberships show whether this day is the start or the end.
                  const icon = group.type === 'coach' ? FiAward
                    : group.type === 'attendance' ? FiCheckCircle
                      : String(event.id).startsWith('end-') ? FiFlag : FiLogIn;
                  return (
                    <article
                      key={event.id ?? index}
                      className="rise flex min-w-0 gap-3.5 rounded-xl border border-line bg-panel p-4 transition-colors duration-150 hover:border-line-strong"
                      style={{ '--i': index * 0.5 }}
                    >
                      <ColorTile color={color} icon={icon} />
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 pt-0.5">
                          <h4 className="break-words text-[15px] font-medium leading-snug text-ink">{event.title}</h4>
                          {(group.type === 'coach' && event.category) || event.detail ? (
                            <p className="mt-0.5 text-[13px] text-muted">{group.type === 'coach' && event.category ? event.category : event.detail}</p>
                          ) : null}
                        </div>
                        {group.type === 'coach' && (onEditCoachEvent || onDeleteCoachEvent) && (
                          <div className="flex shrink-0 items-center gap-1.5">
                            {onEditCoachEvent && (
                              <IconButton tone="warn" label={`Edit ${event.title}`} icon={<FiEdit2 size={14} />} onClick={() => onEditCoachEvent(event)}>Edit</IconButton>
                            )}
                            {onDeleteCoachEvent && (
                              <IconButton
                                tone="danger"
                                label={`Delete ${event.title}`}
                                icon={deletingEventId === event.id ? <FiLoader size={14} className="animate-spin" /> : <FiTrash2 size={14} />}
                                onClick={() => onDeleteCoachEvent(event.id)}
                                disabled={deletingEventId === event.id}
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {event.description && (
                        <p className="whitespace-pre-wrap break-words rounded-lg bg-field px-3 py-2 text-[13px] leading-relaxed text-ink-2">{event.description}</p>
                      )}

                      {(event.time || event.location || (group.type === 'sub' && event.startDate && event.endDate)) && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-ink-2">
                          {group.type === 'sub' && event.startDate && event.endDate && (
                            <span className="inline-flex items-center gap-1.5"><FiCalendar size={13} className="text-muted" />{formatDateRange(event.startDate, event.endDate)}</span>
                          )}
                          {event.time && (
                            <span className="inline-flex items-center gap-1.5"><FiClock size={13} className="text-muted" /><span className="font-mono text-[12.5px] tracking-tight">{event.time}</span></span>
                          )}
                          {event.location && (
                            <span className="inline-flex min-w-0 items-center gap-1.5"><FiMapPin size={13} className="text-muted" /><span className="truncate">{event.location}</span></span>
                          )}
                        </div>
                      )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="flex justify-end border-t border-line px-5 py-3.5 sm:px-6">
          <Button onClick={onClose} className="w-full sm:w-auto">Done</Button>
        </div>
      </section>
    </div>
  );
}

function formatDateRange(startDate, endDate) {
  const formatDate = value => new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}
