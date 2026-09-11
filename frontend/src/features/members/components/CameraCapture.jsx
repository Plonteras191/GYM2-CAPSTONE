import React from 'react';
import { FiCamera, FiCheckCircle, FiVideoOff } from 'react-icons/fi';

export default function CameraCapture({ isCameraActive, faceImage, videoRef, canvasRef, onStart, onCapture, onStop, onRetake }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700/50 p-6 rounded-xl flex flex-col items-center justify-center text-center gap-3">
      <h4 className="font-bold text-slate-800 dark:text-gray-200 uppercase tracking-wide text-sm">Facial Recognition</h4>

      <div className={`mt-2 w-32 h-32 rounded-2xl border-2 flex items-center justify-center overflow-hidden transition-all ${
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
          className={`mt-1 text-xs font-bold hover:underline px-4 py-1.5 rounded-full transition-colors ${
            isCameraActive
              ? 'bg-amber-500 text-black shadow-md no-underline hover:bg-amber-400'
              : 'text-amber-600 dark:text-amber-500'
          }`}
        >
          {isCameraActive ? 'Capture Photo' : 'Scan Face Data Now'}
        </button>
      )}

      {isCameraActive && (
        <button
          type="button"
          onClick={onStop}
          className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline flex items-center gap-1 mt-1"
        >
          <FiVideoOff /> Cancel
        </button>
      )}
    </div>
  );
}
