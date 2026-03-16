import { Moon, Sun, Type, HelpCircle, Bell, Volume2 } from 'lucide-react';
import { useSettings, SOUND_OPTIONS, NotificationSound, playNotificationSound } from '../contexts/SettingsContext';
import { cn } from '../lib/utils';

export function Settings() {
  const { theme, setTheme, fontSize, setFontSize, notificationSound, setNotificationSound } = useSettings();

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

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
          
          <div className="flex flex-col gap-3">
            {SOUND_OPTIONS.map((sound) => (
              <button
                key={sound}
                onClick={() => {
                  setNotificationSound(sound);
                  playNotificationSound(sound);
                }}
                className={cn(
                  "w-full py-4 px-4 rounded-xl font-medium transition-colors border-2 flex justify-between items-center",
                  notificationSound === sound 
                    ? (theme === 'dark' ? "border-blue-500 bg-slate-700 text-blue-400" : "border-blue-500 bg-blue-50 text-blue-700")
                    : (theme === 'dark' ? "border-slate-700 hover:border-slate-600 text-slate-400" : "border-slate-200 hover:border-slate-300 text-slate-600")
                )}
              >
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5" />
                  <span className="capitalize">{sound}</span>
                </div>
                {notificationSound === sound && <div className="w-3 h-3 rounded-full bg-blue-500" />}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Select the sound you want to hear for your medicine reminders.
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
