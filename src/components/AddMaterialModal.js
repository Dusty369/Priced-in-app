'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search, Plus, Package, ChevronDown, Check } from 'lucide-react';
import { searchMaterials, getMaterialsByCategory, getCategories, getSuppliers } from '../lib/materialsLoader';

export default function AddMaterialModal({ isOpen, onClose, onAddToCart }) {
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [supplier, setSupplier] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [suppliers, setSuppliers] = useState(['All']);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [recentlyAdded, setRecentlyAdded] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    setCategories(getCategories());
    setSuppliers(getSuppliers());
  }, []);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const loadMaterials = () => {
      if (search) {
        // Pass supplier filter to search
        setMaterials(searchMaterials(search, 50, supplier));
      } else {
        // Pass supplier filter to category browse
        setMaterials(getMaterialsByCategory(category, 50, supplier));
      }
    };

    const timer = setTimeout(loadMaterials, 200);
    return () => clearTimeout(timer);
  }, [search, category, supplier]);

  const handleAdd = (material) => {
    onAddToCart(material);
    setRecentlyAdded(material.id);
    setTimeout(() => setRecentlyAdded(null), 1500);
  };

  const handleClose = () => {
    setSearch('');
    setCategory('All');
    setSupplier('All');
    onClose();
  };

  if (!isOpen) return null;

  const materialsByCategory = materials.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-[10vh]">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Add Material</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-150"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="px-5 py-4 border-b border-gray-100 space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search materials..."
              className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow duration-150"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            >
              {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {materials.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {Object.entries(materialsByCategory).map(([cat, items]) => {
                const isExpanded = expandedCategories[cat] !== false;

                return (
                  <div key={cat}>
                    <button
                      onClick={() => setExpandedCategories({...expandedCategories, [cat]: !isExpanded})}
                      className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150 sticky top-0 bg-white border-b border-gray-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <Package size={18} className="text-emerald-600" />
                        <span className="font-medium text-gray-900">{cat}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{items.length}</span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isExpanded && (
                      <div>
                        {items.map(material => {
                          const justAdded = recentlyAdded === material.id;

                          return (
                            <div
                              key={material.id}
                              className={`px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-all duration-150 ${justAdded ? 'bg-emerald-50' : ''}`}
                            >
                              <div className="flex-1 min-w-0 mr-3">
                                <p className="font-medium text-gray-900 truncate text-sm">{material.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  <span className={`inline-block px-1.5 py-0.5 rounded mr-2 ${
                                    'bg-orange-50 text-orange-700'
                                  }`}>
                                    {material.supplier || 'Carters'}
                                  </span>
                                  {material.code}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="font-semibold text-emerald-600 text-sm">${material.price.toFixed(2)}</p>
                                  <p className="text-xs text-gray-500">/{material.unit}</p>
                                </div>
                                <button
                                  onClick={() => handleAdd(material)}
                                  className={`p-2 rounded-lg transition-all duration-150 ${
                                    justAdded
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 active:scale-95'
                                  }`}
                                >
                                  {justAdded ? <Check size={18} /> : <Plus size={18} />}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Search size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-1">No materials found</p>
              <p className="text-sm text-gray-500">Try a different search term</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
          <button
            onClick={handleClose}
            className="w-full px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-150 font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
