import type { AnalysisCategory, AnalysisScores, Recommendation, Severity } from "@/types/analysis";

const categories: AnalysisCategory[] = [
  "performance",
  "seo",
  "aeogeo",
  "security",
  "accessibility",
  "contentQuality",
  "technicalHealth",
];

const severityWeights: Record<Severity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export type CompetitorGapInsight = {
  category: AnalysisCategory;
  ours: number;
  competitor: number;
  gap: number;
  signal: number;
  topRecommendation?: Recommendation;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getTopRecommendation(recommendations: Recommendation[]) {
  return recommendations.reduce<Recommendation | undefined>((best, current) => {
    if (!best) {
      return current;
    }

    const currentScore = current.priorityScore + current.competitorGap;
    const bestScore = best.priorityScore + best.competitorGap;
    return currentScore > bestScore ? current : best;
  }, undefined);
}

export function buildCompetitorGapInsights(
  scores: AnalysisScores,
  recommendations: Recommendation[],
) {
  return categories
    .map((category): CompetitorGapInsight => {
      const categoryRecommendations = recommendations.filter(
        (recommendation) => recommendation.category === category,
      );
      const ours = scores[category];

      if (categoryRecommendations.length === 0) {
        return {
          category,
          ours,
          competitor: ours,
          gap: 0,
          signal: 0,
        };
      }

      const avgCompetitorGap =
        categoryRecommendations.reduce((total, recommendation) => {
          return total + recommendation.competitorGap;
        }, 0) / categoryRecommendations.length;
      const avgSeverity =
        categoryRecommendations.reduce((total, recommendation) => {
          return total + severityWeights[recommendation.severity];
        }, 0) / categoryRecommendations.length;
      const maxPriorityScore = Math.max(
        ...categoryRecommendations.map((recommendation) => recommendation.priorityScore),
      );
      const signal = Number(
        (avgCompetitorGap * 2.8 + avgSeverity * 1.9 + maxPriorityScore * 0.7).toFixed(1),
      );
      const gap = clamp(
        Math.round(avgCompetitorGap * 3 + avgSeverity * 2 + maxPriorityScore * 0.8),
        4,
        24,
      );

      return {
        category,
        ours,
        competitor: clamp(ours + gap, ours, 100),
        gap,
        signal,
        topRecommendation: getTopRecommendation(categoryRecommendations),
      };
    })
    .sort((left, right) => right.gap - left.gap || left.ours - right.ours);
}
