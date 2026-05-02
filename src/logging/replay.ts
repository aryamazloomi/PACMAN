import type { TrajectoryStep } from "./trajectoryLogger";

export function parseReplay(json: string): TrajectoryStep[] {
  return JSON.parse(json) as TrajectoryStep[];
}
