import type { AgentOption } from "./AgentSelector";

interface AgentLibraryProps {
  options: readonly AgentOption[];
  selectedId: string;
  query: string;
}

export function AgentLibrary({
  options,
  selectedId,
  query,
}: AgentLibraryProps) {
  return (
    <section className="panel library-panel" id="agent-library">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">Neural Architecture</p>
          <h2>Controller architecture archive</h2>
        </div>
        <span className="library-count">{options.length} models</span>
      </div>
      <p className="panel-copy">
        {query
          ? `Filtered by "${query}". Educational and industry notes live here so the core dashboard can stay focused on the live simulation.`
          : "Educational and industry notes live here so the core dashboard can stay focused on the live simulation."}
      </p>
      {options.length === 0 ? (
        <div className="empty-library">
          No controller dossiers matched that search. Try terms like
          `search`, `planner`, `safety`, or `industry`.
        </div>
      ) : (
        <div className="library-grid">
          {options.map((option) => (
            <article
              key={option.id}
              className={option.id === selectedId ? "dossier-card dossier-card-active" : "dossier-card"}
            >
              <div className="dossier-header">
                <div>
                  <p className="dossier-kicker">{option.category}</p>
                  <h3>{option.label}</h3>
                </div>
                <span className="meta-chip">{option.complexity}</span>
              </div>
              <p className="dossier-summary">{option.description}</p>
              <p className="dossier-section">
                <span>How it works</span>
                {option.howItWorks}
              </p>
              <p className="dossier-section">
                <span>Student lens</span>
                {option.studentLens}
              </p>
              <p className="dossier-section">
                <span>Industry lens</span>
                {option.industryLens}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
