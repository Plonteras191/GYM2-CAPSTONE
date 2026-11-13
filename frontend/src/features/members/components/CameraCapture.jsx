import React from 'react';
import { FiCamera, FiCheckCircle, FiVideoOff } from 'react-icons/fi';

export default function CameraCapture({
  isCameraActive,
  faceImage,
  capturedViews,
  captureViews,
  videoRef,
  canvasRef,
  onStart,
  onCapture,
  onStop,
  onRetake,
}) {
  const nextView = captureViews[capturedViews.length];
  const isComplete = capturedViews.length === captureViews.length;
  const hasExistingEnrollment = faceImage === 'existing_data' && capturedViews.length === 0;

  return (
    <div className="flex min-h-72 flex-col items-center gap-3 rounded-xl border border-line bg-panel p-4 text-center shadow-sm dark:border-line dark:bg-panel">
      <h4 className="flex h-6 items-center font-bold text-ink uppercase tracking-wide text-sm">Facial Recognition</h4>

      <div className="flex w-full flex-1 flex-col items-center justify-center gap-3">
      <p className="min-h-10 text-xs font-medium text-ink-2">
        {isCameraActive
          ? `${nextView?.label} view: ${nextView?.instruction}`
          : isComplete
            ? `All ${captureViews.length} face views captured.`
            : hasExistingEnrollment
              ? 'A face enrollment is already saved.'
            : `${nextView?.label} view: ${nextView?.instruction}`}
      </p>

      <div className={`relative flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 transition-all ${
        isCameraActive
          ? 'border-warn/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
          : hasExistingEnrollment || isComplete
            ? 'border-positive/40 bg-positive-soft dark:bg-positive-soft'
            : 'bg-line dark:bg-panel border-line text-muted'
      }`}>
        <canvas ref={canvasRef} width="300" height="300" className="hidden" />

        {isCameraActive ? (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100" />
        ) : isComplete ? (
          <img src={capturedViews[0]} alt="Captured front view" className="h-full w-full object-cover" />
        ) : hasExistingEnrollment ? (
          <div className="flex h-full w-full flex-col items-center justify-center text-positive">
            <FiCheckCircle size={32} />
            <span className="mt-2 text-xs font-semibold uppercase tracking-[0.08em]">Enrollment Saved</span>
          </div>
        ) : capturedViews.length > 0 ? (
          <img src={capturedViews[capturedViews.length - 1]} alt={`Captured ${captureViews[capturedViews.length - 1].label.toLowerCase()} view`} className="h-full w-full object-cover" />
        ) : (
          <FiCamera size={32} />
        )}
      </div>

      {capturedViews.length > 0 && faceImage !== 'existing_data' && (
        <div className="flex items-center justify-center gap-2">
          {captureViews.map((view, index) => (
            <div key={view.label} className="flex flex-col items-center gap-1">
              {capturedViews[index] ? (
                <img src={capturedViews[index]} alt={`${view.label} capture`} className="h-10 w-10 rounded-lg border-2 border-positive/40 object-cover" />
              ) : (
                <div aria-hidden="true" className="h-10 w-10 rounded-lg border-2 border-dashed border-line" />
              )}
              <span className="text-[10px] font-semibold text-muted">{view.label}</span>
            </div>
          ))}
        </div>
      )}

      {!isComplete && (!hasExistingEnrollment || isCameraActive) && (
        <button
          type="button"
          onClick={isCameraActive ? onCapture : onStart}
          className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold shadow-sm transition-colors ${
            isCameraActive
              ? 'border-warn/40 bg-brand-gold text-ink hover:bg-brand-gold-500'
              : 'border-line bg-panel text-ink-2 hover:border-warn/40 hover:bg-warn-soft dark:border-line dark:bg-panel dark:text-ink dark:hover:border-amber-500 dark:hover:bg-warn-soft'
          }`}
        >
          {isCameraActive ? <FiCheckCircle size={16} /> : <FiCamera size={16} />}
          {isCameraActive ? `Capture ${nextView?.label} View` : `Start ${nextView?.label} View`}
        </button>
      )}

      {hasExistingEnrollment && !isCameraActive && (
        <button type="button" onClick={onRetake} className="text-xs font-bold text-warn hover:underline dark:text-warn">
          Renew 3-View Enrollment
        </button>
      )}

      {capturedViews.length > 0 && !isCameraActive && (
        <button type="button" onClick={onRetake} className="text-xs font-bold text-warn hover:underline dark:text-warn">
          {isComplete ? 'Retake All Views' : 'Restart 3-View Capture'}
        </button>
      )}

      {isCameraActive && (
        <button
          type="button"
          onClick={onStop}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-negative hover:underline"
        >
          <FiVideoOff /> Cancel
        </button>
      )}
      </div>
    </div>
  );
}
