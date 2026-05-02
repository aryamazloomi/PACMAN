import type { GameStatus } from "../game/types";

interface TopBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  selectedControllerLabel: string;
  status: GameStatus;
  matchCount: number;
}

export function TopBar({
  query,
  onQueryChange,
  selectedControllerLabel,
  status,
  matchCount,
}: TopBarProps) {
  return (
    <header className="topbar">
      <label className="search-shell">
        <span className="search-icon" aria-hidden="true">
          O
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="QUERY CONTROLLER DOSSIERS..."
          aria-label="Search agent descriptions"
        />
      </label>
      <div className="topbar-meta">
        <span className="topbar-chip">{matchCount} DOSSIERS</span>
        <span className="topbar-chip">STATE {status}</span>
        <span className="topbar-chip topbar-chip-accent">{selectedControllerLabel}</span>
      </div>
    </header>
  );
}
