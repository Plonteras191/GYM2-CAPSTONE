import React from 'react';
import { FiX, FiSave } from 'react-icons/fi';

export default function CoachEventModal({
  isOpen,
  onClose,
  eventForm,
  setEventForm,
  recentColors,
  onSave
}) {
  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-gray-300 font-medium transition-all shadow-sm";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2";
  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600 flex flex-col">
        <div className="p-5 border-b-2 border-gray-300 dark:border-gray-600 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
          <h3 className="text-lg font-bold text-black dark:text-gray-300">Add Coach Event</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={onSave} className="p-6 space-y-4">
          <label className="block">
            <span className={labelClass}>Event Title</span>
            <input 
              type="text" 
              required 
              value={eventForm.title} 
              onChange={e => setEventForm({ ...eventForm, title: e.target.value })} 
              placeholder="e.g. CrossFit WOD" 
              className={inputClass} 
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Start Date</span>
              <input 
                type="date" 
                required 
                value={eventForm.start_date} 
                onChange={e => setEventForm({ ...eventForm, start_date: e.target.value })} 
                className={inputClass} 
              />
            </label>
            <label className="block">
              <span className={labelClass}>End Date</span>
              <input 
                type="date" 
                required 
                value={eventForm.end_date} 
                onChange={e => setEventForm({ ...eventForm, end_date: e.target.value })} 
                className={inputClass} 
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Start Time</span>
              <input 
                type="time" 
                required 
                value={eventForm.start_time} 
                onChange={e => setEventForm({ ...eventForm, start_time: e.target.value })} 
                className={inputClass} 
              />
            </label>
            <label className="block">
              <span className={labelClass}>End Time</span>
              <input 
                type="time" 
                required 
                value={eventForm.end_time} 
                onChange={e => setEventForm({ ...eventForm, end_time: e.target.value })} 
                className={inputClass} 
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Location</span>
              <input 
                type="text" 
                required 
                value={eventForm.location} 
                onChange={e => setEventForm({ ...eventForm, location: e.target.value })} 
                className={inputClass} 
              />
            </label>
            <label className="block">
              <span className={labelClass}>Banner Color</span>
              <div className="flex gap-2 mt-1 items-center">
                <input 
                  type="color" 
                  value={eventForm.color} 
                  onChange={e => setEventForm({ ...eventForm, color: e.target.value })} 
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600 bg-transparent p-1" 
                />
                <div className="flex flex-wrap gap-1.5 ml-2 border-l border-gray-300 dark:border-gray-600 pl-3">
                  {recentColors.map(c => (
                    <button 
                      type="button" 
                      key={c} 
                      onClick={() => setEventForm({ ...eventForm, color: c })} 
                      className="w-6 h-6 rounded-full border border-gray-400 dark:border-gray-500 shadow-sm transition-transform hover:scale-110" 
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors uppercase tracking-wide text-xs"
            >
              Cancel
            </button>
            <button type="submit" className={primaryButtonClass + " !text-xs !px-5"}>
              <FiSave size={16} /> Save Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
