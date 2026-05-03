import { SIMULATION_STEP_MS } from "../game/constants";

export const REPORT_EPISODE_OPTIONS = [10, 50, 100, 500, 1000] as const;
export const DEFAULT_REPORT_EPISODES = 1000;
export const DEFAULT_REPORT_MAX_STEPS = 5000;

export type EvaluationMetricFormat =
  | "count"
  | "score"
  | "rate"
  | "duration-ms"
  | "duration-seconds";

export type EvaluationMetricId =
  | "averageScore"
  | "medianScore"
  | "bestScore"
  | "worstScore"
  | "scoreStdDev"
  | "averageReward"
  | "rewardStdDev"
  | "winRate"
  | "deathRate"
  | "averageSurvivalSteps"
  | "averageSurvivalTimeSeconds"
  | "averageLivesRemaining"
  | "averagePelletsCollected"
  | "averagePowerPelletsCollected"
  | "averageGhostsEaten"
  | "averageIllegalMoves"
  | "averageWallBumps"
  | "averageDecisionMs";

export interface EvaluationMetricDefinition {
  id: EvaluationMetricId;
  label: string;
  format: EvaluationMetricFormat;
  description: string;
}

export const EVALUATION_METRIC_DEFINITIONS: readonly EvaluationMetricDefinition[] = [
  {
    id: "averageScore",
    label: "Avg Score",
    format: "score",
    description: "Mean game score across all episodes.",
  },
  {
    id: "medianScore",
    label: "Median Score",
    format: "score",
    description: "Middle score after sorting all episode scores.",
  },
  {
    id: "bestScore",
    label: "Best Score",
    format: "score",
    description: "Highest score achieved by the agent.",
  },
  {
    id: "worstScore",
    label: "Worst Score",
    format: "score",
    description: "Lowest score achieved by the agent.",
  },
  {
    id: "scoreStdDev",
    label: "Score Std Dev",
    format: "score",
    description: "Score spread across seeds, used as a consistency signal.",
  },
  {
    id: "averageReward",
    label: "Avg Reward",
    format: "score",
    description: "Mean RL-style reward accumulated across episodes.",
  },
  {
    id: "rewardStdDev",
    label: "Reward Std Dev",
    format: "score",
    description: "Reward spread across episodes.",
  },
  {
    id: "winRate",
    label: "Win Rate",
    format: "rate",
    description: "Share of episodes where the level was cleared.",
  },
  {
    id: "deathRate",
    label: "Death Rate",
    format: "rate",
    description: "Share of episodes that ended in game over.",
  },
  {
    id: "averageSurvivalSteps",
    label: "Avg Survival Steps",
    format: "count",
    description: "Average number of simulation steps survived.",
  },
  {
    id: "averageSurvivalTimeSeconds",
    label: "Avg Survival Time",
    format: "duration-seconds",
    description: "Average survival time derived from steps and tick rate.",
  },
  {
    id: "averageLivesRemaining",
    label: "Avg Lives Remaining",
    format: "count",
    description: "Average number of lives left at the end of each episode.",
  },
  {
    id: "averagePelletsCollected",
    label: "Avg Pellets",
    format: "count",
    description: "Average number of regular pellets collected per episode.",
  },
  {
    id: "averagePowerPelletsCollected",
    label: "Avg Power Pellets",
    format: "count",
    description: "Average number of power pellets collected per episode.",
  },
  {
    id: "averageGhostsEaten",
    label: "Avg Ghosts Eaten",
    format: "count",
    description: "Average number of frightened ghosts eaten per episode.",
  },
  {
    id: "averageIllegalMoves",
    label: "Avg Illegal Moves",
    format: "count",
    description: "Average number of illegal actions returned by the controller.",
  },
  {
    id: "averageWallBumps",
    label: "Avg Wall Bumps",
    format: "count",
    description: "Average number of blocked movement attempts per episode.",
  },
  {
    id: "averageDecisionMs",
    label: "Avg Decision Time",
    format: "duration-ms",
    description: "Average controller decision latency in milliseconds.",
  },
] as const;

export type EpisodeTerminalState = "won" | "lost" | "max_steps";

export interface EpisodeResult {
  episodeIndex: number;
  seed: number;
  score: number;
  totalReward: number;
  steps: number;
  survived: boolean;
  won: boolean;
  livesRemaining: number;
  deaths: number;
  pelletsCollected: number;
  powerPelletsCollected: number;
  ghostsEaten: number;
  illegalMoves: number;
  wallBumps: number;
  averageDecisionMs: number;
  finalGameState: EpisodeTerminalState;
}

export interface EvaluationSummary {
  episodes: number;
  averageScore: number;
  medianScore: number;
  bestScore: number;
  worstScore: number;
  scoreStdDev: number;
  averageReward: number;
  rewardStdDev: number;
  winRate: number;
  deathRate: number;
  averageSurvivalSteps: number;
  averageSurvivalTimeSeconds: number;
  averageLivesRemaining: number;
  averagePelletsCollected: number;
  averagePowerPelletsCollected: number;
  averageGhostsEaten: number;
  averageIllegalMoves: number;
  averageWallBumps: number;
  averageDecisionMs: number;
  totalDeaths: number;
  totalPelletsCollected: number;
  totalPowerPelletsCollected: number;
  totalGhostsEaten: number;
  totalIllegalMoves: number;
  totalWallBumps: number;

  // Legacy aliases kept so the existing metrics page can keep working while
  // the richer reports tab is introduced.
  averageSurvivalTime: number;
  pelletsEaten: number;
  deathCount: number;
  averageStepsPerEpisode: number;
  averageActionLatencyMs: number;
}

export type EvaluationMetrics = EvaluationSummary;

export interface AgentEvaluationResult {
  agentId: string;
  agentName: string;
  episodes: number;
  summary: EvaluationSummary;
  episodesData: EpisodeResult[];
}

export function generateEvaluationSeeds(
  episodes: number,
  baseSeed = 1337,
): number[] {
  return Array.from({ length: Math.max(0, episodes) }, (_, index) => baseSeed + index);
}

function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sortedValues = [...values].sort((left, right) => left - right);
  const middleIndex = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 0) {
    return (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2;
  }

  return sortedValues[middleIndex];
}

function populationStdDev(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const mean = average(values);
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;

  return Math.sqrt(variance);
}

export function summarizeEpisodeResults(
  episodes: readonly EpisodeResult[],
  stepDurationMs = SIMULATION_STEP_MS,
): EvaluationSummary {
  if (episodes.length === 0) {
    return {
      episodes: 0,
      averageScore: 0,
      medianScore: 0,
      bestScore: 0,
      worstScore: 0,
      scoreStdDev: 0,
      averageReward: 0,
      rewardStdDev: 0,
      winRate: 0,
      deathRate: 0,
      averageSurvivalSteps: 0,
      averageSurvivalTimeSeconds: 0,
      averageLivesRemaining: 0,
      averagePelletsCollected: 0,
      averagePowerPelletsCollected: 0,
      averageGhostsEaten: 0,
      averageIllegalMoves: 0,
      averageWallBumps: 0,
      averageDecisionMs: 0,
      totalDeaths: 0,
      totalPelletsCollected: 0,
      totalPowerPelletsCollected: 0,
      totalGhostsEaten: 0,
      totalIllegalMoves: 0,
      totalWallBumps: 0,
      averageSurvivalTime: 0,
      pelletsEaten: 0,
      deathCount: 0,
      averageStepsPerEpisode: 0,
      averageActionLatencyMs: 0,
    };
  }

  const scoreValues = episodes.map((episode) => episode.score);
  const rewardValues = episodes.map((episode) => episode.totalReward);
  const stepValues = episodes.map((episode) => episode.steps);
  const lifeValues = episodes.map((episode) => episode.livesRemaining);
  const pelletValues = episodes.map((episode) => episode.pelletsCollected);
  const powerPelletValues = episodes.map((episode) => episode.powerPelletsCollected);
  const ghostValues = episodes.map((episode) => episode.ghostsEaten);
  const illegalMoveValues = episodes.map((episode) => episode.illegalMoves);
  const wallBumpValues = episodes.map((episode) => episode.wallBumps);
  const latencyValues = episodes.map((episode) => episode.averageDecisionMs);
  const wins = episodes.filter((episode) => episode.won).length;
  const gameOvers = episodes.filter(
    (episode) => episode.finalGameState === "lost",
  ).length;
  const totalDeaths = episodes.reduce((sum, episode) => sum + episode.deaths, 0);
  const totalPelletsCollected = pelletValues.reduce((sum, value) => sum + value, 0);
  const totalPowerPelletsCollected = powerPelletValues.reduce(
    (sum, value) => sum + value,
    0,
  );
  const totalGhostsEaten = ghostValues.reduce((sum, value) => sum + value, 0);
  const totalIllegalMoves = illegalMoveValues.reduce((sum, value) => sum + value, 0);
  const totalWallBumps = wallBumpValues.reduce((sum, value) => sum + value, 0);
  const averageSurvivalSteps = average(stepValues);
  const averageDecisionMs = average(latencyValues);

  return {
    episodes: episodes.length,
    averageScore: average(scoreValues),
    medianScore: median(scoreValues),
    bestScore: Math.max(...scoreValues),
    worstScore: Math.min(...scoreValues),
    scoreStdDev: populationStdDev(scoreValues),
    averageReward: average(rewardValues),
    rewardStdDev: populationStdDev(rewardValues),
    winRate: wins / episodes.length,
    deathRate: gameOvers / episodes.length,
    averageSurvivalSteps,
    averageSurvivalTimeSeconds: (averageSurvivalSteps * stepDurationMs) / 1000,
    averageLivesRemaining: average(lifeValues),
    averagePelletsCollected: average(pelletValues),
    averagePowerPelletsCollected: average(powerPelletValues),
    averageGhostsEaten: average(ghostValues),
    averageIllegalMoves: average(illegalMoveValues),
    averageWallBumps: average(wallBumpValues),
    averageDecisionMs,
    totalDeaths,
    totalPelletsCollected,
    totalPowerPelletsCollected,
    totalGhostsEaten,
    totalIllegalMoves,
    totalWallBumps,
    averageSurvivalTime: averageSurvivalSteps,
    pelletsEaten: totalPelletsCollected + totalPowerPelletsCollected,
    deathCount: totalDeaths,
    averageStepsPerEpisode: averageSurvivalSteps,
    averageActionLatencyMs: averageDecisionMs,
  };
}

export function createAgentEvaluationResult(
  agentId: string,
  agentName: string,
  episodesData: readonly EpisodeResult[],
): AgentEvaluationResult {
  const normalizedEpisodes = [...episodesData];

  return {
    agentId,
    agentName,
    episodes: normalizedEpisodes.length,
    summary: summarizeEpisodeResults(normalizedEpisodes),
    episodesData: normalizedEpisodes,
  };
}
