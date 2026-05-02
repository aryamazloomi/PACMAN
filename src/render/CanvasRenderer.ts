import type { GameState } from "../game/types";

import { parseTileKey } from "../utils/grid";
import { drawGhost, drawPacman, drawPellet, drawPowerPellet, drawWall } from "./sprites";
import { GAME_THEME } from "./theme";

export class CanvasRenderer {
  private readonly context: CanvasRenderingContext2D;

  private readonly tileSize = GAME_THEME.tileSize;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to create 2D canvas context.");
    }

    this.context = context;
  }

  resize(width: number, height: number): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  render(state: GameState, now: number): void {
    const width = state.maze.width * this.tileSize;
    const height = state.maze.height * this.tileSize;
    this.resize(width, height);

    this.context.clearRect(0, 0, width, height);
    this.context.fillStyle = GAME_THEME.boardBackground;
    this.context.fillRect(0, 0, width, height);

    state.maze.rows.forEach((row, y) => {
      row.split("").forEach((tile, x) => {
        if (tile === "#") {
          drawWall({
            context: this.context,
            tileSize: this.tileSize,
            x,
            y,
          });
        }
      });
    });

    state.pellets.forEach((key) => {
      const position = parseTileKey(key);
      drawPellet({
        context: this.context,
        tileSize: this.tileSize,
        x: position.x,
        y: position.y,
      });
    });

    state.powerPellets.forEach((key) => {
      const position = parseTileKey(key);
      drawPowerPellet({
        context: this.context,
        tileSize: this.tileSize,
        x: position.x,
        y: position.y,
        now,
      });
    });

    state.ghosts.forEach((ghost) => {
      drawGhost({
        context: this.context,
        tileSize: this.tileSize,
        x: ghost.position.x,
        y: ghost.position.y,
        frightened: ghost.frightenedTimerMs > 0,
        color: ghost.color,
      });
    });

    drawPacman({
      context: this.context,
      tileSize: this.tileSize,
      x: state.pacman.position.x,
      y: state.pacman.position.y,
      direction: state.pacman.direction,
      now,
    });

    if (state.status !== "running" || state.readyDelayMs > 0) {
      this.context.fillStyle = GAME_THEME.overlay;
      this.context.fillRect(0, 0, width, height);
      this.context.fillStyle = GAME_THEME.text;
      this.context.textAlign = "center";
      this.context.font = '700 28px "Trebuchet MS", sans-serif';
      this.context.fillText(
        state.status === "won"
          ? "Level Cleared"
          : state.status === "lost"
            ? "Game Over"
            : "Ready!",
        width / 2,
        height / 2,
      );
    }
  }
}
