import React from 'react';
import { FiX, FiRefreshCw, FiLoader, FiInfo } from 'react-icons/fi';
import { fieldClass, labelClass } from '../../../components/ui/field';
import StyledSelect from '../../../components/ui/StyledSelect';
import { formatNumber } from '../../../utils/numberFormat';
import { getLocalDateString } from '../../../utils/dateFormat';
import { addDaysToDateString, formatDateString, getLoyaltyPrice, isRunningSubscription } from '../pricing';

const isWalkInPackage = (plan) => plan.category === 'walk_in'
  || String(plan.name || '').toLowerCase().includes('walk')
  || String(plan.name || '').toLowerCase().includes('daily');

/**
 * Renew a subscription in one step. A running subscription is extended from
 * its end date (the member keeps every day they paid for); one that has ended
 * starts again today. The summary shows the new dates and the amount before
 * anything is saved.
 */
export default function RenewSubscriptionModal({ subscription, subscriptions, plans, isSaving, onClose, onConfirm }) {
  // The package defaults to the subscription's own; choosing another one overrides it.
  const [chosenPlanId, setChosenPlanId] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('');
  const [referenceNumber, setReferenceNumber] = React.useState('');

  React.useEffect(() => {
    setChosenPlanId('');
    setPaymentMethod('');
    setReferenceNumber('');
  }, [subscription]);

  if (!subscription) return null;

  const currentPlan = plans.find(plan => String(plan.id) === String(subscription.plan_id))
    || plans.find(plan => plan.name === subscription.plan_type);
  const planId = chosenPlanId || (currentPlan ? String(currentPlan.id) : '');

  const memberName = subscription.member
    ? `${subscription.member.first_name} ${subscription.member.last_name}`
    : subscription.member_name_snapshot || 'this member';
  const isRunning = isRunningSubscription(subscription);
  const selectablePlans = plans.filter(plan => !isWalkInPackage(plan));
  const selectedPlan = plans.find(plan => String(plan.id) === String(planId));
  const duration = Number(selectedPlan?.duration_days) || 30;

  const today = getLocalDateString();
  const periodStart = isRunning ? String(subscription.end_date).slice(0, 10) : today;
  const periodEnd = addDaysToDateString(periodStart, duration);

  // Same loyalty rule as "Subscribe a member": the discount only applies when the
  // previous subscription has ended.
  const previousCount = subscriptions.filter(item => String(item.member_id) === String(subscription.member_id)).length;
  const { price, discount } = selectedPlan
    ? (isRunning ? { price: Number(selectedPlan.price) || 0, discount: 0 } : getLoyaltyPrice(selectedPlan, previousCount))
    : { price: 0, discount: 0 };

  const canSave = Boolean(selectedPlan) && Boolean(paymentMethod) && !isSaving;
  const submit = (event) => {
    event.preventDefault();
    if (!canSave) return;
    onConfirm({ plan_id: selectedPlan.id, payment_method: paymentMethod, reference_number: referenceNumber, amount: price });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/60 p-4 backdrop-blur-sm animate-fade-in">
      <div role="dialog" aria-modal="true" aria-labelledby="renew-title" className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-line bg-field py-3.5 pl-6 pr-4">
          <h3 id="renew-title" className="flex items-center gap-2.5 text-[18px] font-semibold tracking-[-0.01em] text-ink">
            <span className="flex shrink-0 items-center"><FiRefreshCw size={18} /></span> Renew subscription
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close renew subscription"
            className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-panel text-muted hover:bg-negative-soft hover:text-negative disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-hover p-4 sm:p-5">
            <p className="text-[15px] text-ink">
              Renewing <span className="font-semibold">{memberName}</span>
              <span className="text-muted">
                {isRunning
                  ? ` — current subscription runs until ${formatDateString(subscription.end_date)}.`
                  : ` — their subscription ended on ${formatDateString(subscription.end_date) || 'an earlier date'}.`}
              </span>
            </p>

            <label className="block">
              <span className={labelClass}>Package</span>
              <StyledSelect
                value={planId}
                onChange={event => setChosenPlanId(event.target.value)}
                disabled={isRunning}
                aria-label="Package"
                className={fieldClass}
              >
                {!selectedPlan && <option value="" disabled>Choose a package</option>}
                {selectablePlans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name} (₱{formatNumber(plan.price)})</option>
                ))}
              </StyledSelect>
              {isRunning && (
                <span className="mt-1.5 block text-xs text-muted">
                  A running subscription is renewed with the same package. To change the package, use Edit.
                </span>
              )}
              {!isRunning && !selectedPlan && (
                <span role="alert" className="mt-1.5 block text-xs font-medium text-warn">
                  The old package no longer exists. Choose one to continue.
                </span>
              )}
            </label>

            <div className="rounded-xl border border-line bg-panel p-4">
              <p className="mb-2 text-xs font-medium text-muted">What will happen</p>
              <p className="flex items-start gap-2 text-sm text-ink-2">
                <FiInfo size={15} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                {isRunning
                  ? 'The subscription is extended from its current end date, so no paid days are lost.'
                  : 'A new subscription starts today.'}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted">{isRunning ? 'Extra time starts' : 'Starts'}</dt>
                <dd className="text-right font-medium text-ink">{formatDateString(periodStart)}</dd>
                <dt className="text-muted">New end date</dt>
                <dd className="text-right font-medium text-ink">{selectedPlan ? formatDateString(periodEnd) : '—'}</dd>
                <dt className="text-muted">Package price</dt>
                <dd className="text-right tabular-nums text-ink">{selectedPlan ? `₱${formatNumber(selectedPlan.price)}` : '—'}</dd>
                {discount > 0 && (
                  <>
                    <dt className="text-positive">Loyal member discount</dt>
                    <dd className="text-right tabular-nums text-positive">−₱{formatNumber(discount)}</dd>
                  </>
                )}
                <dt className="border-t border-line pt-2 font-medium text-ink">Amount to receive</dt>
                <dd className="border-t border-line pt-2 text-right font-display text-lg font-semibold tabular-nums text-ink">
                  {selectedPlan ? `₱${formatNumber(price)}` : '—'}
                </dd>
              </dl>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Payment method</span>
                <StyledSelect
                  required
                  value={paymentMethod}
                  onChange={event => setPaymentMethod(event.target.value)}
                  aria-label="Payment method"
                  className={`${fieldClass} ${paymentMethod ? '' : '!text-muted'}`}
                >
                  <option value="" disabled>Choose a payment method</option>
                  <option value="Cash">Cash</option>
                  <option value="Gcash">GCash</option>
                  <option value="Maya">Maya</option>
                </StyledSelect>
              </label>
              <label className="block">
                <span className={labelClass}>Reference number <span className="font-normal text-muted">(optional)</span></span>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={event => setReferenceNumber(event.target.value)}
                  maxLength={100}
                  className={fieldClass}
                  placeholder="Receipt or transaction no."
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-line bg-field p-4 sm:p-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="press btn-step inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-panel px-5 text-sm font-semibold text-ink-2 hover:border-line-strong hover:bg-field hover:text-ink disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="press btn-step inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-gold px-5 text-sm font-semibold text-brand-dark shadow-[inset_0_-1px_0_rgb(13_13_13/0.15)] hover:bg-brand-gold-500 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiRefreshCw size={18} />}
              {isSaving ? 'Renewing…' : 'Renew and record payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
