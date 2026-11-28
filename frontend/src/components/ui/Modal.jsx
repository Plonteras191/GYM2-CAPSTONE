import React, { useId } from 'react';
import { FiX } from 'react-icons/fi';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  const titleId = useId();
  if (!isOpen) return null;

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`animate-in fade-in zoom-in-95 slide-in-from-bottom-2 relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl ${maxWidth}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-line py-3.5 pl-6 pr-4">
          <h3 id={titleId} className="text-[18px] font-semibold tracking-[-0.01em] text-ink">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-hover text-muted hover:bg-negative-soft hover:text-negative"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
