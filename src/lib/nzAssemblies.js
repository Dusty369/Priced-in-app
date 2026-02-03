/**
 * NZ Building Assemblies Reference
 *
 * This file defines how building elements are constructed to NZ standards.
 * The AI system prompt MUST reference this for accurate material and labour estimates.
 *
 * Standards referenced:
 * - NZS 3604 (Timber-framed buildings)
 * - NZBC E2/AS1 (External moisture)
 * - NZBC E3/AS1 (Internal moisture)
 * - NZBC H1/AS1 (Energy efficiency)
 * - NZBC F4 (Safety from falling)
 * - NZBC D1 (Access routes)
 */

// ============================================================================
// 1. FOUNDATION ASSEMBLIES
// ============================================================================

export const SLAB_ON_GROUND = {
  name: 'Concrete Slab on Ground',
  standard: 'NZS 3604',
  layers: [
    '1. Excavate to solid ground',
    '2. Compacted hardfill (100-150mm)',
    '3. Sand blinding (25mm)',
    '4. Polythene DPM (0.25mm min, 150mm laps, taped)',
    '5. Reinforcing mesh on chairs (665 mesh typical, 50mm cover)',
    '6. Concrete (100mm min thickness, 17.5MPa min)',
    '7. Foundation bolts at 1200mm max centres',
  ],
  edgeDetail: {
    thickening: '400mm wide × 400mm deep at perimeter',
    rebate: '40mm rebate for veneer cladding if required',
  },
  fixings: {
    foundationBolts: { size: 'M12 × 240mm galv', spacing: '1200mm max, both sides of openings' },
    meshChairs: { spacing: '600mm grid', height: '50mm' },
    meshLaps: '200mm minimum overlap, tied',
  },
  materials: {
    concrete: { calc: 'length × width × 0.1', unit: 'm³' },
    mesh665: { calc: 'area ÷ 4.8', unit: 'sht', note: 'Add for 200mm laps' },
    polythene: { calc: 'area × 1.15', unit: 'm²', note: '15% for laps' },
    hardfill: { calc: 'area × 0.15', unit: 'm³' },
    foundationBolts: { calc: 'perimeter ÷ 1.2 + openings × 2', unit: 'ea' },
    boxingTimber: { calc: 'perimeter × 2', unit: 'lm' },
  },
  notes: [
    'DPM must turn up behind slab edge',
    'Control joints at 3-4m centres both ways',
    'No mesh within 50mm of edges',
  ],
};

export const PILE_FOUNDATION = {
  name: 'Timber Pile Foundation',
  standard: 'NZS 3604',
  pileTypes: {
    H5Timber: { minDiameter: '125mm', embedment: '600mm min in ground' },
    concretePile: { minDiameter: '200mm', embedment: '450mm min' },
  },
  connections: {
    pileToBearerFixing: '2 × M12 galv coach bolts per pile',
    bearerToJoistFixing: 'Joist hangers or 2 × 100mm galv nails skew-nailed',
  },
  spacing: {
    piles: '1.8m max (check tables for bearer/joist size)',
    bearers: '1.2-1.8m centres depending on joist span',
    joists: '400mm, 450mm, or 600mm centres',
  },
  bracing: {
    requirement: 'Timber or steel cross-bracing under floor if >600mm off ground',
  },
  materials: {
    piles: { calc: '(length ÷ 1.8 + 1) × (width ÷ 1.8 + 1)', unit: 'ea' },
    coachBolts: { calc: 'pileCount × 2', unit: 'ea' },
    jostHangers: { calc: 'joistCount × 2', unit: 'ea' },
  },
};

export const RIB_RAFT = {
  name: 'Rib Raft / Waffle Slab',
  standard: 'Requires engineering',
  layers: [
    '1. Level site, compact',
    '2. Sand pad (50mm)',
    '3. Polythene DPM',
    '4. EPS pods laid in grid pattern',
    '5. Edge forms with rebate if required',
    '6. Reinforcing in ribs (D12 bars typical) and mesh in slab',
    '7. Concrete pour (pods remain in place)',
  ],
  typicalRibSize: '300mm deep × 300mm wide',
  slabThickness: '85mm over pods',
  notes: [
    'Requires engineering for specific design',
    'Good for reactive soils',
    'Pods must be dry before pour',
  ],
};

// ============================================================================
// 2. FLOOR FRAMING ASSEMBLIES
// ============================================================================

export const TIMBER_FLOOR = {
  name: 'Timber Floor Framing',
  standard: 'NZS 3604',
  components: {
    bearers: {
      sizes: ['140×45', '190×45', '240×45'],
      treatment: 'H3.2 minimum',
      fixing: '2 × M12 coach bolts to pile',
      spanTable: {
        '140×45': '1.5m max',
        '190×45': '2.0m max',
        '2×140×45': '2.4m max',
      },
    },
    joists: {
      sizes: ['140×45', '190×45', '240×45', '290×45'],
      treatment: 'H1.2 interior, H3.2 if exposed',
      spacing: ['400mm', '450mm', '600mm'],
      fixing: 'Joist hangers or 3 × skew nails to bearer',
      spanTable: {
        '140×45': '2.0m max',
        '190×45': '2.8m max',
        '240×45': '3.5m max',
        '290×45': '4.2m max',
      },
    },
    blocking: {
      requirement: '1 row per 2.4m span',
      size: 'Same depth as joist',
      fixing: '2 × 90mm nails each end',
    },
    flooring: {
      particleBoard: {
        size: '2400×1200×20mm T&G',
        areaPerSheet: 2.88,
        fixing: '50mm galv ring shank nails or screws at 150mm edges, 300mm field + adhesive',
      },
      plywood: {
        size: '2400×1200×17-21mm',
        areaPerSheet: 2.88,
        fixing: 'Same as particle board',
      },
    },
  },
  cantilever: {
    maxProjection: '1/3 of back span (NZS 3604)',
    blocking: 'Required at support line',
  },
  materials: {
    bearers: { calc: '(width ÷ spacing + 1) × length', unit: 'lm' },
    joists: { calc: '(length ÷ spacing + 1) × width', unit: 'lm' },
    flooring: { calc: 'area ÷ 2.88 × 1.05', unit: 'sht', note: '5% waste' },
    floorAdhesive: { calc: 'sheets ÷ 7', unit: 'tube' },
    joistHangers: { calc: 'joistCount × 2', unit: 'ea' },
  },
};

export const FLOOR_TO_SLAB = {
  name: 'Floor to Slab Connection',
  standard: 'NZS 3604',
  bottomPlate: {
    size: '90×45 H3.2',
    fixing: 'Foundation bolt through plate, max 1200mm centres',
    dpc: 'DPC strip under plate on concrete',
  },
  notes: [
    'Pre-drill bottom plate for foundation bolts',
    'Check level before fixing - pack if needed',
  ],
};

// ============================================================================
// 3. WALL FRAMING ASSEMBLIES
// ============================================================================

export const EXTERNAL_WALL = {
  name: 'External Wall Framing',
  standard: 'NZS 3604',
  components: {
    bottomPlate: {
      size: '90×45',
      treatment: 'H3.2 on concrete, H1.2 on timber floor',
      fixing: 'Foundation bolts at 1200mm max on slab, or 100mm nails at 600mm to floor',
    },
    studs: {
      size: '90×45 SG8',
      spacing: { standard: '600mm', bracing: '400mm' },
      fixing: '2 × 90mm nails top and bottom, skew-nailed',
      length: '2.4m standard, 2.7m, 3.0m available',
    },
    topPlate: {
      size: '90×45 double',
      fixing: 'Nailed together at 600mm, lapped 1200mm min at joins',
    },
    noggins: {
      size: '90×45',
      spacing: '1 row at 800mm height for 2.4m walls',
      fixing: '2 × 90mm nails each end, staggered for easy nailing',
    },
  },
  openings: {
    lintel: {
      sizes: {
        'up to 1200mm': '140×45 SG8',
        '1200-1800mm': '190×45 SG8',
        '1800-2400mm': '240×45 SG8 or engineered',
        'over 2400mm': 'Engineered beam required',
      },
      fixing: 'Seated on trimmer studs, 3 × 90mm nails each end',
    },
    trimmerStud: {
      size: '90×45',
      fixing: 'Nailed to king stud full height',
      count: '2 per opening (one each side)',
    },
    kingStud: {
      size: '90×45',
      count: '2 per opening (one each side)',
    },
    sillTrimmer: {
      size: '90×45',
      fixing: '2 × 90mm nails each end',
    },
  },
  corners: {
    detail: '3 studs arranged to provide internal fixing for linings',
    fixing: '3 × 90mm nails at 300mm centres',
  },
  intersections: {
    detail: 'Ladder blocking or extra stud for internal wall fixing',
  },
  materials: {
    studs: { calc: 'length ÷ 0.6 + 1 + openings × 4', unit: 'ea', note: '×4 for trimmers/kings' },
    bottomPlate: { calc: 'length', unit: 'lm' },
    topPlates: { calc: 'length × 2', unit: 'lm' },
    noggins: { calc: 'rows × (length ÷ 0.6)', unit: 'ea' },
    framingNails: { calc: 'wallLength ÷ 10', unit: 'kg', note: '1kg per 10lm' },
  },
};

export const INTERNAL_WALL = {
  name: 'Internal Wall (Non-Loadbearing)',
  standard: 'NZS 3604',
  components: {
    plates: { size: '90×45 or 70×45', treatment: 'H1.2' },
    studs: { size: '90×45 or 70×45', spacing: '600mm centres' },
    noggins: { spacing: '800mm height for GIB, mid-height for 2.4m walls' },
  },
  fixing: {
    toFloor: '100mm nails or screws at 600mm',
    toCeiling: 'Nailed to blocking between ceiling joists',
  },
};

export const BRACING_WALL = {
  name: 'Bracing Wall',
  standard: 'NZS 3604',
  types: {
    plywoodBracing: {
      material: '7.5mm structural ply',
      fixing: '30mm galv flat head nails at 150mm edges, 300mm field',
      minLength: '900mm panel',
    },
    gibBraceline: {
      material: '10mm GIB Braceline',
      fixing: 'GIB Braceline screws at 150mm edges, 200mm field',
      minLength: '600mm panel',
    },
    proprietaryBracing: {
      note: 'Follow manufacturer specs - Mitek, Pryda, etc.',
    },
  },
  requirements: {
    studSpacing: '400mm max for bracing walls',
    doubleTopPlate: 'Required',
    holdDowns: 'May be required at ends - check bracing demand',
  },
};

// ============================================================================
// 4. ROOF FRAMING ASSEMBLIES
// ============================================================================

export const RAFTER_ROOF = {
  name: 'Pitched Roof - Rafters',
  standard: 'NZS 3604',
  components: {
    rafters: {
      sizes: ['90×45', '140×45', '190×45', '240×45'],
      spacing: '900mm typical',
      fixing: '3 × skew nails to top plate + framing anchor',
      spanTable: {
        '90×45': '1.8m max',
        '140×45': '2.8m max',
        '190×45': '3.8m max',
        '240×45': '4.5m max',
      },
    },
    ridgeBoard: {
      size: 'Same depth as rafter or deeper (190×45, 240×45)',
      fixing: 'Rafters nailed through ridge, 3 × 90mm each side',
    },
    collarTies: {
      size: '90×45',
      spacing: 'Every third rafter pair minimum',
      position: 'Upper third of rafter length',
      fixing: '3 × 90mm nails each end',
    },
    ceilingJoists: {
      size: '90×45 or 70×35',
      spacing: '600mm centres',
      fixing: 'Nailed to wall plate, may tie rafter feet',
    },
    strutting: {
      requirement: 'Required for spans over 4.5m',
      angle: '45° minimum from horizontal',
      strutSize: '90×45',
      struttingBeam: '140×45 or larger on internal wall',
    },
  },
  birdsmouthCut: {
    seatCut: '45mm max depth',
    fixing: 'Framing anchor at plate connection',
  },
  overhangs: {
    eave: '450-600mm typical',
    verge: '200-300mm typical (requires outriggers if >300mm)',
  },
  materials: {
    rafters: { calc: '(length ÷ 0.9 + 1) × 2', unit: 'ea', note: '×2 for both sides' },
    ridge: { calc: 'length', unit: 'lm' },
    ceilingJoists: { calc: 'length ÷ 0.6 + 1', unit: 'ea' },
    collarTies: { calc: 'rafterPairs ÷ 3', unit: 'ea' },
    framingAnchors: { calc: 'rafterCount', unit: 'ea' },
  },
};

export const TRUSS_ROOF = {
  name: 'Truss Roof',
  standard: 'Engineered',
  spacing: '900mm typical (check engineer design)',
  fixing: {
    toPlate: 'Framing anchors both sides to top plate',
    bracing: 'Per truss manufacturer layout',
  },
  handling: [
    'Lift trusses vertically, never flat',
    'Brace first truss to temporary support',
    'Install permanent bracing as you go',
  ],
  notes: [
    'Do not cut or modify trusses without engineer approval',
    'Check truss layout for girder trusses at openings',
  ],
  materials: {
    trusses: { calc: 'length ÷ 0.9 + 1', unit: 'ea' },
    framingAnchors: { calc: 'trussCount × 2', unit: 'ea' },
  },
};

export const EAVE_DETAIL = {
  name: 'Eave Detail',
  components: {
    fascia: {
      sizes: ['180×18', '230×18', '280×18'],
      material: 'H3.2 LOSP or primed',
      fixing: '2 × 65mm galv nails per rafter',
    },
    soffit: {
      materials: ['6mm fibre cement', '9mm ply', 'pre-finished metal'],
      fixing: 'To soffit framing at 300mm centres',
      ventilation: 'Continuous strip vent or spaced vents for roof ventilation',
    },
    spouting: {
      types: ['Marley Stormcloud', 'Continuous Colorsteel'],
      fall: '1:500 minimum',
      fixing: 'Brackets at 900mm max centres',
    },
  },
  materials: {
    fascia: { calc: 'roofPerimeter', unit: 'lm' },
    soffit: { calc: 'roofPerimeter × soffitWidth', unit: 'm²' },
    spoutingBrackets: { calc: 'spoutingLength ÷ 0.9', unit: 'ea' },
  },
};

export const VERGE_DETAIL = {
  name: 'Verge Detail',
  components: {
    bargeBoard: {
      size: 'Match fascia size',
      fixing: 'To outriggers or last rafter',
    },
    bargeFlashing: {
      material: 'Colorsteel to match roof',
      fixing: 'Pop rivets at 300mm centres',
    },
  },
};

// ============================================================================
// 5. CLADDING ASSEMBLIES
// ============================================================================

export const WEATHERBOARD_CAVITY = {
  name: 'Weatherboard (Cavity System)',
  standard: 'E2/AS1',
  layers: [
    '1. Framing',
    '2. Building wrap (stapled, lapped 75mm horizontal, 150mm vertical)',
    '3. Cavity battens (45×18 H3.2 at 600mm centres)',
    '4. Weatherboards',
  ],
  fixing: {
    battens: '50mm galv nails through wrap into studs',
    weatherboards: 'Stainless or galv flat head nails, 1 per board per batten, 25mm above lap',
  },
  ventilation: {
    top: '10mm gap at soffit or vented flashing',
    bottom: '10mm gap at base or vented flashing',
  },
  corners: {
    external: 'Scriber mould or mitred corner',
    internal: 'Internal corner mould',
  },
  notes: [
    'E2/AS1 requires drained and vented cavity for all risk levels',
    'Bottom edge min 150mm above ground',
  ],
  materials: {
    buildingWrap: { calc: 'wallArea × 1.1', unit: 'm²', note: '10% for laps' },
    cavityBattens: { calc: 'wallArea ÷ 0.6', unit: 'lm' },
    weatherboards: { calc: 'wallArea ÷ 0.13', unit: 'lm', note: '150mm board @ 130mm exposed' },
    stainlessNails: { calc: 'wallArea × 35', unit: 'ea', note: '30-40 per m²' },
  },
};

export const SHEET_CLADDING = {
  name: 'Sheet Cladding (Shadowclad, Titan, etc.)',
  standard: 'E2/AS1',
  layers: [
    '1. Framing',
    '2. Building wrap (taped joints)',
    '3. Cavity battens at 600mm centres',
    '4. Sheet cladding',
  ],
  fixing: {
    nails: 'Stainless flat head at 150mm edges, 300mm field',
    screws: 'For fibre cement, countersunk stainless',
  },
  joints: {
    vertical: 'Over cavity batten, 10mm gap with backing rod and sealant, or cover flashing',
    horizontal: 'Z flashing or expressed joint',
  },
  notes: [
    'Follow manufacturer specs for specific products',
    'Pre-prime all cut edges',
  ],
  materials: {
    sheets: { calc: 'wallArea ÷ 2.7 × 1.1', unit: 'sht', note: '10% waste' },
    buildingWrap: { calc: 'wallArea × 1.1', unit: 'm²' },
    cavityBattens: { calc: 'wallArea ÷ 0.6', unit: 'lm' },
  },
};

export const BRICK_VENEER = {
  name: 'Brick Veneer',
  standard: 'E2/AS1',
  layers: [
    '1. Framing',
    '2. Building wrap',
    '3. 40-75mm cavity',
    '4. Brick veneer on concrete foundation',
  ],
  ties: {
    type: 'Galvanised or stainless brick ties',
    spacing: '600mm horizontal × 400mm vertical (1 per 0.24m²)',
    fixing: 'Screwed to framing through wrap',
  },
  ventilation: {
    weepHoles: 'Every 1200mm at base course and above flashings',
  },
  flashings: {
    base: 'DPC at base of cavity',
    windowHead: 'Stepped flashing over lintel',
    windowSill: 'Sill flashing with drip edge',
  },
  notes: [
    'Min 25mm clearance between brick and wrap',
    'Foundation for veneer must be designed for weight',
  ],
  materials: {
    brickTies: { calc: 'wallArea ÷ 0.24', unit: 'ea' },
    buildingWrap: { calc: 'wallArea × 1.1', unit: 'm²' },
  },
};

export const WINDOW_INSTALL = {
  name: 'Window & Door Installation',
  standard: 'E2/AS1',
  sequence: [
    '1. Check opening size (allow 10mm clearance all round)',
    '2. Install sill flashing first - turn up at jambs',
    '3. Install jamb flashings - lap over sill flashing',
    '4. Install head flashing - lap over jamb flashings',
    '5. Seal all laps with flashing tape',
    '6. Install window with packing for plumb and level',
    '7. Fix through flange or brackets',
    '8. Tape window flange to building wrap',
    '9. Cladding over flashings',
  ],
  fixings: {
    timberFrame: '8g × 50mm screws at 300mm centres through flange',
    directFixed: 'Through jamb into framing',
  },
  sealing: {
    exterior: 'Sealant at cladding to window junction',
    interior: 'Expanding foam at window to framing gap',
  },
  notes: [
    'Never rely on sealant alone for weatherproofing',
    'Sill must have 15° minimum slope',
  ],
  materials: {
    headFlashing: { calc: 'openingWidth + 0.2', unit: 'lm' },
    sillFlashing: { calc: 'openingWidth + 0.2', unit: 'lm' },
    jambFlashing: { calc: 'openingHeight × 2', unit: 'lm' },
    flashingTape: { calc: '(openingWidth + openingHeight) × 2', unit: 'lm' },
  },
};

// ============================================================================
// 6. ROOFING ASSEMBLIES
// ============================================================================

export const LONGRUN_ROOFING = {
  name: 'Long Run Steel Roofing',
  standard: 'Manufacturer specs',
  underlayStructure: {
    purlins: {
      size: '70×45 H3.2',
      spacing: '900mm typical (check manufacturer)',
      fixing: '2 × 100mm nails to each rafter/truss',
    },
  },
  roofing: {
    material: 'Colorsteel 0.40mm or 0.55mm',
    coverWidth: '760mm typical',
    fixings: {
      type: 'Type 17 hex head screws with EPDM washer',
      spacing: 'Every rib at purlins (6-8 per m²)',
      placement: 'Through pan, not rib (for residential)',
    },
    sidelapFasteners: 'Stitch screws at 300mm centres where sheets overlap',
  },
  flashings: {
    ridge: 'Colorsteel ridge cap with foam infill',
    barge: 'Barge flashing extending 50mm over roofing',
    apron: 'Apron flashing at wall junctions, min 75mm upstand',
    valley: 'Colorsteel valley gutter, min 400mm wide',
  },
  minPitch: '3° with specific products, 8° standard',
  materials: {
    roofingSheets: { calc: 'roofWidth ÷ 0.76', unit: 'ea', note: 'Per run' },
    purlins: { calc: 'rafterLength ÷ 0.9 × rafterCount', unit: 'lm' },
    roofingScrews: { calc: 'roofArea × 7', unit: 'ea' },
    ridgeCap: { calc: 'ridgeLength × 1.1', unit: 'lm' },
    bargeFlashing: { calc: 'bargeLength × 2', unit: 'lm' },
  },
};

export const ROOF_TILES = {
  name: 'Roof Tile Installation',
  standard: 'Manufacturer specs',
  underlay: {
    type: 'Roof underlay or building wrap',
    fixing: 'Stapled or capped nails',
  },
  battens: {
    size: '50×25 H3.2',
    gauge: '320mm typical (tile specific)',
    fixing: '2 × 50mm galv nails per batten per rafter',
  },
  tiles: {
    fixing: 'Every tile clipped or nailed in high wind zones, otherwise every alternate course',
    ridges: 'Bedded in mortar on flexipoint or mechanical fix',
    hips: 'Same as ridges',
    valleys: 'Cut tiles over valley tray, min 100mm gap at centre',
  },
  coverage: '10-12 tiles per m² typical',
  notes: [
    'Check tile weight for structure design',
    'Provide valley, ridge, and eave ventilation',
  ],
  materials: {
    tiles: { calc: 'roofArea × 11', unit: 'ea' },
    tileBattens: { calc: 'roofArea ÷ 0.32', unit: 'lm' },
    ridgeTiles: { calc: 'ridgeLength ÷ 0.3 × 1.1', unit: 'ea' },
    underlay: { calc: 'roofArea × 1.15', unit: 'm²' },
  },
};

// ============================================================================
// 7. INSULATION ASSEMBLIES
// ============================================================================

export const WALL_INSULATION = {
  name: 'Wall Insulation',
  standard: 'H1/AS1',
  requirements: {
    zone1: { R: 2.0, location: 'Auckland, Northland' },
    zone2: { R: 2.0, location: 'Most of North Island' },
    zone3: { R: 2.0, location: 'Lower North Island, upper South' },
    zone4: { R: 2.0, location: 'Most of South Island' },
    zone5: { R: 2.0, location: 'Central Otago, high country' },
    zone6: { R: 2.0, location: 'Alpine' },
  },
  installation: {
    batts: 'Friction fit between studs, no gaps or compression',
    wrap: 'Building wrap on outside acts as air barrier, not insulation',
  },
  commonProducts: {
    glasswool: { R: '2.2-2.6', thickness: '90mm' },
    polyester: { R: '2.0-2.4', thickness: '90mm' },
  },
  materials: {
    batts: { calc: 'wallArea × 1.05', unit: 'm²', note: '5% waste' },
  },
};

export const CEILING_INSULATION = {
  name: 'Ceiling Insulation',
  standard: 'H1/AS1',
  requirements: {
    zone1: { R: 2.9, location: 'Auckland, Northland' },
    zone2: { R: 2.9, location: 'Most of North Island' },
    zone3: { R: 3.3, location: 'Lower North Island, upper South' },
    zone4: { R: 3.3, location: 'Most of South Island' },
    zone5: { R: 3.3, location: 'Central Otago, high country' },
    zone6: { R: 3.3, location: 'Alpine' },
  },
  installation: {
    segments: 'Laid between ceiling joists, no gaps',
    batts: 'Laid between and over joists for higher R-value',
    clearances: 'Keep 50mm clear of recessed downlights (unless IC rated)',
  },
  notes: [
    'Do not compress insulation - reduces R-value',
    'Ensure roof space ventilation above insulation',
  ],
  materials: {
    batts: { calc: 'ceilingArea × 1.05', unit: 'm²' },
  },
};

export const UNDERFLOOR_INSULATION = {
  name: 'Underfloor Insulation',
  standard: 'H1/AS1',
  requirements: {
    allZones: { R: 1.3, note: 'Minimum for all climate zones' },
  },
  installation: {
    batts: 'Supported by netting, straps, or friction fit between joists',
    foilBacked: 'Stapled to joist underside with 25mm air gap below floor',
  },
  notes: [
    'Ensure adequate subfloor ventilation (3500mm² per m² floor area)',
    'Foil insulation requires air gap to work',
  ],
  materials: {
    batts: { calc: 'floorArea × 1.05', unit: 'm²' },
    supportNetting: { calc: 'floorArea', unit: 'm²' },
  },
};

// ============================================================================
// 8. INTERIOR LINING ASSEMBLIES
// ============================================================================

export const GIB_LINING = {
  name: 'GIB Plasterboard Installation',
  standard: 'GIB Site Guide',
  walls: {
    sheetThickness: '10mm standard, 13mm for higher bracing and impact',
    sheetSize: { width: 1200, heights: [2400, 2700, 3000, 3600] },
    areaPerSheet: { '2400': 2.88, '2700': 3.24, '3000': 3.6, '3600': 4.32 },
    orientation: 'Vertical or horizontal - minimise joins',
    fixing: {
      screws: '32mm GIB screws',
      spacing: '150mm at edges, 200mm in field',
      edgeDistance: '10mm min from edge',
    },
    joins: 'Recessed edge to recessed edge, square edge to corner',
  },
  ceilings: {
    sheetThickness: '10mm for 450mm joist centres, 13mm for 600mm',
    fixing: {
      screws: '41mm GIB screws (for 13mm board)',
      spacing: '150mm at edges, 200mm in field',
    },
    support: 'Must be fixed to framing, not just walls',
  },
  finishing: {
    level4: 'Standard paint finish - all joins taped and stopped, 3 coats',
    level5: 'High quality - skim coat entire surface',
  },
  accessoriesPerSheet: {
    screws: 32,
    compound: '1L per 2.88m²',
    tape: '3.6m per sheet',
  },
  materials: {
    sheets: { calc: 'area ÷ 2.88 × 1.1', unit: 'sht', note: '10% waste' },
    screws: { calc: 'sheetCount × 32', unit: 'ea' },
    compound: { calc: 'area × 0.35', unit: 'L' },
    tape: { calc: 'sheetCount × 3.6', unit: 'lm' },
    cornerBead: { calc: 'externalCorners × height', unit: 'lm' },
  },
};

export const GIB_BRACELINE = {
  name: 'GIB Braceline Installation',
  standard: 'GIB Bracing Systems',
  sheetThickness: '10mm GIB Braceline',
  fixing: {
    screws: 'GIB Braceline screws 6g × 25mm',
    spacing: '150mm at edges, 200mm in field',
  },
  requirements: {
    studSpacing: '600mm max',
    continuity: 'Full height sheets, continuous over openings if possible',
    holdDowns: 'At ends of bracing elements where required',
  },
};

export const WET_AREA_LINING = {
  name: 'Wet Area Linings',
  standard: 'E3/AS1',
  showerWalls: {
    substrate: 'Tile underlay / cement board (6mm)',
    height: 'Full height of tiled area + 50mm',
    fixing: '32mm cement board screws at 200mm centres',
    joints: 'Taped with fibreglass tape and tile adhesive',
  },
  bathroomWalls: {
    option1: 'GIB Aqualine (moisture resistant plasterboard)',
    option2: 'Standard GIB with waterproof paint (not in shower)',
  },
  notes: [
    'Never use standard GIB in showers',
    'Cement board does not provide waterproofing - membrane required',
  ],
  materials: {
    cementBoard: { calc: 'showerWallArea ÷ 2.16 × 1.1', unit: 'sht', note: '900×1800 sheets' },
    aqualine: { calc: 'bathroomWallArea ÷ 2.88 × 1.1', unit: 'sht' },
  },
};

// ============================================================================
// 9. WET AREA ASSEMBLIES
// ============================================================================

export const SHOWER_WATERPROOF = {
  name: 'Shower Waterproofing',
  standard: 'E3/AS1',
  sequence: [
    '1. Install cement board to framing',
    '2. Tape all joints with fibreglass tape',
    '3. Apply primer to substrate',
    '4. Apply first coat membrane (brush into corners)',
    '5. Embed tanking tape in all internal corners and floor/wall junctions',
    '6. Apply second coat membrane over tape',
    '7. Apply final coat membrane (minimum 1.5mm total DFT)',
    '8. Allow 24hr cure before tiling',
  ],
  coverage: {
    walls: '1800mm above finished floor level in shower',
    floor: 'Entire floor including under shower tray if tiled',
    threshold: '150mm beyond shower on walls',
  },
  falls: {
    floor: '1:50 minimum to waste (20mm per metre)',
    hobless: 'Requires linear drain and careful fall design',
  },
  products: {
    membrane: ['Ardex WPM 300', 'Sika 310', 'Mapei Mapelastic'],
    tankingTape: { width: '100mm for corners, 75mm for joints' },
    primer: 'As specified by membrane manufacturer',
  },
  materials: {
    membrane: { calc: 'showerArea × 1.5', unit: 'L', note: '1.5mm DFT' },
    tankingTape: { calc: 'cornerLength + jointLength', unit: 'lm' },
    primer: { calc: 'showerArea × 0.2', unit: 'L' },
  },
};

export const BATHROOM_FLOOR_WATERPROOF = {
  name: 'Bathroom Floor Waterproofing',
  standard: 'E3/AS1',
  requirements: {
    showerFloor: 'Full membrane required',
    bathroomFloor: 'Membrane optional but recommended',
    wetFloorShower: 'Full floor membrane with falls to drain',
  },
  upturn: {
    height: 'Minimum 100mm up walls (150mm at door threshold)',
  },
  penetrations: {
    treatment: 'Puddle flanges for drains, membrane dress-in for pipes',
  },
};

export const TILING = {
  name: 'Tiling',
  standard: 'Industry practice',
  substrate: {
    walls: 'Cement board or waterproofed GIB Aqualine',
    floors: 'Concrete slab or cement board over ply',
  },
  adhesive: {
    walls: { coverage: '4-5kg per m²', trowel: '10mm notched' },
    floors: { coverage: '5-6kg per m²', trowel: '10-12mm notched' },
    largeFormat: 'Back-butter tiles over 300×300',
  },
  grout: {
    coverage: '0.5-1kg per m²',
    jointWidth: '2-3mm for rectified, 3-5mm for standard tiles',
  },
  layout: {
    cuts: 'Keep cut tiles at edges and less visible areas',
    falls: 'Check fall before tiling - cannot be corrected with adhesive',
  },
  movement: {
    joints: 'Silicone at all internal corners and junctions',
    largeAreas: 'Movement joint every 4-5m in large floors',
  },
  materials: {
    adhesive: { calc: 'area × 5', unit: 'kg' },
    grout: { calc: 'area × 0.75', unit: 'kg' },
    silicone: { calc: 'cornerLength ÷ 5', unit: 'tube' },
  },
};

// ============================================================================
// 10. DECK ASSEMBLIES
// ============================================================================

export const TIMBER_DECK = {
  name: 'Standard Timber Deck',
  standard: 'NZS 3604',
  substructure: {
    piles: {
      type: 'H5 timber 125mm dia or concrete',
      spacing: '1.2-1.8m grid depending on bearer/joist size',
      embedment: 'H5: 600mm in ground, concrete: 450mm',
    },
    bearers: {
      sizes: ['140×45', '190×45'],
      treatment: 'H3.2',
      fixing: '2 × M12 coach bolts to pile',
      spanTable: {
        '140×45': '1.5m max',
        '190×45': '2.0m max',
        '2×190×45': '3.0m max',
      },
    },
    joists: {
      sizes: ['140×45', '190×45', '240×45'],
      treatment: 'H3.2',
      spacing: '450mm for 90mm wide decking, 600mm for 140mm',
      fixing: 'Joist hangers or 2 × 100mm galv nails',
      note: 'NEVER use 90×45 for deck joists',
    },
  },
  decking: {
    sizes: ['90×19', '140×32', '90×32'],
    treatment: 'H3.2 minimum',
    gap: '5-6mm between boards (use spacer)',
    fixing: '2 × 50mm stainless screws per joist (pre-drill hardwood)',
    edgeClearance: '20mm from edge',
    endJoints: 'Stagger joints, both ends over joist',
  },
  flashingToHouse: {
    requirement: 'Metal flashing under cladding, over deck joist',
    fall: 'Deck must fall away from house',
  },
  materials: {
    decking: { calc: 'area ÷ 0.145 × 1.1', unit: 'lm', note: '140mm board, 10% waste' },
    joists: { calc: '(length ÷ 0.45 + 1) × width', unit: 'lm' },
    bearers: { calc: '(width ÷ 1.2 + 1) × length', unit: 'lm' },
    posts: { calc: 'pileCount × (height + 0.6)', unit: 'lm', note: '+600mm embedment' },
    deckScrews: { calc: 'area × 22', unit: 'ea' },
    joistHangers: { calc: 'joistCount × 2', unit: 'ea' },
    coachBolts: { calc: 'pileCount × 2', unit: 'ea' },
  },
};

export const BALUSTRADE = {
  name: 'Balustrade',
  standard: 'NZBC F4',
  heightRequirement: {
    deck: '1000mm minimum if >1m above ground',
    stair: '900mm minimum measured vertically from nosing',
  },
  openings: {
    sphere: 'No opening to allow 100mm sphere to pass',
    climbable: 'Non-climbable design for residential',
  },
  posts: {
    size: '90×90 minimum',
    spacing: '1.8m max',
    fixing: 'Bolted through rim joist or post brackets',
  },
  rails: {
    top: '90×45 minimum',
    infill: 'Vertical balusters at max 100mm centres, or horizontal rails, or glass',
  },
  loadRequirements: {
    topRail: '0.75kN/m horizontal',
    infill: '0.5kN at any point',
  },
  materials: {
    posts: { calc: 'deckPerimeter ÷ 1.8 × postHeight', unit: 'lm' },
    topRail: { calc: 'deckPerimeter', unit: 'lm' },
    balusters: { calc: 'deckPerimeter ÷ 0.1 × balusterHeight', unit: 'lm' },
  },
};

// ============================================================================
// 11. STAIR ASSEMBLIES
// ============================================================================

export const TIMBER_STAIRS = {
  name: 'Timber Stairs',
  standard: 'NZBC D1',
  dimensions: {
    riser: { min: 115, max: 190, ideal: '165-180mm' },
    going: { min: 240, max: 355, ideal: '260-310mm' },
    formula: '2R + G = 550-700mm (ideal: 2R + G = 620mm)',
  },
  calculation: {
    numberOfRisers: 'Floor-to-floor height ÷ riser height (round to whole number)',
    numberOfTreads: 'Number of risers - 1',
  },
  stringers: {
    size: '240×45 or 290×45',
    count: '2 minimum, 3 for stairs over 900mm wide',
    fixing: 'Bolted at top to trimmer, bottom plate fixed to floor',
  },
  treads: {
    size: '240×32 or 260×32',
    nosing: '20-25mm overhang',
    fixing: '3 × 75mm screws per stringer + adhesive',
  },
  risers: {
    size: '180×19',
    note: 'Optional for interior, required for exterior',
  },
  headroom: {
    minimum: '2000mm measured vertically',
  },
  materials: {
    stringers: { calc: 'stringerCount × stringerLength', unit: 'lm' },
    treads: { calc: 'treadCount × stairWidth', unit: 'lm' },
    risers: { calc: 'riserCount × stairWidth', unit: 'lm' },
  },
};

// ============================================================================
// 12. DOOR ASSEMBLIES
// ============================================================================

export const INTERIOR_DOOR = {
  name: 'Interior Door Installation',
  standard: 'Industry practice',
  components: {
    doorLeaf: {
      standard: '2040×820×35mm',
      types: ['Hollow core', 'Solid core'],
    },
    jamb: {
      size: '110mm for 90mm wall + 2 × 10mm GIB',
    },
    architrave: {
      sizes: ['60×10', '90×18'],
      material: 'MDF or pine',
    },
  },
  installation: {
    sequence: [
      '1. Check opening size - 2100mm × 870mm typical',
      '2. Install jamb, pack for plumb and level',
      '3. Fix hinges to jamb (3 per door)',
      '4. Hang door, check swing and clearances',
      '5. Install latch plate',
      '6. Install architraves',
      '7. Install door stop',
    ],
    clearances: {
      top: '2-3mm',
      sides: '2-3mm each side',
      bottom: '10mm above floor, 15mm above carpet',
    },
  },
  hardware: {
    hinges: '3 × 100mm loose pin hinges',
    latch: 'Tubular latch 60mm backset standard',
    stop: '12×12 door stop around jamb',
  },
  materials: {
    doorLeaf: { calc: '1', unit: 'ea' },
    jambSet: { calc: '1', unit: 'ea' },
    hinges: { calc: '3', unit: 'ea' },
    latch: { calc: '1', unit: 'ea' },
    architrave: { calc: '(2.1 + 2.1 + 0.87) × 2', unit: 'lm', note: 'Both sides' },
    doorStop: { calc: '2.1 + 2.1 + 0.87', unit: 'lm' },
  },
};

export const EXTERIOR_DOOR = {
  name: 'Exterior Door Installation',
  standard: 'E2/AS1',
  components: {
    doorLeaf: {
      standard: '2040×820×40mm',
      types: ['Solid core', 'Exterior rated'],
    },
    jamb: 'H3.2 jamb or aluminium frame',
    threshold: 'Aluminium or hardwood sill',
  },
  weatherseal: {
    jambs: 'Compressible weatherstrip or brush seal',
    threshold: 'Brush seal or weatherbar',
  },
  flashing: {
    head: 'Head flashing integrated with wall flashing',
    sill: 'Sill flashing with slope away from door',
  },
  hardware: {
    hinges: '3-4 × heavy duty hinges',
    lockset: 'Deadbolt + passage set, or multipoint lock',
  },
};

// ============================================================================
// 13. FINISHING ASSEMBLIES
// ============================================================================

export const SKIRTING_ARCHITRAVE = {
  name: 'Skirting & Architrave',
  standard: 'Industry practice',
  skirting: {
    sizes: ['60×10', '90×18', '135×18'],
    material: 'MDF primed, pine primed, or hardwood',
    fixing: 'Brad nails or adhesive + pins at 400mm centres',
    corners: 'Internal mitred or scribed, external mitred',
    joins: 'Scarf joint at 45° on straight runs',
  },
  architrave: {
    sizes: ['60×10', '90×18'],
    fixing: 'Same as skirting',
    reveal: '5-10mm setback from jamb edge',
  },
  scotia: {
    size: '20×20 or 30×30',
    use: 'Ceiling to wall junction',
    fixing: 'Brad nails at 400mm, fill holes',
  },
  materials: {
    skirting: { calc: 'roomPerimeter - doorOpenings', unit: 'lm' },
    architrave: { calc: 'doorCount × 10', unit: 'lm', note: '~10lm per door both sides' },
    scotia: { calc: 'ceilingPerimeter', unit: 'lm' },
  },
};

// ============================================================================
// 14. COMMON MISTAKES - AI MUST FLAG
// ============================================================================

export const COMMON_MISTAKES = {
  foundations: [
    'Mesh placed directly on polythene (needs chairs)',
    'Foundation bolts too far from openings (need within 300mm)',
    'DPM not lapped or taped correctly',
    'Insufficient cover to reinforcing (need 50mm)',
    'Boxing not level or braced',
  ],
  framing: [
    'Studs at 600mm in bracing walls (should be 400mm)',
    'Single top plate (need double for external walls)',
    'No noggins for GIB fixing (need at 800mm height)',
    'Lintels undersized for span',
    'Bottom plate wrong treatment (need H3.2 on slab)',
    '90×45 used for deck joists (minimum 140×45)',
  ],
  cladding: [
    'No cavity where required (E2/AS1)',
    'Building wrap not taped at joints',
    'Window flashings installed wrong sequence (sill first)',
    'Bottom of cladding too close to ground (<150mm)',
    'Cavity not vented at top and bottom',
  ],
  roofing: [
    'Roofing screws over-tightened (compresses washer)',
    'Insufficient pitch for chosen roofing',
    'Ridge/barge flashings not sealed',
    'Purlins not straight (causes wavy roofline)',
  ],
  wetAreas: [
    'Standard GIB in shower (need cement board)',
    'Membrane not turned up walls high enough (need 1800mm)',
    'No fall to waste (need 1:50 minimum)',
    'Missed tanking tape in corners',
    'Tiling before membrane cured',
  ],
  insulation: [
    'Compressed batts (reduces R-value)',
    'Gaps between batts',
    'Insulation covering downlights (fire risk)',
    'No ventilation above ceiling insulation',
  ],
  stairs: [
    'Inconsistent riser heights (trip hazard)',
    'Formula not met (2R + G should be 550-700mm)',
    'Insufficient headroom (need 2000mm)',
    'Nosing too short or too long (20-25mm)',
  ],
  decks: [
    '90×45 joists used (need 140×45 minimum)',
    'Posts not embedded deep enough (600mm for H5)',
    'No fall away from house',
    'Decking gaps too tight or too wide (5-6mm correct)',
  ],
  balustrades: [
    'Height under 1000mm (if >1m above ground)',
    'Openings allow 100mm sphere to pass',
    'Climbable design (horizontal rails under 800mm)',
    'Posts not adequately fixed',
  ],
};

// ============================================================================
// 15. HELPER FUNCTIONS
// ============================================================================

/**
 * Get assembly by name
 * @param {string} category - The category (foundations, walls, etc.)
 * @param {string} name - The assembly name
 * @returns {object|null}
 */
export function getAssembly(category, name) {
  const assemblies = NZ_ASSEMBLIES[category];
  if (!assemblies) return null;
  return assemblies[name] || null;
}

/**
 * Get all assemblies for a category
 * @param {string} category
 * @returns {object}
 */
export function getAssembliesForCategory(category) {
  return NZ_ASSEMBLIES[category] || {};
}

/**
 * Check for common mistakes based on materials
 * @param {string} category
 * @param {object} materials - Material quantities to check
 * @returns {string[]} - Array of warning messages
 */
export function checkForMistakes(category, materials) {
  return COMMON_MISTAKES[category] || [];
}

/**
 * Generate assemblies summary for AI prompt
 * @returns {string}
 */
export function getAssembliesForPrompt() {
  return `
═══════════════════════════════════════════════════════════════
              NZ BUILDING ASSEMBLIES REFERENCE
═══════════════════════════════════════════════════════════════

CRITICAL ASSEMBLY RULES - AI MUST FOLLOW:

FOUNDATIONS:
• Slab: 100mm concrete, 665 mesh on chairs (50mm cover), DPM underneath
• Piles: H5 timber 125mm dia, 600mm embedment, 2×M12 bolts to bearer
• Foundation bolts: M12×240 at 1200mm max + both sides of openings

FLOOR FRAMING:
• Bearers: 140×45 for 1.5m span, 190×45 for 2.0m, H3.2
• Joists: 140×45 for 2.0m, 190×45 for 2.8m, 240×45 for 3.5m
• Flooring: 20mm T&G particle board, nailed + glued, 2.88m² per sheet

WALL FRAMING:
• Studs: 90×45 SG8 at 600mm standard, 400mm for bracing
• Plates: Double top plate, H3.2 bottom plate on concrete
• Noggins: 1 row at 800mm height for 2.4m walls
• Lintels: 140×45 to 1.2m, 190×45 to 1.8m, 240×45 to 2.4m

ROOF FRAMING:
• Rafters: 900mm centres, 140×45 to 2.8m, 190×45 to 3.8m
• Purlins: 70×45 at 900mm centres
• Framing anchors at every rafter to plate connection

CLADDING (E2/AS1):
• Building wrap lapped 75mm horizontal, 150mm vertical, taped
• Cavity battens 45×18 at 600mm centres
• Bottom of cladding 150mm above ground minimum

ROOFING:
• Long run: Type 17 screws through pan, 6-8 per m²
• Min pitch 8° standard (3° with specific products)
• Ridge cap, barge flashing required

INSULATION (H1/AS1):
• Walls: R2.0 minimum all zones
• Ceiling: R2.9 (zone 1-2), R3.3 (zone 3-6)
• Underfloor: R1.3 all zones

GIB LINING:
• 10mm standard, 13mm for 600mm joist centres
• Screws 32mm at 150mm edges, 200mm field
• 32 screws per sheet, 1L compound per 2.88m²

WET AREAS (E3/AS1):
• Shower: Cement board substrate + membrane to 1800mm
• Membrane 1.5mm DFT, tanking tape in all corners
• Floor fall 1:50 to waste

DECKS (NZS 3604):
• NEVER use 90×45 joists - minimum 140×45
• Joists at 450mm for 90mm decking, 600mm for 140mm
• Posts H4, 600mm in ground
• 22 deck screws per m²

STAIRS (D1):
• 2R + G = 550-700mm (ideal 620mm)
• Risers 115-190mm (ideal 165-180mm)
• Going 240-355mm (ideal 260-310mm)
• Headroom 2000mm minimum

BALUSTRADES (F4):
• 1000mm height if >1m above ground
• No 100mm sphere to pass through
• Non-climbable design

COMMON MISTAKES TO FLAG:
• 90×45 deck joists (wrong - use 140×45)
• Standard GIB in shower (use cement board)
• Single top plate external walls (need double)
• Studs at 600mm in bracing walls (need 400mm)
• No cavity in cladding (E2/AS1 requires it)
• Mesh directly on polythene (needs chairs)
• Insufficient membrane height (need 1800mm)
`;
}

// ============================================================================
// 16. EXPORT ALL
// ============================================================================

export const NZ_ASSEMBLIES = {
  foundations: {
    SLAB_ON_GROUND,
    PILE_FOUNDATION,
    RIB_RAFT,
  },
  floors: {
    TIMBER_FLOOR,
    FLOOR_TO_SLAB,
  },
  walls: {
    EXTERNAL_WALL,
    INTERNAL_WALL,
    BRACING_WALL,
  },
  roof: {
    RAFTER_ROOF,
    TRUSS_ROOF,
    EAVE_DETAIL,
    VERGE_DETAIL,
  },
  cladding: {
    WEATHERBOARD_CAVITY,
    SHEET_CLADDING,
    BRICK_VENEER,
    WINDOW_INSTALL,
  },
  roofing: {
    LONGRUN_ROOFING,
    ROOF_TILES,
  },
  insulation: {
    WALL_INSULATION,
    CEILING_INSULATION,
    UNDERFLOOR_INSULATION,
  },
  linings: {
    GIB_LINING,
    GIB_BRACELINE,
    WET_AREA_LINING,
  },
  wetAreas: {
    SHOWER_WATERPROOF,
    BATHROOM_FLOOR_WATERPROOF,
    TILING,
  },
  decks: {
    TIMBER_DECK,
    BALUSTRADE,
  },
  stairs: {
    TIMBER_STAIRS,
  },
  doors: {
    INTERIOR_DOOR,
    EXTERIOR_DOOR,
  },
  finishing: {
    SKIRTING_ARCHITRAVE,
  },
  validation: {
    COMMON_MISTAKES,
  },
};

export default NZ_ASSEMBLIES;
