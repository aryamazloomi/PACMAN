import { DIFFICULTY_OPTIONS } from "../game/difficulty";
import type { DifficultyId } from "../game/types";

import type { AgentOption } from "./AgentSelector";

interface SystemConfigPanelProps {
  options: readonly AgentOption[];
  controllerId: string;
  difficulty: DifficultyId;
  onControllerChange: (value: string) => void;
  onDifficultyChange: (value: DifficultyId) => void;
  onApply: () => void;
  hasPendingChanges: boolean;
}

export function SystemConfigPanel({
  options,
  controllerId,
  difficulty,
  onControllerChange,
  onDifficultyChange,
  onApply,
  hasPendingChanges,
}: SystemConfigPanelProps) {
  const selectedController =
    options.find((option) => option.id === controllerId) ?? options[0];

  return (
    <section className="panel config-panel" id="controller-panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">System Config</p>
          <h2>Controller and difficulty</h2>
        </div>
      </div>
      <label className="field">
        <span>Active controller</span>
        <select
          value={controllerId}
          onChange={(event) => onControllerChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className="config-note">
        <strong>{selectedController.label}</strong>
        <p>{selectedController.description}</p>
      </div>
      <div className="difficulty-grid">
        {DIFFICULTY_OPTIONS.map((option) => (
          <button
            key={option.difficulty}
            type="button"
            className={
              option.difficulty === difficulty
                ? "difficulty-card difficulty-card-active"
                : "difficulty-card"
            }
            onClick={() => onDifficultyChange(option.difficulty)}
          >
            <strong>{option.label}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>
      <p className="panel-copy status-copy">
        Difficulty changes apply to both manual play and AI runs by changing
        ghost pace, frightened duration, and house release timing. Applying the
        config restarts the simulation from the seed.
      </p>
      <div className="hero-actions compact-actions">
        <button className="primary-button" onClick={onApply}>
          {hasPendingChanges ? "Commit Changes" : "Reapply Settings"}
        </button>
      </div>
    </section>
  );
}
