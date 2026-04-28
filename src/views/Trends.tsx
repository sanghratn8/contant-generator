import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  CheckCircle2, 
  Loader2, 
  ArrowUpRight,
  ChevronRight,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  ExternalLink,
  Globe,
  Filter,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const COUNTRIES = [
  { code: 'Global', name: 'Global' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'IN', name: 'India' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'BR', name: 'Brazil' },
  { code: 'JP', name: 'Japan' }
];
import { geminiService } from '../services/geminiService';
import { firestoreService } from '../services/firestoreService';

export default function TrendsView({ selectedTrend, onApprove, onNavigate }: { selectedTrend: any, onApprove: (trend: any) => void, onNavigate: (stage: any) => void }) {
  const [niche, setNiche] = useState('');
  const [country, setCountry] = useState('Global');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [trends, setTrends] = useState<any[]>([]);
  const [timeFilter, setTimeFilter] = useState('12m');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExistingTrends();
  }, []);

  const loadExistingTrends = async () => {
    try {
      const data = await firestoreService.getTrends();
      if (data) setTrends(data);
    } catch (err: any) {
      console.error("Failed to load trends:", err);
      setError("Failed to connect to the database. Please check your connection.");
    }
  };

  const handleFindTrends = async () => {
    if (!niche) return;
    setLoading(true);
    setError(null);
    setTrends([]); 
    setLoadingStep(`Connecting to ${country === 'Global' ? 'global' : country} search nodes...`);
    
    const steps = [
      `Initializing AI Pipeline...`,
      'Scraping Amazon Best Sellers...',
      'Mapping Google Trends spikes...',
      'Scanning Pinterest reports...',
      'Verifying market signals...',
      'Generating metrics...',
      'Polishing insights...'
    ];
    
    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setLoadingStep(steps[stepIdx]);
        stepIdx++;
      }
    }, 400); // Drastically reduced from 2500ms

    try {
      const generatedTrends = await geminiService.discoverTrends(niche, country);
      clearInterval(interval);
      setLoadingStep('Finalizing saved trends...');
      const savedTrends = [];
      for (const t of generatedTrends) {
        const growth_score = Number(t.growth_score) || 0;
        const docRef = await firestoreService.addTrend({ ...t, growth_score, niche, country });
        savedTrends.push({ id: docRef?.id, ...t, growth_score, niche, country, approved: false });
      }
      setTrends(prev => [...savedTrends, ...prev]);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "An unexpected error occurred during trend discovery.");
      clearInterval(interval);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const approveTrend = async (trend: any) => {
    await firestoreService.approveTrend(trend.id);
    onApprove(trend);
  };

  const getFilteredData = (data: any[]) => {
    if (!data) return [];
    if (timeFilter === '12m') return data;
    if (timeFilter === '6m') return data.slice(-6);
    if (timeFilter === '30d') return data.slice(-1);
    return data;
  };

  return (
    <div className="space-y-12 pb-32">
      {selectedTrend && (
        <div className="bg-blue-600 rounded-[2rem] p-8 text-white flex items-center justify-between shadow-xl shadow-blue-500/20 animate-in slide-in-from-top-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Current Intelligence Focus</p>
            <h3 className="text-2xl font-black tracking-tight">{selectedTrend.name}</h3>
          </div>
          <button 
            onClick={() => onNavigate('KEYWORDS')}
            className="bg-white text-blue-600 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center gap-2"
          >
            Go to Keywords <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 lg:p-14 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100/50">
              Pinterest Search Insights
            </div>
            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
              {['30d', '6m', '12m'].map(t => (
                <button
                  key={t}
                  onClick={() => setTimeFilter(t)}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    timeFilter === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <h1 className="text-4xl lg:text-7xl font-black text-gray-900 tracking-tighter leading-[0.95] mb-8">
            Trend <span className="text-blue-600">Dynamics.</span>
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
            <div className="lg:col-span-8 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Market niche..."
                className="w-full bg-gray-50 border border-gray-100 rounded-[2rem] pl-16 pr-8 py-6 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-100 transition-all font-bold text-xl shadow-inner shadow-gray-200/50"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFindTrends()}
                disabled={loading}
              />
            </div>
            <div className="lg:col-span-4 flex gap-4">
              <div className="flex-1 relative group">
                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                <select
                  className="w-full h-full bg-gray-50 border border-gray-100 rounded-[2rem] pl-14 pr-10 py-6 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-100 transition-all font-bold text-xl appearance-none cursor-pointer shadow-inner shadow-gray-200/50"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={loading}
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                   <ChevronRight className="w-5 h-5 rotate-90" />
                </div>
              </div>
              <button 
                onClick={handleFindTrends}
                disabled={loading || !niche}
                className="bg-gray-900 text-white font-black p-6 rounded-[2rem] flex items-center justify-center hover:bg-black disabled:opacity-50 transition-all active:scale-95 shadow-xl shadow-gray-200"
              >
                {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <TrendingUpIcon className="w-8 h-8" />}
              </button>
            </div>
          </div>

          {loading && loadingStep && (
            <div className="flex items-center gap-4 text-blue-600 mb-8 p-6 bg-blue-50/50 border border-blue-100/50 rounded-3xl animate-in zoom-in-95">
               <Loader2 className="w-6 h-6 animate-spin" />
               <p className="text-sm font-black uppercase tracking-[0.2em] animate-pulse">{loadingStep}</p>
            </div>
          )}

          {/* Main Visualizer (Comparison) */}
          {trends.length > 0 && (
            <div className="h-[400px] w-full mt-10 rounded-[2rem] p-8 bg-gray-50 border border-gray-100 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Normalised Search Interest
                </h3>
              </div>
              <div className="flex-1 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends[0]?.history || []}>
                    <defs>
                      <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }} 
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                        padding: '12px 16px' 
                      }}
                      labelStyle={{ fontWeight: 900, marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', color: '#9ca3af' }}
                    />
                    {trends.slice(0, 3).map((t, idx) => (
                      <Area 
                        key={t.id}
                        type="monotone" 
                        dataKey="interest" 
                        data={t.history}
                        name={t.name}
                        stroke={idx === 0 ? '#3b82f6' : idx === 1 ? '#f59e0b' : '#10b981'} 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill={idx === 0 ? "url(#colorInterest)" : "transparent"} 
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center gap-4 text-rose-700 animate-in slide-in-from-top-4">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <p className="font-bold">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-rose-400 hover:text-rose-600 font-bold uppercase text-[10px] tracking-widest"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {trends.map((trend) => (
          <div key={trend.id} className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:border-blue-100 transition-all group overflow-hidden flex flex-col">
            <div className="p-8 pb-4">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-2">
                  {trend.country && trend.country !== 'Global' && (
                    <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-2 uppercase tracking-wider">
                      <Globe className="w-3.5 h-3.5" /> {trend.country}
                    </div>
                  )}
                  <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    {trend.niche}
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black ${trend.growth_score > 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {trend.growth_score > 70 ? <TrendingUpIcon className="w-3.5 h-3.5" /> : <TrendingUpIcon className="w-3.5 h-3.5 rotate-45" />}
                  {trend.growth_score}% MOM
                </div>
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-2 tracking-tight line-clamp-1">{trend.name}</h3>
              <p className="text-gray-400 font-medium text-sm leading-relaxed mb-6 line-clamp-2">
                {trend.growth_description}
              </p>
            </div>

            <div className="px-8 h-32 w-full mb-6">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={trend.history}>
                    <Line 
                      type="monotone" 
                      dataKey="interest" 
                      stroke={trend.growth_score > 70 ? '#10b981' : '#f59e0b'} 
                      strokeWidth={3} 
                      dot={false} 
                    />
                 </LineChart>
               </ResponsiveContainer>
            </div>
            
            <div className="p-8 pt-0 mt-auto">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Competition</p>
                  <p className={`text-base font-black ${
                    trend.competition_level === 'Low' ? 'text-emerald-600' : 
                    trend.competition_level === 'Medium' ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {trend.competition_level || 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Market Intensity</p>
                  <p className="text-base font-black text-gray-900">
                    {trend.growth_score > 80 ? 'Heavy' : trend.growth_score > 50 ? 'Steady' : 'Emerging'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                {trend.approved ? (
                  <button 
                    onClick={() => onApprove(trend)}
                    className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all translate-y-0 hover:-translate-y-1"
                  >
                    Deep Keyword Analysis <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                    onClick={() => approveTrend(trend)}
                    className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-black transition-all"
                  >
                    Sync to Pipeline <ArrowUpRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
