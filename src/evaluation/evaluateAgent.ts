import { Action } from "../game/actions";
import { SIMULATION_STEP_MS } from "../game/constants";
import { stepGame } from "../game/engine";
import { createGameState, getGameStateView } from "../game/gameState";
import type { Controller } from "../controllers/Controller";
import type { EpisodeMetrics, EvaluationMetrics } from "./metrics";
import { summarizeEpisodes } from "./metrics";

export interface EvaluateControllerOptions {
  episodes?: number;
  maxStepsPerEpisode?: number;
  seed?: number;
}

function nowMs(): number {
  if (typeof performance !== "undefined") {
    return performance.now();
  }

  return Date.now();
}

export function evaluateController(
  controller: Controller,
  options: EvaluateControllerOptions = {},
): EvaluationMetrics {
  const episodes = options.episodes ?? 5;
  const maxStepsPerEpisode = options.maxStepsPerEpisode ?? 3600;
  const baseSeed = options.seed ?? 1337;
  const results: EpisodeMetrics[] = [];

  for (let episodeIndex = 0; episodeIndex < episodes; episodeIndex += 1) {
    const seed = baseSeed + episodeIndex;
    controller.reset?.(seed);
    let state = createGameState({ seed, readyDelayMs: 0 });
    let pelletsEaten = 0;
    let deaths = 0;
    let totalActionLatencyMs = 0;

    while (
      state.status === "running" &&
      state.steps < maxStepsPerEpisode
    ) {
      const startedAt = nowMs();
      const action = controller.selectAction(getGameStateView(state)) ?? Action.Stop;
      totalActionLatencyMs += nowMs() - startedAt;

      const result = stepGame(state, action, SIMULATION_STEP_MS);
      state = result.state;

      if (result.events.pelletEaten) {
        pelletsEaten += 1;
      }

      if (result.events.powerPelletEaten) {
        pelletsEaten += 1;
      }

      if (result.events.lifeLost) {
        deaths += 1;
      }
    }

    results.push({
      score: state.score,
      steps: state.steps,
      pelletsEaten,
      won: state.status === "won",
      deaths,
      averageActionLatencyMs: state.steps > 0 ? totalActionLatencyMs / state.steps : 0,
    });
  }

  return summarizeEpisodes(results);
}
