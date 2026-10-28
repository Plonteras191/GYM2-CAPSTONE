import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../api';
import { useDataCache } from '../../../context/DataCacheContext';
import { isValidPackagePrice } from '../../../utils/priceInput';
import { getPackageColor } from '../packageCategories';

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
  const [eventCategories, setEventCategories] = useState([]);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const legacyEventMigrationRef = useRef(false);
  const [showSubscriptions, setShowSubscriptions] = useState(true);
  const [showCoachEvents, setShowCoachEvents] = useState(true);
  const [selectedCoachCategories, setSelectedCoachCategories] = useState(null);
  const [selectedSubscriptionCategories, setSelectedSubscriptionCategories] = useState(null);

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
    description: '',
    category: 'General',
    color: '#eab308',
  };
  const [eventForm, setEventForm] = useState(defaultEventForm);

  const [coachEvents, setCoachEvents] = useState([]);

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

  const refreshCoachCalendar = useCallback(async () => {
    const [eventsResponse, categoriesResponse] = await Promise.all([
      api.get('/coach-events'),
      api.get('/coach-event-categories')
    ]);
    const events = Array.isArray(eventsResponse.data) ? eventsResponse.data : [];
    const categories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [];
    setCoachEvents(events);
    setEventCategories(categories);
    return events;
  }, []);

  const fetchCoachCalendar = useCallback(async () => {
    try {
      let events = await refreshCoachCalendar();
      const legacyEventsJson = localStorage.getItem('coach_events');
      if (legacyEventsJson && !legacyEventMigrationRef.current) {
        legacyEventMigrationRef.current = true;
        const legacyEvents = JSON.parse(legacyEventsJson);
        if (!Array.isArray(legacyEvents)) {
          throw new Error('Saved coach events must be a list.');
        }

        for (const event of legacyEvents) {
          const startDate = String(event.start_date || '').slice(0, 10);
          const requestedEndDate = String(event.end_date || event.start_date || '').slice(0, 10);
          const validDate = value => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
            const parsedDate = new Date(`${value}T00:00:00Z`);
            return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
          };
          if (!validDate(startDate)) {
            throw new Error(`Saved coach event "${event.title || 'Untitled'}" has an invalid start date and was not migrated.`);
          }
          const endDate = validDate(requestedEndDate) && requestedEndDate >= startDate
            ? requestedEndDate
            : startDate;
          const alreadyMigrated = events.some(existing =>
            existing.title === event.title
            && String(existing.start_date).slice(0, 10) === startDate
            && existing.location === event.location
          );
          if (alreadyMigrated) continue;

          await api.post('/coach-events', {
            title: event.title,
            description: event.description || '',
            category: event.category?.name || event.category || 'General',
            color: event.category?.color || event.color || '#3b82f6',
            start_date: startDate,
            end_date: endDate,
            start_time: (event.start_time || '18:00').slice(0, 5),
            end_time: (event.end_time || '19:00').slice(0, 5),
            location: event.location || 'Main Gym Floor',
          });
        }

        localStorage.removeItem('coach_events');
        events = await refreshCoachCalendar();
      }
      return events;
    } catch (error) {
      legacyEventMigrationRef.current = false;
      console.error('Failed to load coach calendar:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Calendar Error',
        message: error.response?.data?.message || error.message || 'Failed to load coach events.',
        type: 'error'
      });
      return [];
    }
  }, [refreshCoachCalendar, setAlertDialog]);

  useEffect(() => {
    fetchCoachCalendar();
  }, [fetchCoachCalendar]);

  const handleOpenNewCoachEvent = (date) => {
    const defaultCategory = eventCategories.find(category =>
      category.name.toLowerCase() === defaultEventForm.category.toLowerCase()
    );
    setEventForm({
      ...defaultEventForm,
      start_date: date || defaultEventForm.start_date,
      end_date: date || defaultEventForm.end_date,
      color: defaultCategory?.color || defaultEventForm.color,
    });
    setIsEventModalOpen(true);
  };

  // Cleaned default form fields
  const defaultForm = {
    id: '', member_id: '', plan_type: '', start_date: new Date().toISOString().split('T')[0], 
    end_date: '', payment_method: 'Cash', reference_number: ''
  };
  const [formData, setFormData] = useState(defaultForm);
  const [newPlan, setNewPlan] = useState({
    name: '',
    price: '',
    duration_days: 30,
    category: 'normal',
    category_detail: '',
    color: '#10b981',
  });

  const fetchData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    try {
      const [subsResponse, membersResponse, plansResponse] = await Promise.all([
        api.get('/memberships'),
        api.get('/members'),
        api.get('/plans'),
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
      end_date: sub.end_date, payment_method: sub.payment_method, reference_number: sub.reference_number || ''
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
      const selectedPlan = plans.find(plan => plan.name === formData.plan_type);

      const payload = { 
        member_id: memberId,
        plan_type: formData.plan_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        payment_method: formData.payment_method,
        reference_number: cleanRef,
        amount: amt,
        color: getPackageColor(selectedPlan),
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

  const handleSaveCoachEvent = async (e) => {
    e.preventDefault();
    if (eventForm.end_date < eventForm.start_date) {
      setAlertDialog({
        isOpen: true,
        title: 'Invalid Event Dates',
        message: 'End date must be on or after the start date.',
        type: 'error'
      });
      return;
    }
    setIsSavingEvent(true);
    const payload = {
      title: eventForm.title.trim(),
      description: eventForm.description?.trim() || null,
      category: eventForm.category.trim(),
      color: eventForm.color,
      start_date: eventForm.start_date,
      end_date: eventForm.end_date,
      start_time: eventForm.start_time.slice(0, 5),
      end_time: eventForm.end_time.slice(0, 5),
      location: eventForm.location.trim(),
    };
    try {
      if (eventForm.id) {
        await api.put(`/coach-events/${eventForm.id}`, payload);
      } else {
        await api.post('/coach-events', payload);
      }
      await refreshCoachCalendar();
      saveRecentColor(eventForm.color);
      setIsEventModalOpen(false);
      setAlertDialog({ isOpen: true, title: 'Success', message: `Coach event ${eventForm.id ? 'updated' : 'saved'} successfully.`, type: 'success' });
    } catch (error) {
      console.error('Failed to save coach event:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.message || 'Failed to save coach event. Check the event details and try again.',
        type: 'error'
      });
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleEditCoachEvent = (event) => {
    setEventForm({
      id: event.id,
      title: event.title,
      description: event.description || '',
      category: event.category?.name || 'General',
      color: event.category?.color || '#3b82f6',
      start_date: String(event.start_date || '').slice(0, 10),
      end_date: String(event.end_date || event.start_date || '').slice(0, 10),
      start_time: (event.start_time || '18:00').slice(0, 5),
      end_time: (event.end_time || '19:00').slice(0, 5),
      location: event.location || '',
    });
    setIsEventModalOpen(true);
  };

  const handleDeleteCoachEvent = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Coach Event',
      message: 'Are you sure you want to permanently delete this scheduled coaching event?',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setDeletingEventId(id);
        try {
          await api.delete(`/coach-events/${id}`);
          await refreshCoachCalendar();
          setAlertDialog({ isOpen: true, title: 'Success', message: 'Coach event deleted successfully.', type: 'success' });
        } catch (error) {
          console.error('Failed to delete coach event:', error);
          setAlertDialog({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.message || 'Failed to delete coach event. Please try again.',
            type: 'error'
          });
        } finally {
          setDeletingEventId(null);
        }
      }
    });
  };

  const handleUpdateCoachEventCategory = async (category, updates) => {
    setIsSavingCategory(true);
    try {
      await api.put(`/coach-event-categories/${category.id}`, updates);
      await refreshCoachCalendar();
      if (selectedCoachCategories !== null) {
        setSelectedCoachCategories(selectedCoachCategories.map(name =>
          name === category.name ? updates.name : name
        ));
      }
      setAlertDialog({ isOpen: true, title: 'Success', message: 'Coach event category updated successfully.', type: 'success' });
      return true;
    } catch (error) {
      console.error('Failed to update coach event category:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Unable to update category',
        message: error.response?.data?.message || 'Failed to update category. Please try again.',
        type: 'error'
      });
      return false;
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCoachEventCategory = (category) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Coach Event Category',
      message: `Delete "${category.name}"? Categories assigned to coach events cannot be deleted. Reassign or delete those events first.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setIsSavingCategory(true);
        try {
          await api.delete(`/coach-event-categories/${category.id}`);
          await refreshCoachCalendar();
          if (selectedCoachCategories !== null) {
            const remainingCategories = selectedCoachCategories.filter(name => name !== category.name);
            setSelectedCoachCategories(remainingCategories.length ? remainingCategories : null);
          }
          setAlertDialog({ isOpen: true, title: 'Success', message: 'Coach event category deleted successfully.', type: 'success' });
        } catch (error) {
          console.error('Failed to delete coach event category:', error);
          setAlertDialog({
            isOpen: true,
            title: 'Unable to delete category',
            message: error.response?.data?.message || 'Failed to delete category. Please try again.',
            type: 'error'
          });
        } finally {
          setIsSavingCategory(false);
        }
      }
    });
  };

  const handleUpdatePlanPrice = (id, newPrice) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, price: newPrice } : p));
  };

  const handleSavePlan = async (plan) => {
    setIsSaving(true);
    try {
      await api.put(`/plans/${plan.id}`, plan);
      saveRecentColor(plan.color || getPackageColor(plan));
      invalidateCache('subscriptions_data');
      await fetchData(false);
      setAlertDialog({ isOpen: true, title: 'Success', message: 'Package updated successfully!', type: 'success' });
      return true;
    } catch (error) {
      console.error('Failed to update package:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update package.',
        type: 'error'
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePlans = async () => {
    if (plans.some(plan => !isValidPackagePrice(plan.price))) {
      setAlertDialog({
        isOpen: true,
        title: 'Invalid Package Price',
        message: 'Enter a price using digits with up to two decimal places, from ₱0 to ₱9,999,999.99.',
        type: 'error'
      });
      return;
    }
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
    if (!newPlan.name || newPlan.price === '' || !newPlan.duration_days) {
      setAlertDialog({ isOpen: true, title: 'Incomplete Data', message: 'Please fill out all plan fields.', type: 'error' });
      return;
    }
    if (!isValidPackagePrice(newPlan.price)) {
      setAlertDialog({
        isOpen: true,
        title: 'Invalid Package Price',
        message: 'Enter a price using digits with up to two decimal places, from ₱0 to ₱9,999,999.99.',
        type: 'error'
      });
      return;
    }
    if (newPlan.category === 'other' && !newPlan.category_detail.trim()) {
      setAlertDialog({ isOpen: true, title: 'Specify Plan Type', message: 'Please specify the other subscription type.', type: 'error' });
      return;
    }
    setIsSaving(true);
    try {
      await api.post('/plans', newPlan);
      saveRecentColor(newPlan.color || getPackageColor(newPlan));
      setNewPlan({
        name: '',
        price: '',
        duration_days: 30,
        category: 'normal',
        category_detail: '',
        color: '#10b981',
      });
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
    isSavingEvent,
    isSavingCategory,
    deletingEventId,
    eventCategories,
    selectedCoachCategories, setSelectedCoachCategories,
    selectedSubscriptionCategories, setSelectedSubscriptionCategories,
    showSubscriptions, setShowSubscriptions,
    showCoachEvents, setShowCoachEvents,
    confirmDialog, setConfirmDialog,
    alertDialog, setAlertDialog,
    eventForm, setEventForm,
    coachEvents,
    recentColors,
    saveRecentColor,
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
    handleUpdateCoachEventCategory,
    handleDeleteCoachEventCategory,
    handleOpenNewCoachEvent,
    handleEditCoachEvent,
    handleDeleteCoachEvent,
    handleUpdatePlanPrice,
    handleSavePlan,
    handleSavePlans,
    handleAddNewPlan,
    handleDeletePlan
  };
}