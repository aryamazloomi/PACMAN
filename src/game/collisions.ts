import type { GhostEntity, Position } from "./types";

import { positionsEqual } from "../utils/grid";

export function findCollidingGhosts(
  pacmanPosition: Position,
  ghosts: readonly GhostEntity[],
): GhostEntity[] {
  return ghosts.filter((ghost) => positionsEqual(ghost.position, pacmanPosition));
}
