import type { Controller } from "./Controller";
import { AStarAgent } from "./AStarAgent";
import { BehaviorTreeAgent } from "./BehaviorTreeAgent";
import { GreedyPelletAgent } from "./GreedyPelletAgent";
import { GhostAvoidanceAgent } from "./GhostAvoidanceAgent";
import { HumanController } from "./HumanController";
import { RandomAgent } from "./RandomAgent";

export function createController(id: string, seed: number): Controller {
  switch (id) {
    case "random":
      return new RandomAgent(seed);
    case "greedy":
      return new GreedyPelletAgent();
    case "avoidance":
      return new GhostAvoidanceAgent();
    case "astar":
      return new AStarAgent();
    case "behavior-tree":
      return new BehaviorTreeAgent();
    case "human":
    default:
      return new HumanController();
  }
}
