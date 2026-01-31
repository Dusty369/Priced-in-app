// Storage Keys
export const PROJECTS_KEY = 'priced-in-projects';
export const CURRENT_PROJECT_KEY = 'priced-in-current-project';
export const LABOUR_RATES_KEY = 'priced-in-labour-rates';
export const COMPANY_INFO_KEY = 'priced-in-company-info';

// Default labour rates (NZD/hour or /sqm) - NZ Auckland rates
export const DEFAULT_LABOUR_RATES = {
  builder: 95,
  labourer: 45,
  apprentice: 30,
  electrician: 105,    // $95-110/hr in Auckland
  plumber: 105,        // $95-110/hr in Auckland
  tiler: 120,          // $120/sqm in Auckland
  painter: 65,         // $60-65/hr in Auckland
  plasterer: 40        // $40/sqm in Auckland
};

// Labour role display names and min/max rates
export const LABOUR_ROLES = {
  builder: { label: 'Builder/Carpenter', min: 90, max: 110 },
  labourer: { label: 'Labourer', min: 40, max: 55 },
  apprentice: { label: 'Apprentice', min: 25, max: 35 },
  electrician: { label: 'Electrician', min: 95, max: 115 },
  plumber: { label: 'Plumber', min: 95, max: 115 },
  tiler: { label: 'Tiler', min: 110, max: 130 },
  painter: { label: 'Painter', min: 60, max: 70 },
  plasterer: { label: 'Plasterer', min: 35, max: 45 }
};

// Default company info
export const DEFAULT_COMPANY_INFO = {
  name: 'Your Company Name',
  phone: '',
  email: '',
  address: ''
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
