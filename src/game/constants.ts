export const TILE_SIZE = 24;
export const INITIAL_LIVES = 3;
export const SIMULATION_STEP_MS = 1000 / 60;
export const MAX_FRAME_DELTA_MS = 100;
export const PACMAN_MOVE_INTERVAL_MS = 150;
export const GHOST_MOVE_INTERVAL_MS = 185;
export const FRIGHTENED_GHOST_MOVE_INTERVAL_MS = 220;
export const POWER_PELLET_DURATION_MS = 6500;
export const START_DELAY_MS = 700;
export const RESPAWN_DELAY_MS = 900;

export const SCORE_VALUES = {
  pellet: 10,
  powerPellet: 50,
  ghost: 200,
  levelClear: 500,
  death: -100,
} as const;

export const REWARD_VALUES = {
  pellet: 1,
  powerPellet: 5,
  ghost: 12,
  lifeLost: -20,
  wallBump: -0.3,
  levelClear: 25,
  idle: -0.02,
} as const;

export const DEFAULT_SEED = 1337;
