import { useEffect, useId, useMemo, useState } from 'react';
import { FiUserCheck, FiX, FiLoader } from 'react-icons/fi';
import api from '../../api';
import useDialogAccessibility from './useDialogAccessibility';
import Button from './Button';
import { fieldClass, labelClass } from './field';

const REASONS = [
  'Face not recognized by the camera',
  'Wearing a mask, cap or glasses',
  'Camera or AI engine offline',
  'Face not enrolled yet',
  'Other',
];

/**
 * Manual check-in: the fallback for when the camera cannot recognize a member.
 * Pass `member` ({ id, name }) to check in a specific member, or leave it out
 * to search for one. `onDone(title, message, type)` reports the result.
 */
export default function ManualCheckInModal({ isOpen, member = null, onClose, onDone }) {
  const titleId = useId();
  const dialogRef = useDialogAccessibility(isOpen, onClose);
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(member);
  const [reason, setReason] = useState(REASONS[0]);
  const [otherReason, setOtherReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;
    setSelected(member);
    setSearch('');
    setReason(REASONS[0]);
    setOtherReason('');
    setError('');
    if (member) return undefined;

    let isCurrent = true;
    setIsLoadingMembers(true);
    api.get('/members')
      .then(res => {
        if (!isCurrent) return;
        setMembers(res.data.map(m => ({ id: m.id, name: `${m.first_name} ${m.last_name}`, status: m.status })));
      })
      .catch(() => { if (isCurrent) setError('The member list could not be loaded. Check your connection and try again.'); })
      .finally(() => { if (isCurrent) setIsLoadingMembers(false); });
    return () => { isCurrent = false; };
    // Keyed on the member's id so a parent re-render does not reset the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, member?.id]);

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return members.filter(m => m.name.toLowerCase().includes(term)).slice(0, 6);
  }, [members, search]);

  if (!isOpen) return null;

  const finalReason = reason === 'Other' ? otherReason.trim() : reason;
  const canSave = Boolean(selected) && finalReason.length >= 3 && !isSaving;

  const handleSave = async (event) => {
    event.preventDefault();
    if (!canSave) return;
    setIsSaving(true);
    setError('');
    try {
      const res = await api.post('/attendance/manual', { member_id: selected.id, reason: finalReason });
      onDone?.('Check-in Recorded', `${selected.name}: ${res.data.message}`, 'success');
      onClose();
    } catch (err) {
      // 409 = already checked in today, 422 = outside gym hours or invalid input.
      setError(err.response?.data?.message || 'The check-in could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-110 flex items-center justify-center bg-brand-dark/60 p-4 backdrop-blur-sm">
      <form
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onSubmit={handleSave}
        className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id={titleId} className="flex items-center gap-2.5 font-display text-2xl font-semibold text-ink">
            <FiUserCheck size={20} className="text-muted" /> Manual Check-in
          </h3>
          <button type="button" onClick={onClose} aria-label="Close manual check-in" className="press rounded-lg p-2 text-muted hover:bg-hover hover:text-ink">
            <FiX size={18} />
          </button>
        </div>

        <p className="mb-5 text-sm text-muted">
          Use this only when the camera cannot recognize the member. The check-in is saved as "Manual" with your account and the reason.
        </p>

        <div className="mb-4">
          <span className={labelClass}>Member</span>
          {selected ? (
            <div className="flex items-center justify-between rounded-xl border border-positive/40 bg-positive-soft px-3.5 py-2.5">
              <span className="truncate text-sm font-semibold text-ink">{selected.name}</span>
              {!member && (
                <button type="button" onClick={() => setSelected(null)} className="link-draw ml-3 shrink-0 text-xs font-semibold text-ink-2 hover:text-ink">Change</button>
              )}
            </div>
          ) : (
            <>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isLoadingMembers ? 'Loading members...' : 'Type the member\'s name'}
                disabled={isLoadingMembers}
                aria-label="Search member by name"
                className={fieldClass}
              />
              {search.trim() && (
                <ul className="animate-in fade-in slide-in-from-top-2 mt-2 max-h-44 overflow-y-auto rounded-xl border border-line bg-panel p-1">
                  {matches.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-muted">No member found.</li>
                  ) : matches.map(m => (
                    <li key={m.id}>
                      <button type="button" onClick={() => setSelected(m)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition-colors hover:bg-hover">
                        <span className="truncate">{m.name}</span>
                        {m.status === 'Inactive' && <span className="ml-2 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted">Inactive</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <label className="mb-4 block">
          <span className={labelClass}>Reason</span>
          <select value={reason} onChange={e => setReason(e.target.value)} className={fieldClass}>
            {REASONS.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>

        {reason === 'Other' && (
          <label className="mb-4 block">
            <span className={labelClass}>Describe the reason</span>
            <input type="text" value={otherReason} onChange={e => setOtherReason(e.target.value)} maxLength={255} className={fieldClass} placeholder="At least 3 characters" />
          </label>
        )}

        {error && <p role="alert" className="mb-4 rounded-lg bg-negative-soft px-3 py-2 text-sm font-medium text-negative">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!canSave} icon={isSaving ? <FiLoader className="animate-spin" size={14} /> : null}>
            {isSaving ? 'Saving...' : 'Check In'}
          </Button>
        </div>
      </form>
    </div>
  );
}
