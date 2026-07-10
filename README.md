# NeuroFlow 3D

NeuroFlow 3D is an Angular and Three.js single-page educational app that visualizes how the brain receives sensory information, routes signals, connects memory, adds emotional context, and makes decisions.

Tagline: An interactive 3D journey through how the brain receives, processes, remembers, and decides.

## Features

- Interactive Three.js brain scene with orbit controls, glowing brain regions, curved neural pathways, labels, particles, and animated signal pulses.
- Clickable brain regions with synchronized explanations and examples.
- Four data-driven simulations: visual information flow, memory storage, memory retrieval, and road-crossing decision making.
- Simulation controls for start, pause, reset, step forward, step backward, speed, labels, pathways, and explanation mode.
- Timeline panel showing pending, active, and completed simulation steps.
- Memory module with weak and strong pathway visualization.
- Decision-making module with safe, risky, and unknown road-crossing outcomes.
- Responsive dark neuroscience-style interface with high-contrast text and reduced-motion handling.
- Responsive layouts for phones from 320px, tablets, laptops, and large desktop displays.
- Local English/Kannada localization with a persisted language preference and no translation API.
- Accessible mobile navigation with keyboard support.

## Tech Stack

- Angular 22
- TypeScript
- Three.js
- RxJS
- SCSS
- Local JSON data files, no backend

## Folder Structure

```text
src/app/
  core/
    i18n/
    models/
    services/
  shared/
    components/
      brain-scene/
      explanation-panel/
      simulation-controls/
      timeline/
  features/
    overview/
    information-flow/
    memory/
    decision-making/
    simulation/
  layout/
    footer/
    navbar/
    shell/
public/assets/
  data/
  models/
  textures/
```

Deployment files:

```text
public/_redirects   Optional fallback metadata in the browser bundle
public/_headers     Static cache and security-header metadata
wrangler.toml       Cloudflare Workers Static Assets configuration
AGENTS.md           Project development and verification rules
```

## Install

Use Node.js `22.22.3`. The repository's `.node-version` pins this version for Cloudflare Pages and compatible local version managers.

```bash
npm install
```

## Run

```bash
npm start
```

Open the local URL printed by Angular, usually `http://localhost:4200/`.

## Build

```bash
npm run build
```

Angular persistent cache is disabled in `angular.json` because the local environment hit a native cache abort during builds. The production build succeeds with cache disabled.

The deployable browser bundle is generated at:

```text
dist/neuroflow-3d/browser
```

## Test

```bash
npm test -- --watch=false
```

## Deploy to Cloudflare Workers

The production project is a Cloudflare Worker named `neuro3d`. Angular is deployed with [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) and is available on the project's `workers.dev` domain.

### Cloudflare Dashboard

1. Push the repository to GitHub.
2. In Cloudflare, open **Workers & Pages**, select the `neuro3d` Worker, and connect the Git repository under **Settings → Builds**.
3. Use these build settings:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Root directory: `/`
   - Node.js version: `22.22.3`
4. Deploy the project.

`wrangler.toml` uploads `dist/neuroflow-3d/browser` as static assets. Its `single-page-application` fallback returns `index.html` for client-side Angular routes such as `/memory` and `/simulation`.

Cloudflare Builds reads `.node-version` automatically. If the project has a `NODE_VERSION` environment variable configured in the dashboard, set it to `22.22.3` or remove it so the repository pin is used.

### Wrangler CLI

The checked-in `wrangler.toml` points to the Angular browser output. After authenticating Wrangler, build and deploy with:

```bash
npm run build
npx wrangler deploy
```

Do not change the asset directory to `dist/neuroflow-3d`; `index.html` is inside its `browser` subdirectory. The Worker name is `neuro3d`, while the Angular package remains `neuroflow-3d`.

## Localization

English and Kannada translations are stored locally under `src/app/core/i18n`. `LanguageService` owns the selected language, updates the document `lang` attribute, and persists the preference in `localStorage`. User-facing component and data text is rendered through `TranslatePipe`.

When adding visible English copy, add a natural Kannada entry to `KANNADA_TRANSLATIONS` and render the text with the translation pipe. Keep product names, paths, IDs, URLs, and code identifiers unchanged.

## Routes

- `/overview`
- `/information-flow`
- `/memory`
- `/decision-making`
- `/simulation`

The default route redirects to `/overview`.

## How Simulations Work

Simulation scenarios live in `public/assets/data/simulation-scenarios.json`. Each scenario contains ordered steps. Every step names an active brain region, an optional next region, and educational copy for the explanation panel.

`BrainSimulationService` owns the RxJS simulation state: selected scenario, active step, speed, status, and UI toggles. `BrainSceneComponent` listens to that state and animates pulses along the active pathway.

## Add a Brain Region

Edit `public/assets/data/brain-regions.json` and add an object to `regions`:

```json
{
  "id": "new-region",
  "name": "New Region",
  "shortDescription": "Short explanation.",
  "role": "Detailed role in processing.",
  "position": { "x": 0, "y": 0, "z": 0 },
  "color": "#28d7ff",
  "relatedPathways": [],
  "exampleActivity": "Real-life example."
}
```

Then add pathway objects that connect it to other regions.

## Add a Simulation Scenario

Edit `public/assets/data/simulation-scenarios.json` and add a scenario with ordered steps:

```json
{
  "id": "new-scenario",
  "name": "New Scenario",
  "category": "visual",
  "scenario": "Plain-language scenario.",
  "summary": "What the flow demonstrates.",
  "steps": [
    {
      "id": "new-1",
      "order": 1,
      "regionId": "sensory-input",
      "nextRegionId": "thalamus",
      "title": "Step title",
      "description": "Timeline description.",
      "what": "What is happening.",
      "why": "Why it matters.",
      "analogy": "Simple analogy."
    }
  ]
}
```

The scenario cards will pick it up automatically. Add Kannada translations for the scenario and step copy in `src/app/core/i18n/translations.ts`.

## Portfolio Notes

This project demonstrates a production-style frontend architecture: standalone Angular components, lazy routes, strongly typed domain models, local data-driven content, RxJS state flow, WebGL rendering with Three.js, responsive SCSS, local bilingual content, accessible controls, and Cloudflare Pages deployment. The brain geometry is intentionally placeholder-based so the app runs without external model downloads while still showing polished 3D interaction and educational signal flow.

## Credits

Developed by Vinay. Copyright 2026.
