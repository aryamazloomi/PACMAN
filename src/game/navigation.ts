import { Action, ALL_ACTIONS, CARDINAL_ACTIONS } from "./actions";
import type { GhostEntity, Maze, Position } from "./types";

import { getNeighbors, movePosition, tileKey } from "../utils/grid";

export function isWall(maze: Maze, position: Position): boolean {
  if (
    position.x < 0 ||
    position.y < 0 ||
    position.x >= maze.width ||
    position.y >= maze.height
  ) {
    return true;
  }

  return maze.walls.has(tileKey(position));
}

export function isGhostDoor(maze: Maze, position: Position): boolean {
  return Boolean(
    maze.ghostDoor &&
      maze.ghostDoor.x === position.x &&
      maze.ghostDoor.y === position.y,
  );
}

export function isGhostHouseTile(maze: Maze, position: Position): boolean {
  return maze.ghostHouseTiles.has(tileKey(position));
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
      !isWall(maze, nextPosition) &&
      !isGhostDoor(maze, nextPosition) &&
      !isGhostHouseTile(maze, nextPosition)
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

export function getGhostLegalActions(
  maze: Maze,
  ghost: GhostEntity,
): Action[] {
  const legalActions = CARDINAL_ACTIONS.filter((action) => {
    const nextPosition = movePosition(ghost.position, action);

    if (
      nextPosition.x < 0 ||
      nextPosition.y < 0 ||
      nextPosition.x >= maze.width ||
      nextPosition.y >= maze.height ||
      isWall(maze, nextPosition)
    ) {
      return false;
    }

    if (ghost.mode === "house") {
      return isGhostHouseTile(maze, nextPosition);
    }

    if (ghost.mode === "active") {
      return !isGhostDoor(maze, nextPosition) && !isGhostHouseTile(maze, nextPosition);
    }

    return true;
  });

  return legalActions.length > 0 ? legalActions : [Action.Stop];
}

export function getAvailableNeighbors(maze: Maze, position: Position): Position[] {
  return getNeighbors(position).filter(
    (neighbor) =>
      !isWall(maze, neighbor) &&
      !isGhostDoor(maze, neighbor) &&
      !isGhostHouseTile(maze, neighbor),
  );
}

export function listAllActions(): readonly Action[] {
  return ALL_ACTIONS;
}
