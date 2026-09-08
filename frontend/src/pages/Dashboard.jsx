import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import api from '../api'; 

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  FiUsers, FiCheckCircle, FiDollarSign, FiFileText, 
  FiAlertCircle, FiLoader 
} from 'react-icons/fi';

import cover from '../assets/cover.jpg';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);

  const [salesData, setSalesData] = useState([]);
  const [stats, setStats] = useState({ revenue: 0, members: 0, activeSubs: 0, reports: 0 });
  const [recentMembers, setRecentMembers] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [rawCalendarEvents, setRawCalendarEvents] = useState([]);

  // Fetch coach events stored in local storage from Subscriptions page
  const [coachEvents, setCoachEvents] = useState(() => {
    const saved = localStorage.getItem('coach_events');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/dashboard');
        const data = response.data;

        setStats(data.stats);
        setSalesData(data.salesData);
        setRecentMembers(data.recentMembers.map(m => `${m.first_name} ${m.last_name}`));
        
        // --- ADDED MEMBER NAME EXTRACTION ---
        setRecentTxns(data.recentTxns.map(t => ({
          type: t.type,
          amount: t.amount,
          method: t.payment_method,
          memberName: t.member ? `${t.member.first_name} ${t.member.last_name}` : 'Walk-in Guest'
        })));

        setExpiringSoon(data.expiringSoon.map(sub => {
          const daysLeft = Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24));
          return {
            name: sub.member ? `${sub.member.first_name} ${sub.member.last_name}` : 'Unknown Member',
            days: daysLeft
          };
        }));
        
        // Save the raw subscriptions for smart mapping later
        setRawCalendarEvents(data.calendarEvents || []);

      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  const getMethodBadge = (method) => {
    const base = "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-solid shadow-sm";
    if (method.toLowerCase() === 'gcash') return `${base} bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50`;
    if (method.toLowerCase() === 'cash') return `${base} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`;
    return `${base} bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500`;
  };

  const StatCard = ({ title, value, icon, colorClass }) => (
    <div className="bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1 hover:shadow-md duration-200">
      <div className={`p-4 rounded-xl flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-normal text-slate-900 dark:text-gray-300 mt-1">
          {isLoading ? <FiLoader className="animate-spin text-xl mt-2 text-amber-500" /> : value}
        </h3>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      <div 
        className="w-full h-40 rounded-2xl bg-cover bg-center relative overflow-hidden flex items-end p-6 shadow-md border-2 border-gray-300 dark:border-gray-600"
        style={{ backgroundImage: `url(${cover})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent"></div>
        <h2 className="relative text-3xl font-bold text-white z-10 drop-shadow-xl tracking-wide">Welcome back, Coach!</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/transactions"><StatCard title="Total Revenue" value={`₱ ${stats.revenue.toLocaleString()}`} icon={<FiDollarSign size={28} strokeWidth={2.5} />} colorClass="bg-emerald-700 text-white shadow-lg shadow-emerald-700/40 dark:shadow-none" /></Link>
        <Link to="/members"><StatCard title="Total Members" value={stats.members} icon={<FiUsers size={28} strokeWidth={2.5} />} colorClass="bg-blue-800 text-white shadow-lg shadow-blue-700/40 dark:shadow-none" /></Link>
        <Link to="/subscriptions"><StatCard title="Active Subs" value={stats.activeSubs} icon={<FiCheckCircle size={28} strokeWidth={2.5} />} colorClass="bg-purple-800 text-white shadow-lg shadow-purple-700/40 dark:shadow-none" /></Link>
        <Link to="/reports"><StatCard title="Transactions" value={stats.reports} icon={<FiFileText size={28} strokeWidth={2.5} />} colorClass="bg-amber-700 text-white shadow-lg shadow-amber-600/40 dark:shadow-none" /></Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300 mb-4">Revenue Growth (Last 6 Months)</h3>
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
          <div className="flex items-center gap-2 mb-4 text-red-600 dark:text-red-700">
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
          <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300 mb-4">Recently Added Members</h3>
          <ul className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-6"><FiLoader className="animate-spin text-amber-500" /></div>
            ) : recentMembers.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">No members found.</div>
            ) : (
              recentMembers.map((name, i) => (
                <li key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <span className="font-semibold text-slate-700 dark:text-gray-300">{name}</span>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-solid shadow-sm bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50">New</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300 mb-4">Recent Transactions</h3>
          <ul className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-6"><FiLoader className="animate-spin text-amber-500" /></div>
            ) : recentTxns.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">No transactions found.</div>
            ) : (
              recentTxns.map((txn, i) => (
                <li key={i} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0 animate-in fade-in slide-in-from-top-2">
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
        <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300 mb-6">Schedules & Subscriptions</h3>
        
        {isLoading ? (
           <div className="h-[400px] flex items-center justify-center">
              <FiLoader className="animate-spin text-amber-500 text-4xl" />
           </div>
        ) : (
          <div className="min-w-[700px] text-slate-800 dark:text-gray-200">
            <style>{`
              .fc { --fc-border-color: #d1d5db; --fc-page-bg-color: transparent; --fc-list-event-hover-bg-color: rgba(0,0,0,0.05); }
              .dark .fc { --fc-border-color: #4b5563; --fc-neutral-text-color: #d1d5db; --fc-list-event-hover-bg-color: rgba(255,255,255,0.05); }
              .fc .fc-button-primary { background-color: #e5e7eb; border-color: transparent; color: #4b5563; text-transform: capitalize; font-weight: 700 !important; border-radius: 0.5rem !important; margin: 0 4px !important; transition: all 0.2s; }
              .dark .fc .fc-button-primary { background-color: #1f2937; color: #d1d5db; }
              .fc .fc-button-primary:hover { background-color: #d1d5db; }
              .dark .fc .fc-button-primary:hover { background-color: #374151; }
              .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active, .fc .fc-button-primary:disabled { background: linear-gradient(to right, #facc15, #f59e0b) !important; border-color: transparent !important; color: #000 !important; box-shadow: 0 4px 14px -3px rgba(217, 119, 6, 0.3) !important; opacity: 1 !important; }
              
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
              .fc-today-bg-color { background-color: rgba(245, 158, 11, 0.05) !important; }
              .dark .fc-today-bg-color { background-color: rgba(245, 158, 11, 0.15) !important; }
              .fc-popover { border: 1px solid var(--fc-border-color) !important; border-radius: 12px !important; background-color: #ffffff !important; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15) !important; overflow: hidden; }
              .dark .fc-popover { background-color: #1e293b !important; border-color: #334155 !important; }
              .fc-popover-header { background: #f8fafc !important; padding: 12px !important; border-bottom: 1px solid var(--fc-border-color) !important;}
              .dark .fc-popover-header { background: #0f172a !important; border-color: #334155 !important;}
              .fc-popover-title { font-weight: 800 !important; font-size: 0.9rem !important; color: #0f172a !important; }
              .dark .fc-popover-title { color: #f8fafc !important; }
              .fc-popover-body { padding: 12px !important; }
            `}</style>
            
            <FullCalendar
              plugins={[dayGridPlugin, listPlugin]} // Interaction plugin intentionally removed for strict view-only
              initialView="dayGridMonth"
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
            />
          </div>
        )}
      </div>

    </div>
  );
}