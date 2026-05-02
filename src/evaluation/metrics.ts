export interface EpisodeMetrics {
  score: number;
  steps: number;
  pelletsEaten: number;
  won: boolean;
  deaths: number;
  averageActionLatencyMs: number;
}

export interface EvaluationMetrics {
  episodes: number;
  averageScore: number;
  bestScore: number;
  averageSurvivalTime: number;
  pelletsEaten: number;
  winRate: number;
  deathCount: number;
  averageStepsPerEpisode: number;
  averageActionLatencyMs: number;
}

export function summarizeEpisodes(episodes: readonly EpisodeMetrics[]): EvaluationMetrics {
  if (episodes.length === 0) {
    return {
      episodes: 0,
      averageScore: 0,
      bestScore: 0,
      averageSurvivalTime: 0,
      pelletsEaten: 0,
      winRate: 0,
      deathCount: 0,
      averageStepsPerEpisode: 0,
      averageActionLatencyMs: 0,
    };
  }

  const totalEpisodes = episodes.length;
  const totalScore = episodes.reduce((sum, episode) => sum + episode.score, 0);
  const totalSteps = episodes.reduce((sum, episode) => sum + episode.steps, 0);
  const totalPellets = episodes.reduce((sum, episode) => sum + episode.pelletsEaten, 0);
  const totalDeaths = episodes.reduce((sum, episode) => sum + episode.deaths, 0);
  const totalLatency = episodes.reduce(
    (sum, episode) => sum + episode.averageActionLatencyMs,
    0,
  );
  const wins = episodes.filter((episode) => episode.won).length;

  return {
    episodes: episodes.length,
    averageScore: totalScore / totalEpisodes,
    bestScore: Math.max(...episodes.map((episode) => episode.score)),
    averageSurvivalTime: totalSteps / totalEpisodes,
    pelletsEaten: totalPellets,
    winRate: wins / totalEpisodes,
    deathCount: totalDeaths,
    averageStepsPerEpisode: totalSteps / totalEpisodes,
    averageActionLatencyMs: totalLatency / totalEpisodes,
  };
}
