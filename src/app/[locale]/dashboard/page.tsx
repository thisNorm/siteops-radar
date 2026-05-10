import { redirect } from "next/navigation";
import { getWorkspaceOverview } from "@/lib/workspace/overview";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const overview = await getWorkspaceOverview();

  if (overview.identity && (overview.projects.length > 0 || overview.errorCode)) {
    redirect(`/${locale}/dashboard/sites` as never);
  }

  redirect(`/${locale}/dashboard/preview` as never);
}
