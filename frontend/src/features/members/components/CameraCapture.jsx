import React from 'react';
import { FiCamera, FiCheckCircle, FiVideoOff, FiRefreshCw } from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';

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
  const total = captureViews.length;
  const stepText = nextView ? `Photo ${capturedViews.length + 1} of ${total}, ${nextView.label.toLowerCase()}: ${nextView.instruction}` : '';

  return (
    <div className="flex min-h-72 flex-col gap-4 rounded-xl border border-line bg-panel p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-[15px] font-medium text-ink">Face for camera check-in</h4>
          <p className="mt-0.5 text-[13px] text-muted">{total} photos so the camera can recognise the member.</p>
        </div>
        {hasExistingEnrollment || isComplete
          ? <Badge variant="success" dot>{hasExistingEnrollment ? 'Saved' : 'Done'}</Badge>
          : <Badge variant={capturedViews.length ? 'warning' : 'default'}>{capturedViews.length} of {total}</Badge>}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <div className={`relative flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 transition-[border-color,box-shadow] duration-300 ${
          isCameraActive
            ? 'border-brand-gold shadow-[0_0_0_6px_rgb(242_183_5/0.18)]'
            : hasExistingEnrollment || isComplete
              ? 'border-positive/50 bg-positive-soft'
              : 'border-dashed border-line-strong bg-field text-muted'
        }`}>
          <canvas ref={canvasRef} width="300" height="300" className="hidden" />

          {isCameraActive ? (
            <video ref={videoRef} autoPlay playsInline className="h-full w-full -scale-x-100 transform object-cover" />
          ) : isComplete ? (
            <img src={capturedViews[0]} alt="Captured front view" className="h-full w-full object-cover" />
          ) : hasExistingEnrollment ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-positive">
              <FiCheckCircle size={30} />
              <span className="text-[13px] font-medium">Face photos saved</span>
            </div>
          ) : capturedViews.length > 0 ? (
            <img src={capturedViews[capturedViews.length - 1]} alt={`Captured ${captureViews[capturedViews.length - 1].label.toLowerCase()} view`} className="h-full w-full object-cover" />
          ) : (
            <FiCamera size={30} />
          )}
        </div>

        <p aria-live="polite" className="min-h-10 max-w-xs text-[13px] leading-snug text-ink-2">
          {isComplete
            ? `All ${total} face photos taken.`
            : hasExistingEnrollment && !isCameraActive
              ? 'This member can already check in by camera.'
              : stepText}
        </p>

        {!hasExistingEnrollment && (
          <ol className="flex items-start justify-center gap-2" aria-label="Face photos">
            {captureViews.map((view, index) => {
              const done = Boolean(capturedViews[index]);
              const current = !done && index === capturedViews.length;
              return (
                <li key={view.label} className="flex w-14 flex-col items-center gap-1">
                  {done ? (
                    <img src={capturedViews[index]} alt={`${view.label} photo taken`} className="h-11 w-11 rounded-lg border-2 border-positive/50 object-cover" />
                  ) : (
                    <span aria-hidden="true" className={`flex h-11 w-11 items-center justify-center rounded-lg border-2 border-dashed text-[13px] font-medium ${current ? 'border-brand-gold bg-warn-soft text-warn' : 'border-line text-muted'}`}>
                      {index + 1}
                    </span>
                  )}
                  <span className={`text-xs ${current ? 'font-medium text-ink' : 'text-muted'}`}>{view.label}</span>
                </li>
              );
            })}
          </ol>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2">
          {!isComplete && (!hasExistingEnrollment || isCameraActive) && (
            <Button
              size="md"
              variant={isCameraActive ? 'primary' : 'outline'}
              icon={isCameraActive ? <FiCheckCircle size={16} /> : <FiCamera size={16} />}
              onClick={isCameraActive ? onCapture : onStart}
            >
              {isCameraActive ? `Take ${nextView?.label.toLowerCase()} photo` : `Open camera for ${nextView?.label.toLowerCase()} photo`}
            </Button>
          )}

          {isCameraActive && (
            <Button size="md" variant="ghost" icon={<FiVideoOff size={15} />} onClick={onStop}>Close camera</Button>
          )}

          {hasExistingEnrollment && !isCameraActive && (
            <Button size="sm" variant="ghost" icon={<FiRefreshCw size={14} />} onClick={onRetake}>Retake all {total} face photos</Button>
          )}

          {capturedViews.length > 0 && !isCameraActive && (
            <Button size="sm" variant="ghost" icon={<FiRefreshCw size={14} />} onClick={onRetake}>
              {isComplete ? 'Retake all photos' : 'Start over'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
