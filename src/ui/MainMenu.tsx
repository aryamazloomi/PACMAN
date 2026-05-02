interface MainMenuProps {
  onStart: () => void;
  onResume?: () => void;
  hasBegun: boolean;
}

export function MainMenu({ onStart, onResume, hasBegun }: MainMenuProps) {
  return (
    <section className="panel hero-panel" id="mission-brief">
      <p className="panel-kicker">Operator Brief</p>
      <h1>Browser-first Pac-Man control archive</h1>
      <p className="panel-copy">
        Every controller in this project, from manual play to A* and behavior
        trees, drives the same deterministic game core. That makes the page
        useful as both a playable demo and a compact teaching lab for search,
        heuristics, and decision policies.
      </p>
      <div className="brief-chip-row">
        <span className="meta-chip">React + TypeScript + Canvas</span>
        <span className="meta-chip">Deterministic simulation</span>
        <span className="meta-chip">Human and AI parity</span>
      </div>
      <div className="hero-actions">
        <button className="primary-button" onClick={hasBegun ? onResume : onStart}>
          {hasBegun ? "Resume Session" : "Start Session"}
        </button>
        {hasBegun && onStart ? (
          <button className="secondary-button" onClick={onStart}>
            Deploy Fresh Seed
          </button>
        ) : null}
      </div>
      <div className="controls-list">
        <p>ARROWS / WASD: move Pac-Man using the same action API as the agents.</p>
        <p>SPACE or P: pause the simulation. R: restart from the seed. ESC: reopen the dashboard.</p>
      </div>
    </section>
  );
}
