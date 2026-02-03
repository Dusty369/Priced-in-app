/**
 * Material Categories & Filter Helpers
 *
 * Provides category trees, filter options, and smart filtering
 * for the processed materials database.
 */

// Import will be lazy-loaded to avoid build issues
let processedMaterials = null;

/**
 * Load processed materials (lazy load)
 */
export function getProcessedMaterials() {
  if (!processedMaterials) {
    // Dynamic import for client-side compatibility
    processedMaterials = require('../data/materials-processed.json');
  }
  return processedMaterials;
}

/**
 * Get filter options for UI dropdowns
 * @returns {object} - Filter options for each field
 */
export function getFilterOptions() {
  const materials = getProcessedMaterials();

  const options = {
    types: new Set(),
    treatments: new Set(),
    sizes: new Set(),
    lengths: new Set(),
    suppliers: new Set(),
    fixingTypes: new Set(),
    fixingMaterials: new Set(),
    grades: new Set(),
    species: new Set(),
    categories: new Set(),
  };

  materials.forEach(m => {
    if (m.parsed.type && m.parsed.type !== 'other') options.types.add(m.parsed.type);
    if (m.parsed.treatment) options.treatments.add(m.parsed.treatment);
    if (m.parsed.width && m.parsed.depth) {
      options.sizes.add(`${m.parsed.width}×${m.parsed.depth}`);
    }
    if (m.parsed.lengthDisplay) options.lengths.add(m.parsed.lengthDisplay);
    if (m.supplier) options.suppliers.add(m.supplier);
    if (m.parsed.fixingType) options.fixingTypes.add(m.parsed.fixingType);
    if (m.parsed.fixingMaterial) options.fixingMaterials.add(m.parsed.fixingMaterial);
    if (m.parsed.grade) options.grades.add(m.parsed.grade);
    if (m.parsed.species) options.species.add(m.parsed.species);
    if (m.category) options.categories.add(m.category);
  });

  return {
    types: Array.from(options.types).sort(),
    treatments: sortTreatments(Array.from(options.treatments)),
    sizes: sortSizes(Array.from(options.sizes)),
    lengths: sortLengths(Array.from(options.lengths)),
    suppliers: Array.from(options.suppliers).sort(),
    fixingTypes: Array.from(options.fixingTypes).sort(),
    fixingMaterials: Array.from(options.fixingMaterials).sort(),
    grades: Array.from(options.grades).sort(),
    species: Array.from(options.species).sort(),
    categories: Array.from(options.categories).sort(),
  };
}

/**
 * Sort treatments in logical order (H1.2 -> H5)
 */
function sortTreatments(treatments) {
  return treatments.sort((a, b) => {
    const aNum = parseFloat(a.replace('H', ''));
    const bNum = parseFloat(b.replace('H', ''));
    return aNum - bNum;
  });
}

/**
 * Sort sizes by width then depth
 */
function sortSizes(sizes) {
  return sizes.sort((a, b) => {
    const [aw, ad] = a.split('×').map(Number);
    const [bw, bd] = b.split('×').map(Number);
    return aw - bw || ad - bd;
  });
}

/**
 * Sort lengths numerically
 */
function sortLengths(lengths) {
  return lengths.sort((a, b) => {
    return parseFloat(a) - parseFloat(b);
  });
}

/**
 * Filter materials based on criteria
 * @param {object} filters - Filter criteria
 * @returns {array} - Filtered materials
 */
export function filterMaterials(filters = {}) {
  const materials = getProcessedMaterials();

  return materials.filter(m => {
    // Type filter
    if (filters.type && m.parsed.type !== filters.type) return false;

    // Treatment filter
    if (filters.treatment && m.parsed.treatment !== filters.treatment) return false;

    // Size filter (width×depth)
    if (filters.size) {
      const size = m.parsed.width && m.parsed.depth
        ? `${m.parsed.width}×${m.parsed.depth}`
        : null;
      if (size !== filters.size) return false;
    }

    // Length filter
    if (filters.length && m.parsed.lengthDisplay !== filters.length) return false;

    // Supplier filter
    if (filters.supplier && m.supplier !== filters.supplier) return false;

    // Fixing type filter
    if (filters.fixingType && m.parsed.fixingType !== filters.fixingType) return false;

    // Fixing material filter
    if (filters.fixingMaterial && m.parsed.fixingMaterial !== filters.fixingMaterial) return false;

    // Grade filter
    if (filters.grade && m.parsed.grade !== filters.grade) return false;

    // Species filter
    if (filters.species && m.parsed.species !== filters.species) return false;

    // Category filter
    if (filters.category && m.category !== filters.category) return false;

    // Text search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase().trim();
      if (!searchLower) return true;

      // Search in multiple fields
      const matches =
        m.aiSearchTerms.some(t => t.toLowerCase().includes(searchLower)) ||
        m.displayName.toLowerCase().includes(searchLower) ||
        m.aiDescription.toLowerCase().includes(searchLower) ||
        m.code?.toLowerCase().includes(searchLower);

      if (!matches) return false;
    }

    return true;
  });
}

/**
 * Build hierarchical category tree for browsing
 * @returns {object} - Nested category structure
 */
export function buildCategoryTree() {
  const materials = getProcessedMaterials();
  const tree = {};

  materials.forEach(m => {
    const type = m.parsed.type || 'other';
    const treatment = m.parsed.treatment || 'untreated';
    const size = m.parsed.width && m.parsed.depth
      ? `${m.parsed.width}×${m.parsed.depth}`
      : 'various';

    // Build tree: type -> treatment -> size -> items
    if (!tree[type]) tree[type] = {};
    if (!tree[type][treatment]) tree[type][treatment] = {};
    if (!tree[type][treatment][size]) tree[type][treatment][size] = [];

    tree[type][treatment][size].push(m);
  });

  return tree;
}

/**
 * Get materials grouped by type
 * @param {number} limit - Max items per type
 * @returns {object} - Materials grouped by type
 */
export function getGroupedByType(limit = 100) {
  const materials = getProcessedMaterials();
  const groups = {};

  materials.forEach(m => {
    const type = m.parsed.type || 'other';
    if (!groups[type]) groups[type] = [];
    if (groups[type].length < limit) {
      groups[type].push(m);
    }
  });

  return groups;
}

/**
 * Get framing timber options for a specific size
 * @param {number} width
 * @param {number} depth
 * @returns {array} - Available framing options
 */
export function getFramingOptions(width, depth) {
  return filterMaterials({
    type: 'framing',
    size: `${width}×${depth}`,
  });
}

/**
 * Get structural piles (H5 treatment)
 * @returns {array} - Structural pile options
 */
export function getStructuralPiles() {
  const materials = getProcessedMaterials();
  return materials.filter(m =>
    m.parsed.type === 'pile' ||
    (m.parsed.treatment === 'H5' && m.parsed.type === 'post')
  );
}

/**
 * Get fence posts (H4, specifically for fences)
 * @returns {array} - Fence post options
 */
export function getFencePosts() {
  return filterMaterials({ type: 'fencePost' });
}

/**
 * Get post stirrups
 * @returns {array} - Post stirrup options
 */
export function getPostStirups() {
  return filterMaterials({ type: 'stirrup' });
}

/**
 * Get joist hangers
 * @returns {array} - Joist hanger options
 */
export function getJoistHangers() {
  return filterMaterials({ type: 'hanger' });
}

/**
 * Get decking boards
 * @returns {array} - Decking options
 */
export function getDeckingBoards() {
  return filterMaterials({ type: 'decking' });
}

/**
 * Get GIB/plasterboard options
 * @param {string} gibType - Optional: Standard, Aqualine, Fyreline, etc.
 * @returns {array} - GIB options
 */
export function getGibOptions(gibType = null) {
  const results = filterMaterials({ type: 'gib' });
  if (gibType) {
    return results.filter(m => m.parsed.gibType === gibType);
  }
  return results;
}

/**
 * Get insulation by R-value
 * @param {string} rValue - e.g., "R2.2", "R3.2"
 * @returns {array} - Insulation options
 */
export function getInsulation(rValue = null) {
  const results = filterMaterials({ type: 'insulation' });
  if (rValue) {
    return results.filter(m => m.parsed.rValue === rValue);
  }
  return results;
}

/**
 * Get deck screws
 * @returns {array} - Deck screw options
 */
export function getDeckScrews() {
  const materials = getProcessedMaterials();
  return materials.filter(m =>
    m.parsed.fixingType === 'screw' &&
    m.displayName.toLowerCase().includes('deck')
  );
}

/**
 * Smart search with relevance scoring
 * @param {string} query - Search query
 * @param {number} limit - Max results
 * @param {string} supplierFilter - Optional supplier filter
 * @returns {array} - Scored and sorted results
 */
export function smartSearch(query, limit = 100, supplierFilter = 'All') {
  if (!query || query.trim().length === 0) {
    return filterMaterials({ supplier: supplierFilter === 'All' ? null : supplierFilter })
      .slice(0, limit);
  }

  const materials = getProcessedMaterials();
  const queryLower = query.toLowerCase().trim();
  const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 0);

  // Normalize dimension searches (90 x 45 -> 90×45)
  const normalizedQuery = queryLower
    .replace(/(\d+)\s*[xX]\s*(\d+)/g, '$1×$2');

  const scored = [];

  for (const m of materials) {
    // Apply supplier filter
    if (supplierFilter !== 'All' && m.supplier !== supplierFilter) continue;

    let score = 0;

    // Check AI search terms
    const searchTermsMatch = m.aiSearchTerms.some(t =>
      t.toLowerCase().includes(normalizedQuery) ||
      normalizedQuery.includes(t.toLowerCase())
    );
    if (searchTermsMatch) score += 50;

    // Check AI description
    if (m.aiDescription.toLowerCase().includes(normalizedQuery)) score += 40;

    // Check display name
    if (m.displayName.toLowerCase().includes(normalizedQuery)) score += 30;

    // Check individual terms
    queryTerms.forEach(term => {
      if (m.displayName.toLowerCase().includes(term)) score += 10;
      if (m.aiDescription.toLowerCase().includes(term)) score += 5;
    });

    // Check code
    if (m.code?.toLowerCase().includes(queryLower)) score += 20;

    // Exact dimension match bonus
    if (m.parsed.width && m.parsed.depth) {
      const dimStr = `${m.parsed.width}×${m.parsed.depth}`;
      if (normalizedQuery.includes(dimStr)) score += 30;
    }

    // Exact treatment match bonus
    if (m.parsed.treatment && normalizedQuery.includes(m.parsed.treatment.toLowerCase())) {
      score += 20;
    }

    if (score > 0) {
      scored.push({ material: m, score });
    }
  }

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  // Interleave suppliers for balance
  if (supplierFilter === 'All') {
    return interleaveBySupplier(scored.map(s => s.material)).slice(0, limit);
  }

  return scored.map(s => s.material).slice(0, limit);
}

/**
 * Interleave results by supplier for balanced display
 */
function interleaveBySupplier(materials) {
  const bySupplier = { Carters: [], ITM: [], Other: [] };

  materials.forEach(m => {
    const supplier = m.supplier || 'Other';
    if (bySupplier[supplier]) {
      bySupplier[supplier].push(m);
    } else {
      bySupplier.Other.push(m);
    }
  });

  const interleaved = [];
  const suppliers = ['Carters', 'ITM', 'Other'];
  const indices = { Carters: 0, ITM: 0, Other: 0 };

  let added = true;
  while (added) {
    added = false;
    for (const supplier of suppliers) {
      if (indices[supplier] < bySupplier[supplier].length) {
        interleaved.push(bySupplier[supplier][indices[supplier]]);
        indices[supplier]++;
        added = true;
      }
    }
  }

  return interleaved;
}

export default {
  getProcessedMaterials,
  getFilterOptions,
  filterMaterials,
  buildCategoryTree,
  getGroupedByType,
  getFramingOptions,
  getStructuralPiles,
  getFencePosts,
  getPostStirups,
  getJoistHangers,
  getDeckingBoards,
  getGibOptions,
  getInsulation,
  getDeckScrews,
  smartSearch,
};
