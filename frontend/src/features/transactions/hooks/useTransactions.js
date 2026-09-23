import { useState, useEffect, useCallback } from 'react';
import api from '../../../api';
import logo from '../../../assets/logo.png';
import { useDataCache } from '../../../context/DataCacheContext';

export function useTransactions() {
  const { getCache, setCache, invalidateCache } = useDataCache();

  const cachedData = getCache('transactions_data');
  const [transactions, setTransactions] = useState(cachedData?.transactions || []);
  const [membersList, setMembersList] = useState(cachedData?.membersList || []);
  const [plansList, setPlansList] = useState(cachedData?.plansList || []);
  const [isLoading, setIsLoading] = useState(!cachedData);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const defaultForm = { 
    id: '', transaction_date: '', member_id: '', type: 'Subscription Payment', 
    description: '', payment_method: 'Cash', amount: '', status: 'Complete', reference_number: '' 
  };
  const [formData, setFormData] = useState(defaultForm);

  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Dialogs
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const fetchData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    try {
      const [txnRes, memRes, plansRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/members'),
        api.get('/plans') 
      ]);
      const newTxns = Array.isArray(txnRes.data) ? txnRes.data : (txnRes.data?.data || []);
      const newMembers = Array.isArray(memRes.data) ? memRes.data : [];
      const newPlans = Array.isArray(plansRes.data) ? plansRes.data : [];
      setTransactions(newTxns);
      setMembersList(newMembers);
      setPlansList(newPlans);
      setCache('transactions_data', { transactions: newTxns, membersList: newMembers, plansList: newPlans });
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [setCache]);

  useEffect(() => {
    const hasCached = !!getCache('transactions_data');
    fetchData(!hasCached);
  }, [fetchData, getCache]);

  const handlePlanSelection = (planName) => {
    const selectedPlan = plansList.find(p => p.name === planName);
    if (selectedPlan) {
      setFormData(prev => ({
        ...prev,
        amount: selectedPlan.price,
        description: `${selectedPlan.name} Plan Payment`
      }));
    }
  };

  const handleOpenAddModal = () => {
    setFormData({ ...defaultForm, transaction_date: new Date().toISOString().split('T')[0] });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (txn) => {
    setFormData({
      id: txn.id,
      transaction_date: txn.transaction_date,
      member_id: txn.member_id || '', 
      type: txn.type,
      description: txn.description || '',
      payment_method: txn.payment_method,
      amount: txn.amount,
      status: txn.status,
      reference_number: txn.reference_number || ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Transaction',
      message: 'Are you sure you want to permanently delete this transaction? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false })); 
        setDeletingId(id);
        try {
          await api.delete(`/transactions/${id}`);
        } catch (error) {
          console.warn("API threw an error, catching silently to prevent stuck popup.", error);
        } finally {
          setTransactions(prev => prev.filter(t => t.id !== id));
          setDeletingId(null);
          invalidateCache('transactions_data');
          invalidateCache('dashboard');
          fetchData(false);
        }
      }
    });
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { 
        ...formData, 
        member_id: formData.member_id ? parseInt(formData.member_id, 10) : null,
        reference_number: formData.reference_number ? formData.reference_number : null,
        description: formData.description ? formData.description : null,
        amount: parseFloat(formData.amount)
      };

      if (!isEditing) delete payload.id;
      
      if (isEditing) {
        await api.put(`/transactions/${formData.id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }
      invalidateCache('transactions_data');
      invalidateCache('dashboard');
      await fetchData(false);
      setIsModalOpen(false);
      setAlertDialog({ isOpen: true, title: 'Success', message: 'Transaction recorded successfully!', type: 'success' });
    } catch (error) {
      console.error("Failed to save transaction:", error);
      setAlertDialog({ isOpen: true, title: 'Error', message: 'Error saving transaction data. Make sure all required fields are filled.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTxns = transactions.filter(txn => {
    const memberName = txn.member ? `${txn.member.first_name} ${txn.member.last_name}` : 'Walk-in Guest';
    const matchesSearch = memberName.toLowerCase().includes(searchTerm.toLowerCase()) || (txn.transaction_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || txn.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); 
      const headers = "Transaction ID,Date,Member,Type,Description,Method,Amount,Status,Reference\n";
      const rows = filteredTxns.map(t => {
        const memberName = t.member ? `${t.member.first_name} ${t.member.last_name}` : 'Walk-in Guest';
        return `${t.transaction_id},${t.transaction_date},${memberName},${t.type},"${t.description || ''}",${t.payment_method},${t.amount},${t.status},${t.reference_number || ''}`;
      }).join("\n");
      
      const csvContent = headers + rows;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Transactions_Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintReceipt = (txn) => {
    const memberPlan = txn.member?.plan || 'Walk-in';
    const txnDesc = txn.description || '';
    const memberId = txn.member ? String(txn.member.id).padStart(4, '0') : 'N/A';
    const memberName = txn.member ? `${txn.member.first_name} ${txn.member.last_name}` : 'Walk-In Guest';

    const isSubPayment = txn.type === 'Subscription Payment';

    // Phase 1: Try to extract the plan from the description first
    let matchedPlan = plansList.find(p => txnDesc.toLowerCase().includes(p.name.toLowerCase()));

    // Phase 2: Use the DIRECTLY linked subscription (membership_id FK).
    // This is the exact subscription this transaction paid for — no ambiguity.
    const linkedSub = txn.membership || null;

    // Phase 3: Fallback for legacy transactions without membership_id.
    // Match by member + transaction date falling within the subscription window.
    const subsCache = getCache('subscriptions_data');
    const txnDateObj = new Date(txn.transaction_date + 'T00:00:00');
    const allMemberSubs = (subsCache?.subscriptions || [])
        .filter(s => s.member_id === txn.member_id);

    // Try to find the subscription whose window contains this transaction's date
    const matchedByDate = allMemberSubs.find(s => {
        const start = new Date(s.start_date + 'T00:00:00');
        const end   = new Date(s.end_date   + 'T00:00:00');
        return txnDateObj >= start && txnDateObj <= end;
    });

    // Use linked sub first, then date-matched, then newest as last resort
    const activeSub = linkedSub || matchedByDate || 
        allMemberSubs.sort((a, b) => new Date(b.end_date) - new Date(a.end_date))[0];

    // Phase 4: If no plan matched the text description, rely on activeSub
    if (!matchedPlan && activeSub) {
        matchedPlan = plansList.find(p => p.name.toLowerCase() === activeSub.plan_type.toLowerCase());
    }
    
    // Phase 5: Extreme Fallback to member profile plan string
    if (!matchedPlan && memberPlan && !memberPlan.toLowerCase().includes('walk')) {
        matchedPlan = plansList.find(p => p.name.toLowerCase() === memberPlan.toLowerCase());
    }

    // Force Walk-In logic completely preventing "Walk-In" bugs for subscription buyers
    const isWalkIn = !isSubPayment && (txn.type === 'Fee' || !txn.member || memberPlan.toLowerCase().includes('walk') || txnDesc.toLowerCase().includes('walk'));

    let membershipPlan = 'Walk-In';
    if (!isWalkIn) {
        if (matchedPlan) {
            membershipPlan = matchedPlan.name;
        } else if (isSubPayment) {
            membershipPlan = 'Subscription';
        } else {
            membershipPlan = memberPlan === 'Without Coach' ? 'Without Coach (Open Gym)' : memberPlan;
        }
    }

    let basePrice = Number(txn.amount);
    let discountAmount = 0;
    let itemName = isWalkIn ? 'Walk-In Access' : 'Subscription Bill';

    if (isSubPayment && matchedPlan) {
        if (Number(matchedPlan.price) > Number(txn.amount)) {
            basePrice = Number(matchedPlan.price);
            discountAmount = basePrice - Number(txn.amount);
        }
        itemName = `${matchedPlan.name} Bill`;
    }

    const now = new Date();
    const printDate = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const printTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    let validThru = 'N/A';
    if (isWalkIn) {
        const walkInDate = new Date(txn.transaction_date + 'T00:00:00');
        const formattedWalkInDate = walkInDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        validThru = `${formattedWalkInDate} (9:00 AM - 9:30 PM)`;
    } else if (isSubPayment || matchedPlan) {
        let subStart = null;
        let subEnd = null;

        // Use the exact subscription dates this transaction is linked to
        if (activeSub) {
            subStart = activeSub.start_date;
            subEnd = activeSub.end_date;
        }

        // Fallback: calculate from transaction date + plan duration
        if (!subStart) subStart = txn.transaction_date;
        if (!subEnd && matchedPlan) {
            const startDate = new Date(subStart + 'T00:00:00');
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + parseInt(matchedPlan.duration_days || 0, 10));
            subEnd = endDate.toISOString().split('T')[0];
        }

        if (subStart && subEnd) {
            const sDate = new Date(subStart + 'T00:00:00');
            const eDate = new Date(subEnd + 'T00:00:00');
            const startFmt = sDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
            const endFmt = eDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
            validThru = `${startFmt} - ${endFmt} (9:00 AM - 9:30 PM)`;
        }
    }

    const fullLogoUrl = window.location.origin + logo;

    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${txn.transaction_id}</title>
          <style>
            @page { size: A6 portrait; margin: 10mm; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 100%; 
              max-width: 100%;
              margin: 0 auto; 
              padding: 0; 
              font-size: 11px; 
              color: #000; 
              line-height: 1.4;
            }
            .center { text-align: center; }
            .left { text-align: left; }
            .flex-between { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .dashed-line { border-top: 1px dashed #000; margin: 8px 0; }
            .bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="center">
            <img src="${fullLogoUrl}" style="width: 45px; height: 45px; filter: grayscale(100%); margin-bottom: 5px;" onerror="this.style.display='none'" />
            <div class="bold" style="font-size: 14px;">DOUBLE ALPHA FITNESS</div>
            <div>Tagoloan, Misamis Oriental</div>
            <div>0991 448 9942</div>
            <div>Open Daily 9:00 AM - 9:00 PM</div>
          </div>
          <div class="dashed-line"></div>
          <div class="flex-between"><span>Date: ${printDate}</span><span>Time: ${printTime}</span></div>
          <div class="dashed-line"></div>
          <div class="left">
            <div>Name: <span class="bold">${memberName}</span></div>
            <div>Member ID: <span class="bold">${memberId}</span></div>
            <div>Membership: <span class="bold">${membershipPlan}</span></div>
          </div>
          <div class="dashed-line"></div>
          <div class="flex-between"><span>${itemName}:</span><span>&#8369;${basePrice.toFixed(2)}</span></div>
          ${discountAmount > 0 ? `<div class="flex-between" style="font-size: 10px;"><span>Loyalty Discount:</span><span>-&#8369;${discountAmount.toFixed(2)}</span></div>` : ''}
          <div class="dashed-line"></div>
          <div class="flex-between"><span>Sub Total:</span><span>&#8369;${Number(txn.amount).toFixed(2)}</span></div>
          <div class="dashed-line"></div>
          <div class="flex-between bold" style="font-size: 14px; margin-top: 4px;"><span>Total:</span><span>&#8369;${Number(txn.amount).toFixed(2)}</span></div>
          <br/>
          <div class="flex-between"><span>Payment Method:</span><span class="uppercase">${txn.payment_method}</span></div>
          <div class="flex-between"><span>Receipt Number:</span><span>${txn.transaction_id}</span></div>
          ${txn.reference_number ? `<div class="flex-between"><span>Ref/Trace:</span><span>${txn.reference_number}</span></div>` : ''}
          <br/>
          <div class="center"><div>Membership Valid Thru:</div><div class="bold">${validThru}</div></div>
          <br/>
          <div class="center" style="margin-top: 8px;">
            <div class="bold uppercase">"BE THE BEST VERSION OF YOURSELF."</div>
            <div style="margin-top: 2px;">fb.com/doublealphafitnessgym</div>
          </div>
          <script>setTimeout(function() { window.print(); window.close(); }, 300);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const totalIncome = transactions.filter(t => Number(t.amount) > 0 && t.status === 'Complete').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalRefunds = transactions.filter(t => t.type === 'Refund').reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
  const netRevenue = totalIncome - totalRefunds;
  const pendingAmount = transactions.filter(t => t.status === 'Pending').reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    transactions,
    membersList,
    plansList,
    isLoading,
    searchTerm, setSearchTerm,
    filterType, setFilterType,
    isModalOpen, setIsModalOpen,
    isEditing,
    formData, setFormData,
    isSaving,
    isExporting,
    deletingId,
    confirmDialog, setConfirmDialog,
    alertDialog, setAlertDialog,
    filteredTxns,
    totalIncome,
    totalRefunds,
    netRevenue,
    pendingAmount,
    handlePlanSelection,
    handleOpenAddModal,
    handleOpenEditModal,
    handleDelete,
    handleSaveTransaction,
    handleExportCSV,
    handlePrintReceipt
  };
}