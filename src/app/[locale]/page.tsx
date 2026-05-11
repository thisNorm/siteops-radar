import { redirect } from "@/i18n/navigation";
import { appRouteSegments } from "@/lib/app-routes";
import type { Locale } from "@/i18n/routing";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  redirect({ href: appRouteSegments.dashboardPreview, locale });
}
