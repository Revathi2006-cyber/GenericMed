import { useState } from 'react';
import { Moon, Sun, Type, HelpCircle, Bell, Volume2, Clock, Repeat, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSettings, SOUND_OPTIONS, playNotificationSound } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseError';
import { cn } from '../lib/utils';

export function Settings() {
  const { user } = useAuth();
  const { 
    theme, setTheme, 
    fontSize, setFontSize, 
    notificationSound, setNotificationSound,
    reminderTiming, setReminderTiming,
    reminderRepeat, setReminderRepeat
  } = useSettings();

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const TIMING_OPTIONS = [
    { label: 'At time of medication', value: 0 },
    { label: '5 minutes before', value: 5 },
    { label: '10 minutes before', value: 10 },
    { label: '15 minutes before', value: 15 },
    { label: '30 minutes before', value: 30 },
  ];

  const REPEAT_OPTIONS = [
    { label: 'Once', value: 1 },
    { label: 'Twice (5m apart)', value: 2 },
    { label: 'Three times (5m apart)', value: 3 },
  ];

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      const path = `users/${user.uid}`;
      await updateDoc(doc(db, path), {
        theme,
        fontSize,
        notificationSound,
        reminderTiming,
        reminderRepeat,
        updatedAt: new Date().toISOString()
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, auth);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto pb-32 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Settings</h2>
        {user && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-lg",
              saveStatus === 'success' 
                ? "bg-emerald-500 text-white" 
                : saveStatus === 'error'
                  ? "bg-rose-500 text-white"
                  : "bg-[#00A3FF] hover:bg-[#008BDB] text-white disabled:opacity-50"
            )}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : saveStatus === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : saveStatus === 'error' ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save Settings'}
          </button>
        )}
      </div>

      {saveStatus === 'success' && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          Settings saved successfully to your profile.
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          Failed to save settings. Please try again.
        </div>
      )}

      <div className="space-y-6">
        {/* Theme Settings */}
        <section className={cn(
          "p-6 rounded-2xl shadow-sm space-y-4",
          theme === 'dark' ? "bg-slate-800" : "bg-white border border-slate-200"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-500/10 p-2 rounded-lg">
              {theme === 'dark' ? <Moon className="w-6 h-6 text-indigo-400" /> : <Sun className="w-6 h-6 text-indigo-500" />}
            </div>
            <h3 className="text-xl font-semibold">Appearance</h3>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => setTheme('light')}
              className={cn(
                "flex-1 py-3 rounded-xl font-medium transition-colors border-2",
                theme === 'light' 
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700" 
                  : "border-slate-200 hover:border-slate-300 text-slate-600"
              )}
            >
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                "flex-1 py-3 rounded-xl font-medium transition-colors border-2",
                theme === 'dark' 
                  ? "border-indigo-500 bg-slate-700 text-indigo-300" 
                  : "border-slate-700 hover:border-slate-600 text-slate-400"
              )}
            >
              Dark
            </button>
          </div>
        </section>

        {/* Font Size Settings */}
        <section className={cn(
          "p-6 rounded-2xl shadow-sm space-y-4",
          theme === 'dark' ? "bg-slate-800" : "bg-white border border-slate-200"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-500/10 p-2 rounded-lg">
              <Type className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold">Text Size</h3>
          </div>
          
          <div className="flex flex-col gap-3">
            {(['normal', 'large', 'extra-large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={cn(
                  "w-full py-4 px-4 rounded-xl font-medium transition-colors border-2 flex justify-between items-center",
                  fontSize === size 
                    ? (theme === 'dark' ? "border-emerald-500 bg-slate-700 text-emerald-400" : "border-emerald-500 bg-emerald-50 text-emerald-700")
                    : (theme === 'dark' ? "border-slate-700 hover:border-slate-600 text-slate-400" : "border-slate-200 hover:border-slate-300 text-slate-600")
                )}
              >
                <span className="capitalize">{size.replace('-', ' ')}</span>
                {fontSize === size && <div className="w-3 h-3 rounded-full bg-emerald-500" />}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Choose a larger text size to make reading easier.
          </p>
        </section>

        {/* Notification Sound Settings */}
        <section className={cn(
          "p-6 rounded-2xl shadow-sm space-y-4",
          theme === 'dark' ? "bg-slate-800" : "bg-white border border-slate-200"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Bell className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold">Reminder Sound</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {SOUND_OPTIONS.map((sound) => (
              <button
                key={sound}
                onClick={() => {
                  setNotificationSound(sound);
                  playNotificationSound(sound);
                }}
                className={cn(
                  "py-3 px-4 rounded-xl font-medium transition-colors border-2 flex flex-col items-center gap-2",
                  notificationSound === sound 
                    ? (theme === 'dark' ? "border-blue-500 bg-slate-700 text-blue-400" : "border-blue-500 bg-blue-50 text-blue-700")
                    : (theme === 'dark' ? "border-slate-700 hover:border-slate-600 text-slate-400" : "border-slate-200 hover:border-slate-300 text-slate-600")
                )}
              >
                <Volume2 className="w-5 h-5" />
                <span className="capitalize text-sm">{sound}</span>
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Select the sound you want to hear for your medicine reminders.
          </p>
        </section>

        {/* Reminder Timing Settings */}
        <section className={cn(
          "p-6 rounded-2xl shadow-sm space-y-4",
          theme === 'dark' ? "bg-slate-800" : "bg-white border border-slate-200"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-rose-500/10 p-2 rounded-lg">
              <Clock className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-xl font-semibold">Reminder Timing</h3>
          </div>
          
          <div className="flex flex-col gap-3">
            {TIMING_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setReminderTiming(option.value)}
                className={cn(
                  "w-full py-4 px-4 rounded-xl font-medium transition-colors border-2 flex justify-between items-center",
                  reminderTiming === option.value 
                    ? (theme === 'dark' ? "border-rose-500 bg-slate-700 text-rose-400" : "border-rose-500 bg-rose-50 text-rose-700")
                    : (theme === 'dark' ? "border-slate-700 hover:border-slate-600 text-slate-400" : "border-slate-200 hover:border-slate-300 text-slate-600")
                )}
              >
                <span>{option.label}</span>
                {reminderTiming === option.value && <div className="w-3 h-3 rounded-full bg-rose-500" />}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Choose how early you want to be notified before your medication time.
          </p>
        </section>

        {/* Reminder Frequency Settings */}
        <section className={cn(
          "p-6 rounded-2xl shadow-sm space-y-4",
          theme === 'dark' ? "bg-slate-800" : "bg-white border border-slate-200"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-cyan-500/10 p-2 rounded-lg">
              <Repeat className="w-6 h-6 text-cyan-500" />
            </div>
            <h3 className="text-xl font-semibold">Alert Frequency</h3>
          </div>
          
          <div className="flex flex-col gap-3">
            {REPEAT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setReminderRepeat(option.value)}
                className={cn(
                  "w-full py-4 px-4 rounded-xl font-medium transition-colors border-2 flex justify-between items-center",
                  reminderRepeat === option.value 
                    ? (theme === 'dark' ? "border-cyan-500 bg-slate-700 text-cyan-400" : "border-cyan-500 bg-cyan-50 text-cyan-700")
                    : (theme === 'dark' ? "border-slate-700 hover:border-slate-600 text-slate-400" : "border-slate-200 hover:border-slate-300 text-slate-600")
                )}
              >
                <span>{option.label}</span>
                {reminderRepeat === option.value && <div className="w-3 h-3 rounded-full bg-cyan-500" />}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-2">
            How many times should the alert repeat if not dismissed?
          </p>
        </section>

        {/* Help & Instructions */}
        <section className={cn(
          "p-6 rounded-2xl shadow-sm space-y-4",
          theme === 'dark' ? "bg-slate-800" : "bg-white border border-slate-200"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-500/10 p-2 rounded-lg">
              <HelpCircle className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-xl font-semibold">Help & Info</h3>
          </div>
          
          <div className="space-y-3 text-sm">
            <p className={theme === 'dark' ? "text-slate-400" : "text-slate-600"}>
              <strong className="text-slate-200 dark:text-slate-300">1. Scan:</strong> Tap the Scan button and take a clear photo of your prescription.
            </p>
            <p className={theme === 'dark' ? "text-slate-400" : "text-slate-600"}>
              <strong className="text-slate-200 dark:text-slate-300">2. Review:</strong> We will identify the branded medicines and find cheaper generic alternatives with the same salt.
            </p>
            <p className={theme === 'dark' ? "text-slate-400" : "text-slate-600"}>
              <strong className="text-slate-200 dark:text-slate-300">3. Save:</strong> Show the generic names to your pharmacist to save money.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

