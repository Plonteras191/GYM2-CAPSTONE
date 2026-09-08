import { useState, useEffect } from 'react';
import { 
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiRefreshCw, 
  FiList, FiCalendar, FiX, FiLoader, FiSave, FiTag, FiCheckCircle,
  FiMapPin, FiClock, FiFilter, FiChevronLeft, FiChevronRight, FiAlertCircle
} from 'react-icons/fi';
import api from '../api'; 

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

export default function Subscriptions() {
  const [activeView, setActiveView] = useState('calendar');
  const [isLoading, setIsLoading] = useState(true);
  
  const [subscriptions, setSubscriptions] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [plans, setPlans] = useState([]); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPlan, setFilterPlan] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isAddingPlan, setIsAddingPlan] = useState(false); 
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingPlanId, setDeletingPlanId] = useState(null);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [showSubscriptions, setShowSubscriptions] = useState(true);
  const [showCoachEvents, setShowCoachEvents] = useState(true);

  // --- CUSTOM POPUP MODALS STATE ---
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const defaultEventForm = { 
    title: '', 
    start_date: new Date().toISOString().split('T')[0], 
    end_date: new Date().toISOString().split('T')[0], 
    start_time: '18:00', 
    end_time: '19:00', 
    location: 'Main Gym Floor', 
    color: '#eab308' 
  };
  const [eventForm, setEventForm] = useState(defaultEventForm);

  const [coachEvents, setCoachEvents] = useState(() => {
    const saved = localStorage.getItem('coach_events');
    return saved ? JSON.parse(saved) : [];
  });

  const [recentColors, setRecentColors] = useState(() => {
    const saved = localStorage.getItem('recent_colors');
    return saved ? JSON.parse(saved) : ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];
  });

  const saveRecentColor = (hex) => {
    setRecentColors(prev => {
      const filtered = prev.filter(c => c !== hex);
      const updated = [hex, ...filtered].slice(0, 5);
      localStorage.setItem('recent_colors', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    localStorage.setItem('coach_events', JSON.stringify(coachEvents));
  }, [coachEvents]);

  const handleSaveCoachEvent = (e) => {
    e.preventDefault();
    const newEvent = { ...eventForm, id: Date.now() };
    setCoachEvents([...coachEvents, newEvent]);
    saveRecentColor(eventForm.color);
    setIsEventModalOpen(false);
  };

  const handleDeleteCoachEvent = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Coach Event',
      message: 'Are you sure you want to permanently delete this scheduled coaching event?',
      onConfirm: () => setCoachEvents(coachEvents.filter(ev => ev.id !== id))
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedH = h % 12 || 12;
    return `${formattedH}:${minutes} ${ampm}`;
  };

  const defaultForm = {
    id: '', member_id: '', plan_type: '', start_date: new Date().toISOString().split('T')[0], 
    end_date: '', status: 'Active', auto_renew: false, payment_method: 'Cash', notes: '', color: '#f59e0b', reference_number: ''
  };
  const [formData, setFormData] = useState(defaultForm);
  const [newPlan, setNewPlan] = useState({ name: '', price: '', duration_days: 30 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [subsResponse, membersResponse, plansResponse] = await Promise.all([
        api.get('/memberships'),
        api.get('/members'),
        api.get('/plans') 
      ]);
      setSubscriptions(Array.isArray(subsResponse.data) ? subsResponse.data : []);
      setMembersList(Array.isArray(membersResponse.data) ? membersResponse.data : []);
      setPlans(Array.isArray(plansResponse.data) ? plansResponse.data : []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!formData.start_date || !formData.plan_type) return;
    const start = new Date(formData.start_date);
    const selectedPlan = plans.find(p => p.name === formData.plan_type);
    if (selectedPlan) {
      let expiry = new Date(start);
      expiry.setDate(start.getDate() + selectedPlan.duration_days);
      setFormData(prev => ({ ...prev, end_date: expiry.toISOString().split('T')[0] }));
    }
  }, [formData.plan_type, formData.start_date, plans]);

  const [loyalDiscount, setLoyalDiscount] = useState(0);
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  useEffect(() => {
    if (!formData.member_id || !formData.plan_type) return;
    const selectedPlan = plans.find(p => p.name === formData.plan_type);
    if (!selectedPlan) return;

    let finalPrice = Number(selectedPlan.price);
    let discount = 0;

    if (finalPrice > 300) {
      const pastSubs = subscriptions.filter(s => s.member_id === parseInt(formData.member_id)).length;
      discount = pastSubs * 20;
      finalPrice = finalPrice - discount;
      if (finalPrice < 300) {
        finalPrice = 300;
        discount = Number(selectedPlan.price) - 300;
      }
    }
    setLoyalDiscount(discount);
    setCalculatedPrice(finalPrice);
  }, [formData.member_id, formData.plan_type, subscriptions, plans]);

  const handleOpenAddModal = (defaultDate = null) => {
    setFormData({ 
      ...defaultForm, 
      start_date: defaultDate || new Date().toISOString().split('T')[0],
      plan_type: plans.length > 0 ? plans[0].name : '' 
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sub) => {
    setFormData({
      id: sub.id, member_id: sub.member_id, plan_type: sub.plan_type, start_date: sub.start_date,
      end_date: sub.end_date, status: sub.status, auto_renew: sub.auto_renew === 1 || sub.auto_renew === true, 
      payment_method: sub.payment_method, notes: sub.notes || '', color: sub.color || '#f59e0b', reference_number: sub.reference_number || ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Subscription',
      message: 'Are you sure you want to permanently delete this subscription? This action cannot be undone.',
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await api.delete(`/memberships/${id}`);
          setSubscriptions(subscriptions.filter(s => s.id !== id));
        } catch (error) {
          console.error("Failed to delete:", error);
          setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to delete subscription.', type: 'error' });
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...formData, auto_renew: formData.auto_renew ? 1 : 0, amount: calculatedPrice, reference_number: formData.reference_number };
      if (isEditing) await api.put(`/memberships/${formData.id}`, payload);
      else await api.post('/memberships', payload);

      if (formData.member_id && formData.plan_type) {
        const memberData = new FormData();
        memberData.append('plan', formData.plan_type);
        memberData.append('status', 'Active');
        memberData.append('_method', 'PUT');
        await api.post(`/members/${formData.member_id}`, memberData).catch(() => {});
      }
      saveRecentColor(formData.color);
      await fetchData(); 
      setIsModalOpen(false);
      setAlertDialog({ isOpen: true, title: 'Success', message: 'Subscription saved successfully!', type: 'success' });
    } catch (error) { 
      console.error("Failed to save:", error); 
      setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to save subscription.', type: 'error' });
    } finally { setIsSaving(false); }
  };

  const handleUpdatePlanPrice = (id, newPrice) => {
    setPlans(plans.map(p => p.id === id ? { ...p, price: Number(newPrice) } : p));
  };

  const handleSavePlans = async () => {
    setIsSaving(true);
    try {
      await api.post('/plans/bulk-update', { plans: plans });
      setIsPlanModalOpen(false);
      setAlertDialog({ isOpen: true, title: 'Success', message: 'Subscription Plans updated successfully!', type: 'success' });
    } catch (error) { 
      console.error("Failed to update plans:", error); 
      setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to update subscription plans.', type: 'error' });
    } finally { setIsSaving(false); }
  };

  const handleAddNewPlan = async () => {
    if (!newPlan.name || !newPlan.price || !newPlan.duration_days) {
      setAlertDialog({ isOpen: true, title: 'Incomplete Data', message: 'Please fill out all plan fields.', type: 'error' });
      return;
    }
    setIsSaving(true);
    try {
      await api.post('/plans', newPlan);
      setNewPlan({ name: '', price: '', duration_days: 30 }); 
      setIsAddingPlan(false); 
      await fetchData(); 
    } catch (error) { 
      console.error("Failed to add new plan:", error); 
      setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to create the new plan.', type: 'error' });
    } finally { setIsSaving(false); }
  };

  const handleDeletePlan = async (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Pricing Plan',
      message: 'Are you sure you want to permanently delete this pricing plan?',
      onConfirm: async () => {
        setDeletingPlanId(id); 
        try {
          await api.delete(`/plans/${id}`);
          setPlans(plans.filter(p => p.id !== id));
        } catch (error) { 
          console.error("Failed to delete plan:", error); 
          setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to delete plan.', type: 'error' });
        } finally { setDeletingPlanId(null); }
      }
    });
  };

  const filteredSubs = subscriptions.filter(sub => {
    const memberName = sub.member ? `${sub.member.first_name} ${sub.member.last_name}`.toLowerCase() : '';
    const matchesSearch = memberName.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || sub.status === filterStatus;
    const matchesPlan = filterPlan === 'All' || sub.plan_type === filterPlan;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, filterPlan]);
  const totalPages = Math.ceil(filteredSubs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubs = filteredSubs.slice(indexOfFirstItem, indexOfLastItem);
  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  const generatePageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button key={i} onClick={() => setCurrentPage(i)} className={`px-3 py-1 rounded-md font-bold shadow-sm transition-colors ${currentPage === i ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black' : 'hover:text-slate-900 dark:hover:text-white font-medium text-slate-500 dark:text-gray-400'}`}>
          {i}
        </button>
      );
    }
    return pages;
  };

  const filteredDropdownPlans = plans.filter(p => !p.name.toLowerCase().includes('daily') && !p.name.toLowerCase().includes('walk'));
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
      allCalendarEvents.push({ id: `start-${sub.id}`, title: `Start of ${firstName}'s ${sub.plan_type}`, date: sub.start_date, backgroundColor: sub.color || '#f59e0b', borderColor: sub.color || '#f59e0b', allDay: true, extendedProps: { type: 'sub', ...sub } });
      if (sub.end_date && sub.end_date !== sub.start_date) {
        allCalendarEvents.push({ id: `end-${sub.id}`, title: `End of ${firstName}'s ${sub.plan_type}`, date: sub.end_date, backgroundColor: sub.color || '#f59e0b', borderColor: sub.color || '#f59e0b', allDay: true, extendedProps: { type: 'sub', ...sub } });
      }
    });
  }

  if (showCoachEvents) {
    coachEvents.forEach(ev => {
      let endObj = new Date(ev.end_date || ev.start_date);
      endObj.setDate(endObj.getDate() + 1); 
      let exclusiveEndDate = endObj.toISOString().split('T')[0];
      allCalendarEvents.push({ id: `coach-${ev.id}`, title: ev.title, start: ev.start_date, end: ev.start_date !== ev.end_date ? exclusiveEndDate : undefined, date: ev.start_date === ev.end_date ? ev.start_date : undefined, allDay: true, backgroundColor: ev.color || '#3b82f6', borderColor: ev.color || '#3b82f6', extendedProps: { type: 'coach', ...ev } });
    });
  }

  const activeSubsLegend = uniqueLatestActiveSubs.filter(s => {
    const planName = (s.plan_type || '').toLowerCase();
    if (planName.includes('walk') || planName.includes('daily') || planName === 'none') return false;
    return true;
  }).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const sortedCoachEvents = coachEvents.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const getStatusBadge = (status) => {
    const base = "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-solid shadow-sm";
    if (status === 'Active') return <span className={`${base} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`}>Active</span>;
    return <span className={`${base} bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50`}>Expired</span>;
  };

  const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-gray-300 font-medium transition-all shadow-sm";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2";
  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";
  const secondaryButtonClass = "flex items-center justify-center gap-2 bg-black hover:bg-slate-900 text-gray-200 dark:bg-gray-300 dark:hover:bg-white dark:text-black px-6 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row justify-end items-center gap-4 w-full">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto ml-auto">
          <button onClick={() => setIsPlanModalOpen(true)} className={secondaryButtonClass}>
            <FiTag size={16} /> Manage Plans
          </button>
          <div className="flex bg-gray-200 dark:bg-gray-800 rounded-xl p-1 shadow-inner w-full sm:w-auto">
            <button onClick={() => setActiveView('list')} className={`flex-1 flex justify-center items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeView === 'list' ? 'bg-white dark:bg-[#252830] text-black dark:text-gray-300 shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-black dark:hover:text-gray-300'}`}><FiList size={16} /> List</button>
            <button onClick={() => setActiveView('calendar')} className={`flex-1 flex justify-center items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeView === 'calendar' ? 'bg-white dark:bg-[#252830] text-black dark:text-gray-300 shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-black dark:hover:text-gray-300'}`}><FiCalendar size={16} /> Calendar</button>
          </div>
        </div>
      </div>

      {/* --- LIST VIEW --- */}
      {activeView === 'list' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-[#252830] p-5 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-72">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
                <input type="text" placeholder="Search by member name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-gray-300 font-medium transition-all shadow-sm" />
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full sm:w-40 px-4 py-2.5 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-gray-300 font-medium transition-all shadow-sm">
                <option value="All">All Statuses</option><option value="Active">Active</option><option value="Expired">Expired</option>
              </select>
              <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="w-full sm:w-40 px-4 py-2.5 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-gray-300 font-medium transition-all shadow-sm">
                <option value="All">All Plans</option>{filteredDropdownPlans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <button onClick={() => handleOpenAddModal()} className={primaryButtonClass}><FiPlus size={18} strokeWidth={3} /> Add Subscription</button>
          </div>

          <div className="bg-white dark:bg-[#252830] rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm overflow-hidden">
            {/* Table Header with Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center p-5 border-b-2 border-gray-300 dark:border-gray-600 gap-4 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 text-slate-800 dark:text-gray-300 font-bold text-sm tracking-wide">
                <FiList size={18} />
                <span>{filteredSubs.length} TOTAL SUBSCRIPTIONS</span>
              </div>
              <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1 border border-gray-300 dark:border-gray-600 shadow-inner">
                <button onClick={goToPrevPage} disabled={currentPage === 1 || totalPages === 0} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><FiChevronLeft size={18} /></button>
                {generatePageNumbers()}
                <button onClick={goToNextPage} disabled={currentPage === totalPages || totalPages === 0} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><FiChevronRight size={18} /></button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Color</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Member</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Plan</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Duration</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 text-center">Auto-Renew</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                  {isLoading ? (
                    <tr><td colSpan="7" className="px-6 py-12 text-center text-amber-500"><FiLoader className="animate-spin text-2xl mx-auto" /><p className="mt-2 text-sm font-bold text-slate-500 dark:text-gray-400">Loading Database...</p></td></tr>
                  ) : currentSubs.length === 0 ? (
                    <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium">No subscriptions found.</td></tr>
                  ) : (
                    currentSubs.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap"><div className="w-4 h-4 rounded-full border border-black/20 dark:border-white/20 shadow-sm" style={{ backgroundColor: sub.color }}></div></td>
                        <td className="px-6 py-4 font-medium text-black dark:text-gray-300 whitespace-nowrap">{sub.member ? `${sub.member.first_name} ${sub.member.last_name}` : 'Unknown Member'}</td>
                        <td className="px-6 py-4 text-sm text-black dark:text-gray-300 font-normal whitespace-nowrap">{sub.plan_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-normal text-black dark:text-gray-300">{sub.start_date}</div><div className="text-xs font-normal text-slate-500 dark:text-gray-400 mt-0.5">to {sub.end_date}</div></td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(sub.status)}</td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">{sub.auto_renew ? <FiRefreshCw size={16} className="inline text-green-500" /> : <span className="text-slate-400 font-bold">-</span>}</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap space-x-3">
                          <button onClick={() => handleOpenEditModal(sub)} disabled={deletingId === sub.id} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-amber-600 dark:text-amber-400 border-2 border-gray-300 dark:border-gray-600 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50"><FiEdit2 size={16} strokeWidth={2.5} /></button>
                          <button onClick={() => handleDelete(sub.id)} disabled={deletingId === sub.id} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-red-600 dark:text-red-400 border-2 border-gray-300 dark:border-gray-600 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50">{deletingId === sub.id ? <FiLoader size={16} className="animate-spin" /> : <FiTrash2 size={16} strokeWidth={2.5} />}</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- RE-STYLED DUAL-COLUMN CALENDAR VIEW --- */}
      {activeView === 'calendar' && (
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
              dateClick={(info) => {
                setEventForm({...eventForm, start_date: info.dateStr, end_date: info.dateStr});
                setIsEventModalOpen(true);
              }}
            />
          </div>

          <div className="w-full xl:w-[340px] flex flex-col gap-6 flex-shrink-0">

            <div className="bg-white dark:bg-[#252830] p-5 rounded-2xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex flex-col">
              <h3 className="text-base font-bold text-black dark:text-gray-300 flex items-center gap-2 mb-3">
                <FiFilter className="text-amber-500" /> View Filters
              </h3>
              <div className="flex flex-col gap-3">
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
                <button onClick={() => setIsEventModalOpen(true)} className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-3 py-1.5 rounded-lg font-bold shadow-md shadow-amber-900/20 transition-all active:scale-95 uppercase tracking-wider text-[10px]">
                  <FiPlus size={12} strokeWidth={3} /> Add New
                </button>
              </div>
              
              <div className="overflow-y-auto hidden-scrollbar space-y-3 flex-1 pr-1">
                {sortedCoachEvents.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-8">No coaching sessions scheduled.</p>
                ) : (
                  sortedCoachEvents.map((ev) => (
                    <div key={ev.id} className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative group p-3.5 flex justify-between items-center transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600" style={{ borderLeft: `5px solid ${ev.color || '#eab308'}` }}>
                      
                      <button onClick={() => handleDeleteCoachEvent(ev.id)} className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 shadow-md hover:bg-red-600 hover:scale-110" title="Delete Event">
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
      )}

      {/* --- COACH EVENT PLANNER MODAL --- */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600 flex flex-col">
            <div className="p-5 border-b-2 border-gray-300 dark:border-gray-600 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
              <h3 className="text-lg font-bold text-black dark:text-gray-300">Add Coach Event</h3>
              <button onClick={() => setIsEventModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><FiX size={24} /></button>
            </div>
            
            <form onSubmit={handleSaveCoachEvent} className="p-6 space-y-4">
              <label className="block">
                <span className={labelClass}>Event Title</span>
                <input type="text" required value={eventForm.title} onChange={e=>setEventForm({...eventForm, title: e.target.value})} placeholder="e.g. CrossFit WOD" className={inputClass} />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className={labelClass}>Start Date</span>
                  <input type="date" required value={eventForm.start_date} onChange={e=>setEventForm({...eventForm, start_date: e.target.value})} className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>End Date</span>
                  <input type="date" required value={eventForm.end_date} onChange={e=>setEventForm({...eventForm, end_date: e.target.value})} className={inputClass} />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className={labelClass}>Start Time</span>
                  <input type="time" required value={eventForm.start_time} onChange={e=>setEventForm({...eventForm, start_time: e.target.value})} className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>End Time</span>
                  <input type="time" required value={eventForm.end_time} onChange={e=>setEventForm({...eventForm, end_time: e.target.value})} className={inputClass} />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className={labelClass}>Location</span>
                  <input type="text" required value={eventForm.location} onChange={e=>setEventForm({...eventForm, location: e.target.value})} className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>Banner Color</span>
                  <div className="flex gap-2 mt-1 items-center">
                    <input type="color" value={eventForm.color} onChange={e=>setEventForm({...eventForm, color: e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600 bg-transparent p-1" />
                    <div className="flex flex-wrap gap-1.5 ml-2 border-l border-gray-300 dark:border-gray-600 pl-3">
                      {recentColors.map(c => (
                        <button type="button" key={c} onClick={() => setEventForm({...eventForm, color: c})} className="w-6 h-6 rounded-full border border-gray-400 dark:border-gray-500 shadow-sm transition-transform hover:scale-110" style={{backgroundColor: c}}></button>
                      ))}
                    </div>
                  </div>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 mt-6">
                <button type="button" onClick={() => setIsEventModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors uppercase tracking-wide text-xs">Cancel</button>
                <button type="submit" className={primaryButtonClass + " !text-xs !px-5"}>
                  <FiSave size={16} /> Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT SUBSCRIPTION MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border-2 border-gray-300 dark:border-gray-600">
            <div className="p-5 border-b-2 border-gray-300 dark:border-gray-600 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
              <h3 className="text-xl font-bold text-black dark:text-gray-300">{isEditing ? 'Edit Subscription' : 'Add Subscription'}</h3>
              <button onClick={() => setIsModalOpen(false)} disabled={isSaving} className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"><FiX size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white dark:bg-[#252830]">
              <form id="subForm" className="space-y-5" onSubmit={handleSaveSubscription}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <label className="block">
                    <span className={labelClass}>Select Member</span>
                    <select required value={formData.member_id} onChange={(e) => setFormData({...formData, member_id: e.target.value})} className={inputClass}>
                      <option value="">-- Choose Member --</option>
                      {membersList.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}><FiTag className="inline mr-1" /> Custom Calendar Color</span>
                    <div className="flex gap-2 mt-2 items-center">
                      <input 
                        type="color" 
                        value={formData.color} 
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })} 
                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600 bg-transparent p-1" 
                      />
                      <div className="flex flex-wrap gap-1.5 ml-2 border-l border-gray-300 dark:border-gray-600 pl-3">
                        {recentColors.map(c => (
                          <button type="button" key={c} onClick={() => setFormData({...formData, color: c})} className="w-6 h-6 rounded-full border border-gray-400 dark:border-gray-500 shadow-sm transition-transform hover:scale-110" style={{backgroundColor: c}}></button>
                        ))}
                      </div>
                    </div>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <label className="block">
                    <span className={labelClass}>Plan</span>
                    <select required value={formData.plan_type} onChange={(e) => setFormData({...formData, plan_type: e.target.value})} className={inputClass}>
                      <option value="">-- Select a Plan --</option>
                      {/* ONLY SHOWS SUBSCRIPTION PLANS, NOT DAILY/WALK-IN */}
                      {filteredDropdownPlans.map(p => <option key={p.id} value={p.name}>{p.name} (&#8369;{p.price})</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}>Payment Method</span>
                    <select value={formData.payment_method} onChange={(e) => setFormData({...formData, payment_method: e.target.value})} className={inputClass}>
                      <option value="Cash">Cash</option><option value="Gcash">Gcash</option><option value="Card">Card</option>
                    </select>
                  </label>
                </div>
                
                {loyalDiscount > 0 && (
                  <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400 p-3 rounded-lg flex items-center gap-2 text-sm font-bold">
                    <FiCheckCircle size={18} />
                    Loyal Client Detected! A &#8369;{loyalDiscount} discount has been applied. Final Auto-Billed Price: &#8369;{calculatedPrice}
                  </div>
                )}
                
                <label className="block">
                  <span className={labelClass}>Reference Number</span>
                  <input type="text" value={formData.reference_number} onChange={(e) => setFormData({...formData, reference_number: e.target.value})} className={inputClass} placeholder="Receipt or Transaction #" />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <label className="block">
                    <span className={labelClass}>Start Date</span>
                    <input type="date" required value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} className={inputClass} />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Expiration Date (Auto-calculated)</span>
                    <input type="date" value={formData.end_date} disabled className="mt-1 w-full p-2.5 bg-gray-100 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium" />
                  </label>
                </div>
                <div className="flex flex-col sm:flex-row gap-6 mt-4 p-5 border-2 border-gray-200 dark:border-gray-700/50 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={formData.status === 'Active'} onChange={(e) => setFormData({...formData, status: e.target.checked ? 'Active' : 'Expired'})} className="w-5 h-5 accent-amber-500 text-amber-500 bg-white border-gray-300 rounded focus:ring-amber-500" />
                    <span className="text-sm font-bold text-black dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">Set as Active</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={formData.auto_renew} onChange={(e) => setFormData({...formData, auto_renew: e.target.checked})} className="w-5 h-5 accent-amber-500 text-amber-500 bg-white border-gray-300 rounded focus:ring-amber-500" />
                    <span className="text-sm font-bold text-black dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">Enable Auto-Renew</span>
                  </label>
                </div>
                <label className="block">
                  <span className={labelClass}>Notes (Optional)</span>
                  <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Add any specific conditions..." className={inputClass}></textarea>
                </label>
              </form>
            </div>
            <div className="p-5 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 uppercase tracking-wide text-sm">Cancel</button>
              <button form="subForm" type="submit" disabled={isSaving} className={primaryButtonClass}>
                {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />} {isSaving ? 'Processing...' : (isEditing ? 'Save Changes' : 'Save Subscription')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PRICING CATALOG MODAL --- */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600 flex flex-col max-h-[90vh]">
            
            <style>{`
              input[type='number']::-webkit-inner-spin-button,
              input[type='number']::-webkit-outer-spin-button {
                -webkit-appearance: none;
                margin: 0;
              }
              input[type='number'] {
                -moz-appearance: textfield;
              }
            `}</style>

            <div className="p-5 border-b-2 border-gray-300 dark:border-gray-600 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
              <h3 className="text-lg font-bold text-black dark:text-gray-300">Pricing Catalog</h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><FiX size={24} /></button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto">
              {isAddingPlan ? (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border-2 border-dashed border-amber-400 dark:border-amber-500/50 flex flex-col gap-5 mb-2 animate-in fade-in slide-in-from-top-2 relative shadow-inner">
                  <button onClick={() => setIsAddingPlan(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full p-1.5 shadow-sm" title="Cancel New Plan">
                    <FiX size={16} strokeWidth={3} />
                  </button>
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 mb-1">
                    <FiPlus className="stroke-[3px]" size={20} />
                    <h4 className="font-bold text-sm uppercase tracking-wider text-black dark:text-gray-300">Create Custom Plan</h4>
                  </div>
                  <div className="space-y-4">
                    <label className="block">
                      <span className={labelClass}>Plan Name</span>
                      <input type="text" value={newPlan.name} onChange={e=>setNewPlan({...newPlan, name: e.target.value})} placeholder="e.g. Student Promo" className={inputClass} />
                    </label>
                    <div className="flex gap-4">
                      <label className="block w-1/2">
                        <span className={labelClass}>Duration (Days)</span>
                        <input type="number" value={newPlan.duration_days} onChange={e=>setNewPlan({...newPlan, duration_days: e.target.value})} className={inputClass} placeholder="30" />
                      </label>
                      <label className="block w-1/2">
                        <span className={labelClass}>Price (&#8369;)</span>
                        <input type="number" value={newPlan.price} onChange={e=>setNewPlan({...newPlan, price: e.target.value})} className={inputClass} placeholder="0.00" />
                      </label>
                    </div>
                  </div>
                  <button onClick={handleAddNewPlan} disabled={isSaving} className={primaryButtonClass + " mt-2 shadow-amber-500/30 w-full"}>
                    {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
                    {isSaving ? 'Creating...' : 'Save New Plan'}
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center mb-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-[65%]">
                    Update current prices below, or create a brand new custom plan.
                  </p>
                  <button onClick={() => setIsAddingPlan(true)} className={primaryButtonClass + " !px-4 !py-2 !text-[11px] shadow-sm active:scale-95"}>
                    <FiPlus size={16} strokeWidth={3} /> New Plan
                  </button>
                </div>
              )}

              {plans.length === 0 && !isAddingPlan && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No plans found in the database.</p>
                  <p className="text-sm text-amber-600 dark:text-amber-500 font-bold mt-1 cursor-pointer hover:underline" onClick={() => setIsAddingPlan(true)}>Click 'New Plan' to create one!</p>
                </div>
              )}
              
              <div className="space-y-3">
                {plans.map(plan => (
                  <div key={plan.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 group transition-all hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-sm">
                    <div className="flex flex-col">
                      <span className="font-bold text-black dark:text-gray-300">{plan.name}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-0.5">{plan.duration_days} Days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-black dark:text-gray-300 font-bold text-lg px-2">&#8369;</span>
                      <input 
                        type="number" 
                        value={plan.price} 
                        onChange={(e) => handleUpdatePlanPrice(plan.id, e.target.value)} 
                        className="w-24 px-3 py-2 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl text-right font-bold text-black dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" 
                      />
                      <button onClick={() => handleDeletePlan(plan.id)} disabled={deletingPlanId === plan.id} title="Delete Plan" className="inline-flex items-center justify-center p-2 ml-2 bg-white dark:bg-[#252830] text-red-600 dark:text-red-400 border-2 border-gray-300 dark:border-gray-600 hover:border-red-50 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50">
                        {deletingPlanId === plan.id ? <FiLoader size={16} className="animate-spin" strokeWidth={2.5} /> : <FiTrash2 size={16} strokeWidth={2.5} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3 mt-auto">
              <button onClick={() => setIsPlanModalOpen(false)} disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 uppercase tracking-wide text-sm">Close</button>
              <button onClick={handleSavePlans} disabled={isSaving || plans.length === 0} className={primaryButtonClass}>
                {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
                {isSaving ? 'Saving...' : 'Save Updated Prices'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM CONFIRM MODAL --- */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden border-2 border-red-500/30">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-500/30">
                <FiAlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-gray-200 uppercase tracking-wide">{confirmDialog.title}</h3>
              <p className="text-slate-500 dark:text-gray-400 font-medium">{confirmDialog.message}</p>
            </div>
            <div className="p-4 border-t-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-center gap-3">
              <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors uppercase tracking-wide text-xs">Cancel</button>
              <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, isOpen: false }); }} className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-red-900/20 transition-all active:scale-95 uppercase tracking-wide text-xs">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM ALERT MODAL --- */}
      {alertDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden border-2 ${alertDialog.type === 'error' ? 'border-red-500/30' : 'border-emerald-500/30'}`}>
            <div className="p-6 text-center space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${alertDialog.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border-red-200 dark:border-red-500/30' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-200 dark:border-emerald-500/30'}`}>
                {alertDialog.type === 'error' ? <FiAlertCircle size={32} /> : <FiCheckCircle size={32} />}
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-gray-200 uppercase tracking-wide">{alertDialog.title}</h3>
              <p className="text-slate-500 dark:text-gray-400 font-medium whitespace-pre-line">{alertDialog.message}</p>
            </div>
            <div className="p-4 border-t-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-center">
              <button onClick={() => setAlertDialog({ ...alertDialog, isOpen: false })} className="w-full px-8 py-2.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-900 text-white dark:bg-gray-200 dark:hover:bg-white dark:text-black transition-colors uppercase tracking-wide text-xs shadow-md active:scale-95">
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}