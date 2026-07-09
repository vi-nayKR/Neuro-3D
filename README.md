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
    navbar/
    shell/
public/assets/
  data/
  models/
  textures/
```

## Install

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

The scenario dropdown will pick it up automatically.

## Portfolio Notes

This project demonstrates a production-style frontend architecture: standalone Angular components, lazy routes, strongly typed domain models, local data-driven content, RxJS state flow, WebGL rendering with Three.js, responsive SCSS, and accessible controls. The brain geometry is intentionally placeholder-based so the app runs without external model downloads while still showing polished 3D interaction and educational signal flow.
# Neuro-3D
