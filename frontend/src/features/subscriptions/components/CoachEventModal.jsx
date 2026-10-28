import React, { useState } from 'react';
import { FiX, FiSave, FiCalendar, FiClock, FiMapPin, FiTag, FiChevronDown, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi';
import useUnsavedChangesGuard from '../../../components/ui/useUnsavedChangesGuard.jsx';

export default function CoachEventModal({
  isOpen,
  onClose,
  eventForm,
  setEventForm,
  recentColors = [],
  eventCategories = [],
  isSaving = false,
  isSavingCategory = false,
  onUpdateCategory,
  onDeleteCategory,
  onSave
}) {
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryDraft, setCategoryDraft] = useState({ name: '', color: '#eab308' });
  const initialSnapshotRef = React.useRef('');
  const categorySnapshotRef = React.useRef('');
  const currentFormRef = React.useRef({ eventForm, categoryDraft });
  currentFormRef.current = { eventForm, categoryDraft };
  React.useEffect(() => {
    if (isOpen) {
      initialSnapshotRef.current = JSON.stringify(currentFormRef.current.eventForm);
      categorySnapshotRef.current = JSON.stringify(currentFormRef.current.categoryDraft);
      setIsCategoryMenuOpen(false);
      setIsCreatingCategory(false);
      setEditingCategoryId(null);
    } else {
      setIsCategoryMenuOpen(false);
      setIsCreatingCategory(false);
      setEditingCategoryId(null);
    }
  }, [isOpen]);
  const unsavedChangesGuard = useUnsavedChangesGuard(
    isOpen && (
      JSON.stringify(eventForm) !== initialSnapshotRef.current
      || (Boolean(editingCategoryId) && JSON.stringify(categoryDraft) !== categorySnapshotRef.current)
    )
  );
  const requestClose = () => unsavedChangesGuard.requestClose(onClose);

  if (!isOpen) return null;

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#191b22] border border-slate-300 dark:border-[#393e4f] rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-[#6d758d] text-sm font-semibold transition-all shadow-xs";
  const labelClass = "flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-gray-400 mb-1.5";
  const primaryButtonClass = "mx-1 flex min-h-[38px] items-center justify-center gap-2 rounded-lg border-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-3.5 py-2 font-sans text-[15px] font-bold normal-case text-black shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";
  const existingCategory = eventCategories.find(category =>
    category.name.toLowerCase() === (eventForm.category || '').trim().toLowerCase()
  );

  return (
    <>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <button 
        type="button"
        onClick={requestClose}
        aria-label="Close modal" 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border-2 border-gray-300 bg-white text-slate-900 shadow-2xl dark:border-gray-600 dark:bg-[#252830] dark:text-gray-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b-2 border-gray-300 bg-gray-50 px-4 py-3 dark:border-gray-600 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            {eventForm.id ? <FiEdit2 size={19} /> : <FiCalendar size={20} />}
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-gray-300">
              {eventForm.id ? 'Edit Coach Event' : 'Schedule Coach Event'}
            </h3>
          </div>
          <button 
            type="button"
            onClick={requestClose}
            aria-label="Close event form"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-gray-500 shadow-sm transition-colors hover:border-red-400 hover:bg-red-50 hover:text-red-500 dark:border-gray-600 dark:bg-[#252830] dark:text-gray-300 dark:hover:bg-red-500/10"
          >
            <FiX size={18} />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={onSave} className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-100 p-4 dark:bg-[#191b22] sm:p-5">
          <label className="block">
            <span className={labelClass}>
              <FiTag size={12} className="text-black dark:text-gray-400" />
              Event Title
            </span>
            <input 
              type="text" 
              required 
              value={eventForm.title} 
              onChange={e => setEventForm({ ...eventForm, title: e.target.value })} 
              placeholder="e.g. CrossFit WOD, Conditioning Session" 
              className={inputClass} 
            />
          </label>

          <label className="block">
            <span className={labelClass}>
              <FiTag size={12} className="text-black dark:text-gray-400" />
              Category
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCategoryMenuOpen(open => !open)}
                aria-label="Choose an event category"
                aria-expanded={isCategoryMenuOpen}
                className={`${inputClass} flex items-center justify-between gap-3 text-left`}
              >
                <span className="min-w-0 truncate">
                  {isCreatingCategory ? 'Create New Category' : existingCategory?.name || 'Select Category'}
                </span>
                <FiChevronDown className={`shrink-0 text-slate-500 transition-transform dark:text-gray-400 ${isCategoryMenuOpen ? 'rotate-180' : ''}`} size={16} />
              </button>
              {isCategoryMenuOpen && (
                <div className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border-2 border-gray-300 bg-white p-1 shadow-sm dark:border-gray-600 dark:bg-[#191b22]">
                  <button
                    type="button"
                    onClick={() => {
                      setEventForm({ ...eventForm, category: '' });
                      setIsCreatingCategory(true);
                      setIsCategoryMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-black hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-white/[.06]"
                  >
                    <span className="h-3 w-3 shrink-0 rounded-full border border-black/10 bg-transparent dark:border-white/20" />
                    Create New Category
                  </button>
                  {eventCategories.map(category => (
                    <div key={category.id} className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-white/[.06]">
                      {editingCategoryId === category.id ? (
                        <>
                          <input
                            type="text"
                            value={categoryDraft.name}
                            onChange={event => setCategoryDraft({ ...categoryDraft, name: event.target.value })}
                            aria-label="Category name"
                            maxLength={80}
                            className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-black dark:border-gray-600 dark:bg-[#252833] dark:text-gray-300"
                          />
                          <input
                            type="color"
                            value={categoryDraft.color}
                            onChange={event => setCategoryDraft({ ...categoryDraft, color: event.target.value })}
                            aria-label="Category color"
                            className="h-8 w-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-1"
                          />
                          <button
                            type="button"
                            disabled={isSavingCategory || !categoryDraft.name.trim()}
                            onClick={async () => {
                              const saved = await onUpdateCategory?.(category, {
                                name: categoryDraft.name.trim(),
                                color: categoryDraft.color,
                              });
                              if (saved) setEditingCategoryId(null);
                            }}
                            aria-label={`Save ${category.name}`}
                            className="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                          >
                            <FiCheck size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => unsavedChangesGuard.requestClose(() => setEditingCategoryId(null))}
                            aria-label={`Cancel editing ${category.name}`}
                            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-200 dark:text-gray-300 dark:hover:bg-white/[.08]"
                          >
                            <FiX size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEventForm({ ...eventForm, category: category.name, color: category.color });
                              setIsCreatingCategory(false);
                              setIsCategoryMenuOpen(false);
                            }}
                            className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left text-sm text-black dark:text-gray-300"
                          >
                            <span className="h-3 w-3 shrink-0 rounded-full border border-black/10 dark:border-white/20" style={{ backgroundColor: category.color || '#eab308' }} />
                            <span className="truncate">{category.name}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategoryId(category.id);
                              const draft = { name: category.name, color: category.color || '#eab308' };
                              setCategoryDraft(draft);
                              categorySnapshotRef.current = JSON.stringify(draft);
                            }}
                            aria-label={`Edit ${category.name}`}
                            title="Edit category"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-amber-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-500 hover:bg-amber-50 dark:border-[#393e4f] dark:bg-[#191b22] dark:text-amber-400 dark:hover:bg-amber-500/10"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCategory?.(category)}
                            aria-label={`Delete ${category.name}`}
                            title="Delete category"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-red-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-500 hover:bg-red-50 dark:border-[#393e4f] dark:bg-[#191b22] dark:text-red-400 dark:hover:bg-red-500/10"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {isCreatingCategory && (
              <input
                type="text"
                required
                maxLength={80}
                value={eventForm.category || ''}
                onChange={e => {
                  const category = eventCategories.find(item => item.name.toLowerCase() === e.target.value.trim().toLowerCase());
                  setEventForm({
                    ...eventForm,
                    category: e.target.value,
                    ...(category ? { color: category.color } : {}),
                  });
                  if (category) setIsCreatingCategory(false);
                }}
                placeholder="Enter a new category name"
                className={`${inputClass} mt-2`}
              />
            )}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label className="block">
              <span className={labelClass}>
                <FiCalendar size={12} className="text-black dark:text-gray-400" />
                Start Date
              </span>
              <input 
                type="date" 
                required 
                value={eventForm.start_date} 
                onChange={e => setEventForm({
                  ...eventForm,
                  start_date: e.target.value,
                  end_date: eventForm.end_date < e.target.value ? e.target.value : eventForm.end_date,
                })}
                className={inputClass} 
              />
            </label>
            <label className="block">
              <span className={labelClass}>
                <FiCalendar size={12} className="text-black dark:text-gray-400" />
                End Date
              </span>
              <input 
                type="date" 
                required 
                min={eventForm.start_date}
                value={eventForm.end_date} 
                onChange={e => setEventForm({ ...eventForm, end_date: e.target.value })} 
                className={inputClass} 
              />
            </label>
          </div>
          {eventForm.start_date && eventForm.end_date && eventForm.end_date < eventForm.start_date && (
            <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">
              End date must be on or after the start date.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label className="block">
              <span className={labelClass}>
                <FiClock size={12} className="text-black dark:text-gray-400" />
                Start Time
              </span>
              <input 
                type="time" 
                required 
                value={eventForm.start_time} 
                onChange={e => setEventForm({ ...eventForm, start_time: e.target.value })} 
                className={inputClass} 
              />
            </label>
            <label className="block">
              <span className={labelClass}>
                <FiClock size={12} className="text-black dark:text-gray-300" />
                End Time
              </span>
              <input 
                type="time" 
                required 
                value={eventForm.end_time} 
                onChange={e => setEventForm({ ...eventForm, end_time: e.target.value })} 
                className={inputClass} 
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
            <label className="block">
              <span className={labelClass}>
                <FiMapPin size={12} className="text-black dark:text-gray-400" />
                Location / Area
              </span>
              <input 
                type="text" 
                required 
                value={eventForm.location} 
                onChange={e => setEventForm({ ...eventForm, location: e.target.value })} 
                placeholder="e.g. Boxing Ring, Turf Area"
                className={inputClass} 
              />
            </label>
            
            <label className="block">
              <span className={labelClass}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: eventForm.color || '#f59e0b' }} />
                Banner Color
              </span>
              <div className="flex gap-2 items-center h-[42px] px-2 bg-slate-50 dark:bg-[#191b22] border border-slate-300 dark:border-[#393e4f] rounded-xl">
                <input 
                  type="color" 
                  value={eventForm.color} 
                  onChange={e => setEventForm({ ...eventForm, color: e.target.value })} 
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0" 
                />
                <div className="flex flex-wrap gap-1.5 ml-1 border-l border-slate-200 dark:border-[#393e4f] pl-2">
                  {recentColors.map(c => (
                    <button 
                      type="button" 
                      key={c} 
                      onClick={() => setEventForm({ ...eventForm, color: c })} 
                      className={`w-5 h-5 rounded-full border transition-transform hover:scale-125 ${eventForm.color === c ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-slate-900 border-white' : 'border-black/20'}`} 
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </label>
          </div>

          <label className="block">
            <span className={labelClass}>Description</span>
            <textarea
              rows={3}
              maxLength={5000}
              value={eventForm.description || ''}
              onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
              placeholder="Add event details"
              className={inputClass}
            />
          </label>

          {/* Action Buttons */}
          <div className="mt-auto flex items-center justify-end gap-3 rounded-xl border-2 border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-[#252830]">
            <button 
              type="button" 
              onClick={requestClose}
              className="px-4 py-2 rounded-xl font-bold text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#252833] transition-colors uppercase tracking-wider text-xs"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className={primaryButtonClass}>
              <FiSave size={15} /> {isSaving ? 'Saving...' : eventForm.id ? 'Update Event' : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
    {unsavedChangesGuard.dialog}
    </>
  );
}
