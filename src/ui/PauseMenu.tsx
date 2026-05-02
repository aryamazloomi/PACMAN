interface PauseMenuProps {
  open: boolean;
  onResume: () => void;
  onRestart: () => void;
}

export function PauseMenu({ open, onResume, onRestart }: PauseMenuProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="overlay">
      <section className="overlay-card">
        <p className="panel-kicker">Paused</p>
        <h2>Take a breather</h2>
        <p className="panel-copy">
          Resume the current run or restart from the original seed.
        </p>
        <div className="hero-actions">
          <button className="primary-button" onClick={onResume}>
            Resume
          </button>
          <button className="secondary-button" onClick={onRestart}>
            Restart
          </button>
        </div>
      </section>
    </div>
  );
}
