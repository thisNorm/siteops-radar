import { redirect } from "next/navigation";
import { toDashboardProjectOptions } from "@/components/dashboard/dashboard-project-options";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardPreviewPath } from "@/lib/app-routes";
import type { Locale } from "@/i18n/routing";
import { sampleAnalysis } from "@/lib/analyzers/mock";
import { getWorkspaceOverview } from "@/lib/workspace/overview";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardSitesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const overview = await getWorkspaceOverview();

  if (!overview.identity) {
    redirect(getDashboardPreviewPath(locale) as never);
  }

  if (!overview.errorCode && overview.projects.length === 0) {
    redirect(getDashboardPreviewPath(locale) as never);
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
