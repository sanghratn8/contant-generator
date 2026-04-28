import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Key, 
  ShoppingBag, 
  FileText, 
  Upload, 
  Share2, 
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

// Views
import TrendsView from './views/Trends';
import KeywordsView from './views/Keywords';
import ProductsView from './views/Products';
import ContentView from './views/Content';
import PublishView from './views/Publish';
import SocialView from './views/Social';
import DashboardView from './views/Dashboard';

export type Stage = 'DASHBOARD' | 'TRENDS' | 'KEYWORDS' | 'PRODUCTS' | 'CONTENT' | 'PUBLISH' | 'SOCIAL';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<Stage>('DASHBOARD');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Workflow state (to pass between stages)
  const [selectedTrend, setSelectedTrend] = useState<any>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/popup-blocked') {
        setAuthError("Popup blocked by browser. Please allow popups for this site and try again.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Ignore this as it's usually benign or caused by multiple clicks
      } else {
        setAuthError(error.message || "An error occurred during login.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => signOut(auth);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#fdfdfd]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#fdfdfd] p-6 text-center">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-3xl p-10 shadow-sm transition-all duration-300">
          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="text-blue-600 w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-sans tracking-tight">Affiliate AI Assistant</h1>
          <p className="text-gray-500 mb-8 leading-relaxed font-sans">
            Automate your affiliate marketing workflow with AI. Find trends, generate content, and publish assets in minutes.
          </p>
          
          {authError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
              {authError}
            </div>
          )}

          <button 
            onClick={login}
            disabled={isLoggingIn}
            className={`w-full bg-gray-900 text-white font-semibold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 ${
              isLoggingIn ? 'opacity-70 cursor-not-allowed scale-[0.98]' : 'hover:bg-black hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            )}
            {isLoggingIn ? 'Connecting...' : 'Continue with Google'}
          </button>
          
          {authError && authError.includes('Popup blocked') && (
            <p className="mt-4 text-xs text-gray-400">
              Tip: Look for a blocked popup icon in your browser's address bar.
            </p>
          )}
        </div>
      </div>
    );
  }

  const navigateTo = (stage: Stage) => {
    setActiveStage(stage);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'TRENDS', label: 'Trends', icon: TrendingUp },
    { id: 'KEYWORDS', label: 'Keywords', icon: Key },
    { id: 'PRODUCTS', label: 'Products', icon: ShoppingBag },
    { id: 'CONTENT', label: 'Content', icon: FileText },
    { id: 'PUBLISH', label: 'Publish', icon: Upload },
    { id: 'SOCIAL', label: 'Social Media', icon: Share2 },
  ];

  const pipeline = [
    { id: 'TRENDS', label: 'Trend' },
    { id: 'KEYWORDS', label: 'Keyword' },
    { id: 'PRODUCTS', label: 'Product' },
    { id: 'CONTENT', label: 'Content' },
    { id: 'PUBLISH', label: 'Publish' },
    { id: 'SOCIAL', label: 'Social' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="h-full flex flex-col p-4">
          <div className="flex items-center gap-3 px-2 mb-10">
            <div className="bg-blue-600 p-2 rounded-lg">
              <TrendingUp className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">Affiliate AI</span>
          </div>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id as Stage)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeStage === item.id 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3 px-2 mb-6">
              <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border border-gray-100" />
              <div className="flex-1 overflow-hidden text-left">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 p-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 hover:bg-gray-50 rounded-lg text-gray-400">
            <Menu className="w-6 h-6" />
          </button>
          
          <h2 className="text-lg font-semibold text-gray-800">
            {menuItems.find(m => m.id === activeStage)?.label}
          </h2>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
            {pipeline.map((step, idx) => (
              <React.Fragment key={step.id}>
                <span className={`${activeStage === step.id ? 'text-blue-600' : ''}`}>
                  {step.label}
                </span>
                {idx < pipeline.length - 1 && <ChevronRight className="w-3 h-3" />}
              </React.Fragment>
            ))}
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeStage === 'DASHBOARD' && (
                  <DashboardView 
                    onStart={() => navigateTo('TRENDS')} 
                    onNavigate={navigateTo}
                  />
                )}
                {activeStage === 'TRENDS' && (
                  <TrendsView 
                    selectedTrend={selectedTrend}
                    onApprove={(trend) => {
                      setSelectedTrend(trend);
                      navigateTo('KEYWORDS');
                    }} 
                    onNavigate={navigateTo}
                  />
                )}
                {activeStage === 'KEYWORDS' && (
                  <KeywordsView 
                    selectedTrend={selectedTrend}
                    selectedKeyword={selectedKeyword}
                    onSelect={(kw) => {
                      setSelectedKeyword(kw);
                      navigateTo('PRODUCTS');
                    }}
                    onNavigate={navigateTo}
                  />
                )}
                {activeStage === 'PRODUCTS' && (
                  <ProductsView 
                    selectedTrend={selectedTrend}
                    selectedKeyword={selectedKeyword}
                    selectedProduct={selectedProduct}
                    onSelect={(prod) => {
                      setSelectedProduct(prod);
                      navigateTo('CONTENT');
                    }}
                    onNavigate={navigateTo}
                  />
                )}
                {activeStage === 'CONTENT' && (
                  <ContentView 
                    selectedTrend={selectedTrend}
                    selectedKeyword={selectedKeyword}
                    selectedProduct={selectedProduct}
                    selectedArticle={selectedArticle}
                    onApprove={(article) => {
                      setSelectedArticle(article);
                      navigateTo('PUBLISH');
                    }}
                    onNavigate={navigateTo}
                  />
                )}
                {activeStage === 'PUBLISH' && (
                  <PublishView 
                    selectedArticle={selectedArticle}
                    onPublished={(article) => {
                      setSelectedArticle(article);
                      navigateTo('SOCIAL');
                    }}
                    onNavigate={navigateTo}
                  />
                )}
                {activeStage === 'SOCIAL' && (
                  <SocialView 
                    selectedArticle={selectedArticle}
                    onNavigate={navigateTo}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
