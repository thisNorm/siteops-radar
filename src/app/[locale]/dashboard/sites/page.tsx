import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import type { DashboardProjectOption } from "@/components/dashboard/dashboard-view-types";
import { sampleAnalysis } from "@/lib/analyzers/mock";
import { getWorkspaceOverview } from "@/lib/workspace/overview";

function toDashboardProjectOptions(
  projects: Awaited<ReturnType<typeof getWorkspaceOverview>>["projects"],
): DashboardProjectOption[] {
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    url: project.url,
    lastAnalyzedAt: project.lastAnalyzedAt,
    hasAnalysis: Boolean(project.runs.length),
    latestScores: project.latestScores,
  }));
}

export default async function DashboardSitesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const overview = await getWorkspaceOverview();

  if (!overview.identity) {
    redirect(`/${locale}/dashboard/preview` as never);
  }

  if (!overview.errorCode && overview.projects.length === 0) {
    redirect(`/${locale}/dashboard/preview` as never);
  }

  return (
    <AppShell>
      <DashboardView
        initialResult={sampleAnalysis}
        initialAuthenticated
        initialUserName={overview.identity.name ?? null}
        initialProjectOptions={toDashboardProjectOptions(overview.projects)}
        routeKind="sites"
        initialAnalysisMode="project-list"
      />
    </AppShell>
  );
}
