import { NextResponse } from "next/server";
import { runSinglePageAnalysis } from "@/lib/analyzers/run-analysis";
import { persistAnalysisRun } from "@/lib/persistence/analysis-store";
import { hasDatabaseUrl } from "@/lib/persistence/database";
import type { SummaryLocale } from "@/types/analysis";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type ScheduledTarget = {
  id: string;
  sourceUrl: string;
  user: {
    email: string;
    name: string | null;
    image: string | null;
  };
  competitors: {
    id: string;
    sourceUrl: string;
  }[];
};

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function persistFailure(target: ScheduledTarget, error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  return persistAnalysisRun({
    projectId: target.id,
    url: target.sourceUrl,
    status: "failed",
    user: target.user,
    errorCode: message,
    errorMessage: "Scheduled analysis failed.",
  }).catch(() => ({ persisted: false, reason: "PERSISTENCE_FAILED" }));
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, errorCode: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { ok: false, errorCode: "DATABASE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const locale: SummaryLocale = url.searchParams.get("locale") === "en" ? "en" : "ko";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20), 1), 50);
  const { prisma } = await import("@/lib/db");
  const targets: ScheduledTarget[] = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      sourceUrl: true,
      user: {
        select: {
          email: true,
          name: true,
          image: true,
        },
      },
      competitors: {
        select: {
          id: true,
          sourceUrl: true,
        },
      },
    },
  });
  const results = [];

  for (const target of targets) {
    try {
      const result = await runSinglePageAnalysis(target.sourceUrl, locale);
      const persistence = await persistAnalysisRun({
        projectId: target.id,
        url: target.sourceUrl,
        status: "succeeded",
        user: target.user,
        result,
      });

      let competitorSucceeded = 0;
      let competitorFailed = 0;

      for (const competitor of target.competitors) {
        try {
          const competitorResult = await runSinglePageAnalysis(competitor.sourceUrl, locale);

          await persistAnalysisRun({
            projectId: target.id,
            competitorSiteId: competitor.id,
            url: competitor.sourceUrl,
            status: "succeeded",
            user: target.user,
            result: competitorResult,
            trackHistory: false,
          });
          competitorSucceeded += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

          await persistAnalysisRun({
            projectId: target.id,
            competitorSiteId: competitor.id,
            url: competitor.sourceUrl,
            status: "failed",
            user: target.user,
            errorCode: message,
            errorMessage: "Scheduled competitor analysis failed.",
            trackHistory: false,
          }).catch(() => ({ persisted: false, reason: "PERSISTENCE_FAILED" }));
          competitorFailed += 1;
        }
      }

      results.push({
        projectId: target.id,
        status: "succeeded",
        analysisResultId: persistence.persisted ? persistence.analysisResultId : null,
        competitorSucceeded,
        competitorFailed,
      });
    } catch (error) {
      await persistFailure(target, error);
      results.push({
        projectId: target.id,
        status: "failed",
        errorCode: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    analyzedProjects: results.length,
    succeededProjects: results.filter((result) => result.status === "succeeded").length,
    failedProjects: results.filter((result) => result.status === "failed").length,
    results,
  });
}
