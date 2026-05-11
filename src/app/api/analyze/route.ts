import { NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspaceIdentity, requireCurrentUser } from "@/lib/auth/session";
import { runSinglePageAnalysis } from "@/lib/analyzers/run-analysis";
import { sampleAnalysis } from "@/lib/analyzers/mock";
import { persistAnalysisRun } from "@/lib/persistence/analysis-store";
import { listCompetitorsForProject } from "@/lib/persistence/project-store";

const requestSchema = z.object({
  url: z.string().min(4),
  locale: z.enum(["ko", "en"]).default("ko"),
  projectId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const currentUser = await getWorkspaceIdentity();

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "failed",
        errorCode: "INVALID_REQUEST",
        errorMessage: "A valid URL is required.",
      },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const workspaceUser = data.projectId ? await requireCurrentUser() : null;

  async function persistManagedRun(input: {
    url?: string;
    competitorSiteId?: string;
    status: "succeeded" | "partial" | "failed";
    result?: typeof sampleAnalysis;
    errorCode?: string;
    errorMessage?: string;
    trackHistory?: boolean;
  }) {
    if (!data.projectId) {
      return {
        persisted: false,
        reason: "PROJECT_REQUIRED_FOR_PERSISTENCE",
      };
    }

    return persistAnalysisRun({
      projectId: data.projectId,
      competitorSiteId: input.competitorSiteId,
      trackHistory: input.trackHistory,
      url: input.url ?? data.url,
      status: input.status,
      user: currentUser,
      result: input.result,
      errorCode: input.errorCode,
      errorMessage: input.errorMessage,
    });
  }

  async function analyzeLinkedCompetitors() {
    if (!workspaceUser || !data.projectId) {
      return null;
    }

    const competitors = await listCompetitorsForProject(workspaceUser.id, data.projectId);

    if (!competitors) {
      return null;
    }

    const outcomes = await Promise.all(
      competitors.map(async (competitor) => {
        try {
          const result = await runSinglePageAnalysis(competitor.url, data.locale);
          await persistManagedRun({
            url: competitor.url,
            competitorSiteId: competitor.id,
            status: "succeeded",
            result,
            trackHistory: false,
          });

          return "succeeded" as const;
        } catch (error) {
          const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

          await persistManagedRun({
            url: competitor.url,
            competitorSiteId: competitor.id,
            status: "failed",
            errorCode: message,
            errorMessage: "Live competitor analysis failed.",
            trackHistory: false,
          }).catch(() => ({ persisted: false, reason: "PERSISTENCE_FAILED" }));

          return "failed" as const;
        }
      }),
    );

    return {
      linkedCount: competitors.length,
      analyzedCount: outcomes.filter((status) => status === "succeeded").length,
      failedCount: outcomes.filter((status) => status === "failed").length,
    };
  }

  try {
    const result = await runSinglePageAnalysis(data.url, data.locale);
    const persistence = await persistManagedRun({
      status: "succeeded",
      result,
    });
    const competitorAnalyses = await analyzeLinkedCompetitors();

    return NextResponse.json({
      status: "succeeded",
      result,
      persistence,
      competitorAnalyses,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (message.startsWith("BLOCKED") || message === "INVALID_URL") {
      const persistence = await persistManagedRun({
        status: "failed",
        errorCode: message,
        errorMessage: "The submitted URL is not allowed.",
      }).catch(() => ({ persisted: false, reason: "PERSISTENCE_FAILED" }));

      return NextResponse.json(
        {
          status: "failed",
          errorCode: message,
          errorMessage: "The submitted URL is not allowed.",
          persistence,
        },
        { status: 400 },
      );
    }

    const persistence = await persistManagedRun({
      status: "partial",
      result: sampleAnalysis,
      errorCode: message,
      errorMessage: "Live analysis failed. Showing a deterministic fallback result.",
    }).catch(() => ({ persisted: false, reason: "PERSISTENCE_FAILED" }));

    return NextResponse.json({
      status: "partial",
      errorCode: message,
      errorMessage: "Live analysis failed. Showing a deterministic fallback result.",
      result: sampleAnalysis,
      persistence,
    });
  }
}
