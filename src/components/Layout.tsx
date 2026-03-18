import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, User as UserIcon } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../contexts/AuthContext';

export function Layout() {
  const navigate = useNavigate();
  const { fetchHistory } = useAppStore();
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const initial = user?.displayName 
    ? user.displayName[0].toUpperCase() 
    : user?.email 
      ? user.email[0].toUpperCase() 
      : '';

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="w-full max-w-md mx-auto px-4 py-6 flex items-center justify-between">
        <div className="cursor-pointer" onClick={() => navigate('/')}>
          <h1 className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">GenericMed</h1>
          <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] font-medium">Smart Price Checker</p>
        </div>
        <div className="flex items-center gap-5 text-slate-500 dark:text-[#94A3B8]">
          <button onClick={() => navigate('/settings')} className="hover:text-slate-900 dark:hover:text-white transition-colors">
            <SettingsIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={() => navigate('/profile')} 
            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#1E293B] flex items-center justify-center overflow-hidden border border-slate-300 dark:border-[#334155] hover:ring-2 hover:ring-[#00A3FF] transition-all font-bold text-slate-600 dark:text-slate-300 text-sm"
          >
            {user?.photoURL && !imgError ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            ) : initial ? (
              <span>{initial}</span>
            ) : (
              <UserIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-8 w-full max-w-md mx-auto">
        <Outlet />
      </main>
    </div>
  );
}

