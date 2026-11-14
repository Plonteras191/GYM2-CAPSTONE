import React from 'react';
import { FiFilter, FiPlus, FiTrash2, FiEdit2, FiCalendar, FiLoader } from 'react-icons/fi';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import MobileCalendarToolbar from '../../../components/ui/MobileCalendarToolbar';
import MobileCalendarDaySheet from '../../../components/ui/MobileCalendarDaySheet';
import CalendarHoverPopover from '../../../components/ui/CalendarHoverPopover';
import CalendarCategoryFilters from './CalendarCategoryFilters';
import { getActivePackageCategoryOptions, getCoachEventCategoryOptions, getPackageColor } from '../packageCategories';
import { getLocalDateString } from '../../../utils/dateFormat';
import Panel from '../../../components/ui/Panel';
import Button from '../../../components/ui/Button';
import IconButton from '../../../components/ui/IconButton';
import { tintStyle } from '../../../components/ui/ColorTile';

export default function SubscriptionsCalendarView({
  subscriptions,
  coachEvents,
  showSubscriptions,
  setShowSubscriptions,
  showCoachEvents,
  setShowCoachEvents,
  eventCategories = [],
  selectedCoachCategories = null,
  setSelectedCoachCategories,
  selectedSubscriptionCategories = null,
  setSelectedSubscriptionCategories,
  plans = [],
  onOpenEventModal,
  onEditCoachEvent,
  onDeleteCoachEvent,
  deletingEventId,
  onDateClick,
  calendarOnly = false,
  readOnly = false
}) {
  const calendarRef = React.useRef(null);
  const [calendarTitle, setCalendarTitle] = React.useState('');
  const [calendarView, setCalendarView] = React.useState('dayGridMonth');
  const [isCalendarCurrentMonth, setIsCalendarCurrentMonth] = React.useState(true);
  const [selectedDay, setSelectedDay] = React.useState(null);
  const [selectedDayEvents, setSelectedDayEvents] = React.useState([]);
  const todayStr = getLocalDateString();
  const allCalendarEvents = [];
  const categoryIsVisible = (category, selected) =>
    selected === null || selected.includes(category);
  const subscriptionCategoryOptions = getActivePackageCategoryOptions(plans, subscriptions, todayStr);
  const coachCategoryOptions = getCoachEventCategoryOptions(eventCategories, coachEvents, todayStr);

  const activeSubsMap = new Map();
  subscriptions.forEach(sub => {
    if (sub.status !== 'Active' || !sub.member) return;
    const plan = sub.plan || plans.find(item => item.name === sub.plan_type);
    const normalizedPlanName = (sub.plan_type || '').toLowerCase();
    if (plan?.category === 'walk_in' || normalizedPlanName.includes('walk') || normalizedPlanName.includes('daily')) return;
    const packageName = plan?.name || sub.plan_type;
    if (!categoryIsVisible(packageName, selectedSubscriptionCategories)) return;
    const existing = activeSubsMap.get(sub.member_id);
    if (!existing || new Date(sub.end_date) > new Date(existing.end_date)) {
      activeSubsMap.set(sub.member_id, sub);
    }
  });
  const uniqueLatestActiveSubs = Array.from(activeSubsMap.values());

  if (showSubscriptions) {
    uniqueLatestActiveSubs.forEach(sub => {
      const planName = (sub.plan_type || '').toLowerCase();
      const plan = sub.plan || plans.find(item => item.name === sub.plan_type);
      if (plan?.category === 'walk_in' || planName.includes('walk') || planName.includes('daily') || planName === 'none') return;
      const color = getPackageColor(plan);
      allCalendarEvents.push({
        id: `start-${sub.id}`,
        title: `Start of ${sub.member.first_name}'s ${sub.plan_type}`,
        date: sub.start_date,
        backgroundColor: color,
        borderColor: color,
        allDay: true,
        extendedProps: { type: 'sub', ...sub }
      });
      if (sub.end_date && sub.end_date !== sub.start_date) {
        allCalendarEvents.push({
          id: `end-${sub.id}`,
          title: `End of ${sub.member.first_name}'s ${sub.plan_type}`,
          date: sub.end_date,
          backgroundColor: color,
          borderColor: color,
          allDay: true,
          extendedProps: { type: 'sub', ...sub }
        });
      }
    });
  }

  if (showCoachEvents) {
    coachEvents.forEach(event => {
      const color = event.category?.color || event.color || '#3b82f6';
      if (!categoryIsVisible(event.category?.name || 'General', selectedCoachCategories)) return;
      allCalendarEvents.push({
        id: `coach-${event.id}`,
        title: event.title,
        start: event.start_date,
        date: event.start_date,
        allDay: true,
        backgroundColor: color,
        borderColor: color,
        extendedProps: { type: 'coach', ...event }
      });
    });
  }

  const upcomingCoachEvents = coachEvents
    .filter(event => categoryIsVisible(event.category?.name || 'General', selectedCoachCategories))
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .filter(event => (event.end_date || event.start_date) >= todayStr);

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const getEventsForDate = (date) => allCalendarEvents.filter(event => {
    const start = event.start || event.date;
    if (!start) return false;
    return event.end ? start <= date && date < event.end : start === date;
  });

  const toDaySheetEvent = (event) => {
    const details = event.extendedProps || event;
    const category = details.category?.name || details.category || '';
    return {
      id: details.type === 'coach' ? details.id : event.id,
      title: event.title || details.title,
      color: event.backgroundColor || event.color || details.color,
      time: details.time || formatTime(details.start_time),
      location: details.location,
      type: details.type,
      detail: details.detail || (details.type === 'sub' ? `${details.plan_type} subscription` : details.type === 'coach' ? 'Coach event' : ''),
      category,
      description: details.description || '',
      startDate: details.start_date || details.startDate,
      endDate: details.end_date || details.endDate,
    };
  };

  const [hoveredDay, setHoveredDay] = React.useState(null);
  const hoverTimeoutRef = React.useRef(null);

  const handleCalendarMouseMove = (e) => {
    if (selectedDay) return;
    const dayCell = e.target.closest('.fc-daygrid-day');
    if (!dayCell) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => setHoveredDay(null), 120);
      return;
    }
    const dateStr = dayCell.getAttribute('data-date');
    if (!dateStr) return;
    if (hoveredDay?.date === dateStr) return;

    const dayEvents = getEventsForDate(dateStr);
    if (!dayEvents || dayEvents.length === 0) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      setHoveredDay(null);
      return;
    }

    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = dayCell.getBoundingClientRect();
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredDay({
        date: dateStr,
        events: dayEvents.map(toDaySheetEvent),
        rect
      });
    }, 80);
  };

  const handleCalendarMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setHoveredDay(null), 150);
  };

  const openDayDetails = (date, events = getEventsForDate(date)) => {
    setHoveredDay(null);
    setSelectedDay(date);
    setSelectedDayEvents(events.map(toDaySheetEvent));
  };

  const handleCalendarDateClick = (info) => {
    setHoveredDay(null);
    const dayEvents = getEventsForDate(info.dateStr);
    if (dayEvents.length) {
      openDayDetails(info.dateStr, dayEvents);
      return;
    }
    if (!readOnly) onDateClick?.(info);
  };

  return (
    <div className={`grid w-full min-w-0 grid-cols-1 items-start gap-5 lg:gap-6 ${calendarOnly ? '' : 'xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_370px]'}`}>
      <div
        onMouseMove={handleCalendarMouseMove}
        onMouseLeave={handleCalendarMouseLeave}
        className={`cal-theme mobile-calendar-grid relative flex h-auto min-w-0 flex-col sm:min-h-[clamp(28rem,75svh,46rem)] xl:col-start-1 xl:row-start-1 ${calendarOnly ? '' : 'rise rounded-2xl border border-line bg-panel p-3 sm:p-5'}`}
        style={calendarOnly ? undefined : { '--i': 2 }}
      >
        <MobileCalendarToolbar
          title={calendarTitle}
          onPrevious={() => calendarRef.current?.getApi().prev()}
          onNext={() => calendarRef.current?.getApi().next()}
          onToday={() => calendarRef.current?.getApi().today()}
          isOnToday={isCalendarCurrentMonth}
          actionLabel={calendarOnly || readOnly ? undefined : 'Add event'}
          actionIcon={calendarOnly || readOnly ? undefined : <FiPlus size={18} />}
          onAction={calendarOnly || readOnly ? undefined : onOpenEventModal}
          views={[{ id: 'dayGridMonth', label: 'Month' }, { id: 'listWeek', label: 'List' }]}
          activeView={calendarView}
          onViewChange={view => calendarRef.current?.getApi().changeView(view)}
        />

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          buttonText={{ month: 'Month', list: 'List', today: 'Today' }}
          dayMaxEvents={2}
          displayEventTime={false}
          moreLinkContent={arg => `+${arg.num} more`}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,listWeek' }}
          events={allCalendarEvents}
          eventDidMount={info => {
            // The chip is tinted from its own colour (see .cal-theme in index.css).
            const color = info.event.backgroundColor || info.event.borderColor || getComputedStyle(info.el).backgroundColor;
            info.el.style.setProperty('--ev', color);
          }}
          height="auto"
          datesSet={dateInfo => {
            setCalendarTitle(dateInfo.view.title);
            setCalendarView(dateInfo.view.type);
            const now = new Date();
            const currentStart = dateInfo.view.currentStart;
            const isCurrentMonth = currentStart.getMonth() === now.getMonth()
              && currentStart.getFullYear() === now.getFullYear();
            setIsCalendarCurrentMonth(isCurrentMonth);
          }}
          dayHeaderContent={headerInfo => typeof window !== 'undefined' && window.innerWidth < 640 ? headerInfo.text.charAt(0) : headerInfo.text}
          dateClick={handleCalendarDateClick}
          eventClick={info => {
            const date = info.event.startStr.slice(0, 10);
            openDayDetails(date);
          }}
        />
      </div>

      {!calendarOnly && (
        <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:gap-6 xl:col-start-2 xl:row-start-1">
          <div className="hidden xl:block">
            <Panel index={3} title="Show on calendar" icon={FiFilter} bodyClassName="space-y-3">
              <CalendarCategoryFilters
                title="Client subscriptions"
                categories={subscriptionCategoryOptions}
                selectedCategories={selectedSubscriptionCategories}
                onChange={setSelectedSubscriptionCategories}
                enabled={showSubscriptions}
                onEnabledChange={setShowSubscriptions}
              />
              <CalendarCategoryFilters
                title="Coach events & sessions"
                categories={coachCategoryOptions}
                selectedCategories={selectedCoachCategories}
                onChange={setSelectedCoachCategories}
                enabled={showCoachEvents}
                onEnabledChange={setShowCoachEvents}
              />
            </Panel>
          </div>

          <Panel
            index={4}
            title="Coach events"
            icon={FiCalendar}
            meta={upcomingCoachEvents.length > 0 && (
              <span className="rounded-full bg-hover px-2 py-0.5 text-[13px] font-medium tabular-nums text-ink-2">{upcomingCoachEvents.length}</span>
            )}
            action={!readOnly && (
              <Button size="sm" icon={<FiPlus size={15} />} onClick={onOpenEventModal}>Add event</Button>
            )}
            bodyClassName="max-h-[34rem] overflow-y-auto overscroll-contain coach-event-list-scroll"
          >
            {upcomingCoachEvents.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-hover text-muted"><FiCalendar size={19} /></span>
                <div>
                  <p className="text-[15px] font-medium text-ink">No upcoming coach events</p>
                  <p className="mt-1 text-[13px] text-muted">Classes and sessions you add show up here and on the calendar.</p>
                </div>
                {!readOnly && <Button size="sm" variant="outline" icon={<FiPlus size={14} />} onClick={onOpenEventModal}>Add event</Button>}
              </div>
            ) : (
              <ul aria-label="Upcoming coach events" className="-my-1 space-y-2">
                {upcomingCoachEvents.map((event, index) => {
                  const eventDetails = {
                    id: event.id,
                    title: event.title,
                    color: event.category?.color || event.color,
                    time: formatTime(event.start_time),
                    location: event.location,
                    type: 'coach',
                    category: event.category?.name || '',
                    description: event.description || '',
                    detail: 'Coach event',
                    startDate: event.start_date,
                    endDate: event.end_date,
                  };
                  const eventColor = event.category?.color || event.color || '#F2B705';
                  const start = new Date(`${String(event.start_date).slice(0, 10)}T00:00:00`);
                  const meta = [start.toLocaleDateString('en-US', { weekday: 'short' }), event.category?.name, event.location].filter(Boolean).join(' · ');

                  return (
                    <li key={event.id} className="rise group flex items-stretch gap-2 rounded-xl border border-line p-2 transition-colors duration-150 hover:bg-hover" style={{ '--i': Math.min(index, 8) * 0.5 + 4 }}>
                      <button
                        type="button"
                        onClick={() => openDayDetails(event.start_date, [eventDetails])}
                        className="press flex min-w-0 flex-1 items-stretch gap-3 rounded-lg p-1 text-left"
                        aria-label={`${event.title}, ${start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}. Open details`}
                      >
                        <span className="flex w-12 shrink-0 flex-col items-center justify-center rounded-lg py-1.5" style={tintStyle(eventColor)}>
                          <span className="text-xs text-muted">{start.toLocaleDateString('en-US', { month: 'short' })}</span>
                          <span className="text-xl font-medium leading-none tracking-[-0.02em] text-ink">{start.getDate()}</span>
                        </span>
                        <span className="min-w-0 flex-1 py-0.5">
                          <span className="block truncate text-[15px] font-medium text-ink">{event.title}</span>
                          {event.start_time && <span className="mt-0.5 block font-mono text-[12.5px] tracking-tight text-ink-2">{formatTime(event.start_time)}{event.end_time ? `–${formatTime(event.end_time)}` : ''}</span>}
                          <span className="mt-0.5 block truncate text-[13px] text-muted">{meta}</span>
                        </span>
                      </button>
                      {!readOnly && (
                        <div className="flex shrink-0 flex-col justify-center gap-1.5">
                          <IconButton tone="warn" label={`Edit ${event.title}`} icon={<FiEdit2 size={14} />} onClick={() => onEditCoachEvent(event)} className="h-8 min-w-8" />
                          <IconButton
                            tone="danger"
                            label={`Delete ${event.title}`}
                            icon={deletingEventId === event.id ? <FiLoader size={14} className="animate-spin" /> : <FiTrash2 size={14} />}
                            onClick={() => onDeleteCoachEvent(event.id)}
                            disabled={deletingEventId === event.id}
                            className="h-8 min-w-8"
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      )}
      <MobileCalendarDaySheet
        date={selectedDay}
        events={selectedDayEvents}
        onClose={() => setSelectedDay(null)}
        onEditCoachEvent={!readOnly ? event => {
          const coachEvent = coachEvents.find(item => String(item.id) === String(event.id));
          if (coachEvent) {
            setSelectedDay(null);
            onEditCoachEvent(coachEvent);
          }
        } : undefined}
        onDeleteCoachEvent={!readOnly ? onDeleteCoachEvent : undefined}
        deletingEventId={deletingEventId}
      />
      <CalendarHoverPopover
        data={selectedDay ? null : hoveredDay}
        onClose={() => setHoveredDay(null)}
        onClick={(date) => {
          setHoveredDay(null);
          openDayDetails(date);
        }}
        onMouseEnter={() => {
          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        }}
        onMouseLeave={handleCalendarMouseLeave}
      />
    </div>
  );
}
