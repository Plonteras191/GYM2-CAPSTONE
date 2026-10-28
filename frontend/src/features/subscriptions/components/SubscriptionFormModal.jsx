import React from 'react';
import { FiX, FiCheckCircle, FiSave, FiLoader, FiPlus, FiEdit2 } from 'react-icons/fi';
import useUnsavedChangesGuard from '../../../components/ui/useUnsavedChangesGuard.jsx';

export default function SubscriptionFormModal({
  isOpen,
  isEditing,
  isSaving,
  formData,
  setFormData,
  membersList,
  plans,
  loyalDiscount,
  calculatedPrice,
  onClose,
  onSave
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

  const filteredDropdownPlans = plans.filter(p =>
    p.category !== 'walk_in'
    && !p.name.toLowerCase().includes('daily')
    && !p.name.toLowerCase().includes('walk')
  );
  const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-gray-300 font-medium transition-all shadow-sm";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2";
  const primaryButtonClass = "mx-1 flex min-h-[38px] items-center justify-center gap-2 rounded-lg border-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-3.5 py-2 font-sans text-[15px] font-bold normal-case text-black shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border-2 border-gray-300 bg-white shadow-2xl dark:border-gray-600 dark:bg-[#252830]">
        <div className="flex items-center justify-between border-b-2 border-gray-300 bg-gray-50 px-4 py-3 dark:border-gray-600 dark:bg-gray-800">
          <h3 className="flex items-center gap-2 text-xl font-bold text-black dark:text-gray-300">
            {isEditing ? <FiEdit2 size={19} /> : <FiPlus size={20} />}
            {isEditing ? 'Edit Subscription' : 'Add Subscription'}
          </h3>
          <button
            type="button"
            onClick={requestClose}
            disabled={isSaving}
            aria-label="Close subscription form"
            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-gray-500 shadow-sm transition-colors hover:border-red-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:border-gray-600 dark:bg-[#252830] dark:text-gray-300 dark:hover:bg-red-500/10"
          >
            <FiX size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-100 p-4 dark:bg-[#191b22] sm:p-5">
          <form id="subForm" className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSave}>
              <label className="block">
                <span className={labelClass}>Select Member</span>
                <select 
                  required 
                  value={formData.member_id} 
                  onChange={(e) => setFormData({ ...formData, member_id: e.target.value })} 
                  className={inputClass}
                >
                  <option value="">Choose Member</option>
                  {membersList.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Subscription Type</span>
                <select 
                  required 
                  value={formData.plan_type} 
                  onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })} 
                  className={inputClass}
                >
                  <option value="">Select Subscription Type</option>
                  {filteredDropdownPlans.map(p => <option key={p.id} value={p.name}>{p.name} (&#8369;{p.price})</option>)}
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Payment Method</span>
                <select 
                  value={formData.payment_method} 
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} 
                  className={inputClass}
                >
                  <option value="Cash">Cash</option>
                  <option value="Gcash">Gcash</option>
                  <option value="Card">Card</option>
                </select>
              </label>
              <label className="block">
              <span className={labelClass}>Reference Number</span>
              <input 
                type="text" 
                value={formData.reference_number} 
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })} 
                className={inputClass} 
                placeholder="Receipt or Transaction #" 
              />
            </label>

            {loyalDiscount > 0 && (
              <div className="md:col-span-2 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400">
                <FiCheckCircle size={18} />
                Loyal Client Detected! A &#8369;{loyalDiscount} discount has been applied. Final Auto-Billed Price: &#8369;{calculatedPrice}
              </div>
            )}

              <label className="block">
                <span className={labelClass}>Start Date</span>
                <input 
                  type="date" 
                  required 
                  value={formData.start_date} 
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} 
                  className={inputClass} 
                />
              </label>
              <label className="block">
                <span className={labelClass}>Expiration Date (Auto-calculated)</span>
                <input 
                  type="date" 
                  value={formData.end_date} 
                  disabled 
                  className="mt-1 w-full p-2.5 bg-gray-100 dark:bg-gray-800/50 border-2 border-gray-300 dark:border-gray-700/50 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium" 
                />
              </label>
          </form>
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
          <button form="subForm" type="submit" disabled={isSaving} className={primaryButtonClass}>
            {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />} {isSaving ? 'Processing...' : (isEditing ? 'Save Changes' : 'Save Subscription')}
          </button>
        </div>
      </div>
    </div>
    {unsavedChangesGuard.dialog}
    </>
  );
}