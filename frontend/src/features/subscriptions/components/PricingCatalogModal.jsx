import React, { useEffect, useState } from 'react';
import { fieldClass, labelClass as sharedLabelClass } from '../../../components/ui/field';
import { createPortal } from 'react-dom';
import { FiX, FiPlus, FiSave, FiTrash2, FiLoader, FiEdit2, FiEye, FiMoreVertical, FiSettings, FiTag } from 'react-icons/fi';
import ColorTile from '../../../components/ui/ColorTile';
import { sanitizePackagePrice } from '../../../utils/priceInput';
import { formatNumber } from '../../../utils/numberFormat';
import useUnsavedChangesGuard from '../../../components/ui/useUnsavedChangesGuard.jsx';
import { getPackageColor, getPackageCategoryLabel } from '../packageCategories';
import StyledSelect from '../../../components/ui/StyledSelect';

const planSnapshot = (plan) => ({
  id: plan.id,
  name: plan.name,
  price: String(plan.price),
  duration_days: String(plan.duration_days),
  category: plan.category || 'normal',
  category_detail: plan.category_detail || '',
  color: plan.color || getPackageColor(plan),
});

// Hide the line when a package has no length set (instead of "undefined days").
const formatDuration = duration => (Number.isFinite(Number(duration)) && Number(duration) > 0 ? `${duration} ${Number(duration) === 1 ? 'day' : 'days'}` : '');

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
  const [focusedPriceInput, setFocusedPriceInput] = useState(null);
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
  const viewingPlan = plans.find(plan => plan.id === viewingPlanId);
  const unsavedChangesGuard = useUnsavedChangesGuard(isOpen && (isPlanPriceDirty || isNewPlanDirty || isEditingPlanDirty));
  const editingPlanGuard = useUnsavedChangesGuard(isOpen && isEditingPlanDirty);
  const requestClose = () => unsavedChangesGuard.requestClose(onClose);

  if (!isOpen) return null;

  const inputClass = fieldClass;
  const labelClass = sharedLabelClass;
  const catalogActionButtonClass = "press btn-step inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-gold px-5 text-sm font-medium text-brand-dark shadow-[inset_0_-1px_0_rgb(13_13_13/0.15)] hover:bg-brand-gold-500 disabled:cursor-not-allowed disabled:opacity-55";
  const handlePriceInput = (value, onChange) => {
    const sanitizedValue = sanitizePackagePrice(value.replace(/,/g, ''));
    if (sanitizedValue !== null) onChange(sanitizedValue);
  };
  const displayPrice = (value, isFocused = false) => {
    const raw = String(value ?? '');
    if (!raw) return raw;
    if (raw === '.') return isFocused ? raw : '0';
    if (raw.endsWith('.')) {
      const wholeNumber = Number(raw.slice(0, -1)).toLocaleString('en-US');
      return isFocused ? `${wholeNumber}.` : wholeNumber;
    }
    if (!isFocused) return formatNumber(raw, { maximumFractionDigits: 2 });
    const decimals = raw.split('.')[1]?.length || 0;
    return Number(raw).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: 2 });
  };
  const categorySelect = (plan, setPlan) => (
    <StyledSelect
      value={plan.category || ''}
      onChange={event => setPlan({
        ...plan,
        category: event.target.value,
        category_detail: '',
      })}
      aria-label="Package Category"
      className={`${inputClass} ${plan.category ? '' : '!text-muted dark:!text-muted'}`}
    >
      <option value="" disabled>Choose a package category</option>
      <option value="normal">Normal Subscription</option>
      <option value="with_coach">With Coach Subscription</option>
      <option value="walk_in">Walk-In</option>
    </StyledSelect>
  );
  const recentColorButtons = (selectedColor, onSelect) => (
    recentColors.length > 0 && (
      <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-line bg-white/70 px-2.5 py-2 dark:border-line dark:bg-night-field/70" aria-label="Recently used colors">
        <span className="text-xs font-medium text-muted">Recent</span>
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
            className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === color ? 'border-ink ring-2 ring-focus dark:border-white' : 'border-black/20 dark:border-white/30'}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    )
  );
  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-sm animate-fade-in">
      <div className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 bg-panel rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-line flex flex-col max-h-[90vh]">
        
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

        <div className="flex items-center justify-between border-b border-line bg-field px-4 py-3 dark:border-line dark:bg-hover">
          <h3 className="flex items-center gap-2 text-lg font-medium text-ink">
            <FiSettings size={19} /> Manage packages
          </h3>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close manage packages"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-muted shadow-sm transition-colors hover:border-negative/40 hover:bg-negative-soft hover:text-negative dark:border-line dark:bg-panel dark:text-ink-2 dark:hover:bg-negative-soft"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <div className="min-h-0 space-y-4 overflow-y-auto p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-field p-3 dark:border-line dark:bg-hover">
            <p className="min-w-0 text-xs font-medium leading-relaxed text-muted">
              Update existing packages or create a new subscription package.
            </p>
            <button onClick={() => setIsAddingPlan(true)} className={`${catalogActionButtonClass} w-auto shrink-0`}>
              <FiPlus size={16} strokeWidth={3} /> New package
            </button>
          </div>

          {isAddingPlan && createPortal(
            <div className="animate-fade-in fixed inset-0 z-[70] flex items-center justify-center bg-brand-dark/60 p-4 backdrop-blur-sm" onMouseDown={event => {
              if (event.target === event.currentTarget) setIsAddingPlan(false);
            }}>
              <section role="dialog" aria-modal="true" aria-labelledby="new-package-title" className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl dark:border-line dark:bg-panel">
                <div className="flex shrink-0 items-center justify-between border-b border-line bg-field px-4 py-3 dark:border-line dark:bg-hover">
                  <h4 id="new-package-title" className="flex items-center gap-2 text-base font-medium text-ink">
                    <FiPlus size={18} /> Create Custom Package
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingPlan(false)}
                    aria-label="Cancel new package"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-muted shadow-sm transition-colors hover:border-negative/40 hover:bg-negative-soft hover:text-negative dark:border-line dark:bg-panel dark:text-ink-2 dark:hover:bg-negative-soft"
                  >
                    <FiX size={18} />
                  </button>
                </div>
                <div className="min-h-0 space-y-4 overflow-y-auto p-4 sm:p-5">
                  <label className="block">
                    <span className={labelClass}>Package name</span>
                    <input
                      type="text"
                      value={newPlan.name}
                      onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                      placeholder="e.g. Student Promo"
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Package category</span>
                    {categorySelect(newPlan, setNewPlan)}
                  </label>
                  <label className="block">
                    <span className={labelClass}>Package colour</span>
                    <div className="space-y-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <input
                          type="color"
                          value={newPlan.color || '#10b981'}
                          onChange={e => {
                            setNewPlan({ ...newPlan, color: e.target.value });
                            onUseColor?.(e.target.value);
                          }}
                          aria-label="New package color"
                          className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-panel p-1 dark:border-line dark:bg-panel"
                        />
                        <span className="text-sm font-semibold text-ink-2">{newPlan.color || '#10b981'}</span>
                      </div>
                      {recentColorButtons(newPlan.color, color => setNewPlan(plan => ({ ...plan, color })))}
                    </div>
                  </label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className={labelClass}>Duration (days)</span>
                      <input
                        type="number"
                        value={newPlan.duration_days}
                        onChange={e => setNewPlan({ ...newPlan, duration_days: e.target.value })}
                        className={inputClass}
                        placeholder="30"
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Price (&#8369;)</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="\\d+(\\.\\d{1,2})?"
                        min="0"
                        max="9999999.99"
                        aria-label="New package price"
                        value={displayPrice(newPlan.price, focusedPriceInput === 'new')}
                        onChange={e => handlePriceInput(e.target.value, price => setNewPlan({ ...newPlan, price }))}
                        onFocus={() => setFocusedPriceInput('new')}
                        onBlur={() => setFocusedPriceInput(null)}
                        className={inputClass}
                        placeholder="0.00"
                      />
                    </label>
                  </div>
                </div>
                <div className="flex shrink-0 justify-end border-t border-line bg-field p-3 dark:border-line dark:bg-hover">
                  <button onClick={onAddNewPlan} disabled={isSaving} className={`${catalogActionButtonClass} mx-0 w-full sm:w-auto`}>
                    {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
                    {isSaving ? 'Creating...' : 'Save new package'}
                  </button>
                </div>
              </section>
            </div>,
            document.body
          )}

          {plans.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-line rounded-xl">
              <p className="text-muted font-medium">No plans found in the database.</p>
              <p className="text-sm text-warn dark:text-warn font-medium mt-1 cursor-pointer hover:underline" onClick={() => setIsAddingPlan(true)}>
                Click “New package” to create one.
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            {plans.map(plan => (
              <div key={plan.id} className="space-y-2">
                <div className="flex flex-col gap-3 rounded-xl border border-line bg-panel p-3 transition-colors duration-150 hover:border-line-strong sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <ColorTile color={getPackageColor(plan)} icon={FiTag} size="sm" />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium text-ink">{plan.name}</span>
                      {formatDuration(plan.duration_days) && <span className="truncate text-[13px] text-muted">{formatDuration(plan.duration_days)}</span>}
                    </div>
                  </div>
                  <div className="flex min-w-0 items-center justify-end gap-1.5 sm:shrink-0">
                    <span className="px-1 text-lg font-medium text-ink dark:text-muted">&#8369;</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="\\d+(\\.\\d{1,2})?"
                      min="0"
                      max="9999999.99"
                      value={displayPrice(plan.price, focusedPriceInput === `price-${plan.id}`)}
                      onChange={(e) => handlePriceInput(e.target.value, price => onUpdatePlanPrice(plan.id, price))}
                      onFocus={() => setFocusedPriceInput(`price-${plan.id}`)}
                      onBlur={() => setFocusedPriceInput(null)}
                      aria-label={`Price for ${plan.name}`}
                      className="w-28 px-2.5 py-2 bg-field border border-line rounded-xl text-right font-medium text-ink dark:text-muted focus:outline-none focus:ring-2 focus:ring-focus/25 focus:border-focus transition-all"
                    />
                    <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenActionsPlanId(openActionsPlanId === plan.id ? null : plan.id)}
                      title="Package actions"
                      aria-label={`${openActionsPlanId === plan.id ? 'Close' : 'Open'} actions for ${plan.name}`}
                      aria-expanded={openActionsPlanId === plan.id}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-panel text-ink-2 shadow-sm transition-colors hover:border-warn/40 hover:bg-warn-soft dark:border-line dark:bg-panel dark:text-ink dark:hover:bg-warn-soft"
                    >
                      <FiMoreVertical size={18} />
                    </button>
                    {openActionsPlanId === plan.id && (
                      <div className="absolute right-0 top-full z-20 mt-1 flex items-center gap-1 rounded-xl border border-line bg-panel p-1.5 shadow-xl dark:border-line dark:bg-field">
                        <button
                          type="button"
                          onClick={() => {
                            setViewingPlanId(plan.id);
                            setEditingPlan(null);
                            setOpenActionsPlanId(null);
                          }}
                          title={viewingPlanId === plan.id ? 'Hide package details' : 'View package'}
                          aria-label={viewingPlanId === plan.id ? `Hide ${plan.name} details` : `View ${plan.name}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-brand-navy shadow-sm transition-colors hover:border-brand-navy/30 hover:bg-brand-navy-50 dark:border-line dark:bg-panel dark:text-brand-navy-200 dark:hover:bg-brand-navy-200/10"
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
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-warn shadow-sm transition-colors hover:border-warn/40 hover:bg-warn-soft dark:border-line dark:bg-panel dark:text-warn dark:hover:bg-warn-soft"
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
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-negative shadow-sm transition-colors hover:border-negative/40 hover:bg-negative-soft disabled:opacity-50 dark:border-line dark:bg-panel dark:text-negative dark:hover:bg-negative-soft"
                        >
                          {deletingPlanId === plan.id ? <FiLoader size={16} className="animate-spin" /> : <FiTrash2 size={16} />}
                        </button>
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 border-t border-line bg-field flex justify-end gap-3 mt-auto">
          <button 
            onClick={requestClose}
            disabled={isSaving} 
            className="press btn-step inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-panel px-5 text-sm font-medium text-ink-2 hover:border-line-strong hover:bg-field hover:text-ink disabled:opacity-50"
          >
            Close
          </button>
          <button onClick={onSavePlans} disabled={isSaving || plans.length === 0} className={catalogActionButtonClass}>
            {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
            {isSaving ? 'Saving...' : 'Save updated prices'}
          </button>
        </div>
      </div>
    </div>
    {viewingPlan && (
      <div className="animate-fade-in fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/60 p-4 backdrop-blur-sm" onMouseDown={event => {
        if (event.target === event.currentTarget) setViewingPlanId(null);
      }}>
        <section role="dialog" aria-modal="true" aria-labelledby="package-view-title" className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl shadow-slate-950/25 ring-1 ring-white/70 dark:border-line dark:bg-panel dark:shadow-black/60 dark:ring-white/10">
          <div className="h-1.5" style={{ backgroundColor: getPackageColor(viewingPlan) }} />
          <div className="flex items-center justify-between gap-3 border-b border-line bg-field px-4 py-3 dark:border-line dark:bg-hover sm:px-5">
            <h4 id="package-view-title" className="flex min-w-0 items-center gap-2 text-lg font-medium text-ink">
              <FiEye className="shrink-0" size={19} /> View Package Details
            </h4>
            <button type="button" onClick={() => setViewingPlanId(null)} aria-label="Close package details" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-panel text-ink-2 shadow-sm transition-colors hover:border-negative/40 hover:bg-negative-soft hover:text-negative dark:border-line dark:bg-field dark:text-ink dark:hover:border-red-500 dark:hover:bg-negative-soft dark:hover:text-negative">
              <FiX size={18} />
            </button>
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <p className={`${labelClass} mb-1.5`}>Package name</p>
                <div className="flex min-h-10 items-center rounded-xl border border-line bg-field px-3 text-sm font-medium text-ink dark:border-line dark:bg-field dark:text-ink">{viewingPlan.name}</div>
              </div>
              <div className="min-w-0">
                <p className={`${labelClass} mb-1.5`}>Package category</p>
                <div className="flex min-h-10 items-center rounded-xl border border-line bg-field px-3 text-sm font-medium text-ink dark:border-line dark:bg-field dark:text-ink">{getPackageCategoryLabel(viewingPlan)}</div>
              </div>
            </div>
            <div className="rounded-xl border border-line bg-field p-3 dark:border-line dark:bg-field">
              <div className="flex items-center justify-between gap-3">
                <p className={labelClass}>Package colour</p>
                <span className="rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs font-medium text-ink-2 dark:border-line dark:bg-panel dark:text-ink">{getPackageColor(viewingPlan)}</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg border border-line bg-panel p-1 shadow-sm dark:border-line dark:bg-panel">
                  <span className="h-full w-full rounded-sm border border-black/10 dark:border-white/10" style={{ backgroundColor: getPackageColor(viewingPlan) }} />
                </span>
                <span className="text-sm font-medium text-ink-2">Package display color</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <p className={`${labelClass} mb-1.5`}>Duration (days)</p>
                <div className="flex min-h-10 items-center rounded-xl border border-line bg-field px-3 text-sm font-medium text-ink dark:border-line dark:bg-field dark:text-ink">{viewingPlan.duration_days}</div>
              </div>
              <div className="min-w-0">
                <p className={`${labelClass} mb-1.5`}>Price (₱)</p>
                <div className="flex min-h-10 items-center rounded-xl border border-line bg-field px-3 text-sm font-semibold text-ink dark:border-line dark:bg-field dark:text-ink">{formatNumber(viewingPlan.price)}</div>
              </div>
            </div>
          </div>
          <div className="flex justify-end border-t border-line bg-field px-4 py-2.5 dark:border-line dark:bg-[#1e2027] sm:px-5">
            <button type="button" onClick={() => setViewingPlanId(null)} className={`${catalogActionButtonClass} mx-0`}>
              Done
            </button>
          </div>
        </section>
      </div>
    )}
    {editingPlan && (
      <div className="animate-fade-in fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/60 p-4 backdrop-blur-sm" onMouseDown={event => {
        if (event.target === event.currentTarget) editingPlanGuard.requestClose(() => setEditingPlan(null));
      }}>
        <section role="dialog" aria-modal="true" aria-labelledby="package-edit-title" className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl shadow-slate-950/25 ring-1 ring-white/70 dark:border-line dark:bg-panel dark:shadow-black/60 dark:ring-white/10">
          <div className="h-1.5 shrink-0" style={{ backgroundColor: getPackageColor(editingPlan) }} />
          <div className="flex items-center justify-between gap-3 border-b border-line bg-field px-4 py-3 dark:border-line dark:bg-hover sm:px-5">
            <h4 id="package-edit-title" className="flex min-w-0 items-center gap-2 text-lg font-medium text-ink">
              <FiEdit2 className="shrink-0" size={19} /> Edit Package Details
            </h4>
            <button type="button" onClick={() => editingPlanGuard.requestClose(() => setEditingPlan(null))} aria-label="Close package editor" className="shrink-0 rounded-lg border border-line bg-panel p-1.5 text-ink-2 shadow-sm transition-colors hover:border-negative/40 hover:bg-negative-soft hover:text-negative dark:border-line dark:bg-panel dark:text-ink dark:hover:border-red-500 dark:hover:bg-negative-soft dark:hover:text-negative">
              <FiX size={18} />
            </button>
          </div>
          <div className="min-h-0 space-y-4 overflow-y-auto p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block min-w-0"><span className={labelClass}>Package name</span><input value={editingPlan.name} onChange={event => setEditingPlan({ ...editingPlan, name: event.target.value })} className={inputClass} /></label>
              <label className="block min-w-0">
                <span className={labelClass}>Package category</span>
                <StyledSelect value={editingPlan.category === 'other' ? '' : editingPlan.category || ''} onChange={event => setEditingPlan({ ...editingPlan, category: event.target.value, category_detail: event.target.value === 'other' ? editingPlan.category_detail || '' : '' })} aria-label="Package Category" className={`${inputClass} ${editingPlan.category === 'other' ? '!text-muted dark:!text-muted' : ''}`}>
                  {editingPlan.category === 'other' && <option value="" disabled>Choose a package category</option>}
                  <option value="normal">Normal Subscription</option><option value="with_coach">With Coach Subscription</option><option value="walk_in">Walk-In</option>
                </StyledSelect>
                {editingPlan.category === 'other' && <span className="mt-1 block text-xs text-muted">This legacy category is kept unless you choose a new category.</span>}
              </label>
            </div>
            <div className="rounded-xl border border-line bg-field p-3 dark:border-line dark:bg-night-field/70">
              <div className="flex items-center justify-between gap-3">
                <span className={`${labelClass} mb-0`}>Package colour</span>
                <span className="rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs font-medium text-ink-2 dark:border-line dark:bg-panel dark:text-ink">{editingPlan.color || getPackageColor(editingPlan)}</span>
              </div>
              <div className="mt-2 space-y-2.5">
                <div className="flex items-center gap-3">
                  <label className="flex h-11 w-14 cursor-pointer items-center justify-center rounded-lg border border-line bg-panel p-1 shadow-sm transition-colors hover:border-warn/40 dark:border-line dark:bg-panel" title="Choose package color">
                    <input type="color" value={editingPlan.color || getPackageColor(editingPlan)} onChange={event => { setEditingPlan({ ...editingPlan, color: event.target.value }); onUseColor?.(event.target.value); }} aria-label={`Color for ${editingPlan.name}`} className="h-full w-full cursor-pointer rounded border-0 bg-transparent p-0" />
                  </label>
                  <span className="text-xs font-medium text-ink-2">Choose a color or select a recent one.</span>
                </div>
                {recentColorButtons(editingPlan.color || getPackageColor(editingPlan), color => setEditingPlan(plan => ({ ...plan, color })))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block"><span className={labelClass}>Duration (days)</span><input type="number" min="1" value={editingPlan.duration_days} onChange={event => setEditingPlan({ ...editingPlan, duration_days: event.target.value })} className={inputClass} /></label>
              <label className="block"><span className={labelClass}>Price (₱)</span><input type="text" inputMode="decimal" pattern="\\d+(\\.\\d{1,2})?" min="0" max="9999999.99" value={displayPrice(editingPlan.price, focusedPriceInput === `edit-${editingPlan.id}`)} onChange={event => handlePriceInput(event.target.value, price => setEditingPlan({ ...editingPlan, price }))} onFocus={() => setFocusedPriceInput(`edit-${editingPlan.id}`)} onBlur={() => setFocusedPriceInput(null)} className={inputClass} /></label>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-line bg-field p-3 dark:border-line dark:bg-hover">
            <button type="button" onClick={() => editingPlanGuard.requestClose(() => setEditingPlan(null))} className="press btn-step inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-panel px-5 text-sm font-medium text-ink-2 hover:border-line-strong hover:bg-field hover:text-ink disabled:opacity-50">Cancel</button>
            <button type="button" disabled={isSaving} onClick={async () => {
              if (await onSavePlan(editingPlan)) {
                initialPlansRef.current = initialPlansRef.current.map(plan => plan.id === editingPlan.id ? planSnapshot(editingPlan) : plan);
                setEditingPlan(null);
              }
            }} className={catalogActionButtonClass}>
              {isSaving ? <FiLoader size={16} className="animate-spin" /> : <FiSave size={16} />} Save Package
            </button>
          </div>
        </section>
      </div>
    )}
    {unsavedChangesGuard.dialog}
    {editingPlanGuard.dialog}
    </>
  );
}