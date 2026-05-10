import { AppShell } from "@/components/layout/app-shell";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { sampleAnalysis } from "@/lib/analyzers/mock";

export default async function DashboardPage() {
  return (
    <AppShell>
      <DashboardView initialResult={sampleAnalysis} />
    </AppShell>
  );
}
