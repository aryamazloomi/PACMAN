import { Action } from "./actions";
import { DEFAULT_SEED, INITIAL_LIVES, START_DELAY_MS } from "./constants";
import { createGhosts, createPacman } from "./entities";
import { createMaze } from "./maze";
import { getLegalActions } from "./navigation";
import type { GameState, GameStateView, Maze } from "./types";

export interface CreateGameStateOptions {
  maze?: Maze;
  lives?: number;
  seed?: number;
  readyDelayMs?: number;
}

export function createGameState(
  options: CreateGameStateOptions = {},
): GameState {
  const maze = options.maze ?? createMaze();
  const seed = options.seed ?? DEFAULT_SEED;
  const readyDelayMs = options.readyDelayMs ?? START_DELAY_MS;

  return {
    maze,
    pacman: createPacman(maze),
    ghosts: createGhosts(maze),
    pellets: new Set(maze.initialPellets),
    powerPellets: new Set(maze.initialPowerPellets),
    score: 0,
    reward: 0,
    lives: options.lives ?? INITIAL_LIVES,
    steps: 0,
    seed,
    rngState: seed >>> 0,
    status: readyDelayMs > 0 ? "ready" : "running",
    lastAction: Action.Stop,
    readyDelayMs,
    lastEvents: {
      pelletEaten: false,
      powerPelletEaten: false,
      ghostsEaten: [],
      lifeLost: false,
      wallBump: false,
      levelCleared: false,
    },
  };
}

export function cloneGameState(state: GameState): GameState {
  return {
    ...state,
    pacman: {
      ...state.pacman,
      position: { ...state.pacman.position },
      spawn: { ...state.pacman.spawn },
    },
    ghosts: state.ghosts.map((ghost) => ({
      ...ghost,
      position: { ...ghost.position },
      spawn: { ...ghost.spawn },
      scatterTarget: { ...ghost.scatterTarget },
    })),
    pellets: new Set(state.pellets),
    powerPellets: new Set(state.powerPellets),
    lastEvents: {
      ...state.lastEvents,
      ghostsEaten: [...state.lastEvents.ghostsEaten],
    },
  };
}

export function getGameStateView(state: GameState): GameStateView {
  return {
    maze: state.maze,
    pacman: state.pacman,
    ghosts: state.ghosts,
    pellets: state.pellets,
    powerPellets: state.powerPellets,
    score: state.score,
    reward: state.reward,
    lives: state.lives,
    steps: state.steps,
    seed: state.seed,
    status: state.status,
    lastAction: state.lastAction,
    legalActions: getLegalActions(state.maze, state.pacman.position),
  };
}
