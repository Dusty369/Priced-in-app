/**
 * Add packaging data to materials for accurate quantity calculations
 * Run: node scripts/add-packaging-data.js
 */

const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../src/data/materials-processed.json');
const outputPath = path.join(__dirname, '../src/data/materials-processed.json');

const materials = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
console.log(`Processing ${materials.length} materials...`);

// Packaging rules based on product name patterns
const PACKAGING_RULES = [
  // SCREWS & NAILS - boxes/packs
  {
    match: /screw|nail|staple/i,
    detect: (name) => {
      // Extract pack size from name: "BOX 200", "PKT 500", "PK60"
      const packMatch = name.match(/(?:box|pkt|pk|pack)\s*(\d+)/i);
      if (packMatch) return parseInt(packMatch[1]);
      // Common pack sizes if not specified
      if (/box\s*1000/i.test(name)) return 1000;
      if (/box\s*500/i.test(name)) return 500;
      return 200; // default screw box
    },
    unitType: 'box',
    sellUnit: 'BOX'
  },

  // PAINT & STAIN - tins/liters
  {
    match: /paint|stain|finish|varnish|sealer|primer|enamel|lacquer/i,
    detect: (name) => {
      const litreMatch = name.match(/(\d+(?:\.\d+)?)\s*(?:l|lt|ltr|litre)/i);
      if (litreMatch) return parseFloat(litreMatch[1]);
      if (/20l/i.test(name)) return 20;
      if (/10l/i.test(name)) return 10;
      if (/4l/i.test(name)) return 4;
      return 5; // default 5L tin
    },
    unitType: 'tin',
    sellUnit: 'EA'
  },

  // CONCRETE & CEMENT - bags
  {
    match: /concrete|cement|mortar|grout/i,
    detect: (name) => {
      const kgMatch = name.match(/(\d+)\s*kg/i);
      if (kgMatch) return parseInt(kgMatch[1]);
      return 20; // standard 20kg bag
    },
    unitType: 'bag',
    sellUnit: 'BAG'
  },

  // ADHESIVES & SEALANTS - tubes/cartridges
  {
    match: /adhesive|sealant|silicone|sikaflex|liquid nail|caulk|mastic/i,
    detect: (name) => {
      const mlMatch = name.match(/(\d+)\s*ml/i);
      if (mlMatch) return parseInt(mlMatch[1]);
      return 300; // standard cartridge
    },
    unitType: 'tube',
    sellUnit: 'EA'
  },

  // GIB/PLASTERBOARD - sheets
  {
    match: /gib|plasterboard|fyreline|aqualine|braceline/i,
    detect: () => 1,
    unitType: 'sheet',
    sellUnit: 'SHT'
  },

  // PLYWOOD - sheets
  {
    match: /plywood|ply\s|mdf|particle\s*board|shadowclad/i,
    detect: () => 1,
    unitType: 'sheet',
    sellUnit: 'SHT'
  },

  // TIMBER FRAMING - per length or per meter
  {
    match: /\d+\s*x\s*\d+.*(?:rad|radiata|sg8|msg8|h[1-5])/i,
    detect: (name, unit) => {
      if (unit === 'MTR' || unit === 'LM') return 1; // per meter
      // Check for length in name
      const lengthMatch = name.match(/(\d+(?:\.\d+)?)\s*m(?:\s|$)/i);
      if (lengthMatch) return parseFloat(lengthMatch[1]);
      return 1;
    },
    unitType: (name, unit) => (unit === 'MTR' || unit === 'LM') ? 'meter' : 'length',
    sellUnit: (name, unit) => (unit === 'MTR' || unit === 'LM') ? 'MTR' : 'LGTH'
  },

  // DECKING - per meter
  {
    match: /decking/i,
    detect: () => 1,
    unitType: 'meter',
    sellUnit: 'LM'
  },

  // INSULATION - packs/rolls
  {
    match: /batts|insulation|earthwool/i,
    detect: (name) => {
      const packMatch = name.match(/(\d+)\s*(?:pack|pk)/i);
      if (packMatch) return parseInt(packMatch[1]);
      return 1;
    },
    unitType: 'pack',
    sellUnit: 'PK'
  },

  // BUILDING WRAP/MEMBRANES - rolls
  {
    match: /wrap|membrane|polythene|dpc|building\s*paper/i,
    detect: (name) => {
      const sqmMatch = name.match(/(\d+)\s*(?:m2|sqm|m²)/i);
      if (sqmMatch) return parseInt(sqmMatch[1]);
      return 1;
    },
    unitType: 'roll',
    sellUnit: 'ROLL'
  },

  // BRACKETS/HANGERS - each
  {
    match: /bracket|hanger|stirrup|l\/lok|bowmac|connector/i,
    detect: () => 1,
    unitType: 'each',
    sellUnit: 'EA'
  }
];

// Default for unmatched items
const DEFAULT_PACKAGING = {
  unitType: 'each',
  unitsPerPackage: 1,
  sellUnit: 'EA'
};

let stats = { updated: 0, defaulted: 0 };

materials.forEach(m => {
  const name = m.name || '';
  const unit = m.unit || '';

  let matched = false;

  for (const rule of PACKAGING_RULES) {
    if (rule.match.test(name)) {
      const unitsPerPackage = rule.detect(name, unit);
      const unitType = typeof rule.unitType === 'function' ? rule.unitType(name, unit) : rule.unitType;
      const sellUnit = typeof rule.sellUnit === 'function' ? rule.sellUnit(name, unit) : rule.sellUnit;

      m.packaging = {
        unitType,
        unitsPerPackage,
        sellUnit
      };
      matched = true;
      stats.updated++;
      break;
    }
  }

  if (!matched) {
    m.packaging = { ...DEFAULT_PACKAGING };
    stats.defaulted++;
  }
});

// Summary by category
const byCategory = {};
materials.forEach(m => {
  const cat = m.category || 'Unknown';
  const ut = m.packaging?.unitType || 'unknown';
  if (!byCategory[cat]) byCategory[cat] = {};
  if (!byCategory[cat][ut]) byCategory[cat][ut] = 0;
  byCategory[cat][ut]++;
});

console.log('\n=== Packaging Summary by Category ===\n');
Object.keys(byCategory).sort().forEach(cat => {
  console.log(`${cat}:`);
  Object.entries(byCategory[cat]).forEach(([ut, count]) => {
    console.log(`  ${ut}: ${count}`);
  });
});

console.log(`\nTotal: ${stats.updated} matched, ${stats.defaulted} defaulted`);

fs.writeFileSync(outputPath, JSON.stringify(materials, null, 2));
console.log(`\nSaved to ${outputPath}`);
