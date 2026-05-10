import { describe, expect, it } from "vitest";
import { calculatePriorityScore, rankRecommendations } from "@/lib/recommendations/priority";

describe("recommendation priority", () => {
  it("uses severity, impact, inverse effort, and competitor gap", () => {
    expect(
      calculatePriorityScore({
        category: "security",
        severity: "high",
        title: "Add CSP",
        description: "Add a policy",
        impact: 4,
        effort: 2,
        competitorGap: 3,
        expectedImprovement: "Better security posture",
      }),
    ).toBe(3.9);
  });

  it("sorts highest priority first", () => {
    const ranked = rankRecommendations([
      {
        category: "seo",
        severity: "low",
        title: "Small fix",
        description: "Small fix",
        impact: 2,
        effort: 5,
        competitorGap: 0,
        expectedImprovement: "Minor improvement",
      },
      {
        category: "security",
        severity: "critical",
        title: "Critical fix",
        description: "Critical fix",
        impact: 5,
        effort: 1,
        competitorGap: 5,
        expectedImprovement: "Major risk reduction",
      },
    ]);

    expect(ranked[0].title).toBe("Critical fix");
  });
});
