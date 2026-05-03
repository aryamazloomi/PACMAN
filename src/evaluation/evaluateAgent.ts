import { Action } from "../game/actions";
import { SIMULATION_STEP_MS } from "../game/constants";
import { stepGame } from "../game/engine";
import { createGameState, getGameStateView } from "../game/gameState";
import type { DifficultyId } from "../game/types";
import type { Controller } from "../controllers/Controller";
import type {
  AgentEvaluationResult,
  EpisodeResult,
  EvaluationMetrics,
} from "./metrics";
import {
  createAgentEvaluationResult,
  generateEvaluationSeeds,
  summarizeEpisodeResults,
} from "./metrics";

export interface EvaluateControllerOptions {
  episodes?: number;
  maxStepsPerEpisode?: number;
  seed?: number;
  seeds?: readonly number[];
  difficulty?: DifficultyId;
}

function nowMs(): number {
  if (typeof performance !== "undefined") {
    return performance.now();
  }

  return Date.now();
}

function resolveFinalGameState(
  status: "ready" | "running" | "paused" | "won" | "lost",
): EpisodeResult["finalGameState"] {
  if (status === "won" || status === "lost") {
    return status;
  }

  return "max_steps";
}

export function evaluateEpisode(
  controller: Controller,
  options: {
    episodeIndex: number;
    seed: number;
    maxStepsPerEpisode: number;
    difficulty: DifficultyId;
  },
): EpisodeResult {
  controller.reset?.(options.seed);

  let state = createGameState({
    seed: options.seed,
    readyDelayMs: 0,
    difficulty: options.difficulty,
  });
  let pelletsCollected = 0;
  let powerPelletsCollected = 0;
  let ghostsEaten = 0;
  let illegalMoves = 0;
  let wallBumps = 0;
  let deaths = 0;
  let totalReward = 0;
  let totalActionLatencyMs = 0;
  let decisionCount = 0;

  while (
    state.status !== "won" &&
    state.status !== "lost" &&
    state.steps < options.maxStepsPerEpisode
  ) {
    const view = getGameStateView(state);
    const startedAt = nowMs();
    const action = controller.selectAction(view) ?? Action.Stop;
    totalActionLatencyMs += nowMs() - startedAt;
    decisionCount += 1;

    if (!view.legalActions.includes(action)) {
      illegalMoves += 1;
    }

    const result = stepGame(state, action, SIMULATION_STEP_MS);
    state = result.state;
    totalReward += result.reward;

    if (result.events.pelletEaten) {
      pelletsCollected += 1;
    }

    if (result.events.powerPelletEaten) {
      powerPelletsCollected += 1;
    }

    if (result.events.ghostsEaten.length > 0) {
      ghostsEaten += result.events.ghostsEaten.length;
    }

    if (result.events.lifeLost) {
      deaths += 1;
    }

    if (result.events.wallBump) {
      wallBumps += 1;
    }
  }

  return {
    episodeIndex: options.episodeIndex,
    seed: options.seed,
    score: state.score,
    totalReward,
    steps: state.steps,
    survived: state.status !== "lost",
    won: state.status === "won",
    livesRemaining: state.lives,
    deaths,
    pelletsCollected,
    powerPelletsCollected,
    ghostsEaten,
    illegalMoves,
    wallBumps,
    averageDecisionMs: decisionCount > 0 ? totalActionLatencyMs / decisionCount : 0,
    finalGameState: resolveFinalGameState(state.status),
  };
}

export function evaluateControllerEpisodes(
  controller: Controller,
  options: EvaluateControllerOptions = {},
): EpisodeResult[] {
  const episodes = options.episodes ?? 5;
  const maxStepsPerEpisode = options.maxStepsPerEpisode ?? 3600;
  const difficulty = options.difficulty ?? "standard";
  const seeds =
    options.seeds && options.seeds.length > 0
      ? [...options.seeds]
      : generateEvaluationSeeds(episodes, options.seed ?? 1337);

  return seeds.map((seed, episodeIndex) =>
    evaluateEpisode(controller, {
      episodeIndex,
      seed,
      maxStepsPerEpisode,
      difficulty,
    }),
  );
}

export function evaluateControllerReport(
  controller: Controller,
  agentId: string,
  options: EvaluateControllerOptions = {},
): AgentEvaluationResult {
  return createAgentEvaluationResult(
    agentId,
    controller.name,
    evaluateControllerEpisodes(controller, options),
  );
}

export function evaluateController(
  controller: Controller,
  options: EvaluateControllerOptions = {},
): EvaluationMetrics {
  const episodes = evaluateControllerEpisodes(controller, options);
  return summarizeEpisodeResults(episodes);
}
