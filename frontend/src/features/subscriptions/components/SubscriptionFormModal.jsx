import React from 'react';
import { fieldClass, labelClass as sharedLabelClass } from '../../../components/ui/field';
import { FiX, FiCheckCircle, FiSave, FiLoader, FiPlus, FiEdit2 } from 'react-icons/fi';
import useUnsavedChangesGuard from '../../../components/ui/useUnsavedChangesGuard.jsx';
import SearchableMemberSelect from '../../../components/ui/SearchableMemberSelect.jsx';
import StyledSelect from '../../../components/ui/StyledSelect';
import { formatNumber } from '../../../utils/numberFormat';
import { getLocalDateString } from '../../../utils/dateFormat';

export default function SubscriptionFormModal({
  isOpen,
  isEditing,
  isSaving,
  formData,
  setFormData,
  membersList,
  subscriptions,
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
  const existingActiveSubscription = subscriptions.find(subscription =>
    String(subscription.id) === String(formData.id || '')
    || (!isEditing && String(subscription.member_id) === String(formData.member_id))
  );
  const activeMembership = existingActiveSubscription?.status === 'Active'
    && (!existingActiveSubscription.start_date || existingActiveSubscription.start_date <= getLocalDateString())
    && (!existingActiveSubscription.end_date || existingActiveSubscription.end_date >= getLocalDateString())
    ? existingActiveSubscription
    : null;
  const fallbackMember = isEditing
    ? subscriptions.find(subscription => String(subscription.id) === String(formData.id || ''))?.member
    : null;
  const selectedMemberLabel = fallbackMember
    ? `${fallbackMember.first_name || ''} ${fallbackMember.last_name || ''}`.trim()
    : isEditing
      ? subscriptions.find(subscription => String(subscription.id) === String(formData.id || ''))?.member_name_snapshot || ''
      : '';
  const selectedPlan = plans.find(plan => plan.name === formData.plan_type);
  const isUpgrade = activeMembership
    && selectedPlan
    && String(activeMembership.plan_id) !== String(selectedPlan.id);
  const amountDue = isUpgrade
    ? Math.max(0, Number(selectedPlan.price || 0) - Number(activeMembership.amount_paid || 0))
    : calculatedPrice;
  const inputClass = fieldClass;
  const labelClass = sharedLabelClass;
  const primaryButtonClass = "press btn-step inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-gold px-5 text-sm font-medium text-brand-dark shadow-[inset_0_-1px_0_rgb(13_13_13/0.15)] hover:bg-brand-gold-500 disabled:cursor-not-allowed disabled:opacity-55";

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-sm animate-fade-in">
      <div className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl dark:border-line dark:bg-panel">
        <div className="flex items-center justify-between border-b border-line bg-field px-4 py-3 dark:border-line dark:bg-hover">
          <h3 className="flex items-center gap-2 text-xl font-medium text-ink">
            {isEditing ? <FiEdit2 size={19} /> : <FiPlus size={20} />}
            {isEditing ? 'Edit subscription' : 'Add subscriber'}
          </h3>
          <button
            type="button"
            onClick={requestClose}
            disabled={isSaving}
            aria-label="Close subscription form"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-muted shadow-sm transition-colors hover:border-negative/40 hover:bg-negative-soft hover:text-negative disabled:opacity-50 dark:border-line dark:bg-panel dark:text-ink-2 dark:hover:bg-negative-soft"
          >
            <FiX size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-hover p-4 dark:bg-field sm:p-5">
          <form id="subForm" className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSave}>
              <label className="block">
                <span className={labelClass}>Member</span>
                <SearchableMemberSelect
                  required
                  members={membersList}
                  fallbackMember={fallbackMember}
                  selectedLabel={selectedMemberLabel}
                  value={formData.member_id}
                  placeholder="Search Member Name"
                  onChange={memberId => setFormData({ ...formData, member_id: memberId })}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Subscription type</span>
                <StyledSelect
                  required 
                  value={formData.plan_type} 
                  onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })} 
                  aria-label="Subscription Type"
                  className={`${inputClass} ${formData.plan_type ? '' : '!text-muted dark:!text-muted'}`}
                >
                  <option className="bg-panel text-ink dark:bg-field dark:text-ink" value="" disabled>Choose a subscription type</option>
                  {filteredDropdownPlans.map(p => <option className="bg-panel text-ink dark:bg-field dark:text-ink" key={p.id} value={p.name}>{p.name} (₱{formatNumber(p.price)})</option>)}
                </StyledSelect>
                {activeMembership && !isUpgrade && (
                  <span className="mt-1 block text-xs font-medium text-muted">
                    Active subscription through {activeMembership.end_date || 'the current period'}.
                  </span>
                )}
              </label>
              <label className="block">
                <span className={labelClass}>Payment method</span>
                <StyledSelect
                  required
                  value={formData.payment_method || ''}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} 
                  aria-label="Payment Method"
                  className={`${inputClass} ${formData.payment_method ? '' : '!text-muted dark:!text-muted'}`}
                >
                  <option className="bg-panel text-ink dark:bg-field dark:text-ink" value="" disabled>Choose a payment method</option>
                  <option className="bg-panel text-ink dark:bg-field dark:text-ink" value="Cash">Cash</option>
                  <option className="bg-panel text-ink dark:bg-field dark:text-ink" value="Gcash">Gcash</option>
                  <option className="bg-panel text-ink dark:bg-field dark:text-ink" value="Maya">Maya</option>
                </StyledSelect>
              </label>
              <label className="block">
              <span className={labelClass}>Reference number</span>
              <input 
                type="text" 
                value={formData.reference_number} 
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })} 
                className={inputClass} 
                placeholder="Receipt or Transaction #" 
              />
            </label>

            {!activeMembership && loyalDiscount > 0 && (
              <div className="md:col-span-2 flex items-center gap-2 rounded-lg border border-positive/40 bg-positive-soft p-3 text-sm font-medium text-positive dark:border-positive/40 dark:bg-positive-soft dark:text-positive">
                <FiCheckCircle size={18} />
                Loyal Client Detected! A &#8369;{formatNumber(loyalDiscount)} discount has been applied. Final Auto-Billed Price: &#8369;{formatNumber(calculatedPrice)}
              </div>
            )}
            {isUpgrade && (
              <div className="md:col-span-2 rounded-xl border border-brand-navy/30 bg-brand-navy-50 p-3 text-sm font-semibold text-brand-navy dark:border-brand-navy-200/30 dark:bg-brand-navy-200/10 dark:text-brand-navy-200">
                Upgrade price: &#8369;{formatNumber(selectedPlan.price)} minus &#8369;{formatNumber(activeMembership.amount_paid || 0)} already paid = &#8369;{formatNumber(amountDue)} due.
              </div>
            )}

              <label className="block">
                <span className={labelClass}>Start date</span>
                <input 
                  type="date" 
                  required 
                  value={formData.start_date} 
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} 
                  className={inputClass} 
                />
              </label>
              <label className="block">
                <span className={labelClass}>Expiry date (worked out for you)</span>
                <input 
                  type="date" 
                  value={formData.end_date} 
                  disabled 
                  className="mt-1 w-full p-2.5 bg-hover dark:bg-hover border border-line dark:border-line rounded-xl text-muted cursor-not-allowed font-medium" 
                />
              </label>
          </form>
        </div>
        <div className="flex justify-end gap-3 border-t border-line bg-field p-4 dark:border-line dark:bg-hover sm:p-5">
          <button 
            type="button" 
            onClick={requestClose}
            disabled={isSaving} 
            className="press btn-step inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-panel px-5 text-sm font-medium text-ink-2 hover:border-line-strong hover:bg-field hover:text-ink disabled:opacity-50"
          >
            Cancel
          </button>
          <button form="subForm" type="submit" disabled={isSaving} className={primaryButtonClass}>
            {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />} {isSaving ? 'Processing...' : (isEditing ? 'Save changes' : 'Save subscription')}
          </button>
        </div>
      </div>
    </div>
    {unsavedChangesGuard.dialog}
    </>
  );
}