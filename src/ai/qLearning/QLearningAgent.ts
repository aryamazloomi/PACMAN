import type { Action } from "../../game/actions";
import type { GameStateView } from "../../game/types";
import type { Controller } from "../../controllers/Controller";

export class QLearningAgent implements Controller {
  name = "Q-Learning Agent (TODO)";

  reset(): void {}

  selectAction(_state: GameStateView): Action {
    throw new Error("Tabular Q-learning is planned after the core evaluation loop stabilizes.");
  }
}
