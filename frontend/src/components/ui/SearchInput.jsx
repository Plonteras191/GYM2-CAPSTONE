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
      <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-lg pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full pl-10 pr-10 py-2.5 bg-field border border-line rounded-xl focus:outline-none focus:border-focus focus:ring-2 focus:ring-focus/25 text-ink placeholder:text-muted font-medium transition-[border-color,box-shadow,background-color] duration-200 hover:bg-hover ${className}`}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink rounded-md p-1.5 transition-colors"
        >
          <FiX size={14} />
        </button>
      )}
    </div>
  );
}
