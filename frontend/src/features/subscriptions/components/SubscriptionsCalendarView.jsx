import React from 'react';
import { FiFilter, FiPlus, FiTrash2, FiMapPin } from 'react-icons/fi';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import MobileCalendarToolbar from '../../../components/ui/MobileCalendarToolbar';
import MobileCalendarDaySheet from '../../../components/ui/MobileCalendarDaySheet';
import CalendarHoverPopover from '../../../components/ui/CalendarHoverPopover';

export default function SubscriptionsCalendarView({
  subscriptions,
  coachEvents,
  showSubscriptions,
  setShowSubscriptions,
  showCoachEvents,
  setShowCoachEvents,
  onOpenEventModal,
  onDeleteCoachEvent,
  onDateClick
}) {
  const calendarRef = React.useRef(null);
  const [calendarTitle, setCalendarTitle] = React.useState('');
  const [calendarView, setCalendarView] = React.useState('dayGridMonth');
  const [isCalendarCurrentMonth, setIsCalendarCurrentMonth] = React.useState(true);
  const [selectedDay, setSelectedDay] = React.useState(null);
  const [selectedDayEvents, setSelectedDayEvents] = React.useState([]);
  const todayStr = new Date().toISOString().split('T')[0];
  const allCalendarEvents = [];

  const activeSubsMap = new Map();
  subscriptions.forEach(sub => {
    if (sub.status !== 'Active' || !sub.member) return;
    const existing = activeSubsMap.get(sub.member_id);
    if (!existing || new Date(sub.end_date) > new Date(existing.end_date)) {
      activeSubsMap.set(sub.member_id, sub);
    }
  });
  const uniqueLatestActiveSubs = Array.from(activeSubsMap.values());

  if (showSubscriptions) {
    uniqueLatestActiveSubs.forEach(sub => {
      const planName = (sub.plan_type || '').toLowerCase();
      if (planName.includes('walk') || planName.includes('daily') || planName === 'none') return;
      const color = sub.color || '#f59e0b';
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
      const endDate = new Date(event.end_date || event.start_date);
      endDate.setDate(endDate.getDate() + 1);
      const color = event.color || '#3b82f6';
      allCalendarEvents.push({
        id: `coach-${event.id}`,
        title: event.title,
        start: event.start_date,
        end: event.start_date !== event.end_date ? endDate.toISOString().split('T')[0] : undefined,
        date: event.start_date === event.end_date ? event.start_date : undefined,
        allDay: true,
        backgroundColor: color,
        borderColor: color,
        extendedProps: { type: 'coach', ...event }
      });
    });
  }

  const activeSubsLegend = uniqueLatestActiveSubs.filter(sub => {
    const planName = (sub.plan_type || '').toLowerCase();
    return !planName.includes('walk') && !planName.includes('daily') && planName !== 'none';
  }).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  const upcomingCoachEvents = [...coachEvents]
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
    return start && start <= date && (!event.end || date < event.end);
  });

  const toDaySheetEvent = (event) => {
    const details = event.extendedProps || {};
    return {
      id: event.id,
      title: event.title,
      color: event.backgroundColor,
      time: formatTime(details.start_time),
      location: details.location,
      type: details.type,
      detail: details.type === 'sub' ? `${details.plan_type} subscription` : details.type === 'coach' ? 'Coach event' : ''
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
    onDateClick(info);
  };

  return (
    <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-6 animate-in fade-in duration-300 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_340px]">
      <div 
        onMouseMove={handleCalendarMouseMove}
        onMouseLeave={handleCalendarMouseLeave}
        className={`mobile-calendar-grid relative flex h-auto sm:min-h-[clamp(28rem,75svh,46rem)] min-w-0 flex-col bg-white dark:bg-[#252833] p-3 sm:p-6 rounded-2xl border-2 border-gray-300 dark:border-[#393e4f] shadow-sm xl:col-start-1 xl:row-start-1 ${isCalendarCurrentMonth ? 'calendar-current-month' : 'calendar-other-month'}`}
      >
        <style>{`
          .fc { --fc-border-color: #e2e8f0; --fc-page-bg-color: transparent; --fc-list-event-hover-bg-color: rgba(0,0,0,0.05); color: #4b5563; }
          .dark .fc { --fc-border-color: #4b5563; --fc-neutral-text-color: #d1d5db; --fc-today-bg-color: rgba(245, 158, 11, 0.1); color: #d1d5db; }
          .fc .fc-button-primary { background-color: #f1f5f9 !important; border: 1px solid #e2e8f0 !important; color: #000 !important; text-transform: none !important; font-weight: 700 !important; border-radius: 8px !important; padding: 6px 16px !important; box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important; margin: 0 4px !important; }
          .dark .fc .fc-button-primary { background-color: #1e293b !important; border-color: #374151 !important; color: #d1d5db !important; }
          .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button, .mobile-calendar-grid .fc .fc-button-primary.fc-next-button { background-color: #e5e7eb !important; border-color: transparent !important; border-radius: 0.5rem !important; color: #000 !important; padding: .4em .65em !important; }
          .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button:hover:not(:disabled), .mobile-calendar-grid .fc .fc-button-primary.fc-next-button:hover:not(:disabled), .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button:active:not(:disabled), .mobile-calendar-grid .fc .fc-button-primary.fc-next-button:active:not(:disabled) { background-color: #e5e7eb !important; border-color: #000 !important; color: #000 !important; }
          .dark .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button, .dark .mobile-calendar-grid .fc .fc-button-primary.fc-next-button { background-color: #4b5563 !important; border-color: transparent !important; color: #d1d5db !important; }
          .dark .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button:hover:not(:disabled), .dark .mobile-calendar-grid .fc .fc-button-primary.fc-next-button:hover:not(:disabled), .dark .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button:active:not(:disabled), .dark .mobile-calendar-grid .fc .fc-button-primary.fc-next-button:active:not(:disabled) { background-color: #4b5563 !important; border-color: #d1d5db !important; color: #d1d5db !important; }
          .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active { background-color: #0f172a !important; border: 1px solid #0f172a !important; color: #fff !important; text-transform: none !important; letter-spacing: 0 !important; font-weight: 700 !important; }
          .fc .fc-button.fc-button-primary.fc-today-button { background-color: #0f172a !important; border: 1px solid #0f172a !important; color: #fff !important; font-weight: 700 !important; border-radius: 0.5rem !important; text-transform: none !important; letter-spacing: 0 !important; }
          .fc .fc-button-primary.fc-dayGridMonth-button:hover:not(:disabled), .fc .fc-button-primary.fc-listWeek-button:hover:not(:disabled), .fc .fc-button.fc-button-primary.fc-today-button:hover:not(:disabled) { background-color: #1e293b !important; border-color: #1e293b !important; color: #fff !important; text-transform: none !important; letter-spacing: 0 !important; font-weight: 700 !important; }
          .fc .fc-button-primary.fc-dayGridMonth-button, .fc .fc-button-primary.fc-listWeek-button { text-transform: capitalize !important; }
          @media (min-width: 640px) {
            .mobile-calendar-grid .fc .fc-button-primary.fc-today-button, .mobile-calendar-grid .fc .fc-button-primary.fc-dayGridMonth-button, .mobile-calendar-grid .fc .fc-button-primary.fc-listWeek-button { min-height: 38px !important; padding: 8px 14px !important; margin: 0 4px !important; }
          }
          .calendar-current-month .fc .fc-button.fc-button-primary.fc-today-button { background-color: #0f172a !important; border-color: #0f172a !important; color: #fff !important; opacity: 1 !important; }
          .calendar-other-month .fc .fc-button.fc-button-primary.fc-today-button, .calendar-other-month .fc .fc-button.fc-button-primary.fc-today-button:hover:not(:disabled) { background-color: #f1f5f9 !important; border-color: #e2e8f0 !important; color: #4b5563 !important; opacity: 0.5 !important; }
          .dark .calendar-other-month .fc .fc-button.fc-button-primary.fc-today-button, .dark .calendar-other-month .fc .fc-button.fc-button-primary.fc-today-button:hover:not(:disabled) { background-color: #1e293b !important; border-color: #374151 !important; color: #9ca3af !important; }
          .dark .mobile-calendar-grid.calendar-other-month .fc .fc-button.fc-button-primary.fc-today-button, .dark .mobile-calendar-grid.calendar-other-month .fc .fc-button.fc-button-primary.fc-today-button:hover:not(:disabled) { border-color: #f59e0b !important; color: #000 !important; }
          .mobile-calendar-grid .fc .fc-button.fc-button-primary.fc-today-button, .mobile-calendar-grid .fc .fc-button.fc-button-primary.fc-today-button:hover:not(:disabled), .mobile-calendar-grid .fc .fc-button.fc-button-primary.fc-today-button:disabled { background-image: linear-gradient(to right, #facc15, #f59e0b) !important; border-color: #f59e0b !important; color: #000 !important; }
          .mobile-calendar-grid.calendar-current-month .fc .fc-button.fc-button-primary.fc-today-button { opacity: 1 !important; }
          .mobile-calendar-grid.calendar-other-month .fc .fc-button.fc-button-primary.fc-today-button, .mobile-calendar-grid.calendar-other-month .fc .fc-button.fc-button-primary.fc-today-button:hover:not(:disabled) { background-image: linear-gradient(to right, #facc15, #f59e0b) !important; border-color: #f59e0b !important; color: #000 !important; opacity: 0.5 !important; }
          .mobile-calendar-grid .fc .fc-button-primary.fc-dayGridMonth-button, .mobile-calendar-grid .fc .fc-button-primary.fc-dayGridMonth-button:hover:not(:disabled), .mobile-calendar-grid .fc .fc-button-primary.fc-listWeek-button, .mobile-calendar-grid .fc .fc-button-primary.fc-listWeek-button:hover:not(:disabled) { background-image: linear-gradient(to right, #facc15, #f59e0b) !important; border-color: #f59e0b !important; color: #000 !important; opacity: 0.5 !important; }
          .mobile-calendar-grid .fc .fc-button-primary.fc-dayGridMonth-button:not(:disabled).fc-button-active, .mobile-calendar-grid .fc .fc-button-primary.fc-listWeek-button:not(:disabled).fc-button-active { opacity: 1 !important; }
          .mobile-calendar-grid .fc .fc-button-primary.fc-today-button, .mobile-calendar-grid .fc .fc-button-primary.fc-dayGridMonth-button, .mobile-calendar-grid .fc .fc-button-primary.fc-listWeek-button { font-family: ui-sans-serif, system-ui, sans-serif !important; font-size: 15px !important; font-weight: 700 !important; text-transform: none !important; }
          .mobile-calendar-grid .calendar-action-button[aria-label="Today"] { font-family: ui-sans-serif, system-ui, sans-serif !important; font-size: 15px !important; font-weight: 700 !important; text-transform: none !important; }
          @media (max-width: 639px) {
            .mobile-calendar-grid .calendar-action-button[aria-label="Add Event"], .mobile-calendar-grid .calendar-action-button[aria-label="Add Event"]:hover, .mobile-calendar-grid .calendar-action-button[aria-label="Add Event"]:active { background-color: #f59e0b !important; background-image: linear-gradient(to right, #facc15, #f59e0b) !important; color: #000 !important; }
          }
          .mobile-calendar-grid .calendar-nav-button { background-color: #e5e7eb !important; border-color: transparent !important; color: #000 !important; }
          .mobile-calendar-grid .calendar-nav-button:hover, .mobile-calendar-grid .calendar-nav-button:active { background-color: #e5e7eb !important; border-color: #000 !important; color: #000 !important; }
          .dark .mobile-calendar-grid .calendar-nav-button { background-color: #4b5563 !important; border-color: transparent !important; color: #d1d5db !important; }
          .dark .mobile-calendar-grid .calendar-nav-button:hover, .dark .mobile-calendar-grid .calendar-nav-button:active { background-color: #4b5563 !important; border-color: #d1d5db !important; color: #d1d5db !important; }
          .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 800 !important; text-transform: none !important; color: #000; }
          .dark .fc-toolbar-title { color: #d1d5db !important; }
          .fc-scrollgrid { border: none !important; }
          .fc-theme-standard th, .fc-theme-standard td { border-color: var(--fc-border-color) !important; }
          .fc-theme-standard td { border-right: 1px solid var(--fc-border-color) !important; }
          .fc-theme-standard td:last-child { border-right: none !important; }
          .fc-col-header-cell-cushion { font-weight: 700 !important; font-size: .8rem !important; color: #0f172a !important; text-decoration: none !important; }
          .dark .fc-col-header-cell-cushion { color: #d1d5db !important; }
          .fc-daygrid-day-number { font-weight: 600; font-size: .8rem; padding: 8px !important; color: #475569 !important; text-decoration: none !important; }
          .dark .fc-daygrid-day-number { color: #d1d5db !important; }
          .fc-daygrid-event { border-radius: 6px !important; padding: 2px 4px !important; margin: 2px !important; border: 1px solid rgba(255,255,255,.2) !important; box-shadow: 0 1px 3px rgba(0,0,0,.15) !important; }
          .fc-event-main { color: #fff !important; font-weight: 800 !important; font-size: .65rem !important; text-shadow: 0 1px 2px rgba(0,0,0,.8) !important; }
          .fc-daygrid-more-link { color: #4b5563 !important; font-weight: 800 !important; font-size: .75rem !important; }
          .dark .fc-daygrid-more-link { color: #d1d5db !important; }
          .fc-popover { border: 1px solid var(--fc-border-color) !important; border-radius: 12px !important; background: #fff !important; box-shadow: 0 10px 25px -5px rgba(0,0,0,.15) !important; overflow: hidden; }
          .dark .fc-popover { background: #1e293b !important; border-color: #334155 !important; }
          .fc-popover-header { background: #f8fafc !important; padding: 12px !important; border-bottom: 1px solid var(--fc-border-color) !important; }
          .dark .fc-popover-header { background: #0f172a !important; border-color: #334155 !important; }
          .fc-popover-title { font-weight: 800 !important; font-size: .9rem !important; color: #000 !important; }
          .dark .fc-popover-title { color: #d1d5db !important; }
          .fc-popover-body { padding: 12px !important; }
        `}</style>

        <MobileCalendarToolbar
          title={calendarTitle}
          onPrevious={() => calendarRef.current?.getApi().prev()}
          onNext={() => calendarRef.current?.getApi().next()}
          actionLabel="Add Event"
          actionIcon={<FiPlus size={20} />}
          onAction={onOpenEventModal}
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

      <div className="grid min-w-0 grid-cols-1 grid-rows-[auto_auto_auto] items-stretch gap-6 md:grid-cols-2 md:grid-rows-[minmax(0,1fr)] xl:col-start-2 xl:row-start-1 xl:h-full xl:grid-cols-1 xl:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="hidden w-full min-w-0 bg-white dark:bg-[#252830] p-5 rounded-2xl border-2 border-gray-300 dark:border-gray-600 shadow-sm xl:col-span-1 xl:flex xl:flex-col">
          <h3 className="text-base font-bold text-black dark:text-gray-300 flex items-center gap-2 mb-3 border-b border-gray-400 dark:border-gray-600 pb-2">
            <FiFilter className="text-black dark:text-gray-300" /> View Filters
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:grid-cols-1">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={showSubscriptions} onChange={e => setShowSubscriptions(e.target.checked)} className="w-4 h-4 accent-amber-500 cursor-pointer" />
              <span className="text-sm font-bold text-black dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">Client Subscriptions</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={showCoachEvents} onChange={e => setShowCoachEvents(e.target.checked)} className="w-4 h-4 accent-amber-500 cursor-pointer" />
              <span className="text-sm font-bold text-black dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">Coach Events & Sessions</span>
            </label>
          </div>
        </div>

        <div className="bg-white dark:bg-[#252830] p-5 rounded-2xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex h-[clamp(28rem,75svh,46rem)] min-h-0 min-w-0 flex-col md:h-full">
          <h3 className="text-base font-bold text-black dark:text-gray-300 mb-4 border-b border-gray-400 dark:border-gray-600 pb-2">Active Subscriptions</h3>
          <div className="min-h-0 flex-1 overflow-y-auto hidden-scrollbar space-y-4 pr-2">
            {activeSubsLegend.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">No active subscriptions detected.</p>
            ) : activeSubsLegend.map((sub, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-md flex-shrink-0 shadow-sm mt-0.5" style={{ backgroundColor: sub.color || '#f59e0b' }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-black dark:text-gray-300 truncate leading-tight">{sub.member.first_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-[9px] text-slate-500 dark:text-gray-400 truncate uppercase tracking-widest font-bold">{sub.plan_type}</p>
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border shadow-sm ${sub.start_date > todayStr ? 'bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50' : 'bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50'}`}>
                      {sub.start_date > todayStr ? 'Future' : 'Current'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#252830] p-5 rounded-2xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex h-[clamp(28rem,75svh,46rem)] min-h-0 min-w-0 flex-col md:h-full">
          <div className="flex justify-between items-center mb-4 border-b border-gray-400 dark:border-gray-600 pb-2 flex-shrink-0">
            <h3 className="text-base font-bold text-black dark:text-gray-300">Event Plans</h3>
            <button onClick={onOpenEventModal} aria-label="Add Event" title="Add Event" className="mx-1 flex h-[38px] min-h-[38px] w-[38px] items-center justify-center gap-2 rounded-lg border-0 bg-gradient-to-r from-yellow-400 to-amber-500 p-0 font-sans text-[15px] font-bold normal-case text-black shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed sm:h-auto sm:w-auto sm:px-3.5 sm:py-2">
              <FiPlus size={16} strokeWidth={3} /> <span className="sr-only sm:not-sr-only">Add Event</span>
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto hidden-scrollbar space-y-3 pr-1">
            {upcomingCoachEvents.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8">No scheduled events.</p>
            ) : upcomingCoachEvents.map(event => (
              <div key={event.id} className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-300 dark:border-gray-700 shadow-sm relative group p-3.5 flex justify-between items-center transition-all hover:shadow-md" style={{ borderLeft: `5px solid ${event.color || '#eab308'}` }}>
                <button onClick={() => onDeleteCoachEvent(event.id)} className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 shadow-md hover:bg-red-600 hover:scale-110" title="Delete Event">
                  <FiTrash2 size={12} />
                </button>
                <div className="flex flex-col flex-1 pr-4 min-w-0">
                  <h4 className="font-bold text-sm text-black dark:text-gray-300 mb-1.5 leading-tight truncate">{event.title}</h4>
                  <div className="text-[10px] font-medium text-slate-500 dark:text-gray-400 truncate flex items-center gap-1.5 mt-1">
                    <FiMapPin size={12} className="shrink-0 text-slate-400 dark:text-gray-500" /> <span className="truncate">{event.location}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center border-l-2 border-dashed border-gray-400 dark:border-gray-600 pl-4 w-[75px] shrink-0">
                  <span className="text-[24px] font-black leading-none mb-0.5 text-black dark:text-gray-300">{new Date(event.start_date + 'T00:00:00').getDate()}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-1.5">{new Date(event.start_date + 'T00:00:00').toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-[8px] font-bold text-slate-500 dark:text-gray-400 uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{formatTime(event.start_time)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <MobileCalendarDaySheet date={selectedDay} events={selectedDayEvents} onClose={() => setSelectedDay(null)} />
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
