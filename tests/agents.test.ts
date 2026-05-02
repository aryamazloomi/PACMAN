import { describe, expect, it } from "vitest";

import { Action } from "../src/game/actions";
import { createGameState, getGameStateView } from "../src/game/gameState";
import { AStarAgent } from "../src/controllers/AStarAgent";
import { GhostAvoidanceAgent } from "../src/controllers/GhostAvoidanceAgent";
import { GreedyPelletAgent } from "../src/controllers/GreedyPelletAgent";
import { RandomAgent } from "../src/controllers/RandomAgent";
import { evaluateController } from "../src/evaluation/evaluateAgent";

describe("controllers", () => {
  it("RandomAgent returns a legal action", () => {
    const state = createGameState({ readyDelayMs: 0 });
    const agent = new RandomAgent(7);
    const action = agent.selectAction(getGameStateView(state));

    expect(getGameStateView(state).legalActions).toContain(action);
  });

  it("GreedyPelletAgent moves toward a nearby pellet", () => {
    const state = createGameState({ readyDelayMs: 0 });
    const agent = new GreedyPelletAgent();

    expect(agent.selectAction(getGameStateView(state))).toBe(Action.Left);
  });

  it("GhostAvoidanceAgent avoids immediate ghost danger when it can", () => {
    const state = createGameState({ readyDelayMs: 0 });
    state.ghosts[0].position = {
      x: state.pacman.position.x - 1,
      y: state.pacman.position.y,
    };
    state.ghosts[1].position = { x: 1, y: 1 };
    state.ghosts[2].position = { x: 17, y: 1 };
    state.ghosts[3].position = { x: 17, y: 13 };

    const agent = new GhostAvoidanceAgent();

    expect(agent.selectAction(getGameStateView(state))).toBe(Action.Right);
  });

  it("AStarAgent returns a legal action", () => {
    const state = createGameState({ readyDelayMs: 0 });
    const agent = new AStarAgent();
    const action = agent.selectAction(getGameStateView(state));

    expect(getGameStateView(state).legalActions).toContain(action);
  });

  it("evaluation reports aggregate metrics", () => {
    const metrics = evaluateController(new RandomAgent(11), {
      episodes: 2,
      maxStepsPerEpisode: 25,
      seed: 11,
    });

    expect(metrics.episodes).toBe(2);
    expect(metrics.averageStepsPerEpisode).toBeGreaterThan(0);
  });
});
