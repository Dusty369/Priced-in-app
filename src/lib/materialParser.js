/**
 * Material Parser
 *
 * Parses raw material text strings into structured data.
 * Handles NZ building material naming conventions.
 */

/**
 * Parse a raw material object into structured format
 * @param {object} rawMaterial - Original material with name, price, unit, etc.
 * @returns {object} - Structured material object
 */
export function parseMaterial(rawMaterial) {
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

  // ═══════════════════════════════════════════════════════════════
  // PARSE TIMBER DIMENSIONS (e.g., "70 X 45", "90×45", "140 x 45")
  // ═══════════════════════════════════════════════════════════════

  // Match timber dimensions - but NOT sheet dimensions (4 digits)
  const dimMatch = name.match(/\b(\d{2,3})\s*[xX×]\s*(\d{2,3})\b/);
  if (dimMatch) {
    const d1 = parseInt(dimMatch[1]);
    const d2 = parseInt(dimMatch[2]);
    // Width is typically the larger dimension for timber
    if (d1 >= d2) {
      parsed.width = d1;
      parsed.depth = d2;
    } else {
      parsed.width = d2;
      parsed.depth = d1;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PARSE LENGTH (e.g., "5.4M", "2.4m", "2400mm", "LGTH")
  // ═══════════════════════════════════════════════════════════════

  // Try metres first (e.g., "5.4M" or "5.4m LGTH")
  const lengthMMatch = name.match(/\b(\d+\.?\d*)\s*[mM]\b(?!\s*[mM])/);
  // Try millimetres (e.g., "2400mm")
  const lengthMMMatch = name.match(/\b(\d{3,4})\s*mm\b/i);

  if (lengthMMatch) {
    const metres = parseFloat(lengthMMatch[1]);
    if (metres > 0 && metres <= 12) {  // Sanity check - timber up to 12m
      parsed.length = Math.round(metres * 1000);
      parsed.lengthDisplay = metres % 1 === 0 ? `${metres}.0m` : `${metres}m`;
    }
  } else if (lengthMMMatch) {
    const mm = parseInt(lengthMMMatch[1]);
    if (mm >= 300 && mm <= 12000) {  // Sanity check
      parsed.length = mm;
      parsed.lengthDisplay = `${(mm / 1000).toFixed(1)}m`;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PARSE TREATMENT LEVEL
  // ═══════════════════════════════════════════════════════════════

  const treatmentMatch = name.match(/\bH(\d)\.?(\d)?\b/i);
  if (treatmentMatch) {
    const major = treatmentMatch[1];
    const minor = treatmentMatch[2] || '';
    parsed.treatment = minor ? `H${major}.${minor}` : `H${major}`;
  }

  // ═══════════════════════════════════════════════════════════════
  // PARSE GRADE
  // ═══════════════════════════════════════════════════════════════

  if (/\bSG8\b/i.test(name)) parsed.grade = 'SG8';
  else if (/\bSG6\b/i.test(name)) parsed.grade = 'SG6';
  else if (/\bSG10\b/i.test(name)) parsed.grade = 'SG10';
  else if (/\bMSG8\b/i.test(name)) parsed.grade = 'MSG8';
  else if (/\bMSG6\b/i.test(name)) parsed.grade = 'MSG6';
  else if (/\bVS\b/i.test(name)) parsed.grade = 'VS';  // Visually Stress graded
  else if (/\bMGP10\b/i.test(name)) parsed.grade = 'MGP10';
  else if (/\bMGP12\b/i.test(name)) parsed.grade = 'MGP12';

  // ═══════════════════════════════════════════════════════════════
  // PARSE SPECIES
  // ═══════════════════════════════════════════════════════════════

  if (/\bradiata\b/i.test(name)) parsed.species = 'Radiata';
  else if (/\bkwila\b/i.test(name)) parsed.species = 'Kwila';
  else if (/\bvitex\b/i.test(name)) parsed.species = 'Vitex';
  else if (/\bcedar\b/i.test(name)) parsed.species = 'Cedar';
  else if (/\bmacrocarpa\b/i.test(name)) parsed.species = 'Macrocarpa';
  else if (/\bdouglas\s*fir\b/i.test(name)) parsed.species = 'Douglas Fir';
  else if (/\bhardwood\b/i.test(name)) parsed.species = 'Hardwood';

  // ═══════════════════════════════════════════════════════════════
  // PARSE FINISH
  // ═══════════════════════════════════════════════════════════════

  if (/\bKD\b/.test(name)) parsed.finish = 'KD';  // Kiln Dried
  else if (/\bGRN\b/i.test(name) || /\bgreen\b/i.test(name)) parsed.finish = 'GRN';  // Green
  else if (/\bprimed\b/i.test(name)) parsed.finish = 'Primed';
  else if (/\boiled\b/i.test(name)) parsed.finish = 'Oiled';
  else if (/\bDAR\b/i.test(name)) parsed.finish = 'DAR';  // Dressed All Round

  // ═══════════════════════════════════════════════════════════════
  // DETERMINE TYPE
  // ═══════════════════════════════════════════════════════════════

  parsed.type = determineType(name, nameLower, parsed);

  // ═══════════════════════════════════════════════════════════════
  // PARSE FIXINGS
  // ═══════════════════════════════════════════════════════════════

  if (parsed.type === 'fixing' || parsed.type === 'screw' || parsed.type === 'nail' ||
      parsed.type === 'bolt' || parsed.type === 'hanger' || parsed.type === 'bracket' ||
      parsed.type === 'anchor' || parsed.type === 'stirrup') {
    parseFixing(name, nameLower, parsed);
  }

  // ═══════════════════════════════════════════════════════════════
  // PARSE SHEETS (GIB, Plywood, etc.)
  // ═══════════════════════════════════════════════════════════════

  if (parsed.type === 'gib' || parsed.type === 'plywood' || parsed.type === 'sheet' ||
      parsed.type === 'particleboard' || parsed.type === 'mdf' || parsed.type === 'cementBoard') {
    parseSheet(name, nameLower, parsed);
  }

  // ═══════════════════════════════════════════════════════════════
  // PARSE INSULATION
  // ═══════════════════════════════════════════════════════════════

  if (parsed.type === 'insulation') {
    const rMatch = name.match(/\bR(\d+\.?\d*)\b/i);
    if (rMatch) {
      parsed.rValue = `R${rMatch[1]}`;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // BUILD AI HELPERS
  // ═══════════════════════════════════════════════════════════════

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
    aiDescription,
    aiSearchTerms,
  };
}

/**
 * Determine the material type from name and parsed data
 */
function determineType(name, nameLower, parsed) {
  // Structural piles (must check before post)
  if (/\bpile\b/i.test(name) && parsed.treatment === 'H5') {
    return 'pile';
  }

  // Fence posts specifically
  if (/\bfence\s*post\b/i.test(name)) {
    return 'fencePost';
  }

  // Posts (general)
  if (/\bpost\b/i.test(name)) {
    return 'post';
  }

  // Post stirrups
  if (/\bstirrup\b/i.test(name) && /\bpost\b/i.test(name)) {
    return 'stirrup';
  }

  // Joist hangers
  if (/\bhanger\b/i.test(name)) {
    return 'hanger';
  }

  // Brackets and anchors
  if (/\bbracket\b/i.test(name) || /\bangle\b/i.test(name)) {
    return 'bracket';
  }
  if (/\banchor\b/i.test(name)) {
    return 'anchor';
  }

  // Decking
  if (/\bdeck(?:ing)?\b/i.test(name)) {
    return 'decking';
  }

  // Weatherboards
  if (/\bweatherboard\b/i.test(name) || /\bbevel\s*back\b/i.test(name)) {
    return 'weatherboard';
  }

  // GIB/Plasterboard
  if (/\bgib\b/i.test(name) || /\bplasterboard\b/i.test(name)) {
    return 'gib';
  }

  // Cement board / tile underlay
  if (/\bcement\s*board\b/i.test(name) || /\btile.*underlay\b/i.test(name)) {
    return 'cementBoard';
  }

  // Plywood
  if (/\bplywood\b/i.test(name) || /\bply\b/i.test(name)) {
    return 'plywood';
  }

  // Particle board
  if (/\bparticle\s*board\b/i.test(name) || /\bfloor.*board\b/i.test(name)) {
    return 'particleboard';
  }

  // MDF
  if (/\bmdf\b/i.test(name)) {
    return 'mdf';
  }

  // Insulation
  if (/\binsulation\b/i.test(name) || /\bbatt\b/i.test(name) || /\bR\d\.\d/i.test(name)) {
    return 'insulation';
  }

  // Building wrap / membrane
  if (/\bwrap\b/i.test(name) || /\bmembrane\b/i.test(name) || /\bunderlay\b/i.test(name)) {
    return 'membrane';
  }

  // Flashing
  if (/\bflashing\b/i.test(name)) {
    return 'flashing';
  }

  // Concrete/Cement
  if (/\bconcrete\b/i.test(name) || /\bcement\b/i.test(name)) {
    return 'concrete';
  }

  // Screws
  if (/\bscrew\b/i.test(name)) {
    return 'screw';
  }

  // Nails
  if (/\bnail\b/i.test(name)) {
    return 'nail';
  }

  // Bolts
  if (/\bbolt\b/i.test(name) || /\bcoach\s*screw\b/i.test(name)) {
    return 'bolt';
  }

  // Framing timber (with grade)
  if (parsed.grade || /\bframing\b/i.test(name) || /\bstress\s*graded\b/i.test(name)) {
    return 'framing';
  }

  // Bearer
  if (/\bbearer\b/i.test(name)) {
    return 'bearer';
  }

  // Joist
  if (/\bjoist\b/i.test(name)) {
    return 'joist';
  }

  // Rafter
  if (/\brafter\b/i.test(name)) {
    return 'rafter';
  }

  // Purlin
  if (/\bpurlin\b/i.test(name)) {
    return 'purlin';
  }

  // Batten
  if (/\bbatten\b/i.test(name)) {
    return 'batten';
  }

  // Adhesive
  if (/\badhesive\b/i.test(name) || /\bglue\b/i.test(name) || /\bsealant\b/i.test(name)) {
    return 'adhesive';
  }

  // Hardware
  if (/\bhinge\b/i.test(name) || /\block\b/i.test(name) || /\bhandle\b/i.test(name)) {
    return 'hardware';
  }

  // If we have dimensions and treatment, likely framing
  if (parsed.width && parsed.depth && parsed.treatment) {
    return 'framing';
  }

  return 'other';
}

/**
 * Parse fixing-specific data
 */
function parseFixing(name, nameLower, parsed) {
  // Determine fixing type
  if (/\bscrew\b/i.test(name)) {
    parsed.fixingType = 'screw';
  } else if (/\bnail\b/i.test(name)) {
    parsed.fixingType = 'nail';
  } else if (/\bbolt\b/i.test(name) || /\bcoach\s*screw\b/i.test(name)) {
    parsed.fixingType = 'bolt';
  } else if (/\bhanger\b/i.test(name)) {
    parsed.fixingType = 'hanger';
  } else if (/\bbracket\b/i.test(name)) {
    parsed.fixingType = 'bracket';
  } else if (/\bstirrup\b/i.test(name)) {
    parsed.fixingType = 'stirrup';
  } else if (/\banchor\b/i.test(name)) {
    parsed.fixingType = 'anchor';
  }

  // Parse material
  if (/\b316\b/i.test(name) || /\bstainless\s*316\b/i.test(name)) {
    parsed.fixingMaterial = 'Stainless 316';
  } else if (/\b304\b/i.test(name) || /\bstainless\b/i.test(name)) {
    parsed.fixingMaterial = 'Stainless 304';
  } else if (/\bgalv/i.test(name)) {
    parsed.fixingMaterial = 'Galvanised';
  } else if (/\bzinc\b/i.test(name)) {
    parsed.fixingMaterial = 'Zinc';
  } else if (/\bbrass\b/i.test(name)) {
    parsed.fixingMaterial = 'Brass';
  }

  // Parse diameter/gauge
  const mDiaMatch = name.match(/\bM(\d+)\b/);
  const gaugeMatch = name.match(/\b(\d+)[gG]\b/);
  if (mDiaMatch) {
    parsed.diameter = `M${mDiaMatch[1]}`;
  } else if (gaugeMatch) {
    parsed.diameter = `${gaugeMatch[1]}g`;
  }

  // Parse fixing length (different from timber length)
  const fixLengthMatch = name.match(/[xX×]\s*(\d+)\s*(?:mm)?(?:\s|$)/);
  if (fixLengthMatch) {
    parsed.fixingLength = parseInt(fixLengthMatch[1]);
  }

  // Parse pack size
  const boxMatch = name.match(/\bbox\s*(?:of\s*)?(\d+)/i);
  const packMatch = name.match(/\bpack\s*(?:of\s*)?(\d+)/i);
  const pkMatch = name.match(/\b(\d+)\s*pk\b/i);
  const qtyMatch = name.match(/\b(\d{3,})\s*(?:bx|box|pack|pk)?\b/i);

  if (boxMatch) {
    parsed.packSize = parseInt(boxMatch[1]);
  } else if (packMatch) {
    parsed.packSize = parseInt(packMatch[1]);
  } else if (pkMatch) {
    parsed.packSize = parseInt(pkMatch[1]);
  } else if (qtyMatch && parseInt(qtyMatch[1]) >= 100 && parseInt(qtyMatch[1]) <= 10000) {
    // Only if it looks like a pack quantity (100-10000)
    parsed.packSize = parseInt(qtyMatch[1]);
  }
}

/**
 * Parse sheet-specific data
 */
function parseSheet(name, nameLower, parsed) {
  // Parse sheet dimensions (e.g., "1200 x 2400 x 10")
  const sheetMatch = name.match(/(\d{3,4})\s*[xX×]\s*(\d{3,4})(?:\s*[xX×]\s*(\d+))?/);
  if (sheetMatch) {
    const d1 = parseInt(sheetMatch[1]);
    const d2 = parseInt(sheetMatch[2]);
    // Width is typically smaller (1200), height is larger (2400)
    if (d1 <= d2) {
      parsed.sheetWidth = d1;
      parsed.sheetHeight = d2;
    } else {
      parsed.sheetWidth = d2;
      parsed.sheetHeight = d1;
    }
    if (sheetMatch[3]) {
      parsed.thickness = parseInt(sheetMatch[3]);
    }
  }

  // Parse thickness separately if not in dimensions
  if (!parsed.thickness) {
    const thickMatch = name.match(/\b(\d+)\s*mm\b/i);
    if (thickMatch && parseInt(thickMatch[1]) <= 50) {  // Reasonable thickness
      parsed.thickness = parseInt(thickMatch[1]);
    }
  }

  // Parse GIB type
  if (/\bgib\b/i.test(name)) {
    if (/\baqua\s*line\b/i.test(name)) {
      parsed.gibType = 'Aqualine';
    } else if (/\bfyre\s*line\b/i.test(name)) {
      parsed.gibType = 'Fyreline';
    } else if (/\bbrace\s*line\b/i.test(name)) {
      parsed.gibType = 'Braceline';
    } else if (/\bnoise\s*line\b/i.test(name)) {
      parsed.gibType = 'Noiseline';
    } else if (/\bstandard\b/i.test(name)) {
      parsed.gibType = 'Standard';
    }
  }
}

/**
 * Build AI-friendly description
 */
function buildAIDescription(parsed, raw) {
  const parts = [];

  // Dimensions
  if (parsed.width && parsed.depth) {
    parts.push(`${parsed.width}×${parsed.depth}`);
  }

  // Treatment
  if (parsed.treatment) {
    parts.push(parsed.treatment);
  }

  // Grade
  if (parsed.grade) {
    parts.push(parsed.grade);
  }

  // Type
  if (parsed.type && parsed.type !== 'other') {
    parts.push(parsed.type);
  }

  // Species
  if (parsed.species) {
    parts.push(parsed.species);
  }

  // Length
  if (parsed.lengthDisplay) {
    parts.push(parsed.lengthDisplay);
  }

  // Sheet dimensions
  if (parsed.sheetWidth && parsed.sheetHeight) {
    parts.push(`${parsed.sheetWidth}×${parsed.sheetHeight}`);
    if (parsed.thickness) {
      parts.push(`${parsed.thickness}mm`);
    }
  }

  // GIB type
  if (parsed.gibType) {
    parts.push(parsed.gibType);
  }

  // Fixing info
  if (parsed.fixingType) {
    if (parsed.diameter) parts.push(parsed.diameter);
    if (parsed.fixingLength) parts.push(`${parsed.fixingLength}mm`);
    if (parsed.fixingMaterial) parts.push(parsed.fixingMaterial);
  }

  // Pack size
  if (parsed.packSize) {
    parts.push(`(box of ${parsed.packSize})`);
  }

  // R-value for insulation
  if (parsed.rValue) {
    parts.push(parsed.rValue);
  }

  return parts.join(' ') || raw.name;
}

/**
 * Build search terms array
 */
function buildSearchTerms(parsed, name) {
  const terms = new Set();

  // Add parsed values
  if (parsed.width && parsed.depth) {
    terms.add(`${parsed.width}x${parsed.depth}`);
    terms.add(`${parsed.width}×${parsed.depth}`);
    terms.add(`${parsed.width} x ${parsed.depth}`);
  }

  if (parsed.treatment) {
    terms.add(parsed.treatment);
    terms.add(parsed.treatment.toLowerCase());
  }

  if (parsed.grade) {
    terms.add(parsed.grade);
    terms.add(parsed.grade.toLowerCase());
  }

  if (parsed.type) {
    terms.add(parsed.type);
  }

  if (parsed.species) {
    terms.add(parsed.species);
    terms.add(parsed.species.toLowerCase());
  }

  if (parsed.lengthDisplay) {
    terms.add(parsed.lengthDisplay);
  }

  if (parsed.fixingType) {
    terms.add(parsed.fixingType);
  }

  if (parsed.fixingMaterial) {
    terms.add(parsed.fixingMaterial);
    terms.add(parsed.fixingMaterial.toLowerCase());
  }

  if (parsed.gibType) {
    terms.add(parsed.gibType);
    terms.add(parsed.gibType.toLowerCase());
  }

  if (parsed.rValue) {
    terms.add(parsed.rValue);
  }

  // Add significant words from original name (longer than 2 chars)
  const words = name.split(/\s+/).filter(w => w.length > 2);
  words.forEach(w => terms.add(w.toLowerCase()));

  return Array.from(terms);
}

/**
 * Normalise unit to standard format
 */
function normaliseUnit(unit) {
  if (!unit) return 'ea';

  const u = unit.toLowerCase().trim();

  if (u.includes('lgth') || u.includes('length')) return 'len';
  if (u.includes('lm') || u.includes('lineal') || u.includes('linear')) return 'lm';
  if (u.includes('m²') || u.includes('sqm') || u.includes('sq m') || u.includes('square')) return 'm²';
  if (u.includes('m³') || u.includes('cbm') || u.includes('cubic')) return 'm³';
  if (u.includes('ea') || u.includes('each')) return 'ea';
  if (u.includes('box') || u.includes('bx')) return 'box';
  if (u.includes('pack') || u.includes('pk')) return 'pack';
  if (u.includes('bag')) return 'bag';
  if (u.includes('kg')) return 'kg';
  if (u.includes('roll')) return 'roll';
  if (u.includes('sht') || u.includes('sheet')) return 'sht';
  if (u.includes('tube')) return 'tube';
  if (u.includes('litre') || u.includes('ltr') || u === 'l') return 'L';
  if (u.includes('set')) return 'set';
  if (u.includes('pair') || u.includes('pr')) return 'pr';

  return unit;
}

/**
 * Generate unique ID from name and code
 */
function generateId(name, code) {
  const base = code || name;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

export default parseMaterial;
