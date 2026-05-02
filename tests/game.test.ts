import { describe, expect, it } from "vitest";

import { Action } from "../src/game/actions";
import { PACMAN_MOVE_INTERVAL_MS, SIMULATION_STEP_MS, START_DELAY_MS } from "../src/game/constants";
import { stepGame } from "../src/game/engine";
import { createGameState, getGameStateView } from "../src/game/gameState";
import { createMaze } from "../src/game/maze";
import type { GameState, StepResult } from "../src/game/types";

function advanceGame(
  initialState: GameState,
  action: Action,
  durationMs: number,
): StepResult {
  let result: StepResult = {
    state: initialState,
    done: false,
    reward: initialState.reward,
    events: {
      pelletEaten: false,
      powerPelletEaten: false,
      ghostsEaten: [],
      lifeLost: false,
      wallBump: false,
      levelCleared: false,
    },
  };
  let remainingMs = durationMs;

  while (remainingMs > 0) {
    const stepMs = Math.min(SIMULATION_STEP_MS, remainingMs);
    result = stepGame(result.state, action, stepMs);
    remainingMs -= stepMs;
  }

  return result;
}

describe("game core", () => {
  it("loads the default maze with spawns and pellets", () => {
    const maze = createMaze();

    expect(maze.width).toBeGreaterThan(0);
    expect(maze.height).toBeGreaterThan(0);
    expect(maze.ghostSpawns).toHaveLength(4);
    expect(maze.ghostDoor).not.toBeNull();
    expect(maze.initialPellets.size + maze.initialPowerPellets.size).toBeGreaterThan(0);
  });

  it("starts Pac-Man below the house and keeps only Blinky active", () => {
    const state = createGameState();
    const blinky = state.ghosts.find((ghost) => ghost.id === "blinky");
    const pinky = state.ghosts.find((ghost) => ghost.id === "pinky");
    const inky = state.ghosts.find((ghost) => ghost.id === "inky");
    const clyde = state.ghosts.find((ghost) => ghost.id === "clyde");

    expect(state.pacman.position.y).toBeGreaterThan((state.maze.ghostDoor?.y ?? 0));
    expect(state.pacman.direction).toBe(Action.Left);
    expect(blinky?.mode).toBe("active");
    expect(pinky?.mode).toBe("house");
    expect(inky?.mode).toBe("house");
    expect(clyde?.mode).toBe("house");
  });

  it("does not place pellets on Pac-Man spawn, the ghost door, or house spawns", () => {
    const state = createGameState();
    const occupiedKeys = new Set<string>([
      `${state.pacman.position.x},${state.pacman.position.y}`,
      ...state.ghosts.map((ghost) => `${ghost.position.x},${ghost.position.y}`),
      ...(state.maze.ghostDoor
        ? [`${state.maze.ghostDoor.x},${state.maze.ghostDoor.y}`]
        : []),
    ]);

    occupiedKeys.forEach((key) => {
      expect(state.pellets.has(key)).toBe(false);
      expect(state.powerPellets.has(key)).toBe(false);
    });
  });

  it("holds characters at their starting positions during the ready delay", () => {
    const state = createGameState();
    const result = advanceGame(state, Action.Left, START_DELAY_MS - SIMULATION_STEP_MS);

    expect(state.status).toBe("ready");
    expect(result.state.pacman.position).toEqual(state.pacman.position);
    expect(result.state.readyDelayMs).toBeGreaterThan(0);
  });

  it("reports legal moves from the Pac-Man spawn", () => {
    const state = createGameState({ readyDelayMs: 0 });
    const view = getGameStateView(state);

    expect(view.legalActions).toContain(Action.Left);
    expect(view.legalActions).toContain(Action.Right);
    expect(view.legalActions).toContain(Action.Stop);
    expect(view.legalActions).not.toContain(Action.Up);
  });

  it("treats the ghost house door as illegal for Pac-Man", () => {
    const maze = createMaze([
      "#####",
      "#1..#",
      "#.D.#",
      "#.P.#",
      "#####",
    ]);
    const state = createGameState({ maze, readyDelayMs: 0 });
    const view = getGameStateView(state);

    expect(view.legalActions).not.toContain(Action.Up);
  });

  it("collects a pellet and adds score when Pac-Man moves onto it", () => {
    const state = createGameState({ readyDelayMs: 0 });
    const result = advanceGame(state, Action.Left, PACMAN_MOVE_INTERVAL_MS);

    expect(result.events.pelletEaten).toBe(true);
    expect(result.state.score).toBeGreaterThan(0);
  });

  it("collects pellets only once when Pac-Man revisits a tile", () => {
    const state = createGameState({ readyDelayMs: 0 });
    const firstMove = advanceGame(state, Action.Left, PACMAN_MOVE_INTERVAL_MS);
    const returnMove = advanceGame(firstMove.state, Action.Right, PACMAN_MOVE_INTERVAL_MS);
    const revisitMove = advanceGame(returnMove.state, Action.Left, PACMAN_MOVE_INTERVAL_MS);

    expect(firstMove.state.score).toBe(10);
    expect(revisitMove.state.score).toBe(returnMove.state.score);
  });

  it("marks a wall bump and does not drift into another direction for an illegal move", () => {
    const state = createGameState({ readyDelayMs: 0 });
    const result = advanceGame(state, Action.Up, PACMAN_MOVE_INTERVAL_MS);

    expect(result.events.wallBump).toBe(true);
    expect(result.state.pacman.position).toEqual(state.pacman.position);
    expect(result.state.pacman.direction).toBe(Action.Stop);
  });

  it("activates frightened mode when a power pellet is collected", () => {
    const maze = createMaze([
      "#####",
      "#Po1#",
      "#####",
    ]);
    const state = createGameState({ maze, readyDelayMs: 0 });
    const result = advanceGame(state, Action.Right, PACMAN_MOVE_INTERVAL_MS);

    expect(result.events.powerPelletEaten).toBe(true);
    expect(result.state.ghosts.every((ghost) => ghost.frightenedTimerMs > 0)).toBe(true);
  });

  it("reduces one life only once and enters a respawn delay on ghost collision", () => {
    const state = createGameState({ readyDelayMs: 0 });
    state.ghosts[0].position = { ...state.pacman.position };
    const firstCollision = stepGame(state, Action.Stop, SIMULATION_STEP_MS);
    const secondFrame = stepGame(firstCollision.state, Action.Stop, SIMULATION_STEP_MS);

    expect(firstCollision.events.lifeLost).toBe(true);
    expect(firstCollision.state.lives).toBe(state.lives - 1);
    expect(firstCollision.state.status).toBe("ready");
    expect(firstCollision.state.readyDelayMs).toBeGreaterThan(0);
    expect(secondFrame.events.lifeLost).toBe(false);
    expect(secondFrame.state.lives).toBe(firstCollision.state.lives);
  });

  it("ignores collisions with house ghosts", () => {
    const state = createGameState({ readyDelayMs: 0 });
    const pinky = state.ghosts.find((ghost) => ghost.id === "pinky");

    if (!pinky) {
      throw new Error("Expected Pinky to exist in the default maze.");
    }

    pinky.position = { ...state.pacman.position };

    const result = stepGame(state, Action.Stop, SIMULATION_STEP_MS);

    expect(result.events.lifeLost).toBe(false);
    expect(result.state.lives).toBe(state.lives);
  });

  it("eats frightened ghosts and resets them to spawn", () => {
    const state = createGameState({ readyDelayMs: 0 });
    state.ghosts[0].position = { ...state.pacman.position };
    state.ghosts[0].frightenedTimerMs = 1000;

    const result = stepGame(state, Action.Stop, SIMULATION_STEP_MS);

    expect(result.events.ghostsEaten).toContain(state.ghosts[0].id);
    expect(result.state.lives).toBe(state.lives);
    expect(result.state.score).toBe(200);
    expect(result.state.ghosts[0].position).toEqual(result.state.ghosts[0].spawn);
  });

  it("wins the level when the final pellet is collected", () => {
    const maze = createMaze([
      "#####",
      "#P.1#",
      "#####",
    ]);
    const state = createGameState({ maze, readyDelayMs: 0 });
    const result = advanceGame(state, Action.Right, PACMAN_MOVE_INTERVAL_MS);

    expect(result.events.levelCleared).toBe(true);
    expect(result.state.status).toBe("won");
  });

  it("triggers game over when Pac-Man loses the last life", () => {
    const state = createGameState({ lives: 1, readyDelayMs: 0 });
    state.ghosts[0].position = { ...state.pacman.position };

    const result = stepGame(state, Action.Stop, SIMULATION_STEP_MS);

    expect(result.events.lifeLost).toBe(true);
    expect(result.state.lives).toBe(0);
    expect(result.state.status).toBe("lost");
  });
});
