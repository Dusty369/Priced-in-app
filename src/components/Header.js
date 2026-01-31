'use client';

import { Package, MessageSquare, Menu, X } from 'lucide-react';

export default function Header({ page, setPage, currentProjectName, cart, showAI, setShowAI, mobileMenuOpen, setMobileMenuOpen }) {
  return (
    <header className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white p-4 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Package size={24} />
            Priced In
          </h1>
          {currentProjectName && (
            <p className="text-sm text-white/80 mt-0.5">{currentProjectName}</p>
          )}
        </div>
        
        {/* Desktop nav */}
        <nav className="hidden md:flex gap-2 items-center">
          <button 
            onClick={() => setPage('projects')}
            className={`px-4 py-2 rounded-lg transition ${page === 'projects' ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            Projects
          </button>
          <button 
            onClick={() => setPage('quote')}
            className={`px-4 py-2 rounded-lg transition ${page === 'quote' ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            Quote ({cart.length})
          </button>
          <button
            onClick={() => setShowAI(!showAI)}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${showAI ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            <MessageSquare size={20} /> AI Assistant
          </button>
        </nav>

        {/* Mobile menu button */}
        <button 
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <nav className="md:hidden mt-4 flex flex-col gap-2">
          <button 
            onClick={() => { setPage('projects'); setMobileMenuOpen(false); }}
            className="px-4 py-3 rounded-lg bg-white/10 text-left"
          >
            Projects
          </button>
          <button 
            onClick={() => { setPage('quote'); setMobileMenuOpen(false); }}
            className="px-4 py-3 rounded-lg bg-white/10 text-left"
          >
            Quote ({cart.length})
          </button>
          <button
            onClick={() => { setShowAI(!showAI); setMobileMenuOpen(false); }}
            className="px-4 py-3 rounded-lg bg-white/10 text-left flex items-center gap-2"
          >
            <MessageSquare size={20} /> AI Assistant
          </button>
        </nav>
      )}
    </header>
  );
}
