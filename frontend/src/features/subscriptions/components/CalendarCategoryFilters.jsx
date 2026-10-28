import React, { useEffect, useId, useState } from 'react';
import { FiCheck, FiChevronDown, FiMinus, FiRotateCcw } from 'react-icons/fi';

export default function CalendarCategoryFilters({
  title,
  categories,
  selectedCategories,
  onChange,
  enabled,
  onEnabledChange,
}) {
  const categoryListId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const colorStorageKey = `calendar-filter-group-color:${title}`;
  const [savedGroupColor, setSavedGroupColor] = useState(() => localStorage.getItem(colorStorageKey));
  const selected = selectedCategories ?? null;
  const allCategoryValues = categories.map(category => category.value);
  const categoryValues = new Set(allCategoryValues);
  const selectedValues = selected === null
    ? allCategoryValues
    : [...new Set(selected.filter(value => categoryValues.has(value)))];
  const allSelected = allCategoryValues.length > 0 && selectedValues.length === allCategoryValues.length;
  const masterChecked = enabled && (allCategoryValues.length === 0 || allSelected);
  const masterIndeterminate = enabled && selectedValues.length > 0 && !allSelected;
  const defaultGroupColor = categories[0]?.color || '#f59e0b';
  const groupColor = savedGroupColor || defaultGroupColor;

  useEffect(() => {
    const syncGroupColor = event => {
      if (event.type === 'storage' && event.key !== colorStorageKey) return;
      if (event.type === 'calendar-filter-group-color-change' && event.detail?.key !== colorStorageKey) return;
      setSavedGroupColor(event.type === 'storage' ? event.newValue : event.detail.value);
    };
    window.addEventListener('storage', syncGroupColor);
    window.addEventListener('calendar-filter-group-color-change', syncGroupColor);
    return () => {
      window.removeEventListener('storage', syncGroupColor);
      window.removeEventListener('calendar-filter-group-color-change', syncGroupColor);
    };
  }, [colorStorageKey]);

  const updateGroupColor = color => {
    localStorage.setItem(colorStorageKey, color);
    setSavedGroupColor(color);
    window.dispatchEvent(new CustomEvent('calendar-filter-group-color-change', {
      detail: { key: colorStorageKey, value: color }
    }));
  };

  const resetGroupColor = () => {
    localStorage.removeItem(colorStorageKey);
    setSavedGroupColor(null);
    window.dispatchEvent(new CustomEvent('calendar-filter-group-color-change', {
      detail: { key: colorStorageKey, value: null }
    }));
  };

  const renderColorCheckbox = (checked, color, label, indeterminate = false) => (
    <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={label.onChange}
        aria-label={label.text}
        aria-checked={indeterminate ? 'mixed' : checked}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-amber-500 dark:peer-focus-visible:ring-offset-[#1b1e26]"
        style={{
          borderColor: color,
          backgroundColor: checked || indeterminate ? color : 'transparent',
        }}
      >
        {checked && !indeterminate && <FiCheck className="text-white drop-shadow-sm" size={11} strokeWidth={3} />}
        {indeterminate && <FiMinus className="text-white drop-shadow-sm" size={11} strokeWidth={3} />}
      </span>
    </span>
  );

  const toggleCategory = (value, checked) => {
    const next = new Set(selectedValues);
    if (checked) next.add(value);
    else next.delete(value);
    if (checked) onEnabledChange(true);
    onChange(allCategoryValues.length > 0 && next.size === allCategoryValues.length ? null : [...next]);
  };

  return (
    <div
      className="rounded-xl border-2 border-gray-300 bg-slate-50 p-3 text-slate-800 transition-colors dark:border-gray-600 dark:bg-[#1b1e26] dark:text-gray-100"
    >
      <div className="flex items-center justify-between gap-1.5">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm font-semibold leading-tight text-slate-700 dark:text-gray-200">
          {renderColorCheckbox(masterChecked, groupColor, {
            text: `${masterChecked ? 'Deactivate' : 'Activate'} all ${title} items`,
            onChange: () => {
              if (masterChecked) {
                onEnabledChange(false);
                onChange([]);
              } else {
                onEnabledChange(true);
                onChange(null);
              }
            }
          }, masterIndeterminate)}
          <span className="min-w-0 whitespace-normal break-words font-bold">{title}</span>
        </label>
        <div className="flex shrink-0 items-center gap-1">
          <span
            aria-label={`${categories.length} items`}
            className="shrink-0 rounded-lg border-2 border-gray-300 bg-white px-2.5 py-1 text-sm font-semibold tabular-nums text-slate-700 dark:border-gray-600 dark:bg-[#252833] dark:text-gray-300"
          >
            {categories.length}
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(expanded => !expanded)}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title} items`}
            aria-expanded={isExpanded}
            aria-controls={categoryListId}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-200 dark:text-gray-300 dark:hover:bg-white/[.08]"
          >
            <FiChevronDown className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} size={16} />
          </button>
        </div>
      </div>
      {(!enabled || !masterChecked) && <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-200/80 pt-2 text-[11px] dark:border-slate-700/50">
        <span className="font-semibold text-amber-700 dark:text-amber-300">
          {!enabled ? 'Group hidden' : `${selectedValues.length} of ${categories.length} items shown`}
        </span>
        {(!enabled || !masterChecked) && (
          <button
            type="button"
            onClick={() => {
              onEnabledChange(true);
              onChange(null);
            }}
            className="shrink-0 font-bold text-amber-700 underline underline-offset-2 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
          >
            Reset filters
          </button>
        )}
      </div>}
      <div id={categoryListId} hidden={!isExpanded} className="mt-3 space-y-2 border-t border-slate-200/80 pt-3 dark:border-slate-700/50">
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-700 dark:bg-[#252833]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Banner Color</span>
          <div className="flex items-center gap-2">
            <label className="relative flex h-8 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-gray-300 bg-white shadow-sm dark:border-gray-600 dark:bg-[#1b1e26]" title={`Edit ${title} banner color`}>
              <span aria-hidden="true" className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: groupColor }} />
              <input
                type="color"
                value={groupColor}
                onChange={event => updateGroupColor(event.target.value)}
                aria-label={`Edit ${title} banner color`}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
            {savedGroupColor && (
              <button
                type="button"
                onClick={resetGroupColor}
                aria-label={`Reset ${title} color`}
                title="Reset color"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 dark:text-gray-300 dark:hover:bg-white/[.08]"
              >
                <FiRotateCcw size={13} />
              </button>
            )}
          </div>
        </div>
        {categories.length === 0 ? (
          <p className="px-1 py-1 text-xs text-slate-500 dark:text-gray-400">No packages available.</p>
        ) : categories.map(category => (
          <label key={category.value} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-xs text-slate-700 transition-colors hover:bg-slate-200/70 dark:text-gray-100 dark:hover:bg-white/[.08]">
            {renderColorCheckbox(
              selectedValues.includes(category.value),
              groupColor,
              { text: `${title}: ${category.label}`, onChange: event => toggleCategory(category.value, event.target.checked) }
            )}
            <span className="min-w-0 flex-1 truncate">{category.label}</span>
            <span aria-label={`${category.count ?? 0} active`} className="shrink-0 rounded-lg border-2 border-gray-300 bg-white px-2.5 py-1 text-sm font-semibold tabular-nums text-slate-700 dark:border-gray-600 dark:bg-[#252833] dark:text-gray-300">
              {Number(category.count || 0).toLocaleString()}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
