import { Action } from "../game/actions";
import type { GameStateView } from "../game/types";

import { buildDangerMap, distanceToNearestGhost, getPreferredActions } from "../ai/heuristics";
import { findAStarPath, getActionForStep } from "../ai/pathfinding";
import type { Controller } from "./Controller";

function findBestTargetPath(
  state: GameStateView,
  targetKeys: ReadonlySet<string>,
  dangerCosts: ReadonlyMap<string, number>,
): ReturnType<typeof findAStarPath> {
  let bestPath: ReturnType<typeof findAStarPath> = null;

  targetKeys.forEach((targetKey) => {
    const singleTarget = new Set<string>([targetKey]);
    const path = findAStarPath(state.maze, state.pacman.position, singleTarget, {
      dangerCosts,
    });

    if (!path) {
      return;
    }

    const targetBonus = state.powerPellets.has(targetKey) ? 6 : 0;
    const adjustedCost = path.cost - targetBonus;

    if (!bestPath || adjustedCost < bestPath.cost) {
      bestPath = {
        path: path.path,
        cost: adjustedCost,
      };
    }
  });

  return bestPath;
}

export class AStarAgent implements Controller {
  name = "A* Agent";

  selectAction(state: GameStateView): Action {
    const dangerCosts = buildDangerMap(state);
    const threatDistance = distanceToNearestGhost(state, state.pacman.position);
    const pelletTargets = new Set<string>([...state.pellets, ...state.powerPellets]);
    const preferredTargets =
      threatDistance <= 4 && state.powerPellets.size > 0
        ? new Set<string>(state.powerPellets)
        : pelletTargets;

    const bestPath =
      findBestTargetPath(state, preferredTargets, dangerCosts) ??
      findBestTargetPath(state, pelletTargets, dangerCosts);

    if (!bestPath || bestPath.path.length === 0) {
      return getPreferredActions(state.legalActions)[0] ?? Action.Stop;
    }

    return getActionForStep(state.pacman.position, bestPath.path[0]);
  }
}
