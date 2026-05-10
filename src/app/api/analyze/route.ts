import { NextResponse } from "next/server";
import { z } from "zod";
import { runSinglePageAnalysis } from "@/lib/analyzers/run-analysis";
import { sampleAnalysis } from "@/lib/analyzers/mock";
import { persistAnalysisRun } from "@/lib/persistence/analysis-store";

const requestSchema = z.object({
  url: z.string().min(4),
  locale: z.enum(["ko", "en"]).default("ko"),
});

export async function POST(request: Request) {
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
    const persistence = await persistAnalysisRun({
      url: parsed.data.url,
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
      const persistence = await persistAnalysisRun({
        url: parsed.data.url,
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

    const persistence = await persistAnalysisRun({
      url: parsed.data.url,
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
