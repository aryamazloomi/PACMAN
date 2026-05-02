import { Action } from "../game/actions";
import type { GameStateView } from "../game/types";
import { chooseBySeed } from "../utils/random";

import { getPreferredActions } from "../ai/heuristics";
import type { Controller } from "./Controller";

export class RandomAgent implements Controller {
  name = "Random Agent";

  private rngState: number;

  constructor(seed = 1337) {
    this.rngState = seed >>> 0;
  }

  reset(seed = 1337): void {
    this.rngState = seed >>> 0;
  }

  selectAction(state: GameStateView): Action {
    const actions = getPreferredActions(state.legalActions);
    const choice = chooseBySeed(actions, this.rngState);
    this.rngState = choice.rngState;
    return choice.action;
  }
}
