import { startTransition, useEffect, useRef, useState } from "react";

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
import { Hud } from "./ui/Hud";
import { MainMenu } from "./ui/MainMenu";
import { MetricsPanel } from "./ui/MetricsPanel";
import { PauseMenu } from "./ui/PauseMenu";
import { readStorage, writeStorage } from "./utils/storage";

const CONTROLLER_STORAGE_KEY = "pacman-ai-controller";

const humanController = new HumanController();

const controllerOptions: AgentOption[] = [
  {
    id: "human",
    label: "Manual Play",
    description:
      "Keyboard-driven play using the same action API the AI agents will use.",
  },
  {
    id: "random",
    label: "Random Agent",
    description: "Pure baseline agent that chooses a legal move at random.",
  },
  {
    id: "greedy",
    label: "Greedy Pellet Agent",
    description: "Targets the nearest pellet using shortest-path search.",
  },
  {
    id: "avoidance",
    label: "Ghost Avoidance Agent",
    description: "Prioritizes survival and safer routes around nearby ghosts.",
  },
  {
    id: "astar",
    label: "A* Agent",
    description: "Uses weighted A* planning with ghost danger penalties.",
  },
  {
    id: "behavior-tree",
    label: "Behavior Tree Agent",
    description: "Combines survival, chase, and planning behaviors hierarchically.",
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
    <main className="app-shell">
      <section className="left-column">
        <MainMenu
          hasBegun={hasBegun}
          onStart={handleStartOrRestart}
          onResume={handleResume}
        />
        <div className="board-panel">
          <canvas ref={canvasRef} className="game-canvas" />
          <PauseMenu
            open={pauseOverlayOpen}
            onResume={togglePause}
            onRestart={handleRestart}
          />
        </div>
      </section>
      <section className="right-column">
        <AgentSelector
          options={controllerOptions}
          value={controllerId}
          onChange={setControllerId}
        />
        <Hud
          controllerName={activeController.name}
          score={gameState.score}
          lives={gameState.lives}
          pelletsRemaining={gameState.pellets.size + gameState.powerPellets.size}
          stepCount={gameState.steps}
          status={gameState.status}
          seed={gameState.seed}
        />
        <MetricsPanel
          frightenedGhosts={frightenedGhosts}
          lastReward={gameState.reward}
          statusNote={statusNote}
          loggingEnabled={loggingEnabled}
          logCount={logCount}
          evaluationMetrics={evaluationMetrics}
          evaluationBusy={evaluationBusy}
          onToggleLogging={handleToggleLogging}
          onExportLog={handleExportLog}
          onRunEvaluation={handleRunEvaluation}
        />
      </section>
    </main>
  );
}

export default App;
