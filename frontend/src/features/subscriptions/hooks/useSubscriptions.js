import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../api';
import { useDataCache } from '../../../context/DataCacheContext';

export function useSubscriptions() {
  const { getCache, setCache, invalidateCache } = useDataCache();

  const cachedData = getCache('subscriptions_data');
  const [activeView, setActiveView] = useState('calendar');
  const [isLoading, setIsLoading] = useState(!cachedData);
  
  const [subscriptions, setSubscriptions] = useState(cachedData?.subscriptions || []);
  const [membersList, setMembersList] = useState(cachedData?.membersList || []);
  const [plans, setPlans] = useState(cachedData?.plans || []); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPlan, setFilterPlan] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isAddingPlan, setIsAddingPlan] = useState(false); 
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false); // Sync guard to prevent double-submit race conditions
  const [deletingId, setDeletingId] = useState(null);
  const [deletingPlanId, setDeletingPlanId] = useState(null);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [showSubscriptions, setShowSubscriptions] = useState(true);
  const [showCoachEvents, setShowCoachEvents] = useState(true);

  // Dialogs
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

  // Cleaned default form fields
  const defaultForm = {
    id: '', member_id: '', plan_type: '', start_date: new Date().toISOString().split('T')[0], 
    end_date: '', payment_method: 'Cash', color: '#f59e0b', reference_number: ''
  };
  const [formData, setFormData] = useState(defaultForm);
  const [newPlan, setNewPlan] = useState({ name: '', price: '', duration_days: 30 });

  const fetchData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    try {
      const [subsResponse, membersResponse, plansResponse] = await Promise.all([
        api.get('/memberships'),
        api.get('/members'),
        api.get('/plans') 
      ]);
      const newSubs = Array.isArray(subsResponse.data) ? subsResponse.data : [];
      const newMembers = Array.isArray(membersResponse.data) ? membersResponse.data : [];
      const newPlans = Array.isArray(plansResponse.data) ? plansResponse.data : [];
      setSubscriptions(newSubs);
      setMembersList(newMembers);
      setPlans(newPlans);
      setCache('subscriptions_data', { subscriptions: newSubs, membersList: newMembers, plans: newPlans });
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [setCache]);

  useEffect(() => {
    const hasCached = !!getCache('subscriptions_data');
    fetchData(!hasCached);
  }, [fetchData, getCache]);

  // Safely auto-calculate end_date using integer conversion to prevent date string concatenation errors
  useEffect(() => {
    if (!formData.start_date || !formData.plan_type) return;
    const start = new Date(formData.start_date);
    const selectedPlan = plans.find(p => p.name === formData.plan_type);
    if (selectedPlan) {
      let expiry = new Date(start);
      expiry.setDate(start.getDate() + parseInt(selectedPlan.duration_days || 0, 10));
      setFormData(prev => ({ ...prev, end_date: expiry.toISOString().split('T')[0] }));
    }
  }, [formData.plan_type, formData.start_date, plans]);

  // Auto calculate loyalty discount safely
  const [loyalDiscount, setLoyalDiscount] = useState(0);
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  useEffect(() => {
    if (!formData.member_id || !formData.plan_type) return;
    const selectedPlan = plans.find(p => p.name === formData.plan_type);
    if (!selectedPlan) return;

    let finalPrice = Number(selectedPlan.price);
    let discount = 0;

    if (finalPrice > 300) {
      const pastSubs = subscriptions.filter(s => s.member_id === parseInt(formData.member_id, 10)).length;
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
      end_date: sub.end_date, payment_method: sub.payment_method, color: sub.color || '#f59e0b', reference_number: sub.reference_number || ''
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
        setConfirmDialog(prev => ({ ...prev, isOpen: false })); 
        setDeletingId(id);
        try {
          await api.delete(`/memberships/${id}`);
        } catch (error) {
          console.warn("API threw an error, catching silently to prevent stuck popup.", error);
        } finally {
          setSubscriptions(prev => prev.filter(s => s.id !== id));
          setDeletingId(null);
          invalidateCache('subscriptions_data');
          invalidateCache('dashboard');
          fetchData(false); 
        }
      }
    });
  };

  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    // Guard against double-submit: isSavingRef is synchronous unlike setState
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);
    try {
      
      // STRICT PAYLOAD FILTERING: 
      // Emptry strings ("") are actively intercepted and converted into standard SQL "null" values 
      // to completely bypass database Unique Constraint duplication errors that trigger 500 crashes.
      const cleanRef = formData.reference_number?.trim() || null;
      const cleanNotes = formData.notes?.trim() || null;
      const memberId = formData.member_id ? parseInt(formData.member_id, 10) : null;
      const amt = parseFloat(calculatedPrice) || 0;

      const payload = { 
        member_id: memberId,
        plan_type: formData.plan_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        payment_method: formData.payment_method,
        reference_number: cleanRef,
        amount: amt,
        color: formData.color,
        status: 'Active',
        auto_renew: 0,
        notes: cleanNotes
      };
      
      let membershipId = formData.id || null;

      if (isEditing) {
        await api.put(`/memberships/${formData.id}`, payload);
      } else {
        // Capture the newly created membership's ID so we can link the transaction
        const membershipResponse = await api.post('/memberships', payload);
        membershipId = membershipResponse.data?.membership?.id || membershipResponse.data?.id || null;
      }

      // The backend auto-creates a linked transaction with membership_id on store().
      // Just invalidate the cache so the Transactions page shows the new entry.
      if (!isEditing) {
        invalidateCache('transactions_data');
      }

      if (memberId && formData.plan_type) {
        const memberData = new FormData();
        memberData.append('plan', formData.plan_type);
        memberData.append('status', 'Active');
        memberData.append('_method', 'PUT');
        await api.post(`/members/${memberId}`, memberData).catch(() => {});
      }
      saveRecentColor(formData.color);
      
      invalidateCache('subscriptions_data');
      invalidateCache('members');
      invalidateCache('dashboard');
      await fetchData(false); 
      setIsModalOpen(false);
      setAlertDialog({ isOpen: true, title: 'Success', message: 'Subscription saved successfully!', type: 'success' });
    } catch (error) { 
      console.error("Failed to save:", error); 
      const errorMsg = error.response?.data?.message || 'Failed to save subscription. Ensure fields are formatted correctly.';
      setAlertDialog({ isOpen: true, title: 'Error', message: errorMsg, type: 'error' });
    } finally { 
      isSavingRef.current = false;
      setIsSaving(false); 
    }
  };

  const handleSaveCoachEvent = (e) => {
    e.preventDefault();
    const newEvent = { ...eventForm, id: Date.now() };
    setCoachEvents(prev => [...prev, newEvent]);
    saveRecentColor(eventForm.color);
    setIsEventModalOpen(false);
  };

  const handleDeleteCoachEvent = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Coach Event',
      message: 'Are you sure you want to permanently delete this scheduled coaching event?',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setCoachEvents(prev => prev.filter(ev => ev.id !== id));
      }
    });
  };

  const handleUpdatePlanPrice = (id, newPrice) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, price: Number(newPrice) } : p));
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
        setConfirmDialog(prev => ({ ...prev, isOpen: false })); 
        setDeletingPlanId(id); 
        try {
          await api.delete(`/plans/${id}`);
        } catch (error) { 
          console.warn("API threw an error, catching silently to prevent stuck popup.", error);
        } finally { 
          setPlans(prev => prev.filter(p => p.id !== id));
          setDeletingPlanId(null); 
        }
      }
    });
  };

  return {
    activeView, setActiveView,
    isLoading,
    subscriptions, setSubscriptions,
    membersList,
    plans, setPlans,
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    filterPlan, setFilterPlan,
    isModalOpen, setIsModalOpen,
    isPlanModalOpen, setIsPlanModalOpen,
    isAddingPlan, setIsAddingPlan,
    isEditing,
    isSaving,
    deletingId,
    deletingPlanId,
    isEventModalOpen, setIsEventModalOpen,
    showSubscriptions, setShowSubscriptions,
    showCoachEvents, setShowCoachEvents,
    confirmDialog, setConfirmDialog,
    alertDialog, setAlertDialog,
    eventForm, setEventForm,
    coachEvents,
    recentColors,
    formData, setFormData,
    newPlan, setNewPlan,
    loyalDiscount,
    calculatedPrice,
    fetchData,
    handleOpenAddModal,
    handleOpenEditModal,
    handleDelete,
    handleSaveSubscription,
    handleSaveCoachEvent,
    handleDeleteCoachEvent,
    handleUpdatePlanPrice,
    handleSavePlans,
    handleAddNewPlan,
    handleDeletePlan
  };
}