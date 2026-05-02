import {
  CLYDE_RELEASE_DELAY_MS,
  INKY_RELEASE_DELAY_MS,
  PINKY_RELEASE_DELAY_MS,
} from "./constants";
import type { GhostId, GhostSpawn, Maze, Position } from "./types";

import { tileKey } from "../utils/grid";

const DEFAULT_GHOSTS: Array<{ id: GhostId; color: string }> = [
  { id: "blinky", color: "#ff4d6d" },
  { id: "pinky", color: "#ff99c8" },
  { id: "inky", color: "#56cfe1" },
  { id: "clyde", color: "#ff9f1c" },
];

export const DEFAULT_MAZE_LAYOUT = [
  "###################",
  "#o....#.....#....o#",
  "#.###.#.###.#.###.#",
  "#........#........#",
  "#.###.##.#.##.###.#",
  "#........1........#",
  "#####.###D###.#####",
  "#.....#3H2H4#.....#",
  "#####.#######.#####",
  "#.....#..P..#.....#",
  "#.###.#.###.#.###.#",
  "#o..#.........#..o#",
  "###.#.##.#.##.#.###",
  "#........#........#",
  "###################",
] as const;

function getStartingMode(id: GhostId): GhostSpawn["startingMode"] {
  return id === "blinky" ? "active" : "house";
}

function getReleaseDelayMs(id: GhostId): number {
  switch (id) {
    case "pinky":
      return PINKY_RELEASE_DELAY_MS;
    case "inky":
      return INKY_RELEASE_DELAY_MS;
    case "clyde":
      return CLYDE_RELEASE_DELAY_MS;
    case "blinky":
    default:
      return 0;
  }
}

function getScatterTarget(width: number, height: number, index: number): Position {
  switch (index) {
    case 0:
      return { x: width - 2, y: 1 };
    case 1:
      return { x: 1, y: 1 };
    case 2:
      return { x: width - 2, y: height - 2 };
    case 3:
    default:
      return { x: 1, y: height - 2 };
  }
}

export function createMaze(rows: readonly string[] = DEFAULT_MAZE_LAYOUT): Maze {
  if (rows.length === 0) {
    throw new Error("Maze layout cannot be empty.");
  }

  const width = rows[0].length;
  const walls = new Set<string>();
  const ghostHouseTiles = new Set<string>();
  const initialPellets = new Set<string>();
  const initialPowerPellets = new Set<string>();
  const ghostSpawns: GhostSpawn[] = [];
  let pacmanSpawn: Position | null = null;
  let ghostDoor: Position | null = null;

  rows.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error("Maze layout rows must all have the same width.");
    }

    row.split("").forEach((tile, x) => {
      const key = tileKey({ x, y });

      if (tile === "#") {
        walls.add(key);
        return;
      }

      if (tile === "H") {
        ghostHouseTiles.add(key);
        return;
      }

      if (tile === "D") {
        ghostDoor = { x, y };
        return;
      }

      if (tile === ".") {
        initialPellets.add(key);
        return;
      }

      if (tile === "o") {
        initialPowerPellets.add(key);
        return;
      }

      if (tile === "P") {
        pacmanSpawn = { x, y };
        return;
      }

      if (/[1-4]/.test(tile)) {
        const index = Number(tile) - 1;
        const ghost = DEFAULT_GHOSTS[index];
        if (ghost.id !== "blinky") {
          ghostHouseTiles.add(key);
        }
        ghostSpawns.push({
          id: ghost.id,
          color: ghost.color,
          position: { x, y },
          scatterTarget: getScatterTarget(width, rows.length, index),
          startingMode: getStartingMode(ghost.id),
          releaseDelayMs: getReleaseDelayMs(ghost.id),
        });
      }
    });
  });

  if (!pacmanSpawn) {
    throw new Error("Maze layout must include a Pac-Man spawn.");
  }

  if (ghostSpawns.length === 0) {
    throw new Error("Maze layout must include at least one ghost spawn.");
  }

  return {
    width,
    height: rows.length,
    rows,
    walls,
    ghostHouseTiles,
    initialPellets,
    initialPowerPellets,
    pacmanSpawn,
    ghostDoor,
    ghostSpawns,
  };
}
