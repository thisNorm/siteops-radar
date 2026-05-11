import type {
  AnalysisCategory,
  AnalysisScores,
  CompetitorBenchmark,
  CompetitorBenchmarkCategory,
  SummaryLocale,
} from "@/types/analysis";

const categories: AnalysisCategory[] = [
  "performance",
  "seo",
  "aeogeo",
  "security",
  "accessibility",
  "contentQuality",
  "technicalHealth",
];

const categoryLabels: Record<SummaryLocale, Record<AnalysisCategory, string>> = {
  ko: {
    performance: "성능",
    seo: "SEO",
    aeogeo: "AEO/GEO",
    security: "보안",
    accessibility: "접근성",
    contentQuality: "콘텐츠 품질",
    technicalHealth: "기술 상태",
  },
  en: {
    performance: "Performance",
    seo: "SEO",
    aeogeo: "AEO/GEO",
    security: "Security",
    accessibility: "Accessibility",
    contentQuality: "Content Quality",
    technicalHealth: "Technical Health",
  },
};

export function buildCompetitorBenchmark(
  competitorScores: AnalysisScores[],
  linkedCompetitorCount = competitorScores.length,
): CompetitorBenchmark | null {
  if (linkedCompetitorCount === 0) {
    return null;
  }

  const validScores = competitorScores.filter((scores) =>
    categories.every((category) => typeof scores[category] === "number"),
  );

  return {
    linkedCompetitorCount,
    analyzedCompetitorCount: validScores.length,
    categories:
      validScores.length === 0
        ? []
        : categories.map(
            (category): CompetitorBenchmarkCategory => {
              const values = validScores.map((scores) => scores[category]);
              const competitorAverage = Math.round(
                values.reduce((total, value) => total + value, 0) / values.length,
              );

              return {
                category,
                competitorAverage,
                competitorLeader: Math.max(...values),
                sampleSize: values.length,
              };
            },
          ),
  };
}

export function getCompetitorBenchmarkCategory(
  benchmark: CompetitorBenchmark | null | undefined,
  category: AnalysisCategory,
) {
  return benchmark?.categories.find((item) => item.category === category) ?? null;
}

export function getMeasuredAverageGap(
  ourScores: AnalysisScores,
  categoryBenchmark: CompetitorBenchmarkCategory,
) {
  return Math.max(0, categoryBenchmark.competitorAverage - ourScores[categoryBenchmark.category]);
}

export function getMeasuredLeaderGap(
  ourScores: AnalysisScores,
  categoryBenchmark: CompetitorBenchmarkCategory,
) {
  return Math.max(0, categoryBenchmark.competitorLeader - ourScores[categoryBenchmark.category]);
}

export function getMeasuredCompetitorGapLevel(
  ourScores: AnalysisScores,
  categoryBenchmark: CompetitorBenchmarkCategory,
): 0 | 1 | 2 | 3 | 4 | 5 {
  const gap = getMeasuredAverageGap(ourScores, categoryBenchmark);

  if (gap >= 18) {
    return 5;
  }

  if (gap >= 12) {
    return 4;
  }

  if (gap >= 8) {
    return 3;
  }

  if (gap >= 4) {
    return 2;
  }

  if (gap > 0) {
    return 1;
  }

  return 0;
}

export function buildMeasuredCompetitorNarrative(
  locale: SummaryLocale,
  ourScores: AnalysisScores,
  benchmark: CompetitorBenchmark,
) {
  if (benchmark.analyzedCompetitorCount === 0 || benchmark.categories.length === 0) {
    return locale === "ko"
      ? `연결된 경쟁사 ${benchmark.linkedCompetitorCount}곳이 있지만 아직 비교 가능한 실제 분석 결과가 없습니다. 내 사이트 분석을 다시 실행하면 연결된 경쟁사도 함께 분석해 평균과 상위 기준이 채워집니다.`
      : `There are ${benchmark.linkedCompetitorCount} linked competitors, but no comparable live competitor analyses are available yet. Run the site analysis again and the linked competitors will be analyzed together to populate the average and leader benchmarks.`;
  }

  const rankedGaps = benchmark.categories
    .map((item) => ({
      ...item,
      averageGap: getMeasuredAverageGap(ourScores, item),
      leaderGap: getMeasuredLeaderGap(ourScores, item),
    }))
    .sort(
      (left, right) =>
        right.averageGap - left.averageGap ||
        right.leaderGap - left.leaderGap ||
        left.category.localeCompare(right.category),
    );
  const positiveGaps = rankedGaps.filter((item) => item.averageGap > 0 || item.leaderGap > 0);
  const primaryGap = positiveGaps[0];
  const secondaryGap = positiveGaps[1];

  if (!primaryGap) {
    return locale === "ko"
      ? `실제 경쟁사 ${benchmark.analyzedCompetitorCount}곳 분석 기준으로는 모든 핵심 영역이 전반적으로 비슷한 수준입니다. 지금은 큰 비교 열세보다 현재 강점을 유지하면서 성능과 보안 같은 기본기를 계속 다지는 편이 좋습니다.`
      : `Across ${benchmark.analyzedCompetitorCount} live competitor analyses, the core categories are broadly in line. There is no large comparison deficit right now, so the next move is to preserve current strengths while tightening fundamentals like performance and security.`;
  }

  const primaryLabel = categoryLabels[locale][primaryGap.category];
  const secondaryLabel = secondaryGap ? categoryLabels[locale][secondaryGap.category] : null;

  if (locale === "ko") {
    return `실제 경쟁사 ${benchmark.analyzedCompetitorCount}곳 분석 기준으로 ${primaryLabel}${
      secondaryLabel ? `와 ${secondaryLabel}` : ""
    }에서 평균 격차가 가장 큽니다. 현재 ${primaryLabel}는 경쟁사 평균 대비 ${primaryGap.averageGap}점, 상위 경쟁사 대비 ${primaryGap.leaderGap}점 뒤처져 있어 이 영역을 먼저 줄이는 편이 가장 효과적입니다.`;
  }

  return `Across ${benchmark.analyzedCompetitorCount} live competitor analyses, ${primaryLabel}${
    secondaryLabel ? ` and ${secondaryLabel}` : ""
  } show the widest average gap. ${primaryLabel} is currently ${primaryGap.averageGap} points behind the competitor average and ${primaryGap.leaderGap} points behind the category leader, so closing that category first should create the clearest competitive lift.`;
}
