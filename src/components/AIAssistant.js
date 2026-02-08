'use client';

import { useState, lazy, Suspense } from 'react';
import { MessageSquare, Send, Plus, CheckCircle, AlertTriangle, Search, Zap, Lock, ChevronLeft, FileText, Clock } from 'lucide-react';

const DeckTemplate = lazy(() => import('./DeckTemplate'));
const BathroomTemplate = lazy(() => import('./BathroomTemplate'));
const FenceTemplate = lazy(() => import('./FenceTemplate'));
const PergolaTemplate = lazy(() => import('./PergolaTemplate'));

export default function AIAssistant({
  showAI,
  chatInput,
  setChatInput,
  chatHistory,
  aiLoading,
  onSendMessage,
  onAddMaterialsToQuote,
  onAddLabourToQuote,
  onSearchMaterial,
  // Tier props
  userTier = 'free',
  tierUsage = { aiQuotes: 0 },
  tierLimits = { aiQuotesPerMonth: 0, name: 'Free' },
  canUseAI = false,
  trialDaysLeft = 0,
  startCheckout
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const aiQuotesUsed = tierUsage?.aiQuotes || 0;
  const aiQuotesLimit = tierLimits?.aiQuotesPerMonth || 0;
  const usagePercent = aiQuotesLimit > 0 ? (aiQuotesUsed / aiQuotesLimit) * 100 : 100;
  const isFreeUser = userTier === 'free';
  const isTrialUser = userTier === 'trial';
  const hasAIAccess = isTrialUser || userTier === 'professional';
  const isAtLimit = !canUseAI;

  // Follow-up tracking
  const userMessageCount = chatHistory.filter(m => m.role === 'user').length;
  const followUpsUsed = Math.max(0, userMessageCount - 1);
  const followUpLimit = tierLimits?.aiFollowUpsPerQuote ?? Infinity;
  const followUpsRemaining = followUpLimit === Infinity ? null : Math.max(0, followUpLimit - followUpsUsed);
  const isAtFollowUpLimit = followUpLimit !== Infinity && followUpsUsed >= followUpLimit && userMessageCount > 0;

  const isBlocked = isAtLimit || isAtFollowUpLimit;

  return (
    <div className="bg-white rounded-xl shadow-lg mb-4 overflow-hidden animate-slideIn">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-bold flex items-center gap-2">
              <MessageSquare size={20} />
              AI Assistant
              {isFreeUser && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Free</span>
              )}
              {isTrialUser && (
                <span className="text-xs bg-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock size={10} />
                  Trial - {trialDaysLeft}d left
                </span>
              )}
            </h2>
            <p className="text-sm text-white/80">
              {isFreeUser
                ? 'Your trial has ended - upgrade to continue using AI'
                : 'Describe your project and I\'ll help you estimate'}
            </p>
          </div>

          {/* Usage Meter */}
          {hasAIAccess && (
            <div className="text-right min-w-[120px]">
              <p className="text-xs text-white/80 mb-1">
                {aiQuotesUsed} / {aiQuotesLimit} AI quotes
              </p>
              <div className="w-full bg-white/20 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    usagePercent >= 90 ? 'bg-red-400' : usagePercent >= 70 ? 'bg-amber-400' : 'bg-white'
                  }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              {/* Follow-up counter (only show during active session) */}
              {followUpsRemaining !== null && userMessageCount > 0 && (
                <p className="text-xs text-white/60 mt-1">
                  {followUpsRemaining} follow-up{followUpsRemaining !== 1 ? 's' : ''} left
                </p>
              )}
            </div>
          )}
        </div>

        {/* Templates & quick prompts */}
        {hasAIAccess && (
          <div className="mt-3 flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedTemplate(selectedTemplate === 'deck' ? null : 'deck')}
              className={`text-xs px-2.5 py-1.5 rounded border transition ${
                selectedTemplate === 'deck'
                  ? 'bg-white text-purple-700 border-white font-medium'
                  : 'bg-white/20 hover:bg-white/30 border-white/20'
              }`}
            >
              <FileText size={12} className="inline mr-1" />
              Deck
            </button>
            <button
              onClick={() => setSelectedTemplate(selectedTemplate === 'bathroom' ? null : 'bathroom')}
              className={`text-xs px-2.5 py-1.5 rounded border transition ${
                selectedTemplate === 'bathroom'
                  ? 'bg-white text-purple-700 border-white font-medium'
                  : 'bg-white/20 hover:bg-white/30 border-white/20'
              }`}
            >
              Bathroom
            </button>
            <button
              onClick={() => setSelectedTemplate(selectedTemplate === 'fence' ? null : 'fence')}
              className={`text-xs px-2.5 py-1.5 rounded border transition ${
                selectedTemplate === 'fence'
                  ? 'bg-white text-purple-700 border-white font-medium'
                  : 'bg-white/20 hover:bg-white/30 border-white/20'
              }`}
            >
              Fence
            </button>
            <button
              onClick={() => setSelectedTemplate(selectedTemplate === 'pergola' ? null : 'pergola')}
              className={`text-xs px-2.5 py-1.5 rounded border transition ${
                selectedTemplate === 'pergola'
                  ? 'bg-white text-purple-700 border-white font-medium'
                  : 'bg-white/20 hover:bg-white/30 border-white/20'
              }`}
            >
              Pergola
            </button>
          </div>
        )}

        {/* Upgrade prompt for free users (trial expired) */}
        {isFreeUser && chatHistory.length === 0 && (
          <div className="mt-3 bg-white/10 rounded-lg p-3">
            <p className="text-sm mb-2">
              <Lock size={14} className="inline mr-1" />
              Your free trial has ended. Upgrade to keep using AI quotes.
            </p>
            <div className="flex gap-2 text-xs">
              <button
                onClick={startCheckout}
                className="px-3 py-1.5 bg-amber-400 text-amber-900 rounded font-medium hover:bg-amber-300 transition"
              >
                Professional - $79/mo
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="h-64 sm:h-96 overflow-y-auto p-3 sm:p-4 space-y-3">
        {/* Deck Template Panel */}
        {selectedTemplate === 'deck' && hasAIAccess && (
          <div className="bg-gray-50/60 border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-600 text-xs flex items-center gap-2 uppercase tracking-wide">
                <FileText size={14} className="text-gray-400" />
                Deck Guide
              </h3>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ChevronLeft size={14} /> Back
              </button>
            </div>
            <Suspense fallback={<div className="py-8 text-center text-gray-500 text-sm">Loading template...</div>}>
              <DeckTemplate
                onGeneratePrompt={(prompt) => {
                  setChatInput(prompt);
                  setSelectedTemplate(null);
                }}
              />
            </Suspense>
          </div>
        )}

        {/* Bathroom Template Panel */}
        {selectedTemplate === 'bathroom' && hasAIAccess && (
          <div className="bg-gray-50/60 border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-600 text-xs flex items-center gap-2 uppercase tracking-wide">
                <FileText size={14} className="text-gray-400" />
                Bathroom Guide
              </h3>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ChevronLeft size={14} /> Back
              </button>
            </div>
            <Suspense fallback={<div className="py-8 text-center text-gray-500 text-sm">Loading template...</div>}>
              <BathroomTemplate
                onGeneratePrompt={(prompt) => {
                  setChatInput(prompt);
                  setSelectedTemplate(null);
                }}
              />
            </Suspense>
          </div>
        )}

        {/* Fence Template Panel */}
        {selectedTemplate === 'fence' && hasAIAccess && (
          <div className="bg-gray-50/60 border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-600 text-xs flex items-center gap-2 uppercase tracking-wide">
                <FileText size={14} className="text-gray-400" />
                Fence Guide
              </h3>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ChevronLeft size={14} /> Back
              </button>
            </div>
            <Suspense fallback={<div className="py-8 text-center text-gray-500 text-sm">Loading template...</div>}>
              <FenceTemplate
                onGeneratePrompt={(prompt) => {
                  setChatInput(prompt);
                  setSelectedTemplate(null);
                }}
              />
            </Suspense>
          </div>
        )}

        {/* Pergola Template Panel */}
        {selectedTemplate === 'pergola' && hasAIAccess && (
          <div className="bg-gray-50/60 border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-600 text-xs flex items-center gap-2 uppercase tracking-wide">
                <FileText size={14} className="text-gray-400" />
                Pergola Guide
              </h3>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ChevronLeft size={14} /> Back
              </button>
            </div>
            <Suspense fallback={<div className="py-8 text-center text-gray-500 text-sm">Loading template...</div>}>
              <PergolaTemplate
                onGeneratePrompt={(prompt) => {
                  setChatInput(prompt);
                  setSelectedTemplate(null);
                }}
              />
            </Suspense>
          </div>
        )}

        {chatHistory.length === 0 && hasAIAccess && !selectedTemplate && (
          <p className="text-gray-500 text-center py-8">
            Try: &quot;I need to build a 4m x 3m deck&quot; or &quot;Materials for a bathroom renovation&quot;
          </p>
        )}
        {chatHistory.length === 0 && isFreeUser && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={28} className="text-purple-500" />
            </div>
            <p className="text-gray-700 font-medium mb-2">Your trial has ended</p>
            <p className="text-gray-500 text-sm mb-4">
              Upgrade to Professional to get AI material estimates, labour calculations, and NZ Building Code compliance checks.
            </p>
            <p className="text-sm text-gray-400">
              You can still browse 13,500+ materials and create manual quotes on the Free plan.
            </p>
          </div>
        )}
        {chatHistory.map((msg, idx) => (
          <div key={idx}>
            {/* Warning message for unmatched materials */}
            {msg.type === 'warning' && msg.unmatched ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 mr-2 sm:mr-8 animate-fadeIn">
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
                              x{item.qty}
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
                  ? 'bg-emerald-100 ml-4 sm:ml-8'
                  : msg.type === 'error'
                  ? 'bg-red-100 mr-4 sm:mr-8'
                  : 'bg-gray-100 mr-4 sm:mr-8'
              }`}>
                <div className="text-sm whitespace-pre-wrap">
                  {(typeof msg.content === 'string' ? msg.content : String(msg.content || '')).split(/(\*\*[^*]+\*\*)/).map((part, i) => {
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
              <div className="mt-2 mr-2 sm:mr-8 flex gap-2 justify-end">
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
              <div className="mt-2 mr-2 sm:mr-8 flex justify-end">
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-medium">
                  <CheckCircle size={18} /> Added to Quote!
                </div>
              </div>
            )}
          </div>
        ))}
        {aiLoading && (
          <div className="bg-gray-100 p-3 rounded-lg mr-8 animate-pulse">
            <p className="text-gray-500">Thinking...</p>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4 border-t">
        {/* Show upgrade prompt when at quota limit */}
        {isAtLimit && hasAIAccess && (
          <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
            <p className="text-sm text-amber-800">
              <AlertTriangle size={14} className="inline mr-1" />
              {isTrialUser
                ? `You've used all ${aiQuotesLimit} trial AI quotes.`
                : `You've used all your AI quotes for this month.`}
            </p>
            <button
              onClick={startCheckout}
              className="text-xs px-3 py-1 bg-amber-600 text-white rounded font-medium hover:bg-amber-700 transition"
            >
              Upgrade
            </button>
          </div>
        )}

        {/* Show follow-up limit reached */}
        {isAtFollowUpLimit && !isAtLimit && (
          <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
            <p className="text-sm text-blue-800">
              <AlertTriangle size={14} className="inline mr-1" />
              Follow-up limit reached for this session. Start a new project for another quote.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !aiLoading && !isBlocked && chatInput.trim() && onSendMessage()}
            placeholder={isBlocked ? 'Limit reached - start new project or upgrade' : 'Describe your project...'}
            className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
              isBlocked ? 'bg-gray-100 text-gray-400' : ''
            }`}
            disabled={aiLoading || isBlocked}
          />
          <button
            onClick={onSendMessage}
            disabled={aiLoading || !chatInput.trim() || isBlocked}
            className={`px-4 py-2 rounded-lg transition active:scale-95 ${
              isBlocked
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isBlocked ? <Lock size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
