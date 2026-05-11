import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardSitesPath } from "@/lib/app-routes";
import type { Locale } from "@/i18n/routing";
import { sampleAnalysis } from "@/lib/analyzers/mock";
import { getWorkspaceOverview } from "@/lib/workspace/overview";

export const dynamic = "force-dynamic";

export default async function DashboardPreviewPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const overview = await getWorkspaceOverview();

  if (overview.identity && (overview.projects.length > 0 || overview.errorCode)) {
    redirect(getDashboardSitesPath(locale) as never);
  }

  return (
    <AppShell>
      <DashboardView
        initialResult={sampleAnalysis}
        initialAuthenticated={Boolean(overview.identity)}
        initialUserName={overview.identity?.name ?? null}
        routeKind="preview"
        initialAnalysisMode="sample"
      />
    </AppShell>
  );
}
