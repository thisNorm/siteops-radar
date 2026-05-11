import { describe, expect, it } from "vitest";
import {
  buildCompetitorBenchmark,
  buildMeasuredCompetitorNarrative,
  getMeasuredCompetitorGapLevel,
} from "@/lib/analysis/competitor-benchmark";
import { sampleAnalysis } from "@/lib/analyzers/mock";

describe("competitor benchmark", () => {
  it("aggregates linked competitor averages and leaders from live scores", () => {
    const benchmark = buildCompetitorBenchmark(
      [
        {
          ...sampleAnalysis.scores,
          performance: 82,
          seo: 76,
          aeogeo: 81,
          security: 83,
          accessibility: 75,
          contentQuality: 80,
          technicalHealth: 78,
          overall: 79,
        },
        {
          ...sampleAnalysis.scores,
          performance: 88,
          seo: 84,
          aeogeo: 85,
          security: 86,
          accessibility: 79,
          contentQuality: 82,
          technicalHealth: 81,
          overall: 84,
        },
      ],
      2,
    );

    expect(benchmark?.analyzedCompetitorCount).toBe(2);
    expect(benchmark?.linkedCompetitorCount).toBe(2);
    expect(benchmark?.categories).toHaveLength(7);
    expect(benchmark?.categories.find((item) => item.category === "performance")?.competitorAverage).toBe(85);
    expect(benchmark?.categories.find((item) => item.category === "performance")?.competitorLeader).toBe(88);
  });

  it("builds actual competitor narrative and gap levels from measured results", () => {
    const benchmark = buildCompetitorBenchmark(
      [
        {
          ...sampleAnalysis.scores,
          performance: 91,
          seo: 85,
          aeogeo: 89,
          security: 90,
          accessibility: 80,
          contentQuality: 84,
          technicalHealth: 83,
          overall: 86,
        },
      ],
      3,
    );

    expect(benchmark).not.toBeNull();

    const narrative = buildMeasuredCompetitorNarrative("ko", sampleAnalysis.scores, benchmark!);
    const aeogeoGapLevel = getMeasuredCompetitorGapLevel(
      sampleAnalysis.scores,
      benchmark!.categories.find((item) => item.category === "aeogeo")!,
    );

    expect(narrative).toContain("실제 경쟁사 1곳 분석 기준");
    expect(narrative).toContain("AEO/GEO");
    expect(aeogeoGapLevel).toBeGreaterThan(0);
  });
});
