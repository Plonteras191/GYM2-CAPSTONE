import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTransactions } from '../features/transactions/hooks/useTransactions';
import TransactionStats from '../features/transactions/components/TransactionStats';
import TransactionTable from '../features/transactions/components/TransactionTable';
import TransactionFormModal from '../features/transactions/components/TransactionFormModal';
import PrintableTransactionReport from '../features/transactions/components/PrintableTransactionReport';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AlertDialog from '../components/ui/AlertDialog';

export default function Transactions() {
  const location = useLocation();
  const {
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
    pendingAmount,
    handlePlanSelection,
    handleOpenAddModal,
    handleRefundTransaction,
    handleSaveTransaction,
    handleExportCSV,
    handlePrintReceipt
  } = useTransactions();

  React.useEffect(() => {
    if (location.state?.searchTerm) setSearchTerm(location.state.searchTerm);
  }, [location.key, location.state, setSearchTerm]);

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto space-y-6 print:p-0 print:m-0 animate-in fade-in duration-300">
        
        {/* Printable Report View (Visible only during window.print()) */}
        <PrintableTransactionReport
          filteredTxns={filteredTxns}
          filterType={filterType}
          searchTerm={searchTerm}
        />

        {/* Regular UI (Hidden during window.print()) */}
        <div className="print:hidden space-y-6">
          <TransactionStats
            totalIncome={totalIncome}
            totalRefunds={totalRefunds}
            netRevenue={netRevenue}
            pendingAmount={pendingAmount}
          />

          <TransactionTable
            transactions={filteredTxns}
            isLoading={isLoading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterType={filterType}
            setFilterType={setFilterType}
            isExporting={isExporting}
            refundingId={refundingId}
            onAddTransaction={handleOpenAddModal}
            onRefundTransaction={handleRefundTransaction}
            onExportCSV={handleExportCSV}
            onPrintReceipt={handlePrintReceipt}
          />

          <TransactionFormModal
            isOpen={isModalOpen}
            isSaving={isSaving}
            formData={formData}
            setFormData={setFormData}
            membersList={membersList}
            plansList={plansList}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveTransaction}
            onPlanSelection={handlePlanSelection}
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