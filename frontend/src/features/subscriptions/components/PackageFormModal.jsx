import React from 'react';
import { FiX, FiSave, FiLoader, FiPlus, FiEdit2 } from 'react-icons/fi';
import { fieldClass, labelClass } from '../../../components/ui/field';
import StyledSelect from '../../../components/ui/StyledSelect';
import useUnsavedChangesGuard from '../../../components/ui/useUnsavedChangesGuard.jsx';
import { sanitizePackagePrice } from '../../../utils/priceInput';
import { formatNumber } from '../../../utils/numberFormat';
import { getPackageColor } from '../packageCategories';

const CATEGORY_HELP = {
  normal: 'A regular gym subscription.',
  with_coach: 'Members on this package get a training plan, and the camera tracks and counts their workouts.',
  walk_in: 'A one-time visit. Not offered when subscribing a member.',
};

/**
 * One form to create a package or change one. Saving is always the same single
 * button, so staff never wonder which "Save" applies to what.
 */
export default function PackageFormModal({
  isOpen,
  mode, // 'add' | 'edit'
  plan,
  setPlan,
  isSaving,
  recentColors = [],
  onUseColor,
  onSave,
  onClose,
}) {
  const [priceFocused, setPriceFocused] = React.useState(false);
  const initialRef = React.useRef('');
  React.useEffect(() => {
    if (isOpen) initialRef.current = JSON.stringify(plan);
    // The snapshot is taken once, when the form opens.
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  const guard = useUnsavedChangesGuard(isOpen && JSON.stringify(plan) !== initialRef.current);
  const requestClose = () => guard.requestClose(onClose);

  if (!isOpen || !plan) return null;

  const isEditing = mode === 'edit';
  const color = plan.color || getPackageColor(plan);
  const priceText = (() => {
    const raw = String(plan.price ?? '');
    if (priceFocused || raw === '' || raw.endsWith('.')) return raw;
    return formatNumber(raw, { maximumFractionDigits: 2 });
  })();
  const setPrice = (value) => {
    const sanitized = sanitizePackagePrice(value.replace(/,/g, ''));
    if (sanitized !== null) setPlan({ ...plan, price: sanitized });
  };

  const submit = (event) => {
    event.preventDefault();
    onSave();
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/60 p-4 backdrop-blur-sm animate-fade-in" onMouseDown={event => {
        if (event.target === event.currentTarget) requestClose();
      }}>
        <section role="dialog" aria-modal="true" aria-labelledby="package-form-title" className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">
          <div className="h-1.5 shrink-0" style={{ backgroundColor: color }} />
          <div className="flex shrink-0 items-center justify-between border-b border-line bg-field px-4 py-3">
            <h3 id="package-form-title" className="flex items-center gap-2 text-lg font-medium text-ink">
              {isEditing ? <FiEdit2 size={19} aria-hidden="true" /> : <FiPlus size={20} aria-hidden="true" />}
              {isEditing ? 'Edit package' : 'New package'}
            </h3>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close package form"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-muted shadow-sm transition-colors hover:border-negative/40 hover:bg-negative-soft hover:text-negative"
            >
              <FiX size={22} />
            </button>
          </div>

          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
              <label className="block">
                <span className={labelClass}>Package name</span>
                <input
                  type="text"
                  required
                  value={plan.name}
                  onChange={event => setPlan({ ...plan, name: event.target.value })}
                  placeholder="e.g. Student Promo"
                  className={fieldClass}
                />
              </label>

              <label className="block">
                <span className={labelClass}>Category</span>
                <StyledSelect
                  required
                  value={plan.category || ''}
                  onChange={event => setPlan({ ...plan, category: event.target.value })}
                  aria-label="Package category"
                  className={`${fieldClass} ${plan.category ? '' : '!text-muted'}`}
                >
                  <option value="" disabled>Choose a category</option>
                  <option value="normal">Normal Subscription</option>
                  <option value="with_coach">With Coach Subscription</option>
                  <option value="walk_in">Walk-In</option>
                </StyledSelect>
                {CATEGORY_HELP[plan.category] && <span className="mt-1.5 block text-xs text-muted">{CATEGORY_HELP[plan.category]}</span>}
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>How long it lasts (days)</span>
                  <input
                    type="number"
                    required
                    min="1"
                    max="3650"
                    value={plan.duration_days}
                    onChange={event => setPlan({ ...plan, duration_days: event.target.value })}
                    className={fieldClass}
                    placeholder="30"
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Price (₱)</span>
                  <input
                    type="text"
                    required
                    inputMode="decimal"
                    value={priceText}
                    onChange={event => setPrice(event.target.value)}
                    onFocus={() => setPriceFocused(true)}
                    onBlur={() => setPriceFocused(false)}
                    aria-label="Package price"
                    className={fieldClass}
                    placeholder="0.00"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-line bg-field p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-medium capitalize text-ink-2">Colour shown on the calendar</span>
                  <span className="font-mono text-xs text-muted">{color}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <label className="flex h-11 w-14 cursor-pointer items-center justify-center rounded-lg border border-line bg-panel p-1 shadow-sm" title="Choose a colour">
                    <input
                      type="color"
                      value={color}
                      onChange={event => { setPlan({ ...plan, color: event.target.value }); onUseColor?.(event.target.value); }}
                      aria-label="Package colour"
                      className="h-full w-full cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                  </label>
                  {recentColors.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2" aria-label="Recently used colours">
                      <span className="text-xs font-medium text-muted">Recent</span>
                      {recentColors.map(recent => (
                        <button
                          key={recent}
                          type="button"
                          onClick={() => { setPlan({ ...plan, color: recent }); onUseColor?.(recent); }}
                          aria-label={`Use recent colour ${recent}`}
                          title={recent}
                          className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${color === recent ? 'border-ink ring-2 ring-focus' : 'border-black/20'}`}
                          style={{ backgroundColor: recent }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-line bg-field p-4">
              <button
                type="button"
                onClick={requestClose}
                disabled={isSaving}
                className="press btn-step inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-panel px-5 text-sm font-semibold text-ink-2 hover:border-line-strong hover:bg-field hover:text-ink disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="press btn-step inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-gold px-5 text-sm font-semibold text-brand-dark shadow-[inset_0_-1px_0_rgb(13_13_13/0.15)] hover:bg-brand-gold-500 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
                {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Create package'}
              </button>
            </div>
          </form>
        </section>
      </div>
      {guard.dialog}
    </>
  );
}
