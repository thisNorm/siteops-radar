"use client";

import { Button } from "@/components/ui/button";
import { CategoryRadar } from "@/components/charts/category-radar";
import { CompetitorBars } from "@/components/charts/competitor-bars";
import { ScoreTrendChart } from "@/components/charts/score-trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { panelClassName } from "./dashboard-view-helpers";
import type {
  DashboardAnalysisMode,
  DashboardCompetitorBenchmark,
  DashboardCompetitorDatum,
  DashboardLocalizedSummary,
  DashboardRadarDatum,
  DashboardTrendDatum,
} from "./dashboard-view-types";

export function DashboardInsightsSection({
  isKo,
  radarData,
  competitorData,
  competitorBenchmark,
  hasLinkedCompetitors,
  selectedProjectName,
  localizedSummary,
  trendData,
  trendWindow,
  hasHistory,
  analysisMode,
  onTrendWindowChange,
  projectActionPath,
}: {
  isKo: boolean;
  radarData: DashboardRadarDatum[];
  competitorData: DashboardCompetitorDatum[];
  competitorBenchmark?: DashboardCompetitorBenchmark | null;
  hasLinkedCompetitors: boolean | null;
  selectedProjectName?: string | null;
  localizedSummary: DashboardLocalizedSummary;
  trendData: DashboardTrendDatum[];
  trendWindow: "6" | "12";
  hasHistory: boolean;
  analysisMode: DashboardAnalysisMode;
  onTrendWindowChange: (window: "6" | "12") => void;
  projectActionPath: string;
}) {
  const hasCompetitorBenchmark = Boolean(competitorBenchmark?.analyzedCompetitorCount);
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
    isKo ? "프로젝트 관리로 이동" : "Go to project management";

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
            showBenchmark={hasCompetitorBenchmark}
          />
        </CardContent>
      </Card>

      {hasLinkedCompetitors === false ? (
        <Card className={panelClassName()}>
          <CardHeader>
            <CardTitle className="text-base">
              {isKo ? "경쟁 사이트가 아직 연결되지 않았습니다" : "No competitors linked yet"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-center">
            <div className="space-y-2">
              <p className="text-base font-semibold">
                {isKo
                  ? `${selectedProjectName ?? "이 사이트"}에 경쟁 사이트를 먼저 연결해주세요`
                  : `Link competitors to ${selectedProjectName ?? "this site"} first`}
              </p>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                {isKo
                  ? "프로젝트 관리에서 현재 사이트에 경쟁 사이트를 추가하면 그때부터 경쟁사 평균과 격차 차트가 표시됩니다."
                  : "Add competitors for the current site in project management and the competitor averages and gap chart will appear here."}
              </p>
            </div>
            <a href={projectActionPath}>
              <Button variant="outline" className="rounded-lg">
                {isKo ? "프로젝트 관리로 이동" : "Go to project management"}
              </Button>
            </a>
          </CardContent>
        </Card>
      ) : !hasCompetitorBenchmark ? (
        <Card className={panelClassName()}>
          <CardHeader>
            <CardTitle className="text-base">
              {hasLinkedCompetitors
                ? isKo
                  ? "연결된 경쟁사 분석이 아직 없습니다"
                  : "Linked competitors are waiting for analysis"
                : isKo
                  ? "경쟁사 벤치마크는 저장된 사이트에서 시작됩니다"
                  : "Competitor benchmarks start from saved sites"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-center">
            <div className="space-y-2">
              <p className="text-base font-semibold">
                {hasLinkedCompetitors
                  ? isKo
                    ? `${selectedProjectName ?? "이 사이트"}를 다시 분석하면 연결된 경쟁사도 함께 측정됩니다`
                    : `Run ${selectedProjectName ?? "this site"} again to analyze its linked competitors too`
                  : isKo
                    ? "저장된 사이트에 경쟁사를 연결해야 실제 평균과 상위 비교가 표시됩니다"
                    : "Link competitors to a saved site to show live average and leader comparisons"}
              </p>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                {hasLinkedCompetitors
                  ? isKo
                    ? "프로젝트 관리에서 내 사이트 분석을 실행하면 현재 연결된 경쟁사들의 최신 분석 결과를 바탕으로 평균과 상위 기준을 계산합니다."
                    : "When you run the site analysis from project management, the dashboard will calculate competitor averages and leaders from the latest linked competitor analyses."
                  : isKo
                    ? "단순 검색이나 예시 화면에서는 경쟁사 추정치를 만들지 않습니다. 저장된 사이트와 연결된 경쟁사들의 실제 분석 결과만 사용합니다."
                    : "Ad hoc checks and sample previews do not fabricate competitor estimates. The dashboard only uses live analyses from linked competitors on saved sites."}
              </p>
            </div>
            <a href={projectActionPath}>
              <Button variant="outline" className="rounded-lg">
                {isKo ? "프로젝트 관리로 이동" : "Go to project management"}
              </Button>
            </a>
          </CardContent>
        </Card>
      ) : (
        <Card className={panelClassName()}>
          <CardHeader>
            <CardTitle className="text-base">
              {isKo ? "경쟁사 벤치마크" : "Competitor benchmark"} ·{" "}
              {competitorBenchmark?.analyzedCompetitorCount ?? 0}
            </CardTitle>
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
      )}

      {hasHistory ? (
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
            <a href={projectActionPath}>
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
