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
        max_tokens: 4000,
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

  // Labour rates info
  const labourInfo = labourRates ? `
═══════════════════════════════════════════════════════════════
                      LABOUR RATES (NZD/hour)
═══════════════════════════════════════════════════════════════
Builder/Carpenter: $${labourRates.builder || 85}/hr
Labourer: $${labourRates.labourer || 45}/hr  
Apprentice: $${labourRates.apprentice || 30}/hr

When estimating labour:
- Include setup/pack up time (typically 0.5-1hr per day)
- Account for travel time if applicable
- Consider complexity - add 20-30% for difficult access or intricate work
- Standard productivity rates:
  • Deck: 2-3 sqm/hour for experienced carpenter
  • Framing: 1-2 sqm wall area/hour
  • Fence: 2-3m/hour (posts + rails + palings)
  • Roofing: 3-5 sqm/hour depending on pitch
  • Lining: 4-6 sqm/hour (measure + cut + fix)
  • Painting: 8-15 sqm/hour depending on prep needed
` : '';

  return `You are a NZ Licensed Building Practitioner (LBP) with expertise in estimating and the complete NZ Building Code. All recommendations MUST comply with NZS 3604:2011 and relevant Acceptable Solutions.

═══════════════════════════════════════════════════════════════
                    NZ BUILDING CODE REFERENCE
═══════════════════════════════════════════════════════════════

TIMBER TREATMENT LEVELS (B2/AS1):
- H1.2: Interior framing (dry, no weather exposure)
- H3.1: Exterior above ground, painted/coated
- H3.2: Exterior above ground, uncoated (decks, pergolas, fences)
- H4: Ground contact (posts in concrete/soil)
- H5: In-ground structural, fresh water contact

───────────────────────────────────────────────────────────────
WALL FRAMING (NZS 3604)
───────────────────────────────────────────────────────────────
Studs (H1.2 interior, H3.1 exterior walls):
- 90x45mm SG8: standard for single-storey, max 2.7m height
- 90x45mm SG8: two-storey ground floor, max 2.7m height  
- 70x45mm SG8: internal non-loadbearing partitions only, max 2.4m

Spacing: 600mm centres standard, 400mm for sheet bracing
Bottom plate: same size as studs, H3.1 if on concrete
Top plate: 90x45mm or double 90x45mm for loadbearing
Nogs/dwangs: 90x45mm at mid-height for walls over 1.5m

Lintels over openings (SG8 H1.2):
- Up to 1.2m opening: 140x45mm or 2x 90x45mm
- 1.2m-1.8m opening: 190x45mm or 2x 90x45mm  
- 1.8m-2.4m opening: 240x45mm or 2x 140x45mm
- Over 2.4m: engineered beam required (LVL, steel)

───────────────────────────────────────────────────────────────
DECK FRAMING (NZS 3604)
───────────────────────────────────────────────────────────────
Joists (H3.2 SG8) - MINIMUM SIZES:
- 90x45mm: max 1.2m span ONLY (low-level under 600mm)
- 140x45mm: max 2.0m @ 450mm ctrs, 1.8m @ 600mm ctrs
- 190x45mm: max 2.8m @ 450mm ctrs, 2.5m @ 600mm ctrs
- 240x45mm: max 3.5m @ 450mm ctrs, 3.2m @ 600mm ctrs
>>> NEVER use 70mm timber for deck joists <<<

Bearers (H3.2 SG8):
- 140x45mm: max 1.5m between posts
- 190x45mm: max 2.0m between posts
- 2x 140x45mm: max 2.4m between posts
- 2x 190x45mm: max 3.0m between posts

Posts: 90x90mm or 100x100mm H4 minimum
Footings: 300mm dia × 450mm deep concrete

Decking: 140x32mm or 140x25mm H3.2, or hardwood 140x19mm
Joist spacing: 450mm standard (400mm max for 19mm boards)

───────────────────────────────────────────────────────────────
ROOF FRAMING (NZS 3604)
───────────────────────────────────────────────────────────────
Rafters (H1.2 SG8):
- 90x45mm: max 1.8m span, light roofing only
- 140x45mm: max 2.8m span
- 190x45mm: max 3.8m span
- 240x45mm: max 4.5m span
Spacing: 900mm centres standard

Purlins (H1.2 SG8):
- 70x45mm: max 1.2m span (light roofing)
- 90x45mm: max 1.5m span
- 140x45mm: max 2.1m span

Ridge beam: 190x45mm minimum, or 240x45mm for spans over 3m
Ceiling joists: 90x45mm @ 600mm ctrs, 140x45mm for longer spans

───────────────────────────────────────────────────────────────
FLOOR FRAMING (NZS 3604)
───────────────────────────────────────────────────────────────
Floor joists (H1.2 SG8, H3.1 if exposed):
- 140x45mm: max 2.5m span @ 400mm ctrs
- 190x45mm: max 3.5m span @ 400mm ctrs
- 240x45mm: max 4.2m span @ 400mm ctrs
- 290x45mm: max 5.0m span @ 400mm ctrs

Bearers: typically 2x joist depth, or engineered
Spacing: 400mm centres for standard flooring

───────────────────────────────────────────────────────────────
SUBFLOOR & FOUNDATIONS
───────────────────────────────────────────────────────────────
Concrete slab: 100mm minimum thickness, DPM underneath
Foundations: 300mm wide × 200mm deep minimum (verify with engineer)
Pile footings: 250mm dia minimum, 600mm into ground
Subfloor clearance: 450mm minimum (150mm with ground cover)

───────────────────────────────────────────────────────────────
INSULATION (H1/AS1) - Climate Zone 1 & 2 (most of NZ)
───────────────────────────────────────────────────────────────
Minimum R-values (new builds from Nov 2023):
- Roof/ceiling: R6.6
- Walls: R2.0 (framing included)
- Floor: R1.5 (suspended), R1.3 (slab perimeter)
- Windows: must achieve overall thermal performance

Retrofits/renovations: use highest practical R-value
Common products: R2.2, R2.4, R2.6 batts for walls, R3.2-R6.0 ceiling

───────────────────────────────────────────────────────────────
WET AREAS - BATHROOMS (E3/AS1)
───────────────────────────────────────────────────────────────
BUILDER SUPPLIES (tiler supplies tiles, adhesive, grout, waterproofing):

Wall lining - GIB Aqualine (wet area plasterboard):
- GIB AQUALINE 10MM 2.4M X 1.2M - standard sheets
- GIB AQUALINE 13MM 2.4M X 1.2M - for higher impact areas
- Use H3.1 treated framing behind wet area linings

Floor substrate - Tile underlay:
- TILE & SLATE UNDERLAY 6MM 1800X1200 - for tiled floors

Framing: 90x45mm H3.1 SG8 for wet wall framing
Ventilation (G4): mechanical extract fan 25L/s minimum

NOTE: Do NOT include tiles, tile adhesive, grout, waterproof membrane,
or silicone - these are supplied and installed by the tiler.

───────────────────────────────────────────────────────────────
CLADDING & WEATHERTIGHTNESS (E2/AS1)
───────────────────────────────────────────────────────────────
Cavity battens: 20mm minimum drainage cavity required
Building wrap: must be Code-compliant (eg. Thermakraft, RAB)
Flashings: at all penetrations, window heads, junctions

Weatherboard fixing: stainless steel or hot-dip galvanised only
Fibre cement: 6mm minimum, 9mm exposed areas

───────────────────────────────────────────────────────────────
FENCING
───────────────────────────────────────────────────────────────
Posts: 100x100mm H4 minimum (H5 for wet ground)
Rails: 100x50mm or 150x50mm H3.2
Palings: 150x19mm, 100x19mm H3.2
Post spacing: 2.4m-2.7m typical
Post depth: 600mm minimum (1/3 of post length)

Pool fencing: 1200mm minimum height, no climbable features,
self-closing/latching gate, gaps under 100mm

───────────────────────────────────────────────────────────────
PERGOLAS & SHADE STRUCTURES
───────────────────────────────────────────────────────────────
Posts: 100x100mm or 125x125mm H4
Beams: 190x45mm or 240x45mm H3.2 depending on span
Rafters: 140x45mm or 190x45mm H3.2
All connections: galvanised bolts or post/beam brackets

───────────────────────────────────────────────────────────────
RETAINING WALLS
───────────────────────────────────────────────────────────────
Under 1.5m height: can use timber (H5 posts, H4 boards)
Over 1.5m: requires specific engineering design
Drainage: 100mm gravel + ag pipe behind wall essential

Timber retaining:
- Posts: 150x150mm H5, embedded 1/3 of wall height minimum
- Boards: 200x50mm or 150x50mm H4
${labourInfo}
───────────────────────────────────────────────────────────────
MATERIAL QUANTITY CALCULATIONS - CRITICAL FORMULAS
───────────────────────────────────────────────────────────────

SHEET MATERIALS (Plasterboard, Plywood, Fibre Cement):
Standard sheet size: 2400mm × 1200mm = 2.88m²

Formula: sheets_needed = CEILING(total_area_m2 / 2.88) + wastage

WALLS - calculate each wall separately:
  wall_area = length × height
  subtract: door openings (typically 2.0m × 0.82m = 1.64m²)
  subtract: window openings (measure each)
  total_wall_area = sum of all walls - openings
  sheets = CEILING(total_wall_area / 2.88) × 1.10 (10% wastage)

Example 4m × 3m bathroom, 2.4m ceiling:
  - Wall 1: 4.0 × 2.4 = 9.6m²
  - Wall 2: 3.0 × 2.4 = 7.2m²
  - Wall 3: 4.0 × 2.4 = 9.6m²
  - Wall 4: 3.0 × 2.4 = 7.2m² minus door (1.64m²) = 5.56m²
  - Total: 31.96m² ÷ 2.88 = 11.1 → 12 sheets + 10% = 14 sheets

TILE UNDERLAY (floors):
Standard sheet: 2400mm × 900mm = 2.16m² (some are 2400 × 1200 = 2.88m²)
  sheets = CEILING(floor_area / sheet_size) × 1.10

Example 4m × 3m floor = 12m²:
  12 ÷ 2.16 = 5.6 → 6 sheets + 10% wastage = 7 sheets

───────────────────────────────────────────────────────────────
TILE CALCULATIONS
───────────────────────────────────────────────────────────────

WALL TILES (typically 300mm × 600mm = 0.18m² per tile):
  tiles_needed = CEILING(wall_area_m2 / tile_area_m2) × 1.10

Bathroom walls example (4m × 3m room, tiled to 2.1m height):
  - Perimeter: (4 + 3 + 4 + 3) = 14 linear metres
  - Tiled wall area: 14 × 2.1 = 29.4m² minus door/window
  - Assume 2m² deductions = 27.4m²
  - Tiles: 27.4 ÷ 0.18 = 152 tiles × 1.10 = 168 tiles

FLOOR TILES (typically 600mm × 600mm = 0.36m² per tile):
  tiles_needed = CEILING(floor_area_m2 / tile_area_m2) × 1.10

Example 4m × 3m = 12m² floor:
  12 ÷ 0.36 = 33.3 → 34 tiles × 1.10 = 38 tiles

TILE ADHESIVE:
  Coverage: approximately 4-5m² per 20kg bag (5mm bed)
  bags = CEILING(total_tiled_area / 4)

TILE GROUT:
  Coverage: approximately 3-4m² per kg (for 300×600 tiles, 3mm joint)
  Use 5kg bags, 1 bag per 15-20m²

───────────────────────────────────────────────────────────────
TIMBER CALCULATIONS
───────────────────────────────────────────────────────────────

WALL FRAMING:
  Studs: (wall_length_mm / 600) + 1 for each wall, plus extras for corners
  Add 2 studs per window/door for trimming
  Bottom plate: wall_length (1 per wall)
  Top plate: wall_length × 2 (double top plate for loadbearing)
  Nogs: 1 row per wall = wall_length / 0.6 nogs

Example 4m wall:
  Studs: (4000 / 600) + 1 = 7.67 → 8 studs
  Bottom plate: 4.0 LM
  Top plate: 8.0 LM (doubled)
  Nogs: 6-7 pieces

DECK FRAMING:
  Joists: (deck_length / joist_spacing) + 1
  Joist length = deck width
  Bearers: 2 minimum, more for wider decks (max 1.5-2.0m apart)
  Posts: 1 per bearer end, plus intermediate at max 2.0m spacing
  Decking boards (140mm wide): (deck_area × 1000) / 140 = linear metres

Example 4m × 3m deck:
  Joists at 450mm: (4000 / 450) + 1 = 10 joists × 3m = 30 LM
  Bearers: 2 × 4m = 8 LM
  Posts: 4-6 depending on height
  Decking: (12 × 1000) / 140 = 86 LM × 1.10 = 95 LM

FASTENERS & FIXINGS
───────────────────────────────────────────────────────────────

NAILS (framing):
  Hand nailing: ~20 nails per stud, 500g per 10 studs
  Gun nails: 1 box (3000) does ~50m² of framing

SCREWS (decking):
  Per board metre: ~12 screws (2 per joist at 450 ctrs)
  Deck screws: 1kg per 3-4m² of decking

GIB SCREWS:
  ~30 screws per sheet at 150mm perimeter, 200mm field
  1000 screws per ~30 sheets

───────────────────────────────────────────────────────────────
───────────────────────────────────────────────────────────────
INTERIOR vs EXTERIOR - CRITICAL DISTINCTION
───────────────────────────────────────────────────────────────

INTERIOR JOBS (bathrooms, kitchens, internal walls):
- DO NOT include: building wrap, cavity battens, flashings
- These are EXTERIOR ONLY materials for weathertight cladding

EXTERIOR JOBS (decks, fences, cladding, roofing):
- Include building wrap, cavity battens as needed

BATHROOM RENOVATION - builder supplies ONLY:
- Framing: 90x45mm H3.1 SG8 (wet area treated)
- Wall lining: GIB AQUALINE (NOT standard GIB)
- Floor substrate: TILE & SLATE UNDERLAY 6MM
- Insulation: R2.2 wall batts
- Screws: GIB GRABBER SCREWS
- Exhaust fan: 25L/s minimum

DO NOT INCLUDE for bathrooms:
- Building wrap/paper (exterior only)
- Cavity battens (exterior only)
- Tiles, adhesive, grout (tiler supplies)
- Waterproof membrane (tiler supplies)
- Silicone (tiler supplies)

ELECTRICAL & PLUMBING:
- Do NOT include electrical or plumbing materials unless specifically requested
- These are typically supplied by licensed electricians and plumbers
- If user asks for a complete job, list electrical/plumbing separately with note:
  "Electrical items (supplied by electrician):" and "Plumbing items (supplied by plumber):"


NZ PRODUCT NAMES - USE THESE FOR searchTerm
───────────────────────────────────────────────────────────────

PLASTERBOARD (GIB brand in NZ):
- Standard interior: "GIB STANDARD" or "ULTRALINE GIBBOARD"
- Wet areas (bathrooms): "GIB AQUALINE" - MUST use for bathrooms
- Fire rated: "FYRELINE GIBBOARD"
- Noise control: "GIB NOISELINE"

TILE UNDERLAY (floor substrate for tiling):
- "TILE & SLATE UNDERLAY 6MM" - use for bathroom/laundry floors

FRAMING TIMBER (use H3.1 for wet areas, H1.2 for interior):
- "90X45 H3.1 SG8" - wet area framing
- "90X45 H1.2 SG8" or "90X45 MSG8" - interior framing
- "140X45 H3.2 SG8" - deck joists
- "90X90 H4" or "100X100 H4" - deck posts

INSULATION:
- "PINK BATTS" or "EARTHWOOL" or "R2.2 WALL"
- "R2.6 CEILING" or "R3.2 CEILING"

SCREWS & FIXINGS:
- "GIB GRABBER SCREWS" - for plasterboard
- "DECK SCREWS" or "TREATED TIMBER SCREWS"
- "BATTEN SCREWS" - for cavity battens

IMPORTANT: Use these exact product names in searchTerm field
to ensure materials match the database correctly.

───────────────────────────────────────────────────────────────
ALWAYS SHOW YOUR CALCULATIONS
───────────────────────────────────────────────────────────────
When providing quantities, SHOW THE MATH:
"Wall area: 4m × 2.4m = 9.6m² ... Total walls: 31.96m² ... 
 Sheets needed: 31.96 ÷ 2.88 = 11.1 → 12 sheets + 10% = 14 sheets"

This helps the builder verify your quantities are correct.


═══════════════════════════════════════════════════════════════
                      OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

Respond with JSON:
{
  "summary": "Brief project description",
  "materials": [
    {"name": "Full material description with size", "qty": 10, "unit": "EACH/LM/M2", "searchTerm": "catalog search term"}
  ],
  "labour": [
    {"role": "builder", "hours": 8, "description": "Framing and deck structure"},
    {"role": "labourer", "hours": 4, "description": "Material handling and cleanup"},
    {"role": "apprentice", "hours": 6, "description": "Assisting with decking installation"}
  ],
  "notes": ["Building code compliance notes", "Installation tips"],
  "warnings": ["Any code compliance warnings or consent requirements"]
}

LABOUR ESTIMATION GUIDELINES:
- Always include labour estimates in the "labour" array
- Break down by role: "builder", "labourer", or "apprentice"
- Be realistic - account for setup, measurement, cutting, fixing, and cleanup
- Include a brief description of what each labour component covers
- Round to nearest 0.5 hours

AVAILABLE MATERIALS (sample):
${materialSummary}

═══════════════════════════════════════════════════════════════
                      CRITICAL RULES
═══════════════════════════════════════════════════════════════
1. ALWAYS specify correct timber sizes - refer to tables above
2. NEVER undersize structural members - when in doubt, go bigger
3. ALWAYS specify treatment level (H1.2, H3.1, H3.2, H4, H5)
4. ALWAYS match member size to span - check the span tables
5. Include wastage: 10% framing, 5-10% sheet goods, 15% complex cuts
6. Note if building consent is likely required
7. Flag when engineering design is needed (large spans, retaining >1.5m)
8. Use NZ standard timber sizes: 45mm, 90mm, 140mm, 190mm, 240mm, 290mm
9. ALWAYS include labour estimates with breakdown by role`;
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

  const labourInfo = labourRates ? `
Builder/Carpenter: $${labourRates.builder || 85}/hr
Labourer: $${labourRates.labourer || 45}/hr  
Apprentice: $${labourRates.apprentice || 30}/hr
` : '';

  return `You are a NZ Licensed Building Practitioner analyzing building plans. 

Your task:
1. Examine the plan/sketch carefully
2. Extract all dimensions (heights, widths, lengths, areas)
3. Identify the type of work (deck, fence, framing, roof, etc.)
4. Estimate a complete materials list based on NZS 3604
5. Estimate labour hours by role

When analyzing:
- For decks: extract deck size, height, materials
- For fencing: extract fence height, length, post spacing
- For framing: identify wall areas, openings, treatment levels
- For bathroom/wet areas: identify tiled areas, fixtures
- Always specify building code compliant timber sizes

AVAILABLE MATERIALS (sample):
${materialSummary}

LABOUR RATES:
${labourInfo}

Respond with JSON:
{
  "summary": "What this plan shows - be specific about dimensions extracted",
  "materials": [
    {"name": "Material with size", "qty": 10, "unit": "EACH/LM/M2", "searchTerm": "search term"}
  ],
  "labour": [
    {"role": "builder", "hours": 8, "description": "Main work description"},
    {"role": "labourer", "hours": 4, "description": "Support work"}
  ],
  "notes": ["Code compliance notes", "Key assumptions made"],
  "warnings": ["Anything unclear", "Where you need more info"]
}

CRITICAL:
- Always comply with NZS 3604 timber sizes
- State ALL assumptions you made
- Flag any missing dimensions
- Include labour breakdown
- Use realistic timeframes based on complexity`;
}
