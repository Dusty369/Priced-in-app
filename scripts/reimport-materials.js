#!/usr/bin/env node
/**
 * Reimport and normalize materials from source files
 * Run: node scripts/reimport-materials.js
 */

const fs = require('fs');
const path = require('path');
const { importMaterials, parseJSON, normalizeDimensions, extractTreatment, extractLength, determinePackaging, categorizeProduct } = require('../src/lib/importMaterials');

const dataDir = path.join(__dirname, '../src/data');
const outputPath = path.join(dataDir, 'materials-normalized.json');

// Find all source files
const sourceFiles = [];

// Check for JSON sources
const itmJson = path.join(__dirname, '../itm_materials.json');
const itmDataJson = path.join(dataDir, 'itm-materials.json');
const materialsJson = path.join(dataDir, 'materials.json');
const processedJson = path.join(dataDir, 'materials-processed.json');

if (fs.existsSync(itmJson)) sourceFiles.push(itmJson);
if (fs.existsSync(itmDataJson)) sourceFiles.push(itmDataJson);
if (fs.existsSync(materialsJson)) sourceFiles.push(materialsJson);

// Check for CSV sources
const csvDir = path.join(__dirname, '../data');
if (fs.existsSync(csvDir)) {
  fs.readdirSync(csvDir).forEach(file => {
    if (file.endsWith('.csv')) {
      sourceFiles.push(path.join(csvDir, file));
    }
  });
}

console.log('=== Materials Import Tool ===\n');

if (sourceFiles.length === 0) {
  console.log('No source files found. Checking existing processed data...\n');

  if (fs.existsSync(processedJson)) {
    console.log(`Found: ${processedJson}`);
    const existing = JSON.parse(fs.readFileSync(processedJson, 'utf8'));
    console.log(`Contains ${existing.length} materials\n`);

    // Re-normalize existing data
    console.log('Re-normalizing existing data...\n');

    const normalized = existing.map((item, idx) => {
      const dimensions = normalizeDimensions(item.name);
      const treatment = extractTreatment(item.name);
      const productLength = extractLength(item.name);
      const packaging = item.packaging || determinePackaging(item.unit, item.name);
      const { category, subcategory } = categorizeProduct(item.name, item.category, item.subcategory);

      return {
        id: item.id || idx + 1,
        sku: item.code || item.sku,
        code: item.code || item.sku,
        supplier: item.supplier || 'Unknown',
        name: item.name,
        category,
        subcategory,
        dimensions,
        treatment,
        unit: item.unit,
        packaging,
        productLength,
        price: item.price,
        priceUpdated: item.priceUpdated || '2026-02-01',
        priceSource: item.priceSource || item.supplier
      };
    });

    // Stats
    const stats = {
      total: normalized.length,
      bySupplier: {},
      byCategory: {},
      withDimensions: 0,
      withTreatment: 0,
      withLength: 0
    };

    normalized.forEach(m => {
      stats.bySupplier[m.supplier] = (stats.bySupplier[m.supplier] || 0) + 1;
      stats.byCategory[m.category] = (stats.byCategory[m.category] || 0) + 1;
      if (m.dimensions) stats.withDimensions++;
      if (m.treatment) stats.withTreatment++;
      if (m.productLength) stats.withLength++;
    });

    console.log('=== Normalization Results ===\n');
    console.log(`Total materials: ${stats.total}`);
    console.log(`With dimensions: ${stats.withDimensions}`);
    console.log(`With treatment: ${stats.withTreatment}`);
    console.log(`With length: ${stats.withLength}`);
    console.log('\nBy supplier:');
    Object.entries(stats.bySupplier).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
    console.log('\nBy category:');
    Object.entries(stats.byCategory).sort((a,b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

    // Sample output
    console.log('\n=== Sample Normalized Items ===\n');

    // Find timber items
    const timberSamples = normalized.filter(m => m.treatment || m.dimensions).slice(0, 3);
    console.log('Timber samples:');
    timberSamples.forEach(m => {
      console.log(`  ${m.name}`);
      console.log(`    dimensions: ${m.dimensions}, treatment: ${m.treatment}, length: ${m.productLength}m`);
      console.log(`    packaging: ${JSON.stringify(m.packaging)}`);
    });

    // Find screw items
    const screwSamples = normalized.filter(m => /screw/i.test(m.name)).slice(0, 3);
    console.log('\nScrew samples:');
    screwSamples.forEach(m => {
      console.log(`  ${m.name}`);
      console.log(`    packaging: ${JSON.stringify(m.packaging)}`);
    });

    // Save normalized
    fs.writeFileSync(outputPath, JSON.stringify(normalized, null, 2));
    console.log(`\n✓ Saved ${normalized.length} normalized materials to ${outputPath}`);

  } else {
    console.log('No source files found. Place CSV or JSON files in:');
    console.log('  - ./data/itm-prices.csv');
    console.log('  - ./data/carters-prices.csv');
    console.log('  - ./src/data/materials.json');
    process.exit(1);
  }
} else {
  console.log('Found source files:');
  sourceFiles.forEach(f => console.log(`  - ${path.basename(f)}`));
  console.log('');

  const materials = importMaterials(...sourceFiles);

  fs.writeFileSync(outputPath, JSON.stringify(materials, null, 2));
  console.log(`\n✓ Saved ${materials.length} normalized materials to ${outputPath}`);
}
