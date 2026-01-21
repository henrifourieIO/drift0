# Drift0 - Ballistics Calculator

A precision ballistics calculator built with Astro and React.

## Technology Stack

- **Astro** - Static site generator with server-side rendering
- **React** - Interactive UI components
- **TypeScript** - Type-safe development

## Project Structure

```
drift0/
├── src/
│   ├── components/      # React components
│   │   ├── App.tsx
│   │   ├── Calculator.tsx
│   │   ├── DriftVisualizer.tsx
│   │   └── ScopeAdjustment.tsx
│   ├── lib/
│   │   └── ballistics.ts  # Ballistics calculation engine
│   ├── pages/
│   │   ├── api/
│   │   │   └── calculate.ts  # API endpoint
│   │   └── index.astro       # Main page
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## Development

```bash
# Install dependencies
npm install

# Start development server (runs on port 8080)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Cloudflare Workers/Pages

This project is configured for Cloudflare Workers deployment. See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) for detailed instructions.

Quick deploy:
```bash
# Build and deploy to Cloudflare
npm run cf:build-deploy

# Or deploy existing build
npm run cf:deploy
```

First-time deployment:
```bash
npm run build
npx wrangler login
npx wrangler pages deploy ./dist --project-name=drift0
```

## Features

- **Ballistics Calculations** - Precise trajectory calculations considering:
  - Muzzle velocity and bullet weight
  - Ballistic coefficient (G1)
  - Atmospheric conditions (temperature, altitude)
  - Wind speed and direction
  - Zero range and sight height

- **Unit Systems** - Toggle between Imperial and Metric units

- **Target Visualization** - Visual representation of bullet impact with:
  - Multiple target types (IPSC, NRA B-8, steel, etc.)
  - Hit/miss detection
  - Zoom for off-target impacts

- **Scope Adjustment** - Calculate precise scope adjustments:
  - MOA and MIL corrections
  - Click value conversions
  - Windage and elevation adjustments

- **Cartridge Presets** - Quick-load common cartridges:
  - 5.56 NATO, 7.62x39
  - .308 Win, 6.5 Creedmoor, 6.5 PRC
  - .300 Win Mag, .300 PRC
  - .338 Lapua, .375 CheyTac, .50 BMG
  - And more...

## Migration from Deno

This project was migrated from Deno to Astro for better performance and ecosystem compatibility. The original Deno files are still present in the root directory for reference:

- `main.ts` - Original Deno server (now replaced by Astro)
- `app.tsx` - Original entry point (now in `src/pages/index.astro`)
- `build.ts` - Original esbuild script (no longer needed)
- `deno.json` - Deno configuration (can be removed)

## API

### POST `/api/calculate`

Calculate ballistics trajectory.

**Request Body:**
```json
{
  "muzzleVelocity": 823,
  "bulletWeight": 10.9,
  "ballisticCoefficient": 0.462,
  "zeroRange": 91.44,
  "targetDistance": 914.4,
  "windSpeed": 4.47,
  "windAngle": 90,
  "sightHeight": 38.1,
  "temperature": 15,
  "altitude": 0
}
```

**Response:**
```json
[
  {
    "distance": 0,
    "velocity": 823,
    "energy": 3693,
    "drop": -38,
    "windDrift": 0,
    "timeOfFlight": 0,
    "moa": 0,
    "mil": 0
  },
  ...
]
```

## License

Copyright © 2024
