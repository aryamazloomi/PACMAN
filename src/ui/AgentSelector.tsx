export interface AgentOption {
  id: string;
  label: string;
  description: string;
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

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">Controller</p>
          <h2>Choose who drives Pac-Man</h2>
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
        <p className="panel-copy">{selectedOption.description}</p>
      ) : null}
    </section>
  );
}
