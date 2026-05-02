export interface AgentOption {
  id: string;
  label: string;
  category: string;
  planningStyle: string;
  autonomyLevel: number;
  complexity: string;
  description: string;
  howItWorks: string;
  studentLens: string;
  industryLens: string;
}

interface AgentSelectorProps {
  option: AgentOption;
  difficultyLabel: string;
}

export function AgentSelector({
  option,
  difficultyLabel,
}: AgentSelectorProps) {
  const autonomyBars = Array.from(
    { length: 5 },
    (_, index) => index < option.autonomyLevel,
  );

  return (
    <section className="panel control-panel">
      <div className="panel-header">
        <div className="compact-panel-title">
          <span className="panel-icon panel-icon-controller" aria-hidden="true" />
          <p className="panel-kicker">Controller</p>
        </div>
      </div>
      <div className="controller-display">
        <span className="controller-value">{option.label}</span>
      </div>
      <div className="meta-chip-row">
        <span className="meta-chip">{option.category}</span>
        <span className="meta-chip">{option.planningStyle}</span>
      </div>
      <div className="runtime-list controller-runtime-list">
        <div className="runtime-row">
          <span>Difficulty</span>
          <strong>{difficultyLabel}</strong>
        </div>
        <div className="runtime-row">
          <span>Complexity</span>
          <strong>{option.complexity}</strong>
        </div>
      </div>
      <div className="autonomy-card">
        <div className="autonomy-header">
          <span>Autonomy level</span>
          <strong>{option.autonomyLevel}/5</strong>
        </div>
        <div className="autonomy-meter" aria-hidden="true">
          {autonomyBars.map((isActive, index) => (
            <span
              key={`${option.id}-${index}`}
              className={isActive ? "autonomy-bar autonomy-bar-active" : "autonomy-bar"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
