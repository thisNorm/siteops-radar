import { notFound } from "next/navigation";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { WorkspaceInfoCard, WorkspaceStatCard } from "@/components/workspace/workspace-cards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { appRouteSegments, getDashboardProjectPath } from "@/lib/app-routes";
import { getCategoryLabel } from "@/components/dashboard/dashboard-view-helpers";
import { getPublicProjectDashboardContext } from "@/lib/persistence/project-store";
import { hasDatabaseUrl } from "@/lib/persistence/database";
import type { AnalysisCategory, SummaryLocale } from "@/types/analysis";

type SnapshotPageProps = {
  params: Promise<{ locale: Locale; projectId: string }>;
};

const categoryOrder: AnalysisCategory[] = [
  "performance",
  "seo",
  "aeogeo",
  "security",
  "accessibility",
  "contentQuality",
  "technicalHealth",
];

function formatDate(date: string | null, locale: Locale) {
  if (!date) {
    return locale === "ko" ? "아직 없음" : "Not yet";
  }

  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default async function ReportSnapshotPage({ params }: SnapshotPageProps) {
  const { locale, projectId } = await params;
  const isKo = locale === "ko";
  const summaryLocale: SummaryLocale = isKo ? "ko" : "en";

  if (!hasDatabaseUrl()) {
    return (
      <AppShell>
        <Card>
          <CardHeader>
            <CardTitle>{isKo ? "저장소가 연결되지 않았습니다" : "Workspace storage is not connected"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {isKo
              ? "공유 스냅샷은 저장된 분석 이력이 필요합니다."
              : "Shareable snapshots require saved analysis history."}
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const report = await getPublicProjectDashboardContext(projectId);

  if (!report?.latestResult) {
    notFound();
  }

  const result = report.latestResult;
  const summary = result.summary[summaryLocale];
  const exportPath = `/api/reports/${projectId}/export`;

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href={appRouteSegments.reports} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <ArrowLeft className="h-4 w-4" />
              {isKo ? "리포트로 돌아가기" : "Back to reports"}
            </Link>
            <div className="flex flex-wrap gap-2">
              <a href={exportPath} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Download className="h-4 w-4" />
                {isKo ? "JSON 내보내기" : "Export JSON"}
              </a>
              <Link href={getDashboardProjectPath(locale, projectId)} className={buttonVariants({ size: "sm" })}>
                <ExternalLink className="h-4 w-4" />
                {isKo ? "대시보드 열기" : "Open dashboard"}
              </Link>
            </div>
          </div>
          <div className="max-w-4xl space-y-3">
            <Badge variant="outline">{isKo ? "공유 스냅샷" : "Shareable snapshot"}</Badge>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{report.project.name}</h1>
            <p className="text-base leading-7 text-muted-foreground md:text-lg">{report.project.url}</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <WorkspaceStatCard
            title={isKo ? "전체 점수" : "Overall score"}
            value={result.scores.overall}
            description={isKo ? "최근 저장된 분석 기준" : "Latest saved analysis"}
          />
          <WorkspaceStatCard
            title={isKo ? "분석 시각" : "Analyzed"}
            value={formatDate(report.latestAnalyzedAt, locale)}
            description={isKo ? "공유 스냅샷 기준 시점" : "Snapshot reference time"}
          />
          <WorkspaceStatCard
            title={isKo ? "개선 항목" : "Improvements"}
            value={result.recommendations.length}
            description={isKo ? "우선순위 추천 전체 수" : "Total prioritized recommendations"}
          />
          <WorkspaceStatCard
            title={isKo ? "경쟁사" : "Competitors"}
            value={report.competitorBenchmark?.analyzedCompetitorCount ?? 0}
            description={isKo ? "분석 결과가 있는 경쟁사 수" : "Competitors with saved analysis"}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>{isKo ? "AI 요약" : "AI summary"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-7 text-muted-foreground">{summary.overview}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <WorkspaceInfoCard
                  icon={ExternalLink}
                  title={isKo ? "핵심 위험" : "Key risks"}
                  description={summary.keyRisks.join(" ")}
                />
                <WorkspaceInfoCard
                  icon={Download}
                  title={isKo ? "다음 액션" : "Next actions"}
                  description={summary.nextActions.join(" ")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isKo ? "영역별 점수" : "Category scores"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryOrder.map((category) => (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span>{getCategoryLabel(category, summaryLocale)}</span>
                    <span className="font-medium">{result.scores[category]}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${result.scores[category]}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{isKo ? "우선순위 개선 항목" : "Priority improvements"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {result.recommendations.slice(0, 6).map((recommendation, index) => (
              <div key={recommendation.id} className="rounded-xl border bg-card/60 p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <Badge variant="outline">{getCategoryLabel(recommendation.category, summaryLocale)}</Badge>
                </div>
                <div className="mt-3 font-medium">{recommendation.title}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {recommendation.expectedImprovement}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
