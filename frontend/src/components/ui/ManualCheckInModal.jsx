import { useEffect, useId, useMemo, useState } from 'react';
import { FiUserCheck, FiX, FiLoader } from 'react-icons/fi';
import api from '../../api';
import useDialogAccessibility from './useDialogAccessibility';

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

  const inputClass = 'w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-700 dark:bg-[#191b22] dark:text-gray-200';
  const labelClass = 'mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500';

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <form
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onSubmit={handleSave}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-[#252833]"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id={titleId} className="flex items-center gap-2 text-lg font-black text-slate-800 dark:text-gray-200">
            <FiUserCheck size={20} /> Manual Check-in
          </h3>
          <button type="button" onClick={onClose} aria-label="Close manual check-in" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-[#191b22]">
            <FiX size={18} />
          </button>
        </div>

        <p className="mb-4 text-xs font-medium text-slate-500 dark:text-gray-400">
          Use this only when the camera cannot recognize the member. The check-in is saved as "Manual" with your account and the reason.
        </p>

        <div className="mb-4">
          <span className={labelClass}>Member</span>
          {selected ? (
            <div className="flex items-center justify-between rounded-xl border-2 border-green-500 bg-green-50 px-3 py-2 dark:bg-green-500/10">
              <span className="truncate text-sm font-bold text-slate-800 dark:text-gray-200">{selected.name}</span>
              {!member && (
                <button type="button" onClick={() => setSelected(null)} className="ml-3 shrink-0 text-xs font-bold text-slate-600 underline dark:text-gray-300">Change</button>
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
                className={inputClass}
              />
              {search.trim() && (
                <ul className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  {matches.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-slate-500 dark:text-gray-400">No member found.</li>
                  ) : matches.map(m => (
                    <li key={m.id}>
                      <button type="button" onClick={() => setSelected(m)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-100 dark:text-gray-200 dark:hover:bg-[#191b22]">
                        <span className="truncate">{m.name}</span>
                        {m.status === 'Inactive' && <span className="ml-2 shrink-0 text-[10px] font-bold uppercase text-slate-500">Inactive</span>}
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
          <select value={reason} onChange={e => setReason(e.target.value)} className={inputClass}>
            {REASONS.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>

        {reason === 'Other' && (
          <label className="mb-4 block">
            <span className={labelClass}>Describe the reason</span>
            <input type="text" value={otherReason} onChange={e => setOtherReason(e.target.value)} maxLength={255} className={inputClass} placeholder="At least 3 characters" />
          </label>
        )}

        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-[#191b22]">Cancel</button>
          <button type="submit" disabled={!canSave} className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-300 dark:text-black">
            {isSaving && <FiLoader className="animate-spin" size={14} />}
            {isSaving ? 'Saving...' : 'Check In'}
          </button>
        </div>
      </form>
    </div>
  );
}
