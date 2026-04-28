import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  FileText, 
  Loader2, 
  CheckCircle2, 
  ChevronRight,
  Edit3,
  Eye,
  Type,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { firestoreService } from '../services/firestoreService';
import ReactMarkdown from 'react-markdown';

export default function ContentView({ 
  selectedTrend, 
  selectedKeyword, 
  selectedProduct, 
  selectedArticle,
  onApprove, 
  onNavigate 
}: { 
  selectedTrend: any, 
  selectedKeyword: any, 
  selectedProduct: any, 
  selectedArticle: any,
  onApprove: (art: any) => void,
  onNavigate: (stage: any) => void 
}) {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [article, setArticle] = useState<any>(selectedArticle || null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!article && selectedKeyword && selectedProduct) {
      loadExistingArticle();
    }
  }, [selectedKeyword, selectedProduct]);

  const loadExistingArticle = async () => {
    try {
      const data = await firestoreService.getArticlesByKeyword(selectedKeyword.id);
      if (data && data.length > 0) {
        setArticle(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateArticle = async () => {
    setLoading(true);
    setLoadingStep('Researching and drafting SEO content...');
    try {
      const generated = await geminiService.generateArticle(selectedKeyword.keyword, selectedProduct, selectedTrend);
      let { title, content } = generated;
      
      setLoadingStep('Synthesizing high-quality hero image prompt...');
      // Note: In a real app we might use DALL-E or Midjourney via API. Here we use high-quality placeholders.
      
      // Use premium placeholder for now (Picsum with curated seed)
      const image_url = `https://picsum.photos/seed/${encodeURIComponent(title)}/1200/630`;
      
      // Inject real affiliate link if it exists
      const realLink = selectedProduct.affiliate_link || "#";
      content = content.replace(/\[AFFILIATE_LINK\]/g, realLink);

      setLoadingStep('Saving finalized article to database...');
      const data = {
        title,
        content,
        image_url,
        keywordId: selectedKeyword.id,
        productId: selectedProduct.id,
        approved: false,
        published: false,
        url: ""
      };
      const docRef = await firestoreService.addArticle(data);
      const newArticle = { id: docRef?.id, ...data };
      setArticle(newArticle);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const approveArticle = async () => {
    if (!article) return;
    await firestoreService.updateArticle(article.id, { approved: true });
    onApprove({ ...article, approved: true });
  };

  const updateContent = async (newContent: string) => {
    if (!article) return;
    setArticle({ ...article, content: newContent });
    await firestoreService.updateArticle(article.id, { content: newContent });
  };

  const updateTitle = async (newTitle: string) => {
    if (!article) return;
    setArticle({ ...article, title: newTitle });
    await firestoreService.updateArticle(article.id, { title: newTitle });
  };

  if (!selectedKeyword || !selectedProduct) {
    return (
      <div className="py-32 text-center bg-white border border-gray-100 rounded-[3rem] p-12 max-w-4xl mx-auto shadow-sm">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-100">
          <AlertCircle className="w-10 h-10 text-amber-500" />
        </div>
        <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Context Missing</h3>
        <p className="text-gray-500 mb-10 text-lg font-medium leading-relaxed">Select both a target keyword and a product winner before generating copy.</p>
        <button 
          onClick={() => onNavigate('PRODUCTS')}
          className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" /> Finalize Product Scan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-32">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <button 
          onClick={() => onNavigate('PRODUCTS')}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Product Selection
        </button>

        {article?.approved && (
          <div className="bg-blue-600 rounded-2xl px-6 py-3 text-white flex items-center gap-6 shadow-xl shadow-blue-500/20 animate-in slide-in-from-right-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Status</p>
              <h3 className="text-sm font-black italic">Content Ready</h3>
            </div>
            <button 
              onClick={() => onNavigate('PUBLISH')}
              className="bg-white text-blue-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              Continue to Publish <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 lg:p-14 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 text-left">
            <div className="flex gap-2 mb-2">
              <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded text-[10px] font-bold">KW: {selectedKeyword.keyword}</span>
              <span className="bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded text-[10px] font-bold">PROD: {selectedProduct.name}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">SEO Content Creator</h2>
          </div>
          {!article ? (
            <button 
              onClick={handleGenerateArticle}
              disabled={loading}
              className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-100"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Generate Article
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`p-3 rounded-xl border transition-all ${isEditing ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                title={isEditing ? "Switch to Preview" : "Switch to Editor"}
              >
                {isEditing ? <Eye className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
              </button>
              <button 
                onClick={approveArticle}
                disabled={article.approved}
                className={`bg-blue-600 text-white font-semibold px-8 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all ${article.approved ? 'bg-emerald-600' : ''}`}
              >
                {article.approved ? <CheckCircle2 className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                {article.approved ? 'Approved' : 'Approve Content'}
              </button>
            </div>
          )}
        </div>
      </div>

      {article && (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm min-h-[600px] flex flex-col items-stretch">
          <div className="p-6 border-b border-gray-100 text-left">
            {isEditing ? (
              <input 
                type="text" 
                value={article.title}
                onChange={(e) => updateTitle(e.target.value)}
                className="w-full text-3xl font-extrabold text-gray-900 bg-transparent border-none focus:outline-none placeholder:text-gray-200"
                placeholder="Article Title"
              />
            ) : (
              <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">{article.title}</h1>
            )}
          </div>
          
          {article.image_url && !isEditing && (
            <div className="w-full aspect-video overflow-hidden border-b border-gray-100">
              <img 
                src={article.image_url} 
                alt={article.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          
          <div className="flex-1 p-6 lg:p-10 text-left">
            {isEditing ? (
              <textarea 
                value={article.content}
                onChange={(e) => updateContent(e.target.value)}
                className="w-full h-full min-h-[500px] text-gray-700 leading-relaxed bg-transparent border-none focus:outline-none resize-none font-mono text-sm"
                placeholder="Start writing your article..."
              />
            ) : (
              <div className="markdown-body prose prose-slate max-w-none text-gray-700 leading-relaxed prose-headings:font-black prose-a:text-blue-600 prose-strong:text-gray-900">
                <ReactMarkdown>{article.content}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-900 font-bold text-xl animate-pulse">{loadingStep || 'Drafting your article...'}</p>
          <p className="text-gray-500 mt-2">Our AI is researching and writing for you.</p>
        </div>
      )}
    </div>
  );
}
