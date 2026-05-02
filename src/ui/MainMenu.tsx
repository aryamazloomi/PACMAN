interface MainMenuProps {
  onStart: () => void;
  onResume?: () => void;
  hasBegun: boolean;
}

export function MainMenu({ onStart, onResume, hasBegun }: MainMenuProps) {
  return (
    <section className="panel hero-panel">
      <p className="panel-kicker">Playable Portfolio Project</p>
      <h1>Pac-Man AI</h1>
      <p className="panel-copy">
        Manual play is wired through the same action interface that the AI
        controllers will use, so every agent can be compared inside one
        deterministic browser-first game core.
      </p>
      <div className="hero-actions">
        <button className="primary-button" onClick={hasBegun ? onResume : onStart}>
          {hasBegun ? "Resume Game" : "Start Game"}
        </button>
        {hasBegun && onStart ? (
          <button className="secondary-button" onClick={onStart}>
            Restart Round
          </button>
        ) : null}
      </div>
      <div className="controls-list">
        <p>Controls: Arrow keys or WASD to move.</p>
        <p>Space or P pauses. R restarts. ESC opens the menu.</p>
      </div>
    </section>
  );
}
