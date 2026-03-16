import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, Loader2, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { analyzePrescription } from '../services/geminiService';

export function Scan() {
  const navigate = useNavigate();
  const { prescriptionImage, setPrescriptionImage, setResults, setIsLoading, isLoading, saveToHistory } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(prescriptionImage);

  useEffect(() => {
    setPreview(prescriptionImage);
  }, [prescriptionImage]);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        setPrescriptionImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!preview) return;
    
    setIsLoading(true);
    try {
      const results = await analyzePrescription(preview);
      setResults(results);
      saveToHistory(preview, results);
      navigate('/results');
    } catch (error) {
      alert("Failed to analyze prescription. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 space-y-6 flex flex-col items-center justify-center min-h-[70vh]">
      
      {!preview ? (
        <div className="w-full space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-[#1E293B] text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-white">Scan Prescription</h2>
          </div>
          <p className="text-[#94A3B8]">
            Take a clear photo of your doctor's prescription.
          </p>

          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-[#00A3FF]/50 bg-[#00A3FF]/10 hover:bg-[#00A3FF]/20 transition-colors"
            >
              <Camera className="w-16 h-16 text-[#00A3FF] mb-4" />
              <span className="text-lg font-semibold text-[#00A3FF]">Open Camera</span>
            </button>
            
            <label className="flex items-center justify-center gap-2 p-4 rounded-xl cursor-pointer transition-colors bg-[#1E293B] hover:bg-[#2A374A] text-white">
              <ImageIcon className="w-6 h-6 text-[#94A3B8]" />
              <span className="font-medium">Upload from Gallery</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCapture}
              />
            </label>
          </div>
          
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            className="hidden"
            onChange={handleCapture}
          />
        </div>
      ) : (
        <div className="w-full space-y-6">
          <div className="relative rounded-2xl overflow-hidden shadow-lg border-4 border-[#1E293B]">
            <img src={preview} alt="Prescription preview" className="w-full h-auto object-contain max-h-[60vh]" />
            {isLoading && (
              <div className="absolute inset-0 bg-[#0B1120]/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-[#00A3FF] animate-spin mb-4" />
                <p className="text-white font-medium text-lg">Analyzing prescription...</p>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setPreview(null);
                setPrescriptionImage(null);
              }}
              disabled={isLoading}
              className="flex-1 py-4 rounded-xl font-bold text-lg transition-colors bg-[#1E293B] hover:bg-[#2A374A] text-white"
            >
              Retake
            </button>
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="flex-1 py-4 bg-[#00A3FF] hover:bg-[#008BDB] text-white font-bold rounded-xl transition-colors text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,163,255,0.25)]"
            >
              {isLoading ? 'Processing...' : 'Find Generics'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
