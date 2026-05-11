import { NextResponse } from "next/server";
import { getPublicProjectDashboardContext } from "@/lib/persistence/project-store";
import { hasDatabaseUrl } from "@/lib/persistence/database";

function filenameFromProjectName(name: string) {
  return `${name.toLowerCase().replace(/[^a-z0-9가-힣]+/gi, "-").replace(/^-|-$/g, "") || "siteops-report"}.json`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { errorCode: "DATABASE_NOT_CONFIGURED", errorMessage: "Workspace storage is not configured." },
      { status: 503 },
    );
  }

  const { projectId } = await params;
  const report = await getPublicProjectDashboardContext(projectId);

  if (!report || !report.latestResult) {
    return NextResponse.json(
      { errorCode: "REPORT_NOT_FOUND", errorMessage: "The report could not be found." },
      { status: 404 },
    );
  }

  return new NextResponse(
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        project: report.project,
        latestAnalyzedAt: report.latestAnalyzedAt,
        scores: report.latestResult.scores,
        findings: report.latestResult.findings,
        recommendations: report.latestResult.recommendations,
        summary: report.latestResult.summary,
        competitorBenchmark: report.competitorBenchmark,
        scoreTrend: report.scoreTrend,
      },
      null,
      2,
    ),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="${filenameFromProjectName(report.project.name)}"`,
      },
    },
  );
}
