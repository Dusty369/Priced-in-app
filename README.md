# Priced In - Building Job Estimator

AI-powered pricing app for NZ builders. Estimate materials, calculate quotes, and get AI assistance for project planning.

## Features

- 📦 **5,600+ materials** from Carters NZ with current pricing
- 🤖 **AI Project Assistant** - describe a project, get a materials list
- 🧮 **Quote Builder** - wastage, margins, GST calculations
- 📱 **Mobile-friendly** - works on phones for on-site use
- 🔒 **Secure** - API keys stay server-side

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up your API key
```bash
cp .env.local.example .env.local
```
Edit `.env.local` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

### 3. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment (Vercel)

1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add `ANTHROPIC_API_KEY` in Vercel environment variables
4. Deploy!

## Project Structure

```
priced-in-app-v2/
├── src/
│   ├── app/
│   │   ├── api/ai/route.js   # AI API endpoint (secure)
│   │   ├── layout.js         # Root layout
│   │   ├── page.js           # Main app component
│   │   └── globals.css       # Styles
│   └── data/
│       └── materials.json    # Carters product database
├── .env.local.example        # Environment template
└── package.json
```

## Adding More Materials

The app supports multiple supplier price lists. To add more:

1. Export a CSV with: Category, Subcategory, Name, Price, Unit, Code
2. Add a parser script or upload feature
3. Merge into `materials.json`

## NZ Building Code

The AI assistant has knowledge of:
- NZS 3604:2011 (timber-framed buildings)
- E2/AS1 (external moisture)
- E3/AS1 (wet areas)
- H1/AS1 (insulation)
- B2/AS1 (durability)

It will suggest correct treatment levels (H1.2, H3.1, H3.2, H4, H5) and calculate quantities with appropriate wastage.

## License

Private - built for Denholm Waugh
