'use client';

import { Wrench } from 'lucide-react';
import materials from '../data/materials.json';

export default function PriceComparisonModal({ 
  isOpen, 
  onClose, 
  itemId, 
  cart, 
  onSwitchSupplier 
}) {
  if (!isOpen || !itemId) return null;

  const currentItem = cart.find(i => i.id === itemId);
  if (!currentItem) return null;

  // Find same product from different suppliers
  const normalizedName = currentItem.name.split('X')[0].trim().toLowerCase();
  const alternatives = materials.filter(m => {
    const mNorm = m.name.split('X')[0].trim().toLowerCase();
    return mNorm === normalizedName && m.id !== currentItem.id;
  });

  const allOptions = [currentItem, ...alternatives].sort((a, b) => a.price - b.price);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Wrench size={24} className="text-emerald-600" />
          Price Comparison
        </h2>
        
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            {currentItem?.name}
          </p>
          
          {allOptions.map(option => (
            <div key={option.id} className="border rounded-lg p-3 flex justify-between items-center hover:bg-gray-50">
              <div>
                <p className="font-medium">
                  {option.supplier || 'Carters'}
                  {option.id === itemId && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      Current
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  ${option.price.toFixed(2)}{option.id !== itemId && (
                    <span className="ml-2 text-emerald-600 font-medium">
                      Save ${(currentItem?.price ? (currentItem.price - option.price) * currentItem.qty : 0).toFixed(2)}
                    </span>
                  )}
                </p>
              </div>
              {option.id !== itemId && (
                <button
                  onClick={() => onSwitchSupplier(itemId, option.id)}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
                >
                  Switch
                </button>
              )}
            </div>
          ))}
          
          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-3 border rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
