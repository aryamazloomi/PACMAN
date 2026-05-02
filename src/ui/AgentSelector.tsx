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
  options: readonly AgentOption[];
  value: string;
  onChange: (value: string) => void;
}

export function AgentSelector({
  options,
  value,
  onChange,
}: AgentSelectorProps) {
  const selectedOption = options.find((option) => option.id === value);
  const autonomyBars = Array.from({ length: 5 }, (_, index) => index < (selectedOption?.autonomyLevel ?? 0));

  return (
    <section className="panel control-panel" id="controller-panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">Controller</p>
          <h2>Active policy stack</h2>
        </div>
      </div>
      <label className="field">
        <span>Current controller</span>
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {selectedOption ? (
        <>
          <div className="meta-chip-row">
            <span className="meta-chip">{selectedOption.category}</span>
            <span className="meta-chip">{selectedOption.planningStyle}</span>
            <span className="meta-chip">{selectedOption.complexity}</span>
          </div>
          <p className="panel-copy">{selectedOption.description}</p>
          <p className="detail-copy">
            <span>How it works</span>
            {selectedOption.howItWorks}
          </p>
          <div className="autonomy-card">
            <div className="autonomy-header">
              <span>Autonomy level</span>
              <strong>{selectedOption.autonomyLevel}/5</strong>
            </div>
            <div className="autonomy-meter" aria-hidden="true">
              {autonomyBars.map((isActive, index) => (
                <span
                  key={`${selectedOption.id}-${index}`}
                  className={isActive ? "autonomy-bar autonomy-bar-active" : "autonomy-bar"}
                />
              ))}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
