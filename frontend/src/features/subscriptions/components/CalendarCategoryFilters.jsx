import React, { useId, useState } from 'react';
import { FiCheck, FiChevronDown, FiMinus } from 'react-icons/fi';

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
  const selected = selectedCategories ?? null;
  const allCategoryValues = categories.map(category => category.value);
  const categoryValues = new Set(allCategoryValues);
  const selectedValues = selected === null
    ? allCategoryValues
    : [...new Set(selected.filter(value => categoryValues.has(value)))];
  const allSelected = allCategoryValues.length > 0 && selectedValues.length === allCategoryValues.length;
  const masterChecked = enabled && (allCategoryValues.length === 0 || allSelected);
  const masterIndeterminate = enabled && selectedValues.length > 0 && !allSelected;

  const renderColorCheckbox = (checked, color, label, indeterminate = false, neutral = false) => (
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
        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-amber-500 dark:peer-focus-visible:ring-offset-[#1b1e26] ${neutral ? (checked || indeterminate ? 'border-gray-900 bg-gray-900 dark:border-gray-300 dark:bg-gray-300' : 'border-gray-900 bg-transparent dark:border-gray-300') : ''}`}
        style={{
          ...(neutral ? {} : {
            borderColor: color,
            backgroundColor: checked || indeterminate ? color : 'transparent',
          }),
        }}
      >
        {checked && !indeterminate && <FiCheck className={neutral ? 'text-gray-300 dark:text-gray-900' : 'text-white drop-shadow-sm'} size={11} strokeWidth={3} />}
        {indeterminate && <FiMinus className={neutral ? 'text-gray-300 dark:text-gray-900' : 'text-white drop-shadow-sm'} size={11} strokeWidth={3} />}
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
          {renderColorCheckbox(masterChecked, '#000000', {
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
          }, masterIndeterminate, true)}
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
      <div id={categoryListId} hidden={!isExpanded} className="mt-3 space-y-2 border-t border-slate-200/80 pt-3 dark:border-slate-700/50">
        {categories.length === 0 ? (
          <p className="px-1 py-1 text-xs text-slate-500 dark:text-gray-400">No packages available.</p>
        ) : categories.map(category => (
          <label key={category.value} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-xs text-slate-700 transition-colors hover:bg-slate-200/70 dark:text-gray-100 dark:hover:bg-white/[.08]">
            {renderColorCheckbox(
              selectedValues.includes(category.value),
              category.color || '#64748b',
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
