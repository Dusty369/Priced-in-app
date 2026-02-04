/**
 * Add price timestamps to materials
 * Run: node scripts/add-price-timestamps.js
 */

const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../src/data/materials-processed.json');
const outputPath = path.join(__dirname, '../src/data/materials-processed.json');

const materials = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
console.log(`Processing ${materials.length} materials...`);

// Current date as baseline for price data
const priceDate = '2026-02-01';

materials.forEach(m => {
  // Add price metadata
  m.priceUpdated = priceDate;
  m.priceSource = m.supplier || 'Unknown';
});

fs.writeFileSync(outputPath, JSON.stringify(materials, null, 2));
console.log(`Added priceUpdated: ${priceDate} to all materials`);
console.log(`Saved to ${outputPath}`);
