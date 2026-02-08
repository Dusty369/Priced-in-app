'use client';

import { useState } from 'react';
import { Ruler, Droplets, AlertTriangle, Zap } from 'lucide-react';

export default function BathroomTemplate({ onGeneratePrompt }) {
  const [formData, setFormData] = useState({
    length: 2.4,
    width: 2.0,
    ceilingHeight: 2.4,
    showerType: 'tiled',
    showerSize: '1.0x1.0',
    bath: false,
    tiledFloor: true,
    tiledWalls: 'wet-area',
    wallTileHeight: 2.1,
    vanity: 'single',
    toilet: true,
    underfloorHeating: false,
    ventilation: 'extract-fan',
    existingRoom: true,
    consent: 'no',
  });

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const area = formData.length * formData.width;
  const isWetArea = formData.showerType !== 'none' || formData.bath;
  const needsConsent = formData.consent === 'yes' || area > 5;

  const generatePrompt = () => {
    let prompt = `Estimate builder-supplied materials for a ${formData.length}m x ${formData.width}m bathroom renovation`;
    if (formData.existingRoom) {
      prompt += ' (existing room refit)';
    } else {
      prompt += ' (new build)';
    }

    prompt += `:\n\nROOM DETAILS:\n`;
    prompt += `- Floor area: ${area.toFixed(1)}m\u00B2\n`;
    prompt += `- Ceiling height: ${formData.ceilingHeight}m\n`;

    prompt += `\nWET AREA (per E3/AS1):\n`;
    if (formData.showerType === 'tiled') {
      prompt += `- Tiled shower ${formData.showerSize}m on timber frame\n`;
      prompt += `- Shower waterproofing membrane to substrate (builder supplies substrate + membrane)\n`;
    } else if (formData.showerType === 'acrylic') {
      prompt += `- Acrylic shower liner ${formData.showerSize}m\n`;
    } else {
      prompt += `- No shower\n`;
    }
    if (formData.bath) {
      prompt += `- Bath included (framing for bath surround)\n`;
    }

    prompt += `\nWALL & FLOOR LININGS (builder-supplied):\n`;
    if (formData.tiledFloor) {
      prompt += `- Floor substrate: fibre cement sheet or tile underlay for ${area.toFixed(1)}m\u00B2\n`;
      prompt += `- Waterproof membrane for wet area floor\n`;
    }
    if (formData.tiledWalls === 'full') {
      const wallArea = (2 * (formData.length + formData.width) * formData.wallTileHeight).toFixed(1);
      prompt += `- Wall substrate: tile backing board ${wallArea}m\u00B2 (all walls to ${formData.wallTileHeight}m)\n`;
    } else if (formData.tiledWalls === 'wet-area') {
      prompt += `- Wall substrate: tile backing board for wet area walls only (shower + splash zones)\n`;
      prompt += `- GIB plasterboard for remaining walls\n`;
    } else {
      prompt += `- GIB plasterboard for all walls (moisture resistant in wet zones)\n`;
    }
    prompt += `- GIB plasterboard ceiling (moisture resistant)\n`;

    prompt += `\nFRAMING & STRUCTURE:\n`;
    if (!formData.existingRoom) {
      prompt += `- Wall framing: 90x45 H1.2 SG8 studs at 600mm centres\n`;
      prompt += `- Bottom plate: 90x45 H3.2 (wet area)\n`;
    }
    if (formData.showerType === 'tiled') {
      prompt += `- Shower nib wall framing if required\n`;
    }

    prompt += `\nFIXINGS & SUNDRIES:\n`;
    prompt += `- GIB screws, nails, adhesive\n`;
    prompt += `- Silicone sealant (wet area rated)\n`;
    if (formData.ventilation === 'extract-fan') {
      prompt += `- Extract fan ducting (150mm flex duct)\n`;
    }

    prompt += `\nCOMPLIANCE:\n`;
    prompt += `- E3/AS1: Wet area waterproofing requirements\n`;
    prompt += `- G4/AS1: Ventilation - ${formData.ventilation === 'extract-fan' ? 'mechanical extract fan' : formData.ventilation === 'window' ? 'openable window' : 'both window and fan'}\n`;
    if (formData.underfloorHeating) {
      prompt += `- Underfloor heating substrate allowance\n`;
    }
    if (needsConsent) {
      prompt += `- Building consent likely required\n`;
    }

    prompt += `\nNOTE: Only estimate builder-supplied materials (substrate, framing, GIB, membrane, fixings). Do NOT include tiles, tapware, vanity unit, toilet, or plumbing/electrical fittings - those are trade-supplied.`;

    prompt += `\nCalculate all sheet quantities, lineal metres of framing, and fixing quantities.`;

    onGeneratePrompt(prompt);
  };

  const inputClass = "border border-gray-200 bg-white/70 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent";
  const labelClass = "text-xs text-gray-600 mb-1 block";

  return (
    <div className="space-y-4">
      {/* Room Size */}
      <div className="border-b border-gray-100 pb-4">
        <h3 className="font-medium text-gray-600 mb-3 flex items-center gap-2 text-sm">
          <Ruler size={16} className="text-gray-400" />
          Room Dimensions
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Length (m)</label>
            <input type="number" value={formData.length} onChange={(e) => update('length', parseFloat(e.target.value) || 0)} min="1" step="0.1" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Width (m)</label>
            <input type="number" value={formData.width} onChange={(e) => update('width', parseFloat(e.target.value) || 0)} min="1" step="0.1" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Ceiling (m)</label>
            <input type="number" value={formData.ceilingHeight} onChange={(e) => update('ceilingHeight', parseFloat(e.target.value) || 0)} min="2.0" step="0.1" className={inputClass} />
          </div>
        </div>
        <div className="flex gap-4 mt-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="radio" name="roomType" checked={formData.existingRoom} onChange={() => update('existingRoom', true)} className="text-emerald-600 focus:ring-emerald-500" />
            <span className="text-gray-700">Existing room refit</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="radio" name="roomType" checked={!formData.existingRoom} onChange={() => update('existingRoom', false)} className="text-emerald-600 focus:ring-emerald-500" />
            <span className="text-gray-700">New build</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Area: {area.toFixed(1)}m&sup2;
          {area > 5 && <span className="text-amber-600 ml-2">(consent likely required)</span>}
        </p>
      </div>

      {/* Wet Area */}
      <div className="border-b border-gray-100 pb-4">
        <h3 className="font-medium text-gray-600 mb-3 flex items-center gap-2 text-sm">
          <Droplets size={16} className="text-gray-400" />
          Wet Area
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Shower Type</label>
            <select value={formData.showerType} onChange={(e) => update('showerType', e.target.value)} className={inputClass}>
              <option value="tiled">Tiled (substrate + membrane)</option>
              <option value="acrylic">Acrylic liner</option>
              <option value="none">No shower</option>
            </select>
          </div>
          {formData.showerType !== 'none' && (
            <div>
              <label className={labelClass}>Shower Size</label>
              <select value={formData.showerSize} onChange={(e) => update('showerSize', e.target.value)} className={inputClass}>
                <option value="0.9x0.9">900 x 900mm</option>
                <option value="1.0x1.0">1000 x 1000mm</option>
                <option value="1.2x1.0">1200 x 1000mm</option>
                <option value="1.5x1.0">1500 x 1000mm (walk-in)</option>
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-4 mt-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={formData.bath} onChange={(e) => update('bath', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
            <span className="text-gray-700">Include bath</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={formData.underfloorHeating} onChange={(e) => update('underfloorHeating', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
            <span className="text-gray-700">Underfloor heating</span>
          </label>
        </div>
      </div>

      {/* Walls & Floor */}
      <div className="border-b border-gray-100 pb-4">
        <h3 className="font-medium text-gray-600 mb-3 flex items-center gap-2 text-sm">
          <Ruler size={16} className="text-gray-400" />
          Linings
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Wall Tiling</label>
            <select value={formData.tiledWalls} onChange={(e) => update('tiledWalls', e.target.value)} className={inputClass}>
              <option value="full">Full walls (substrate all walls)</option>
              <option value="wet-area">Wet area only (substrate + GIB)</option>
              <option value="none">No tiling (GIB only)</option>
            </select>
          </div>
          {formData.tiledWalls !== 'none' && (
            <div>
              <label className={labelClass}>Tile Height (m)</label>
              <select value={formData.wallTileHeight} onChange={(e) => update('wallTileHeight', parseFloat(e.target.value))} className={inputClass}>
                <option value={1.2}>1.2m (splashback)</option>
                <option value={1.8}>1.8m (half height)</option>
                <option value={2.1}>2.1m (full height)</option>
                <option value={2.4}>2.4m (floor to ceiling)</option>
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-4 mt-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={formData.tiledFloor} onChange={(e) => update('tiledFloor', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
            <span className="text-gray-700">Tiled floor (substrate)</span>
          </label>
        </div>
        <div className="mt-3">
          <label className={labelClass}>Ventilation</label>
          <select value={formData.ventilation} onChange={(e) => update('ventilation', e.target.value)} className={inputClass}>
            <option value="extract-fan">Extract fan (mechanical)</option>
            <option value="window">Window only</option>
            <option value="both">Both fan and window</option>
          </select>
        </div>
      </div>

      {/* Compliance Notes */}
      {isWetArea && (
        <div className="bg-white/40 p-3 rounded-lg border border-gray-100">
          <div className="space-y-1 text-xs text-gray-500">
            <p>E3/AS1: Waterproofing required for shower and wet floor areas</p>
            <p>G4/AS1: Bathroom must have adequate ventilation</p>
            {needsConsent && (
              <p className="text-amber-600 flex items-center gap-1">
                <AlertTriangle size={12} /> Building consent likely required
              </p>
            )}
            <p className="text-gray-400 mt-1">Builder supplies: substrate, framing, GIB, membrane, fixings only</p>
          </div>
        </div>
      )}

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
