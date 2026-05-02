import { Action } from "../game/actions";
import type { GameStateView } from "../game/types";

import { getPreferredActions } from "../ai/heuristics";
import { findShortestPath, getActionForStep } from "../ai/pathfinding";
import type { Controller } from "./Controller";

function collectTargetKeys(state: GameStateView): Set<string> {
  return new Set<string>([...state.pellets, ...state.powerPellets]);
}

export class GreedyPelletAgent implements Controller {
  name = "Greedy Pellet Agent";

  selectAction(state: GameStateView): Action {
    const targetKeys = collectTargetKeys(state);
    const result = findShortestPath(
      state.maze,
      state.pacman.position,
      targetKeys,
    );

    if (!result || result.path.length === 0) {
      return getPreferredActions(state.legalActions)[0] ?? Action.Stop;
    }

    return getActionForStep(state.pacman.position, result.path[0]);
  }
}
