/**
 * Quantity Validator
 *
 * Validates AI-generated material lists for common errors,
 * NZ Building Code compliance, and best practices.
 */

/**
 * Validate a materials list for common errors
 * @param {Array} materials - Array of material objects with name, qty, unit
 * @param {string} jobType - Type of job (deck, pergola, fence, etc.)
 * @returns {Array} Array of error/warning objects
 */
export function validateMaterials(materials, jobType) {
  const errors = [];

  if (!materials || !Array.isArray(materials) || materials.length === 0) {
    return errors;
  }

  // Check for incorrect H4 structural use
  if (materials.some(m => {
    const name = m.name?.toLowerCase() || '';
    const isH4 = name.includes('h4');
    const isStructural = name.includes('pile') ||
      (name.includes('post') && !name.includes('fence'));
    const isInGround = jobType?.includes('deck') ||
      jobType?.includes('pergola') ||
      jobType?.includes('foundation');
    return isH4 && isStructural && isInGround;
  })) {
    errors.push({
      error: true,
      message: 'H4 TIMBER NOT SUITABLE FOR IN-GROUND STRUCTURAL USE',
      detail: 'In-ground piles and posts must be H5 treated (125×125 H5 minimum). H4 is only for fence posts.',
      fix: 'Replace with 125×125 H5 timber pile or use anchor piles'
    });
  }

  // Check for undersized deck joists (90x45 not suitable)
  if (jobType?.includes('deck')) {
    if (materials.some(m => {
      const name = m.name?.toLowerCase() || '';
      return name.includes('90') && name.includes('45') &&
        (name.includes('joist') || (name.includes('framing') && !name.includes('nog')));
    })) {
      errors.push({
        error: true,
        message: 'UNDERSIZED DECK JOISTS',
        detail: '90×45 timber is not suitable for deck joists. Minimum size is 140×45 for spans up to 2.0m.',
        fix: 'Use 140×45 H3.2 for spans up to 2.0m, 190×45 for up to 2.8m, 240×45 for up to 3.5m'
      });
    }
  }

  // Check for missing treatment on outdoor timber
  if (jobType?.includes('deck') || jobType?.includes('pergola') || jobType?.includes('fence')) {
    const outdoorTimber = materials.filter(m => {
      const name = m.name?.toLowerCase() || '';
      return (name.includes('bearer') || name.includes('joist') ||
              name.includes('decking') || name.includes('post') || name.includes('rail')) &&
             !name.includes('h3') && !name.includes('h4') && !name.includes('h5');
    });

    if (outdoorTimber.length > 0) {
      errors.push({
        error: false, // warning
        message: 'OUTDOOR TIMBER MAY NEED TREATMENT CHECK',
        detail: `Found ${outdoorTimber.length} outdoor timber item(s) without clear H-treatment specified.`,
        fix: 'Ensure all outdoor timber is H3.2 minimum (H5 for in-ground)'
      });
    }
  }

  // Check for H1.2 used externally
  if (jobType?.includes('deck') || jobType?.includes('pergola') || jobType?.includes('exterior')) {
    if (materials.some(m => {
      const name = m.name?.toLowerCase() || '';
      return name.includes('h1.2') &&
        (name.includes('bearer') || name.includes('joist') || name.includes('decking'));
    })) {
      errors.push({
        error: true,
        message: 'H1.2 TIMBER NOT SUITABLE FOR EXTERIOR USE',
        detail: 'H1.2 is interior-only treatment. External bearers, joists, and decking require H3.2 minimum.',
        fix: 'Replace with H3.2 treated timber'
      });
    }
  }

  // Check for GIB in wet areas without Aqualine
  if (jobType?.includes('bathroom') || jobType?.includes('laundry') || jobType?.includes('wet')) {
    const hasStandardGib = materials.some(m => {
      const name = m.name?.toLowerCase() || '';
      return name.includes('gib') && name.includes('standard') && !name.includes('aqua');
    });
    const hasAqualine = materials.some(m => {
      const name = m.name?.toLowerCase() || '';
      return name.includes('aqua') || name.includes('moisture');
    });

    if (hasStandardGib && !hasAqualine) {
      errors.push({
        error: true,
        message: 'STANDARD GIB IN WET AREA',
        detail: 'Standard GIB is not suitable for bathrooms and wet areas.',
        fix: 'Use GIB Aqualine for all walls in wet areas'
      });
    }
  }

  return errors;
}

/**
 * Check if a job type indicates structural/in-ground work
 * @param {string} jobType
 * @returns {boolean}
 */
export function isStructuralJob(jobType) {
  const structural = ['deck', 'pergola', 'carport', 'foundation', 'retaining'];
  return structural.some(s => jobType?.toLowerCase().includes(s));
}

/**
 * Get required treatment level for a component
 * @param {string} component - Component type (pile, bearer, joist, etc.)
 * @param {boolean} inGround - Whether component is in ground contact
 * @returns {string} Required H-treatment level
 */
export function getRequiredTreatment(component, inGround = false) {
  const comp = component?.toLowerCase() || '';

  if (inGround) {
    if (comp.includes('pile') || comp.includes('post')) return 'H5';
    if (comp.includes('retaining')) return 'H5';
  }

  if (comp.includes('bearer') || comp.includes('joist') || comp.includes('decking')) return 'H3.2';
  if (comp.includes('fence') && comp.includes('post')) return 'H4';
  if (comp.includes('rail') || comp.includes('paling')) return 'H3.2';
  if (comp.includes('framing') || comp.includes('stud')) return 'H1.2';
  if (comp.includes('wet') || comp.includes('bathroom')) return 'H3.1';

  return 'H1.2'; // default interior
}

/**
 * Validate quantities for suspicious values
 * @param {Array} materials - Array of material objects with qty, price, unit, packaging
 * @returns {Array} Array of warning strings
 */
export function validateQuantities(materials) {
  const warnings = [];

  if (!materials || !Array.isArray(materials)) return warnings;

  materials.forEach(mat => {
    const name = (mat.name || '').toLowerCase();
    const qty = mat.qty || 0;
    const price = mat.price || 0;
    const unitType = mat.packaging?.unitType || mat.unit || '';

    // Flag unusually high box/pack quantities
    if ((unitType === 'box' || unitType === 'pk') && qty > 50) {
      warnings.push(`⚠️ ${mat.name}: ${qty} boxes seems very high. Verify calculation.`);
    }

    // Flag unusually high tin/paint quantities
    if ((unitType === 'tin' || name.includes('stain') || name.includes('paint')) && qty > 20) {
      warnings.push(`⚠️ ${mat.name}: ${qty} tins seems high. Check coverage area.`);
    }

    // Flag unusually high concrete bag quantities
    if ((unitType === 'bag' || name.includes('concrete')) && qty > 100) {
      warnings.push(`⚠️ ${mat.name}: ${qty} bags seems high. Verify concrete volume.`);
    }

    // Flag unusually high line totals
    const lineTotal = qty * price;
    if (lineTotal > 5000) {
      warnings.push(`⚠️ ${mat.name}: $${lineTotal.toFixed(2)} line total is high. Double-check qty ${qty}.`);
    }

    // Flag zero quantities
    if (qty === 0 || !qty) {
      warnings.push(`❌ ${mat.name}: Quantity is zero or missing.`);
    }
  });

  return warnings;
}

export default validateMaterials;
