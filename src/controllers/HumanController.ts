import { Action } from "../game/actions";
import type { GameStateView } from "../game/types";

import type { Controller } from "./Controller";

export class HumanController implements Controller {
  name = "Manual Play";

  private pendingAction: Action = Action.Left;

  setPendingAction(action: Action): void {
    this.pendingAction = action;
  }

  reset(_seed?: number): void {
    this.pendingAction = Action.Left;
  }

  selectAction(_state: GameStateView): Action {
    return this.pendingAction;
  }
}
