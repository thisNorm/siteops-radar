import { getTranslations } from "next-intl/server";
import {
  Bell,
  Lock,
  Shield,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { WorkspaceInfoCard, WorkspaceStatCard } from "@/components/workspace/workspace-cards";
import {
  appRouteSegments,
  getDashboardSitesPath,
} from "@/lib/app-routes";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceOverview } from "@/lib/workspace/overview";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SettingsPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params;
  const isKo = locale === "ko";
  const overview = await getWorkspaceOverview();
  const t = await getTranslations();
  const totalRuns = overview.projects.reduce((total, project) => total + project.runs.length, 0);
  const competitorCount = overview.projects.reduce(
    (total, project) => total + project.competitors.length,
    0,
  );
  const initials = (overview.identity?.name ?? overview.identity?.email ?? "S")
    .charAt(0)
    .toUpperCase();

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="max-w-4xl space-y-3">
          <Badge variant="outline">{t("nav.settings")}</Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            {isKo ? "계정과 워크스페이스 상태를 한 번에 확인하세요" : "Review your account and workspace state in one place"}
          </h1>
          <p className="text-base leading-7 text-muted-foreground md:text-lg">
            {isKo
              ? "공개 워크스페이스 상태, 프로젝트 저장 방식, 분석 누적 규칙을 설정 페이지에서 바로 읽을 수 있게 정리했습니다."
              : "This settings view now summarizes open workspace state, storage behavior, and how analysis history accumulates."}
          </p>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.1fr_1.4fr]">
          <Card>
            <CardHeader>
              <CardTitle>{isKo ? "계정" : "Account"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-base font-medium">
                      {overview.identity?.name || (isKo ? "SiteOps 사용자" : "SiteOps user")}
                    </div>
                    {overview.identity?.isAdmin ? <Badge variant="outline">Admin</Badge> : null}
                  </div>
                  <div className="truncate text-sm text-muted-foreground">
                    {overview.identity?.email ?? (isKo ? "로그인 정보 없음" : "No active sign-in")}
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <WorkspaceInfoCard
                  icon={UserRound}
                  title={isKo ? "접근 권한" : "Access level"}
                  description={
                    overview.identity?.isAdmin
                      ? isKo
                        ? "현재 계정은 관리자 권한을 가지고 있어 admin 영역까지 접근할 수 있습니다."
                        : "This account has admin access and can enter the admin area."
                      : isKo
                        ? "프로젝트와 대시보드는 공개 워크스페이스 권한으로 바로 사용할 수 있습니다."
                        : "The dashboard and project workspace are available through open workspace access."
                  }
                />
                <WorkspaceInfoCard
                  icon={Lock}
                  title={isKo ? "오픈 접근" : "Open access"}
                  description={
                    isKo
                      ? "프로젝트, 리포트, 설정, 분석 상세는 로그인 없이 공개 워크스페이스에서 열립니다."
                      : "Projects, reports, settings, and analysis details are open in the public workspace without sign-in."
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isKo ? "워크스페이스 요약" : "Workspace summary"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                <WorkspaceStatCard
                  title={isKo ? "저장된 사이트" : "Saved sites"}
                  value={overview.projects.length}
                  description={isKo ? "현재 계정 기준 프로젝트 수" : "Projects currently saved for this account"}
                />
                <WorkspaceStatCard
                  title={isKo ? "경쟁사 추적" : "Competitor tracking"}
                  value={competitorCount}
                  description={isKo ? "프로젝트에 연결된 경쟁사 수" : "Competitors attached across your projects"}
                />
                <WorkspaceStatCard
                  title={isKo ? "저장된 분석 실행" : "Saved analysis runs"}
                  value={totalRuns}
                  description={isKo ? "프로젝트 기준으로 누적된 저장 실행 수" : "Persisted runs accumulated by managed projects"}
                />
                <WorkspaceStatCard
                  title={isKo ? "워크스페이스 저장소" : "Workspace storage"}
                  value={
                    overview.dbConfigured
                      ? isKo
                        ? "연결됨"
                        : "Connected"
                      : isKo
                        ? "미설정"
                        : "Not configured"
                  }
                  description={
                    overview.dbConfigured
                      ? isKo
                        ? "프로젝트와 분석 이력이 PostgreSQL에 저장됩니다."
                        : "Projects and analysis history are being persisted in PostgreSQL."
                      : isKo
                        ? "DB 연결 후 프로젝트 이력과 리포트 누적이 활성화됩니다."
                        : "Project history and report accumulation activate once the database is connected."
                  }
                />
              </CardContent>
            </Card>
          </section>

        {overview.errorCode ? (
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle>{isKo ? "워크스페이스 상태를 완전히 읽지 못했습니다" : "Workspace status is only partially available"}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {isKo
                ? "워크스페이스 정보는 확인되었지만 저장소 응답이 불안정해 일부 지표는 비어 있을 수 있습니다."
                : "Workspace identity is available, but storage did not respond fully so some metrics may be empty."}
            </CardContent>
          </Card>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>{isKo ? "현재 워크스페이스 규칙" : "Current workspace rules"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <WorkspaceInfoCard
                  icon={Shield}
                  title={isKo ? "저장 기준" : "Persistence rules"}
                  description={
                    isKo
                      ? "상단 검색에서 하는 단순 분석은 현재 점수만 보여주고, 프로젝트에 추가한 사이트만 히스토리와 추이를 쌓습니다."
                      : "Top-bar ad hoc searches show only the current score, while only project-managed sites accumulate history and trends."
                  }
                />
                <WorkspaceInfoCard
                  icon={Sparkles}
                  title={isKo ? "대시보드 동작" : "Dashboard behavior"}
                  description={
                    isKo
                      ? "저장된 사이트가 하나라도 있으면 예시 데이터 대신 사이트 카드가 우선 노출되고, 각 사이트에서 상세 대시보드로 진입합니다."
                      : "Once saved sites exist, the dashboard switches from sample data to project cards and lets you enter each site's detailed dashboard."
                  }
                />
                <WorkspaceInfoCard
                  icon={Bell}
                  title={isKo ? "리포트/알림 준비도" : "Reports and alerts readiness"}
                  description={
                    isKo
                      ? "현재는 저장된 분석과 AI 요약이 기본 리포트 재료이며, 예약 분석과 공유 가능한 리포트는 다음 단계로 이어집니다."
                      : "Saved analyses and AI summaries already form the base report layer; scheduled audits and shareable exports can build on top next."
                  }
                />
              </CardContent>
            </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isKo ? "바로 가기" : "Quick links"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={getDashboardSitesPath(locale)} className={buttonVariants({ variant: "outline", className: "w-full justify-start" })}>
                {isKo ? "대시보드 열기" : "Open dashboard"}
              </Link>
              <Link href={appRouteSegments.projects} className={buttonVariants({ variant: "outline", className: "w-full justify-start" })}>
                {isKo ? "프로젝트 관리" : "Manage projects"}
              </Link>
              <Link href={appRouteSegments.reports} className={buttonVariants({ className: "w-full justify-start" })}>
                {isKo ? "리포트 센터 보기" : "Open report center"}
              </Link>
              <WorkspaceInfoCard
                icon={Bell}
                title={isKo ? "다음 설정 확장" : "Next settings expansion"}
                description={
                  isKo
                    ? "여기에는 앞으로 알림 빈도, 예약 분석, 공유 범위 같은 실제 설정 항목을 이어서 붙일 수 있습니다."
                    : "This page is now ready for future real controls like alert frequency, scheduled audits, and sharing scope."
                }
                dashed
                mutedIcon
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
