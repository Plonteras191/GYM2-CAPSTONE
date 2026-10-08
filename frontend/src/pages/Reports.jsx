import { useState, useEffect, useCallback } from 'react';
import {
  FiCalendar, FiDownload, FiPrinter, FiFileText,
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiClock, FiActivity, FiLoader,
  FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import api from '../api';
import { useLocation } from 'react-router-dom';
import { useDataCache } from '../context/DataCacheContext';

export default function Reports() {
  const { getCache, setCache } = useDataCache();
  const location = useLocation();
  const [reportType, setReportType] = useState(location.state?.defaultTab || 'Payments');

  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(currentMonthStart);
  const [endDate, setEndDate] = useState(today);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isExporting, setIsExporting] = useState(false);

  // Cache key includes date range so changing dates correctly re-fetches
  const cacheKey = `reports_${startDate}_${endDate}`;
  const [isLoading, setIsLoading] = useState(!getCache(cacheKey));
  const [reportData, setReportData] = useState(() => getCache(cacheKey));

  const fetchReports = useCallback(async () => {
    const cached = getCache(cacheKey);
    if (!cached) setIsLoading(true);
    try {
      const res = await api.get(`/reports?start=${startDate}&end=${endDate}`);
      setReportData(res.data);
      setCache(cacheKey, res.data);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, cacheKey, getCache, setCache]);

  useEffect(() => {
    // Check if the cached version for this date range exists
    const cached = getCache(cacheKey);
    if (cached) {
      setReportData(cached);
      setIsLoading(false);
    }
    fetchReports();
  }, [fetchReports, cacheKey, getCache]);

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

  const currentData = reportData?.[reportType];
  const filteredRows = currentData?.rows.filter(row =>
    row.some(cell => String(cell).toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const pageRows = filteredRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = currentPage * itemsPerPage;

  const generatePageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 rounded-md font-semibold shadow-sm transition-colors ${currentPage === i ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 hover:text-slate-900 font-medium text-slate-500 dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-white'}`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [reportType, searchTerm, startDate, endDate]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (isLoading || !reportData) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4 animate-in fade-in">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-amber-200 dark:border-amber-900 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-bold text-slate-700 dark:text-gray-300 animate-pulse mt-4">Crunching Numbers from Database...</h2>
      </div>
    );
  }

  const renderCellContent = (cell) => {
    const val = String(cell);
    const base = "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-solid shadow-sm";

    if (val === 'Active' || val === 'Checked In' || val === 'Complete' || val === 'Cash') return <span className={`${base} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`}>{val}</span>;
    if (val === 'Expired' || val === 'Failed') return <span className={`${base} bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50`}>{val}</span>;
    if (val === 'Gcash' || val === 'Pending') return <span className={`${base} bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50`}>{val}</span>;
    if (val === 'Card' || val === 'Other') return <span className={`${base} bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500`}>{val}</span>;

    return val;
  };

  const inputClass = "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#191b22] border-2 border-slate-300 dark:border-[#393e4f] rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-gray-100 font-medium shadow-sm transition-all outline-none";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2";
  const iconClass = "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-900 dark:text-gray-300 text-lg pointer-events-none";
  const primaryButtonClass = "mx-1 flex min-h-[38px] items-center justify-center gap-2 rounded-lg border-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-3.5 py-2 font-sans text-[15px] font-bold normal-case text-black shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";
  const exportButtonClass = "mx-1 flex min-h-[38px] items-center justify-center gap-2 rounded-lg border-0 bg-black px-3.5 py-2 font-sans text-[15px] font-bold normal-case text-gray-300 shadow-sm transition-colors hover:bg-gray-900 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed dark:bg-gray-300 dark:text-black dark:hover:bg-gray-200";

  return (
    <>
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 12mm 14mm; }
          html, body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: fixed; inset: 0; width: 100%; padding: 0; margin: 0; background: white; color: #000; font-family: 'Arial', sans-serif; }
        `}
      </style>

      {/* ── PRINTABLE REPORT (only visible during window.print()) ── */}
      <div id="printable-report" className="hidden print:block bg-white text-black w-full text-sm">

        {/* Header / Letterhead */}
        <div style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Double Alpha Fitness Gym
              </div>
              <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                Tagoloan, Misamis Oriental &nbsp;|&nbsp; 0991 448 9942
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '11px', color: '#555' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#000', textTransform: 'uppercase' }}>
                {reportType} Report
              </div>
              <div>Period: {startDate} &mdash; {endDate}</div>
              <div>Printed: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
            </div>
          </div>
        </div>

        {/* KPI Summary Row */}
        <div style={{ display: 'flex', gap: '0', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '14px', overflow: 'hidden' }}>
          {currentData.kpis.map((kpi, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRight: idx !== currentData.kpis.length - 1 ? '1px solid #ccc' : 'none',
                backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#fff'
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', marginTop: '2px', color: '#000' }}>
                {kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Data Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ borderTop: '2px solid #000', borderBottom: '1px solid #000', backgroundColor: '#f3f3f3' }}>
              {currentData.columns.map((col, idx) => (
                <th key={idx} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.5px', color: '#333' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, rowIndex) => (
              <tr key={rowIndex} style={{ borderBottom: '1px solid #e0e0e0', backgroundColor: rowIndex % 2 === 0 ? '#fff' : '#fafafa' }}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} style={{ padding: '5px 10px', color: '#111' }}>
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={currentData.columns.length} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                  No records found for this period.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={currentData.columns.length} style={{ borderTop: '2px solid #000', paddingTop: '6px', fontSize: '9px', color: '#888', textAlign: 'right' }}>
                Total records: {filteredRows.length} &nbsp;&nbsp; Generated by Double Alpha Fitness Gym Management System
              </td>
            </tr>
          </tfoot>
        </table>

      </div>

      {/* Regular UI (hidden during print) */}
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="print:hidden flex flex-col gap-6">
          <div className="order-3 bg-white dark:bg-[#252833] p-4 sm:p-6 rounded-2xl border-2 border-slate-200 dark:border-[#393e4f] shadow-sm grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] gap-3 sm:gap-4 items-end lg:order-none">
            <div className="w-full min-w-0 relative min-[400px]:col-span-2 lg:col-span-1">
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
            <div className="w-full min-w-0 relative">
              <label className={labelClass}>Start Date</label>
              <div className="relative">
                <FiCalendar className={iconClass} />
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`${inputClass} text-[13px] sm:text-sm`} />
              </div>
            </div>
            <div className="w-full min-w-0 relative">
              <label className={labelClass}>End Date</label>
              <div className="relative">
                <FiCalendar className={iconClass} />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`${inputClass} text-[13px] sm:text-sm`} />
              </div>
            </div>
            <div className="col-span-full flex w-full min-w-0 gap-0 sm:gap-1 lg:col-span-2 lg:col-start-4 lg:justify-end">
              <button
                onClick={() => {
                  setStartDate(currentMonthStart);
                  setEndDate(today);
                }}
                className={`${primaryButtonClass} min-w-0 flex-1 whitespace-nowrap lg:flex-none`}
              >
                <FiClock size={16} /> This Month
              </button>
              <button
                onClick={handleExportCSV}
                disabled={isExporting}
                className={`${exportButtonClass} min-w-0 flex-1 whitespace-nowrap lg:flex-none`}
              >
                {isExporting ? <FiLoader className="animate-spin" size={18} /> : <FiDownload size={18} />}
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </button>
              <button onClick={handlePrint} className={`${primaryButtonClass} min-w-0 flex-1 whitespace-nowrap lg:flex-none`}>
                <FiPrinter size={18} /> Print All
              </button>
            </div>
          </div>

          {/* DYNAMIC GRID: Switches between 3 and 4 columns automatically */}
          <div className={`order-first grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 sm:gap-6 ${currentData.kpis.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}>
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
                <div key={index} className="grid min-h-24 grid-cols-[44px_minmax(0,1fr)] items-center gap-x-3 bg-white dark:bg-[#252833] p-3 sm:min-h-0 sm:p-6 rounded-xl border-2 border-gray-300 dark:border-[#393e4f] shadow-sm sm:flex sm:gap-5 transition-transform hover:-translate-y-1 hover:shadow-md duration-200">
                  <div className={`h-11 w-11 rounded-lg p-2 sm:h-auto sm:w-auto sm:rounded-xl sm:p-4 flex items-center justify-center ${colorClass}`}>
                    <IconComponent size={28} strokeWidth={2.5} />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1 sm:flex-1">
                    <p className="max-w-full break-words text-left text-[10px] leading-tight sm:text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-normal sm:tracking-widest">{kpi.label}</p>
                    <h3 className="text-lg leading-tight sm:text-3xl font-normal text-slate-900 dark:text-gray-300 mt-0 sm:mt-1 break-words">{kpi.value}</h3>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="order-5 bg-white dark:bg-[#252833] rounded-2xl border-2 border-slate-200 dark:border-[#393e4f] shadow-sm overflow-hidden flex flex-col lg:order-none">
            <div className="p-4 sm:p-5 border-b-2 border-slate-200 dark:border-[#393e4f] flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 bg-slate-50 dark:bg-[#191b22]">
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <h3 className="font-bold text-slate-800 dark:text-gray-300 text-base sm:text-lg">Recent Reports</h3>
              </div>
              <input 
                type="text" 
                placeholder={`Search ${reportType}...`} 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full sm:w-64 px-4 py-2 text-sm font-medium bg-white dark:bg-[#191b22] border-2 border-slate-300 dark:border-[#393e4f] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-gray-100 transition-all shadow-sm" 
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px] lg:min-w-full">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-[#191b22] border-b-2 border-slate-200 dark:border-[#393e4f]">
                    {currentData.columns.map((col, i) => (
                      <th key={i} className="px-3.5 sm:px-4 lg:px-6 py-3 sm:py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#393e4f]">
                  {pageRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-slate-50 dark:hover:bg-[#191b22]/50 transition-colors group">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-3.5 sm:px-4 lg:px-6 py-3 sm:py-3.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                          {renderCellContent(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={currentData.columns.length} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                        No matching records found in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="p-4 border-t-2 border-slate-200 dark:border-[#393e4f] bg-slate-50 dark:bg-[#191b22] flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRows.length)} of {filteredRows.length} Entries
                </span>
                <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1 border border-gray-300 dark:border-gray-600 shadow-inner">
                  <button onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1} className="p-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <FiChevronLeft size={18} />
                  </button>
                  {generatePageNumbers()}
                  <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages} className="p-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <FiChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}