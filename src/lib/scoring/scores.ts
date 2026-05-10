import type { AnalysisCategory, AnalysisScores, Finding } from "@/types/analysis";

const categories: AnalysisCategory[] = [
  "performance",
  "seo",
  "aeogeo",
  "security",
  "accessibility",
  "contentQuality",
  "technicalHealth",
];

const penalties = {
  info: 1,
  low: 4,
  medium: 9,
  high: 16,
  critical: 24,
};

export function calculateCategoryScores(findings: Finding[]): AnalysisScores {
  const scores = Object.fromEntries(categories.map((category) => [category, 92])) as Record<
    AnalysisCategory,
    number
  >;

  for (const finding of findings) {
    scores[finding.category] = Math.max(
      0,
      scores[finding.category] - penalties[finding.severity],
    );
  }

  const overall = Math.round(
    categories.reduce((total, category) => total + scores[category], 0) /
      categories.length,
  );

  return {
    ...scores,
    overall,
  };
}
