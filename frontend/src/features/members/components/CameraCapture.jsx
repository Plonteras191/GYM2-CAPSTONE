import React from 'react';
import { FiCamera, FiCheckCircle, FiVideoOff, FiRefreshCw, FiLoader, FiAlertCircle } from 'react-icons/fi';
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
  // Quality check of the photo being taken (see faceQuality.js).
  checkStatus = 'idle',
  checkMessages = [],
  // Existing members whose face looks like these photos (see findLookAlikes).
  lookAlikes = { status: 'idle', matches: [], confirmed: false },
  onConfirmDifferentPerson = () => {},
}) {
  const isChecking = checkStatus === 'checking';
  const nextView = captureViews[capturedViews.length];
  const isComplete = capturedViews.length === captureViews.length;
  const hasExistingEnrollment = faceImage === 'existing_data' && capturedViews.length === 0;
  const total = captureViews.length;
  const stepText = nextView ? `Photo ${capturedViews.length + 1} of ${total}, ${nextView.label.toLowerCase()}: ${nextView.instruction}` : '';

  // The picture box works like the button under it: it opens the camera, then
  // takes the photo. It stays a <button> while the camera is on so the video
  // element is not remounted (that would drop the live stream).
  const canOpen = !isCameraActive && !isComplete && !hasExistingEnrollment;
  const isPreviewButton = canOpen || isCameraActive;
  const PreviewTag = isPreviewButton ? 'button' : 'div';
  const viewName = nextView?.label.toLowerCase();
  const previewProps = isPreviewButton
    ? {
        type: 'button',
        onClick: isCameraActive ? onCapture : onStart,
        disabled: isChecking,
        'aria-label': isCameraActive ? `Take ${viewName} photo` : `Open camera for ${viewName} photo`,
      }
    : {};

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-[15px] font-medium text-ink">Face for camera check-in</h4>
          <p className="mt-0.5 text-[13px] text-muted">{total} photos so the camera can recognise the member.</p>
        </div>
        {hasExistingEnrollment || isComplete
          ? <Badge variant="success" dot>{hasExistingEnrollment ? 'Saved' : 'Done'}</Badge>
          : <Badge variant={capturedViews.length ? 'warning' : 'default'}>{capturedViews.length} of {total}</Badge>}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-2.5 text-center">
        {/* Small while idle so the whole card fits; full size while the camera is on, to frame the face. */}
        <PreviewTag {...previewProps} className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 transition-[width,height,border-color,box-shadow,transform] duration-300 ${
          isCameraActive
            ? 'h-40 w-40 cursor-pointer border-brand-gold shadow-[0_0_0_6px_rgb(24_210_243/0.18)] disabled:cursor-wait'
            : hasExistingEnrollment || isComplete
              ? 'h-28 w-28 border-positive/50 bg-positive-soft'
              : 'h-28 w-28 cursor-pointer border-dashed border-line-strong bg-field text-black hover:-translate-y-0.5 hover:border-focus dark:text-neutral-300'
        }`}>
          <canvas ref={canvasRef} width="300" height="300" className="hidden" />

          {isCameraActive ? (
            <video ref={videoRef} autoPlay playsInline className="h-full w-full -scale-x-100 transform object-cover" />
          ) : isComplete ? (
            <img src={capturedViews[0]} alt="Captured front view" className="h-full w-full object-cover" />
          ) : hasExistingEnrollment ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-positive">
              <FiCheckCircle size={24} />
              <span className="text-[13px] font-medium">Face photos saved</span>
            </div>
          ) : capturedViews.length > 0 ? (
            <img src={capturedViews[capturedViews.length - 1]} alt={`Captured ${captureViews[capturedViews.length - 1].label.toLowerCase()} view`} className="h-full w-full object-cover" />
          ) : (
            <FiCamera size={24} aria-hidden="true" />
          )}
        </PreviewTag>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {!isComplete && (!hasExistingEnrollment || isCameraActive) && (
            <Button
              size="md"
              variant={isCameraActive ? 'primary' : 'outline'}
              icon={isChecking ? <FiLoader size={16} className="animate-spin" /> : isCameraActive ? <FiCheckCircle size={16} /> : <FiCamera size={16} />}
              onClick={isCameraActive ? onCapture : onStart}
              disabled={isChecking}
            >
              {isChecking
                ? 'Checking photo…'
                : isCameraActive ? `Take ${viewName} photo` : `Open camera for ${viewName} photo`}
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

        <p aria-live="polite" className="max-w-xs text-[13px] leading-snug text-ink-2">
          {isComplete
            ? `All ${total} face photos taken.`
            : hasExistingEnrollment && !isCameraActive
              ? 'This member can already check in by camera.'
              : stepText}
        </p>

        {checkMessages.length > 0 && (
          <div
            role={checkStatus === 'failed' ? 'alert' : 'status'}
            className={`flex w-full max-w-xs items-start gap-2 rounded-lg border px-3 py-2 text-left text-[13px] leading-snug ${
              checkStatus === 'failed'
                ? 'border-negative/40 bg-negative-soft text-negative'
                : checkStatus === 'offline'
                  ? 'border-warn/40 bg-warn-soft text-warn'
                  : 'border-line bg-field text-ink-2'
            }`}
          >
            {isChecking
              ? <FiLoader size={15} className="mt-0.5 shrink-0 animate-spin" />
              : <FiAlertCircle size={15} className="mt-0.5 shrink-0" />}
            <div>
              {checkStatus === 'failed' && <p className="font-medium">Photo not accepted. Try again:</p>}
              <ul className={checkStatus === 'failed' ? 'mt-0.5 list-disc pl-4' : ''}>
                {checkMessages.map(message => <li key={message}>{message}</li>)}
              </ul>
            </div>
          </div>
        )}

        {isComplete && lookAlikes.status === 'checking' && (
          <p role="status" className="flex items-center gap-2 text-[13px] text-ink-2">
            <FiLoader size={14} className="animate-spin" /> Comparing with existing members…
          </p>
        )}
        {isComplete && lookAlikes.status === 'offline' && (
          <p role="status" className="max-w-xs text-[13px] text-warn">
            AI engine offline: could not check for duplicate members.
          </p>
        )}
        {isComplete && lookAlikes.matches.length > 0 && (
          <div role="alert" className="w-full max-w-xs rounded-lg border border-warn/40 bg-warn-soft px-3 py-2 text-left text-[13px] leading-snug text-warn">
            <p className="flex items-start gap-2 font-medium">
              <FiAlertCircle size={15} className="mt-0.5 shrink-0" />
              This face looks like {lookAlikes.matches.length === 1 ? 'an existing member' : 'existing members'}:
            </p>
            <ul className="mt-1 list-disc pl-6">
              {lookAlikes.matches.map(match => (
                <li key={match.member_id}>
                  {match.name} (#{match.member_id}){match.level === 'likely_same' ? ' — may be the same person' : ' — similar'}
                </li>
              ))}
            </ul>
            <p className="mt-1">If it is the same person, cancel and edit that member instead.</p>
            <label className="mt-2 flex cursor-pointer items-start gap-2 text-ink">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={lookAlikes.confirmed}
                onChange={event => onConfirmDifferentPerson(event.target.checked)}
              />
              <span>This is a different person</span>
            </label>
          </div>
        )}

        {!hasExistingEnrollment && (
          <ol className="flex items-start justify-center gap-2" aria-label="Face photos">
            {captureViews.map((view, index) => {
              const done = Boolean(capturedViews[index]);
              const current = !done && index === capturedViews.length;
              return (
                <li key={view.label} className="flex w-12 flex-col items-center gap-1">
                  {done ? (
                    <img src={capturedViews[index]} alt={`${view.label} photo taken`} className="h-9 w-9 rounded-lg border-2 border-positive/50 object-cover" />
                  ) : (
                    <span aria-hidden="true" className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 border-dashed text-[13px] font-medium ${current ? 'border-brand-gold bg-warn-soft text-warn' : 'border-line text-muted'}`}>
                      {index + 1}
                    </span>
                  )}
                  <span className={`text-xs ${current ? 'font-medium text-ink' : 'text-muted'}`}>{view.label}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
