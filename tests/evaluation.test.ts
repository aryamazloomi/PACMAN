import { describe, expect, it } from "vitest";

import type { Controller } from "../src/controllers/Controller";
import { Action } from "../src/game/actions";
import type { GameStateView } from "../src/game/types";
import {
  evaluateControllerEpisodes,
  evaluateControllerReport,
} from "../src/evaluation/evaluateAgent";
import {
  evaluateAgentsReport,
  type ReportAgentDefinition,
} from "../src/evaluation/reports";
import {
  generateEvaluationSeeds,
  summarizeEpisodeResults,
  type EpisodeResult,
} from "../src/evaluation/metrics";

class IllegalMoveController implements Controller {
  name = "Illegal Move Tester";

  selectAction(_state: GameStateView): Action {
    return Action.Up;
  }
}

class StopController implements Controller {
  name = "Stop Tester";

  selectAction(_state: GameStateView): Action {
    return Action.Stop;
  }
}

describe("evaluation metrics", () => {
  it("builds a deterministic seed list", () => {
    expect(generateEvaluationSeeds(4, 42)).toEqual([42, 43, 44, 45]);
  });

  it("summarizes scores, rewards, and rates correctly", () => {
    const episodes: EpisodeResult[] = [
      {
        episodeIndex: 0,
        seed: 11,
        score: 100,
        totalReward: 10,
        steps: 60,
        survived: true,
        won: true,
        livesRemaining: 2,
        deaths: 1,
        pelletsCollected: 5,
        powerPelletsCollected: 1,
        ghostsEaten: 0,
        illegalMoves: 2,
        wallBumps: 3,
        averageDecisionMs: 0.5,
        finalGameState: "won",
      },
      {
        episodeIndex: 1,
        seed: 12,
        score: 40,
        totalReward: -2,
        steps: 30,
        survived: false,
        won: false,
        livesRemaining: 0,
        deaths: 3,
        pelletsCollected: 2,
        powerPelletsCollected: 0,
        ghostsEaten: 1,
        illegalMoves: 0,
        wallBumps: 1,
        averageDecisionMs: 1.5,
        finalGameState: "lost",
      },
    ];

    const summary = summarizeEpisodeResults(episodes);

    expect(summary.episodes).toBe(2);
    expect(summary.averageScore).toBe(70);
    expect(summary.medianScore).toBe(70);
    expect(summary.bestScore).toBe(100);
    expect(summary.worstScore).toBe(40);
    expect(summary.averageReward).toBe(4);
    expect(summary.winRate).toBe(0.5);
    expect(summary.deathRate).toBe(0.5);
    expect(summary.averageSurvivalSteps).toBe(45);
    expect(summary.averageLivesRemaining).toBe(1);
    expect(summary.averagePelletsCollected).toBe(3.5);
    expect(summary.averagePowerPelletsCollected).toBe(0.5);
    expect(summary.averageGhostsEaten).toBe(0.5);
    expect(summary.averageIllegalMoves).toBe(1);
    expect(summary.averageWallBumps).toBe(2);
    expect(summary.averageDecisionMs).toBe(1);
    expect(summary.totalDeaths).toBe(4);
    expect(summary.totalIllegalMoves).toBe(2);
    expect(summary.totalWallBumps).toBe(4);
  });
});

describe("headless evaluation", () => {
  it("records illegal moves and max-step endings", () => {
    const [episode] = evaluateControllerEpisodes(new IllegalMoveController(), {
      episodes: 1,
      maxStepsPerEpisode: 3,
      seed: 99,
    });

    expect(episode.seed).toBe(99);
    expect(episode.illegalMoves).toBeGreaterThan(0);
    expect(episode.finalGameState).toBe("max_steps");
    expect(episode.steps).toBe(3);
  });

  it("uses the provided seed list when building a report", () => {
    const report = evaluateControllerReport(new IllegalMoveController(), "illegal-test", {
      seeds: [5, 12, 20],
      maxStepsPerEpisode: 1,
    });

    expect(report.episodes).toBe(3);
    expect(report.episodesData.map((episode) => episode.seed)).toEqual([5, 12, 20]);
  });
});

describe("multi-agent reports", () => {
  const agents: ReportAgentDefinition[] = [
    {
      id: "illegal",
      name: "Illegal Agent",
      createController: (_seed: number) => new IllegalMoveController(),
    },
    {
      id: "stop",
      name: "Stop Agent",
      createController: (_seed: number) => new StopController(),
    },
  ];

  it("evaluates each agent on the same seed list", async () => {
    const report = await evaluateAgentsReport({
      agents,
      seeds: [31, 32, 33],
      maxStepsPerEpisode: 1,
      chunkSize: 1,
    });

    expect(report.settings.seeds).toEqual([31, 32, 33]);
    expect(report.agents).toHaveLength(2);
    expect(report.agents[0].episodesData.map((episode) => episode.seed)).toEqual([31, 32, 33]);
    expect(report.agents[1].episodesData.map((episode) => episode.seed)).toEqual([31, 32, 33]);
  });

  it("reports progress and supports cancellation", async () => {
    const progressEvents: number[] = [];
    const controller = new AbortController();

    const report = await evaluateAgentsReport({
      agents,
      episodesPerAgent: 5,
      maxStepsPerEpisode: 1,
      chunkSize: 1,
      signal: controller.signal,
      onProgress: (progress) => {
        progressEvents.push(progress.completedEpisodes);

        if (progress.completedEpisodes >= 1) {
          controller.abort();
        }
      },
    });

    expect(progressEvents[0]).toBe(0);
    expect(report.cancelled).toBe(true);
    expect(report.completedAgents).toBeLessThan(agents.length);
  });
});
