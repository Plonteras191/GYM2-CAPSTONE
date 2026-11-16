import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../api';
import { useDataCache } from '../../../context/DataCacheContext';
import { isValidPackagePrice } from '../../../utils/priceInput';
import { getPackageColor } from '../packageCategories';
import { getPaymentMethodLabel } from '../../../utils/paymentMethod';
import { getLocalDateString } from '../../../utils/dateFormat';
import { formatNumber } from '../../../utils/numberFormat';
import { getLoyaltyPrice, countRunningSubscriptions, isSubscriptionOfPackage } from '../pricing';

export function useSubscriptions() {
  const { getCache, setCache, invalidateCache, invalidateCachePrefix } = useDataCache();

  const cachedData = getCache('subscriptions_data');
  // The subscriber list is what staff use most (renew, edit, find a member).
  const [activeView, setActiveView] = useState('list');
  const [isLoading, setIsLoading] = useState(!cachedData);
  
  const [subscriptions, setSubscriptions] = useState(cachedData?.subscriptions || []);
  const [membersList, setMembersList] = useState(cachedData?.membersList || []);
  const [plans, setPlans] = useState(cachedData?.plans || []); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPlan, setFilterPlan] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false); // Sync guard to prevent double-submit race conditions
  const [deletingId, setDeletingId] = useState(null);
  const [deletingPlanId, setDeletingPlanId] = useState(null);
  const [renewTarget, setRenewTarget] = useState(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const isRenewingRef = useRef(false);

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
    category: '',
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
    end_date: '', payment_method: '', reference_number: ''
  };
  const [formData, setFormData] = useState(defaultForm);
  const [newPlan, setNewPlan] = useState({
    name: '',
    price: '',
    duration_days: 30,
    category: '',
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

    const activeMembership = subscriptions.find(subscription =>
      String(subscription.member_id) === String(formData.member_id)
      && subscription.status === 'Active'
      && (!subscription.start_date || subscription.start_date <= getLocalDateString())
      && (!subscription.end_date || subscription.end_date >= getLocalDateString())
    );
    if (activeMembership && String(activeMembership.plan_id) !== String(selectedPlan.id)) {
      setLoyalDiscount(0);
      setCalculatedPrice(Math.max(0, Number(selectedPlan.price || 0) - Number(activeMembership.amount_paid || 0)));
      return;
    }

    let finalPrice = Number(selectedPlan.price);
    let discount = 0;

    if (!activeMembership) {
      const pastSubs = subscriptions.filter(s => s.member_id === parseInt(formData.member_id, 10)).length;
      ({ price: finalPrice, discount } = getLoyaltyPrice(selectedPlan, pastSubs));
    }
    setLoyalDiscount(discount);
    setCalculatedPrice(finalPrice);
  }, [formData.member_id, formData.plan_type, subscriptions, plans]);

  const handleOpenAddModal = (defaultDate = null) => {
    setFormData({ 
      ...defaultForm, 
      start_date: defaultDate || new Date().toISOString().split('T')[0],
      plan_type: ''
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sub) => {
    setFormData({
      id: sub.id, member_id: sub.member?.id ?? sub.member_id ?? '', plan_type: sub.plan_type, start_date: sub.start_date,
      end_date: sub.end_date, payment_method: getPaymentMethodLabel(sub.payment_method), reference_number: sub.reference_number || ''
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
      if (!memberId) {
        setAlertDialog({ isOpen: true, title: 'Select a Member', message: 'Choose a member before saving a subscription.', type: 'error' });
        return;
      }
      if (!selectedPlan) {
        setAlertDialog({ isOpen: true, title: 'Select a Package', message: 'Choose a valid package before saving the subscription.', type: 'error' });
        return;
      }
      const activeMembership = subscriptions.find(subscription =>
        String(subscription.member_id) === String(memberId)
        && subscription.status === 'Active'
        && (!subscription.start_date || subscription.start_date <= getLocalDateString())
        && (!subscription.end_date || subscription.end_date >= getLocalDateString())
      );
      const membershipToUpdate = isEditing
        ? subscriptions.find(subscription => String(subscription.id) === String(formData.id))
        : activeMembership;
      const isUpgrade = membershipToUpdate?.status === 'Active'
        && String(membershipToUpdate.plan_id) !== String(selectedPlan.id);
      if (!isEditing && activeMembership && !isUpgrade) {
        setAlertDialog({
          isOpen: true,
          title: 'Subscription Already Active',
          message: 'This member already has this active package. Choose a higher-priced package to upgrade it.',
          type: 'error'
        });
        return;
      }
      const amountDue = isUpgrade
        ? Math.max(0, Number(selectedPlan.price || 0) - Number(membershipToUpdate.amount_paid || 0))
        : amt;

      const payload = { 
        member_id: memberId,
        plan_id: selectedPlan?.id || null,
        plan_type: formData.plan_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        payment_method: formData.payment_method,
        reference_number: cleanRef,
        amount: amountDue,
        color: getPackageColor(selectedPlan),
        status: 'Active',
        auto_renew: 0,
        notes: cleanNotes
      };
      
      let successMessage = 'Subscription saved successfully!';
      if (isEditing || isUpgrade) {
        const response = await api.put(`/memberships/${membershipToUpdate?.id || formData.id}`, payload);
        if (response.data?.amount_charged !== undefined) {
          successMessage = `${response.data.message} Amount charged: ₱${formatNumber(response.data.amount_charged)}.`;
        }
      } else {
        await api.post('/memberships', payload);
      }

      invalidateCache('transactions_data');
      invalidateCachePrefix('reports_v2_');
      
      invalidateCache('subscriptions_data');
      invalidateCache('members');
      invalidateCache('dashboard');
      await fetchData(false); 
      setIsModalOpen(false);
      setAlertDialog({ isOpen: true, title: isUpgrade ? 'Subscription upgraded' : 'Success', message: successMessage, type: 'success' });
    } catch (error) { 
      console.error("Failed to save:", error); 
      const errorMsg = error.response?.data?.errors?.plan_id?.[0]
        || error.response?.data?.errors?.member_id?.[0]
        || error.response?.data?.message
        || 'Failed to save subscription. Ensure fields are formatted correctly.';
      setAlertDialog({ isOpen: true, title: 'Error', message: errorMsg, type: 'error' });
    } finally { 
      isSavingRef.current = false;
      setIsSaving(false); 
    }
  };

  const handleOpenRenew = (sub) => setRenewTarget(sub);
  const handleCloseRenew = () => { if (!isRenewingRef.current) setRenewTarget(null); };

  /** Renew a subscription: extends a running one, or starts a new one when it has ended. */
  const handleRenew = async ({ plan_id, payment_method, reference_number, amount }) => {
    if (!renewTarget || isRenewingRef.current) return;
    isRenewingRef.current = true;
    setIsRenewing(true);
    try {
      const response = await api.post(`/memberships/${renewTarget.id}/renew`, {
        plan_id,
        payment_method,
        reference_number: reference_number?.trim() || null,
        amount,
      });
      invalidateCache('transactions_data');
      invalidateCachePrefix('reports_v2_');
      invalidateCachePrefix('reports_v3_');
      invalidateCache('subscriptions_data');
      invalidateCache('members');
      invalidateCache('dashboard');
      await fetchData(false);
      setRenewTarget(null);
      setAlertDialog({
        isOpen: true,
        title: 'Subscription renewed',
        message: `${response.data.message} Amount received: ₱${formatNumber(response.data.amount_charged)}.`,
        type: 'success',
      });
    } catch (error) {
      const errors = error.response?.data?.errors;
      setAlertDialog({
        isOpen: true,
        title: 'Could not renew',
        message: errors?.plan_id?.[0] || errors?.member_id?.[0] || errors?.payment_method?.[0]
          || error.response?.data?.message || 'The subscription could not be renewed. Please try again.',
        type: 'error',
      });
    } finally {
      isRenewingRef.current = false;
      setIsRenewing(false);
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
      message: `Delete "${category.name}" and all coach events inside it? This cannot be undone.`,
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

  const emptyPlan = () => ({ name: '', price: '', duration_days: 30, category: '', category_detail: '', color: '#10b981' });

  const handleOpenNewPlan = () => {
    setNewPlan(emptyPlan());
    setIsAddingPlan(true);
  };
  const handleOpenEditPlan = (plan) => setEditingPlan({
    ...plan,
    price: String(plan.price ?? ''),
    duration_days: String(plan.duration_days ?? ''),
    category_detail: plan.category_detail || '',
    color: plan.color || getPackageColor(plan),
  });

  /** Why a package form cannot be saved yet, or '' when it can. */
  const packageFormProblem = (plan) => {
    if (!plan.name?.trim()) return 'Enter a name for the package.';
    if (!plan.category) return 'Choose a category for the package.';
    if (!Number(plan.duration_days) || Number(plan.duration_days) < 1) return 'Enter how many days the package lasts.';
    if (!isValidPackagePrice(plan.price)) return 'Enter a price using digits with up to two decimal places, from ₱0 to ₱9,999,999.99.';
    return '';
  };

  const packageErrorMessage = (error, fallback) => {
    const errors = error.response?.data?.errors;
    return (errors && Object.values(errors).flat()[0]) || error.response?.data?.message || fallback;
  };

  /** Save changes to an existing package. Returns true when saved. */
  const handleSavePlan = async (plan) => {
    const problem = packageFormProblem(plan);
    if (problem) {
      setAlertDialog({ isOpen: true, title: 'Check the package details', message: problem, type: 'error' });
      return false;
    }
    setIsSaving(true);
    try {
      await api.put(`/plans/${plan.id}`, { ...plan, name: plan.name.trim() });
      saveRecentColor(plan.color || getPackageColor(plan));
      invalidateCache('subscriptions_data');
      await fetchData(false);
      setAlertDialog({ isOpen: true, title: 'Package saved', message: `“${plan.name.trim()}” was updated. Existing subscriptions keep what they already paid.`, type: 'success' });
      return true;
    } catch (error) {
      console.error('Failed to update package:', error);
      setAlertDialog({ isOpen: true, title: 'Could not save the package', message: packageErrorMessage(error, 'Failed to update the package.'), type: 'error' });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNewPlan = async () => {
    const problem = packageFormProblem(newPlan);
    if (problem) {
      setAlertDialog({ isOpen: true, title: 'Check the package details', message: problem, type: 'error' });
      return;
    }
    setIsSaving(true);
    try {
      await api.post('/plans', { ...newPlan, name: newPlan.name.trim() });
      saveRecentColor(newPlan.color || getPackageColor(newPlan));
      setNewPlan(emptyPlan());
      setIsAddingPlan(false);
      invalidateCache('subscriptions_data');
      await fetchData(false);
      setAlertDialog({ isOpen: true, title: 'Package created', message: `“${newPlan.name.trim()}” is now available when subscribing a member.`, type: 'success' });
    } catch (error) {
      console.error('Failed to add new plan:', error);
      setAlertDialog({ isOpen: true, title: 'Could not create the package', message: packageErrorMessage(error, 'Failed to create the package.'), type: 'error' });
    } finally { setIsSaving(false); }
  };

  const handleDeletePlan = (plan) => {
    const running = countRunningSubscriptions(plan, subscriptions);
    if (running > 0) {
      // The server refuses too; saying so here avoids a pointless confirm step.
      setAlertDialog({
        isOpen: true,
        title: 'This package is in use',
        message: `“${plan.name}” cannot be deleted while ${running} ${running === 1 ? 'member is' : 'members are'} still subscribed to it. Delete it after ${running === 1 ? 'that subscription ends' : 'those subscriptions end'}.`,
        type: 'error',
      });
      return;
    }
    const earlier = subscriptions.filter(sub => isSubscriptionOfPackage(sub, plan)).length;
    setConfirmDialog({
      isOpen: true,
      title: 'Delete package',
      message: `Delete “${plan.name}”?${earlier > 0 ? ` ${earlier} earlier ${earlier === 1 ? 'subscription' : 'subscriptions'} used it and will keep their record.` : ''} This cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setDeletingPlanId(plan.id);
        try {
          await api.delete(`/plans/${plan.id}`);
          setPlans(prev => prev.filter(item => item.id !== plan.id));
          invalidateCache('subscriptions_data');
          setAlertDialog({ isOpen: true, title: 'Package deleted', message: `“${plan.name}” was deleted.`, type: 'success' });
        } catch (error) {
          console.error('Failed to delete package:', error);
          setAlertDialog({ isOpen: true, title: 'Could not delete the package', message: packageErrorMessage(error, 'The package could not be deleted.'), type: 'error' });
        } finally {
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
    isAddingPlan, setIsAddingPlan,
    editingPlan, setEditingPlan,
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
    handleOpenNewPlan,
    handleOpenEditPlan,
    handleSavePlan,
    handleAddNewPlan,
    handleDeletePlan,
    renewTarget,
    isRenewing,
    handleOpenRenew,
    handleCloseRenew,
    handleRenew
  };
}