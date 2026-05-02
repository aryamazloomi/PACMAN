import { ACTION_VECTORS, Action } from "../game/actions";
import type { Position } from "../game/types";

export function tileKey(position: Position): string {
  return `${position.x},${position.y}`;
}

export function parseTileKey(key: string): Position {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

export function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

export function movePosition(position: Position, action: Action): Position {
  const vector = ACTION_VECTORS[action];
  return {
    x: position.x + vector.x,
    y: position.y + vector.y,
  };
}

export function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function getNeighbors(position: Position): Position[] {
  return [Action.Up, Action.Down, Action.Left, Action.Right].map((action) =>
    movePosition(position, action),
  );
}
