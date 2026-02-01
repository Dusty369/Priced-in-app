'use client';

import { useState } from 'react';
import { 
  Save, Plus, Settings, Download, Building2, Package, Users, 
  Calculator, DollarSign, Trash2, Minus, Edit3, FileText,
  TrendingUp, AlertCircle, CheckCircle, Wrench
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
  labourRates
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [contingency, setContingency] = useState(0);
  const [discount, setDiscount] = useState(0);

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

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          {currentProjectId ? (
            <>
              <button
                onClick={onSave}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
              >
                <Save size={18} /> Save
              </button>
              <button
                onClick={onSaveAs}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                <FileText size={18} /> Save As...
              </button>
            </>
          ) : (
            <button
              onClick={onSaveAs}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
            >
              <Save size={18} /> Save Project
            </button>
          )}
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            <Plus size={18} /> New
          </button>
          <div className="flex-1"></div>
          <button
            onClick={onLabourSettings}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Settings size={18} /> Labour Rates
          </button>
          <button
            onClick={onCompanySettings}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Building2 size={18} /> Company
          </button>
          {(cart.length > 0 || labourItems.length > 0) && (
            <>
              <button
                onClick={onGeneratePDF}
                disabled={pdfGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50"
              >
                <Download size={18} /> {pdfGenerating ? 'Generating...' : 'PDF'}
              </button>
              <button
                onClick={onExportXero}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                📊 Xero
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Package size={20} />
            <span className="text-2xl font-bold">{cart.length}</span>
          </div>
          <p className="text-blue-100 text-sm">Materials</p>
          <p className="text-xl font-bold mt-1">${materialsWithWastage.toFixed(0)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Users size={20} />
            <span className="text-2xl font-bold">{labourItems.length}</span>
          </div>
          <p className="text-purple-100 text-sm">Labour Items</p>
          <p className="text-xl font-bold mt-1">${labourSubtotal.toFixed(0)}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={20} />
            <span className="text-2xl font-bold">{margin}%</span>
          </div>
          <p className="text-emerald-100 text-sm">Margin</p>
          <p className="text-xl font-bold mt-1">${marginAmount.toFixed(0)}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={20} />
            <span className="text-sm font-medium">TOTAL</span>
          </div>
          <p className="text-orange-100 text-sm">Quote Value</p>
          <p className="text-2xl font-bold mt-1">${grandTotal.toFixed(0)}</p>
        </div>
      </div>

      {/* Quote Settings */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Calculator size={20} className="text-orange-600" />
            Quote Settings
          </h2>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wastage
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={wastage}
                onChange={(e) => setWastage(Number(e.target.value))}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                min="0"
                max="50"
              />
              <span className="text-gray-500">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Margin
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                min="0"
                max="100"
              />
              <span className="text-gray-500">%</span>
            </div>
          </div>

          {showAdvanced && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contingency
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={contingency}
                    onChange={(e) => setContingency(Number(e.target.value))}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    min="0"
                    max="20"
                  />
                  <span className="text-gray-500">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    min="0"
                    max="50"
                  />
                  <span className="text-gray-500">%</span>
                </div>
              </div>
            </>
          )}

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition">
              <input
                type="checkbox"
                checked={gst}
                onChange={(e) => setGst(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span className="font-medium">Include GST (15%)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Materials Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-blue-50 to-white border-b flex justify-between items-center">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Package size={20} className="text-blue-600" />
            Materials ({cart.length})
          </h2>
          <span className="text-blue-600 font-bold">${materialsWithWastage.toFixed(2)}</span>
        </div>
        
        {cart.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package size={48} className="mx-auto mb-3 text-gray-300" />
            <p>No materials yet. Use AI Assistant or add manually.</p>
          </div>
        ) : (
          <div className="divide-y">
            {cart.map(item => (
              <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    ${item.price.toFixed(2)} / {item.unit}
                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100">
                      {item.supplier || 'Carters'}
                    </span>
                  </p>
                </div>
                
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                  <button 
                    onClick={() => onUpdateCartQty(item.id, -1)}
                    className="p-2 hover:bg-gray-200 rounded transition"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center font-bold">{item.qty}</span>
                  <button 
                    onClick={() => onUpdateCartQty(item.id, 1)}
                    className="p-2 hover:bg-gray-200 rounded transition"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <div className="text-right w-24">
                  <p className="font-bold text-lg">${(item.price * item.qty).toFixed(2)}</p>
                </div>
                
                <button 
                  onClick={() => onRemoveFromCart(item.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Labour Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-purple-50 to-white border-b flex justify-between items-center">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Users size={20} className="text-purple-600" />
            Labour ({labourItems.length})
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onAddLabourItem({ role: "builder", hours: 1, description: "Labour" })}
              className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center gap-1"
            >
              <Plus size={16} /> Add
            </button>
            <span className="text-purple-600 font-bold">${labourSubtotal.toFixed(2)}</span>
          </div>
        </div>
        
        {labourItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users size={48} className="mx-auto mb-3 text-gray-300" />
            <p>No labour items yet.</p>
            <button
              onClick={() => onAddLabourItem({ role: "builder", hours: 1, description: "Labour" })}
              className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 mx-auto"
            >
              <Plus size={18} /> Add Labour
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {labourItems.map(item => {
              const rate = labourRates[item.role] || 0;
              const cost = rate * item.hours;
              
              return (
                <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <select
                        value={item.role}
                        onChange={(e) => onUpdateLabourRole(item.id, e.target.value)}
                        className="px-2 py-1 border rounded text-sm font-medium"
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
                      <span className="text-sm text-gray-500">@ ${rate}/hr</span>
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                    <button 
                      onClick={() => onUpdateLabourHours(item.id, item.hours - 0.5)}
                      className="p-2 hover:bg-gray-200 rounded transition"
                    >
                      <Minus size={16} />
                    </button>
                    <div className="w-16 text-center">
                      <span className="font-bold">{item.hours}</span>
                      <span className="text-xs text-gray-500 ml-1">hrs</span>
                    </div>
                    <button 
                      onClick={() => onUpdateLabourHours(item.id, item.hours + 0.5)}
                      className="p-2 hover:bg-gray-200 rounded transition"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  <div className="text-right w-24">
                    <p className="font-bold text-lg">${cost.toFixed(2)}</p>
                  </div>
                  
                  <button 
                    onClick={() => onRemoveLabourItem(item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Project Notes */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Edit3 size={18} className="text-indigo-600" />
          Project Notes
        </h3>
        <textarea
          value={projectNotes}
          onChange={(e) => setProjectNotes(e.target.value)}
          placeholder="Add notes about this project..."
          className="w-full px-4 py-3 border rounded-lg h-24 resize-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Cost Breakdown */}
      {(cart.length > 0 || labourItems.length > 0) && (
        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl shadow-lg border-2 border-emerald-200 p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Calculator size={20} className="text-emerald-600" />
            Cost Breakdown
          </h3>
          
          <div className="space-y-3">
            {/* Materials */}
            {cart.length > 0 && (
              <div className="pb-3 border-b">
                <div className="flex justify-between text-gray-700 mb-1">
                  <span>Materials Subtotal</span>
                  <span className="font-medium">${materialsSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span className="text-sm">+ Wastage ({wastage}%)</span>
                  <span className="font-medium text-amber-600">
                    ${(materialsWithWastage - materialsSubtotal).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            
            {/* Labour */}
            {labourItems.length > 0 && (
              <div className="flex justify-between text-gray-700 pb-3 border-b">
                <span>Labour ({labourItems.reduce((s, i) => s + i.hours, 0)}hrs)</span>
                <span className="font-medium">${labourSubtotal.toFixed(2)}</span>
              </div>
            )}
            
            {/* Subtotal */}
            <div className="flex justify-between font-semibold text-gray-900 text-lg">
              <span>Subtotal</span>
              <span>${subtotalBeforeMargin.toFixed(2)}</span>
            </div>
            
            {/* Margin */}
            <div className="flex justify-between text-gray-700">
              <span>+ Margin ({margin}%)</span>
              <span className="font-medium text-blue-600">${marginAmount.toFixed(2)}</span>
            </div>
            
            {/* Contingency */}
            {showAdvanced && contingency > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>+ Contingency ({contingency}%)</span>
                <span className="font-medium text-orange-600">${contingencyAmount.toFixed(2)}</span>
              </div>
            )}
            
            {/* Discount */}
            {showAdvanced && discount > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>- Discount ({discount}%)</span>
                <span className="font-medium text-red-600">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            {/* GST */}
            {gst && (
              <div className="flex justify-between text-gray-700">
                <span>+ GST (15%)</span>
                <span className="font-medium text-purple-600">${gstAmount.toFixed(2)}</span>
              </div>
            )}
            
            {/* Grand Total */}
            <div className="pt-4 border-t-2 border-emerald-300">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">TOTAL QUOTE</span>
                <span className="text-3xl font-bold text-emerald-600">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
