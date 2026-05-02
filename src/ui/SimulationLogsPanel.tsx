interface SimulationLogsPanelProps {
  loggingEnabled: boolean;
  logCount: number;
  onToggleLogging: () => void;
  onExportLog: () => void;
}

export function SimulationLogsPanel({
  loggingEnabled,
  logCount,
  onToggleLogging,
  onExportLog,
}: SimulationLogsPanelProps) {
  return (
    <section className="panel logs-panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">Simulation Logs</p>
          <h2>Trajectory archive</h2>
        </div>
      </div>
      <div className="runtime-list">
        <div className="runtime-row">
          <span>Logging state</span>
          <strong>{loggingEnabled ? "Enabled" : "Paused"}</strong>
        </div>
        <div className="runtime-row">
          <span>Captured steps</span>
          <strong>{logCount.toLocaleString()}</strong>
        </div>
      </div>
      <p className="panel-copy status-copy">
        Exported logs contain state summaries, actions, rewards, scores, lives,
        and timestamps. This page is the lightweight bridge between gameplay,
        evaluation, and future imitation-learning experiments.
      </p>
      <div className="hero-actions compact-actions">
        <button className="secondary-button" onClick={onToggleLogging}>
          {loggingEnabled ? "Pause Logging" : "Resume Logging"}
        </button>
        <button className="primary-button" onClick={onExportLog}>
          Export Trajectory
        </button>
      </div>
    </section>
  );
}
