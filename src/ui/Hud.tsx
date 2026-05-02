import type { GameStatus } from "../game/types";

interface HudProps {
  controllerName: string;
  score: number;
  lives: number;
  pelletsRemaining: number;
  totalPellets: number;
  stepCount: number;
  status: GameStatus;
  seed: number;
}

export function Hud({
  controllerName,
  score,
  lives,
  pelletsRemaining,
  totalPellets,
  stepCount,
  status,
  seed,
}: HudProps) {
  const remainingRatio = totalPellets > 0 ? pelletsRemaining / totalPellets : 0;

  return (
    <section className="panel stats-panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">Live Stats</p>
          <h2>Runtime scoreboard</h2>
        </div>
        <span className="status-chip">{status}</span>
      </div>
      <div className="score-grid">
        <Metric label="Score" value={score.toLocaleString()} />
        <div className="metric metric-lives">
          <span>Lives</span>
          <div className="life-pips" aria-label={`${lives} lives remaining`}>
            {Array.from({ length: 3 }, (_, index) => (
              <span
                key={`life-${index}`}
                className={index < lives ? "life-pip life-pip-active" : "life-pip"}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="progress-block">
        <div className="progress-meta">
          <span>Pellets remaining</span>
          <strong>
            {pelletsRemaining}/{totalPellets}
          </strong>
        </div>
        <div className="progress-track" aria-hidden="true">
          <div
            className="progress-fill"
            style={{ width: `${Math.max(0, Math.min(100, remainingRatio * 100))}%` }}
          />
        </div>
      </div>
      <div className="runtime-list">
        <RuntimeRow label="Controller" value={controllerName} />
        <RuntimeRow label="Steps executed" value={stepCount.toLocaleString()} />
        <RuntimeRow label="Simulation seed" value={`#${seed}`} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RuntimeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="runtime-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
