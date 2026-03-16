import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Trash2, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function History() {
  const navigate = useNavigate();
  const { history, clearHistory, setResults, setPrescriptionImage } = useAppStore();

  const handleViewResult = (item: any) => {
    setResults(item.results);
    setPrescriptionImage(item.image);
    navigate('/results');
  };

  return (
    <div className="px-4 space-y-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-[#1E293B] text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-white">Scan History</h2>
        </div>
        {history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full transition-colors"
            title="Clear History"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#1E293B] flex items-center justify-center mb-2">
            <Clock className="w-8 h-8 text-[#94A3B8]" />
          </div>
          <h3 className="text-xl font-semibold text-white">No history yet</h3>
          <p className="text-[#94A3B8] max-w-[250px]">
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
              className="bg-[#1E293B] rounded-2xl p-4 flex gap-4 items-center cursor-pointer hover:bg-[#2A374A] transition-colors border border-white/5"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#0B1120] flex-shrink-0 flex items-center justify-center border border-[#1E293B]">
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt="Prescription thumbnail" 
                    className="w-full h-full object-cover opacity-80"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                    <span className="text-xs font-medium uppercase tracking-wider">Search</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">
                  {item.results.length} {item.results.length === 1 ? 'Medicine' : 'Medicines'} Found
                </h3>
                <p className="text-sm text-[#94A3B8] mt-1">
                  {new Date(item.date).toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#94A3B8]" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
