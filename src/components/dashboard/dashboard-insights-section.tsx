"use client";

import { CategoryRadar } from "@/components/charts/category-radar";
import { CompetitorBars } from "@/components/charts/competitor-bars";
import { ScoreTrendChart } from "@/components/charts/score-trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LockedPreview } from "@/components/dashboard/locked-preview";
import { cn } from "@/lib/utils";
import { panelClassName } from "./dashboard-view-helpers";
import type {
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
  onTrendWindowChange,
  unlockCurrentDashboardPath,
}: {
  isAuthenticated: boolean;
  isKo: boolean;
  radarData: DashboardRadarDatum[];
  competitorData: DashboardCompetitorDatum[];
  localizedSummary: DashboardLocalizedSummary;
  trendData: DashboardTrendDatum[];
  trendWindow: "6" | "12";
  onTrendWindowChange: (window: "6" | "12") => void;
  unlockCurrentDashboardPath: string;
}) {
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
    </section>
  );
}
