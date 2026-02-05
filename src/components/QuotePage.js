'use client';

import { useState } from 'react';
import {
  Save, Plus, Settings, Download, Building2, Package, Users,
  Calculator, DollarSign, Trash2, Minus, Edit3, FileText,
  TrendingUp, Search, Clock, StickyNote
} from 'lucide-react';

export default function QuotePage({
  cart,
  labourItems,
  currentProjectId,
  currentProjectName,
  wastage,
  setWastage,
  margin,
  setMargin,
  gst,
  setGst,
  projectNotes,
  setProjectNotes,
  onSave,
  onSaveAs,
  onNew,
  onLabourSettings,
  onCompanySettings,
  onGeneratePDF,
  onExportXero,
  onUpdateCartQty,
  onRemoveFromCart,
  onUpdateLabourHours,
  onRemoveLabourItem,
  onAddLabourItem,
  onUpdateLabourRole,
  pdfGenerating,
  labourRates,
  onUpdateLabourRate,
  onOpenAddMaterial,
  aiCalculations,
  onUpdateItemNote
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCalcs, setShowCalcs] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [contingency, setContingency] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);

  // Copy materials list to clipboard
  const copyMaterialsList = () => {
    const list = cart.map(item =>
      `${item.qty} × ${item.name} @ $${item.price.toFixed(2)}/${item.unit}`
    ).join('\n');
    const total = `\nMaterials Total: $${materialsWithWastage.toFixed(2)} (inc ${wastage}% wastage)`;
    navigator.clipboard.writeText(list + total);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculations
  const materialsSubtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const materialsWithWastage = materialsSubtotal * (1 + wastage / 100);
  
  const labourSubtotal = labourItems.reduce((sum, item) => {
    const rate = labourRates[item.role] || 0;
    return sum + (rate * item.hours);
  }, 0);
  
  const subtotalBeforeMargin = materialsWithWastage + labourSubtotal;
  const marginAmount = subtotalBeforeMargin * (margin / 100);
  const contingencyAmount = subtotalBeforeMargin * (contingency / 100);
  const subtotalWithMarginAndContingency = subtotalBeforeMargin + marginAmount + contingencyAmount;
  const discountAmount = subtotalWithMarginAndContingency * (discount / 100);
  const subtotalAfterDiscount = subtotalWithMarginAndContingency - discountAmount;
  const gstAmount = gst ? subtotalAfterDiscount * 0.15 : 0;
  const grandTotal = subtotalAfterDiscount + gstAmount;

  // Profit calculations
  const totalCost = materialsSubtotal + labourSubtotal;
  const profit = grandTotal - (gst ? totalCost * 1.15 : totalCost);
  const profitMargin = totalCost > 0 ? (profit / grandTotal) * 100 : 0;

  // Calculate margin needed for target price
  const calculateTargetMargin = (target) => {
    const targetNum = parseFloat(target);
    if (!targetNum || targetNum <= subtotalBeforeMargin) return null;
    const beforeGst = gst ? targetNum / 1.15 : targetNum;
    const marginNeeded = ((beforeGst / subtotalBeforeMargin) - 1) * 100;
    return marginNeeded.toFixed(1);
  };

  return (
    <div className="space-y-5">
      {/* Action Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          {currentProjectId ? (
            <>
              <button
                onClick={onSave}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-150 font-medium"
              >
                <Save size={18} /> Save
              </button>
              <button
                onClick={onSaveAs}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-150 font-medium"
              >
                <FileText size={18} /> Save As
              </button>
            </>
          ) : (
            <button
              onClick={onSaveAs}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-150 font-medium"
            >
              <Save size={18} /> Save Project
            </button>
          )}
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-150 font-medium"
          >
            <Plus size={18} /> New
          </button>
          <div className="flex-1"></div>
          <button
            onClick={onLabourSettings}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-150"
          >
            <Settings size={18} />
            <span className="hidden sm:inline">Rates</span>
          </button>
          <button
            onClick={onCompanySettings}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-150"
          >
            <Building2 size={18} />
            <span className="hidden sm:inline">Company</span>
          </button>
          {(cart.length > 0 || labourItems.length > 0) && (
            <>
              <button
                onClick={onGeneratePDF}
                disabled={pdfGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-150 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} /> {pdfGenerating ? 'Generating...' : 'PDF'}
              </button>
              <button
                onClick={onExportXero}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-150 font-medium"
              >
                📊 Xero
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Materials</p>
              <p className="text-lg font-bold text-gray-900">${materialsWithWastage.toLocaleString('en-NZ', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Users size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Labour</p>
              <p className="text-lg font-bold text-gray-900">${labourSubtotal.toLocaleString('en-NZ', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Margin ({margin}%)</p>
              <p className="text-lg font-bold text-gray-900">${marginAmount.toLocaleString('en-NZ', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>

        <div className="bg-emerald-600 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <DollarSign size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-emerald-100">Total Quote</p>
              <p className="text-lg font-bold text-white">${grandTotal.toLocaleString('en-NZ', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Settings */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calculator size={18} className="text-gray-400" />
            Quote Settings
          </h2>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-150"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Wastage</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={wastage}
                onChange={(e) => setWastage(Number(e.target.value))}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow duration-150"
                min="0"
                max="50"
              />
              <span className="text-gray-400 text-sm">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Margin</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow duration-150"
                min="0"
                max="100"
              />
              <span className="text-gray-400 text-sm">%</span>
            </div>
          </div>

          {showAdvanced && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contingency</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={contingency}
                    onChange={(e) => setContingency(Number(e.target.value))}
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow duration-150"
                    min="0"
                    max="20"
                  />
                  <span className="text-gray-400 text-sm">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow duration-150"
                    min="0"
                    max="50"
                  />
                  <span className="text-gray-400 text-sm">%</span>
                </div>
              </div>
            </>
          )}

          <div className="flex items-end col-span-2 sm:col-span-1">
            <label className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 px-3 py-2.5 rounded-lg transition-colors duration-150 w-full">
              <input
                type="checkbox"
                checked={gst}
                onChange={(e) => setGst(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-medium text-gray-700">Include GST (15%)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Materials Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Package size={18} className="text-blue-600" />
            Materials
            <span className="text-sm font-normal text-gray-500">({cart.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={copyMaterialsList}
                className="flex items-center gap-1 px-2 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors duration-150"
                title="Copy materials list"
              >
                {copied ? '✓ Copied' : '📋 Copy'}
              </button>
            )}
            <button
              onClick={onOpenAddMaterial}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-150 font-medium"
            >
              <Plus size={16} /> Add
            </button>
            <span className="text-blue-600 font-semibold">${materialsWithWastage.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Package size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium mb-1">No materials yet</p>
            <p className="text-sm text-gray-500 mb-4">Use AI Assistant or browse materials to add items</p>
            <button
              onClick={onOpenAddMaterial}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 font-medium"
            >
              <Search size={18} /> Browse Materials
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {cart.map(item => (
              <div key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                <div className="px-5 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      ${item.price.toFixed(2)} / {item.unit}
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                        'bg-orange-50 text-orange-700'
                      }`}>
                        Carters
                      </span>
                      {item.itemNote && (
                        <span className="ml-2 text-xs text-amber-600">
                          Has note
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg">
                    <button
                      onClick={() => onUpdateCartQty(item.id, -1)}
                      className="p-2 hover:bg-gray-200 rounded-l-lg transition-colors duration-150"
                    >
                      <Minus size={16} className="text-gray-600" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => onUpdateCartQty(item.id, parseInt(e.target.value) || 1, true)}
                      className="w-14 text-center font-semibold text-gray-900 bg-transparent border-0 focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => onUpdateCartQty(item.id, 1)}
                      className="p-2 hover:bg-gray-200 rounded-r-lg transition-colors duration-150"
                    >
                      <Plus size={16} className="text-gray-600" />
                    </button>
                  </div>

                  <div className="text-right w-24">
                    <p className="font-semibold text-gray-900">${(item.price * item.qty).toFixed(2)}</p>
                  </div>

                  <button
                    onClick={() => setEditingNoteId(editingNoteId === item.id ? null : item.id)}
                    className={`p-2 rounded-lg transition-colors duration-150 ${
                      item.itemNote
                        ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Add note"
                  >
                    <StickyNote size={18} />
                  </button>

                  <button
                    onClick={() => onRemoveFromCart(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-150"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Expandable note input */}
                {editingNoteId === item.id && (
                  <div className="px-5 pb-4">
                    <input
                      type="text"
                      value={item.itemNote || ''}
                      onChange={(e) => onUpdateItemNote(item.id, e.target.value)}
                      placeholder="Add note (e.g., Client wants stainless fixings)"
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Calculations Section - Collapsible */}
      {aiCalculations && aiCalculations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setShowCalcs(!showCalcs)}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors duration-150"
          >
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calculator size={18} className="text-amber-600" />
              AI Calculations
              <span className="text-sm font-normal text-gray-500">({aiCalculations.length})</span>
            </h2>
            <span className="text-gray-400 text-sm">
              {showCalcs ? '▲ Hide' : '▼ Show'}
            </span>
          </button>

          {showCalcs && (
            <div className="px-5 pb-5 border-t border-gray-100">
              <div className="mt-4 bg-gray-50 rounded-lg p-4 space-y-3">
                {aiCalculations.map((calc, i) => (
                  <div key={i} className="border-l-3 border-amber-500 pl-3 py-1" style={{ borderLeftWidth: '3px' }}>
                    <p className="font-medium text-gray-900 text-sm">{calc.item}</p>
                    <p className="text-gray-600 text-sm font-mono">{calc.working}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500">
                These calculations show how AI estimated the quantities. Verify before quoting.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Labour Section - Redesigned */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users size={18} className="text-purple-600" />
              Labour
              <span className="text-sm font-normal text-gray-500">({labourItems.length})</span>
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRates(!showRates)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors duration-150 font-medium"
              >
                <Settings size={14} /> Rates {showRates ? '▲' : '▼'}
              </button>
              <span className="text-purple-600 font-semibold">${labourSubtotal.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Inline Rates Editor */}
          {showRates && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(labourRates).map(([role, rate]) => (
                  <div key={role} className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1 capitalize">{role}</label>
                    {editingRate === role ? (
                      <input
                        type="number"
                        defaultValue={rate}
                        autoFocus
                        onBlur={(e) => {
                          const newRate = parseFloat(e.target.value) || 0;
                          if (onUpdateLabourRate) onUpdateLabourRate(role, newRate);
                          setEditingRate(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const newRate = parseFloat(e.target.value) || 0;
                            if (onUpdateLabourRate) onUpdateLabourRate(role, newRate);
                            setEditingRate(null);
                          }
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingRate(role)}
                        className="text-left px-2 py-1.5 text-sm font-medium bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        ${rate}/hr
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Click any rate to edit</p>
            </div>
          )}

          {/* Quick Add Buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { role: 'builder', label: 'Builder', hours: 8 },
              { role: 'labourer', label: 'Labourer', hours: 8 },
              { role: 'electrician', label: 'Sparky', hours: 4 },
              { role: 'plumber', label: 'Plumber', hours: 4 },
              { role: 'tiler', label: 'Tiler', hours: 8 },
              { role: 'plasterer', label: 'Plasterer', hours: 4 },
            ].map(({ role, label, hours }) => (
              <button
                key={role}
                onClick={() => onAddLabourItem({ role, hours, description: `${label} - ${hours}hrs` })}
                className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
              >
                + {label}
              </button>
            ))}
          </div>

          {/* Summary */}
          {labourItems.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
              <div className="flex items-center gap-4 text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-gray-400" />
                  <span className="font-semibold text-gray-900">{labourItems.reduce((s, i) => s + i.hours, 0)}</span> hrs
                </span>
                <span className="text-gray-300">|</span>
                <span>
                  <span className="font-semibold text-purple-600">
                    {(labourItems.reduce((s, i) => s + i.hours, 0) / 8).toFixed(1)}
                  </span> days
                </span>
              </div>
              <div className="text-gray-500">
                Avg ${(labourSubtotal / Math.max(1, labourItems.reduce((s, i) => s + i.hours, 0))).toFixed(0)}/hr blended
              </div>
            </div>
          )}
        </div>

        {labourItems.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-3">
              <Users size={24} className="text-purple-400" />
            </div>
            <p className="text-gray-600 font-medium mb-1">No labour added</p>
            <p className="text-sm text-gray-500">Click a role above to add labour hours</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {labourItems.map(item => {
              const rate = labourRates[item.role] || 0;
              const cost = rate * item.hours;

              return (
                <div key={item.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors duration-150">
                  {/* Role & Rate */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <select
                        value={item.role}
                        onChange={(e) => onUpdateLabourRole(item.id, e.target.value)}
                        className="px-2 py-1 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                      >
                        <option value="builder">Builder</option>
                        <option value="electrician">Electrician</option>
                        <option value="plumber">Plumber</option>
                        <option value="tiler">Tiler</option>
                        <option value="painter">Painter</option>
                        <option value="plasterer">Plasterer</option>
                        <option value="labourer">Labourer</option>
                        <option value="apprentice">Apprentice</option>
                      </select>
                      <span className="text-xs text-gray-400">@${rate}/hr</span>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg">
                    <button
                      onClick={() => onUpdateLabourHours(item.id, item.hours - 1)}
                      className="p-1.5 hover:bg-gray-200 rounded-l-lg transition-colors duration-150"
                    >
                      <Minus size={14} className="text-gray-600" />
                    </button>
                    <input
                      type="number"
                      value={item.hours}
                      onChange={(e) => onUpdateLabourHours(item.id, parseFloat(e.target.value) || 0)}
                      className="w-12 text-center font-semibold text-gray-900 bg-transparent focus:outline-none text-sm"
                    />
                    <button
                      onClick={() => onUpdateLabourHours(item.id, item.hours + 1)}
                      className="p-1.5 hover:bg-gray-200 rounded-r-lg transition-colors duration-150"
                    >
                      <Plus size={14} className="text-gray-600" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">hrs</span>

                  {/* Cost */}
                  <div className="text-right w-20">
                    <p className="font-semibold text-gray-900 text-sm">${cost.toFixed(0)}</p>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => onRemoveLabourItem(item.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-150"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Project Notes */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Edit3 size={18} className="text-gray-400" />
          Project Notes
        </h3>
        <textarea
          value={projectNotes}
          onChange={(e) => setProjectNotes(e.target.value)}
          placeholder="Add notes about this project..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg h-24 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow duration-150 text-gray-700"
        />
      </div>

      {/* Cost Breakdown */}
      {(cart.length > 0 || labourItems.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calculator size={18} className="text-gray-400" />
            Cost Breakdown
          </h3>

          <div className="space-y-2.5">
            {/* Materials */}
            {cart.length > 0 && (
              <div className="pb-2.5 border-b border-gray-100">
                <div className="flex justify-between text-gray-700 mb-1">
                  <span>Materials Subtotal</span>
                  <span className="font-medium">${materialsSubtotal.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>+ Wastage ({wastage}%)</span>
                  <span className="text-amber-600">
                    ${(materialsWithWastage - materialsSubtotal).toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {/* Labour */}
            {labourItems.length > 0 && (
              <div className="flex justify-between text-gray-700 pb-2.5 border-b border-gray-100">
                <span>Labour ({labourItems.reduce((s, i) => s + i.hours, 0)} hrs)</span>
                <span className="font-medium">${labourSubtotal.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {/* Subtotal */}
            <div className="flex justify-between font-semibold text-gray-900 pt-1">
              <span>Subtotal</span>
              <span>${subtotalBeforeMargin.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Margin */}
            <div className="flex justify-between text-gray-600 text-sm">
              <span>+ Margin ({margin}%)</span>
              <span className="text-emerald-600">${marginAmount.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Contingency */}
            {showAdvanced && contingency > 0 && (
              <div className="flex justify-between text-gray-600 text-sm">
                <span>+ Contingency ({contingency}%)</span>
                <span className="text-orange-600">${contingencyAmount.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {/* Discount */}
            {showAdvanced && discount > 0 && (
              <div className="flex justify-between text-gray-600 text-sm">
                <span>- Discount ({discount}%)</span>
                <span className="text-red-600">-${discountAmount.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {/* GST */}
            {gst && (
              <div className="flex justify-between text-gray-600 text-sm">
                <span>+ GST (15%)</span>
                <span className="text-purple-600">${gstAmount.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {/* Grand Total */}
            <div className="pt-4 mt-2 border-t-2 border-emerald-500">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">TOTAL QUOTE</span>
                <span className="text-2xl font-bold text-emerald-600">
                  ${grandTotal.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Profit Summary */}
            {totalCost > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 bg-gradient-to-r from-emerald-50 to-blue-50 -mx-5 -mb-5 px-5 py-4 rounded-b-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Your Profit</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-emerald-600">
                      ${profit.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({profitMargin.toFixed(1)}% of quote)
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Cost: ${totalCost.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
                  {gst && ` + GST = $${(totalCost * 1.15).toLocaleString('en-NZ', { minimumFractionDigits: 2 })}`}
                </div>

                {/* Target Price Calculator */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Target price:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">$</span>
                      <input
                        type="number"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        placeholder={Math.round(grandTotal * 1.1).toString()}
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    {targetPrice && calculateTargetMargin(targetPrice) && (
                      <span className="text-xs">
                        → Set margin to <button
                          onClick={() => setMargin(parseFloat(calculateTargetMargin(targetPrice)))}
                          className="font-bold text-emerald-600 hover:underline"
                        >
                          {calculateTargetMargin(targetPrice)}%
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
