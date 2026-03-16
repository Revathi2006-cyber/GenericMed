import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';
type FontSize = 'normal' | 'large' | 'extra-large';
export type NotificationSound = 'default' | 'chime' | 'bell' | 'digital';

export const SOUND_OPTIONS: NotificationSound[] = ['default', 'chime', 'bell', 'digital'];

export function playNotificationSound(type: NotificationSound) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const playTone = (freq: number, oscType: OscillatorType, startTime: number, duration: number, vol: number = 0.1) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;

    switch (type) {
      case 'default':
        // Short double beep
        playTone(800, 'sine', now, 0.15);
        playTone(800, 'sine', now + 0.2, 0.15);
        break;
      case 'chime':
        // Pleasant ding-dong
        playTone(659.25, 'sine', now, 0.6, 0.15); // E5
        playTone(523.25, 'sine', now + 0.4, 0.8, 0.15); // C5
        break;
      case 'bell':
        // High pitched ringing
        playTone(1200, 'sine', now, 0.8, 0.1);
        playTone(1205, 'sine', now, 0.8, 0.1); // slight dissonance for bell effect
        break;
      case 'digital':
        // Fast digital beeps
        playTone(1000, 'square', now, 0.1, 0.05);
        playTone(1000, 'square', now + 0.15, 0.1, 0.05);
        playTone(1000, 'square', now + 0.3, 0.1, 0.05);
        playTone(1000, 'square', now + 0.45, 0.1, 0.05);
        break;
    }
  } catch (e) {
    console.error("Audio play failed:", e);
  }
}

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  notificationSound: NotificationSound;
  setNotificationSound: (sound: NotificationSound) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [fontSize, setFontSize] = useState<FontSize>('large'); // Default to large for elderly
  const [notificationSound, setNotificationSound] = useState<NotificationSound>('default');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('text-base', 'text-lg', 'text-xl');
    if (fontSize === 'normal') root.classList.add('text-base');
    if (fontSize === 'large') root.classList.add('text-lg');
    if (fontSize === 'extra-large') root.classList.add('text-xl');
  }, [fontSize]);

  return (
    <SettingsContext.Provider value={{ theme, setTheme, fontSize, setFontSize, notificationSound, setNotificationSound }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
