import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAdminEmails, getAuthBaseUrl, getGoogleCallbackUrl, isAdminEmail } from "@/lib/auth/access";
import { hasDatabaseUrl } from "@/lib/persistence/database";

async function getAdminOverview() {
  if (!hasDatabaseUrl()) {
    return null;
  }

  const { prisma } = await import("@/lib/db");
  const [users, projects, competitors, analyses, latestAnalyses] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.competitorSite.count(),
    prisma.analysisResult.count(),
    prisma.analysisResult.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        status: true,
        createdAt: true,
        sourceUrl: true,
        project: {
          select: {
            name: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    users,
    projects,
    competitors,
    analyses,
    latestAnalyses,
  };
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const user = await requireCurrentUser();

  if (!user?.email) {
    redirect({ href: "/sign-in", locale });
    return null;
  }

  if (!isAdminEmail(user.email)) {
    redirect({ href: "/dashboard", locale });
    return null;
  }

  const overview = await getAdminOverview();
  const authBaseUrl = getAuthBaseUrl();
  const googleCallbackUrl = getGoogleCallbackUrl();

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="space-y-3">
          <Badge variant="outline">Admin</Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            {locale === "ko" ? "관리자 콘솔" : "Admin console"}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
            {locale === "ko"
              ? "운영자 계정으로 서비스 상태, Google OAuth 설정, 최근 분석 흐름을 한 번에 확인합니다."
              : "Review service health, Google OAuth configuration, and recent analysis activity from the operator view."}
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: locale === "ko" ? "사용자" : "Users",
              value: overview?.users ?? 0,
            },
            {
              label: locale === "ko" ? "프로젝트" : "Projects",
              value: overview?.projects ?? 0,
            },
            {
              label: locale === "ko" ? "경쟁 사이트" : "Competitors",
              value: overview?.competitors ?? 0,
            },
            {
              label: locale === "ko" ? "분석 실행" : "Analysis runs",
              value: overview?.analyses ?? 0,
            },
          ].map((metric) => (
            <Card key={metric.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{metric.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{metric.value}</div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
          <Card>
            <CardHeader>
              <CardTitle>{locale === "ko" ? "OAuth 설정" : "OAuth configuration"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="font-medium">{locale === "ko" ? "관리자 이메일" : "Admin emails"}</div>
                <p className="mt-1 break-all text-muted-foreground">
                  {getAdminEmails().join(", ") || "-"}
                </p>
              </div>
              <Separator />
              <div>
                <div className="font-medium">{locale === "ko" ? "Auth 기본 URL" : "Auth base URL"}</div>
                <p className="mt-1 break-all text-muted-foreground">{authBaseUrl || "-"}</p>
              </div>
              <div>
                <div className="font-medium">
                  {locale === "ko" ? "Google 콜백 URI" : "Google callback URI"}
                </div>
                <p className="mt-1 break-all text-muted-foreground">{googleCallbackUrl || "-"}</p>
              </div>
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                {locale === "ko"
                  ? "Google Cloud Console의 OAuth 클라이언트에 위 콜백 URI를 Authorized redirect URI로 정확히 등록해야 합니다."
                  : "Register the callback URI above as an Authorized redirect URI in the Google Cloud Console OAuth client."}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{locale === "ko" ? "최근 분석 흐름" : "Recent analysis activity"}</CardTitle>
            </CardHeader>
            <CardContent>
              {!overview ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "ko"
                    ? "DATABASE_URL이 없어서 운영 통계를 읽을 수 없습니다."
                    : "Operational stats are unavailable because DATABASE_URL is not configured."}
                </p>
              ) : overview.latestAnalyses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "ko" ? "아직 분석 기록이 없습니다." : "No analysis runs yet."}
                </p>
              ) : (
                <div className="divide-y rounded-lg border">
                  {overview.latestAnalyses.map((item) => (
                    <div key={item.id} className="grid gap-2 p-4 md:grid-cols-[1.2fr_1fr_auto] md:items-center">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{item.project.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{item.sourceUrl}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {item.project.user.email}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(item.createdAt)}
                      </div>
                      <Badge
                        variant={
                          item.status === "failed"
                            ? "destructive"
                            : item.status === "partial"
                              ? "outline"
                              : "secondary"
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
