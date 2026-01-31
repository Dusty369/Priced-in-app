'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Package } from 'lucide-react';
import { searchMaterials, getMaterialsByCategory, getCategories, getSuppliers } from '../lib/materialsLoader';

export default function MaterialsPage({ onAddToCart }) {
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [supplier, setSupplier] = useState('All');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(['All']);
  const [suppliers, setSuppliers] = useState(['All']);
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    setCategories(getCategories());
    setSuppliers(getSuppliers());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    
    const loadMaterials = () => {
      if (search) {
        setMaterials(searchMaterials(search, 100));
      } else {
        setMaterials(getMaterialsByCategory(category, 100).filter(m => {
          const matchesSupplier = supplier === 'All' || m.supplier === supplier;
          return matchesSupplier;
        }));
      }
    };

    const timer = setTimeout(loadMaterials, 300);
    return () => clearTimeout(timer);
  }, [search, category, supplier, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading materials...</p>
        </div>
      </div>
    );
  }

  const materialsByCategory = materials.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3 sticky top-20 z-40">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search materials..."
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <select
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(materialsByCategory).map(([cat, items]) => {
          const isExpanded = expandedCategories[cat] !== false;
          
          return (
            <div key={cat} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedCategories({...expandedCategories, [cat]: !isExpanded})}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-emerald-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Package size={20} className="text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">{cat}</h3>
                    <p className="text-xs text-gray-500">{items.length} items</p>
                  </div>
                </div>
                <div className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</div>
              </button>
              
              {isExpanded && (
                <div className="border-t divide-y">
                  {items.map(material => (
                    <div key={material.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex-1">
                        <p className="font-medium">{material.name}</p>
                        <p className="text-xs text-gray-500">
                          <span className={`inline-block px-1.5 py-0.5 rounded mr-2 ${
                            material.supplier === 'ITM' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                          }`}>
                            {material.supplier || 'Carters'}
                          </span>
                          {material.code}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">${material.price.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">/{material.unit}</p>
                        </div>
                        <button
                          onClick={() => onAddToCart(material)}
                          className="p-2.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {materials.length === 0 && !loading && (
        <p className="text-center text-gray-500 py-8">No materials found</p>
      )}
    </div>
  );
}
