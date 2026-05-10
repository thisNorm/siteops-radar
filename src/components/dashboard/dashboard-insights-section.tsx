"use client";

import { Button } from "@/components/ui/button";
import { CategoryRadar } from "@/components/charts/category-radar";
import { CompetitorBars } from "@/components/charts/competitor-bars";
import { ScoreTrendChart } from "@/components/charts/score-trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LockedPreview } from "@/components/dashboard/locked-preview";
import { cn } from "@/lib/utils";
import { panelClassName } from "./dashboard-view-helpers";
import type {
  DashboardAnalysisMode,
  DashboardCompetitorDatum,
  DashboardLocalizedSummary,
  DashboardRadarDatum,
  DashboardTrendDatum,
} from "./dashboard-view-types";

export function DashboardInsightsSection({
  isAuthenticated,
  isKo,
  radarData,
  competitorData,
  localizedSummary,
  trendData,
  trendWindow,
  hasHistory,
  analysisMode,
  onTrendWindowChange,
  unlockCurrentDashboardPath,
  projectActionPath,
}: {
  isAuthenticated: boolean;
  isKo: boolean;
  radarData: DashboardRadarDatum[];
  competitorData: DashboardCompetitorDatum[];
  localizedSummary: DashboardLocalizedSummary;
  trendData: DashboardTrendDatum[];
  trendWindow: "6" | "12";
  hasHistory: boolean;
  analysisMode: DashboardAnalysisMode;
  onTrendWindowChange: (window: "6" | "12") => void;
  unlockCurrentDashboardPath: string;
  projectActionPath: string;
}) {
  const trendPlaceholderTitle =
    analysisMode === "sample"
      ? isKo
        ? "예시 데이터에서는 추이를 보여주지 않습니다"
        : "Sample preview does not show trends"
      : analysisMode === "adhoc"
        ? isKo
          ? "단순 검색은 현재 점수만 보여줍니다"
          : "Ad hoc searches show only the current score"
        : isKo
          ? "첫 프로젝트 분석입니다"
          : "This is the first managed run";
  const trendPlaceholderDescription =
    analysisMode === "sample"
      ? isKo
        ? "사이트를 검색하면 실제 현재 점수로 바뀌고, 프로젝트에 추가한 뒤부터 누적 추이를 관리할 수 있습니다."
        : "Search a site to replace the sample preview, then add it to a project to start tracking accumulated trends."
      : analysisMode === "adhoc"
        ? isKo
          ? "지금은 단일 검색 결과만 표시합니다. 프로젝트에 추가하고 다시 분석하면 그때부터 점수 변화가 쌓입니다."
          : "This is a one-off search result. Add the site to a project and run it again to start collecting score changes."
        : isKo
          ? "이번 결과가 기준점입니다. 다음 저장된 분석부터 점수 변화와 추이가 표시됩니다."
          : "This run becomes the baseline. Score changes and trends appear starting with the next saved analysis.";
  const trendActionLabel =
    isAuthenticated
      ? isKo
        ? "프로젝트 관리로 이동"
        : "Go to project management"
      : isKo
        ? "로그인하고 프로젝트 추가"
        : "Sign in to add a project";

  return (
    <section className="grid gap-5 xl:grid-cols-[1.15fr_1.6fr_1.2fr]">
      <Card className={panelClassName()}>
        <CardHeader>
          <CardTitle className="text-base">{isKo ? "영역별 점수" : "Category scores"}</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryRadar
            data={radarData}
            oursLabel={isKo ? "내 사이트" : "Our site"}
            benchmarkLabel={isKo ? "경쟁사 평균" : "Competitor avg"}
          />
        </CardContent>
      </Card>

      <LockedPreview
        locked={!isAuthenticated}
        signInPath={unlockCurrentDashboardPath}
        title={isKo ? "로그인해서 경쟁사 격차 보기" : "Sign in to unlock competitor gaps"}
        description={
          isKo
            ? "경쟁사 비교, 상세 격차 내러티브, 확장 트렌드 리포트는 로그인 후 사용할 수 있습니다."
            : "Competitor comparisons, narrative gap analysis, and extended trend reporting unlock after sign-in."
        }
      >
        <Card className={panelClassName()}>
          <CardHeader>
            <CardTitle className="text-base">{isKo ? "경쟁사 격차" : "Competitor gap"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CompetitorBars
              data={competitorData}
              oursLabel={isKo ? "내 사이트" : "Our site"}
              competitorAverageLabel={isKo ? "경쟁사 평균" : "Competitor avg"}
              competitorLeaderLabel={isKo ? "경쟁사 상위" : "Category leader"}
            />
            <p className="text-sm leading-7 text-muted-foreground">
              {localizedSummary.competitorGapNarrative}
            </p>
          </CardContent>
        </Card>
      </LockedPreview>

      {hasHistory ? (
        <LockedPreview
          locked={!isAuthenticated}
          signInPath={unlockCurrentDashboardPath}
          title={isKo ? "로그인해서 추이 보기" : "Sign in to unlock score trends"}
          description={
            isKo
              ? "히스토리 기반 점수 변화와 누적 추세를 로그인 후 계속 볼 수 있습니다."
              : "History-based score movement and accumulated trends unlock after sign-in."
          }
        >
          <Card className={panelClassName()}>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">{isKo ? "점수 변화 추이" : "Score trend"}</CardTitle>
              <div className="flex items-center rounded-lg bg-muted/80 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => onTrendWindowChange("6")}
                  className={cn(
                    "rounded-md px-3 py-1.5 transition-colors",
                    trendWindow === "6" ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground",
                  )}
                >
                  {isKo ? "최근 6회" : "Last 6"}
                </button>
                <button
                  type="button"
                  onClick={() => onTrendWindowChange("12")}
                  className={cn(
                    "rounded-md px-3 py-1.5 transition-colors",
                    trendWindow === "12"
                      ? "bg-background font-medium text-foreground shadow-sm"
                      : "text-muted-foreground",
                  )}
                >
                  {isKo ? "최근 12주" : "Last 12w"}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <ScoreTrendChart data={trendData} />
            </CardContent>
          </Card>
        </LockedPreview>
      ) : (
        <Card className={panelClassName()}>
          <CardHeader>
            <CardTitle className="text-base">{isKo ? "점수 변화 추이" : "Score trend"}</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-center">
            <div className="space-y-2">
              <p className="text-base font-semibold">{trendPlaceholderTitle}</p>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                {trendPlaceholderDescription}
              </p>
            </div>
            <a href={isAuthenticated ? projectActionPath : unlockCurrentDashboardPath}>
              <Button variant="outline" className="rounded-lg">
                {trendActionLabel}
              </Button>
            </a>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
