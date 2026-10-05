import React, { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Menu, Sparkles, User, ArrowRight, Shield } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PracticeProvider } from './contexts/PracticeContext';
import { Hero } from './components/landing/Hero';
import { WhyItWorks } from './components/landing/WhyItWorks';
import { UseCases } from './components/landing/UseCases';
import { Languages } from './components/landing/Languages';
import { News } from './components/landing/News';
import { RightNavMenu } from './components/landing/RightNavMenu';
import { LoginModal } from './components/landing/LoginModal';
import { PracticeHeader } from './components/practice/PracticeHeader';
import { ConversationArea } from './components/practice/ConversationArea';
import { InputBar } from './components/practice/InputBar';
import { HistoryDrawer } from './components/practice/HistoryDrawer';
import { Button } from './components/common/Button';
import { Loader } from './components/common/Loader';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '1083809691452-uncr1hsesdq94s7sns2mds87co1amuhp.apps.googleusercontent.com';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, loginModalOpen, setLoginModalOpen, user } = useAuth();
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<'landing' | 'practice'>('landing');

  // Handle Start Speaking Now CTA click
  const handleStartSpeaking = () => {
    if (isAuthenticated) {
      // Returning authenticated user goes straight to Practice without seeing login!
      setActiveView('practice');
    } else {
      // Unauthenticated user opens Google login modal
      setLoginModalOpen(true);
    }
  };

  // If user successfully logs in, immediately open practice
  const handleLoginSuccess = () => {
    setActiveView('practice');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader size="lg" label="Checking Ease English session..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* PRACTICE EXPERIENCE VIEW */}
      {activeView === 'practice' && isAuthenticated ? (
        <PracticeProvider>
          <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
            <PracticeHeader onExitToLanding={() => setActiveView('landing')} />
            <ConversationArea />
            <InputBar />
            <HistoryDrawer />
          </div>
        </PracticeProvider>
      ) : (
        /* ENTERPRISE LANDING PAGE VIEW */
        <div className="flex-1 flex flex-col">
          {/* Top Landing Navigation Bar */}
          <header className="h-20 border-b border-slate-900 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <span className="font-extrabold text-white text-xl tracking-tight block">
                  Ease English
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">
                  AI Conversation Coach
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
              <a href="#why-it-works" className="hover:text-emerald-400 transition">
                Why It Works
              </a>
              <a href="#use-cases" className="hover:text-emerald-400 transition">
                Use Cases
              </a>
              <a href="#languages" className="hover:text-emerald-400 transition">
                Languages
              </a>
              <a href="#news" className="hover:text-emerald-400 transition">
                News
              </a>
            </nav>

            {/* Top Right Actions */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    Welcome back, <strong className="text-slate-200">{user?.name}</strong>
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveView('practice')}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5 text-slate-950" />}
                  >
                    Open Practice
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLoginModalOpen(true)}
                  leftIcon={<User className="w-4 h-4 text-emerald-400" />}
                >
                  Sign In
                </Button>
              )}

              {/* Right Menu Drawer Toggle */}
              <button
                onClick={() => setIsNavMenuOpen(true)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 border border-slate-800 transition"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Main Landing Page Content */}
          <main className="flex-1">
            <Hero
              onStartSpeaking={handleStartSpeaking}
              isAuthenticated={isAuthenticated}
            />
            <WhyItWorks />
            <UseCases />
            <Languages />
            <News />
          </main>

          {/* Right Navigation Menu Drawer */}
          <RightNavMenu
            isOpen={isNavMenuOpen}
            onClose={() => setIsNavMenuOpen(false)}
            onStartSpeaking={handleStartSpeaking}
            isAuthenticated={isAuthenticated}
          />

          {/* Google Login Modal */}
          <LoginModal
            isOpen={loginModalOpen}
            onClose={() => setLoginModalOpen(false)}
            onSuccess={handleLoginSuccess}
          />

          {/* Footer */}
          <footer className="border-t border-slate-900 bg-slate-950 py-12 px-4 sm:px-8 text-xs text-slate-400">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>© 2026 Ease English — Production-Quality AI English Conversation Platform</span>
              </div>
              <div className="flex items-center gap-6">
                <span>Fast Path + Fallback Engine</span>
                <span>Contextual Mistake Correction</span>
                <span>Google OAuth Secured</span>
              </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
