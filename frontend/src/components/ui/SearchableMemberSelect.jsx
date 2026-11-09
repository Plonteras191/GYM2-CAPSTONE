import React from 'react';
import { FiCheck, FiChevronDown } from 'react-icons/fi';

export default function SearchableMemberSelect({
  members = [],
  value,
  onChange,
  placeholder = 'Type member name',
  required = false,
  fallbackMember = null,
  selectedLabel = '',
}) {
  const [query, setQuery] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listboxId = `member-search-options-${React.useId()}`;
  const skipSyncRef = React.useRef(false);
  const lastValueRef = React.useRef(value);

  const memberOptions = React.useMemo(() => {
    if (!fallbackMember || members.some(member => String(member.id) === String(fallbackMember.id))) {
      return members;
    }
    return [...members, fallbackMember];
  }, [fallbackMember, members]);

  React.useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      lastValueRef.current = value;
      return;
    }

    const selectedMember = memberOptions.find(member => String(member.id) === String(value));
    if (selectedMember) {
      setQuery(`${selectedMember.first_name} ${selectedMember.last_name}`.trim());
    } else if (selectedLabel && lastValueRef.current === value) {
      setQuery(selectedLabel);
    } else if (lastValueRef.current) {
      setQuery('');
    }
    lastValueRef.current = value;
  }, [memberOptions, selectedLabel, value]);

  const matchingMembers = memberOptions
    .filter(member => `${member.first_name} ${member.last_name}`.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 8);

  const chooseMember = member => {
    skipSyncRef.current = true;
    lastValueRef.current = member.id;
    setQuery(`${member.first_name} ${member.last_name}`.trim());
    setIsOpen(false);
    onChange(String(member.id));
  };

  const handleChange = event => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    setActiveIndex(0);
    setIsOpen(true);
    const exactMatch = memberOptions.find(member =>
      `${member.first_name} ${member.last_name}`.trim().toLowerCase() === nextQuery.trim().toLowerCase()
    );
    if (exactMatch) {
      chooseMember(exactMatch);
    } else {
      skipSyncRef.current = true;
      lastValueRef.current = '';
      onChange('');
    }
  };

  const handleKeyDown = event => {
    if (event.key === 'ArrowDown' && matchingMembers.length) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex(index => (index + 1) % matchingMembers.length);
    } else if (event.key === 'ArrowUp' && matchingMembers.length) {
      event.preventDefault();
      setActiveIndex(index => (index - 1 + matchingMembers.length) % matchingMembers.length);
    } else if (event.key === 'Enter' && isOpen && matchingMembers[activeIndex]) {
      event.preventDefault();
      chooseMember(matchingMembers[activeIndex]);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          autoComplete="off"
          required={required}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
          placeholder={placeholder}
          className="w-full rounded-xl border-2 border-gray-300 bg-white py-2.5 pl-4 pr-10 font-medium text-slate-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-gray-600 dark:bg-[#1e1e1e] dark:text-gray-100"
        />
        <FiChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      </div>
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-40 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border-2 border-slate-300 bg-slate-100 p-1.5 shadow-xl shadow-slate-900/10 dark:border-slate-700/50 dark:bg-[#1e1e1e] dark:shadow-black/40"
        >
          {matchingMembers.length ? matchingMembers.map((member, index) => {
            const name = `${member.first_name} ${member.last_name}`.trim();
            return (
              <button
                key={member.id}
                type="button"
                role="option"
                aria-selected={String(member.id) === String(value)}
                onMouseDown={event => event.preventDefault()}
                onClick={() => chooseMember(member)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  String(member.id) === String(value)
                    ? 'bg-slate-200 font-semibold text-slate-900 dark:bg-[#303541] dark:text-gray-100'
                    : index === activeIndex
                      ? 'bg-slate-200/70 font-medium text-slate-800 dark:bg-[#292d37] dark:text-gray-100'
                      : 'font-medium text-slate-700 hover:bg-slate-200/70 dark:text-gray-300 dark:hover:bg-[#292d37]'
                }`}
                >
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                  {String(member.id) === String(value) && (
                    <FiCheck aria-hidden="true" size={16} className="shrink-0 text-black dark:text-gray-400" />
                  )}
                </button>
            );
          }) : (
            <p className="px-3 py-2 text-sm text-slate-500 dark:text-gray-400">
              {query.trim() ? 'No matching members found.' : 'No members available.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
