/**
 * Carters materials import system
 * Imports from STANDARD Price Book CSV export
 */

const fs = require('fs');
const path = require('path');

// Normalize dimension format: 075X050 or 100 X 75 → "90 X 45"
function normalizeDimensions(text) {
  if (!text) return null;
  const match = text.match(/(\d+)\s*[xX×]\s*(\d+)/);
  if (!match) return null;
  return `${parseInt(match[1])} X ${parseInt(match[2])}`;
}

// Extract NZ timber treatment code (H1.2, H3.1, H3.2, H4, H5, H6)
function extractTreatment(text) {
  if (!text) return null;
  const match = text.match(/\bH(1\.2|3\.1|3\.2|4|5|6)\b/i);
  return match ? ('H' + match[1]).toUpperCase() : null;
}

// Extract length from product name (e.g., "4.8M" or "2400")
function extractLength(text) {
  if (!text) return null;
  const meterMatch = text.match(/(\d+\.?\d*)\s*M(?:TR|ETRE)?(?!\w)/i);
  if (meterMatch) return parseFloat(meterMatch[1]);
  const mmMatch = text.match(/\b(\d{4})\b(?!\s*[xX×])/);
  if (mmMatch) return parseInt(mmMatch[1]) / 1000;
  return null;
}

// Determine unit type and packaging from unit code and product name
function determinePackaging(unit, name) {
  const unitUpper = (unit || '').toUpperCase();
  const nameUpper = (name || '').toUpperCase();

  // Extract pack size from name
  let packSize = null;
  const packMatch1 = nameUpper.match(/(?:PKT|PK|BOX|JAR|PACK|BUCKET)\s*(?:OF\s*)?(\d+)/i);
  if (packMatch1) packSize = parseInt(packMatch1[1]);
  if (!packSize) {
    const packMatch2 = nameUpper.match(/(\d+)\s*(?:PKT|PK|BX|BOX|PACK)/i);
    if (packMatch2) packSize = parseInt(packMatch2[1]);
  }
  if (!packSize) {
    const packMatch3 = nameUpper.match(/PACK\s*OF\s*(\d+)/i);
    if (packMatch3) packSize = parseInt(packMatch3[1]);
  }

  // Fasteners (screws, nails, bolts)
  if (/SCREW|NAIL|BOLT|STAPLE|BRAD/i.test(nameUpper)) {
    return {
      unitType: 'box',
      unitsPerPackage: packSize || 200,
      sellUnit: unitUpper === 'EACH' ? 'EA' : (unitUpper || 'BOX')
    };
  }

  // Timber with specific length
  if (/LGTH|LENGTH/i.test(unitUpper) ||
      ((/EACH|EA/i.test(unitUpper)) && /TIMBER|PINE|TREATED|H3|H4|BEARER|JOIST|RAFTER|STUD/i.test(nameUpper))) {
    return { unitType: 'length', unitsPerPackage: 1, sellUnit: 'EA' };
  }

  // Lineal meter timber
  if (/LM|MTR|METER|METRE/i.test(unitUpper)) {
    return { unitType: 'meter', unitsPerPackage: 1, sellUnit: 'LM' };
  }

  // Liquids (liters)
  if (/(\d+)\s*L(?:T|TR|ITRE)?(?!\w)/i.test(nameUpper)) {
    const liters = nameUpper.match(/(\d+)\s*L(?:T|TR|ITRE)?/i);
    return { unitType: 'tin', unitsPerPackage: liters ? parseInt(liters[1]) : 1, sellUnit: 'LT' };
  }

  // Bags (concrete, cement)
  if (/(\d+)\s*KG|CONCRETE|CEMENT|MORTAR/i.test(nameUpper)) {
    const kg = nameUpper.match(/(\d+)\s*KG/i);
    return { unitType: 'bag', unitsPerPackage: kg ? parseInt(kg[1]) : 20, sellUnit: 'BAG' };
  }

  // Sheets
  if (/SHEET|GIB|PLYWOOD|PLY|MDF|PARTICLEBOARD|HARDBOARD/i.test(nameUpper)) {
    return { unitType: 'sheet', unitsPerPackage: 1, sellUnit: 'SHT' };
  }

  // Rolls
  if (/ROLL|WRAP|MEMBRANE/i.test(nameUpper)) {
    return { unitType: 'roll', unitsPerPackage: 1, sellUnit: 'ROLL' };
  }

  // Default
  return { unitType: 'each', unitsPerPackage: 1, sellUnit: unitUpper || 'EA' };
}

// Parse Carters full CSV format (STANDARD Price Book export)
// Columns: Date,PriceBook,AcctNum,AcctName,Branch,Category,Group,SubGroup,Description,SKU,Unit,Price,EffectiveDate
function parseCartersCSV(csvText) {
  const lines = csvText.split('\n');
  const materials = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const cols = line.split(',');
    if (cols.length < 12) continue;

    const [date, priceBook, accountNum, accountName, branch,
           category, group, subGroup, description, sku,
           unit, priceStr, effectiveDate] = cols;

    if (!description || !priceStr) continue;

    const price = parseFloat(priceStr.replace(/[$,]/g, ''));
    if (isNaN(price)) continue;

    const dimensions = normalizeDimensions(description);
    const treatment = extractTreatment(description);
    const productLength = extractLength(description);
    const packaging = determinePackaging(unit, description);

    materials.push({
      id: `CART-${sku?.trim()}`,
      sku: sku?.trim(),
      code: sku?.trim(),
      supplier: 'Carters',
      name: description.trim(),
      category: category?.trim() || 'Other',
      subcategory: group?.trim() || '',
      subsubcategory: subGroup?.trim() || '',
      dimensions,
      treatment,
      unit: unit?.trim(),
      packaging,
      productLength,
      price,
      priceUpdated: effectiveDate?.trim() || new Date().toISOString().split('T')[0],
      priceSource: 'Carters'
    });
  }

  return materials;
}

// Main import function
function importMaterials(cartersPath) {
  const cartersCSV = fs.readFileSync(cartersPath, 'utf8');
  const materials = parseCartersCSV(cartersCSV);

  // Deduplicate by name
  const seen = new Set();
  const deduplicated = materials.filter(m => {
    if (seen.has(m.name)) return false;
    seen.add(m.name);
    return true;
  });

  console.log(`Imported ${deduplicated.length} Carters materials (${materials.length - deduplicated.length} duplicates removed)`);
  return deduplicated;
}

module.exports = {
  importMaterials,
  parseCartersCSV,
  normalizeDimensions,
  extractTreatment,
  extractLength,
  determinePackaging
};
