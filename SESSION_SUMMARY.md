# Priced In App - Session Summary

## App Overview
- NZ construction materials pricing app for builders
- Next.js 14, deployed on Railway
- GitHub: https://github.com/Dusty369/Priced-in-app.git
- Uses Anthropic Claude API for AI estimating

## Key Fixes Made This Session

### 1. Syntax Errors Fixed
- Fixed incomplete `saveProject` function (line 181) - was truncated mid-definition
- Removed duplicate partial `saveProject` function (line 240)
- Fixed brace/parenthesis balancing issues

### 2. AI Prompt Improvements
- Added material calculation formulas (sheet materials, tiles, timber)
- Added NZ product names (GIB AQUALINE, TILE & SLATE UNDERLAY, etc.)
- Added INTERIOR vs EXTERIOR distinction
- Builder supplies ONLY - excludes:
  - Tiles, adhesive, grout, waterproofing (TILER)
  - Electrical cables, switches, lights (ELECTRICIAN)
  - Pipes, fittings, taps, toilets (PLUMBER)
  - Paint, primers (PAINTER)

### 3. Material Matching Improved
- Better word-matching algorithm with key word priority
- Key words like AQUALINE, ULTRALINE, H3.1 must match exactly

### 4. UI Fixes
- Added `isOpen` prop to SaveProjectDialog, LabourSettingsDialog, CompanySettingsDialog
- Added manual labour entry button on Quote page
- Added role dropdown for labour items
- Added `onAddLabourItem` and `onUpdateLabourRole` props

## Still TODO
- Delete project function
- Verify project saving works
- Test material matching accuracy

## Database Info
- 13,566 materials in src/data/materials.json
- Key NZ products: GIB AQUALINE, ULTRALINE GIBBOARD, TILE & SLATE UNDERLAY 6MM

## Key Files
- src/app/page.js - Main app logic
- src/app/api/ai/route.js - AI prompts and API calls
- src/components/QuotePage.js - Quote page with labour/materials
- src/components/Dashboard.js - Projects list
- src/lib/constants.js - Labour rates, storage keys
