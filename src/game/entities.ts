import { Action } from "./actions";
import type { GhostEntity, Maze, PacmanEntity } from "./types";

export function createPacman(maze: Maze): PacmanEntity {
  return {
    position: { ...maze.pacmanSpawn },
    spawn: { ...maze.pacmanSpawn },
    direction: Action.Left,
  };
}

export function createGhosts(maze: Maze): GhostEntity[] {
  return maze.ghostSpawns.map((spawn) => ({
    id: spawn.id,
    color: spawn.color,
    position: { ...spawn.position },
    spawn: { ...spawn.position },
    direction: Action.Left,
    frightenedTicks: 0,
    scatterTarget: { ...spawn.scatterTarget },
  }));
}
