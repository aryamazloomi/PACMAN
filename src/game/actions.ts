export enum Action {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT",
  Stop = "STOP",
}

export const ACTION_VECTORS: Record<Action, { x: number; y: number }> = {
  [Action.Up]: { x: 0, y: -1 },
  [Action.Down]: { x: 0, y: 1 },
  [Action.Left]: { x: -1, y: 0 },
  [Action.Right]: { x: 1, y: 0 },
  [Action.Stop]: { x: 0, y: 0 },
};

export const CARDINAL_ACTIONS = [
  Action.Up,
  Action.Down,
  Action.Left,
  Action.Right,
] as const;

export const ALL_ACTIONS = [...CARDINAL_ACTIONS, Action.Stop] as const;

export function getOppositeAction(action: Action): Action {
  switch (action) {
    case Action.Up:
      return Action.Down;
    case Action.Down:
      return Action.Up;
    case Action.Left:
      return Action.Right;
    case Action.Right:
      return Action.Left;
    case Action.Stop:
    default:
      return Action.Stop;
  }
}
