interface MetricsPanelProps {
  frightenedGhosts: number;
  lastReward: number;
  statusNote: string;
}

export function MetricsPanel({
  frightenedGhosts,
  lastReward,
  statusNote,
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
      </div>
      <p className="panel-copy">{statusNote}</p>
    </section>
  );
}
