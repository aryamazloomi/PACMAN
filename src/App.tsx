import { useEffect, useRef, useState } from "react";

import { HumanController } from "./controllers/HumanController";
import { Action } from "./game/actions";
import { DEFAULT_SEED, GAME_TICK_MS } from "./game/constants";
import { restartGame, stepGame } from "./game/engine";
import { createGameState, getGameStateView } from "./game/gameState";
import type { GameState, GameStatus } from "./game/types";
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const stateRef = useRef(gameState);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    writeStorage(CONTROLLER_STORAGE_KEY, controllerId);
  }, [controllerId]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    rendererRef.current = new CanvasRenderer(canvasRef.current);

    let animationFrame = 0;

    const renderFrame = (now: number) => {
      rendererRef.current?.render(stateRef.current, now);
      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    animationFrame = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (showMenu || pauseOverlayOpen || stateRef.current.status !== "running") {
        return;
      }

      const result = stepGame(
        stateRef.current,
        humanController.selectAction(getGameStateView(stateRef.current)),
      );

      stateRef.current = result.state;
      setGameState(result.state);
    }, GAME_TICK_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [pauseOverlayOpen, showMenu]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === "arrowup" || key === "w") {
        event.preventDefault();
        humanController.setPendingAction(Action.Up);
        resumeGameFromInput();
        return;
      }

      if (key === "arrowdown" || key === "s") {
        event.preventDefault();
        humanController.setPendingAction(Action.Down);
        resumeGameFromInput();
        return;
      }

      if (key === "arrowleft" || key === "a") {
        event.preventDefault();
        humanController.setPendingAction(Action.Left);
        resumeGameFromInput();
        return;
      }

      if (key === "arrowright" || key === "d") {
        event.preventDefault();
        humanController.setPendingAction(Action.Right);
        resumeGameFromInput();
        return;
      }

      if (key === "r") {
        event.preventDefault();
        handleRestart();
        return;
      }

      if (key === " " || key === "p") {
        event.preventDefault();
        togglePause();
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
  });

  const frightenedGhosts = gameState.ghosts.filter(
    (ghost) => ghost.frightenedTicks > 0,
  ).length;

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
    humanController.reset(gameState.seed);
    const nextState = createGameState({ seed: DEFAULT_SEED });
    stateRef.current = nextState;
    setGameState(nextState);
    setHasBegun(true);
    setShowMenu(false);
    setPauseOverlayOpen(false);
  }

  function handleRestart() {
    humanController.reset(gameState.seed);
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
        : pauseOverlayOpen
          ? "The simulation is paused."
          : "Manual play is active. AI controller options land in the next milestone.";

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
          controllerName="Manual Play"
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
        />
      </section>
    </main>
  );
}

export default App;
