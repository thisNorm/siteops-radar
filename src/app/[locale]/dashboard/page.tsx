import { redirect } from "next/navigation";
import { getDashboardPreviewPath, getDashboardSitesPath } from "@/lib/app-routes";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceOverview } from "@/lib/workspace/overview";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const overview = await getWorkspaceOverview();

  if (overview.identity && (overview.projects.length > 0 || overview.errorCode)) {
    redirect(getDashboardSitesPath(locale) as never);
  }

  redirect(getDashboardPreviewPath(locale) as never);
}
