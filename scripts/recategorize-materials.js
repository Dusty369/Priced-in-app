/**
 * Recategorize materials to match Bunnings NZ structure
 * Run with: node scripts/recategorize-materials.js
 */

const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../src/data/materials-processed.json');
const outputPath = path.join(__dirname, '../src/data/materials-processed.json');

// Load materials
const materials = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

console.log(`Loaded ${materials.length} materials`);

// New Bunnings-style category structure
const CATEGORY_MAP = {
  // Timber & Structural - all framing and structural timber
  'Framing': 'Timber & Structural',
  'Timber': 'Timber & Structural',
  'Timber Structural': 'Timber & Structural',

  // Sheet Products - plasterboard, plywood, MDF
  'Sheet Products': 'Sheet Products',
  'Plywood': 'Sheet Products',

  // Cladding & Linings - exterior cladding
  'Cladding': 'Cladding & Linings',
  'Cladding Linings': 'Cladding & Linings',

  // Roofing
  'Roofing': 'Roofing',

  // Insulation
  'Insulation': 'Insulation',

  // Hardware & Fixings - screws, nails, brackets
  'Fixings & Fasteners': 'Hardware & Fixings',
  'Fasteners': 'Hardware & Fixings',
  'Hardware': 'Hardware & Fixings',

  // Doors & Windows
  'Doors & Hardware': 'Doors & Windows',
  'Doors Windows': 'Doors & Windows',

  // Concrete & Masonry
  'Concrete & Cement': 'Concrete & Masonry',
  'Concrete': 'Concrete & Masonry',
  'Masonry': 'Concrete & Masonry',

  // Building Membranes
  'Building Paper & Membranes': 'Building Membranes',

  // Adhesives & Sealants
  'Adhesives': 'Adhesives & Sealants',
  'Adhesives & Sealants': 'Adhesives & Sealants',
  'Sealants': 'Adhesives & Sealants',

  // Paint & Finishes
  'Paint': 'Paint & Finishes',
  'Paint & Coatings': 'Paint & Finishes',
  'Paints': 'Paint & Finishes',

  // Trim & Mouldings
  'Trim & Mouldings': 'Trim & Mouldings',
  'Mouldings': 'Trim & Mouldings',

  // Tools & Equipment
  'Tools': 'Tools & Equipment',
  'Abrasives': 'Tools & Equipment',

  // Trade Supplies (electrical/plumbing - not for builders)
  'Electrical': 'Trade Supplies',
  'Plumbing': 'Trade Supplies',

  // General/Other needs special handling
  'General': 'Other',
  'Other': 'Other',
};

// Name-based categorization for items with generic subcategories
function getCategoryFromName(name) {
  const n = (name || '').toLowerCase();

  // Tools & Equipment - abrasives, cutting wheels, blades, drill bits
  if (n.includes('cut off wheel') || n.includes('cutting wheel') || n.includes('grinding') ||
      n.includes('norton') || n.includes('sandpaper') || n.includes('abrasive') ||
      n.includes('detail sheet') || n.includes('flap disc') || n.includes('flap wheel') ||
      n.includes('sanding') || n.includes('drill bit') || n.includes('hole saw') ||
      n.includes('blade') || n.includes('chisel') || n.includes('bear-tex') ||
      n.includes('cup brush') || n.includes('wire brush') || n.includes('disc ') ||
      n.includes('nofil paper') || n.includes('garnet paper') || n.includes('tufbak') ||
      n.includes('wet & dry') || n.includes('grit') || n.includes('emery')) {
    return { category: 'Tools & Equipment', subcategory: 'Abrasives' };
  }

  // Packers, shims, plugs, anchors
  if (n.includes('packer') || n.includes('shim') || n.includes('wall plug') ||
      n.includes('toggle') || n.includes('chem stud') || n.includes('tension tie') ||
      n.includes('fast fix') || n.includes('utility hook') || n.includes('plug ')) {
    return { category: 'Hardware & Fixings', subcategory: 'Fixings' };
  }

  // Screws, nails, fixings
  if (n.includes('screw') || n.includes('nail') || n.includes('bolt') || n.includes('washer') ||
      n.includes('nut ') || n.includes('nuts ') || n.includes('anchor') || n.includes('rivet') ||
      n.includes('staple') || n.includes('pin ') || n.includes('tek ')) {
    return { category: 'Hardware & Fixings', subcategory: 'Fixings' };
  }

  // GIB and plasterboard
  if (n.includes('gib ') || n.includes('plasterboard') || n.includes('fyreline') ||
      n.includes('aqualine') || n.includes('braceline') || n.includes('fibrous plaster')) {
    return { category: 'Sheet Products', subcategory: 'Plasterboard' };
  }

  // Timber framing - check for dimension patterns with treatment
  if (n.includes(' x ') && (n.includes('rad ') || n.includes('radiata') || n.includes('sg8') ||
      n.includes('msg8') || n.includes('h1.2') || n.includes('h3.2') || n.includes('h4 ') ||
      n.includes('h5 ') || n.includes('treated') || n.includes('kd ') || n.includes('wet '))) {
    return { category: 'Timber & Structural', subcategory: 'Framing Timber' };
  }

  // Decking
  if (n.includes('decking') || n.includes('kwila') || n.includes('vitex deck')) {
    return { category: 'Decking', subcategory: 'Decking Boards' };
  }

  // Posts
  if (n.includes('post') && (n.includes('100 x 100') || n.includes('125 x 125') || n.includes('150 x 150'))) {
    return { category: 'Timber & Structural', subcategory: 'Posts' };
  }

  // Brackets and connectors
  if (n.includes('bracket') || n.includes('joist hanger') || n.includes('stirrup') ||
      n.includes('l/lok') || n.includes('bowmac') || n.includes('gangnail') ||
      n.includes('connector') || n.includes('strap') || n.includes('tie down')) {
    return { category: 'Hardware & Fixings', subcategory: 'Brackets & Connectors' };
  }

  // Adhesives and sealants
  if (n.includes('adhesive') || n.includes('sealant') || n.includes('silicone') ||
      n.includes('glue') || n.includes('sikaflex') || n.includes('liquid nail') ||
      n.includes('caulk') || n.includes('mastic') || n.includes('epoxy') ||
      n.includes('bostik') || n.includes('selleys') || n.includes('no more')) {
    return { category: 'Adhesives & Sealants', subcategory: 'Adhesives' };
  }

  // Paint
  if (n.includes('paint') || n.includes('stain') || n.includes('primer') ||
      n.includes('varnish') || n.includes('finish') || n.includes('sealer') ||
      n.includes('enamel') || n.includes('lacquer') || n.includes('woodcare')) {
    return { category: 'Paint & Finishes', subcategory: 'Paint' };
  }

  // Insulation
  if (n.includes('insulation') || n.includes('batts') || n.includes('earthwool') ||
      n.includes('pink batts') || n.includes('r2.') || n.includes('r3.') || n.includes('r4.') ||
      n.includes('thermal') || n.includes('acoustic')) {
    return { category: 'Insulation', subcategory: 'Insulation' };
  }

  // Building wrap/membranes
  if (n.includes('building wrap') || n.includes('membrane') || n.includes('polythene') ||
      n.includes('dpm') || n.includes('dpc') || n.includes('flashing tape') ||
      n.includes('building paper') || n.includes('vapour barrier')) {
    return { category: 'Building Membranes', subcategory: 'Membranes' };
  }

  // Roofing
  if (n.includes('roofing') || n.includes('corrugate') || n.includes('longrun') ||
      n.includes('ridge') || n.includes('gutter') || n.includes('spouting') ||
      n.includes('downpipe') || n.includes('flashing') || n.includes('colorsteel')) {
    return { category: 'Roofing', subcategory: 'Roofing' };
  }

  // Plywood
  if (n.includes('plywood') || n.includes('ply ') || n.includes('shadowclad')) {
    return { category: 'Sheet Products', subcategory: 'Plywood' };
  }

  // MDF and particle board
  if (n.includes('mdf') || n.includes('particle board') || n.includes('chipboard') ||
      n.includes('melamine') || n.includes('hardboard')) {
    return { category: 'Sheet Products', subcategory: 'Board Products' };
  }

  // Cladding
  if (n.includes('weatherboard') || n.includes('cladding') || n.includes('villaboard') ||
      n.includes('hardiflex') || n.includes('james hardie') || n.includes('fibre cement')) {
    return { category: 'Cladding & Linings', subcategory: 'Cladding' };
  }

  // Concrete
  if (n.includes('concrete') || n.includes('cement') || n.includes('mortar') ||
      n.includes('rebar') || n.includes('mesh 665') || n.includes('reinforcing')) {
    return { category: 'Concrete & Masonry', subcategory: 'Concrete' };
  }

  // Doors
  if (n.includes('door') || n.includes('hinge') || n.includes('latch') || n.includes('lock') ||
      n.includes('handle') || n.includes('knob') || n.includes('deadbolt')) {
    return { category: 'Doors & Windows', subcategory: 'Door Hardware' };
  }

  // Electrical
  if (n.includes('cable') || n.includes('wire ') || n.includes('switch') ||
      n.includes('socket') || n.includes('powerpoint') || n.includes('conduit') ||
      n.includes('electrical') || n.includes('light fitting')) {
    return { category: 'Trade Supplies', subcategory: 'Electrical' };
  }

  // Plumbing
  if (n.includes('pipe') || n.includes('fitting') || n.includes('valve') ||
      n.includes('tap') || n.includes('plumbing') || n.includes('pvc ') ||
      n.includes('poly ') || n.includes('drain')) {
    return { category: 'Trade Supplies', subcategory: 'Plumbing' };
  }

  // Trim & Mouldings
  if (n.includes('skirting') || n.includes('architrave') || n.includes('scotia') ||
      n.includes('moulding') || n.includes('quad') || n.includes('cornice') ||
      n.includes('dado') || n.includes('cover strip') || n.includes('scriber')) {
    return { category: 'Trim & Mouldings', subcategory: 'Mouldings' };
  }

  // Battens (exterior)
  if (n.includes('batten') && !n.includes('tile batten')) {
    return { category: 'Cladding & Linings', subcategory: 'Battens' };
  }

  // Weatherboards and facing boards
  if (n.includes('facing board') || n.includes('w/bd') || n.includes('weatherb') ||
      n.includes('niagara') || n.includes('envira') || n.includes('tru-pine')) {
    return { category: 'Cladding & Linings', subcategory: 'Weatherboards' };
  }

  // Fencing
  if (n.includes('chain link') || n.includes('fence') || n.includes('paling') ||
      n.includes('post cap') || n.includes('fence rail')) {
    return { category: 'Fencing', subcategory: 'Fencing' };
  }

  // More building membranes
  if (n.includes('thermakraft') || n.includes('watergate') || n.includes('pro clima') ||
      n.includes('intello') || n.includes('wrap') || n.includes('underlay')) {
    return { category: 'Building Membranes', subcategory: 'Membranes' };
  }

  // Concrete repair/grout
  if (n.includes('fastfix') || n.includes('grout') || n.includes('render') ||
      n.includes('paving') || n.includes('slab') || n.includes('block ')) {
    return { category: 'Concrete & Masonry', subcategory: 'Concrete' };
  }

  // More hardware
  if (n.includes('surequik') || n.includes('threaded rod') || n.includes('lumberlok') ||
      n.includes('cleat') || n.includes('saddle') || n.includes('clip')) {
    return { category: 'Hardware & Fixings', subcategory: 'Fixings' };
  }

  // Service charges - keep in Other
  if (n.includes('dts ') || n.includes('delivery') || n.includes('cartage') ||
      n.includes('labour hour') || n.includes('charge') || n.includes('surcharge')) {
    return { category: 'Services', subcategory: 'Delivery & Services' };
  }

  // Clear/dressing grade timber
  if (n.includes('clear') || n.includes('dressing') || n.includes('dressed all round') ||
      n.includes('dar ') || n.includes('d4s')) {
    return { category: 'Timber & Structural', subcategory: 'Dressed Timber' };
  }

  // Finger jointed timber (external trim)
  if (n.includes('fj h3.1') || n.includes('finger jointed h3')) {
    return { category: 'Cladding & Linings', subcategory: 'External Trim' };
  }

  return null;
}

// Subcategory-based overrides for better categorization
function getCategoryFromSubcategory(subcategory, currentCategory) {
  const sub = (subcategory || '').toLowerCase();

  // Fence products
  if (sub.includes('fence')) {
    return { category: 'Fencing', subcategory: subcategory };
  }

  // Decking
  if (sub.includes('decking')) {
    return { category: 'Decking', subcategory: subcategory };
  }

  // Structural timber from Other
  if (sub.includes('radiata verified') || sub.includes('radiata structural')) {
    return { category: 'Timber & Structural', subcategory: 'Structural Timber' };
  }

  // Flooring
  if (sub.includes('flooring') || sub.includes('tongue and groove')) {
    return { category: 'Flooring', subcategory: subcategory };
  }

  // Polythene films -> Building Membranes
  if (sub.includes('polythene') || sub.includes('sisalation') || sub.includes('foil')) {
    return { category: 'Building Membranes', subcategory: subcategory };
  }

  // Steel mesh/rod -> Concrete & Masonry (reinforcing)
  if (sub.includes('steel mesh') || sub.includes('steel rod')) {
    return { category: 'Concrete & Masonry', subcategory: 'Reinforcing' };
  }

  // Brackets from Other -> Hardware & Fixings
  if (sub.includes('brace') || sub.includes('lumberlok') || sub.includes('nail plate')) {
    return { category: 'Hardware & Fixings', subcategory: 'Brackets & Connectors' };
  }

  // Rivets, anchors -> Hardware & Fixings
  if (sub.includes('rivet') || sub.includes('anchor') || sub.includes('drive pin')) {
    return { category: 'Hardware & Fixings', subcategory: subcategory };
  }

  // Sandpaper -> Tools & Equipment
  if (sub.includes('sand')) {
    return { category: 'Tools & Equipment', subcategory: 'Abrasives' };
  }

  // GIB products
  if (sub.includes('gib') || sub.includes('plasterboard') || sub.includes('plaster board')) {
    return { category: 'Sheet Products', subcategory: subcategory };
  }

  return null;
}

// Process materials
let stats = {};
materials.forEach(m => {
  const originalCategory = m.category;
  const originalSubcategory = m.subcategory;

  // First check subcategory-based overrides
  const subOverride = getCategoryFromSubcategory(m.subcategory, m.category);
  if (subOverride) {
    m.category = subOverride.category;
    m.subcategory = subOverride.subcategory;
  } else {
    // Use category map
    m.category = CATEGORY_MAP[m.category] || m.category;
  }

  // For items still in Other, or with ITM/Other subcategory, try name-based categorization
  const needsNameCategorization =
    m.category === 'Other' ||
    (m.subcategory && (m.subcategory.toLowerCase() === 'other' || m.subcategory === 'ITM'));

  if (needsNameCategorization) {
    const nameOverride = getCategoryFromName(m.name);
    if (nameOverride) {
      m.category = nameOverride.category;
      m.subcategory = nameOverride.subcategory;
    }
  }

  // Clean up ITM subcategory to use the category name instead
  if (m.subcategory === 'ITM') {
    m.subcategory = m.category;
  }

  // Track stats
  if (!stats[m.category]) {
    stats[m.category] = { count: 0, subcategories: new Set() };
  }
  stats[m.category].count++;
  stats[m.category].subcategories.add(m.subcategory);
});

// Print stats
console.log('\n=== New Category Structure ===\n');
const sortedCategories = Object.keys(stats).sort();
sortedCategories.forEach(cat => {
  const s = stats[cat];
  console.log(`${cat}: ${s.count} items`);
  const subs = Array.from(s.subcategories).filter(Boolean).sort();
  subs.forEach(sub => console.log(`  - ${sub}`));
});

// Write output
fs.writeFileSync(outputPath, JSON.stringify(materials, null, 2));
console.log(`\nSaved to ${outputPath}`);
