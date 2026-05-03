# Installation Manual

This file is the setup and deployment guide for the Pac-Man AI project.

For the project overview, controller rationale, evaluation design, and roadmap, see [README.md](README.md).

## Requirements

- Node.js 20+
- npm

## Install dependencies

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Open the local Vite URL in your browser after the dev server starts.

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```

## Preview production build

```bash
npm run preview
```

## Deploy to GitHub Pages

```bash
npm run build
npm run deploy
```

If your repository name is not `PACMAN`, update the GitHub Pages base path in [vite.config.ts](vite.config.ts).

## Controls

- `Arrow keys` or `WASD`: move Pac-Man
- `Space` or `P`: pause or resume
- `R`: restart
- `ESC`: open pause/menu flow

## Main UI areas

- `Core Dashboard`: live browser game
- `Neural Architecture`: controller explanations and educational notes
- `Metric Analytics`: live telemetry and quick single-controller evaluation
- `Reports`: headless multi-agent comparison, progress, summary tables, and JSON export
- `Simulation Logs`: trajectory logging and export
- `System Config`: applied controller and difficulty setup

## Evaluation notes

- The automatic Reports evaluator runs headlessly by default.
- Episode presets are `10`, `50`, `100`, `500`, and `1000`.
- Full report JSON can be exported from the Reports tab.
- The latest report summary is also cached in browser `localStorage`.
