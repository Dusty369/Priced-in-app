# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Priced-In v2** is an AI-powered building job estimator for NZ builders. It helps create accurate quotes by providing intelligent material estimates and labour costing based on New Zealand Building Code compliance.

- **Tech Stack**: Next.js 14 + React 18, Tailwind CSS, Anthropic Claude API (Sonnet 4)
- **Data**: 13,500+ materials from Carters and ITM NZ stored in static JSON
- **Persistence**: Browser localStorage (no database)

## Commands

```bash
# Install dependencies
npm install

# Development server (http://localhost:3000)
npm run dev

# Production build and run
npm run build && npm start

# Linting
npm run lint

# Environment setup (required for AI features)
cp .env.local.example .env.local
# Then add: ANTHROPIC_API_KEY=sk-ant-api03-...
```

## Deployment

- **Live URL**: https://app.pricedin.co.nz
- Hosted on Railway, auto-deploys from `main` branch
- Repo: https://github.com/Dusty369/Priced-in-app.git
- Push to main triggers automatic deployment

## Architecture

### Key Files

| File | Purpose |
|------|---------|
| `src/app/page.js` | Main app component (1,920 lines, all state management) |
| `src/app/api/ai/route.js` | AI API gateway with Claude integration |
| `src/lib/constants.js` | Default rates, labour roles, localStorage keys |
| `src/lib/materialsLoader.js` | Material search/filter/cache utilities |
| `src/data/materials.json` | 5MB product database (13,500+ items) |
| `src/components/QuotePage.js` | Quote builder UI (largest component) |

### State Management Pattern

React Hooks with localStorage persistence. Four storage keys in `constants.js`:
- `priced-in-projects` - All saved projects
- `priced-in-current-project` - Active project ID
- `priced-in-labour-rates` - Custom labour rates
- `priced-in-company-info` - Business details

Hydration guard pattern used: `const [hydrated, setHydrated] = useState(false)` to prevent SSR mismatches.

### AI Integration

Server-side API at `/api/ai/route.js` handles all Claude calls. Three modes:
- `project` - General project estimation with NZ Building Code context
- `search` - Material search assistance
- `plan` - Building plan analysis with vision API

System prompts include 10KB of NZ Building Code knowledge (NZS 3604:2011, E2/AS1, E3/AS1, H1/AS1, B2/AS1).

### Calculation Logic

```
subtotal = sum(price × qty) × (1 + wastage/100) × (1 + margin/100)
labourTotal = sum(hours × hourlyRate) × (1 + margin/100)
GST = 15% (applied after margin)
```

### Component Loading

Heavy use of lazy imports with Suspense for code splitting:
- MaterialsPage, PlansUpload, SaveProjectDialog, settings dialogs

## Data Structures

### Material Object
```javascript
{ id, category, subcategory, name, price, unit, code, supplier: "Carters" | "ITM" }
```

### Project Object
```javascript
{ id, name, cart: [], labourItems: [], wastage, margin, gst, notes, chatHistory: [], createdAt, updatedAt }
```

### Default Labour Rates (NZD/hour)
```javascript
{ builder: 95, labourer: 45, apprentice: 30, electrician: 105, plumber: 105, tiler: 120, painter: 65, plasterer: 40 }
```

## Current Status

**Complete**: Save/load projects, labour costing, material search (13,500+ items), CSV export (Xero format), AI chat, plan upload & analysis, price comparison, NZ Building Code integration.

**Incomplete**: Native PDF export (code ready, not integrated), material pagination, mobile UI polish, unit tests (0% coverage).

## Notes

- `reactStrictMode: false` in next.config.js to avoid double-rendering
- Materials loaded once at startup and cached in memory
- API key managed server-side only (never exposed to client)
- `page.js` is a god component that should eventually be split
- AI should suggest builder-supplied materials only (structural timber, GIB plasterboard, substrates, fixings) - not trade-specific items that electricians, plumbers, tilers etc supply themselves
- Labour rates are Auckland-based
