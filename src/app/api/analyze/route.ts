import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSessionIdentity } from "@/lib/auth/session";
import { runSinglePageAnalysis } from "@/lib/analyzers/run-analysis";
import { sampleAnalysis } from "@/lib/analyzers/mock";
import { persistAnalysisRun } from "@/lib/persistence/analysis-store";

const requestSchema = z.object({
  url: z.string().min(4),
  locale: z.enum(["ko", "en"]).default("ko"),
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

  try {
    const result = await runSinglePageAnalysis(parsed.data.url, parsed.data.locale);
    const persistence = currentUser
      ? await persistAnalysisRun({
          url: parsed.data.url,
          status: "succeeded",
          user: currentUser,
          result,
        })
      : {
          persisted: false,
          reason: "AUTH_REQUIRED_FOR_PERSISTENCE",
        };

    return NextResponse.json({
      status: "succeeded",
      result,
      persistence,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (message.startsWith("BLOCKED") || message === "INVALID_URL") {
      const persistence = currentUser
        ? await persistAnalysisRun({
            url: parsed.data.url,
            status: "failed",
            user: currentUser,
            errorCode: message,
            errorMessage: "The submitted URL is not allowed.",
          }).catch(() => ({ persisted: false, reason: "PERSISTENCE_FAILED" }))
        : {
            persisted: false,
            reason: "AUTH_REQUIRED_FOR_PERSISTENCE",
          };

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

    const persistence = currentUser
      ? await persistAnalysisRun({
          url: parsed.data.url,
          status: "partial",
          user: currentUser,
          result: sampleAnalysis,
          errorCode: message,
          errorMessage: "Live analysis failed. Showing a deterministic fallback result.",
        }).catch(() => ({ persisted: false, reason: "PERSISTENCE_FAILED" }))
      : {
          persisted: false,
          reason: "AUTH_REQUIRED_FOR_PERSISTENCE",
        };

    return NextResponse.json({
      status: "partial",
      errorCode: message,
      errorMessage: "Live analysis failed. Showing a deterministic fallback result.",
      result: sampleAnalysis,
      persistence,
    });
  }
}
