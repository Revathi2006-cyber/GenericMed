import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Reminder {
  id: string;
  medicineName: string;
  dosage: string;
  time: string; // HH:mm format
  days: string[]; // e.g., ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  isActive: boolean;
}

interface ReminderState {
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  updateReminder: (id: string, reminder: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
}

export const useReminderStore = create<ReminderState>()(
  persist(
    (set) => ({
      reminders: [],
      addReminder: (reminder) => set((state) => {
        const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        return {
          reminders: [...state.reminders, { ...reminder, id }]
        };
      }),
      updateReminder: (id, updatedReminder) => set((state) => ({
        reminders: state.reminders.map((r) => r.id === id ? { ...r, ...updatedReminder } : r)
      })),
      deleteReminder: (id) => set((state) => ({
        reminders: state.reminders.filter((r) => r.id !== id)
      })),
      toggleReminder: (id) => set((state) => ({
        reminders: state.reminders.map((r) => r.id === id ? { ...r, isActive: !r.isActive } : r)
      })),
    }),
    {
      name: 'genericmed-reminders',
    }
  )
);
