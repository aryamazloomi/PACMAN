import type { Action } from "./actions";

export type GameStatus = "running" | "paused" | "won" | "lost";

export type GhostId = "blinky" | "pinky" | "inky" | "clyde";

export interface Position {
  x: number;
  y: number;
}

export interface Maze {
  width: number;
  height: number;
  rows: readonly string[];
  walls: ReadonlySet<string>;
  initialPellets: ReadonlySet<string>;
  initialPowerPellets: ReadonlySet<string>;
  pacmanSpawn: Position;
  ghostSpawns: readonly GhostSpawn[];
}

export interface GhostSpawn {
  id: GhostId;
  position: Position;
  color: string;
  scatterTarget: Position;
}

export interface PacmanEntity {
  position: Position;
  spawn: Position;
  direction: Action;
  desiredDirection: Action;
  moveProgressMs: number;
}

export interface GhostEntity {
  id: GhostId;
  color: string;
  position: Position;
  spawn: Position;
  direction: Action;
  frightenedTimerMs: number;
  moveProgressMs: number;
  scatterTarget: Position;
}

export interface StepEvents {
  pelletEaten: boolean;
  powerPelletEaten: boolean;
  ghostsEaten: GhostId[];
  lifeLost: boolean;
  wallBump: boolean;
  levelCleared: boolean;
}

export interface GameState {
  maze: Maze;
  pacman: PacmanEntity;
  ghosts: GhostEntity[];
  pellets: Set<string>;
  powerPellets: Set<string>;
  score: number;
  reward: number;
  lives: number;
  steps: number;
  seed: number;
  rngState: number;
  status: GameStatus;
  lastAction: Action;
  lastEvents: StepEvents;
  readyDelayMs: number;
}

export interface GameStateView {
  maze: Maze;
  pacman: Readonly<PacmanEntity>;
  ghosts: readonly Readonly<GhostEntity>[];
  pellets: ReadonlySet<string>;
  powerPellets: ReadonlySet<string>;
  score: number;
  reward: number;
  lives: number;
  steps: number;
  seed: number;
  status: GameStatus;
  lastAction: Action;
  legalActions: readonly Action[];
}

export interface StepResult {
  state: GameState;
  done: boolean;
  reward: number;
  events: StepEvents;
}
