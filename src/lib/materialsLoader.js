// Optimized materials loader with fuzzy search and supplier balancing
import materialsData from '../data/materials.json';

// Cache for better performance
let cachedMaterials = null;
let cachedCategories = null;
let cachedSuppliers = null;
let cachedBySupplier = null;

// ============================================================================
// CORE DATA ACCESS
// ============================================================================

export function getAllMaterials() {
  if (!cachedMaterials) {
    cachedMaterials = materialsData;
  }
  return cachedMaterials;
}

export function getMaterialsBySupplierCache() {
  if (!cachedBySupplier) {
    const all = getAllMaterials();
    cachedBySupplier = {
      Carters: all.filter(m => m.supplier === 'Carters'),
      ITM: all.filter(m => m.supplier === 'ITM'),
    };
  }
  return cachedBySupplier;
}

export function getCategories() {
  if (!cachedCategories) {
    const all = getAllMaterials();
    cachedCategories = ['All', ...new Set(all.map(m => m.category))].sort();
  }
  return cachedCategories;
}

export function getSuppliers() {
  if (!cachedSuppliers) {
    cachedSuppliers = ['All', 'Carters', 'ITM'];
  }
  return cachedSuppliers;
}

// ============================================================================
// SEARCH NORMALIZATION
// ============================================================================

/**
 * Normalize search term for consistent matching
 * - Convert x to × and vice versa
 * - Lowercase
 * - Trim and collapse whitespace
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    // Normalize multiplication sign variations
    .replace(/x/g, '×')
    .replace(/\*/g, '×');
}

/**
 * Create searchable version of text (for indexing)
 * Keeps both x and × versions for matching
 */
function createSearchableText(text) {
  const lower = text.toLowerCase();
  // Include both × and x versions so either matches
  return lower + ' ' + lower.replace(/×/g, 'x');
}

/**
 * Split search query into individual terms
 */
function splitSearchTerms(query) {
  return normalizeText(query)
    .split(' ')
    .filter(term => term.length > 0);
}

// ============================================================================
// FUZZY MATCHING (Levenshtein Distance)
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 * Returns the number of single-character edits needed
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;

  // Quick exits
  if (m === 0) return n;
  if (n === 0) return m;
  if (str1 === str2) return 0;

  // Use two rows instead of full matrix for memory efficiency
  let prevRow = Array(n + 1).fill(0).map((_, i) => i);
  let currRow = Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1,      // deletion
        currRow[j - 1] + 1,  // insertion
        prevRow[j - 1] + cost // substitution
      );
    }
    [prevRow, currRow] = [currRow, prevRow];
  }

  return prevRow[n];
}

/**
 * Check if a word is a fuzzy match (within edit distance)
 */
function isFuzzyMatch(searchWord, targetWord, maxDistance = 2) {
  // Don't fuzzy match very short terms
  if (searchWord.length < 4) return false;

  // Check if target word contains something close to search word
  const words = targetWord.split(/[\s\-_]+/);

  for (const word of words) {
    if (word.length < 3) continue;

    // Check prefix match (forgiving of endings)
    if (word.startsWith(searchWord.slice(0, Math.max(3, searchWord.length - 2)))) {
      return true;
    }

    // Calculate distance for similar length words
    if (Math.abs(word.length - searchWord.length) <= maxDistance) {
      const distance = levenshteinDistance(searchWord, word);
      if (distance <= maxDistance) {
        return true;
      }
    }
  }

  return false;
}

// ============================================================================
// RELEVANCE SCORING
// ============================================================================

/**
 * Score how well a material matches the search terms
 * Higher score = better match
 */
function scoreMatch(material, searchTerms, normalizedQuery) {
  const searchableName = createSearchableText(material.name);
  const searchableCategory = createSearchableText(material.category);
  const searchableSubcategory = createSearchableText(material.subcategory || '');
  const searchableCode = createSearchableText(material.code || '');
  const searchableSupplier = material.supplier?.toLowerCase() || '';

  const allSearchable = `${searchableName} ${searchableCategory} ${searchableSubcategory} ${searchableCode} ${searchableSupplier}`;

  let score = 0;
  let allTermsFound = true;
  let fuzzyMatchCount = 0;

  for (const term of searchTerms) {
    const termFound = allSearchable.includes(term) || allSearchable.includes(term.replace(/×/g, 'x'));

    if (termFound) {
      // Exact match in name - highest score
      if (searchableName.includes(term)) {
        score += 50;

        // Bonus for starting with term
        if (searchableName.startsWith(term) || searchableName.includes(' ' + term)) {
          score += 20;
        }
      }
      // Match in code
      else if (searchableCode.includes(term)) {
        score += 40;
      }
      // Match in category/subcategory
      else if (searchableCategory.includes(term) || searchableSubcategory.includes(term)) {
        score += 30;
      }
      // Match in supplier
      else if (searchableSupplier.includes(term)) {
        score += 25;
      }
    } else {
      // Term not found exactly - try fuzzy
      if (isFuzzyMatch(term, allSearchable)) {
        score += 10;
        fuzzyMatchCount++;
      } else {
        allTermsFound = false;
      }
    }
  }

  // Bonus for matching all terms
  if (allTermsFound && searchTerms.length > 1) {
    score += 30;
  }

  // Penalize if only fuzzy matches
  if (fuzzyMatchCount === searchTerms.length && searchTerms.length > 0) {
    score = Math.max(5, score - 20);
  }

  return score;
}

// ============================================================================
// SUPPLIER INTERLEAVING
// ============================================================================

/**
 * Interleave results from different suppliers for balanced display
 */
function interleaveBySupplier(results) {
  const bySupplier = {
    Carters: [],
    ITM: [],
    Other: [],
  };

  // Group by supplier
  for (const item of results) {
    const supplier = item.supplier || 'Other';
    if (bySupplier[supplier]) {
      bySupplier[supplier].push(item);
    } else {
      bySupplier.Other.push(item);
    }
  }

  // Interleave: take one from each supplier in turn
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

// ============================================================================
// MAIN SEARCH FUNCTION
// ============================================================================

/**
 * Search materials with fuzzy matching and supplier balancing
 *
 * @param {string} query - Search query
 * @param {number} limit - Max results to return
 * @param {string} supplier - Filter by supplier ('All', 'Carters', 'ITM')
 * @returns {Array} - Matched materials sorted by relevance
 */
export function searchMaterials(query, limit = 100, supplier = 'All') {
  if (!query || query.trim().length === 0) {
    return getMaterialsByCategory('All', limit, supplier);
  }

  const all = getAllMaterials();
  const searchTerms = splitSearchTerms(query);
  const normalizedQuery = normalizeText(query);

  if (searchTerms.length === 0) {
    return getMaterialsByCategory('All', limit, supplier);
  }

  // Score all materials
  const scored = [];

  for (const material of all) {
    // Apply supplier filter
    if (supplier !== 'All' && material.supplier !== supplier) {
      continue;
    }

    const score = scoreMatch(material, searchTerms, normalizedQuery);

    if (score > 0) {
      scored.push({ material, score });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Extract materials
  let results = scored.map(s => s.material);

  // If filtering by specific supplier, just slice
  if (supplier !== 'All') {
    return results.slice(0, limit);
  }

  // For 'All' suppliers, interleave results for balance
  // But only interleave within score tiers to maintain relevance
  const highScore = scored.filter(s => s.score >= 50).map(s => s.material);
  const medScore = scored.filter(s => s.score >= 20 && s.score < 50).map(s => s.material);
  const lowScore = scored.filter(s => s.score > 0 && s.score < 20).map(s => s.material);

  const balanced = [
    ...interleaveBySupplier(highScore),
    ...interleaveBySupplier(medScore),
    ...interleaveBySupplier(lowScore),
  ];

  return balanced.slice(0, limit);
}

// ============================================================================
// CATEGORY BROWSING
// ============================================================================

/**
 * Get materials by category with supplier balancing
 *
 * @param {string} category - Category to filter by
 * @param {number} limit - Max results
 * @param {string} supplier - Supplier filter
 * @returns {Array} - Materials in category
 */
export function getMaterialsByCategory(category, limit = 500, supplier = 'All') {
  const all = getAllMaterials();

  let filtered = all;

  // Apply category filter
  if (category !== 'All') {
    filtered = filtered.filter(m => m.category === category);
  }

  // Apply supplier filter
  if (supplier !== 'All') {
    filtered = filtered.filter(m => m.supplier === supplier);
    return filtered.slice(0, limit);
  }

  // For 'All' suppliers, interleave for balanced display
  return interleaveBySupplier(filtered).slice(0, limit);
}

// ============================================================================
// PAGINATION (for large lists)
// ============================================================================

export function getMaterialsPaginated(page = 1, perPage = 100, supplier = 'All') {
  let materials = getAllMaterials();

  if (supplier !== 'All') {
    materials = materials.filter(m => m.supplier === supplier);
  } else {
    materials = interleaveBySupplier(materials);
  }

  const start = (page - 1) * perPage;
  const end = start + perPage;

  return {
    materials: materials.slice(start, end),
    total: materials.length,
    page,
    perPage,
    totalPages: Math.ceil(materials.length / perPage)
  };
}

// ============================================================================
// UTILITY: Get suggestions for no results
// ============================================================================

/**
 * Get fuzzy suggestions when search returns no/few results
 */
export function getSuggestions(query, limit = 5) {
  if (!query || query.length < 3) return [];

  const all = getAllMaterials();
  const normalizedQuery = normalizeText(query);
  const suggestions = new Set();

  // Find words in material names that are close to the query
  for (const material of all) {
    if (suggestions.size >= limit * 3) break;

    const words = material.name.toLowerCase().split(/[\s\-_]+/);
    for (const word of words) {
      if (word.length < 3) continue;

      const distance = levenshteinDistance(normalizedQuery, word);
      if (distance <= 2 && distance > 0) {
        suggestions.add(word);
      }
    }
  }

  return Array.from(suggestions).slice(0, limit);
}
