// Storage Keys
export const PROJECTS_KEY = 'priced-in-projects';
export const CURRENT_PROJECT_KEY = 'priced-in-current-project';
export const LABOUR_RATES_KEY = 'priced-in-labour-rates';
export const COMPANY_INFO_KEY = 'priced-in-company-info';

// Default labour rates (NZD/hour or /sqm) - NZ Auckland rates 2026
// Source: NZ Certified Builders, Master Builders Association, trade avg Feb 2026
// CPI adjustment: rates updated annually, ~3-4% increase typical
export const DEFAULT_LABOUR_RATES = {
  builder: 105,        // Qualified carpenter/builder
  labourer: 50,        // General labourer
  apprentice: 35,      // 3rd/4th year apprentice
  electrician: 115,    // Registered electrician
  plumber: 115,        // Registered plumber
  gasfitter: 120,      // Registered gasfitter
  tiler: 130,          // Per sqm rate for tiling
  painter: 70,         // Interior/exterior painter
  plasterer: 45,       // GIB stopper per sqm
  roofer: 95,          // Metal/tile roofing
  concreter: 90,       // Concrete work
  demolition: 75       // Demolition labour
};

// Labour rates metadata
export const LABOUR_RATES_META = {
  lastUpdated: '2026-02-01',
  region: 'Auckland',
  source: 'NZ Certified Builders / Master Builders Association',
  cpiNote: 'Adjust +3-4% annually for inflation'
};

// Labour role display names and min/max rates
export const LABOUR_ROLES = {
  builder: { label: 'Builder/Carpenter', min: 95, max: 120, unit: 'hr' },
  labourer: { label: 'Labourer', min: 45, max: 60, unit: 'hr' },
  apprentice: { label: 'Apprentice', min: 30, max: 40, unit: 'hr' },
  electrician: { label: 'Electrician', min: 105, max: 130, unit: 'hr' },
  plumber: { label: 'Plumber', min: 105, max: 130, unit: 'hr' },
  gasfitter: { label: 'Gasfitter', min: 110, max: 135, unit: 'hr' },
  tiler: { label: 'Tiler', min: 120, max: 150, unit: 'm²' },
  painter: { label: 'Painter', min: 65, max: 80, unit: 'hr' },
  plasterer: { label: 'Plasterer/GIB Stopper', min: 40, max: 55, unit: 'm²' },
  roofer: { label: 'Roofer', min: 85, max: 110, unit: 'hr' },
  concreter: { label: 'Concreter', min: 80, max: 100, unit: 'hr' },
  demolition: { label: 'Demolition', min: 65, max: 85, unit: 'hr' }
};

// Default company info
export const DEFAULT_COMPANY_INFO = {
  name: 'Your Company Name',
  phone: '',
  email: '',
  address: '',
  // Branding
  logo: null,              // Base64 data URI
  primaryColor: '#10b981', // Emerald-600 default
  // Quote terms
  termsAndConditions: '',
  paymentTerms: '',
  quoteValidity: 30        // Days
};

// Labour Item Presets
export const LABOUR_PRESETS = [
  { role: 'builder', hours: 8, description: 'Framing & assembly' },
  { role: 'builder', hours: 4, description: 'Decking installation' },
  { role: 'builder', hours: 6, description: 'Roof installation' },
  { role: 'builder', hours: 3, description: 'Carpentry work' },
  { role: 'electrician', hours: 4, description: 'Electrical installation' },
  { role: 'electrician', hours: 2, description: 'Power point installation' },
  { role: 'plumber', hours: 4, description: 'Plumbing installation' },
  { role: 'plumber', hours: 3, description: 'Pipe laying & fitting' },
  { role: 'tiler', hours: 8, description: 'Tile laying' },
  { role: 'painter', hours: 6, description: 'Painting & finishing' },
  { role: 'painter', hours: 4, description: 'Surface preparation' },
  { role: 'plasterer', hours: 8, description: 'Plastering & finishing' },
  { role: 'labourer', hours: 4, description: 'Material handling & cleanup' },
  { role: 'labourer', hours: 8, description: 'Excavation & site prep' },
  { role: 'apprentice', hours: 8, description: 'General site assistant' },
];
