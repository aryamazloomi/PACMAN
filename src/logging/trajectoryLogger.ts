import type { Action } from "../game/actions";
import type { GameStateView, StepResult } from "../game/types";

export interface TrajectoryStep {
  step: number;
  controller: string;
  stateSummary: {
    pacman: { x: number; y: number };
    ghostPositions: Array<{ id: string; x: number; y: number; frightenedTicks: number }>;
    pelletsRemaining: number;
    powerPelletsRemaining: number;
    legalActions: readonly Action[];
  };
  selectedAction: Action;
  reward: number;
  score: number;
  lives: number;
  done: boolean;
  timestamp: string;
}

export class TrajectoryLogger {
  private readonly entries: TrajectoryStep[] = [];

  private enabled = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  clear(): void {
    this.entries.length = 0;
  }

  log(
    controllerName: string,
    view: GameStateView,
    action: Action,
    result: StepResult,
  ): void {
    if (!this.enabled) {
      return;
    }

    this.entries.push({
      step: result.state.steps,
      controller: controllerName,
      stateSummary: {
        pacman: {
          x: result.state.pacman.position.x,
          y: result.state.pacman.position.y,
        },
        ghostPositions: result.state.ghosts.map((ghost) => ({
          id: ghost.id,
          x: ghost.position.x,
          y: ghost.position.y,
          frightenedTicks: ghost.frightenedTicks,
        })),
        pelletsRemaining: result.state.pellets.size,
        powerPelletsRemaining: result.state.powerPellets.size,
        legalActions: view.legalActions,
      },
      selectedAction: action,
      reward: result.reward,
      score: result.state.score,
      lives: result.state.lives,
      done: result.done,
      timestamp: new Date().toISOString(),
    });
  }

  toJson(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  download(filename = "pacman-trajectory.json"): void {
    if (typeof window === "undefined") {
      return;
    }

    const blob = new Blob([this.toJson()], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  getEntries(): readonly TrajectoryStep[] {
    return this.entries;
  }
}
