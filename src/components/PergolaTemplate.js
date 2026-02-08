'use client';

import { useState } from 'react';
import { Ruler, AlertTriangle, Zap } from 'lucide-react';

export default function PergolaTemplate({ onGeneratePrompt }) {
  const [formData, setFormData] = useState({
    length: 4,
    width: 3,
    height: 2.7,
    postSize: '125x125',
    postCount: 4,
    beamSize: '200x50',
    doubleBeam: true,
    rafterSize: '150x50',
    rafterSpacing: 600,
    roofType: 'open',
    roofMaterial: 'polycarbonate',
    attached: true,
    decking: false,
    deckingType: '32mm',
    lighting: false,
    stain: true,
    foundation: 'concrete-piles',
  });

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const area = formData.length * formData.width;
  const rafterCount = Math.ceil(formData.length / (formData.rafterSpacing / 1000)) + 1;

  const generatePrompt = () => {
    let prompt = `Estimate builder-supplied materials for a ${formData.length}m x ${formData.width}m pergola`;
    prompt += formData.attached ? ' (attached to house)' : ' (freestanding)';

    prompt += `:\n\nSTRUCTURE:\n`;
    prompt += `- Posts: ${formData.postSize}mm H4 SG8 x ${formData.postCount} at ${formData.height}m height\n`;
    prompt += `- Beams: ${formData.beamSize}mm H3.2 SG8`;
    if (formData.doubleBeam) prompt += ` (DOUBLED - bolted together)`;
    prompt += `\n`;
    prompt += `- Rafters: ${formData.rafterSize}mm H3.2 SG8 at ${formData.rafterSpacing}mm centres (~${rafterCount} rafters)\n`;

    if (formData.attached) {
      prompt += `- Ledger board: ${formData.beamSize}mm H3.2 bolted to house framing\n`;
      prompt += `- Flashing over ledger (Z-flashing or custom)\n`;
    }

    prompt += `\nFOUNDATION:\n`;
    if (formData.foundation === 'concrete-piles') {
      prompt += `- Concrete piles: ${formData.postCount} x 500mm dia x 600mm deep\n`;
      prompt += `- Post anchors: galvanised stirrup or bolt-down brackets\n`;
    } else {
      prompt += `- Posts set in concrete: ${formData.postCount} x 500mm dia holes, 600mm deep\n`;
    }

    if (formData.roofType !== 'open') {
      prompt += `\nROOFING:\n`;
      if (formData.roofType === 'covered') {
        prompt += `- ${formData.roofMaterial === 'polycarbonate' ? 'Polycarbonate sheets' : formData.roofMaterial === 'laserlite' ? 'Laserlite sheets' : 'Shade cloth'} for ${area.toFixed(1)}m\u00B2\n`;
        if (formData.roofMaterial !== 'shade-cloth') {
          prompt += `- Roofing screws with sealing washers\n`;
          prompt += `- Purlins if required for sheet fixing\n`;
        }
      }
    }

    prompt += `\nFIXINGS:\n`;
    prompt += `- M12 coach bolts for beam-to-post connections\n`;
    if (formData.doubleBeam) {
      prompt += `- M12 bolts for doubling beams\n`;
    }
    prompt += `- Joist hangers or skew nails for rafters\n`;
    if (formData.attached) {
      prompt += `- M12 x 150mm coach screws for ledger (into solid framing)\n`;
    }
    prompt += `- Concrete mix for ${formData.postCount} footings\n`;

    if (formData.decking) {
      prompt += `\nDECKING:\n`;
      prompt += `- ${formData.deckingType === '32mm' ? '32x140mm' : '25x140mm'} H3.2 decking for ${area.toFixed(1)}m\u00B2\n`;
      prompt += `- Joists: 140x45 H3.2 at 450mm centres\n`;
      prompt += `- Decking screws\n`;
    }

    if (formData.stain) {
      prompt += `\nFINISH:\n`;
      prompt += `- Timber stain/oil (2 coats for all exposed timber)\n`;
    }

    prompt += `\nCOMPLIANCE:\n`;
    if (area > 20) {
      prompt += `- Over 20m\u00B2 - building consent likely required\n`;
    }
    if (formData.attached) {
      prompt += `- Attached structure: ledger must be fixed to solid framing, not cladding\n`;
    }
    prompt += `- NZS 3604 for timber sizing and connections\n`;
    if (formData.height > 3.0) {
      prompt += `- Height over 3m may require specific engineering\n`;
    }

    prompt += `\nCalculate lineal metres for all timber, quantities for fixings, concrete bags, and finishing products.`;

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
          Pergola Dimensions
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Length (m)</label>
            <input type="number" value={formData.length} onChange={(e) => update('length', parseFloat(e.target.value) || 0)} min="1" step="0.5" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Width (m)</label>
            <input type="number" value={formData.width} onChange={(e) => update('width', parseFloat(e.target.value) || 0)} min="1" step="0.5" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Height (m)</label>
            <input type="number" value={formData.height} onChange={(e) => update('height', parseFloat(e.target.value) || 0)} min="2.1" step="0.1" className={inputClass} />
          </div>
        </div>
        <div className="flex gap-4 mt-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="radio" name="attachment" checked={formData.attached} onChange={() => update('attached', true)} className="text-emerald-600 focus:ring-emerald-500" />
            <span className="text-gray-700">Attached to house</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="radio" name="attachment" checked={!formData.attached} onChange={() => update('attached', false)} className="text-emerald-600 focus:ring-emerald-500" />
            <span className="text-gray-700">Freestanding</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Area: {area.toFixed(1)}m&sup2;
          {area > 20 && <span className="text-amber-600 ml-2">(consent likely required)</span>}
        </p>
      </div>

      {/* Structure */}
      <div className="border-b border-gray-100 pb-4">
        <h3 className="font-medium text-gray-600 mb-3 flex items-center gap-2 text-sm">
          <Ruler size={16} className="text-gray-400" />
          Structure
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Post Size</label>
            <select value={formData.postSize} onChange={(e) => update('postSize', e.target.value)} className={inputClass}>
              <option value="100x100">100x100mm</option>
              <option value="125x125">125x125mm</option>
              <option value="150x150">150x150mm</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Posts</label>
            <select value={formData.postCount} onChange={(e) => update('postCount', parseInt(e.target.value))} className={inputClass}>
              <option value={2}>2 posts</option>
              <option value={4}>4 posts</option>
              <option value={6}>6 posts</option>
              <option value={8}>8 posts</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Rafter Spacing</label>
            <select value={formData.rafterSpacing} onChange={(e) => update('rafterSpacing', parseInt(e.target.value))} className={inputClass}>
              <option value={400}>400mm</option>
              <option value={600}>600mm</option>
              <option value={900}>900mm</option>
            </select>
          </div>
        </div>
        <div className="flex gap-4 mt-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={formData.doubleBeam} onChange={(e) => update('doubleBeam', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
            <span className="text-gray-700">Double beams</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={formData.stain} onChange={(e) => update('stain', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
            <span className="text-gray-700">Stain/oil</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-2">~{rafterCount} rafters</p>
      </div>

      {/* Roof & Extras */}
      <div className="border-b border-gray-100 pb-4">
        <h3 className="font-medium text-gray-600 mb-3 flex items-center gap-2 text-sm">
          <Ruler size={16} className="text-gray-400" />
          Roof & Extras
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Roof</label>
            <select value={formData.roofType} onChange={(e) => update('roofType', e.target.value)} className={inputClass}>
              <option value="open">Open (rafters only)</option>
              <option value="covered">Covered</option>
            </select>
          </div>
          {formData.roofType === 'covered' && (
            <div>
              <label className={labelClass}>Roof Material</label>
              <select value={formData.roofMaterial} onChange={(e) => update('roofMaterial', e.target.value)} className={inputClass}>
                <option value="polycarbonate">Polycarbonate</option>
                <option value="laserlite">Laserlite</option>
                <option value="shade-cloth">Shade cloth</option>
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-4 mt-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={formData.decking} onChange={(e) => update('decking', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
            <span className="text-gray-700">Include deck floor</span>
          </label>
        </div>
        <div className="mt-3">
          <label className={labelClass}>Foundation</label>
          <select value={formData.foundation} onChange={(e) => update('foundation', e.target.value)} className={inputClass}>
            <option value="concrete-piles">Concrete piles with post brackets</option>
            <option value="posts-in-ground">Posts set in concrete</option>
          </select>
        </div>
      </div>

      {/* Compliance Notes */}
      <div className="bg-white/40 p-3 rounded-lg border border-gray-100">
        <div className="space-y-1 text-xs text-gray-500">
          {area > 20 && (
            <p className="text-amber-600 flex items-center gap-1">
              <AlertTriangle size={12} /> Over 20m&sup2; - building consent likely required
            </p>
          )}
          {formData.attached && <p>Ledger must fix to solid house framing, not cladding</p>}
          <p>NZS 3604 for timber sizing and connections</p>
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
