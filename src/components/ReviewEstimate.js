'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, Check, Edit2, Trash2, X, FileText } from 'lucide-react';

/**
 * Review Estimate component
 * Shows AI-generated materials for review before adding to quote
 */
export default function ReviewEstimate({
  materials,
  onConfirm,
  onCancel,
  onUpdateQty,
  onRemoveItem
}) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  // Analyze materials for warnings
  const analysis = useMemo(() => {
    const warnings = [];
    let totalValue = 0;

    materials.forEach(item => {
      const lineTotal = (item.price || 0) * (item.qty || 0);
      totalValue += lineTotal;
      const name = (item.name || '').toLowerCase();

      // High quantity warnings
      if (/screw|nail|staple/i.test(name) && item.qty > 10) {
        warnings.push({
          id: item.id,
          type: 'high_qty',
          message: `${item.qty} boxes seems high - verify`
        });
      }
      if (/paint|stain|finish/i.test(name) && item.qty > 5) {
        warnings.push({
          id: item.id,
          type: 'high_qty',
          message: `${item.qty} tins seems high - verify`
        });
      }
      if (/concrete|cement/i.test(name) && item.qty > 50) {
        warnings.push({
          id: item.id,
          type: 'high_qty',
          message: `${item.qty} bags seems high - verify`
        });
      }

      // High value warnings
      if (lineTotal > 3000) {
        warnings.push({
          id: item.id,
          type: 'high_value',
          message: `$${lineTotal.toFixed(0)} line total - verify`
        });
      }
    });

    return { warnings, totalValue, itemCount: materials.length };
  }, [materials]);

  const getItemWarning = (itemId) => {
    return analysis.warnings.find(w => w.id === itemId);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditValue(item.qty.toString());
  };

  const saveEdit = (item) => {
    const newQty = parseInt(editValue);
    if (!isNaN(newQty) && newQty > 0) {
      onUpdateQty(item.id, newQty);
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Review AI Estimate</h2>
            <p className="text-sm text-gray-500 mt-1">
              {analysis.itemCount} items • ${analysis.totalValue.toFixed(2)} total
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Warnings Banner */}
        {analysis.warnings.length > 0 && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle size={18} />
              <span className="font-medium">
                {analysis.warnings.length} item(s) flagged for review
              </span>
            </div>
          </div>
        )}

        {/* Materials Table */}
        <div className="flex-1 overflow-auto p-6">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Material</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 w-24">Qty</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 w-20">Unit</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 w-24">Price</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 w-28">Total</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materials.map(item => {
                const warning = getItemWarning(item.id);
                const lineTotal = (item.price || 0) * (item.qty || 0);

                return (
                  <tr
                    key={item.id}
                    className={warning ? 'bg-amber-50' : 'hover:bg-gray-50'}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-2">
                        {warning && (
                          <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                          {item.calculation && (
                            <p className="text-xs text-gray-500 mt-0.5">{item.calculation}</p>
                          )}
                          {warning && (
                            <p className="text-xs text-amber-600 mt-1">{warning.message}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(item);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="w-20 px-2 py-1 border rounded text-center text-sm"
                          autoFocus
                        />
                      ) : (
                        <span className={`font-medium ${warning ? 'text-amber-700' : 'text-gray-900'}`}>
                          {item.qty}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-600">
                      {item.unit}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-600">
                      ${(item.price || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      ${lineTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 justify-end">
                        {editingId === item.id ? (
                          <>
                            <button
                              onClick={() => saveEdit(item)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                              title="Edit quantity"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => onRemoveItem(item.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">
                I have reviewed and verified the quantities
              </span>
            </label>

            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={!confirmed}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  confirmed
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Check size={18} />
                Add to Quote
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
