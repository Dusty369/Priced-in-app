#!/usr/bin/env node
/**
 * Reimport Carters materials from CSV
 * Run: node scripts/reimport-materials.js
 */

const fs = require('fs');
const path = require('path');
const { importMaterials, normalizeDimensions, extractTreatment, extractLength, determinePackaging } = require('../src/lib/importMaterials');

const cartersPath = path.join(__dirname, '../data/carters-full.csv');
const outputPath = path.join(__dirname, '../src/data/materials-normalized.json');

console.log('=== Carters Materials Import ===\n');

if (!fs.existsSync(cartersPath)) {
  console.error(`Error: ${cartersPath} not found`);
  console.log('Place carters-full.csv in ./data/ directory');
  process.exit(1);
}

const materials = importMaterials(cartersPath);

// Stats
const stats = {
  total: materials.length,
  withDimensions: 0,
  withTreatment: 0,
  withLength: 0,
  categories: {},
  treatments: {},
  packagingTypes: {}
};

materials.forEach(m => {
  if (m.dimensions) stats.withDimensions++;
  if (m.treatment) {
    stats.withTreatment++;
    stats.treatments[m.treatment] = (stats.treatments[m.treatment] || 0) + 1;
  }
  if (m.productLength) stats.withLength++;
  stats.categories[m.category] = (stats.categories[m.category] || 0) + 1;
  stats.packagingTypes[m.packaging?.unitType] = (stats.packagingTypes[m.packaging?.unitType] || 0) + 1;
});

console.log('\n=== Stats ===');
console.log('Total materials:', stats.total);
console.log('With dimensions:', stats.withDimensions);
console.log('With treatment:', stats.withTreatment);
console.log('With length:', stats.withLength);

console.log('\nTreatment codes:', stats.treatments);

console.log('\nTop categories:');
Object.entries(stats.categories)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([k, v]) => console.log(`  ${k}: ${v}`));

console.log('\nPackaging types:', stats.packagingTypes);

// Sample items
console.log('\n=== Sample Timber ===');
materials.filter(m => m.treatment).slice(0, 3).forEach(m => {
  console.log(`${m.name.substring(0, 55)}`);
  console.log(`  dim: ${m.dimensions} | treat: ${m.treatment} | len: ${m.productLength}m`);
});

console.log('\n=== Sample Screws ===');
materials.filter(m => /deck.*screw/i.test(m.name)).slice(0, 3).forEach(m => {
  console.log(`${m.name.substring(0, 55)}`);
  console.log(`  pkg: ${JSON.stringify(m.packaging)}`);
});

// Save
fs.writeFileSync(outputPath, JSON.stringify(materials, null, 2));
console.log(`\n✓ Saved ${materials.length} materials to ${outputPath}`);
