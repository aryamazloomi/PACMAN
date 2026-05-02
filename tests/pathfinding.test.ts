import { describe, expect, it } from "vitest";

import { createGameState } from "../src/game/gameState";
import { findAStarPath, findShortestPath, getActionForStep } from "../src/ai/pathfinding";
import { tileKey } from "../src/utils/grid";
import { Action } from "../src/game/actions";

describe("pathfinding", () => {
  it("finds the nearest pellet from the spawn with BFS", () => {
    const state = createGameState({ readyDelayMs: 0 });
    const leftPellet = tileKey({
      x: state.pacman.position.x - 1,
      y: state.pacman.position.y,
    });

    const result = findShortestPath(
      state.maze,
      state.pacman.position,
      new Set([leftPellet]),
    );

    expect(result).not.toBeNull();
    expect(result?.path).toHaveLength(1);
  });

  it("maps the first path step back to a movement action", () => {
    const state = createGameState({ readyDelayMs: 0 });
    const result = findShortestPath(
      state.maze,
      state.pacman.position,
      new Set([
        tileKey({
          x: state.pacman.position.x - 1,
          y: state.pacman.position.y,
        }),
      ]),
    );

    expect(result).not.toBeNull();
    expect(getActionForStep(state.pacman.position, result!.path[0])).toBe(Action.Left);
  });

  it("applies weighted A* search to a reachable target", () => {
    const state = createGameState({ readyDelayMs: 0 });
    const target = tileKey({
      x: state.pacman.position.x + 1,
      y: state.pacman.position.y,
    });
    const dangerCosts = new Map<string, number>([[target, 4]]);

    const result = findAStarPath(
      state.maze,
      state.pacman.position,
      new Set([target]),
      { dangerCosts },
    );

    expect(result).not.toBeNull();
    expect(result!.cost).toBeGreaterThan(1);
  });
});
