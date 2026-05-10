import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { sampleAnalysis } from "@/lib/analyzers/mock";
import { getWorkspaceOverview } from "@/lib/workspace/overview";

export default async function DashboardPreviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const overview = await getWorkspaceOverview();

  if (overview.identity && (overview.projects.length > 0 || overview.errorCode)) {
    redirect(`/${locale}/dashboard/sites` as never);
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
