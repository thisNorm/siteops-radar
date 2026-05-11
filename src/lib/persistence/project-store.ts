import type { AnalysisStatus } from "@prisma/client";
import {
  buildCompetitorBenchmark,
  buildMeasuredCompetitorNarrative,
} from "@/lib/analysis/competitor-benchmark";
import type { AnalysisScores, AnalyzerResult, CompetitorBenchmark } from "@/types/analysis";
import { normalizeUrl } from "@/lib/validators/url";
import { hasDatabaseUrl } from "./database";

type ProjectStatus = "idle" | "queued" | "running" | "succeeded" | "partial" | "failed";

export type WorkspaceProject = {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  lastAnalyzedAt?: string;
  latestScores?: AnalysisScores;
  competitorCount: number;
  competitors: {
    id: string;
    name: string;
    url: string;
  }[];
  lastStatus?: ProjectStatus;
  runs: {
    id: string;
    url: string;
    status: Exclude<ProjectStatus, "idle">;
    createdAt: string;
  }[];
};

export type ProjectDashboardContext = {
  project: {
    id: string;
    name: string;
    url: string;
    competitorCount: number;
  };
  latestResult: AnalyzerResult | null;
  latestAnalyzedAt: string | null;
  hasHistory: boolean;
  competitorBenchmark: CompetitorBenchmark | null;
};

function toProjectStatus(status: AnalysisStatus | null | undefined): ProjectStatus | undefined {
  if (!status) {
    return undefined;
  }

  return status;
}

function ensureDatabaseUrl() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL_NOT_CONFIGURED");
  }
}

function toAnalyzerResult(
  analysisResult: {
    scores: unknown;
    findings: unknown;
    recommendations: unknown;
    rawSnapshot: unknown;
    aiSummaries: {
      locale: string;
      summary: string;
      keyRisks: unknown;
      nextActions: unknown;
      model: string;
    }[];
  },
): AnalyzerResult {
  const localizedSummaries = new Map(
    analysisResult.aiSummaries.map((summary) => [summary.locale, summary]),
  );

  function readSummary(locale: "ko" | "en") {
    const stored = localizedSummaries.get(locale);
    const text = stored?.summary ?? "";
    const [overview, ...rest] = text.split("\n\n");

    return {
      overview: overview || text,
      competitorGapNarrative: rest.join("\n\n"),
      keyRisks: Array.isArray(stored?.keyRisks) ? (stored.keyRisks as string[]) : [],
      nextActions: Array.isArray(stored?.nextActions) ? (stored.nextActions as string[]) : [],
      model: stored?.model ?? "heuristic-mvp",
    };
  }

  const ko = readSummary("ko");
  const en = readSummary("en");

  return {
    snapshot: analysisResult.rawSnapshot as AnalyzerResult["snapshot"],
    scores: analysisResult.scores as AnalyzerResult["scores"],
    findings: analysisResult.findings as AnalyzerResult["findings"],
    recommendations: analysisResult.recommendations as AnalyzerResult["recommendations"],
    summary: {
      requestedLocale: "ko",
      model: ko.model || en.model,
      ko: {
        overview: ko.overview,
        keyRisks: ko.keyRisks,
        nextActions: ko.nextActions,
        competitorGapNarrative: ko.competitorGapNarrative,
      },
      en: {
        overview: en.overview,
        keyRisks: en.keyRisks,
        nextActions: en.nextActions,
        competitorGapNarrative: en.competitorGapNarrative,
      },
    },
  };
}

function readThumbnailUrl(rawSnapshot: unknown) {
  if (!rawSnapshot || typeof rawSnapshot !== "object") {
    return undefined;
  }

  const value = (rawSnapshot as { thumbnailImageUrl?: unknown }).thumbnailImageUrl;
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function listProjectsForUser(userId: string): Promise<WorkspaceProject[]> {
  ensureDatabaseUrl();
  const { prisma } = await import("@/lib/db");
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      competitors: {
        orderBy: { createdAt: "asc" },
      },
      analysisResults: {
        where: {
          competitorSiteId: null,
        },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          sourceUrl: true,
          status: true,
          createdAt: true,
          scores: true,
          rawSnapshot: true,
        },
      },
    },
  });

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    url: project.sourceUrl,
    thumbnailUrl: readThumbnailUrl(project.analysisResults[0]?.rawSnapshot),
    lastAnalyzedAt: project.analysisResults[0]?.createdAt.toISOString(),
    latestScores: project.analysisResults[0]?.scores as AnalysisScores | undefined,
    competitorCount: project.competitors.length,
    competitors: project.competitors.map((competitor) => ({
      id: competitor.id,
      name: competitor.name,
      url: competitor.sourceUrl,
    })),
    lastStatus: toProjectStatus(project.analysisResults[0]?.status) ?? "idle",
    runs: project.analysisResults.map((run) => ({
      id: run.id,
      url: run.sourceUrl,
      status: run.status,
      createdAt: run.createdAt.toISOString(),
    })),
  }));
}

export async function getProjectDashboardContext(
  userId: string,
  projectId: string,
): Promise<ProjectDashboardContext | null> {
  ensureDatabaseUrl();
  const { prisma } = await import("@/lib/db");
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    select: {
      id: true,
      name: true,
      sourceUrl: true,
      competitors: {
        select: {
          id: true,
          analysisResults: {
            where: {
              status: {
                in: ["succeeded", "partial"],
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            select: {
              scores: true,
            },
          },
        },
      },
      _count: {
        select: {
          history: true,
        },
      },
      analysisResults: {
        where: {
          competitorSiteId: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          createdAt: true,
          scores: true,
          findings: true,
          recommendations: true,
          rawSnapshot: true,
          aiSummaries: {
            select: {
              locale: true,
              summary: true,
              keyRisks: true,
              nextActions: true,
              model: true,
            },
          },
        },
      },
    },
  });

  if (!project) {
    return null;
  }

  const latestAnalysis = project.analysisResults[0];
  const latestResult = latestAnalysis ? toAnalyzerResult(latestAnalysis) : null;
  const competitorBenchmark = buildCompetitorBenchmark(
    project.competitors.flatMap((competitor) => {
      const latestCompetitorAnalysis = competitor.analysisResults[0];
      return latestCompetitorAnalysis
        ? [latestCompetitorAnalysis.scores as AnalysisScores]
        : [];
    }),
    project.competitors.length,
  );
  const latestResultWithBenchmark =
    latestResult && competitorBenchmark?.analyzedCompetitorCount
      ? {
          ...latestResult,
          summary: {
            ...latestResult.summary,
            ko: {
              ...latestResult.summary.ko,
              competitorGapNarrative: buildMeasuredCompetitorNarrative(
                "ko",
                latestResult.scores,
                competitorBenchmark,
              ),
            },
            en: {
              ...latestResult.summary.en,
              competitorGapNarrative: buildMeasuredCompetitorNarrative(
                "en",
                latestResult.scores,
                competitorBenchmark,
              ),
            },
          },
        }
      : latestResult;

  return {
    project: {
      id: project.id,
      name: project.name,
      url: project.sourceUrl,
      competitorCount: project.competitors.length,
    },
    latestResult: latestResultWithBenchmark,
    latestAnalyzedAt: latestAnalysis?.createdAt.toISOString() ?? null,
    hasHistory: project._count.history > 1,
    competitorBenchmark,
  };
}

export async function createProjectForUser(userId: string, input: { name: string; url: string }) {
  ensureDatabaseUrl();
  const { prisma } = await import("@/lib/db");
  const normalizedUrl = normalizeUrl(input.url).replace(/\/$/, "");
  const hostname = new URL(normalizedUrl).hostname;

  const project = await prisma.project.upsert({
    where: {
      userId_normalizedUrl: {
        userId,
        normalizedUrl,
      },
    },
    update: {
      name: input.name.trim() || hostname,
      sourceUrl: normalizedUrl,
      updatedAt: new Date(),
    },
    create: {
      userId,
      name: input.name.trim() || hostname,
      sourceUrl: normalizedUrl,
      normalizedUrl,
    },
  });

  return project;
}

export async function deleteProjectForUser(userId: string, projectId: string) {
  ensureDatabaseUrl();
  const { prisma } = await import("@/lib/db");
  const deleted = await prisma.project.deleteMany({
    where: {
      id: projectId,
      userId,
    },
  });

  return deleted.count > 0;
}

export async function addCompetitorForProject(
  userId: string,
  projectId: string,
  input: { name: string; url: string },
) {
  ensureDatabaseUrl();
  const { prisma } = await import("@/lib/db");
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    select: { id: true },
  });

  if (!project) {
    return null;
  }

  const normalizedUrl = normalizeUrl(input.url).replace(/\/$/, "");
  const hostname = new URL(normalizedUrl).hostname;

  return prisma.competitorSite.upsert({
    where: {
      projectId_normalizedUrl: {
        projectId: project.id,
        normalizedUrl,
      },
    },
    update: {
      name: input.name.trim() || hostname,
      sourceUrl: normalizedUrl,
      updatedAt: new Date(),
    },
    create: {
      projectId: project.id,
      name: input.name.trim() || hostname,
      sourceUrl: normalizedUrl,
      normalizedUrl,
    },
  });
}

export async function listCompetitorsForProject(userId: string, projectId: string) {
  ensureDatabaseUrl();
  const { prisma } = await import("@/lib/db");
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    select: {
      competitors: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          sourceUrl: true,
        },
      },
    },
  });

  if (!project) {
    return null;
  }

  return project.competitors.map((competitor) => ({
    id: competitor.id,
    name: competitor.name,
    url: competitor.sourceUrl,
  }));
}

export async function deleteCompetitorForProject(userId: string, projectId: string, competitorId: string) {
  ensureDatabaseUrl();
  const { prisma } = await import("@/lib/db");
  const deleted = await prisma.competitorSite.deleteMany({
    where: {
      id: competitorId,
      projectId,
      project: {
        userId,
      },
    },
  });

  return deleted.count > 0;
}
