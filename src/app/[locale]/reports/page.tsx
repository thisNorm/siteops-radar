import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  FolderKanban,
  LineChart,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Link } from "@/i18n/navigation";
import { getWorkspaceOverview } from "@/lib/workspace/overview";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ReportsPageProps = {
  params: Promise<{ locale: string }>;
};

function formatDate(date: string | undefined, locale: string) {
  if (!date) {
    return locale === "ko" ? "아직 없음" : "Not yet";
  }

  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function statusLabel(status: string | undefined, isKo: boolean) {
  switch (status) {
    case "succeeded":
      return isKo ? "정상 저장" : "Saved";
    case "partial":
      return isKo ? "부분 저장" : "Partial";
    case "failed":
      return isKo ? "실패" : "Failed";
    case "running":
      return isKo ? "분석 중" : "Running";
    case "queued":
      return isKo ? "대기 중" : "Queued";
    default:
      return isKo ? "아직 없음" : "Not started";
  }
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { locale } = await params;
  const isKo = locale === "ko";
  const overview = await getWorkspaceOverview();
  const projectsWithAnalysis = overview.projects
    .filter((project) => project.latestScores && project.lastAnalyzedAt)
    .sort((left, right) =>
      new Date(right.lastAnalyzedAt ?? 0).getTime() - new Date(left.lastAnalyzedAt ?? 0).getTime(),
    );
  const totalRuns = overview.projects.reduce((total, project) => total + project.runs.length, 0);
  const competitorCount = overview.projects.reduce(
    (total, project) => total + project.competitors.length,
    0,
  );
  const projectsWithHistory = overview.projects.filter((project) => project.runs.length > 1).length;
  const averageOverallScore = projectsWithAnalysis.length
    ? Math.round(
        projectsWithAnalysis.reduce(
          (total, project) => total + (project.latestScores?.overall ?? 0),
          0,
        ) / projectsWithAnalysis.length,
      )
    : null;
  const topProjects = projectsWithAnalysis.slice(0, 4);

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="max-w-4xl space-y-3">
          <Badge variant="outline">{isKo ? "리포트 센터" : "Report center"}</Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            {isKo ? "저장된 분석을 리포트처럼 한눈에 보세요" : "View saved analyses like a report center"}
          </h1>
          <p className="text-base leading-7 text-muted-foreground md:text-lg">
            {isKo
              ? "프로젝트별 최근 분석 상태, 준비된 스냅샷, 추이 누적 여부를 바로 확인할 수 있습니다."
              : "See each project's latest saved status, snapshot readiness, and whether historical trends are building up."}
          </p>
        </section>

        {!overview.dbConfigured ? (
          <Card className="border-amber-200/70 bg-amber-50/70">
            <CardHeader>
              <CardTitle>{isKo ? "워크스페이스 저장소가 아직 연결되지 않았습니다" : "Workspace storage is not connected yet"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                {isKo
                  ? "리포트 센터는 PostgreSQL에 저장된 프로젝트와 분석 이력을 기반으로 채워집니다."
                  : "The report center is powered by projects and saved analysis history stored in PostgreSQL."}
              </p>
              <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
                {isKo ? "대시보드로 이동" : "Go to dashboard"}
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {overview.errorCode ? (
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle>{isKo ? "리포트 데이터를 불러오지 못했습니다" : "Unable to load report data"}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {isKo
                ? "현재 워크스페이스 저장소 응답이 불안정합니다. 잠시 후 다시 시도해주세요."
                : "Workspace storage is currently unavailable. Please try again shortly."}
            </CardContent>
          </Card>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isKo ? "저장된 사이트" : "Saved sites"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">{overview.projects.length}</div>
              <p className="mt-2 text-sm text-muted-foreground">
                {isKo ? "프로젝트에 등록된 관리 대상 사이트 수" : "Sites currently tracked inside the workspace"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isKo ? "리포트 준비 완료" : "Report-ready"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">{projectsWithAnalysis.length}</div>
              <p className="mt-2 text-sm text-muted-foreground">
                {isKo ? "최신 저장 분석이 있는 사이트 수" : "Sites with a latest saved analysis snapshot"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isKo ? "누적 분석 이력" : "Saved analysis runs"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">{totalRuns}</div>
              <p className="mt-2 text-sm text-muted-foreground">
                {isKo ? "프로젝트 기준으로 저장된 전체 실행 수" : "Total persisted runs captured for your projects"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isKo ? "평균 전체 점수" : "Average overall score"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">
                {averageOverallScore !== null ? averageOverallScore : "—"}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {isKo
                  ? "최근 저장 결과가 있는 사이트 기준 평균"
                  : "Average across sites with a saved latest result"}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>{isKo ? "최근 저장된 리포트" : "Latest saved reports"}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isKo
                    ? "분석이 저장된 사이트는 여기서 바로 상태를 확인할 수 있습니다."
                    : "Sites with persisted analysis appear here with current report readiness."}
                </p>
              </div>
              <Link href="/projects" className={buttonVariants({ variant: "outline", size: "sm" })}>
                {isKo ? "프로젝트 관리" : "Manage projects"}
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {topProjects.length > 0 ? (
                topProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/70 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate font-medium">{project.name}</div>
                        <Badge variant="outline">{statusLabel(project.lastStatus, isKo)}</Badge>
                      </div>
                      <div className="truncate text-sm text-muted-foreground">{project.url}</div>
                      <div className="text-xs text-muted-foreground">
                        {isKo ? "최근 저장" : "Last saved"}: {formatDate(project.lastAnalyzedAt, locale)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/5 px-3 py-2 text-right">
                        <div className="text-xs text-muted-foreground">{isKo ? "전체 점수" : "Overall"}</div>
                        <div className="text-xl font-semibold">{project.latestScores?.overall ?? "—"}</div>
                      </div>
                      <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                        {isKo ? "대시보드" : "Dashboard"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  {isKo
                    ? "아직 저장된 분석 리포트가 없습니다. 먼저 사이트를 프로젝트에 추가하고 분석을 실행해보세요."
                    : "There are no saved reports yet. Add a site to projects first, then run an analysis to start building reports."}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isKo ? "리포트 커버리지" : "Report coverage"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-border/70 p-4">
                <FileText className="mt-0.5 h-4 w-4 text-primary" />
                <div className="space-y-1">
                  <div className="font-medium">{isKo ? "현재 스냅샷" : "Current snapshots"}</div>
                  <p className="text-sm text-muted-foreground">
                    {isKo
                      ? `${projectsWithAnalysis.length}개 사이트가 최신 저장 결과를 보유 중입니다.`
                      : `${projectsWithAnalysis.length} sites currently have a latest saved result.`}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border/70 p-4">
                <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                <div className="space-y-1">
                  <div className="font-medium">{isKo ? "AI 요약 준비" : "AI summary readiness"}</div>
                  <p className="text-sm text-muted-foreground">
                    {isKo
                      ? "저장된 분석 결과에는 한국어/영문 요약이 함께 보존됩니다."
                      : "Persisted analyses keep both Korean and English AI summaries together."}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border/70 p-4">
                <LineChart className="mt-0.5 h-4 w-4 text-primary" />
                <div className="space-y-1">
                  <div className="font-medium">{isKo ? "추이 누적" : "Trend accumulation"}</div>
                  <p className="text-sm text-muted-foreground">
                    {isKo
                      ? `${projectsWithHistory}개 사이트가 2회 이상 저장되어 점수 추이를 만들 수 있습니다.`
                      : `${projectsWithHistory} sites already have 2+ saved runs and can build score trends.`}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-dashed p-4">
                <Clock3 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="space-y-1">
                  <div className="font-medium">{isKo ? "다음 단계" : "Next up"}</div>
                  <p className="text-sm text-muted-foreground">
                    {isKo
                      ? "공유 가능한 PDF/스냅샷 리포트와 예약 분석은 이 리포트 센터에 이어서 붙일 예정입니다."
                      : "Shareable exports and scheduled audits can extend from this report center next."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>{isKo ? "워크스페이스 상태 요약" : "Workspace status summary"}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {isKo
                  ? "리포트 생성에 필요한 핵심 흐름이 얼마나 쌓였는지 보여줍니다."
                  : "A quick look at how much report-ready signal has accumulated in your workspace."}
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FolderKanban className="h-4 w-4 text-primary" />
                {isKo ? "프로젝트 기반 저장" : "Project-backed storage"}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {isKo
                  ? "단순 검색은 저장되지 않고, 프로젝트에 추가된 사이트만 리포트 이력을 쌓습니다."
                  : "One-off searches are not persisted; only project-managed sites build report history."}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {isKo ? "경쟁사 비교 재료" : "Competitor comparison coverage"}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {isKo
                  ? `현재 경쟁사 ${competitorCount}개가 저장되어 비교 내러티브를 보강할 수 있습니다.`
                  : `${competitorCount} competitors are currently saved and can enrich comparison narratives.`}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-primary" />
                {isKo ? "AI 요약 모델" : "AI summary model"}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {isKo
                  ? "현재 리포트는 저장 시점의 요약 모델 결과를 함께 보존합니다."
                  : "Each saved result preserves the AI summary model output from the analysis run."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
