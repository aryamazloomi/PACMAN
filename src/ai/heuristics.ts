import { Action } from "../game/actions";
import type { GameStateView, GhostEntity, Position } from "../game/types";
import { manhattanDistance, movePosition, tileKey } from "../utils/grid";

export function getThreatGhosts(state: GameStateView): readonly GhostEntity[] {
  return state.ghosts.filter(
    (ghost) => ghost.mode === "active" && ghost.frightenedTimerMs <= 0,
  );
}

export function buildDangerMap(state: GameStateView): Map<string, number> {
  const dangerMap = new Map<string, number>();

  getThreatGhosts(state).forEach((ghost) => {
    const ghostKey = tileKey(ghost.position);
    dangerMap.set(ghostKey, (dangerMap.get(ghostKey) ?? 0) + 50);

    const neighbors = [
      ghost.position,
      { x: ghost.position.x + 1, y: ghost.position.y },
      { x: ghost.position.x - 1, y: ghost.position.y },
      { x: ghost.position.x, y: ghost.position.y + 1 },
      { x: ghost.position.x, y: ghost.position.y - 1 },
    ];

    neighbors.forEach((position, index) => {
      const key = tileKey(position);
      const penalty = index === 0 ? 50 : 15;
      dangerMap.set(key, (dangerMap.get(key) ?? 0) + penalty);
    });
  });

  return dangerMap;
}

export function getImmediateDangerKeys(state: GameStateView): Set<string> {
  const keys = new Set<string>();

  getThreatGhosts(state).forEach((ghost) => {
    keys.add(tileKey(ghost.position));
    keys.add(tileKey({ x: ghost.position.x + 1, y: ghost.position.y }));
    keys.add(tileKey({ x: ghost.position.x - 1, y: ghost.position.y }));
    keys.add(tileKey({ x: ghost.position.x, y: ghost.position.y + 1 }));
    keys.add(tileKey({ x: ghost.position.x, y: ghost.position.y - 1 }));
  });

  return keys;
}

export function distanceToNearestGhost(
  state: GameStateView,
  position: Position,
  threateningOnly = true,
): number {
  const ghosts = threateningOnly ? getThreatGhosts(state) : state.ghosts;

  if (ghosts.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.min(
    ...ghosts.map((ghost) => manhattanDistance(position, ghost.position)),
  );
}

export function countFrightenedGhosts(state: GameStateView): number {
  return state.ghosts.filter(
    (ghost) => ghost.mode === "active" && ghost.frightenedTimerMs > 0,
  ).length;
}

export function hasPelletAt(state: GameStateView, position: Position): boolean {
  const key = tileKey(position);
  return state.pellets.has(key) || state.powerPellets.has(key);
}

export function isPowerPelletAt(state: GameStateView, position: Position): boolean {
  return state.powerPellets.has(tileKey(position));
}

export function getPreferredActions(legalActions: readonly Action[]): Action[] {
  const movingActions = legalActions.filter((action) => action !== Action.Stop);
  return movingActions.length > 0 ? movingActions : [Action.Stop];
}

export function moveWithAction(position: Position, action: Action): Position {
  return movePosition(position, action);
}
