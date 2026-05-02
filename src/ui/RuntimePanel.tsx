interface RuntimePanelProps {
  stepCount: number;
  lastReward: number;
  frightenedGhosts: number;
  statusNote: string;
}

export function RuntimePanel({
  stepCount,
  lastReward,
  frightenedGhosts,
  statusNote,
}: RuntimePanelProps) {
  return (
    <section className="panel analytics-panel" id="runtime-analytics">
      <div className="panel-header">
        <div className="compact-panel-title">
          <span className="panel-icon panel-icon-runtime" aria-hidden="true" />
          <p className="panel-kicker">Runtime</p>
        </div>
      </div>
      <div className="runtime-list">
        <div className="runtime-row">
          <span>Steps executed</span>
          <strong>{stepCount.toLocaleString()}</strong>
        </div>
        <div className="runtime-row">
          <span>Last step reward</span>
          <strong>{lastReward.toFixed(2)}</strong>
        </div>
        <div className="runtime-row">
          <span>Frightened ghosts</span>
          <strong>{frightenedGhosts}</strong>
        </div>
      </div>
      <p className="panel-copy status-copy">{statusNote}</p>
    </section>
  );
}
