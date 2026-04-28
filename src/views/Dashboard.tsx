import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  ChevronRight, 
  ArrowRight,
  Zap,
  BarChart3,
  Clock,
  FileText,
  Share2,
  Key,
  ShoppingBag,
  Loader2
} from 'lucide-react';
import { Stage } from '../App';
import { firestoreService } from '../services/firestoreService';

export default function DashboardView({ onStart, onNavigate }: { onStart: () => void, onNavigate: (stage: Stage) => void }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const data = await firestoreService.getGlobalStats();
      if (data) setStats(data);
      setLoading(false);
    };
    loadStats();
  }, []);

  const statCards = [
    { id: 'TRENDS', label: 'Trends Discovered', value: stats?.trends || 0, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'KEYWORDS', label: 'Active Keywords', value: stats?.keywords || 0, icon: Key, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'PRODUCTS', label: 'Products Scoped', value: stats?.products || 0, icon: ShoppingBag, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'CONTENT', label: 'Articles Generated', value: stats?.articles || 0, icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'SOCIAL', label: 'Social Assets', value: stats?.social_posts || 0, icon: Share2, color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 lg:p-16 relative overflow-hidden shadow-sm">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-extrabold mb-8 uppercase tracking-[0.2em] border border-blue-100/50">
            <Zap className="w-3 h-3 fill-blue-600" /> Live Pipeline Status
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-gray-900 mb-6 tracking-tighter leading-[0.9]">
            Workflow <br /> <span className="text-blue-600">Intelligence.</span>
          </h1>
          <p className="text-gray-500 max-w-lg mb-10 text-xl leading-relaxed font-medium">
            Your end-to-end affiliate marketing funnel performance. Every metric here is synced in real-time with your active multi-channel campaigns.
          </p>
          <button 
            onClick={onStart}
            className="group inline-flex items-center gap-3 bg-gray-900 text-white font-bold px-8 py-4 rounded-3xl hover:bg-black transition-all shadow-2xl shadow-gray-200 hover:-translate-y-1 active:translate-y-0"
          >
            Launch New Campaign 
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Decoration */}
        <div className="absolute -top-10 -right-10 p-12 opacity-[0.03] pointer-events-none hidden lg:block">
          <TrendingUp className="w-96 h-96 text-blue-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <button
            key={card.id}
            onClick={() => onNavigate(card.id as Stage)}
            className="group bg-white border border-gray-100 p-8 rounded-[2rem] hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-left relative overflow-hidden"
          >
            <div className={`${card.bg} ${card.color} p-3 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform`}>
              <card.icon className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">{card.label}</h3>
            <p className="text-5xl font-black text-gray-900 tracking-tighter">
              {loading ? <Loader2 className="w-8 h-8 animate-spin text-gray-300" /> : card.value}
            </p>
            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-6 h-6 text-blue-600" />
            </div>
          </button>
        ))}
        
        <div className="bg-gray-900 p-8 rounded-[2rem] text-white flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <Zap className="text-blue-400 mb-6 w-8 h-8 fill-blue-400" />
            <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">Pipeline Reach</h3>
            <p className="text-5xl font-black tracking-tighter">
              {loading ? <Loader2 className="w-8 h-8 animate-spin text-gray-700" /> : (stats?.articles * 3 + (stats?.social_posts || 0)) || 0}
            </p>
            <p className="mt-4 text-xs font-bold text-gray-500 uppercase tracking-widest">estimated impressions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
