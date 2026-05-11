import { redirect } from "next/navigation";
import { toDashboardProjectOptions } from "@/components/dashboard/dashboard-project-options";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import {
  getDashboardPreviewPath,
  getDashboardSitesPath,
} from "@/lib/app-routes";
import type { Locale } from "@/i18n/routing";
import { sampleAnalysis } from "@/lib/analyzers/mock";
import { requireCurrentUser } from "@/lib/auth/session";
import { getProjectDashboardContext } from "@/lib/persistence/project-store";
import { getWorkspaceOverview } from "@/lib/workspace/overview";

export const dynamic = "force-dynamic";

export default async function DashboardProjectPage({
  params,
}: {
  params: Promise<{ locale: Locale; projectId: string }>;
}) {
  const { locale, projectId } = await params;
  const overview = await getWorkspaceOverview();

  if (!overview.identity) {
    redirect(getDashboardPreviewPath(locale) as never);
  }

  const user = await requireCurrentUser();

  if (!user) {
    redirect(getDashboardPreviewPath(locale) as never);
  }

  const projectContext = await getProjectDashboardContext(user.id, projectId);

  if (!projectContext) {
    redirect(getDashboardSitesPath(locale) as never);
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
