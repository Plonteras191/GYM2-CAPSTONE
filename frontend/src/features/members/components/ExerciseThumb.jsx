import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FiActivity, FiX, FiCamera, FiMaximize2 } from 'react-icons/fi';
import useDialogAccessibility from '../../../components/ui/useDialogAccessibility';

const mediaUrl = (exercise, field = 'gif_url') => {
  const mediaPath = exercise?.[field] || exercise?.image;
  return mediaPath ? `/dataset/${mediaPath.replace(/^\//, '')}` : null;
};

const titleCase = (name = '') => name.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());

/** Falls back to the still image when the animation is missing. */
const handleImageError = (exercise) => (event) => {
  if (exercise?.image && event.currentTarget.dataset.fallback !== 'true') {
    event.currentTarget.dataset.fallback = 'true';
    event.currentTarget.src = mediaUrl(exercise, 'image');
  } else {
    event.currentTarget.style.display = 'none';
  }
};

const stepsOf = (exercise) => {
  const steps = exercise?.instruction_steps;
  const list = Array.isArray(steps) ? steps : steps?.en;
  if (Array.isArray(list) && list.length) return list;
  const text = exercise?.instructions?.en || (typeof exercise?.instructions === 'string' ? exercise.instructions : '');
  return text ? text.split(/(?<=\.)\s+/).filter(Boolean) : [];
};

function ExercisePreview({ exercise, cameraChecks, onClose }) {
  const dialogRef = useDialogAccessibility(true, onClose);
  const steps = stepsOf(exercise);
  const src = mediaUrl(exercise);

  return createPortal(
    <div
      className="animate-fade-in fixed inset-0 z-[110] flex items-center justify-center bg-brand-dark/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${titleCase(exercise.name)} preview`}
        tabIndex={-1}
        className="animate-in fade-in zoom-in-95 flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-edge bg-panel shadow-2xl outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold leading-tight text-ink">{titleCase(exercise.name)}</h3>
            <p className="mt-1 text-[13px] capitalize text-muted">{[exercise.target || exercise.body_part, exercise.equipment].filter(Boolean).join(' · ')}</p>
            {cameraChecks && (
              <span className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-medium text-positive">
                <FiCamera size={13} aria-hidden="true" /> Camera Checks This
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="press flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line-strong text-ink-2 hover:bg-hover hover:text-ink"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex items-center justify-center bg-white p-2">
            {src
              ? <img src={src} alt={exercise.name} className="max-h-[55vh] w-full object-contain" onError={handleImageError(exercise)} />
              : <span className="flex h-56 items-center justify-center text-muted"><FiActivity size={40} aria-hidden="true" /></span>}
          </div>
          {steps.length > 0 && (
            <div className="px-5 py-4">
              <h4 className="mb-2 text-sm font-semibold text-ink">How To Do It</h4>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-2">
                {steps.map((step, index) => <li key={index}>{String(step).replace(/^step\s*\d+\s*[:.-]?\s*/i, '')}</li>)}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * The exercise picture used in lists. Pressing it opens a large preview with the
 * animation and the steps, because the list thumbnail is too small to read.
 */
export default function ExerciseThumb({ exercise, cameraChecks = false, className = 'h-16 w-16', iconSize = 22, alt }) {
  const [isOpen, setIsOpen] = useState(false);
  const src = mediaUrl(exercise);

  if (!exercise) {
    return (
      <div className={`relative flex flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-field ${className}`}>
        <FiActivity className="text-muted" size={iconSize} />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`View ${titleCase(exercise.name)} larger`}
        title="Click to enlarge"
        className={`group relative flex flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-white ${className}`}
      >
        <FiActivity className="text-muted" size={iconSize} />
        {src && <img src={src} alt={alt ?? exercise.name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" onError={handleImageError(exercise)} />}
        <span aria-hidden="true" className="absolute bottom-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-md bg-brand-dark/70 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <FiMaximize2 size={11} />
        </span>
      </button>
      {isOpen && <ExercisePreview exercise={exercise} cameraChecks={cameraChecks} onClose={() => setIsOpen(false)} />}
    </>
  );
}
