import React from 'react';
import { FiX, FiSave, FiLoader, FiCreditCard } from 'react-icons/fi';
import useUnsavedChangesGuard from '../../../components/ui/useUnsavedChangesGuard.jsx';
import SearchableMemberSelect from '../../../components/ui/SearchableMemberSelect.jsx';
import StyledSelect from '../../../components/ui/StyledSelect';
import { formatNumber } from '../../../utils/numberFormat';
import Button from '../../../components/ui/Button';
import { fieldClass, labelClass } from '../../../components/ui/field';

// Values match what the form saved before (option text "Gcash"); labels are for display.
const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Gcash', label: 'GCash' },
  { value: 'Maya', label: 'Maya' },
];

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

  const inputClass = fieldClass;
  const memberRequired = formData.type !== 'Walk-In' && formData.type !== 'Packages';
  const amountValue = Number(formData.amount);

  return (
    <>
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/60 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="txn-form-title" className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">

        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h3 id="txn-form-title" className="flex items-center gap-2.5 text-xl font-medium tracking-[-0.01em] text-ink">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-warn-soft text-warn"><FiCreditCard size={17} /></span>
              Record a payment
            </h3>
            <p className="mt-1.5 text-[13px] text-muted">Choose the package and the price fills in for you. You can still change the amount.</p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={isSaving}
            aria-label="Close transaction form"
            className="press flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-muted hover:border-negative/40 hover:bg-negative-soft hover:text-negative disabled:opacity-50"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={onSave} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-canvas p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 rounded-2xl border border-line bg-panel p-4 sm:p-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className={labelClass}>
                  Member {memberRequired ? <span aria-hidden="true" className="text-negative">*</span> : <span className="font-normal text-muted">(optional for walk-ins)</span>}
                </label>
                <SearchableMemberSelect
                  required={memberRequired}
                  members={membersList}
                  value={formData.member_id}
                  placeholder="Search by member name"
                  onChange={memberId => setFormData({ ...formData, member_id: memberId })}
                />
              </div>

              <div>
                <label className={labelClass}>Package <span aria-hidden="true" className="text-negative">*</span></label>
                <StyledSelect
                  required
                  value={formData.package_id || ''}
                  className={`${inputClass} ${formData.package_name ? '' : '!text-muted'}`}
                  onChange={event => onPlanSelection(event.target.value)}
                  aria-label="Package"
                >
                  <option value="" disabled>Choose a package</option>
                  {plansList.map(plan => <option key={plan.id} value={plan.id}>{plan.name} (&#8369;{formatNumber(plan.price)})</option>)}
                </StyledSelect>
              </div>

              <div>
                <label className={labelClass}>Amount <span aria-hidden="true" className="text-negative">*</span></label>
                <div className="relative">
                  <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">&#8369;</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    maxLength={10}
                    required
                    aria-label="Amount in pesos"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => onAmountChange(e.target.value)}
                    className={`${inputClass} pl-8 tabular-nums`}
                  />
                </div>
              </div>

              <fieldset className="md:col-span-2">
                <legend className={labelClass}>Payment method <span aria-hidden="true" className="text-negative">*</span></legend>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map(method => {
                    const checked = formData.payment_method === method.value;
                    return (
                      <label
                        key={method.value}
                        className={`press relative flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${checked ? 'border-brand-gold bg-warn-soft text-ink' : 'border-line-strong bg-field text-ink-2 hover:bg-hover hover:text-ink'}`}
                      >
                        <input
                          type="radio"
                          name="payment_method"
                          value={method.value}
                          required
                          checked={checked}
                          onChange={() => setFormData({ ...formData, payment_method: method.value })}
                          className="sr-only"
                        />
                        <span aria-hidden="true" className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors ${checked ? 'border-brand-gold' : 'border-line-strong'}`}>
                          <span className={`h-2 w-2 rounded-full bg-brand-gold transition-transform duration-200 ease-out-quint ${checked ? 'scale-100' : 'scale-0'}`} />
                        </span>
                        {method.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="md:col-span-2">
                <label className={labelClass}>Reference number <span className="font-normal text-muted">(optional)</span></label>
                <input
                  type="text"
                  placeholder="GCash or Maya reference, or receipt number"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-panel px-5 py-4" aria-live="polite">
              <div className="min-w-0">
                <p className="text-[13px] text-muted">Amount to collect</p>
                <p className="truncate text-sm text-ink-2">{formData.package_name || 'No package chosen yet'}</p>
              </div>
              <p className="shrink-0 text-3xl font-medium tracking-[-0.03em] text-ink tabular-nums">
                &#8369;{Number.isFinite(amountValue) && formData.amount !== '' ? formatNumber(amountValue) : '0'}
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-end sm:px-6">
            <Button variant="outline" onClick={requestClose} disabled={isSaving} className="w-full sm:w-auto">Cancel</Button>
            <Button
              type="submit"
              size="lg"
              disabled={isSaving}
              icon={isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
              className="w-full sm:w-auto"
            >
              {isSaving ? 'Saving…' : 'Record payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
    {unsavedChangesGuard.dialog}
    </>
  );
}
