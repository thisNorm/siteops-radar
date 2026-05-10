import { afterEach, describe, expect, it } from "vitest";
import { buildCompetitorGapInsights } from "@/lib/analysis/competitor-gap";
import {
  generateAnalysisSummary,
  generateTemplateAnalysisSummary,
} from "@/lib/ai/summary-adapter";
import { sampleAnalysis } from "@/lib/analyzers/mock";

const originalEnv = {
  LLM_API_KEY: process.env.LLM_API_KEY,
  LLM_MODEL: process.env.LLM_MODEL,
  LLM_BASE_URL: process.env.LLM_BASE_URL,
  LLM_TEMPERATURE: process.env.LLM_TEMPERATURE,
};

afterEach(() => {
  process.env.LLM_API_KEY = originalEnv.LLM_API_KEY;
  process.env.LLM_MODEL = originalEnv.LLM_MODEL;
  process.env.LLM_BASE_URL = originalEnv.LLM_BASE_URL;
  process.env.LLM_TEMPERATURE = originalEnv.LLM_TEMPERATURE;
});

describe("summary adapter", () => {
  it("builds deterministic localized summaries when no LLM is configured", async () => {
    delete process.env.LLM_API_KEY;

    const summary = await generateAnalysisSummary({
      requestedLocale: "ko",
      snapshot: sampleAnalysis.snapshot,
      scores: sampleAnalysis.scores,
      findings: sampleAnalysis.findings,
      recommendations: sampleAnalysis.recommendations,
    });

    expect(summary.model).toBe("template-mvp");
    expect(summary.requestedLocale).toBe("ko");
    expect(summary.ko.overview).toContain("종합 점수");
    expect(summary.en.overview).toContain("overall");
    expect(summary.ko.competitorGapNarrative.length).toBeGreaterThan(20);
    expect(summary.en.keyRisks).toHaveLength(2);
  });

  it("supports explicit fallback model overrides", () => {
    const summary = generateTemplateAnalysisSummary({
      requestedLocale: "en",
      snapshot: sampleAnalysis.snapshot,
      scores: sampleAnalysis.scores,
      findings: sampleAnalysis.findings,
      recommendations: sampleAnalysis.recommendations,
      modelOverride: "template-fallback",
    });

    expect(summary.model).toBe("template-fallback");
    expect(summary.en.nextActions[0]).toContain("Security");
  });
});

describe("competitor gap insights", () => {
  it("derives competitor deltas from recommendation signals", () => {
    const insights = buildCompetitorGapInsights(
      sampleAnalysis.scores,
      sampleAnalysis.recommendations,
    );

    const aeogeo = insights.find((item) => item.category === "aeogeo");
    const security = insights.find((item) => item.category === "security");

    expect(insights[0].gap).toBeGreaterThanOrEqual(insights[1].gap);
    expect(aeogeo?.competitor).toBeGreaterThan(sampleAnalysis.scores.aeogeo);
    expect(security?.competitor).toBeGreaterThan(sampleAnalysis.scores.security);
  });
});
