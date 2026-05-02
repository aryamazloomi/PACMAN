import { describe, expect, it } from "vitest";

import { Action } from "../src/game/actions";
import {
  CLYDE_RELEASE_DELAY_MS,
  GHOST_MOVE_INTERVAL_MS,
  INKY_RELEASE_DELAY_MS,
  PACMAN_MOVE_INTERVAL_MS,
  PINKY_RELEASE_DELAY_MS,
  SIMULATION_STEP_MS,
  START_DELAY_MS,
} from "../src/game/constants";
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

function createGhostReleaseTestState(): GameState {
  const maze = createMaze([
    "#########",
    "#.......#",
    "###.D.###",
    "#.3H2H4.#",
    "#########",
    "#P......#",
    "#########",
  ]);

  return createGameState({ maze, readyDelayMs: 0 });
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

  it("scales ghost pressure across the three difficulty levels", () => {
    const easyState = createGameState({ difficulty: "easy" });
    const standardState = createGameState({ difficulty: "standard" });
    const hardState = createGameState({ difficulty: "hard" });
    const easyPinky = easyState.ghosts.find((ghost) => ghost.id === "pinky");
    const hardPinky = hardState.ghosts.find((ghost) => ghost.id === "pinky");

    expect(easyState.simulationConfig.ghostMoveIntervalMs).toBeGreaterThan(
      standardState.simulationConfig.ghostMoveIntervalMs,
    );
    expect(standardState.simulationConfig.ghostMoveIntervalMs).toBeGreaterThan(
      hardState.simulationConfig.ghostMoveIntervalMs,
    );
    expect(easyState.simulationConfig.powerPelletDurationMs).toBeGreaterThan(
      hardState.simulationConfig.powerPelletDurationMs,
    );
    expect(easyPinky?.releaseTimerMs).toBeGreaterThan(hardPinky?.releaseTimerMs ?? 0);
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

  it("ignores collisions with exiting ghosts", () => {
    const state = createGameState({ readyDelayMs: 0 });
    const pinky = state.ghosts.find((ghost) => ghost.id === "pinky");

    if (!pinky) {
      throw new Error("Expected Pinky to exist in the default maze.");
    }

    pinky.mode = "exiting";
    pinky.releaseTimerMs = 0;
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

  it("releases Pinky, Inky, and Clyde gradually", () => {
    const beforePinky = advanceGame(
      createGhostReleaseTestState(),
      Action.Stop,
      PINKY_RELEASE_DELAY_MS - SIMULATION_STEP_MS,
    );
    const afterPinky = advanceGame(
      createGhostReleaseTestState(),
      Action.Stop,
      PINKY_RELEASE_DELAY_MS + GHOST_MOVE_INTERVAL_MS * 2,
    );
    const afterInky = advanceGame(
      createGhostReleaseTestState(),
      Action.Stop,
      INKY_RELEASE_DELAY_MS + GHOST_MOVE_INTERVAL_MS * 4,
    );
    const afterClyde = advanceGame(
      createGhostReleaseTestState(),
      Action.Stop,
      CLYDE_RELEASE_DELAY_MS + GHOST_MOVE_INTERVAL_MS * 4,
    );

    expect(beforePinky.state.ghosts.every((ghost) => ghost.mode === "house")).toBe(true);
    expect(afterPinky.state.ghosts.find((ghost) => ghost.id === "pinky")?.mode).not.toBe("house");
    expect(afterPinky.state.ghosts.find((ghost) => ghost.id === "inky")?.mode).toBe("house");
    expect(afterPinky.state.ghosts.find((ghost) => ghost.id === "clyde")?.mode).toBe("house");
    expect(afterInky.state.ghosts.find((ghost) => ghost.id === "inky")?.mode).not.toBe("house");
    expect(afterInky.state.ghosts.find((ghost) => ghost.id === "clyde")?.mode).toBe("house");
    expect(afterClyde.state.ghosts.find((ghost) => ghost.id === "clyde")?.mode).not.toBe("house");
  });

  it("resets ghost start modes and release timers after a life is lost", () => {
    const state = createGameState({ readyDelayMs: 0 });
    const pinky = state.ghosts.find((ghost) => ghost.id === "pinky");
    const blinky = state.ghosts.find((ghost) => ghost.id === "blinky");

    if (!pinky || !blinky) {
      throw new Error("Expected Blinky and Pinky to exist in the default maze.");
    }

    pinky.mode = "active";
    pinky.releaseTimerMs = 0;
    pinky.position = { ...state.pacman.position };

    const result = stepGame(state, Action.Stop, SIMULATION_STEP_MS);
    const resetBlinky = result.state.ghosts.find((ghost) => ghost.id === "blinky");
    const resetPinky = result.state.ghosts.find((ghost) => ghost.id === "pinky");
    const resetInky = result.state.ghosts.find((ghost) => ghost.id === "inky");
    const resetClyde = result.state.ghosts.find((ghost) => ghost.id === "clyde");

    expect(result.events.lifeLost).toBe(true);
    expect(result.state.status).toBe("ready");
    expect(result.state.pacman.position).toEqual(result.state.pacman.spawn);
    expect(resetBlinky?.mode).toBe("active");
    expect(resetPinky?.mode).toBe("house");
    expect(resetInky?.mode).toBe("house");
    expect(resetClyde?.mode).toBe("house");
    expect(resetPinky?.releaseTimerMs).toBeGreaterThan(0);
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
