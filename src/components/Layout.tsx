import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Settings as SettingsIcon } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAppStore } from '../store/useAppStore';

export function Layout() {
  const navigate = useNavigate();
  const { fetchHistory } = useAppStore();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0B1120] text-slate-100">
      {/* Header */}
      <header className="w-full max-w-md mx-auto px-4 py-6 flex items-center justify-between">
        <div className="cursor-pointer" onClick={() => navigate('/')}>
          <h1 className="font-bold text-xl tracking-tight text-white">GenericMed</h1>
          <p className="text-[11px] text-[#94A3B8] font-medium">Smart Price Checker</p>
        </div>
        <div className="flex items-center gap-5 text-[#94A3B8]">
          <button onClick={handleSignOut} className="hover:text-white transition-colors"><LogOut className="w-5 h-5" /></button>
          <button onClick={() => navigate('/settings')} className="hover:text-white transition-colors"><SettingsIcon className="w-5 h-5" /></button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-8 w-full max-w-md mx-auto">
        <Outlet />
      </main>
    </div>
  );
}

