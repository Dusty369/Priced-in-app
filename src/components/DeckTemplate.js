'use client';

import { useState, useEffect } from 'react';
import { MapPin, Ruler, AlertTriangle, Zap } from 'lucide-react';
import { lookupZones, getFixingRequirements } from '../lib/nzBuildingZones';
import { calculateDeckMembers } from '../lib/deckSpanCalculator';

export default function DeckTemplate({ onGeneratePrompt }) {
  const [formData, setFormData] = useState({
    suburb: '',
    city: 'Auckland',
    length: 6,
    width: 4,
    height: 800,
    postSpacing: 1.8,
    deckingThickness: 32,
    finish: 'stain',
    handrail: false,
    handrailLength: 0
  });

  const [zones, setZones] = useState(null);
  const [deckCalcs, setDeckCalcs] = useState(null);
  const [fixings, setFixings] = useState(null);

  // Auto-calculate when dimensions change
  useEffect(() => {
    const calcs = calculateDeckMembers(formData);
    setDeckCalcs(calcs);
  }, [formData.length, formData.width, formData.height, formData.postSpacing, formData.deckingThickness]);

  // Lookup zones when location changes
  useEffect(() => {
    if (formData.suburb && formData.city) {
      const locationZones = lookupZones(formData.suburb, formData.city);
      setZones(locationZones);

      const fixingReqs = getFixingRequirements(locationZones.seaSpray);
      setFixings(fixingReqs);
    } else {
      setZones(null);
      setFixings(null);
    }
  }, [formData.suburb, formData.city]);

  const generatePrompt = () => {
    const area = formData.length * formData.width;

    let prompt = `Estimate materials for a ${formData.length}m x ${formData.width}m deck`;

    if (zones) {
      prompt += ` at ${zones.location} (Wind Zone: ${zones.wind}, Sea Spray: Zone ${zones.seaSpray})`;
    }

    prompt += `:\n\nSTRUCTURAL (per NZS 3604):\n`;
    prompt += `- ${deckCalcs.bearerSize} H3.2 SG8 bearers on ${formData.postSpacing}m post spacing`;
    if (deckCalcs.doubleBearer) prompt += ` (DOUBLED - nailed together)`;
    prompt += `\n`;

    prompt += `- ${deckCalcs.joistSize} H3.2 SG8 joists at ${deckCalcs.joistSpacing}mm centres\n`;
    prompt += `- ${deckCalcs.postSize} H5 posts at ${formData.height}mm height\n`;
    prompt += `- Foundation: ${deckCalcs.foundationType}\n`;
    prompt += `- ${formData.deckingThickness}x140 H3.2 decking boards\n\n`;

    if (fixings) {
      prompt += `FIXINGS (${fixings.warning}):\n`;
      prompt += `- ${fixings.hangers}\n`;
      prompt += `- ${fixings.screws} 10Gx65mm\n`;
      prompt += `- ${fixings.bolts} M12x150mm\n`;
      if (deckCalcs.doubleBearer) {
        prompt += `- ${fixings.nails} 90mm (for doubling bearers)\n`;
      }
      prompt += `\n`;
    }

    prompt += `COMPLIANCE:\n`;
    deckCalcs.compliance.forEach(item => {
      prompt += `- ${item}\n`;
    });

    if (formData.handrail) {
      prompt += `- ${formData.handrailLength}m handrail with posts and balusters\n`;
    }

    if (formData.finish === 'stain') {
      prompt += `- Deck stain/oil (2 coats for ${area}m\u00B2)\n`;
    }

    prompt += `\nCalculate lineal meters for all timber, quantities for fixings, concrete bags, and finishing products.`;

    onGeneratePrompt(prompt);
  };

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4">
      {/* Location Section */}
      <div className="border-b border-gray-100 pb-4">
        <h3 className="font-medium text-gray-600 mb-3 flex items-center gap-2 text-sm">
          <MapPin size={16} className="text-gray-400" />
          Job Location
          <span className="text-xs font-normal text-gray-400">(optional but recommended)</span>
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Suburb (e.g. Takapuna)"
            value={formData.suburb}
            onChange={(e) => update('suburb', e.target.value)}
            className="border border-gray-200 bg-white/70 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <select
            value={formData.city}
            onChange={(e) => update('city', e.target.value)}
            className="border border-gray-200 bg-white/70 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option>Auckland</option>
            <option>Wellington</option>
            <option>Christchurch</option>
            <option>Hamilton</option>
            <option>Tauranga</option>
            <option>Dunedin</option>
            <option>Napier</option>
            <option>Queenstown</option>
            <option>Rotorua</option>
            <option>Taupo</option>
          </select>
        </div>

        {zones && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm border border-blue-100">
            <p className="text-blue-900">
              <MapPin size={14} className="inline mr-1" />
              Wind Zone: <strong>{zones.wind}</strong> | Sea Spray: <strong>Zone {zones.seaSpray}</strong>
            </p>
            {fixings && <p className="text-blue-700 mt-1 text-xs">{fixings.warning}</p>}
          </div>
        )}
      </div>

      {/* Dimensions */}
      <div className="border-b border-gray-100 pb-4">
        <h3 className="font-medium text-gray-600 mb-3 flex items-center gap-2 text-sm">
          <Ruler size={16} className="text-gray-400" />
          Deck Dimensions
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Length (m)</label>
            <input
              type="number"
              value={formData.length}
              onChange={(e) => update('length', parseFloat(e.target.value) || 0)}
              min="1"
              step="0.5"
              className="border border-gray-200 bg-white/70 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Width (m)</label>
            <input
              type="number"
              value={formData.width}
              onChange={(e) => update('width', parseFloat(e.target.value) || 0)}
              min="1"
              step="0.5"
              className="border border-gray-200 bg-white/70 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Height (mm)</label>
            <input
              type="number"
              value={formData.height}
              onChange={(e) => update('height', parseInt(e.target.value) || 0)}
              min="100"
              step="100"
              className="border border-gray-200 bg-white/70 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Post Spacing (m)</label>
            <select
              value={formData.postSpacing}
              onChange={(e) => update('postSpacing', parseFloat(e.target.value))}
              className="border border-gray-200 bg-white/70 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value={1.2}>1.2m</option>
              <option value={1.5}>1.5m</option>
              <option value={1.8}>1.8m</option>
              <option value={2.4}>2.4m</option>
              <option value={3.0}>3.0m</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Decking (mm)</label>
            <select
              value={formData.deckingThickness}
              onChange={(e) => update('deckingThickness', parseInt(e.target.value))}
              className="border border-gray-200 bg-white/70 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value={25}>25mm</option>
              <option value={32}>32mm</option>
              <option value={40}>40mm (kwila)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Finish</label>
            <select
              value={formData.finish}
              onChange={(e) => update('finish', e.target.value)}
              className="border border-gray-200 bg-white/70 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="stain">Stain/Oil</option>
              <option value="paint">Paint</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>

        {/* Handrail option */}
        <div className="mt-3 flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={formData.handrail}
              onChange={(e) => update('handrail', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-gray-700">Include handrail</span>
          </label>
          {formData.handrail && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={formData.handrailLength}
                onChange={(e) => update('handrailLength', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.5"
                className="w-20 border border-gray-200 bg-white/70 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <span className="text-xs text-gray-500">metres</span>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Area: {(formData.length * formData.width).toFixed(1)}m&sup2;
          {formData.length * formData.width > 30 && (
            <span className="text-amber-600 ml-2">(&gt;30m&sup2; - consent likely required)</span>
          )}
        </p>
      </div>

      {/* Auto-calculated members */}
      {deckCalcs && (
        <div className="bg-white/40 p-4 rounded-lg border border-gray-100">
          <h4 className="font-medium text-gray-600 mb-2 text-sm">Auto-Calculated Structure (NZS 3604)</h4>
          <div className="space-y-1.5 text-sm text-gray-700">
            <p>Bearers: <strong>{deckCalcs.bearerSize} H3.2 SG8</strong>
              {deckCalcs.doubleBearer && <span className="text-orange-600 font-medium ml-1">(DOUBLED)</span>}
            </p>
            <p>Joists: <strong>{deckCalcs.joistSize} H3.2 SG8</strong> @ {deckCalcs.joistSpacing}mm centres</p>
            <p>Posts: <strong>{deckCalcs.postSize} H5</strong></p>
            <p>Foundation: <span className="text-gray-600">{deckCalcs.foundationType}</span></p>
          </div>

          {deckCalcs.warnings.length > 0 && (
            <div className="mt-3 p-2.5 bg-orange-50 border border-orange-200 rounded-lg">
              {deckCalcs.warnings.map((w, i) => (
                <p key={i} className="text-sm text-orange-700 flex items-start gap-1.5">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /> {w}
                </p>
              ))}
            </div>
          )}

          {deckCalcs.compliance.length > 0 && (
            <div className="mt-3 text-xs text-gray-500 space-y-0.5">
              {deckCalcs.compliance.map((c, i) => (
                <p key={i}>{c}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={generatePrompt}
        disabled={!deckCalcs}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600/90 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Zap size={18} />
        Generate Estimate
      </button>
    </div>
  );
}
