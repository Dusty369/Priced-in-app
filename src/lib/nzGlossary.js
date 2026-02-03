/**
 * NZ Construction Glossary
 *
 * This file defines standard NZ building terminology, units, and sizes.
 * The AI system prompt MUST reference this to ensure consistent language.
 *
 * IMPORTANT: This is the single source of truth for NZ construction terms.
 */

// ============================================================================
// 1. UNIT STANDARDS (locked - no variations allowed)
// ============================================================================

export const NZ_UNITS = {
  // Approved units - AI must ONLY use these
  approved: {
    lm: { name: 'Lineal metre', usedFor: 'Timber lengths, skirting, architraves, gutters, fascia' },
    'm²': { name: 'Square metre', usedFor: 'Sheet goods, flooring, roofing, cladding, tiling, membrane' },
    'm³': { name: 'Cubic metre', usedFor: 'Concrete, excavation, hardfill, soil' },
    ea: { name: 'Each', usedFor: 'Posts, doors, windows, fittings, fixtures' },
    pr: { name: 'Pair', usedFor: 'Hinges, handles' },
    kg: { name: 'Kilogram', usedFor: 'Nails, screws in bulk, adhesive' },
    L: { name: 'Litre', usedFor: 'Paint, sealant, compound' },
    pk: { name: 'Pack', usedFor: 'Screws (box), nails (box), fixings' },
    bag: { name: 'Bag', usedFor: 'Concrete mix, grout, adhesive (bagged)' },
    sht: { name: 'Sheet', usedFor: 'GIB, plywood, MDF, cement board' },
    roll: { name: 'Roll', usedFor: 'Building wrap, membrane, tape' },
    tube: { name: 'Tube', usedFor: 'Silicone, adhesive, sealant (cartridge)' },
    box: { name: 'Box', usedFor: 'Screws, nails, clips (counted qty)' },
    len: { name: 'Length', usedFor: 'Standard timber lengths (when not cutting)' },
    set: { name: 'Set', usedFor: 'Door hardware, handle sets' },
  },

  // Banned units - AI must NEVER use these
  banned: {
    'm': 'Use "lm" for lineal metre',
    'sqm': 'Use "m²"',
    'cbm': 'Use "m³"',
    'cum': 'Use "m³"',
    'linear': 'Use "lineal"',
    'piece': 'Use "ea"',
    'pce': 'Use "ea"',
    'unit': 'Use "ea"',
    'each': 'Use "ea"',
    'metre': 'Use "lm" for lineal, "m²" for area, "m³" for volume',
  },
};

// ============================================================================
// 2. NZ TERMINOLOGY (use NZ term, not alternatives)
// ============================================================================

export const NZ_TERMINOLOGY = {
  framing: {
    'Noggin': ['Dwang', 'Nogging', 'Blocking', 'Bridging'],
    'Bottom plate': ['Sole plate', 'Floor plate'],
    'Top plate': ['Wall plate', 'Head plate'],
    'Lintel': ['Header'],
    'Trimmer stud': ['Jack stud'],
    'King stud': ['King post'],
    'Packer': ['Shim', 'Spacer'],
    'Bracing': ['Shear wall', 'Racking'],
    'Batten': ['Furring strip', 'Strapping'],
    'Purlin': ['Roof batten'],
    'Rafter': ['Common rafter'],
    'Hip rafter': ['Hip'],
    'Valley rafter': ['Valley'],
    'Ceiling joist': ['Ceiling batten'],
    'Strutting beam': ['Strong-back'],
    'Collar tie': ['Collar beam'],
  },

  exterior: {
    'Weatherboard': ['Clapboard', 'Lap siding'],
    'Bevel-back': ['Lap board'],
    'Building wrap': ['House wrap', 'Tyvek'],
    'Cavity batten': ['Furring', 'Strapping'],
    'Fascia': ['Fascia board'],
    'Barge board': ['Verge board', 'Rake board'],
    'Soffit': ['Eave lining'],
    'Spouting': ['Gutter', 'Eavestrough'],
    'Downpipe': ['Downspout'],
    'Flashing': ['Trim'],
    'Cladding': ['Siding'],
    'Scriber': ['Corner mould'],
  },

  interior: {
    'GIB': ['Drywall', 'Sheetrock', 'Gyprock', 'Plasterboard'],
    'GIB stopping': ['Mudding', 'Taping', 'Jointing'],
    'Skirting': ['Baseboard'],
    'Architrave': ['Door casing', 'Trim'],
    'Scotia': ['Cove moulding', 'Crown'],
    'Quad': ['Quarter round'],
    'Coving': ['Crown moulding'],
    'Reveal': ['Jamb lining'],
    'Door jamb': ['Door frame'],
    'Threshold': ['Door sill'],
  },

  roofing: {
    'Corrugate': ['Corrugated iron', 'Wavy iron'],
    'Long run': ['Standing seam'],
    'Roofing iron': ['Metal roofing'],
    'Butynol': ['Torch-on'],
    'Colorsteel': ['Colorbond'],
    'Ridge cap': ['Ridge flashing'],
    'Barge flashing': ['Rake flashing'],
    'Apron flashing': ['Counter flashing'],
  },

  concrete: {
    'Boxing': ['Formwork', 'Shuttering'],
    'Ready-mix': ['Redi-mix'],
    'Hardfill': ['GAP', 'Crusher dust', 'Road base'],
    'Polythene': ['DPM', 'Vapor barrier', 'Visqueen'],
    'Mesh': ['Reo mesh', 'Welded mesh'],
    'Foundation bolt': ['HD bolt', 'Anchor bolt', 'J-bolt'],
    'Concrete block': ['CMU', 'Cinder block'],
    'Rib raft': ['Waffle pod'],
  },

  wetAreas: {
    'Membrane': ['Waterproofing'],
    'Tanking': ['Waterproof coating'],
    'Wet area': ['Bathroom'],
    'Cement board': ['Tile underlay', 'Backer board'],
    'Fall': ['Slope', 'Pitch'],
    'Gully': ['Floor waste', 'Drain'],
  },

  timber: {
    'H3.2': ['H3'],
    'H4': ['Ground contact'],
    'H5': ['In-ground'],
    'SG8': ['Structural grade'],
    'Radiata': ['Pine'],
    'Kwila': ['Merbau'],
  },

  fixings: {
    'Coach bolt': ['Carriage bolt'],
    'Coach screw': ['Lag bolt', 'Lag screw'],
    'Tek screw': ['Self-drilling screw'],
    'Bugle screw': ['Bugle head', 'Drywall screw'],
    'Joist hanger': ['Joist stirrup'],
    'Post stirrup': ['Post anchor', 'Post bracket'],
    'Framing anchor': ['Hurricane clip', 'Tie-down'],
    'Nail plate': ['Mending plate'],
  },
};

// Build reverse lookup: alternative term -> NZ term
export const TERM_LOOKUP = {};
Object.entries(NZ_TERMINOLOGY).forEach(([category, terms]) => {
  Object.entries(terms).forEach(([nzTerm, alternatives]) => {
    alternatives.forEach(alt => {
      TERM_LOOKUP[alt.toLowerCase()] = nzTerm;
    });
  });
});

// ============================================================================
// 3. STANDARD NZ SIZES (reference list)
// ============================================================================

export const STANDARD_SIZES = {
  framingTimber: {
    description: 'Common framing timber sizes (mm)',
    sizes: [
      { size: '90×45', use: 'Standard wall stud, noggins' },
      { size: '140×45', use: 'Load-bearing walls, lintels' },
      { size: '190×45', use: 'Lintels, beams, floor joists' },
      { size: '240×45', use: 'Beams, large lintels, floor joists' },
      { size: '290×45', use: 'Floor joists, beams' },
      { size: '45×45', use: 'Battens, packings' },
      { size: '70×35', use: 'Ceiling battens' },
      { size: '100×50', use: 'Older framing, repairs' },
    ],
    standardLengths: [2.4, 3.0, 3.6, 4.2, 4.8, 5.4, 6.0], // metres
  },

  posts: {
    description: 'Post sizes (mm)',
    sizes: [
      { size: '90×90', use: 'Light posts, pergola' },
      { size: '100×100', use: 'Standard fence/deck posts' },
      { size: '125×125', use: 'Heavy deck posts, carports' },
      { size: '150×150', use: 'Large structures, verandahs' },
    ],
  },

  sheetGoods: {
    GIB: {
      sizes: ['1200×2400', '1200×2700', '1200×3000', '1200×3600'],
      thicknesses: [10, 13], // mm
      areaPerSheet: { '1200×2400': 2.88, '1200×2700': 3.24, '1200×3000': 3.6, '1200×3600': 4.32 }, // m²
    },
    plywood: {
      size: '1200×2400',
      thicknesses: [7, 9, 12, 15, 18, 21], // mm
      areaPerSheet: 2.88, // m²
    },
    MDF: {
      size: '1200×2400',
      thicknesses: [9, 12, 16, 18], // mm
      areaPerSheet: 2.88, // m²
    },
    particleBoardFlooring: {
      size: '1200×2400',
      thickness: 20, // mm T&G
      areaPerSheet: 2.88, // m²
    },
    cementBoard: {
      sizes: ['900×1800', '1200×2400'],
      thickness: 6, // mm
      areaPerSheet: { '900×1800': 1.62, '1200×2400': 2.88 }, // m²
    },
    hardboard: {
      size: '1200×2400',
      thicknesses: [3.2, 4.8], // mm
      areaPerSheet: 2.88, // m²
    },
  },

  roofing: {
    longRun: { coverWidth: 760, unit: 'mm', note: 'Custom lengths' },
    corrugate: { coverWidth: 762, unit: 'mm' },
    butynol: { width: 1000, unit: 'mm', note: 'Rolls' },
  },

  spacings: {
    description: 'Common centre spacings',
    wallStuds: { standard: 600, bracing: 400, unit: 'mm' },
    joists: { options: [400, 450, 600], unit: 'mm' },
    rafters: { typical: 900, unit: 'mm' },
    purlins: { typical: 900, unit: 'mm', note: 'Check manufacturer specs' },
    tileBattens: { gauge: 320, unit: 'mm', note: 'Typical - check tile specs' },
    noggins: { height: 800, unit: 'mm', note: 'Up the wall' },
    cavityBattens: { typical: 600, unit: 'mm' },
  },

  mesh: {
    '665': { areaPerSheet: 4.8, size: '2400×6000', unit: 'm²' },
    '663': { areaPerSheet: 4.8, size: '2400×6000', unit: 'm²' },
  },
};

// ============================================================================
// 4. LABOUR RATES (Auckland, NZD)
// ============================================================================

export const LABOUR_RATES = {
  builder: {
    rate: 95,
    unit: 'hr',
    description: 'Qualified builder (LBP)'
  },
  apprentice: {
    rate: 30,
    unit: 'hr',
    description: 'Apprentice (1st-2nd year)'
  },
  apprenticeSenior: {
    rate: 45,
    unit: 'hr',
    description: 'Apprentice (3rd-4th year)'
  },
  labourer: {
    rate: 45,
    unit: 'hr',
    description: 'General labourer'
  },
};

// Excluded trades - these quote separately
export const EXCLUDED_TRADES = [
  'Electrician',
  'Plumber',
  'Gasfitter',
  'Tiler',
  'Painter',
  'Plasterer',
  'Roofer (specialist)',
  'Glazier',
  'Landscaper',
];

// ============================================================================
// 5. BUILD RATES (typical hours per unit)
// ============================================================================

export const BUILD_RATES = {
  framing: {
    wallFraming: { rate: '1.5-2', unit: 'm²/hr', description: 'Wall framing' },
    floorFraming: { rate: '2-3', unit: 'm²/hr', description: 'Floor framing' },
    roofFraming: { rate: '1-1.5', unit: 'm²/hr', description: 'Roof framing (stick built)' },
  },
  cladding: {
    weatherboard: { rate: '2-3', unit: 'm²/hr', description: 'Weatherboard installation' },
    sheetCladding: { rate: '4-5', unit: 'm²/hr', description: 'Sheet cladding (James Hardie etc)' },
  },
  lining: {
    GIB: { rate: '4-6', unit: 'm²/hr', description: 'GIB fixing' },
    GIBStopping: { rate: '8-10', unit: 'm²/hr', description: 'GIB stopping (per coat)' },
  },
  roofing: {
    longRun: { rate: '3-5', unit: 'm²/hr', description: 'Long run roofing' },
    tiles: { rate: '2-3', unit: 'm²/hr', description: 'Roof tiles' },
  },
  decking: {
    framing: { rate: '2-3', unit: 'm²/hr', description: 'Deck framing' },
    boards: { rate: '3-4', unit: 'm²/hr', description: 'Deck boards' },
    combined: { rate: '1-1.5', unit: 'm²/hr', description: 'Complete deck (framing + boards)' },
  },
  fencing: {
    timber: { rate: '2-3', unit: 'lm/hr', description: 'Timber fence' },
  },
  trim: {
    skirting: { rate: '10-15', unit: 'lm/hr', description: 'Skirting installation' },
    architrave: { rate: '8-12', unit: 'lm/hr', description: 'Architrave installation' },
    doors: { rate: '1-1.5', unit: 'doors/hr', description: 'Interior door hanging' },
  },
};

// ============================================================================
// 6. HELPER FUNCTIONS
// ============================================================================

/**
 * Convert a non-NZ term to the correct NZ term
 * @param {string} term - The term to convert
 * @returns {string} - The NZ term, or original if no match
 */
export function toNZTerm(term) {
  const lookup = TERM_LOOKUP[term.toLowerCase()];
  return lookup || term;
}

/**
 * Check if a unit abbreviation is valid
 * @param {string} unit - The unit to check
 * @returns {boolean}
 */
export function isValidUnit(unit) {
  return Object.keys(NZ_UNITS.approved).includes(unit);
}

/**
 * Get the correct unit for a banned abbreviation
 * @param {string} unit - The banned unit
 * @returns {string|null} - Correction message or null if not banned
 */
export function getUnitCorrection(unit) {
  return NZ_UNITS.banned[unit.toLowerCase()] || null;
}

/**
 * Calculate sheets needed for an area
 * @param {number} area - Area in m²
 * @param {number} sheetArea - Area per sheet in m²
 * @param {number} wastage - Wastage percentage (default 10%)
 * @returns {number} - Number of sheets (rounded up)
 */
export function sheetsNeeded(area, sheetArea = 2.88, wastage = 10) {
  return Math.ceil((area / sheetArea) * (1 + wastage / 100));
}

/**
 * Calculate studs needed for a wall length
 * @param {number} lengthMm - Wall length in mm
 * @param {number} centres - Stud centres in mm (default 600)
 * @returns {number} - Number of studs
 */
export function studsNeeded(lengthMm, centres = 600) {
  return Math.ceil(lengthMm / centres) + 1;
}

/**
 * Generate the glossary summary for AI system prompt
 * @returns {string} - Formatted glossary for system prompt
 */
export function getGlossaryForPrompt() {
  let prompt = `
═══════════════════════════════════════════════════════════════
                    NZ CONSTRUCTION GLOSSARY
═══════════════════════════════════════════════════════════════

MANDATORY UNIT ABBREVIATIONS (use ONLY these):
• lm = Lineal metre (timber, skirting, gutters)
• m² = Square metre (sheets, flooring, roofing)
• m³ = Cubic metre (concrete, excavation)
• ea = Each (posts, doors, fittings)
• pr = Pair (hinges, handles)
• kg = Kilogram (bulk nails/screws)
• L = Litre (paint, sealant)
• pk = Pack (fixings packs)
• bag = Bag (concrete mix, grout)
• sht = Sheet (GIB, plywood)
• roll = Roll (wrap, membrane)
• tube = Tube (silicone, adhesive)
• box = Box (screws, nails)
• len = Length (standard timber)
• set = Set (door hardware)

NEVER USE: m (alone), sqm, cbm, linear, piece, pce, unit

NZ TERMINOLOGY (use these terms):
• Noggin (not dwang/blocking)
• Bottom plate (not sole plate)
• Lintel (not header)
• GIB (not drywall/sheetrock)
• Skirting (not baseboard)
• Architrave (not door casing)
• Spouting (not gutter/eavestrough)
• Weatherboard (not clapboard/siding)
• Boxing (not formwork/shuttering)
• Hardfill (not crusher dust)
• Coach screw (not lag bolt)
• Corrugate (not corrugated iron)

STANDARD FRAMING SIZES (mm):
• 90×45 - Standard studs, noggins
• 140×45 - Load-bearing, lintels
• 190×45 - Lintels, beams
• 240×45 - Large beams
• Lengths: 2.4, 3.0, 3.6, 4.2, 4.8, 5.4, 6.0m

STANDARD SPACINGS (centres):
• Studs: 600mm (standard), 400mm (bracing)
• Joists: 400/450/600mm
• Noggins: 800mm up wall
• Purlins: 900mm typical

SHEET SIZES:
• GIB: 1200×2400 (2.88m²), 1200×2700 (3.24m²)
• Plywood/MDF: 1200×2400 (2.88m²)
• Mesh 665: 2400×6000 (4.8m² coverage)

TIMBER TREATMENT:
• H1.2 - Interior framing
• H3.1 - Wet area framing (bathrooms)
• H3.2 - Exterior above ground
• H4 - Ground contact
• H5 - In-ground
`;

  return prompt;
}

// ============================================================================
// 7. EXPORT ALL
// ============================================================================

export default {
  NZ_UNITS,
  NZ_TERMINOLOGY,
  TERM_LOOKUP,
  STANDARD_SIZES,
  LABOUR_RATES,
  EXCLUDED_TRADES,
  BUILD_RATES,
  toNZTerm,
  isValidUnit,
  getUnitCorrection,
  sheetsNeeded,
  studsNeeded,
  getGlossaryForPrompt,
};
