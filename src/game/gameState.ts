import { Action } from "./actions";
import { DEFAULT_SEED, INITIAL_LIVES, START_DELAY_MS } from "./constants";
import { DEFAULT_DIFFICULTY, getSimulationConfig } from "./difficulty";
import { createGhosts, createPacman } from "./entities";
import { createMaze } from "./maze";
import { getLegalActions } from "./navigation";
import type { DifficultyId, GameState, GameStateView, Maze } from "./types";

export interface CreateGameStateOptions {
  maze?: Maze;
  lives?: number;
  seed?: number;
  readyDelayMs?: number;
  difficulty?: DifficultyId;
}

export function createGameState(
  options: CreateGameStateOptions = {},
): GameState {
  const maze = options.maze ?? createMaze();
  const seed = options.seed ?? DEFAULT_SEED;
  const readyDelayMs = options.readyDelayMs ?? START_DELAY_MS;
  const difficulty = options.difficulty ?? DEFAULT_DIFFICULTY;
  const simulationConfig = getSimulationConfig(difficulty);

  return {
    maze,
    simulationConfig,
    pacman: createPacman(maze),
    ghosts: createGhosts(maze, simulationConfig),
    pellets: new Set(maze.initialPellets),
    powerPellets: new Set(maze.initialPowerPellets),
    score: 0,
    reward: 0,
    lives: options.lives ?? INITIAL_LIVES,
    steps: 0,
    seed,
    difficulty,
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
    difficulty: state.difficulty,
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
