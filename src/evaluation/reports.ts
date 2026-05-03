import type { Controller } from "../controllers/Controller";
import type { DifficultyId } from "../game/types";
import { evaluateEpisode } from "./evaluateAgent";
import {
  DEFAULT_REPORT_EPISODES,
  DEFAULT_REPORT_MAX_STEPS,
  type AgentEvaluationResult,
  type EvaluationSummary,
  generateEvaluationSeeds,
  summarizeEpisodeResults,
} from "./metrics";

export interface ReportAgentDefinition {
  id: string;
  name: string;
  createController: (seed: number) => Controller;
}

export interface ReportsEvaluationProgress {
  totalAgents: number;
  completedAgents: number;
  episodesPerAgent: number;
  totalEpisodes: number;
  completedEpisodes: number;
  currentAgentId: string | null;
  currentAgentName: string | null;
  currentEpisode: number;
  percent: number;
  cancelled: boolean;
}

export interface ReportsEvaluationSettings {
  agentIds: string[];
  episodesPerAgent: number;
  maxStepsPerEpisode: number;
  seeds: number[];
  renderDuringEvaluation: boolean;
  difficulty: DifficultyId;
}

export interface RankingEntry {
  agentId: string | null;
  agentName: string | null;
  value: number | null;
}

export interface EvaluationRanking {
  bestAverageScore: RankingEntry;
  bestWinRate: RankingEntry;
  bestSurvivalTime: RankingEntry;
  mostConsistent: RankingEntry;
  fastestDecision: RankingEntry;
  lowestIllegalMoves: RankingEntry;
}

export interface ReportsEvaluationResult {
  generatedAt: string;
  cancelled: boolean;
  completedAgents: number;
  settings: ReportsEvaluationSettings;
  ranking: EvaluationRanking;
  agents: AgentEvaluationResult[];
  appVersion?: string;
}

export interface ReportsEvaluationOptions {
  agents: readonly ReportAgentDefinition[];
  episodesPerAgent?: number;
  maxStepsPerEpisode?: number;
  seeds?: readonly number[];
  baseSeed?: number;
  difficulty?: DifficultyId;
  chunkSize?: number;
  renderDuringEvaluation?: boolean;
  appVersion?: string;
  signal?: AbortSignal;
  onProgress?: (progress: ReportsEvaluationProgress) => void;
}

function createEmptyRanking(): EvaluationRanking {
  const emptyEntry: RankingEntry = {
    agentId: null,
    agentName: null,
    value: null,
  };

  return {
    bestAverageScore: emptyEntry,
    bestWinRate: emptyEntry,
    bestSurvivalTime: emptyEntry,
    mostConsistent: emptyEntry,
    fastestDecision: emptyEntry,
    lowestIllegalMoves: emptyEntry,
  };
}

function createSettings(options: ReportsEvaluationOptions): ReportsEvaluationSettings {
  const requestedEpisodes = options.episodesPerAgent ?? DEFAULT_REPORT_EPISODES;
  const seeds =
    options.seeds && options.seeds.length > 0
      ? [...options.seeds]
      : generateEvaluationSeeds(requestedEpisodes, options.baseSeed ?? 1337);

  return {
    agentIds: options.agents.map((agent) => agent.id),
    episodesPerAgent: seeds.length,
    maxStepsPerEpisode: options.maxStepsPerEpisode ?? DEFAULT_REPORT_MAX_STEPS,
    seeds,
    renderDuringEvaluation: options.renderDuringEvaluation ?? false,
    difficulty: options.difficulty ?? "standard",
  };
}

function buildProgress(
  settings: ReportsEvaluationSettings,
  options: ReportsEvaluationOptions,
  completedAgents: number,
  completedEpisodes: number,
  currentAgent: ReportAgentDefinition | null,
  currentEpisode: number,
  cancelled: boolean,
): ReportsEvaluationProgress {
  const totalEpisodes = settings.episodesPerAgent * options.agents.length;
  const percent = totalEpisodes === 0 ? 0 : (completedEpisodes / totalEpisodes) * 100;

  return {
    totalAgents: options.agents.length,
    completedAgents,
    episodesPerAgent: settings.episodesPerAgent,
    totalEpisodes,
    completedEpisodes,
    currentAgentId: currentAgent?.id ?? null,
    currentAgentName: currentAgent?.name ?? null,
    currentEpisode,
    percent,
    cancelled,
  };
}

function createAgentResult(
  agent: ReportAgentDefinition,
  controller: Controller,
  episodesData: AgentEvaluationResult["episodesData"],
): AgentEvaluationResult {
  return {
    agentId: agent.id,
    agentName: controller.name || agent.name,
    episodes: episodesData.length,
    summary: summarizeEpisodeResults(episodesData),
    episodesData,
  };
}

function pickRankingEntry(
  results: readonly AgentEvaluationResult[],
  extractor: (summary: EvaluationSummary) => number,
  preference: "highest" | "lowest",
): RankingEntry {
  if (results.length === 0) {
    return {
      agentId: null,
      agentName: null,
      value: null,
    };
  }

  const sortedResults = [...results].sort((left, right) => {
    const leftValue = extractor(left.summary);
    const rightValue = extractor(right.summary);
    return preference === "highest" ? rightValue - leftValue : leftValue - rightValue;
  });
  const winner = sortedResults[0];

  return {
    agentId: winner.agentId,
    agentName: winner.agentName,
    value: extractor(winner.summary),
  };
}

function buildRanking(results: readonly AgentEvaluationResult[]): EvaluationRanking {
  if (results.length === 0) {
    return createEmptyRanking();
  }

  return {
    bestAverageScore: pickRankingEntry(results, (summary) => summary.averageScore, "highest"),
    bestWinRate: pickRankingEntry(results, (summary) => summary.winRate, "highest"),
    bestSurvivalTime: pickRankingEntry(
      results,
      (summary) => summary.averageSurvivalTimeSeconds,
      "highest",
    ),
    mostConsistent: pickRankingEntry(results, (summary) => summary.scoreStdDev, "lowest"),
    fastestDecision: pickRankingEntry(results, (summary) => summary.averageDecisionMs, "lowest"),
    lowestIllegalMoves: pickRankingEntry(
      results,
      (summary) => summary.averageIllegalMoves,
      "lowest",
    ),
  };
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

export async function evaluateAgentsReport(
  options: ReportsEvaluationOptions,
): Promise<ReportsEvaluationResult> {
  const settings = createSettings(options);
  const chunkSize = Math.max(1, options.chunkSize ?? 10);
  const progressCallback = options.onProgress;
  const results: AgentEvaluationResult[] = [];
  let completedEpisodes = 0;
  let cancelled = false;

  progressCallback?.(
    buildProgress(settings, options, 0, 0, null, 0, false),
  );

  for (let agentIndex = 0; agentIndex < options.agents.length; agentIndex += 1) {
    const agent = options.agents[agentIndex];

    if (options.signal?.aborted) {
      cancelled = true;
      break;
    }

    const controller = agent.createController(settings.seeds[0] ?? (options.baseSeed ?? 1337));
    const episodesData: AgentEvaluationResult["episodesData"] = [];

    for (
      let episodeIndex = 0;
      episodeIndex < settings.episodesPerAgent;
      episodeIndex += 1
    ) {
      if (options.signal?.aborted) {
        cancelled = true;
        break;
      }

      episodesData.push(
        evaluateEpisode(controller, {
          episodeIndex,
          seed: settings.seeds[episodeIndex],
          maxStepsPerEpisode: settings.maxStepsPerEpisode,
          difficulty: settings.difficulty,
        }),
      );

      completedEpisodes += 1;
      progressCallback?.(
        buildProgress(
          settings,
          options,
          results.length,
          completedEpisodes,
          agent,
          episodeIndex + 1,
          false,
        ),
      );

      if ((episodeIndex + 1) % chunkSize === 0) {
        await yieldToBrowser();
      }
    }

    if (episodesData.length === settings.episodesPerAgent) {
      results.push(createAgentResult(agent, controller, episodesData));
    }

    if (cancelled) {
      break;
    }
  }

  const report: ReportsEvaluationResult = {
    generatedAt: new Date().toISOString(),
    cancelled,
    completedAgents: results.length,
    settings,
    ranking: buildRanking(results),
    agents: results,
    appVersion: options.appVersion,
  };

  progressCallback?.(
    buildProgress(
      settings,
      options,
      results.length,
      completedEpisodes,
      null,
      0,
      cancelled,
    ),
  );

  return report;
}
