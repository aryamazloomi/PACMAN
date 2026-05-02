export const TILE_SIZE = 24;
export const GAME_TICK_MS = 120;
export const INITIAL_LIVES = 3;

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

export const POWER_PELLET_DURATION_TICKS = 42;

export const DEFAULT_SEED = 1337;
