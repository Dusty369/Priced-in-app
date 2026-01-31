// Parse materials from the original file
const fs = require('fs');

const raw = fs.readFileSync('../Priced-in-app/Price in app code', 'utf8');

// Find lines that match the material format: Category|Subcategory|Name|Price|Unit|Code
const lines = raw.split('\n').filter(line => {
  const parts = line.split('|');
  return parts.length >= 6 && !isNaN(parseFloat(parts[3])) && parts[3].trim() !== '';
});

const materials = lines.map((line, idx) => {
  const parts = line.split('|');
  return {
    id: idx + 1,
    category: parts[0]?.trim() || 'Other',
    subcategory: parts[1]?.trim() || '',
    name: parts[2]?.trim() || '',
    price: parseFloat(parts[3]) || 0,
    unit: parts[4]?.trim() || 'EACH',
    code: parts[5]?.trim() || ''
  };
}).filter(m => m.name && m.price > 0);

console.log(`Parsed ${materials.length} materials`);

// Get unique categories
const categories = [...new Set(materials.map(m => m.category))];
console.log(`Categories: ${categories.join(', ')}`);

fs.writeFileSync('src/data/materials.json', JSON.stringify(materials, null, 2));
console.log('Saved to src/data/materials.json');
