import { Action, getOppositeAction } from "./actions";
import { findCollidingGhosts } from "./collisions";
import {
  INITIAL_LIVES,
  PACMAN_MOVE_INTERVAL_MS,
  RESPAWN_DELAY_MS,
  SCORE_VALUES,
  SIMULATION_STEP_MS,
  START_DELAY_MS,
} from "./constants";
import { scaleGhostReleaseDelayMs } from "./difficulty";
import { createGhosts, createPacman } from "./entities";
import { cloneGameState, createGameState } from "./gameState";
import {
  getAvailableNeighbors,
  getGhostLegalActions,
  getLegalActions,
  isGhostDoor,
  isGhostHouseTile,
  isWall,
  listAllActions,
} from "./navigation";
import { calculateReward } from "./rewards";
import type { GameState, GhostEntity, Maze, Position, StepEvents, StepResult } from "./types";

import { chooseBySeed } from "../utils/random";
import { manhattanDistance, movePosition, tileKey } from "../utils/grid";

function createStepEvents(): StepEvents {
  return {
    pelletEaten: false,
    powerPelletEaten: false,
    ghostsEaten: [],
    lifeLost: false,
    wallBump: false,
    levelCleared: false,
  };
}

function getGhostMoveIntervalMs(state: GameState, ghost: GhostEntity): number {
  if (ghost.mode === "house") {
    return state.simulationConfig.ghostMoveIntervalMs;
  }

  return ghost.frightenedTimerMs > 0
    ? state.simulationConfig.frightenedGhostMoveIntervalMs
    : state.simulationConfig.ghostMoveIntervalMs;
}

function resetCharacters(state: GameState): void {
  state.pacman = createPacman(state.maze);
  state.ghosts = createGhosts(state.maze, state.simulationConfig);
}

function consumeReadyDelay(state: GameState, elapsedMs: number): number {
  if (state.readyDelayMs <= 0) {
    return elapsedMs;
  }

  const consumedMs = Math.min(state.readyDelayMs, elapsedMs);
  state.readyDelayMs -= consumedMs;
  return elapsedMs - consumedMs;
}

function tickGhostTimers(state: GameState, elapsedMs: number): void {
  state.ghosts.forEach((ghost) => {
    ghost.frightenedTimerMs = Math.max(0, ghost.frightenedTimerMs - elapsedMs);
  });
}

function tickGhostReleaseTimers(state: GameState, elapsedMs: number): void {
  state.ghosts.forEach((ghost) => {
    if (ghost.mode !== "house" || ghost.releaseTimerMs <= 0) {
      return;
    }

    ghost.releaseTimerMs = Math.max(0, ghost.releaseTimerMs - elapsedMs);

    if (ghost.releaseTimerMs === 0) {
      ghost.mode = "exiting";
      ghost.direction = Action.Stop;
      ghost.moveProgressMs = 0;
    }
  });
}

function getGhostSpawnConfig(maze: Maze, ghostId: GhostEntity["id"]) {
  return maze.ghostSpawns.find((spawn) => spawn.id === ghostId);
}

function resetGhostToSpawn(state: GameState, ghost: GhostEntity): void {
  const { maze, simulationConfig } = state;
  const spawnConfig = getGhostSpawnConfig(maze, ghost.id);

  ghost.position = { ...ghost.spawn };
  ghost.direction = Action.Stop;
  ghost.frightenedTimerMs = 0;
  ghost.moveProgressMs = 0;
  ghost.mode = spawnConfig?.startingMode ?? ghost.mode;
  ghost.releaseTimerMs = spawnConfig
    ? scaleGhostReleaseDelayMs(spawnConfig.releaseDelayMs, simulationConfig)
    : ghost.releaseTimerMs;
}

function getGhostExitTarget(maze: Maze, ghost: GhostEntity): Position | null {
  if (!maze.ghostDoor) {
    return null;
  }

  if (isGhostHouseTile(maze, ghost.position)) {
    return maze.ghostDoor;
  }

  if (isGhostDoor(maze, ghost.position)) {
    const outsideTiles = getAvailableNeighbors(maze, ghost.position).filter(
      (position) => !isGhostDoor(maze, position) && !isGhostHouseTile(maze, position),
    );

    if (outsideTiles.length === 0) {
      return null;
    }

    return outsideTiles.reduce((bestTile, candidate) =>
      candidate.y < bestTile.y ? candidate : bestTile,
    );
  }

  return null;
}

function chooseActionTowardTarget(
  maze: Maze,
  ghost: GhostEntity,
  target: Position,
  rngState: number,
): { action: Action; rngState: number } {
  const ghostLegalActions = getGhostLegalActions(maze, ghost).filter(
    (action) => action !== Action.Stop,
  );

  if (ghostLegalActions.length === 0) {
    return {
      action: Action.Stop,
      rngState,
    };
  }

  const options =
    ghostLegalActions.length > 1
      ? ghostLegalActions.filter((action) => action !== getOppositeAction(ghost.direction))
      : ghostLegalActions;
  const candidates = options.length > 0 ? options : ghostLegalActions;

  const bestDistance = Math.min(
    ...candidates.map((action) => manhattanDistance(movePosition(ghost.position, action), target)),
  );

  const bestActions = candidates.filter(
    (action) => manhattanDistance(movePosition(ghost.position, action), target) === bestDistance,
  );

  return chooseBySeed(bestActions, rngState);
}

function resolvePacmanDirection(
  state: GameState,
  events: StepEvents,
): Action {
  const legalActions = getLegalActions(state.maze, state.pacman.position);
  const desiredDirection = state.pacman.desiredDirection;
  const currentDirection = state.pacman.direction;

  if (desiredDirection === Action.Stop) {
    return Action.Stop;
  }

  if (legalActions.includes(desiredDirection)) {
    return desiredDirection;
  }

  if (desiredDirection !== currentDirection) {
    events.wallBump = true;
  }

  if (legalActions.includes(currentDirection)) {
    return currentDirection;
  }

  return Action.Stop;
}

function applyPelletCollection(state: GameState, events: StepEvents): void {
  const positionKey = tileKey(state.pacman.position);

  if (state.pellets.delete(positionKey)) {
    state.score += SCORE_VALUES.pellet;
    events.pelletEaten = true;
  }

  if (state.powerPellets.delete(positionKey)) {
    state.score += SCORE_VALUES.powerPellet;
    events.powerPelletEaten = true;
    state.ghosts.forEach((ghost) => {
      if (ghost.mode === "active") {
        ghost.frightenedTimerMs = state.simulationConfig.powerPelletDurationMs;
      }
    });
  }

  if (state.pellets.size === 0 && state.powerPellets.size === 0) {
    state.score += SCORE_VALUES.levelClear;
    state.status = "won";
    events.levelCleared = true;
  }
}

function resolveGhostCollisions(state: GameState, events: StepEvents): boolean {
  const collidingGhosts = findCollidingGhosts(state.pacman.position, state.ghosts).filter(
    (ghost) => ghost.mode === "active",
  );

  if (collidingGhosts.length === 0) {
    return false;
  }

  let lifeLost = false;

  collidingGhosts.forEach((ghost) => {
    if (ghost.frightenedTimerMs > 0) {
      events.ghostsEaten.push(ghost.id);
      state.score += SCORE_VALUES.ghost;
      resetGhostToSpawn(state, ghost);
      return;
    }

    lifeLost = true;
  });

  if (!lifeLost) {
    return false;
  }

  state.lives -= 1;
  events.lifeLost = true;
  state.readyDelayMs = RESPAWN_DELAY_MS;

  if (state.lives <= 0) {
    state.status = "lost";
    return true;
  }

  state.status = "ready";
  resetCharacters(state);
  return true;
}

function scoreGhostAction(ghost: GhostEntity, action: Action, pacmanPosition: Position): number {
  const nextPosition = movePosition(ghost.position, action);
  const distanceToPacman = manhattanDistance(nextPosition, pacmanPosition);
  const distanceToScatter = manhattanDistance(nextPosition, ghost.scatterTarget);

  if (ghost.frightenedTimerMs > 0) {
    return distanceToPacman * 20 - distanceToScatter;
  }

  return distanceToScatter - distanceToPacman * 20;
}

function chooseGhostAction(
  maze: Maze,
  ghost: GhostEntity,
  pacmanPosition: Position,
  rngState: number,
): { action: Action; rngState: number } {
  if (ghost.mode === "exiting") {
    const exitTarget = getGhostExitTarget(maze, ghost);

    if (exitTarget) {
      return chooseActionTowardTarget(maze, ghost, exitTarget, rngState);
    }
  }

  const ghostLegalActions = getGhostLegalActions(maze, ghost).filter((action) => action !== Action.Stop);

  const options =
    ghostLegalActions.length > 1
      ? ghostLegalActions.filter((action) => action !== getOppositeAction(ghost.direction))
      : ghostLegalActions;
  const candidates = options.length > 0 ? options : [Action.Stop];

  const scoredCandidates = candidates.map((action) => ({
    action,
    score: scoreGhostAction(ghost, action, pacmanPosition),
  }));

  const bestScore = Math.max(...scoredCandidates.map((candidate) => candidate.score));

  const bestActions = scoredCandidates
    .filter((candidate) => candidate.score === bestScore)
    .map((candidate) => candidate.action);

  return chooseBySeed(bestActions, rngState);
}

function moveGhosts(state: GameState, events: StepEvents, elapsedMs: number): void {
  let rngState = state.rngState;

  for (const ghost of state.ghosts) {
    if (state.status !== "running" || state.readyDelayMs > 0) {
      break;
    }

    if (ghost.mode === "house") {
      continue;
    }

    ghost.moveProgressMs += elapsedMs;
    const moveIntervalMs = getGhostMoveIntervalMs(state, ghost);

    if (ghost.moveProgressMs < moveIntervalMs) {
      continue;
    }

    ghost.moveProgressMs -= moveIntervalMs;
    const choice = chooseGhostAction(state.maze, ghost, state.pacman.position, rngState);
    rngState = choice.rngState;
    ghost.direction = choice.action;

    if (choice.action !== Action.Stop) {
      ghost.position = movePosition(ghost.position, choice.action);
    }

    if (
      ghost.mode === "exiting" &&
      !isGhostDoor(state.maze, ghost.position) &&
      !isGhostHouseTile(state.maze, ghost.position)
    ) {
      ghost.mode = "active";
    }

    if (resolveGhostCollisions(state, events)) {
      break;
    }
  }

  state.rngState = rngState;
}

function movePacman(state: GameState, events: StepEvents, elapsedMs: number): void {
  if (state.status !== "running" || state.readyDelayMs > 0) {
    return;
  }

  state.pacman.moveProgressMs += elapsedMs;

  if (state.pacman.moveProgressMs < PACMAN_MOVE_INTERVAL_MS) {
    return;
  }

  state.pacman.moveProgressMs -= PACMAN_MOVE_INTERVAL_MS;

  const direction = resolvePacmanDirection(state, events);
  state.pacman.direction = direction;

  if (direction === Action.Stop) {
    state.pacman.moveProgressMs = 0;
    return;
  }

  state.pacman.position = movePosition(state.pacman.position, direction);
  applyPelletCollection(state, events);
}

export function stepGame(
  previousState: GameState,
  requestedAction: Action,
  elapsedMs = SIMULATION_STEP_MS,
): StepResult {
  const state = cloneGameState(previousState);
  const events = createStepEvents();

  if (state.status === "paused" || state.status === "won" || state.status === "lost") {
    state.lastEvents = events;
    state.lastAction = requestedAction;
    state.reward = calculateReward(events);
    return {
      state,
      done: state.status === "won" || state.status === "lost",
      reward: state.reward,
      events,
    };
  }

  state.steps += 1;
  state.lastAction = requestedAction;
  state.pacman.desiredDirection = requestedAction;

  const activeElapsedMs = consumeReadyDelay(state, elapsedMs);

  if (state.status === "ready" && state.readyDelayMs === 0) {
    state.status = "running";
  }

  if (activeElapsedMs > 0 && state.readyDelayMs === 0 && state.status === "running") {
    tickGhostTimers(state, activeElapsedMs);
    tickGhostReleaseTimers(state, activeElapsedMs);
    movePacman(state, events, activeElapsedMs);
  }

  const collidedBeforeGhostMove =
    state.status === "running" && state.readyDelayMs === 0
      ? resolveGhostCollisions(state, events)
      : false;

  if (!collidedBeforeGhostMove && state.status === "running") {
    moveGhosts(state, events, activeElapsedMs);
  }

  state.reward = calculateReward(events);
  state.lastEvents = events;

  return {
    state,
    done: state.status === "won" || state.status === "lost",
    reward: state.reward,
    events,
  };
}

export function restartGame(
  state: GameState,
  seed = state.seed,
  lives = INITIAL_LIVES,
): GameState {
  return createGameState({
    maze: state.maze,
    lives,
    seed,
    readyDelayMs: START_DELAY_MS,
    difficulty: state.difficulty,
  });
}

export { getAvailableNeighbors, getLegalActions, isActionLegal, isWall, listAllActions };
