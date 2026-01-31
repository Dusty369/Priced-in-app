'use client';

import { Package, Plus, Search } from 'lucide-react';
import materials from '../data/materials.json';

export default function MaterialsList({
  search,
  setSearch,
  category,
  setCategory,
  supplier,
  setSupplier,
  expandedCategories,
  setExpandedCategories,
  onAddToCart
}) {
  // Get unique categories and suppliers
  const categories = ['All', ...new Set(materials.map(m => m.category))].sort();
  const suppliers = ['All', ...new Set(materials.map(m => m.supplier || 'Unknown'))];

  // Filter materials
  const filtered = materials.filter(m => {
    const matchesCategory = category === 'All' || m.category === category;
    const matchesSupplier = supplier === 'All' || m.supplier === supplier;
    const matchesSearch = !search || 
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSupplier && matchesSearch;
  }).slice(0, 100);

  return (
    <div className="space-y-4">
      {/* Search and filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3 sticky top-20 z-40">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search materials by name or code..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <select
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          >
            {suppliers.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Cards - Materials organized by category */}
      <div className="space-y-3">
        {categories.filter(cat => {
          if (cat === 'All') return false;
          const catMaterials = materials.filter(m => {
            const matchesCategory = m.category === cat;
            const matchesSupplier = supplier === 'All' || m.supplier === supplier;
            const matchesSearch = !search || 
              m.name.toLowerCase().includes(search.toLowerCase()) ||
              m.code.toLowerCase().includes(search.toLowerCase());
            return matchesCategory && matchesSupplier && matchesSearch;
          });
          return catMaterials.length > 0;
        }).map(cat => {
          const catMaterials = materials.filter(m => {
            const matchesCategory = m.category === cat;
            const matchesSupplier = supplier === 'All' || m.supplier === supplier;
            const matchesSearch = !search || 
              m.name.toLowerCase().includes(search.toLowerCase()) ||
              m.code.toLowerCase().includes(search.toLowerCase());
            return matchesCategory && matchesSupplier && matchesSearch;
          });
          
          const isExpanded = expandedCategories[cat] !== false;
          
          return (
            <div key={cat} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow transition">
              <button
                onClick={() => setExpandedCategories({...expandedCategories, [cat]: !isExpanded})}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-emerald-50 transition group"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition">
                    <Package size={20} className="text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{cat}</h3>
                    <p className="text-xs text-gray-500">{catMaterials.length} items</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    {catMaterials.length}
                  </span>
                  <div className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </div>
              </button>
              
              {isExpanded && (
                <div className="border-t border-gray-100">
                  <div className="divide-y divide-gray-100">
                    {catMaterials.map(material => (
                      <div 
                        key={material.id}
                        className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 group-hover:text-emerald-600 transition truncate">
                            {material.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium mr-2 ${
                              material.supplier === 'ITM' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                            }`}>
                              {material.supplier || 'Carters'}
                            </span>
                            {material.code}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                          <div className="text-right">
                            <p className="font-bold text-emerald-600">${material.price.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">/{material.unit}</p>
                          </div>
                          <button
                            onClick={() => onAddToCart(material)}
                            className="p-2.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 active:scale-95 transition-all shadow-sm hover:shadow-md"
                            title="Add to quote"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {!search && supplier === 'All' && category === 'All' && (
          <p className="text-center text-gray-500 py-8">
            👇 Materials are organized by category. Click to expand.
          </p>
        )}
        
        {(search || supplier !== 'All' || category !== 'All') && filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8">No materials found matching your search</p>
        )}
      </div>
    </div>
  );
}
