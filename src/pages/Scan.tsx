import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, Loader2, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { analyzePrescription } from '../services/geminiService';

export function Scan() {
  const navigate = useNavigate();
  const { prescriptionImage, setPrescriptionImage, results, setResults, setIsLoading, isLoading, saveToHistory } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(prescriptionImage);
  const [showOverlay, setShowOverlay] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreview(prescriptionImage);
    setShowOverlay(false);
    setError(null);
  }, [prescriptionImage]);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension 1200px
          const MAX_DIMENSION = 1200;
          if (width > height && width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          } else if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          // Fill with white background in case of transparent PNG
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
          }
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setPreview(compressedBase64);
          setPrescriptionImage(compressedBase64);
          setShowOverlay(false);
        };
        
        img.onerror = () => {
          // Fallback if image cannot be loaded into canvas (e.g., HEIC on some browsers)
          setPreview(base64String);
          setPrescriptionImage(base64String);
          setShowOverlay(false);
        };
        
        img.src = base64String;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!preview) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const analysisResults = await analyzePrescription(preview);
      setResults(analysisResults);
      saveToHistory(preview, analysisResults);
      setShowOverlay(true);
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setError(err.message || "Failed to analyze prescription. Please ensure the photo is clear and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 space-y-6 flex flex-col items-center justify-center min-h-[70vh]">
      
      {error && (
        <div className="w-full p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {!preview ? (
        <div className="w-full space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-[#1E293B] text-slate-900 dark:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Scan Prescription</h2>
          </div>
          <p className="text-slate-500 dark:text-[#94A3B8]">
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
            
            <label className="flex items-center justify-center gap-2 p-4 rounded-xl cursor-pointer transition-colors bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#2A374A] text-slate-900 dark:text-white">
              <ImageIcon className="w-6 h-6 text-slate-500 dark:text-[#94A3B8]" />
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
          <div className="relative rounded-2xl overflow-hidden shadow-lg border-4 border-slate-200 dark:border-[#1E293B]">
            <img src={preview} alt="Prescription preview" className="w-full h-auto object-contain max-h-[60vh]" />
            
            {showOverlay && results.map((result, index) => {
              if (!result.boundingBox) return null;
              const [ymin, xmin, ymax, xmax] = result.boundingBox;
              const top = `${(ymin / 1000) * 100}%`;
              const left = `${(xmin / 1000) * 100}%`;
              const height = `${((ymax - ymin) / 1000) * 100}%`;
              const width = `${((xmax - xmin) / 1000) * 100}%`;

              return (
                <div
                  key={index}
                  className="absolute border-2 border-[#00A3FF] bg-[#00A3FF]/20 rounded shadow-[0_0_10px_rgba(0,163,255,0.5)] flex items-start justify-start"
                  style={{ top, left, width, height }}
                >
                  <span className="bg-[#00A3FF] text-white text-xs font-bold px-1.5 py-0.5 rounded-br -mt-0.5 -ml-0.5 whitespace-nowrap">
                    {result.brandedName}
                  </span>
                </div>
              );
            })}

            {isLoading && (
              <div className="absolute inset-0 bg-slate-50 dark:bg-[#0B1120]/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-[#00A3FF] animate-spin mb-4" />
                <p className="text-slate-900 dark:text-white font-medium text-lg">Analyzing prescription...</p>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setPreview(null);
                setPrescriptionImage(null);
                setShowOverlay(false);
              }}
              disabled={isLoading}
              className="flex-1 py-4 rounded-xl font-bold text-lg transition-colors bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#2A374A] text-slate-900 dark:text-white"
            >
              Retake
            </button>
            {!showOverlay ? (
              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="flex-1 py-4 bg-[#00A3FF] hover:bg-[#008BDB] text-white font-bold rounded-xl transition-colors text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,163,255,0.25)]"
              >
                {isLoading ? 'Processing...' : 'Find Generics'}
              </button>
            ) : (
              <button
                onClick={() => navigate('/results')}
                className="flex-1 py-4 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl transition-colors text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
              >
                View Details <ArrowLeft className="w-5 h-5 rotate-180" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
