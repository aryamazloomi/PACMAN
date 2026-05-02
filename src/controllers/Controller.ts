import type { Action } from "../game/actions";
import type { GameStateView } from "../game/types";

export interface Controller {
  name: string;
  reset?(seed: number): void;
  selectAction(state: GameStateView): Action;
}
