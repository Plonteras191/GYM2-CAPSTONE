import { Children, isValidElement, useEffect, useId, useRef, useState } from 'react';
import { FiCheck, FiChevronDown } from 'react-icons/fi';

export default function StyledSelect({
  value = '',
  onChange,
  children,
  className = '',
  required = false,
  disabled = false,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const generatedId = useId();
  const listboxId = `styled-select-options-${generatedId}`;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const options = Children.toArray(children)
    .filter(option => isValidElement(option) && option.type === 'option')
    .map(option => ({
      value: String(option.props.value ?? option.props.children ?? ''),
      label: option.props.children,
      disabled: Boolean(option.props.disabled),
    }));
  const selectedIndex = options.findIndex(option => option.value === String(value));
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : options[0];

  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = event => {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) optionRefs.current[selectedIndex >= 0 ? selectedIndex : 0]?.focus();
  }, [isOpen, selectedIndex]);

  const chooseOption = option => {
    if (option.disabled) return;
    onChange?.({ target: { value: option.value } });
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const moveFocus = (event, currentIndex) => {
    const enabledIndexes = options.reduce((indexes, option, index) => {
      if (!option.disabled) indexes.push(index);
      return indexes;
    }, []);
    if (enabledIndexes.length === 0) return;
    let position = enabledIndexes.indexOf(currentIndex);
    if (event.key === 'ArrowDown') position = (position + 1 + enabledIndexes.length) % enabledIndexes.length;
    else if (event.key === 'ArrowUp') position = (position - 1 + enabledIndexes.length) % enabledIndexes.length;
    else if (event.key === 'Home') position = 0;
    else if (event.key === 'End') position = enabledIndexes.length - 1;
    else return;
    event.preventDefault();
    optionRefs.current[enabledIndexes[position]]?.focus();
  };

  return (
    <div ref={rootRef} onClick={event => event.preventDefault()} className="relative w-full min-w-0">
      {required && (
        <select
          tabIndex={-1}
          aria-hidden="true"
          required
          value={String(value ?? '')}
          onChange={() => {}}
          onClick={event => event.preventDefault()}
          onFocus={() => triggerRef.current?.focus()}
          onInvalid={event => {
            event.preventDefault();
            triggerRef.current?.focus();
          }}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        >
          {options.map(option => (
            <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>
          ))}
        </select>
      )}
      <button
        {...props}
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!isOpen) setIsOpen(true);
            else moveFocus(event, selectedIndex);
          }
        }}
        className={`${className} flex items-center justify-between gap-3 text-left`}
      >
        <span className="min-w-0 flex-1 truncate">{selectedOption?.label}</span>
        <FiChevronDown aria-hidden="true" size={17} className={`shrink-0 text-slate-500 transition-transform duration-200 dark:text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 mt-2 max-h-60 overflow-y-auto rounded-xl border-2 border-slate-300 bg-slate-100 p-1.5 shadow-xl shadow-slate-900/10 dark:border-slate-700/50 dark:bg-[#1e1e1e] dark:shadow-black/40"
        >
          {options.map((option, index) => {
            const isSelected = option.value === String(value);
            return (
              <button
                key={`${option.value}-${index}`}
                ref={element => { optionRefs.current[index] = element; }}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => chooseOption(option)}
                onKeyDown={event => moveFocus(event, index)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isSelected
                    ? 'bg-slate-200 font-semibold text-slate-900 dark:bg-[#303541] dark:text-gray-100'
                    : 'font-medium text-slate-700 hover:bg-slate-200/70 dark:text-gray-300 dark:hover:bg-[#292d37]'
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {isSelected && <FiCheck aria-hidden="true" size={16} className="shrink-0 text-black dark:text-gray-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
