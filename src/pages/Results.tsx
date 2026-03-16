import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, IndianRupee, MapPin, Share2, FileDown, ShoppingCart, ExternalLink, Loader2, AlertTriangle, Activity, Mail, MessageCircle, Twitter, Copy, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import jsPDF from 'jspdf';

function RealTimePrices({ medicineName }: { medicineName: string }) {
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch(`/api/medicine-prices?medicine=${encodeURIComponent(medicineName)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch');
        }
        setPrices(data.results || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPrices();
  }, [medicineName]);

  if (loading) return <div className="text-sm text-[#94A3B8] flex items-center gap-2 mt-4"><Loader2 className="w-4 h-4 animate-spin"/> Checking live pharmacy prices...</div>;
  if (error) return <div className="text-sm text-rose-500 bg-rose-500/10 p-3 rounded-lg mt-4">Real-time prices unavailable: {error}</div>;
  if (prices.length === 0) return <div className="text-sm text-[#94A3B8] mt-4">No online availability found.</div>;

  return (
    <div className="mt-4 space-y-3 pt-4 border-t border-[#1E293B]">
      <h5 className="text-sm font-semibold flex items-center gap-1 text-white"><ShoppingCart className="w-4 h-4"/> Live Online Prices</h5>
      <div className="space-y-2">
        {prices.map((p, i) => (
          <a key={i} href={p.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-[#0B1120] hover:bg-[#1E293B] transition-colors border border-[#1E293B]">
            <div className="flex items-center gap-3">
              {p.thumbnail && <img src={p.thumbnail} alt={p.pharmacy} className="w-8 h-8 object-contain rounded bg-white" referrerPolicy="no-referrer" />}
              <span className="text-sm font-medium text-white">{p.pharmacy}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-emerald-400">{p.price}</span>
              <ExternalLink className="w-4 h-4 text-[#94A3B8]" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export function Results() {
  const navigate = useNavigate();
  const { results } = useAppStore();
  const [isLocating, setIsLocating] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!results || results.length === 0) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-lg text-[#94A3B8]">No results found. Please scan a prescription first.</p>
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          const { latitude, longitude } = position.coords;
          window.open(`https://www.google.com/maps/search/Jan+Aushadhi+Kendra+or+pharmacy+near+me/@${latitude},${longitude},15z`, '_blank');
        },
        (error) => {
          console.warn("Geolocation failed or denied, falling back to generic search.", error);
          setIsLocating(false);
          window.open('https://www.google.com/maps/search/Jan+Aushadhi+Kendra+or+pharmacy+near+me', '_blank');
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setIsLocating(false);
      window.open('https://www.google.com/maps/search/Jan+Aushadhi+Kendra+or+pharmacy+near+me', '_blank');
    }
  };

  const generatePDF = () => {
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
        doc.text(`Side Effects: ${item.sideEffects.join(', ')}`, 20, currentY, { maxWidth: 170 });
        currentY += Math.ceil(item.sideEffects.join(', ').length / 100) * 5 + 2;
      }
      
      if (item.interactions && item.interactions.length > 0) {
        doc.text(`Interactions: ${item.interactions.join(', ')}`, 20, currentY, { maxWidth: 170 });
        currentY += Math.ceil(item.interactions.join(', ').length / 100) * 5 + 2;
      }
      
      yPos = currentY + 10;
    });
    
    doc.save("GenericMed_Savings_Report.pdf");
  };

  const shareText = `GenericMed Savings Report\nTotal Branded: ₹${totalBranded}\nTotal Generic: ₹${totalGeneric}\nTotal Savings: ₹${totalSavings}\n\nMedicines:\n${results.map(r => {
    let details = `- ${r.brandedName} -> ${r.genericName} (Save ₹${r.savings})\n  Salt: ${r.saltComposition}`;
    if (r.sideEffects && r.sideEffects.length > 0) {
      details += `\n  Side Effects: ${r.sideEffects.join(', ')}`;
    }
    if (r.interactions && r.interactions.length > 0) {
      details += `\n  Interactions: ${r.interactions.join(', ')}`;
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
        setShowShareModal(false);
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

  return (
    <div className="px-4 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-[#1E293B] text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-white">Your Results</h2>
      </div>

      {/* Savings Summary Card */}
      <div className="p-6 rounded-2xl shadow-lg border-t-4 border-emerald-500 bg-[#111C33] border border-[#1E293B]">
        <h3 className="text-lg font-medium text-[#94A3B8] mb-2">Total Estimated Savings</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-emerald-500">₹{totalSavings}</span>
          <span className="text-sm font-medium text-[#94A3B8]">per purchase</span>
        </div>
        
        <div className="mt-6 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#94A3B8]">Branded Cost</span>
            <span className="font-semibold line-through text-[#94A3B8]">₹{totalBranded}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#94A3B8]">Generic Cost</span>
            <span className="font-semibold text-[#00A3FF]">₹{totalGeneric}</span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button 
            onClick={generatePDF}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1E293B] hover:bg-[#2A374A] text-white rounded-xl font-medium transition-colors"
          >
            <FileDown className="w-5 h-5" />
            Save PDF
          </button>
          <button 
            onClick={() => setShowShareModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"
          >
            <Share2 className="w-5 h-5" />
            Share
          </button>
        </div>
      </div>

      <h3 className="font-bold text-xl mt-8 mb-4 text-white">Medicine Details</h3>
      
      <div className="space-y-4">
        {results.map((item, idx) => (
          <div key={idx} className="p-5 rounded-2xl shadow-sm space-y-4 bg-[#111C33] border border-[#1E293B]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1 block">Prescribed (Branded)</span>
                <h4 className="text-lg font-bold text-rose-500">{item.brandedName}</h4>
                <p className="text-sm text-[#94A3B8] mt-1">₹{item.brandedPrice}</p>
              </div>
              <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                Save ₹{item.savings}
              </div>
            </div>

            <div className="h-px bg-[#1E293B] w-full"></div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Generic Alternative
              </span>
              <h4 className="text-xl font-bold text-[#00A3FF]">{item.genericName}</h4>
              <p className="text-lg font-semibold mt-1 text-white">₹{item.genericPrice}</p>
            </div>

            <div className="p-3 rounded-lg text-sm bg-[#0B1120] text-[#94A3B8]">
              <span className="font-semibold block mb-1 text-white">Salt Composition:</span>
              {item.saltComposition}
            </div>

            {item.sideEffects && item.sideEffects.length > 0 && (
              <div className="p-3 rounded-lg text-sm bg-amber-500/10 text-amber-200/80 border border-amber-500/20">
                <span className="font-semibold flex items-center gap-1.5 mb-2 text-amber-500">
                  <AlertTriangle className="w-4 h-4" /> Potential Side Effects
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
                <span className="font-semibold flex items-center gap-1.5 mb-2 text-rose-500">
                  <Activity className="w-4 h-4" /> Known Interactions
                </span>
                <ul className="list-disc pl-5 space-y-1">
                  {item.interactions.map((interaction, i) => (
                    <li key={i}>{interaction}</li>
                  ))}
                </ul>
              </div>
            )}

            <RealTimePrices medicineName={item.genericName} />
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-[#1E293B]">
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
        <p className="text-center text-xs text-[#94A3B8] mt-3">
          Opens Google Maps to find Jan Aushadhi Kendras or generic pharmacies near you.
        </p>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1120]/80 backdrop-blur-sm">
          <div className="bg-[#111C33] border border-[#1E293B] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[#1E293B]">
              <h3 className="text-lg font-bold text-white">Share Savings Report</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-full hover:bg-[#1E293B] text-[#94A3B8] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              {!!navigator.share && (
                <button 
                  onClick={handleNativeShare}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1E293B] hover:bg-[#2A374A] text-white transition-colors"
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
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1E293B] hover:bg-[#2A374A] text-white transition-colors"
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
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1E293B] hover:bg-[#2A374A] text-white transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#1DA1F2]/20 flex items-center justify-center text-[#1DA1F2]">
                  <Twitter className="w-5 h-5" />
                </div>
                <span className="font-medium">X (Twitter)</span>
              </a>

              <a 
                href={`mailto:?subject=${encodeURIComponent('My Medicine Savings')}&body=${encodeURIComponent(shareText)}`}
                onClick={() => setShowShareModal(false)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1E293B] hover:bg-[#2A374A] text-white transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="font-medium">Email</span>
              </a>

              <button 
                onClick={handleCopy}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1E293B] hover:bg-[#2A374A] text-white transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#00A3FF]/20 flex items-center justify-center text-[#00A3FF]">
                  {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </div>
                <span className="font-medium">{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
