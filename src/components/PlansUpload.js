'use client';

import { FileText, Upload, Zap, Crown, Lock } from 'lucide-react';

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
  // Tier props
  userTier = 'free',
  tierLimits = {},
  tierUsage = {},
  canAnalyzePlan = false
}) {
  const planPdfsAllowed = tierLimits?.planPdfsPerQuote || 0;
  const imagesAllowed = tierLimits?.imagesPerQuote || 0;
  const planAnalysesUsed = tierUsage?.planAnalyses || 0;
  const isProfessional = userTier === 'professional';
  const isBlocked = !canAnalyzePlan;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-2">Plan Reader</h2>
          <p className="text-gray-600 mb-4">
            {isProfessional
              ? 'Upload building plans (PDF or image). AI will analyze dimensions and generate a materials list.'
              : 'Plan analysis is a Professional feature. Upgrade to analyze building plans with AI.'}
          </p>
        </div>

        {/* Tier Badge */}
        <div className="bg-white rounded-xl shadow-sm p-4 min-w-[200px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {isProfessional ? (
                <span className="flex items-center gap-1 text-amber-600">
                  <Crown size={14} /> Professional
                </span>
              ) : (
                <span className="flex items-center gap-1 text-gray-500">
                  <Lock size={14} /> {tierLimits?.name || 'Free'}
                </span>
              )}
            </span>
          </div>
          {isProfessional ? (
            <>
              <p className="text-sm text-gray-600">
                {planPdfsAllowed} PDFs per quote • {imagesAllowed} images per quote
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {planAnalysesUsed} plan analyses this month
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                Plan analysis not available on {tierLimits?.name || 'Free'} tier
              </p>
              <button className="w-full text-xs px-3 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition flex items-center justify-center gap-1">
                <Zap size={12} /> Upgrade to Professional ($79/mo)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload area */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className={`p-8 border-2 border-dashed text-center ${
          isBlocked ? 'border-gray-200 bg-gray-50' : 'border-emerald-300 bg-emerald-50'
        }`}>
          {isBlocked ? (
            // Blocked - not professional tier
            <div>
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={28} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Professional Feature</h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                Plan analysis uses AI to read building plans and automatically generate material estimates.
                This feature is available on the Professional plan.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-sm mx-auto">
                <p className="font-semibold text-amber-800 mb-2">Professional - $79/month</p>
                <ul className="text-sm text-amber-700 text-left space-y-1">
                  <li>• 25 AI quotes per month</li>
                  <li>• 3 PDF plans per quote</li>
                  <li>• 10 images per quote</li>
                  <li>• Full branding & Xero export</li>
                </ul>
                <button className="mt-3 w-full px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition">
                  Upgrade Now
                </button>
              </div>
            </div>
          ) : !planPreview ? (
            <div>
              <div className="text-4xl mb-3">📐</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload your building plan</h3>
              <p className="text-gray-600 mb-2">PNG, JPG, or PDF format</p>
              <p className="text-sm text-emerald-600 mb-4">
                Up to {planPdfsAllowed} PDFs or {imagesAllowed} images per quote
              </p>
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
                  disabled={planAnalyzing}
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
