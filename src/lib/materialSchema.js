/**
 * Structured Material Schema
 *
 * Defines the format for parsed material data, making it easier for:
 * - AI to understand dimensions, treatment, and specifications
 * - Users to filter/browse by size, treatment, length
 * - Search to match on structured fields
 */

export const MaterialSchema = {
  // Unique identifier
  id: 'string',

  // Original display name (kept for familiarity)
  displayName: 'string',

  // Parsed, structured data
  parsed: {
    // Dimensions in mm
    width: 'number|null',       // 70, 90, 140, etc.
    depth: 'number|null',       // 45, 90, etc.
    length: 'number|null',      // Always in mm (5400 for 5.4m)
    lengthDisplay: 'string|null', // "5.4m", "2.4m", etc.

    // Classification
    type: 'string|null',        // framing, decking, post, fencePost, pile, sheet, fixing, etc.
    species: 'string|null',     // Radiata, Kwila, Vitex, Cedar, etc.
    grade: 'string|null',       // SG8, SG6, SG10, MSG8, etc.
    treatment: 'string|null',   // H1.2, H3.1, H3.2, H4, H5, etc.
    finish: 'string|null',      // KD, GRN, Primed, etc.

    // For fixings
    packSize: 'number|null',    // 500, 1750, etc. (null if sold individually)
    fixingType: 'string|null',  // screw, nail, bolt, hanger, bracket, anchor, etc.
    fixingMaterial: 'string|null', // Galvanised, Stainless 304, Stainless 316, Zinc, etc.
    diameter: 'string|null',    // M10, M12, 10g, 14g, etc.
    fixingLength: 'number|null', // Length of screw/nail in mm

    // For sheets
    sheetWidth: 'number|null',  // 1200, 900, etc.
    sheetHeight: 'number|null', // 2400, 2700, 3000, etc.
    thickness: 'number|null',   // 10, 13, 18, etc.

    // For GIB/plasterboard
    gibType: 'string|null',     // Standard, Aqualine, Fyreline, Braceline, etc.

    // For insulation
    rValue: 'string|null',      // R2.2, R3.2, R6.0, etc.
  },

  // Pricing
  price: 'number',
  unit: 'string',               // Normalised: lm, m², ea, box, bag, kg, len, etc.
  unitDisplay: 'string',        // Original: "per LGTH", "per BOX", "per EA"

  // Source
  supplier: 'string',           // Carters
  code: 'string',               // Supplier product code
  category: 'string',           // Original category from source

  // AI helpers
  aiSearchTerms: 'string[]',    // Array of search terms
  aiDescription: 'string',      // Simplified: "90×45 H3.2 framing timber 3.0m"
};

// Type classifications
export const MATERIAL_TYPES = {
  // Timber
  framing: 'Framing Timber',
  bearer: 'Bearer',
  joist: 'Joist',
  rafter: 'Rafter',
  purlin: 'Purlin',
  batten: 'Batten',
  decking: 'Decking',
  post: 'Post',
  fencePost: 'Fence Post',
  pile: 'Structural Pile',
  weatherboard: 'Weatherboard',

  // Sheets
  plywood: 'Plywood',
  particleboard: 'Particle Board',
  mdf: 'MDF',
  gib: 'GIB/Plasterboard',
  cementBoard: 'Cement Board',

  // Fixings
  screw: 'Screw',
  nail: 'Nail',
  bolt: 'Bolt',
  hanger: 'Joist Hanger',
  bracket: 'Bracket',
  anchor: 'Anchor',
  stirrup: 'Post Stirrup',

  // Building materials
  concrete: 'Concrete/Cement',
  insulation: 'Insulation',
  membrane: 'Membrane/Wrap',
  flashing: 'Flashing',

  // Other
  hardware: 'Hardware',
  adhesive: 'Adhesive',
  other: 'Other',
};

// Treatment levels with descriptions
export const TREATMENTS = {
  'H1.2': { name: 'H1.2', use: 'Interior framing, dry conditions' },
  'H3.1': { name: 'H3.1', use: 'Wet area framing (bathrooms)' },
  'H3.2': { name: 'H3.2', use: 'Exterior above ground, decking, bearers' },
  'H4': { name: 'H4', use: 'Ground contact (fence posts)' },
  'H5': { name: 'H5', use: 'In-ground structural (piles)' },
  'H6': { name: 'H6', use: 'Marine/severe conditions' },
};

export default MaterialSchema;
