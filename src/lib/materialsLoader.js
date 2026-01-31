// Optimized materials loader with pagination
import materialsData from '../data/materials.json';

// Cache for better performance
let cachedMaterials = null;
let cachedCategories = null;

export function getAllMaterials() {
  if (!cachedMaterials) {
    cachedMaterials = materialsData;
  }
  return cachedMaterials;
}

export function getMaterialsPaginated(page = 1, perPage = 100) {
  const all = getAllMaterials();
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return {
    materials: all.slice(start, end),
    total: all.length,
    page,
    perPage,
    totalPages: Math.ceil(all.length / perPage)
  };
}

export function searchMaterials(query, limit = 100) {
  const all = getAllMaterials();
  const searchTerm = query.toLowerCase();
  
  return all
    .filter(m => 
      m.name.toLowerCase().includes(searchTerm) ||
      m.code.toLowerCase().includes(searchTerm) ||
      m.category.toLowerCase().includes(searchTerm)
    )
    .slice(0, limit);
}

export function getMaterialsByCategory(category, limit = 500) {
  const all = getAllMaterials();
  
  if (category === 'All') {
    return all.slice(0, limit);
  }
  
  return all
    .filter(m => m.category === category)
    .slice(0, limit);
}

export function getCategories() {
  if (!cachedCategories) {
    const all = getAllMaterials();
    cachedCategories = ['All', ...new Set(all.map(m => m.category))].sort();
  }
  return cachedCategories;
}

export function getSuppliers() {
  const all = getAllMaterials();
  return ['All', ...new Set(all.map(m => m.supplier || 'Unknown'))];
}
