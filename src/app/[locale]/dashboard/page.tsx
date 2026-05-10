import { getWorkspaceOverview } from "@/lib/workspace/overview";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { sampleAnalysis } from "@/lib/analyzers/mock";
import type { DashboardProjectOption } from "@/components/dashboard/dashboard-view-types";

export default async function DashboardPage() {
  const overview = await getWorkspaceOverview();
  const initialProjectOptions: DashboardProjectOption[] = overview.projects.map((project) => ({
    id: project.id,
    name: project.name,
    url: project.url,
    lastAnalyzedAt: project.lastAnalyzedAt,
    hasAnalysis: Boolean(project.runs.length),
    latestScores: project.latestScores,
  }));

  return (
    <AppShell>
      <DashboardView
        initialResult={sampleAnalysis}
        initialAuthenticated={Boolean(overview.identity)}
        initialUserName={overview.identity?.name ?? null}
        initialProjectOptions={initialProjectOptions}
      />
    </AppShell>
  );
}
