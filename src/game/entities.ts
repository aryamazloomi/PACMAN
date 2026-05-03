import { Action } from "./actions";
import { scaleGhostReleaseDelayMs } from "./difficulty";
import type { GhostEntity, Maze, PacmanEntity, SimulationConfig } from "./types";

export function createPacman(maze: Maze): PacmanEntity {
  return {
    position: { ...maze.pacmanSpawn },
    spawn: { ...maze.pacmanSpawn },
    direction: Action.Left,
    desiredDirection: Action.Stop,
    isMoving: false,
    moveProgressMs: 0,
  };
}

export function createGhosts(
  maze: Maze,
  simulationConfig: SimulationConfig,
): GhostEntity[] {
  return maze.ghostSpawns.map((spawn) => ({
    id: spawn.id,
    color: spawn.color,
    position: { ...spawn.position },
    spawn: { ...spawn.position },
    direction: Action.Stop,
    mode: spawn.startingMode,
    frightenedTimerMs: 0,
    moveProgressMs: 0,
    releaseTimerMs: scaleGhostReleaseDelayMs(
      spawn.releaseDelayMs,
      simulationConfig,
    ),
    scatterTarget: { ...spawn.scatterTarget },
  }));
}
