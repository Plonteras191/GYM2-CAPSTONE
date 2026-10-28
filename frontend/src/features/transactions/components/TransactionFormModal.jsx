import React from 'react';
import { FiX, FiTag, FiSave, FiLoader, FiPlus } from 'react-icons/fi';
import useUnsavedChangesGuard from '../../../components/ui/useUnsavedChangesGuard.jsx';

export default function TransactionFormModal({
  isOpen,
  isSaving,
  formData,
  setFormData,
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

  const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2";
  const primaryButtonClass = "mx-1 flex min-h-[38px] items-center justify-center gap-2 rounded-lg border-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-3.5 py-2 font-sans text-[15px] font-bold normal-case text-black shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border-2 border-gray-300 bg-white shadow-2xl dark:border-gray-600 dark:bg-[#252830]">
        
        <div className="flex items-center justify-between border-b-2 border-gray-300 bg-gray-50 px-4 py-3 dark:border-gray-600 dark:bg-gray-800">
          <h3 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-gray-300">
            <FiPlus size={20} /> Record New Transaction
          </h3>
          <button
            type="button"
            onClick={requestClose}
            disabled={isSaving}
            aria-label="Close transaction form"
            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-gray-500 shadow-sm transition-colors hover:border-red-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:border-gray-600 dark:bg-[#252830] dark:text-gray-300 dark:hover:bg-red-500/10"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={onSave} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-4 dark:bg-[#191b22] sm:p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Select Member</label>
              <select 
                required={formData.type !== 'Walk-In' && formData.type !== 'Packages'}
                value={formData.member_id} 
                onChange={(e) => setFormData({ ...formData, member_id: e.target.value })} 
                className={inputClass}
              >
                <option value="">Select Member</option>
                {membersList.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
              </select>
            </div>

            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className={labelClass}><FiTag className="inline mr-1" /> Select Packages</label>
              <select
                required
                value={formData.package_name || ''}
                className={inputClass}
                onChange={event => onPlanSelection(event.target.value)}
              >
                <option value="">Select Packages</option>
                {plansList.map(plan => <option key={plan.id} value={plan.name}>{plan.name} (&#8369;{plan.price})</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Amount (&#8369;)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className={inputClass}
              >
                <option>Cash</option>
                <option>Gcash</option>
                <option>Card</option>
              </select>
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

            <div>
              <label className={labelClass}>Description / Notes</label>
              <input 
                type="text" 
                placeholder="Brief details about the transaction" 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                className={inputClass} 
              />
            </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 border-t-2 border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800 sm:p-5">
            <button 
              type="button" 
              onClick={requestClose}
              disabled={isSaving} 
              className="px-6 py-2.5 rounded-xl font-bold text-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 uppercase tracking-wide text-sm"
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