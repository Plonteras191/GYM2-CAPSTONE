import React from 'react';
import { FiFilter, FiPlus, FiTrash2, FiMapPin } from 'react-icons/fi';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

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
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedH = h % 12 || 12;
    return `${formattedH}:${minutes} ${ampm}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];
  let allCalendarEvents = [];

  const activeSubsMap = new Map();
  subscriptions.forEach(sub => {
    if (sub.status === 'Active' && sub.member) {
      const existing = activeSubsMap.get(sub.member_id);
      if (!existing || new Date(sub.end_date) > new Date(existing.end_date)) {
        activeSubsMap.set(sub.member_id, sub);
      }
    }
  });
  const uniqueLatestActiveSubs = Array.from(activeSubsMap.values());

  if (showSubscriptions) {
    uniqueLatestActiveSubs.forEach(sub => {
      const planName = (sub.plan_type || '').toLowerCase();
      if (planName.includes('walk') || planName.includes('daily') || planName === 'none') return;
      const firstName = sub.member.first_name;
      allCalendarEvents.push({ 
        id: `start-${sub.id}`, 
        title: `Start of ${firstName}'s ${sub.plan_type}`, 
        date: sub.start_date, 
        backgroundColor: sub.color || '#f59e0b', 
        borderColor: sub.color || '#f59e0b', 
        allDay: true, 
        extendedProps: { type: 'sub', ...sub } 
      });
      if (sub.end_date && sub.end_date !== sub.start_date) {
        allCalendarEvents.push({ 
          id: `end-${sub.id}`, 
          title: `End of ${firstName}'s ${sub.plan_type}`, 
          date: sub.end_date, 
          backgroundColor: sub.color || '#f59e0b', 
          borderColor: sub.color || '#f59e0b', 
          allDay: true, 
          extendedProps: { type: 'sub', ...sub } 
        });
      }
    });
  }

  if (showCoachEvents) {
    coachEvents.forEach(ev => {
      let endObj = new Date(ev.end_date || ev.start_date);
      endObj.setDate(endObj.getDate() + 1); 
      let exclusiveEndDate = endObj.toISOString().split('T')[0];
      allCalendarEvents.push({ 
        id: `coach-${ev.id}`, 
        title: ev.title, 
        start: ev.start_date, 
        end: ev.start_date !== ev.end_date ? exclusiveEndDate : undefined, 
        date: ev.start_date === ev.end_date ? ev.start_date : undefined, 
        allDay: true, 
        backgroundColor: ev.color || '#3b82f6', 
        borderColor: ev.color || '#3b82f6', 
        extendedProps: { type: 'coach', ...ev } 
      });
    });
  }

  const activeSubsLegend = uniqueLatestActiveSubs.filter(s => {
    const planName = (s.plan_type || '').toLowerCase();
    if (planName.includes('walk') || planName.includes('daily') || planName === 'none') return false;
    return true;
  }).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const sortedCoachEvents = [...coachEvents].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start animate-in fade-in duration-300">
      <div className="flex-1 w-full bg-white dark:bg-[#252830] p-6 rounded-2xl border-2 border-gray-300 dark:border-gray-600 shadow-sm relative">
        <style>{`
          .fc { --fc-border-color: #e2e8f0; --fc-page-bg-color: transparent; --fc-list-event-hover-bg-color: rgba(0,0,0,0.05); color: #4b5563; }
          .dark .fc { --fc-border-color: #4b5563; --fc-neutral-text-color: #d1d5db; --fc-today-bg-color: rgba(245, 158, 11, 0.1); color: #d1d5db; }
          
          .fc .fc-button-primary { background-color: #f1f5f9 !important; border: 1px solid #e2e8f0 !important; color: #000000 !important; text-transform: capitalize !important; font-weight: 700 !important; border-radius: 8px !important; padding: 6px 16px !important; box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important; transition: all 0.2s ease; margin: 0 4px !important; }
          .dark .fc .fc-button-primary { background-color: #1e293b !important; border-color: #374151 !important; color: #d1d5db !important; }
          .fc .fc-button-primary:hover { background-color: #e2e8f0 !important; color: #000000 !important; }
          .dark .fc .fc-button-primary:hover { background-color: #334155 !important; color: #ffffff !important; }
          .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active { background: linear-gradient(to right, #fbbf24, #f59e0b) !important; border: none !important; color: #000 !important; font-weight: 800 !important; box-shadow: 0 4px 10px -2px rgba(245, 158, 11, 0.3) !important; }
          
          .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 800 !important; text-transform: uppercase; color: #000000; }
          .dark .fc-toolbar-title { color: #d1d5db !important; }
          .fc-scrollgrid { border: none !important; }
          .dark .fc-scrollgrid { border-color: #334155 !important; }
          .fc-theme-standard th { border: none !important; border-bottom: 1px solid var(--fc-border-color) !important; padding: 12px 0 !important; }
          .dark .fc-theme-standard th { border-color: #334155 !important; }
          .fc-theme-standard td { border: none !important; border-bottom: 1px solid var(--fc-border-color) !important; border-right: 1px solid var(--fc-border-color) !important; }
          .dark .fc-theme-standard td { border-color: #334155 !important; }
          .fc-theme-standard td:last-child { border-right: none !important; }
          
          .fc-col-header-cell-cushion { font-weight: 700 !important; font-size: 0.8rem !important; color: #0f172a !important; text-decoration: none !important; padding: 4px 0 !important;}
          .dark .fc-col-header-cell-cushion { color: #f8fafc !important; }
          .fc-daygrid-day-number { font-weight: 600; font-size: 0.8rem; padding: 8px !important; color: #475569 !important; text-decoration: none !important; }
          .dark .fc-daygrid-day-number { color: #cbd5e1 !important; }

          .fc-daygrid-event {
              border-radius: 6px !important; padding: 2px 4px !important; margin: 2px !important; border: 1px solid rgba(255,255,255,0.2) !important; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.15) !important; transition: transform 0.1s ease, box-shadow 0.1s ease;
          }
          .fc-daygrid-event:hover { transform: translateY(-1px) scale(1.02); box-shadow: 0 4px 8px rgba(0,0,0,0.25) !important; z-index: 5; }
          .fc-daygrid-event-dot { display: none !important; } 
          .fc-event-main { color: #ffffff !important; font-weight: 800 !important; font-size: 0.65rem !important; letter-spacing: 0.03em; text-shadow: 0px 1px 2px rgba(0,0,0,0.8) !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2 !important; }

          .fc-daygrid-more-link { color: #4b5563 !important; font-weight: 800 !important; font-size: 0.75rem !important; margin-top: 2px; display: block; text-align: left; padding-left: 6px; }
          .dark .fc-daygrid-more-link { color: #d1d5db !important; }
          
          .fc-popover { border: 1px solid var(--fc-border-color) !important; border-radius: 12px !important; background-color: #ffffff !important; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15) !important; overflow: hidden; }
          .dark .fc-popover { background-color: #1e293b !important; border-color: #334155 !important; }
          .fc-popover-header { background: #f8fafc !important; padding: 12px !important; border-bottom: 1px solid var(--fc-border-color) !important;}
          .dark .fc-popover-header { background: #0f172a !important; border-color: #334155 !important;}
          .fc-popover-title { font-weight: 800 !important; font-size: 0.9rem !important; color: #000000 !important; }
          .dark .fc-popover-title { color: #d1d5db !important; }
          .fc-popover-body { padding: 12px !important; }
        `}</style>
        
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          dayMaxEvents={2} 
          displayEventTime={false} 
          moreLinkContent={(arg) => `+${arg.num} more`} 
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,listWeek' }}
          events={allCalendarEvents}
          height="auto" 
          dateClick={onDateClick}
        />
      </div>

      <div className="w-full xl:w-[340px] flex flex-col gap-6 flex-shrink-0">
        <div className="bg-white dark:bg-[#252830] p-5 rounded-2xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-black dark:text-gray-300 flex items-center gap-2 mb-3">
            <FiFilter className="text-amber-500" /> View Filters
          </h3>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={showSubscriptions} 
                onChange={e => setShowSubscriptions(e.target.checked)} 
                className="w-4 h-4 accent-amber-500 cursor-pointer" 
              />
              <span className="text-sm font-bold text-black dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">Client Subscriptions</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={showCoachEvents} 
                onChange={e => setShowCoachEvents(e.target.checked)} 
                className="w-4 h-4 accent-amber-500 cursor-pointer" 
              />
              <span className="text-sm font-bold text-black dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">Coach Events & Sessions</span>
            </label>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#252830] p-5 rounded-2xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex flex-col max-h-[300px]">
          <h3 className="text-base font-bold text-black dark:text-gray-300 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Active Subscriptions</h3>
          
          <div className="overflow-y-auto hidden-scrollbar space-y-4 flex-1 pr-2">
            {activeSubsLegend.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">No active subscriptions detected.</p>
            ) : (
              activeSubsLegend.map((sub, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-md flex-shrink-0 shadow-sm mt-0.5" style={{ backgroundColor: sub.color || '#f59e0b' }}></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-black dark:text-gray-300 truncate leading-tight">
                      {sub.member ? `${sub.member.first_name}` : 'Unknown'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[9px] text-slate-500 dark:text-gray-400 truncate uppercase tracking-widest font-bold">
                        {sub.plan_type}
                      </p>
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border border-solid shadow-sm ${sub.start_date > todayStr ? 'bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50' : 'bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50'}`}>
                        {sub.start_date > todayStr ? 'Future' : 'Current'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#252830] p-5 rounded-2xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex flex-col flex-1 max-h-[350px]">
          <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 flex-shrink-0">
            <h3 className="text-base font-bold text-black dark:text-gray-300">Today's Event Plan</h3>
            <button 
              onClick={onOpenEventModal} 
              className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-3 py-1.5 rounded-lg font-bold shadow-md shadow-amber-900/20 transition-all active:scale-95 uppercase tracking-wider text-[10px]"
            >
              <FiPlus size={12} strokeWidth={3} /> Add New
            </button>
          </div>
          
          <div className="overflow-y-auto hidden-scrollbar space-y-3 flex-1 pr-1">
            {sortedCoachEvents.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8">No coaching sessions scheduled.</p>
            ) : (
              sortedCoachEvents.map((ev) => (
                <div 
                  key={ev.id} 
                  className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative group p-3.5 flex justify-between items-center transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600" 
                  style={{ borderLeft: `5px solid ${ev.color || '#eab308'}` }}
                >
                  <button 
                    onClick={() => onDeleteCoachEvent(ev.id)} 
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 shadow-md hover:bg-red-600 hover:scale-110" 
                    title="Delete Event"
                  >
                    <FiTrash2 size={12} />
                  </button>

                  <div className="flex flex-col flex-1 pr-4 min-w-0">
                    <h4 className="font-bold text-sm text-black dark:text-gray-300 mb-1.5 leading-tight truncate">
                      {ev.title}
                    </h4>
                    <div className="text-[10px] font-medium text-slate-500 dark:text-gray-400 truncate flex items-center gap-1.5 mt-1">
                      <FiMapPin size={12} className="flex-shrink-0 text-slate-400 dark:text-gray-500"/> <span className="truncate">{ev.location}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center border-l-2 border-dashed border-gray-200 dark:border-gray-700 pl-4 w-[75px] flex-shrink-0">
                    <span className="text-[24px] font-black leading-none mb-0.5 tracking-tighter text-black dark:text-gray-300">
                      {new Date(ev.start_date + 'T00:00:00').getDate()}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-1.5">
                      {new Date(ev.start_date + 'T00:00:00').toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 dark:text-gray-400 uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {formatTime(ev.start_time)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
