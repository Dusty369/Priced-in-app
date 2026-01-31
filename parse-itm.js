// Parse ITM Excel price list and merge with Carters
const XLSX = require('xlsx');
const fs = require('fs');

// Load ITM data
const workbook = XLSX.readFile('src/data/itm-pricelist.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Parse ITM materials (skip header rows)
const itmMaterials = rows.slice(4)
  .filter(row => row[0] && row[1] && row[3]) // Has ID, name, price
  .map((row, idx) => ({
    id: 100000 + idx, // Offset IDs to avoid collision with Carters
    category: categorizeProduct(row[1]),
    subcategory: 'ITM',
    name: row[1],
    price: parseFloat(row[3]) || 0,
    unit: row[2] || 'EA',
    code: row[0],
    supplier: 'ITM'
  }))
  .filter(m => m.price > 0);

// Simple categorization based on product name
function categorizeProduct(name) {
  const n = name.toLowerCase();
  
  if (n.includes('screw') || n.includes('nail') || n.includes('bolt') || n.includes('anchor') || n.includes('fixing')) 
    return 'Fixings & Fasteners';
  if (n.includes('timber') || n.includes('pine') || n.includes('radiata') || n.includes('framing') || n.includes('stud'))
    return 'Framing';
  if (n.includes('ply') || n.includes('mdf') || n.includes('particle') || n.includes('sheet'))
    return 'Sheet Products';
  if (n.includes('insulation') || n.includes('batts') || n.includes('pink'))
    return 'Insulation';
  if (n.includes('cement') || n.includes('concrete') || n.includes('mortar'))
    return 'Concrete & Cement';
  if (n.includes('silicone') || n.includes('sealant') || n.includes('adhesive') || n.includes('glue'))
    return 'Adhesives & Sealants';
  if (n.includes('paint') || n.includes('stain') || n.includes('primer'))
    return 'Paint & Coatings';
  if (n.includes('pipe') || n.includes('plumb') || n.includes('valve') || n.includes('fitting'))
    return 'Plumbing';
  if (n.includes('electric') || n.includes('cable') || n.includes('wire') || n.includes('switch'))
    return 'Electrical';
  if (n.includes('door') || n.includes('handle') || n.includes('hinge') || n.includes('lock'))
    return 'Doors & Hardware';
  if (n.includes('roof') || n.includes('gutter') || n.includes('flashing'))
    return 'Roofing';
  if (n.includes('clad') || n.includes('weatherboard') || n.includes('linear'))
    return 'Cladding';
  if (n.includes('deck') || n.includes('balust'))
    return 'Decking';
  if (n.includes('tool') || n.includes('drill') || n.includes('saw') || n.includes('blade'))
    return 'Tools';
  if (n.includes('sand') || n.includes('abrasive') || n.includes('disc'))
    return 'Abrasives';
  
  return 'Other';
}

console.log(`Parsed ${itmMaterials.length} ITM materials`);

// Get category breakdown
const categories = {};
itmMaterials.forEach(m => {
  categories[m.category] = (categories[m.category] || 0) + 1;
});
console.log('\nITM Categories:');
Object.entries(categories).sort((a,b) => b[1] - a[1]).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count}`);
});

// Load existing Carters materials
const cartersMaterials = JSON.parse(fs.readFileSync('src/data/materials.json', 'utf8'));
console.log(`\nExisting Carters materials: ${cartersMaterials.length}`);

// Add supplier tag to Carters
const taggedCarters = cartersMaterials.map(m => ({ ...m, supplier: 'Carters' }));

// Merge both
const allMaterials = [...taggedCarters, ...itmMaterials];
console.log(`\nTotal combined: ${allMaterials.length}`);

// Save merged file
fs.writeFileSync('src/data/materials.json', JSON.stringify(allMaterials, null, 2));
console.log('\nSaved merged materials.json');

// Also save ITM separately for reference
fs.writeFileSync('src/data/itm-materials.json', JSON.stringify(itmMaterials, null, 2));
console.log('Saved itm-materials.json');
