import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSessionIdentity } from "@/lib/auth/session";
import { runSinglePageAnalysis } from "@/lib/analyzers/run-analysis";
import { sampleAnalysis } from "@/lib/analyzers/mock";
import { persistAnalysisRun } from "@/lib/persistence/analysis-store";

const requestSchema = z.object({
  url: z.string().min(4),
  locale: z.enum(["ko", "en"]).default("ko"),
  projectId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const currentUser = await getCurrentSessionIdentity();

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

  async function persistManagedRun(input: {
    status: "succeeded" | "partial" | "failed";
    result?: typeof sampleAnalysis;
    errorCode?: string;
    errorMessage?: string;
  }) {
    if (!currentUser) {
      return {
        persisted: false,
        reason: "AUTH_REQUIRED_FOR_PERSISTENCE",
      };
    }

    if (!data.projectId) {
      return {
        persisted: false,
        reason: "PROJECT_REQUIRED_FOR_PERSISTENCE",
      };
    }

    return persistAnalysisRun({
      projectId: data.projectId,
      url: data.url,
      status: input.status,
      user: currentUser,
      result: input.result,
      errorCode: input.errorCode,
      errorMessage: input.errorMessage,
    });
  }

  try {
    const result = await runSinglePageAnalysis(data.url, data.locale);
    const persistence = await persistManagedRun({
      status: "succeeded",
      result,
    });

    return NextResponse.json({
      status: "succeeded",
      result,
      persistence,
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
