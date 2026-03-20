import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, IndianRupee, Share2, 
  AlertTriangle, Copy, Activity, FileText, 
  Info, TrendingUp, DollarSign, ExternalLink,
  ShieldCheck, X, ArrowRightLeft, Heart,
  Stethoscope, Pill, Zap
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'motion/react';
import { MedicineResult } from '../services/geminiService';

const APP_VERSION = 'v1.0.0';

export function Results() {
  const navigate = useNavigate();
  const { results } = useAppStore();
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<MedicineResult[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  
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
  const savingsRate = Math.round((totalSavings / totalBranded) * 100);

  const chartData = results.map(item => ({
    name: item.brandedName,
    branded: item.brandedPrice,
    generic: item.genericPrice,
    savings: item.savings
  }));

  const pieData = [
    { name: 'Savings', value: totalSavings, color: '#10B981' },
    { name: 'Generic Cost', value: totalGeneric, color: '#3B82F6' }
  ];

  const handleShare = async () => {
    const shareText = `GenericMed Savings Report\nTotal Branded: ₹${totalBranded}\nTotal Generic: ₹${totalGeneric}\nTotal Savings: ₹${totalSavings}\n\nMedicines:\n${results.map(r => `- ${r.brandedName} -> ${r.genericName} (Save ₹${r.savings})`).join('\n')}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Medicine Savings',
          text: shareText,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      setCopied('all');
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const saveAsPDF = async () => {
    if (!resultsRef.current) return;
    const canvas = await html2canvas(resultsRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0B1120'
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('GenericMed-Savings-Report.pdf');
  };

  const toggleComparison = (medicine: MedicineResult) => {
    setSelectedForComparison(prev => {
      const isAlreadySelected = prev.some(m => m.brandedName === medicine.brandedName);
      if (isAlreadySelected) {
        return prev.filter(m => m.brandedName !== medicine.brandedName);
      }
      if (prev.length >= 2) {
        return [prev[1], medicine];
      }
      return [...prev, medicine];
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="px-4 pb-32 space-y-8 max-w-2xl mx-auto" ref={resultsRef}>
      {/* Header */}
      <div className="flex items-center gap-4 pt-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#1E293B] text-slate-900 dark:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Results</h2>
      </div>

      {/* Safety Info Box */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3"
      >
        <div className="flex items-center gap-2 text-emerald-500 font-bold">
          <CheckCircle2 className="w-5 h-5" />
          <span>Generics are just as safe</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Side effects and interactions are caused by the <span className="font-bold text-slate-900 dark:text-white">active ingredient (salt)</span>, not the brand. Branded and generic medicines contain the <span className="font-bold text-slate-900 dark:text-white">exact same active ingredient</span> and are required to meet the same safety standards.
        </p>
      </motion.div>

      {/* Savings Summary Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-3xl bg-white dark:bg-[#111C33] border border-slate-200 dark:border-[#1E293B] shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <TrendingUp className="w-24 h-24" />
        </div>
        
        <h3 className="text-lg font-medium text-slate-500 dark:text-[#94A3B8] mb-2">Total Estimated Savings</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black text-emerald-500">₹{totalSavings}</span>
          <span className="text-sm font-medium text-slate-500 dark:text-[#94A3B8]">per purchase</span>
        </div>
        
        <div className="mt-8 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-[#94A3B8]">Branded Cost</span>
            <span className="font-bold text-slate-400 line-through">₹{totalBranded}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-[#94A3B8]">Generic Cost</span>
            <span className="font-bold text-[#00A3FF] text-xl">₹{totalGeneric}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <button 
            onClick={saveAsPDF}
            className="flex items-center justify-center gap-2 py-3.5 bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#2D3B4F] text-slate-900 dark:text-white rounded-2xl font-bold transition-all"
          >
            <FileText className="w-5 h-5" />
            Save PDF
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Share2 className="w-5 h-5" />
            {copied === 'all' ? 'Copied!' : 'Share'}
          </button>
        </div>
      </motion.div>

      {/* Analysis Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Analysis</h3>
        
        {/* Price Comparison Breakdown Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111C33] border border-slate-200 dark:border-[#1E293B] space-y-6">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
            <Activity className="w-5 h-5 text-[#00A3FF]" />
            <span>Price Comparison Breakdown</span>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                <XAxis dataKey="name" hide />
                <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111C33', border: '1px solid #1E293B', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="savings" name="Amount Saved" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="generic" name="Generic Cost" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 text-xs font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-slate-500">Amount Saved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-500">Generic Cost</span>
            </div>
          </div>
        </div>

        {/* Distribution and Savings Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111C33] border border-slate-200 dark:border-[#1E293B] flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold self-start">
              <Activity className="w-5 h-5 text-emerald-500" />
              <span>Cost Distribution</span>
            </div>
            <div className="h-48 w-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Total</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">₹{totalBranded}</span>
              </div>
            </div>
            <div className="flex gap-4 text-[10px] font-bold uppercase">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-500">Savings ₹{totalSavings}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-slate-500">Generic ₹{totalGeneric}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-emerald-500 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Zap className="w-16 h-16" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Savings Rate</span>
                <div className="p-2 bg-white/20 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="text-6xl font-black mb-2">{savingsRate}%</div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-4">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${savingsRate}%` }}
                  className="h-full bg-white"
                />
              </div>
              <p className="text-sm font-medium opacity-90 leading-relaxed">
                You are saving ₹{totalSavings} on every purchase. That's more than half of your medical expenses!
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase opacity-70">Monthly Savings*</div>
                <div className="text-xl font-black">₹{totalSavings}</div>
              </div>
              <div className="px-3 py-1 bg-white text-emerald-600 rounded-full text-[10px] font-black uppercase">
                High Impact
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Medicine Details Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Medicine Details</h3>
          {selectedForComparison.length > 0 && (
            <button 
              onClick={() => setShowComparison(true)}
              className="px-4 py-2 bg-[#00A3FF] text-white rounded-full text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Compare ({selectedForComparison.length})
            </button>
          )}
        </div>

        <div className="space-y-8">
          {results.map((item, idx) => {
            const isSelected = selectedForComparison.some(m => m.brandedName === item.brandedName);
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-3xl bg-white dark:bg-[#111C33] border border-slate-200 dark:border-[#1E293B] space-y-6 relative"
              >
                {/* Selection Checkbox */}
                <button 
                  onClick={() => toggleComparison(item)}
                  className={`absolute top-6 left-6 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    isSelected 
                      ? 'bg-[#00A3FF] border-[#00A3FF] text-white' 
                      : 'border-slate-300 dark:border-[#1E293B]'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-4 h-4" />}
                </button>

                <div className="pl-10 space-y-6">
                  {/* Branded Info */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] mb-1 block">Prescribed (Branded)</span>
                      <h4 className="text-xl font-bold text-rose-500">{item.brandedName}</h4>
                      <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">₹{item.brandedPrice}</p>
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-2xl text-sm font-black flex items-center gap-1 border border-emerald-500/20">
                      <IndianRupee className="w-3 h-3" /> Save ₹{item.savings}
                    </div>
                  </div>

                  {/* Generic Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Generic Alternative
                      </span>
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1E293B] text-slate-400">
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => copyToClipboard(item.genericName, `copy-${idx}`)}
                          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1E293B] text-slate-400"
                        >
                          {copied === `copy-${idx}` ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <h4 className="text-2xl font-bold text-[#00A3FF]">{item.genericName}</h4>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">₹{item.genericPrice}</p>
                  </div>

                  {/* Salt Composition */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-slate-100 dark:border-[#1E293B]">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Salt Composition:</span>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.saltComposition}</p>
                  </div>

                  {/* Usage Instructions */}
                  <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-2">
                    <div className="flex items-center gap-2 text-blue-500 text-xs font-bold uppercase">
                      <Info className="w-4 h-4" />
                      <span>Usage Instructions</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.usageInstructions}
                    </p>
                  </div>

                  {/* Precautions */}
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#1E293B] space-y-2">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Key Precautions</span>
                    </div>
                    <ul className="space-y-2">
                      {(Array.isArray(item.precautions) ? item.precautions : []).map((p, i) => (
                        <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex gap-2">
                          <span className="text-slate-400">•</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Consult Doctor */}
                  <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 space-y-2">
                    <div className="flex items-center gap-2 text-rose-500 text-xs font-bold uppercase">
                      <AlertTriangle className="w-4 h-4" />
                      <span>When to Consult a Doctor</span>
                    </div>
                    <ul className="space-y-2">
                      {(Array.isArray(item.consultDoctor) ? item.consultDoctor : []).map((p, i) => (
                        <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex gap-2">
                          <span className="text-rose-400">•</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Side Effects */}
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-2">
                    <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Potential Side Effects</span>
                    </div>
                    <ul className="space-y-2">
                      {(Array.isArray(item.sideEffects) ? item.sideEffects : []).map((p, i) => (
                        <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex gap-2">
                          <span className="text-amber-400">•</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Interactions */}
                  <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 space-y-2">
                    <div className="flex items-center gap-2 text-purple-500 text-xs font-bold uppercase">
                      <Zap className="w-4 h-4" />
                      <span>Known Interactions</span>
                    </div>
                    <ul className="space-y-2">
                      {(Array.isArray(item.interactions) ? item.interactions : []).map((p, i) => (
                        <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex gap-2">
                          <span className="text-purple-400">•</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Complementary Care */}
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase">
                      <Heart className="w-4 h-4" />
                      <span>Complementary Care <span className="text-[8px] opacity-60">(Optional)</span></span>
                    </div>
                    <ul className="space-y-2">
                      {(Array.isArray(item.complementaryCare) ? item.complementaryCare : []).map((p, i) => (
                        <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex gap-2">
                          <span className="text-emerald-400">•</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Online Prices */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white text-xs font-bold uppercase">
                      <DollarSign className="w-4 h-4" />
                      <span>Online Prices</span>
                    </div>
                    <div className="space-y-2">
                      {(Array.isArray(item.onlinePrices) ? item.onlinePrices : []).map((op, i) => (
                        <a 
                          key={i} 
                          href={op.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-[#2D3B4F] transition-colors border border-slate-100 dark:border-[#1E293B]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-1">
                              <img 
                                src={`https://www.google.com/s2/favicons?domain=${new URL(op.link).hostname}&sz=64`} 
                                alt={op.platform}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">{op.platform}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-emerald-500">₹{op.price}</span>
                            <ExternalLink className="w-4 h-4 text-slate-400" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Comparison Modal */}
      <AnimatePresence>
        {showComparison && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowComparison(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-[#111C33] rounded-[32px] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-xl">
                    <ArrowRightLeft className="w-6 h-6 text-[#00A3FF]" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Medicine Comparison</h3>
                </div>
                <button onClick={() => setShowComparison(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#1E293B]">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6">
                <div className="min-w-[600px]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left py-4 px-4 text-xs font-bold uppercase text-slate-400 w-1/4">Feature</th>
                        {selectedForComparison.map((m, i) => (
                          <th key={i} className="text-left py-4 px-4 w-1/3">
                            <div className="text-[10px] font-bold uppercase text-blue-500 mb-1">Medicine {i + 1}</div>
                            <div className="text-lg font-bold text-slate-900 dark:text-white">{m.brandedName}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                      <tr>
                        <td className="py-6 px-4 text-sm font-bold text-slate-500">Generic Price</td>
                        {selectedForComparison.map((m, i) => (
                          <td key={i} className="py-6 px-4 text-xl font-black text-emerald-500">₹{m.genericPrice}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-6 px-4 text-sm font-bold text-slate-500">Savings</td>
                        {selectedForComparison.map((m, i) => (
                          <td key={i} className="py-6 px-4">
                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-black">
                              <IndianRupee className="w-3 h-3" /> Save ₹{m.savings}
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-6 px-4 text-sm font-bold text-slate-500">Branded Version</td>
                        {selectedForComparison.map((m, i) => (
                          <td key={i} className="py-6 px-4">
                            <div className="text-sm font-bold text-rose-500">{m.brandedName}</div>
                            <div className="text-xs text-slate-400">₹{m.brandedPrice}</div>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-6 px-4 text-sm font-bold text-slate-500">Salt Composition</td>
                        {selectedForComparison.map((m, i) => (
                          <td key={i} className="py-6 px-4 text-sm text-slate-600 dark:text-slate-400">{m.saltComposition}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-6 px-4 text-sm font-bold text-slate-500">Side Effects</td>
                        {selectedForComparison.map((m, i) => (
                          <td key={i} className="py-6 px-4">
                            <ul className="space-y-1">
                              {(Array.isArray(m.sideEffects) ? m.sideEffects : []).slice(0, 3).map((s, j) => (
                                <li key={j} className="text-xs text-slate-600 dark:text-slate-400 flex gap-2">
                                  <span className="text-amber-500">•</span>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-6 px-4 text-sm font-bold text-slate-500">Interactions</td>
                        {selectedForComparison.map((m, i) => (
                          <td key={i} className="py-6 px-4">
                            <ul className="space-y-1">
                              {(Array.isArray(m.interactions) ? m.interactions : []).slice(0, 3).map((s, j) => (
                                <li key={j} className="text-xs text-slate-600 dark:text-slate-400 flex gap-2">
                                  <span className="text-purple-500">•</span>
                                  {s}
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

              <div className="p-6 bg-slate-50 dark:bg-[#0B1120] text-center">
                <p className="text-[10px] italic text-slate-400">
                  * Comparison is based on active ingredients and estimated market prices. Always consult your doctor before switching medications.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-[#1E293B] text-center pb-12">
        <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-[#94A3B8] text-xs">
          <Activity className="w-3 h-3" />
          <span>Powered by Gemini AI • {APP_VERSION}</span>
        </div>
      </div>
    </div>
  );
}
