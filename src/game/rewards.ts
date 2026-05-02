import { REWARD_VALUES } from "./constants";
import type { StepEvents } from "./types";

export function calculateReward(events: StepEvents): number {
  let reward = REWARD_VALUES.idle;

  if (events.pelletEaten) {
    reward += REWARD_VALUES.pellet;
  }

  if (events.powerPelletEaten) {
    reward += REWARD_VALUES.powerPellet;
  }

  if (events.lifeLost) {
    reward += REWARD_VALUES.lifeLost;
  }

  if (events.wallBump) {
    reward += REWARD_VALUES.wallBump;
  }

  if (events.levelCleared) {
    reward += REWARD_VALUES.levelClear;
  }

  if (events.ghostsEaten.length > 0) {
    reward += events.ghostsEaten.length * REWARD_VALUES.ghost;
  }

  return reward;
}
