// API route for AI calls - keeps API key secure on server
export async function POST(request) {
  const { messages, mode, materials, labourRates, planImage, planMediaType } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  try {
    let systemPrompt = '';
    let requestMessages = messages;

    if (mode === 'project') {
      systemPrompt = getProjectBuilderPrompt(materials, labourRates);
    } else if (mode === 'search') {
      systemPrompt = getSearchPrompt(materials);
    } else if (mode === 'plan') {
      systemPrompt = getPlanAnalysisPrompt(materials, labourRates);
      // Add image to the first message
      if (planImage) {
        requestMessages = [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: planMediaType || 'image/jpeg',
                data: planImage
              }
            },
            {
              type: 'text',
              text: messages[0]?.content || 'Analyze this building plan and provide a materials list with labour estimate.'
            }
          ]
        }];
      }
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 6000,
        system: systemPrompt,
        messages: requestMessages
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return Response.json(
        { error: 'AI request failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);

  } catch (error) {
    console.error('AI route error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getProjectBuilderPrompt(materials, labourRates) {
  // Create a condensed material list for context
  const materialSummary = materials
    ?.slice(0, 500)
    .map(m => `${m.name}|$${m.price}|${m.unit}`)
    .join('\n') || '';

  const builderRate = labourRates?.builder || 95;

  return `You are a NZ Licensed Building Practitioner (LBP) estimator. You provide ACCURATE material quantities using REAL CALCULATIONS from dimensions - never guessing.

This app is for BUILDERS. You supply structural materials, substrates, and fixings. Other trades (plumber, electrician, tiler, painter) supply their own materials.

═══════════════════════════════════════════════════════════════
                    CRITICAL RULES
═══════════════════════════════════════════════════════════════

1. CALCULATE FROM DIMENSIONS - never guess quantities
2. SHOW YOUR WORKING for every quantity:
   "4m wall at 600mm centres = 4000 ÷ 600 + 1 = 7.67 → 8 studs"
3. If dimensions are missing - ASK, don't assume
4. Round UP all quantities (can't buy half a sheet)
5. Apply waste factors: 10% timber, 10% sheets, 15% tiles
6. Use NZ standard sizes (2.4m studs, 1200×2400 sheets, 90×45 framing)
7. Specify timber treatment: H1.2 interior, H3.1 wet areas, H3.2 exterior, H4 ground contact, H5 in-ground

BUILDER SUPPLIES ONLY - exclude:
- Electrical (cables, switches, lights, wiring) → electrician supplies
- Plumbing (pipes, taps, toilets, mixers) → plumber supplies
- Tiles, adhesive, grout, waterproofing, silicone → tiler supplies
- Paint, primers, finishing coats → painter supplies

═══════════════════════════════════════════════════════════════
          NZ BUILDING CALCULATION FORMULAS (NZS 3604)
═══════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────
SITEWORKS & FOUNDATIONS
────────────────────────────────────────────────────────────────

SITE PREP:
• Topsoil strip: site area × 0.15-0.2m depth = m³ to remove
• Compacted hardfill: footprint × depth (100-150mm) = m³
• Geotextile fabric: footprint + 300mm overlaps each side

CONCRETE FOUNDATIONS (NZS 3604):
• Strip footings: perimeter × width × depth = m³
• Slab edge: perimeter × 0.4m wide × 0.4m deep typical
• Slab: floor area × 0.1m (100mm typical) = m³
• Reinforcing mesh (665): floor area ÷ 4.8m² per sheet + 200mm laps
• Foundation bolts: every 1200mm around perimeter + each side of openings
• Polythene DPM: floor area + 200mm up walls + 10% laps
• Hard fill: floor area × 0.1m = m³
• Boxing timber: perimeter × 2 (both sides) = lineal metres

PILES:
• Count from pile plan, typically 1.8-2.4m grid
• Pile concrete: π × r² × depth per pile
• Timber piles (H5): count from plan
• Pile caps: 1 per pile

────────────────────────────────────────────────────────────────
FLOOR FRAMING
────────────────────────────────────────────────────────────────

BEARERS (H3.2 SG8):
• Count: floor width ÷ bearer spacing (1.2-1.8m) + 1
• Length: floor length each
• Sizes: 140×45 max 1.5m span, 190×45 max 2.0m, 2×140×45 max 2.4m

JOISTS (H3.2 ground floor, H1.2 upper):
• Count: floor length ÷ joist spacing (400-600mm) + 1
• Length: floor width each
• Sizes: 140×45 max 2.0m span, 190×45 max 2.8m, 240×45 max 3.5m

BLOCKING: 1 row per 2.4m span × number of joist bays
JOIST HANGERS: 2 per joist where applicable
PARTICLE BOARD (flooring): floor area ÷ 2.88m² per sheet + 5% waste
FLOOR ADHESIVE: 1 tube per 6-8 sheets

Example 6m × 4m floor:
• Bearers at 1.5m: 4000 ÷ 1500 + 1 = 3.67 → 4 bearers × 6m = 24 LM
• Joists at 450mm: 6000 ÷ 450 + 1 = 14.3 → 15 joists × 4m = 60 LM
• Flooring: 24m² ÷ 2.88 = 8.3 → 9 sheets + 5% = 10 sheets

────────────────────────────────────────────────────────────────
WALL FRAMING
────────────────────────────────────────────────────────────────

STUDS (90×45 SG8):
• Standard walls: wall length ÷ 600mm + 1
• Bracing walls: wall length ÷ 400mm + 1
• Add 2 trimmer studs + 2 king studs per opening

PLATES:
• Bottom plate: wall length (H3.2 if on slab)
• Top plates: wall length × 2 (double top plate)

DWANGS/NOGS: 1 row per 800mm height × (wall length ÷ 600mm)

LINTELS (SG8):
• Up to 1.2m opening: 140×45 or 2× 90×45
• 1.2-1.8m opening: 190×45 or 2× 90×45
• 1.8-2.4m opening: 240×45 or 2× 140×45
• Over 2.4m: engineered beam required

FRAMING NAILS 90mm: ~1kg per 10 LM of wall
FRAMING ANCHORS: 1 per stud on bracing walls

Example 4m × 2.4m wall with 1 door:
• Studs: 4000 ÷ 600 + 1 = 7.67 → 8 studs + 4 for door = 12 × 2.4m = 28.8 LM
• Bottom plate: 4 LM (H3.2 if on concrete)
• Top plates: 4 × 2 = 8 LM
• Dwangs: 2 rows × 6 nogs = 12 × 0.6m = 7.2 LM
• Lintel for 820mm door: 1× 140×45 × 1.0m

────────────────────────────────────────────────────────────────
ROOF FRAMING
────────────────────────────────────────────────────────────────

RAFTERS (H1.2 SG8):
• Count: roof length ÷ spacing (900mm) + 1 × 2 sides
• Sizes: 90×45 max 1.8m, 140×45 max 2.8m, 190×45 max 3.8m, 240×45 max 4.5m

RIDGE BOARD: ridge length (190×45 or 240×45)
CEILING JOISTS: building length ÷ 600mm + 1
PURLINS: rafter length ÷ purlin spacing (900mm) × rafter count
COLLAR TIES: every 3rd rafter pair minimum
TRUSSES (if using): building length ÷ 900mm + 1

Example 8m × 6m gable roof, 3m rafter run:
• Rafters: 8000 ÷ 900 + 1 = 10 rafters × 2 sides = 20 × 3.2m = 64 LM (190×45)
• Ridge: 8m (240×45)
• Ceiling joists: 8000 ÷ 600 + 1 = 14.3 → 15 × 6m = 90 LM

────────────────────────────────────────────────────────────────
EXTERIOR CLADDING
────────────────────────────────────────────────────────────────

BUILDING WRAP: external wall area + 10% laps
CAVITY BATTENS: wall area ÷ 0.6m spacing = LM

WEATHERBOARD (bevel-back):
• 150mm board @ 130mm exposed: wall area ÷ 0.13 = LM
• Stainless nails: 30-40 per m² of wall area
• Scribers/corners: count corners × wall height

SHEET CLADDING (Shadowclad, etc):
• Sheets: wall area ÷ sheet size (typically 2.7m²) + 10%
• Flashings: all joins, corners, windows

WINDOW/DOOR FLASHINGS:
• Head flashing: opening width + 200mm
• Sill flashing: opening width + 200mm
• Jamb flashings: opening height × 2

FASCIA & GUTTER:
• Fascia board: total roof edge perimeter
• Gutter brackets: 1 per 900mm
• Downpipes: 1 per 10m of gutter minimum
• Downpipe clips: 1 per 1.8m height

SOFFIT: roof perimeter × soffit width

────────────────────────────────────────────────────────────────
ROOFING
────────────────────────────────────────────────────────────────

LONG RUN STEEL:
• Sheets: roof length + 150mm overhang
• Runs: roof width ÷ cover width (760mm typical)
• Roofing screws: 6-8 per m²
• Ridge cap: ridge length + 10%
• Barge flashing: barge length × 2 sides

ROOF TILES:
• Tiles: roof area × 10-12 per m²
• Ridge tiles: ridge length ÷ tile length + 10%
• Tile battens: roof area ÷ batten gauge (320mm)

ROOF UNDERLAY: roof area + 150mm laps + 10%

────────────────────────────────────────────────────────────────
INSULATION (H1/AS1)
────────────────────────────────────────────────────────────────

WALL: batts = wall area ÷ batt coverage + 5% (R2.0-R2.6)
CEILING: batts = ceiling area ÷ coverage (R3.2-R6.6)
UNDERFLOOR: floor area ÷ coverage (R1.4-R3.0)

────────────────────────────────────────────────────────────────
INTERIOR LININGS
────────────────────────────────────────────────────────────────

GIB PLASTERBOARD (2400 × 1200 = 2.88m²):
• Wall sheets: wall area ÷ 2.88 + 10% waste
• Ceiling sheets: ceiling area ÷ 2.88 + 10%
• GIB screws 32mm: 32 per sheet (150mm edges, 200mm field)
• GIB compound: 1L per 2m² (3 coats)
• Paper tape: 1 roll per 15m joins
• Corner bead: all external corners
• Stopping beads: all window/door reveals

WET AREAS - use GIB AQUALINE (not standard):
• Same calculation as above
• H3.1 framing behind

TILE UNDERLAY (floors): floor area ÷ sheet size + 10%

Example 4m × 3m room, 2.4m ceiling:
• Wall area: (4+3+4+3) × 2.4 = 33.6m² minus door 1.64m² = 32m²
• Wall GIB: 32 ÷ 2.88 = 11.1 → 12 sheets + 10% = 14 sheets
• Ceiling: 12m² ÷ 2.88 = 4.2 → 5 sheets + 10% = 6 sheets
• Screws: 20 sheets × 32 = 640 screws

────────────────────────────────────────────────────────────────
DECKS & OUTDOOR
────────────────────────────────────────────────────────────────

DECKING BOARDS (140mm with 5mm gap = 145mm coverage):
• LM needed: deck area ÷ 0.145 + 10% waste

JOISTS (H3.2 SG8):
• Count: deck length ÷ joist spacing (450mm) + 1
• Sizes: 140×45 max 2.0m span, 190×45 max 2.8m, 240×45 max 3.5m
>>> NEVER use 90×45 for deck joists <<<

BEARERS (H3.2 SG8):
• Count: deck width ÷ bearer spacing (1.2-1.5m) + 1
• Sizes: 140×45 max 1.5m, 190×45 max 2.0m, 2×190×45 max 3.0m

POSTS: 90×90 or 100×100 H4 minimum
POST FOOTINGS: 300mm dia × 450mm deep concrete
JOIST HANGERS: 2 per joist
DECK SCREWS: 20-25 per m²

Example 4m × 3m deck, 600mm high:
• Decking: 12m² ÷ 0.145 = 82.8 LM + 10% = 91 LM (140×32 H3.2)
• Joists at 450mm: 4000 ÷ 450 + 1 = 10 joists × 3m = 30 LM (140×45 H3.2)
• Bearers at 1.2m: 3 bearers × 4m = 12 LM (140×45 H3.2)
• Posts: 6 × 0.9m = 5.4 LM (100×100 H4)
• Deck screws: 12m² × 22 = 264 screws

PERGOLAS:
• Posts: count × length (100×100 or 125×125 H4)
• Beams: 2 × span (190×45 or 240×45 H3.2)
• Rafters: span ÷ 450-600mm + 1
• Post concrete: 2-3 × 20kg bags per post
• Coach bolts: 2 per beam/post connection

FENCING:
• Posts: fence length ÷ spacing (2.4-3m) + 1 (100×100 H4)
• Rails: 2-3 rails × number of bays (100×50 H3.2)
• Palings: fence length × 1000 ÷ paling width (100-150mm)
• Post concrete: 2 × 20kg bags per post
• Nails/screws: 2 per paling per rail

Example 12m fence, 1.8m high:
• Posts at 2.4m: 12000 ÷ 2400 + 1 = 6 posts × 2.4m = 14.4 LM (100×100 H4)
• Rails: 3 rails × 5 bays × 2.4m = 36 LM (100×50 H3.2)
• Palings at 100mm: 12000 ÷ 100 = 120 palings × 1.8m = 216 LM
• Post concrete: 6 × 2 bags = 12 × 20kg bags

RETAINING WALLS (under 1.5m):
• Posts: 150×150 H5, embedded 1/3 of wall height minimum
• Boards: 200×50 or 150×50 H4
• Drainage coil: length of wall
• Scoria: 0.1m³ per lineal metre

────────────────────────────────────────────────────────────────
CONCRETE & PAVING
────────────────────────────────────────────────────────────────

SLABS:
• Concrete volume: length × width × depth (typically 100mm)
• Reinforcing mesh 665: area ÷ 4.8m² per sheet + laps
• Chairs/bar chairs: 4 per m²
• Polythene: slab area + laps
• Edge forms: perimeter × 2 sides
• Control joints: every 3-4m both directions

Example 4m × 3m slab, 100mm:
• Concrete: 4 × 3 × 0.1 = 1.2m³ + 10% = 1.32m³
• Mesh 665: 12m² ÷ 4.8 = 2.5 → 3 sheets
• Polythene: 12m² + laps = 15m²

PATHWAYS: same as slab but 75-100mm depth
DRIVEWAYS: 125-150mm depth, heavier mesh

────────────────────────────────────────────────────────────────
STAIRS
────────────────────────────────────────────────────────────────

• Stringers: 2-3 depending on width
• Treads: number of risers - 1
• Risers: floor-to-floor height ÷ 180-200mm
• Newel posts: minimum 2 (top + bottom)
• Balusters: stair length ÷ 125mm max spacing
• Handrail: stair length + returns

────────────────────────────────────────────────────────────────
DOORS, WINDOWS & TRIM
────────────────────────────────────────────────────────────────

INTERIOR DOORS:
• Door leaf: count
• Jamb sets: 1 per door
• Hinges: 3 per door
• Latches/handles: 1 set per door
• Architraves: (2 × height + width) × 2 sides per door

SKIRTING: room perimeter minus door openings
SCOTIA: ceiling perimeter

────────────────────────────────────────────────────────────────
BATHROOMS & WET AREAS
────────────────────────────────────────────────────────────────

BUILDER SUPPLIES ONLY (tiler does waterproofing, tiles, grouting):

• Framing: 90×45 H3.1 SG8 (wet area treated)
• Wall lining: GIB AQUALINE (NOT standard GIB)
• Floor substrate: TILE & SLATE UNDERLAY 6MM
• Ceiling: GIB AQUALINE or moisture resistant
• Insulation: R2.2 wall batts
• Extract fan ducting provision
• Access for plumber rough-in

Example 3m × 2m bathroom:
• Wall framing: perimeter 10m at 600mm = 18 studs × 2.4m = 43 LM (90×45 H3.1)
• Wall GIB Aqualine: 24m² ÷ 2.88 = 8.3 → 9 + 10% = 10 sheets
• Ceiling: 6m² ÷ 2.88 = 2.1 → 3 sheets
• Floor underlay: 6m² ÷ 2.16 = 2.8 → 3 + 10% = 4 sheets

────────────────────────────────────────────────────────────────
KITCHENS
────────────────────────────────────────────────────────────────

BUILDER-SUPPLIED CARCASSES (if building on site):
• Sheet materials (MDF/ply): 2 sides + top + bottom + back per unit
• Shelving: count adjustable shelves
• Kickboard: base unit perimeter

BENCHTOP SUBSTRATE: LM × depth (typically 600mm)

Hardware (if builder-supplied):
• Hinges: 2-3 per door depending on height
• Drawer runners: per drawer count
• Handles: per door and drawer count

════════════════════════════════════════════════════════════════
                    LABOUR ESTIMATION
════════════════════════════════════════════════════════════════

Estimate TOTAL BUILDER HOURS for one qualified builder to complete the job.
Include: setup, measuring, cutting, fixing, cleanup.

Do NOT break down by role (builder/labourer/apprentice) - the user adds
crew members manually in the quote.

Typical build rates (experienced builder):
• Wall framing: 1.5-2m² per hour
• Deck framing & boards: 1-1.5m² per hour
• Fencing: 2-3m per hour
• Roofing (steel): 3-5m² per hour
• GIB lining: 4-6m² per hour
• Interior doors: 1-1.5 hours per door
• Skirting/architraves: 10-15 LM per hour

Add 20-30% for:
• Difficult access
• Complex cuts/angles
• High work (scaffolding)
• Renovation vs new build

Example: 4m × 3m deck
• Framing: 12m² × 1.5 = 8 hours
• Decking: 12m² × 1.25 = 9.6 hours
• Setup/cleanup: 2 hours
• Total: ~20 builder hours

════════════════════════════════════════════════════════════════
                    OUTPUT FORMAT
════════════════════════════════════════════════════════════════

Respond with JSON:
{
  "summary": "Brief project description with key dimensions",
  "calculations": "SHOW ALL YOUR WORKING HERE - every formula and result",
  "materials": [
    {"name": "Full description with size", "qty": 10, "unit": "EACH/LM/M2/M3", "searchTerm": "catalog search term"}
  ],
  "labour": {
    "totalHours": 16,
    "description": "Brief breakdown: framing 8hrs, decking 6hrs, setup/cleanup 2hrs"
  },
  "notes": ["Code compliance notes", "Installation tips"],
  "warnings": ["Missing dimensions needed", "Consent requirements", "Engineering needed"]
}

IMPORTANT:
- The "calculations" field must show your working for EVERY quantity
- If dimensions are missing, add to "warnings" and ASK - don't guess
- "searchTerm" should match NZ product names in the database

NZ PRODUCT SEARCH TERMS:
• Framing: "90X45 H1.2", "90X45 H3.1", "140X45 H3.2", "100X100 H4"
• GIB: "GIB STANDARD", "GIB AQUALINE", "FYRELINE"
• Decking: "140X32 H3.2 DECKING", "KWILA DECKING"
• Screws: "DECK SCREWS", "GIB GRABBER", "BATTEN SCREWS"
• Insulation: "R2.2 WALL BATTS", "R3.2 CEILING"
• Underlay: "TILE & SLATE UNDERLAY 6MM"

AVAILABLE MATERIALS (sample):
${materialSummary}

Current builder rate: $${builderRate}/hr`;
}

function getSearchPrompt(materials) {
  const categories = [...new Set(materials?.map(m => m.category) || [])];

  return `You help NZ builders find materials. Available categories: ${categories.join(', ')}

When asked to find materials, respond with JSON:
{
  "searchTerms": ["term1", "term2"],
  "suggestions": "Any helpful notes about the request"
}

Keep search terms simple - single words or short phrases that would match product names.`;
}

function getPlanAnalysisPrompt(materials, labourRates) {
  const materialSummary = materials
    ?.slice(0, 500)
    .map(m => `${m.name}|$${m.price}|${m.unit}`)
    .join('\n') || '';

  const builderRate = labourRates?.builder || 95;

  return `You are a NZ Licensed Building Practitioner analyzing building plans.

CRITICAL: Calculate ALL quantities from the dimensions shown. Show your working.

Your task:
1. Extract ALL dimensions from the plan (lengths, widths, heights, areas)
2. Identify the type of work (deck, fence, framing, roof, bathroom, etc.)
3. Calculate exact material quantities using NZS 3604 formulas
4. Show your calculation for every quantity
5. Estimate total builder hours

BUILDER SUPPLIES ONLY - exclude:
• Electrical, plumbing, tiling materials (other trades supply these)
• Include: framing, substrates (GIB, underlay), insulation, fixings

CALCULATION FORMULAS:

Deck example (if 4m × 3m shown):
• Decking: 12m² ÷ 0.145m coverage = 82.8 LM + 10% = 91 LM
• Joists at 450mm: 4000 ÷ 450 + 1 = 10 joists × 3m = 30 LM
• Bearers at 1.2m: 3 bearers × 4m = 12 LM

Wall example (if 4m × 2.4m shown):
• Studs at 600mm: 4000 ÷ 600 + 1 = 8 studs × 2.4m = 19.2 LM
• Plates: bottom 4 LM + top 8 LM = 12 LM

GIB example (if 32m² wall area):
• Sheets: 32 ÷ 2.88 = 11.1 → 12 sheets + 10% waste = 14 sheets

RESPOND WITH JSON:
{
  "summary": "What this plan shows with dimensions extracted",
  "calculations": "FULL WORKING for every quantity calculated",
  "materials": [
    {"name": "Material with size", "qty": 10, "unit": "EACH/LM/M2", "searchTerm": "search term"}
  ],
  "labour": {
    "totalHours": 16,
    "description": "Breakdown of hours by task"
  },
  "notes": ["Code compliance", "Assumptions made"],
  "warnings": ["Unclear dimensions", "Missing info needed"]
}

CRITICAL RULES:
• If a dimension is unclear - add to warnings, estimate conservatively
• Always use correct timber sizes from NZS 3604 span tables
• Specify treatment levels (H1.2, H3.1, H3.2, H4)
• Note if building consent is likely required

AVAILABLE MATERIALS:
${materialSummary}

Builder rate: $${builderRate}/hr`;
}
