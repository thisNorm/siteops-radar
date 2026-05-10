"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthGauge } from "@/components/charts/health-gauge";
import { MiniSparkline } from "@/components/charts/mini-sparkline";
import { cn } from "@/lib/utils";
import {
  buildSparklineValues,
  getScoreTone,
  panelClassName,
} from "@/components/dashboard/dashboard-view-helpers";
import type { AnalyzerResult, SummaryLocale } from "@/types/analysis";
import type { DashboardMetricCard } from "./dashboard-view-types";

export function DashboardScoreSection({
  result,
  summaryLocale,
  healthDelta,
  metricCards,
  isKo,
}: {
  result: AnalyzerResult;
  summaryLocale: SummaryLocale;
  healthDelta: number;
  metricCards: DashboardMetricCard[];
  isKo: boolean;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-9">
      <Card className={panelClassName("xl:col-span-2")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isKo ? "전체 건강 점수" : "Overall health score"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <HealthGauge score={result.scores.overall} />
          <div className="flex items-center justify-center">
            <Badge className={getScoreTone(result.scores.overall, summaryLocale).className}>
              {getScoreTone(result.scores.overall, summaryLocale).label}
            </Badge>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            <span className={healthDelta >= 0 ? "font-medium text-emerald-600" : "font-medium text-rose-600"}>
              {healthDelta >= 0 ? "▲ " : ""}
              {healthDelta}
            </span>{" "}
            {isKo ? "점 상승" : "score change"}
          </p>
        </CardContent>
      </Card>

      {metricCards.map((metric, index) => {
        const tone = getScoreTone(metric.score, summaryLocale);
        const Icon = metric.icon;

        return (
          <Card key={metric.key} size="sm" className={panelClassName("min-h-[198px]")}>
            <CardContent className="flex h-full flex-col justify-between gap-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{metric.label}</div>
                <div className="mt-4 text-2xl font-semibold tracking-tight">
                  {metric.score}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">/ 100</span>
                </div>
                <Badge className={cn("mt-2 rounded-md px-2", tone.className)}>{tone.label}</Badge>
              </div>
              <MiniSparkline
                values={buildSparklineValues(metric.score, index + 2)}
                stroke={
                  metric.score >= 75
                    ? "var(--chart-2)"
                    : metric.score >= 60
                      ? "var(--chart-4)"
                      : "var(--destructive)"
                }
              />
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
