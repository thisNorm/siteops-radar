import type { Recommendation, RecommendationInput, Severity } from "@/types/analysis";

const severityWeight: Record<Severity, number> = {
  info: 1,
  low: 2,
  medium: 3,
  high: 4,
  critical: 5,
};

export function calculatePriorityScore(input: RecommendationInput) {
  const effortWeight = 6 - input.effort;

  return Number(
    (
      severityWeight[input.severity] * 0.4 +
      input.impact * 0.3 +
      effortWeight * 0.2 +
      input.competitorGap * 0.1
    ).toFixed(2),
  );
}

export function rankRecommendations(inputs: RecommendationInput[]): Recommendation[] {
  return inputs
    .map((input, index) => ({
      ...input,
      id: `${input.category}-${index + 1}`,
      priorityScore: calculatePriorityScore(input),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}
