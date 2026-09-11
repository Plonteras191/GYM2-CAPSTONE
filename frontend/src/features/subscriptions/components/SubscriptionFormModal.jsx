import React from 'react';
import { FiX, FiTag, FiCheckCircle, FiSave, FiLoader } from 'react-icons/fi';

export default function SubscriptionFormModal({
  isOpen,
  isEditing,
  isSaving,
  formData,
  setFormData,
  membersList,
  plans,
  recentColors,
  loyalDiscount,
  calculatedPrice,
  onClose,
  onSave
}) {
  if (!isOpen) return null;

  const filteredDropdownPlans = plans.filter(p => !p.name.toLowerCase().includes('daily') && !p.name.toLowerCase().includes('walk'));
  const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-gray-300 font-medium transition-all shadow-sm";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2";
  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border-2 border-gray-300 dark:border-gray-600">
        <div className="p-5 border-b-2 border-gray-300 dark:border-gray-600 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
          <h3 className="text-xl font-bold text-black dark:text-gray-300">{isEditing ? 'Edit Subscription' : 'Add Subscription'}</h3>
          <button onClick={onClose} disabled={isSaving} className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
            <FiX size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white dark:bg-[#252830]">
          <form id="subForm" className="space-y-5" onSubmit={onSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="block">
                <span className={labelClass}>Select Member</span>
                <select 
                  required 
                  value={formData.member_id} 
                  onChange={(e) => setFormData({ ...formData, member_id: e.target.value })} 
                  className={inputClass}
                >
                  <option value="">-- Choose Member --</option>
                  {membersList.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className={labelClass}><FiTag className="inline mr-1" /> Custom Calendar Color</span>
                <div className="flex gap-2 mt-2 items-center">
                  <input 
                    type="color" 
                    value={formData.color} 
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })} 
                    className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600 bg-transparent p-1" 
                  />
                  <div className="flex flex-wrap gap-1.5 ml-2 border-l border-gray-300 dark:border-gray-600 pl-3">
                    {recentColors.map(c => (
                      <button 
                        type="button" 
                        key={c} 
                        onClick={() => setFormData({ ...formData, color: c })} 
                        className="w-6 h-6 rounded-full border border-gray-400 dark:border-gray-500 shadow-sm transition-transform hover:scale-110" 
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="block">
                <span className={labelClass}>Plan</span>
                <select 
                  required 
                  value={formData.plan_type} 
                  onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })} 
                  className={inputClass}
                >
                  <option value="">-- Select a Plan --</option>
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
            </div>
            
            {loyalDiscount > 0 && (
              <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400 p-3 rounded-lg flex items-center gap-2 text-sm font-bold">
                <FiCheckCircle size={18} />
                Loyal Client Detected! A &#8369;{loyalDiscount} discount has been applied. Final Auto-Billed Price: &#8369;{calculatedPrice}
              </div>
            )}
            
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  className="mt-1 w-full p-2.5 bg-gray-100 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium" 
                />
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 mt-4 p-5 border-2 border-gray-200 dark:border-gray-700/50 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={formData.status === 'Active'} 
                  onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'Active' : 'Expired' })} 
                  className="w-5 h-5 accent-amber-500 text-amber-500 bg-white border-gray-300 rounded focus:ring-amber-500" 
                />
                <span className="text-sm font-bold text-black dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">Set as Active</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={formData.auto_renew} 
                  onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })} 
                  className="w-5 h-5 accent-amber-500 text-amber-500 bg-white border-gray-300 rounded focus:ring-amber-500" 
                />
                <span className="text-sm font-bold text-black dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">Enable Auto-Renew</span>
              </label>
            </div>
            <label className="block">
              <span className={labelClass}>Notes (Optional)</span>
              <textarea 
                rows="2" 
                value={formData.notes} 
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                placeholder="Add any specific conditions..." 
                className={inputClass}
              />
            </label>
          </form>
        </div>
        <div className="p-5 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose} 
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
  );
}
