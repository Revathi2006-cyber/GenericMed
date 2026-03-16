import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, Store, Bell, Shield, TrendingDown, Heart, Loader2, Clock, Search } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { searchMedicine } from '../services/geminiService';

export function Home() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setPrescriptionImage, setResults, setIsLoading, saveToHistory } = useAppStore();
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrescriptionImage(reader.result as string);
        navigate('/scan');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setIsLoading(true);
    try {
      const results = await searchMedicine(searchQuery);
      setResults(results);
      setPrescriptionImage(''); // Clear image for search results
      saveToHistory('', results); // Save with empty image
      navigate('/results');
    } catch (error) {
      alert("Failed to search medicine. Please try again.");
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  };

  const handleFindStores = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          const { latitude, longitude } = position.coords;
          window.open(`https://www.google.com/maps/search/pharmacies+near+me/@${latitude},${longitude},15z`, '_blank');
        },
        (error) => {
          console.warn("Geolocation failed or denied, falling back to generic search.", error);
          setIsLocating(false);
          window.open('https://www.google.com/maps/search/pharmacies+near+me', '_blank');
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setIsLocating(false);
      window.open('https://www.google.com/maps/search/pharmacies+near+me', '_blank');
    }
  };

  return (
    <div className="px-4 space-y-4">
      {/* Hero Card */}
      <div className="bg-[#111C33] border border-[#1E293B] rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Save up to 80%<br/>on medicines</h2>
        <p className="text-[#94A3B8] text-sm leading-relaxed mb-4">
          Scan your prescription to instantly find affordable generic alternatives with the same active ingredients.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[#94A3B8]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicine name..."
            className="block w-full pl-10 pr-12 py-3 bg-[#0B1120] border border-[#1E293B] rounded-xl text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A3FF] focus:border-transparent transition-all"
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={!searchQuery.trim() || isSearching}
            className="absolute inset-y-1 right-1 px-3 bg-[#00A3FF] hover:bg-[#008BDB] disabled:bg-[#1E293B] disabled:text-[#94A3B8] text-white rounded-lg flex items-center justify-center transition-colors"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}
          </button>
        </form>
      </div>

      {/* Primary Actions */}
      <div className="space-y-3 pt-2">
        <button 
          onClick={() => navigate('/scan')}
          className="w-full bg-[#00A3FF] hover:bg-[#008BDB] text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,163,255,0.25)] transition-all"
        >
          <Camera className="w-5 h-5" /> Scan Prescription
        </button>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-[#1E293B] hover:bg-[#2A374A] text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <Upload className="w-5 h-5" /> Upload Photo
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Grid Actions */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        <button 
          onClick={handleFindStores}
          disabled={isLocating}
          className="bg-transparent border border-[#1E293B] hover:bg-[#111C33] disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
        >
          {isLocating ? (
            <Loader2 className="w-6 h-6 text-[#00A3FF] animate-spin" />
          ) : (
            <Store className="w-6 h-6 text-[#94A3B8]" />
          )}
          <span className="text-xs font-semibold">{isLocating ? 'Locating...' : 'Find Stores'}</span>
        </button>
        <button 
          onClick={() => navigate('/reminders')}
          className="bg-transparent border border-[#1E293B] hover:bg-[#111C33] text-white py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
        >
          <Bell className="w-6 h-6 text-[#94A3B8]" />
          <span className="text-xs font-semibold">Reminders</span>
        </button>
        <button 
          onClick={() => navigate('/history')}
          className="bg-transparent border border-[#1E293B] hover:bg-[#111C33] text-white py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
        >
          <Clock className="w-6 h-6 text-[#94A3B8]" />
          <span className="text-xs font-semibold">History</span>
        </button>
      </div>

      {/* Features */}
      <div className="space-y-3 pt-2">
        <FeatureItem 
          icon={<Shield className="w-5 h-5 text-[#00A3FF]" />} 
          title="Same Ingredients" 
          desc="Generics contain identical active ingredients" 
        />
        <FeatureItem 
          icon={<TrendingDown className="w-5 h-5 text-[#00A3FF]" />} 
          title="Huge Savings" 
          desc="Save ₹100s on every prescription" 
        />
        <FeatureItem 
          icon={<Heart className="w-5 h-5 text-[#00A3FF]" />} 
          title="Doctor Approved" 
          desc="Generic medicines are approved by CDSCO" 
        />
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#111C33] border border-[#1E293B]">
      <div className="w-10 h-10 rounded-full bg-[#00A3FF]/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-sm text-white">{title}</h4>
        <p className="text-xs text-[#94A3B8] mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
