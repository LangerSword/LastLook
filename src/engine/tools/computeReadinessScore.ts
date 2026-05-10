export interface ComponentScore {
  name: string;
  score: number;
  weight: number;
  weightedScore: number;
}

export interface ReadinessScoreResult {
  totalScore: number;
  status: 'not_ready' | 'needs_major_fixes' | 'close_needs_edits' | 'ready_minor_polish';
  components: ComponentScore[];
}

const SCORE_WEIGHTS = {
  requirements: 0.35,
  fit: 0.20,
  evidence: 0.15,
  clarity: 0.10,
  length: 0.10,
  risk: 0.10,
};

export function computeReadinessScore(
  componentScores: Record<string, number>
): ReadinessScoreResult {
  const components: ComponentScore[] = [];
  let totalWeighted = 0;

  for (const [name, score] of Object.entries(componentScores)) {
    const weight = SCORE_WEIGHTS[name as keyof typeof SCORE_WEIGHTS] || 0.1;
    const weightedScore = score * weight;
    totalWeighted += weightedScore;

    components.push({
      name,
      score,
      weight,
      weightedScore: Math.round(weightedScore),
    });
  }

  const totalScore = Math.max(0, Math.min(100, Math.round(totalWeighted)));

  let status: ReadinessScoreResult['status'];
  if (totalScore >= 85) status = 'ready_minor_polish';
  else if (totalScore >= 70) status = 'close_needs_edits';
  else if (totalScore >= 50) status = 'needs_major_fixes';
  else status = 'not_ready';

  return { totalScore, status, components };
}