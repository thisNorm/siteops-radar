import {
  Prisma,
  RecommendationCategory as DbRecommendationCategory,
  Severity as DbSeverity,
} from "@prisma/client";
import type {
  AnalysisCategory,
  AnalyzerResult,
  Finding,
  Recommendation,
  Severity,
} from "@/types/analysis";

type PersistInput = {
  url: string;
  status: "succeeded" | "partial" | "failed";
  result?: AnalyzerResult;
  errorCode?: string;
  errorMessage?: string;
};

const demoUserEmail = "demo@siteopsradar.local";

function hasDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  return Boolean(url && !url.includes("user:password") && !url.includes("postgres:postgres"));
}

const categoryMap: Record<AnalysisCategory, DbRecommendationCategory> = {
  performance: DbRecommendationCategory.performance,
  seo: DbRecommendationCategory.seo,
  aeogeo: DbRecommendationCategory.aeogeo,
  security: DbRecommendationCategory.security,
  accessibility: DbRecommendationCategory.accessibility,
  contentQuality: DbRecommendationCategory.contentQuality,
  technicalHealth: DbRecommendationCategory.technicalHealth,
};

const severityMap: Record<Severity, DbSeverity> = {
  info: DbSeverity.info,
  low: DbSeverity.low,
  medium: DbSeverity.medium,
  high: DbSeverity.high,
  critical: DbSeverity.critical,
};

function toPrismaCategory(category: AnalysisCategory) {
  return categoryMap[category];
}

function toPrismaSeverity(severity: Severity) {
  return severityMap[severity];
}

function partitionFindings(findings: Finding[]) {
  return {
    security: findings.filter((finding) => finding.category === "security"),
    seo: findings.filter((finding) => finding.category === "seo"),
    aeogeo: findings.filter((finding) => finding.category === "aeogeo"),
  };
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function persistAnalysisRun(input: PersistInput) {
  if (!hasDatabaseUrl()) {
    return {
      persisted: false,
      reason: "DATABASE_URL_NOT_CONFIGURED",
    };
  }

  const { prisma } = await import("@/lib/db");
  const result = input.result;
  const now = new Date();
  const finalUrl = result?.snapshot.finalUrl ?? input.url;
  const normalizedUrl = finalUrl.replace(/\/$/, "");

  const user = await prisma.user.upsert({
    where: { email: demoUserEmail },
    update: {},
    create: {
      email: demoUserEmail,
      name: "Demo User",
    },
  });

  const project = await prisma.project.upsert({
    where: {
      userId_normalizedUrl: {
        userId: user.id,
        normalizedUrl,
      },
    },
    update: {
      sourceUrl: input.url,
      updatedAt: now,
    },
    create: {
      userId: user.id,
      name: new URL(finalUrl).hostname,
      sourceUrl: input.url,
      normalizedUrl,
    },
  });

  const created = await prisma.analysisResult.create({
    data: {
      projectId: project.id,
      status: input.status,
      sourceUrl: input.url,
      finalUrl,
      httpStatus: result?.snapshot.httpStatus,
      durationMs: undefined,
      scores: toJson(result?.scores ?? {}),
      findings: toJson(result?.findings ?? []),
      recommendations: toJson(result?.recommendations ?? []),
      rawSnapshot: toJson(result?.snapshot ?? {}),
      startedAt: now,
      finishedAt: now,
      errorCode: input.errorCode,
      errorMessage: input.errorMessage,
    },
  });

  if (result) {
    const scoreEntries = Object.entries(result.scores).filter(
      ([key]) => key !== "overall",
    ) as [AnalysisCategory, number][];

    await prisma.analysisScore.createMany({
      data: scoreEntries.map(([category, score]) => ({
        analysisResultId: created.id,
        category: toPrismaCategory(category),
        score,
      })),
    });

    await prisma.improvementRecommendation.createMany({
      data: result.recommendations.map((recommendation: Recommendation) => ({
        analysisResultId: created.id,
        category: toPrismaCategory(recommendation.category),
        severity: toPrismaSeverity(recommendation.severity),
        title: recommendation.title,
        description: recommendation.description,
        impact: recommendation.impact,
        effort: recommendation.effort,
        competitorGap: recommendation.competitorGap,
        priorityScore: recommendation.priorityScore,
        expectedImprovement: recommendation.expectedImprovement,
      })),
    });

    const findings = partitionFindings(result.findings);

    await prisma.securityFinding.createMany({
      data: findings.security.map((finding) => ({
        analysisResultId: created.id,
        severity: toPrismaSeverity(finding.severity),
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence ? toJson(finding.evidence) : undefined,
      })),
    });

    await prisma.seoFinding.createMany({
      data: findings.seo.map((finding) => ({
        analysisResultId: created.id,
        severity: toPrismaSeverity(finding.severity),
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence ? toJson(finding.evidence) : undefined,
      })),
    });

    await prisma.aeoGeoFinding.createMany({
      data: findings.aeogeo.map((finding) => ({
        analysisResultId: created.id,
        severity: toPrismaSeverity(finding.severity),
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence ? toJson(finding.evidence) : undefined,
      })),
    });

    await prisma.aiSummary.create({
      data: {
        analysisResultId: created.id,
        locale: "ko",
        summary: `${result.summary.ko.overview}\n\n${result.summary.ko.competitorGapNarrative}`,
        keyRisks: toJson(result.summary.ko.keyRisks),
        nextActions: toJson(result.summary.ko.nextActions),
        model: result.summary.model,
      },
    });

    await prisma.aiSummary.create({
      data: {
        analysisResultId: created.id,
        locale: "en",
        summary: `${result.summary.en.overview}\n\n${result.summary.en.competitorGapNarrative}`,
        keyRisks: toJson(result.summary.en.keyRisks),
        nextActions: toJson(result.summary.en.nextActions),
        model: result.summary.model,
      },
    });

    await prisma.analysisHistory.create({
      data: {
        projectId: project.id,
        analysisResultId: created.id,
        overallScore: result.scores.overall,
      },
    });
  }

  return {
    persisted: true,
    projectId: project.id,
    analysisResultId: created.id,
  };
}
