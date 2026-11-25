import React, { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import MobileCalendarDaySheet from '../../../components/ui/MobileCalendarDaySheet';
import CalendarHoverPopover from '../../../components/ui/CalendarHoverPopover';

const formatTime12h = (time24) => {
  if (!time24) return '';
  const [hourStr, minStr] = time24.split(':');
  let h = parseInt(hourStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minStr} ${ampm}`;
};

/**
 * A member's attendance month calendar: each check-in day shows its time-in,
 * hovering a day shows the details, and clicking a day opens them.
 * Used by the member profile and by the Attendance page.
 *
 * attendance: the member's check-ins ({ id, date, time_in, ... }).
 */
export default function MemberAttendanceCalendar({ attendance = [], memberFirstName = 'Member' }) {
  const attendanceCalendarRef = React.useRef(null);
  const [attendanceCalendarTitle, setAttendanceCalendarTitle] = useState('');
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(null);
  const [selectedAttendanceEntries, setSelectedAttendanceEntries] = useState([]);
  const [isCurrentMonth, setIsCurrentMonth] = useState(true);

  const handleDatesSet = (dateInfo) => {
    const today = new Date();
    const viewDate = dateInfo.view.currentStart;
    setIsCurrentMonth(viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear());
  };

  const attendanceEvents = attendance.map(log => ({
    id: log.id,
    title: `Time In: ${formatTime12h(log.time_in)}`,
    date: log.date,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    extendedProps: { logId: log.id, timeIn: formatTime12h(log.time_in) }
  }));

  const [hoveredAttendanceDay, setHoveredAttendanceDay] = useState(null);
  const attendanceHoverTimeoutRef = React.useRef(null);

  const handleAttendanceMouseMove = (e) => {
    if (selectedAttendanceDate) return;
    const dayCell = e.target.closest('.fc-daygrid-day');
    if (!dayCell) {
      if (attendanceHoverTimeoutRef.current) clearTimeout(attendanceHoverTimeoutRef.current);
      attendanceHoverTimeoutRef.current = setTimeout(() => setHoveredAttendanceDay(null), 120);
      return;
    }
    const dateStr = dayCell.getAttribute('data-date');
    if (!dateStr) return;
    if (hoveredAttendanceDay?.date === dateStr) return;

    const entries = attendance.filter(log => log.date === dateStr);
    if (!entries.length) {
      if (attendanceHoverTimeoutRef.current) clearTimeout(attendanceHoverTimeoutRef.current);
      setHoveredAttendanceDay(null);
      return;
    }

    if (attendanceHoverTimeoutRef.current) clearTimeout(attendanceHoverTimeoutRef.current);
    const rect = dayCell.getBoundingClientRect();
    attendanceHoverTimeoutRef.current = setTimeout(() => {
      setHoveredAttendanceDay({
        date: dateStr,
        events: entries.map(log => ({
          id: log.id,
          title: 'Gym Attendance Confirmed',
          color: '#0bb2cf',
          type: 'attendance',
          time: `Time in: ${formatTime12h(log.time_in)}`,
          detail: `${memberFirstName} checked in at ${formatTime12h(log.time_in)}`
        })),
        rect
      });
    }, 80);
  };

  const handleAttendanceMouseLeave = () => {
    if (attendanceHoverTimeoutRef.current) clearTimeout(attendanceHoverTimeoutRef.current);
    attendanceHoverTimeoutRef.current = setTimeout(() => setHoveredAttendanceDay(null), 150);
  };

  const showAttendanceDay = (date) => {
    if (!date) return;
    setHoveredAttendanceDay(null);
    setSelectedAttendanceDate(date);
    const entries = attendance.filter(log => log.date === date);
    if (!entries.length) {
      setSelectedAttendanceEntries([]);
      return;
    }
    setSelectedAttendanceEntries(entries.map(log => ({
      id: log.id,
      title: 'Gym Attendance Confirmed',
      color: '#0bb2cf',
      type: 'attendance',
      time: `Time in: ${formatTime12h(log.time_in)}`,
      detail: `${memberFirstName} checked in at ${formatTime12h(log.time_in)}`
    })));
  };

  return (
    <>
    <style>{`
      .fc { --fc-border-color: #e7e7e7; --fc-page-bg-color: transparent; --fc-today-bg-color: rgba(12, 193, 226, 0.08); color: #545454; }
      .dark .fc { --fc-border-color: #545454; --fc-today-bg-color: rgba(12, 193, 226, 0.1); color: #d5d5d5; }
      
      .fc-toolbar-title { font-size: 1.3rem !important; font-weight: 500 !important; letter-spacing: -0.02em; text-transform: none; color: var(--ui-ink) !important; }
      .dark .fc-toolbar-title { color: var(--ui-ink) !important; }
      
      /* TODAY BUTTON MATCHING EXACTLY TO "ADD MEMBER" BUTTON */
      .fc .fc-button.fc-button-primary.fc-today-button,
      .dark .fc .fc-button.fc-button-primary.fc-today-button,
      .fc .fc-button.fc-button-primary.fc-today-button:disabled,
      .dark .fc .fc-button.fc-button-primary.fc-today-button:disabled {
        background-color: #171717 !important;
        color: #ffffff !important; 
        border: 1px solid #0cc1e2 !important;
        border-radius: 0.5rem !important;
        min-height: 38px !important;
        font-weight: 700 !important;
        font-size: 15px !important;
        padding: 8px 14px !important;
        box-shadow: none !important;
        text-transform: none !important;
        letter-spacing: 0 !important;
        opacity: 1 !important;
        text-shadow: none !important;
        margin: 0 4px !important;
      }
      .fc .fc-button.fc-button-primary.fc-today-button:hover:not(:disabled),
      .dark .fc .fc-button.fc-button-primary.fc-today-button:hover:not(:disabled) {
        filter: none !important;
      }
      .calendar-current-month .fc .fc-button.fc-button-primary.fc-today-button { opacity: 1 !important; }
      .calendar-other-month .fc .fc-button.fc-button-primary.fc-today-button { background-color: #e7e7e7 !important; color: #545454 !important; opacity: 0.5 !important; }
      .dark .calendar-other-month .fc .fc-button.fc-button-primary.fc-today-button { background-color: #292929 !important; color: #a2a2a2 !important; }
      .dark .mobile-calendar-grid.calendar-other-month .fc .fc-button.fc-button-primary.fc-today-button { border-color: #0cc1e2 !important; color: #000000 !important; }
      .mobile-calendar-grid .fc .fc-button.fc-button-primary.fc-today-button, .mobile-calendar-grid .fc .fc-button.fc-button-primary.fc-today-button:hover:not(:disabled), .mobile-calendar-grid .fc .fc-button.fc-button-primary.fc-today-button:disabled { background-image: linear-gradient(to right, #66e1f7, #0cc1e2) !important; border-color: #0cc1e2 !important; color: #000000 !important; }
      .mobile-calendar-grid.calendar-current-month .fc .fc-button.fc-button-primary.fc-today-button { opacity: 1 !important; }
      .mobile-calendar-grid.calendar-other-month .fc .fc-button.fc-button-primary.fc-today-button, .mobile-calendar-grid.calendar-other-month .fc .fc-button.fc-button-primary.fc-today-button:hover:not(:disabled) { background-image: linear-gradient(to right, #66e1f7, #0cc1e2) !important; border-color: #0cc1e2 !important; color: #000000 !important; opacity: 0.5 !important; }
      .mobile-calendar-grid .fc .fc-button.fc-button-primary.fc-today-button { font-family: ui-sans-serif, system-ui, sans-serif !important; font-size: 15px !important; font-weight: 700 !important; text-transform: none !important; }
      @media (min-width: 640px) {
        .mobile-calendar-grid .fc .fc-button.fc-button-primary.fc-today-button { min-height: 38px !important; padding: 8px 14px !important; margin: 0 4px !important; }
      }
      
      .fc .fc-button-primary { background-color: #f4f4f4 !important; border: 1px solid #e7e7e7 !important; color: #000000 !important; font-weight: 700 !important; border-radius: 8px !important; padding: 6px 16px !important; transition: all 0.2s !important; margin: 0 4px !important; }
      .dark .fc .fc-button-primary { background-color: #292929 !important; border-color: #404040 !important; color: #d5d5d5 !important; }
      .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button, .mobile-calendar-grid .fc .fc-button-primary.fc-next-button { background-color: #e7e7e7 !important; border: 2px solid #D5D5D5 !important; border-radius: 0.5rem !important; color: #000000 !important; padding: .4em .65em !important; }
      .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button:hover:not(:disabled), .mobile-calendar-grid .fc .fc-button-primary.fc-next-button:hover:not(:disabled), .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button:active:not(:disabled), .mobile-calendar-grid .fc .fc-button-primary.fc-next-button:active:not(:disabled) { background-color: #e7e7e7 !important; border-color: #D5D5D5 !important; color: #000000 !important; }
      .dark .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button, .dark .mobile-calendar-grid .fc .fc-button-primary.fc-next-button { background-color: #545454 !important; border-color: #545454 !important; color: #d5d5d5 !important; }
      .dark .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button:hover:not(:disabled), .dark .mobile-calendar-grid .fc .fc-button-primary.fc-next-button:hover:not(:disabled), .dark .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button:active:not(:disabled), .dark .mobile-calendar-grid .fc .fc-button-primary.fc-next-button:active:not(:disabled) { background-color: #545454 !important; border-color: #545454 !important; color: #d5d5d5 !important; }
      .attendance-calendar-nav-button { border: 2px solid #D5D5D5 !important; }
      .attendance-calendar-nav-button:hover, .attendance-calendar-nav-button:active { border-color: #D5D5D5 !important; background-color: #e7e7e7 !important; color: #000000 !important; }
      .dark .attendance-calendar-nav-button { background-color: #545454 !important; border-color: #545454 !important; color: #d5d5d5 !important; }
      .dark .attendance-calendar-nav-button:hover, .dark .attendance-calendar-nav-button:active { border-color: #545454 !important; background-color: #545454 !important; color: #d5d5d5 !important; }
      .attendance-calendar-nav-demo .attendance-calendar-nav-button,
      .attendance-calendar-nav-demo .fc .fc-button-primary.fc-prev-button,
      .attendance-calendar-nav-demo .fc .fc-button-primary.fc-next-button {
        border: 2px solid #D5D5D5 !important;
        border-radius: 0.5rem !important;
        background-color: #fafafa !important;
        color: #404040 !important;
        box-shadow: 0 1px 2px rgba(23, 23, 23, 0.12) !important;
        transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease !important;
      }
      .attendance-calendar-nav-demo .fc .fc-button-primary.fc-prev-button,
      .attendance-calendar-nav-demo .fc .fc-button-primary.fc-next-button {
        width: 38px !important;
        height: 38px !important;
        padding: 0 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        line-height: 1 !important;
      }
      .attendance-calendar-nav-demo .fc .fc-button-primary.fc-prev-button .fc-icon,
      .attendance-calendar-nav-demo .fc .fc-button-primary.fc-next-button .fc-icon {
        margin: 0 !important;
        vertical-align: middle !important;
      }
      .attendance-calendar-nav-demo .attendance-calendar-nav-button:hover,
      .attendance-calendar-nav-demo .attendance-calendar-nav-button:active,
      .attendance-calendar-nav-demo .fc .fc-button-primary.fc-prev-button:hover:not(:disabled),
      .attendance-calendar-nav-demo .fc .fc-button-primary.fc-next-button:hover:not(:disabled),
      .attendance-calendar-nav-demo .fc .fc-button-primary.fc-prev-button:active:not(:disabled),
      .attendance-calendar-nav-demo .fc .fc-button-primary.fc-next-button:active:not(:disabled) {
        border-color: #0a9eb8 !important;
        background-color: #dbf8fd !important;
        color: #066171 !important;
        box-shadow: 0 2px 5px rgba(10, 158, 184, 0.2) !important;
      }
      .dark .attendance-calendar-nav-demo .attendance-calendar-nav-button,
      .dark .attendance-calendar-nav-demo .fc .fc-button-primary.fc-prev-button,
      .dark .attendance-calendar-nav-demo .fc .fc-button-primary.fc-next-button {
        border-color: #545454 !important;
        background-color: #363636 !important;
        color: #e7e7e7 !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
      }
      .dark .attendance-calendar-nav-demo .attendance-calendar-nav-button:hover,
      .dark .attendance-calendar-nav-demo .attendance-calendar-nav-button:active,
      .dark .attendance-calendar-nav-demo .fc .fc-button-primary.fc-prev-button:hover:not(:disabled),
      .dark .attendance-calendar-nav-demo .fc .fc-button-primary.fc-next-button:hover:not(:disabled),
      .dark .attendance-calendar-nav-demo .fc .fc-button-primary.fc-prev-button:active:not(:disabled),
      .dark .attendance-calendar-nav-demo .fc .fc-button-primary.fc-next-button:active:not(:disabled) {
        border-color: #0cc1e2 !important;
        background-color: #444444 !important;
        color: #41daf5 !important;
        box-shadow: 0 2px 6px rgba(12, 193, 226, 0.18) !important;
      }
      
      .fc-scrollgrid { border: none !important; }
      .fc-theme-standard th, .fc-theme-standard td { border: none !important; border-bottom: 1px solid var(--fc-border-color) !important; }
      .fc-theme-standard td { border-right: 1px solid var(--fc-border-color) !important; }
      .fc-theme-standard td:last-child { border-right: none !important; }
      .fc-col-header-cell-cushion { font-weight: 700 !important; font-size: .73rem !important; letter-spacing: .06em !important; color: #737373 !important; text-transform: uppercase; text-decoration: none !important; }
      .dark .fc-col-header-cell-cushion { color: #b2b2b2 !important; }
      .fc-daygrid-day-number { font-weight: 800; font-size: 0.8rem; padding: 8px !important; text-decoration: none !important; color: #545454 !important; }
      .dark .fc-daygrid-day-number { color: #d4d4d4 !important; }
      
      .fc-daygrid-event { 
          border-radius: 4px !important; padding: 2px !important; margin: 1px !important; 
          border: none !important; background-color: transparent !important;
          cursor: pointer; transition: all 0.2s;
      }
      .fc-daygrid-event:hover { transform: scale(1.02); z-index: 5; background-color: rgba(0,0,0,0.05) !important; }
      .dark .fc-daygrid-event:hover { background-color: rgba(255,255,255,0.1) !important; }
      
      .fc-event-main { 
        width: 100%; 
        white-space: nowrap !important; 
        overflow: hidden !important;   
        text-overflow: ellipsis !important;
      }
      /* Hide the calendar scrollbar */
      .fc-scroller { overflow: hidden !important; }
    `}</style>
    <div className="mb-3 sm:hidden">
      <div className="flex items-center justify-between gap-2">
        <h3 className="min-w-0 flex-1 truncate text-left text-sm font-medium text-ink">
          {attendanceCalendarTitle}
        </h3>
        <div className="flex items-center gap-0 shrink-0">
          <button
            onClick={() => attendanceCalendarRef.current?.getApi().prev()}
            aria-label="Previous month"
            className="attendance-calendar-nav-button mx-1 flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-hover text-ink shadow-sm transition-colors active:scale-95"
          >
            <FiChevronLeft size={16} />
          </button>
          <button
            onClick={() => attendanceCalendarRef.current?.getApi().next()}
            aria-label="Next month"
            className="attendance-calendar-nav-button mx-1 flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-hover text-ink shadow-sm transition-colors active:scale-95"
          >
            <FiChevronRight size={16} />
          </button>
          <button
            onClick={() => attendanceCalendarRef.current?.getApi().today()}
            aria-label="Today"
            className={`mx-1 flex min-h-[38px] shrink-0 items-center justify-center rounded-lg border-0 bg-brand-gold hover:bg-brand-gold-500 px-3.5 py-2 text-[15px] font-sans font-medium normal-case text-brand-dark shadow-sm transition-colors active:scale-95 ${isCurrentMonth ? 'opacity-100' : 'opacity-50'}`}
          >
            Today
          </button>
        </div>
      </div>
    </div>
    <div
      onMouseMove={handleAttendanceMouseMove}
      onMouseLeave={handleAttendanceMouseLeave}
      className={`mobile-calendar-grid attendance-calendar-nav-demo min-w-0 ${isCurrentMonth ? 'calendar-current-month' : 'calendar-other-month'}`}
    >
      <FullCalendar
        ref={attendanceCalendarRef}
        plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        buttonText={{ today: 'Today' }}
        events={attendanceEvents}
        height="auto"
        datesSet={(dateInfo) => {
          setAttendanceCalendarTitle(dateInfo.view.title);
          handleDatesSet(dateInfo);
        }}
        dayHeaderContent={(headerInfo) => window.innerWidth < 640 ? headerInfo.text.charAt(0) : headerInfo.text}
        headerToolbar={{ left: 'prev,next', center: 'title', right: 'today' }}
        dateClick={info => showAttendanceDay(info.dateStr)}
        eventClick={info => showAttendanceDay(info.event.startStr.slice(0, 10))}
        eventContent={(eventInfo) => (
          <div className="flex min-h-6 w-full items-center justify-center gap-1 overflow-hidden rounded-md border border-positive/40 bg-positive-soft px-1 py-0.5 text-positive shadow-xs dark:border-positive/40 dark:bg-positive-soft dark:text-positive sm:justify-start">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-positive dark:bg-positive" />
            <span className="truncate text-[10px] font-medium">
              <span className="hidden sm:inline">Time In: </span>
              {eventInfo.event.extendedProps.timeIn}
            </span>
          </div>
        )}
      />
    </div>
    <MobileCalendarDaySheet
      date={selectedAttendanceDate}
      events={selectedAttendanceEntries}
      onClose={() => setSelectedAttendanceDate(null)}
      emptyMessage="No attendance logs recorded for this day."
    />
    <CalendarHoverPopover
      data={selectedAttendanceDate ? null : hoveredAttendanceDay}
      onClose={() => setHoveredAttendanceDay(null)}
      onClick={(date) => {
        setHoveredAttendanceDay(null);
        showAttendanceDay(date);
      }}
      onMouseEnter={() => {
        if (attendanceHoverTimeoutRef.current) clearTimeout(attendanceHoverTimeoutRef.current);
      }}
      onMouseLeave={handleAttendanceMouseLeave}
    />
    </>
  );
}
