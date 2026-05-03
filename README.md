# Pac-Man AI

Pac-Man AI is a browser-first Pac-Man project built as both a playable game and an AI portfolio piece. The idea behind the repo is simple: take a classic arcade loop that people instantly understand, rebuild it with a clean deterministic game core, and use it as a sandbox for comparing decision-making strategies in the browser.

Unlike a desktop-only prototype, this version was intentionally built with `React`, `TypeScript`, `Vite`, and `HTML Canvas` so anyone can open the repository, deploy it to GitHub Pages, and interact with the same simulation directly in the browser. That browser-first decision shaped the whole architecture: the game core stays separate from React, controllers share one action API, rendering is isolated from simulation, and evaluation runs headlessly without depending on the Canvas loop.

## Project goal

The goal of the repository is not just to make “Pac-Man with bots.” It is to show:

- how to structure a small but serious game/AI system cleanly
- how to compare heuristic and search-based agents fairly
- how to expose that comparison through a usable web UI
- how to keep the project understandable for students while still looking credible as an engineering portfolio project

At a high level, the repo combines:

- a deterministic tile-based Pac-Man game engine
- a browser UI for manual play and controller switching
- a shared controller interface for both humans and AI agents
- a headless evaluation system for repeatable experiments
- trajectory logging for later imitation-learning or replay work

## Why these algorithms

The controllers were chosen as a progression from simple baselines to more structured decision systems rather than jumping straight into heavyweight ML.

### Manual Play

Manual play exists as the human baseline. It helps validate that the controls, timing, collisions, and maze logic feel right before blaming an agent for poor outcomes.

### Random Agent

The random controller is the weakest baseline on purpose. It answers the question: “How much better are the real policies than legal random movement?”

### Greedy Pellet Agent

This agent is the first useful nontrivial policy. It gives the project a local-search baseline focused on short-term reward collection.

### Ghost Avoidance Agent

This adds survival-aware heuristic scoring. It is useful because many game-playing systems fail not because they cannot find reward, but because they underweight risk.

### A* Agent

The A* controller introduces explicit path planning. It is the clearest “classical AI” benchmark in the repo and shows how search improves route quality when danger is folded into path cost.

### Behavior Tree Agent

The behavior tree acts as the strongest structured non-ML controller. It combines multiple tactical modes instead of forcing one heuristic to solve every situation.

### Q-Learning Placeholder

Tabular Q-learning is present only as a placeholder right now. That was intentional: the repo first needed a stable game loop, stable metrics, and a fair evaluator before adding learning logic.

## How the agents are evaluated

The evaluation system is built around fair, game-native metrics rather than classification metrics like accuracy or F1, because these agents are not supervised action predictors.

The Reports workflow evaluates selected AI agents under the same conditions:

- same maze
- same difficulty
- same max-step limit
- same deterministic seed list
- same scoring and collision rules
- same headless simulation loop

Each agent is run over repeated episodes, and the evaluator records per-episode outcomes before summarizing them. The report system currently focuses on metrics that matter for a game-playing controller:

- average, median, best, and worst score
- score consistency via standard deviation
- average reward
- win rate and death rate
- survival steps and survival time
- pellets collected and power pellets collected
- ghosts eaten
- illegal moves
- wall bumps
- decision latency
- lives remaining

The multi-agent Reports tab evaluates agents asynchronously in chunks so the browser does not completely lock up during larger runs like `500` or `1000` episodes. Results can be compared in summary tables, ranked by key metrics, reviewed in per-agent report cards, and exported as JSON.

## Evaluation snapshot

The repository also includes an archived evaluation snapshot from the Reports tab run completed on `May 2, 2026 at 10:16:28 PM`. That comparison evaluated `5` AI agents, used `1,000` shared seeds per agent, ran at `Standard` difficulty, and used a `5,000` step cap per episode for a total of `5,000` evaluated episodes.

| Agent | Episodes | Avg Score | Best Score | Win Rate | Death Rate | Avg Survival | Avg Pellets | Avg Ghosts | Illegal Moves | Avg Decision |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Behavior Tree Agent | 1,000 | 2493.9 | 3760 | 42% | 58% | 40.77 s | 113.4 | 4.80 | 0.00 | 0.55 ms |
| A* Agent | 1,000 | 2354.7 | 2760 | 100% | 0% | 34.70 s | 126.0 | 1.98 | 0.00 | 0.69 ms |
| Ghost Avoidance Agent | 1,000 | 1001.9 | 2070 | 0% | 100% | 46.92 s | 77.7 | 0.40 | 0.00 | 0.01 ms |
| Greedy Pellet Agent | 1,000 | 460.0 | 460 | 0% | 100% | 9.23 s | 41.0 | 0.00 | 0.00 | 0.00 ms |
| Random Agent | 1,000 | 153.1 | 730 | 0% | 100% | 12.68 s | 15.0 | 0.01 | 0.00 | 0.00 ms |

The results tell a useful story:

- `Behavior Tree Agent` achieved the best average score at `2493.87`, which supports the decision to use it as the strongest structured non-ML policy in the project.
- `A* Agent` achieved the best win rate at `100%`, showing that explicit planning with danger-aware path cost is extremely reliable even if it is not always the top scorer.
- `Ghost Avoidance Agent` had the best survival time at `46.92 s`, but that did not translate into wins. That highlights an important design lesson: living longer is not the same thing as clearing the board efficiently.
- `Greedy Pellet Agent` was the most consistent controller in this particular report, with a score standard deviation of `0.00`, because it produced the same `460` score in every recorded run.
- `Random Agent` tied the lowest illegal-move rate at `0.00` and also registered the fastest decisions in the report at `0.00 ms`, which is expected from a lightweight baseline policy.
- `Greedy Pellet Agent` and `Random Agent` performed the role they were meant to perform: they act as lower baselines that make the value of planning and tactical arbitration visible.
- All evaluated agents recorded `0.00` illegal moves, which is a useful validation of the shared legal-action system between controllers and the game engine.

## Repository structure

```txt
src/
  ai/              pathfinding, heuristics, future learning hooks
  controllers/     human and AI controller implementations
  evaluation/      single-agent and multi-agent evaluation logic
  game/            deterministic core simulation and rules
  logging/         trajectory capture and export
  render/          canvas renderer
  ui/              dashboard pages and panels
  utils/           storage, random, and grid helpers
tests/             Vitest coverage for engine, pathfinding, agents, evaluation
reports/           archived report artifacts
```

## What is already working

- browser-playable Pac-Man game
- manual control
- Random, Greedy, Ghost Avoidance, A*, and Behavior Tree agents
- deterministic seeded evaluation
- Reports tab for multi-agent comparison
- trajectory logging and export
- GitHub Pages-oriented deployment setup

## Roadmap

The old README had a short TODO list. That roadmap still matters, but it is clearer framed as the next research steps for the repo:

1. Finish the tabular Q-learning path in `src/ai/qLearning/`.
2. Add replay playback for exported trajectories.
3. Add stronger visual analysis in Reports, such as charts and comparison history.
4. Prepare behavioral cloning and deeper RL integrations without bloating the web app itself.

## Docs and artifacts

- Setup, running, testing, and deployment guide: [installation-manual.md](installation-manual.md)
- Archived report artifact: [reports/report-bacth1.pdf](reports/report-bacth1.pdf)

The PDF in `reports/` is an archived report artifact from the project’s evaluation work. The live source of truth for evaluation behavior is the in-repo evaluation engine and Reports UI.
