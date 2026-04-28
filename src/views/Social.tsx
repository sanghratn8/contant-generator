import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Share2, 
  Loader2, 
  Copy, 
  Check, 
  AlertCircle,
  Sparkles,
  ExternalLink,
  Calendar,
  Clock as ClockIcon,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '../services/geminiService';
import { firestoreService } from '../services/firestoreService';

// Fallback icons as lucide doesn't have brand icons by default in all versions
const PlatformIcon = ({ name }: { name: string }) => {
  if (name === 'Pinterest') return <Share2 className="w-5 h-5 text-rose-600" />;
  if (name === 'Instagram') return <Share2 className="w-5 h-5 text-purple-600" />;
  return <Share2 className="w-5 h-5 text-blue-600" />;
};

export default function SocialView({ selectedArticle, onNavigate }: { selectedArticle: any, onNavigate: (stage: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');

  useEffect(() => {
    if (selectedArticle && selectedArticle.published) {
      loadExistingPosts();
    }
  }, [selectedArticle]);

  const loadExistingPosts = async () => {
    try {
      const data = await firestoreService.getSocialPosts(selectedArticle.id);
      if (data && data.length > 0) setPosts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateSocial = async () => {
    setLoading(true);
    try {
      const generated = await geminiService.generateSocialContent(selectedArticle.title, selectedArticle.content);
      
      const newPosts: any[] = [];
      
      // Flatten generated content into posts
      if (generated.pinterest && Array.isArray(generated.pinterest)) {
        generated.pinterest.forEach((p: any) => {
          newPosts.push({ platform: 'Pinterest', content: `${p.title}\n\n${p.description}` });
        });
      }
      if (generated.instagram && Array.isArray(generated.instagram)) {
        generated.instagram.forEach((p: any) => {
          newPosts.push({ platform: 'Instagram', content: p });
        });
      }
      if (generated.facebook) {
        newPosts.push({ platform: 'Facebook', content: generated.facebook });
      }

      const saved = [];
      for (const p of newPosts) {
        const docRef = await firestoreService.addSocialPost({ 
          ...p, 
          articleId: selectedArticle.id,
          isScheduled: false 
        });
        saved.push({ id: docRef?.id, ...p, isScheduled: false });
      }
      setPosts(prev => [...saved, ...prev]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (id: string) => {
    if (!scheduleDate) return;
    try {
      await firestoreService.updateSocialPost(id, {
        isScheduled: true,
        scheduledAt: scheduleDate
      });
      setPosts(posts.map(p => p.id === id ? { ...p, isScheduled: true, scheduledAt: scheduleDate } : p));
      setSchedulingId(null);
      setScheduleDate('');
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!selectedArticle || !selectedArticle.published) {
    return (
      <div className="py-32 text-center bg-white border border-gray-100 rounded-[3rem] p-12 max-w-4xl mx-auto shadow-sm">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-100">
          <AlertCircle className="w-10 h-10 text-amber-500" />
        </div>
        <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Article Path Not Live</h3>
        <p className="text-gray-500 mb-10 text-lg font-medium leading-relaxed">You must provide the live URL of your published article before we can generate optimized social media distribution assets.</p>
        <button 
          onClick={() => onNavigate('PUBLISH')}
          className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Publish Status
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-32">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <button 
          onClick={() => onNavigate('PUBLISH')}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Publish Status
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1 block">Live Article</span>
          <h2 className="text-2xl font-bold text-gray-900 truncate max-w-lg">{selectedArticle.title}</h2>
          <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1">
            {selectedArticle.url} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <button 
          onClick={handleGenerateSocial}
          disabled={loading}
          className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-100"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          Generate Assets
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        <AnimatePresence>
          {posts.map((post) => (
            <motion.div 
              key={post.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col relative group transition-all hover:border-blue-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    post.platform === 'Pinterest' ? 'bg-rose-50' : 
                    post.platform === 'Instagram' ? 'bg-purple-50' : 'bg-blue-50'
                  }`}>
                    <PlatformIcon name={post.platform} />
                  </div>
                  <span className="font-bold text-gray-900">{post.platform}</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(post.content, post.id)}
                  className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors relative"
                >
                  {copiedId === post.id ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                  {copiedId === post.id && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-xl">Copied!</span>
                  )}
                </button>
              </div>

              <div className="flex-1 bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
                {post.content}
              </div>

              <div className="mt-auto">
                {post.isScheduled ? (
                  <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Scheduled: {new Date(post.scheduledAt).toLocaleString()}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {schedulingId === post.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="datetime-local" 
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-100 outline-none"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                        />
                        <button 
                          onClick={() => handleSchedule(post.id)}
                          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setSchedulingId(null)}
                          className="bg-gray-100 text-gray-400 p-2 rounded-lg hover:bg-gray-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setSchedulingId(post.id)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-all"
                      >
                        <ClockIcon className="w-4 h-4" /> Schedule Post
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {posts.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No social media assets generated yet. Click above to create them.</p>
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-900 font-bold text-xl animate-pulse">Designing your social posts...</p>
          <p className="text-gray-500 mt-2">Writing captions and pinterest descriptions.</p>
        </div>
      )}
    </div>
  );
}
