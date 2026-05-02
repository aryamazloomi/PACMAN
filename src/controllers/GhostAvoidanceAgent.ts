import { Action } from "../game/actions";
import type { GameStateView } from "../game/types";
import { movePosition, tileKey } from "../utils/grid";

import {
  buildDangerMap,
  distanceToNearestGhost,
  getImmediateDangerKeys,
  getPreferredActions,
  hasPelletAt,
  isPowerPelletAt,
} from "../ai/heuristics";
import { findShortestPath } from "../ai/pathfinding";
import type { Controller } from "./Controller";

function collectTargetKeys(state: GameStateView): Set<string> {
  return new Set<string>([...state.pellets, ...state.powerPellets]);
}

export class GhostAvoidanceAgent implements Controller {
  name = "Ghost Avoidance Agent";

  selectAction(state: GameStateView): Action {
    const candidates = getPreferredActions(state.legalActions);
    const targetKeys = collectTargetKeys(state);
    const dangerMap = buildDangerMap(state);
    const immediateDangerKeys = getImmediateDangerKeys(state);

    let bestAction = Action.Stop;
    let bestScore = Number.NEGATIVE_INFINITY;

    candidates.forEach((action) => {
      const nextPosition = movePosition(state.pacman.position, action);
      const nextKey = tileKey(nextPosition);
      const nearestGhostDistance = distanceToNearestGhost(state, nextPosition);
      const pathToSafety = findShortestPath(state.maze, nextPosition, targetKeys, {
        blockedKeys: immediateDangerKeys,
      });

      const pelletBonus = hasPelletAt(state, nextPosition) ? 7 : 0;
      const powerPelletBonus = isPowerPelletAt(state, nextPosition) ? 10 : 0;
      const dangerPenalty = dangerMap.get(nextKey) ?? 0;
      const pathPenalty = pathToSafety ? pathToSafety.cost : 18;
      const immediateDangerPenalty = immediateDangerKeys.has(nextKey) ? 80 : 0;

      const score =
        nearestGhostDistance * 18 +
        pelletBonus +
        powerPelletBonus -
        dangerPenalty * 2 -
        pathPenalty -
        immediateDangerPenalty;

      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    });

    return bestAction;
  }
}
