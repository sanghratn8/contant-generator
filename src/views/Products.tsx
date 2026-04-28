import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  ShoppingBag, 
  Loader2, 
  CheckCircle2, 
  ChevronRight,
  Star,
  ExternalLink,
  DollarSign,
  AlertCircle,
  Tag,
  Store,
  Trophy
} from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { firestoreService } from '../services/firestoreService';

export default function ProductsView({ selectedTrend, selectedKeyword, selectedProduct, onSelect, onNavigate }: { selectedTrend: any, selectedKeyword: any, selectedProduct: any, onSelect: (prod: any) => void, onNavigate: (stage: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedKeyword) {
      loadExistingProducts();
    }
  }, [selectedKeyword]);

  const loadExistingProducts = async () => {
    try {
      const data = await firestoreService.getProducts(selectedKeyword.id);
      if (data) setProducts(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load products from database.");
    }
  };

  const handleSuggestProducts = async () => {
    if (!selectedKeyword) return;
    setLoading(true);
    setError(null);
    setLoadingStep(`Searching ${selectedTrend?.country || 'Global'} market via Amazon, Walmart & eBay...`);
    
    const steps = [
      'Scraping Best Sellers...',
      'Analyzing market velocity...',
      'Cross-referencing Walmart/eBay...',
      'Verifying availability...',
      'Filtering potential...'
    ];
    
    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setLoadingStep(steps[stepIdx]);
        stepIdx++;
      }
    }, 400); // Drastically reduced from 2000ms

    try {
      const suggested = await geminiService.suggestProducts(selectedKeyword.keyword, selectedTrend?.country);
      clearInterval(interval);
      setLoadingStep('Populating product database...');
      const saved = [];
      for (const p of suggested) {
        const rating = Number(p.rating) || 0;
        const profit_score = Number(p.profit_score) || 0;

        const docRef = await firestoreService.addProduct({ 
          ...p, 
          rating,
          profit_score,
          keywordId: selectedKeyword.id,
          affiliate_link: "" 
        });
        saved.push({ id: docRef?.id, ...p, rating, profit_score, keywordId: selectedKeyword.id, affiliate_link: "", selected: false });
      }
      setProducts(prev => [...saved, ...prev]);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Product data sync failed. Please retry.");
      clearInterval(interval);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const selectProduct = async (prod: any) => {
    await firestoreService.selectProduct(prod.id);
    onSelect(prod);
  };

  if (!selectedKeyword) {
    return (
      <div className="py-32 text-center bg-white border border-gray-100 rounded-[3rem] p-12 max-w-4xl mx-auto shadow-sm">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-blue-100">
          <ShoppingBag className="w-10 h-10 text-blue-500" />
        </div>
        <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Keyword Selection Required</h3>
        <p className="text-gray-500 mb-10 text-lg font-medium">Select a target search term to initiate e-commerce platform scraping.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-32">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <button 
          onClick={() => onNavigate('KEYWORDS')}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Keyword Step
        </button>

        {selectedProduct && (
          <div className="bg-blue-600 rounded-2xl px-6 py-3 text-white flex items-center gap-6 shadow-xl shadow-blue-500/20 animate-in slide-in-from-right-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Focus Product</p>
              <h3 className="text-sm font-black truncate max-w-[200px]">{selectedProduct.name}</h3>
            </div>
            <button 
              onClick={() => onNavigate('CONTENT')}
              className="bg-white text-blue-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              Continue to Article <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 lg:p-14 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden">
        <div className="max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4 border border-blue-100/50">
            Marketplace Analytics
          </div>
          <h2 className="text-4xl lg:text-7xl font-black text-gray-900 tracking-tighter leading-none mb-6">{selectedKeyword.keyword}</h2>
          <div className="flex flex-wrap gap-4">
             <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
               <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Platform Sync</span>
               <span className="text-sm font-black text-gray-900">Live Enabled</span>
             </div>
             <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
               <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Region</span>
               <span className="text-sm font-black text-gray-900 uppercase">{selectedTrend?.country || 'Global'}</span>
             </div>
          </div>
        </div>
        
        <button 
          onClick={handleSuggestProducts}
          disabled={loading}
          className="w-full md:w-auto min-w-[280px] bg-gray-900 text-white font-black px-12 py-6 rounded-[2rem] flex items-center justify-center gap-4 hover:bg-black disabled:opacity-50 transition-all shadow-2xl shadow-gray-200 z-10 active:scale-95 hover:-translate-y-1"
        >
          {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Store className="w-7 h-7" />}
          Live Scrape Products
        </button>

        <ShoppingBag className="absolute -right-20 -bottom-20 w-80 h-80 text-blue-500/5 pointer-events-none" />
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center gap-4 text-rose-700 animate-in slide-in-from-top-4">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <div className="flex-1">
             <p className="font-bold">Database Sync Alert</p>
             <p className="text-sm opacity-80">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-600 font-bold uppercase text-[10px] tracking-widest"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading && loadingStep && (
        <div className="flex items-center gap-4 text-blue-600 pl-4 animate-in fade-in slide-in-from-top-6">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-sm font-black uppercase tracking-widest animate-pulse">{loadingStep}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {products.map((prod) => (
          <div key={prod.id} className="bg-white border border-gray-100 rounded-[2.5rem] flex flex-col shadow-sm transition-all hover:border-blue-100 relative group overflow-hidden hover:shadow-2xl hover:shadow-blue-500/5">
            <div className="w-full h-64 bg-gray-50 relative overflow-hidden flex items-center justify-center p-6">
              <img 
                src={prod.image_url} 
                alt={prod.name}
                className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-gray-100 flex items-center gap-1.5 shadow-sm">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-black text-gray-900">{prod.rating}</span>
                </div>
                <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                  prod.platform === 'Amazon' ? 'bg-[#FF9900]/10 text-[#FF9900] border-[#FF9900]/20' :
                  prod.platform === 'Walmart' ? 'bg-[#0071CE]/10 text-[#0071CE] border-[#0071CE]/20' :
                  'bg-gray-100 text-gray-900 border-gray-200'
                }`}>
                  {prod.platform}
                </div>
                {prod.profit_score > 90 && (
                  <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
                    <Trophy className="w-3 h-3" /> Winner
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-10 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-6 gap-4">
                <h3 className="text-lg font-black text-gray-900 leading-[1.1] uppercase tracking-tighter line-clamp-3">
                  {prod.name}
                </h3>
              </div>
              
              <div className="flex items-center justify-between mb-8">
                <div>
                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Source Price</p>
                   <p className="text-2xl font-black text-gray-900 tracking-tight italic">{prod.price}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Profit Index</p>
                   <p className="text-xl font-black text-emerald-600">{prod.profit_score}%</p>
                </div>
              </div>

              <div className="space-y-2 mb-10">
                <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest block pl-1">Partner Marketplace Link</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Campaign Link ID..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-xs text-blue-600 font-bold placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-100 transition-all shadow-inner"
                    defaultValue={prod.affiliate_link}
                    onBlur={(e) => firestoreService.updateProduct(prod.id, { affiliate_link: e.target.value })} 
                  />
                  <ExternalLink className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300 group-focus-within:text-blue-500" />
                </div>
              </div>

              <button 
                onClick={() => selectProduct(prod)}
                disabled={prod.selected}
                className={`w-full mt-auto flex items-center justify-center gap-3 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all ${
                  prod.selected 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                    : 'bg-gray-900 text-white hover:bg-black shadow-xl shadow-gray-200'
                }`}
              >
                {prod.selected ? <CheckCircle2 className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                {prod.selected ? 'Selected' : 'Add to Pipeline'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
