import {
  FRIGHTENED_GHOST_MOVE_INTERVAL_MS,
  GHOST_MOVE_INTERVAL_MS,
  POWER_PELLET_DURATION_MS,
} from "./constants";
import type { DifficultyId, SimulationConfig } from "./types";

export interface DifficultyOption extends SimulationConfig {
  label: string;
  description: string;
}

export const DEFAULT_DIFFICULTY: DifficultyId = "standard";

export const DIFFICULTY_OPTIONS: readonly DifficultyOption[] = [
  {
    difficulty: "easy",
    label: "Easy",
    description:
      "Softer ghost pressure, longer frightened windows, and slower house release for learning the maze.",
    ghostMoveIntervalMs: 205,
    frightenedGhostMoveIntervalMs: 250,
    powerPelletDurationMs: 7800,
    ghostReleaseDelayMultiplier: 1.15,
  },
  {
    difficulty: "standard",
    label: "Standard",
    description:
      "Balanced pacing that matches the current default project tuning.",
    ghostMoveIntervalMs: GHOST_MOVE_INTERVAL_MS,
    frightenedGhostMoveIntervalMs: FRIGHTENED_GHOST_MOVE_INTERVAL_MS,
    powerPelletDurationMs: POWER_PELLET_DURATION_MS,
    ghostReleaseDelayMultiplier: 1,
  },
  {
    difficulty: "hard",
    label: "Hard",
    description:
      "Faster ghost pressure, shorter frightened windows, and quicker release timing for tougher runs.",
    ghostMoveIntervalMs: 165,
    frightenedGhostMoveIntervalMs: 205,
    powerPelletDurationMs: 5400,
    ghostReleaseDelayMultiplier: 0.85,
  },
] as const;

export function getSimulationConfig(
  difficulty: DifficultyId = DEFAULT_DIFFICULTY,
): SimulationConfig {
  return (
    DIFFICULTY_OPTIONS.find((option) => option.difficulty === difficulty) ??
    DIFFICULTY_OPTIONS[1]
  );
}

export function getDifficultyOption(difficulty: DifficultyId): DifficultyOption {
  return (
    DIFFICULTY_OPTIONS.find((option) => option.difficulty === difficulty) ??
    DIFFICULTY_OPTIONS[1]
  );
}

export function scaleGhostReleaseDelayMs(
  baseDelayMs: number,
  simulationConfig: SimulationConfig,
): number {
  return Math.max(
    0,
    Math.round(baseDelayMs * simulationConfig.ghostReleaseDelayMultiplier),
  );
}
