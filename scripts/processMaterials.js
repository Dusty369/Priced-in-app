#!/usr/bin/env node
/**
 * Process Materials Script
 *
 * Reads raw materials.json, parses each material using the materialParser,
 * and outputs:
 *   - src/data/materials-processed.json (structured data)
 *   - src/data/ai-product-list.txt (AI-friendly text list)
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// PARSER LOGIC (inline since ES modules can't be required directly)
// ═══════════════════════════════════════════════════════════════

const TREATMENT_INFO = {
  'H5': 'ground contact, critical structural (piles)',
  'H4': 'ground contact (posts, retaining)',
  'H3.2': 'outdoor above ground (decks, fencing)',
  'H3.1': 'outdoor above ground, moderate exposure',
  'H1.2': 'interior framing (walls, floors, roofs)',
  'H1': 'interior, low hazard',
};

/**
 * Parse timber dimensions from name
 */
function parseDimensions(name) {
  // Standard timber: "90 X 45", "140 X 45", etc.
  const timberMatch = name.match(/\b(\d{2,3})\s*[xX×]\s*(\d{2,3})\b(?!\s*\d{3,4})/);
  if (timberMatch) {
    const d1 = parseInt(timberMatch[1]);
    const d2 = parseInt(timberMatch[2]);
    // Width is the larger value, depth is smaller (NZ convention)
    return {
      width: Math.max(d1, d2),
      depth: Math.min(d1, d2),
      display: `${Math.max(d1, d2)}×${Math.min(d1, d2)}`
    };
  }
  return null;
}

/**
 * Parse sheet dimensions (e.g., "2400X1200")
 */
function parseSheetDimensions(name) {
  const match = name.match(/\b(\d{4})\s*[xX×]\s*(\d{3,4})\b/);
  if (match) {
    return {
      length: parseInt(match[1]),
      width: parseInt(match[2]),
      display: `${match[1]}×${match[2]}`
    };
  }
  return null;
}

/**
 * Parse thickness (for plywood, GIB, etc.)
 */
function parseThickness(name) {
  // Match patterns like "18MM", "12MM" typically at start or standalone
  const match = name.match(/\b(\d{1,2})(?:\\)?MM\b/i);
  if (match) {
    const thickness = parseInt(match[1]);
    if (thickness <= 50) { // Reasonable thickness
      return { mm: thickness, display: `${thickness}mm` };
    }
  }
  return null;
}

/**
 * Parse length from name
 */
function parseLength(name) {
  // Standard lengths: "3.6M", "4.8M", "6.0M"
  const lengthMatch = name.match(/\b(\d+\.?\d*)\s*M\b(?!\s*[mM])/i);
  if (lengthMatch) {
    const meters = parseFloat(lengthMatch[1]);
    if (meters > 0 && meters <= 12) {
      return {
        mm: Math.round(meters * 1000),
        meters: meters,
        display: `${meters}m`
      };
    }
  }

  // EMS (estimated mill sizes) - variable length
  if (name.includes('*EMS*') || /\bEMS\b/.test(name)) {
    return { mm: null, meters: null, display: 'EMS', isVariable: true };
  }

  return null;
}

/**
 * Parse treatment level from name
 */
function parseTreatment(name) {
  const match = name.match(/\bH(\d)\.?(\d)?\b/i);
  if (match) {
    const code = match[2] ? `H${match[1]}.${match[2]}` : `H${match[1]}`;
    return { code, description: TREATMENT_INFO[code] || '' };
  }
  return null;
}

/**
 * Parse grade (SG8, SG10, etc.)
 */
function parseGrade(name) {
  const match = name.match(/\b(SG8|SG6|SG10|MSG8|MSG6|MGP10|MGP12|VS)\b/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Parse species
 */
function parseSpecies(name) {
  if (/\bradiata\b/i.test(name) || /\bRAD\b/.test(name)) return 'Radiata';
  if (/\bkwila\b/i.test(name)) return 'Kwila';
  if (/\bvitex\b/i.test(name)) return 'Vitex';
  if (/\bcedar\b/i.test(name)) return 'Cedar';
  if (/\bmacrocarpa\b/i.test(name)) return 'Macrocarpa';
  if (/\bdouglas/i.test(name)) return 'Douglas Fir';
  return null;
}

/**
 * Determine material type
 */
function classifyType(name, category, subcategory) {
  const n = name.toLowerCase();
  const cat = (category || '').toLowerCase();
  const sub = (subcategory || '').toLowerCase();

  // Check structural timber types first
  if (/\bpile\b/.test(n) && /h5/i.test(name)) return 'pile';
  if (/\bpile\b/.test(n)) return 'pile';
  if (/\bfence\s*post\b/.test(n)) return 'fence-post';
  if (/\bpost\b/.test(n) && !/screw|bracket|stirrup/.test(n)) return 'post';
  if (/\bbearer\b/.test(n)) return 'bearer';
  if (/\bjoist\b/.test(n) && !/hanger/.test(n)) return 'joist';
  if (/\brafter\b/.test(n)) return 'rafter';
  if (/\bpurlin\b/.test(n)) return 'purlin';
  if (/\bbatten\b/.test(n)) return 'batten';
  if (/\bstud\b/.test(n)) return 'stud';
  if (/\bbottom\s*plate\b/.test(n)) return 'bottom-plate';
  if (/\btop\s*plate\b/.test(n)) return 'top-plate';

  // Decking
  if (/\bdeck(?:ing)?\b/.test(n) && !/screw/.test(n)) return 'decking';

  // Sheet products
  if (/\bgib\b/.test(n) && !/screw/.test(n)) return 'plasterboard';
  if (/\bplasterboard\b/.test(n)) return 'plasterboard';
  if (/\bply(?:wood)?\b/.test(n)) return 'plywood';
  if (/\bmdf\b/.test(n)) return 'mdf';
  if (/\bparticle\s*board\b/.test(n)) return 'particleboard';
  if (/\bhardie\b/.test(n) || /\bfibre\s*cement\b/.test(n)) return 'fibre-cement';

  // Cladding
  if (/\bweatherboard\b/.test(n) || /\bbevel\s*back\b/.test(n)) return 'weatherboard';
  if (/\bcladding\b/.test(n) || /\blinea\b/.test(n)) return 'cladding';

  // Roofing
  if (/\broofing\b/.test(n) || /\bcolorsteel\b/.test(n)) return 'roofing';
  if (/\bgutter\b/.test(n)) return 'guttering';
  if (/\bdownpipe\b/.test(n)) return 'downpipe';
  if (/\bflashing\b/.test(n)) return 'flashing';

  // Fixings
  if (/\bscrew\b/.test(n)) return 'screw';
  if (/\bnail\b/.test(n) && !/bond/.test(n)) return 'nail';
  if (/\bbolt\b/.test(n) || /\bcoach\s*screw\b/.test(n)) return 'bolt';
  if (/\bhanger\b/.test(n)) return 'hanger';
  if (/\bbracket\b/.test(n) || /\bangle\b/.test(n)) return 'bracket';
  if (/\bstirrup\b/.test(n)) return 'stirrup';
  if (/\banchor\b/.test(n)) return 'anchor';
  if (/\bstrap\b/.test(n)) return 'strap';
  if (/\btie\s*down\b/.test(n)) return 'tie-down';

  // Insulation
  if (/\binsulation\b/.test(n) || /\bbatt\b/.test(n)) return 'insulation';

  // Building wrap/membrane
  if (/\bwrap\b/.test(n) || /\bmembrane\b/.test(n)) return 'membrane';
  if (/\bbuilding\s*paper\b/.test(n)) return 'building-paper';

  // Adhesives
  if (/\badhesive\b/.test(n) || /\bsealant\b/.test(n) || /\bsilicone\b/.test(n)) return 'adhesive';

  // Concrete
  if (/\bcement\b/.test(n) && !/board/.test(n)) return 'cement';
  if (/\bconcrete\b/.test(n)) return 'concrete';
  if (/\breinforc/.test(n) || /\brebar\b/.test(n)) return 'reinforcing';
  if (/\bmesh\b/.test(n)) return 'mesh';

  // Doors/hardware
  if (/\bdoor\b/.test(n)) return 'door';
  if (/\bwindow\b/.test(n)) return 'window';
  if (/\bhinge\b/.test(n)) return 'hinge';
  if (/\block\b/.test(n)) return 'lock';
  if (/\bhandle\b/.test(n)) return 'handle';

  // Paint
  if (/\bpaint\b/.test(n)) return 'paint';
  if (/\bprimer\b/.test(n)) return 'primer';
  if (/\bstain\b/.test(n)) return 'stain';

  // Tools
  if (cat.includes('tool')) return 'tool';

  // Framing (general structural timber with grade)
  if (/\bsg8\b/i.test(name) || /\bsg10\b/i.test(name) || /\bstress\s*graded\b/i.test(name)) return 'framing';
  if (/\bverified\b/i.test(name) && parseTreatment(name)) return 'framing';

  // Fallback to category
  if (cat.includes('framing')) return 'framing';
  if (cat.includes('timber')) return 'timber';
  if (cat.includes('fixing') || cat.includes('fasten')) return 'fixing';
  if (cat.includes('insulation')) return 'insulation';

  return 'other';
}

/**
 * Parse pack size
 */
function parsePackSize(name) {
  // Box/Pack patterns
  const patterns = [
    /\bBOX\s*(?:OF\s*)?(\d+)/i,
    /\bPK(?:T)?\s*(\d+)/i,
    /\bJAR\s*(\d+)/i,
    /\bPACK\s*(?:OF\s*)?(\d+)/i,
    /\b(\d+)\s*(?:PACK|BOX|BX)\b/i,
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      return { qty: parseInt(match[1]), unit: 'pack' };
    }
  }

  // Weight patterns
  const weightMatch = name.match(/\b(\d+(?:\.\d+)?)\s*KG\b/i);
  if (weightMatch) {
    return { qty: parseFloat(weightMatch[1]), unit: 'kg' };
  }

  return null;
}

/**
 * Parse screw/nail gauge and length
 */
function parseFixingSize(name) {
  // Gauge patterns: "8G X 38", "10G X 65"
  const gaugeMatch = name.match(/\b(\d{1,2})[gG]\s*[xX×]?\s*(\d+)(?:MM)?\b/i);
  if (gaugeMatch) {
    return {
      gauge: parseInt(gaugeMatch[1]),
      length: parseInt(gaugeMatch[2]),
      display: `${gaugeMatch[1]}g×${gaugeMatch[2]}mm`
    };
  }

  // Metric patterns: "5X50MM", "6.5X80MM"
  const metricMatch = name.match(/\b(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+)\s*MM\b/i);
  if (metricMatch) {
    return {
      diameter: parseFloat(metricMatch[1]),
      length: parseInt(metricMatch[2]),
      display: `${metricMatch[1]}×${metricMatch[2]}mm`
    };
  }

  return null;
}

/**
 * Parse fixing material (stainless, galv, etc.)
 */
function parseFixingMaterial(name) {
  if (/\b316\b/.test(name) || /\bSS316\b/i.test(name)) return 'SS316';
  if (/\b304\b/.test(name) || /\bSS304\b/i.test(name) || /\bS\/S\b/.test(name)) return 'SS304';
  if (/\bstainless/i.test(name)) return 'SS';
  if (/\bgalv/i.test(name)) return 'galv';
  if (/\bzinc\b/i.test(name)) return 'zinc';
  if (/\bbrass\b/i.test(name)) return 'brass';
  if (/\bB8\b/.test(name)) return 'B8'; // Class 8.8 bolt
  return null;
}

/**
 * Parse GIB type
 */
function parseGibType(name) {
  if (/\baqua\s*line\b/i.test(name)) return 'Aqualine';
  if (/\bfyre\s*line\b/i.test(name)) return 'Fyreline';
  if (/\bbrace\s*line\b/i.test(name)) return 'Braceline';
  if (/\bnoise\s*line\b/i.test(name)) return 'Noiseline';
  if (/\bstandard\b/i.test(name)) return 'Standard';
  return null;
}

/**
 * Parse insulation R-value
 */
function parseRValue(name) {
  const match = name.match(/\bR(\d+\.?\d*)\b/i);
  return match ? `R${match[1]}` : null;
}

/**
 * Generate simplified AI-friendly name
 */
function generateAiName(material, parsed) {
  const parts = [];

  // Dimensions first
  if (parsed.dimensions?.display) {
    parts.push(parsed.dimensions.display);
  } else if (parsed.thickness?.display) {
    parts.push(parsed.thickness.display);
  }

  // Treatment
  if (parsed.treatment?.code) {
    parts.push(parsed.treatment.code);
  }

  // Type (if meaningful)
  if (parsed.type && !['other', 'timber', 'fixing'].includes(parsed.type)) {
    parts.push(parsed.type);
  }

  // Length for timber
  if (parsed.length?.display && !parsed.length.isVariable) {
    parts.push(parsed.length.display);
  }

  // Sheet dimensions
  if (parsed.sheet?.display) {
    parts.push(parsed.sheet.display);
  }

  // Fixing size
  if (parsed.fixingSize?.display) {
    parts.push(parsed.fixingSize.display);
  }

  // Fixing material
  if (parsed.fixingMaterial) {
    parts.push(parsed.fixingMaterial);
  }

  // Pack size
  if (parsed.packSize?.unit === 'pack') {
    parts.push(`×${parsed.packSize.qty}`);
  } else if (parsed.packSize?.unit === 'kg') {
    parts.push(`${parsed.packSize.qty}kg`);
  }

  // GIB type
  if (parsed.gibType) {
    parts.push(parsed.gibType);
  }

  // R-value
  if (parsed.rValue) {
    parts.push(parsed.rValue);
  }

  // Return meaningful name or shortened original
  if (parts.length >= 2) {
    return parts.join(' ');
  }

  // Shorten original name
  return material.name
    .replace(/\bRADIATA\b/gi, '')
    .replace(/\bSTRESS\s*GRADED\b/gi, '')
    .replace(/\bVERIFIED\b/gi, '')
    .replace(/\bSTAINLESS\s*STEEL\b/gi, 'SS')
    .replace(/\*(?:EMS|STA|MTO)\*/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .substring(0, 60);
}

/**
 * Parse a single material
 */
function parseMaterial(material) {
  const name = material.name || '';

  const parsed = {
    dimensions: parseDimensions(name),
    sheet: parseSheetDimensions(name),
    thickness: parseThickness(name),
    length: parseLength(name),
    treatment: parseTreatment(name),
    grade: parseGrade(name),
    species: parseSpecies(name),
    type: classifyType(name, material.category, material.subcategory),
    packSize: parsePackSize(name),
    fixingSize: parseFixingSize(name),
    fixingMaterial: parseFixingMaterial(name),
    gibType: parseGibType(name),
    rValue: parseRValue(name),
  };

  // Clean up null values
  Object.keys(parsed).forEach(key => {
    if (parsed[key] === null) delete parsed[key];
  });

  return {
    id: material.id,
    name: material.name,
    aiName: generateAiName(material, parsed),
    price: material.price,
    unit: material.unit,
    code: material.code,
    supplier: material.supplier,
    category: material.category,
    subcategory: material.subcategory,
    parsed,
  };
}

/**
 * Group materials by type
 */
function groupByType(materials) {
  const groups = {};
  for (const mat of materials) {
    const type = mat.parsed?.type || 'other';
    if (!groups[type]) groups[type] = [];
    groups[type].push(mat);
  }
  return groups;
}

/**
 * Generate AI product list text
 */
function generateAiProductList(materials) {
  const groups = groupByType(materials);
  const lines = [];

  lines.push('# NZ Building Materials Reference');
  lines.push(`# ${materials.length} products from Carters and ITM`);
  lines.push('# Use this list to select appropriate materials for building estimates');
  lines.push('');

  // Order types by building relevance
  const typeOrder = [
    'pile', 'bearer', 'joist', 'post', 'framing', 'stud', 'rafter', 'purlin', 'batten',
    'plywood', 'plasterboard', 'fibre-cement', 'mdf', 'particleboard',
    'decking', 'cladding', 'weatherboard',
    'roofing', 'guttering', 'downpipe', 'flashing',
    'insulation', 'membrane', 'building-paper',
    'screw', 'nail', 'bolt', 'bracket', 'hanger', 'stirrup', 'anchor', 'strap',
    'adhesive', 'concrete', 'cement', 'reinforcing', 'mesh',
    'door', 'window', 'hinge', 'lock', 'handle',
    'paint', 'primer', 'stain',
    'fence-post', 'timber', 'tool', 'other'
  ];

  const sortedTypes = Object.keys(groups).sort((a, b) => {
    const aIdx = typeOrder.indexOf(a);
    const bIdx = typeOrder.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  for (const type of sortedTypes) {
    const items = groups[type];
    const typeLabel = type.toUpperCase().replace(/-/g, ' ');
    lines.push(`## ${typeLabel} (${items.length} products)`);

    // For structural timber, list available sizes
    if (['framing', 'bearer', 'joist', 'post', 'pile', 'decking', 'rafter', 'purlin'].includes(type)) {
      const sizes = new Map();
      for (const item of items) {
        if (item.parsed?.dimensions?.display) {
          const dim = item.parsed.dimensions.display;
          const treatment = item.parsed?.treatment?.code || 'UT';
          const key = `${dim} ${treatment}`;
          if (!sizes.has(key)) sizes.set(key, []);
          sizes.get(key).push(item);
        }
      }
      if (sizes.size > 0) {
        const sizeList = Array.from(sizes.keys()).sort();
        lines.push(`Available sizes: ${sizeList.slice(0, 25).join(', ')}${sizeList.length > 25 ? '...' : ''}`);
      }
    }

    // Show sample products (most common patterns)
    const aiNameCounts = {};
    for (const item of items) {
      aiNameCounts[item.aiName] = (aiNameCounts[item.aiName] || 0) + 1;
    }

    const sortedNames = Object.entries(aiNameCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    for (const [aiName, count] of sortedNames) {
      lines.push(`- ${aiName}${count > 1 ? ` (${count} variants)` : ''}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Main processing function
 */
function main() {
  const inputPath = path.join(__dirname, '../src/data/materials.json');
  const outputJsonPath = path.join(__dirname, '../src/data/materials-processed.json');
  const outputTxtPath = path.join(__dirname, '../src/data/ai-product-list.txt');

  console.log('Reading materials.json...');
  const rawData = fs.readFileSync(inputPath, 'utf8');
  const materials = JSON.parse(rawData);

  console.log(`Processing ${materials.length} materials...`);
  const processed = materials.map(parseMaterial);

  // Calculate stats
  const stats = {
    total: processed.length,
    withDimensions: processed.filter(m => m.parsed.dimensions).length,
    withLength: processed.filter(m => m.parsed.length).length,
    withTreatment: processed.filter(m => m.parsed.treatment).length,
    withPackSize: processed.filter(m => m.parsed.packSize).length,
    byType: {},
    bySupplier: {},
  };

  for (const m of processed) {
    const type = m.parsed.type || 'other';
    stats.byType[type] = (stats.byType[type] || 0) + 1;
    stats.bySupplier[m.supplier] = (stats.bySupplier[m.supplier] || 0) + 1;
  }

  console.log('\n═══════════════════════════════════════');
  console.log('           PROCESSING STATS            ');
  console.log('═══════════════════════════════════════');
  console.log(`Total materials:  ${stats.total}`);
  console.log(`With dimensions:  ${stats.withDimensions} (${(stats.withDimensions/stats.total*100).toFixed(1)}%)`);
  console.log(`With length:      ${stats.withLength} (${(stats.withLength/stats.total*100).toFixed(1)}%)`);
  console.log(`With treatment:   ${stats.withTreatment} (${(stats.withTreatment/stats.total*100).toFixed(1)}%)`);
  console.log(`With pack size:   ${stats.withPackSize} (${(stats.withPackSize/stats.total*100).toFixed(1)}%)`);

  console.log('\n─── By Supplier ───');
  for (const [supplier, count] of Object.entries(stats.bySupplier).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${supplier}: ${count}`);
  }

  console.log('\n─── By Type (top 20) ───');
  const sortedTypes = Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).slice(0, 20);
  for (const [type, count] of sortedTypes) {
    console.log(`  ${type}: ${count}`);
  }

  // Write processed JSON
  console.log(`\nWriting ${outputJsonPath}...`);
  fs.writeFileSync(outputJsonPath, JSON.stringify(processed, null, 2));

  // Write AI product list
  console.log(`Writing ${outputTxtPath}...`);
  const aiList = generateAiProductList(processed);
  fs.writeFileSync(outputTxtPath, aiList);

  // Show samples
  console.log('\n═══════════════════════════════════════');
  console.log('            SAMPLE OUTPUT              ');
  console.log('═══════════════════════════════════════');

  // Sample framing timber
  const framingSample = processed.find(m => m.parsed.type === 'framing' && m.parsed.dimensions && m.parsed.treatment);
  if (framingSample) {
    console.log('\n[FRAMING TIMBER]');
    console.log(`Original: ${framingSample.name}`);
    console.log(`AI Name:  ${framingSample.aiName}`);
    console.log(`Parsed:   ${JSON.stringify(framingSample.parsed)}`);
  }

  // Sample screw
  const screwSample = processed.find(m => m.parsed.type === 'screw' && m.parsed.fixingSize);
  if (screwSample) {
    console.log('\n[SCREW]');
    console.log(`Original: ${screwSample.name}`);
    console.log(`AI Name:  ${screwSample.aiName}`);
    console.log(`Parsed:   ${JSON.stringify(screwSample.parsed)}`);
  }

  // Sample plywood
  const plywoodSample = processed.find(m => m.parsed.type === 'plywood' && m.parsed.sheet);
  if (plywoodSample) {
    console.log('\n[PLYWOOD]');
    console.log(`Original: ${plywoodSample.name}`);
    console.log(`AI Name:  ${plywoodSample.aiName}`);
    console.log(`Parsed:   ${JSON.stringify(plywoodSample.parsed)}`);
  }

  // Sample plasterboard
  const gibSample = processed.find(m => m.parsed.type === 'plasterboard');
  if (gibSample) {
    console.log('\n[PLASTERBOARD]');
    console.log(`Original: ${gibSample.name}`);
    console.log(`AI Name:  ${gibSample.aiName}`);
    console.log(`Parsed:   ${JSON.stringify(gibSample.parsed)}`);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('               COMPLETE                ');
  console.log('═══════════════════════════════════════');
  console.log(`Output files:`);
  console.log(`  - ${outputJsonPath}`);
  console.log(`  - ${outputTxtPath}`);
}

main();
