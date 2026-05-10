import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const t = await getTranslations();

  return (
    <AppShell>
      <Card>
        <CardHeader>
          <CardTitle>{t("nav.settings")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          API keys, Google login allowlists, scheduled analysis, and workspace settings
          will live here.
        </CardContent>
      </Card>
    </AppShell>
  );
}
