import { Action } from "../game/actions";
import { getAvailableNeighbors } from "../game/navigation";
import type { Maze, Position } from "../game/types";
import { manhattanDistance, tileKey } from "../utils/grid";

export interface PathOptions {
  blockedKeys?: ReadonlySet<string>;
  dangerCosts?: ReadonlyMap<string, number>;
}

export interface PathResult {
  path: Position[];
  cost: number;
}

function reconstructPath(
  cameFrom: Map<string, string>,
  targetKey: string,
): Position[] {
  const path: Position[] = [];
  let currentKey = targetKey;

  while (cameFrom.has(currentKey)) {
    const [x, y] = currentKey.split(",").map(Number);
    path.unshift({ x, y });
    currentKey = cameFrom.get(currentKey)!;
  }

  return path;
}

function calculateStepCost(
  nextKey: string,
  dangerCosts?: ReadonlyMap<string, number>,
): number {
  return 1 + (dangerCosts?.get(nextKey) ?? 0);
}

export function findShortestPath(
  maze: Maze,
  start: Position,
  targetKeys: ReadonlySet<string>,
  options: PathOptions = {},
): PathResult | null {
  if (targetKeys.size === 0) {
    return null;
  }

  const startKey = tileKey(start);
  const queue: Position[] = [start];
  const visited = new Set<string>([startKey]);
  const cameFrom = new Map<string, string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentKey = tileKey(current);

    if (targetKeys.has(currentKey) && currentKey !== startKey) {
      const path = reconstructPath(cameFrom, currentKey);
      return {
        path,
        cost: path.length,
      };
    }

    getAvailableNeighbors(maze, current).forEach((neighbor) => {
      const neighborKey = tileKey(neighbor);

      if (
        visited.has(neighborKey) ||
        options.blockedKeys?.has(neighborKey)
      ) {
        return;
      }

      visited.add(neighborKey);
      cameFrom.set(neighborKey, currentKey);
      queue.push(neighbor);
    });
  }

  return null;
}

export function findAStarPath(
  maze: Maze,
  start: Position,
  targetKeys: ReadonlySet<string>,
  options: PathOptions = {},
): PathResult | null {
  if (targetKeys.size === 0) {
    return null;
  }

  const targetPositions = [...targetKeys].map((key) => {
    const [x, y] = key.split(",").map(Number);
    return { x, y };
  });
  const startKey = tileKey(start);
  const openSet: Array<{ position: Position; key: string; priority: number }> = [
    { position: start, key: startKey, priority: 0 },
  ];
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>([[startKey, 0]]);

  const heuristic = (position: Position) =>
    Math.min(
      ...targetPositions.map((target) => manhattanDistance(position, target)),
    );

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.priority - b.priority);
    const current = openSet.shift()!;

    if (targetKeys.has(current.key) && current.key !== startKey) {
      const path = reconstructPath(cameFrom, current.key);
      return {
        path,
        cost: gScore.get(current.key) ?? path.length,
      };
    }

    getAvailableNeighbors(maze, current.position).forEach((neighbor) => {
      const neighborKey = tileKey(neighbor);

      if (options.blockedKeys?.has(neighborKey)) {
        return;
      }

      const tentativeGScore =
        (gScore.get(current.key) ?? Number.POSITIVE_INFINITY) +
        calculateStepCost(neighborKey, options.dangerCosts);

      if (tentativeGScore >= (gScore.get(neighborKey) ?? Number.POSITIVE_INFINITY)) {
        return;
      }

      cameFrom.set(neighborKey, current.key);
      gScore.set(neighborKey, tentativeGScore);

      openSet.push({
        position: neighbor,
        key: neighborKey,
        priority: tentativeGScore + heuristic(neighbor),
      });
    });
  }

  return null;
}

export function getActionForStep(start: Position, nextStep: Position): Action {
  if (nextStep.x > start.x) {
    return Action.Right;
  }

  if (nextStep.x < start.x) {
    return Action.Left;
  }

  if (nextStep.y > start.y) {
    return Action.Down;
  }

  if (nextStep.y < start.y) {
    return Action.Up;
  }

  return Action.Stop;
}
