import type { GameStatus } from "../game/types";

interface HudProps {
  controllerName: string;
  score: number;
  lives: number;
  pelletsRemaining: number;
  stepCount: number;
  status: GameStatus;
  seed: number;
}

export function Hud({
  controllerName,
  score,
  lives,
  pelletsRemaining,
  stepCount,
  status,
  seed,
}: HudProps) {
  return (
    <section className="panel hud">
      <div className="hud-grid">
        <Metric label="Controller" value={controllerName} />
        <Metric label="Score" value={score} />
        <Metric label="Lives" value={lives} />
        <Metric label="Pellets Left" value={pelletsRemaining} />
        <Metric label="Steps" value={stepCount} />
        <Metric label="Status" value={status} />
        <Metric label="Seed" value={seed} />
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
