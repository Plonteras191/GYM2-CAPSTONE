import React, { useId } from 'react';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import useDialogAccessibility from './useDialogAccessibility';
import Button from './Button';

export default function AlertDialog({ isOpen, title, message, onClose, type = 'success' }) {
  const titleId = useId();
  const messageId = useId();
  const dialogRef = useDialogAccessibility(isOpen, onClose);
  if (!isOpen) return null;

  const isSuccess = type === 'success';

  return (
    <div className="animate-fade-in fixed inset-0 z-[120] flex items-center justify-center bg-brand-dark/60 p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        tabIndex={-1}
        className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 relative w-full max-w-md rounded-2xl border border-line bg-panel p-6 text-center shadow-2xl"
      >
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${isSuccess ? 'bg-positive-soft text-positive' : 'bg-negative-soft text-negative'}`}>
          {isSuccess ? <FiCheckCircle size={26} /> : <FiAlertCircle size={26} />}
        </div>

        <h4 id={titleId} className="font-display text-2xl font-semibold text-ink">{title}</h4>
        <p id={messageId} className="mt-2 whitespace-pre-line text-sm text-muted">{message}</p>

        <Button onClick={onClose} variant={isSuccess ? 'primary' : 'danger'} className="mt-6 w-full">OK</Button>
      </div>
    </div>
  );
}
