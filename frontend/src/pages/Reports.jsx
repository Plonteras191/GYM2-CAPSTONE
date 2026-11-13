import { useState, useEffect, useCallback, useRef } from 'react';
import { FiDownload, FiPrinter, FiList, FiClock, FiRefreshCw, FiFileText } from 'react-icons/fi';
import api from '../api';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import SearchInput from '../components/ui/SearchInput';
import TableShell, { Toolbar, TableEmpty, CardListEmpty, MobileCard } from '../components/ui/TableShell';
import { StatStrip, StatCell } from '../components/ui/StatStrip';
import { fieldClass, labelClass, thClass, tdClass } from '../components/ui/field';
import { useLocation } from 'react-router-dom';
import { useDataCache } from '../context/DataCacheContext';
import Pagination from '../components/ui/Pagination';
import { downloadCsv } from '../utils/csvExport';
import { getMediaUrl } from '../utils/mediaUrl';
import { getPaymentMethodLabel } from '../utils/paymentMethod';
import { useNavigate } from 'react-router-dom';
import { formatNumber } from '../utils/numberFormat';
import StyledSelect from '../components/ui/StyledSelect';

const reportTypeOptions = [
  { value: 'Payments', label: 'Payment Transactions' },
  { value: 'Memberships', label: 'Membership Status' },
  { value: 'Attendance', label: 'Attendance' },
];

export default function Reports() {
  const { getCache, setCache } = useDataCache();
  const location = useLocation();
  const navigate = useNavigate();
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
  const cacheKey = `reports_v3_${startDate}_${endDate}`;
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
        [currentData.columns, ...filteredRows.map(row => row.map(getReportCellText))]
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
  const getReportCellText = cell => {
    if (cell && typeof cell === 'object' && !Array.isArray(cell)) {
      if ('title' in cell || 'category' in cell) {
        return [cell.title, cell.category].filter(Boolean).join(' — ');
      }
      return [cell.name, cell.email].filter(Boolean).join(' — ');
    }
    return String(cell ?? '');
  };
  const isPaymentTransactionReport = reportType === 'Payments'
    && currentData?.columns[0] === 'Txn ID'
    && currentData?.columns[1] === 'Date';
  const reportDisplayColumns = currentData
    ? isPaymentTransactionReport
      ? ['Txn ID & Date', ...currentData.columns.slice(2)]
      : currentData.columns
    : [];
  const getDisplayRow = row => isPaymentTransactionReport
    ? [[row[0], row[1]], ...row.slice(2).map(value => [value])]
    : row.map(value => [value]);
  const reportColumnWeights = reportDisplayColumns.map(column => {
    const name = column.toLowerCase();
    if (name.includes('detail') || name.includes('description') || name.includes('plan')) return 2;
    if (name.includes('member') || name.includes('name')) return 1.5;
    if (name.includes('date') || name.includes('amount') || name.includes('revenue')) return 1.1;
    return 1;
  }) || [];
  const reportColumnWeightTotal = reportColumnWeights.reduce((total, weight) => total + weight, 0);
  const filteredRows = currentData?.rows.filter(row =>
    row.some(cell => getReportCellText(cell).toLowerCase().includes(searchTerm.toLowerCase()))
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
      <div className="animate-fade-in flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
        {isLoading ? (
          <>
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-line border-t-brand-gold" role="status" aria-label="Loading" />
            <p className="text-sm font-medium text-muted">Loading reports…</p>
          </>
        ) : (
          <>
            <p role="alert" className="text-center text-sm font-semibold text-negative">{loadError || 'Reports are unavailable.'}</p>
            <Button onClick={fetchReports} icon={<FiRefreshCw size={16} />}>Retry</Button>
          </>
        )}
      </div>
    );
  }

  const statusVariant = (val) => {
    const key = String(val ?? '').toLowerCase();
    if (key === 'active' || key === 'checked in' || key === 'complete' || key === 'cash') return 'success';
    if (key === 'expired' || key === 'failed' || key === 'refunded') return 'danger';
    if (key === 'gcash') return 'info';
    if (key === 'pending') return 'warning';
    if (key === 'maya' || key === 'other') return 'default';
    return null;
  };

  const renderCellContent = (cell, column, rowStatus) => {
    if (cell && typeof cell === 'object' && !Array.isArray(cell)) {
      if ('title' in cell || 'category' in cell) {
        return (
          <div className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink">{cell.title}</span>
            <span className="mt-0.5 block truncate text-xs text-muted">{cell.category || 'No additional details'}</span>
          </div>
        );
      }
      return (
        <button type="button" onClick={() => cell.id && navigate('/members', { state: { memberId: cell.id } })} className="flex min-w-0 items-center gap-3 rounded-lg text-left">
          <Avatar src={cell.profile_pic ? getMediaUrl(cell.profile_pic) : null} name={cell.name} />
          <div className="min-w-0">
            <span className={`block truncate font-semibold text-ink${cell.id ? ' link-draw' : ''}`}>{cell.name}</span>
            {cell.email && <span className="mt-0.5 block truncate text-xs text-muted">{cell.email}</span>}
          </div>
        </button>
      );
    }
    if (column?.toLowerCase().includes('amount') && typeof cell === 'number') {
      const isRefunded = rowStatus === 'Refunded' || cell < 0;
      return <span className={`font-display text-lg font-semibold tabular-nums ${isRefunded ? 'text-negative' : 'text-ink'}`}>{cell < 0 ? '-' : ''}₱ {formatNumber(Math.abs(cell))}</span>;
    }
    const val = getPaymentMethodLabel(cell);
    const variant = statusVariant(val);
    return variant ? <Badge variant={variant}>{val}</Badge> : val;
  };

  const kpiTone = (label) => {
    const key = label.toLowerCase();
    if (key.includes('refund') || key.includes('expire')) return 'crimson';
    if (key.includes('transaction') || key.includes('signup') || key.includes('visits')) return 'orange';
    if (key.includes('time') || key.includes('pending')) return 'slate';
    return 'gold';
  };

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
                <th key={idx} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '1px', color: '#333' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, rowIndex) => (
              <tr key={rowIndex} style={{ borderBottom: '1px solid #e0e0e0', backgroundColor: rowIndex % 2 === 0 ? '#fff' : '#fafafa' }}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} style={{ padding: '5px 10px', color: row[6] === 'Refunded' && (currentData.columns[cellIndex] === 'Amount' || currentData.columns[cellIndex] === 'Payment Status') ? '#b91c1c' : '#111' }}>
                    {cell && typeof cell === 'object' && !Array.isArray(cell) && ('title' in cell || 'category' in cell) ? (
                      <>
                        <div style={{ fontWeight: 'bold' }}>{cell.title}</div>
                        <div style={{ marginTop: '2px', fontWeight: '600', color: '#666' }}>{cell.category || 'No additional details'}</div>
                      </>
                    ) : cell && typeof cell === 'object' && !Array.isArray(cell) ? (
                      <>
                        <div style={{ fontWeight: '600' }}>{cell.name}</div>
                        {cell.email && <div style={{ marginTop: '2px', fontSize: '9px', color: '#666' }}>{cell.email}</div>}
                      </>
                    ) : currentData.columns[cellIndex] === 'Amount' && typeof cell === 'number'
                      ? `${cell < 0 ? '-' : ''}₱ ${formatNumber(Math.abs(cell))}`
                      : String(cell)}
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
      <div className="mx-auto max-w-7xl space-y-5 p-6 lg:space-y-6">
        <div className="flex flex-col gap-5 print:hidden lg:gap-6">
          {loadError && (
            <div role="alert" className="flex flex-col gap-3 rounded-xl border border-negative/30 bg-negative-soft p-4 text-sm text-negative sm:flex-row sm:items-center sm:justify-between">
              <span>{loadError} Showing the last available data.</span>
              <button type="button" onClick={fetchReports} disabled={isLoading} className="link-draw font-semibold disabled:opacity-50">
                {isLoading ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          )}

          {/* KPI summary first, matching the Overview page hierarchy. */}
          <StatStrip index={0} columns={currentData.kpis.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}>
            {currentData.kpis.map((kpi, index) => (
              <StatCell key={index} label={kpi.label} value={kpi.value} tone={kpiTone(kpi.label)} />
            ))}
          </StatStrip>

          <Toolbar index={1}>
            <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))_repeat(3,auto)]">
              <div className="min-w-0">
                <label className={labelClass}>Report Type</label>
                <StyledSelect value={reportType} onChange={event => setReportType(event.target.value)} aria-label="Report type" className={fieldClass}>
                  {reportTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </StyledSelect>
              </div>
              <div className="min-w-0">
                <label className={labelClass}>Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={fieldClass} />
              </div>
              <div className="min-w-0">
                <label className={labelClass}>End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={fieldClass} />
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setStartDate(today);
                  setEndDate(today);
                }}
                aria-pressed={isTodaySelected}
                icon={<FiClock size={16} />}
                className={`w-full whitespace-nowrap ${isTodaySelected ? 'border-focus bg-warn-soft text-ink' : ''}`}
              >
                This Day
              </Button>
              <Button variant="outline" onClick={handleExportCSV} disabled={isExporting || !reportData} isLoading={isExporting} icon={<FiDownload size={16} />} className="w-full whitespace-nowrap">
                {isExporting ? 'Exporting…' : 'Export CSV'}
              </Button>
              <Button onClick={handlePrint} icon={<FiPrinter size={16} />} className="w-full whitespace-nowrap">
                Print All
              </Button>
              {exportError && <p role="alert" className="text-sm font-semibold text-negative sm:col-span-2 lg:col-span-3 xl:col-span-6">{exportError}</p>}
            </div>
          </Toolbar>

          <TableShell
            index={2}
            title="Total Reports"
            icon={FiList}
            count={filteredRows.length}
            action={
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
                placeholder={`Search ${reportType}…`}
                containerClassName="relative w-full sm:w-64"
                className="min-h-10 py-2 text-sm"
              />
            }
          >
            <div className="hidden overflow-hidden xl:block">
              <table className="w-full min-w-0 table-fixed border-collapse text-left align-middle">
                <colgroup>
                  {reportColumnWeights.map((weight, index) => (
                    <col key={reportDisplayColumns[index]} style={{ width: `${(weight / reportColumnWeightTotal) * 100}%` }} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="border-b border-line">
                    {reportDisplayColumns.map((col, i) => (
                      <th key={i} className={`${thClass} overflow-hidden${col.toLowerCase().includes('status') ? ' text-center' : col.toLowerCase().includes('amount') ? ' text-right' : ' text-left'}`}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pageRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="rise transition-colors hover:bg-hover" style={{ '--i': Math.min(rowIndex, 8) * 0.5 + 2 }}>
                      {getDisplayRow(row).map((values, cellIndex) => {
                        const column = reportDisplayColumns[cellIndex].toLowerCase();
                        return (
                          <td key={cellIndex} className={`${tdClass} overflow-hidden${column.includes('status') ? ' text-center' : column.includes('amount') ? ' text-right' : ' text-left'}`}>
                            {values.length === 2 ? (
                              <>
                                <div className="truncate font-semibold text-ink">{values[0]}</div>
                                <div className="mt-0.5 truncate text-xs text-muted">{values[1]}</div>
                              </>
                            ) : (
                              <div className="min-w-0">{renderCellContent(values[0], reportDisplayColumns[cellIndex], row[6])}</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <TableEmpty colSpan={reportDisplayColumns.length} icon={FiFileText}>No matching records found in the database.</TableEmpty>
                  )}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 p-3 xl:hidden">
              {pageRows.map((row, rowIndex) => (
                <MobileCard key={rowIndex} index={rowIndex}>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                    {getDisplayRow(row).map((values, cellIndex) => {
                      const column = reportDisplayColumns[cellIndex];
                      const isStatus = column.toLowerCase().includes('status');
                      return (
                        <div key={column} className="min-w-0">
                          <dt className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{column}</dt>
                          <dd className={`break-words text-sm text-ink-2${isStatus ? ' flex justify-start' : ''}`}>
                            {values.length === 2 ? (
                              <>
                                <span className="block font-semibold text-ink">{values[0]}</span>
                                <span className="mt-0.5 block text-xs text-muted">{values[1]}</span>
                              </>
                            ) : renderCellContent(values[0], column, row[6])}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </MobileCard>
              ))}
              {filteredRows.length === 0 && (
                <CardListEmpty>No matching records found in the database.</CardListEmpty>
              )}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredRows.length}
              itemsPerPage={itemsPerPage}
            />
          </TableShell>
        </div>
      </div>
    </>
  );
}
