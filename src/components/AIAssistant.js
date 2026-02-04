'use client';

import { MessageSquare, Send, Plus, CheckCircle, AlertTriangle, Search } from 'lucide-react';

export default function AIAssistant({
  showAI,
  chatInput,
  setChatInput,
  chatHistory,
  aiLoading,
  onSendMessage,
  onAddMaterialsToQuote,
  onAddLabourToQuote,
  onSearchMaterial
}) {
  if (!showAI) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg mb-4 overflow-hidden animate-slideIn">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
        <h2 className="font-bold flex items-center gap-2">
          <MessageSquare size={20} />
          AI Assistant
        </h2>
        <p className="text-sm text-white/80">Describe your project and I'll help you estimate</p>
        
        {chatHistory.length === 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            <button
              onClick={() => setChatInput('I need to build a 4m x 3m deck with steps')}
              className="text-xs px-2.5 py-1.5 bg-white/20 hover:bg-white/30 rounded border border-white/20 transition"
            >
              🛠️ Deck
            </button>
            <button
              onClick={() => setChatInput('Bathroom renovation - 2m x 2m with shower')}
              className="text-xs px-2.5 py-1.5 bg-white/20 hover:bg-white/30 rounded border border-white/20 transition"
            >
              🚿 Bathroom
            </button>
            <button
              onClick={() => setChatInput('Build a 6m timber fence with 100x100mm posts')}
              className="text-xs px-2.5 py-1.5 bg-white/20 hover:bg-white/30 rounded border border-white/20 transition"
            >
              🏗️ Fence
            </button>
            <button
              onClick={() => setChatInput('Build a pergola 4m x 3m with timber frame')}
              className="text-xs px-2.5 py-1.5 bg-white/20 hover:bg-white/30 rounded border border-white/20 transition"
            >
              ☀️ Pergola
            </button>
          </div>
        )}
      </div>
      
      <div className="h-96 overflow-y-auto p-4 space-y-3">
        {chatHistory.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            👋 Try: "I need to build a 4m x 3m deck" or "Materials for a bathroom renovation"
          </p>
        )}
        {chatHistory.map((msg, idx) => (
          <div key={idx}>
            {/* Warning message for unmatched materials */}
            {msg.type === 'warning' && msg.unmatched ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mr-8 animate-fadeIn">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <p className="font-medium text-amber-800 mb-2">
                      {msg.unmatched.length} item{msg.unmatched.length > 1 ? 's' : ''} couldn&apos;t be matched
                      <span className="font-normal text-amber-600 ml-1">
                        ({msg.matched} of {msg.matched + msg.unmatched.length} added)
                      </span>
                    </p>
                    <div className="space-y-2 mb-3">
                      {msg.unmatched.map((item, i) => (
                        <div key={i} className="bg-white rounded border border-amber-100 p-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-amber-900 font-medium truncate" title={item.name}>
                                {item.name}
                              </p>
                              {item.suggestions && item.suggestions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <span className="text-xs text-amber-600">Try:</span>
                                  {item.suggestions.map((term, j) => (
                                    <button
                                      key={j}
                                      onClick={() => {
                                        navigator.clipboard.writeText(term);
                                        if (onSearchMaterial) onSearchMaterial(term);
                                      }}
                                      className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition cursor-pointer"
                                      title={`Search for "${term}"`}
                                    >
                                      {term}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className="text-sm text-amber-700 font-medium whitespace-nowrap">
                              ×{item.qty}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-amber-700 flex items-center gap-1">
                      <Search size={14} />
                      Click a term to search Materials
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Regular message (user/assistant/error) */
              <div className={`p-3 rounded-lg animate-fadeIn ${
                msg.role === 'user'
                  ? 'bg-emerald-100 ml-8'
                  : msg.type === 'error'
                  ? 'bg-red-100 mr-8'
                  : 'bg-gray-100 mr-8'
              }`}>
                <div className="text-sm whitespace-pre-wrap">
                  {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={i}>{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  })}
                </div>
              </div>
            )}

            {/* Add to Quote buttons if AI response has parsed data */}
            {msg.role === 'assistant' && msg.parsed && !msg.added && (
              <div className="mt-2 mr-8 flex gap-2 justify-end">
                <button
                  onClick={() => {
                    onAddMaterialsToQuote(msg.parsed.materials, idx);
                    onAddLabourToQuote(msg.parsed.labour, idx);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium shadow-sm"
                >
                  <Plus size={18} /> Add All to Quote
                </button>
              </div>
            )}

            {/* Show confirmation if added */}
            {msg.role === 'assistant' && msg.added && (
              <div className="mt-2 mr-8 flex justify-end">
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-medium">
                  <CheckCircle size={18} /> Added to Quote!
                </div>
              </div>
            )}
          </div>
        ))}
        {aiLoading && (
          <div className="bg-gray-100 p-3 rounded-lg mr-8 animate-pulse">
            <p className="text-gray-500">🤔 Thinking...</p>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !aiLoading && chatInput.trim() && onSendMessage()}
          placeholder="Describe your project..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          disabled={aiLoading}
        />
        <button
          onClick={onSendMessage}
          disabled={aiLoading || !chatInput.trim()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
