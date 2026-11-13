import React, { useId } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import useDialogAccessibility from './useDialogAccessibility';
import Button from './Button';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isDanger = true }) {
  const titleId = useId();
  const messageId = useId();
  const dialogRef = useDialogAccessibility(isOpen, onCancel);
  if (!isOpen) return null;

  return (
    <div className="animate-fade-in fixed inset-0 z-[120] flex items-center justify-center bg-brand-dark/60 p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        tabIndex={-1}
        className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 relative w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${isDanger ? 'bg-negative-soft text-negative' : 'bg-warn-soft text-warn'}`}>
            <FiAlertCircle size={22} />
          </div>
          <div className="min-w-0">
            <h4 id={titleId} className="font-display text-xl font-semibold leading-tight text-ink">{title}</h4>
            <p id={messageId} className="mt-1.5 text-sm text-muted">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>{cancelText}</Button>
          <Button variant={isDanger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
}
