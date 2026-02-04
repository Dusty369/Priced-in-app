/**
 * Normalized materials import system
 * Handles both CSV and JSON formats from ITM and Carters
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
  // Only match valid NZ treatment codes - must be word boundary to avoid false positives
  // H1.2 = interior dry, H3.1 = exterior coated, H3.2 = exterior exposed
  // H4 = ground contact, H5 = in-ground structural, H6 = marine
  const match = text.match(/\bH(1\.2|3\.1|3\.2|4|5|6)\b/i);
  return match ? ('H' + match[1]).toUpperCase() : null;
}

// Extract length from product name (e.g., "4.8M" or "2400")
function extractLength(text) {
  if (!text) return null;
  // Match explicit meter lengths like "4.8M" or "2.4M"
  const meterMatch = text.match(/(\d+\.?\d*)\s*M(?:TR|ETRE)?(?!\w)/i);
  if (meterMatch) return parseFloat(meterMatch[1]);

  // Match mm lengths that are clearly lengths (4-digit numbers not dimensions)
  const mmMatch = text.match(/\b(\d{4})\b(?!\s*[xX×])/);
  if (mmMatch) return parseInt(mmMatch[1]) / 1000;

  return null;
}

// Determine unit type and packaging from unit code and product name
function determinePackaging(unit, name) {
  const unitUpper = (unit || '').toUpperCase();
  const nameUpper = (name || '').toUpperCase();

  // Extract pack size from name - multiple patterns
  let packSize = null;

  // Pattern: "PKT 200", "BOX 250", "PACK 500"
  const packMatch1 = nameUpper.match(/(?:PKT|PK|BOX|JAR|PACK|BUCKET)\s*(?:OF\s*)?(\d+)/i);
  if (packMatch1) packSize = parseInt(packMatch1[1]);

  // Pattern: "200PKT", "250BX", "1000BX"
  if (!packSize) {
    const packMatch2 = nameUpper.match(/(\d+)\s*(?:PKT|PK|BX|BOX|PACK)/i);
    if (packMatch2) packSize = parseInt(packMatch2[1]);
  }

  // Pattern: "VALUE PACK OF 600", "PACK OF 200"
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

  // Timber with specific length (LGTH, EACH, EA)
  if (/LGTH|LENGTH/i.test(unitUpper) ||
      ((/EACH|EA/i.test(unitUpper)) && /TIMBER|PINE|TREATED|H3|H4|BEARER|JOIST|RAFTER|STUD/i.test(nameUpper))) {
    return {
      unitType: 'length',
      unitsPerPackage: 1,
      sellUnit: 'EA'
    };
  }

  // Lineal meter timber
  if (/LM|MTR|METER|METRE/i.test(unitUpper)) {
    return {
      unitType: 'meter',
      unitsPerPackage: 1,
      sellUnit: 'LM'
    };
  }

  // Liquids (liters)
  if (/(\d+)\s*L(?:T|TR|ITRE)?(?!\w)/i.test(nameUpper)) {
    const liters = nameUpper.match(/(\d+)\s*L(?:T|TR|ITRE)?/i);
    return {
      unitType: 'tin',
      unitsPerPackage: liters ? parseInt(liters[1]) : 1,
      sellUnit: 'LT'
    };
  }

  // Bags (concrete, cement, etc.)
  if (/(\d+)\s*KG|CONCRETE|CEMENT|MORTAR/i.test(nameUpper)) {
    const kg = nameUpper.match(/(\d+)\s*KG/i);
    return {
      unitType: 'bag',
      unitsPerPackage: kg ? parseInt(kg[1]) : 20,
      sellUnit: 'BAG'
    };
  }

  // Sheets (plywood, GIB, etc.)
  if (/SHEET|GIB|PLYWOOD|PLY|MDF|PARTICLEBOARD|HARDBOARD/i.test(nameUpper)) {
    return {
      unitType: 'sheet',
      unitsPerPackage: 1,
      sellUnit: 'SHT'
    };
  }

  // Rolls (building wrap, membrane)
  if (/ROLL|WRAP|MEMBRANE/i.test(nameUpper)) {
    return {
      unitType: 'roll',
      unitsPerPackage: 1,
      sellUnit: 'ROLL'
    };
  }

  // Default: each
  return {
    unitType: 'each',
    unitsPerPackage: 1,
    sellUnit: unitUpper || 'EA'
  };
}

// Categorize based on product name
function categorizeProduct(name, existingCategory, existingSubcategory) {
  const nameUpper = (name || '').toUpperCase();

  // If we have valid existing categories, use them
  if (existingCategory && existingCategory !== 'Uncategorized' && existingCategory !== 'Other') {
    return { category: existingCategory, subcategory: existingSubcategory || '' };
  }

  // Timber & Framing
  if (/PINE|RADIATA|TIMBER|TREATED|H3\.?[12]|H4|H5|BEARER|JOIST|RAFTER|STUD|DWANG|BLOCKING/i.test(nameUpper)) {
    let subcategory = 'Framing';
    if (/H4|H5|IN.?GROUND|PILE/i.test(nameUpper)) subcategory = 'Piles & Posts';
    else if (/DECKING/i.test(nameUpper)) subcategory = 'Decking';
    else if (/FASCIA|BARGE/i.test(nameUpper)) subcategory = 'Fascia & Trim';
    return { category: 'Timber & Framing', subcategory };
  }

  // Hardware & Fixings
  if (/SCREW|NAIL|BOLT|NUT|WASHER|ANCHOR|BRACKET|HANGER|STRAP|TIE/i.test(nameUpper)) {
    let subcategory = 'Fixings';
    if (/DECK(?:ING)?\s*SCREW/i.test(nameUpper)) subcategory = 'Decking Screws';
    else if (/BATTEN\s*SCREW/i.test(nameUpper)) subcategory = 'Batten Screws';
    else if (/JOIST\s*HANGER|BRACKET/i.test(nameUpper)) subcategory = 'Connectors';
    return { category: 'Hardware & Fixings', subcategory };
  }

  // Linings
  if (/GIB|PLASTER|LINING|CORNICE|STOPPING/i.test(nameUpper)) {
    return { category: 'Linings & Insulation', subcategory: 'Plasterboard' };
  }

  // Insulation
  if (/INSULATION|PINK\s*BATTS|EARTHWOOL|R\d+\.?\d*/i.test(nameUpper)) {
    return { category: 'Linings & Insulation', subcategory: 'Insulation' };
  }

  // Roofing
  if (/ROOF|COLORSTEEL|CORRUGATE|LONGRUN|RIDGE|FLASHING/i.test(nameUpper)) {
    return { category: 'Roofing & Cladding', subcategory: 'Roofing' };
  }

  // Cladding
  if (/WEATHERBOARD|CLADDING|LINEA|CAVITY\s*BATTEN/i.test(nameUpper)) {
    return { category: 'Roofing & Cladding', subcategory: 'Cladding' };
  }

  // Concrete & Foundations
  if (/CONCRETE|CEMENT|REBAR|MESH|DPM|MEMBRANE|FOUNDATION/i.test(nameUpper)) {
    return { category: 'Concrete & Foundations', subcategory: 'Concrete' };
  }

  // Paint & Finishes
  if (/PAINT|STAIN|SEALER|PRIMER|FINISH|VARNISH/i.test(nameUpper)) {
    return { category: 'Paint & Finishes', subcategory: 'Paint' };
  }

  // Plumbing
  if (/PIPE|FITTING|VALVE|TAP|DRAIN|PVC|COPPER/i.test(nameUpper)) {
    return { category: 'Plumbing', subcategory: 'Pipes & Fittings' };
  }

  // Electrical
  if (/CABLE|WIRE|SWITCH|SOCKET|CONDUIT|ELECTRICAL/i.test(nameUpper)) {
    return { category: 'Electrical', subcategory: 'Cables & Wiring' };
  }

  // Tools
  if (/DRILL|SAW|HAMMER|LEVEL|TAPE|MEASURE|BLADE/i.test(nameUpper)) {
    return { category: 'Tools & Equipment', subcategory: 'Hand Tools' };
  }

  // Default
  return { category: existingCategory || 'Other', subcategory: existingSubcategory || '' };
}

// Parse ITM CSV format
function parseITMCSV(csvText) {
  const lines = csvText.split('\n').filter(l => l.trim());
  const materials = [];

  for (const line of lines) {
    const cols = line.split(',');
    if (cols.length < 12) continue;

    const [date, type, code, customer, extra, cat1, cat2, cat3, name, sku, unit, price] = cols;

    // Skip header or invalid rows
    if (name === 'name' || !price || !name) continue;

    const dimensions = normalizeDimensions(name);
    const treatment = extractTreatment(name);
    const productLength = extractLength(name);
    const packaging = determinePackaging(unit, name);
    const { category, subcategory } = categorizeProduct(name, cat1?.trim(), cat2?.trim());

    materials.push({
      id: `ITM-${sku?.trim() || code?.trim()}`,
      sku: sku?.trim(),
      code: code?.trim(),
      supplier: 'ITM',
      name: name.trim(),
      category,
      subcategory,
      dimensions,
      treatment,
      unit: unit?.trim(),
      packaging,
      productLength,
      price: parseFloat((price || '0').replace(/[$,]/g, '')),
      priceUpdated: new Date().toISOString().split('T')[0],
      priceSource: 'ITM'
    });
  }

  return materials;
}

// Parse Carters CSV format (fixed-width or comma-delimited)
function parseCartersCSV(csvText) {
  const lines = csvText.split('\n').filter(l => l.trim());
  const materials = [];

  for (const line of lines) {
    // Try comma-delimited first
    if (line.includes(',')) {
      const cols = line.split(',');
      if (cols.length >= 4) {
        const [code, name, unit, priceStr] = cols;
        if (!name || name === 'name') continue;

        const price = parseFloat((priceStr || '0').replace(/[$,]/g, ''));
        if (isNaN(price)) continue;

        const dimensions = normalizeDimensions(name);
        const treatment = extractTreatment(name);
        const productLength = extractLength(name);
        const packaging = determinePackaging(unit, name);
        const { category, subcategory } = categorizeProduct(name);

        materials.push({
          id: `CART-${code?.trim()}`,
          sku: code?.trim(),
          code: code?.trim(),
          supplier: 'Carters',
          name: name.trim(),
          category,
          subcategory,
          dimensions,
          treatment,
          unit: unit?.trim(),
          packaging,
          productLength,
          price,
          priceUpdated: new Date().toISOString().split('T')[0],
          priceSource: 'Carters'
        });
      }
    }
  }

  return materials;
}

// Parse JSON format (ITM or Carters)
function parseJSON(jsonData, defaultSupplier = 'Unknown') {
  const materials = [];
  const items = Array.isArray(jsonData) ? jsonData : [];

  for (const item of items) {
    if (!item.name) continue;

    const supplier = item.supplier || defaultSupplier;
    const dimensions = normalizeDimensions(item.name);
    const treatment = extractTreatment(item.name);
    const productLength = extractLength(item.name);
    const packaging = item.packaging || determinePackaging(item.unit, item.name);
    const { category, subcategory } = categorizeProduct(item.name, item.category, item.subcategory);

    materials.push({
      id: item.id || `${supplier.toUpperCase().slice(0,4)}-${item.code || item.sku || Date.now()}`,
      sku: item.sku || item.code,
      code: item.code || item.sku,
      supplier,
      name: item.name.trim(),
      category,
      subcategory,
      dimensions,
      treatment,
      unit: item.unit,
      packaging,
      productLength,
      price: parseFloat(item.price) || 0,
      priceUpdated: item.priceUpdated || new Date().toISOString().split('T')[0],
      priceSource: item.priceSource || supplier
    });
  }

  return materials;
}

// Auto-detect and parse file
function parseFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath).toLowerCase();

  // Determine supplier from filename
  let supplier = 'Unknown';
  if (filename.includes('itm')) supplier = 'ITM';
  else if (filename.includes('carter')) supplier = 'Carters';

  if (ext === '.json') {
    const data = JSON.parse(content);
    return parseJSON(data, supplier);
  } else if (ext === '.csv') {
    if (supplier === 'ITM') {
      return parseITMCSV(content);
    } else {
      return parseCartersCSV(content);
    }
  }

  throw new Error(`Unsupported file format: ${ext}`);
}

// Main import function - accepts multiple file paths
function importMaterials(...filePaths) {
  const allMaterials = [];
  const stats = { bySupplier: {}, byCategory: {} };

  for (const filePath of filePaths) {
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }

    const materials = parseFile(filePath);
    allMaterials.push(...materials);

    // Track stats
    materials.forEach(m => {
      stats.bySupplier[m.supplier] = (stats.bySupplier[m.supplier] || 0) + 1;
      stats.byCategory[m.category] = (stats.byCategory[m.category] || 0) + 1;
    });

    console.log(`Imported ${materials.length} materials from ${path.basename(filePath)}`);
  }

  // Deduplicate by name + supplier
  const seen = new Set();
  const deduplicated = allMaterials.filter(m => {
    const key = `${m.supplier}:${m.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`\nTotal: ${deduplicated.length} materials (${allMaterials.length - deduplicated.length} duplicates removed)`);
  console.log('\nBy supplier:', stats.bySupplier);
  console.log('By category:', Object.entries(stats.byCategory).sort((a,b) => b[1] - a[1]).slice(0, 10));

  return deduplicated;
}

// Export for use in app
module.exports = {
  importMaterials,
  parseFile,
  parseJSON,
  normalizeDimensions,
  extractTreatment,
  extractLength,
  determinePackaging,
  categorizeProduct
};
