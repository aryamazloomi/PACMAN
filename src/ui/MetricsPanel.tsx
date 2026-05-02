import type { EvaluationMetrics } from "../evaluation/metrics";

interface MetricsPanelProps {
  frightenedGhosts: number;
  lastReward: number;
  stepCount: number;
  seed: number;
  statusNote: string;
  logCount: number;
  evaluationMetrics: EvaluationMetrics | null;
  evaluationBusy: boolean;
  onRunEvaluation: () => void;
}

export function MetricsPanel({
  frightenedGhosts,
  lastReward,
  stepCount,
  seed,
  statusNote,
  logCount,
  evaluationMetrics,
  evaluationBusy,
  onRunEvaluation,
}: MetricsPanelProps) {
  return (
    <section className="panel analytics-panel" id="runtime-analytics">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">Metric Analytics</p>
          <h2>Evaluation and telemetry</h2>
        </div>
      </div>
      <div className="runtime-list">
        <RuntimeRow label="Steps executed" value={stepCount.toLocaleString()} />
        <RuntimeRow label="Last step reward" value={lastReward.toFixed(2)} />
        <RuntimeRow label="Frightened ghosts" value={String(frightenedGhosts)} />
        <RuntimeRow label="Logged steps" value={logCount.toLocaleString()} />
        <RuntimeRow label="Simulation seed" value={`#${seed}`} />
      </div>
      <p className="panel-copy status-copy">{statusNote}</p>
      <div className="hero-actions compact-actions">
        <button
          className="primary-button"
          onClick={onRunEvaluation}
          disabled={evaluationBusy}
        >
          {evaluationBusy ? "Evaluating..." : "Run Evaluation"}
        </button>
      </div>
      {evaluationMetrics ? (
        <div className="evaluation-grid">
          <EvaluationCard
            label="Avg score"
            value={evaluationMetrics.averageScore.toFixed(1)}
          />
          <EvaluationCard
            label="Best score"
            value={evaluationMetrics.bestScore.toFixed(0)}
          />
          <EvaluationCard
            label="Win rate"
            value={`${(evaluationMetrics.winRate * 100).toFixed(0)}%`}
          />
          <EvaluationCard
            label="Avg latency"
            value={`${evaluationMetrics.averageActionLatencyMs.toFixed(2)} ms`}
          />
        </div>
      ) : null}
    </section>
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

function EvaluationCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="evaluation-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
