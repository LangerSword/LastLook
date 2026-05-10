export interface CoverageScoreResult {
  score: number;
  maxScore: number;
  weight: number;
  weightedScore: number;
}

export interface CoverageData {
  covered: number;
  partial: number;
  missing: number;
}

const COVERAGE_WEIGHT = 0.35;

export function scoreRequirementCoverage(coverage: CoverageData): CoverageScoreResult {
  const total = coverage.covered + coverage.partial + coverage.missing;
  if (total === 0) {
    return { score: 100, maxScore: 100, weight: COVERAGE_WEIGHT, weightedScore: 35 };
  }

  const coveredPct = (coverage.covered / total) * 100;
  const partialPct = (coverage.partial / total) * 50;
  const score = Math.min(100, coveredPct + partialPct);
  const weightedScore = score * COVERAGE_WEIGHT;

  return {
    score: Math.round(score),
    maxScore: 100,
    weight: COVERAGE_WEIGHT,
    weightedScore: Math.round(weightedScore),
  };
}