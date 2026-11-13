import React from 'react';
import { FiX, FiTag, FiSave, FiLoader, FiPlus } from 'react-icons/fi';
import useUnsavedChangesGuard from '../../../components/ui/useUnsavedChangesGuard.jsx';
import SearchableMemberSelect from '../../../components/ui/SearchableMemberSelect.jsx';
import StyledSelect from '../../../components/ui/StyledSelect';
import { formatNumber } from '../../../utils/numberFormat';

export default function TransactionFormModal({
  isOpen,
  isSaving,
  formData,
  setFormData,
  onAmountChange,
  membersList,
  plansList,
  onClose,
  onSave,
  onPlanSelection
}) {
  const initialSnapshotRef = React.useRef('');
  React.useEffect(() => {
    if (isOpen) initialSnapshotRef.current = JSON.stringify(formData);
  }, [isOpen]);
  const unsavedChangesGuard = useUnsavedChangesGuard(
    isOpen && JSON.stringify(formData) !== initialSnapshotRef.current
  );
  const requestClose = () => unsavedChangesGuard.requestClose(onClose);

  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-2.5 bg-panel border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-focus/25 focus:border-focus dark:text-ink-2 font-medium transition-all shadow-sm";
  const labelClass = "block text-xs font-semibold uppercase tracking-[0.08em] text-muted mb-2";
  const primaryButtonClass = "mx-1 flex min-h-[38px] items-center justify-center gap-2 rounded-lg border-0 bg-brand-gold hover:bg-brand-gold-500 px-3.5 py-2 font-sans text-[15px] font-bold normal-case text-brand-dark shadow-sm transition-all  active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl dark:border-line dark:bg-panel">
        
        <div className="flex items-center justify-between border-b border-line bg-field px-4 py-3 dark:border-line dark:bg-hover">
          <h3 className="flex items-center gap-2 text-xl font-bold text-ink">
            <FiPlus size={20} /> Record New Transaction
          </h3>
          <button
            type="button"
            onClick={requestClose}
            disabled={isSaving}
            aria-label="Close transaction form"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-muted shadow-sm transition-colors hover:border-negative/40 hover:bg-negative-soft hover:text-negative disabled:opacity-50 dark:border-line dark:bg-panel dark:text-ink-2 dark:hover:bg-negative-soft"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={onSave} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto bg-hover p-4 dark:bg-field sm:p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Select Member</label>
              <SearchableMemberSelect
                required={formData.type !== 'Walk-In' && formData.type !== 'Packages'}
                members={membersList}
                value={formData.member_id}
                placeholder="Search Member Name"
                onChange={memberId => setFormData({ ...formData, member_id: memberId })}
              />
            </div>

            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className={labelClass}><FiTag className="inline mr-1" /> Select Packages</label>
              <StyledSelect
                required
                value={formData.package_id || ''}
                className={`${inputClass} ${formData.package_name ? '' : '!text-muted dark:!text-muted'}`}
                onChange={event => onPlanSelection(event.target.value)}
                aria-label="Select Packages"
              >
                <option value="" disabled>Select Packages</option>
                {plansList.map(plan => <option key={plan.id} value={plan.id}>{plan.name} (&#8369;{formatNumber(plan.price)})</option>)}
              </StyledSelect>
            </div>

            <div>
              <label className={labelClass}>Amount (&#8369;)</label>
              <input
                type="text"
                inputMode="decimal"
                maxLength={10}
                required
                aria-label="Amount"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => onAmountChange(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Payment Method</label>
              <StyledSelect
                required
                value={formData.payment_method || ''}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                aria-label="Payment Method"
                className={`${inputClass} ${formData.payment_method ? '' : '!text-muted dark:!text-muted'}`}
              >
                <option value="" disabled>Select Payment Method</option>
                <option>Cash</option>
                <option>Gcash</option>
                <option>Maya</option>
              </StyledSelect>
            </div>

            <div>
              <label className={labelClass}>Reference</label>
              <input
                type="text"
                placeholder="e.g. GCash Ref / Receipt No."
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                className={inputClass}
              />
            </div>

            </div>
          </div>
          
          <div className="flex justify-end gap-3 border-t border-line bg-field p-4 dark:border-line dark:bg-hover sm:p-5">
            <button 
              type="button" 
              onClick={requestClose}
              disabled={isSaving} 
              className="px-6 py-2.5 rounded-xl font-bold text-ink-2 hover:bg-hover transition-colors disabled:opacity-50 uppercase tracking-wide text-sm"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className={primaryButtonClass}>
              {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
              {isSaving ? 'Processing...' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
    {unsavedChangesGuard.dialog}
    </>
  );
}