'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Package, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { searchMaterials, getMaterialsByCategory, getCategories } from '../lib/materialsLoader';

const ITEMS_PER_PAGE = 100;

export default function MaterialsPage({ onAddToCart, initialSearch = '' }) {
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(['All']);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    setCategories(getCategories());
    setLoading(false);
  }, []);

  // Sync search when initialSearch changes (from AI suggestion click)
  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, category]);

  useEffect(() => {
    if (loading) return;

    const loadMaterials = () => {
      const maxResults = 2000;
      let results;
      if (search) {
        results = searchMaterials(search, maxResults);
      } else {
        results = getMaterialsByCategory(category, maxResults);
      }

      setTotalResults(results.length);

      // Paginate results
      const start = (page - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      setMaterials(results.slice(start, end));
    };

    const timer = setTimeout(loadMaterials, 300);
    return () => clearTimeout(timer);
  }, [search, category, loading, page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading materials...</p>
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
      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3 sticky top-20 z-40">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search 17,000+ Carters materials..."
            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow duration-150"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Results count & pagination */}
      {totalResults > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, totalResults)} of {totalResults} {search && `for "${search}"`}
          </p>
          {totalResults > ITEMS_PER_PAGE && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-gray-100"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-600">
                {page} / {Math.ceil(totalResults / ITEMS_PER_PAGE)}
              </span>
              <button
                onClick={() => setPage(p => Math.min(Math.ceil(totalResults / ITEMS_PER_PAGE), p + 1))}
                disabled={page >= Math.ceil(totalResults / ITEMS_PER_PAGE)}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-gray-100"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Materials List */}
      <div className="space-y-3">
        {Object.entries(materialsByCategory).map(([cat, items]) => {
          const isExpanded = expandedCategories[cat] !== false;

          return (
            <div key={cat} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedCategories({...expandedCategories, [cat]: !isExpanded})}
                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Package size={20} className="text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{cat}</h3>
                    <p className="text-xs text-gray-500">{items.length} items</p>
                  </div>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 divide-y divide-gray-100">
                  {items.map(material => (
                    <div key={material.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="font-medium text-gray-900 truncate">{material.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <span className="inline-block px-1.5 py-0.5 rounded mr-2 bg-orange-50 text-orange-700">
                            Carters
                          </span>
                          {material.code}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-emerald-600">${material.price.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">/{material.unit}</p>
                        </div>
                        <button
                          onClick={() => onAddToCart(material)}
                          className="p-2.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors duration-150 active:scale-95"
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

      {/* Bottom pagination */}
      {totalResults > ITEMS_PER_PAGE && materials.length > 0 && (
        <div className="flex items-center justify-center gap-4 py-4">
          <button
            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-gray-100 flex items-center gap-1"
          >
            <ChevronLeft size={18} /> Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {Math.ceil(totalResults / ITEMS_PER_PAGE)}
          </span>
          <button
            onClick={() => { setPage(p => Math.min(Math.ceil(totalResults / ITEMS_PER_PAGE), p + 1)); window.scrollTo(0, 0); }}
            disabled={page >= Math.ceil(totalResults / ITEMS_PER_PAGE)}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-gray-100 flex items-center gap-1"
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Empty state */}
      {materials.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Search size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium mb-1">No materials found</p>
          <p className="text-sm text-gray-500">Try a different search term or category</p>
        </div>
      )}
    </div>
  );
}
