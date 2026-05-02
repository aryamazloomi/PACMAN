# Pac-Man AI

Pac-Man AI is a browser-first Pac-Man-style portfolio project built with React, TypeScript, Vite, and HTML Canvas. It supports manual play and a set of switchable AI controllers that all drive Pac-Man through the same shared action interface.

## What is included

- Playable Pac-Man-style maze rendered on Canvas
- Manual keyboard control
- Shared deterministic game core with seeded ghost behavior
- Selectable controllers:
  - Manual Play
  - Random Agent
  - Greedy Pellet Agent
  - Ghost Avoidance Agent
  - A* Agent
  - Behavior Tree Agent
- Headless evaluation utility with score and latency summaries
- Browser trajectory logging with JSON export
- Vitest coverage for core rules, pathfinding, and agent behavior
- GitHub Pages-ready Vite configuration

## Tech stack

- React
- TypeScript
- Vite
- HTML Canvas
- Vitest

## Project structure

```txt
src/
  ai/
  controllers/
  evaluation/
  game/
  logging/
  render/
  ui/
  utils/
tests/
```

## Run locally

1. Install Node.js 20+.
2. Install dependencies:

```bash
npm install
```

3. Start the dev server:

```bash
npm run dev
```

4. Open the local Vite URL in your browser.

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```

## Deploy to GitHub Pages

1. Install dependencies and build the app:

```bash
npm install
npm run build
```

2. Deploy the built `dist/` directory:

```bash
npm run deploy
```

3. If your repository name is not `PACMAN`, update the GitHub Pages base path in `vite.config.ts`.

## How to play

- Arrow keys or `WASD`: move Pac-Man
- `Space` or `P`: pause or resume
- `R`: restart from the default seed
- `ESC`: open the menu

## How to select AI agents

- Use the controller dropdown in the right-hand panel.
- Switch controllers at any time to compare different movement strategies.
- Use `Run Evaluation` to benchmark the currently selected controller across multiple headless episodes.

## Evaluation metrics

The evaluation utility reports:

- average score
- best score
- average survival time
- pellets eaten
- win rate
- death count
- average steps per episode
- average action latency

## Trajectory logging

- Logging is enabled by default.
- Use `Disable Logging` to stop recording runtime steps.
- Use `Export Trajectory` to download the current run as JSON.

Each logged step includes:

- step number
- controller name
- state summary
- selected action
- reward
- score
- lives
- done flag
- timestamp

## Current limitations

- Movement is tile-based rather than interpolated between tile centers.
- Evaluation of `Manual Play` is allowed but mainly useful for debugging.
- Tabular Q-learning and deep RL are still placeholders.

## TODO

- Finish the tabular Q-learning implementation in `src/ai/qLearning/`
- Add browser-managed replay playback from exported trajectories
- Add stronger evaluation presets and comparison charts
- Add future DQN/PPO or imitation-learning integration without bloating the web app
