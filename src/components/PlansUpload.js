'use client';

import { FileText, Upload, Zap, Crown } from 'lucide-react';

export default function PlansUpload({
  planFile,
  planPreview,
  planAnalyzing,
  chatHistory,
  cart,
  labourItems,
  onHandlePlanUpload,
  onAnalyzePlan,
  onNavigateToQuote,
  onClearPlan,
  // Usage tracking props
  planUsage,
  userTier,
  planLimit,
  pagesRemaining
}) {
  const usagePercent = planLimit > 0 ? (planUsage?.pages || 0) / planLimit * 100 : 0;
  const isAtLimit = pagesRemaining <= 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-2">Plan Reader</h2>
          <p className="text-gray-600 mb-4">
            Upload building plans (PDF or image). AI will analyze dimensions and generate a materials list.
          </p>
        </div>

        {/* Usage Meter */}
        <div className="bg-white rounded-xl shadow-sm p-4 min-w-[200px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {userTier === 'pro' ? (
                <span className="flex items-center gap-1 text-amber-600">
                  <Crown size={14} /> Pro
                </span>
              ) : (
                'Basic'
              )}
            </span>
            <span className="text-sm text-gray-500">
              {planUsage?.pages || 0} / {planLimit} pages
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {pagesRemaining} pages remaining this month
          </p>
          {userTier === 'basic' && (
            <button className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
              <Zap size={12} /> Upgrade to Pro (30 pages)
            </button>
          )}
        </div>
      </div>

      {/* Upload area */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-8 border-2 border-dashed border-emerald-300 bg-emerald-50 text-center">
          {!planPreview ? (
            <div>
              <div className="text-4xl mb-3">📐</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload your building plan</h3>
              <p className="text-gray-600 mb-2">PNG, JPG, or PDF format</p>
              <p className="text-sm text-amber-600 mb-4">
                PDF limit: {userTier === 'pro' ? '30' : '10'} pages max
              </p>
              {isAtLimit ? (
                <div className="text-red-600 font-medium">
                  Monthly limit reached. {userTier === 'basic' ? 'Upgrade to Pro for more pages.' : 'Resets next month.'}
                </div>
              ) : (
                <label className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer font-medium">
                  <Upload size={18} className="inline mr-2" />
                  Choose File
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={onHandlePlanUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-4">
                {typeof planPreview === 'string' && planPreview.startsWith('PDF') ? (
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <FileText size={48} className="mx-auto mb-2 text-red-500" />
                    <p className="font-semibold text-gray-700">{planPreview}</p>
                  </div>
                ) : (
                  <img
                    src={planPreview}
                    alt="Plan preview"
                    className="max-w-md h-auto mx-auto rounded-lg shadow"
                  />
                )}
              </div>
              <div className="flex gap-3 justify-center">
                <label className="px-4 py-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  Choose Different File
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={onHandlePlanUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={onAnalyzePlan}
                  disabled={planAnalyzing || isAtLimit}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {planAnalyzing ? (
                    <>
                      <span className="animate-spin">⏳</span> Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap size={18} /> Analyze Plan
                    </>
                  )}
                </button>
              </div>
              {isAtLimit && (
                <p className="mt-3 text-red-600 text-sm">
                  Monthly limit reached. {userTier === 'basic' ? 'Upgrade to Pro for more pages.' : 'Resets next month.'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results appear in AI chat */}
      {chatHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-bold text-lg mb-4">Analysis Results</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`p-3 rounded-lg ${
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
            ))}
          </div>
        </div>
      )}

      {/* Cart updated notification */}
      {(cart.length > 0 || labourItems.length > 0) && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-emerald-800">
            ✅ {cart.length} materials and {labourItems.length} labour items added to your quote.
            <button
              onClick={onNavigateToQuote}
              className="ml-2 font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View Quote →
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
