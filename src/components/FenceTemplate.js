'use client';

import { useState } from 'react';
import { Ruler, AlertTriangle, Zap } from 'lucide-react';

export default function FenceTemplate({ onGeneratePrompt }) {
  const [formData, setFormData] = useState({
    length: 12,
    height: 1.8,
    style: 'paling',
    postSize: '100x100',
    postSpacing: 2.4,
    postTreatment: 'H4',
    railSize: '100x50',
    rails: 3,
    palingSize: '150x19',
    palingGap: 0,
    capRail: true,
    gates: 1,
    gateWidth: 1.0,
    retaining: false,
    retainingHeight: 0,
    stain: false,
  });

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const postCount = Math.ceil(formData.length / formData.postSpacing) + 1;
  const palingWidth = parseInt(formData.palingSize.split('x')[0]) / 1000;
  const palingCount = formData.style === 'paling' ? Math.ceil(formData.length / (palingWidth + formData.palingGap / 1000)) : 0;

  const generatePrompt = () => {
    let prompt = `Estimate materials for a ${formData.length}m x ${formData.height}m timber fence`;

    prompt += `:\n\nSTRUCTURE:\n`;
    prompt += `- Posts: ${formData.postSize}mm ${formData.postTreatment} SG8 at ${formData.postSpacing}m centres (~${postCount} posts)\n`;
    prompt += `- Post depth: 600mm minimum in ground (concrete footings)\n`;
    prompt += `- Rails: ${formData.railSize}mm H3.2 SG8 x ${formData.rails} rails\n`;

    if (formData.style === 'paling') {
      prompt += `- Palings: ${formData.palingSize}mm H3.2 at ${formData.palingGap}mm gap (~${palingCount} palings)\n`;
    } else if (formData.style === 'vertical-slat') {
      prompt += `- Vertical slats: 65x19mm H3.2 at even spacing\n`;
    } else if (formData.style === 'horizontal') {
      prompt += `- Horizontal boards: 150x25mm H3.2 with 10mm gaps\n`;
    }

    if (formData.capRail) {
      prompt += `- Cap rail: 150x50mm H3.2 on top\n`;
    }

    prompt += `\nFIXINGS:\n`;
    prompt += `- Galvanised nails or stainless steel screws for palings/boards\n`;
    prompt += `- Coach screws or bolts for rails to posts\n`;
    prompt += `- Concrete mix for post footings (~${postCount} holes)\n`;

    if (formData.gates > 0) {
      prompt += `\nGATES:\n`;
      prompt += `- ${formData.gates} x gate(s) at ${formData.gateWidth}m wide\n`;
      prompt += `- Gate frame: 100x50mm H3.2\n`;
      prompt += `- Gate hinges and latch hardware\n`;
    }

    if (formData.retaining && formData.retainingHeight > 0) {
      prompt += `\nRETAINING:\n`;
      prompt += `- ${formData.retainingHeight}mm retaining below fence line\n`;
      prompt += `- Posts must be H5 treated where in contact with retained soil\n`;
      prompt += `- Drainage gravel and agricultural pipe behind retaining\n`;
    }

    if (formData.stain) {
      const fenceArea = formData.length * formData.height;
      prompt += `\nFINISH:\n`;
      prompt += `- Fence stain/paint for ~${(fenceArea * 2).toFixed(0)}m\u00B2 (both sides)\n`;
    }

    prompt += `\nCOMPLIANCE:\n`;
    if (formData.height > 2.0) {
      prompt += `- Fence over 2m may require building consent\n`;
    }
    if (formData.retaining && formData.retainingHeight > 1500) {
      prompt += `- Retaining over 1.5m requires engineering and building consent\n`;
    }
    prompt += `- Boundary fences: check Fencing Act obligations with neighbour\n`;

    prompt += `\nCalculate lineal metres for all timber, quantities for fixings, concrete bags, and stain if applicable.`;

    onGeneratePrompt(prompt);
  };

  const inputClass = "border border-gray-200 bg-white/70 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent";
  const labelClass = "text-xs text-gray-600 mb-1 block";

  return (
    <div className="space-y-4">
      {/* Dimensions */}
      <div className="border-b border-gray-100 pb-4">
        <h3 className="font-medium text-gray-600 mb-3 flex items-center gap-2 text-sm">
          <Ruler size={16} className="text-gray-400" />
          Fence Dimensions
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Length (m)</label>
            <input type="number" value={formData.length} onChange={(e) => update('length', parseFloat(e.target.value) || 0)} min="1" step="1" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Height (m)</label>
            <select value={formData.height} onChange={(e) => update('height', parseFloat(e.target.value))} className={inputClass}>
              <option value={1.2}>1.2m</option>
              <option value={1.5}>1.5m</option>
              <option value={1.8}>1.8m</option>
              <option value={2.0}>2.0m</option>
              <option value={2.4}>2.4m</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Style</label>
            <select value={formData.style} onChange={(e) => update('style', e.target.value)} className={inputClass}>
              <option value="paling">Paling</option>
              <option value="vertical-slat">Vertical slat</option>
              <option value="horizontal">Horizontal board</option>
            </select>
          </div>
        </div>
        {formData.height > 2.0 && (
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <AlertTriangle size={12} /> Over 2m - consent may be required
          </p>
        )}
      </div>

      {/* Posts & Rails */}
      <div className="border-b border-gray-100 pb-4">
        <h3 className="font-medium text-gray-600 mb-3 flex items-center gap-2 text-sm">
          <Ruler size={16} className="text-gray-400" />
          Posts & Rails
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Post Size</label>
            <select value={formData.postSize} onChange={(e) => update('postSize', e.target.value)} className={inputClass}>
              <option value="75x75">75x75mm</option>
              <option value="100x100">100x100mm</option>
              <option value="125x125">125x125mm</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Post Spacing</label>
            <select value={formData.postSpacing} onChange={(e) => update('postSpacing', parseFloat(e.target.value))} className={inputClass}>
              <option value={1.8}>1.8m</option>
              <option value={2.1}>2.1m</option>
              <option value={2.4}>2.4m</option>
              <option value={2.7}>2.7m</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Rails</label>
            <select value={formData.rails} onChange={(e) => update('rails', parseInt(e.target.value))} className={inputClass}>
              <option value={2}>2 rails</option>
              <option value={3}>3 rails</option>
            </select>
          </div>
        </div>
        <div className="flex gap-4 mt-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={formData.capRail} onChange={(e) => update('capRail', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
            <span className="text-gray-700">Cap rail</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={formData.stain} onChange={(e) => update('stain', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
            <span className="text-gray-700">Stain/paint</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          ~{postCount} posts | {formData.style === 'paling' ? `~${palingCount} palings` : ''}
        </p>
      </div>

      {/* Gates & Extras */}
      <div className="border-b border-gray-100 pb-4">
        <h3 className="font-medium text-gray-600 mb-3 flex items-center gap-2 text-sm">
          <Ruler size={16} className="text-gray-400" />
          Gates & Extras
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Gates</label>
            <select value={formData.gates} onChange={(e) => update('gates', parseInt(e.target.value))} className={inputClass}>
              <option value={0}>None</option>
              <option value={1}>1 gate</option>
              <option value={2}>2 gates</option>
            </select>
          </div>
          {formData.gates > 0 && (
            <div>
              <label className={labelClass}>Gate Width</label>
              <select value={formData.gateWidth} onChange={(e) => update('gateWidth', parseFloat(e.target.value))} className={inputClass}>
                <option value={0.9}>900mm (pedestrian)</option>
                <option value={1.0}>1.0m (standard)</option>
                <option value={1.2}>1.2m (wide)</option>
                <option value={3.0}>3.0m (double/vehicle)</option>
              </select>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={formData.retaining} onChange={(e) => update('retaining', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
            <span className="text-gray-700">Retaining below fence</span>
          </label>
          {formData.retaining && (
            <div className="flex items-center gap-2">
              <input type="number" value={formData.retainingHeight} onChange={(e) => update('retainingHeight', parseInt(e.target.value) || 0)} min="0" step="100" placeholder="mm" className="w-20 border border-gray-200 bg-white/70 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              <span className="text-xs text-gray-500">mm high</span>
            </div>
          )}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generatePrompt}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600/90 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-600 transition-colors"
      >
        <Zap size={18} />
        Generate Estimate
      </button>
    </div>
  );
}
