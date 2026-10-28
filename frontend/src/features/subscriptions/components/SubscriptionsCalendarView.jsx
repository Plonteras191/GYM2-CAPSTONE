import React from 'react';
import { FiFilter, FiPlus, FiTrash2, FiMapPin, FiEdit2, FiEye, FiCalendar, FiMoreVertical, FiLoader } from 'react-icons/fi';
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
import { getCalendarEventTextColor } from '../../../utils/calendarContrast';

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
  calendarOnly = false
}) {
  const calendarRef = React.useRef(null);
  const [calendarTitle, setCalendarTitle] = React.useState('');
  const [calendarView, setCalendarView] = React.useState('dayGridMonth');
  const [isCalendarCurrentMonth, setIsCalendarCurrentMonth] = React.useState(true);
  const [selectedDay, setSelectedDay] = React.useState(null);
  const [selectedDayEvents, setSelectedDayEvents] = React.useState([]);
  const [openActionsEventId, setOpenActionsEventId] = React.useState(null);
  const todayStr = new Date().toISOString().split('T')[0];
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
      const endDate = new Date(event.end_date || event.start_date);
      endDate.setDate(endDate.getDate() + 1);
      const color = event.category?.color || event.color || '#3b82f6';
      if (!categoryIsVisible(event.category?.name || 'General', selectedCoachCategories)) return;
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
    return start && start <= date && (!event.end || date < event.end);
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
    onDateClick(info);
  };

  return (
    <div className={`grid w-full min-w-0 grid-cols-1 items-start gap-4 animate-in fade-in duration-300 lg:gap-5 ${calendarOnly ? '' : 'xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_340px]'}`}>
      <div 
        onMouseMove={handleCalendarMouseMove}
        onMouseLeave={handleCalendarMouseLeave}
        className={`mobile-calendar-grid calendar-nav-style relative flex h-auto sm:min-h-[clamp(28rem,75svh,46rem)] min-w-0 flex-col xl:col-start-1 xl:row-start-1 ${calendarOnly ? '' : 'rounded-2xl border-2 border-gray-300 bg-white p-3 shadow-sm dark:border-gray-600 dark:bg-[#252830] sm:p-5'} ${isCalendarCurrentMonth ? 'calendar-current-month' : 'calendar-other-month'}`}
      >
        <style>{`
          .fc { --fc-border-color: #e7eaf0; --fc-page-bg-color: transparent; --fc-list-event-hover-bg-color: rgba(0,0,0,0.05); --fc-today-bg-color: rgba(245,158,11,.08); color: #4b5563; }
          .dark .fc { --fc-border-color: #3c4352; --fc-neutral-text-color: #cbd5e1; --fc-today-bg-color: rgba(245, 158, 11, 0.09); color: #d1d5db; }
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
          .mobile-calendar-grid .calendar-nav-button { background-color: #e5e7eb !important; border: 2px solid #D1D5DB !important; color: #000 !important; }
          .mobile-calendar-grid .calendar-nav-button:hover, .mobile-calendar-grid .calendar-nav-button:active { background-color: #e5e7eb !important; border-color: #D1D5DB !important; color: #000 !important; }
          .dark .mobile-calendar-grid .calendar-nav-button { background-color: #4b5563 !important; border-color: #4b5563 !important; color: #d1d5db !important; }
          .dark .mobile-calendar-grid .calendar-nav-button:hover, .dark .mobile-calendar-grid .calendar-nav-button:active { background-color: #4b5563 !important; border-color: #4b5563 !important; color: #d1d5db !important; }
          .fc-toolbar-title { font-size: 1.15rem !important; font-weight: 800 !important; letter-spacing: .045em !important; text-transform: uppercase !important; color: #111827; }
          .dark .fc-toolbar-title { color: #d1d5db !important; }
          .fc-scrollgrid { border: none !important; }
          .fc-theme-standard th, .fc-theme-standard td { border-color: var(--fc-border-color) !important; }
          .fc-theme-standard td { border-right: 1px solid var(--fc-border-color) !important; }
          .fc-theme-standard td:last-child { border-right: none !important; }
          .fc .fc-col-header { border-bottom: 1px solid var(--fc-border-color); }
          .fc-col-header-cell-cushion { font-weight: 700 !important; font-size: .73rem !important; letter-spacing: .06em !important; color: #64748b !important; text-transform: uppercase; text-decoration: none !important; }
          .dark .fc-col-header-cell-cushion { color: #aab3c2 !important; }
          .fc .fc-daygrid-day { transition: background-color .16s ease; }
          .fc .fc-daygrid-day:hover { background: rgba(148,163,184,.08); }
          .dark .fc .fc-daygrid-day:hover { background: rgba(148,163,184,.07); }
          .fc .fc-day-today { background: rgba(245,158,11,.08) !important; }
          .fc-daygrid-day-number { font-weight: 700; font-size: .76rem; padding: 7px !important; color: #64748b !important; text-decoration: none !important; }
          .dark .fc-daygrid-day-number { color: #d1d5db !important; }
          .fc .fc-day-other .fc-daygrid-day-number { color: #a1aab8 !important; opacity: .62; }
          .fc-daygrid-event { border-radius: 7px !important; padding: 2px 5px !important; margin: 2px 3px !important; border: 1px solid rgba(255,255,255,.25) !important; box-shadow: 0 1px 2px rgba(15,23,42,.14) !important; transition: transform .16s ease, box-shadow .16s ease; }
          .fc-daygrid-event:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(15,23,42,.2) !important; }
          .fc-event-main { color: var(--event-preview-text-color, #111827) !important; font-weight: 500 !important; font-size: .72rem !important; line-height: 1.25 !important; text-shadow: none !important; }
          .fc-daygrid-more-link { color: #b45309 !important; font-weight: 700 !important; font-size: .72rem !important; }
          .dark .fc-daygrid-more-link { color: #fbbf24 !important; }
          .fc-popover { border: 1px solid var(--fc-border-color) !important; border-radius: 12px !important; background: #fff !important; box-shadow: 0 10px 25px -5px rgba(0,0,0,.15) !important; overflow: hidden; }
          .dark .fc-popover { background: #1e293b !important; border-color: #334155 !important; }
          .fc-popover-header { background: #f8fafc !important; padding: 12px !important; border-bottom: 1px solid var(--fc-border-color) !important; }
          .dark .fc-popover-header { background: #0f172a !important; border-color: #334155 !important; }
          .fc-popover-title { font-weight: 600 !important; font-size: .9rem !important; color: #000 !important; }
          .dark .fc-popover-title { color: #d1d5db !important; }
          .fc-popover-body { padding: 12px !important; }
          .mobile-calendar-grid { --calendar-control-bg: #f8fafc; --calendar-control-border: #dbe2ea; --calendar-control-text: #334155; --calendar-control-hover: #eef2f7; }
          .dark .mobile-calendar-grid { --calendar-control-bg: #303643; --calendar-control-border: #454e5e; --calendar-control-text: #e2e8f0; --calendar-control-hover: #3c4554; }
          .mobile-calendar-grid .fc .fc-button-primary { background-color: var(--calendar-control-bg) !important; border-color: var(--calendar-control-border) !important; color: var(--calendar-control-text) !important; box-shadow: 0 1px 2px rgba(15,23,42,.08) !important; }
          .mobile-calendar-grid .fc .fc-button-primary:hover:not(:disabled) { background-color: var(--calendar-control-hover) !important; border-color: var(--calendar-control-border) !important; color: var(--calendar-control-text) !important; }
          .mobile-calendar-grid .fc .fc-button-primary:not(:disabled).fc-button-active, .mobile-calendar-grid .fc .fc-button-primary:not(:disabled):active { background-image: linear-gradient(to right, #facc15, #f59e0b) !important; background-color: #f59e0b !important; border-color: #f59e0b !important; color: #111827 !important; }
          .mobile-calendar-grid .fc .fc-button-primary.fc-today-button { background-image: linear-gradient(to right, #facc15, #f59e0b) !important; background-color: #f59e0b !important; border-color: #f59e0b !important; color: #111827 !important; }
          .mobile-calendar-grid .fc .fc-button-primary.fc-today-button:hover:not(:disabled) { background-image: linear-gradient(to right, #facc15, #f59e0b) !important; background-color: #f59e0b !important; border-color: #f59e0b !important; color: #111827 !important; }
          .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button, .mobile-calendar-grid .fc .fc-button-primary.fc-next-button { background-color: var(--calendar-control-bg) !important; border-color: var(--calendar-control-border) !important; color: var(--calendar-control-text) !important; }
          .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button:hover:not(:disabled), .mobile-calendar-grid .fc .fc-button-primary.fc-next-button:hover:not(:disabled) { background-color: var(--calendar-control-hover) !important; border-color: var(--calendar-control-border) !important; color: var(--calendar-control-text) !important; }
          .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button, .mobile-calendar-grid .fc .fc-button-primary.fc-next-button { border: 2px solid #D1D5DB !important; }
          .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button:hover:not(:disabled), .mobile-calendar-grid .fc .fc-button-primary.fc-next-button:hover:not(:disabled) { border-color: #D1D5DB !important; }
          .dark .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button, .dark .mobile-calendar-grid .fc .fc-button-primary.fc-next-button { border-color: #4b5563 !important; }
          .dark .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button:hover:not(:disabled), .dark .mobile-calendar-grid .fc .fc-button-primary.fc-next-button:hover:not(:disabled) { border-color: #4b5563 !important; }
          .mobile-calendar-grid .fc .fc-button-primary.fc-dayGridMonth-button, .mobile-calendar-grid .fc .fc-button-primary.fc-listWeek-button { background-image: none !important; background-color: var(--calendar-control-bg) !important; border-color: var(--calendar-control-border) !important; color: var(--calendar-control-text) !important; }
          .mobile-calendar-grid .fc .fc-button-primary.fc-dayGridMonth-button:not(:disabled).fc-button-active, .mobile-calendar-grid .fc .fc-button-primary.fc-listWeek-button:not(:disabled).fc-button-active { background-image: linear-gradient(to right, #facc15, #f59e0b) !important; background-color: #f59e0b !important; border-color: #f59e0b !important; color: #111827 !important; opacity: 1 !important; }
          @media (min-width: 640px) {
            .mobile-calendar-grid .fc .fc-button-group > .fc-button-primary.fc-dayGridMonth-button {
              position: relative !important;
              z-index: 1 !important;
              border: 2px solid #D1D5DB !important;
            }
            .dark .mobile-calendar-grid .fc .fc-button-group > .fc-button-primary.fc-dayGridMonth-button {
              border-color: #4b5563 !important;
            }
            .mobile-calendar-grid .fc .fc-button-group > .fc-button-primary.fc-listWeek-button {
              position: relative !important;
              z-index: 1 !important;
              border: 2px solid #D1D5DB !important;
            }
            .dark .mobile-calendar-grid .fc .fc-button-group > .fc-button-primary.fc-listWeek-button {
              border-color: #4b5563 !important;
            }
          }
          .calendar-nav-style .calendar-nav-button,
          .calendar-nav-style .fc .fc-button-primary.fc-prev-button,
          .calendar-nav-style .fc .fc-button-primary.fc-next-button {
            border: 2px solid #D1D5DB !important;
            border-radius: 0.5rem !important;
            background-color: #f8fafc !important;
            color: #334155 !important;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12) !important;
            transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease !important;
          }
          .calendar-nav-style .fc .fc-button-primary.fc-prev-button,
          .calendar-nav-style .fc .fc-button-primary.fc-next-button {
            width: 38px !important;
            height: 38px !important;
            padding: 0 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            line-height: 1 !important;
          }
          .calendar-nav-style .fc .fc-button-primary.fc-prev-button .fc-icon,
          .calendar-nav-style .fc .fc-button-primary.fc-next-button .fc-icon {
            margin: 0 !important;
            vertical-align: middle !important;
          }
          .calendar-nav-style .calendar-nav-button:hover,
          .calendar-nav-style .calendar-nav-button:active,
          .calendar-nav-style .fc .fc-button-primary.fc-prev-button:hover:not(:disabled),
          .calendar-nav-style .fc .fc-button-primary.fc-next-button:hover:not(:disabled),
          .calendar-nav-style .fc .fc-button-primary.fc-prev-button:active:not(:disabled),
          .calendar-nav-style .fc .fc-button-primary.fc-next-button:active:not(:disabled) {
            border-color: #d97706 !important;
            background-color: #fef3c7 !important;
            color: #92400e !important;
            box-shadow: 0 2px 5px rgba(217, 119, 6, 0.2) !important;
          }
          .dark .calendar-nav-style .calendar-nav-button,
          .dark .calendar-nav-style .fc .fc-button-primary.fc-prev-button,
          .dark .calendar-nav-style .fc .fc-button-primary.fc-next-button {
            border-color: #4b5563 !important;
            background-color: #303643 !important;
            color: #e2e8f0 !important;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
          }
          .dark .calendar-nav-style .calendar-nav-button:hover,
          .dark .calendar-nav-style .calendar-nav-button:active,
          .dark .calendar-nav-style .fc .fc-button-primary.fc-prev-button:hover:not(:disabled),
          .dark .calendar-nav-style .fc .fc-button-primary.fc-next-button:hover:not(:disabled),
          .dark .calendar-nav-style .fc .fc-button-primary.fc-prev-button:active:not(:disabled),
          .dark .calendar-nav-style .fc .fc-button-primary.fc-next-button:active:not(:disabled) {
            border-color: #f59e0b !important;
            background-color: #3c4554 !important;
            color: #fbbf24 !important;
            box-shadow: 0 2px 6px rgba(245, 158, 11, 0.18) !important;
          }
        `}</style>

        <MobileCalendarToolbar
          title={calendarTitle}
          onPrevious={() => calendarRef.current?.getApi().prev()}
          onNext={() => calendarRef.current?.getApi().next()}
          actionLabel={calendarOnly ? undefined : 'Add Event'}
          actionIcon={calendarOnly ? undefined : <FiPlus size={20} />}
          onAction={calendarOnly ? undefined : onOpenEventModal}
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
            const backgroundColor = getComputedStyle(info.el).backgroundColor;
            info.el.style.setProperty('--event-preview-text-color', getCalendarEventTextColor(backgroundColor));
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

      {!calendarOnly && <div className="grid min-w-0 grid-cols-1 items-start gap-4 md:grid-cols-2 lg:gap-5 xl:col-start-2 xl:row-start-1 xl:grid-cols-1 xl:content-start">
        <div className="hidden w-full min-w-0 rounded-2xl border-2 border-gray-300 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-[#252830] xl:col-span-1 xl:flex xl:flex-col">
          <div className="mb-3 border-b-2 border-gray-300 pb-1 dark:border-gray-600">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-gray-300">
              <FiFilter size={18} className="shrink-0 text-slate-800 dark:text-gray-300" /> View Filters
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-1">
            <CalendarCategoryFilters
              title="Client Subscriptions"
              categories={subscriptionCategoryOptions}
              selectedCategories={selectedSubscriptionCategories}
              onChange={setSelectedSubscriptionCategories}
              enabled={showSubscriptions}
              onEnabledChange={setShowSubscriptions}
            />
            <CalendarCategoryFilters
              title="Coach Events & Sessions"
              categories={coachCategoryOptions}
              selectedCategories={selectedCoachCategories}
              onChange={setSelectedCoachCategories}
              enabled={showCoachEvents}
              onEnabledChange={setShowCoachEvents}
            />
          </div>
        </div>

        <div className="flex max-h-[36rem] min-h-[18rem] min-w-0 flex-col overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm dark:border-[#454e5e] dark:bg-[#252833]">
          <div className="mb-3 flex flex-shrink-0 items-center justify-between gap-2 border-b-2 border-gray-300 pb-1 dark:border-gray-600">
            <h3 className="flex min-w-0 items-center gap-2 text-lg font-bold text-slate-800 dark:text-gray-300">
              <FiCalendar size={18} className="shrink-0 text-slate-800 dark:text-gray-300" />
              <span className="truncate">Coach Events</span>
            </h3>
            <button onClick={onOpenEventModal} aria-label="Add Event" title="Add Event" className="flex min-h-[36px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-3 py-2 text-xs font-bold text-slate-950 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed">
              <FiPlus size={16} strokeWidth={3} /> <span className="sr-only sm:not-sr-only">Add Event</span>
            </button>
          </div>
          <div
            aria-label="Upcoming coach events"
            tabIndex={0}
            className="coach-event-list-scroll min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain space-y-2.5 pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500/60"
          >
            {upcomingCoachEvents.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-3 py-8 text-center text-xs text-slate-500 dark:bg-white/[.03] dark:text-slate-400">No scheduled events.</p>
            ) : upcomingCoachEvents.map(event => {
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
              const eventColor = event.category?.color || event.color || '#eab308';

              return (
                <div key={event.id} className="relative flex min-w-0 items-center gap-2 rounded-xl border-2 border-gray-300 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-600 dark:bg-[#1b1e26]" style={{ borderLeft: `4px solid ${eventColor}` }}>
                  <button onClick={() => openDayDetails(event.start_date, [eventDetails])} className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                    <span className="truncate text-sm font-semibold leading-tight text-slate-900 dark:text-gray-100">{event.title}</span>
                      <span className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-600 dark:text-gray-300">{event.category?.name || 'Coach Event'}</span>
                      {event.location && <span className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] font-medium text-slate-600 dark:text-gray-300">
                        <FiMapPin size={12} className="shrink-0 text-slate-500 dark:text-gray-300" />
                      <span className="truncate">{event.location}</span>
                    </span>}
                  </button>
                  <div className="flex w-[48px] shrink-0 flex-col items-center justify-center border-l border-slate-200 pl-2 dark:border-[#3c4352]">
                    <span className="text-xl font-black leading-none text-slate-900 dark:text-gray-300">{new Date(event.start_date + 'T00:00:00').getDate()}</span>
                    <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">{new Date(event.start_date + 'T00:00:00').toLocaleString('default', { month: 'short' })}</span>
                    <span className="mt-1.5 rounded-md bg-slate-100 px-1.5 py-1 text-[8px] font-bold text-slate-600 dark:bg-slate-800 dark:text-gray-400">{formatTime(event.start_time)}</span>
                  </div>
                  <div className="relative shrink-0 border-l border-slate-100 pl-2 dark:border-[#2d3240]">
                    <button
                      type="button"
                      onClick={() => setOpenActionsEventId(openActionsEventId === event.id ? null : event.id)}
                      title="Event actions"
                      aria-label={`${openActionsEventId === event.id ? 'Close' : 'Open'} actions for ${event.title}`}
                      aria-expanded={openActionsEventId === event.id}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-slate-700 shadow-sm transition-colors hover:border-amber-500 hover:bg-amber-50 dark:border-[#393e4f] dark:bg-[#191b22] dark:text-gray-200 dark:hover:bg-amber-500/10"
                    >
                      <FiMoreVertical size={18} />
                    </button>
                    {openActionsEventId === event.id && (
                      <div className="absolute right-0 top-full z-20 mt-1 flex items-center gap-1 rounded-xl border-2 border-gray-300 bg-white p-1.5 shadow-xl dark:border-gray-600 dark:bg-[#191b22]">
                        <button
                          type="button"
                          onClick={() => {
                            openDayDetails(event.start_date, [eventDetails]);
                            setOpenActionsEventId(null);
                          }}
                          title="View event"
                          aria-label={`View ${event.title}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onEditCoachEvent(event);
                            setOpenActionsEventId(null);
                          }}
                          title="Edit event"
                          aria-label={`Edit ${event.title}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteCoachEvent(event.id);
                            setOpenActionsEventId(null);
                          }}
                          disabled={deletingEventId === event.id}
                          title="Delete event"
                          aria-label={`Delete ${event.title}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-red-700 hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-500/10"
                        >
                          {deletingEventId === event.id ? <FiLoader size={16} className="animate-spin" /> : <FiTrash2 size={16} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>}
      <MobileCalendarDaySheet
        date={selectedDay}
        events={selectedDayEvents}
        onClose={() => setSelectedDay(null)}
        onEditCoachEvent={event => {
          const coachEvent = coachEvents.find(item => String(item.id) === String(event.id));
          if (coachEvent) {
            setSelectedDay(null);
            onEditCoachEvent(coachEvent);
          }
        }}
        onDeleteCoachEvent={onDeleteCoachEvent}
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
