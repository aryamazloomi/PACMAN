import { Action } from "../game/actions";
import { GAME_THEME } from "./theme";

interface TileRenderOptions {
  context: CanvasRenderingContext2D;
  tileSize: number;
  x: number;
  y: number;
  now: number;
}

export function drawWall({
  context,
  tileSize,
  x,
  y,
}: Omit<TileRenderOptions, "now">): void {
  const left = x * tileSize;
  const top = y * tileSize;
  const inset = tileSize * 0.08;

  context.fillStyle = GAME_THEME.wallGlow;
  context.fillRect(left, top, tileSize, tileSize);

  context.fillStyle = GAME_THEME.wallFill;
  context.beginPath();
  context.roundRect(
    left + inset,
    top + inset,
    tileSize - inset * 2,
    tileSize - inset * 2,
    tileSize * 0.22,
  );
  context.fill();
}

export function drawPellet({
  context,
  tileSize,
  x,
  y,
}: Omit<TileRenderOptions, "now">): void {
  const centerX = x * tileSize + tileSize / 2;
  const centerY = y * tileSize + tileSize / 2;

  context.fillStyle = GAME_THEME.pellet;
  context.beginPath();
  context.arc(centerX, centerY, tileSize * 0.11, 0, Math.PI * 2);
  context.fill();
}

export function drawPowerPellet({
  context,
  tileSize,
  x,
  y,
  now,
}: TileRenderOptions): void {
  const centerX = x * tileSize + tileSize / 2;
  const centerY = y * tileSize + tileSize / 2;
  const pulse = 0.18 + ((Math.sin(now / 180) + 1) / 2) * 0.06;

  context.fillStyle = GAME_THEME.powerPellet;
  context.beginPath();
  context.arc(centerX, centerY, tileSize * pulse, 0, Math.PI * 2);
  context.fill();
}

export function drawPacman({
  context,
  tileSize,
  x,
  y,
  now,
  direction,
}: TileRenderOptions & { direction: Action }): void {
  const centerX = x * tileSize + tileSize / 2;
  const centerY = y * tileSize + tileSize / 2;
  const radius = tileSize * 0.42;
  const mouth = 0.12 + ((Math.sin(now / 90) + 1) / 2) * 0.3;
  const rotation = getDirectionAngle(direction);

  context.save();
  context.translate(centerX, centerY);
  context.rotate(rotation);

  context.fillStyle = GAME_THEME.pacman;
  context.beginPath();
  context.moveTo(0, 0);
  context.arc(0, 0, radius, mouth, Math.PI * 2 - mouth);
  context.closePath();
  context.fill();

  context.restore();
}

export function drawGhost({
  context,
  tileSize,
  x,
  y,
  frightened,
  color,
}: Omit<TileRenderOptions, "now"> & { frightened: boolean; color: string }): void {
  const left = x * tileSize + tileSize * 0.15;
  const top = y * tileSize + tileSize * 0.18;
  const width = tileSize * 0.7;
  const height = tileSize * 0.68;
  const bodyColor = frightened ? GAME_THEME.frightenedGhost : color;

  context.fillStyle = bodyColor;
  context.beginPath();
  context.moveTo(left, top + height);
  context.lineTo(left, top + height * 0.35);
  context.arc(left + width / 2, top + height * 0.35, width / 2, Math.PI, 0);
  context.lineTo(left + width, top + height);
  context.lineTo(left + width * 0.82, top + height * 0.82);
  context.lineTo(left + width * 0.64, top + height);
  context.lineTo(left + width * 0.5, top + height * 0.82);
  context.lineTo(left + width * 0.36, top + height);
  context.lineTo(left + width * 0.18, top + height * 0.82);
  context.closePath();
  context.fill();

  const eyeY = top + height * 0.45;
  const eyeRadius = tileSize * 0.1;

  context.fillStyle = GAME_THEME.eye;
  context.beginPath();
  context.arc(left + width * 0.34, eyeY, eyeRadius, 0, Math.PI * 2);
  context.arc(left + width * 0.66, eyeY, eyeRadius, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = GAME_THEME.pupil;
  context.beginPath();
  context.arc(left + width * 0.34, eyeY, eyeRadius * 0.45, 0, Math.PI * 2);
  context.arc(left + width * 0.66, eyeY, eyeRadius * 0.45, 0, Math.PI * 2);
  context.fill();
}

function getDirectionAngle(direction: Action): number {
  switch (direction) {
    case Action.Up:
      return -Math.PI / 2;
    case Action.Down:
      return Math.PI / 2;
    case Action.Left:
      return Math.PI;
    case Action.Right:
    case Action.Stop:
    default:
      return 0;
  }
}
