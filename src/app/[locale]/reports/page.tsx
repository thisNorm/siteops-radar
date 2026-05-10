import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ReportsPage() {
  const t = await getTranslations();

  return (
    <AppShell>
      <Card>
        <CardHeader>
          <CardTitle>{t("nav.reports")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Report export, scheduled audits, and shareable snapshots will be built after
          persisted analysis history is connected.
        </CardContent>
      </Card>
    </AppShell>
  );
}
