/**
 * Process Materials Script
 *
 * Parses all raw materials into structured format.
 * Run with: node scripts/processMaterials.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read raw materials
const materialsPath = path.join(__dirname, '../src/data/materials.json');
const materials = JSON.parse(fs.readFileSync(materialsPath, 'utf-8'));

console.log(`Processing ${materials.length} materials...`);

// Import parser functions inline (to avoid ESM issues)
function parseMaterial(rawMaterial) {
  const name = rawMaterial.name || '';
  const nameLower = name.toLowerCase();

  const parsed = {
    width: null,
    depth: null,
    length: null,
    lengthDisplay: null,
    type: null,
    species: null,
    grade: null,
    treatment: null,
    finish: null,
    packSize: null,
    fixingType: null,
    fixingMaterial: null,
    diameter: null,
    fixingLength: null,
    sheetWidth: null,
    sheetHeight: null,
    thickness: null,
    gibType: null,
    rValue: null,
  };

  // Parse timber dimensions
  const dimMatch = name.match(/\b(\d{2,3})\s*[xX×]\s*(\d{2,3})\b/);
  if (dimMatch) {
    const d1 = parseInt(dimMatch[1]);
    const d2 = parseInt(dimMatch[2]);
    if (d1 >= d2) {
      parsed.width = d1;
      parsed.depth = d2;
    } else {
      parsed.width = d2;
      parsed.depth = d1;
    }
  }

  // Parse length
  const lengthMMatch = name.match(/\b(\d+\.?\d*)\s*[mM]\b(?!\s*[mM])/);
  const lengthMMMatch = name.match(/\b(\d{3,4})\s*mm\b/i);

  if (lengthMMatch) {
    const metres = parseFloat(lengthMMatch[1]);
    if (metres > 0 && metres <= 12) {
      parsed.length = Math.round(metres * 1000);
      parsed.lengthDisplay = metres % 1 === 0 ? `${metres}.0m` : `${metres}m`;
    }
  } else if (lengthMMMatch) {
    const mm = parseInt(lengthMMMatch[1]);
    if (mm >= 300 && mm <= 12000) {
      parsed.length = mm;
      parsed.lengthDisplay = `${(mm / 1000).toFixed(1)}m`;
    }
  }

  // Parse treatment
  const treatmentMatch = name.match(/\bH(\d)\.?(\d)?\b/i);
  if (treatmentMatch) {
    const major = treatmentMatch[1];
    const minor = treatmentMatch[2] || '';
    parsed.treatment = minor ? `H${major}.${minor}` : `H${major}`;
  }

  // Parse grade
  if (/\bSG8\b/i.test(name)) parsed.grade = 'SG8';
  else if (/\bSG6\b/i.test(name)) parsed.grade = 'SG6';
  else if (/\bSG10\b/i.test(name)) parsed.grade = 'SG10';
  else if (/\bMSG8\b/i.test(name)) parsed.grade = 'MSG8';
  else if (/\bMSG6\b/i.test(name)) parsed.grade = 'MSG6';

  // Parse species
  if (/\bradiata\b/i.test(name)) parsed.species = 'Radiata';
  else if (/\bkwila\b/i.test(name)) parsed.species = 'Kwila';
  else if (/\bvitex\b/i.test(name)) parsed.species = 'Vitex';
  else if (/\bcedar\b/i.test(name)) parsed.species = 'Cedar';
  else if (/\bmacrocarpa\b/i.test(name)) parsed.species = 'Macrocarpa';

  // Parse finish
  if (/\bKD\b/.test(name)) parsed.finish = 'KD';
  else if (/\bGRN\b/i.test(name)) parsed.finish = 'GRN';
  else if (/\bprimed\b/i.test(name)) parsed.finish = 'Primed';
  else if (/\bDAR\b/i.test(name)) parsed.finish = 'DAR';

  // Determine type
  parsed.type = determineType(name, nameLower, parsed);

  // Parse fixings
  if (['fixing', 'screw', 'nail', 'bolt', 'hanger', 'bracket', 'anchor', 'stirrup'].includes(parsed.type)) {
    parseFixing(name, nameLower, parsed);
  }

  // Parse sheets
  if (['gib', 'plywood', 'sheet', 'particleboard', 'mdf', 'cementBoard'].includes(parsed.type)) {
    parseSheet(name, nameLower, parsed);
  }

  // Parse insulation R-value
  if (parsed.type === 'insulation') {
    const rMatch = name.match(/\bR(\d+\.?\d*)\b/i);
    if (rMatch) parsed.rValue = `R${rMatch[1]}`;
  }

  const aiDescription = buildAIDescription(parsed, rawMaterial);
  const aiSearchTerms = buildSearchTerms(parsed, name);

  return {
    id: rawMaterial.id || generateId(name, rawMaterial.code),
    displayName: name,
    parsed,
    price: rawMaterial.price,
    unit: normaliseUnit(rawMaterial.unit),
    unitDisplay: rawMaterial.unit,
    supplier: rawMaterial.supplier || 'Unknown',
    code: rawMaterial.code || '',
    category: rawMaterial.category || '',
    subcategory: rawMaterial.subcategory || '',
    aiDescription,
    aiSearchTerms,
  };
}

function determineType(name, nameLower, parsed) {
  if (/\bpile\b/i.test(name) && parsed.treatment === 'H5') return 'pile';
  if (/\bfence\s*post\b/i.test(name)) return 'fencePost';
  if (/\bstirrup\b/i.test(name) && /\bpost\b/i.test(name)) return 'stirrup';
  if (/\bpost\b/i.test(name)) return 'post';
  if (/\bhanger\b/i.test(name)) return 'hanger';
  if (/\bbracket\b/i.test(name) || /\bangle\b/i.test(name)) return 'bracket';
  if (/\banchor\b/i.test(name)) return 'anchor';
  if (/\bdeck(?:ing)?\b/i.test(name)) return 'decking';
  if (/\bweatherboard\b/i.test(name) || /\bbevel/i.test(name)) return 'weatherboard';
  if (/\bgib\b/i.test(name) || /\bplasterboard\b/i.test(name)) return 'gib';
  if (/\bcement\s*board\b/i.test(name) || /\btile.*underlay\b/i.test(name)) return 'cementBoard';
  if (/\bplywood\b/i.test(name) || /\bply\b/i.test(name)) return 'plywood';
  if (/\bparticle\s*board\b/i.test(name) || /\bfloor.*board\b/i.test(name)) return 'particleboard';
  if (/\bmdf\b/i.test(name)) return 'mdf';
  if (/\binsulation\b/i.test(name) || /\bbatt\b/i.test(name) || /\bR\d\.\d/i.test(name)) return 'insulation';
  if (/\bwrap\b/i.test(name) || /\bmembrane\b/i.test(name)) return 'membrane';
  if (/\bflashing\b/i.test(name)) return 'flashing';
  if (/\bconcrete\b/i.test(name) || /\bcement\b/i.test(name)) return 'concrete';
  if (/\bscrew\b/i.test(name)) return 'screw';
  if (/\bnail\b/i.test(name)) return 'nail';
  if (/\bbolt\b/i.test(name) || /\bcoach\s*screw\b/i.test(name)) return 'bolt';
  if (parsed.grade || /\bframing\b/i.test(name) || /\bstress\s*graded\b/i.test(name)) return 'framing';
  if (/\bbearer\b/i.test(name)) return 'bearer';
  if (/\bjoist\b/i.test(name)) return 'joist';
  if (/\brafter\b/i.test(name)) return 'rafter';
  if (/\bpurlin\b/i.test(name)) return 'purlin';
  if (/\bbatten\b/i.test(name)) return 'batten';
  if (/\badhesive\b/i.test(name) || /\bglue\b/i.test(name) || /\bsealant\b/i.test(name)) return 'adhesive';
  if (/\bhinge\b/i.test(name) || /\block\b/i.test(name) || /\bhandle\b/i.test(name)) return 'hardware';
  if (parsed.width && parsed.depth && parsed.treatment) return 'framing';
  return 'other';
}

function parseFixing(name, nameLower, parsed) {
  if (/\bscrew\b/i.test(name)) parsed.fixingType = 'screw';
  else if (/\bnail\b/i.test(name)) parsed.fixingType = 'nail';
  else if (/\bbolt\b/i.test(name) || /\bcoach\s*screw\b/i.test(name)) parsed.fixingType = 'bolt';
  else if (/\bhanger\b/i.test(name)) parsed.fixingType = 'hanger';
  else if (/\bbracket\b/i.test(name)) parsed.fixingType = 'bracket';
  else if (/\bstirrup\b/i.test(name)) parsed.fixingType = 'stirrup';
  else if (/\banchor\b/i.test(name)) parsed.fixingType = 'anchor';

  if (/\b316\b/i.test(name)) parsed.fixingMaterial = 'Stainless 316';
  else if (/\b304\b/i.test(name) || /\bstainless\b/i.test(name)) parsed.fixingMaterial = 'Stainless 304';
  else if (/\bgalv/i.test(name)) parsed.fixingMaterial = 'Galvanised';
  else if (/\bzinc\b/i.test(name)) parsed.fixingMaterial = 'Zinc';

  const mDiaMatch = name.match(/\bM(\d+)\b/);
  const gaugeMatch = name.match(/\b(\d+)[gG]\b/);
  if (mDiaMatch) parsed.diameter = `M${mDiaMatch[1]}`;
  else if (gaugeMatch) parsed.diameter = `${gaugeMatch[1]}g`;

  const fixLengthMatch = name.match(/[xX×]\s*(\d+)\s*(?:mm)?(?:\s|$)/);
  if (fixLengthMatch) parsed.fixingLength = parseInt(fixLengthMatch[1]);

  const boxMatch = name.match(/\bbox\s*(?:of\s*)?(\d+)/i);
  const packMatch = name.match(/\bpack\s*(?:of\s*)?(\d+)/i);
  const pkMatch = name.match(/\b(\d+)\s*pk\b/i);
  const qtyMatch = name.match(/\b(\d{3,})\s*(?:bx|box|pack|pk)?\b/i);

  if (boxMatch) parsed.packSize = parseInt(boxMatch[1]);
  else if (packMatch) parsed.packSize = parseInt(packMatch[1]);
  else if (pkMatch) parsed.packSize = parseInt(pkMatch[1]);
  else if (qtyMatch && parseInt(qtyMatch[1]) >= 100 && parseInt(qtyMatch[1]) <= 10000) {
    parsed.packSize = parseInt(qtyMatch[1]);
  }
}

function parseSheet(name, nameLower, parsed) {
  const sheetMatch = name.match(/(\d{3,4})\s*[xX×]\s*(\d{3,4})(?:\s*[xX×]\s*(\d+))?/);
  if (sheetMatch) {
    const d1 = parseInt(sheetMatch[1]);
    const d2 = parseInt(sheetMatch[2]);
    if (d1 <= d2) {
      parsed.sheetWidth = d1;
      parsed.sheetHeight = d2;
    } else {
      parsed.sheetWidth = d2;
      parsed.sheetHeight = d1;
    }
    if (sheetMatch[3]) parsed.thickness = parseInt(sheetMatch[3]);
  }

  if (!parsed.thickness) {
    const thickMatch = name.match(/\b(\d+)\s*mm\b/i);
    if (thickMatch && parseInt(thickMatch[1]) <= 50) {
      parsed.thickness = parseInt(thickMatch[1]);
    }
  }

  if (/\bgib\b/i.test(name)) {
    if (/\baqua\s*line\b/i.test(name)) parsed.gibType = 'Aqualine';
    else if (/\bfyre\s*line\b/i.test(name)) parsed.gibType = 'Fyreline';
    else if (/\bbrace\s*line\b/i.test(name)) parsed.gibType = 'Braceline';
    else if (/\bstandard\b/i.test(name)) parsed.gibType = 'Standard';
  }
}

function buildAIDescription(parsed, raw) {
  const parts = [];
  if (parsed.width && parsed.depth) parts.push(`${parsed.width}×${parsed.depth}`);
  if (parsed.treatment) parts.push(parsed.treatment);
  if (parsed.grade) parts.push(parsed.grade);
  if (parsed.type && parsed.type !== 'other') parts.push(parsed.type);
  if (parsed.species) parts.push(parsed.species);
  if (parsed.lengthDisplay) parts.push(parsed.lengthDisplay);
  if (parsed.sheetWidth && parsed.sheetHeight) {
    parts.push(`${parsed.sheetWidth}×${parsed.sheetHeight}`);
    if (parsed.thickness) parts.push(`${parsed.thickness}mm`);
  }
  if (parsed.gibType) parts.push(parsed.gibType);
  if (parsed.fixingType) {
    if (parsed.diameter) parts.push(parsed.diameter);
    if (parsed.fixingLength) parts.push(`${parsed.fixingLength}mm`);
    if (parsed.fixingMaterial) parts.push(parsed.fixingMaterial);
  }
  if (parsed.packSize) parts.push(`(box of ${parsed.packSize})`);
  if (parsed.rValue) parts.push(parsed.rValue);
  return parts.join(' ') || raw.name;
}

function buildSearchTerms(parsed, name) {
  const terms = new Set();
  if (parsed.width && parsed.depth) {
    terms.add(`${parsed.width}x${parsed.depth}`);
    terms.add(`${parsed.width}×${parsed.depth}`);
  }
  if (parsed.treatment) { terms.add(parsed.treatment); terms.add(parsed.treatment.toLowerCase()); }
  if (parsed.grade) { terms.add(parsed.grade); terms.add(parsed.grade.toLowerCase()); }
  if (parsed.type) terms.add(parsed.type);
  if (parsed.species) { terms.add(parsed.species); terms.add(parsed.species.toLowerCase()); }
  if (parsed.lengthDisplay) terms.add(parsed.lengthDisplay);
  if (parsed.fixingType) terms.add(parsed.fixingType);
  if (parsed.fixingMaterial) { terms.add(parsed.fixingMaterial); terms.add(parsed.fixingMaterial.toLowerCase()); }
  if (parsed.gibType) { terms.add(parsed.gibType); terms.add(parsed.gibType.toLowerCase()); }
  if (parsed.rValue) terms.add(parsed.rValue);
  const words = name.split(/\s+/).filter(w => w.length > 2);
  words.forEach(w => terms.add(w.toLowerCase()));
  return Array.from(terms);
}

function normaliseUnit(unit) {
  if (!unit) return 'ea';
  const u = unit.toLowerCase().trim();
  if (u.includes('lgth') || u.includes('length')) return 'len';
  if (u.includes('lm') || u.includes('lineal')) return 'lm';
  if (u.includes('m²') || u.includes('sqm')) return 'm²';
  if (u.includes('ea') || u.includes('each')) return 'ea';
  if (u.includes('box') || u.includes('bx')) return 'box';
  if (u.includes('pack') || u.includes('pk') || u.includes('pkt')) return 'pack';
  if (u.includes('bag')) return 'bag';
  if (u.includes('kg')) return 'kg';
  if (u.includes('roll')) return 'roll';
  if (u.includes('sht') || u.includes('sheet')) return 'sht';
  if (u.includes('jar')) return 'jar';
  if (u.includes('tube')) return 'tube';
  if (u.includes('litre') || u.includes('ltr')) return 'L';
  if (u.includes('set')) return 'set';
  return unit.toLowerCase();
}

function generateId(name, code) {
  const base = code || name;
  return base.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 50);
}

// Process all materials
const processed = materials.map(m => parseMaterial(m));

// Save processed materials
const outputPath = path.join(__dirname, '../src/data/materials-processed.json');
fs.writeFileSync(outputPath, JSON.stringify(processed, null, 2));
console.log(`Saved processed materials to ${outputPath}`);

// Generate statistics
const stats = {
  total: processed.length,
  byType: {},
  byTreatment: {},
  bySupplier: {},
  withDimensions: 0,
  withLength: 0,
  withPackSize: 0,
};

processed.forEach(m => {
  const type = m.parsed.type || 'other';
  stats.byType[type] = (stats.byType[type] || 0) + 1;

  if (m.parsed.treatment) {
    stats.byTreatment[m.parsed.treatment] = (stats.byTreatment[m.parsed.treatment] || 0) + 1;
  }

  stats.bySupplier[m.supplier] = (stats.bySupplier[m.supplier] || 0) + 1;

  if (m.parsed.width && m.parsed.depth) stats.withDimensions++;
  if (m.parsed.length) stats.withLength++;
  if (m.parsed.packSize) stats.withPackSize++;
});

console.log('\n=== Processing Statistics ===');
console.log(`Total materials: ${stats.total}`);
console.log(`With dimensions: ${stats.withDimensions}`);
console.log(`With length: ${stats.withLength}`);
console.log(`With pack size: ${stats.withPackSize}`);
console.log('\nBy supplier:');
Object.entries(stats.bySupplier).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
  console.log(`  ${k}: ${v}`);
});
console.log('\nBy type (top 20):');
Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, v]) => {
  console.log(`  ${k}: ${v}`);
});
console.log('\nBy treatment:');
Object.entries(stats.byTreatment).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
  console.log(`  ${k}: ${v}`);
});

// Show some examples
console.log('\n=== Sample Parsed Materials ===');
const examples = processed.filter(m => m.parsed.type === 'framing' && m.parsed.treatment).slice(0, 5);
examples.forEach(m => {
  console.log(`\nOriginal: ${m.displayName}`);
  console.log(`AI Desc:  ${m.aiDescription}`);
  console.log(`Parsed:   ${JSON.stringify(m.parsed)}`);
});

console.log('\nDone!');
