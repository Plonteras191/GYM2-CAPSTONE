import { useState, useEffect, useCallback } from 'react';
import { 
  FiCalendar, FiDownload, FiPrinter, FiFileText, 
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiClock, FiActivity, FiLoader
} from 'react-icons/fi';
import api from '../api';
import { useLocation } from 'react-router-dom'; // FIXED TYPO: Must be react-router-dom!

export default function Reports() {
  const location = useLocation();
  const [reportType, setReportType] = useState(location.state?.defaultTab || 'Payments');
  
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(currentMonthStart); 
  const [endDate, setEndDate] = useState(today); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [reportData, setReportData] = useState(null);

  const fetchReports = useCallback(async () => {
    if (!reportData) setIsLoading(true);
    try {
      const res = await api.get(`/reports?start=${startDate}&end=${endDate}`);
      setReportData(res.data);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  // Auto-filters whenever the dates or report type changes!
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExportCSV = async () => {
    if (!reportData) return;
    setIsExporting(true);
    try {
      const currentData = reportData[reportType];
      const headers = currentData.columns.join(',');
      const rows = currentData.rows.map(row => row.join(',')).join('\n');
      const csvContent = `${headers}\n${rows}`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportType}_Report_${startDate}_to_${endDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export CSV:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => window.print();

  if (isLoading || !reportData) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4 animate-in fade-in">
        <FiLoader className="animate-spin text-amber-500 text-4xl" />
        <h2 className="text-xl font-bold text-slate-700 dark:text-gray-300">Crunching Numbers from Database...</h2>
      </div>
    );
  }

  const currentData = reportData[reportType];
  const filteredRows = currentData.rows.filter(row => 
    row.some(cell => String(cell).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- UNIFIED PILL BADGE SYSTEM ---
  const renderCellContent = (cell) => {
    const val = String(cell);
    const base = "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-solid shadow-sm print:border-none print:bg-transparent print:text-black print:p-0 print:shadow-none";
    
    if (val === 'Active' || val === 'Checked In' || val === 'Complete' || val === 'Cash') return <span className={`${base} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`}>{val}</span>;
    if (val === 'Expired' || val === 'Failed') return <span className={`${base} bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50`}>{val}</span>;
    if (val === 'Gcash' || val === 'Pending') return <span className={`${base} bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50`}>{val}</span>;
    if (val === 'Card' || val === 'Other') return <span className={`${base} bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500`}>{val}</span>;
    
    return val;
  };

  const inputClass = "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#1e1e1e] border-2 border-slate-300 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium shadow-sm transition-all outline-none";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2";
  const iconClass = "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-900 dark:text-gray-300 text-lg pointer-events-none";

  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";
  const secondaryButtonClass = "flex items-center justify-center gap-2 bg-white dark:bg-[#252830] border-2 border-slate-300 dark:border-slate-700/50 text-slate-700 dark:text-gray-300 px-6 py-2.5 rounded-xl font-bold shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
    <>
      <style type="text/css" media="print">
        {`
          @page { size: auto; margin: 0mm; }
          html, body { background-color: white !important; -webkit-print-color-adjust: exact; }
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; padding: 15mm; margin: 0; background: white; color: black; }
        `}
      </style>

      <div id="printable-report" className="p-6 max-w-7xl mx-auto space-y-6 print:p-0 print:m-0 animate-in fade-in duration-300">
        
        <div className="hidden print:block text-black border-b-2 border-black pb-4 mb-6">
          <h1 className="text-3xl font-black uppercase tracking-widest">Double Alpha Gym</h1>
          <h2 className="text-xl font-bold mt-1 text-slate-800">{reportType} Analytics Report</h2>
          <div className="flex justify-between mt-4 text-sm font-medium">
            <p>Reporting Period: <span className="font-bold">{startDate} to {endDate}</span></p>
            <p>Generated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4 print:hidden">
          <div className="flex gap-3 w-full md:w-auto ml-auto">
            <button onClick={handlePrint} className={secondaryButtonClass}><FiPrinter size={18} /> Print PDF</button>
            <button onClick={handleExportCSV} disabled={isExporting} className={primaryButtonClass}>
              {isExporting ? <FiLoader className="animate-spin" size={18} /> : <FiDownload size={18} />}
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#252830] p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row gap-6 items-end print:hidden">
          <div className="flex-1 w-full relative">
            <label className={labelClass}>Report Type</label>
            <div className="relative">
              <FiFileText className={iconClass} />
              <select value={reportType} onChange={(e) => setReportType(e.target.value)} className={inputClass}>
                <option value="Payments">Payment Transactions</option>
                <option value="Memberships">Membership Status</option>
                <option value="Attendance">Attendance & Entry Logs</option>
              </select>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <label className={labelClass}>Start Date</label>
            <div className="relative">
              <FiCalendar className={iconClass} />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <label className={labelClass}>End Date</label>
            <div className="relative">
              <FiCalendar className={iconClass} />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
            </div>
          </div>
          
          {/* THE NEW "RESET TO CURRENT" BUTTON */}
          <button 
            onClick={() => {
              setStartDate(currentMonthStart);
              setEndDate(today);
            }} 
            className={primaryButtonClass} 
            style={{ minWidth: '160px' }}
          >
            <FiClock size={18} />
            This Month
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4 print:mb-6">
          {currentData.kpis.map((kpi, index) => {
            
            let IconComponent = FiTrendingUp;
            let colorClass = "bg-emerald-700 text-white shadow-lg shadow-emerald-700/40 dark:shadow-none";
            
            const labelLower = kpi.label.toLowerCase();
            
            if (labelLower.includes('refund') || labelLower.includes('expire')) {
              IconComponent = FiTrendingDown;
              colorClass = "bg-red-800 text-white shadow-lg shadow-red-800/40 dark:shadow-none";
            } else if (labelLower.includes('transaction') || labelLower.includes('signup') || labelLower.includes('visits')) {
              IconComponent = labelLower.includes('transaction') ? FiDollarSign : FiActivity;
              colorClass = "bg-blue-800 text-white shadow-lg shadow-blue-800/40 dark:shadow-none";
            } else if (labelLower.includes('time') || labelLower.includes('pending')) {
              IconComponent = FiClock;
              colorClass = "bg-amber-600 text-white shadow-lg shadow-amber-600/40 dark:shadow-none";
            }

            return (
              <div 
                key={index} 
                className="bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1 hover:shadow-md duration-200 print:shadow-none print:border-slate-300 print:text-black"
              >
                <div className={`p-4 rounded-xl flex items-center justify-center print:hidden ${colorClass}`}>
                  <IconComponent size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest print:text-slate-800">
                    {kpi.label}
                  </p>
                  <h3 className="text-3xl font-normal text-slate-900 dark:text-gray-300 mt-1 print:text-black">
                    {kpi.value}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white dark:bg-[#252830] rounded-2xl border-2 border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden flex flex-col print:border-none print:shadow-none">
          <div className="p-5 border-b-2 border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-[#1e1e1e] print:hidden">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-800 dark:text-gray-300 text-lg">Recent Reports</h3>
            </div>
            <input type="text" placeholder={`Search ${reportType}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-64 px-4 py-2 text-sm font-medium bg-white dark:bg-[#252830] border-2 border-slate-300 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 transition-all shadow-sm" />
          </div>
          
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left border-collapse print:text-black">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-[#1a1c23] border-b-2 border-slate-200 dark:border-slate-700/50 print:bg-transparent print:border-b-2 print:border-black">
                  {currentData.columns.map((col, i) => (
                    <th key={i} className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 print:text-black">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 print:divide-slate-300">
                {filteredRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-slate-50 dark:hover:bg-[#1e1e1e] transition-colors group print:hover:bg-transparent">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap print:text-black">
                        {renderCellContent(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={currentData.columns.length} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-medium print:text-black">
                      No matching records found in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}