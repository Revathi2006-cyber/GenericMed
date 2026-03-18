import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, IndianRupee, MapPin, Share2, FileDown, ShoppingCart, ExternalLink, Loader2, AlertTriangle, Activity, Mail, MessageCircle, Twitter, Copy, X, BarChart3, PieChart as PieChartIcon, Filter, SlidersHorizontal, ArrowLeftRight, Check, Store } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import jsPDF from 'jspdf';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";

function PharmacyLogo({ url, name, domain }: { url?: string, name: string, domain?: string }) {
  const [index, setIndex] = useState(0);
  
  const sources = [
    url,
    domain ? `https://logo.clearbit.com/${domain}` : null,
    domain ? `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=64` : null
  ].filter(Boolean) as string[];

  if (index >= sources.length) return <Store className="w-6 h-6 text-slate-400" />;

  return (
    <img 
      src={sources[index]} 
      alt={name} 
      className="w-full h-full object-contain" 
      referrerPolicy="no-referrer" 
      onError={() => setIndex(prev => prev + 1)} 
    />
  );
}

function RealTimePrices({ medicineName }: { medicineName: string }) {
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrices(retries = 3, delay = 1000) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Find online pharmacy prices and purchase links for ${medicineName}. For each pharmacy, provide:
1. The pharmacy name.
2. The price.
3. The purchase link.
4. The official website domain (e.g., "1mg.com").
5. A direct, high-quality, publicly accessible URL to their official logo.

If you cannot find a direct logo URL, you MUST provide the official website domain.`,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pharmacy: { type: Type.STRING },
                  price: { type: Type.STRING },
                  link: { type: Type.STRING },
                  logoUrl: { type: Type.STRING },
                  domain: { type: Type.STRING }
                },
                required: ["pharmacy", "price", "link", "domain"]
              }
            }
          },
        });
        
        const data = JSON.parse(response.text || "[]");
        console.log("Pharmacy data:", data);
        setPrices(data);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching prices:", err);
        
        // Try to extract message from the error object
        let errorMessage = err.message || String(err);
        
        // If it's a JSON string, try to parse it
        if (typeof errorMessage === 'string' && errorMessage.startsWith('{')) {
          try {
            const parsedError = JSON.parse(errorMessage);
            if (parsedError.error && parsedError.error.message) {
              errorMessage = parsedError.error.message;
            }
          } catch (e) {
            console.error("Failed to parse error JSON:", e);
          }
        }

        if (errorMessage.includes('429') || (err.status === 429) && retries > 0) {
          console.warn(`Rate limit hit, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchPrices(retries - 1, delay * 2);
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    }
    fetchPrices();
  }, [medicineName]);

  if (loading) return <div className="text-sm text-slate-500 dark:text-[#94A3B8] flex items-center gap-2 mt-4"><Loader2 className="w-4 h-4 animate-spin"/> Searching live pharmacy prices...</div>;
  if (error) return <div className="text-sm text-rose-500 bg-rose-500/10 p-3 rounded-lg mt-4">Prices unavailable: {error}</div>;
  if (prices.length === 0) return <div className="text-sm text-slate-500 dark:text-[#94A3B8] mt-4">No online availability found.</div>;

  return (
    <div className="mt-4 space-y-3 pt-4 border-t border-slate-200 dark:border-[#1E293B]">
      <h5 className="text-sm font-semibold flex items-center gap-1 text-slate-900 dark:text-white"><ShoppingCart className="w-4 h-4"/> Online Prices</h5>
      <div className="space-y-2">
        {prices.map((p, i) => (
          <a key={i} href={p.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#0B1120] hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors border border-slate-200 dark:border-[#1E293B]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-white p-1 shadow-sm border border-slate-100 dark:border-white/5">
                <PharmacyLogo url={p.logoUrl} domain={p.domain} name={p.pharmacy} />
              </div>
              <span className="text-sm font-medium text-slate-900 dark:text-white">{p.pharmacy}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-emerald-400">{p.price}</span>
              <ExternalLink className="w-4 h-4 text-slate-500 dark:text-[#94A3B8]" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function CopyGenericName({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className={`p-2 rounded-lg transition-all ${
        copied 
          ? 'bg-emerald-500/10 text-emerald-500' 
          : 'bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#2A374A] text-slate-500 dark:text-[#94A3B8]'
      }`}
      title="Copy generic name"
    >
      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

export function Results() {
  const navigate = useNavigate();
  const { results } = useAppStore();
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<number[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  
  if (!results || results.length === 0) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-lg text-slate-500 dark:text-[#94A3B8]">No results found. Please scan a prescription first.</p>
        <button 
          onClick={() => navigate('/scan')}
          className="px-6 py-3 bg-[#00A3FF] hover:bg-[#008BDB] text-white rounded-xl font-bold shadow-[0_0_20px_rgba(0,163,255,0.25)]"
        >
          Go to Scan
        </button>
      </div>
    );
  }

  const totalBranded = results.reduce((sum, item) => sum + item.brandedPrice, 0);
  const totalGeneric = results.reduce((sum, item) => sum + item.genericPrice, 0);
  const totalSavings = totalBranded - totalGeneric;

  const handleFindStores = () => {
    setIsLocating(true);
    
    // Open a blank window immediately to preserve user gesture
    const mapWindow = window.open('', '_blank');
    if (!mapWindow) {
      setIsLocating(false);
      setError("Popup blocked! Please allow popups to find nearby stores.");
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          const { latitude, longitude } = position.coords;
          mapWindow.location.href = `https://www.google.com/maps/search/generic+pharmacy+near+me/@${latitude},${longitude},15z`;
        },
        (error) => {
          console.warn("Geolocation failed or denied, falling back to generic search.", error);
          setIsLocating(false);
          mapWindow.location.href = 'https://www.google.com/maps/search/generic+pharmacy+near+me';
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setIsLocating(false);
      mapWindow.location.href = 'https://www.google.com/maps/search/generic+pharmacy+near+me';
    }
  };

  const generatePDFBlob = (): Blob => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("GenericMed Savings Report", 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Total Branded Cost: Rs. ${totalBranded}`, 20, 40);
    doc.text(`Total Generic Cost: Rs. ${totalGeneric}`, 20, 50);
    doc.text(`Total Savings: Rs. ${totalSavings}`, 20, 60);
    
    let yPos = 80;
    results.forEach((item, index) => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text(`${index + 1}. ${item.brandedName} -> ${item.genericName}`, 20, yPos);
      doc.setFontSize(10);
      doc.text(`Salt: ${item.saltComposition}`, 20, yPos + 8);
      doc.text(`Branded: Rs. ${item.brandedPrice} | Generic: Rs. ${item.genericPrice} | Savings: Rs. ${item.savings}`, 20, yPos + 16);
      
      let currentY = yPos + 24;
      
      if (item.sideEffects && item.sideEffects.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Side Effects:", 20, currentY);
        doc.setFont("helvetica", "normal");
        const effectsText = item.sideEffects.join(', ');
        doc.text(effectsText, 45, currentY, { maxWidth: 145 });
        currentY += Math.ceil(effectsText.length / 80) * 5 + 2;
      }
      
      if (item.interactions && item.interactions.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Interactions:", 20, currentY);
        doc.setFont("helvetica", "normal");
        const interactionsText = item.interactions.join(', ');
        doc.text(interactionsText, 45, currentY, { maxWidth: 145 });
        currentY += Math.ceil(interactionsText.length / 80) * 5 + 2;
      }

      if (item.usageInstructions) {
        doc.setFont("helvetica", "bold");
        doc.text("Usage:", 20, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(item.usageInstructions, 45, currentY, { maxWidth: 145 });
        currentY += Math.ceil(item.usageInstructions.length / 80) * 5 + 2;
      }

      if (item.precautions && item.precautions.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Precautions:", 20, currentY);
        doc.setFont("helvetica", "normal");
        const precautionsText = item.precautions.join(', ');
        doc.text(precautionsText, 45, currentY, { maxWidth: 145 });
        currentY += Math.ceil(precautionsText.length / 80) * 5 + 2;
      }

      if (item.whenToConsultDoctor && item.whenToConsultDoctor.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(220, 38, 38); // Red color for warnings
        doc.text("Consult Doctor If:", 20, currentY);
        doc.setFont("helvetica", "normal");
        const consultText = item.whenToConsultDoctor.join(', ');
        doc.text(consultText, 55, currentY, { maxWidth: 135 });
        doc.setTextColor(0, 0, 0); // Reset to black
        currentY += Math.ceil(consultText.length / 70) * 5 + 2;
      }
      
      if (item.complementaryCare) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(5, 150, 105); // Emerald color
        doc.text("Complementary Care:", 20, currentY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        currentY += 5;

        if (item.complementaryCare.homeRemedies.length > 0) {
          const remediesText = `Home Remedies: ${item.complementaryCare.homeRemedies.join(', ')}`;
          doc.text(remediesText, 25, currentY, { maxWidth: 165 });
          currentY += Math.ceil(remediesText.length / 90) * 5 + 2;
        }
        if (item.complementaryCare.ayurvedaSuggestions.length > 0) {
          const ayurvedaText = `Ayurveda: ${item.complementaryCare.ayurvedaSuggestions.map(s => `${s.herb} (${s.benefit})`).join(', ')}`;
          doc.text(ayurvedaText, 25, currentY, { maxWidth: 165 });
          currentY += Math.ceil(ayurvedaText.length / 90) * 5 + 2;
        }
      }
      
      yPos = currentY + 10;
    });
    
    return doc.output('blob');
  };

  const handleDownloadPDF = () => {
    const blob = generatePDFBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GenericMed_Savings_Report.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSharePDF = async () => {
    const pdfBlob = generatePDFBlob();
    const file = new File([pdfBlob], "GenericMed_Savings_Report.pdf", { type: "application/pdf" });
    
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'My Medicine Savings Report',
          text: 'Check out how much I saved on my medicines with GenericMed!'
        });
      } catch (err) {
        console.error('Error sharing:', err);
        handleDownloadPDF();
      }
    } else {
      handleDownloadPDF();
    }
  };

  const handleShareMedicine = async (item: any) => {
    const shareText = `Medicine: ${item.genericName}\nBranded: ${item.brandedName}\nSavings: ₹${item.savings}\nUsage: ${item.usageInstructions}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Medicine Savings',
          text: shareText,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Copied to clipboard!');
    }
  };

  const shareText = `GenericMed Savings Report\nTotal Branded: ₹${totalBranded}\nTotal Generic: ₹${totalGeneric}\nTotal Savings: ₹${totalSavings}\n\nMedicines:\n${results.map(r => {
    let details = `- ${r.brandedName} -> ${r.genericName} (Save ₹${r.savings})\n  Salt: ${r.saltComposition}`;
    if (r.sideEffects && r.sideEffects.length > 0) {
      details += `\n  Side Effects: ${r.sideEffects.join(', ')}`;
    }
    if (r.interactions && r.interactions.length > 0) {
      details += `\n  Interactions: ${r.interactions.join(', ')}`;
    }
    if (r.usageInstructions) {
      details += `\n  Usage: ${r.usageInstructions}`;
    }
    if (r.precautions && r.precautions.length > 0) {
      details += `\n  Precautions: ${r.precautions.join(', ')}`;
    }
    if (r.whenToConsultDoctor && r.whenToConsultDoctor.length > 0) {
      details += `\n  Consult Doctor If: ${r.whenToConsultDoctor.join(', ')}`;
    }
    if (r.complementaryCare) {
      if (r.complementaryCare.homeRemedies.length > 0) {
        details += `\n  Home Remedies: ${r.complementaryCare.homeRemedies.join(', ')}`;
      }
      if (r.complementaryCare.ayurvedaSuggestions.length > 0) {
        details += `\n  Ayurveda: ${r.complementaryCare.ayurvedaSuggestions.map(s => `${s.herb} (${s.benefit})`).join(', ')}`;
      }
    }
    return details;
  }).join('\n\n')}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Medicine Savings',
          text: shareText,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleComparison = (idx: number) => {
    setSelectedForComparison(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const selectedItems = selectedForComparison.map(idx => results[idx]);

  return (
    <div className="px-4 pb-32 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#1E293B] text-slate-900 dark:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Results</h2>
      </div>

      {/* Generic Medicine Safety Note */}
      <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <h4 className="font-bold">Generics are just as safe</h4>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Side effects and interactions are caused by the <strong>active ingredient (salt)</strong>, not the brand. 
          Branded and generic medicines contain the <strong>exact same active ingredient</strong> and are required to meet the same safety standards.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Savings Summary Card */}
      <div className="p-6 rounded-2xl shadow-lg border-t-4 border-emerald-500 bg-white dark:bg-[#111C33] border border-slate-200 dark:border-[#1E293B]">
        <h3 className="text-lg font-medium text-slate-500 dark:text-[#94A3B8] mb-2">Total Estimated Savings</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-emerald-500">₹{totalSavings}</span>
          <span className="text-sm font-medium text-slate-500 dark:text-[#94A3B8]">per purchase</span>
        </div>
        
        <div className="mt-6 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 dark:text-[#94A3B8]">Branded Cost</span>
            <span className="font-semibold line-through text-slate-500 dark:text-[#94A3B8]">₹{totalBranded}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 dark:text-[#94A3B8]">Generic Cost</span>
            <span className="font-semibold text-[#00A3FF]">₹{totalGeneric}</span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button 
            onClick={handleDownloadPDF}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#2A374A] text-slate-900 dark:text-white rounded-xl font-medium transition-colors"
          >
            <FileDown className="w-5 h-5" />
            Save PDF
          </button>
          <button 
            onClick={handleSharePDF}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white rounded-xl font-medium transition-colors"
          >
            <Share2 className="w-5 h-5" />
            Share
          </button>
        </div>
      </div>

      {/* Visual Comparison Charts */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Analysis</h3>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-[#111C33] border border-slate-200 dark:border-[#1E293B] shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-[#00A3FF]" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Price Comparison Breakdown</h3>
          </div>
          
          <div className="h-[300px] w-full min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={results.map(r => ({
                  name: r.brandedName.length > 8 ? r.brandedName.substring(0, 8) + '...' : r.brandedName,
                  Branded: r.brandedPrice,
                  Generic: r.genericPrice,
                  Savings: r.savings,
                  savingsPercent: Math.round((r.savings / r.brandedPrice) * 100),
                  fullName: r.brandedName,
                  brandedName: r.brandedName,
                  genericName: r.genericName
                }))}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 10 }}
                  interval={0}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 10 }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#111C33] border border-[#1E293B] p-4 rounded-xl shadow-2xl min-w-[200px]">
                          <p className="text-xs font-bold text-[#94A3B8] mb-2 uppercase tracking-wider">Medicine Analysis</p>
                          <div className="space-y-3">
                            <div className="pb-2 border-b border-white/5">
                              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter mb-1">Branded Medicine</p>
                              <p className="text-sm font-bold text-white leading-tight">{data.brandedName}</p>
                              <p className="text-xs text-slate-400 mt-1">Price: ₹{data.Branded}</p>
                            </div>
                            <div className="pb-2 border-b border-white/5">
                              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter mb-1">Generic Alternative</p>
                              <p className="text-sm font-bold text-[#00A3FF] leading-tight">{data.genericName}</p>
                              <p className="text-xs text-slate-400 mt-1">Price: ₹{data.Generic}</p>
                            </div>
                            <div className="pt-1">
                              <div className="flex items-center justify-between bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                                <span className="text-xs font-bold text-emerald-400">Total Savings</span>
                                <span className="text-sm font-black text-emerald-400">₹{data.Savings} ({data.savingsPercent}%)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ fill: '#1E293B', opacity: 0.4 }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }}
                />
                <Bar dataKey="Generic" name="Generic Cost" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="Savings" name="Amount Saved" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111C33] border border-slate-200 dark:border-[#1E293B] shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cost Distribution</h3>
            </div>
            <div className="h-[220px] w-full relative min-w-0 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Savings', value: totalSavings },
                      { name: 'Generic Cost', value: totalGeneric }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#334155" />
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#111C33] border border-[#1E293B] p-3 rounded-xl shadow-2xl">
                            <p className="text-xs font-bold text-white mb-1">{payload[0].name}</p>
                            <p className="text-sm font-black text-emerald-400">₹{payload[0].value}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Label for Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-bold text-slate-500 dark:text-[#94A3B8] uppercase tracking-tighter">Total</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">₹{totalBranded}</span>
              </div>
            </div>
            <div className="flex justify-center gap-8 mt-4">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Savings</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-[#94A3B8]">₹{totalSavings}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#334155]"></div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Generic Cost</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-[#94A3B8]">₹{totalGeneric}</span>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 flex flex-col justify-between relative overflow-hidden group">
            {/* Background Decorative Element */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-emerald-500 font-black text-xs uppercase tracking-[0.2em]">Savings Rate</span>
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-500">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              
              <div className="flex items-end gap-2 mb-4">
                <div className="text-6xl font-black text-emerald-500 leading-none">
                  {Math.round((totalSavings / totalBranded) * 100)}%
                </div>
                <span className="text-emerald-600/60 dark:text-emerald-400/60 font-bold mb-1">REDUCTION</span>
              </div>

              <div className="space-y-3">
                <div className="h-2 w-full bg-emerald-500/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    style={{ width: `${(totalSavings / totalBranded) * 100}%` }}
                  ></div>
                </div>
                <p className="text-emerald-700 dark:text-emerald-400/90 text-sm font-medium leading-relaxed">
                  You are saving <span className="font-black">₹{totalSavings}</span> on every purchase. That's more than half of your medical expenses!
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-emerald-500/10 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-emerald-600/50 dark:text-emerald-400/40">Monthly Savings*</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{totalSavings * 1}</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider">
                High Impact
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-8 mb-4">
        <h3 className="font-bold text-xl text-slate-900 dark:text-white">Medicine Details</h3>
      </div>
      
      <div className="space-y-4">
        {results.map((item, idx) => (
          <div key={idx} className={`p-5 rounded-2xl shadow-sm space-y-4 bg-white dark:bg-[#111C33] border transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${selectedForComparison.includes(idx) ? 'border-[#00A3FF] ring-2 ring-[#00A3FF]/20' : 'border-slate-200 dark:border-[#1E293B]'}`} style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <button 
                    onClick={() => toggleComparison(idx)}
                    className={`mt-1 w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${selectedForComparison.includes(idx) ? 'bg-[#00A3FF] border-[#00A3FF] text-white' : 'border-slate-300 dark:border-slate-600'}`}
                  >
                    {selectedForComparison.includes(idx) && <Check className="w-4 h-4" />}
                  </button>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] mb-1 block">Prescribed (Branded)</span>
                    <h4 className="text-lg font-bold text-rose-500">{item.brandedName}</h4>
                    <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">₹{item.brandedPrice}</p>
                  </div>
                </div>
                <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-sm font-black flex items-center gap-1 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse">
                  <IndianRupee className="w-3 h-3" /> Save ₹{item.savings}
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-[#1E293B] w-full"></div>

              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Generic Alternative
                  </span>
                <div className="flex items-center gap-2">
                  <h4 className="text-xl font-bold text-[#00A3FF]">{item.genericName}</h4>
                  <button onClick={() => handleShareMedicine(item)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-[#2A374A] text-slate-500 dark:text-[#94A3B8]">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
                  <p className="text-lg font-semibold mt-1 text-slate-900 dark:text-white">₹{item.genericPrice}</p>
                </div>
                <CopyGenericName name={item.genericName} />
              </div>

              <div className="p-3 rounded-lg text-sm bg-slate-50 dark:bg-[#0B1120] text-slate-500 dark:text-[#94A3B8]">
                <span className="font-semibold block mb-1 text-slate-900 dark:text-white">Salt Composition:</span>
                {item.saltComposition}
              </div>

              {item.usageInstructions && (
                <div className="p-3 rounded-lg text-sm bg-blue-500/10 text-blue-200/80 border border-blue-500/20">
                  <span className="font-semibold flex items-center gap-1.5 mb-2 text-blue-500">
                    <CheckCircle2 className="w-4 h-4" /> Usage Instructions
                  </span>
                  <p className="leading-relaxed">{item.usageInstructions}</p>
                </div>
              )}

              {item.precautions && item.precautions.length > 0 && (
                <div className="p-3 rounded-lg text-sm bg-slate-500/10 text-slate-200/80 border border-slate-500/20">
                  <span className="font-semibold flex items-center gap-1.5 mb-2 text-slate-400">
                    <SlidersHorizontal className="w-4 h-4" /> Key Precautions
                  </span>
                  <ul className="list-disc pl-5 space-y-1">
                    {item.precautions.map((precaution, i) => (
                      <li key={i}>{precaution}</li>
                    ))}
                  </ul>
                </div>
              )}

              {item.whenToConsultDoctor && item.whenToConsultDoctor.length > 0 && (
                <div className="p-3 rounded-lg text-sm bg-rose-500/10 text-rose-200/80 border border-rose-500/20">
                  <span className="font-semibold flex items-center gap-1.5 mb-2 text-rose-500">
                    <AlertTriangle className="w-4 h-4" /> When to Consult a Doctor
                  </span>
                  <ul className="list-disc pl-5 space-y-1">
                    {item.whenToConsultDoctor.map((flag, i) => (
                      <li key={i} className="text-rose-300/90 font-medium">{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {item.sideEffects && item.sideEffects.length > 0 && (
                <div className="p-3 rounded-lg text-sm bg-amber-500/10 text-amber-200/80 border border-amber-500/20">
                  <span className="font-semibold flex items-center justify-between mb-2 text-amber-500">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Potential Side Effects
                    </span>
                    <span className="text-[10px] uppercase tracking-wider opacity-70">Common to both Branded & Generic</span>
                  </span>
                  <ul className="list-disc pl-5 space-y-1">
                    {item.sideEffects.map((effect, i) => (
                      <li key={i}>{effect}</li>
                    ))}
                  </ul>
                </div>
              )}

              {item.interactions && item.interactions.length > 0 && (
                <div className="p-3 rounded-lg text-sm bg-rose-500/10 text-rose-200/80 border border-rose-500/20">
                  <span className="font-semibold flex items-center justify-between mb-2 text-rose-500">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-4 h-4" /> Known Interactions
                    </span>
                    <span className="text-[10px] uppercase tracking-wider opacity-70">Applies to active salt</span>
                  </span>
                  <ul className="list-disc pl-5 space-y-1">
                    {item.interactions.map((interaction, i) => (
                      <li key={i}>{interaction}</li>
                    ))}
                  </ul>
                </div>
              )}

              {item.complementaryCare && (item.complementaryCare.homeRemedies.length > 0 || item.complementaryCare.ayurvedaSuggestions.length > 0) && (
                <div className="p-4 rounded-xl text-sm bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30">
                  <span className="font-bold flex items-center gap-1.5 mb-3 text-emerald-700 dark:text-emerald-400 text-base">
                    💚 Complementary Care <span className="text-xs font-normal opacity-75">(Optional)</span>
                  </span>
                  
                  <div className="space-y-3 text-emerald-900 dark:text-emerald-100/90">
                    {item.complementaryCare.homeRemedies.length > 0 && (
                      <ul className="list-disc pl-5 space-y-1.5">
                        {item.complementaryCare.homeRemedies.map((remedy, i) => (
                          <li key={i}>{remedy}</li>
                        ))}
                      </ul>
                    )}
                    
                    {item.complementaryCare.ayurvedaSuggestions.length > 0 && (
                      <ul className="list-disc pl-5 space-y-1.5">
                        {item.complementaryCare.ayurvedaSuggestions.map((suggestion, i) => (
                          <li key={i}>
                            Light Ayurvedic suggestion: <span className="font-semibold">{suggestion.herb}</span> ({suggestion.benefit}) - consult doctor
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-emerald-200/50 dark:border-emerald-800/50 text-xs text-emerald-800/80 dark:text-emerald-200/70 flex items-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>
                      <strong>Note:</strong> These are supportive tips and not medical advice. Please consult a doctor before trying new remedies. Do not stop prescribed medicines.
                    </p>
                  </div>
                </div>
              )}

              <RealTimePrices medicineName={item.genericName} />
            </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-[#1E293B]">
        <button 
          onClick={handleFindStores}
          disabled={isLocating}
          className="flex items-center justify-center gap-2 w-full py-4 bg-[#00A3FF]/10 text-[#00A3FF] hover:bg-[#00A3FF]/20 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-xl transition-colors text-lg border border-[#00A3FF]/20"
        >
          {isLocating ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <MapPin className="w-6 h-6" />
          )}
          {isLocating ? 'Locating...' : 'Find Nearby Generic Pharmacy'}
        </button>
        <p className="text-center text-xs text-slate-500 dark:text-[#94A3B8] mt-3">
          Opens Google Maps to find generic pharmacies near you.
        </p>
      </div>

      {/* Comparison Bar */}
      {selectedForComparison.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-40 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-[#111C33] border border-[#1E293B] rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00A3FF]/20 flex items-center justify-center text-[#00A3FF]">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{selectedForComparison.length} Medicines Selected</p>
                <p className="text-xs text-[#94A3B8]">Compare side-by-side</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSelectedForComparison([])}
                className="px-4 py-2 text-sm font-medium text-[#94A3B8] hover:text-white transition-colors"
              >
                Clear
              </button>
              <button 
                disabled={selectedForComparison.length < 2}
                onClick={() => setShowCompareModal(true)}
                className="px-6 py-2 bg-[#00A3FF] hover:bg-[#008BDB] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(0,163,255,0.25)]"
              >
                Compare Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#00A3FF]/10 text-[#00A3FF]">
                  <ArrowLeftRight className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Medicine Comparison</h3>
              </div>
              <button 
                onClick={() => setShowCompareModal(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#1E293B] text-slate-500 dark:text-[#94A3B8] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="min-w-[600px]">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className="sticky top-0 left-0 z-30 p-4 text-left text-sm font-bold text-slate-500 dark:text-[#94A3B8] border-b border-r border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] w-1/4">
                        Feature
                      </th>
                      {selectedItems.map((item, i) => (
                        <th key={i} className="sticky top-0 z-20 p-4 text-left border-b border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120]">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#00A3FF]">Medicine {i + 1}</span>
                            <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{item.genericName}</h4>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                    <tr className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="sticky left-0 z-10 p-4 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#111C33] border-r border-slate-200 dark:border-[#1E293B]">Generic Price</td>
                      {selectedItems.map((item, i) => (
                        <td key={i} className="p-4">
                          <span className="text-lg font-black text-emerald-500">₹{item.genericPrice}</span>
                        </td>
                      ))}
                    </tr>
                    <tr className="group bg-slate-50/30 dark:bg-white/5 hover:bg-slate-50/50 dark:hover:bg-white/10 transition-colors">
                      <td className="sticky left-0 z-10 p-4 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#1E293B] border-r border-slate-200 dark:border-[#1E293B]">Savings</td>
                      {selectedItems.map((item, i) => (
                        <td key={i} className="p-4">
                          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-black shadow-lg">
                            <IndianRupee className="w-3 h-3" /> Save ₹{item.savings}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="sticky left-0 z-10 p-4 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#111C33] border-r border-slate-200 dark:border-[#1E293B]">Branded Version</td>
                      {selectedItems.map((item, i) => (
                        <td key={i} className="p-4">
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-rose-500">{item.brandedName}</p>
                            <p className="text-xs text-slate-500">₹{item.brandedPrice}</p>
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="group bg-slate-50/30 dark:bg-white/5 hover:bg-slate-50/50 dark:hover:bg-white/10 transition-colors">
                      <td className="sticky left-0 z-10 p-4 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#1E293B] border-r border-slate-200 dark:border-[#1E293B]">Salt Composition</td>
                      {selectedItems.map((item, i) => (
                        <td key={i} className="p-4 text-sm text-slate-600 dark:text-[#94A3B8]">
                          {item.saltComposition}
                        </td>
                      ))}
                    </tr>
                    <tr className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="sticky left-0 z-10 p-4 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#111C33] border-r border-slate-200 dark:border-[#1E293B]">Side Effects</td>
                      {selectedItems.map((item, i) => (
                        <td key={i} className="p-4">
                          <ul className="space-y-1">
                            {item.sideEffects.slice(0, 3).map((effect, j) => (
                              <li key={j} className="text-xs flex items-center gap-1.5 text-slate-500 dark:text-[#94A3B8]">
                                <div className="w-1 h-1 rounded-full bg-amber-500" />
                                {effect}
                              </li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                    <tr className="group bg-slate-50/30 dark:bg-white/5 hover:bg-slate-50/50 dark:hover:bg-white/10 transition-colors">
                      <td className="sticky left-0 z-10 p-4 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#1E293B] border-r border-slate-200 dark:border-[#1E293B]">Interactions</td>
                      {selectedItems.map((item, i) => (
                        <td key={i} className="p-4">
                          <ul className="space-y-1">
                            {item.interactions.slice(0, 3).map((interaction, j) => (
                              <li key={j} className="text-xs flex items-center gap-1.5 text-slate-500 dark:text-[#94A3B8]">
                                <div className="w-1 h-1 rounded-full bg-rose-500" />
                                {interaction}
                              </li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-[#1E293B]">
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] text-center italic">
                * Comparison is based on active ingredients and estimated market prices. Always consult your doctor before switching medications.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {/* {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0B1120]/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-[#1E293B] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#1E293B]">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Share Savings Report</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-[#1E293B] text-slate-500 dark:text-[#94A3B8] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              {!!navigator.share && (
                <button 
                  onClick={handleNativeShare}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#2A374A] text-slate-900 dark:text-white transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Share via...</span>
                </button>
              )}
              
              <a 
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowShareModal(false)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#2A374A] text-slate-900 dark:text-white transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center text-[#25D366]">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="font-medium">WhatsApp</span>
              </a>

              <a 
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowShareModal(false)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#2A374A] text-slate-900 dark:text-white transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#1DA1F2]/20 flex items-center justify-center text-[#1DA1F2]">
                  <Twitter className="w-5 h-5" />
                </div>
                <span className="font-medium">X (Twitter)</span>
              </a>

              <a 
                href={`mailto:?subject=${encodeURIComponent('My Medicine Savings')}&body=${encodeURIComponent(shareText)}`}
                onClick={() => setShowShareModal(false)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#2A374A] text-slate-900 dark:text-white transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="font-medium">Email</span>
              </a>

              <button 
                onClick={handleCopy}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#2A374A] text-slate-900 dark:text-white transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#00A3FF]/20 flex items-center justify-center text-[#00A3FF]">
                  {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </div>
                <span className="font-medium">{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}
