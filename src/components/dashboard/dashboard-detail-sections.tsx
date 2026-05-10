"use client";

import { ArrowRight } from "lucide-react";
import { IssueSeverityDonut } from "@/components/charts/issue-severity-donut";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getEffortLabel,
  getGapLabel,
  getImpactLabel,
  getVitalTone,
  metricPosition,
  panelClassName,
} from "@/components/dashboard/dashboard-view-helpers";
import type { Recommendation, SummaryLocale } from "@/types/analysis";
import type { DashboardSeverityDatum, DashboardVitalRow } from "./dashboard-view-types";

export function DashboardDetailSections({
  recommendations,
  publicRecommendations,
  isAuthenticated,
  isKo,
  summaryLocale,
  severityData,
  severityTotal,
  vitalRows,
  vitalsView,
  onVitalsViewChange,
  unlockRecommendationsPath,
}: {
  recommendations: Recommendation[];
  publicRecommendations: Recommendation[];
  isAuthenticated: boolean;
  isKo: boolean;
  summaryLocale: SummaryLocale;
  severityData: DashboardSeverityDatum[];
  severityTotal: number;
  vitalRows: DashboardVitalRow[];
  vitalsView: "mobile" | "desktop";
  onVitalsViewChange: (view: "mobile" | "desktop") => void;
  unlockRecommendationsPath: string;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr_1.15fr]">
      <Card className={panelClassName()}>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">
            {isKo ? "개선 우선순위 TOP 5" : "Top 5 priority improvements"}
          </CardTitle>
          <Badge variant="outline">{recommendations.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="px-2 py-3 font-medium">{isKo ? "순위" : "Rank"}</th>
                  <th className="px-2 py-3 font-medium">{isKo ? "개선 항목" : "Recommendation"}</th>
                  <th className="px-2 py-3 font-medium">{isKo ? "영향도" : "Impact"}</th>
                  <th className="px-2 py-3 font-medium">{isKo ? "수정 난이도" : "Effort"}</th>
                  <th className="px-2 py-3 font-medium">{isKo ? "경쟁사 격차" : "Gap"}</th>
                  <th className="px-2 py-3 font-medium">{isKo ? "우선순위 점수" : "Priority"}</th>
                </tr>
              </thead>
              <tbody>
                {publicRecommendations.map((item, index) => {
                  const impact = getImpactLabel(item.impact, summaryLocale);
                  const effort = getEffortLabel(item.effort, summaryLocale);
                  const gap = getGapLabel(item.competitorGap, summaryLocale);

                  return (
                    <tr key={item.id} className="border-b last:border-b-0">
                      <td className="px-2 py-3 font-medium">{index + 1}</td>
                      <td className="px-2 py-3">
                        <div className="font-medium">{item.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{item.expectedImprovement}</div>
                      </td>
                      <td className="px-2 py-3">
                        <Badge className={impact.className}>{impact.label}</Badge>
                      </td>
                      <td className="px-2 py-3">
                        <Badge className={effort.className}>{effort.label}</Badge>
                      </td>
                      <td className="px-2 py-3">
                        <Badge className={gap.className}>{gap.label}</Badge>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex min-w-32 items-center gap-3">
                          <span className="w-8 text-sm font-medium">{item.priorityScore.toFixed(1)}</span>
                          <div className="h-2 flex-1 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-linear-to-r from-amber-400 to-rose-500"
                              style={{ width: `${(item.priorityScore / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-medium text-primary"
            onClick={() => {
              if (!isAuthenticated) {
                window.location.assign(unlockRecommendationsPath);
              }
            }}
          >
            {isAuthenticated
              ? isKo
                ? "전체 개선 항목 보기"
                : "View all improvements"
              : isKo
                ? "로그인해서 전체 개선 항목 보기"
                : "Sign in to unlock all improvements"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </CardContent>
      </Card>

      <Card className={panelClassName()}>
        <CardHeader>
          <CardTitle className="text-base">
            {isKo ? "보안 취약점 심각도" : "Security severity mix"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 lg:grid-cols-[1fr_140px] lg:items-center">
          <IssueSeverityDonut
            data={severityData}
            total={severityTotal}
            centerLabel={isKo ? "총 발견" : "total issues"}
          />
          <div className="space-y-3">
            {severityData.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.label}</span>
                </div>
                <span className="text-muted-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className={panelClassName()}>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">{isKo ? "Core Web Vitals" : "Core Web Vitals"}</CardTitle>
          <div className="flex items-center rounded-lg bg-muted/80 p-1 text-xs">
            <button
              type="button"
              onClick={() => onVitalsViewChange("mobile")}
              className={
                vitalsView === "mobile"
                  ? "rounded-md bg-background px-3 py-1.5 font-medium text-primary shadow-sm"
                  : "rounded-md px-3 py-1.5 text-muted-foreground transition-colors"
              }
            >
              {isKo ? "모바일" : "Mobile"}
            </button>
            <button
              type="button"
              onClick={() => onVitalsViewChange("desktop")}
              className={
                vitalsView === "desktop"
                  ? "rounded-md bg-background px-3 py-1.5 font-medium text-primary shadow-sm"
                  : "rounded-md px-3 py-1.5 text-muted-foreground transition-colors"
              }
            >
              {isKo ? "데스크톱" : "Desktop"}
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {vitalRows.map((item) => {
            const tone = getVitalTone(item.key, item.value, summaryLocale);

            return (
              <div key={item.key} className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">{item.label}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-primary">{item.display}</div>
                    <Badge className={tone.className}>{tone.label}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative h-2 rounded-full bg-linear-to-r from-emerald-400 via-amber-400 to-rose-500">
                    {item.value !== undefined ? (
                      <span
                        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-900 shadow-sm"
                        style={{ left: metricPosition(item.value, item.max) }}
                      />
                    ) : null}
                  </div>
                  <div className="flex justify-end gap-12 text-xs text-muted-foreground">
                    {item.ticks.map((tick) => (
                      <span key={tick}>{tick}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
