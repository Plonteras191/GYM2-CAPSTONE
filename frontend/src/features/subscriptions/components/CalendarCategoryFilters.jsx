import React, { useId, useState } from 'react';
import { FiCheck, FiChevronDown, FiMinus } from 'react-icons/fi';

const countPill = 'shrink-0 rounded-full bg-hover px-2.5 py-0.5 font-display text-sm font-semibold tabular-nums text-ink-2';

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
        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-[background-color,border-color,transform] duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-focus peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-panel ${neutral ? (checked || indeterminate ? 'border-ink bg-ink' : 'border-ink bg-transparent') : ''}`}
        style={{
          ...(neutral ? {} : {
            borderColor: color,
            backgroundColor: checked || indeterminate ? color : 'transparent',
          }),
        }}
      >
        {checked && !indeterminate && <FiCheck className={neutral ? 'text-panel' : 'text-white drop-shadow-sm'} size={11} strokeWidth={3} />}
        {indeterminate && <FiMinus className={neutral ? 'text-panel' : 'text-white drop-shadow-sm'} size={11} strokeWidth={3} />}
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
    <div className="rounded-xl border border-line bg-field p-3 text-ink transition-colors">
      <div className="flex items-center justify-between gap-1.5">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-sm font-semibold leading-tight text-ink">
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
          <span className="min-w-0 whitespace-normal break-words">{title}</span>
        </label>
        <div className="flex shrink-0 items-center gap-1.5">
          <span aria-label={`${categories.length} items`} className={countPill}>{categories.length}</span>
          <button
            type="button"
            onClick={() => setIsExpanded(expanded => !expanded)}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title} items`}
            aria-expanded={isExpanded}
            aria-controls={categoryListId}
            className="press flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-ink"
          >
            <FiChevronDown className={`transition-transform duration-300 ease-out-quint ${isExpanded ? 'rotate-180' : ''}`} size={16} />
          </button>
        </div>
      </div>
      <div id={categoryListId} hidden={!isExpanded} className="mt-3 space-y-1 border-t border-line pt-3">
        {categories.length === 0 ? (
          <p className="px-1 py-1 text-xs text-muted">No packages available.</p>
        ) : categories.map(category => (
          <label key={category.value} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm text-ink-2 transition-colors hover:bg-hover hover:text-ink">
            {renderColorCheckbox(
              selectedValues.includes(category.value),
              category.color || '#64748b',
              { text: `${title}: ${category.label}`, onChange: event => toggleCategory(category.value, event.target.checked) }
            )}
            <span className="min-w-0 flex-1 truncate">{category.label}</span>
            <span aria-label={`${category.count ?? 0} active`} className={countPill}>
              {Number(category.count || 0).toLocaleString()}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
