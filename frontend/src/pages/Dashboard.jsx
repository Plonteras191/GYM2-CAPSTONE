import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import MobileCalendarToolbar from '../components/ui/MobileCalendarToolbar';
import MobileCalendarDaySheet from '../components/ui/MobileCalendarDaySheet';
import CalendarHoverPopover from '../components/ui/CalendarHoverPopover';
import api from '../api'; 
import { useDataCache } from '../context/DataCacheContext';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  FiUsers, FiCheckCircle, FiDollarSign, FiFileText, 
  FiAlertCircle, FiLoader 
} from 'react-icons/fi';

export default function Dashboard() {
  const { getCache, setCache } = useDataCache();
  const dashboardCalendarRef = useRef(null);
  const [dashboardCalendarTitle, setDashboardCalendarTitle] = useState('');
  const [dashboardCalendarView, setDashboardCalendarView] = useState('dayGridMonth');
  const [isDashboardCalendarCurrentMonth, setIsDashboardCalendarCurrentMonth] = useState(true);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [selectedCalendarEvents, setSelectedCalendarEvents] = useState([]);

  const cachedDash = getCache('dashboard');
  const [isLoading, setIsLoading] = useState(!cachedDash);
  const [salesData, setSalesData] = useState(cachedDash?.salesData || []);
  const [stats, setStats] = useState(cachedDash?.stats || { revenue: 0, members: 0, activeSubs: 0, reports: 0 });
  const [recentMembers, setRecentMembers] = useState(cachedDash?.recentMembers || []);
  const [recentTxns, setRecentTxns] = useState(cachedDash?.recentTxns || []);
  const [expiringSoon, setExpiringSoon] = useState(cachedDash?.expiringSoon || []);
  const [rawCalendarEvents, setRawCalendarEvents] = useState(cachedDash?.rawCalendarEvents || []);

  // Fetch coach events stored in local storage from Subscriptions page
  const [coachEvents, setCoachEvents] = useState(() => {
    const saved = localStorage.getItem('coach_events');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchDashboardData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    try {
      const response = await api.get('/dashboard');
      const data = response.data;

      const newStats = data.stats;
      const newSalesData = data.salesData;
      const newRecentMembers = data.recentMembers.map(m => `${m.first_name} ${m.last_name}`);
      const newRecentTxns = data.recentTxns.map(t => ({
        type: t.type,
        amount: t.amount,
        method: t.payment_method,
        memberName: t.member ? `${t.member.first_name} ${t.member.last_name}` : 'Walk-in Guest'
      }));
      const newExpiringSoon = data.expiringSoon.map(sub => {
        const daysLeft = Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24));
        return {
          name: sub.member ? `${sub.member.first_name} ${sub.member.last_name}` : 'Unknown Member',
          days: daysLeft
        };
      });
      const newRawCalendarEvents = data.calendarEvents || [];

      setStats(newStats);
      setSalesData(newSalesData);
      setRecentMembers(newRecentMembers);
      setRecentTxns(newRecentTxns);
      setExpiringSoon(newExpiringSoon);
      setRawCalendarEvents(newRawCalendarEvents);

      setCache('dashboard', {
        stats: newStats,
        salesData: newSalesData,
        recentMembers: newRecentMembers,
        recentTxns: newRecentTxns,
        expiringSoon: newExpiringSoon,
        rawCalendarEvents: newRawCalendarEvents,
      });

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [setCache]);

  useEffect(() => {
    const hasCached = !!getCache('dashboard');
    fetchDashboardData(!hasCached);
  }, [fetchDashboardData, getCache]);

  // --- SMART CALENDAR MAPPING ENGINE ---
  let allCalendarEvents = [];

  // Deduplicate active subscriptions to show only the latest per member
  const activeSubsMap = new Map();
  rawCalendarEvents.forEach(sub => {
    if (sub.status === 'Active' && sub.member) {
      const existing = activeSubsMap.get(sub.member_id);
      if (!existing || new Date(sub.end_date) > new Date(existing.end_date)) {
        activeSubsMap.set(sub.member_id, sub);
      }
    }
  });
  const uniqueLatestActiveSubs = Array.from(activeSubsMap.values());

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

  const eventsForDate = (date) => allCalendarEvents.filter(event => {
    const start = event.start || event.date;
    return start && start <= date && (!event.end || date < event.end);
  });

  const [hoveredCalendarDay, setHoveredCalendarDay] = useState(null);
  const calendarHoverTimeoutRef = useRef(null);

  const handleDashboardCalendarMouseMove = (e) => {
    if (selectedCalendarDate) return;
    const dayCell = e.target.closest('.fc-daygrid-day');
    if (!dayCell) {
      if (calendarHoverTimeoutRef.current) clearTimeout(calendarHoverTimeoutRef.current);
      calendarHoverTimeoutRef.current = setTimeout(() => setHoveredCalendarDay(null), 120);
      return;
    }
    const dateStr = dayCell.getAttribute('data-date');
    if (!dateStr) return;
    if (hoveredCalendarDay?.date === dateStr) return;

    const events = eventsForDate(dateStr);
    if (!events || events.length === 0) {
      if (calendarHoverTimeoutRef.current) clearTimeout(calendarHoverTimeoutRef.current);
      setHoveredCalendarDay(null);
      return;
    }

    if (calendarHoverTimeoutRef.current) clearTimeout(calendarHoverTimeoutRef.current);
    const rect = dayCell.getBoundingClientRect();
    calendarHoverTimeoutRef.current = setTimeout(() => {
      setHoveredCalendarDay({
        date: dateStr,
        events: events.map(event => {
          const details = event.extendedProps || {};
          return {
            id: event.id,
            title: event.title,
            color: event.backgroundColor,
            location: details.location,
            type: details.type,
            detail: details.type === 'sub' ? `${details.plan_type} subscription` : details.type === 'coach' ? 'Coach event' : ''
          };
        }),
        rect
      });
    }, 80);
  };

  const handleDashboardCalendarMouseLeave = () => {
    if (calendarHoverTimeoutRef.current) clearTimeout(calendarHoverTimeoutRef.current);
    calendarHoverTimeoutRef.current = setTimeout(() => setHoveredCalendarDay(null), 150);
  };

  const openCalendarDay = (date, events = eventsForDate(date)) => {
    setHoveredCalendarDay(null);
    setSelectedCalendarDate(date);
    setSelectedCalendarEvents(events.map(event => {
      const details = event.extendedProps || {};
      return {
        id: event.id,
        title: event.title,
        color: event.backgroundColor,
        location: details.location,
        type: details.type,
        detail: details.type === 'sub' ? `${details.plan_type} subscription` : details.type === 'coach' ? 'Coach event' : ''
      };
    }));
  };

  const handleDashboardDateClick = (info) => {
    setHoveredCalendarDay(null);
    const events = eventsForDate(info.dateStr);
    if (events.length) openCalendarDay(info.dateStr, events);
  };

  const getMethodBadge = (method) => {
    const base = "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-solid shadow-sm";
    if (method.toLowerCase() === 'gcash') return `${base} bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50`;
    if (method.toLowerCase() === 'cash') return `${base} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`;
    return `${base} bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500`;
  };

  const StatCard = ({ title, value, icon, colorClass }) => (
    <div className="grid min-h-24 grid-cols-[44px_minmax(0,1fr)] items-center gap-x-3 bg-white dark:bg-[#252830] p-3 sm:min-h-0 sm:p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm sm:flex sm:gap-5 transition-transform hover:-translate-y-1 hover:shadow-md duration-200">
      <div className={`h-11 w-11 rounded-lg p-2 sm:h-auto sm:w-auto sm:rounded-xl sm:p-4 flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>
      <div className="flex min-w-0 flex-col gap-1 sm:flex-1">
        <p className="max-w-full break-words text-left text-[10px] leading-tight sm:text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-normal sm:tracking-widest">{title}</p>
        <h3 className="text-lg leading-tight sm:text-3xl font-normal text-slate-900 dark:text-gray-300 mt-0 sm:mt-1 break-words">
          {isLoading ? <FiLoader className="animate-spin text-xl mt-2 text-amber-500" /> : value}
        </h3>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Link to="/transactions"><StatCard title="Total Revenue" value={`₱ ${stats.revenue.toLocaleString()}`} icon={<FiDollarSign size={28} strokeWidth={2.5} />} colorClass="bg-emerald-700 text-white shadow-lg shadow-emerald-700/40 dark:shadow-none" /></Link>
        <Link to="/members"><StatCard title="Total Members" value={stats.members} icon={<FiUsers size={28} strokeWidth={2.5} />} colorClass="bg-blue-800 text-white shadow-lg shadow-blue-700/40 dark:shadow-none" /></Link>
        <Link to="/subscriptions"><StatCard title="Active Subs" value={stats.activeSubs} icon={<FiCheckCircle size={28} strokeWidth={2.5} />} colorClass="bg-purple-800 text-white shadow-lg shadow-purple-700/40 dark:shadow-none" /></Link>
        <Link to="/reports"><StatCard title="Transactions" value={stats.reports} icon={<FiFileText size={28} strokeWidth={2.5} />} colorClass="bg-amber-700 text-white shadow-lg shadow-amber-600/40 dark:shadow-none" /></Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300 mb-4 border-b border-gray-400 dark:border-gray-600 pb-2">Revenue Growth (Last 6 Months)</h3>
          <div className="flex-1 min-h-[250px] relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <FiLoader className="animate-spin text-amber-500 text-3xl" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#6b7280" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₱${val}`} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1f2937', color: '#fff' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-400 pb-2 text-red-600 dark:border-gray-600 dark:text-red-700">
            <FiAlertCircle size={20} strokeWidth={2.5} />
            <h3 className="text-lg font-bold">Expiring within 7 Days</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            {isLoading ? (
               <div className="flex justify-center py-10"><FiLoader className="animate-spin text-amber-500 text-2xl" /></div>
            ) : expiringSoon.length === 0 ? (
               <div className="text-center py-10 text-gray-500 dark:text-gray-400 font-medium">No memberships expiring soon.</div>
            ) : (
              expiringSoon.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/30">
                  <span className="font-normal text-slate-800 dark:text-gray-200">{item.name}</span>
                  <span className="text-xs font-normal text-red-600 dark:text-red-400">{item.days} days left</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300 mb-4 border-b border-gray-400 dark:border-gray-600 pb-2">Recently Added Members</h3>
          <ul className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-6"><FiLoader className="animate-spin text-amber-500" /></div>
            ) : recentMembers.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">No members found.</div>
            ) : (
              recentMembers.map((name, i) => (
                <li key={i} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <span className="font-semibold text-slate-700 dark:text-gray-300">{name}</span>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-solid shadow-sm bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50">New</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300 mb-4 border-b border-gray-400 dark:border-gray-600 pb-2">Recent Transactions</h3>
          <ul className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-6"><FiLoader className="animate-spin text-amber-500" /></div>
            ) : recentTxns.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">No transactions found.</div>
            ) : (
              recentTxns.map((txn, i) => (
                <li key={i} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0 animate-in fade-in slide-in-from-top-2">
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="text-slate-800 dark:text-gray-300 text-sm font-semibold truncate">{txn.memberName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{txn.type}</span>
                      <span className={getMethodBadge(txn.method)}>
                        {txn.method}
                      </span>
                    </div>
                  </div>
                  <span className="font-semibold text-green-600 dark:text-green-500 whitespace-nowrap">{Number(txn.amount) > 0 ? '+' : '-'} ₱{Math.abs(txn.amount)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm w-full overflow-x-auto relative">
        <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300 mb-6 border-b border-gray-400 dark:border-gray-600 pb-2">Schedules & Subscriptions</h3>
        
        {isLoading ? (
           <div className="h-[400px] flex items-center justify-center">
              <FiLoader className="animate-spin text-amber-500 text-4xl" />
           </div>
        ) : (
          <div 
            onMouseMove={handleDashboardCalendarMouseMove}
            onMouseLeave={handleDashboardCalendarMouseLeave}
            className={`mobile-calendar-grid min-w-0 text-slate-800 dark:text-gray-200 ${isDashboardCalendarCurrentMonth ? 'calendar-current-month' : 'calendar-other-month'}`}
          >
            <style>{`
              .fc { --fc-border-color: #d1d5db; --fc-page-bg-color: transparent; --fc-list-event-hover-bg-color: rgba(0,0,0,0.05); }
              .dark .fc { --fc-border-color: #4b5563; --fc-neutral-text-color: #d1d5db; --fc-list-event-hover-bg-color: rgba(255,255,255,0.05); }
              .fc .fc-button-primary { background-color: #e5e7eb; border-color: transparent; color: #4b5563; text-transform: capitalize; font-weight: 700 !important; border-radius: 0.5rem !important; margin: 0 4px !important; transition: all 0.2s; }
              .dark .fc .fc-button-primary { background-color: #1f2937; color: #d1d5db; }
              .fc .fc-button-primary:hover { background-color: #d1d5db; }
              .dark .fc .fc-button-primary:hover { background-color: #374151; }
              .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active, .fc .fc-button-primary:disabled { background-color: #0f172a !important; border-color: transparent !important; color: #fff !important; opacity: 1 !important; text-transform: none !important; letter-spacing: 0 !important; font-weight: 700 !important; }
              .fc .fc-button-primary.fc-prev-button, .fc .fc-button-primary.fc-next-button { background-color: #e5e7eb !important; border-color: transparent !important; color: #000 !important; }
              .fc .fc-button-primary.fc-prev-button:hover:not(:disabled), .fc .fc-button-primary.fc-next-button:hover:not(:disabled), .fc .fc-button-primary.fc-prev-button:active:not(:disabled), .fc .fc-button-primary.fc-next-button:active:not(:disabled) { background-color: #e5e7eb !important; border-color: #000 !important; color: #000 !important; }
              .dark .fc .fc-button-primary.fc-prev-button, .dark .fc .fc-button-primary.fc-next-button { background-color: #4b5563 !important; border-color: transparent !important; color: #d1d5db !important; }
              .dark .fc .fc-button-primary.fc-prev-button:hover:not(:disabled), .dark .fc .fc-button-primary.fc-next-button:hover:not(:disabled), .dark .fc .fc-button-primary.fc-prev-button:active:not(:disabled), .dark .fc .fc-button-primary.fc-next-button:active:not(:disabled) { background-color: #4b5563 !important; border-color: #d1d5db !important; color: #d1d5db !important; }
              .fc .fc-button-primary.fc-today-button { background-color: #0f172a !important; border-color: transparent !important; color: #fff !important; text-transform: none !important; letter-spacing: 0 !important; font-weight: 700 !important; }
              .fc .fc-button-primary.fc-dayGridMonth-button:hover:not(:disabled), .fc .fc-button-primary.fc-listWeek-button:hover:not(:disabled), .fc .fc-button-primary.fc-today-button:hover:not(:disabled) { background-color: #1e293b !important; border-color: transparent !important; color: #fff !important; filter: none; text-transform: none !important; letter-spacing: 0 !important; font-weight: 700 !important; }
              .fc .fc-button-primary.fc-dayGridMonth-button, .fc .fc-button-primary.fc-listWeek-button { text-transform: capitalize !important; }
              .calendar-current-month .fc .fc-button-primary.fc-today-button { background-color: #0f172a !important; border-color: transparent !important; color: #fff !important; opacity: 1 !important; }
              .calendar-other-month .fc .fc-button-primary.fc-today-button, .calendar-other-month .fc .fc-button-primary.fc-today-button:hover:not(:disabled) { background-color: #e5e7eb !important; border-color: transparent !important; color: #000 !important; opacity: 0.5 !important; }
              .dark .calendar-other-month .fc .fc-button-primary.fc-today-button, .dark .calendar-other-month .fc .fc-button-primary.fc-today-button:hover:not(:disabled) { background-color: #1f2937 !important; color: #000 !important; }
              .mobile-calendar-grid .fc .fc-button-primary.fc-today-button, .mobile-calendar-grid .fc .fc-button-primary.fc-today-button:hover:not(:disabled), .mobile-calendar-grid .fc .fc-button-primary.fc-today-button:disabled, .mobile-calendar-grid .fc .fc-button-primary.fc-dayGridMonth-button, .mobile-calendar-grid .fc .fc-button-primary.fc-dayGridMonth-button:hover:not(:disabled), .mobile-calendar-grid .fc .fc-button-primary.fc-dayGridMonth-button:not(:disabled).fc-button-active, .mobile-calendar-grid .fc .fc-button-primary.fc-listWeek-button, .mobile-calendar-grid .fc .fc-button-primary.fc-listWeek-button:hover:not(:disabled), .mobile-calendar-grid .fc .fc-button-primary.fc-listWeek-button:not(:disabled).fc-button-active { background-image: linear-gradient(to right, #facc15, #f59e0b) !important; border-color: #f59e0b !important; color: #000 !important; }
              .mobile-calendar-grid .calendar-action-button { background-image: linear-gradient(to right, #facc15, #f59e0b) !important; border-color: #f59e0b !important; color: #000 !important; }
              .mobile-calendar-grid .fc .fc-button-primary.fc-dayGridMonth-button, .mobile-calendar-grid .fc .fc-button-primary.fc-listWeek-button { opacity: 0.5 !important; }
              .mobile-calendar-grid .fc .fc-button-primary.fc-dayGridMonth-button:not(:disabled).fc-button-active, .mobile-calendar-grid .fc .fc-button-primary.fc-listWeek-button:not(:disabled).fc-button-active { opacity: 1 !important; }
              .mobile-calendar-grid.calendar-other-month .calendar-action-button { color: #000 !important; opacity: 0.5 !important; }
              .mobile-calendar-grid .fc .fc-button-primary.fc-today-button, .mobile-calendar-grid .fc .fc-button-primary.fc-dayGridMonth-button, .mobile-calendar-grid .fc .fc-button-primary.fc-listWeek-button { font-family: ui-sans-serif, system-ui, sans-serif !important; font-size: 15px !important; font-weight: 700 !important; text-transform: none !important; }
              .mobile-calendar-grid .calendar-action-button[aria-label="Today"] { font-family: ui-sans-serif, system-ui, sans-serif !important; font-size: 15px !important; font-weight: 700 !important; text-transform: none !important; }
              .mobile-calendar-grid .calendar-nav-button { background-color: #e5e7eb !important; border-color: transparent !important; color: #000 !important; }
              .mobile-calendar-grid .calendar-nav-button:hover, .mobile-calendar-grid .calendar-nav-button:active { background-color: #e5e7eb !important; border-color: #000 !important; color: #000 !important; }
              .dark .mobile-calendar-grid .calendar-nav-button { background-color: #4b5563 !important; border-color: transparent !important; color: #d1d5db !important; }
              .dark .mobile-calendar-grid .calendar-nav-button:hover, .dark .mobile-calendar-grid .calendar-nav-button:active { background-color: #4b5563 !important; border-color: #d1d5db !important; color: #d1d5db !important; }
              @media (min-width: 640px) {
                .mobile-calendar-grid .fc .fc-button-primary.fc-today-button, .mobile-calendar-grid .fc .fc-button-primary.fc-dayGridMonth-button, .mobile-calendar-grid .fc .fc-button-primary.fc-listWeek-button { min-height: 38px !important; padding: 8px 14px !important; margin: 0 4px !important; }
              }
              
              /* Explicitly disable pointer cursors for events in Dashboard */
              .fc-daygrid-event, .fc-timegrid-event { 
                  border-radius: 6px; padding: 2px 4px; font-weight: 800; font-size: 0.65rem; border: 1px solid rgba(255,255,255,0.2) !important; color: white !important; cursor: default !important; margin: 2px !important; 
              }
              .fc-event-main { color: #ffffff !important; font-weight: 800 !important; font-size: 0.65rem !important; letter-spacing: 0.03em; text-shadow: 0px 1px 2px rgba(0,0,0,0.8) !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2 !important; }
              .fc-daygrid-more-link { color: #4b5563 !important; font-weight: 800 !important; font-size: 0.75rem !important; margin-top: 2px; display: block; text-align: left; padding-left: 6px; }
              .dark .fc-daygrid-more-link { color: #d1d5db !important; }
              .fc-list-event-title a { color: #1f2937 !important; font-weight: 700; cursor: default !important; }
              .dark .fc-list-event-title a { color: #d1d5db !important; }
              .fc-list-event-time { color: #6b7280 !important; font-weight: 600; }
              .dark .fc-list-event-time { color: #9ca3af !important; }
              .fc-list-day-cushion { background-color: #f3f4f6 !important; font-weight: 800; text-transform: uppercase; padding: 8px 14px !important; }
              .dark .fc-list-day-cushion { background-color: #1f2937 !important; color: #d1d5db; }
              .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 800 !important; text-transform: uppercase; }
              .fc-daygrid-day-number { font-weight: 600; padding: 4px 8px !important; }
              .dark .fc-daygrid-day-number { color: #d1d5db !important; }
              .fc-today-bg-color { background-color: rgba(245, 158, 11, 0.05) !important; }
              .dark .fc-today-bg-color { background-color: rgba(245, 158, 11, 0.15) !important; }
              .fc-popover { border: 1px solid var(--fc-border-color) !important; border-radius: 12px !important; background-color: #ffffff !important; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15) !important; overflow: hidden; }
              .dark .fc-popover { background-color: #1e293b !important; border-color: #334155 !important; }
              .fc-popover-header { background: #f8fafc !important; padding: 12px !important; border-bottom: 1px solid var(--fc-border-color) !important;}
              .dark .fc-popover-header { background: #0f172a !important; border-color: #334155 !important;}
              .fc-popover-title { font-weight: 800 !important; font-size: 0.9rem !important; color: #0f172a !important; }
              .dark .fc-popover-title { color: #d1d5db !important; }
              .fc-popover-body { padding: 12px !important; }
            `}</style>

            <MobileCalendarToolbar
              title={dashboardCalendarTitle}
              onPrevious={() => dashboardCalendarRef.current?.getApi().prev()}
              onNext={() => dashboardCalendarRef.current?.getApi().next()}
              onAction={() => dashboardCalendarRef.current?.getApi().today()}
              actionActive={isDashboardCalendarCurrentMonth}
              views={[{ id: 'dayGridMonth', label: 'Month' }, { id: 'listWeek', label: 'List' }]}
              activeView={dashboardCalendarView}
              onViewChange={view => dashboardCalendarRef.current?.getApi().changeView(view)}
            />
            
            <FullCalendar
              ref={dashboardCalendarRef}
              plugins={[dayGridPlugin, listPlugin]} // Interaction plugin intentionally removed for strict view-only
              initialView="dayGridMonth"
              buttonText={{ month: 'Month', list: 'List', today: 'Today' }}
              dayMaxEvents={2}
              displayEventTime={false}
              editable={false}
              selectable={false}
              moreLinkContent={(arg) => `+${arg.num} more`}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,listWeek'
              }}
              events={allCalendarEvents}
              height="auto"
              datesSet={(dateInfo) => {
                setDashboardCalendarTitle(dateInfo.view.title);
                setDashboardCalendarView(dateInfo.view.type);
                const now = new Date();
                const currentStart = dateInfo.view.currentStart;
                const isCurrentMonth = currentStart.getMonth() === now.getMonth()
                  && currentStart.getFullYear() === now.getFullYear();
                setIsDashboardCalendarCurrentMonth(isCurrentMonth);
              }}
              dayHeaderContent={(headerInfo) => window.innerWidth < 640 ? headerInfo.text.charAt(0) : headerInfo.text}
              dateClick={handleDashboardDateClick}
              eventClick={info => {
                const date = info.event.startStr.slice(0, 10);
                openCalendarDay(date);
              }}
            />
            <MobileCalendarDaySheet date={selectedCalendarDate} events={selectedCalendarEvents} onClose={() => setSelectedCalendarDate(null)} />
            <CalendarHoverPopover
              data={selectedCalendarDate ? null : hoveredCalendarDay}
              onClose={() => setHoveredCalendarDay(null)}
              onClick={(date) => {
                setHoveredCalendarDay(null);
                openCalendarDay(date);
              }}
              onMouseEnter={() => {
                if (calendarHoverTimeoutRef.current) clearTimeout(calendarHoverTimeoutRef.current);
              }}
              onMouseLeave={handleDashboardCalendarMouseLeave}
            />
          </div>
        )}
      </div>

    </div>
  );
}