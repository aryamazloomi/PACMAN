import { Action, ALL_ACTIONS, CARDINAL_ACTIONS } from "./actions";
import type { Maze, Position } from "./types";

import { getNeighbors, movePosition, tileKey } from "../utils/grid";

export function isWall(maze: Maze, position: Position): boolean {
  return maze.walls.has(tileKey(position));
}

export function getLegalActions(
  maze: Maze,
  position: Position,
): Action[] {
  const legalActions = CARDINAL_ACTIONS.filter((action) => {
    const nextPosition = movePosition(position, action);
    return (
      nextPosition.x >= 0 &&
      nextPosition.y >= 0 &&
      nextPosition.x < maze.width &&
      nextPosition.y < maze.height &&
      !isWall(maze, nextPosition)
    );
  });

  return [...legalActions, Action.Stop];
}

export function isActionLegal(
  maze: Maze,
  position: Position,
  action: Action,
): boolean {
  return getLegalActions(maze, position).includes(action);
}

export function getAvailableNeighbors(maze: Maze, position: Position): Position[] {
  return getNeighbors(position).filter((neighbor) => !maze.walls.has(tileKey(neighbor)));
}

export function listAllActions(): readonly Action[] {
  return ALL_ACTIONS;
}
