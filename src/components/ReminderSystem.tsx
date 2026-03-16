import React, { useEffect, useState } from 'react';
import { useReminderStore, Reminder } from '../store/useReminderStore';
import { useSettings, playNotificationSound } from '../contexts/SettingsContext';
import { Bell, Pill, X } from 'lucide-react';

const DAYS_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ReminderSystem() {
  const { reminders } = useReminderStore();
  const { notificationSound } = useSettings();
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);
  const [lastCheckedMinute, setLastCheckedMinute] = useState<string>('');

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentDay = DAYS_MAP[now.getDay()];
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      
      // Prevent checking multiple times per minute
      if (currentTime === lastCheckedMinute) return;
      
      const triggered = reminders.filter(reminder => {
        return reminder.isActive && 
               reminder.time === currentTime && 
               reminder.days.includes(currentDay);
      });

      if (triggered.length > 0) {
        setLastCheckedMinute(currentTime);
        setActiveReminders(prev => {
          // Avoid adding duplicates if they are already showing
          const newReminders = triggered.filter(t => !prev.some(p => p.id === t.id));
          if (newReminders.length > 0) {
            playNotificationSound(notificationSound);
          }
          return [...prev, ...newReminders];
        });
      } else {
        // Only update lastCheckedMinute if there are no reminders triggered,
        // so we don't accidentally skip a reminder if it's added exactly at that minute
        // but actually we want to update it so we don't keep checking.
        // Wait, if we update it, we won't check again this minute.
        setLastCheckedMinute(currentTime);
      }
    };

    // Check immediately and then every 10 seconds
    checkReminders();
    const interval = setInterval(checkReminders, 10000);

    return () => clearInterval(interval);
  }, [reminders, lastCheckedMinute, notificationSound]);

  const dismissReminder = (id: string) => {
    setActiveReminders(prev => prev.filter(r => r.id !== id));
  };

  if (activeReminders.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm space-y-4">
        {activeReminders.map(reminder => (
          <div key={reminder.id} className="bg-[#111C33] border border-[#00A3FF] rounded-2xl p-6 shadow-[0_0_30px_rgba(0,163,255,0.3)] animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#00A3FF]/20 flex items-center justify-center text-[#00A3FF]">
                  <Bell className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Time for Medicine</h3>
                  <p className="text-[#00A3FF] font-medium">{reminder.time}</p>
                </div>
              </div>
              <button 
                onClick={() => dismissReminder(reminder.id)}
                className="p-2 text-[#94A3B8] hover:text-white hover:bg-[#1E293B] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-[#0B1120] rounded-xl p-4 flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#1E293B] flex items-center justify-center text-white">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-lg">{reminder.medicineName}</h4>
                <p className="text-[#94A3B8]">{reminder.dosage}</p>
              </div>
            </div>
            
            <button 
              onClick={() => dismissReminder(reminder.id)}
              className="w-full py-3.5 bg-[#00A3FF] hover:bg-[#008BDB] text-white font-bold rounded-xl transition-colors"
            >
              I've taken it
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
