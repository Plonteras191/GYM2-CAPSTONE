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
    <div className="flex min-h-[18rem] flex-col items-center gap-3 rounded-xl border-2 border-gray-300 bg-white p-4 text-center shadow-sm dark:border-gray-600 dark:bg-[#252830]">
      <h4 className="flex h-6 items-center font-bold text-slate-800 dark:text-gray-200 uppercase tracking-wide text-sm">Facial Recognition</h4>

      <div className="flex w-full flex-1 flex-col items-center justify-center gap-3">
      <p className="min-h-10 text-xs font-medium text-slate-600 dark:text-gray-300">
        {isCameraActive
          ? `${nextView?.label} view: ${nextView?.instruction}`
          : isComplete
            ? 'Front, left-side, and right-side views captured.'
            : hasExistingEnrollment
              ? 'A face enrollment is already saved.'
            : `${nextView?.label} view: ${nextView?.instruction}`}
      </p>

      <div className={`relative flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 transition-all ${
        isCameraActive
          ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
          : hasExistingEnrollment || isComplete
            ? 'border-green-500 bg-green-50 dark:bg-green-500/10'
            : 'bg-gray-200 dark:bg-[#252830] border-gray-300 dark:border-gray-600 text-gray-400'
      }`}>
        <canvas ref={canvasRef} width="300" height="300" className="hidden" />

        {isCameraActive ? (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100" />
        ) : isComplete ? (
          <img src={capturedViews[0]} alt="Captured front view" className="h-full w-full object-cover" />
        ) : hasExistingEnrollment ? (
          <div className="flex h-full w-full flex-col items-center justify-center text-green-500">
            <FiCheckCircle size={32} />
            <span className="mt-2 text-[10px] font-bold uppercase tracking-widest">Enrollment Saved</span>
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
                <img src={capturedViews[index]} alt={`${view.label} capture`} className="h-10 w-10 rounded-lg border-2 border-green-500 object-cover" />
              ) : (
                <div aria-hidden="true" className="h-10 w-10 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600" />
              )}
              <span className="text-[9px] font-semibold text-slate-500 dark:text-gray-400">{view.label}</span>
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
              ? 'border-amber-500 bg-amber-500 text-black hover:bg-amber-400'
              : 'border-gray-300 bg-white text-slate-700 hover:border-amber-500 hover:bg-amber-50 dark:border-gray-600 dark:bg-[#252830] dark:text-gray-200 dark:hover:border-amber-500 dark:hover:bg-amber-500/10'
          }`}
        >
          {isCameraActive ? <FiCheckCircle size={16} /> : <FiCamera size={16} />}
          {isCameraActive ? `Capture ${nextView?.label} View` : `Start ${nextView?.label} View`}
        </button>
      )}

      {hasExistingEnrollment && !isCameraActive && (
        <button type="button" onClick={onRetake} className="text-xs font-bold text-amber-700 hover:underline dark:text-amber-400">
          Renew 3-View Enrollment
        </button>
      )}

      {capturedViews.length > 0 && !isCameraActive && (
        <button type="button" onClick={onRetake} className="text-xs font-bold text-amber-700 hover:underline dark:text-amber-400">
          {isComplete ? 'Retake All Views' : 'Restart 3-View Capture'}
        </button>
      )}

      {isCameraActive && (
        <button
          type="button"
          onClick={onStop}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:underline"
        >
          <FiVideoOff /> Cancel
        </button>
      )}
      </div>
    </div>
  );
}
