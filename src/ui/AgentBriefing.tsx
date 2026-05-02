import type { AgentOption } from "./AgentSelector";

interface AgentBriefingProps {
  option: AgentOption;
  showAudiencePanels?: boolean;
}

export function AgentBriefing({
  option,
  showAudiencePanels = true,
}: AgentBriefingProps) {
  return (
    <section className="panel insight-panel" id="active-briefing">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">{option.category}</p>
          <h2>Current model: {option.label}</h2>
        </div>
        <div className="insight-icon" aria-hidden="true">
          AI
        </div>
      </div>
      <p className="panel-copy lead-copy">{option.description}</p>
      <p className="detail-copy">
        <span>How it works</span>
        {option.howItWorks}
      </p>
      {showAudiencePanels ? (
        <div className="insight-grid">
          <article className="insight-card">
            <h3>For students</h3>
            <p>{option.studentLens}</p>
          </article>
          <article className="insight-card">
            <h3>For industry</h3>
            <p>{option.industryLens}</p>
          </article>
        </div>
      ) : null}
      <div className="meta-chip-row">
        <span className="meta-chip">{option.planningStyle}</span>
        <span className="meta-chip">{option.complexity}</span>
        <span className="meta-chip">Autonomy {option.autonomyLevel}/5</span>
      </div>
    </section>
  );
}
