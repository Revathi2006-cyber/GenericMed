import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Type, Check, Loader2, Activity, ArrowRight, Bell, Volume2, Clock } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useSettings, SOUND_OPTIONS, playNotificationSound } from '../contexts/SettingsContext';

export function Onboarding() {
  const navigate = useNavigate();
  const { 
    theme, setTheme, 
    fontSize, setFontSize,
    notificationSound, setNotificationSound,
    reminderTiming, setReminderTiming
  } = useSettings();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const totalSteps = 5;

  const TIMING_OPTIONS = [
    { label: 'At time of medication', value: 0 },
    { label: '5 minutes before', value: 5 },
    { label: '10 minutes before', value: 10 },
    { label: '15 minutes before', value: 15 },
    { label: '30 minutes before', value: 30 },
  ];

  const handleComplete = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        hasCompletedOnboarding: true,
        theme,
        fontSize,
        notificationSound,
        reminderTiming
      });
      navigate('/', { replace: true });
    } catch (error) {
      console.error("Error saving onboarding preferences:", error);
      navigate('/', { replace: true });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 px-4 py-12 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#111C33] border border-slate-200 dark:border-[#1E293B] rounded-[2rem] p-8 shadow-2xl space-y-8 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00A3FF]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          {/* Progress Bar */}
          <div className="flex gap-1.5 mb-8">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div 
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  step >= i + 1 ? 'bg-[#00A3FF]' : 'bg-slate-100 dark:bg-[#1E293B]'
                }`} 
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-[#00A3FF]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Activity className="w-10 h-10 text-[#00A3FF]" />
                </div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Welcome to GenericMed</h1>
                <p className="text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                  We're here to help you find the most affordable generic alternatives for your prescribed medicines.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-slate-100 dark:border-[#1E293B]">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Save up to 80%</p>
                    <p className="text-xs text-slate-500">Find generic salts at a fraction of branded prices.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-slate-100 dark:border-[#1E293B]">
                  <div className="w-8 h-8 rounded-full bg-[#00A3FF]/20 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-[#00A3FF]" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Safe & Verified</p>
                    <p className="text-xs text-slate-500">All generic alternatives are medically equivalent.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-4 bg-[#00A3FF] hover:bg-[#008BDB] text-white font-black rounded-2xl shadow-[0_0_20px_rgba(0,163,255,0.3)] transition-all flex items-center justify-center gap-2 group"
              >
                Let's Personalize <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Choose your vibe</h2>
                <p className="text-slate-500 dark:text-[#94A3B8]">Select a theme that's easy on your eyes.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${
                    theme === 'light' 
                      ? 'border-[#00A3FF] bg-[#00A3FF]/5 text-[#00A3FF]' 
                      : 'border-slate-100 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120] text-slate-400'
                  }`}
                >
                  <div className={`p-4 rounded-2xl ${theme === 'light' ? 'bg-[#00A3FF] text-white' : 'bg-slate-200 dark:bg-[#1E293B]'}`}>
                    <Sun className="w-8 h-8" />
                  </div>
                  <span className="font-black uppercase tracking-wider text-xs">Light Mode</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${
                    theme === 'dark' 
                      ? 'border-[#00A3FF] bg-[#00A3FF]/5 text-[#00A3FF]' 
                      : 'border-slate-100 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120] text-slate-400'
                  }`}
                >
                  <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-[#00A3FF] text-white' : 'bg-slate-200 dark:bg-[#1E293B]'}`}>
                    <Moon className="w-8 h-8" />
                  </div>
                  <span className="font-black uppercase tracking-wider text-xs">Dark Mode</span>
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-[#1E293B] text-slate-900 dark:text-white font-bold rounded-2xl transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-[2] py-4 bg-[#00A3FF] hover:bg-[#008BDB] text-white font-black rounded-2xl shadow-lg transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Text visibility</h2>
                <p className="text-slate-500 dark:text-[#94A3B8]">Adjust the font size for better readability.</p>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'normal', label: 'Standard', desc: 'Default text size' },
                  { id: 'large', label: 'Large', desc: 'Better for reading' },
                  { id: 'extra-large', label: 'Extra Large', desc: 'Maximum accessibility' }
                ].map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setFontSize(size.id as any)}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${
                      fontSize === size.id 
                        ? 'border-[#00A3FF] bg-[#00A3FF]/5' 
                        : 'border-slate-100 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120]'
                    }`}
                  >
                    <div>
                      <p className={`font-black uppercase tracking-wider text-xs mb-1 ${fontSize === size.id ? 'text-[#00A3FF]' : 'text-slate-400'}`}>
                        {size.label}
                      </p>
                      <p className={`font-bold ${fontSize === size.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-[#94A3B8]'}`}>
                        {size.desc}
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      fontSize === size.id ? 'border-[#00A3FF] bg-[#00A3FF]' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {fontSize === size.id && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-[#1E293B] text-slate-900 dark:text-white font-bold rounded-2xl transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-[2] py-4 bg-[#00A3FF] hover:bg-[#008BDB] text-white font-black rounded-2xl shadow-lg transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Reminder Sound</h2>
                <p className="text-slate-500 dark:text-[#94A3B8]">Pick a sound for your medication alerts.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {SOUND_OPTIONS.map((sound) => (
                  <button
                    key={sound}
                    onClick={() => {
                      setNotificationSound(sound);
                      playNotificationSound(sound);
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                      notificationSound === sound 
                        ? 'border-[#00A3FF] bg-[#00A3FF]/5 text-[#00A3FF]' 
                        : 'border-slate-100 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120] text-slate-400'
                    }`}
                  >
                    <Volume2 className="w-6 h-6" />
                    <span className="font-black uppercase tracking-wider text-[10px]">{sound}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-[#1E293B] text-slate-900 dark:text-white font-bold rounded-2xl transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="flex-[2] py-4 bg-[#00A3FF] hover:bg-[#008BDB] text-white font-black rounded-2xl shadow-lg transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Reminder Timing</h2>
                <p className="text-slate-500 dark:text-[#94A3B8]">When should we notify you?</p>
              </div>

              <div className="space-y-3">
                {TIMING_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setReminderTiming(option.value)}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${
                      reminderTiming === option.value 
                        ? 'border-[#00A3FF] bg-[#00A3FF]/5' 
                        : 'border-slate-100 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className={`w-5 h-5 ${reminderTiming === option.value ? 'text-[#00A3FF]' : 'text-slate-400'}`} />
                      <span className={`font-bold ${reminderTiming === option.value ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-[#94A3B8]'}`}>
                        {option.label}
                      </span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      reminderTiming === option.value ? 'border-[#00A3FF] bg-[#00A3FF]' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {reminderTiming === option.value && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-[#1E293B] text-slate-900 dark:text-white font-bold rounded-2xl transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isSaving}
                  className="flex-[2] py-4 bg-[#00A3FF] hover:bg-[#008BDB] text-white font-black rounded-2xl shadow-[0_0_20px_rgba(0,163,255,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Saving'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

