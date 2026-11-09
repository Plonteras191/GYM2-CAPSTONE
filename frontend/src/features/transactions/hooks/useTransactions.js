import { useState, useEffect, useCallback } from 'react';
import api from '../../../api';
import logo from '../../../assets/logo.png';
import { useDataCache } from '../../../context/DataCacheContext';
import { downloadCsv } from '../../../utils/csvExport';
import { getPaymentMethodLabel } from '../../../utils/paymentMethod';
import { getPackageDetails } from '../../../utils/packageDisplay';
import { isValidPackagePrice, sanitizePackagePrice } from '../../../utils/priceInput';
import { formatNumber } from '../../../utils/numberFormat';

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
  const defaultForm = {
    id: '', member_id: '', package_id: '', package_name: '', type: '',
    description: '', payment_method: '', amount: '', reference_number: ''
  };
  const [formData, setFormData] = useState(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [refundingId, setRefundingId] = useState(null);

  // Dialogs
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const fetchData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    try {
      const [txnResult, membersResult, plansResult] = await Promise.allSettled([
        api.get('/transactions'),
        api.get('/members'),
        api.get('/plans') 
      ]);
      const cachedData = getCache('transactions_data') || {};
      let nextCache = {
        transactions: cachedData.transactions || [],
        membersList: cachedData.membersList || [],
        plansList: cachedData.plansList || [],
      };

      if (txnResult.status === 'fulfilled') {
        const responseTransactions = Array.isArray(txnResult.value.data)
          ? txnResult.value.data
          : (txnResult.value.data?.data || []);
        nextCache.transactions = responseTransactions.map(transaction => {
          const dailyPlanPayment = transaction.type === 'Subscription Payment'
            && (
              (transaction.membership?.plan_type || '').toLowerCase().includes('daily')
              || (transaction.description || '').toLowerCase().includes('daily')
            );
          return dailyPlanPayment
            ? { ...transaction, type: 'Walk-in Guest', description: 'Walk-in Guest' }
            : transaction;
        });
        setTransactions(nextCache.transactions);
      } else {
        console.error('Failed to load transactions:', txnResult.reason);
      }

      if (membersResult.status === 'fulfilled') {
        nextCache.membersList = Array.isArray(membersResult.value.data) ? membersResult.value.data : [];
        setMembersList(nextCache.membersList);
      } else {
        console.error('Failed to load members for transaction form:', membersResult.reason);
      }

      if (plansResult.status === 'fulfilled') {
        nextCache.plansList = Array.isArray(plansResult.value.data) ? plansResult.value.data : [];
        setPlansList(nextCache.plansList);
      } else {
        console.error('Failed to load packages for transaction form:', plansResult.reason);
      }

      setCache('transactions_data', nextCache);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getCache, setCache]);

  useEffect(() => {
    const hasCached = !!getCache('transactions_data');
    fetchData(!hasCached);
  }, [fetchData, getCache]);

  const handlePlanSelection = (planId) => {
    const selectedPlan = plansList.find(plan => String(plan.id) === String(planId));
    if (!selectedPlan) {
      setFormData(prev => ({ ...prev, package_id: '', package_name: '', type: '', amount: '', description: '' }));
      return;
    }
    const normalizedPlanName = selectedPlan.name.toLowerCase();
    const type = selectedPlan.category === 'walk_in'
      ? 'Walk-In'
      : selectedPlan.category === 'other'
        ? 'Packages'
        : normalizedPlanName.includes('walk')
          || normalizedPlanName.includes('daily')
          ? 'Walk-In'
          : 'Subscription';
    setFormData(prev => ({
      ...prev,
      package_id: selectedPlan.id,
      package_name: selectedPlan.name,
      type,
      amount: selectedPlan.price,
      description: `${selectedPlan.name} Package`
    }));
  };

  const handleAmountChange = (value) => {
    const amount = sanitizePackagePrice(value);
    if (amount !== null) setFormData(prev => ({ ...prev, amount }));
  };

  const handleOpenAddModal = () => {
    setFormData(defaultForm);
    setIsModalOpen(true);
  };

  const handleRefundTransaction = (transaction) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Refund Transaction',
      message: `Refund the full amount of ₱${formatNumber(Math.abs(Number(transaction.amount)))} for ${transaction.transaction_id}? This will create a separate refund record.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setRefundingId(transaction.id);
        try {
          await api.post(`/transactions/${transaction.id}/refund`);
          invalidateCache('transactions_data');
          invalidateCache('dashboard');
          await fetchData(false);
          setAlertDialog({ isOpen: true, title: 'Success', message: 'Transaction refunded successfully.', type: 'success' });
        } catch (error) {
          console.error('Failed to refund transaction:', error);
          setAlertDialog({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.message || 'Failed to refund transaction. Please try again.',
            type: 'error'
          });
        } finally {
          setRefundingId(null);
        }
      }
    });
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (!formData.package_id || !formData.package_name || !formData.type) {
      setAlertDialog({ isOpen: true, title: 'Select a Package', message: 'Choose a package before recording the transaction.', type: 'error' });
      return;
    }
    if (!formData.member_id && !['Walk-In', 'Packages'].includes(formData.type)) {
      setAlertDialog({ isOpen: true, title: 'Select a Member', message: 'Choose a member for this transaction.', type: 'error' });
      return;
    }
    if (!isValidPackagePrice(formData.amount)) return;
    setIsSaving(true);
    try {
      const transactionFields = Object.fromEntries(
        Object.entries(formData).filter(([key]) => !['package_id', 'package_name', 'type'].includes(key))
      );
      const payload = { 
        ...transactionFields,
        plan_id: parseInt(formData.package_id, 10),
        member_id: formData.member_id ? parseInt(formData.member_id, 10) : null,
        reference_number: formData.reference_number ? formData.reference_number : null,
        description: formData.description ? formData.description : null,
        amount: Number(formData.amount)
      };

      await api.post('/transactions', payload);
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
    const memberName = txn.member
      ? `${txn.member.first_name} ${txn.member.last_name}`
      : txn.member_name_snapshot || 'Walk-in Guest';
    const matchesSearch = memberName.toLowerCase().includes(searchTerm.toLowerCase()) || (txn.transaction_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const type = (txn.type || '').trim().toLowerCase();
    const matchesWalkIn = ['walk-in', 'walk in', 'walk-in guest', 'walk in guest', 'fee', 'fee (walk-in)', 'fee(walk-in)', 'other'].includes(type);
    const matchesType = filterType === 'All'
      || (filterType === 'Walk-In' ? matchesWalkIn
        : filterType === 'Subscription' ? ['subscription', 'subscription payment', 'subscription upgrade'].includes(type)
          : filterType === 'Packages' ? type === 'packages'
            : filterType === 'Refund' ? type === 'refund'
              : txn.type === filterType);
    return matchesSearch && matchesType;
  });

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const headers = ['Transaction ID', 'Date', 'Member', 'Type', 'Package / Details', 'Payment Method', 'Amount', 'Status', 'Reference'];
      const rows = filteredTxns.map(transaction => {
        const memberName = transaction.member
          ? `${transaction.member.first_name} ${transaction.member.last_name}`
          : transaction.member_name_snapshot || 'Walk-in Guest';
        return [
          transaction.transaction_id,
          transaction.transaction_date,
          memberName,
          transaction.type,
          `${getPackageDetails(transaction).title}${getPackageDetails(transaction).category ? ` — ${getPackageDetails(transaction).category}` : ''}`,
          getPaymentMethodLabel(transaction.payment_method),
          transaction.amount,
          transaction.status,
          transaction.reference_number,
        ];
      });

      downloadCsv(
        `Transactions_Export_${new Date().toISOString().split('T')[0]}.csv`,
        [headers, ...rows]
      );
    } catch (error) {
      console.error('Failed to export transactions:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Export Failed',
        message: 'The transaction CSV could not be created. Please try again.',
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintReceipt = (txn) => {
    const memberPlan = txn.member?.plan || 'Walk-in';
    const txnDesc = txn.description || '';
    const memberId = txn.member?.id ? String(txn.member.id).padStart(4, '0') : 'N/A';
    const memberName = txn.member
      ? `${txn.member.first_name} ${txn.member.last_name}`
      : txn.member_name_snapshot || 'Walk-In Guest';

    const isUpgrade = txn.type === 'Subscription Upgrade';
    const isSubPayment = ['Subscription Payment', 'Subscription', 'Subscription Upgrade'].includes(txn.type);

    // Phase 1: Try to extract the plan from the description first
    let matchedPlan = plansList.find(p => p.name === txn.package_name_snapshot)
      || plansList.find(p => txnDesc.toLowerCase().includes(p.name.toLowerCase()));

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
    const isWalkIn = txn.type === 'Walk-In'
      || txn.type === 'Walk-in Guest'
      || (!isSubPayment && (txn.type === 'Fee' || !txn.member || memberPlan.toLowerCase().includes('walk') || txnDesc.toLowerCase().includes('walk')));
    const isPackageSale = txn.type === 'Packages';

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
    let itemName = isWalkIn
      ? 'Walk-In Access'
      : isPackageSale
        ? `${matchedPlan?.name || txnDesc || 'Package'} Purchase`
        : isUpgrade ? `${matchedPlan?.name || 'Subscription'} Upgrade Balance` : 'Subscription Bill';

    if (isSubPayment && matchedPlan && !isUpgrade) {
        if (Number(matchedPlan.price) > Number(txn.amount)) {
            basePrice = Number(matchedPlan.price);
            discountAmount = basePrice - Number(txn.amount);
        }
        itemName = `${matchedPlan.name} Bill`;
    }
    if (isUpgrade) {
        membershipPlan = `${matchedPlan?.name || txn.package_name_snapshot || 'Subscription'} + Upgraded`;
        basePrice = Number(txn.amount);
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

    // Escape every database value before writing it into the receipt HTML, so a
    // member name or reference number like "<img onerror=...>" cannot run script.
    const esc = (value) => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${esc(txn.transaction_id)}</title>
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
            <img src="${esc(fullLogoUrl)}" style="width: 45px; height: 45px; filter: grayscale(100%); margin-bottom: 5px;" onerror="this.style.display='none'" />
            <div class="bold" style="font-size: 14px;">DOUBLE ALPHA FITNESS</div>
            <div>Tagoloan, Misamis Oriental</div>
            <div>0991 448 9942</div>
            <div>Open Daily 9:00 AM - 9:00 PM</div>
          </div>
          <div class="dashed-line"></div>
          <div class="flex-between"><span>Date: ${esc(printDate)}</span><span>Time: ${esc(printTime)}</span></div>
          <div class="dashed-line"></div>
          <div class="left">
            <div>Name: <span class="bold">${esc(memberName)}</span></div>
            <div>Member ID: <span class="bold">${esc(memberId)}</span></div>
            <div>Membership: <span class="bold">${esc(membershipPlan)}</span></div>
          </div>
          <div class="dashed-line"></div>
          <div class="flex-between"><span>${esc(itemName)}:</span><span>&#8369;${formatNumber(basePrice)}</span></div>
          ${discountAmount > 0 ? `<div class="flex-between" style="font-size: 10px;"><span>Loyalty Discount:</span><span>-&#8369;${formatNumber(discountAmount)}</span></div>` : ''}
          <div class="dashed-line"></div>
          <div class="flex-between"><span>Sub Total:</span><span>&#8369;${formatNumber(txn.amount)}</span></div>
          <div class="dashed-line"></div>
          <div class="flex-between bold" style="font-size: 14px; margin-top: 4px;"><span>Total:</span><span>&#8369;${formatNumber(txn.amount)}</span></div>
          <br/>
          <div class="flex-between"><span>Payment Method:</span><span class="uppercase">${esc(getPaymentMethodLabel(txn.payment_method))}</span></div>
          <div class="flex-between"><span>Receipt Number:</span><span>${esc(txn.transaction_id)}</span></div>
          ${txn.reference_number ? `<div class="flex-between"><span>Ref/Trace:</span><span>${esc(txn.reference_number)}</span></div>` : ''}
          <br/>
          <div class="center"><div>Membership Valid Thru:</div><div class="bold">${esc(validThru)}</div></div>
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

  return {
    transactions,
    membersList,
    plansList,
    isLoading,
    searchTerm, setSearchTerm,
    filterType, setFilterType,
    isModalOpen, setIsModalOpen,
    formData, setFormData,
    isSaving,
    isExporting,
    refundingId,
    confirmDialog, setConfirmDialog,
    alertDialog, setAlertDialog,
    filteredTxns,
    totalIncome,
    totalRefunds,
    netRevenue,
    handlePlanSelection,
    handleAmountChange,
    handleOpenAddModal,
    handleRefundTransaction,
    handleSaveTransaction,
    handleExportCSV,
    handlePrintReceipt
  };
}