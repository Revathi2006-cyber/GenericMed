import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Trash2, ChevronRight, AlertTriangle, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'motion/react';

export function History() {
  const navigate = useNavigate();
  const { history, clearHistory, setResults, setPrescriptionImage } = useAppStore();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleViewResult = (item: any) => {
    setResults(item.results);
    setPrescriptionImage(item.image);
    navigate('/results');
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setShowConfirm(false);
  };

  return (
    <div className="px-4 space-y-6 pb-24 relative min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#1E293B] text-slate-900 dark:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Scan History</h2>
        </div>
        {history.length > 0 && (
          <button 
            onClick={() => setShowConfirm(true)}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full transition-colors"
            title="Clear History"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Clear History?</h3>
                  <p className="text-slate-500 dark:text-[#94A3B8] text-sm">
                    This action cannot be undone. All your scanned prescriptions and results will be permanently deleted.
                  </p>
                </div>
                <div className="flex gap-3 w-full pt-2">
                  <button 
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-[#1E293B] text-slate-900 dark:text-white font-semibold hover:bg-slate-200 dark:hover:bg-[#2A374A] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleClearHistory}
                    className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-[#1E293B] flex items-center justify-center mb-2">
            <Clock className="w-8 h-8 text-slate-500 dark:text-[#94A3B8]" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No history yet</h3>
          <p className="text-slate-500 dark:text-[#94A3B8] max-w-[250px]">
            Your scanned prescriptions and results will appear here.
          </p>
          <button 
            onClick={() => navigate('/scan')}
            className="mt-4 px-6 py-2 bg-[#00A3FF] text-white font-medium rounded-full hover:bg-[#008BDB] transition-colors"
          >
            Scan Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div 
              key={item.id} 
              onClick={() => handleViewResult(item)}
              className="bg-slate-100 dark:bg-[#1E293B] rounded-2xl p-4 flex gap-4 items-center cursor-pointer hover:bg-slate-200 dark:hover:bg-[#2A374A] transition-colors border border-white/5"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 dark:bg-[#0B1120] flex-shrink-0 flex items-center justify-center border border-slate-200 dark:border-[#1E293B]">
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt="Prescription thumbnail" 
                    className="w-full h-full object-cover opacity-80"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 dark:text-[#94A3B8]">
                    <span className="text-xs font-medium uppercase tracking-wider">Search</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-slate-900 dark:text-white font-medium truncate">
                  {item.results.length} {item.results.length === 1 ? 'Medicine' : 'Medicines'} Found
                </h3>
                <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
                  {new Date(item.date).toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 dark:text-[#94A3B8]" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
