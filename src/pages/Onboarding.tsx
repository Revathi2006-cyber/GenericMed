import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Type, Check, Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useSettings } from '../contexts/SettingsContext';

export function Onboarding() {
  const navigate = useNavigate();
  const { theme, setTheme, fontSize, setFontSize } = useSettings();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const handleComplete = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        hasCompletedOnboarding: true,
        theme,
        fontSize
      });
      navigate('/', { replace: true });
    } catch (error) {
      console.error("Error saving onboarding preferences:", error);
      // Even if firestore fails, we should probably let them in, 
      // but let's try to save it.
      navigate('/', { replace: true });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-[#111C33] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-8 shadow-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome!</h1>
          <p className="text-slate-500 dark:text-[#94A3B8]">Let's personalize your experience</p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2">
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-[#00A3FF]' : 'bg-slate-200 dark:bg-[#1E293B]'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-[#00A3FF]' : 'bg-slate-200 dark:bg-[#1E293B]'}`} />
        </div>

        {step === 1 ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-500" />
                Choose your theme
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                    theme === 'light' 
                      ? 'border-[#00A3FF] bg-[#00A3FF]/5 text-[#00A3FF]' 
                      : 'border-slate-100 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120] text-slate-500'
                  }`}
                >
                  <Sun className="w-8 h-8" />
                  <span className="font-bold">Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                    theme === 'dark' 
                      ? 'border-[#00A3FF] bg-[#00A3FF]/5 text-[#00A3FF]' 
                      : 'border-slate-100 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120] text-slate-500'
                  }`}
                >
                  <Moon className="w-8 h-8" />
                  <span className="font-bold">Dark</span>
                </button>
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-4 bg-[#00A3FF] hover:bg-[#008BDB] text-white font-bold rounded-xl shadow-lg transition-all"
            >
              Next
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Type className="w-5 h-5 text-[#00A3FF]" />
                Select text size
              </h2>
              <div className="space-y-3">
                {[
                  { id: 'normal', label: 'Standard', desc: 'Best for most users' },
                  { id: 'large', label: 'Large', desc: 'Easier to read' },
                  { id: 'extra-large', label: 'Extra Large', desc: 'Maximum visibility' }
                ].map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setFontSize(size.id as any)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                      fontSize === size.id 
                        ? 'border-[#00A3FF] bg-[#00A3FF]/5' 
                        : 'border-slate-100 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120]'
                    }`}
                  >
                    <div>
                      <p className={`font-bold ${fontSize === size.id ? 'text-[#00A3FF]' : 'text-slate-900 dark:text-white'}`}>
                        {size.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-[#94A3B8]">{size.desc}</p>
                    </div>
                    {fontSize === size.id && <Check className="w-5 h-5 text-[#00A3FF]" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 bg-slate-100 dark:bg-[#1E293B] text-slate-900 dark:text-white font-bold rounded-xl transition-all"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={isSaving}
                className="flex-[2] py-4 bg-[#00A3FF] hover:bg-[#008BDB] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get Started'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
