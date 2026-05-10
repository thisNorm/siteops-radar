import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import type { DashboardProjectOption } from "@/components/dashboard/dashboard-view-types";
import { sampleAnalysis } from "@/lib/analyzers/mock";
import { requireCurrentUser } from "@/lib/auth/session";
import { getProjectDashboardContext } from "@/lib/persistence/project-store";
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

export default async function DashboardProjectPage({
  params,
}: {
  params: Promise<{ locale: string; projectId: string }>;
}) {
  const { locale, projectId } = await params;
  const overview = await getWorkspaceOverview();

  if (!overview.identity) {
    redirect(`/${locale}/dashboard/preview` as never);
  }

  const user = await requireCurrentUser();

  if (!user) {
    redirect(`/${locale}/dashboard/preview` as never);
  }

  const projectContext = await getProjectDashboardContext(user.id, projectId);

  if (!projectContext) {
    redirect(`/${locale}/dashboard/sites` as never);
  }

  const initialProjectOptions = toDashboardProjectOptions(overview.projects);

  if (!initialProjectOptions.some((project) => project.id === projectContext.project.id)) {
    initialProjectOptions.push({
      id: projectContext.project.id,
      name: projectContext.project.name,
      url: projectContext.project.url,
      lastAnalyzedAt: projectContext.latestAnalyzedAt ?? undefined,
      hasAnalysis: Boolean(projectContext.latestResult),
      latestScores: projectContext.latestResult?.scores,
    });
  }

  return (
    <AppShell>
      <DashboardView
        initialResult={projectContext.latestResult ?? sampleAnalysis}
        initialAuthenticated
        initialUserName={overview.identity.name ?? null}
        initialProjectOptions={initialProjectOptions}
        routeKind="site-detail"
        initialAnalysisMode={projectContext.latestResult ? "managed" : "managed-empty"}
        initialSelectedProjectId={projectContext.project.id}
        initialLastAnalyzedAt={projectContext.latestAnalyzedAt}
        initialHasHistory={projectContext.hasHistory}
      />
    </AppShell>
  );
}
