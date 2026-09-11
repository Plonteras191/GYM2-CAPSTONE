import React from 'react';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export default function AlertDialog({ isOpen, title, message, onClose, type = 'success' }) {
  if (!isOpen) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center">
        <div className={`mx-auto mb-4 w-12 h-12 flex items-center justify-center rounded-full ${
          isSuccess 
            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
            : 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
        }`}>
          {isSuccess ? <FiCheckCircle className="w-7 h-7" /> : <FiAlertCircle className="w-7 h-7" />}
        </div>
        
        <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{message}</p>

        <button
          onClick={onClose}
          className={`mt-6 w-full py-2.5 px-4 text-sm font-semibold text-white rounded-xl shadow-md transition-colors ${
            isSuccess 
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' 
              : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
          }`}
        >
          OK
        </button>
      </div>
    </div>
  );
}
