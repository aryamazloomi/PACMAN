import type { ReportsEvaluationProgress, ReportsEvaluationResult } from "../evaluation/reports";
import { REPORT_EPISODE_OPTIONS } from "../evaluation/metrics";
import type { AgentOption } from "./AgentSelector";

interface ReportsPanelProps {
  agents: readonly AgentOption[];
  selectedAgentIds: readonly string[];
  episodesPerAgent: number;
  maxStepsPerEpisode: number;
  difficultyLabel: string;
  evaluationBusy: boolean;
  progress: ReportsEvaluationProgress | null;
  report: ReportsEvaluationResult | null;
  onToggleAgent: (agentId: string) => void;
  onEpisodesChange: (episodes: number) => void;
  onMaxStepsChange: (steps: number) => void;
  onSelectAllAgents: () => void;
  onClearAgentSelection: () => void;
  onStartEvaluation: () => void;
  onStopEvaluation: () => void;
  onClearResults: () => void;
  onExportJson: () => void;
}

export function ReportsPanel({
  agents,
  selectedAgentIds,
  episodesPerAgent,
  maxStepsPerEpisode,
  difficultyLabel,
  evaluationBusy,
  progress,
  report,
  onToggleAgent,
  onEpisodesChange,
  onMaxStepsChange,
  onSelectAllAgents,
  onClearAgentSelection,
  onStartEvaluation,
  onStopEvaluation,
  onClearResults,
  onExportJson,
}: ReportsPanelProps) {
  const selectedAgentSet = new Set(selectedAgentIds);
  const sortedResults = [...(report?.agents ?? [])].sort(
    (left, right) => right.summary.averageScore - left.summary.averageScore,
  );

  return (
    <div className="page-stack">
      <section className="panel reports-panel">
        <div className="panel-header">
          <div>
            <p className="panel-kicker">Reports</p>
            <h2>Automatic agent evaluation</h2>
          </div>
        </div>
        <p className="panel-copy lead-copy">
          Run every selected AI controller headlessly on the same deterministic seed list,
          compare score and survival behavior, and export the latest report as JSON.
        </p>
        <div className="reports-controls-grid">
          <label className="field">
            <span>Episodes per agent</span>
            <select
              value={String(episodesPerAgent)}
              onChange={(event) => onEpisodesChange(Number(event.target.value))}
              disabled={evaluationBusy}
            >
              {REPORT_EPISODE_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  {count.toLocaleString()} episodes
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Max steps per episode</span>
            <input
              type="number"
              min={1}
              step={100}
              value={maxStepsPerEpisode}
              onChange={(event) =>
                onMaxStepsChange(Math.max(1, Number(event.target.value) || 1))
              }
              disabled={evaluationBusy}
            />
          </label>
          <div className="config-note reports-note">
            <strong>Evaluation profile</strong>
            <p>
              Difficulty: {difficultyLabel}. Rendering stays off during reports, and the
              runner yields in chunks so the dashboard remains usable during large batches.
            </p>
          </div>
        </div>
        <div className="reports-selection-header">
          <div className="compact-panel-title">
            <span className="panel-icon panel-icon-reports" aria-hidden="true" />
            <p className="panel-kicker">Agent set</p>
          </div>
          <div className="hero-actions reports-inline-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onSelectAllAgents}
              disabled={evaluationBusy}
            >
              Select all
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={onClearAgentSelection}
              disabled={evaluationBusy}
            >
              Clear
            </button>
          </div>
        </div>
        <div className="agent-toggle-grid">
          {agents.map((agent) => (
            <label
              key={agent.id}
              className={
                selectedAgentSet.has(agent.id)
                  ? "agent-toggle agent-toggle-active"
                  : "agent-toggle"
              }
            >
              <input
                type="checkbox"
                checked={selectedAgentSet.has(agent.id)}
                onChange={() => onToggleAgent(agent.id)}
                disabled={evaluationBusy}
              />
              <div>
                <strong>{agent.label}</strong>
                <span>{agent.planningStyle}</span>
              </div>
            </label>
          ))}
        </div>
        <div className="hero-actions reports-actions">
          <button
            type="button"
            className="primary-button"
            onClick={onStartEvaluation}
            disabled={evaluationBusy || selectedAgentIds.length === 0}
          >
            {evaluationBusy ? "Running evaluation" : "Run selected agents"}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onStopEvaluation}
            disabled={!evaluationBusy}
          >
            Stop
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onClearResults}
            disabled={evaluationBusy}
          >
            Clear results
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onExportJson}
            disabled={!report}
          >
            Export JSON
          </button>
        </div>
      </section>

      {progress ? (
        <section className="panel reports-progress-panel">
          <div className="panel-header">
            <div className="compact-panel-title">
              <span className="panel-icon panel-icon-runtime" aria-hidden="true" />
              <p className="panel-kicker">Progress</p>
            </div>
          </div>
          <div className="progress-block">
            <div className="progress-meta">
              <div>
                <span>Status</span>
                <strong>
                  {progress.cancelled
                    ? "Stopped"
                    : evaluationBusy
                      ? "Evaluating"
                      : report
                        ? "Complete"
                        : "Idle"}
                </strong>
              </div>
              <div>
                <span>Completion</span>
                <strong>{progress.percent.toFixed(0)}%</strong>
              </div>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
          <div className="runtime-list">
            <RuntimeRow
              label="Current agent"
              value={progress.currentAgentName ?? "Waiting for next run"}
            />
            <RuntimeRow
              label="Current episode"
              value={
                progress.currentAgentName
                  ? `${progress.currentEpisode}/${progress.episodesPerAgent}`
                  : "0/0"
              }
            />
            <RuntimeRow
              label="Completed episodes"
              value={`${progress.completedEpisodes}/${progress.totalEpisodes}`}
            />
            <RuntimeRow
              label="Completed agents"
              value={`${progress.completedAgents}/${progress.totalAgents}`}
            />
          </div>
        </section>
      ) : null}

      {report ? (
        <>
          <section className="panel reports-summary-panel">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">Summary table</p>
                <h2>Cross-agent comparison</h2>
              </div>
            </div>
            <p className="panel-copy">
              Latest run: {new Date(report.generatedAt).toLocaleString()}. Shared seeds:
              {" "}
              {report.settings.seeds.length.toLocaleString()} per agent.
              {report.cancelled ? " This report is partial because the run was stopped." : ""}
            </p>
            {sortedResults.length > 0 ? (
              <div className="reports-table-shell">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Episodes</th>
                      <th>Avg Score</th>
                      <th>Best Score</th>
                      <th>Win Rate</th>
                      <th>Death Rate</th>
                      <th>Avg Survival</th>
                      <th>Avg Pellets</th>
                      <th>Avg Ghosts</th>
                      <th>Illegal Moves</th>
                      <th>Avg Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedResults.map((agent) => (
                      <tr key={agent.agentId}>
                        <td>{agent.agentName}</td>
                        <td>{agent.episodes.toLocaleString()}</td>
                        <td>{agent.summary.averageScore.toFixed(1)}</td>
                        <td>{agent.summary.bestScore.toFixed(0)}</td>
                        <td>{formatRate(agent.summary.winRate)}</td>
                        <td>{formatRate(agent.summary.deathRate)}</td>
                        <td>{agent.summary.averageSurvivalTimeSeconds.toFixed(2)} s</td>
                        <td>{agent.summary.averagePelletsCollected.toFixed(1)}</td>
                        <td>{agent.summary.averageGhostsEaten.toFixed(2)}</td>
                        <td>{agent.summary.averageIllegalMoves.toFixed(2)}</td>
                        <td>{agent.summary.averageDecisionMs.toFixed(2)} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-library">
                The run did not finish a full agent evaluation before it was cleared or stopped.
              </div>
            )}
          </section>

          <section className="panel reports-ranking-panel">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">Ranking</p>
                <h2>Highlights</h2>
              </div>
            </div>
            <div className="reports-ranking-grid">
              <RankingCard
                label="Best average score"
                entry={report.ranking.bestAverageScore}
                suffix=""
              />
              <RankingCard
                label="Best win rate"
                entry={report.ranking.bestWinRate}
                suffix="%"
                percentage
              />
              <RankingCard
                label="Best survival time"
                entry={report.ranking.bestSurvivalTime}
                suffix=" s"
              />
              <RankingCard
                label="Most consistent"
                entry={report.ranking.mostConsistent}
                suffix=""
              />
              <RankingCard
                label="Fastest decisions"
                entry={report.ranking.fastestDecision}
                suffix=" ms"
              />
              <RankingCard
                label="Lowest illegal moves"
                entry={report.ranking.lowestIllegalMoves}
                suffix=""
              />
            </div>
          </section>

          <section className="panel reports-details-panel">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">Detailed reports</p>
                <h2>Per-agent breakdown</h2>
              </div>
            </div>
            <div className="reports-detail-grid">
              {sortedResults.map((result) => {
                const option = agents.find((agent) => agent.id === result.agentId);

                if (!option) {
                  return null;
                }

                return (
                  <article key={result.agentId} className="dossier-card reports-detail-card">
                    <div className="dossier-header">
                      <div>
                        <p className="dossier-kicker">{option.category}</p>
                        <h3>{option.label}</h3>
                      </div>
                      <span className="meta-chip">{option.planningStyle}</span>
                    </div>
                    <p className="dossier-summary">{option.description}</p>
                    <div className="reports-detail-metrics">
                      <MetricCell label="Avg Score" value={result.summary.averageScore.toFixed(1)} />
                      <MetricCell label="Win Rate" value={formatRate(result.summary.winRate)} />
                      <MetricCell
                        label="Avg Reward"
                        value={result.summary.averageReward.toFixed(2)}
                      />
                      <MetricCell
                        label="Avg Survival"
                        value={`${result.summary.averageSurvivalTimeSeconds.toFixed(2)} s`}
                      />
                      <MetricCell
                        label="Avg Pellets"
                        value={result.summary.averagePelletsCollected.toFixed(1)}
                      />
                      <MetricCell
                        label="Illegal Moves"
                        value={result.summary.averageIllegalMoves.toFixed(2)}
                      />
                    </div>
                    <div className="reports-bullet-section">
                      <span>Strengths</span>
                      <ul>
                        {option.strengths.map((item) => (
                          <li key={`${option.id}-strength-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="reports-bullet-section">
                      <span>Weaknesses</span>
                      <ul>
                        {option.weaknesses.map((item) => (
                          <li key={`${option.id}-weakness-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <p className="dossier-section">
                      <span>Notable behavior</span>
                      {option.notableBehavior}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <section className="panel reports-empty-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Awaiting run</p>
              <h2>No evaluation report yet</h2>
            </div>
          </div>
          <p className="panel-copy">
            Select one or more AI agents, choose an episode preset, and run a headless
            comparison to populate the reports dashboard.
          </p>
        </section>
      )}
    </div>
  );
}

function RuntimeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="runtime-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric reports-metric-cell">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RankingCard({
  label,
  entry,
  suffix,
  percentage = false,
}: {
  label: string;
  entry: ReportsEvaluationResult["ranking"][keyof ReportsEvaluationResult["ranking"]];
  suffix: string;
  percentage?: boolean;
}) {
  const value =
    entry.value === null
      ? "No data"
      : percentage
        ? `${(entry.value * 100).toFixed(0)}${suffix}`
        : `${entry.value.toFixed(2)}${suffix}`;

  return (
    <article className="metric reports-ranking-card">
      <span>{label}</span>
      <strong>{entry.agentName ?? "No data"}</strong>
      <p>{value}</p>
    </article>
  );
}

function formatRate(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}
