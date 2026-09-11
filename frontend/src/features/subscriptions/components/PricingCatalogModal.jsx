import React from 'react';
import { FiX, FiPlus, FiSave, FiTrash2, FiLoader } from 'react-icons/fi';

export default function PricingCatalogModal({
  isOpen,
  isAddingPlan,
  setIsAddingPlan,
  isSaving,
  plans,
  newPlan,
  setNewPlan,
  deletingPlanId,
  onClose,
  onUpdatePlanPrice,
  onSavePlans,
  onAddNewPlan,
  onDeletePlan
}) {
  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-gray-300 font-medium transition-all shadow-sm";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2";
  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600 flex flex-col max-h-[90vh]">
        
        <style>{`
          input[type='number']::-webkit-inner-spin-button,
          input[type='number']::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type='number'] {
            -moz-appearance: textfield;
          }
        `}</style>

        <div className="p-5 border-b-2 border-gray-300 dark:border-gray-600 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
          <h3 className="text-lg font-bold text-black dark:text-gray-300">Pricing Catalog</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <FiX size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-5 overflow-y-auto">
          {isAddingPlan ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border-2 border-dashed border-amber-400 dark:border-amber-500/50 flex flex-col gap-5 mb-2 animate-in fade-in slide-in-from-top-2 relative shadow-inner">
              <button 
                onClick={() => setIsAddingPlan(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full p-1.5 shadow-sm" 
                title="Cancel New Plan"
              >
                <FiX size={16} strokeWidth={3} />
              </button>
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 mb-1">
                <FiPlus className="stroke-[3px]" size={20} />
                <h4 className="font-bold text-sm uppercase tracking-wider text-black dark:text-gray-300">Create Custom Plan</h4>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className={labelClass}>Plan Name</span>
                  <input 
                    type="text" 
                    value={newPlan.name} 
                    onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} 
                    placeholder="e.g. Student Promo" 
                    className={inputClass} 
                  />
                </label>
                <div className="flex gap-4">
                  <label className="block w-1/2">
                    <span className={labelClass}>Duration (Days)</span>
                    <input 
                      type="number" 
                      value={newPlan.duration_days} 
                      onChange={e => setNewPlan({ ...newPlan, duration_days: e.target.value })} 
                      className={inputClass} 
                      placeholder="30" 
                    />
                  </label>
                  <label className="block w-1/2">
                    <span className={labelClass}>Price (&#8369;)</span>
                    <input 
                      type="number" 
                      value={newPlan.price} 
                      onChange={e => setNewPlan({ ...newPlan, price: e.target.value })} 
                      className={inputClass} 
                      placeholder="0.00" 
                    />
                  </label>
                </div>
              </div>
              <button onClick={onAddNewPlan} disabled={isSaving} className={primaryButtonClass + " mt-2 shadow-amber-500/30 w-full"}>
                {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
                {isSaving ? 'Creating...' : 'Save New Plan'}
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center mb-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-[65%]">
                Update current prices below, or create a brand new custom plan.
              </p>
              <button onClick={() => setIsAddingPlan(true)} className={primaryButtonClass + " !px-4 !py-2 !text-[11px] shadow-sm active:scale-95"}>
                <FiPlus size={16} strokeWidth={3} /> New Plan
              </button>
            </div>
          )}

          {plans.length === 0 && !isAddingPlan && (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
              <p className="text-gray-500 dark:text-gray-400 font-medium">No plans found in the database.</p>
              <p className="text-sm text-amber-600 dark:text-amber-500 font-bold mt-1 cursor-pointer hover:underline" onClick={() => setIsAddingPlan(true)}>
                Click 'New Plan' to create one!
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            {plans.map(plan => (
              <div key={plan.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 group transition-all hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-sm">
                <div className="flex flex-col">
                  <span className="font-bold text-black dark:text-gray-300">{plan.name}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-0.5">{plan.duration_days} Days</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-black dark:text-gray-300 font-bold text-lg px-2">&#8369;</span>
                  <input 
                    type="number" 
                    value={plan.price} 
                    onChange={(e) => onUpdatePlanPrice(plan.id, e.target.value)} 
                    className="w-24 px-3 py-2 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl text-right font-bold text-black dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" 
                  />
                  <button 
                    onClick={() => onDeletePlan(plan.id)} 
                    disabled={deletingPlanId === plan.id} 
                    title="Delete Plan" 
                    className="inline-flex items-center justify-center p-2 ml-2 bg-white dark:bg-[#252830] text-red-600 dark:text-red-400 border-2 border-gray-300 dark:border-gray-600 hover:border-red-50 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50"
                  >
                    {deletingPlanId === plan.id ? <FiLoader size={16} className="animate-spin" strokeWidth={2.5} /> : <FiTrash2 size={16} strokeWidth={2.5} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3 mt-auto">
          <button 
            onClick={onClose} 
            disabled={isSaving} 
            className="px-6 py-2.5 rounded-xl font-bold text-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 uppercase tracking-wide text-sm"
          >
            Close
          </button>
          <button onClick={onSavePlans} disabled={isSaving || plans.length === 0} className={primaryButtonClass}>
            {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
            {isSaving ? 'Saving...' : 'Save Updated Prices'}
          </button>
        </div>
      </div>
    </div>
  );
}
