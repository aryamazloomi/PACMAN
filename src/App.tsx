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
import { DEFAULT_DIFFICULTY, getDifficultyOption } from "./game/difficulty";
import { restartGame, stepGame } from "./game/engine";
import { createGameState, getGameStateView } from "./game/gameState";
import type { DifficultyId, GameState, GameStatus } from "./game/types";
import { TrajectoryLogger } from "./logging/trajectoryLogger";
import { CanvasRenderer } from "./render/CanvasRenderer";
import { AgentSelector, type AgentOption } from "./ui/AgentSelector";
import { AgentBriefing } from "./ui/AgentBriefing";
import { AgentLibrary } from "./ui/AgentLibrary";
import { ArchiveSidebar, type DashboardPage } from "./ui/ArchiveSidebar";
import { GameOverlay } from "./ui/GameOverlay";
import { Hud } from "./ui/Hud";
import { MetricsPanel } from "./ui/MetricsPanel";
import { RuntimePanel } from "./ui/RuntimePanel";
import { SimulationLogsPanel } from "./ui/SimulationLogsPanel";
import { SystemConfigPanel } from "./ui/SystemConfigPanel";
import { TopBar } from "./ui/TopBar";
import { readStorage, writeStorage } from "./utils/storage";

const CONTROLLER_STORAGE_KEY = "pacman-ai-controller";
const DIFFICULTY_STORAGE_KEY = "pacman-ai-difficulty";

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
  const [difficultyId, setDifficultyId] = useState<DifficultyId>(() =>
    readStorage(DIFFICULTY_STORAGE_KEY, DEFAULT_DIFFICULTY),
  );
  const [gameState, setGameState] = useState<GameState>(() =>
    createGameState({
      seed: DEFAULT_SEED,
      difficulty: readStorage(DIFFICULTY_STORAGE_KEY, DEFAULT_DIFFICULTY),
    }),
  );
  const [activePage, setActivePage] = useState<DashboardPage>("dashboard");
  const [showMenu, setShowMenu] = useState(true);
  const [pauseOverlayOpen, setPauseOverlayOpen] = useState(false);
  const [agentQuery, setAgentQuery] = useState("");
  const [draftControllerId, setDraftControllerId] = useState<string>(() =>
    readStorage(CONTROLLER_STORAGE_KEY, "human"),
  );
  const [draftDifficultyId, setDraftDifficultyId] = useState<DifficultyId>(() =>
    readStorage(DIFFICULTY_STORAGE_KEY, DEFAULT_DIFFICULTY),
  );
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
    setDraftControllerId(controllerId);
  }, [controllerId]);

  useEffect(() => {
    setDraftDifficultyId(difficultyId);
  }, [difficultyId]);

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
    writeStorage(DIFFICULTY_STORAGE_KEY, difficultyId);
  }, [difficultyId]);

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
      rendererRef.current = null;
    };
  }, [activePage]);

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
      setPauseOverlayOpen(false);
    };

    const restartFromInput = () => {
      resetControllers(DEFAULT_SEED);
      loggerRef.current.clear();
      setLogCount(0);
      const nextState = restartGame(stateRef.current, DEFAULT_SEED);
      stateRef.current = nextState;
      setGameState(nextState);
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
        togglePauseFromInput();
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
  const activeDifficultyOption = getDifficultyOption(difficultyId);
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
  const hasPendingConfigChanges =
    draftControllerId !== controllerId || draftDifficultyId !== difficultyId;

  function resetControllers(seed: number) {
    Object.values(controllersRef.current).forEach((controller, index) => {
      controller.reset?.(seed + index);
    });
  }

  function loadBoardForConfig(
    nextControllerId: string,
    nextDifficultyId: DifficultyId,
  ) {
    resetControllers(DEFAULT_SEED);
    loggerRef.current.clear();
    setLogCount(0);
    setControllerId(nextControllerId);
    controllerIdRef.current = nextControllerId;
    setDifficultyId(nextDifficultyId);

    const nextState = createGameState({
      seed: DEFAULT_SEED,
      difficulty: nextDifficultyId,
    });

    stateRef.current = nextState;
    setGameState(nextState);
    setShowMenu(true);
    setPauseOverlayOpen(false);
  }

  function handleStartSimulation() {
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
        difficulty: difficultyId,
      });

      startTransition(() => {
        setEvaluationMetrics(metrics);
        setEvaluationBusy(false);
      });
    }, 0);
  }

  function handleApplySystemConfig() {
    loadBoardForConfig(draftControllerId, draftDifficultyId);
  }

  function handleReloadLatestConfig() {
    loadBoardForConfig(controllerId, difficultyId);
  }

  function handleDashboardControllerChange(nextControllerId: string) {
    setControllerId(nextControllerId);
    controllerIdRef.current = nextControllerId;
  }

  function handleBoardPause() {
    if (activePage !== "dashboard" || showMenuRef.current || pauseOverlayOpenRef.current) {
      return;
    }

    if (stateRef.current.status === "won" || stateRef.current.status === "lost") {
      return;
    }

    const nextState = {
      ...stateRef.current,
      status: "paused" as const,
    };

    stateRef.current = nextState;
    setGameState(nextState);
    setPauseOverlayOpen(true);
  }

  const statusNote =
    showMenu
      ? "The latest loaded configuration is staged on the board. Start the run from the game overlay when ready."
      : gameState.status === "won"
      ? "All pellets cleared. Restart or switch controllers to compare routes."
      : gameState.status === "lost"
        ? "Pac-Man is out of lives. Restart to try again from the same seed."
        : gameState.readyDelayMs > 0
          ? "Get ready. Characters are reset and movement resumes after a short delay."
        : pauseOverlayOpen
          ? "The simulation is paused."
          : `${activeController.name} is active. Switch controllers anytime to compare styles.`;
  const boardOverlayMode =
    showMenu
      ? "start"
      : pauseOverlayOpen
        ? "paused"
        : gameState.status === "won" || gameState.status === "lost"
          ? "finished"
          : null;
  const activePageLabel =
    activePage === "dashboard"
      ? "CORE DASHBOARD"
      : activePage === "neural"
        ? "NEURAL ARCHITECTURE"
        : activePage === "metrics"
          ? "METRIC ANALYTICS"
          : activePage === "logs"
            ? "SIMULATION LOGS"
            : "SYSTEM CONFIG";

  function handlePrimarySidebarAction() {
    handleReloadLatestConfig();
  }

  return (
    <main className="dashboard-shell">
      <ArchiveSidebar
        activeControllerName={activeController.name}
        activePage={activePage}
        onPageChange={setActivePage}
        onPrimaryAction={handlePrimarySidebarAction}
      />
      <section className="workspace-shell">
        <TopBar
          query={agentQuery}
          onQueryChange={setAgentQuery}
          pageLabel={activePageLabel}
          selectedControllerLabel={selectedControllerOption.label}
          status={gameState.status}
        />
        {activePage === "dashboard" ? (
          <div className="workspace-grid">
            <section className="core-column">
              <div className="board-panel" id="core-dashboard">
                <div className="board-frame-header">
                  <span className="live-indicator">LIVE_SIM_STREAM</span>
                  <span className="board-frame-status">{activeController.name}</span>
                </div>
                <div className="board-stage">
                  <canvas
                    ref={canvasRef}
                    className="game-canvas"
                    onClick={handleBoardPause}
                  />
                </div>
                <div className="board-frame-footer">CAM_04_NORTH_QUADRANT</div>
                {boardOverlayMode ? (
                  <GameOverlay
                    mode={boardOverlayMode}
                    status={gameState.status}
                    controllerLabel={activeController.name}
                    onStart={handleStartSimulation}
                    onResume={handleResume}
                    onRestart={handleRestart}
                  />
                ) : null}
              </div>
              <AgentBriefing
                option={selectedControllerOption}
                showAudiencePanels={false}
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
              <RuntimePanel
                stepCount={gameState.steps}
                lastReward={gameState.reward}
                frightenedGhosts={frightenedGhosts}
                statusNote={statusNote}
              />
              <AgentSelector
                options={controllerOptions}
                value={controllerId}
                option={selectedControllerOption}
                difficultyLabel={activeDifficultyOption.label}
                onChange={handleDashboardControllerChange}
              />
            </section>
          </div>
        ) : null}
        {activePage === "neural" ? (
          <div className="page-stack">
            <AgentBriefing option={selectedControllerOption} />
            <AgentLibrary
              options={filteredControllerOptions}
              selectedId={controllerId}
              query={agentQuery.trim()}
            />
          </div>
        ) : null}
        {activePage === "metrics" ? (
          <div className="page-grid">
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
              logCount={logCount}
              evaluationMetrics={evaluationMetrics}
              evaluationBusy={evaluationBusy}
              onRunEvaluation={handleRunEvaluation}
            />
          </div>
        ) : null}
        {activePage === "logs" ? (
          <div className="page-grid">
            <SimulationLogsPanel
              loggingEnabled={loggingEnabled}
              logCount={logCount}
              onToggleLogging={handleToggleLogging}
              onExportLog={handleExportLog}
            />
            <AgentSelector
              options={controllerOptions}
              value={controllerId}
              option={selectedControllerOption}
              difficultyLabel={activeDifficultyOption.label}
              onChange={handleDashboardControllerChange}
            />
          </div>
        ) : null}
        {activePage === "config" ? (
          <div className="page-stack">
            <SystemConfigPanel
              options={controllerOptions}
              controllerId={draftControllerId}
              difficulty={draftDifficultyId}
              onControllerChange={setDraftControllerId}
              onDifficultyChange={setDraftDifficultyId}
              onApply={handleApplySystemConfig}
              hasPendingChanges={hasPendingConfigChanges}
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default App;
