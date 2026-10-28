import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api'; 
import { useDataCache } from '../context/DataCacheContext';
import { useSubscriptions } from '../features/subscriptions/hooks/useSubscriptions';
import SubscriptionsCalendarView from '../features/subscriptions/components/SubscriptionsCalendarView';
import CoachEventModal from '../features/subscriptions/components/CoachEventModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AlertDialog from '../components/ui/AlertDialog';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  FiUsers, FiCheckCircle, FiDollarSign, FiFileText,
  FiLoader, FiTrendingUp, FiClock, FiUserPlus, FiCalendar
} from 'react-icons/fi';

export default function Dashboard() {
  const { getCache, setCache } = useDataCache();
  const {
    subscriptions,
    coachEvents,
    showSubscriptions,
    setShowSubscriptions,
    showCoachEvents,
    setShowCoachEvents,
    isEventModalOpen,
    setIsEventModalOpen,
    isSavingEvent,
    isSavingCategory,
    eventCategories,
    eventForm,
    setEventForm,
    recentColors,
    handleSaveCoachEvent,
    handleUpdateCoachEventCategory,
    handleDeleteCoachEventCategory,
    handleOpenNewCoachEvent,
    handleEditCoachEvent,
    handleDeleteCoachEvent,
    deletingEventId,
    confirmDialog,
    setConfirmDialog,
    alertDialog,
    setAlertDialog
  } = useSubscriptions();

  const cachedDash = getCache('dashboard');
  const [isLoading, setIsLoading] = useState(!cachedDash);
  const [salesData, setSalesData] = useState(cachedDash?.salesData || []);
  const [stats, setStats] = useState(cachedDash?.stats || { revenue: 0, members: 0, activeSubs: 0, reports: 0 });
  const [recentMembers, setRecentMembers] = useState(cachedDash?.recentMembers || []);
  const [recentTxns, setRecentTxns] = useState(cachedDash?.recentTxns || []);
  const [expiringSoon, setExpiringSoon] = useState(cachedDash?.expiringSoon || []);
  const fetchDashboardData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    try {
      const response = await api.get('/dashboard');
      const data = response.data;

      const newStats = data.stats;
      const newSalesData = data.salesData;
      const newRecentMembers = data.recentMembers.map(m => ({
        id: m.id,
        name: `${m.first_name} ${m.last_name}`
      }));
      const newRecentTxns = data.recentTxns.map(t => ({
        id: t.id,
        transactionId: t.transaction_id,
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
      setStats(newStats);
      setSalesData(newSalesData);
      setRecentMembers(newRecentMembers);
      setRecentTxns(newRecentTxns);
      setExpiringSoon(newExpiringSoon);
      setCache('dashboard', {
        stats: newStats,
        salesData: newSalesData,
        recentMembers: newRecentMembers,
        recentTxns: newRecentTxns,
        expiringSoon: newExpiringSoon,
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
          <h3 className="mb-4 flex items-center gap-2 border-b-2 border-gray-300 pb-1 text-lg font-bold text-slate-800 dark:border-gray-600 dark:text-gray-300">
            <FiTrendingUp size={18} className="shrink-0" /> Revenue Growth (Last 6 Months)
          </h3>
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
          <div className="mb-3 border-b-2 border-gray-300 pb-1 dark:border-gray-600">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-gray-300">
              <FiClock size={18} className="shrink-0" /> Expiring within 7 Days
            </h3>
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
          <h3 className="mb-4 flex items-center gap-2 border-b-2 border-gray-300 pb-1 text-lg font-bold text-slate-800 dark:border-gray-600 dark:text-gray-300">
            <FiUserPlus size={18} className="shrink-0" /> Recently Added Members
          </h3>
          <ul className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-6"><FiLoader className="animate-spin text-amber-500" /></div>
            ) : recentMembers.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">No members found.</div>
            ) : (
              recentMembers.map((member, i) => {
                const name = typeof member === 'string' ? member : member.name;
                return (
                  <li key={member.id || name || i} className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <Link to="/members" state={{ searchTerm: name }} className="min-w-0 truncate font-semibold text-slate-700 hover:text-amber-700 dark:text-gray-300 dark:hover:text-amber-400">{name}</Link>
                    <span className="inline-flex shrink-0 items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-solid shadow-sm bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50">New</span>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div className="bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 border-b-2 border-gray-300 pb-1 text-lg font-bold text-slate-800 dark:border-gray-600 dark:text-gray-300">
            <FiDollarSign size={18} className="shrink-0" /> Recent Transactions
          </h3>
          <ul className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-6"><FiLoader className="animate-spin text-amber-500" /></div>
            ) : recentTxns.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">No transactions found.</div>
            ) : (
              recentTxns.map((txn, i) => (
                <li key={txn.id || i} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0 animate-in fade-in slide-in-from-top-2">
                  <div className="min-w-0 flex-1 pr-4">
                    <Link to="/transactions" state={{ searchTerm: txn.transactionId || txn.memberName }} className="block truncate text-sm font-semibold text-slate-800 hover:text-amber-700 dark:text-gray-300 dark:hover:text-amber-400">{txn.memberName}</Link>
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

      <div className="relative w-full rounded-xl border-2 border-gray-300 bg-white p-6 shadow-sm dark:border-gray-600 dark:bg-[#252830]">
        <h3 className="mb-4 flex items-center gap-2 border-b-2 border-gray-300 pb-1 text-lg font-bold text-slate-800 dark:border-gray-600 dark:text-gray-300">
          <FiCalendar size={18} className="shrink-0" /> Subscriptions &amp; Events
        </h3>
        <SubscriptionsCalendarView
          subscriptions={subscriptions}
          coachEvents={coachEvents}
          showSubscriptions={showSubscriptions}
          setShowSubscriptions={setShowSubscriptions}
          showCoachEvents={showCoachEvents}
          setShowCoachEvents={setShowCoachEvents}
          onOpenEventModal={() => handleOpenNewCoachEvent()}
          onEditCoachEvent={handleEditCoachEvent}
          onDeleteCoachEvent={handleDeleteCoachEvent}
          deletingEventId={deletingEventId}
          onDateClick={info => handleOpenNewCoachEvent(info.dateStr)}
          calendarOnly
        />
        <CoachEventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          eventForm={eventForm}
          setEventForm={setEventForm}
          recentColors={recentColors}
          eventCategories={eventCategories}
          isSaving={isSavingEvent}
          isSavingCategory={isSavingCategory}
          onUpdateCategory={handleUpdateCoachEventCategory}
          onDeleteCategory={handleDeleteCoachEventCategory}
          onSave={handleSaveCoachEvent}
        />
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          confirmText="Confirm"
          isDanger
        />
        <AlertDialog
          isOpen={alertDialog.isOpen}
          title={alertDialog.title}
          message={alertDialog.message}
          type={alertDialog.type}
          onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
        />
      </div>

    </div>
  );
}