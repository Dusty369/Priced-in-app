'use client';

import { Settings } from 'lucide-react';
import { LABOUR_ROLES, DEFAULT_LABOUR_RATES } from '../lib/constants';

export default function LabourSettingsDialog({ 
  isOpen, 
  onClose, 
  labourRates, 
  setLabourRates 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Settings size={24} className="text-emerald-600" />
          Labour Rates (NZ Auckland)
        </h2>
        <p className="text-sm text-gray-600 mb-6">Customize hourly rates for each trade</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {Object.entries(LABOUR_ROLES).map(([key, config]) => (
            <div key={key} className="border rounded-lg p-4 hover:bg-gray-50 transition">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                {config.label}
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  ${config.min}
                </span>
                <input
                  type="range"
                  min={config.min}
                  max={config.max}
                  value={labourRates[key] || DEFAULT_LABOUR_RATES[key]}
                  onChange={(e) => setLabourRates({...labourRates, [key]: Number(e.target.value)})}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${((labourRates[key] || DEFAULT_LABOUR_RATES[key]) - config.min) / (config.max - config.min) * 100}%, #e5e7eb ${((labourRates[key] || DEFAULT_LABOUR_RATES[key]) - config.min) / (config.max - config.min) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="w-16">
                  <input
                    type="number"
                    value={labourRates[key] || DEFAULT_LABOUR_RATES[key]}
                    onChange={(e) => setLabourRates({...labourRates, [key]: Number(e.target.value)})}
                    min={config.min}
                    max={config.max}
                    className="w-full px-2 py-1 border rounded text-sm font-bold text-emerald-600 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  ${config.max}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setLabourRates(DEFAULT_LABOUR_RATES)}
            className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50 font-medium"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
