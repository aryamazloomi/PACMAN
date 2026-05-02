import { Action, getOppositeAction } from "./actions";
import { findCollidingGhosts } from "./collisions";
import { POWER_PELLET_DURATION_TICKS, SCORE_VALUES } from "./constants";
import { cloneGameState, createGameState } from "./gameState";
import {
  getAvailableNeighbors,
  getLegalActions,
  isActionLegal,
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

function resolveRequestedAction(
  maze: Maze,
  position: Position,
  requestedAction: Action,
  previousAction: Action,
  events: StepEvents,
): Action {
  const legalActions = getLegalActions(maze, position);

  if (legalActions.includes(requestedAction)) {
    return requestedAction;
  }

  if (requestedAction !== Action.Stop) {
    events.wallBump = true;
  }

  if (legalActions.includes(previousAction)) {
    return previousAction;
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
      ghost.frightenedTicks = POWER_PELLET_DURATION_TICKS;
    });
  }

  if (state.pellets.size === 0 && state.powerPellets.size === 0) {
    state.score += SCORE_VALUES.levelClear;
    state.status = "won";
    events.levelCleared = true;
  }
}

function resolveGhostCollisions(state: GameState, events: StepEvents): boolean {
  const collidingGhosts = findCollidingGhosts(state.pacman.position, state.ghosts);

  if (collidingGhosts.length === 0) {
    return false;
  }

  let lifeLost = false;

  collidingGhosts.forEach((ghost) => {
    if (ghost.frightenedTicks > 0) {
      events.ghostsEaten.push(ghost.id);
      state.score += SCORE_VALUES.ghost;
      ghost.position = { ...ghost.spawn };
      ghost.direction = Action.Left;
      ghost.frightenedTicks = 0;
      return;
    }

    lifeLost = true;
  });

  if (!lifeLost) {
    return false;
  }

  state.lives -= 1;
  events.lifeLost = true;

  if (state.lives <= 0) {
    state.status = "lost";
    return true;
  }

  const resetState = createGameState({
    maze: state.maze,
    lives: state.lives,
    seed: state.seed,
  });

  state.pacman = resetState.pacman;
  state.ghosts = resetState.ghosts;
  return true;
}

function scoreGhostAction(ghost: GhostEntity, action: Action, pacmanPosition: Position): number {
  const nextPosition = movePosition(ghost.position, action);
  const distanceToPacman = manhattanDistance(nextPosition, pacmanPosition);
  const distanceToScatter = manhattanDistance(nextPosition, ghost.scatterTarget);

  if (ghost.frightenedTicks > 0) {
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
  const legalActions = getLegalActions(maze, ghost.position).filter(
    (action) => action !== Action.Stop,
  );

  const options =
    legalActions.length > 1
      ? legalActions.filter((action) => action !== getOppositeAction(ghost.direction))
      : legalActions;
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

function moveGhosts(state: GameState): void {
  let rngState = state.rngState;

  state.ghosts.forEach((ghost) => {
    const choice = chooseGhostAction(state.maze, ghost, state.pacman.position, rngState);
    rngState = choice.rngState;
    ghost.direction = choice.action;
    ghost.position = movePosition(ghost.position, choice.action);

    if (ghost.frightenedTicks > 0) {
      ghost.frightenedTicks -= 1;
    }
  });

  state.rngState = rngState;
}

export function stepGame(
  previousState: GameState,
  requestedAction: Action,
): StepResult {
  const state = cloneGameState(previousState);
  const events = createStepEvents();

  if (state.status !== "running") {
    state.lastEvents = events;
    state.lastAction = Action.Stop;
    state.reward = calculateReward(events);
    return {
      state,
      done: state.status === "won" || state.status === "lost",
      reward: state.reward,
      events,
    };
  }

  state.steps += 1;
  const resolvedAction = resolveRequestedAction(
    state.maze,
    state.pacman.position,
    requestedAction,
    state.pacman.direction,
    events,
  );

  state.lastAction = resolvedAction;
  state.pacman.direction = resolvedAction;

  if (resolvedAction !== Action.Stop) {
    state.pacman.position = movePosition(state.pacman.position, resolvedAction);
  }

  applyPelletCollection(state, events);

  const collidedBeforeGhostMove = resolveGhostCollisions(state, events);
  if (!collidedBeforeGhostMove && state.status === "running") {
    moveGhosts(state);
    resolveGhostCollisions(state, events);
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
): GameState {
  return createGameState({
    maze: state.maze,
    lives: state.lives,
    seed,
  });
}

export { getAvailableNeighbors, getLegalActions, isActionLegal, isWall, listAllActions };
