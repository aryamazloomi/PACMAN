import { describe, expect, it } from "vitest";

import { Action } from "../src/game/actions";
import { stepGame } from "../src/game/engine";
import { createGameState, getGameStateView } from "../src/game/gameState";
import { createMaze } from "../src/game/maze";

describe("game core", () => {
  it("loads the default maze with spawns and pellets", () => {
    const maze = createMaze();

    expect(maze.width).toBeGreaterThan(0);
    expect(maze.height).toBeGreaterThan(0);
    expect(maze.ghostSpawns).toHaveLength(4);
    expect(maze.initialPellets.size + maze.initialPowerPellets.size).toBeGreaterThan(0);
  });

  it("reports legal moves from the Pac-Man spawn", () => {
    const state = createGameState();
    const view = getGameStateView(state);

    expect(view.legalActions).toContain(Action.Left);
    expect(view.legalActions).toContain(Action.Right);
    expect(view.legalActions).toContain(Action.Stop);
    expect(view.legalActions).not.toContain(Action.Up);
  });

  it("collects a pellet and adds score when Pac-Man moves onto it", () => {
    const state = createGameState();
    const result = stepGame(state, Action.Left);

    expect(result.events.pelletEaten).toBe(true);
    expect(result.state.score).toBeGreaterThan(0);
  });

  it("marks a wall bump for invalid movement requests", () => {
    const state = createGameState();
    const result = stepGame(state, Action.Up);

    expect(result.events.wallBump).toBe(true);
    expect(result.state.pacman.position.x).toBe(state.pacman.position.x - 1);
  });

  it("reduces lives on ghost collision", () => {
    const state = createGameState();
    state.ghosts[0].position = { ...state.pacman.position };

    const result = stepGame(state, Action.Stop);

    expect(result.events.lifeLost).toBe(true);
    expect(result.state.lives).toBe(state.lives - 1);
  });
});
