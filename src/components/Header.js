'use client';

import { Package, MessageSquare, Menu, X, FileText, Sparkles } from 'lucide-react';

export default function Header({ page, setPage, currentProjectName, cart, showAI, setShowAI, mobileMenuOpen, setMobileMenuOpen }) {
  // AI toggle only available on Quote page
  const canShowAI = page === 'quote';

  return (
    <header className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Package size={24} />
            Priced In
          </h1>
          {currentProjectName && (
            <p className="text-sm text-white/70 mt-0.5 max-w-[200px] truncate">{currentProjectName}</p>
          )}
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-1 items-center">
          <button
            onClick={() => setPage('projects')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-150 ${page === 'projects' ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            Projects
          </button>
          <button
            onClick={() => setPage('quote')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-150 ${page === 'quote' ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            Quote {cart.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">{cart.length}</span>}
          </button>
          <button
            onClick={() => setPage('materials')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-150 ${page === 'materials' ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            Materials
          </button>
          <button
            onClick={() => setPage('plans')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-150 flex items-center gap-2 ${page === 'plans' ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            <FileText size={18} /> Plans
          </button>
          {/* AI toggle - only on Quote page */}
          {canShowAI && (
            <button
              onClick={() => setShowAI(!showAI)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-150 flex items-center gap-2 ${showAI ? 'bg-purple-500/80' : 'hover:bg-white/10'}`}
            >
              <Sparkles size={18} /> AI
            </button>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors duration-150"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <nav className="md:hidden mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
          <button
            onClick={() => { setPage('projects'); setMobileMenuOpen(false); }}
            className={`px-4 py-3 rounded-lg text-left font-medium transition-colors duration-150 ${page === 'projects' ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            Projects
          </button>
          <button
            onClick={() => { setPage('quote'); setMobileMenuOpen(false); }}
            className={`px-4 py-3 rounded-lg text-left font-medium transition-colors duration-150 flex items-center justify-between ${page === 'quote' ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            Quote
            {cart.length > 0 && <span className="px-2 py-0.5 bg-white/20 rounded text-sm">{cart.length}</span>}
          </button>
          <button
            onClick={() => { setPage('materials'); setMobileMenuOpen(false); }}
            className={`px-4 py-3 rounded-lg text-left font-medium transition-colors duration-150 ${page === 'materials' ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            Materials
          </button>
          <button
            onClick={() => { setPage('plans'); setMobileMenuOpen(false); }}
            className={`px-4 py-3 rounded-lg text-left font-medium transition-colors duration-150 flex items-center gap-2 ${page === 'plans' ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            <FileText size={20} /> Plan Reader
          </button>
          {/* AI toggle - only on Quote page */}
          {canShowAI && (
            <button
              onClick={() => { setShowAI(!showAI); setMobileMenuOpen(false); }}
              className={`px-4 py-3 rounded-lg text-left font-medium transition-colors duration-150 flex items-center gap-2 ${showAI ? 'bg-purple-500/80' : 'hover:bg-white/10'}`}
            >
              <Sparkles size={20} /> AI Assistant
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
