import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTransactions } from '../features/transactions/hooks/useTransactions';
import TransactionStats from '../features/transactions/components/TransactionStats';
import TransactionTable from '../features/transactions/components/TransactionTable';
import PrintableTransactionReport from '../features/transactions/components/PrintableTransactionReport';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AlertDialog from '../components/ui/AlertDialog';

export default function Transactions() {
  const location = useLocation();
  const {
    transactions,
    isLoading,
    searchTerm, setSearchTerm,
    filterType, setFilterType,
    datePreset, setDatePreset,
    customStart, setCustomStart,
    customEnd, setCustomEnd,
    dateRange,
    isExporting,
    refundingId,
    confirmDialog, setConfirmDialog,
    alertDialog, setAlertDialog,
    filteredTxns,
    totalIncome,
    totalRefunds,
    netRevenue,
    handleRefundTransaction,
    handleExportCSV,
    handlePrintReceipt
  } = useTransactions();

  React.useEffect(() => {
    if (location.state?.searchTerm) setSearchTerm(location.state.searchTerm);
  }, [location.key, location.state, setSearchTerm]);

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-5 p-6 print:m-0 print:p-0 lg:space-y-6">

        {/* Printable Report View (Visible only during window.print()) */}
        <PrintableTransactionReport
          filteredTxns={filteredTxns}
          filterType={filterType}
          searchTerm={searchTerm}
          dateLabel={dateRange.label}
        />

        {/* Regular UI (Hidden during window.print()) */}
        <div className="space-y-5 print:hidden lg:space-y-6">
          <TransactionStats
            totalIncome={totalIncome}
            totalRefunds={totalRefunds}
            netRevenue={netRevenue}
          />

          <TransactionTable
            transactions={filteredTxns}
            totalCount={transactions.length}
            isLoading={isLoading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterType={filterType}
            setFilterType={setFilterType}
            datePreset={datePreset}
            setDatePreset={setDatePreset}
            customStart={customStart}
            setCustomStart={setCustomStart}
            customEnd={customEnd}
            setCustomEnd={setCustomEnd}
            dateRange={dateRange}
            isExporting={isExporting}
            refundingId={refundingId}
            onRefundTransaction={handleRefundTransaction}
            onExportCSV={handleExportCSV}
            onPrintReceipt={handlePrintReceipt}
          />

          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            title={confirmDialog.title}
            message={confirmDialog.message}
            onConfirm={confirmDialog.onConfirm}
            onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            confirmText="Confirm"
            isDanger={true}
          />

          <AlertDialog
            isOpen={alertDialog.isOpen}
            title={alertDialog.title}
            message={alertDialog.message}
            type={alertDialog.type}
            onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
          />
        </div>
      </div>
    </>
  );
}