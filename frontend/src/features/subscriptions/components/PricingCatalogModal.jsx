import React, { useEffect, useState } from 'react';
import { FiX, FiPlus, FiSave, FiTrash2, FiLoader, FiEdit2, FiEye, FiMoreVertical, FiSettings } from 'react-icons/fi';
import { sanitizePackagePrice } from '../../../utils/priceInput';
import useUnsavedChangesGuard from '../../../components/ui/useUnsavedChangesGuard.jsx';
import { getPackageColor, getPackageCategoryLabel } from '../packageCategories';

const planSnapshot = (plan) => ({
  id: plan.id,
  name: plan.name,
  price: String(plan.price),
  duration_days: String(plan.duration_days),
  category: plan.category || 'normal',
  category_detail: plan.category_detail || '',
  color: plan.color || getPackageColor(plan),
});

export default function PricingCatalogModal({
  isOpen,
  isAddingPlan,
  setIsAddingPlan,
  isSaving,
  plans,
  recentColors = [],
  newPlan,
  setNewPlan,
  deletingPlanId,
  onClose,
  onUpdatePlanPrice,
  onSavePlans,
  onSavePlan,
  onUseColor,
  onAddNewPlan,
  onDeletePlan
}) {
  const [editingPlan, setEditingPlan] = useState(null);
  const [viewingPlanId, setViewingPlanId] = useState(null);
  const [openActionsPlanId, setOpenActionsPlanId] = useState(null);
  const initialPlansRef = React.useRef([]);
  const initialNewPlanRef = React.useRef('');
  const currentCatalogRef = React.useRef({ plans, newPlan });
  currentCatalogRef.current = { plans, newPlan };
  useEffect(() => {
    if (isOpen) {
      initialPlansRef.current = currentCatalogRef.current.plans.map(plan => planSnapshot(plan));
      initialNewPlanRef.current = JSON.stringify(currentCatalogRef.current.newPlan);
    } else {
      setEditingPlan(null);
    }
  }, [isOpen]);

  const isPlanPriceDirty = plans.some(plan => {
    const original = initialPlansRef.current.find(item => item.id === plan.id);
    return original && JSON.stringify(planSnapshot(plan)) !== JSON.stringify(original);
  });
  const isNewPlanDirty = isAddingPlan && JSON.stringify(newPlan) !== initialNewPlanRef.current;
  const originalEditingPlan = editingPlan && initialPlansRef.current.find(plan => plan.id === editingPlan.id);
  const isEditingPlanDirty = Boolean(originalEditingPlan)
    && JSON.stringify(planSnapshot(editingPlan)) !== JSON.stringify(originalEditingPlan);
  const unsavedChangesGuard = useUnsavedChangesGuard(isOpen && (isPlanPriceDirty || isNewPlanDirty || isEditingPlanDirty));
  const editingPlanGuard = useUnsavedChangesGuard(isOpen && isEditingPlanDirty);
  const requestClose = () => unsavedChangesGuard.requestClose(onClose);

  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-gray-300 font-medium transition-all shadow-sm";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2";
  const catalogActionButtonClass = "mx-1 flex min-h-[38px] items-center justify-center gap-2 rounded-lg border-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-3.5 py-2 font-sans text-[15px] font-bold normal-case text-black shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";
  const handlePriceInput = (value, onChange) => {
    const sanitizedValue = sanitizePackagePrice(value);
    if (sanitizedValue !== null) onChange(sanitizedValue);
  };
  const categorySelect = (plan, setPlan) => (
    <select
      value={plan.category || 'normal'}
      onChange={event => setPlan({
        ...plan,
        category: event.target.value,
        category_detail: '',
      })}
      className={inputClass}
    >
      <option value="normal">Normal Subscription</option>
      <option value="with_coach">With Coach Subscription</option>
      <option value="walk_in">Walk-In</option>
    </select>
  );
  const recentColorButtons = (selectedColor, onSelect) => (
    recentColors.length > 0 && (
      <div className="flex flex-wrap items-center gap-2" aria-label="Recently used colors">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Recent</span>
        {recentColors.map(color => (
          <button
            key={color}
            type="button"
            onClick={() => {
              onSelect(color);
              onUseColor?.(color);
            }}
            aria-label={`Use recent color ${color}`}
            title={color}
            className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === color ? 'border-slate-900 ring-2 ring-amber-400 dark:border-white' : 'border-black/20 dark:border-white/30'}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    )
  );
  return (
    <>
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

        <div className="flex items-center justify-between border-b-2 border-gray-300 bg-gray-50 px-4 py-3 dark:border-gray-600 dark:bg-gray-800">
          <h3 className="flex items-center gap-2 text-lg font-bold text-black dark:text-gray-300">
            <FiSettings size={19} /> Manage Packages
          </h3>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close Manage Packages"
            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-gray-500 shadow-sm transition-colors hover:border-red-400 hover:bg-red-50 hover:text-red-500 dark:border-gray-600 dark:bg-[#252830] dark:text-gray-300 dark:hover:bg-red-500/10"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <div className="min-h-0 space-y-4 overflow-y-auto p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-gray-300 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
            <p className="min-w-0 text-xs font-medium leading-relaxed text-gray-500 dark:text-gray-400">
              Update existing packages or create a new subscription package.
            </p>
            <button onClick={() => setIsAddingPlan(true)} className={`${catalogActionButtonClass} w-auto shrink-0`}>
              <FiPlus size={16} strokeWidth={3} /> New Package
            </button>
          </div>

          {isAddingPlan && (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border-2 border-dashed border-amber-400 dark:border-amber-500/50 flex flex-col gap-5 mb-2 animate-in fade-in slide-in-from-top-2 relative shadow-inner">
              <button 
                onClick={() => setIsAddingPlan(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full p-1.5 shadow-sm" 
                title="Cancel New Package"
              >
                <FiX size={16} strokeWidth={3} />
              </button>
              <div className="flex items-center gap-2 border-b border-gray-400 pb-2 text-black dark:border-gray-600 dark:text-gray-300 mb-1">
                <FiPlus className="stroke-[3px]" size={20} />
                <h4 className="font-bold text-sm uppercase tracking-wider text-black dark:text-gray-300">Create Custom Package</h4>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className={labelClass}>Package Name</span>
                  <input 
                    type="text" 
                    value={newPlan.name} 
                    onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} 
                    placeholder="e.g. Student Promo" 
                    className={inputClass} 
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Package Category</span>
                  {categorySelect(newPlan, setNewPlan)}
                </label>
                <label className="block">
                  <span className={labelClass}>Package Color</span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={newPlan.color || '#10b981'}
                        onChange={e => {
                          setNewPlan({ ...newPlan, color: e.target.value });
                          onUseColor?.(e.target.value);
                        }}
                        aria-label="New package color"
                        className="h-11 w-14 cursor-pointer rounded-lg border-2 border-gray-300 bg-white p-1 dark:border-gray-600 dark:bg-[#252830]"
                      />
                      <span className="text-sm font-semibold text-slate-600 dark:text-gray-300">{newPlan.color || '#10b981'}</span>
                    </div>
                    {recentColorButtons(newPlan.color, color => setNewPlan(plan => ({ ...plan, color })))}
                  </div>
                </label>
                <div className="flex gap-4">
                  <label className="block w-1/2">
                    <span className={labelClass}>Duration (Day/s)</span>
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
                      type="text"
                      inputMode="decimal"
                      pattern="\\d+(\\.\\d{1,2})?"
                      min="0"
                      max="9999999.99"
                      aria-label="New package price"
                      value={newPlan.price} 
                      onChange={e => handlePriceInput(e.target.value, price => setNewPlan({ ...newPlan, price }))}
                      className={inputClass} 
                      placeholder="0.00" 
                    />
                  </label>
                </div>
              </div>
              <button onClick={onAddNewPlan} disabled={isSaving} className={`${catalogActionButtonClass} mt-2 w-full`}>
                {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
                {isSaving ? 'Creating...' : 'Save New Package'}
              </button>
            </div>
          )}

          {plans.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
              <p className="text-gray-500 dark:text-gray-400 font-medium">No plans found in the database.</p>
              <p className="text-sm text-amber-600 dark:text-amber-500 font-bold mt-1 cursor-pointer hover:underline" onClick={() => setIsAddingPlan(true)}>
                Click 'New Package' to create one!
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            {plans.map(plan => (
              <div key={plan.id} className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border-2 border-gray-300 border-l-4 bg-white p-3 transition-all hover:shadow-sm dark:border-gray-600 dark:bg-gray-800" style={{ borderLeftColor: getPackageColor(plan) }}>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-black dark:text-gray-400">{plan.name}</span>
                    <span className="mt-1 inline-flex max-w-full items-center gap-1.5">
                      <span className="truncate text-xs font-semibold text-gray-500 dark:text-gray-400">{plan.duration_days} days</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-black dark:text-gray-400 font-bold text-lg px-2">&#8369;</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="\\d+(\\.\\d{1,2})?"
                      min="0"
                      max="9999999.99"
                      value={plan.price}
                      onChange={(e) => handlePriceInput(e.target.value, price => onUpdatePlanPrice(plan.id, price))}
                      aria-label={`Price for ${plan.name}`}
                      className="w-24 px-3 py-2 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl text-right font-bold text-black dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenActionsPlanId(openActionsPlanId === plan.id ? null : plan.id)}
                        title="Package actions"
                        aria-label={`${openActionsPlanId === plan.id ? 'Close' : 'Open'} actions for ${plan.name}`}
                        aria-expanded={openActionsPlanId === plan.id}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-slate-700 shadow-sm transition-colors hover:border-amber-500 hover:bg-amber-50 dark:border-gray-600 dark:bg-[#252830] dark:text-gray-200 dark:hover:bg-amber-500/10"
                      >
                        <FiMoreVertical size={18} />
                      </button>
                      {openActionsPlanId === plan.id && (
                        <div className="absolute right-0 top-full z-20 mt-1 flex items-center gap-1 rounded-xl border-2 border-gray-300 bg-white p-1.5 shadow-xl dark:border-gray-600 dark:bg-[#191b22]">
                          <button
                            type="button"
                            onClick={() => {
                              setViewingPlanId(viewingPlanId === plan.id ? null : plan.id);
                              setEditingPlan(null);
                              setOpenActionsPlanId(null);
                            }}
                            title={viewingPlanId === plan.id ? 'Hide package details' : 'View package'}
                            aria-label={viewingPlanId === plan.id ? `Hide ${plan.name} details` : `View ${plan.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-blue-700 shadow-sm transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-gray-600 dark:bg-[#252830] dark:text-blue-300 dark:hover:bg-blue-500/10"
                          >
                            <FiEye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPlan(editingPlan?.id === plan.id ? null : { ...plan });
                              setViewingPlanId(null);
                              setOpenActionsPlanId(null);
                            }}
                            title="Edit package"
                            aria-label={`Edit ${plan.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-amber-700 shadow-sm transition-colors hover:border-amber-500 hover:bg-amber-50 dark:border-gray-600 dark:bg-[#252830] dark:text-amber-300 dark:hover:bg-amber-500/10"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDeletePlan(plan.id);
                              setOpenActionsPlanId(null);
                            }}
                            disabled={deletingPlanId === plan.id}
                            title="Delete package"
                            aria-label={`Delete ${plan.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-red-700 shadow-sm transition-colors hover:border-red-500 hover:bg-red-50 disabled:opacity-50 dark:border-gray-600 dark:bg-[#252830] dark:text-red-300 dark:hover:bg-red-500/10"
                          >
                            {deletingPlanId === plan.id ? <FiLoader size={16} className="animate-spin" /> : <FiTrash2 size={16} />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {viewingPlanId === plan.id && (
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-3 text-xs font-semibold text-slate-700 dark:border-gray-600 dark:bg-[#191b22] dark:text-gray-300">
                    <span>Category: {getPackageCategoryLabel(plan)}</span>
                    <span>Duration: {plan.duration_days} days</span>
                    <span>Price: ₱{Number(plan.price).toLocaleString()}</span>
                    <span className="inline-flex items-center gap-2">
                      Color
                      <span className="h-4 w-4 rounded-full border border-black/20 dark:border-white/20" style={{ backgroundColor: getPackageColor(plan) }} />
                      {getPackageColor(plan)}
                    </span>
                  </div>
                )}
                {editingPlan?.id === plan.id && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-amber-300 bg-amber-50/50 p-4 dark:border-amber-500/30 dark:bg-amber-500/5">
                    <label className="block sm:col-span-2">
                      <span className={labelClass}>Package Name</span>
                      <input value={editingPlan.name} onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })} className={inputClass} />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className={labelClass}>Package Category</span>
                      <select
                        value={editingPlan.category === 'other' ? '' : editingPlan.category || 'normal'}
                        onChange={e => setEditingPlan({
                          ...editingPlan,
                          category: e.target.value,
                          category_detail: e.target.value === 'other' ? editingPlan.category_detail || '' : ''
                        })}
                        className={inputClass}
                      >
                        {editingPlan.category === 'other' && <option value="" disabled>Select a category to reclassify</option>}
                        <option value="normal">Normal Subscription</option>
                        <option value="with_coach">With Coach Subscription</option>
                        <option value="walk_in">Walk-In</option>
                      </select>
                    </label>
                    {editingPlan.category === 'other' && (
                      <p className="sm:col-span-2 text-xs font-medium text-slate-500 dark:text-gray-400">
                        This package uses a legacy category, which is retained unless you select one of the available categories.
                      </p>
                    )}
                    <label className="block sm:col-span-2">
                      <span className={labelClass}>Package Color</span>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={editingPlan.color || getPackageColor(editingPlan)}
                            onChange={e => {
                              setEditingPlan({ ...editingPlan, color: e.target.value });
                              onUseColor?.(e.target.value);
                            }}
                            aria-label={`Color for ${editingPlan.name}`}
                            className="h-11 w-14 cursor-pointer rounded-lg border-2 border-gray-300 bg-white p-1 dark:border-gray-600 dark:bg-[#252830]"
                          />
                          <span className="text-sm font-semibold text-slate-600 dark:text-gray-300">{editingPlan.color || getPackageColor(editingPlan)}</span>
                        </div>
                        {recentColorButtons(editingPlan.color || getPackageColor(editingPlan), color => setEditingPlan(plan => ({ ...plan, color })))}
                      </div>
                    </label>
                    <label className="block">
                      <span className={labelClass}>Duration (Day/s)</span>
                      <input type="number" min="1" value={editingPlan.duration_days} onChange={e => setEditingPlan({ ...editingPlan, duration_days: e.target.value })} className={inputClass} />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Price (&#8369;)</span>
                      <input type="text" inputMode="decimal" pattern="\\d+(\\.\\d{1,2})?" min="0" max="9999999.99" value={editingPlan.price} onChange={e => handlePriceInput(e.target.value, price => setEditingPlan({ ...editingPlan, price }))} className={inputClass} />
                    </label>
                    <div className="sm:col-span-2 flex justify-end gap-2">
                      <button type="button" onClick={() => editingPlanGuard.requestClose(() => setEditingPlan(null))} className="rounded-lg px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">Cancel</button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={async () => {
                          if (await onSavePlan(editingPlan)) {
                            initialPlansRef.current = initialPlansRef.current.map(plan =>
                              plan.id === editingPlan.id ? planSnapshot(editingPlan) : plan
                            );
                            setEditingPlan(null);
                          }
                        }}
                        className={catalogActionButtonClass}
                      >
                        {isSaving ? <FiLoader size={16} className="animate-spin" /> : <FiSave size={16} />} Save Package
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3 mt-auto">
          <button 
            onClick={requestClose}
            disabled={isSaving} 
            className="px-6 py-2.5 rounded-xl font-bold text-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 uppercase tracking-wide text-sm"
          >
            Close
          </button>
          <button onClick={onSavePlans} disabled={isSaving || plans.length === 0} className={catalogActionButtonClass}>
            {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
            {isSaving ? 'Saving...' : 'Save Updated Prices'}
          </button>
        </div>
      </div>
    </div>
    {unsavedChangesGuard.dialog}
    {editingPlanGuard.dialog}
    </>
  );
}