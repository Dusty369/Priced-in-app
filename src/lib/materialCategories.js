/**
 * Material Categories & Filter Helpers
 * For Carters materials database
 */

import { getAllMaterials, getTreatments } from './materialsLoader';

/**
 * Get filter options for UI dropdowns
 * @returns {object} - Filter options for each field
 */
export function getFilterOptions() {
  const materials = getAllMaterials();

  const options = {
    treatments: new Set(),
    categories: new Set(),
    packagingTypes: new Set(),
  };

  materials.forEach(m => {
    if (m.treatment) options.treatments.add(m.treatment);
    if (m.category) options.categories.add(m.category);
    if (m.packaging?.unitType) options.packagingTypes.add(m.packaging.unitType);
  });

  return {
    treatments: sortTreatments(Array.from(options.treatments)),
    categories: Array.from(options.categories).sort(),
    packagingTypes: Array.from(options.packagingTypes).sort(),
  };
}

/**
 * Sort treatments in logical order (H1.2 -> H6)
 */
function sortTreatments(treatments) {
  return treatments.sort((a, b) => {
    const aNum = parseFloat(a.replace('H', ''));
    const bNum = parseFloat(b.replace('H', ''));
    return aNum - bNum;
  });
}

/**
 * Filter materials based on criteria
 * @param {object} filters - Filter criteria
 * @returns {array} - Filtered materials
 */
export function filterMaterials(filters = {}) {
  const materials = getAllMaterials();

  return materials.filter(m => {
    if (filters.treatment && m.treatment !== filters.treatment) return false;
    if (filters.category && m.category !== filters.category) return false;
    if (filters.packagingType && m.packaging?.unitType !== filters.packagingType) return false;

    // Text search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase().trim();
      if (!searchLower) return true;
      if (!m.name.toLowerCase().includes(searchLower)) return false;
    }

    return true;
  });
}

/**
 * Get framing timber options for a specific size
 */
export function getFramingOptions(width, depth) {
  const materials = getAllMaterials();
  const targetDim = `${width} X ${depth}`;
  return materials.filter(m => m.dimensions === targetDim && /framing|timber/i.test(m.category));
}

/**
 * Get materials by treatment
 */
export function getMaterialsByTreatment(treatment) {
  const materials = getAllMaterials();
  return materials.filter(m => m.treatment === treatment);
}

/**
 * Get deck screws
 */
export function getDeckScrews() {
  const materials = getAllMaterials();
  return materials.filter(m => /deck.*screw/i.test(m.name));
}

export default {
  getFilterOptions,
  filterMaterials,
  getFramingOptions,
  getMaterialsByTreatment,
  getDeckScrews,
};
