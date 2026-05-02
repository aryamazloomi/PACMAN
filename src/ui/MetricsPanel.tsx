import type { EvaluationMetrics } from "../evaluation/metrics";

interface MetricsPanelProps {
  frightenedGhosts: number;
  lastReward: number;
  statusNote: string;
  loggingEnabled: boolean;
  logCount: number;
  evaluationMetrics: EvaluationMetrics | null;
  evaluationBusy: boolean;
  onToggleLogging: () => void;
  onExportLog: () => void;
  onRunEvaluation: () => void;
}

export function MetricsPanel({
  frightenedGhosts,
  lastReward,
  statusNote,
  loggingEnabled,
  logCount,
  evaluationMetrics,
  evaluationBusy,
  onToggleLogging,
  onExportLog,
  onRunEvaluation,
}: MetricsPanelProps) {
  return (
    <section className="panel">
      <p className="panel-kicker">Runtime Metrics</p>
      <h2>Simulation snapshot</h2>
      <div className="stats-row">
        <div className="stat-chip">
          <span>Frightened Ghosts</span>
          <strong>{frightenedGhosts}</strong>
        </div>
        <div className="stat-chip">
          <span>Last Reward</span>
          <strong>{lastReward.toFixed(2)}</strong>
        </div>
        <div className="stat-chip">
          <span>Logged Steps</span>
          <strong>{logCount}</strong>
        </div>
      </div>
      <p className="panel-copy">{statusNote}</p>
      <div className="hero-actions">
        <button className="secondary-button" onClick={onToggleLogging}>
          {loggingEnabled ? "Disable Logging" : "Enable Logging"}
        </button>
        <button className="secondary-button" onClick={onExportLog}>
          Export Trajectory
        </button>
        <button
          className="primary-button"
          onClick={onRunEvaluation}
          disabled={evaluationBusy}
        >
          {evaluationBusy ? "Evaluating..." : "Run Evaluation"}
        </button>
      </div>
      {evaluationMetrics ? (
        <div className="evaluation-summary">
          <p>Avg score: {evaluationMetrics.averageScore.toFixed(1)}</p>
          <p>Best score: {evaluationMetrics.bestScore.toFixed(0)}</p>
          <p>Win rate: {(evaluationMetrics.winRate * 100).toFixed(0)}%</p>
          <p>
            Avg latency: {evaluationMetrics.averageActionLatencyMs.toFixed(2)}
            ms
          </p>
        </div>
      ) : null}
    </section>
  );
}
