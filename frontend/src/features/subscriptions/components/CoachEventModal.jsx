import React from 'react';
import { FiX, FiSave, FiCalendar, FiClock, FiMapPin, FiTag } from 'react-icons/fi';

export default function CoachEventModal({
  isOpen,
  onClose,
  eventForm,
  setEventForm,
  recentColors,
  onSave
}) {
  if (!isOpen) return null;

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#191b22] border border-slate-300 dark:border-[#393e4f] rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-[#6d758d] text-sm font-semibold transition-all shadow-xs";
  const labelClass = "flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-gray-300 mb-1.5";
  const primaryButtonClass = "mx-1 flex min-h-[38px] items-center justify-center gap-2 rounded-lg border-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-3.5 py-2 font-sans text-[15px] font-bold normal-case text-black shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <button 
        type="button"
        onClick={onClose} 
        aria-label="Close modal" 
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity" 
      />

      <div className="relative flex w-full max-h-[90svh] sm:max-w-lg flex-col rounded-t-[2rem] sm:rounded-3xl border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-[#393e4f] dark:bg-[#1f222b] text-slate-900 dark:text-gray-100 overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-[#393e4f]" />
        </div>

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-400 dark:border-gray-600 flex justify-between items-center bg-gradient-to-b from-slate-50/80 via-white to-transparent dark:from-[#252833]/50 dark:via-[#1f222b] dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-300 bg-gray-200 text-black shadow-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
              <FiCalendar size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-gray-300">
                Schedule Coach Event
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#6d758d] font-medium">
                Add an activity to the gym's master calendar
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#252833] dark:hover:bg-[#2e3240] text-slate-500 dark:text-gray-300 transition-all border border-slate-200/80 dark:border-[#393e4f] shadow-sm active:scale-95"
          >
            <FiX size={18} />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={onSave} className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(90svh-140px)] custom-scrollbar">
          <label className="block">
            <span className={labelClass}>
              <FiTag size={12} className="text-black dark:text-gray-300" />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label className="block">
              <span className={labelClass}>
                <FiCalendar size={12} className="text-black dark:text-gray-300" />
                Start Date
              </span>
              <input 
                type="date" 
                required 
                value={eventForm.start_date} 
                onChange={e => setEventForm({ ...eventForm, start_date: e.target.value })} 
                className={inputClass} 
              />
            </label>
            <label className="block">
              <span className={labelClass}>
                <FiCalendar size={12} className="text-black dark:text-gray-300" />
                End Date
              </span>
              <input 
                type="date" 
                required 
                value={eventForm.end_date} 
                onChange={e => setEventForm({ ...eventForm, end_date: e.target.value })} 
                className={inputClass} 
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label className="block">
              <span className={labelClass}>
                <FiClock size={12} className="text-black dark:text-gray-300" />
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
                <FiMapPin size={12} className="text-black dark:text-gray-300" />
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

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-400 dark:border-gray-600 mt-5">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 rounded-xl font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-[#252833] transition-colors uppercase tracking-wider text-xs"
            >
              Cancel
            </button>
            <button type="submit" className={primaryButtonClass}>
              <FiSave size={15} /> Save Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
