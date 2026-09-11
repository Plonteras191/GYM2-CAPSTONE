import React from 'react';
import { FiX, FiTag, FiSave, FiLoader } from 'react-icons/fi';

export default function TransactionFormModal({
  isOpen,
  isEditing,
  isSaving,
  formData,
  setFormData,
  membersList,
  plansList,
  onClose,
  onSave,
  onPlanSelection
}) {
  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2";
  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border-2 border-gray-300 dark:border-gray-600">
        
        <div className="p-5 border-b-2 border-gray-300 dark:border-gray-600 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-gray-300">
            {isEditing ? 'Edit Transaction' : 'Record New Transaction'}
          </h3>
          <button onClick={onClose} disabled={isSaving} className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={onSave} className="flex flex-col max-h-[80vh]">
          <div className="p-6 overflow-y-auto space-y-5">
            
            <div>
              <label className={labelClass}>Member</label>
              <select 
                required={formData.member_id !== ''} 
                value={formData.member_id} 
                onChange={(e) => setFormData({ ...formData, member_id: e.target.value })} 
                className={inputClass}
              >
                <option value="">-- Select Member (Walk-in) --</option>
                {membersList.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Transaction Date</label>
                <input 
                  type="date" 
                  required 
                  value={formData.transaction_date} 
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })} 
                  className={inputClass} 
                />
              </div>
              <div>
                <label className={labelClass}>Transaction Type</label>
                <select 
                  value={formData.type} 
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })} 
                  className={inputClass}
                >
                  <option>Subscription Payment</option>
                  <option>Fee</option>
                  <option>Refund</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            {formData.type === 'Subscription Payment' && (
              <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-xl border-2 border-amber-200 dark:border-amber-500/30 animate-in fade-in slide-in-from-top-2">
                <label className={`${labelClass} text-amber-700 dark:text-amber-500`}><FiTag className="inline mr-1" /> Select Plan to Auto-Fill Price</label>
                <select 
                  className={`${inputClass} border-amber-300 focus:ring-amber-600`}
                  onChange={(e) => onPlanSelection(e.target.value)}
                >
                  <option value="">-- Select a Database Plan --</option>
                  {plansList.map(p => <option key={p.id} value={p.name}>{p.name} (&#8369;{p.price})</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                <label className={labelClass}>Status</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
                  className={inputClass}
                >
                  <option>Complete</option>
                  <option>Pending</option>
                  <option>Failed</option>
                  <option>Refunded</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
          
          <div className="p-5 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSaving} 
              className="px-6 py-2.5 rounded-xl font-bold text-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 uppercase tracking-wide text-sm"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className={primaryButtonClass}>
              {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
              {isSaving ? 'Processing...' : (isEditing ? 'Save Changes' : 'Record Transaction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
