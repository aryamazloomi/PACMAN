import { Action } from "../game/actions";
import type { GameStateView } from "../game/types";
import { tileKey } from "../utils/grid";

import { distanceToNearestGhost, getThreatGhosts } from "../ai/heuristics";
import { findAStarPath, getActionForStep } from "../ai/pathfinding";
import type { Controller } from "./Controller";
import { AStarAgent } from "./AStarAgent";
import { GhostAvoidanceAgent } from "./GhostAvoidanceAgent";

function getReachableFrightenedGhostAction(state: GameStateView): Action | null {
  const frightenedGhosts = state.ghosts.filter((ghost) => ghost.frightenedTicks > 0);

  for (const ghost of frightenedGhosts) {
    const result = findAStarPath(
      state.maze,
      state.pacman.position,
      new Set<string>([tileKey(ghost.position)]),
    );

    if (result && result.path.length > 0 && result.cost <= ghost.frightenedTicks) {
      return getActionForStep(state.pacman.position, result.path[0]);
    }
  }

  return null;
}

export class BehaviorTreeAgent implements Controller {
  name = "Behavior Tree Agent";

  private readonly survivalAgent = new GhostAvoidanceAgent();

  private readonly plannerAgent = new AStarAgent();

  selectAction(state: GameStateView): Action {
    const threateningGhosts = getThreatGhosts(state);
    const nearestThreat = distanceToNearestGhost(state, state.pacman.position);

    if (threateningGhosts.length > 0 && nearestThreat <= 2) {
      return this.survivalAgent.selectAction(state);
    }

    const frightenedGhostAction = getReachableFrightenedGhostAction(state);
    if (frightenedGhostAction) {
      return frightenedGhostAction;
    }

    if (nearestThreat <= 4 && state.powerPellets.size > 0) {
      return this.plannerAgent.selectAction(state);
    }

    return this.plannerAgent.selectAction(state);
  }
}
