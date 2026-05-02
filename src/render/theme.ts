import { TILE_SIZE } from "../game/constants";

export const GAME_THEME = {
  boardBackground: "#061120",
  boardBorder: "#103058",
  wallFill: "#143e7a",
  wallGlow: "rgba(78, 163, 255, 0.18)",
  pellet: "#ffe08a",
  powerPellet: "#fff2b0",
  pacman: "#ffd60a",
  frightenedGhost: "#93c5fd",
  eye: "#f8fafc",
  pupil: "#0f172a",
  text: "#e2e8f0",
  overlay: "rgba(2, 6, 23, 0.72)",
  tileSize: TILE_SIZE,
} as const;
