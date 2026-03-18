import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Clock, Pill, Trash2, X, AlertTriangle } from 'lucide-react';
import { useReminderStore } from '../store/useReminderStore';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function Reminders() {
  const navigate = useNavigate();
  const { reminders, addReminder, toggleReminder, deleteReminder } = useReminderStore();
  const [isAdding, setIsAdding] = useState(false);
  
  const [newMedicine, setNewMedicine] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newExpirationDate, setNewExpirationDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>(DAYS);

  const handleAdd = () => {
    if (!newMedicine.trim()) return;
    
    addReminder({
      medicineName: newMedicine,
      dosage: newDosage,
      time: newTime,
      days: selectedDays,
      isActive: true,
      expirationDate: newExpirationDate || undefined,
    });
    
    setNewMedicine('');
    setNewDosage('');
    setNewTime('08:00');
    setNewExpirationDate('');
    setSelectedDays(DAYS);
    setIsAdding(false);
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="px-4 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#1E293B] text-slate-900 dark:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Reminders</h2>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="p-2 bg-[#00A3FF] hover:bg-[#008BDB] text-white rounded-full transition-colors shadow-[0_0_15px_rgba(0,163,255,0.25)]"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-slate-900 dark:text-white">Add Reminder</h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-[#94A3B8] mb-1">Medicine Name</label>
            <input 
              type="text" 
              value={newMedicine}
              onChange={(e) => setNewMedicine(e.target.value)}
              placeholder="e.g. Paracetamol"
              className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00A3FF]"
            />
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-[#94A3B8] mb-1">Dosage</label>
              <input 
                type="text" 
                value={newDosage}
                onChange={(e) => setNewDosage(e.target.value)}
                placeholder="e.g. 1 Tablet"
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00A3FF]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-[#94A3B8] mb-1">Time</label>
                <input 
                  type="time" 
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00A3FF] [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-[#94A3B8] mb-1">Expiration Date</label>
                <input 
                  type="date" 
                  value={newExpirationDate}
                  onChange={(e) => setNewExpirationDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00A3FF] [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-[#94A3B8] mb-2">Repeat Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedDays.includes(day) 
                      ? 'bg-[#00A3FF] text-white' 
                      : 'bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-[#94A3B8] hover:bg-slate-200 dark:hover:bg-[#2A374A]'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleAdd}
            disabled={!newMedicine.trim()}
            className="w-full py-3 mt-2 bg-[#00A3FF] hover:bg-[#008BDB] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
          >
            Save Reminder
          </button>
        </div>
      )}

      <div className="space-y-3">
        {reminders.length === 0 && !isAdding ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 dark:bg-[#1E293B] rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-slate-500 dark:text-[#94A3B8]" />
            </div>
            <p className="text-slate-500 dark:text-[#94A3B8] font-medium">No reminders set yet.</p>
            <p className="text-sm text-[#64748B] mt-1">Tap the + button to add one.</p>
          </div>
        ) : (
          reminders.map(reminder => (
            <div 
              key={reminder.id} 
              className={`p-4 rounded-2xl border transition-colors ${
                reminder.isActive 
                  ? 'bg-white dark:bg-[#111C33] border-slate-200 dark:border-[#1E293B]' 
                  : 'bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-[#1E293B] opacity-60'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    reminder.isActive ? 'bg-[#00A3FF]/10 text-[#00A3FF]' : 'bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-[#94A3B8]'
                  }`}>
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{reminder.medicineName}</h4>
                    <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-0.5">{reminder.dosage}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs font-medium">
                      <span className="flex items-center gap-1.5 text-[#00A3FF]">
                        <Clock className="w-3.5 h-3.5" />
                        {reminder.time}
                      </span>
                      {reminder.expirationDate && (
                        <span className={`flex items-center gap-1.5 ${
                          new Date(reminder.expirationDate) < new Date() 
                            ? 'text-rose-500' 
                            : (new Date(reminder.expirationDate).getTime() - new Date().getTime()) < 7 * 24 * 60 * 60 * 1000 
                              ? 'text-amber-500' 
                              : 'text-slate-500 dark:text-[#94A3B8]'
                        }`}>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Expires: {reminder.expirationDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3">
                  <button 
                    onClick={() => toggleReminder(reminder.id)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      reminder.isActive ? 'bg-[#00A3FF]' : 'bg-slate-100 dark:bg-[#1E293B]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      reminder.isActive ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                  
                  <button 
                    onClick={() => deleteReminder(reminder.id)}
                    className="p-1.5 text-slate-500 dark:text-[#94A3B8] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#1E293B] flex gap-1.5 overflow-x-auto pb-1">
                {DAYS.map(day => (
                  <span 
                    key={day} 
                    className={`text-[10px] px-2 py-1 rounded-md font-medium ${
                      reminder.days.includes(day)
                        ? (reminder.isActive ? 'bg-[#00A3FF]/20 text-[#00A3FF]' : 'bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-[#94A3B8]')
                        : 'text-[#475569]'
                    }`}
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
