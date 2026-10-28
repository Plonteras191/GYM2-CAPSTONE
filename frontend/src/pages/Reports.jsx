import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiCalendar, FiDownload, FiPrinter, FiFileText, FiList,
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiClock, FiActivity, FiLoader,
} from 'react-icons/fi';
import api from '../api';
import { useLocation } from 'react-router-dom';
import { useDataCache } from '../context/DataCacheContext';
import Pagination from '../components/ui/Pagination';
import { downloadCsv } from '../utils/csvExport';

export default function Reports() {
  const { getCache, setCache } = useDataCache();
  const location = useLocation();
  const [reportType, setReportType] = useState(location.state?.defaultTab || 'Payments');

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const [startDate, setStartDate] = useState(currentMonthStart);
  const [endDate, setEndDate] = useState(today);
  const isTodaySelected = startDate === today && endDate === today;
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const cacheKey = `reports_${startDate}_${endDate}`;
  const [isLoading, setIsLoading] = useState(() => !getCache(cacheKey));
  const [loadError, setLoadError] = useState('');
  const requestId = useRef(0);

  // Cache key includes date range so changing dates correctly re-fetches
  const [reportData, setReportData] = useState(() => getCache(cacheKey));

  const fetchReports = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await api.get(`/reports?start=${startDate}&end=${endDate}`);
      if (currentRequestId === requestId.current) {
        setReportData(res.data);
        setCache(cacheKey, res.data);
      }
    } catch (error) {
      console.error("Failed to load reports:", error);
      if (currentRequestId === requestId.current) {
        setLoadError('Reports could not be loaded. Check your connection and try again.');
      }
    } finally {
      if (currentRequestId === requestId.current) setIsLoading(false);
    }
  }, [startDate, endDate, cacheKey, setCache]);

  useEffect(() => {
    const cached = getCache(cacheKey);
    if (cached) {
      setReportData(cached);
    } else {
      setReportData(null);
    }
    fetchReports();
    return () => {
      requestId.current += 1;
    };
  }, [fetchReports, cacheKey, getCache]);

  const handleExportCSV = async () => {
    if (!reportData) return;
    setIsExporting(true);
    setExportError('');
    try {
      const currentData = reportData[reportType];
      downloadCsv(
        `${reportType}_Report_${startDate}_to_${endDate}.csv`,
        [currentData.columns, ...filteredRows]
      );
    } catch (error) {
      console.error('Failed to export report CSV:', error);
      setExportError('The report CSV could not be created. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => window.print();

  const currentData = reportData?.[reportType];
  const reportColumnWeights = currentData?.columns.map(column => {
    const name = column.toLowerCase();
    if (name.includes('detail') || name.includes('description') || name.includes('plan')) return 2;
    if (name.includes('member') || name.includes('name')) return 1.5;
    if (name.includes('date') || name.includes('amount') || name.includes('revenue')) return 1.1;
    return 1;
  }) || [];
  const reportColumnWeightTotal = reportColumnWeights.reduce((total, weight) => total + weight, 0);
  const filteredRows = currentData?.rows.filter(row =>
    row.some(cell => String(cell).toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const pageRows = filteredRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [reportType, searchTerm, startDate, endDate]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (!reportData) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 animate-in fade-in">
        {isLoading ? (
          <>
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-amber-200 dark:border-amber-900" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            </div>
            <h2 className="mt-2 text-lg font-bold text-slate-700 dark:text-gray-300">Loading reports...</h2>
          </>
        ) : (
          <>
            <p role="alert" className="text-center font-semibold text-red-700 dark:text-red-400">{loadError || 'Reports are unavailable.'}</p>
            <button type="button" onClick={fetchReports} className="rounded-xl bg-amber-500 px-5 py-2.5 font-bold text-black shadow-sm hover:bg-amber-400">Retry</button>
          </>
        )}
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

  const inputClass = "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#1e1e1e] border-2 border-slate-300 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium shadow-sm transition-all outline-none";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2";
  const iconClass = "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-900 dark:text-gray-300 text-lg pointer-events-none";
  const primaryButtonClass = "flex min-h-[38px] items-center justify-center gap-2 whitespace-nowrap rounded-lg border-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-2 font-sans text-sm font-bold normal-case text-black shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70";
  const exportButtonClass = "flex min-h-[38px] items-center justify-center gap-2 whitespace-nowrap rounded-lg border-0 bg-black px-4 py-2 font-sans text-sm font-bold normal-case text-gray-300 shadow-sm transition-colors hover:bg-gray-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-gray-300 dark:text-black dark:hover:bg-gray-200";

  return (
    <>
      <style type="text/css" media="print">
        {`
          @page { size: A4 landscape; margin: 12mm; }
          html, body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: fixed; inset: 0; width: 100%; padding: 0; margin: 0; background: white; color: #000; font-family: 'Arial', sans-serif; }
          #printable-report thead { display: table-header-group; }
          #printable-report tr { break-inside: avoid; }
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
              <div style={{ fontSize: '10px', color: '#555', marginTop: '3px' }}>
                Summary covers the selected date range; rows include all matches for the current search.
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '11px', color: '#555' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#000', textTransform: 'uppercase' }}>
                {reportType} Report
              </div>
              <div>Period: {startDate} &mdash; {endDate}</div>
              {searchTerm && <div>Search: {searchTerm}</div>}
              <div>Matching records: {filteredRows.length.toLocaleString()}</div>
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
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ borderTop: '2px solid #000', borderBottom: '1px solid #000', backgroundColor: '#f3f3f3', breakInside: 'avoid' }}>
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
          {loadError && (
            <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between">
              <span>{loadError} Showing the last available data.</span>
              <button type="button" onClick={fetchReports} disabled={isLoading} className="font-bold underline disabled:opacity-50">
                {isLoading ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          )}
          <div className="order-2 grid grid-cols-1 items-end gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700/50 dark:bg-[#252830] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(0,1.5fr)_repeat(5,minmax(0,1fr))]">
            <div className="relative w-full min-w-0">
              <label className={labelClass}>Report Type</label>
              <div className="relative">
                <FiFileText className={iconClass} />
                <select value={reportType} onChange={(e) => setReportType(e.target.value)} className={`${inputClass} min-w-0`}>
                  <option value="Payments">Payment Transactions</option>
                  <option value="Memberships">Membership Status</option>
                  <option value="Attendance">Attendance & Entry Logs</option>
                </select>
              </div>
            </div>
            <div className="relative w-full min-w-0">
              <label className={labelClass}>Start Date</label>
              <div className="relative">
                <FiCalendar className={iconClass} />
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="relative w-full min-w-0">
              <label className={labelClass}>End Date</label>
              <div className="relative">
                <FiCalendar className={iconClass} />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
              </div>
            </div>

            <button
              onClick={() => {
                setStartDate(today);
                setEndDate(today);
              }}
              className={`${primaryButtonClass} w-full transition-opacity ${isTodaySelected ? 'opacity-50' : 'opacity-100'}`}
              aria-pressed={isTodaySelected}
              style={{ minWidth: '160px' }}
            >
              <FiClock size={18} />
              This Day
            </button>
            <button onClick={handleExportCSV} disabled={isExporting || !reportData} className={`${exportButtonClass} w-full min-w-0 px-2`}>
              {isExporting ? <FiLoader className="animate-spin" size={18} /> : <FiDownload size={18} />}
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button onClick={handlePrint} className={`${primaryButtonClass} w-full min-w-0 px-2`}>
              <FiPrinter size={18} /> Print All
            </button>
            {exportError && <p role="alert" className="text-sm font-semibold text-red-700 dark:text-red-400 sm:col-span-2 xl:col-span-6">{exportError}</p>}
          </div>

          {/* KPI summary appears first, matching the Overview page hierarchy. */}
          <div className={`order-1 grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 sm:gap-6 ${currentData.kpis.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}>
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
                <div key={index} className="grid min-h-24 grid-cols-[44px_minmax(0,1fr)] items-center gap-x-3 bg-white dark:bg-[#252830] p-3 sm:min-h-0 sm:p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm sm:flex sm:gap-5 transition-transform hover:-translate-y-1 hover:shadow-md duration-200">
                  <div className={`h-11 w-11 rounded-lg p-2 sm:h-auto sm:w-auto sm:rounded-xl sm:p-4 flex items-center justify-center ${colorClass}`}>
                    <IconComponent size={28} strokeWidth={2.5} />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1 sm:flex-1">
                    <p className="max-w-full break-words text-left text-[10px] leading-tight sm:text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-normal sm:tracking-widest">{kpi.label}</p>
                    <h3 className="text-lg leading-tight sm:text-2xl font-normal text-slate-900 dark:text-gray-300 mt-0 sm:mt-1 break-words">{kpi.value}</h3>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="order-3 bg-white dark:bg-[#252830] rounded-2xl border-2 border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden flex flex-col">
            <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-700/50 dark:bg-[#1e1e1e] sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center gap-2">
                <FiList size={18} className="shrink-0 text-slate-800 dark:text-gray-300" />
                <h3 className="min-w-0 truncate text-base font-bold tracking-wide text-slate-800 dark:text-gray-300">Recent Reports</h3>
                <span className="shrink-0 rounded-lg border-2 border-gray-300 bg-white px-2.5 py-1 text-sm font-semibold tabular-nums text-slate-700 dark:border-[#393e4f] dark:bg-[#252833] dark:text-gray-300">
                  {filteredRows.length.toLocaleString()}
                </span>
              </div>
              <input type="text" placeholder={`Search ${reportType}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-64 px-4 py-2 text-sm font-medium bg-white dark:bg-[#252830] border-2 border-slate-300 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 transition-all shadow-sm" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] table-fixed border-collapse text-left">
                <colgroup>
                  {reportColumnWeights.map((weight, index) => (
                    <col key={currentData.columns[index]} style={{ width: `${(weight / reportColumnWeightTotal) * 100}%` }} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-[#1a1c23] border-b-2 border-slate-200 dark:border-slate-700/50">
                    {currentData.columns.map((col, i) => (
                      <th key={i} className="overflow-hidden px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {pageRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-slate-50 dark:hover:bg-[#1e1e1e] transition-colors group">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="overflow-hidden px-4 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap text-ellipsis">
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
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredRows.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        </div>
      </div>
    </>
  );
}