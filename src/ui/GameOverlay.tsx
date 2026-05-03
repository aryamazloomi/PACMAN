import type { GameStatus } from "../game/types";

type GameOverlayMode = "start" | "paused" | "finished";

interface GameOverlayProps {
  mode: GameOverlayMode;
  status: GameStatus;
  controllerLabel: string;
  onStart: () => void;
  onResume: () => void;
  onRestart: () => void;
}

export function GameOverlay({
  mode,
  status,
  controllerLabel,
  onStart,
  onResume,
  onRestart,
}: GameOverlayProps) {
  const title =
    mode === "start"
      ? "Simulation armed"
      : mode === "paused"
        ? "Simulation paused"
        : status === "won"
          ? "Level cleared"
          : "Game over";

  const copy =
    mode === "start"
      ? `${controllerLabel} is loaded. Start when you are ready to run the simulation.`
      : mode === "paused"
        ? "Resume the current run or restart from the currently loaded configuration."
        : "Restart the currently loaded configuration from the seed.";

  return (
    <div className="overlay">
      <section className="overlay-card overlay-card-compact">
        <p className="panel-kicker">
          {mode === "start"
            ? "Simulation Ready"
            : mode === "paused"
              ? "Paused"
              : status === "won"
                ? "Run Complete"
                : "Run Terminated"}
        </p>
        <h2>{title}</h2>
        <p className="panel-copy">{copy}</p>
        <div className="hero-actions">
          {mode === "start" ? (
            <button className="primary-button" onClick={onStart}>
              Start
            </button>
          ) : null}
          {mode === "paused" ? (
            <>
              <button className="primary-button" onClick={onResume}>
                Resume
              </button>
              <button className="secondary-button" onClick={onRestart}>
                Restart
              </button>
            </>
          ) : null}
          {mode === "finished" ? (
            <button className="primary-button" onClick={onRestart}>
              Restart
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
