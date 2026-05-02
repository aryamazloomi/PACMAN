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
  "#.....#..P..#.....#",
  "#####.#.###.#.#####",
  "#....1#2...3#4....#",
  "#####.#.###.#.#####",
  "#.....#.....#.....#",
  "#.###.#.###.#.###.#",
  "#o..#.........#..o#",
  "###.#.##.#.##.#.###",
  "#........#........#",
  "###################",
] as const;

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
  const initialPellets = new Set<string>();
  const initialPowerPellets = new Set<string>();
  const ghostSpawns: GhostSpawn[] = [];
  let pacmanSpawn: Position | null = null;

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
        ghostSpawns.push({
          id: ghost.id,
          color: ghost.color,
          position: { x, y },
          scatterTarget: getScatterTarget(width, rows.length, index),
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
    initialPellets,
    initialPowerPellets,
    pacmanSpawn,
    ghostSpawns,
  };
}
