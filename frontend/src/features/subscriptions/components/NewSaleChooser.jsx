import React from 'react';
import { FiUserCheck, FiUser, FiArrowRight } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';

const OPTIONS = [
  {
    id: 'subscription',
    icon: FiUserCheck,
    title: 'Subscribe a member',
    hint: 'A registered member buys a package that runs for a set period.',
  },
  {
    id: 'walk-in',
    icon: FiUser,
    title: 'Record a walk-in',
    hint: 'A one-time visit or single purchase. The guest does not need to be a member.',
  },
];

/** First step of "New sale": pick what is being sold, then the matching form opens. */
export default function NewSaleChooser({ isOpen, onClose, onChoose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New sale" maxWidth="max-w-2xl">
      <p className="mb-4 text-sm text-muted">What is the customer paying for?</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {OPTIONS.map(({ id, icon: Icon, title, hint }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChoose(id)}
            className="press group flex h-full flex-col rounded-2xl border border-edge bg-panel p-5 text-left transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-ink-2 hover:shadow-[0_8px_24px_rgb(13_13_13/0.08)] dark:hover:shadow-none"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-field text-black dark:text-neutral-300">
              <Icon size={20} aria-hidden="true" />
            </span>
            <span className="mt-4 block text-base font-semibold text-ink">{title}</span>
            {/* Buttons show labels in Title Case; this description stays a sentence. */}
            <span className="mt-1 block flex-1 text-[13px] font-normal normal-case leading-relaxed text-muted">{hint}</span>
            <span className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[13px] font-semibold text-ink">
              Continue
              <FiArrowRight size={16} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
