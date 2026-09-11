import { useState, useEffect } from 'react';
import { 
  FiSearch, FiPlus, FiDownload, FiEdit2, FiTrash2, 
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiClock, 
  FiX, FiLoader, FiSave, FiTag, FiPrinter, FiUser, FiCheckCircle, FiAlertCircle,
  FiChevronLeft, FiChevronRight, FiList
} from 'react-icons/fi';
import api from '../api';
import logo from '../assets/logo.png'; 

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [plansList, setPlansList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
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

  // --- CUSTOM POPUP MODALS STATE ---
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [txnRes, memRes, plansRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/members'),
        api.get('/plans') 
      ]);
      setTransactions(txnRes.data);
      setMembersList(memRes.data);
      setPlansList(plansRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelection = (planName) => {
    const selectedPlan = plansList.find(p => p.name === planName);
    if (selectedPlan) {
      setFormData({
        ...formData,
        amount: selectedPlan.price,
        description: `${selectedPlan.name} Plan Payment`
      });
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
        setDeletingId(id);
        try {
          await api.delete(`/transactions/${id}`);
          setTransactions(transactions.filter(t => t.id !== id));
        } catch (error) {
          console.error("Failed to delete transaction:", error);
          setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to delete transaction.', type: 'error' });
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...formData, member_id: formData.member_id === '' ? null : formData.member_id };
      
      if (isEditing) {
        await api.put(`/transactions/${formData.id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }
      await fetchData();
      setIsModalOpen(false);
      setAlertDialog({ isOpen: true, title: 'Success', message: 'Transaction recorded successfully!', type: 'success' });
    } catch (error) {
      console.error("Failed to save transaction:", error);
      setAlertDialog({ isOpen: true, title: 'Error', message: 'Error saving transaction data. Make sure all required fields are filled.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

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
    const isWalkIn = 
      txn.type === 'Fee' || 
      !txn.member || 
      memberPlan.toLowerCase().includes('walk') || 
      memberPlan.toLowerCase() === 'none' ||
      txnDesc.toLowerCase().includes('walk');

    const memberName = txn.member ? `${txn.member.first_name} ${txn.member.last_name}` : 'Walk-In Guest';
    const memberId = txn.member ? String(txn.member.id).padStart(4, '0') : 'N/A';
    
    let membershipPlan = 'Walk-In'; 
    if (!isWalkIn) {
      membershipPlan = memberPlan === 'Without Coach' ? 'Without Coach (Open Gym)' : memberPlan;
    }

    let basePrice = Number(txn.amount);
    let discountAmount = 0;
    let itemName = isWalkIn ? 'Walk-In Access' : (txn.type === 'Subscription Payment' ? 'Subscription Bill' : txn.type);

    const matchedPlan = plansList.find(p => p.name === memberPlan || txnDesc.includes(p.name));
    if (!isWalkIn && txn.type === 'Subscription Payment' && matchedPlan) {
      if (Number(matchedPlan.price) > Number(txn.amount)) {
        basePrice = Number(matchedPlan.price);
        discountAmount = basePrice - Number(txn.amount);
        itemName = `${matchedPlan.name} Bill`;
      }
    }

    const now = new Date();
    const printDate = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const printTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    let validThru = 'See Active Subs Tab';
    if (isWalkIn) {
      const walkInDate = new Date(txn.transaction_date + 'T00:00:00');
      const formattedWalkInDate = walkInDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      validThru = `${formattedWalkInDate} (9:00 AM - 9:30 PM)`;
    } else if (txn.type === 'Subscription Payment' && matchedPlan) {
      const startDate = new Date(txn.transaction_date + 'T00:00:00');
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + matchedPlan.duration_days);
      const startFmt = startDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      const endFmt = endDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      validThru = `${startFmt} - ${endFmt}`;
    } else if (txn.type === 'Refund' || txn.type === 'Other') {
      validThru = 'N/A';
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

  const filteredTxns = transactions.filter(txn => {
    const memberName = txn.member ? `${txn.member.first_name} ${txn.member.last_name}` : 'Walk-in Guest';
    const matchesSearch = memberName.toLowerCase().includes(searchTerm.toLowerCase()) || txn.transaction_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || txn.type === filterType;
    return matchesSearch && matchesType;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const totalPages = Math.ceil(filteredTxns.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTxns = filteredTxns.slice(indexOfFirstItem, indexOfLastItem);

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

  const totalIncome = transactions.filter(t => Number(t.amount) > 0 && t.status === 'Complete').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalRefunds = transactions.filter(t => t.type === 'Refund').reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
  const netRevenue = totalIncome - totalRefunds;
  const pendingAmount = transactions.filter(t => t.status === 'Pending').reduce((sum, t) => sum + Number(t.amount), 0);

  const getStatusBadge = (status) => {
    const base = "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-solid shadow-sm";
    switch (status) {
      case 'Complete': return `${base} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`;
      case 'Pending': return `${base} bg-amber-50 text-amber-700 border-amber-500 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/50`;
      case 'Refunded': return `${base} bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500`;
      case 'Failed': return `${base} bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50`;
      default: return `${base} bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500`;
    }
  };

  const getMethodBadge = (method) => {
    const base = "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-solid shadow-sm";
    if (method.toLowerCase() === 'gcash') return `${base} bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50`;
    if (method.toLowerCase() === 'cash') return `${base} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`;
    return `${base} bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500`;
  };

  const StatCard = ({ title, value, icon, colorClass }) => (
    <div className="bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1 hover:shadow-md duration-200">
      <div className={`p-4 rounded-xl flex items-center justify-center ${colorClass}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-normal text-slate-900 dark:text-gray-300 mt-1">{value}</h3>
      </div>
    </div>
  );

  const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2";
  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";
  const exportButtonClass = "flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-gray-300 dark:hover:bg-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
    <>
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 15mm; }
          html, body { background-color: white !important; -webkit-print-color-adjust: exact; }
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; margin: 0; background: white; color: black; }
        `}
      </style>

      <div className="p-6 max-w-7xl mx-auto space-y-6 print:p-0 print:m-0 animate-in fade-in duration-300">
        
        <div id="printable-report" className="hidden print:block bg-white text-black font-sans w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black uppercase tracking-widest mb-1">
              Double Alpha Fitness Transaction Records
            </h1>
            <p className="text-sm font-bold text-gray-600">
              Generated on: {new Date().toLocaleDateString()}
            </p>
          </div>

          <table className="w-full border-collapse border-2 border-black mb-8 text-center">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-black">
                <th className="py-2 text-sm font-bold uppercase tracking-widest border-r-2 border-black">Total Income</th>
                <th className="py-2 text-sm font-bold uppercase tracking-widest border-r-2 border-black">Refunds</th>
                <th className="py-2 text-sm font-bold uppercase tracking-widest border-r-2 border-black">Net Revenue</th>
                <th className="py-2 text-sm font-bold uppercase tracking-widest">Pending</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-4 text-2xl font-black border-r-2 border-black">â‚± {totalIncome.toLocaleString()}</td>
                <td className="py-4 text-2xl font-black border-r-2 border-black">â‚± {totalRefunds.toLocaleString()}</td>
                <td className="py-4 text-2xl font-black border-r-2 border-black">â‚± {netRevenue.toLocaleString()}</td>
                <td className="py-4 text-2xl font-black">â‚± {pendingAmount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse border-2 border-black text-center text-sm">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-black">
                <th className="py-2 font-bold uppercase tracking-widest border-r-2 border-black">TXN ID & DATE</th>
                <th className="py-2 font-bold uppercase tracking-widest border-r-2 border-black">MEMBER</th>
                <th className="py-2 font-bold uppercase tracking-widest border-r-2 border-black">DETAILS</th>
                <th className="py-2 font-bold uppercase tracking-widest border-r-2 border-black">METHOD</th>
                <th className="py-2 font-bold uppercase tracking-widest border-r-2 border-black">AMOUNT</th>
                <th className="py-2 font-bold uppercase tracking-widest">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxns.map((txn) => {
                const memberName = txn.member ? `${txn.member.first_name} ${txn.member.last_name}` : 'Walk-in Guest';
                const amtStr = Number(txn.amount) > 0 ? `â‚± ${Number(txn.amount).toLocaleString()}` : `-â‚± ${Math.abs(Number(txn.amount)).toLocaleString()}`;
                return (
                  <tr key={txn.id} className="border-b border-black last:border-0">
                    <td className="py-3 font-medium border-r-2 border-black">
                      <div className="font-bold">{txn.transaction_id}</div>
                      <div className="text-xs">{txn.transaction_date}</div>
                    </td>
                    <td className="py-3 font-medium border-r-2 border-black uppercase">{memberName}</td>
                    <td className="py-3 font-medium border-r-2 border-black uppercase">
                      <div className="font-bold">{txn.type}</div>
                      <div className="text-xs">{txn.description || '-'}</div>
                    </td>
                    <td className="py-3 font-medium border-r-2 border-black uppercase">{txn.payment_method}</td>
                    <td className="py-3 font-medium border-r-2 border-black uppercase">{amtStr}</td>
                    <td className="py-3 font-medium uppercase">{txn.status}</td>
                  </tr>
                );
              })}
              {filteredTxns.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 font-medium">
                    No matching records found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="print:hidden space-y-6">
          <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
            <button onClick={handleOpenAddModal} className={primaryButtonClass}>
              <FiPlus size={18} strokeWidth={3} /> Record Transaction
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Income" value={`\u20B1 ${totalIncome.toLocaleString()}`} icon={<FiTrendingUp size={28} strokeWidth={2.5} />} colorClass="bg-emerald-700 text-white shadow-lg shadow-emerald-700/40 dark:shadow-none" />
            <StatCard title="Refunds" value={`\u20B1 ${totalRefunds.toLocaleString()}`} icon={<FiTrendingDown size={28} strokeWidth={2.5} />} colorClass="bg-red-800 text-white shadow-lg shadow-red-700/40 dark:shadow-none" />
            <StatCard title="Net Revenue" value={`\u20B1 ${netRevenue.toLocaleString()}`} icon={<FiDollarSign size={28} strokeWidth={2.5} />} colorClass="bg-blue-800 text-white shadow-lg shadow-blue-700/40 dark:shadow-none" />
            <StatCard title="Pending" value={`\u20B1 ${pendingAmount.toLocaleString()}`} icon={<FiClock size={28} strokeWidth={2.5} />} colorClass="bg-amber-700 text-white shadow-lg shadow-amber-600/40 dark:shadow-none" />
          </div>

          <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#252830] p-5 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm items-center">
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
              <input type="text" placeholder="Search by ID or Member Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm" />
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full md:w-auto px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm">
                <option value="All">All Types</option>
                <option value="Subscription Payment">Subscription Payment</option>
                <option value="Fee">Fee (Walk-in)</option>
                <option value="Refund">Refund</option>
                <option value="Other">Other</option>
              </select>

              <button onClick={handleExportCSV} disabled={isExporting} className={exportButtonClass} title="Download table data to a spreadsheet">
                {isExporting ? <FiLoader className="animate-spin" size={18} /> : <FiDownload size={18} />}
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </button>
              
              <button onClick={() => window.print()} className={primaryButtonClass}>
                <FiPrinter size={18} /> Print All
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#252830] rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm overflow-hidden flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-center p-5 border-b-2 border-gray-300 dark:border-gray-600 gap-4 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 text-slate-800 dark:text-gray-300 font-bold text-sm tracking-wide">
                <FiList size={18} />
                <span>{filteredTxns.length} TOTAL TRANSACTIONS</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Txn ID & Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Member</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Details</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Method</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                  
                  {isLoading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-24 text-center">
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="relative w-16 h-16">
                              <div className="absolute inset-0 border-4 border-amber-200 dark:border-amber-900 rounded-full"></div>
                              <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <p className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest animate-pulse">Loading Database...</p>
                          </div>
                        </td>
                      </tr>
                    ) : currentTxns.length === 0 ? (
                    <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium">No transactions found.</td></tr>
                  ) : (
                    currentTxns.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-gray-300">{txn.transaction_id}</div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{txn.transaction_date}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-gray-300 whitespace-nowrap">
                        {txn.member ? `${txn.member.first_name} ${txn.member.last_name}` : <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500 italic"><FiUser size={14} /> Walk-in Guest</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-slate-800 dark:text-gray-300">{txn.type}</div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{txn.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getMethodBadge(txn.payment_method)}>{txn.payment_method}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`font-normal text-lg tracking-tight ${Number(txn.amount) > 0 ? 'text-slate-800 dark:text-gray-300' : 'text-red-500'}`}>
                          {Number(txn.amount) > 0 ? `\u20B1 ${Number(txn.amount).toLocaleString()}` : `-\u20B1 ${Math.abs(Number(txn.amount)).toLocaleString()}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(txn.status)}>{txn.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap space-x-3">
                        <button onClick={() => handlePrintReceipt(txn)} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-sm">
                          <FiPrinter size={16} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => handleOpenEditModal(txn)} disabled={deletingId === txn.id} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-amber-600 dark:text-amber-400 border-2 border-gray-300 dark:border-gray-600 hover:border-amber-50 dark:hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-sm disabled:opacity-50"><FiEdit2 size={16} strokeWidth={2.5} /></button>
                        <button onClick={() => handleDelete(txn.id)} disabled={deletingId === txn.id} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-red-600 dark:text-red-400 border-2 border-gray-300 dark:border-gray-600 hover:border-red-500 dark:hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-sm disabled:opacity-50">{deletingId === txn.id ? <FiLoader size={16} className="animate-spin" strokeWidth={2.5} /> : <FiTrash2 size={16} strokeWidth={2.5} />}</button>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>

            {/* --- ADDED BOTTOM PAGINATION HERE --- */}
            {totalPages > 1 && (
              <div className="p-4 border-t-2 border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTxns.length)} of {filteredTxns.length} Entries
                </span>
                <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1 border border-gray-300 dark:border-gray-600 shadow-inner">
                  <button onClick={goToPrevPage} disabled={currentPage === 1} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><FiChevronLeft size={18} /></button>
                  {generatePageNumbers()}
                  <button onClick={goToNextPage} disabled={currentPage === totalPages} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><FiChevronRight size={18} /></button>
                </div>
              </div>
            )}
            
          </div>

          {/* --- ADD / EDIT TRANSACTION MODAL --- */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                
                <div className="p-5 border-b-2 border-gray-300 dark:border-gray-600 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-gray-300">
                    {isEditing ? `Edit Transaction` : 'Record New Transaction'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} disabled={isSaving} className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"><FiX size={24} /></button>
                </div>
                
                <form onSubmit={handleSaveTransaction} className="flex flex-col max-h-[80vh]">
                  <div className="p-6 overflow-y-auto space-y-5">
                    
                    <div>
                      <label className={labelClass}>Member</label>
                      <select required={formData.member_id !== ''} value={formData.member_id} onChange={(e) => setFormData({...formData, member_id: e.target.value})} className={inputClass}>
                        <option value="">-- Select Member (Walk-in) --</option>
                        {membersList.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>Transaction Date</label>
                        <input type="date" required value={formData.transaction_date} onChange={(e) => setFormData({...formData, transaction_date: e.target.value})} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Transaction Type</label>
                        <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className={inputClass}>
                          <option>Subscription Payment</option>
                          <option>Fee</option>
                          <option>Refund</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>

                    {formData.type === 'Subscription Payment' && (
                      <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-xl border-2 border-amber-200 dark:border-amber-500/30 animate-in fade-in slide-in-from-top-2">
                        <label className={`${labelClass} text-amber-700 dark:text-amber-500`}><FiTag className="inline mr-1" /> Select Plan to Auto-Fill Price</label>
                        <select 
                          className={`${inputClass} border-amber-300 focus:ring-amber-600`}
                          onChange={(e) => handlePlanSelection(e.target.value)}
                        >
                          <option value="">-- Select a Database Plan --</option>
                          {plansList.map(p => <option key={p.id} value={p.name}>{p.name} (&#8369;{p.price})</option>)}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>Amount (&#8369;)</label>
                        <input type="number" step="0.01" required placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Status</label>
                        <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className={inputClass}>
                          <option>Complete</option>
                          <option>Pending</option>
                          <option>Failed</option>
                          <option>Refunded</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>Payment Method</label>
                        <select value={formData.payment_method} onChange={(e) => setFormData({...formData, payment_method: e.target.value})} className={inputClass}>
                          <option>Cash</option>
                          <option>Gcash</option>
                          <option>Card</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Reference</label>
                        <input type="text" placeholder="e.g. GCash Ref / Receipt No." value={formData.reference_number} onChange={(e) => setFormData({...formData, reference_number: e.target.value})} className={inputClass} />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Description / Notes</label>
                      <input type="text" placeholder="Brief details about the transaction" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className={inputClass} />
                    </div>

                  </div>
                  
                  <div className="p-5 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 uppercase tracking-wide text-sm">Cancel</button>
                    <button type="submit" disabled={isSaving} className={primaryButtonClass}>
                      {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
                      {isSaving ? 'Processing...' : (isEditing ? 'Save Changes' : 'Record Transaction')}
                    </button>
                  </div>
                </form>
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
      </div>
    </>
  );
}