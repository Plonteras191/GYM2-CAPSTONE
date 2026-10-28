import React from 'react';
import { FiCamera, FiCheckCircle, FiVideoOff } from 'react-icons/fi';

export default function CameraCapture({ isCameraActive, faceImage, videoRef, canvasRef, onStart, onCapture, onStop, onRetake }) {
  return (
    <div className="flex min-h-[18rem] flex-col items-center gap-3 rounded-xl border-2 border-gray-300 bg-white p-4 text-center shadow-sm dark:border-gray-600 dark:bg-[#252830]">
      <h4 className="flex h-6 items-center font-bold text-slate-800 dark:text-gray-200 uppercase tracking-wide text-sm">Facial Recognition</h4>

      <div className="flex w-full flex-1 flex-col items-center justify-center gap-3">
      <div className={`flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 transition-all ${
        faceImage
          ? 'border-green-500 bg-green-50 dark:bg-green-500/10'
          : isCameraActive
            ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
            : 'bg-gray-200 dark:bg-[#252830] border-gray-300 dark:border-gray-600 text-gray-400'
      }`}>
        <canvas ref={canvasRef} width="300" height="300" className="hidden" />

        {faceImage ? (
          <div className="relative w-full h-full group">
            {faceImage === 'existing_data' ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-green-500">
                <FiCheckCircle size={32} />
                <span className="text-[10px] font-bold mt-2 uppercase tracking-widest">Data Saved</span>
              </div>
            ) : (
              <img src={faceImage} alt="Captured Face" className="w-full h-full object-cover" />
            )}
            <button
              onClick={onRetake}
              className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs"
            >
              Retake
            </button>
          </div>
        ) : isCameraActive ? (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100" />
        ) : (
          <FiCamera size={32} />
        )}
      </div>

      {!faceImage && (
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
          {isCameraActive ? 'Capture Photo' : 'Scan Face'}
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
