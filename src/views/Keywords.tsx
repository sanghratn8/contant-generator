import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Key, 
  Loader2, 
  CheckCircle2, 
  ArrowUpRight, 
  ChevronRight,
  Info,
  AlertCircle,
  BarChart3,
  Search,
  DollarSign,
  Box,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { geminiService } from '../services/geminiService';
import { firestoreService } from '../services/firestoreService';

export default function KeywordsView({ selectedTrend, selectedKeyword, onSelect, onNavigate }: { selectedTrend: any, selectedKeyword: any, onSelect: (kw: any) => void, onNavigate: (stage: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [keywords, setKeywords] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTrend) {
      loadExistingKeywords();
    }
  }, [selectedTrend]);

  const loadExistingKeywords = async () => {
    try {
      const data = await firestoreService.getKeywords(selectedTrend.id);
      if (data) setKeywords(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load keywords from the database.");
    }
  };

  const handleGenerateKeywords = async () => {
    if (!selectedTrend) return;
    setLoading(true);
    setError(null);
    setLoadingStep('Accessing Helium 10 & Google Trends market data...');
    
    const steps = [
      'Extracting rising search spikes...',
      'Clustering search intent variants...',
      'Analyzing Helium 10 competition...',
      'Identifying high-ROI transactional keywords...'
    ];
    
    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setLoadingStep(steps[stepIdx]);
        stepIdx++;
      }
    }, 400); // Drastically reduced from 2000ms

    try {
      const generated = await geminiService.generateKeywords(selectedTrend.name);
      clearInterval(interval);
      setLoadingStep('Syncing keywords to pipeline...');
      const saved = [];
      for (const k of generated) {
        const difficulty = Number(k.difficulty) || 0;
        const volume = Number(k.volume) || 0;
        const cpc = Number(k.cpc) || 0;
        const competition_count = Number(k.competition_count) || 0;

        const docRef = await firestoreService.addKeyword({ 
          ...k, 
          difficulty, 
          volume, 
          cpc, 
          competition_count, 
          trendId: selectedTrend.id 
        });
        saved.push({ 
          id: docRef?.id, 
          ...k, 
          difficulty, 
          volume, 
          cpc, 
          competition_count, 
          trendId: selectedTrend.id, 
          selected: false 
        });
      }
      setKeywords(prev => [...saved, ...prev]);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to generate keywords. Please try again.");
      clearInterval(interval);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const selectKeyword = async (kw: any) => {
    await firestoreService.selectKeyword(kw.id);
    onSelect(kw);
  };

  const filteredKeywords = keywords.filter(kw => {
    if (filter === 'all') return true;
    if (filter === 'high_volume') return kw.volume > 10000;
    if (filter === 'low_comp') return kw.difficulty < 50;
    if (filter === 'buyer') return kw.intent.toLowerCase().includes('transactional') || kw.intent.toLowerCase().includes('commercial');
    return true;
  });

  if (!selectedTrend) {
    return (
      <div className="py-32 text-center bg-white border border-gray-100 rounded-[3rem] p-12 max-w-4xl mx-auto shadow-sm">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-100">
          <AlertCircle className="w-10 h-10 text-amber-500" />
        </div>
        <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">No Market Focus Selected</h3>
        <p className="text-gray-500 mb-10 text-lg font-medium leading-relaxed">You need to select a trend from the Discovery phase before initiating Cerebro-style keyword research.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-32">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <button 
          onClick={() => onNavigate('TRENDS')}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Discovery Step
        </button>

        {selectedKeyword && (
          <div className="bg-blue-600 rounded-2xl px-6 py-3 text-white flex items-center gap-6 shadow-xl shadow-blue-500/20 animate-in slide-in-from-right-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Focus Keyword</p>
              <h3 className="text-sm font-black truncate max-w-[200px]">{selectedKeyword.keyword}</h3>
            </div>
            <button 
              onClick={() => onNavigate('PRODUCTS')}
              className="bg-white text-blue-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              Continue to Products <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 lg:p-14 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-widest mb-6 border border-amber-100/50">
            Helium 10 Cerebro Integration
          </div>
          <h2 className="text-4xl lg:text-7xl font-black text-gray-900 tracking-tighter leading-none mb-6">{selectedTrend.name}</h2>
          <p className="text-gray-500 font-medium text-xl italic leading-relaxed max-w-3xl mb-12">Comparing data across Helium 10 Magnet, Pinterest Trends, and Google Ads Keyword Planner.</p>
          
          <div className="flex flex-wrap gap-4 mb-12">
            {[
              { id: 'all', label: 'All Keywords' },
              { id: 'high_volume', label: 'High Volume (10k+)' },
              { id: 'low_comp', label: 'Low Competition' },
              { id: 'buyer', label: 'Buyer Intent' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                  filter === f.id ? 'bg-gray-900 text-white border-gray-900 shadow-xl' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button 
            onClick={handleGenerateKeywords}
            disabled={loading}
            className="w-full lg:w-auto bg-blue-600 text-white font-black px-12 py-6 rounded-[2rem] flex items-center justify-center gap-4 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-2xl shadow-blue-500/20 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Key className="w-7 h-7" />}
            Extract High-Volume Keywords
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center gap-4 text-rose-700 animate-in slide-in-from-top-4">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <div className="flex-1">
             <p className="font-bold">Intelligence Scan Failed</p>
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

      <div className="grid grid-cols-1 gap-8">
        {filteredKeywords.map((kw) => (
          <div key={kw.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between group transition-all hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-500/5 gap-10">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-8">
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{kw.keyword}</h3>
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                  kw.intent.toLowerCase().includes('transactional') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  kw.intent.toLowerCase().includes('commercial') ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-50 text-gray-400 border border-gray-100'
                }`}>
                  {kw.intent}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                     <Search className="w-3.5 h-3.5 text-gray-400" />
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Search Volume</p>
                  </div>
                  <p className="text-2xl font-black text-gray-900 tracking-tight">{kw.volume?.toLocaleString() || 'N/A'}</p>
                </div>
                <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                     <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Est. CPC</p>
                  </div>
                  <p className="text-2xl font-black text-gray-900 tracking-tight">${kw.cpc?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                     <Box className="w-3.5 h-3.5 text-gray-400" />
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Products</p>
                  </div>
                  <p className="text-2xl font-black text-gray-900 tracking-tight">{kw.competition_count?.toLocaleString() || 'N/A'}</p>
                </div>
                <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                     <TrendingUpIcon className="w-3.5 h-3.5 text-gray-400" />
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Difficulty</p>
                  </div>
                  <div className="flex items-end gap-2">
                    <p className="text-2xl font-black text-gray-900 tracking-tight">{kw.difficulty}%</p>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full mb-2 overflow-hidden flex-1">
                       <div className={`h-full rounded-full ${
                          kw.difficulty < 40 ? 'bg-emerald-500' : kw.difficulty < 70 ? 'bg-amber-500' : 'bg-rose-500'
                       }`} style={{ width: `${kw.difficulty}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-48 h-32 bg-gray-50/50 rounded-3xl p-6 border border-gray-100 flex flex-col items-center justify-center gap-6">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={kw.volume_history || []}>
                   <Area type="monotone" dataKey="volume" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} dot={false} />
                 </AreaChart>
               </ResponsiveContainer>
               
               <button 
                onClick={() => selectKeyword(kw)}
                disabled={kw.selected}
                className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                  kw.selected 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 italic' 
                    : 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-200'
                }`}
              >
                {kw.selected ? (
                  <>Selected <CheckCircle2 className="w-4 h-4" /></>
                ) : (
                  <>Select <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        ))}

        {keywords.length === 0 && !loading && (
          <div className="py-24 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
            <Key className="w-16 h-16 text-gray-200 mx-auto mb-8" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Initiate keyword pulse scan above</p>
          </div>
        )}
      </div>
    </div>
  );
}
