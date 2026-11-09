import React from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

export default function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  className = "",
  containerClassName = "relative w-full sm:w-72"
}) {
  return (
    <div className={containerClassName}>
      <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6d758d] text-lg pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-[#191b22] border-2 border-gray-300 dark:border-[#393e4f] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-[#6d758d] font-medium transition-all shadow-sm ${className}`}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-[#6d758d] dark:hover:text-white p-1"
        >
          <FiX size={14} />
        </button>
      )}
    </div>
  );
}
