import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";

import { AStarAgent } from "./controllers/AStarAgent";
import { BehaviorTreeAgent } from "./controllers/BehaviorTreeAgent";
import type { Controller } from "./controllers/Controller";
import { createController } from "./controllers/createController";
import { GreedyPelletAgent } from "./controllers/GreedyPelletAgent";
import { GhostAvoidanceAgent } from "./controllers/GhostAvoidanceAgent";
import { HumanController } from "./controllers/HumanController";
import { RandomAgent } from "./controllers/RandomAgent";
import { evaluateController } from "./evaluation/evaluateAgent";
import type { EvaluationMetrics } from "./evaluation/metrics";
import { Action } from "./game/actions";
import { DEFAULT_SEED, MAX_FRAME_DELTA_MS, SIMULATION_STEP_MS } from "./game/constants";
import { restartGame, stepGame } from "./game/engine";
import { createGameState, getGameStateView } from "./game/gameState";
import type { GameState, GameStatus } from "./game/types";
import { TrajectoryLogger } from "./logging/trajectoryLogger";
import { CanvasRenderer } from "./render/CanvasRenderer";
import { AgentSelector, type AgentOption } from "./ui/AgentSelector";
import { AgentBriefing } from "./ui/AgentBriefing";
import { AgentLibrary } from "./ui/AgentLibrary";
import { ArchiveSidebar } from "./ui/ArchiveSidebar";
import { Hud } from "./ui/Hud";
import { MainMenu } from "./ui/MainMenu";
import { MetricsPanel } from "./ui/MetricsPanel";
import { PauseMenu } from "./ui/PauseMenu";
import { TopBar } from "./ui/TopBar";
import { readStorage, writeStorage } from "./utils/storage";

const CONTROLLER_STORAGE_KEY = "pacman-ai-controller";

const humanController = new HumanController();

const controllerOptions: AgentOption[] = [
  {
    id: "human",
    label: "Manual Play",
    category: "Human Baseline",
    planningStyle: "Human input",
    autonomyLevel: 1,
    complexity: "Foundation",
    description:
      "Keyboard-driven control that uses the exact same action interface as the AI agents, making it the clean baseline for feel-testing and fair comparisons.",
    howItWorks:
      "The controller stores the most recent requested direction and returns it to the engine. The engine still decides whether the move is legal at tile centers, so human and AI policies obey the same movement rules.",
    studentLens:
      "This is the clearest example of policy versus environment. A controller suggests an action, but the simulation remains the final authority.",
    industryLens:
      "Human-in-the-loop baselines are essential for QA, demos, and debugging because they reveal whether poor outcomes come from the policy or from the environment itself.",
  },
  {
    id: "random",
    label: "Random Agent",
    category: "Baseline Policy",
    planningStyle: "Seeded sampling",
    autonomyLevel: 2,
    complexity: "Intro",
    description:
      "A deliberately weak baseline that selects a legal action at random so we can measure how much smarter the other controllers really are.",
    howItWorks:
      "At every decision step it samples from the legal non-stop actions using a deterministic seeded RNG. It has no memory, no planning horizon, and no model of danger.",
    studentLens:
      "This shows why baselines matter. Even a naive random policy can expose bugs in legal moves, collision timing, and score accounting.",
    industryLens:
      "Teams often keep a simple control policy like this around as a regression oracle and smoke test for changes to the environment or action space.",
  },
  {
    id: "greedy",
    label: "Greedy Pellet Agent",
    category: "Search Heuristic",
    planningStyle: "Shortest path",
    autonomyLevel: 3,
    complexity: "Intro",
    description:
      "A fast resource-collection agent that greedily chases the nearest pellet or power pellet by shortest path distance.",
    howItWorks:
      "It builds the current set of pellet targets, runs shortest-path search from Pac-Man to the nearest reachable one, and commits to the first move along that route.",
    studentLens:
      "It is a good introduction to local optimization. Students can see how a policy can be computationally simple and still look intelligent for short horizons.",
    industryLens:
      "Greedy heuristics are common when low latency matters more than perfect global optimality, especially in routing, inventory picking, and task allocation.",
  },
  {
    id: "avoidance",
    label: "Ghost Avoidance Agent",
    category: "Safety Heuristic",
    planningStyle: "Utility scoring",
    autonomyLevel: 4,
    complexity: "Intermediate",
    description:
      "A survival-first controller that scores nearby moves by balancing ghost danger, reachable safety, and the value of pellets or power pellets.",
    howItWorks:
      "For each legal action it estimates ghost proximity, immediate danger tiles, path cost to future safety, and reward bonuses for nearby pellets. It then picks the action with the highest hand-tuned utility score.",
    studentLens:
      "This is a compact example of feature engineering. Instead of learning weights, the policy encodes domain knowledge directly into the scoring function.",
    industryLens:
      "Rule-based risk scoring is still common in production systems when interpretability and predictable failure modes matter more than raw benchmark performance.",
  },
  {
    id: "astar",
    label: "A* Agent",
    category: "Planner",
    planningStyle: "Weighted A*",
    autonomyLevel: 4,
    complexity: "Advanced",
    description:
      "A cost-aware planner that uses A* search to weigh target value against ghost danger, producing more deliberate routes than the greedy policy.",
    howItWorks:
      "It evaluates candidate pellet and power-pellet targets with A* pathfinding, injects ghost danger as an extra movement cost, and prefers power pellets when threats are close enough to justify the detour.",
    studentLens:
      "It demonstrates how classic search becomes more realistic once path cost includes risk, not just distance.",
    industryLens:
      "This mirrors many operational planners where shortest path is not enough and cost maps must capture risk, congestion, or safety constraints.",
  },
  {
    id: "behavior-tree",
    label: "Behavior Tree Agent",
    category: "Hierarchical Policy",
    planningStyle: "Behavior tree",
    autonomyLevel: 5,
    complexity: "Advanced",
    description:
      "A higher-level controller that switches between fleeing, chasing frightened ghosts, and route planning based on the current tactical situation.",
    howItWorks:
      "It first checks whether dangerous ghosts are too close and falls back to the avoidance policy. If a frightened ghost is reachable in time, it opportunistically chases. Otherwise it hands control to the A* planner.",
    studentLens:
      "This is a clean example of policy arbitration: smaller specialist controllers become reusable building blocks inside a larger decision hierarchy.",
    industryLens:
      "Behavior trees remain popular in games, robotics, and industrial autonomy because they make complex decision logic modular, inspectable, and easy to tune.",
  },
];

function App() {
  const [controllerId, setControllerId] = useState<string>(() =>
    readStorage(CONTROLLER_STORAGE_KEY, "human"),
  );
  const [gameState, setGameState] = useState<GameState>(() =>
    createGameState({ seed: DEFAULT_SEED }),
  );
  const [showMenu, setShowMenu] = useState(true);
  const [hasBegun, setHasBegun] = useState(false);
  const [pauseOverlayOpen, setPauseOverlayOpen] = useState(false);
  const [agentQuery, setAgentQuery] = useState("");
  const [loggingEnabled, setLoggingEnabled] = useState(true);
  const [logCount, setLogCount] = useState(0);
  const [evaluationMetrics, setEvaluationMetrics] = useState<EvaluationMetrics | null>(null);
  const [evaluationBusy, setEvaluationBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const stateRef = useRef(gameState);
  const controllerIdRef = useRef(controllerId);
  const showMenuRef = useRef(showMenu);
  const pauseOverlayOpenRef = useRef(pauseOverlayOpen);
  const loggerRef = useRef(new TrajectoryLogger());
  const controllersRef = useRef<Record<string, Controller>>({
    human: humanController,
    random: new RandomAgent(DEFAULT_SEED),
    greedy: new GreedyPelletAgent(),
    avoidance: new GhostAvoidanceAgent(),
    astar: new AStarAgent(),
    "behavior-tree": new BehaviorTreeAgent(),
  });
  const deferredAgentQuery = useDeferredValue(agentQuery.trim().toLowerCase());

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    controllerIdRef.current = controllerId;
  }, [controllerId]);

  useEffect(() => {
    showMenuRef.current = showMenu;
  }, [showMenu]);

  useEffect(() => {
    pauseOverlayOpenRef.current = pauseOverlayOpen;
  }, [pauseOverlayOpen]);

  useEffect(() => {
    writeStorage(CONTROLLER_STORAGE_KEY, controllerId);
  }, [controllerId]);

  useEffect(() => {
    if (!controllerOptions.some((option) => option.id === controllerId)) {
      setControllerId("human");
    }
  }, [controllerId]);

  useEffect(() => {
    loggerRef.current.setEnabled(loggingEnabled);
  }, [loggingEnabled]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    rendererRef.current = new CanvasRenderer(canvasRef.current);

    let animationFrame = 0;
    let lastFrameTime = 0;
    let accumulatorMs = 0;

    const renderFrame = (now: number) => {
      if (lastFrameTime === 0) {
        lastFrameTime = now;
      }

      const frameDeltaMs = Math.min(now - lastFrameTime, MAX_FRAME_DELTA_MS);
      lastFrameTime = now;

      const shouldSimulate =
        !showMenuRef.current &&
        !pauseOverlayOpenRef.current &&
        stateRef.current.status !== "paused" &&
        stateRef.current.status !== "won" &&
        stateRef.current.status !== "lost";

      if (shouldSimulate) {
        accumulatorMs += frameDeltaMs;
        let advancedState = false;

        while (accumulatorMs >= SIMULATION_STEP_MS) {
          const activeController =
            controllersRef.current[controllerIdRef.current] ?? humanController;
          const view = getGameStateView(stateRef.current);
          const action = activeController.selectAction(view);
          const result = stepGame(stateRef.current, action, SIMULATION_STEP_MS);

          loggerRef.current.log(activeController.name, view, action, result);
          stateRef.current = result.state;
          accumulatorMs -= SIMULATION_STEP_MS;
          advancedState = true;

          if (result.done) {
            accumulatorMs = 0;
            break;
          }
        }

        if (advancedState) {
          setGameState(stateRef.current);
          setLogCount(loggerRef.current.getEntries().length);
        }
      } else {
        accumulatorMs = 0;
      }

      rendererRef.current?.render(stateRef.current, now);
      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    animationFrame = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    const resumeGameForInput = () => {
      const shouldResume =
        stateRef.current.status === "paused" && stateRef.current.lives > 0;

      if (shouldResume) {
        const nextState = {
          ...stateRef.current,
          status: "running" as const,
        };

        stateRef.current = nextState;
        setGameState(nextState);
      }

      setShowMenu(false);
      setHasBegun(true);
      setPauseOverlayOpen(false);
    };

    const restartFromInput = () => {
      resetControllers(DEFAULT_SEED);
      loggerRef.current.clear();
      setLogCount(0);
      const nextState = restartGame(stateRef.current, DEFAULT_SEED);
      stateRef.current = nextState;
      setGameState(nextState);
      setHasBegun(true);
      setShowMenu(false);
      setPauseOverlayOpen(false);
    };

    const togglePauseFromInput = () => {
      if (showMenuRef.current) {
        return;
      }

      if (stateRef.current.status === "won" || stateRef.current.status === "lost") {
        return;
      }

      const nextStatus: GameStatus = pauseOverlayOpenRef.current ? "running" : "paused";
      const nextState = {
        ...stateRef.current,
        status: nextStatus,
      };

      stateRef.current = nextState;
      setGameState(nextState);
      setPauseOverlayOpen((currentValue) => !currentValue);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === "arrowup" || key === "w") {
        event.preventDefault();
        humanController.setPendingAction(Action.Up);
        resumeGameForInput();
        return;
      }

      if (key === "arrowdown" || key === "s") {
        event.preventDefault();
        humanController.setPendingAction(Action.Down);
        resumeGameForInput();
        return;
      }

      if (key === "arrowleft" || key === "a") {
        event.preventDefault();
        humanController.setPendingAction(Action.Left);
        resumeGameForInput();
        return;
      }

      if (key === "arrowright" || key === "d") {
        event.preventDefault();
        humanController.setPendingAction(Action.Right);
        resumeGameForInput();
        return;
      }

      if (key === "r") {
        event.preventDefault();
        restartFromInput();
        return;
      }

      if (key === " " || key === "p") {
        event.preventDefault();
        togglePauseFromInput();
        return;
      }

      if (key === "escape") {
        event.preventDefault();
        setShowMenu(true);
        setPauseOverlayOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const frightenedGhosts = gameState.ghosts.filter(
    (ghost) => ghost.frightenedTimerMs > 0,
  ).length;
  const activeController = controllersRef.current[controllerId] ?? humanController;
  const selectedControllerOption =
    controllerOptions.find((option) => option.id === controllerId) ?? controllerOptions[0];
  const filteredControllerOptions = controllerOptions.filter((option) => {
    if (!deferredAgentQuery) {
      return true;
    }

    const searchableText = [
      option.label,
      option.category,
      option.planningStyle,
      option.description,
      option.howItWorks,
      option.studentLens,
      option.industryLens,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(deferredAgentQuery);
  });
  const totalPellets = gameState.maze.initialPellets.size + gameState.maze.initialPowerPellets.size;

  function resetControllers(seed: number) {
    Object.values(controllersRef.current).forEach((controller, index) => {
      controller.reset?.(seed + index);
    });
  }

  function resumeGameFromInput() {
    const shouldResume =
      stateRef.current.status === "paused" && stateRef.current.lives > 0;

    if (shouldResume) {
      const nextState = {
        ...stateRef.current,
        status: "running" as const,
      };

      stateRef.current = nextState;
      setGameState(nextState);
    }

    setShowMenu(false);
    setHasBegun(true);
    setPauseOverlayOpen(false);
  }

  function handleStartOrRestart() {
    resetControllers(DEFAULT_SEED);
    loggerRef.current.clear();
    setLogCount(0);
    const nextState = createGameState({ seed: DEFAULT_SEED });
    stateRef.current = nextState;
    setGameState(nextState);
    setHasBegun(true);
    setShowMenu(false);
    setPauseOverlayOpen(false);
  }

  function handleRestart() {
    resetControllers(DEFAULT_SEED);
    loggerRef.current.clear();
    setLogCount(0);
    const nextState = restartGame(stateRef.current, DEFAULT_SEED);
    stateRef.current = nextState;
    setGameState(nextState);
    setHasBegun(true);
    setShowMenu(false);
    setPauseOverlayOpen(false);
  }

  function handleResume() {
    if (stateRef.current.status === "paused") {
      const nextState = {
        ...stateRef.current,
        status: "running" as const,
      };

      stateRef.current = nextState;
      setGameState(nextState);
    }

    setHasBegun(true);
    setShowMenu(false);
    setPauseOverlayOpen(false);
  }

  function handleToggleLogging() {
    setLoggingEnabled((currentValue) => !currentValue);
  }

  function handleExportLog() {
    loggerRef.current.download();
  }

  function handleRunEvaluation() {
    if (evaluationBusy) {
      return;
    }

    setEvaluationBusy(true);

    window.setTimeout(() => {
      const evaluationController = createController(controllerId, DEFAULT_SEED);
      const metrics = evaluateController(evaluationController, {
        episodes: 5,
        maxStepsPerEpisode: 3600,
        seed: DEFAULT_SEED,
      });

      startTransition(() => {
        setEvaluationMetrics(metrics);
        setEvaluationBusy(false);
      });
    }, 0);
  }

  function togglePause() {
    if (showMenu) {
      return;
    }

    if (gameState.status === "won" || gameState.status === "lost") {
      return;
    }

    const nextStatus: GameStatus = pauseOverlayOpen ? "running" : "paused";
    const nextState = {
      ...stateRef.current,
      status: nextStatus,
    };

    stateRef.current = nextState;
    setGameState(nextState);
    setPauseOverlayOpen((currentValue) => !currentValue);
  }

  const statusNote =
    gameState.status === "won"
      ? "All pellets cleared. Restart or switch controllers to compare routes."
      : gameState.status === "lost"
        ? "Pac-Man is out of lives. Restart to try again from the same seed."
        : gameState.readyDelayMs > 0
          ? "Get ready. Characters are reset and movement resumes after a short delay."
        : pauseOverlayOpen
          ? "The simulation is paused."
          : `${activeController.name} is active. Switch controllers anytime to compare styles.`;

  return (
    <main className="dashboard-shell">
      <ArchiveSidebar
        activeControllerName={activeController.name}
        hasBegun={hasBegun}
        onPrimaryAction={handleStartOrRestart}
      />
      <section className="workspace-shell">
        <TopBar
          query={agentQuery}
          onQueryChange={setAgentQuery}
          selectedControllerLabel={selectedControllerOption.label}
          status={gameState.status}
          matchCount={filteredControllerOptions.length}
        />
        <div className="workspace-grid">
          <section className="core-column">
            <MainMenu
              hasBegun={hasBegun}
              onStart={handleStartOrRestart}
              onResume={handleResume}
            />
            <div className="board-panel" id="core-dashboard">
              <div className="board-frame-header">
                <span className="live-indicator">LIVE_SIM_STREAM</span>
                <span className="board-frame-status">{activeController.name}</span>
              </div>
              <canvas ref={canvasRef} className="game-canvas" />
              <div className="board-frame-footer">CAM_04_NORTH_QUADRANT</div>
              <PauseMenu
                open={pauseOverlayOpen}
                onResume={togglePause}
                onRestart={handleRestart}
              />
            </div>
            <AgentBriefing option={selectedControllerOption} />
            <AgentLibrary
              options={filteredControllerOptions}
              selectedId={controllerId}
              query={agentQuery.trim()}
            />
          </section>
          <section className="intel-column">
            <Hud
              controllerName={activeController.name}
              score={gameState.score}
              lives={gameState.lives}
              pelletsRemaining={gameState.pellets.size + gameState.powerPellets.size}
              totalPellets={totalPellets}
              stepCount={gameState.steps}
              status={gameState.status}
              seed={gameState.seed}
            />
            <MetricsPanel
              frightenedGhosts={frightenedGhosts}
              lastReward={gameState.reward}
              stepCount={gameState.steps}
              seed={gameState.seed}
              statusNote={statusNote}
              loggingEnabled={loggingEnabled}
              logCount={logCount}
              evaluationMetrics={evaluationMetrics}
              evaluationBusy={evaluationBusy}
              onToggleLogging={handleToggleLogging}
              onExportLog={handleExportLog}
              onRunEvaluation={handleRunEvaluation}
            />
            <AgentSelector
              options={controllerOptions}
              value={controllerId}
              onChange={setControllerId}
            />
          </section>
        </div>
      </section>
    </main>
  );
}

export default App;
