import React, { useState } from 'react';
import { 
  ArrowLeft,
  Upload, 
  CheckCircle2, 
  ExternalLink, 
  Globe, 
  Copy,
  AlertCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { firestoreService } from '../services/firestoreService';

export default function PublishView({ selectedArticle, onPublished, onNavigate }: { selectedArticle: any, onPublished: (art: any) => void, onNavigate: (stage: any) => void }) {
  const [url, setUrl] = useState(selectedArticle?.url || '');
  const [publishing, setPublishing] = useState(false);

  if (!selectedArticle || !selectedArticle.approved) {
    return (
      <div className="py-32 text-center bg-white border border-gray-100 rounded-[3rem] p-12 max-w-4xl mx-auto shadow-sm">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-100">
          <AlertCircle className="w-10 h-10 text-amber-500" />
        </div>
        <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Content Not Approved</h3>
        <p className="text-gray-500 mb-10 text-lg font-medium leading-relaxed">You must finalize and approve the article draft before it can be marked as published on your platform.</p>
        <button 
          onClick={() => onNavigate('CONTENT')}
          className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Editor
        </button>
      </div>
    );
  }

  const handlePublish = async () => {
    if (!url) return;
    setPublishing(true);
    try {
      await firestoreService.updateArticle(selectedArticle.id, { 
        published: true,
        url: url
      });
      onPublished({ ...selectedArticle, published: true, url });
    } catch (e) {
      console.error(e);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <button 
          onClick={() => onNavigate('CONTENT')}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Editorial Step
        </button>

        {selectedArticle.published && (
          <div className="bg-blue-600 rounded-2xl px-6 py-3 text-white flex items-center gap-6 shadow-xl shadow-blue-500/20 animate-in slide-in-from-right-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Distribution</p>
              <h3 className="text-sm font-black italic">Live on Web</h3>
            </div>
            <button 
              onClick={() => onNavigate('SOCIAL')}
              className="bg-white text-blue-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              Continue to Social <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-8 lg:p-12 shadow-sm text-center">
        <div className="bg-blue-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <Globe className="text-blue-600 w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Ready to go Live?</h1>
        <p className="text-gray-500 max-w-md mx-auto mb-10 leading-relaxed text-lg">
          Once you've published the article to your blog or website, paste the URL below to enable social media generation.
        </p>

        <div className="max-w-xl mx-auto space-y-4">
          <div className="relative group">
            <input 
              type="url" 
              placeholder="https://yourblog.com/awesome-article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-center text-lg font-medium"
            />
          </div>
          
          <button 
            onClick={handlePublish}
            disabled={publishing || !url}
            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
              selectedArticle.published 
                ? 'bg-emerald-600 text-white shadow-emerald-100' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
            }`}
          >
            {publishing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
            {selectedArticle.published ? 'Article Published' : 'Confirm Publication'}
          </button>
        </div>

        {selectedArticle.published && (
          <div className="mt-8 flex items-center justify-center gap-2 text-emerald-600 font-bold">
            <CheckCircle2 className="w-5 h-5" /> All systems ready for social distribution
          </div>
        )}
      </div>

      <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-left flex-1">
            <div className="flex items-center gap-2 mb-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Currently Active
            </div>
            <h3 className="text-xl font-bold">{selectedArticle.title}</h3>
            <p className="text-gray-400 mt-1 truncate">{url || 'No URL yet'}</p>
          </div>
          {url && (
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 backdrop-blur-md transition-all"
            >
              Visit Article <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
