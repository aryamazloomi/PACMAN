import { Action } from "./actions";
import type { GhostEntity, Maze, PacmanEntity } from "./types";

export function createPacman(maze: Maze): PacmanEntity {
  return {
    position: { ...maze.pacmanSpawn },
    spawn: { ...maze.pacmanSpawn },
    direction: Action.Left,
    desiredDirection: Action.Stop,
    moveProgressMs: 0,
  };
}

export function createGhosts(maze: Maze): GhostEntity[] {
  return maze.ghostSpawns.map((spawn) => ({
    id: spawn.id,
    color: spawn.color,
    position: { ...spawn.position },
    spawn: { ...spawn.position },
    direction: Action.Stop,
    mode: spawn.startingMode,
    frightenedTimerMs: 0,
    moveProgressMs: 0,
    releaseTimerMs: spawn.releaseDelayMs,
    scatterTarget: { ...spawn.scatterTarget },
  }));
}
